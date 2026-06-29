import { describe, it, expect } from 'vitest';
import {
  getXcsBps,
  computeForwardWithBasis,
  buildForwardQuoteWithBasis,
  DEFAULT_XCS_BPS,
} from '../../services/xcsBasis';

describe('XCS basis (P1.2)', () => {
  it('returns 0 for non-XCS currencies', () => {
    expect(getXcsBps('GBP', '3M')).toBe(0);
    expect(getXcsBps('CHF', '1Y')).toBe(0);
    expect(getXcsBps('JPY', '1M')).toBe(0);
  });

  it('returns basis for EUR at standard tenors', () => {
    expect(getXcsBps('EUR', '3M')).toBe(DEFAULT_XCS_BPS.EUR['3M']);
    expect(getXcsBps('EUR', '1Y')).toBe(DEFAULT_XCS_BPS.EUR['1Y']);
  });

  it('returns 0 for unknown tenor', () => {
    expect(getXcsBps('EUR', '99X')).toBe(0);
  });
});

describe('computeForwardWithBasis (P1.2)', () => {
  it('adds XCS impact in bps vs plain CIP', () => {
    // S=10, r_d=3%, r_f=1%, T=0.25, xcs=-8 bps
    const out = computeForwardWithBasis(10, 0.03, 0.01, 0.25, -8);
    // CIP: F = 10 × 1.0075 / 1.0025 = 10.0499
    // With basis: r_f + xcs = 0.01 - 0.0008 = 0.0092
    // F = 10 × 1.0075 / (1 + 0.0092 × 0.25) = 10.075 / 1.0023 = 10.0519
    // xcsImpactBps = (10.0519 - 10.0499) / 10 × 10000 ≈ +2 bps
    expect(out.forwardRate).toBeCloseTo(10.0519, 3);
    expect(out.xcsImpactBps).toBeGreaterThan(0);
  });

  it('positive XCS makes the foreign leg more expensive (lower forward)', () => {
    // +20 bps on foreign → F = S × (1 + r_d T) / (1 + (r_f + 0.002) × T) → lower F
    const plain = computeForwardWithBasis(10, 0.02, 0.01, 1, 0);
    const basis = computeForwardWithBasis(10, 0.02, 0.01, 1, 20); // +20 bps
    expect(basis.forwardRate).toBeLessThan(plain.forwardRate);
  });
});

describe('buildForwardQuoteWithBasis (P1.2)', () => {
  it('exposes xcsBpsUsed and xcsImpactBps on the returned quote', () => {
    const q = buildForwardQuoteWithBasis('EUR', 10, '3M', 1, 'BUY', 0);
    expect(q.xcsBpsUsed).toBe(DEFAULT_XCS_BPS.EUR['3M']);
    expect(typeof q.xcsImpactBps).toBe('number');
  });

  it('returns bid/ask spread around the basis-adjusted mid', () => {
    const q = buildForwardQuoteWithBasis('EUR', 10, '3M', 1, 'BUY', 10);
    expect(q.ask!).toBeGreaterThan(q.forwardRate);
    expect(q.forwardRate).toBeGreaterThan(q.bid!);
  });

  it('returns 0 XCS for non-XCS currencies', () => {
    const q = buildForwardQuoteWithBasis('GBP', 10, '3M', 1, 'BUY', 0);
    expect(q.xcsBpsUsed).toBe(0);
    expect(q.xcsImpactBps).toBe(0);
  });
});
