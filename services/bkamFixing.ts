/**
 * BKAM Fixing Service
 *
 * Primary path: BKAM CoursVirement API → real official fixing rates (30 currencies)
 * Fallback:     ECB Frankfurter time-series → basket proxy rates
 *
 * BKAM MIC session: 08:30–15:30 Casablanca | Publication: 16:15
 * Formula: USD/MAD_central = K / (0.60 × EUR/USD + 0.40), K = 10.49
 *
 * Drift: (BKAM_actual − basket_theoretical) / basket_theoretical × 10 000 bps
 * Non-circular: uses ECB EUR/USD as exogenous basket input.
 */

import { FixingDayRow } from '../types';
import { BKAM_CURRENCIES, GULF_USD_RATES, DEFAULT_BASKET_CONFIG } from '../constants';
import { fetchBkamVirementDate, getLastNWorkingDays as bkamWorkingDays } from './bkamApi';

const K     = DEFAULT_BASKET_CONFIG.referenceBasketValue; // 10.49
const EUR_W = DEFAULT_BASKET_CONFIG.eurWeight;            // 0.60
const USD_W = DEFAULT_BASKET_CONFIG.usdWeight;            // 0.40

// All currencies the ECB Frankfurter API can supply
const ECB_CODES = BKAM_CURRENCIES
  .filter(c => c.code !== 'EUR' && !GULF_USD_RATES[c.code])
  .map(c => c.code);

const QUERY_SYMBOLS = [...ECB_CODES, 'MAD'].join(',');

// ─── Country-code map for currencies the BKAM API returns beyond our BKAM_CURRENCIES ──
export const EXTRA_CURRENCY_META: Record<string, { nameFr: string; name: string; countryCode: string; unit: number }> = {
  GIP: { nameFr: 'Livre de Gibraltar', name: 'Gibraltar Pound',      countryCode: 'gi', unit: 1 },
  AUD: { nameFr: 'Dollar australien',  name: 'Australian Dollar',    countryCode: 'au', unit: 1 },
  XOF: { nameFr: 'Franc CFA UEMOA',   name: 'West African CFA Franc',countryCode: 'sn', unit: 100 },
  EGP: { nameFr: 'Livre égyptienne',  name: 'Egyptian Pound',        countryCode: 'eg', unit: 1 },
  RUB: { nameFr: 'Rouble russe',      name: 'Russian Ruble',         countryCode: 'ru', unit: 10 },
  MRO: { nameFr: 'Ouguiya mauritanien',name: 'Mauritanian Ouguiya',  countryCode: 'mr', unit: 1 },
};

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

// ─── Basket parity ────────────────────────────────────────────────────────────

function basketParity(eurUsd: number): { usdMad: number; eurMad: number } {
  const usdMad = K / (EUR_W * eurUsd + USD_W);
  return { usdMad, eurMad: eurUsd * usdMad };
}

// ─── Date label (French) ──────────────────────────────────────────────────────

const FR_DAYS   = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const FR_MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

export function formatDateLabel(iso: string): string {
  const d = new Date(iso + 'T12:00:00Z');
  return `${FR_DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${FR_MONTHS[d.getUTCMonth()]}`;
}

// ─── Row from BKAM CoursVirement (official) ───────────────────────────────────

