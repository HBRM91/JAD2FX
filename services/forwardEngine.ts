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
import { getRate, TENOR_YEARS } from './interestRates';
import { settlementDateWithHolidays } from './holidays';

// ─── Tenor helpers ────────────────────────────────────────────────────────────

export const STANDARD_TENORS = ['ON', 'TN', 'SW', '1M', '2M', '3M', '6M', '9M', '1Y', '2Y', '3Y', '5Y'] as const;
export type StdTenor = typeof STANDARD_TENORS[number];

export function tenorToYears(tenor: string): number {
  return TENOR_YEARS[tenor] ?? 0;
}

export function tenorToDays(tenor: string): number {
  return Math.round(tenorToYears(tenor) * 365);
}

export function daysToYears(days: number): number {
  return days / 365;
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
 * Returns { forwardRate, forwardPointsRaw, forwardPointsPips }.
 */
export function computeForward(
  spot: number,
  rDomestic: number,
  rForeign: number,
  tenorYears: number,
  markupBps = 0,
): {
  forwardRate: number;
  forwardPointsRaw: number;
  forwardPointsPips: number;
} {
  // CIP (simple interest, money-market convention)
  const fwd = spot * (1 + rDomestic * tenorYears) / (1 + rForeign * tenorYears);

  // Dealer markup (adds bps to forward rate to widen spread slightly)
  const markup = (markupBps / 10_000) * spot;
  const forwardRate = +(fwd + markup).toFixed(4);
  const forwardPointsRaw = +(forwardRate - spot).toFixed(6);
  const forwardPointsPips = +(forwardPointsRaw * 10_000).toFixed(2);

  return { forwardRate, forwardPointsRaw, forwardPointsPips };
}

// ─── Full forward quote ───────────────────────────────────────────────────────

export function buildForwardQuote(
  currency: string,
  spot: number,
  tenor: string,
  notional: number,
  direction: 'BUY' | 'SELL',
  markupBps = 0,
  madOverrides?: Record<string, number>,
  fcyOverrides?: Record<string, number>,
): ForwardQuote {
  const tenorYears = tenor === 'CUSTOM'
    ? tenorToYears('3M')           // fallback if CUSTOM passed without years
    : tenorToYears(tenor);

  const tenorDays = Math.round(tenorYears * 365);

  const madRate = getRate('MAD', tenorYears, madOverrides);
  const fcyRate = getRate(currency, tenorYears, fcyOverrides);

  const { forwardRate, forwardPointsRaw, forwardPointsPips } = computeForward(
    spot, madRate, fcyRate, tenorYears, markupBps,
  );

  const netCostMAD = +(Math.abs(forwardPointsRaw) * notional).toFixed(2);

  return {
    pair:             `${currency}/MAD`,
    currency,
    spot,
    tenorLabel:       tenor,
    tenorDays,
    tenorYears,
    forwardRate,
    forwardPointsRaw,
    forwardPointsPips,
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
}

export function buildForwardCurve(
  currency: string,
  spot: number,
  markupBps = 0,
  madOverrides?: Record<string, number>,
  fcyOverrides?: Record<string, number>,
): ForwardCurvePoint[] {
  return STANDARD_TENORS.map(tenor => {
    const tenorYears = tenorToYears(tenor);
    const tenorDays  = Math.round(tenorYears * 365);
    const madRate    = getRate('MAD', tenorYears, madOverrides);
    const fcyRate    = getRate(currency, tenorYears, fcyOverrides);

    const { forwardRate, forwardPointsPips } = computeForward(
      spot, madRate, fcyRate, tenorYears, markupBps,
    );

    const premDisc: 'PREMIUM' | 'DISCOUNT' | 'PAR' =
      forwardPointsPips > 0.5  ? 'PREMIUM'  :
      forwardPointsPips < -0.5 ? 'DISCOUNT' : 'PAR';

    return { tenor, tenorDays, tenorYears, spot, forwardRate, forwardPointsPips, madRate, fcyRate, premDisc };
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
  const madRate    = getRate('MAD', tenorYears, madOvr);
  const fcyRate    = getRate(currency, tenorYears, fcyOvr);

  const { forwardRate, forwardPointsPips } = computeForward(
    spot, madRate, fcyRate, tenorYears, markupBps,
  );

  return { label, tenorLabel: tenor, tenorDays, tenorYears, rate: forwardRate, forwardPointsPips, direction };
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

  const { forwardRate: fromRate } = computeForward(
    spot, getRate('MAD', fromYears, madOvr), getRate(currency, fromYears, fcyOvr), fromYears, markupBps,
  );
  const { forwardRate: toRate } = computeForward(
    spot, getRate('MAD', toYears, madOvr), getRate(currency, toYears, fcyOvr), toYears, markupBps,
  );

  const rollCostPips = +((toRate - fromRate) * 10_000).toFixed(2);
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
