import 'dotenv/config';
import { prisma } from './prisma';
import { sendPushToUser } from './routes/pushRoutes';

/**
 * Polling-based background worker — run as a separate process
 * (`npm run worker`), not inside server.ts, so a slow job never blocks
 * an HTTP request. Picks up pending Jobs every 5 seconds.
 *
 * This is intentionally simple: no Redis, no BullMQ, just Postgres.
 * Good enough for "send this push notification a few seconds from
 * now" — not built for high-throughput or sub-second latency work.
 */
const POLL_INTERVAL_MS = 5000;
const MAX_ATTEMPTS = 3;

async function processJob(job: { id: number; type: string; payload: unknown; attempts: number }) {
    try {
        switch (job.type) {
            case 'send_push': {
                const { userId, title, body } = job.payload as { userId: number; title: string; body: string };
                await sendPushToUser(userId, title, body);
                break;
            }
            default:
                throw new Error(`Unknown job type: ${job.type}`);
        }
        await prisma.job.update({ where: { id: job.id }, data: { status: 'done', processedAt: new Date() } });
    } catch (err) {
        const attempts = job.attempts + 1;
        await prisma.job.update({
            where: { id: job.id },
            data: {
                attempts,
                status: attempts >= MAX_ATTEMPTS ? 'failed' : 'pending',
                error: err instanceof Error ? err.message : String(err),
            },
        });
    }
}

async function tick() {
    const jobs = await prisma.job.findMany({
        where: { status: 'pending', attempts: { lt: MAX_ATTEMPTS } },
        take: 10,
    });
    if (jobs.length === 0) return;

    // Claim jobs (mark processing) before working them, so a second
    // worker process running concurrently doesn't pick up the same ones.
    await prisma.job.updateMany({
        where: { id: { in: jobs.map((j) => j.id) } },
        data: { status: 'processing' },
    });

    await Promise.all(jobs.map(processJob));
}

console.log('Job worker started — polling every', POLL_INTERVAL_MS, 'ms');
setInterval(() => {
    tick().catch((err) => console.error('[worker] tick failed:', err));
}, POLL_INTERVAL_MS);
