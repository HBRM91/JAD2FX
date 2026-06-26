/**
 * Drift History Service
 *
 * Correct methodology (per BKAM Doc 1 §I and confirmed by user):
 *   1. ECB EUR/USD at BKAM fixing time (~15:30 Casablanca = ~14:30 UTC;
 *      ECB official rate published 16:00 CET ≈ 15:00 UTC — closest available proxy)
 *   2. Theoretical basket: USD/MAD_théorique = K / (0.60 × EUR/USD_ECB + 0.40)
 *   3. Drift = (USD/MAD_BKAM_published − USD/MAD_théorique) / USD/MAD_théorique × 10 000 bps
 *      Positive = MAD weaker than basket; Negative = MAD stronger than basket.
 *
 * Data is stored daily in Cloudflare KV by the cron handler and served here.
 */

export interface DriftHistoryPoint {
  date: string;
  actualUsdMad: number;
  actualEurMad: number | null;
  basketUsdMad: number;
  driftBps: number;
  eurUsd: number;
  bandPct: number;
  bandUtilPct: number;
  source: 'BKAM_OFFICIAL' | 'ECB_PROXY';
}

export interface BandAlert {
  detectedAt: string;
  avgBandUtilPct: number;
  maxAbsDriftBps: number;
  currentBandPct: number;
  severity: 'HIGH' | 'MEDIUM';
  message: string;
}

export interface DriftHistoryResponse {
  points: DriftHistoryPoint[];
  bandPct: number;
  alert: BandAlert | null;
  phase: string;
}

let _historyCache: Map<number, { data: DriftHistoryResponse; ts: number }> = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 min — history doesn't change intraday

export async function fetchDriftHistory(
  corsProxyUrl: string,
  days: number = 30,
): Promise<DriftHistoryResponse> {
  const cached = _historyCache.get(days);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.data;

  const base = corsProxyUrl.replace(/\/$/, '');
  const res = await fetch(`${base}/api/drift/history?days=${days}`, {
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) throw new Error(`Drift history HTTP ${res.status}`);
  const data = await res.json() as DriftHistoryResponse;
  _historyCache.set(days, { data, ts: Date.now() });
  return data;
}

export async function fetchBandConfig(corsProxyUrl: string): Promise<{
  bandPct: number; phase: string; alert: BandAlert | null; updatedAt: string | null;
}> {
  const base = corsProxyUrl.replace(/\/$/, '');
  const res = await fetch(`${base}/api/band-config`, { signal: AbortSignal.timeout(6_000) });
  if (!res.ok) return { bandPct: 0.05, phase: 'Phase II', alert: null, updatedAt: null };
  return res.json();
}

/** Compute rolling statistics over a drift history array. */
export function driftStats(points: DriftHistoryPoint[]) {
  if (!points.length) return null;
  const drifts = points.map(p => p.driftBps);
  const utils  = points.map(p => p.bandUtilPct);
  const n = drifts.length;
  const mean = drifts.reduce((s, v) => s + v, 0) / n;
  const variance = drifts.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  const stdDev = Math.sqrt(variance);
  return {
    mean:    +mean.toFixed(2),
    stdDev:  +stdDev.toFixed(2),
    min:     +Math.min(...drifts).toFixed(2),
    max:     +Math.max(...drifts).toFixed(2),
    latest:  drifts[drifts.length - 1],
    avgBandUtil: +(utils.reduce((s, v) => s + v, 0) / n).toFixed(1),
    latestBandUtil: utils[utils.length - 1],
    positiveCount: drifts.filter(v => v > 0).length,
    negativeCount: drifts.filter(v => v < 0).length,
  };
}
