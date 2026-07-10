import type { Request, Response } from 'express';
import { prisma } from '../prisma';

/**
 * Passed as express-rate-limit's `handler` option. Without this, a
 * rate limit is an invisible wall — the admin has no way to see it's
 * even happening, let alone from where. Fire-and-forget: logging a
 * rejection must never itself become a source of failure.
 */
export function logRateLimitHit(req: Request, res: Response) {
    prisma.rateLimitHit.create({
        data: { route: req.baseUrl + req.path, ipAddress: req.ip ?? 'unknown' },
    }).catch(() => {});
    res.status(429).json({ error: 'Too many requests, try again later' });
}
