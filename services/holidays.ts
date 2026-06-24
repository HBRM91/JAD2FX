/**
 * Moroccan public holiday calendar + T+2 spot value date engine.
 *
 * Moroccan interbank FX market: T+2 settlement, skipping weekends and
 * Moroccan public holidays. Fixed civic holidays are known in advance;
 * Islamic dates are approximated by year — update annually as Hilal
 * observations are announced.
 */

// ─── Fixed civic holidays (MM-DD) ────────────────────────────────────────────

const FIXED_HOLIDAYS: string[] = [
  '01-01', // Nouvel An
  '01-11', // Manifeste de l'Indépendance
  '05-01', // Fête du Travail
  '07-30', // Fête du Trône
  '08-14', // Allégeance des provinces du Sud
  '08-20', // Révolution du Roi et du Peuple
  '08-21', // Fête de la Jeunesse
  '11-06', // Marche Verte
  '11-18', // Fête de l'Indépendance
];

// ─── Islamic holidays — estimated Gregorian dates per year ──────────────────
// These are best estimates; adjust when Hilal confirmed.

type IslamicCalendar = Record<number, string[]>;

const ISLAMIC_HOLIDAYS: IslamicCalendar = {
  2024: [
    '2024-01-15', // Aid Al Mawlid
    '2024-04-09', '2024-04-10', // Aid Al Fitr
    '2024-06-16', '2024-06-17', // Aid Al Adha
    '2024-07-07', // Awal Moharrem (Hijri New Year)
  ],
  2025: [
    '2025-01-03', // Aid Al Mawlid (approx)
    '2025-03-30', '2025-03-31', // Aid Al Fitr (approx)
    '2025-06-06', '2025-06-07', // Aid Al Adha (approx)
    '2025-06-26', // Awal Moharrem (approx)
  ],
  2026: [
    '2026-12-23', // Aid Al Mawlid (approx)
    '2026-03-19', '2026-03-20', // Aid Al Fitr (approx)
    '2026-05-27', '2026-05-28', // Aid Al Adha (approx)
    '2026-06-16', // Awal Moharrem (approx)
  ],
};

// ─── Build holiday set for a given year ──────────────────────────────────────

function buildHolidaySet(year: number): Set<string> {
  const set = new Set<string>();
  for (const mmdd of FIXED_HOLIDAYS) {
    set.add(`${year}-${mmdd}`);
  }
  const islamic = ISLAMIC_HOLIDAYS[year] ?? [];
  for (const d of islamic) set.add(d);
  return set;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function isMoroccanHoliday(date: Date): boolean {
  const year = date.getFullYear();
  const set = buildHolidaySet(year);
  return set.has(isoDate(date));
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay(); // 0=Sun, 6=Sat
  return day === 0 || day === 6;
}

export function isBusinessDay(date: Date): boolean {
  return !isWeekend(date) && !isMoroccanHoliday(date);
}

/** Advance a date by 1 calendar day. */
function nextCalDay(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + 1);
  return d;
}

/** Return the next business day on or after `date`. */
export function nextBusinessDay(date: Date): Date {
  let d = new Date(date);
  while (!isBusinessDay(d)) d = nextCalDay(d);
  return d;
}

/**
 * Spot value date = T+2 business days (Moroccan calendar).
 * ON = T+1; TN = T+2.
 */
export function spotValueDate(tradeDate: Date = new Date()): Date {
  let d = nextCalDay(tradeDate);
  let bdays = 0;
  while (bdays < 2) {
    if (isBusinessDay(d)) bdays++;
    if (bdays < 2) d = nextCalDay(d);
  }
  return d;
}

/**
 * Settlement date for a given tenor from a trade date.
 * Respects T+2 spot convention and Moroccan holiday calendar.
 */
export function settlementDateWithHolidays(
  tenor: string,
  tradeDate: Date = new Date(),
): string {
  if (tenor === 'ON') {
    // Overnight: settle T+1 (next business day)
    return isoDate(nextBusinessDay(nextCalDay(tradeDate)));
  }

  const spot = spotValueDate(tradeDate);

  if (tenor === 'TN') {
    return isoDate(spot);
  }

  // For standard tenors: add calendar months/days from spot, then adjust to next biz day
  const days = tenorToCalDays(tenor);
  let settle = new Date(spot);
  settle.setDate(settle.getDate() + days);

  // Modified Following: if settlement falls on holiday/weekend, move to next biz day
  // but if that crosses into next month, move to previous biz day instead
  const origMonth = settle.getMonth();
  let adjusted = nextBusinessDay(settle);
  if (adjusted.getMonth() !== origMonth) {
    // Preceding convention: go back
    adjusted = new Date(settle);
    while (!isBusinessDay(adjusted)) {
      adjusted.setDate(adjusted.getDate() - 1);
    }
  }
  return isoDate(adjusted);
}

/** Returns today's public holidays (for UI display). */
export function getTodayHolidays(date: Date = new Date()): string[] {
  const year = date.getFullYear();
  const today = isoDate(date);
  const holidays: string[] = [];

  const HOLIDAY_NAMES: Record<string, string> = {
    '01-01': 'Nouvel An',
    '01-11': "Manifeste de l'Indépendance",
    '05-01': 'Fête du Travail',
    '07-30': 'Fête du Trône',
    '08-14': 'Allégeance provinces du Sud',
    '08-20': 'Révolution du Roi et du Peuple',
    '08-21': 'Fête de la Jeunesse',
    '11-06': 'Marche Verte',
    '11-18': "Fête de l'Indépendance",
  };
  const ISLAMIC_NAMES: Record<string, string> = {
    [ISLAMIC_HOLIDAYS[year]?.[0]]: 'Aid Al Mawlid',
    [ISLAMIC_HOLIDAYS[year]?.[1]]: 'Aid Al Fitr (J1)',
    [ISLAMIC_HOLIDAYS[year]?.[2]]: 'Aid Al Fitr (J2)',
    [ISLAMIC_HOLIDAYS[year]?.[3]]: 'Aid Al Adha (J1)',
    [ISLAMIC_HOLIDAYS[year]?.[4]]: 'Aid Al Adha (J2)',
    [ISLAMIC_HOLIDAYS[year]?.[5]]: 'Awal Moharrem',
  };

  const mmdd = today.slice(5);
  if (HOLIDAY_NAMES[mmdd]) holidays.push(HOLIDAY_NAMES[mmdd]);
  const islamicName = ISLAMIC_NAMES[today];
  if (islamicName) holidays.push(islamicName);

  return holidays;
}

// ─── Internal: tenor → calendar days (approximate) ───────────────────────────

function tenorToCalDays(tenor: string): number {
  const map: Record<string, number> = {
    '1W': 7, '2W': 14, '1M': 30, '2M': 61, '3M': 91,
    '6M': 182, '9M': 273, '1Y': 365, '2Y': 730, '3Y': 1095, '5Y': 1826,
    'SW': 7, 'ON': 1, 'TN': 2,
  };
  return map[tenor] ?? 91;
}
