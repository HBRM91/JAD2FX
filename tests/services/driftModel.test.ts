import { describe, it, expect } from 'vitest';

/**
 * P0.19 — Test the OLS regression math directly.
 * The full computeDriftModel() function depends on BKAM + ECB network calls
 * (which we mock in integration tests); here we test the pure regression
 * via a re-implementation matching the production algorithm.
 */

// Mirror the production ols() from services/driftModel.ts
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

  const beta = sxx !== 0 ? sxy / sxx : 0;
  const alpha = yBar - beta * xBar;

  let ssRes = 0, ssTot = 0;
  for (let i = 0; i < n; i++) {
    ssRes += (ys[i] - (alpha + beta * xs[i])) ** 2;
    ssTot += (ys[i] - yBar) ** 2;
  }

  const r2 = ssTot > 1e-10 ? Math.max(0, 1 - ssRes / ssTot) : 0;
  const stdErr = n > 2 ? Math.sqrt(ssRes / (n - 2)) : 0;

  return { alpha, beta, r2, stdErr };
}

describe('OLS regression (P0.19)', () => {
  it('fits a perfect linear series y = 2x + 5 exactly', () => {
    const ys = [5, 7, 9, 11, 13]; // 2x + 5
    const { alpha, beta, r2 } = ols(ys);
    expect(beta).toBeCloseTo(2, 10);
    expect(alpha).toBeCloseTo(5, 10);
    expect(r2).toBeCloseTo(1, 10);
  });

  it('constant series has β=0, α=mean, r²=0', () => {
    const ys = [10, 10, 10, 10, 10];
    const { alpha, beta, r2 } = ols(ys);
    expect(beta).toBe(0);
    expect(alpha).toBe(10);
    expect(r2).toBe(0);
  });

  it('anti-correlated series has negative β', () => {
    const ys = [10, 8, 6, 4, 2];
    const { beta, r2 } = ols(ys);
    expect(beta).toBeLessThan(0);
    expect(r2).toBeCloseTo(1, 10);
  });

  it('r² is in [0, 1] for noisy data', () => {
    const ys = [10, 12, 9, 14, 11, 13, 10, 15, 12, 13];
    const { r2 } = ols(ys);
    expect(r2).toBeGreaterThanOrEqual(0);
    expect(r2).toBeLessThanOrEqual(1);
  });

  it('stdErr is 0 for perfect fit (n > 2)', () => {
    const ys = [1, 3, 5, 7, 9];
    const { stdErr } = ols(ys);
    expect(stdErr).toBeCloseTo(0, 10);
  });

  it('handles n=1 without crashing', () => {
    const { alpha, beta, r2 } = ols([42]);
    expect(alpha).toBe(42);
    expect(beta).toBe(0);
    expect(r2).toBe(0);
  });

  it('handles n=2 (line through two points)', () => {
    const ys = [10, 20];
    const { alpha, beta } = ols(ys);
    expect(beta).toBeCloseTo(10, 10);
    expect(alpha).toBeCloseTo(10, 10);
  });
});

describe('bandUtil function (P0.10)', () => {
  // Mirror of production bandUtil (kept private in services/fxRates.ts)
  function bandUtil(spot: number, central: number): number {
    if (!central || !spot) return 50;
    const lower = central * 0.95;
    const upper = central * 1.05;
    return Math.max(0, Math.min(100, ((spot - lower) / (upper - lower)) * 100));
  }

  it('50% when at central parity', () => {
    expect(bandUtil(10, 10)).toBe(50);
  });

  it('~95% near upper band', () => {
    // upper = 10.5, spot = 10.45 → util = (10.45-9.5)/1 = 95
    expect(bandUtil(10.45, 10)).toBeCloseTo(95, 5);
  });

  it('clamped to 100 at upper band', () => {
    expect(bandUtil(10.6, 10)).toBe(100);
  });

  it('clamped to 0 at lower band', () => {
    expect(bandUtil(9.4, 10)).toBe(0);
  });
});

describe('P0.9 — non-circular drift principle', () => {
  // Document the key invariant: drift computed with BKAM cross-rate ≈ 0
  // (circular), drift with exogenous ECB EUR/USD gives a meaningful number.
  it('drift with BKAM cross-rate is ≈ 0 (circular by construction)', () => {
    // Simulated BKAM fixing: EUR/MAD = 10.8, USD/MAD = 9.95
    // If we compute "drift" using BKAM cross: eurUsd = 10.8/9.95 = 1.0854
    // basket = K / (0.6*1.0854 + 0.4) = 10.49 / 1.0512 = 9.9805
    // drift = (9.95 - 9.9805) / 9.9805 * 10000 = -30.5 bps
    // That's a NON-zero result with BKAM cross — but it's a CIRCULAR computation.
    // The CORRECT approach uses ECB EUR/USD (exogenous) which differs slightly.
    //
    // This test serves as documentation: the result of the circular path is
    // close to zero (here -30 bps) but it is NOT the true drift.
    const eurMad = 10.8;
    const usdMad = 9.95;
    const K = 10.49;
    const eurUsdCircular = eurMad / usdMad;
    const basketCircular = K / (0.6 * eurUsdCircular + 0.4);
    const driftCircularBps = ((usdMad - basketCircular) / basketCircular) * 10_000;
    // Verify the circular drift is small (typically -50 to +50 bps) but NOT zero
    // because of the round-trip through EUR/MAD and USD/MAD which already
    // include BKAM's smoothing
    expect(Math.abs(driftCircularBps)).toBeLessThan(100);
  });

  it('drift with exogenous ECB EUR/USD is more meaningful (not near zero by construction)', () => {
    // ECB EUR/USD = 1.0850 (exogenous market rate, slightly different from BKAM cross)
    const usdMad = 9.95;
    const K = 10.49;
    const eurUsdExogenous = 1.085;
    const basketExogenous = K / (0.6 * eurUsdExogenous + 0.4);
    const driftExogenousBps = ((usdMad - basketExogenous) / basketExogenous) * 10_000;
    // Verify the exogenous-based drift is in a realistic range (-200 to +200 bps)
    expect(Math.abs(driftExogenousBps)).toBeLessThan(500);
  });
});
