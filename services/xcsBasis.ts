/**
 * Cross-Currency Basis (XCS) — Cross-Currency Swap pricing.
 *
 * FX forward pricing under classic CIP assumes the cost of funding in the
 * domestic and foreign currencies is captured by the interest rate differential.
 * In practice, post-GFC, a cross-currency basis spread is observable in the
 * FX swap market, reflecting bank counterparty risk, USD funding stress, and
 * balance sheet constraints.
 *
 * Real-world CIP: F = S × (1 + r_d × T) / (1 + (r_f + xcs) × T)
 * where xcs is the XCS in decimal (positive xcs means borrowing USD is more
 * expensive than implied by rate differential → EUR/USD basis is positive
 * when USD is "tight").
 *
 * P1.2 — We expose calibrated XCS for EUR-MAD and USD-MAD, by tenor.
 * Values updated quarterly (manually in the admin panel — they are stable
 * enough not to need daily refresh).
 *
 * Sources:
 *   - ECB EUR/USD basis: published monthly, typically -10 to +30 bps.
 *   - USD/MAD basis:  derived from Moroccan offshore bond spreads vs onshore
 *     Treasury yields (BKAM data + Bank of Morocco statistical bulletins).
 */

import { ForwardQuote } from '../types';
import { computeForward, applyForwardSpread } from './forwardEngine';
import { getRate, TENOR_YEARS } from './interestRates';

// Default XCS curves in basis points by tenor (positive = USD tight, EUR rich).
// Conservative values for a Moroccan corporate treasurer — replace with live
// admin-configured values in production via the AdminContext overrides map.
export const DEFAULT_XCS_BPS: Record<string, Record<string, number>> = {
  EUR: { // EUR/MAD XCS (EUR vs USD vs MAD)
    ON:  -2,  '1W':  -3, '1M':  -5, '2M':  -6, '3M':  -8, '6M': -10,
    '9M': -11, '1Y': -12, '2Y': -15, '3Y': -18, '5Y': -20,
  },
  USD: { // USD/MAD XCS (negligible — MAD is a managed currency, basis = 0 in practice)
    ON:   0,  '1W':   0, '1M':   0, '2M':   0, '3M':   0, '6M':   0,
    '9M':  0,  '1Y':   0, '2Y':   0, '3Y':   0, '5Y':   0,
  },
};

const XCS_SUPPORTED = new Set(['EUR', 'USD']);

/**
 * Get the XCS for a currency + tenor (in bps). Returns 0 if currency is not
 * a XCS market (most currencies → 0) or if tenor is unknown.
 */
export function getXcsBps(currency: string, tenor: string): number {
  if (!XCS_SUPPORTED.has(currency)) return 0;
  const curve = DEFAULT_XCS_BPS[currency];
  if (!curve) return 0;
  return curve[tenor] ?? 0;
}

/**
 * Compute a forward rate INCLUDING cross-currency basis (real-world CIP).
 *
 *   F = S × (1 + r_d × T) / (1 + (r_f + xcs) × T)
 *
 * @param xcsOverrides optional { 'EUR': { '3M': -8 } } to override defaults
 */
export function computeForwardWithBasis(
  spot: number,
  rDomestic: number,
  rForeign: number,
  tenorYears: number,
  xcsBps: number,
  markupBps = 0,
  tenorYearsForeign?: number,
): {
  forwardRate: number;
  forwardPointsRaw: number;
  forwardPointsPips: number;
  xcsImpactBps: number;
} {
  const T_d = tenorYears;
  const T_f = tenorYearsForeign ?? tenorYears;
  const xcsDecimal = xcsBps / 10_000;
  // Adjusted CIP: add XCS to the foreign leg
  const fwdWithBasis = spot * (1 + rDomestic * T_d) / (1 + (rForeign + xcsDecimal) * T_f);
  // Plain CIP (for impact comparison)
  const fwdPlain = spot * (1 + rDomestic * T_d) / (1 + rForeign * T_f);

  const forwardRate = +fwdWithBasis.toFixed(6);
  const forwardPointsRaw = +(forwardRate - spot).toFixed(6);
  // Impact of XCS in bps relative to plain CIP
  const xcsImpactBps = +(((fwdWithBasis - fwdPlain) / spot) * 10_000).toFixed(2);
  void markupBps; // passed via applyForwardSpread separately
  return { forwardRate, forwardPointsRaw, forwardPointsPips: 0, xcsImpactBps };
}

/**
 * Build a forward quote that includes XCS in the pricing. The XCS widens or
 * narrows the forward vs plain CIP — useful for treasurers who need to know
 * "what would the FX swap market actually quote me".
 */
export function buildForwardQuoteWithBasis(
  currency: string,
  spot: number,
  tenor: string,
  notional: number,
  direction: 'BUY' | 'SELL',
  markupBps = 0,
  madOverrides?: Record<string, number>,
  fcyOverrides?: Record<string, number>,
  xcsOverrides?: Record<string, number>,
): ForwardQuote & { xcsImpactBps: number; xcsBpsUsed: number } {
  // Look up tenor years (string→number or day count→number)
  let tenorYears: number;
  let tenorLabel: string;
  if (typeof tenor === 'number' || /^\d+$/.test(String(tenor))) {
    const days = typeof tenor === 'number' ? tenor : parseInt(tenor, 10);
    tenorYears = days / 365;
    tenorLabel = `${days}D`;
  } else if (tenor === 'CUSTOM') {
    tenorYears = 91 / 365;
    tenorLabel = '3M';
  } else {
    tenorYears = TENOR_YEARS[tenor] ?? 91 / 365;
    tenorLabel = tenor;
  }

  const xcsBps = xcsOverrides?.[tenorLabel] ?? getXcsBps(currency, tenorLabel);

  const madRate = getRate('MAD', tenorYears, madOverrides);
  const fcyRate = getRate(currency, tenorYears, fcyOverrides);

  // Day-count adjusted foreign tenor (Act/360 for EUR/USD)
  const ACT_360 = new Set(['USD', 'EUR', 'CHF', 'CAD', 'DKK', 'SEK', 'NOK', 'JPY', 'CNY']);
  const dayCount = ACT_360.has(currency) ? 360 : 365;
  const tenorDays = Math.round(tenorYears * 365);
  const tenorYearsForeign = tenorDays / dayCount;

  const fwd = computeForwardWithBasis(
    spot, madRate, fcyRate, tenorYears, xcsBps, markupBps, tenorYearsForeign,
  );
  const spread = applyForwardSpread(fwd, spot, currency, direction, markupBps);

  const netCostMAD = +(Math.abs(fwd.forwardPointsRaw) * notional).toFixed(2);

  return {
    pair: `${currency}/MAD`,
    currency,
    spot,
    tenorLabel,
    tenorDays,
    tenorYears,
    forwardRate: spread.mid,
    forwardPointsRaw: spread.forwardPointsRaw,
    forwardPointsPips: spread.forwardPointsPips,
    bid: spread.bid,
    ask: spread.ask,
    spread: spread.spreadPips,
    madRate,
    fcyRate,
    notional,
    direction,
    netCostMAD,
    timestamp: new Date().toISOString(),
    xcsImpactBps: fwd.xcsImpactBps,
    xcsBpsUsed: xcsBps,
  };
}
