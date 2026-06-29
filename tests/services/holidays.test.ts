import { describe, it, expect } from 'vitest';
import {
  isMoroccanHoliday,
  isBusinessDay,
  isWeekend,
  nextBusinessDay,
  previousBusinessDay,
  previousBusinessDayISO,
  spotValueDate,
  settlementDateWithHolidays,
  isJumuahReducedLiquidity,
  getTodayHolidays,
} from '../../services/holidays';

describe('isWeekend / isBusinessDay', () => {
  it('identifies Saturday and Sunday as weekend', () => {
    expect(isWeekend(new Date('2026-06-27T12:00:00Z'))).toBe(true); // Sat
    expect(isWeekend(new Date('2026-06-28T12:00:00Z'))).toBe(true); // Sun
    expect(isWeekend(new Date('2026-06-29T12:00:00Z'))).toBe(false); // Mon
  });

  it('isBusinessDay = !weekend && !MA holiday', () => {
    expect(isBusinessDay(new Date('2026-06-29T12:00:00Z'))).toBe(true); // Mon, not a holiday
  });
});

describe('isMoroccanHoliday', () => {
  it('detects fixed civic holidays (P0.18)', () => {
    expect(isMoroccanHoliday(new Date('2026-01-01T12:00:00Z'))).toBe(true); // Nouvel An
    expect(isMoroccanHoliday(new Date('2026-07-30T12:00:00Z'))).toBe(true); // Fête du Trône
    expect(isMoroccanHoliday(new Date('2026-11-18T12:00:00Z'))).toBe(true); // Fête de l'Indépendance
  });

  it('non-holiday date returns false', () => {
    expect(isMoroccanHoliday(new Date('2026-06-29T12:00:00Z'))).toBe(false);
    expect(isMoroccanHoliday(new Date('2026-03-15T12:00:00Z'))).toBe(false);
  });
});

describe('nextBusinessDay', () => {
  it('returns the same day if already a business day (on-or-after semantics)', () => {
    // Friday 2026-06-26 is already a business day → return itself
    const fri = new Date('2026-06-26T12:00:00Z');
    const nbd = nextBusinessDay(fri);
    expect(nbd.toISOString().slice(0, 10)).toBe('2026-06-26');
  });

  it('skips Saturday to Monday', () => {
    const sat = new Date('2026-06-27T12:00:00Z');
    const nbd = nextBusinessDay(sat);
    expect(nbd.getUTCDay()).toBe(1); // Monday
    expect(nbd.toISOString().slice(0, 10)).toBe('2026-06-29');
  });

  it('skips MA holidays', () => {
    // Fête du Trône 2026-07-30 (Thursday) → Friday 2026-07-31
    const throne = new Date('2026-07-30T12:00:00Z');
    const nbd = nextBusinessDay(throne);
    expect(nbd.toISOString().slice(0, 10)).toBe('2026-07-31');
  });
});

describe('previousBusinessDay (P0.7 fix)', () => {
  it('skips weekends — Monday → Friday', () => {
    const mon = new Date('2026-06-29T12:00:00Z');
    const pbd = previousBusinessDay(mon);
    expect(pbd.getUTCDay()).toBe(5); // Friday
    expect(pbd.toISOString().slice(0, 10)).toBe('2026-06-26');
  });

  it('skips MA holidays — day after Fête du Trône → Wednesday', () => {
    // 2026-07-31 (Fri) → 2026-07-29 (Wed) since 30th is Throne Day
    const fri = new Date('2026-07-31T12:00:00Z');
    const pbd = previousBusinessDay(fri);
    expect(pbd.toISOString().slice(0, 10)).toBe('2026-07-29');
  });

  it('previousBusinessDayISO returns YYYY-MM-DD', () => {
    const iso = previousBusinessDayISO(new Date('2026-06-29T12:00:00Z'));
    expect(iso).toBe('2026-06-26');
  });
});

describe('spotValueDate (T+2)', () => {
  it('T+2 from a Tuesday = Thursday', () => {
    const tue = new Date('2026-06-23T12:00:00Z');
    const spot = spotValueDate(tue);
    expect(spot.toISOString().slice(0, 10)).toBe('2026-06-25');
  });

  it('T+2 skips weekend — Friday → Tuesday', () => {
    const fri = new Date('2026-06-26T12:00:00Z');
    const spot = spotValueDate(fri);
    expect(spot.toISOString().slice(0, 10)).toBe('2026-06-30');
  });

  it('T+2 skips MA holidays', () => {
    // Wed 2026-07-29 + 2bd:
    //  - day 1: 2026-07-30 (Throne day, skip) → 2026-07-31
    //  - day 2: 2026-08-03 (skip weekend)
    // Result: 2026-08-03
    const wed = new Date('2026-07-29T12:00:00Z');
    const spot = spotValueDate(wed);
    expect(spot.toISOString().slice(0, 10)).toBe('2026-08-03');
  });
});

describe('settlementDateWithHolidays', () => {
  it('ON = T+1 (next business day)', () => {
    // 2026-06-29 (Mon) ON → Tue 2026-06-30
    const mon = new Date('2026-06-29T12:00:00Z');
    expect(settlementDateWithHolidays('ON', mon)).toBe('2026-06-30');
  });

  it('TN = T+2 (spot date)', () => {
    const mon = new Date('2026-06-29T12:00:00Z');
    expect(settlementDateWithHolidays('TN', mon)).toBe('2026-07-01');
  });

  it('1M = 30 days from spot, adjusted to next biz day', () => {
    const mon = new Date('2026-06-29T12:00:00Z');
    // spot = 2026-07-01, +30 = 2026-07-31 (Fri, OK)
    expect(settlementDateWithHolidays('1M', mon)).toBe('2026-07-31');
  });
});

describe('isJumuahReducedLiquidity', () => {
  it('Gulf currencies have reduced liquidity on Friday (Riyadh time)', () => {
    // Pick a Friday in Riyadh's week — 2026-06-26 is Friday
    const fri = new Date('2026-06-26T12:00:00Z');
    expect(isJumuahReducedLiquidity('SAR', fri)).toBe(true);
    expect(isJumuahReducedLiquidity('AED', fri)).toBe(true);
    expect(isJumuahReducedLiquidity('JOD', fri)).toBe(true);
  });

  it('Gulf currencies normal liquidity on weekdays', () => {
    const wed = new Date('2026-06-24T12:00:00Z');
    expect(isJumuahReducedLiquidity('SAR', wed)).toBe(false);
  });

  it('non-Gulf currencies never reduced', () => {
    const fri = new Date('2026-06-26T12:00:00Z');
    expect(isJumuahReducedLiquidity('EUR', fri)).toBe(false);
    expect(isJumuahReducedLiquidity('USD', fri)).toBe(false);
  });
});

describe('getTodayHolidays', () => {
  it('returns empty for non-holiday', () => {
    const mon = new Date('2026-06-29T12:00:00Z');
    expect(getTodayHolidays(mon)).toEqual([]);
  });

  it('returns holiday name for Fête du Trône', () => {
    const throne = new Date('2026-07-30T12:00:00Z');
    const list = getTodayHolidays(throne);
    expect(list.length).toBeGreaterThan(0);
    expect(list[0]).toContain('Trône');
  });
});
