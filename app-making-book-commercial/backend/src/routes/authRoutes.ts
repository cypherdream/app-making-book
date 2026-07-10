import { Router } from 'express';
import type { Request } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { signToken, verifyToken, hasSecret } from '../config/secrets';
import rateLimit from 'express-rate-limit';
import { authenticator } from 'otplib';
import { prisma } from '../prisma';
import { asyncHandler } from '../middleware/errorHandler';
import { isLocked, recordFailedLogin, clearFailedLogins } from '../middleware/accountLockout';
import { requireAuth, type AuthedRequest } from '../middleware/auth';
import { registerSchema, loginSchema, refreshSchema } from '../validation/authSchemas';
import { logRateLimitHit } from '../middleware/rateLimitLogger';
import { sendEmail } from '../services/email';

const router = Router();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: logRateLimitHit,
});


const ACCESS_TTL = '15m';
const REFRESH_TTL = '30d';
const PRE_2FA_TTL = '5m'; // short window to enter the TOTP code after password succeeds

function deviceLabelFrom(userAgent: string | undefined): string {
    if (!userAgent) return 'Unknown device';
    if (/android/i.test(userAgent)) return 'Android device';
    if (/iphone|ipad/i.test(userAgent)) return 'iOS device';
    if (/chrome/i.test(userAgent)) return 'Chrome browser';
    if (/firefox/i.test(userAgent)) return 'Firefox browser';
    if (/safari/i.test(userAgent)) return 'Safari browser';
    return 'Unknown device';
}

async function issueTokensWithSession(userId: number, tokenVersion: number, req: Request) {
    const session = await prisma.session.create({
        data: {
            userId,
            deviceLabel: deviceLabelFrom(req.headers['user-agent']),
            ipAddress: req.ip,
        },
    });
    const accessToken = signToken({ userId, tokenVersion, type: 'access' }, { expiresIn: ACCESS_TTL });
    const refreshToken = signToken({ userId, tokenVersion, sessionId: session.id, type: 'refresh' }, { expiresIn: REFRESH_TTL });
    return { accessToken, refreshToken };
}

router.post(
    '/register',
    authLimiter,
    asyncHandler(async (req, res) => {
        const parsed = registerSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: parsed.error.issues[0].message });
            return;
        }
        const { name, email, password } = parsed.data;

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            res.status(409).json({ error: 'An account with this email already exists' });
            return;
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const emailVerifyToken = crypto.randomBytes(32).toString('hex');
        const user = await prisma.user.create({
            data: {
                name, email, passwordHash,
                emailVerifyToken,
                emailVerifyExpiry: new Date(Date.now() + 24 * 3600 * 1000),
            },
            select: { id: true, name: true, email: true, createdAt: true },
        });

        const verifyUrl = `${process.env.CLIENT_ORIGIN}/verify-email?token=${emailVerifyToken}`;
        await sendEmail(
            email,
            'Welcome — verify your email',
            `<p>Hi ${name},</p><p>Confirm your email: <a href="${verifyUrl}">${verifyUrl}</a></p><p>This link expires in 24 hours.</p>`
        );

        res.status(201).json(user);
    })
);

router.post(
    '/login',
    authLimiter,
    asyncHandler(async (req, res) => {
        if (!hasSecret()) {
            res.status(500).json({ error: 'Server misconfigured: JWT_SECRET is not set' });
            return;
        }

        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: parsed.error.issues[0].message });
            return;
        }
        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({ where: { email } });

        if (user && (await isLocked(user.id))) {
            res.status(423).json({ error: 'Account temporarily locked due to repeated failed logins. Try again later.' });
            return;
        }

        const validHash = user?.passwordHash ?? '$2a$12$invalidsaltinvalidsaltinvalidsalOK';
        const passwordMatches = await bcrypt.compare(password, validHash);

        if (!user || !passwordMatches) {
            if (user) await recordFailedLogin(user.id);
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }

        await clearFailedLogins(user.id);

        // Password is correct. If 2FA is on, don't issue real tokens yet —
        // issue a short-lived pre-auth token that only 2fa/verify-login
        // can redeem, so a stolen password alone still can't log in.
        if (user.totpEnabled) {
            const preAuthToken = signToken({ userId: user.id, type: 'pre-2fa' }, { expiresIn: PRE_2FA_TTL });
            res.json({ twoFactorRequired: true, preAuthToken });
            return;
        }

        const { accessToken, refreshToken } = await issueTokensWithSession(user.id, user.tokenVersion, req);
        res.json({
            accessToken,
            refreshToken,
            expiresIn: ACCESS_TTL,
            user: { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin, isPremium: user.isPremium },
        });
    })
);

