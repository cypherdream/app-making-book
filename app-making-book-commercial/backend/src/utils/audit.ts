import { prisma } from '../prisma';

export async function logAdminAction(actorId: number, action: string, targetId?: string, metadata?: object) {
    await prisma.auditLog.create({
        data: { actorId, action, targetId, metadata: metadata ?? undefined },
    });
}
