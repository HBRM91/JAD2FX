import { describe, it, expect, vi } from 'vitest';
import { LruCache } from '../../utils/lruCache';

describe('LruCache (P0.15)', () => {
  it('get returns undefined for missing key', () => {
    const c = new LruCache<string, number>();
    expect(c.get('nope')).toBeUndefined();
  });

  it('set then get', () => {
    const c = new LruCache<string, number>();
    c.set('a', 1);
    expect(c.get('a')).toBe(1);
  });

  it('overwrite on duplicate key', () => {
    const c = new LruCache<string, number>();
    c.set('a', 1);
    c.set('a', 2);
    expect(c.get('a')).toBe(2);
    expect(c.size).toBe(1);
  });

  it('evicts oldest when over maxSize', () => {
    const c = new LruCache<string, number>({ maxSize: 3 });
    c.set('a', 1);
    c.set('b', 2);
    c.set('c', 3);
    c.set('d', 4); // evicts 'a'
    expect(c.get('a')).toBeUndefined();
    expect(c.get('b')).toBe(2);
    expect(c.get('c')).toBe(3);
    expect(c.get('d')).toBe(4);
  });

  it('get refreshes recency (LRU)', () => {
    const c = new LruCache<string, number>({ maxSize: 3 });
    c.set('a', 1);
    c.set('b', 2);
    c.set('c', 3);
    c.get('a'); // refresh 'a' to most recent
    c.set('d', 4); // evicts 'b' (now oldest)
    expect(c.get('a')).toBe(1);
    expect(c.get('b')).toBeUndefined();
    expect(c.get('c')).toBe(3);
    expect(c.get('d')).toBe(4);
  });

  it('TTL expires entries', () => {
    const c = new LruCache<string, number>({ maxSize: 10, ttlMs: 50 });
    c.set('a', 1);
    expect(c.get('a')).toBe(1);
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(c.get('a')).toBeUndefined();
        resolve();
      }, 80);
    });
  });

  it('has returns true for present, false after delete', () => {
    const c = new LruCache<string, number>();
    c.set('a', 1);
    expect(c.has('a')).toBe(true);
    c.delete('a');
    expect(c.has('a')).toBe(false);
  });

  it('clear empties the cache', () => {
    const c = new LruCache<string, number>();
    c.set('a', 1);
    c.set('b', 2);
    c.clear();
    expect(c.size).toBe(0);
  });
});

describe('fetchIntradayTicks graceful degradation (P0.8)', () => {
  it('returns empty + message when no proxy configured', async () => {
    const { fetchIntradayTicks } = await import('../../services/intraday');
    const r = await fetchIntradayTicks('', 'EURMAD=X');
    expect(r.points).toEqual([]);
    expect(r.dataSource).toBe('END_OF_DAY');
    expect(r.message).toBeTruthy();
  });

  it('returns empty + message on HTTP error', async () => {
    const { fetchIntradayTicks } = await import('../../services/intraday');
    // Use a definitely-unroutable URL
    const r = await fetchIntradayTicks('http://localhost:1', 'EURMAD=X');
    expect(r.points).toEqual([]);
    expect(r.dataSource).toBe('END_OF_DAY');
  });
});

describe('getYahooSymbol (P0.8 mapping)', () => {
  it('returns Yahoo symbol for BKAM-quoted currencies', async () => {
    const { getYahooSymbol } = await import('../../services/intraday');
    expect(getYahooSymbol('EUR')).toBe('EURMAD=X');
    expect(getYahooSymbol('USD')).toBe('USDMAD=X');
    expect(getYahooSymbol('JPY')).toBe('JPYMAD=X');
    expect(getYahooSymbol('GBP')).toBe('GBPMAD=X');
  });

  it('returns null for unknown currency', async () => {
    const { getYahooSymbol } = await import('../../services/intraday');
    expect(getYahooSymbol('XYZ')).toBeNull();
  });
});

describe('generateIntradayData is deprecated (P0.8)', () => {
  it('returns empty array and warns (sine wave removed)', async () => {
    const { generateIntradayData } = await import('../../services/fxRates');
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const data = generateIntradayData(10, 'EUR/MAD');
    expect(data).toEqual([]);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
