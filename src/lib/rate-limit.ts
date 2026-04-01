/**
 * Rate Limiting
 * Token bucket algorithm via Redis
 */

import { getRedisClient } from './redis';

export interface RateLimitConfig {
  maxAttempts: number; // Max requests allowed
  windowMs: number; // Time window in milliseconds
  keyPrefix?: string; // Redis key prefix
}

/**
 * Check if request should be allowed
 * Returns { allowed: boolean, remaining: number, resetTime: number }
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<{
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}> {
  const redis = await getRedisClient();
  const key = `${config.keyPrefix || 'ratelimit'}:${identifier}`;
  const windowSeconds = Math.ceil(config.windowMs / 1000);

  try {
    // Get current count
    const current = await redis.incr(key);

    // Set TTL on first request in window
    if (current === 1) {
      await redis.expire(key, windowSeconds);
    }

    // Get remaining time
    const ttl = await redis.ttl(key);
    const resetTime = ttl > 0 ? Date.now() + ttl * 1000 : Date.now();

    if (current > config.maxAttempts) {
      return {
        allowed: false,
        remaining: 0,
        resetTime,
        retryAfter: ttl,
      };
    }

    return {
      allowed: true,
      remaining: config.maxAttempts - current,
      resetTime,
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // On error, allow request (fail open)
    return {
      allowed: true,
      remaining: config.maxAttempts,
      resetTime: Date.now() + config.windowMs,
    };
  }
}

/**
 * Reset rate limit for an identifier
 */
export async function resetRateLimit(identifier: string, keyPrefix = 'ratelimit'): Promise<void> {
  const redis = await getRedisClient();
  const key = `${keyPrefix}:${identifier}`;
  await redis.del(key);
}

/**
 * Common rate limit configurations
 */
export const rateLimitConfigs = {
  // Auth: 5 attempts per minute
  auth: {
    maxAttempts: 5,
    windowMs: 60 * 1000,
    keyPrefix: 'ratelimit:auth',
  } as RateLimitConfig,

  // API: 100 requests per minute
  api: {
    maxAttempts: 100,
    windowMs: 60 * 1000,
    keyPrefix: 'ratelimit:api',
  } as RateLimitConfig,

  // Strict: 3 attempts per minute (for sensitive operations)
  strict: {
    maxAttempts: 3,
    windowMs: 60 * 1000,
    keyPrefix: 'ratelimit:strict',
  } as RateLimitConfig,

  // Relaxed: 1000 requests per hour
  relaxed: {
    maxAttempts: 1000,
    windowMs: 60 * 60 * 1000,
    keyPrefix: 'ratelimit:relaxed',
  } as RateLimitConfig,
};
