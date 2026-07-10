import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { asyncHandler } from '../middleware/errorHandler';
import rateLimit from 'express-rate-limit';
import { verifyToken } from '../config/secrets';

const router = Router();

// Generous but present — this endpoint is public (anonymous events are
// allowed) so it needs its own limiter independent of the auth routes.
const eventLimiter = rateLimit({ windowMs: 60_000, limit: 60 });

const eventSchema = z.object({
    type: z.enum(['lesson_view', 'lesson_complete', 'quiz_answer', 'client_error']),
    lessonId: z.string().max(64).optional(),
    metadata: z.record(z.any()).optional(),
});

// POST /api/analytics/events — accepts events from both the web app
// and (optionally) the Android app. userId is read from a JWT if
// present, but the endpoint doesn't require login — anonymous usage
// still gets counted, logged-in usage gets attributed to an account.
router.post(
    '/events',
    eventLimiter,
    asyncHandler(async (req, res) => {
        const parsed = eventSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: parsed.error.issues[0].message });
            return;
        }

        let userId: number | undefined;
        const header = req.headers.authorization;
        if (header?.startsWith('Bearer ')) {
            try {
                const payload = verifyToken<{ userId: number }>(header.slice(7));
                userId = payload.userId;
            } catch {
                // Invalid/expired token on an analytics ping isn't worth
                // rejecting the request over — just log it as anonymous.
            }
        }

        await prisma.analyticsEvent.create({
            data: { userId, type: parsed.data.type, lessonId: parsed.data.lessonId, metadata: parsed.data.metadata },
        });
        res.status(202).json({ ok: true });
    })
);

export default router;
