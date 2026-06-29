/**
 * Yield curve data and cubic-spline interpolation for FX forward pricing.
 *
 * MAD curve sourced from BKAM T-bills (BDT) and government bonds (OAT).
 * International curves sourced from ECB, Fed, BOE, SNB, BOJ, BOC fixings.
 * Gulf curves from SAIBOR (SAR), EIBOR (AED), KIBOR (KWD), QIBOR (QAR).
 *
 * All rates stored as decimals (0.035 = 3.5 %).
 */

import { YieldCurvePoint, YieldCurveSnapshot } from '../types';

// ─── Tenor ↔ Year Conversions ─────────────────────────────────────────────────
export const TENOR_YEARS: Record<string, number> = {
  ON:  1 / 365,
  TN:  2 / 365,
  SW:  7 / 365,
  '1W':  7 / 365,
  '2W': 14 / 365,
  '1M': 30 / 365,
  '2M': 60 / 365,
  '3M': 91 / 365,
  '6M': 182 / 365,
  '9M': 273 / 365,
  '1Y': 1.0,
  '2Y': 2.0,
  '3Y': 3.0,
  '5Y': 5.0,
  '7Y': 7.0,
  '10Y': 10.0,
  '15Y': 15.0,
  '20Y': 20.0,
  '30Y': 30.0,
};

export const FORWARD_TENORS = ['ON', 'TN', 'SW', '1M', '2M', '3M', '6M', '9M', '1Y', '2Y', '3Y', '5Y'] as const;

export function tenorToDays(tenor: string): number {
  const y = TENOR_YEARS[tenor] ?? 0;
  return Math.round(y * 365);
}

export function daysToYears(days: number): number {
  return days / 365;
}

// ─── Default Yield Curves ─────────────────────────────────────────────────────
// MAD: BKAM policy rate 2.75%; T-bills (BDT 13W/26W/52W); OAT government bonds
const MAD: YieldCurvePoint[] = [
  { tenor: 'ON',  tenorYears: 1 / 365,  rate: 0.0280 },
  { tenor: 'SW',  tenorYears: 7 / 365,  rate: 0.0285 },
  { tenor: '1M',  tenorYears: 30 / 365, rate: 0.0300 },
  { tenor: '2M',  tenorYears: 60 / 365, rate: 0.0315 },
  { tenor: '3M',  tenorYears: 91 / 365, rate: 0.0325 },
  { tenor: '6M',  tenorYears: 182 / 365,rate: 0.0335 },
  { tenor: '1Y',  tenorYears: 1.0,      rate: 0.0350 },
  { tenor: '2Y',  tenorYears: 2.0,      rate: 0.0375 },
  { tenor: '3Y',  tenorYears: 3.0,      rate: 0.0400 },
  { tenor: '5Y',  tenorYears: 5.0,      rate: 0.0420 },
  { tenor: '7Y',  tenorYears: 7.0,      rate: 0.0435 },
  { tenor: '10Y', tenorYears: 10.0,     rate: 0.0450 },
  { tenor: '15Y', tenorYears: 15.0,     rate: 0.0465 },
  { tenor: '20Y', tenorYears: 20.0,     rate: 0.0475 },
];

// EUR: ECB deposit rate 2.25% (June 2026, 9 cuts from 4.00% peak) — €STR ≈ 2.15%
const EUR: YieldCurvePoint[] = [
  { tenor: 'ON',  tenorYears: 1 / 365,  rate: 0.0215 },
  { tenor: '1M',  tenorYears: 30 / 365, rate: 0.0218 },
  { tenor: '3M',  tenorYears: 91 / 365, rate: 0.0222 },
  { tenor: '6M',  tenorYears: 182 / 365,rate: 0.0220 },
  { tenor: '1Y',  tenorYears: 1.0,      rate: 0.0215 },
  { tenor: '2Y',  tenorYears: 2.0,      rate: 0.0225 },
  { tenor: '5Y',  tenorYears: 5.0,      rate: 0.0250 },
  { tenor: '10Y', tenorYears: 10.0,     rate: 0.0275 },
];

