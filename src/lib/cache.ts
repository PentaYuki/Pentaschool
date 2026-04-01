/**
 * Cache Layer
 * Provides high-level cache operations with TTL management
 */

import { getRedisClient } from './redis';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds (default: 300 - 5 minutes)
  tags?: string[]; // Tags for bulk invalidation
}

const DEFAULT_TTL = 300; // 5 minutes

/**
 * Get value from cache
 */
export async function cacheGet<T = any>(key: string): Promise<T | null> {
  try {
    const redis = await getRedisClient();
    const value = await redis.get(key);
    
    if (!value) return null;
    
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  } catch (error) {
    console.error(`Cache GET error for key ${key}:`, error);
    return null;
  }
}

/**
 * Set value in cache with TTL
 */
export async function cacheSet<T = any>(
  key: string,
  value: T,
  options: CacheOptions = {}
): Promise<void> {
  try {
    const redis = await getRedisClient();
    const ttl = options.ttl ?? DEFAULT_TTL;
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    
    await redis.set(key, serialized, { EX: ttl });

    // Add to tag sets for bulk invalidation
    if (options.tags && options.tags.length > 0) {
      for (const tag of options.tags) {
        const tagKey = `cache:tag:${tag}`;
        await redis.sAdd(tagKey, key);
        await redis.expire(tagKey, ttl * 2);
      }
    }
  } catch (error) {
    console.error(`Cache SET error for key ${key}:`, error);
  }
}

/**
 * Delete cache key(s)
 */
export async function cacheDel(keys: string | string[]): Promise<number> {
  try {
    const redis = await getRedisClient();
    const keyArray = Array.isArray(keys) ? keys : [keys];
    let deleted = 0;
    
    for (const key of keyArray) {
      deleted += await redis.del(key);
    }
    
    return deleted;
  } catch (error) {
    console.error(`Cache DEL error:`, error);
    return 0;
  }
}

/**
 * Invalidate cache by tag
 */
export async function cacheInvalidateByTag(tag: string): Promise<void> {
  try {
    const redis = await getRedisClient();
    const tagKey = `cache:tag:${tag}`;
    
    const keysToDelete = await redis.sMembers(tagKey);
    
    if (keysToDelete.length > 0) {
      for (const key of keysToDelete) {
        await redis.del(key);
      }
    }
    
    await redis.del(tagKey);
  } catch (error) {
    console.error(`Cache INVALIDATE_BY_TAG error for tag ${tag}:`, error);
  }
}

/**
 * Get or compute (cache-aside pattern)
 */
export async function cacheGetOrSet<T = any>(
  key: string,
  compute: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  try {
    const cached = await cacheGet<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await compute();
    await cacheSet(key, value, options);

    return value;
  } catch (error) {
    console.error(`Cache GET_OR_SET error for key ${key}:`, error);
    return compute();
  }
}

/**
 * Clear all cache
 */
export async function cacheClearAll(): Promise<void> {
  try {
    const redis = await getRedisClient();
    await redis.flushDb();
  } catch (error) {
    console.error('Cache CLEAR_ALL error:', error);
  }
}

/**
 * Cache key builders for common patterns
 */
export const cacheKeys = {
  page: (pageId: string) => `page:${pageId}`,
  pages: (classId: string) => `pages:class:${classId}`,
  quiz: (quizId: string) => `quiz:${quizId}`,
  quizzes: (pageId: string) => `quizzes:page:${pageId}`,
  quizQuestions: (quizId: string) => `quiz:questions:${quizId}`,
  exam: (examId: string) => `exam:${examId}`,
  exams: (classId: string) => `exams:class:${classId}`,
  examQuestions: (examId: string) => `exam:questions:${examId}`,
  examResults: (examId: string, userId: string) => `exam:results:${examId}:${userId}`,
  class: (classId: string) => `class:${classId}`,
  classes: (teacherId: string) => `classes:teacher:${teacherId}`,
  classStudents: (classId: string) => `class:students:${classId}`,
  user: (userId: string) => `user:${userId}`,
  userProgress: (userId: string, classId: string) => `user:progress:${userId}:${classId}`,
  session: (sessionId: string) => `session:${sessionId}`,
  userSessions: (userId: string) => `sessions:user:${userId}`,
};

/**
 * Cache tags for bulk invalidation
 */
export const cacheTags = {
  pages: 'pages',
  quizzes: 'quizzes',
  exams: 'exams',
  classes: 'classes',
  users: 'users',
  all: 'all',
};
