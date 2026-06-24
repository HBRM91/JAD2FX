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

// EUR: ECB €STR (ON) + Euribor (short) + EUR swap curve (long)
const EUR: YieldCurvePoint[] = [
  { tenor: 'ON',  tenorYears: 1 / 365,  rate: 0.0390 },
  { tenor: '1M',  tenorYears: 30 / 365, rate: 0.0375 },
  { tenor: '3M',  tenorYears: 91 / 365, rate: 0.0360 },
  { tenor: '6M',  tenorYears: 182 / 365,rate: 0.0340 },
  { tenor: '1Y',  tenorYears: 1.0,      rate: 0.0310 },
  { tenor: '2Y',  tenorYears: 2.0,      rate: 0.0285 },
  { tenor: '5Y',  tenorYears: 5.0,      rate: 0.0270 },
  { tenor: '10Y', tenorYears: 10.0,     rate: 0.0280 },
];

// USD: SOFR (ON) + US Treasury bills/notes
const USD: YieldCurvePoint[] = [
  { tenor: 'ON',  tenorYears: 1 / 365,  rate: 0.0533 },
  { tenor: '1M',  tenorYears: 30 / 365, rate: 0.0525 },
  { tenor: '3M',  tenorYears: 91 / 365, rate: 0.0510 },
  { tenor: '6M',  tenorYears: 182 / 365,rate: 0.0490 },
  { tenor: '1Y',  tenorYears: 1.0,      rate: 0.0465 },
  { tenor: '2Y',  tenorYears: 2.0,      rate: 0.0450 },
  { tenor: '5Y',  tenorYears: 5.0,      rate: 0.0430 },
  { tenor: '10Y', tenorYears: 10.0,     rate: 0.0425 },
];

// GBP: SONIA (ON) + UK Gilts
const GBP: YieldCurvePoint[] = [
  { tenor: 'ON',  tenorYears: 1 / 365,  rate: 0.0520 },
  { tenor: '1M',  tenorYears: 30 / 365, rate: 0.0510 },
  { tenor: '3M',  tenorYears: 91 / 365, rate: 0.0495 },
  { tenor: '6M',  tenorYears: 182 / 365,rate: 0.0475 },
  { tenor: '1Y',  tenorYears: 1.0,      rate: 0.0450 },
  { tenor: '2Y',  tenorYears: 2.0,      rate: 0.0425 },
  { tenor: '5Y',  tenorYears: 5.0,      rate: 0.0415 },
  { tenor: '10Y', tenorYears: 10.0,     rate: 0.0420 },
];

// CHF: SARON (ON) + Swiss Confederation bonds
const CHF: YieldCurvePoint[] = [
  { tenor: 'ON',  tenorYears: 1 / 365,  rate: 0.0150 },
  { tenor: '1M',  tenorYears: 30 / 365, rate: 0.0145 },
  { tenor: '3M',  tenorYears: 91 / 365, rate: 0.0135 },
  { tenor: '6M',  tenorYears: 182 / 365,rate: 0.0120 },
  { tenor: '1Y',  tenorYears: 1.0,      rate: 0.0105 },
  { tenor: '2Y',  tenorYears: 2.0,      rate: 0.0090 },
  { tenor: '5Y',  tenorYears: 5.0,      rate: 0.0085 },
  { tenor: '10Y', tenorYears: 10.0,     rate: 0.0090 },
];

// JPY: TONA (ON) + JGBs (Bank of Japan yield curve control)
const JPY: YieldCurvePoint[] = [
  { tenor: 'ON',  tenorYears: 1 / 365,  rate: 0.0010 },
  { tenor: '1M',  tenorYears: 30 / 365, rate: 0.0010 },
  { tenor: '3M',  tenorYears: 91 / 365, rate: 0.0012 },
  { tenor: '6M',  tenorYears: 182 / 365,rate: 0.0015 },
  { tenor: '1Y',  tenorYears: 1.0,      rate: 0.0020 },
  { tenor: '2Y',  tenorYears: 2.0,      rate: 0.0030 },
  { tenor: '5Y',  tenorYears: 5.0,      rate: 0.0050 },
  { tenor: '10Y', tenorYears: 10.0,     rate: 0.0075 },
];

// CAD: CORRA (ON) + Canada Government bonds
const CAD: YieldCurvePoint[] = [
  { tenor: 'ON',  tenorYears: 1 / 365,  rate: 0.0475 },
  { tenor: '1M',  tenorYears: 30 / 365, rate: 0.0470 },
  { tenor: '3M',  tenorYears: 91 / 365, rate: 0.0460 },
  { tenor: '6M',  tenorYears: 182 / 365,rate: 0.0440 },
  { tenor: '1Y',  tenorYears: 1.0,      rate: 0.0420 },
  { tenor: '2Y',  tenorYears: 2.0,      rate: 0.0400 },
  { tenor: '5Y',  tenorYears: 5.0,      rate: 0.0380 },
  { tenor: '10Y', tenorYears: 10.0,     rate: 0.0375 },
];