router.post(
    '/2fa/verify-login',
    authLimiter,
    asyncHandler(async (req, res) => {
        const { preAuthToken, code } = req.body ?? {};
        if (typeof preAuthToken !== 'string' || typeof code !== 'string') {
            res.status(400).json({ error: 'preAuthToken and code are required' });
            return;
        }

        let userId: number;
        try {
            const payload = verifyToken(preAuthToken) as { userId: number; type: string };
            if (payload.type !== 'pre-2fa') throw new Error('wrong token type');
            userId = payload.userId;
        } catch {
            res.status(401).json({ error: 'Invalid or expired pre-auth token — log in again' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user?.totpEnabled || !user.totpSecret) {
            res.status(400).json({ error: '2FA is not enabled on this account' });
            return;
        }

        if (!authenticator.verify({ token: code, secret: user.totpSecret })) {
            res.status(401).json({ error: 'Invalid 2FA code' });
            return;
        }

        const { accessToken, refreshToken } = await issueTokensWithSession(user.id, user.tokenVersion, req);
        res.json({
            accessToken,
            refreshToken,
            expiresIn: ACCESS_TTL,
            user: { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin, isPremium: user.isPremium },
        });
    })
);

router.post(
    '/refresh',
    asyncHandler(async (req, res) => {
        const parsed = refreshSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: parsed.error.issues[0].message });
            return;
        }

        try {
            const payload = verifyToken(parsed.data.refreshToken) as {
                userId: number; tokenVersion: number; sessionId: number; type: string;
            };
            if (payload.type !== 'refresh') {
                res.status(401).json({ error: 'Wrong token type' });
                return;
            }

            const [user, session] = await Promise.all([
                prisma.user.findUnique({ where: { id: payload.userId } }),
                prisma.session.findUnique({ where: { id: payload.sessionId } }),
            ]);

            if (!user || user.tokenVersion !== payload.tokenVersion) {
                res.status(401).json({ error: 'Refresh token has been revoked' });
                return;
            }
            if (!session || session.revokedAt) {
                res.status(401).json({ error: 'This session has been signed out' });
                return;
            }

            await prisma.session.update({ where: { id: session.id }, data: { lastUsedAt: new Date() } });

            const accessToken = signToken({ userId: user.id, tokenVersion: user.tokenVersion, type: 'access' }, { expiresIn: ACCESS_TTL });
            res.json({ accessToken, expiresIn: ACCESS_TTL });
        } catch {
            res.status(401).json({ error: 'Invalid or expired refresh token' });
        }
    })
);

router.post(
    '/logout-all',
    asyncHandler(async (req, res) => {
        const header = req.headers.authorization;
        if (!header?.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Missing Authorization header' });
            return;
        }
        try {
            const payload = verifyToken(header.slice(7)) as { userId: number };
            await prisma.$transaction([
                prisma.user.update({ where: { id: payload.userId }, data: { tokenVersion: { increment: 1 } } }),
                prisma.session.updateMany({ where: { userId: payload.userId, revokedAt: null }, data: { revokedAt: new Date() } }),
            ]);
            res.json({ ok: true });
        } catch {
            res.status(401).json({ error: 'Invalid token' });
        }
    })
);

// ---- Session / device management -------------------------------------
router.use('/sessions', requireAuth);

router.get(
    '/sessions',
    asyncHandler(async (req: AuthedRequest, res) => {
        const sessions = await prisma.session.findMany({
            where: { userId: req.userId!, revokedAt: null },
            orderBy: { lastUsedAt: 'desc' },
            select: { id: true, deviceLabel: true, ipAddress: true, createdAt: true, lastUsedAt: true },
        });
        res.json(sessions);
    })
);

