import type { Response, NextFunction } from 'express';
import { prisma } from '../prisma';
import type { AuthedRequest } from './auth';

/**
 * Must run after requireAuth (needs req.userId already set). Checks
 * isAdmin fresh from the database on every request rather than trusting
 * a claim baked into the JWT — so revoking admin access takes effect
 * immediately instead of waiting for the token to expire.
 */
export async function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
    const user = await prisma.user.findUnique({ where: { id: req.userId! }, select: { isAdmin: true } });
    if (!user?.isAdmin) {
        res.status(403).json({ error: 'Admin access required' });
        return;
    }
    next();
}
