import { BasketConfig, LiveRate, ChartDataPoint } from '../types';
import { BKAM_CURRENCIES, GULF_USD_RATES } from '../constants';
import { fetchBkamVirement, virementToMadPerUnit } from './bkamApi';

const FRANKFURTER_BASE = 'https://api.frankfurter.app';
const FRANKFURTER_URL = `${FRANKFURTER_BASE}/latest?from=EUR`;
const CACHE_TTL_MS = 5 * 60 * 1000;

// ─── Sanity filter: reject ticks that move > 2% in < 60 s ────────────────────
interface RateSnap { rate: number; ts: number; }
const _sanityCache: Record<string, RateSnap> = {};
const SANITY_MAX_CHANGE = 0.02;
const SANITY_WINDOW_MS  = 60_000;

function sanityFilter(currency: string, newRate: number): number {
  const prev = _sanityCache[currency];
  const now  = Date.now();
  if (prev && (now - prev.ts) < SANITY_WINDOW_MS) {
    const delta = Math.abs(newRate - prev.rate) / prev.rate;
    if (delta > SANITY_MAX_CHANGE) return prev.rate; // reject tick
  }
  _sanityCache[currency] = { rate: newRate, ts: now };
  return newRate;
}

// ─── Safety cage: clamp ECB-derived rates to ±5% of last BKAM fixing ─────────
// Per spec §4.4 — Safety Cage: [Official_Min × 1.02, Official_Max × 0.98]
let _lastBkamMadRates: Record<string, number> = {}; // currency → madPerUnit (raw, bkamUnit=1)

const CAGE_BAND  = 0.05; // ±5% allowed deviation from last BKAM fixing
const CAGE_INNER = 0.02; // 2% buffer inset (98% rule)

function applySafetyCage(currency: string, mid: number): { mid: number; isCapped: boolean } {
  const ref = _lastBkamMadRates[currency];
  if (!ref) return { mid, isCapped: false };
  const upper = ref * (1 + CAGE_BAND) * (1 - CAGE_INNER);
  const lower = ref * (1 - CAGE_BAND) * (1 + CAGE_INNER);
  if (mid > upper) return { mid: upper, isCapped: true };
  if (mid < lower) return { mid: lower, isCapped: true };
  return { mid, isCapped: false };
}

interface EurRateCache {
  rates: Record<string, number>;
  timestamp: number;
  date: string;
}

let rateCache: EurRateCache | null = null;

