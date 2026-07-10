import { Router } from 'express';
import { prisma } from '../prisma';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Metrics leak internal signals (user counts, job failure rates) that
// shouldn't be public. Protected by a shared secret rather than JWT,
// since Prometheus's scrape config supports a static bearer_token
// natively — no need for a login flow just to scrape metrics.
router.use((req, res, next) => {
    const token = process.env.METRICS_TOKEN;
    if (!token) {
        res.status(503).json({ error: 'METRICS_TOKEN is not configured — metrics endpoint disabled' });
        return;
    }
    const header = req.headers.authorization;
    if (header !== `Bearer ${token}`) {
        res.status(401).json({ error: 'Invalid or missing metrics token' });
        return;
    }
    next();
});

// GET /metrics — Prometheus text-exposition format. Point a
// self-hosted Prometheus (or Grafana Cloud's free tier, which scrapes
// this format) at this endpoint with bearer_token set to METRICS_TOKEN.
router.get(
    '/',
    asyncHandler(async (_req, res) => {
        const [userCount, activeSessionCount, pendingJobCount, failedJobCount, last24hEvents] = await Promise.all([
            prisma.user.count(),
            prisma.session.count({ where: { revokedAt: null } }),
            prisma.job.count({ where: { status: 'pending' } }),
            prisma.job.count({ where: { status: 'failed' } }),
            prisma.analyticsEvent.count({ where: { createdAt: { gte: new Date(Date.now() - 86400000) } } }),
        ]);

        const lines = [
            '# HELP app_users_total Total registered users',
            '# TYPE app_users_total gauge',
            `app_users_total ${userCount}`,
            '# HELP app_sessions_active Active (non-revoked) sessions',
            '# TYPE app_sessions_active gauge',
            `app_sessions_active ${activeSessionCount}`,
            '# HELP app_jobs_pending Background jobs waiting to run',
            '# TYPE app_jobs_pending gauge',
            `app_jobs_pending ${pendingJobCount}`,
            '# HELP app_jobs_failed Background jobs that exhausted retries',
            '# TYPE app_jobs_failed gauge',
            `app_jobs_failed ${failedJobCount}`,
            '# HELP app_events_24h Analytics events in the last 24 hours',
            '# TYPE app_events_24h gauge',
            `app_events_24h ${last24hEvents}`,
        ];

        res.set('Content-Type', 'text/plain; version=0.0.4');
        res.send(lines.join('\n') + '\n');
    })
);

export default router;
