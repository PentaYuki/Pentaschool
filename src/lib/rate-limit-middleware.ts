/**
 * Rate Limit Middleware
 * Apply to routes for request throttling
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RateLimitConfig, rateLimitConfigs } from '@/lib/rate-limit';

/**
 * Get identifier for rate limiting (IP or user ID)
 */
function getIdentifier(request: NextRequest): string {
  // Try to get user ID from headers (set by auth middleware)
  const userId = request.headers.get('x-user-id');
  if (userId) {
    return `user:${userId}`;
  }

  // Fall back to IP address
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
  return `ip:${ip}`;
}

/**
 * Rate limit middleware
 */
export async function applyRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): Promise<NextResponse | null> {
  const identifier = getIdentifier(request);

  const result = await checkRateLimit(identifier, config);

  // Add rate limit info to response headers
  const headers = new Headers();
  headers.set('X-RateLimit-Limit', String(config.maxAttempts));
  headers.set('X-RateLimit-Remaining', String(result.remaining));
  headers.set('X-RateLimit-Reset', String(Math.floor(result.resetTime / 1000)));

  if (!result.allowed) {
    headers.set('Retry-After', String(result.retryAfter || 60));
    return new NextResponse(
      JSON.stringify({
        error: 'Too many requests',
        retryAfter: result.retryAfter,
      }),
      {
        status: 429,
        headers,
      }
    );
  }

  return null; // Allow request
}

/**
 * Authentication rate limit (5 attempts per minute)
 */
export async function authRateLimit(request: NextRequest): Promise<NextResponse | null> {
  return applyRateLimit(request, rateLimitConfigs.auth);
}

/**
 * API rate limit (100 requests per minute)
 */
export async function apiRateLimit(request: NextRequest): Promise<NextResponse | null> {
  return applyRateLimit(request, rateLimitConfigs.api);
}

/**
 * Strict rate limit (3 attempts per minute)
 */
export async function strictRateLimit(request: NextRequest): Promise<NextResponse | null> {
  return applyRateLimit(request, rateLimitConfigs.strict);
}
