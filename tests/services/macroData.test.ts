import { describe, it, expect } from 'vitest';
import { DEFAULT_MONEY_MARKET, DEFAULT_INFLATION, computePppFairValue } from '../../services/macroData';

describe('Macro data defaults (P1.9 + P1.11)', () => {
  it('money market table includes MAD with FX reserves', () => {
    const mad = DEFAULT_MONEY_MARKET.find((m) => m.currency === 'MAD');
    expect(mad).toBeDefined();
    expect(mad?.fxReservesUSDbn).toBeGreaterThan(0);
    expect(mad?.policyRate).toBeGreaterThan(0);
    expect(mad?.overnightRate).toBeGreaterThan(0);
  });

  it('inflation table includes MA and G10', () => {
    expect(DEFAULT_INFLATION.find((i) => i.currency === 'MAD')).toBeDefined();
    expect(DEFAULT_INFLATION.find((i) => i.currency === 'EUR')).toBeDefined();
    expect(DEFAULT_INFLATION.find((i) => i.currency === 'USD')).toBeDefined();
  });
});

describe('computePppFairValue (P1.11)', () => {
  it('returns deviation from spot', () => {
    const r = computePppFairValue('EUR/MAD', 10.85, 2.1, 1.9, 5);
    expect(r.pppLongTerm).toBeGreaterThan(0);
    expect(r.deviationPct).toBeDefined();
  });

  it('higher domestic inflation → higher PPP target', () => {
    const low = computePppFairValue('EUR/MAD', 10.85, 0.5, 2.0, 5);
    const high = computePppFairValue('EUR/MAD', 10.85, 5.0, 2.0, 5);
    expect(high.pppLongTerm).toBeGreaterThan(low.pppLongTerm);
  });

  it('interpretation is non-empty', () => {
    const r = computePppFairValue('USD/MAD', 9.95, 2.1, 2.7, 5);
    expect(r.interpretation.length).toBeGreaterThan(0);
  });
});

describe('verifyBidAskInvariant (P1.20)', () => {
  it('passes for valid bid/mid/ask', async () => {
    const { verifyBidAskInvariant } = await import('../../utils/pricingInvariant');
    const r = verifyBidAskInvariant(9.99, 10.0, 10.01);
    expect(r.ok).toBe(true);
  });

  it('fails when ask ≤ mid', async () => {
    const { verifyBidAskInvariant } = await import('../../utils/pricingInvariant');
    const r = verifyBidAskInvariant(9.99, 10.0, 9.98);
    expect(r.ok).toBe(false);
    expect(r.clamped).toBeDefined();
  });

  it('fails when bid ≥ mid', async () => {
    const { verifyBidAskInvariant } = await import('../../utils/pricingInvariant');
    const r = verifyBidAskInvariant(10.05, 10.0, 10.10);
    expect(r.ok).toBe(false);
  });
});