// USD: SOFR ≈ 4.33% (Fed funds 4.25-4.50%, June 2026 — 3 cuts from 5.33% peak)
const USD: YieldCurvePoint[] = [
  { tenor: 'ON',  tenorYears: 1 / 365,  rate: 0.0433 },
  { tenor: '1M',  tenorYears: 30 / 365, rate: 0.0430 },
  { tenor: '3M',  tenorYears: 91 / 365, rate: 0.0425 },
  { tenor: '6M',  tenorYears: 182 / 365,rate: 0.0415 },
  { tenor: '1Y',  tenorYears: 1.0,      rate: 0.0400 },
  { tenor: '2Y',  tenorYears: 2.0,      rate: 0.0405 },
  { tenor: '5Y',  tenorYears: 5.0,      rate: 0.0425 },
  { tenor: '10Y', tenorYears: 10.0,     rate: 0.0440 },
];

// GBP: SONIA ≈ 4.20% (BOE base rate 4.25%, June 2026 — 5 cuts from 5.25% peak)
const GBP: YieldCurvePoint[] = [
  { tenor: 'ON',  tenorYears: 1 / 365,  rate: 0.0420 },
  { tenor: '1M',  tenorYears: 30 / 365, rate: 0.0418 },
  { tenor: '3M',  tenorYears: 91 / 365, rate: 0.0412 },
  { tenor: '6M',  tenorYears: 182 / 365,rate: 0.0400 },
  { tenor: '1Y',  tenorYears: 1.0,      rate: 0.0385 },
  { tenor: '2Y',  tenorYears: 2.0,      rate: 0.0375 },
  { tenor: '5Y',  tenorYears: 5.0,      rate: 0.0370 },
  { tenor: '10Y', tenorYears: 10.0,     rate: 0.0380 },
];

// CHF: SARON ≈ 0.25% (SNB cut 4 times to 0.25%, June 2026 — from 1.75% peak)
const CHF: YieldCurvePoint[] = [
  { tenor: 'ON',  tenorYears: 1 / 365,  rate: 0.0025 },
  { tenor: '1M',  tenorYears: 30 / 365, rate: 0.0022 },
  { tenor: '3M',  tenorYears: 91 / 365, rate: 0.0020 },
  { tenor: '6M',  tenorYears: 182 / 365,rate: 0.0022 },
  { tenor: '1Y',  tenorYears: 1.0,      rate: 0.0028 },
  { tenor: '2Y',  tenorYears: 2.0,      rate: 0.0040 },
  { tenor: '5Y',  tenorYears: 5.0,      rate: 0.0058 },
  { tenor: '10Y', tenorYears: 10.0,     rate: 0.0068 },
];

// JPY: TONA ≈ 0.50% (BOJ hiked to 0.50% in Jan 2025, held since — YCC abandoned)
const JPY: YieldCurvePoint[] = [
  { tenor: 'ON',  tenorYears: 1 / 365,  rate: 0.0050 },
  { tenor: '1M',  tenorYears: 30 / 365, rate: 0.0050 },
  { tenor: '3M',  tenorYears: 91 / 365, rate: 0.0055 },
  { tenor: '6M',  tenorYears: 182 / 365,rate: 0.0060 },
  { tenor: '1Y',  tenorYears: 1.0,      rate: 0.0070 },
  { tenor: '2Y',  tenorYears: 2.0,      rate: 0.0085 },
  { tenor: '5Y',  tenorYears: 5.0,      rate: 0.0110 },
  { tenor: '10Y', tenorYears: 10.0,     rate: 0.0145 },
];

