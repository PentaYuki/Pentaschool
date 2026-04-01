/**
 * Cache Middleware
 * Automatically cache GET requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { cacheGet, cacheSet, CacheOptions } from '@/lib/cache';

/**
 * Cache options for different endpoint types
 */
export const cacheConfig = {
  // Pages and content (5 min)
  content: { ttl: 300, tags: ['pages'] } as CacheOptions,
  
  // Quizzes and questions (10 min)
  quizzes: { ttl: 600, tags: ['quizzes'] } as CacheOptions,
  
  // Exams (15 min)
  exams: { ttl: 900, tags: ['exams'] } as CacheOptions,
  
  // User data (3 min - more frequent changes)
  user: { ttl: 180, tags: ['users'] } as CacheOptions,
  
  // Class data (5 min)
  class: { ttl: 300, tags: ['classes'] } as CacheOptions,
  
  // Short cache (1 min)
  short: { ttl: 60 } as CacheOptions,
};

/**
 * Generate cache key for request
 */
export function generateCacheKey(request: NextRequest): string {
  const url = new URL(request.url);
  const userId = request.headers.get('x-user-id') || 'anonymous';
  
  // Include user ID in cache key to avoid leaking data
  return `http:${userId}:${request.method}:${url.pathname}${url.search}`;
}

/**
 * Cache middleware for GET requests
 */
export async function withCache(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: CacheOptions = cacheConfig.content
): Promise<NextResponse> {
  // Only cache GET requests
  if (request.method !== 'GET') {
    return handler(request);
  }

  const cacheKey = generateCacheKey(request);

  try {
    // Try to get from cache
    const cached = await cacheGet(cacheKey);
    if (cached) {
      const response = new NextResponse(JSON.stringify(cached), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Cache': 'HIT',
        },
      });
      return response;
    }
  } catch (error) {
    console.error('Cache read error:', error);
    // Fall through to handler on error
  }

  // Get response from handler
  const response = await handler(request);

  // Cache successful responses
  if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
    try {
      const data = await response.clone().json();
      await cacheSet(cacheKey, data, options);
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }

  // Mark as cache miss
  response.headers.set('X-Cache', 'MISS');
  return response;
}

/**
 * Cache busting utilities
 */
export async function invalidateCache(pattern: string): Promise<void> {
  // This should be called after mutations (POST, PUT, DELETE)
  // Implementation depends on your cache key pattern
  console.log(`Cache invalidation requested for pattern: ${pattern}`);
}
