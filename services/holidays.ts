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
    '2026-03-19', '2026-03-20', '2026-03-21', // Aid Al Fitr (fin Ramadan)
    '2026-05-27', '2026-05-28', '2026-05-29', // Aid Al Adha
    '2026-06-17', // Awal Moharrem (Hijri New Year 1448)
    '2026-09-25', // Aid Al Mawlid (Prophète)
  ],
  2027: [
    '2027-03-09', '2027-03-10', '2027-03-11', // Aid Al Fitr (approx)
    '2027-05-16', '2027-05-17', '2027-05-18', // Aid Al Adha (approx)
    '2027-06-06', // Awal Moharrem (approx)
    '2027-09-14', // Aid Al Mawlid (approx)
  ],
  // P1.13 — Extend through 2030. Dates are best estimates based on the
  // Umm al-Qura calendar; adjust when Hilal observations are confirmed.
  2028: [
    '2028-02-26', '2028-02-27', '2028-02-28', // Aid Al Fitr
    '2028-05-05', '2028-05-06', '2028-05-07', // Aid Al Adha
    '2028-05-25', // Awal Moharrem (Hijri 1449)
    '2028-09-03', // Aid Al Mawlid
  ],
  2029: [
    '2029-02-14', '2029-02-15', '2029-02-16', // Aid Al Fitr
    '2029-04-24', '2029-04-25', '2029-04-26', // Aid Al Adha
    '2029-05-14', // Awal Moharrem (Hijri 1450)
    '2029-08-23', '2029-08-24', // Aid Al Mawlid
  ],
  2030: [
    '2030-02-04', '2030-02-05', '2030-02-06', // Aid Al Fitr
    '2030-04-13', '2030-04-14', '2030-04-15', // Aid Al Adha
    '2030-05-03', // Awal Moharrem (Hijri 1451)
    '2030-08-12', '2030-08-13', // Aid Al Mawlid
  ],
};

// ─── Build holiday set for a given year ──────────────────────────────────────

const HIJRI_API_CACHE: Record<number, Set<string>> = {};

async function fetchHijriFromApi(year: number): Promise<Set<string>> {
  if (HIJRI_API_CACHE[year]) return HIJRI_API_CACHE[year];
  try {
    const base = (typeof window !== 'undefined' && (window as any).__JAD2_API__)
      || 'https://jad2fx-yahoo-proxy.hamzaelbouhali.workers.dev';
    const r = await fetch(`${base}/v1/hijri?year=${year}`, { signal: AbortSignal.timeout(5000) });
    if (!r.ok) throw new Error('API error');
    const data = await r.json();
    if (!data.holidays) throw new Error('Empty');
    const set = new Set<string>();
    for (const h of data.holidays) set.add(h.date);
    HIJRI_API_CACHE[year] = set;
    return set;
  } catch {
    const fallback = new Set(ISLAMIC_HOLIDAYS[year] ?? []);
    return fallback;
  }
}

async function buildHolidaySetAsync(year: number): Promise<Set<string>> {
  const set = new Set<string>();
  for (const mmdd of FIXED_HOLIDAYS) {
    set.add(`${year}-${mmdd}`);
  }
  const hijri = await fetchHijriFromApi(year);
  for (const d of hijri) set.add(d);
  return set;
}

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

/**
 * Async version of isBusinessDay that fetches Hijri dates from the worker
 * API (aladhan.com) when available. Use this for production paths; the
 * sync version uses hardcoded estimates.
 */
export async function isBusinessDayAsync(date: Date): Promise<boolean> {
  if (isWeekend(date)) return false;
  const year = date.getFullYear();
  const set = await buildHolidaySetAsync(year);
  return !set.has(isoDate(date));
}

/**
 * Async version of previousBusinessDay using live Hijri API.
 */
export async function previousBusinessDayAsync(date: Date = new Date()): Promise<Date> {
  const d = new Date(date);
  d.setDate(d.getDate() - 1);
  let set = await buildHolidaySetAsync(d.getFullYear());
  while (isWeekend(d) || set.has(isoDate(d))) {
    d.setDate(d.getDate() - 1);
    if (d.getFullYear() !== (new Date(d.getTime() + 86400000)).getFullYear()) {
      set = await buildHolidaySetAsync(d.getFullYear());
    }
  }
  return d;
}

/** Return the next business day on or after `date`. */
export function nextBusinessDay(date: Date): Date {
  let d = new Date(date);
  while (!isBusinessDay(d)) d = nextCalDay(d);
  return d;
}

/** Return the previous business day strictly before `date` (skipping weekends + MA holidays). */
export function previousBusinessDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - 1);
  while (!isBusinessDay(d)) d.setDate(d.getDate() - 1);
  return d;
}

/** Convenience: previous business day as ISO date string (YYYY-MM-DD). */
export function previousBusinessDayISO(date: Date = new Date()): string {
  return isoDate(previousBusinessDay(date));
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
  const settle = new Date(spot);
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

// ─── Jumu'ah liquidity flag ───────────────────────────────────────────────────
// Gulf & Levant markets observe reduced liquidity on Fridays (Jumu'ah prayer).

const JUMUAH_CURRENCIES = new Set(['SAR', 'AED', 'QAR', 'KWD', 'JOD', 'BHD', 'OMR']);

/** Returns true if the given currency has reduced Friday liquidity (Jumu'ah). */
export function isJumuahReducedLiquidity(currency: string, date: Date = new Date()): boolean {
  const riyadhDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Riyadh' }));
  return JUMUAH_CURRENCIES.has(currency) && riyadhDate.getDay() === 5;
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
