import { Router } from 'express';
import { prisma } from '../prisma';
import { getIO } from '../socket';
import { asyncHandler } from '../middleware/errorHandler';
import { requireAuth, type AuthedRequest } from '../middleware/auth';

const router = Router();

// GET /api/logs — list logs, most recent first
router.get(
    '/',
    asyncHandler(async (_req, res) => {
        const logs = await prisma.log.findMany({
            orderBy: { id: 'desc' },
            take: 100,
        });
        res.json(logs);
    })
);

// POST /api/logs — requires a valid JWT. Previously this endpoint
// accepted an arbitrary userId in the body, so anyone could create
// logs attributed to any user. Now the userId comes from the token.
router.post(
    '/',
    requireAuth,
    asyncHandler(async (req: AuthedRequest, res) => {
        const { message } = req.body ?? {};
        const userId = req.userId!;

        if (typeof message !== 'string' || message.trim().length === 0) {
            res.status(400).json({ error: 'message is required and must be a non-empty string' });
            return;
        }

        const newLog = await prisma.log.create({
            data: { message: message.trim(), userId },
        });

        getIO().emit('security_alert', newLog);

        res.status(201).json(newLog);
    })
);

export default router;
