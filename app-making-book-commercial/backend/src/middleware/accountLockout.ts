import { prisma } from '../prisma';

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

/**
 * Brute-force defense that survives across requests (unlike rate
 * limiting, which is per-IP and resets if the attacker rotates IPs).
 * After 5 wrong passwords, the account itself locks for 15 minutes,
 * regardless of which IP is trying.
 */
export async function isLocked(userId: number): Promise<boolean> {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { lockedUntil: true } });
    return !!user?.lockedUntil && user.lockedUntil > new Date();
}

export async function recordFailedLogin(userId: number): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { failedLoginCount: true } });
    const count = (user?.failedLoginCount ?? 0) + 1;
    const lockedUntil = count >= MAX_ATTEMPTS ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null;
    await prisma.user.update({
        where: { id: userId },
        data: { failedLoginCount: count, lockedUntil },
    });
}

export async function clearFailedLogins(userId: number): Promise<void> {
    await prisma.user.update({
        where: { id: userId },
        data: { failedLoginCount: 0, lockedUntil: null },
    });
}
