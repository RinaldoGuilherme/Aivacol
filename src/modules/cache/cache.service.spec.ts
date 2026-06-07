import { Redis } from 'ioredis';
import { CacheService } from './cache.service';

describe('CacheService', () => {
  let service: CacheService;
  let client: jest.Mocked<Pick<Redis, 'get' | 'set' | 'del' | 'scan' | 'ping' | 'disconnect'>>;

  beforeEach(() => {
    client = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      scan: jest.fn(),
      ping: jest.fn(),
      disconnect: jest.fn(),
    } as never;
    service = new CacheService(client as unknown as Redis);
  });

  describe('get', () => {
    it('returns the parsed value on a cache HIT', async () => {
      client.get.mockResolvedValue(JSON.stringify({ id: 1, name: 'cached' }));

      const result = await service.get<{ id: number; name: string }>('k');

      expect(result).toEqual({ id: 1, name: 'cached' });
      expect(client.get).toHaveBeenCalledWith('k');
    });

    it('returns null on a cache MISS', async () => {
      client.get.mockResolvedValue(null);

      expect(await service.get('missing')).toBeNull();
    });

    it('returns null when the stored payload is not valid JSON', async () => {
      client.get.mockResolvedValue('{not-json');

      expect(await service.get('broken')).toBeNull();
    });
  });

  describe('set', () => {
    it('stores the JSON-serialized value with a TTL in seconds', async () => {
      client.set.mockResolvedValue('OK');

      await service.set('k', { a: 1 }, 60);

      expect(client.set).toHaveBeenCalledWith('k', JSON.stringify({ a: 1 }), 'EX', 60);
    });
  });

  describe('del', () => {
    it('removes a single key', async () => {
      client.del.mockResolvedValue(1);

      await service.del('k');

      expect(client.del).toHaveBeenCalledWith('k');
    });
  });

  describe('deleteByPattern', () => {
    it('scans every cursor page and deletes all matched keys', async () => {
      client.scan
        .mockResolvedValueOnce(['10', ['vehicles:list:a', 'vehicles:list:b']])
        .mockResolvedValueOnce(['0', ['vehicles:list:c']]);
      client.del.mockResolvedValue(2).mockResolvedValue(1);

      await service.deleteByPattern('vehicles:list:*');

      expect(client.scan).toHaveBeenCalledTimes(2);
      expect(client.scan).toHaveBeenNthCalledWith(1, '0', 'MATCH', 'vehicles:list:*', 'COUNT', 100);
      expect(client.scan).toHaveBeenNthCalledWith(2, '10', 'MATCH', 'vehicles:list:*', 'COUNT', 100);
      expect(client.del).toHaveBeenCalledWith('vehicles:list:a', 'vehicles:list:b');
      expect(client.del).toHaveBeenCalledWith('vehicles:list:c');
    });

    it('does not call del when no keys match', async () => {
      client.scan.mockResolvedValueOnce(['0', []]);

      await service.deleteByPattern('vehicles:list:*');

      expect(client.del).not.toHaveBeenCalled();
    });
  });

  it('ping delegates to the redis client', async () => {
    client.ping.mockResolvedValue('PONG');

    expect(await service.ping()).toBe('PONG');
  });

  it('onModuleDestroy disconnects the client', () => {
    service.onModuleDestroy();

    expect(client.disconnect).toHaveBeenCalledTimes(1);
  });
});
