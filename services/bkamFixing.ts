import { FixingDayRow } from '../types';
import { BKAM_CURRENCIES, GULF_USD_RATES, DEFAULT_BASKET_CONFIG } from '../constants';

const K     = DEFAULT_BASKET_CONFIG.referenceBasketValue; // 10.49
const EUR_W = DEFAULT_BASKET_CONFIG.eurWeight;            // 0.60
const USD_W = DEFAULT_BASKET_CONFIG.usdWeight;            // 0.40

// ECB symbols we can request from Frankfurter (Gulf pegs not available)
const ECB_CODES = BKAM_CURRENCIES
  .filter(c => c.code !== 'EUR' && !GULF_USD_RATES[c.code])
  .map(c => c.code);

// We also need MAD so we get the actual ECB-published EUR/MAD rate
const QUERY_SYMBOLS = [...ECB_CODES, 'MAD'].join(',');

// ─── Working-day helpers ──────────────────────────────────────────────────────

function getLastNWorkingDays(n: number): string[] {
  const days: string[] = [];
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  while (days.length < n) {
    d.setUTCDate(d.getUTCDate() - 1);
    const dow = d.getUTCDay();
    if (dow !== 0 && dow !== 6) days.unshift(d.toISOString().slice(0, 10));
  }
  return days;
}

// ─── Basket parity formula ────────────────────────────────────────────────────

function basketParity(eurUsd: number): { usdMad: number; eurMad: number } {
  const usdMad = K / (EUR_W * eurUsd + USD_W);
  return { usdMad, eurMad: eurUsd * usdMad };
}

// ─── Date label formatter (French) ───────────────────────────────────────────

const FR_DAYS   = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const FR_MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

function formatDateLabel(iso: string): string {
  const d = new Date(iso + 'T12:00:00Z');
  return `${FR_DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${FR_MONTHS[d.getUTCMonth()]}`;
}

// ─── Row builder ──────────────────────────────────────────────────────────────

function buildRow(date: string, rates: Record<string, number>): FixingDayRow {
  const eurUsd     = rates['USD'];
  const eurMad_ecb = rates['MAD'];
  const usdMad_ecb = eurMad_ecb / eurUsd;

  const { usdMad: usdMad_basket, eurMad: eurMad_basket } = basketParity(eurUsd);

  const eurMad_div_bps = ((eurMad_ecb - eurMad_basket) / eurMad_basket) * 10000;
  const eurMad_div_pct = ((eurMad_ecb - eurMad_basket) / eurMad_basket) * 100;
  const usdMad_div_bps = ((usdMad_ecb - usdMad_basket) / usdMad_basket) * 10000;

  const allRates: Record<string, number> = {};
  for (const c of BKAM_CURRENCIES) {
    let madPerUnit: number;
    if (c.code === 'EUR') {
      madPerUnit = eurMad_ecb;
    } else if (c.code === 'USD') {
      madPerUnit = usdMad_ecb;
    } else if (GULF_USD_RATES[c.code]) {
      madPerUnit = GULF_USD_RATES[c.code] * usdMad_ecb;
    } else {
      const eurPerX = rates[c.code];
      if (!eurPerX) continue;
      // MAD per X = (EUR/MAD) / (EUR/X) = eurMad_ecb / eurPerX
      madPerUnit = eurMad_ecb / eurPerX;
    }
    allRates[c.code] = +(madPerUnit * c.bkamUnit).toFixed(4);
  }

  return {
    date,
    dateLabel: formatDateLabel(date),
    eurUsd:          +eurUsd.toFixed(4),
    eurMad_ecb:      +eurMad_ecb.toFixed(4),
    eurMad_basket:   +eurMad_basket.toFixed(4),
    eurMad_div_bps:  +eurMad_div_bps.toFixed(1),
    eurMad_div_pct:  +eurMad_div_pct.toFixed(4),
    usdMad_ecb:      +usdMad_ecb.toFixed(4),
    usdMad_basket:   +usdMad_basket.toFixed(4),
    usdMad_div_bps:  +usdMad_div_bps.toFixed(1),
    allRates,
    source: 'API',
  };
}

function buildFallbackRow(date: string): FixingDayRow {
  const eurUsd     = 1.085;
  const eurMad_ecb = 10.817;
  const usdMad_ecb = eurMad_ecb / eurUsd;
  const { usdMad: usdMad_basket, eurMad: eurMad_basket } = basketParity(eurUsd);

  const allRates: Record<string, number> = {};
  const ecbProxy: Record<string, number> = {
    USD: 1.085, GBP: 0.860, CHF: 0.945, JPY: 162.5,
    CAD: 1.480, DKK: 7.460, NOK: 11.60, SEK: 11.40, CNY: 7.880,
  };
  for (const c of BKAM_CURRENCIES) {
    let madPerUnit: number;
    if (c.code === 'EUR') {
      madPerUnit = eurMad_ecb;
    } else if (c.code === 'USD') {
      madPerUnit = usdMad_ecb;
    } else if (GULF_USD_RATES[c.code]) {
      madPerUnit = GULF_USD_RATES[c.code] * usdMad_ecb;
    } else {
      const eurPerX = ecbProxy[c.code] ?? 1;
      madPerUnit = eurMad_ecb / eurPerX;
    }
    allRates[c.code] = +(madPerUnit * c.bkamUnit).toFixed(4);
  }

  return {
    date,
    dateLabel: formatDateLabel(date),
    eurUsd:         eurUsd,
    eurMad_ecb:     eurMad_ecb,
    eurMad_basket:  +eurMad_basket.toFixed(4),
    eurMad_div_bps: 0,
    eurMad_div_pct: 0,
    usdMad_ecb:     +usdMad_ecb.toFixed(4),
    usdMad_basket:  +usdMad_basket.toFixed(4),
    usdMad_div_bps: 0,
    allRates,
    source: 'COMPUTED',
  };
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function fetchFixingHistory(nDays = 5): Promise<FixingDayRow[]> {
  // Fetch a few extra working days in case of API gaps (e.g. public holidays)
  const workingDays = getLastNWorkingDays(nDays + 3);
  const startDate   = workingDays[0];
  const endDate     = workingDays[workingDays.length - 1];

  const url = `https://api.frankfurter.app/${startDate}..${endDate}?from=EUR&to=${QUERY_SYMBOLS}`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: { rates: Record<string, Record<string, number>> } = await res.json();

    const sortedDates = Object.keys(data.rates).sort();
    const targetDates = sortedDates.slice(-nDays);

    return targetDates.map(d => buildRow(d, data.rates[d]));
  } catch {
    // Return estimated fallback rows when API is unreachable
    return getLastNWorkingDays(nDays).map(d => buildFallbackRow(d));
  }
}
