import { useState, useEffect, useCallback } from 'react';

export function useSessionState<T>(key: string, initialValue: T): [T, (v: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = sessionStorage.getItem(key);
      return stored !== null ? (JSON.parse(stored) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const set = useCallback((v: T | ((prev: T) => T)) => {
    setState(prev => {
      const next = typeof v === 'function' ? (v as (p: T) => T)(prev) : v;
      try { sessionStorage.setItem(key, JSON.stringify(next)); } catch { /* quota */ }
      return next;
    });
  }, [key]);

  return [state, set];
}
