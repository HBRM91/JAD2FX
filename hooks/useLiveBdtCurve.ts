/**
 * Hook: useLiveBdtCurve
 *
 * Fetches the live BKAM BDT (Bons de Trésor) yield curve from the worker.
 * Returns the curve as `curveOverrides`-compatible map: { '3M': 0.0325, ... }
 * as decimals.
 *
 * P1.1: replaces the hardcoded MAD curve with real BDT data fetched via worker.
 * The worker cron refreshes it at 09:00 Morocco time every business day.
 */

import { useEffect, useState } from 'react';
import { fetchLiveBdtCurve, bdtToYieldCurveOverrides } from '../services/bkamApi';

export interface BdtState {
  overrides: Record<string, number>;
  loading: boolean;
  error: string | null;
  fetchedAt: string | null;
  stale: boolean;
}

export function useLiveBdtCurve(corsProxyUrl: string | undefined): BdtState {
  const [state, setState] = useState<BdtState>({
    overrides: {},
    loading: true,
    error: null,
    fetchedAt: null,
    stale: false,
  });

  useEffect(() => {
    if (!corsProxyUrl) {
      setState((s) => ({ ...s, loading: false, error: 'No proxy configured' }));
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const live = await fetchLiveBdtCurve(corsProxyUrl);
        if (cancelled) return;
        if (live && live.points?.length) {
          setState({
            overrides: bdtToYieldCurveOverrides(live.points),
            loading: false,
            error: null,
            fetchedAt: live.fetchedAt,
            stale: !!live.stale,
          });
        } else {
          setState((s) => ({ ...s, loading: false, error: 'No BDT data available' }));
        }
      } catch (err) {
        if (cancelled) return;
        setState({
          overrides: {},
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to load BDT',
          fetchedAt: null,
          stale: false,
        });
      }
    })();
    return () => { cancelled = true; };
  }, [corsProxyUrl]);

  return state;
}
