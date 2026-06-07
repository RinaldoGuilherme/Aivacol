import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly client: Redis) {}

  async ping(): Promise<string> {
    return this.client.ping();
  }

  /**
   * Reads a cached JSON value. Logs a HIT or MISS for the given key. Returns
   * null on miss or if the stored payload cannot be parsed.
   */
  async get<T>(key: string): Promise<T | null> {
    const raw = await this.client.get(key);
    if (raw === null) {
      this.logger.log(`Cache MISS ${key}`);
      return null;
    }
    this.logger.log(`Cache HIT ${key}`);
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  /** Stores a JSON-serialized value with a TTL in seconds. */
  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }

  /** Removes a single key. */
  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  /**
   * Removes every key matching a glob pattern (e.g. `vehicles:list:*`) using a
   * non-blocking SCAN to avoid stalling Redis. Logs a single INVALIDATED line.
   */
  async deleteByPattern(pattern: string): Promise<void> {
    let cursor = '0';
    let removed = 0;
    do {
      const [nextCursor, keys] = await this.client.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100,
      );
      cursor = nextCursor;
      if (keys.length > 0) {
        removed += await this.client.del(...keys);
      }
    } while (cursor !== '0');
    this.logger.log(`Cache INVALIDATED ${pattern} (${removed} keys)`);
  }

  onModuleDestroy(): void {
    this.client.disconnect();
  }
}
