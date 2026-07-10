import { Router } from 'express';
import { prisma } from '../prisma';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// select passwordHash: false everywhere below — Prisma's default
// findMany()/findUnique() return every column, which previously meant
// every GET on this router leaked bcrypt hashes to any caller.
const SAFE_USER_SELECT = {
    id: true,
    name: true,
    email: true,
    createdAt: true,
} as const;

// GET /api/users — list all users (never includes passwordHash)
router.get(
    '/',
    asyncHandler(async (_req, res) => {
        const users = await prisma.user.findMany({ select: SAFE_USER_SELECT });
        res.json(users);
    })
);

// GET /api/users/:id — fetch a single user, including their logs
router.get(
    '/:id',
    asyncHandler(async (req, res) => {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) {
            res.status(400).json({ error: 'id must be an integer' });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { id },
            select: { ...SAFE_USER_SELECT, logs: true },
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json(user);
    })
);

// POST /api/users used to create a bare user with just a name and no
// password. That's superseded by POST /api/auth/register, which
// requires an email + password and returns a JWT. Account creation
// now lives in one place instead of two inconsistent ones.

export default router;