// Cache for yesterday's EUR rates (for 24h change calc)
interface PrevRateCache {
  rates: Record<string, number>;
  date: string;
  timestamp: number;
}
let prevRateCache: PrevRateCache | null = null;
const PREV_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function prevBizDay(): string {
  const d = new Date();
  // Go back to find the last weekday
  d.setDate(d.getDate() - 1);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

async function fetchPrevEurRates(): Promise<Record<string, number>> {
  if (prevRateCache && Date.now() - prevRateCache.timestamp < PREV_CACHE_TTL_MS) {
    return prevRateCache.rates;
  }
  try {
    const date = prevBizDay();
    const res = await fetch(`${FRANKFURTER_BASE}/${date}?from=EUR`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const eurUsd = data.rates['USD'] as number;
    const enriched: Record<string, number> = { ...data.rates };
    for (const [code, usdValue] of Object.entries(GULF_USD_RATES)) {
      enriched[code] = eurUsd / usdValue;
    }
    prevRateCache = { rates: enriched, date, timestamp: Date.now() };
    return enriched;
  } catch {
    return {};
  }
}

// Fallback EUR-based rates (approximate, used if all API calls fail)
const FALLBACK_EUR_RATES: Record<string, number> = {
  USD: 1.085, GBP: 0.860, CHF: 0.945, JPY: 162.5, CAD: 1.480,
  DKK: 7.460, NOK: 11.60, SEK: 11.40, CNY: 7.880,
};

async function fetchEurRates(corsProxyUrl?: string): Promise<{ rates: Record<string, number>; date: string; fromCache: boolean }> {
  if (rateCache && Date.now() - rateCache.timestamp < CACHE_TTL_MS) {
    return { rates: rateCache.rates, date: rateCache.date, fromCache: true };
  }

  // Primary: ECB Frankfurter
  try {
    const res = await fetch(FRANKFURTER_URL, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const eurUsd = data.rates['USD'] as number;
    const enriched: Record<string, number> = { ...data.rates };
    for (const [code, usdValue] of Object.entries(GULF_USD_RATES)) {
      enriched[code] = eurUsd / usdValue;
    }
    rateCache = { rates: enriched, timestamp: Date.now(), date: data.date };
    return { rates: enriched, date: data.date, fromCache: false };
  } catch { /* ECB failed — try Twelve Data */ }

  // Secondary: Twelve Data via Worker proxy (Yahoo Finance failover)
  if (corsProxyUrl) {
    try {
      const res = await fetch(`${corsProxyUrl}/api/forex/rates`, { signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        const data = await res.json();
        if (data.rates?.['USD']) {
          const eurUsd = data.rates['USD'] as number;
          const enriched: Record<string, number> = { ...data.rates };
          for (const [code, usdValue] of Object.entries(GULF_USD_RATES)) {
            enriched[code] = eurUsd / usdValue;
          }
          rateCache = { rates: enriched, timestamp: Date.now(), date: data.date ?? new Date().toISOString().slice(0, 10) };
          return { rates: enriched, date: rateCache.date, fromCache: false };
        }
      }
    } catch { /* Twelve Data also failed */ }
  }

  // Last resort: hardcoded fallback
  const eurUsd = FALLBACK_EUR_RATES['USD'];
  const fallback = { ...FALLBACK_EUR_RATES };
  for (const [code, usdValue] of Object.entries(GULF_USD_RATES)) {
    fallback[code] = eurUsd / usdValue;
  }
  return { rates: fallback, date: 'N/A', fromCache: false };
}

function isFallback(eurRates: Record<string, number>): boolean {
  return eurRates['USD'] === FALLBACK_EUR_RATES['USD'];
}

// ─── BKAM-first rate fetching ──────────────────────────────────────────────────
// Cache for BKAM-sourced rates (MAD per 1 unit)
interface BkamRateCache {
  madPerUnit: Record<string, number>;
  timestamp: number;
}
let bkamCache: BkamRateCache | null = null;
const BKAM_CACHE_MS = 10 * 60 * 1000;

// ─── LocalStorage persistence for true BKAM 24h change ─────────────────────
const LS_KEY = 'bkam_prev_rates_v1';

interface BkamStoredRates {
  madPerUnit: Record<string, number>;
  date: string; // YYYY-MM-DD — the business day these rates belong to
}

function saveBkamRatesToStorage(madPerUnit: Record<string, number>): void {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const payload: BkamStoredRates = { madPerUnit, date: today };
    localStorage.setItem(LS_KEY, JSON.stringify(payload));
  } catch { /* storage quota or privacy mode — ignore */ }
}

function loadBkamYesterdayRates(): Record<string, number> | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const { madPerUnit, date } = JSON.parse(raw) as BkamStoredRates;
    const yesterday = prevBizDay();
    if (date !== yesterday) return null; // stale or future — ignore
    return madPerUnit;
  } catch { return null; }
}

async function tryFetchBkamMadRates(corsProxyUrl: string): Promise<Record<string, number> | null> {
  if (bkamCache && Date.now() - bkamCache.timestamp < BKAM_CACHE_MS) {
    return bkamCache.madPerUnit;
  }
  try {
    const rates = await fetchBkamVirement(corsProxyUrl);
    if (!rates.length) return null;
    const madPerUnit = virementToMadPerUnit(rates);
    if (!madPerUnit['USD'] || !madPerUnit['EUR']) return null;
    bkamCache = { madPerUnit, timestamp: Date.now() };
    // Persist today's BKAM rates so they become "yesterday" tomorrow
    saveBkamRatesToStorage(madPerUnit);
    return madPerUnit;
  } catch {
    return null;
  }
}

function computeChange24h(
  todayMid: number,
  prevEurRates: Record<string, number>,
  currencyCode: string,
  bkamUnit: number,
  config: BasketConfig,
  bkamYesterdayRates?: Record<string, number> | null,
): number {
  // Prefer actual BKAM yesterday rates when available (persisted from previous session)
  if (bkamYesterdayRates) {
    const prevRaw = bkamYesterdayRates[currencyCode];
    if (prevRaw) {
      const prevMid = prevRaw * bkamUnit;
      if (prevMid) return +((todayMid - prevMid) / prevMid * 100).toFixed(4);
    }
  }

  // Fallback: ECB-derived yesterday proxy
  if (!prevEurRates['USD']) return 0;
  const prevEurUsd = prevEurRates['USD'];
  const prevUsdMadMid = config.referenceBasketValue / (config.eurWeight * prevEurUsd + config.usdWeight);

  let prevRaw: number;
  if (currencyCode === 'EUR') {
    prevRaw = prevUsdMadMid * prevEurUsd;
  } else if (currencyCode === 'USD') {
    prevRaw = prevUsdMadMid;
  } else if (GULF_USD_RATES[currencyCode]) {
    prevRaw = GULF_USD_RATES[currencyCode] * prevUsdMadMid;
  } else {
    const prevXRate = prevEurRates[currencyCode];
    if (!prevXRate) return 0;
    prevRaw = (prevEurUsd / prevXRate) * prevUsdMadMid;
  }
  const prevMid = prevRaw * bkamUnit;
  if (!prevMid) return 0;
  return +((todayMid - prevMid) / prevMid * 100).toFixed(4);
}

function applySmartSpread(mid: number, code: string, config: BasketConfig, dealerSpreads?: Record<string, number>) {
  // Smart BPS: per-currency pips from dealer matrix, fallback to global config
  const vPips = dealerSpreads?.[code] ?? (config.virementSpreadPercent * 10000);
  const bPips = vPips * (config.billetSpreadPercent / config.virementSpreadPercent); // maintain billets ratio
  const vSpread = mid * (vPips / 10000);
  const bSpread = mid * (bPips / 10000);
  // Asymmetric: ask side 52%, bid side 48% (market convention — sell side slightly wider)
  return {
    virementBuy:  +(mid - vSpread * 0.48).toFixed(4),
    virementSell: +(mid + vSpread * 0.52).toFixed(4),
    billetBuy:    +(mid - bSpread * 0.48).toFixed(4),
    billetSell:   +(mid + bSpread * 0.52).toFixed(4),
    spreadPct:    +(vPips / 100).toFixed(3),
    vPips,
  };
}

export async function fetchAllMadRates(config: BasketConfig, corsProxyUrl?: string, dealerSpreads?: Record<string, number>): Promise<{
  rates: LiveRate[];
  ratesDate: string;
  lastFetch: string;
}> {
  const rates: LiveRate[] = [];

  // Fetch yesterday's ECB rates and stored BKAM rates in parallel for 24h change
  const prevEurRatesPromise = fetchPrevEurRates();
  const bkamYesterdayRates = loadBkamYesterdayRates();

  // ── Primary: BKAM CoursVirement ──────────────────────────────────────────
  if (corsProxyUrl) {
    const [bkamMad, prevEurRates] = await Promise.all([tryFetchBkamMadRates(corsProxyUrl), prevEurRatesPromise]);
    if (bkamMad) {
      // Persist for safety cage (raw madPerUnit, before bkamUnit scaling)
      _lastBkamMadRates = { ...bkamMad };

      const usdMadMid = bkamMad['USD'];
      const eurMadMid = bkamMad['EUR'];

      for (const currency of BKAM_CURRENCIES) {
        let rawMid: number;

        if (currency.code === 'EUR') {
          rawMid = eurMadMid;
        } else if (currency.code === 'USD') {
          rawMid = usdMadMid;
        } else if (bkamMad[currency.code] !== undefined) {
          rawMid = bkamMad[currency.code];
        } else if (GULF_USD_RATES[currency.code]) {
          rawMid = GULF_USD_RATES[currency.code] * usdMadMid;
        } else {
          continue;
        }

        const displayMid = rawMid * currency.bkamUnit;
        const filteredMid = sanityFilter(currency.code, displayMid);
        const spread = applySmartSpread(filteredMid, currency.code, config, dealerSpreads);

        rates.push({
          currency: currency.code,
          pair: `${currency.code}/MAD`,
          mid: +filteredMid.toFixed(4),
          virementBuy:  spread.virementBuy,
          virementSell: spread.virementSell,
          billetBuy:    spread.billetBuy,
          billetSell:   spread.billetSell,
          change24h: computeChange24h(filteredMid, prevEurRates, currency.code, currency.bkamUnit, config, bkamYesterdayRates),
          source: 'CALCULATED',
          feedStatus: 'LIVE',
          timestamp: new Date().toISOString(),
        });
      }

      if (rates.length > 0) {
        return { rates, ratesDate: new Date().toISOString().slice(0, 10), lastFetch: new Date().toISOString() };
      }
    }
  }

  // ── Fallback: ECB Frankfurter → Twelve Data → hardcoded ──────────────────
  const [{ rates: eurRates, date: ratesDate }, prevEurRates] = await Promise.all([fetchEurRates(corsProxyUrl), prevEurRatesPromise]);
  const eurUsd = eurRates['USD'];
  const isFallbackData = isFallback(eurRates);
  const source = isFallbackData ? 'FALLBACK' : (rateCache ? 'CACHED' : 'CALCULATED');
  const feedStatus: LiveRate['feedStatus'] = isFallbackData ? 'FALLBACK' : 'DELAYED';

  const usdMadMid = config.referenceBasketValue / (config.eurWeight * eurUsd + config.usdWeight);
  const eurMadMid = usdMadMid * eurUsd;

  for (const currency of BKAM_CURRENCIES) {
    let rawMid: number;

    if (currency.code === 'EUR') {
      rawMid = eurMadMid;
    } else if (currency.code === 'USD') {
      rawMid = usdMadMid;
    } else {
      const eurXRate = eurRates[currency.code];
      if (!eurXRate) continue;
      const xToUsd = eurUsd / eurXRate;
      rawMid = xToUsd * usdMadMid;
    }

    const displayMid = rawMid * currency.bkamUnit;
    // Apply safety cage (clamps to ±5% of last known BKAM fixing)
    const { mid: cagedMid, isCapped } = applySafetyCage(currency.code, displayMid);
    // Apply sanity filter (rejects ticks > 2%/min)
    const filteredMid = sanityFilter(currency.code, cagedMid);
    const spread = applySmartSpread(filteredMid, currency.code, config, dealerSpreads);

    rates.push({
      currency: currency.code,
      pair: `${currency.code}/MAD`,
      mid: +filteredMid.toFixed(4),
      virementBuy:  spread.virementBuy,
      virementSell: spread.virementSell,
      billetBuy:    spread.billetBuy,
      billetSell:   spread.billetSell,
      change24h: computeChange24h(filteredMid, prevEurRates, currency.code, currency.bkamUnit, config, bkamYesterdayRates),
      source: source as LiveRate['source'],
      feedStatus,
      isCapped,
      timestamp: new Date().toISOString(),
    });
  }

  return { rates, ratesDate, lastFetch: new Date().toISOString() };
}

// Deterministic synthetic intraday chart data based on mid rate and currency pair
export function generateIntradayData(mid: number, pair: string): ChartDataPoint[] {
  const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];
  const seed = pair.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const volatility = mid * 0.0015;

  let current = mid * 0.999;
  return hours.map((time, i) => {
    const wave = Math.sin((seed + i * 1.7) * 0.9) * volatility;
    const trend = (i / hours.length) * volatility * 0.5;
    current = mid * 0.999 + wave + trend;
    return { time, value: +current.toFixed(4) };
  });
}
