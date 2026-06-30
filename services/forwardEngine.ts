/**
 * FX Forward & Swap Pricing Engine
 *
 * Formula: Covered Interest Parity (CIP) — money-market simple interest convention
 *   F = S × (1 + r_d × T) / (1 + r_f × T)
 *
 * Forward points (pips): (F − S) × 10 000
 *
 * Where:
 *   S  = spot rate (MAD per 1 unit of FCY)
 *   r_d = MAD risk-free rate for tenor T (interpolated from BKAM curve)
 *   r_f = FCY risk-free rate for tenor T (interpolated from intl curve)
 *   T  = time in decimal years (actual/365 day-count)
 */

import { ForwardQuote, FxSwapQuote, RollEvent, SwapLeg } from '../types';
import { getRate, TENOR_YEARS, DEFAULT_CURVES } from './interestRates';
import { settlementDateWithHolidays } from './holidays';

// ─── Day-count conventions (per §4.6 spec) ───────────────────────────────────
// Act/360: USD, EUR, CHF, CAD, DKK, SEK, NOK, JPY, CNY and Gulf currencies
// Act/365: GBP, MAD (and all others not listed)

const ACT_360_CURRENCIES = new Set([
  'USD', 'EUR', 'CHF', 'CAD', 'DKK', 'SEK', 'NOK', 'JPY', 'CNY',
  'AED', 'SAR', 'QAR', 'KWD', 'OMR', 'BHD', 'JOD',
  'ZAR', 'INR', 'BRL', 'TRY',
]);

export function getDayCountBasis(currency: string): 360 | 365 {
  return ACT_360_CURRENCIES.has(currency) ? 360 : 365;
}

/** Currencies where 1 pip = 0.01 (JPY convention). All others: 1 pip = 0.0001. */
const PIP_DENOMINATOR_2 = new Set(['JPY']);

export function pipMultiplier(currency: string): number {
  return PIP_DENOMINATOR_2.has(currency) ? 100 : 10000;
}

export function isJpyPair(currency: string): boolean {
  return PIP_DENOMINATOR_2.has(currency);
}

// ─── Tenor helpers ────────────────────────────────────────────────────────────

export const STANDARD_TENORS = ['ON', 'TN', 'SW', '1M', '2M', '3M', '6M', '9M', '1Y', '2Y', '3Y', '5Y'] as const;
export type StdTenor = typeof STANDARD_TENORS[number];