// CAD: CORRA ≈ 2.75% (BOC cut 7 times to 2.75%, June 2026 — from 5.00% peak)
const CAD: YieldCurvePoint[] = [
  { tenor: 'ON',  tenorYears: 1 / 365,  rate: 0.0275 },
  { tenor: '1M',  tenorYears: 30 / 365, rate: 0.0272 },
  { tenor: '3M',  tenorYears: 91 / 365, rate: 0.0268 },
  { tenor: '6M',  tenorYears: 182 / 365,rate: 0.0265 },
  { tenor: '1Y',  tenorYears: 1.0,      rate: 0.0265 },
  { tenor: '2Y',  tenorYears: 2.0,      rate: 0.0278 },
  { tenor: '5Y',  tenorYears: 5.0,      rate: 0.0300 },
  { tenor: '10Y', tenorYears: 10.0,     rate: 0.0320 },
];

// SAR: SAIBOR — USD-pegged, tracks Fed funds (ON ≈ 4.40% after Fed cuts)
const SAR: YieldCurvePoint[] = [
  { tenor: 'ON',  tenorYears: 1 / 365,  rate: 0.0440 },
  { tenor: '1M',  tenorYears: 30 / 365, rate: 0.0438 },
  { tenor: '3M',  tenorYears: 91 / 365, rate: 0.0432 },
  { tenor: '6M',  tenorYears: 182 / 365,rate: 0.0420 },
  { tenor: '1Y',  tenorYears: 1.0,      rate: 0.0405 },
];

// AED: EIBOR — USD-pegged (ON ≈ 4.35%)
const AED: YieldCurvePoint[] = [
  { tenor: 'ON',  tenorYears: 1 / 365,  rate: 0.0435 },
  { tenor: '1M',  tenorYears: 30 / 365, rate: 0.0432 },
  { tenor: '3M',  tenorYears: 91 / 365, rate: 0.0428 },
  { tenor: '6M',  tenorYears: 182 / 365,rate: 0.0415 },
  { tenor: '1Y',  tenorYears: 1.0,      rate: 0.0400 },
];

// KWD: KIBOR — managed float vs USD basket (ON ≈ 4.25%)
const KWD: YieldCurvePoint[] = [
  { tenor: 'ON',  tenorYears: 1 / 365,  rate: 0.0425 },
  { tenor: '1M',  tenorYears: 30 / 365, rate: 0.0422 },
  { tenor: '3M',  tenorYears: 91 / 365, rate: 0.0415 },
  { tenor: '6M',  tenorYears: 182 / 365,rate: 0.0405 },
  { tenor: '1Y',  tenorYears: 1.0,      rate: 0.0390 },
];

// QAR: QIBOR — USD-pegged (ON ≈ 4.38%)
const QAR: YieldCurvePoint[] = [
  { tenor: 'ON',  tenorYears: 1 / 365,  rate: 0.0438 },
  { tenor: '1M',  tenorYears: 30 / 365, rate: 0.0435 },
  { tenor: '3M',  tenorYears: 91 / 365, rate: 0.0428 },
  { tenor: '6M',  tenorYears: 182 / 365,rate: 0.0415 },
  { tenor: '1Y',  tenorYears: 1.0,      rate: 0.0402 },
];

// DKK: closely tracks ECB ERM II peg (ON ≈ 2.10%, ECB deposit 2.25%)
const DKK: YieldCurvePoint[] = [
  { tenor: 'ON',  tenorYears: 1 / 365,  rate: 0.0210 },
  { tenor: '1M',  tenorYears: 30 / 365, rate: 0.0212 },
  { tenor: '3M',  tenorYears: 91 / 365, rate: 0.0215 },
  { tenor: '6M',  tenorYears: 182 / 365,rate: 0.0215 },
  { tenor: '1Y',  tenorYears: 1.0,      rate: 0.0210 },
  { tenor: '2Y',  tenorYears: 2.0,      rate: 0.0220 },
  { tenor: '5Y',  tenorYears: 5.0,      rate: 0.0245 },
  { tenor: '10Y', tenorYears: 10.0,     rate: 0.0268 },
];

