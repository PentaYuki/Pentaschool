/**
 * Session Store
 * Redis-backed session management
 */

import { getRedisClient } from './redis';

export interface SessionData {
  userId: string;
  email: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
  sessionId: string;
  createdAt: number;
  lastActivity: number;
  metadata?: Record<string, any>;
}

const SESSION_TTL = 7 * 24 * 60 * 60; // 7 days

/**
 * Create a new session
 */
export async function createSession(data: Partial<SessionData>): Promise<string> {
  const redis = await getRedisClient();
  const sessionId = generateSessionId();

  const session: SessionData = {
    userId: data.userId || '',
    email: data.email || '',
    role: data.role || 'STUDENT',
    sessionId,
    createdAt: Date.now(),
    lastActivity: Date.now(),
    metadata: data.metadata,
  };

  const key = `session:${sessionId}`;
  const userSessionsKey = `sessions:user:${session.userId}`;

  try {
    // Store session
    await redis.set(key, JSON.stringify(session), { EX: SESSION_TTL });

    // Add to user's sessions set
    await redis.sAdd(userSessionsKey, sessionId);
    await redis.expire(userSessionsKey, SESSION_TTL);

    return sessionId;
  } catch (error) {
    console.error('Failed to create session:', error);
    throw error;
  }
}

/**
 * Get session data
 */
export async function getSession(sessionId: string): Promise<SessionData | null> {
  const redis = await getRedisClient();
  const key = `session:${sessionId}`;

  try {
    const data = await redis.get(key);
    if (!data) return null;

    const session = JSON.parse(data) as SessionData;

    // Update last activity
    session.lastActivity = Date.now();
    await redis.set(key, JSON.stringify(session), { EX: SESSION_TTL });

    return session;
  } catch (error) {
    console.error('Failed to get session:', error);
    return null;
  }
}

/**
 * Update session data
 */
export async function updateSession(
  sessionId: string,
  updates: Partial<SessionData>
): Promise<boolean> {
  const redis = await getRedisClient();
  const key = `session:${sessionId}`;

  try {
    const session = await getSession(sessionId);
    if (!session) return false;

    const updated = { ...session, ...updates, lastActivity: Date.now() };
    await redis.set(key, JSON.stringify(updated), { EX: SESSION_TTL });

    return true;
  } catch (error) {
    console.error('Failed to update session:', error);
    return false;
  }
}

/**
 * Delete session
 */
export async function destroySession(sessionId: string): Promise<void> {
  const redis = await getRedisClient();

  try {
    const session = await getSession(sessionId);
    if (session) {
      const userSessionsKey = `sessions:user:${session.userId}`;
      await redis.sRem(userSessionsKey, sessionId);
    }

    const key = `session:${sessionId}`;
    await redis.del(key);
  } catch (error) {
    console.error('Failed to destroy session:', error);
  }
}

/**
 * Get all sessions for a user
 */
export async function getUserSessions(userId: string): Promise<SessionData[]> {
  const redis = await getRedisClient();
  const userSessionsKey = `sessions:user:${userId}`;

  try {
    const sessionIds = await redis.sMembers(userSessionsKey);
    const sessions: SessionData[] = [];

    for (const sessionId of sessionIds) {
      const session = await getSession(sessionId);
      if (session) {
        sessions.push(session);
      }
    }

    return sessions;
  } catch (error) {
    console.error('Failed to get user sessions:', error);
    return [];
  }
}

/**
 * Invalidate all sessions for a user (logout from all devices)
 */
export async function invalidateUserSessions(userId: string): Promise<void> {
  const redis = await getRedisClient();
  const userSessionsKey = `sessions:user:${userId}`;

  try {
    const sessionIds = await redis.sMembers(userSessionsKey);

    for (const sessionId of sessionIds) {
      const key = `session:${sessionId}`;
      await redis.del(key);
    }

    await redis.del(userSessionsKey);
  } catch (error) {
    console.error('Failed to invalidate user sessions:', error);
  }
}

/**
 * Clean up expired sessions (should be run periodically)
 */
export async function cleanupExpiredSessions(): Promise<number> {
  // Redis automatically expires keys, so this is mainly for logging
  console.log('Session cleanup: Redis handles automatic expiration');
  return 0;
}

/**
 * Generate session ID
 */
function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}
