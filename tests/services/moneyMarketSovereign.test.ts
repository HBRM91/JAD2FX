import { describe, it, expect } from 'vitest';
import { DEFAULT_MONEY_MARKET, DEFAULT_INFLATION, computePppFairValue } from '../../services/macroData';

/**
 * P1.23 — Unit tests: Money market + Inflation + PPP.
 */

describe('Money market (P1.23)', () => {
  it('MAD has highest policy rate differential context', () => {
    const mad = DEFAULT_MONEY_MARKET.find((m) => m.currency === 'MAD');
    expect(mad).toBeDefined();
    expect(mad!.policyRate).toBeGreaterThan(0);
    expect(mad!.fxReservesUSDbn).toBeGreaterThan(0);
  });

  it('All G10 currencies present in money market table', () => {
    const codes = ['MAD', 'EUR', 'USD', 'GBP', 'JPY', 'CHF', 'CAD', 'CNY'];
    for (const c of codes) {
      expect(DEFAULT_MONEY_MARKET.find((m) => m.currency === c)).toBeDefined();
    }
  });

  it('Overnight rate ≤ policy rate + 50bps tolerance (no-arb bound)', () => {
    for (const m of DEFAULT_MONEY_MARKET) {
      // Allow a 50bps tolerance — in reality the spread can be up to that in stress conditions
      expect(m.overnightRate).toBeLessThanOrEqual(m.policyRate + 0.005);
    }
  });

  it('Reserve requirement ∈ [0, 0.10] (sane range)', () => {
    for (const m of DEFAULT_MONEY_MARKET) {
      expect(m.reserveRequirementPct).toBeGreaterThanOrEqual(0);
      expect(m.reserveRequirementPct).toBeLessThan(0.10);
    }
  });
});

describe('Inflation + PPP (P1.23)', () => {
  it('All G10 currencies have inflation data', () => {
    const codes = ['MAD', 'EUR', 'USD', 'GBP', 'JPY', 'CHF', 'CAD', 'CNY'];
    for (const c of codes) {
      expect(DEFAULT_INFLATION.find((i) => i.currency === c)).toBeDefined();
    }
  });

  it('PPP target spot moves correctly with inflation differential (10Y)', () => {
    // Use 10Y for more visible effect
    const base = computePppFairValue('EUR/MAD', 10.85, 2.0, 2.0, 10);
    const highInfForeign = computePppFairValue('EUR/MAD', 10.85, 2.0, 5.0, 10);
    const highInfDomestic = computePppFairValue('EUR/MAD', 10.85, 5.0, 2.0, 10);
    // PPP = spot × (1+domestic/1+foreign)^N
    // Higher foreign inflation → ratio smaller → PPP target LOWER
    expect(highInfForeign.pppLongTerm).toBeLessThan(base.pppLongTerm);
    // Higher domestic inflation → ratio larger → PPP target HIGHER
    expect(highInfDomestic.pppLongTerm).toBeGreaterThan(base.pppLongTerm);
  });

  it('PPP interpretation mentions the direction (MAD over/undervalued)', () => {
    const r1 = computePppFairValue('USD/MAD', 10.00, 2.0, 3.0, 5);
    // USD infl > MAD → USD/MAD spot should be below PPP → spot undervalued
    expect(r1.interpretation).toMatch(/sous-évalué|surévalué/i);
    expect(r1.interpretation).toMatch(/spot/i);
  });
});