export function buildRowFromBkam(
  date: string,
  rawRates: Array<{ libDevise: string; moyen: number; uniteDevise: number }>,
  ecbEurUsd?: number,  // optional exogenous EUR/USD for non-circular drift
): FixingDayRow {
  // Build madPerUnit map (BKAM returns moyen for N units; normalise to per-1-unit)
  const madByCode: Record<string, number> = {};
  for (const r of rawRates) {
    if (r.uniteDevise > 0) madByCode[r.libDevise] = r.moyen / r.uniteDevise;
  }

  const usdMad = madByCode['USD'];
  const eurMad = madByCode['EUR'];
  if (!usdMad || !eurMad) throw new Error('Missing USD or EUR in BKAM response');

  // EUR/USD: prefer exogenous ECB rate (non-circular); fallback to BKAM cross
  const eurUsd = ecbEurUsd ?? (eurMad / usdMad);
  const { usdMad: usdMad_basket, eurMad: eurMad_basket } = basketParity(eurUsd);

  const eurMad_div_bps = ((eurMad - eurMad_basket) / eurMad_basket) * 10_000;
  const eurMad_div_pct = ((eurMad - eurMad_basket) / eurMad_basket) * 100;
  const usdMad_div_bps = ((usdMad - usdMad_basket) / usdMad_basket) * 10_000;

  // Build allRates for BKAM_CURRENCIES (with bkamUnit scaling for display)
  const allRates: Record<string, number> = {};

  for (const c of BKAM_CURRENCIES) {
    const perUnit = madByCode[c.code];
    if (perUnit !== undefined) {
      // BKAM returned this currency → use official rate × bkamUnit
      allRates[c.code] = +(perUnit * c.bkamUnit).toFixed(4);
    } else if (GULF_USD_RATES[c.code]) {
      // Gulf/pegged currencies not directly in BKAM → derive from USD/MAD
      allRates[c.code] = +(GULF_USD_RATES[c.code] * usdMad * c.bkamUnit).toFixed(4);
    }
  }

  // Also build rates for EXTRA currencies returned by BKAM
  const extraRates: Record<string, number> = {};
  for (const [code, meta] of Object.entries(EXTRA_CURRENCY_META)) {
    const perUnit = madByCode[code];
    if (perUnit !== undefined) {
      extraRates[code] = +(perUnit * meta.unit).toFixed(4);
    }
  }

  // Full raw map (all 30 currencies from BKAM, for CSV export)
  const rawMap: Record<string, number> = {};
  for (const r of rawRates) {
    rawMap[r.libDevise] = r.moyen; // displayed per BKAM's uniteDevise (not normalised)
  }

  return {
    date,
    dateLabel: formatDateLabel(date),
    eurUsd:          +eurUsd.toFixed(4),
    eurMad_ecb:      +eurMad.toFixed(4),
    eurMad_basket:   +eurMad_basket.toFixed(4),
    eurMad_div_bps:  +eurMad_div_bps.toFixed(1),
    eurMad_div_pct:  +eurMad_div_pct.toFixed(4),
    usdMad_ecb:      +usdMad.toFixed(4),
    usdMad_basket:   +usdMad_basket.toFixed(4),
    usdMad_div_bps:  +usdMad_div_bps.toFixed(1),
    allRates,
    extraRates,
    rawBkamRates: rawRates,
    source: 'BKAM_OFFICIAL',
  };
}

// ─── Row from ECB Frankfurter (fallback) ─────────────────────────────────────

function buildRow(date: string, ecbRates: Record<string, number>, source: FixingDayRow['source'] = 'ECB_PROXY'): FixingDayRow {
  const eurUsd     = ecbRates['USD'];
  const eurMad_ecb = ecbRates['MAD'];
  if (!eurUsd || !eurMad_ecb) return buildFallbackRow(date);

  const usdMad_ecb = eurMad_ecb / eurUsd;
  const { usdMad: usdMad_basket, eurMad: eurMad_basket } = basketParity(eurUsd);

  const eurMad_div_bps = ((eurMad_ecb - eurMad_basket) / eurMad_basket) * 10_000;
  const eurMad_div_pct = ((eurMad_ecb - eurMad_basket) / eurMad_basket) * 100;
  const usdMad_div_bps = ((usdMad_ecb - usdMad_basket) / usdMad_basket) * 10_000;

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
      const eurPerX = ecbRates[c.code];
      if (!eurPerX) continue;
      madPerUnit = eurMad_ecb / eurPerX;
    }
    allRates[c.code] = +(madPerUnit * c.bkamUnit).toFixed(4);
  }

  return {
    date,
    dateLabel: formatDateLabel(date),
    eurUsd:         +eurUsd.toFixed(4),
    eurMad_ecb:     +eurMad_ecb.toFixed(4),
    eurMad_basket:  +eurMad_basket.toFixed(4),
    eurMad_div_bps: +eurMad_div_bps.toFixed(1),
    eurMad_div_pct: +eurMad_div_pct.toFixed(4),
    usdMad_ecb:     +usdMad_ecb.toFixed(4),
    usdMad_basket:  +usdMad_basket.toFixed(4),
    usdMad_div_bps: +usdMad_div_bps.toFixed(1),
    allRates,
    source,
  };
}