router.delete(
    '/sessions/:id',
    asyncHandler(async (req: AuthedRequest, res) => {
        const session = await prisma.session.findUnique({ where: { id: Number(req.params.id) } });
        if (!session || session.userId !== req.userId) {
            res.status(404).json({ error: 'Session not found' });
            return;
        }
        await prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
        res.json({ ok: true });
    })
);

// ---- 2FA setup ---------------------------------------------------------
router.use('/2fa', requireAuth);

// Generates a secret and returns it as an otpauth:// URL for the client
// to render as a QR code — but does NOT enable 2FA yet. Enabling
// happens only after /2fa/enable confirms the user actually scanned it
// and can produce a valid code, so a setup that's abandoned halfway
// can't accidentally lock someone out.
router.post(
    '/2fa/setup',
    asyncHandler(async (req: AuthedRequest, res) => {
        const secret = authenticator.generateSecret();
        const user = await prisma.user.findUnique({ where: { id: req.userId! } });
        await prisma.user.update({ where: { id: req.userId! }, data: { totpSecret: secret } });
        const otpauthUrl = authenticator.keyuri(user!.email, 'app-making-book', secret);
        res.json({ otpauthUrl, secret });
    })
);

router.post(
    '/2fa/enable',
    asyncHandler(async (req: AuthedRequest, res) => {
        const { code } = req.body ?? {};
        const user = await prisma.user.findUnique({ where: { id: req.userId! } });
        if (!user?.totpSecret) {
            res.status(400).json({ error: 'Call /2fa/setup first' });
            return;
        }
        if (typeof code !== 'string' || !authenticator.verify({ token: code, secret: user.totpSecret })) {
            res.status(401).json({ error: 'Invalid code — check your authenticator app and try again' });
            return;
        }
        await prisma.user.update({ where: { id: req.userId! }, data: { totpEnabled: true } });
        res.json({ ok: true });
    })
);

router.post(
    '/2fa/disable',
    asyncHandler(async (req: AuthedRequest, res) => {
        await prisma.user.update({ where: { id: req.userId! }, data: { totpEnabled: false, totpSecret: null } });
        res.json({ ok: true });
    })
);

// ---- Account deletion ---------------------------------------------------
router.delete(
    '/account',
    requireAuth,
    asyncHandler(async (req: AuthedRequest, res) => {
        const { password } = req.body ?? {};
        const user = await prisma.user.findUnique({ where: { id: req.userId! } });
        if (!user || typeof password !== 'string' || !(await bcrypt.compare(password, user.passwordHash))) {
            res.status(401).json({ error: 'Incorrect password — deletion requires re-entering it' });
            return;
        }

        // Delete in dependency order — Prisma won't cascade automatically
        // unless the schema says so, and this schema deliberately doesn't,
        // so an accidental cascading delete can't happen from elsewhere.
        await prisma.$transaction([
            prisma.pushSubscription.deleteMany({ where: { userId: user.id } }),
            prisma.session.deleteMany({ where: { userId: user.id } }),
            prisma.analyticsEvent.deleteMany({ where: { userId: user.id } }),
            prisma.log.deleteMany({ where: { userId: user.id } }),
            prisma.progress.deleteMany({ where: { userId: user.id } }),
            prisma.user.delete({ where: { id: user.id } }),
        ]);

        res.json({ ok: true, message: 'Account and all associated data deleted' });
    })
);

// GET /api/auth/account/export — GDPR-style personal data export,
// meant to be offered BEFORE deletion, not just a nice-to-have after.
router.get(
    '/account/export',
    requireAuth,
    asyncHandler(async (req: AuthedRequest, res) => {
        const [user, progress, logs, events] = await Promise.all([
            prisma.user.findUnique({
                where: { id: req.userId! },
                select: { id: true, name: true, email: true, createdAt: true, isPremium: true },
            }),
            prisma.progress.findUnique({ where: { userId: req.userId! } }),
            prisma.log.findMany({ where: { userId: req.userId! } }),
            prisma.analyticsEvent.findMany({ where: { userId: req.userId! } }),
        ]);
        res.json({ user, progress: progress?.data ?? null, logs, analyticsEvents: events });
    })
);

export default router;
