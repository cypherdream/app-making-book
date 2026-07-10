import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAuth, type AuthedRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/requireAdmin';
import { asyncHandler } from '../middleware/errorHandler';
import { lessonSchema, lessonUpdateSchema } from '../validation/lessonSchema';
import { logAdminAction } from '../utils/audit';
import { cacheGet, cacheSet } from '../services/cache';
import { enqueueJob } from '../services/jobs';

const router = Router();

// Every route below requires a valid, non-revoked JWT AND isAdmin=true,
// checked fresh from the database on each request (see requireAdmin.ts).
router.use(requireAuth, requireAdmin);

// ---- Dashboard summary --------------------------------------------
router.get(
    '/dashboard',
    asyncHandler(async (_req, res) => {
        // This endpoint aggregates 7 queries every time it's loaded —
        // a real caching candidate, since the numbers don't need to be
        // accurate to the second. Cache miss (no Redis configured, or
        // first request) just runs the same queries as before.
        const cached = await cacheGet('admin:dashboard');
        if (cached) {
            res.json(cached);
            return;
        }

        const since7d = { gte: new Date(Date.now() - 7 * 86400000) };
        const [userCount, premiumCount, lessonCount, recentEvents, recentErrors, rateLimitHits7d, recentHealthChecks] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { isPremium: true } }),
            prisma.lesson.count(),
            prisma.analyticsEvent.count({ where: { createdAt: since7d } }),
            prisma.analyticsEvent.count({ where: { type: 'client_error', createdAt: since7d } }),
            prisma.rateLimitHit.count({ where: { createdAt: since7d } }),
            prisma.healthCheck.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }),
        ]);
        const uptimePct = recentHealthChecks.length
            ? Math.round((recentHealthChecks.filter((h) => h.ok).length / recentHealthChecks.length) * 1000) / 10
            : null;
        const payload = {
            userCount, premiumCount, lessonCount,
            eventsLast7Days: recentEvents,
            errorsLast7Days: recentErrors,
            rateLimitHitsLast7Days: rateLimitHits7d,
            uptimePctLast50Checks: uptimePct,
            recentHealthChecks,
        };
        await cacheSet('admin:dashboard', payload, 60);
        res.json(payload);
    })
);

// GET /api/admin/rate-limit-hits — breakdown by route, so an admin can
// see which endpoint is actually being hammered.
router.get(
    '/rate-limit-hits',
    asyncHandler(async (_req, res) => {
        const hits = await prisma.rateLimitHit.groupBy({
            by: ['route'],
            _count: { route: true },
            orderBy: { _count: { route: 'desc' } },
        });
        res.json(hits.map((h) => ({ route: h.route, count: h._count.route })));
    })
);

// ---- User management -----------------------------------------------
router.get(
    '/users',
    asyncHandler(async (_req, res) => {
        const users = await prisma.user.findMany({
            select: { id: true, name: true, email: true, isAdmin: true, isPremium: true, createdAt: true, lockedUntil: true },
            orderBy: { createdAt: 'desc' },
            take: 200,
        });
        res.json(users);
    })
);

// Locking an account here is the "ban" action — it reuses the same
// lockedUntil field the login-lockout mechanism uses, set far in the
// future instead of 15 minutes.
router.post(
    '/users/:id/ban',
    asyncHandler(async (req: AuthedRequest, res) => {
        const targetId = Number(req.params.id);
        await prisma.user.update({ where: { id: targetId }, data: { lockedUntil: new Date('2100-01-01') } });
        await logAdminAction(req.userId!, 'user.ban', String(targetId));
        res.json({ ok: true });
    })
);

router.post(
    '/users/:id/unban',
    asyncHandler(async (req: AuthedRequest, res) => {
        const targetId = Number(req.params.id);
        await prisma.user.update({ where: { id: targetId }, data: { lockedUntil: null, failedLoginCount: 0 } });
        await logAdminAction(req.userId!, 'user.unban', String(targetId));
        res.json({ ok: true });
    })
);

// POST /api/admin/users/:id/notify — sends a push notification via the
// background job queue instead of inline, so this endpoint responds
// immediately even if the user has several devices subscribed. This
// is the queue's real caller, not just infrastructure sitting unused.
router.post(
    '/users/:id/notify',
    asyncHandler(async (req: AuthedRequest, res) => {
        const targetId = Number(req.params.id);
        const { title, body } = req.body ?? {};
        if (typeof title !== 'string' || typeof body !== 'string') {
            res.status(400).json({ error: 'title and body are required strings' });
            return;
        }
        await enqueueJob('send_push', { userId: targetId, title, body });
        await logAdminAction(req.userId!, 'user.notify', String(targetId), { title });
        res.status(202).json({ ok: true, message: 'Notification queued' });
    })
);

// ---- Lesson CMS ------------------------------------------------------
router.get(
    '/lessons',
    asyncHandler(async (_req, res) => {
        const lessons = await prisma.lesson.findMany({ orderBy: { order: 'asc' } });
        res.json(lessons);
    })
);

router.post(
    '/lessons',
    asyncHandler(async (req: AuthedRequest, res) => {
        const parsed = lessonSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: parsed.error.issues[0].message });
            return;
        }
        const { id, track, title, time, objective, content, published, order } = parsed.data;
        const lesson = await prisma.lesson.create({
            data: { id, track, title, time, objective, content, published, order },
        });
        await logAdminAction(req.userId!, 'lesson.create', id);
        res.status(201).json(lesson);
    })
);

router.put(
    '/lessons/:id',
    asyncHandler(async (req: AuthedRequest, res) => {
        const parsed = lessonUpdateSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: parsed.error.issues[0].message });
            return;
        }
        const lesson = await prisma.lesson.update({ where: { id: req.params.id }, data: parsed.data });
        await logAdminAction(req.userId!, 'lesson.update', req.params.id, parsed.data);
        res.json(lesson);
    })
);

router.delete(
    '/lessons/:id',
    asyncHandler(async (req: AuthedRequest, res) => {
        await prisma.lesson.delete({ where: { id: req.params.id } });
        await logAdminAction(req.userId!, 'lesson.delete', req.params.id);
        res.status(204).send();
    })
);

// ---- Audit log viewer -------------------------------------------------
router.get(
    '/audit-log',
    asyncHandler(async (_req, res) => {
        const entries = await prisma.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 200,
            include: { actor: { select: { name: true, email: true } } },
        });
        res.json(entries);
    })
);

export default router;
