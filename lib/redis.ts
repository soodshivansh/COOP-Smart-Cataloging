import { Redis } from '@upstash/redis';
import crypto from 'crypto';

// Initialize Redis client
const redis = process.env.REDIS_URL
  ? new Redis({
      url: process.env.REDIS_URL,
      token: process.env.REDIS_TOKEN || '',
    })
  : null;

// Cache utility functions
export class CacheService {
  private static TTL_30_DAYS = 30 * 24 * 60 * 60; // 30 days in seconds
  private static TTL_5_MINUTES = 5 * 60; // 5 minutes in seconds

  /**
   * Generate cache key using SHA-256 hash
   */
  static generateCacheKey(data: string | Buffer): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Get value from cache
   */
  static async get<T>(key: string): Promise<T | null> {
    if (!redis) return null;
    
    try {
      const value = await redis.get(key);
      return value as T | null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  static async set(key: string, value: any, ttl: number = this.TTL_30_DAYS): Promise<void> {
    if (!redis) return;
    
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  /**
   * Delete value from cache
   */
  static async delete(key: string): Promise<void> {
    if (!redis) return;
    
    try {
      await redis.del(key);
    } catch (error) {
      console.error('Redis delete error:', error);
    }
  }

  /**
   * Check if key exists in cache
   */
  static async exists(key: string): Promise<boolean> {
    if (!redis) return false;
    
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  }

  /**
   * Set value with expiration time
   */
  static async setWithExpiry(key: string, value: any, expiresAt: Date): Promise<void> {
    if (!redis) return;
    
    try {
      const ttl = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
      if (ttl > 0) {
        await redis.setex(key, ttl, JSON.stringify(value));
      }
    } catch (error) {
      console.error('Redis setWithExpiry error:', error);
    }
  }

  /**
   * Get TTL for search results (5 minutes)
   */
  static get SEARCH_TTL(): number {
    return this.TTL_5_MINUTES;
  }

  /**
   * Get TTL for AI analysis results (30 days)
   */
  static get AI_ANALYSIS_TTL(): number {
    return this.TTL_30_DAYS;
  }
}

export default redis;
