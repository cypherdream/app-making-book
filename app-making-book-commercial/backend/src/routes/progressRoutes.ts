import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAuth, type AuthedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Every route here requires a valid JWT — progress belongs to exactly
// one account, never accessible by userId in the URL (which would let
// one user read another's data by guessing an id).
router.use(requireAuth);

// GET /api/progress — returns {} if the user has never synced before,
// rather than 404. An empty object is a normal, valid first state.
router.get(
    '/',
    asyncHandler(async (req: AuthedRequest, res) => {
        const record = await prisma.progress.findUnique({ where: { userId: req.userId! } });
        res.json(record?.data ?? {});
    })
);

// PUT /api/progress — full replace (the client always sends its whole
// local state, not a diff), upserting so first sync and every sync
// after it use the same code path.
router.put(
    '/',
    asyncHandler(async (req: AuthedRequest, res) => {
        const data = req.body;
        if (typeof data !== 'object' || data === null || Array.isArray(data)) {
            res.status(400).json({ error: 'Body must be a JSON object' });
            return;
        }

        const record = await prisma.progress.upsert({
            where: { userId: req.userId! },
            update: { data },
            create: { userId: req.userId!, data },
        });

        res.json(record.data);
    })
);

export default router;
