import { Router } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { prisma } from '../prisma';
import { asyncHandler } from '../middleware/errorHandler';
import { requireAuth, type AuthedRequest } from '../middleware/auth';
import { sendEmail } from '../services/email';
import { logRateLimitHit } from '../middleware/rateLimitLogger';

const router = Router();

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, handler: logRateLimitHit });

function makeToken(): string {
    return crypto.randomBytes(32).toString('hex'); // 256 bits — not guessable by brute force in any practical sense
}

// ---- Email verification -------------------------------------------------

// POST /api/auth/verify-email/request — (re)send the verification email.
// Requires login so this can't be used to spam arbitrary email addresses.
router.post(
    '/verify-email/request',
    requireAuth,
    limiter,
    asyncHandler(async (req: AuthedRequest, res) => {
        const user = await prisma.user.findUnique({ where: { id: req.userId! } });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        if (user.emailVerified) {
            res.json({ ok: true, message: 'Already verified' });
            return;
        }

        const token = makeToken();
        await prisma.user.update({
            where: { id: user.id },
            data: { emailVerifyToken: token, emailVerifyExpiry: new Date(Date.now() + 24 * 3600 * 1000) },
        });

        const verifyUrl = `${process.env.CLIENT_ORIGIN}/verify-email?token=${token}`;
        await sendEmail(
            user.email,
            'Verify your email',
            `<p>Hi ${user.name},</p><p>Confirm your email: <a href="${verifyUrl}">${verifyUrl}</a></p><p>This link expires in 24 hours.</p>`
        );

        res.json({ ok: true, message: 'Verification email sent' });
    })
);

// GET /api/auth/verify-email/:token — public (the token itself is the
// credential; no login required, since the user may not be able to
// log in yet depending on your product's rules).
router.get(
    '/verify-email/:token',
    asyncHandler(async (req, res) => {
        const user = await prisma.user.findUnique({ where: { emailVerifyToken: req.params.token } });
        if (!user || !user.emailVerifyExpiry || user.emailVerifyExpiry < new Date()) {
            res.status(400).json({ error: 'Invalid or expired verification link' });
            return;
        }

        await prisma.user.update({
            where: { id: user.id },
            data: { emailVerified: true, emailVerifyToken: null, emailVerifyExpiry: null },
        });
        res.json({ ok: true, message: 'Email verified' });
    })
);

// ---- Password reset -------------------------------------------------------

const requestResetSchema = z.object({ email: z.string().email() });
const confirmResetSchema = z.object({
    token: z.string().min(1),
    newPassword: z.string().min(10, 'password must be at least 10 characters'),
});

// POST /api/auth/password-reset/request — always returns the same
// response whether or not the email exists, so this endpoint can't be
// used to enumerate registered emails.
router.post(
    '/password-reset/request',
    limiter,
    asyncHandler(async (req, res) => {
        const parsed = requestResetSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: parsed.error.issues[0].message });
            return;
        }

        const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
        if (user) {
            const token = makeToken();
            await prisma.user.update({
                where: { id: user.id },
                data: { resetToken: token, resetTokenExpiry: new Date(Date.now() + 3600 * 1000) },
            });
            const resetUrl = `${process.env.CLIENT_ORIGIN}/reset-password?token=${token}`;
            await sendEmail(
                user.email,
                'Reset your password',
                `<p>Reset your password: <a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>`
            );
        }

        res.json({ ok: true, message: 'If that email is registered, a reset link has been sent' });
    })
);

// POST /api/auth/password-reset/confirm — the token is single-use:
// it's cleared immediately after a successful reset, so replaying an
// intercepted reset link twice does nothing the second time.
router.post(
    '/password-reset/confirm',
    limiter,
    asyncHandler(async (req, res) => {
        const parsed = confirmResetSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: parsed.error.issues[0].message });
            return;
        }

        const user = await prisma.user.findUnique({ where: { resetToken: parsed.data.token } });
        if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
            res.status(400).json({ error: 'Invalid or expired reset link' });
            return;
        }

        const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                resetToken: null,
                resetTokenExpiry: null,
                tokenVersion: { increment: 1 }, // resetting your password logs out every existing session — correct behavior if the reset was because of a compromised account
            },
        });

        res.json({ ok: true, message: 'Password reset — please log in again' });
    })
);

export default router;
