/**
 * BKAM MAD Drift Model — OLS regression of actual BKAM fixing vs basket parity.
 *
 * The theoretical BKAM peg formula: USD/MAD = K / (0.60 × EUR/USD + 0.40)
 * with K ≈ 10.49.
 *
 * "Drift" = (actual BKAM fix − basket parity) in basis points.
 * A positive drift means MAD is weaker than pure basket mechanics would imply.
 *
 * We fit a linear OLS trend over the last 5 working days to detect structural
 * bias or mean-reversion dynamics in BKAM's daily fixing decision.
 */

import { fetchBkamVirementDate, getLastNWorkingDays, virementToMadPerUnit } from './bkamApi';
import { fetchFixingHistory } from './bkamFixing';
import { DEFAULT_BASKET_CONFIG } from '../constants';

const K     = DEFAULT_BASKET_CONFIG.referenceBasketValue;
const EUR_W = DEFAULT_BASKET_CONFIG.eurWeight;
const USD_W = DEFAULT_BASKET_CONFIG.usdWeight;

export interface DriftPoint {
  date: string;
  dateLabel: string;
  actualUsdMad: number;
  basketUsdMad: number;
  driftBps: number;
  eurUsd: number;
  source: 'BKAM_OFFICIAL' | 'ECB_PROXY';
}

export interface DriftRegression {
  points: DriftPoint[];
  alpha: number;           // intercept (bps), drift at day 0
  beta: number;            // slope (bps/day) — positive = widening
  r2: number;              // R² of fit
  stdErrBps: number;       // standard error
  latestDriftBps: number;  // most recent actual drift
  expectedTodayBps: number;// regression extrapolated to today
  trendDir: 'WIDENING' | 'NARROWING' | 'STABLE';
  dataSource: 'BKAM_OFFICIAL' | 'ECB_PROXY' | 'MIXED';
}

// ─── OLS ──────────────────────────────────────────────────────────────────────

function ols(ys: number[]): { alpha: number; beta: number; r2: number; stdErr: number } {
  const n = ys.length;
  if (n < 2) return { alpha: ys[0] ?? 0, beta: 0, r2: 0, stdErr: 0 };

  const xs = ys.map((_, i) => i);
  const xBar = (n - 1) / 2;
  const yBar = ys.reduce((s, y) => s + y, 0) / n;

  let sxy = 0, sxx = 0;
  for (let i = 0; i < n; i++) {
    sxy += (xs[i] - xBar) * (ys[i] - yBar);
    sxx += (xs[i] - xBar) ** 2;
  }

  const beta  = sxx !== 0 ? sxy / sxx : 0;
  const alpha = yBar - beta * xBar;

  let ssRes = 0, ssTot = 0;
  for (let i = 0; i < n; i++) {
    ssRes += (ys[i] - (alpha + beta * xs[i])) ** 2;
    ssTot += (ys[i] - yBar) ** 2;
  }

  const r2     = ssTot > 1e-10 ? Math.max(0, 1 - ssRes / ssTot) : 0;
  const stdErr = n > 2 ? Math.sqrt(ssRes / (n - 2)) : 0;

  return { alpha, beta, r2, stdErr };
}

// ─── Date label ───────────────────────────────────────────────────────────────

const FR_DAYS   = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const FR_MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

