import { useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'jad2fx_watchlist_v1';
const MAX_ITEMS = 12;

export interface WatchlistItem {
  code: string;
  addedAt: string; // ISO
  /** Optional alert thresholds */
  alertAbove?: number;
  alertBelow?: number;
}

interface WatchlistState {
  items: WatchlistItem[];
  hasLoaded: boolean;
}

/**
 * P2.4 — Persistent Watchlist
 * localStorage-backed; syncs across tabs via storage event.
 * Bounded at MAX_ITEMS to prevent unbounded growth.
 */
export function useWatchlist() {
  const [state, setState] = useState<WatchlistState>({ items: [], hasLoaded: false });

  // Load on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const items = JSON.parse(raw) as WatchlistItem[];
        if (Array.isArray(items)) {
          setState({ items: items.slice(0, MAX_ITEMS), hasLoaded: true });
          return;
        }
      }
    } catch { /* ignore */ }
    // Default: EUR, USD, GBP (the G3 for any Moroccan corporate)
    setState({
      items: [
        { code: 'EUR', addedAt: new Date().toISOString() },
        { code: 'USD', addedAt: new Date().toISOString() },
        { code: 'GBP', addedAt: new Date().toISOString() },
      ],
      hasLoaded: true,
    });
  }, []);

  // Sync to storage
  useEffect(() => {
    if (!state.hasLoaded) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items)); } catch { /* ignore */ }
  }, [state.items, state.hasLoaded]);

  // Cross-tab sync
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const items = JSON.parse(e.newValue) as WatchlistItem[];
          setState({ items, hasLoaded: true });
        } catch { /* ignore */ }
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const add = useCallback((code: string) => {
    setState((s) => {
      if (s.items.some((i) => i.code === code)) return s;
      if (s.items.length >= MAX_ITEMS) {
        console.warn(`[Watchlist] max ${MAX_ITEMS} items`);
        return s;
      }
      return { ...s, items: [...s.items, { code, addedAt: new Date().toISOString() }] };
    });
  }, []);

  const remove = useCallback((code: string) => {
    setState((s) => ({ ...s, items: s.items.filter((i) => i.code !== code) }));
  }, []);

  const reorder = useCallback((fromIdx: number, toIdx: number) => {
    setState((s) => {
      if (fromIdx < 0 || toIdx < 0 || fromIdx >= s.items.length || toIdx >= s.items.length) return s;
      const next = [...s.items];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return { ...s, items: next };
    });
  }, []);

  const setAlert = useCallback((code: string, above?: number, below?: number) => {
    setState((s) => ({
      ...s,
      items: s.items.map((i) => (i.code === code ? { ...i, alertAbove: above, alertBelow: below } : i)),
    }));
  }, []);

  const has = useCallback((code: string) => state.items.some((i) => i.code === code), [state.items]);

  return { items: state.items, add, remove, reorder, setAlert, has, hasLoaded: state.hasLoaded, max: MAX_ITEMS };
}