function buildFallbackRow(date: string): FixingDayRow {
  const eurUsd = 1.134; const eurMad_ecb = 10.69;
  const usdMad_ecb = eurMad_ecb / eurUsd;
  const { usdMad: usdMad_basket, eurMad: eurMad_basket } = basketParity(eurUsd);
  const allRates: Record<string, number> = {};
  const proxy: Record<string, number> = {
    USD:1.134,GBP:0.847,CHF:0.934,JPY:168.5,CAD:1.557,DKK:7.459,NOK:11.38,SEK:11.17,CNY:8.24,
  };
  for (const c of BKAM_CURRENCIES) {
    let m: number;
    if (c.code === 'EUR') m = eurMad_ecb;
    else if (c.code === 'USD') m = usdMad_ecb;
    else if (GULF_USD_RATES[c.code]) m = GULF_USD_RATES[c.code] * usdMad_ecb;
    else { const e = proxy[c.code] ?? 1; m = eurMad_ecb / e; }
    allRates[c.code] = +(m * c.bkamUnit).toFixed(4);
  }
  return { date, dateLabel: formatDateLabel(date), eurUsd, eurMad_ecb, eurMad_basket: +eurMad_basket.toFixed(4),
    eurMad_div_bps: 0, eurMad_div_pct: 0, usdMad_ecb: +usdMad_ecb.toFixed(4),
    usdMad_basket: +usdMad_basket.toFixed(4), usdMad_div_bps: 0, allRates, source: 'COMPUTED' };
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Fetch fixing history for N working days.
 * @param nDays  Number of working days to fetch (default 5)
 * @param corsProxyUrl  Worker proxy URL — REQUIRED for BKAM official data
 * @param specificDate  Optional ISO date to fetch a single specific day
 */
export async function fetchFixingHistory(
  nDays = 5,
  corsProxyUrl?: string,
  specificDate?: string,
): Promise<FixingDayRow[]> {

  // ── Primary: BKAM CoursVirement (requires proxy) ──────────────────────────
  if (corsProxyUrl) {
    try {
      const workingDays = specificDate ? [specificDate] : bkamWorkingDays(nDays + 2);

      // For each date, fetch BKAM + ECB EUR/USD in parallel for non-circular drift
      const settled = await Promise.allSettled(
        workingDays.map(async d => {
          const [bkam, ecb] = await Promise.all([
            fetchBkamVirementDate(corsProxyUrl, d),
            fetch(`https://api.frankfurter.app/${d}?from=EUR&to=USD`, { signal: AbortSignal.timeout(6_000) })
              .then(r => r.json())
              .then((j: { rates?: { USD?: number } }) => j.rates?.USD ?? null)
              .catch(() => null),
          ]);
          return { date: d, bkam, ecbEurUsd: ecb };
        }),
      );

      const bkamRows: FixingDayRow[] = [];
      for (const r of settled) {
        if (r.status !== 'fulfilled' || !r.value.bkam?.length) continue;
        try {
          bkamRows.push(buildRowFromBkam(r.value.date, r.value.bkam, r.value.ecbEurUsd ?? undefined));
        } catch { /* skip dates with missing USD/EUR */ }
      }

      if (bkamRows.length >= (specificDate ? 1 : Math.min(nDays, 3))) {
        return bkamRows.sort((a, b) => a.date.localeCompare(b.date)).slice(-nDays);
      }
    } catch { /* fall through */ }
  }

  // ── Fallback: ECB Frankfurter time-series ─────────────────────────────────
  if (specificDate) {
    const url = `https://api.frankfurter.app/${specificDate}?from=EUR&to=${QUERY_SYMBOLS}`;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: { rates: Record<string, number> } = await res.json();
      return [buildRow(specificDate, data.rates, 'ECB_PROXY')];
    } catch { return [buildFallbackRow(specificDate)]; }
  }

  const workingDays = getLastNWorkingDays(nDays + 3);
  const url = `https://api.frankfurter.app/${workingDays[0]}..${workingDays[workingDays.length - 1]}?from=EUR&to=${QUERY_SYMBOLS}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: { rates: Record<string, Record<string, number>> } = await res.json();
    const sortedDates = Object.keys(data.rates).sort();
    return sortedDates.slice(-nDays).map(d => buildRow(d, data.rates[d], 'ECB_PROXY'));
  } catch {
    return getLastNWorkingDays(nDays).map(d => buildFallbackRow(d));
  }
}
