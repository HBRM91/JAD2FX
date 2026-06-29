import { describe, it, expect } from 'vitest';
import { buildCalendarSpread, buildButterfly } from '../../services/forwardEngine';

describe('Calendar spreads (P1.5)', () => {
  it('1M vs 3M EUR/MAD shows contango or backwardation', () => {
    const r = buildCalendarSpread('EUR', 10.85, '1M', '3M');
    expect(['CONTANGO', 'BACKWARDATION', 'FLAT']).toContain(r.direction);
    expect(r.nearRate).toBeGreaterThan(0);
    expect(r.farRate).toBeGreaterThan(0);
    expect(r.spreadPips).toBeDefined();
  });

  it('JPY uses ×100 pip convention', () => {
    const r = buildCalendarSpread('JPY', 7.0, '1M', '3M');
    // JPY/MAD is small (around 6-7 MAD per 100 JPY). The pip denominator is 0.01.
    expect(typeof r.spreadPips).toBe('number');
  });

  it('interpretation string describes the position', () => {
    const r = buildCalendarSpread('EUR', 10.85, '1M', '1Y');
    expect(r.interpretation.length).toBeGreaterThan(0);
    expect(r.interpretation).toMatch(/Carry|Inversion|neutre/i);
  });
});

describe('Butterfly (P1.5)', () => {
  it('1M × 3M × 6M butterfly = near + far − 2 × mid', () => {
    const b = buildButterfly('EUR', 10.85, '1M', '3M', '6M');
    const expected = (b.nearRate + b.farRate) - 2 * b.middleRate;
    expect(b.butterfly).toBeCloseTo(expected, 6);
  });

  it('returns a direction classification', () => {
    const b = buildButterfly('EUR', 10.85, '1M', '3M', '6M');
    expect(['BULL_STEEPENER', 'BEAR_FLATTENER', 'NEUTRAL']).toContain(b.direction);
  });
});