export function tenorToYears(tenor: string): number {
  return TENOR_YEARS[tenor] ?? 0;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Holiday-aware settlement date (Moroccan calendar, Modified Following). */
export function settlementDate(tenor: string, tradeDate = new Date()): string {
  return settlementDateWithHolidays(tenor, tradeDate);
}

export function customDateToYears(isoDate: string, tradeDate = new Date()): number {
  const target = new Date(isoDate);
  const diffMs = target.getTime() - tradeDate.getTime();
  return Math.max(0, diffMs / (365 * 24 * 3600 * 1000));
}

// ─── Core CIP forward rate ────────────────────────────────────────────────────

/**
 * Compute a single forward rate via CIP.
 * Returns { forwardRate, forwardPointsRaw, forwardPointsPips } — pure CIP, no markup.
 *
 * The dealer markup is NOT applied here: it is added separately to bid/ask quotes
 * via the applyForwardSpread() helper so the mid stays mathematically clean.
 *
 * tenorYears is always Act/365 (MAD domestic basis).
 * tenorYearsForeign overrides the foreign leg basis when provided (Act/360 currencies).
 */
export function computeForward(
  spot: number,
  rDomestic: number,
  rForeign: number,
  tenorYears: number,
  _markupBps = 0, // deprecated: kept for API compat; use applyForwardSpread() instead
  tenorYearsForeign?: number,
): {
  forwardRate: number;
  forwardPointsRaw: number;
  forwardPointsPips: number;
} {
  const T_d = tenorYears;
  const T_f = tenorYearsForeign ?? tenorYears;
  // CIP (simple interest, money-market convention)
  const fwd = spot * (1 + rDomestic * T_d) / (1 + rForeign * T_f);

  const forwardRate = +fwd.toFixed(4);
  const forwardPointsRaw = +(forwardRate - spot).toFixed(6);
  return { forwardRate, forwardPointsRaw, forwardPointsPips: 0 };
}

/**
 * Apply dealer markup as a SPREAD around the CIP forward (not on the mid).
 * This is the correct accounting: the mid stays at the clean CIP rate, the bank
 * earns its margin by quoting bid/ask around it.
 *
 * Returns a clean quote with all standard forward metrics. Pip convention
 * follows the currency (JPY pairs use 0.01 = 1 pip; all others use 0.0001).
 */
export function applyForwardSpread(
  result: { forwardRate: number; forwardPointsRaw: number; forwardPointsPips: number },
  spot: number,
  currency: string,
  direction: 'BUY' | 'SELL',
  markupBps = 0,
): {
  mid: number;
  bid: number;
  ask: number;
  spreadPips: number;
  forwardPointsRaw: number;
  forwardPointsPips: number;
} {
  const fwd = result.forwardRate;
  const halfSpread = (markupBps / 10_000) * spot / 2;
  const mid = +fwd.toFixed(4);
  // For a BUY direction (you buy FCY, sell MAD), you pay the ask (= mid + half-spread)
  // For SELL direction (you sell FCY, buy MAD), you receive the bid (= mid - half-spread)
  const ask = +(fwd + halfSpread).toFixed(4);
  const bid = +(fwd - halfSpread).toFixed(4);
  const pipMult = pipMultiplier(currency);
  const spreadPips = +((ask - bid) * pipMult).toFixed(2);
  const forwardPointsPips = +(result.forwardPointsRaw * pipMult).toFixed(2);
  const directionQuoted = direction === 'BUY' ? ask : bid;
  void directionQuoted; // exposed for callers; mid/ask/bid are the canonical output
  return { mid, bid, ask, spreadPips, forwardPointsRaw: result.forwardPointsRaw, forwardPointsPips };
}

// ─── Full forward quote ───────────────────────────────────────────────────────

export function buildForwardQuote(
  currency: string,
  spot: number,
  tenor: string | number,
  notional: number,
  direction: 'BUY' | 'SELL',
  markupBps = 0,
  madOverrides?: Record<string, number>,
  fcyOverrides?: Record<string, number>,
): ForwardQuote {
  // Accept either a tenor label ('1M', '3M', '1Y', ...) or a day count (number).
  // This lets callers pass extension days directly without converting to a tenor label.
  let tenorYears: number;
  let tenorLabel: string;
  if (typeof tenor === 'number') {
    tenorYears = tenor / 365;
    tenorLabel = `${tenor}D`;
  } else if (tenor === 'CUSTOM') {
    tenorYears = tenorToYears('3M');
    tenorLabel = '3M';
  } else {
    tenorYears = tenorToYears(tenor);
    tenorLabel = tenor;
  }

  const tenorDays = Math.round(tenorYears * 365);
  const tenorYearsForeign = tenorDays / getDayCountBasis(currency);

  const madRate = getRate('MAD', tenorYears, madOverrides);
  const fcyRate = getRate(currency, tenorYears, fcyOverrides);

  const fwd = computeForward(
    spot, madRate, fcyRate, tenorYears, 0, tenorYearsForeign,
  );
  const spread = applyForwardSpread(fwd, spot, currency, direction, markupBps);

  const netCostMAD = +(Math.abs(fwd.forwardPointsRaw) * notional).toFixed(2);

  return {
    pair:             `${currency}/MAD`,
    currency,
    spot,
    tenorLabel,
    tenorDays,
    tenorYears,
    forwardRate:      spread.mid,
    forwardPointsRaw: spread.forwardPointsRaw,
    forwardPointsPips: spread.forwardPointsPips,
    bid:              spread.bid,
    ask:              spread.ask,
    spread:           spread.spreadPips,
    madRate,
    fcyRate,
    notional,
    direction,
    netCostMAD,
    timestamp:        new Date().toISOString(),
  };
}

// ─── Full forward curve (all standard tenors) ─────────────────────────────────

export interface ForwardCurvePoint {
  tenor: string;
  tenorDays: number;
  tenorYears: number;
  spot: number;
  forwardRate: number;
  forwardPointsPips: number;
  madRate: number;
  fcyRate: number;
  premDisc: 'PREMIUM' | 'DISCOUNT' | 'PAR';
  isInterpolated: boolean; // true when tenor is not an exact knot in MAD or FCY base curve
}

// Set of tenor years that are exact knots in a given curve (tolerance 1e-9)
function curveKnotYears(curveName: string): Set<number> {
  const pts = DEFAULT_CURVES[curveName] ?? [];
  const s = new Set<number>();
  for (const p of pts) s.add(p.tenorYears);
  return s;
}

function isKnot(tenorYears: number, knots: Set<number>): boolean {
  for (const k of knots) if (Math.abs(k - tenorYears) < 1e-9) return true;
  return false;
}

export function buildForwardCurve(
  currency: string,
  spot: number,
  _markupBps = 0,
  madOverrides?: Record<string, number>,
  fcyOverrides?: Record<string, number>,
): ForwardCurvePoint[] {
  const madKnots = curveKnotYears('MAD');
  const fcyKnots = curveKnotYears(currency);
  const pipMult = pipMultiplier(currency);

  return STANDARD_TENORS.map(tenor => {
    const tenorYears = tenorToYears(tenor);
    const tenorDays  = Math.round(tenorYears * 365);
    const tenorYearsForeign = tenorDays / getDayCountBasis(currency);
    const madRate    = getRate('MAD', tenorYears, madOverrides);
    const fcyRate    = getRate(currency, tenorYears, fcyOverrides);

    const fwd = computeForward(spot, madRate, fcyRate, tenorYears, 0, tenorYearsForeign);
    const forwardPointsPips = +(fwd.forwardPointsRaw * pipMult).toFixed(2);

    const premDisc: 'PREMIUM' | 'DISCOUNT' | 'PAR' =
      forwardPointsPips > 0.5  ? 'PREMIUM'  :
      forwardPointsPips < -0.5 ? 'DISCOUNT' : 'PAR';

    const isInterpolated = !isKnot(tenorYears, madKnots) || !isKnot(tenorYears, fcyKnots);

    return { tenor, tenorDays, tenorYears, spot, forwardRate: fwd.forwardRate, forwardPointsPips, madRate, fcyRate, premDisc, isInterpolated };
  });
}

// ─── FX Swap pricing ──────────────────────────────────────────────────────────

function buildSwapLeg(
  label: 'NEAR' | 'FAR',
  currency: string,
  spot: number,
  tenor: string,
  direction: 'BUY' | 'SELL',
  markupBps: number,
  madOvr?: Record<string, number>,
  fcyOvr?: Record<string, number>,
): SwapLeg {
  const tenorYears = tenorToYears(tenor);
  const tenorDays  = Math.round(tenorYears * 365);
  const tenorYearsForeign = tenorDays / getDayCountBasis(currency);
  const madRate    = getRate('MAD', tenorYears, madOvr);
  const fcyRate    = getRate(currency, tenorYears, fcyOvr);

  const fwd = computeForward(spot, madRate, fcyRate, tenorYears, 0, tenorYearsForeign);
  const spread = applyForwardSpread(fwd, spot, currency, direction, markupBps);
  const rate = direction === 'BUY' ? spread.ask : spread.bid;

  return { label, tenorLabel: tenor, tenorDays, tenorYears, rate, forwardPointsPips: spread.forwardPointsPips, direction };
}

export function buildFxSwap(
  currency: string,
  spot: number,
  notional: number,
  nearTenor: string,
  farTenor: string,
  nearDirection: 'BUY' | 'SELL',
  markupBps = 0,
  madOvr?: Record<string, number>,
  fcyOvr?: Record<string, number>,
): FxSwapQuote {
  const farDirection: 'BUY' | 'SELL' = nearDirection === 'BUY' ? 'SELL' : 'BUY';

  const nearLeg = buildSwapLeg('NEAR', currency, spot, nearTenor, nearDirection, markupBps, madOvr, fcyOvr);
  const farLeg  = buildSwapLeg('FAR',  currency, spot, farTenor,  farDirection,  markupBps, madOvr, fcyOvr);

  const swapPointsRaw  = +(farLeg.rate - nearLeg.rate).toFixed(6);
  const swapPointsPips = +(swapPointsRaw * 10_000).toFixed(2);

  const madRateNear = getRate('MAD', nearLeg.tenorYears, madOvr);
  const madRateFar  = getRate('MAD', farLeg.tenorYears,  madOvr);
  const fcyRateNear = getRate(currency, nearLeg.tenorYears, fcyOvr);
  const fcyRateFar  = getRate(currency, farLeg.tenorYears,  fcyOvr);

  return {
    pair: `${currency}/MAD`, currency, spot, notional,
    nearLeg, farLeg,
    swapPointsPips, swapPointsRaw,
    madRateNear, madRateFar, fcyRateNear, fcyRateFar,
    timestamp: new Date().toISOString(),
  };
}

// ─── Roll event pricing ───────────────────────────────────────────────────────

export function buildRollEvent(
  type: 'ROLLOVER' | 'ROLLUNDER',
  currency: string,
  spot: number,
  notional: number,
  fromTenor: string,
  toTenor: string,
  markupBps = 0,
  madOvr?: Record<string, number>,
  fcyOvr?: Record<string, number>,
): RollEvent {
  const fromYears = tenorToYears(fromTenor);
  const toYears   = tenorToYears(toTenor);

  const fromFwd = computeForward(
    spot, getRate('MAD', fromYears, madOvr), getRate(currency, fromYears, fcyOvr), fromYears, 0,
  );
  const toFwd = computeForward(
    spot, getRate('MAD', toYears, madOvr), getRate(currency, toYears, fcyOvr), toYears, 0,
  );
  const fromRate = fromFwd.forwardRate;
  const toRate = toFwd.forwardRate;

  const pipMult = pipMultiplier(currency);
  const rollCostPips = +((toRate - fromRate) * pipMult).toFixed(2);
  const rollCostMAD  = +(Math.abs(toRate - fromRate) * notional).toFixed(2);

  return {
    id:        `roll-${Date.now()}`,
    type,
    pair:      `${currency}/MAD`,
    fromTenor,
    toTenor,
    fromRate,
    toRate,
    spot,
    rollCostPips,
    rollCostMAD,
    notional,
    timestamp: new Date().toISOString(),
  };
}

// ─── Calendar spreads (P1.5) ───────────────────────────────────────────────────

export interface CalendarSpreadResult {
  pair: string;
  nearTenor: string;
  farTenor: string;
  nearRate: number;
  farRate: number;
  spread: number;            // far - near (in price)
  spreadPips: number;        // spread × pip multiplier
  direction: 'CONTANGO' | 'BACKWARDATION' | 'FLAT';
  interpretation: string;
}

/**
 * Compute a calendar spread: e.g. 1M vs 3M EUR/MAD forward.
 * If far > near → contango (positive carry); if far < near → backwardation.
 */
export function buildCalendarSpread(
  currency: string,
  spot: number,
  nearTenor: string,
  farTenor: string,
  madOvr?: Record<string, number>,
  fcyOvr?: Record<string, number>,
): CalendarSpreadResult {
  const nearQ = buildForwardQuote(currency, spot, nearTenor, 1, 'BUY', 0, madOvr, fcyOvr);
  const farQ  = buildForwardQuote(currency, spot, farTenor,  1, 'BUY', 0, madOvr, fcyOvr);
  const pipMult = pipMultiplier(currency);
  const spread = +(farQ.forwardRate - nearQ.forwardRate).toFixed(6);
  const spreadPips = +(spread * pipMult).toFixed(2);
  const direction =
    spreadPips >  1  ? 'CONTANGO' :
    spreadPips < -1  ? 'BACKWARDATION' : 'FLAT';
  const interpretation =
    direction === 'CONTANGO'      ? `Carry positif: forward ${farTenor} > ${nearTenor} (rate differential favorable)` :
    direction === 'BACKWARDATION' ? `Inversion: forward ${farTenor} < ${nearTenor} (taux domestique > étranger)` :
                                    `Spread neutre entre ${nearTenor} et ${farTenor}`;
  return {
    pair: `${currency}/MAD`,
    nearTenor,
    farTenor,
    nearRate: nearQ.forwardRate,
    farRate: farQ.forwardRate,
    spread,
    spreadPips,
    direction,
    interpretation,
  };
}

export interface ButterflyResult {
  pair: string;
  nearTenor: string;
  middleTenor: string;
  farTenor: string;
  nearRate: number;
  middleRate: number;
  farRate: number;
  /** Butterfly = near + far − 2 × middle. Positive → belly is cheap; negative → belly is rich. */
  butterfly: number;
  butterflyPips: number;
  direction: 'BULL_STEEPENER' | 'BEAR_FLATTENER' | 'NEUTRAL';
  interpretation: string;
}

/**
 * Compute a butterfly: e.g. 1M × 3M × 6M (long 1M + 6M, short 2 × 3M).
 * Used to isolate the belly of the forward curve.
 */
export function buildButterfly(
  currency: string,
  spot: number,
  nearTenor: string,
  middleTenor: string,
  farTenor: string,
  madOvr?: Record<string, number>,
  fcyOvr?: Record<string, number>,
): ButterflyResult {
  const near = buildForwardQuote(currency, spot, nearTenor, 1, 'BUY', 0, madOvr, fcyOvr);
  const mid  = buildForwardQuote(currency, spot, middleTenor, 1, 'BUY', 0, madOvr, fcyOvr);
  const far  = buildForwardQuote(currency, spot, farTenor, 1, 'BUY', 0, madOvr, fcyOvr);
  const pipMult = pipMultiplier(currency);
  const butterfly = +((near.forwardRate + far.forwardRate) - 2 * mid.forwardRate).toFixed(6);
  const butterflyPips = +(butterfly * pipMult).toFixed(2);
  const direction =
    butterflyPips >  1  ? 'BULL_STEEPENER' :
    butterflyPips < -1  ? 'BEAR_FLATTENER'  : 'NEUTRAL';
  const interpretation =
    butterflyPips >  1 ? `Belly cheap: ${middleTenor} sous-évalué vs ${nearTenor} et ${farTenor} (positionnez-vous sur le steepening)` :
    butterflyPips < -1 ? `Belly cher: ${middleTenor} surévalué vs ${nearTenor} et ${farTenor} (positionnez-vous sur le flattening)` :
                         `Butterfly neutre: courbe plate autour de ${middleTenor}`;
  return {
    pair: `${currency}/MAD`,
    nearTenor,
    middleTenor,
    farTenor,
    nearRate: near.forwardRate,
    middleRate: mid.forwardRate,
    farRate: far.forwardRate,
    butterfly,
    butterflyPips,
    direction,
    interpretation,
  };
}
