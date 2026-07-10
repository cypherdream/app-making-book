import Redis from 'ioredis';

/**
 * Cache wrapper with a real no-op fallback. If REDIS_URL isn't set
 * (the default), every call just misses and the caller falls back to
 * hitting the database — the app works identically either way, just
 * slower without Redis. Nothing breaks if you never set this up.
 *
 * Free option: Upstash Redis has a genuine free tier (10k commands/day),
 * no credit card. Set REDIS_URL to activate this.
 */
const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : null;

export async function cacheGet<T>(key: string): Promise<T | null> {
    if (!redis) return null;
    try {
        const raw = await redis.get(key);
        return raw ? (JSON.parse(raw) as T) : null;
    } catch {
        return null; // Redis being unreachable should degrade to "cache miss", never crash the request
    }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
    if (!redis) return;
    try {
        await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
        // Failing to cache is not worth failing the request over.
    }
}

export async function cacheDel(key: string): Promise<void> {
    if (!redis) return;
    try {
        await redis.del(key);
    } catch {
        // no-op on failure, same reasoning as above
    }
}