function labelDate(iso: string): string {
  const d = new Date(iso + 'T12:00:00Z');
  return `${FR_DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${FR_MONTHS[d.getUTCMonth()]}`;
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Fetch last N working days of BKAM fixings and compute the OLS drift model.
 *
 * Primary: tries BKAM CoursVirement (official fixings via CORS proxy).
 * Fallback: uses Frankfurter/ECB time series (computed basket proxy).
 */
export async function computeDriftModel(
  nDays = 5,
  corsProxyUrl?: string,
): Promise<DriftRegression> {
  const points: DriftPoint[] = [];
  let dataSource: DriftRegression['dataSource'] = 'BKAM_OFFICIAL';

  // ── Try BKAM official history ───────────────────────────────────────────────
  //
  // FX QUANT NOTE — why ECB EUR/USD must be the exogenous basket input:
  //
  // The basket formula is: USD/MAD = K / (0.60 × EUR/USD + 0.40)
  //
  // If we derive EUR/USD from BKAM's OWN cross-rates (EUR/MAD ÷ USD/MAD),
  // substituting back into the basket formula gives:
  //   basket = K / (0.60 × (EUR/MAD÷USD/MAD) + 0.40)
  //   drift  = USD/MAD − basket ≈ 0  (algebraically circular → always near-zero)
  //
  // The correct approach: use ECB Frankfurter EUR/USD as the EXOGENOUS market
  // rate, then compute the basket parity and measure BKAM's deviation from it.
  // This captures BKAM's actual discretionary component (reference EUR/USD choice,
  // intraday smoothing, intervention within the ±5% band).
  // Typical range: ±5 to ±50 bps — small but non-zero and directionally meaningful.
  //
  if (corsProxyUrl) {
    const workingDays = getLastNWorkingDays(nDays);

    // Fetch BKAM and ECB data in parallel for each date
    const [bkamSettled, ecbSettled] = await Promise.all([
      Promise.allSettled(workingDays.map(d => fetchBkamVirementDate(corsProxyUrl, d))),
      Promise.allSettled(workingDays.map(d =>
        fetch(`https://api.frankfurter.app/${d}?from=EUR&to=USD`, {
          signal: AbortSignal.timeout(6_000),
        })
          .then(r => r.json())
          .then((data: { rates?: Record<string, number> }) => data.rates?.['USD'] ?? null)
          .catch(() => null)
      )),
    ]);

    for (let i = 0; i < bkamSettled.length; i++) {
      const bkamResult = bkamSettled[i];
      if (bkamResult.status !== 'fulfilled' || !bkamResult.value.length) continue;

      const madMap = virementToMadPerUnit(bkamResult.value);
      const usdMad = madMap['USD'];
      const eurMad = madMap['EUR'];
      if (!usdMad || !eurMad) continue;

      // ECB EUR/USD: exogenous market reference for basket parity.
      // Fall back to BKAM-implied cross only if ECB fetch failed.
      const ecbResult = ecbSettled[i];
      const ecbEurUsd = ecbResult.status === 'fulfilled' ? ecbResult.value : null;
      const eurUsd = ecbEurUsd ?? (eurMad / usdMad); // ECB preferred; BKAM cross as last resort

      // Non-circular basket parity: uses ECB EUR/USD, not BKAM cross-rate
      const basketUsdMad = K / (EUR_W * eurUsd + USD_W);

      // Drift = BKAM_actual − ECB_basket (captures BKAM's discretionary component)
      const driftBps = ((usdMad - basketUsdMad) / basketUsdMad) * 10_000;

      points.push({
        date:          workingDays[i],
        dateLabel:     labelDate(workingDays[i]),
        actualUsdMad:  +usdMad.toFixed(4),
        basketUsdMad:  +basketUsdMad.toFixed(4),
        driftBps:      +driftBps.toFixed(2),
        eurUsd:        +eurUsd.toFixed(4), // ECB EUR/USD stored (not BKAM cross)
        source: 'BKAM_OFFICIAL',
      });
    }
  }

  // ── Fallback: Frankfurter/ECB history ──────────────────────────────────────
  if (points.length < 2) {
    dataSource = points.length === 0 ? 'ECB_PROXY' : 'MIXED';
    const history = await fetchFixingHistory(nDays);

    for (const row of history) {
      // Only add if we don't already have this date from BKAM
      if (points.find(p => p.date === row.date)) continue;

      points.push({
        date:       row.date,
        dateLabel:  row.dateLabel,
        actualUsdMad:  row.usdMad_ecb,
        basketUsdMad:  row.usdMad_basket,
        driftBps:       row.usdMad_div_bps,
        eurUsd:         row.eurUsd,
        source: 'ECB_PROXY',
      });
    }
  } else if (points.some(p => p.source !== 'BKAM_OFFICIAL')) {
    dataSource = 'MIXED';
  }

  // Sort chronologically
  points.sort((a, b) => a.date.localeCompare(b.date));

  if (points.length === 0) {
    return {
      points: [],
      alpha: 0, beta: 0, r2: 0, stdErrBps: 0,
      latestDriftBps: 0, expectedTodayBps: 0,
      trendDir: 'STABLE', dataSource: 'ECB_PROXY',
    };
  }

  const driftSeries = points.map(p => p.driftBps);
  const { alpha, beta, r2, stdErr } = ols(driftSeries);

  const latestDriftBps   = driftSeries[driftSeries.length - 1];
  const expectedTodayBps = alpha + beta * (points.length);  // one step ahead

  const STABLE_THRESHOLD_BPS = 0.5;
  const trendDir: DriftRegression['trendDir'] =
    Math.abs(beta) < STABLE_THRESHOLD_BPS ? 'STABLE'
    : beta > 0 ? 'WIDENING' : 'NARROWING';

  return {
    points,
    alpha: +alpha.toFixed(3),
    beta:  +beta.toFixed(3),
    r2:    +r2.toFixed(3),
    stdErrBps: +stdErr.toFixed(3),
    latestDriftBps: +latestDriftBps.toFixed(2),
    expectedTodayBps: +expectedTodayBps.toFixed(2),
    trendDir,
    dataSource,
  };
}
