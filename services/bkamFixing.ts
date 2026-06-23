import { FixingDayRow } from '../types';
import { BKAM_CURRENCIES, GULF_USD_RATES, DEFAULT_BASKET_CONFIG } from '../constants';
import { fetchBkamVirementDate, getLastNWorkingDays as bkamWorkingDays } from './bkamApi';

const K     = DEFAULT_BASKET_CONFIG.referenceBasketValue; // 10.49
const EUR_W = DEFAULT_BASKET_CONFIG.eurWeight;            // 0.60
const USD_W = DEFAULT_BASKET_CONFIG.usdWeight;            // 0.40

// ECB symbols we can request from Frankfurter (Gulf pegs not available)
const ECB_CODES = BKAM_CURRENCIES
  .filter(c => c.code !== 'EUR' && !GULF_USD_RATES[c.code])
  .map(c => c.code);

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

// ─── Row builder from ECB/Frankfurter rates ───────────────────────────────────

function buildRow(date: string, rates: Record<string, number>, source: FixingDayRow['source'] = 'ECB_PROXY'): FixingDayRow {
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
    source,
  };
}

// ─── Row builder from BKAM official CoursVirement data ───────────────────────

function buildRowFromBkam(date: string, madByCode: Record<string, number>): FixingDayRow {
  // madByCode: currency code → MAD per 1 unit (already normalized by uniteDevise)
  const usdMad_ecb = madByCode['USD'];
  const eurMad_ecb = madByCode['EUR'];

  if (!usdMad_ecb || !eurMad_ecb) throw new Error('Missing USD or EUR rate');

  const eurUsd = eurMad_ecb / usdMad_ecb;
  const { usdMad: usdMad_basket, eurMad: eurMad_basket } = basketParity(eurUsd);

  const eurMad_div_bps = ((eurMad_ecb - eurMad_basket) / eurMad_basket) * 10000;
  const eurMad_div_pct = ((eurMad_ecb - eurMad_basket) / eurMad_basket) * 100;
  const usdMad_div_bps = ((usdMad_ecb - usdMad_basket) / usdMad_basket) * 10000;

  const allRates: Record<string, number> = {};
  for (const c of BKAM_CURRENCIES) {
    const perUnit = madByCode[c.code];
    if (perUnit !== undefined) {
      // perUnit is per-1-unit; multiply by bkamUnit for display (e.g. per 100 JPY)
      allRates[c.code] = +(perUnit * c.bkamUnit).toFixed(4);
    } else if (GULF_USD_RATES[c.code]) {
      // Gulf pegs — derive from USD/MAD
      allRates[c.code] = +(GULF_USD_RATES[c.code] * usdMad_ecb * c.bkamUnit).toFixed(4);
    }
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
    source: 'BKAM_OFFICIAL',
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

export async function fetchFixingHistory(nDays = 5, corsProxyUrl?: string): Promise<FixingDayRow[]> {
  // ── Primary: BKAM official CoursVirement ─────────────────────────────────
  if (corsProxyUrl) {
    try {
      const workingDays = bkamWorkingDays(nDays + 2);
      const settled = await Promise.allSettled(
        workingDays.map(d => fetchBkamVirementDate(corsProxyUrl, d)),
      );

      const bkamRows: FixingDayRow[] = [];
      for (let i = 0; i < settled.length; i++) {
        const r = settled[i];
        if (r.status !== 'fulfilled' || !r.value.length) continue;
        try {
          const madMap: Record<string, number> = {};
          for (const rate of r.value) {
            if (rate.uniteDevise > 0) madMap[rate.libDevise] = rate.moyen / rate.uniteDevise;
          }
          bkamRows.push(buildRowFromBkam(workingDays[i], madMap));
        } catch {
          // Skip if USD/EUR missing for this date
        }
      }

      if (bkamRows.length >= Math.min(nDays, 3)) {
        return bkamRows.slice(-nDays);
      }
    } catch {
      // Fall through to ECB
    }
  }

  // ── Fallback: Frankfurter ECB time series ─────────────────────────────────
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

    return targetDates.map(d => buildRow(d, data.rates[d], 'ECB_PROXY'));
  } catch {
    return getLastNWorkingDays(nDays).map(d => buildFallbackRow(d));
  }
}