// SAR: SAIBOR — USD-pegged, tracks Fed funds closely
const SAR: YieldCurvePoint[] = [
  { tenor: 'ON',  tenorYears: 1 / 365,  rate: 0.0550 },
  { tenor: '1M',  tenorYears: 30 / 365, rate: 0.0540 },
  { tenor: '3M',  tenorYears: 91 / 365, rate: 0.0530 },
  { tenor: '6M',  tenorYears: 182 / 365,rate: 0.0510 },
  { tenor: '1Y',  tenorYears: 1.0,      rate: 0.0490 },
];

// AED: EIBOR — USD-pegged
const AED: YieldCurvePoint[] = [
  { tenor: 'ON',  tenorYears: 1 / 365,  rate: 0.0540 },
  { tenor: '1M',  tenorYears: 30 / 365, rate: 0.0535 },
  { tenor: '3M',  tenorYears: 91 / 365, rate: 0.0525 },
  { tenor: '6M',  tenorYears: 182 / 365,rate: 0.0500 },
  { tenor: '1Y',  tenorYears: 1.0,      rate: 0.0480 },
];

// KWD: KIBOR — managed float vs USD basket
const KWD: YieldCurvePoint[] = [
  { tenor: 'ON',  tenorYears: 1 / 365,  rate: 0.0525 },
  { tenor: '1M',  tenorYears: 30 / 365, rate: 0.0520 },
  { tenor: '3M',  tenorYears: 91 / 365, rate: 0.0510 },
  { tenor: '6M',  tenorYears: 182 / 365,rate: 0.0490 },
  { tenor: '1Y',  tenorYears: 1.0,      rate: 0.0470 },
];

// QAR: QIBOR — USD-pegged
const QAR: YieldCurvePoint[] = [
  { tenor: 'ON',  tenorYears: 1 / 365,  rate: 0.0545 },
  { tenor: '1M',  tenorYears: 30 / 365, rate: 0.0535 },
  { tenor: '3M',  tenorYears: 91 / 365, rate: 0.0525 },
  { tenor: '6M',  tenorYears: 182 / 365,rate: 0.0505 },
  { tenor: '1Y',  tenorYears: 1.0,      rate: 0.0485 },
];

// DKK: closely tracks ECB (fixed peg ERM II)
const DKK: YieldCurvePoint[] = [
  { tenor: 'ON',  tenorYears: 1 / 365,  rate: 0.0385 },
  { tenor: '1M',  tenorYears: 30 / 365, rate: 0.0370 },
  { tenor: '3M',  tenorYears: 91 / 365, rate: 0.0355 },
  { tenor: '6M',  tenorYears: 182 / 365,rate: 0.0335 },
  { tenor: '1Y',  tenorYears: 1.0,      rate: 0.0305 },
  { tenor: '2Y',  tenorYears: 2.0,      rate: 0.0280 },
  { tenor: '5Y',  tenorYears: 5.0,      rate: 0.0265 },
  { tenor: '10Y', tenorYears: 10.0,     rate: 0.0275 },
];

// NOK: Norges Bank policy rate + Nornorge bonds
const NOK: YieldCurvePoint[] = [
  { tenor: 'ON',  tenorYears: 1 / 365,  rate: 0.0450 },
  { tenor: '1M',  tenorYears: 30 / 365, rate: 0.0445 },
  { tenor: '3M',  tenorYears: 91 / 365, rate: 0.0435 },
  { tenor: '6M',  tenorYears: 182 / 365,rate: 0.0415 },
  { tenor: '1Y',  tenorYears: 1.0,      rate: 0.0395 },
  { tenor: '5Y',  tenorYears: 5.0,      rate: 0.0360 },
];

// SEK: Riksbank policy rate
const SEK: YieldCurvePoint[] = [
  { tenor: 'ON',  tenorYears: 1 / 365,  rate: 0.0380 },
  { tenor: '1M',  tenorYears: 30 / 365, rate: 0.0365 },
  { tenor: '3M',  tenorYears: 91 / 365, rate: 0.0350 },
  { tenor: '6M',  tenorYears: 182 / 365,rate: 0.0325 },
  { tenor: '1Y',  tenorYears: 1.0,      rate: 0.0295 },
  { tenor: '5Y',  tenorYears: 5.0,      rate: 0.0255 },
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
