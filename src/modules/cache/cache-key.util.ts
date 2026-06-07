import { createHash } from 'crypto';

/**
 * Builds a deterministic hash from a filters object. Keys are sorted and
 * undefined values are dropped so that the query-string order never produces a
 * different cache key (e.g. `?brandId=1&page=1` === `?page=1&brandId=1`).
 */
export function hashFilters(filters: Record<string, unknown>): string {
  const normalized = Object.keys(filters)
    .filter((key) => filters[key] !== undefined && filters[key] !== null)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = filters[key];
      return acc;
    }, {});

  return createHash('sha1')
    .update(JSON.stringify(normalized))
    .digest('hex');
}
