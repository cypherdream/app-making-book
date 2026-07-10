import { PrismaClient } from '@prisma/client';

/**
 * Previously every route file did `new PrismaClient()` on its own.
 * Each instance opens its own connection pool, so that pattern
 * silently multiplies database connections as more routes are added.
 * Import `prisma` from here everywhere instead.
 */
export const prisma = new PrismaClient();
