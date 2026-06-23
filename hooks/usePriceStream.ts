import { useEffect, useRef, useState, useCallback } from 'react';
import { LivePriceEntry } from '../types';
import { fetchAllMadRates } from '../services/fxRates';
import { DEFAULT_BASKET_CONFIG, BKAM_CURRENCIES } from '../constants';
import { AdminConfig } from '../types';

// Per-currency dealer spread halves (pips) for bid/ask around mid
const DEFAULT_SPREAD_PIPS: Record<string, number> = {
  EUR: 8, USD: 6, GBP: 10, CHF: 7, JPY: 6,
  CAD: 8, SAR: 3, AED: 3, KWD: 4, QAR: 3,
  DKK: 9, NOK: 10, SEK: 10, CNY: 11,
};

// Deterministic micro-movement: σ ≈ 0.15% intraday, applied each tick
function microMove(mid: number, currency: string, tick: number): number {
  const seed = currency.charCodeAt(0) + currency.charCodeAt(1) + tick;
  const noise = (Math.sin(seed * 1.618 + tick * 0.7) * 0.0015 * mid);
  return mid + noise;
}

export interface StreamState {
  prices: LivePriceEntry[];
  countdown: number;        // seconds until next API fetch
  isRefreshing: boolean;
  lastRefresh: string | null;
  tickCount: number;
  refresh: () => void;
}

export function usePriceStream(adminConfig: AdminConfig): StreamState {
  const [prices, setPrices]       = useState<LivePriceEntry[]>([]);
  const [countdown, setCountdown] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh]   = useState<string | null>(null);
  const [tickCount, setTickCount]       = useState(0);

  const prevMidRef      = useRef<Record<string, number>>({});
  const tickRef         = useRef(0);
  const intervalMs      = Math.max(30_000, adminConfig.refreshIntervalMs);
  const countdownRef    = useRef(intervalMs / 1000);

  const buildBasketConfig = useCallback(() => {
    const cfg = {
      ...DEFAULT_BASKET_CONFIG,
      virementSpreadPercent: adminConfig.virementSpreadPct,
      billetSpreadPercent:   adminConfig.billetSpreadPct,
      spreadPercent:         adminConfig.virementSpreadPct,
    };
    return cfg;
  }, [adminConfig.virementSpreadPct, adminConfig.billetSpreadPct]);

  const doFetch = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const { rates } = await fetchAllMadRates(buildBasketConfig());

      const entries: LivePriceEntry[] = rates.map(rate => {
        const adminMid = adminConfig.spotOverrides[rate.currency];
        const rawMid   = adminMid !== undefined ? adminMid : rate.mid;
        const tick     = tickRef.current;
        const liveAdjMid = microMove(rawMid, rate.currency, tick);

        const halfSpreadPips = (adminConfig.dealerSpreadPips?.[rate.currency] ?? DEFAULT_SPREAD_PIPS[rate.currency] ?? 8) / 2;
        const halfSpreadMAD  = halfSpreadPips / 10_000 * (rate.currency === 'JPY' ? 100 : 1);

        const bid = +(liveAdjMid - halfSpreadMAD).toFixed(4);
        const ask = +(liveAdjMid + halfSpreadMAD).toFixed(4);
        const mid = +(liveAdjMid).toFixed(4);

        const prevMid      = prevMidRef.current[rate.currency] ?? mid;
        const change       = +(mid - prevMid).toFixed(4);
        const changePercent = prevMid !== 0 ? +((change / prevMid) * 100).toFixed(4) : 0;
        const spreadPips   = +((ask - bid) * 10_000).toFixed(1);

        prevMidRef.current[rate.currency] = mid;

        return {
          currency: rate.currency,
          pair: rate.pair,
          bid, ask, mid,
          prevMid,
          change,
          changePercent,
          spreadPips,
          lastUpdated: new Date().toISOString(),
        };
      });

      setPrices(entries);
      setLastRefresh(new Date().toISOString());
      setTickCount(c => c + 1);
      tickRef.current++;
      countdownRef.current = intervalMs / 1000;
    } finally {
      setIsRefreshing(false);
    }
  }, [buildBasketConfig, adminConfig.spotOverrides, adminConfig.dealerSpreadPips, intervalMs]);

  // Initial fetch
  useEffect(() => {
    doFetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Periodic API refetch
  useEffect(() => {
    const id = setInterval(doFetch, intervalMs);
    return () => clearInterval(id);
  }, [doFetch, intervalMs]);

  // Countdown ticker (1 Hz)
  useEffect(() => {
    countdownRef.current = intervalMs / 1000;
    const id = setInterval(() => {
      countdownRef.current = Math.max(0, countdownRef.current - 1);
      setCountdown(Math.ceil(countdownRef.current));
    }, 1000);
    return () => clearInterval(id);
  }, [intervalMs]);

  return { prices, countdown, isRefreshing, lastRefresh, tickCount, refresh: doFetch };
}
