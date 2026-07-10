import { prisma } from '../prisma';

/**
 * Queues a background job instead of doing the work inline in a
 * request handler. Returns immediately — the actual work happens in
 * worker.ts, polling this table every 5 seconds.
 */
export async function enqueueJob(type: string, payload: object) {
    await prisma.job.create({ data: { type, payload } });
}
