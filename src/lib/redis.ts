/**
 * Redis Connection Manager
 * Supports both local Redis (dev) and Upstash Redis (Vercel)
 */

import { createClient } from 'redis';

export interface RedisClientType {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { EX?: number }): Promise<string | null>;
  del(...keys: string[]): Promise<number>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  ttl(key: string): Promise<number>;
  flushAll(): Promise<string>;
}

let redisClient: ReturnType<typeof createClient> | null = null;
let isConnecting = false;

async function getRedisClient() {
  if (redisClient) {
    return redisClient;
  }

  if (isConnecting) {
    // Wait for connection to complete
    let attempts = 0;
    while (!redisClient && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    if (!redisClient) throw new Error('Redis connection timeout');
    return redisClient;
  }

  isConnecting = true;

  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    redisClient = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('Redis max retries exceeded');
            return new Error('Max retries exceeded');
          }
          return retries * 100;
        },
      },
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected');
    });

    redisClient.on('ready', () => {
      console.log('✅ Redis ready');
    });

    redisClient.on('reconnecting', () => {
      console.log('⚠️ Redis reconnecting...');
    });

    await redisClient.connect();
    isConnecting = false;
    return redisClient;
  } catch (error) {
    isConnecting = false;
    console.error('Failed to connect to Redis:', error);
    throw error;
  }
}

async function closeRedisClient() {
  if (redisClient) {
    await redisClient.disconnect();
    redisClient = null;
  }
}

// Note: Graceful shutdown is not needed on Vercel (Edge Runtime)
// Each function is independent and connections are closed automatically

export { getRedisClient, closeRedisClient };
