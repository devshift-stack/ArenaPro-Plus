import Redis from 'ioredis';
import { config } from '../config/index.js';
import { logger } from './logger.js';

// ════════════════════════════════════════════════════════════════════════════
// REDIS CLIENT
// ════════════════════════════════════════════════════════════════════════════

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    redis.on('connect', () => {
      logger.info('✅ Redis connected');
    });

    redis.on('error', (err) => {
      logger.error('Redis error:', err);
    });
  }

  return redis;
}

// ════════════════════════════════════════════════════════════════════════════
// CACHE HELPERS
// ════════════════════════════════════════════════════════════════════════════

export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}

export async function cacheSet(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
  const redis = getRedis();
  await redis.setex(key, ttlSeconds, JSON.stringify(value));
}

export async function cacheDelete(key: string): Promise<void> {
  const redis = getRedis();
  await redis.del(key);
}

export async function cacheDeletePattern(pattern: string): Promise<void> {
  const redis = getRedis();
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

export default getRedis;
