import crypto from 'crypto';

// Redis removed - CacheService is a no-op stub
export class CacheService {
  static generateCacheKey(data: string | Buffer): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  static async get<T>(_key: string): Promise<T | null> {
    return null;
  }

  static async set(_key: string, _value: any, _ttl?: number): Promise<void> {}

  static async delete(_key: string): Promise<void> {}

  static async exists(_key: string): Promise<boolean> {
    return false;
  }

  static get SEARCH_TTL(): number { return 0; }
  static get AI_ANALYSIS_TTL(): number { return 0; }
}

export default null;
