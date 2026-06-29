/**
 * Tiny LRU cache with optional TTL. Used for module-level rate caches
 * (fxRates.ts, bkamApi.ts) to prevent unbounded growth in long sessions.
 */

export interface LruOptions<V> {
  /** Maximum number of entries. Oldest is evicted when exceeded. Default 50. */
  maxSize?: number;
  /** Time-to-live in ms. Entries older than this are considered stale. Default 5 min. */
  ttlMs?: number;
}

export class LruCache<K, V> {
  private readonly maxSize: number;
  private readonly ttlMs: number;
  private readonly map = new Map<K, { value: V; ts: number }>();

  constructor(opts: LruOptions<V> = {}) {
    this.maxSize = opts.maxSize ?? 50;
    this.ttlMs = opts.ttlMs ?? 5 * 60 * 1000;
  }

  get(key: K): V | undefined {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    if (Date.now() - entry.ts > this.ttlMs) {
      this.map.delete(key);
      return undefined;
    }
    // Refresh recency for LRU semantics
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }

  set(key: K, value: V): void {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, { value, ts: Date.now() });
    while (this.map.size > this.maxSize) {
      const oldest = this.map.keys().next().value;
      if (oldest === undefined) break;
      this.map.delete(oldest);
    }
  }

  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: K): boolean {
    return this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
  }

  get size(): number {
    return this.map.size;
  }

  /** Iterate over live (non-stale) entries, oldest first. */
  *entries(): IterableIterator<[K, V]> {
    const now = Date.now();
    for (const [k, e] of this.map) {
      if (now - e.ts <= this.ttlMs) yield [k, e.value];
    }
  }
}