// NOK: Norges Bank cut to 3.50% (June 2026 — from 4.50% peak)
const NOK: YieldCurvePoint[] = [
  { tenor: 'ON',  tenorYears: 1 / 365,  rate: 0.0350 },
  { tenor: '1M',  tenorYears: 30 / 365, rate: 0.0348 },
  { tenor: '3M',  tenorYears: 91 / 365, rate: 0.0342 },
  { tenor: '6M',  tenorYears: 182 / 365,rate: 0.0335 },
  { tenor: '1Y',  tenorYears: 1.0,      rate: 0.0325 },
  { tenor: '5Y',  tenorYears: 5.0,      rate: 0.0310 },
];

// SEK: Riksbank cut to 2.25% (June 2026 — from 4.00% peak)
const SEK: YieldCurvePoint[] = [
  { tenor: 'ON',  tenorYears: 1 / 365,  rate: 0.0225 },
  { tenor: '1M',  tenorYears: 30 / 365, rate: 0.0222 },
  { tenor: '3M',  tenorYears: 91 / 365, rate: 0.0220 },
  { tenor: '6M',  tenorYears: 182 / 365,rate: 0.0220 },
  { tenor: '1Y',  tenorYears: 1.0,      rate: 0.0220 },
  { tenor: '5Y',  tenorYears: 5.0,      rate: 0.0240 },
];

// CNY: SHIBOR (ON) + CGB (Chinese Government Bonds)
const CNY: YieldCurvePoint[] = [
  { tenor: 'ON',  tenorYears: 1 / 365,  rate: 0.0160 },
  { tenor: '1M',  tenorYears: 30 / 365, rate: 0.0175 },
  { tenor: '3M',  tenorYears: 91 / 365, rate: 0.0190 },
  { tenor: '6M',  tenorYears: 182 / 365,rate: 0.0205 },
  { tenor: '1Y',  tenorYears: 1.0,      rate: 0.0215 },
  { tenor: '2Y',  tenorYears: 2.0,      rate: 0.0225 },
  { tenor: '5Y',  tenorYears: 5.0,      rate: 0.0240 },
];

export const DEFAULT_CURVES: Record<string, YieldCurvePoint[]> = {
  MAD, EUR, USD, GBP, CHF, JPY, CAD, SAR, AED, KWD, QAR, DKK, NOK, SEK, CNY,
};

export const CURVE_META: Record<string, { label: string; benchmark: string }> = {
  MAD: { label: 'Morocco MAD',      benchmark: 'BKAM / BDT / OAT'  },
  EUR: { label: 'Euro Zone EUR',    benchmark: '€STR / Euribor'     },
  USD: { label: 'United States USD',benchmark: 'SOFR / US Treasury' },
  GBP: { label: 'United Kingdom GBP',benchmark: 'SONIA / Gilts'    },
  CHF: { label: 'Switzerland CHF',  benchmark: 'SARON / Conf. Bond' },
  JPY: { label: 'Japan JPY',        benchmark: 'TONA / JGB'         },
  CAD: { label: 'Canada CAD',       benchmark: 'CORRA / CAN Bond'   },
  SAR: { label: 'Saudi Arabia SAR', benchmark: 'SAIBOR'             },
  AED: { label: 'UAE AED',          benchmark: 'EIBOR'              },
  KWD: { label: 'Kuwait KWD',       benchmark: 'KIBOR'              },
  QAR: { label: 'Qatar QAR',        benchmark: 'QIBOR'              },
  DKK: { label: 'Denmark DKK',      benchmark: 'Cibor / DGB'        },
  NOK: { label: 'Norway NOK',       benchmark: 'Nibor / NGB'        },
  SEK: { label: 'Sweden SEK',       benchmark: 'Stibor / SGB'       },
  CNY: { label: 'China CNY',        benchmark: 'SHIBOR / CGB'       },
};

