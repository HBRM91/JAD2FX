import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * P1.25 — BKAM API fixture-based tests.
 * Records real BKAM CoursVirement responses, parses them, and verifies invariants.
 */

const COURS_VIREMENT_FIXTURE = [
  { date: '2026-06-26T12:30:00', libDevise: 'EUR', moyen: 10.8517, uniteDevise: 1 },
  { date: '2026-06-26T12:30:00', libDevise: 'USD', moyen: 9.9471, uniteDevise: 1 },
  { date: '2026-06-26T12:30:00', libDevise: 'GBP', moyen: 12.5842, uniteDevise: 1 },
  { date: '2026-06-26T12:30:00', libDevise: 'JPY', moyen: 6.6421, uniteDevise: 100 },
  { date: '2026-06-26T12:30:00', libDevise: 'CHF', moyen: 11.4561, uniteDevise: 1 },
  { date: '2026-06-26T12:30:00', libDevise: 'CAD', moyen: 7.3164, uniteDevise: 1 },
  { date: '2026-06-26T12:30:00', libDevise: 'SAR', moyen: 2.6527, uniteDevise: 1 },
  { date: '2026-06-26T12:30:00', libDevise: 'AED', moyen: 2.7081, uniteDevise: 1 },
  { date: '2026-06-26T12:30:00', libDevise: 'QAR', moyen: 2.7322, uniteDevise: 1 },
  { date: '2026-06-26T12:30:00', libDevise: 'KWD', moyen: 32.3647, uniteDevise: 1 },
  { date: '2026-06-26T12:30:00', libDevise: 'SEK', moyen: 0.9491, uniteDevise: 1 },
  { date: '2026-06-26T12:30:00', libDevise: 'NOK', moyen: 0.9334, uniteDevise: 1 },
  { date: '2026-06-26T12:30:00', libDevise: 'DKK', unaryDevise: 1, moyen: 1.4526, uniteDevise: 1 },
  { date: '2026-06-26T12:30:00', libDevise: 'CNY', moyen: 1.3792, uniteDevise: 1 },
];

const COURS_BBE_FIXTURE = [
  { date: '2026-06-26T08:30:00', libDevise: 'EUR', achatClientele: 10.8317, venteClientele: 10.8717, uniteDevise: 1 },
  { date: '2026-06-26T08:30:00', libDevise: 'USD', achatClientele: 9.9271, venteClientele: 9.9671, uniteDevise: 1 },
];

import { virementToMadPerUnit, bbeToMadPerUnit } from '../../services/bkamApi';

describe('BKAM API parsers (P1.25)', () => {
  it('virementToMadPerUnit: divides by uniteDevise', () => {
    const out = virementToMadPerUnit(COURS_VIREMENT_FIXTURE as any);
    expect(out.EUR).toBe(10.8517);
    expect(out.USD).toBe(9.9471);
    // JPY is per 100 → divides by 100
    expect(out.JPY).toBeCloseTo(0.066421, 6);
    // SEK / NOK / DKK / CNY stay as-is (1 unit)
    expect(out.SEK).toBe(0.9491);
    expect(out.CNY).toBe(1.3792);
  });

  it('virementToMadPerUnit: handles malformed input gracefully', () => {
    expect(virementToMadPerUnit([])).toEqual({});
    expect(virementToMadPerUnit(null as any)).toEqual({});
  });

  it('virementToMadPerUnit: skips entries with zero uniteDevise (avoid div-by-zero)', () => {
    const out = virementToMadPerUnit([
      { libDevise: 'TEST', moyen: 1, uniteDevise: 0 },
      { libDevise: 'USD', moyen: 9.95, uniteDevise: 1 },
    ] as any);
    expect(out.TEST).toBeUndefined();
    expect(out.USD).toBe(9.95);
  });

  it('bbeToMadPerUnit: parses bid/ask per unit', () => {
    const out = bbeToMadPerUnit(COURS_BBE_FIXTURE as any);
    expect(out.EUR).toEqual({ bid: 10.8317, ask: 10.8717 });
    expect(out.USD.bid).toBe(9.9271);
    // Ask > Bid (positive spread)
    expect(out.EUR.ask).toBeGreaterThan(out.EUR.bid);
  });

  it('fixtures preserve the publication date', () => {
    expect(COURS_VIREMENT_FIXTURE[0].date).toContain('2026-06-26');
    expect(COURS_BBE_FIXTURE[0].date).toContain('2026-06-26');
  });
});
