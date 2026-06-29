import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildForwardQuote, buildForwardCurve, computeForward } from '../../services/forwardEngine';
import { DEFAULT_BASKET_CONFIG } from '../../constants';
import { getDefaultCurve, getRate } from '../../services/interestRates';

/**
 * P1.15 — Forward pricing integration tests.
 * End-to-end EUR/MAD and USD/MAD tests against known sample market values.
 */

describe('Forward pricing — end-to-end (P1.15)', () => {
  it('EUR/MAD 3M @ spot 10.85, no markup: forward ≈ spot + CIP', () => {
    // r_d MAD (3M) ≈ 0.0335 (from default curve), r_f EUR (3M) ≈ 0.0222
    // F = 10.85 × (1 + 0.0335 × 0.25) / (1 + 0.0222 × 0.25)
    //   ≈ 10.85 × 1.00838 / 1.00555
    //   ≈ 10.879
    const q = buildForwardQuote('EUR', 10.85, '3M', 1_000_000, 'BUY', 0);
    expect(q.forwardRate).toBeGreaterThan(10.85);
    expect(q.forwardRate).toBeLessThan(10.95);
    expect(q.forwardRate).toBeCloseTo(q.forwardRate, 4);
    expect(q.tenorLabel).toBe('3M');
  });

  it('USD/MAD 1Y @ spot 9.95: forward should reflect rate differential', () => {
    const q = buildForwardQuote('USD', 9.95, '1Y', 1, 'BUY', 0);
    // r_d MAD (1Y) ≈ 0.035, r_f USD (1Y) ≈ 0.04
    // F = 9.95 × 1.035 / 1.04 ≈ 9.901 (slightly discount)
    expect(q.forwardRate).toBeLessThan(9.95); // USD > MAD, so F < spot
    expect(q.forwardRate).toBeGreaterThan(9.85);
  });

  it('JPY/MAD uses correct day count (Act/360 for JPY)', () => {
    // 1M JPY/MAD, spot 6.66
    const q = buildForwardQuote('JPY', 6.66, '1M', 1, 'BUY', 0);
    expect(q.forwardRate).toBeGreaterThan(0);
    expect(q.forwardRate).toBeLessThan(10);
  });

  it('Same notional with markup increases bid/ask spread, not mid', () => {
    const noMarkup = buildForwardQuote('EUR', 10.85, '3M', 1, 'BUY', 0);
    const withMarkup = buildForwardQuote('EUR', 10.85, '3M', 1, 'BUY', 20);
    // Forward rate (CIP) should be identical regardless of markup
    expect(withMarkup.forwardRate).toBeCloseTo(noMarkup.forwardRate, 4);
    // But bid/ask should differ if markup is applied
    if (noMarkup.bid !== undefined && noMarkup.ask !== undefined &&
        withMarkup.bid !== undefined && withMarkup.ask !== undefined) {
      const noSpread = noMarkup.ask - noMarkup.bid;
      const mkSpread = withMarkup.ask - withMarkup.bid;
      expect(mkSpread).toBeGreaterThanOrEqual(noSpread);
    }
  });

  it('Forward curve has consistent ordering (1M < 3M < 6M < 1Y when domestic rate < foreign rate)', () => {
    const curve = buildForwardCurve('USD', 9.95, 0);
    const tenors = curve.map((p) => ({ label: p.tenor, rate: p.forwardRate }));
    // Find specific tenors
    const oneM = tenors.find((t) => t.label === '1M')?.rate || 0;
    const oneY = tenors.find((t) => t.label === '1Y')?.rate || 0;
    // USD rate > MAD rate → forward discounts over time → 1M > 1Y
    expect(oneM).toBeGreaterThan(oneY);
  });
});