// ─── Natural Cubic Spline ─────────────────────────────────────────────────────
// Standard algorithm (Burden & Faires). Gives C² continuity at knots.
// Natural boundary conditions: S''(x_0) = S''(x_n) = 0
export function naturalCubicSpline(xs: number[], ys: number[], x: number): number {
  const n = xs.length;
  if (n === 0) return 0;
  if (n === 1) return ys[0];
  if (x <= xs[0]) return ys[0];
  if (x >= xs[n - 1]) return ys[n - 1];

  // Find segment index i such that xs[i] <= x < xs[i+1]
  let i = 0;
  while (i < n - 2 && xs[i + 1] <= x) i++;

  const h = xs.map((xi, j) => j < n - 1 ? xs[j + 1] - xi : 1);
  const a = [...ys];

  // Set up RHS vector
  const alpha = new Array(n).fill(0);
  for (let j = 1; j < n - 1; j++) {
    alpha[j] =
      (3 / h[j]) * (a[j + 1] - a[j]) -
      (3 / h[j - 1]) * (a[j] - a[j - 1]);
  }

  // Thomas algorithm (forward sweep)
  const l  = new Array(n).fill(1);
  const mu = new Array(n).fill(0);
  const z  = new Array(n).fill(0);

  for (let j = 1; j < n - 1; j++) {
    l[j]  = 2 * (xs[j + 1] - xs[j - 1]) - h[j - 1] * mu[j - 1];
    mu[j] = h[j] / l[j];
    z[j]  = (alpha[j] - h[j - 1] * z[j - 1]) / l[j];
  }

  // Back substitution — compute spline coefficients
  const c = new Array(n).fill(0);
  const b = new Array(n - 1).fill(0);
  const d = new Array(n - 1).fill(0);

  for (let j = n - 2; j >= 0; j--) {
    c[j] = z[j] - mu[j] * c[j + 1];
    b[j] = (a[j + 1] - a[j]) / h[j] - h[j] * (c[j + 1] + 2 * c[j]) / 3;
    d[j] = (c[j + 1] - c[j]) / (3 * h[j]);
  }

  const dx = x - xs[i];
  return a[i] + b[i] * dx + c[i] * dx * dx + d[i] * dx * dx * dx;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Get the risk-free rate for a given currency at a given tenor (in years).
 * Admin overrides are merged before interpolation.
 *
 * @param currency  ISO code, e.g. 'MAD', 'EUR', 'USD'
 * @param tenorYears  fractional years, e.g. 0.25 for 3M
 * @param overrides  optional map of tenor label → override rate (decimal)
 */
export function getRate(
  currency: string,
  tenorYears: number,
  overrides?: Record<string, number>,
): number {
  const base = DEFAULT_CURVES[currency] ?? DEFAULT_CURVES.EUR;

  const curve = base.map(pt => ({
    x: pt.tenorYears,
    y: overrides?.[pt.tenor] !== undefined ? overrides[pt.tenor] : pt.rate,
  }));

  return Math.max(
    0,
    naturalCubicSpline(curve.map(p => p.x), curve.map(p => p.y), tenorYears),
  );
}

/** Returns the full curve as a snapshot (for chart rendering). */
export function getCurveSnapshot(
  currency: string,
  overrides?: Record<string, number>,
): YieldCurveSnapshot {
  const base = DEFAULT_CURVES[currency] ?? [];
  const meta = CURVE_META[currency] ?? { label: currency, benchmark: currency };

  const points: YieldCurvePoint[] = base.map(pt => ({
    ...pt,
    rate: overrides?.[pt.tenor] !== undefined ? overrides[pt.tenor] : pt.rate,
  }));

  return {
    currency,
    label: meta.label,
    benchmark: meta.benchmark,
    points,
    isOverridden: overrides && Object.keys(overrides).length > 0,
  };
}

/** Returns the full default curve for a currency (for editing in admin). */
export function getDefaultCurve(currency: string): YieldCurvePoint[] {
  return DEFAULT_CURVES[currency] ?? [];
}

// P1.1 — Apply live BDT overrides to a base curve. Returns a NEW array.
// Overrides are point-by-point (e.g. { '3M': 0.0325, '1Y': 0.0350 } as decimals).
export function applyCurveOverrides(
  base: YieldCurvePoint[],
  overrides: Record<string, number> | undefined,
): YieldCurvePoint[] {
  if (!overrides) return base;
  return base.map((p) => {
    const o = overrides[p.tenor];
    return o != null ? { ...p, rate: o } : p;
  });
}
