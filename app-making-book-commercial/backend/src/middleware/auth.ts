import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';
import { verifyToken, hasSecret } from '../config/secrets';

export interface AuthedRequest extends Request {
    userId?: number;
}

interface AccessTokenPayload {
    userId: number;
    tokenVersion: number;
    type: 'access';
}

/**
 * Verifies the JWT (accepting either the current or previous secret —
 * see config/secrets.ts) AND re-checks tokenVersion against the
 * database. The extra DB read is the cost of making tokens revocable.
 */
export const requireAuth = async (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!hasSecret()) {
        res.status(500).json({ error: 'Server misconfigured: JWT_SECRET is not set' });
        return;
    }

    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing or malformed Authorization header' });
        return;
    }

    const token = header.slice('Bearer '.length);
    try {
        const payload = verifyToken<AccessTokenPayload>(token);
        if (payload.type !== 'access') {
            res.status(401).json({ error: 'Wrong token type' });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: { tokenVersion: true },
        });
        if (!user || user.tokenVersion !== payload.tokenVersion) {
            res.status(401).json({ error: 'Token has been revoked' });
            return;
        }

        req.userId = payload.userId;
        next();
    } catch {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};
