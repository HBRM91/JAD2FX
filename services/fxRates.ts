import { BasketConfig, LiveRate, ChartDataPoint } from '../types';
import { BKAM_CURRENCIES, GULF_USD_RATES } from '../constants';

const FRANKFURTER_URL = 'https://api.frankfurter.app/latest?from=EUR';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface EurRateCache {
  rates: Record<string, number>;
  timestamp: number;
  date: string;
}

let rateCache: EurRateCache | null = null;

// Fallback EUR-based rates (approximate, used if API call fails)
const FALLBACK_EUR_RATES: Record<string, number> = {
  USD: 1.085, GBP: 0.860, CHF: 0.945, JPY: 162.5, CAD: 1.480,
  DKK: 7.460, NOK: 11.60, SEK: 11.40, CNY: 7.880,
};

async function fetchEurRates(): Promise<{ rates: Record<string, number>; date: string; fromCache: boolean }> {
  if (rateCache && Date.now() - rateCache.timestamp < CACHE_TTL_MS) {
    return { rates: rateCache.rates, date: rateCache.date, fromCache: true };
  }

  try {
    const res = await fetch(FRANKFURTER_URL, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const eurUsd = data.rates['USD'] as number;
    const enriched: Record<string, number> = { ...data.rates };

    // Enrich with Gulf currencies via USD peg cross
    for (const [code, usdValue] of Object.entries(GULF_USD_RATES)) {
      // EUR/X = (EUR/USD) / (USD/X) ... but usdValue = X/USD
      // So EUR/X = EUR/USD / (X/USD) = eurUsd / usdValue? No...
      // usdValue = how many USD one unit of X is worth
      // EUR/X = how many X per 1 EUR = (EUR/USD) / (X/USD) = eurUsd / usdValue
      enriched[code] = eurUsd / usdValue;
    }

    rateCache = { rates: enriched, timestamp: Date.now(), date: data.date };
    return { rates: enriched, date: data.date, fromCache: false };
  } catch {
    const eurUsd = FALLBACK_EUR_RATES['USD'];
    const fallback = { ...FALLBACK_EUR_RATES };
    for (const [code, usdValue] of Object.entries(GULF_USD_RATES)) {
      fallback[code] = eurUsd / usdValue;
    }
    return { rates: fallback, date: 'N/A', fromCache: false };
  }
}

function isFallback(eurRates: Record<string, number>): boolean {
  // Simple heuristic: if USD rate is exactly the fallback value
  return eurRates['USD'] === FALLBACK_EUR_RATES['USD'];
}

export async function fetchAllMadRates(config: BasketConfig): Promise<{
  rates: LiveRate[];
  ratesDate: string;
  lastFetch: string;
}> {
  const { rates: eurRates, date: ratesDate } = await fetchEurRates();
  const eurUsd = eurRates['USD'];
  const source = isFallback(eurRates) ? 'FALLBACK' : (rateCache ? 'CACHED' : 'CALCULATED');

  // BKAM basket formula: USD/MAD mid
  const usdMadMid = config.referenceBasketValue / (config.eurWeight * eurUsd + config.usdWeight);
  const eurMadMid = usdMadMid * eurUsd;

  const rates: LiveRate[] = [];

  for (const currency of BKAM_CURRENCIES) {
    let rawMid: number; // MAD per 1 unit of currency

    if (currency.code === 'EUR') {
      rawMid = eurMadMid;
    } else if (currency.code === 'USD') {
      rawMid = usdMadMid;
    } else {
      const eurXRate = eurRates[currency.code];
      if (!eurXRate) continue;
      // X/USD = EUR/USD / EUR/X   (how many USD 1 unit of X is worth)
      const xToUsd = eurUsd / eurXRate;
      rawMid = xToUsd * usdMadMid;
    }

    // BKAM quotes JPY per 100 units; apply bkamUnit multiplier for display
    const displayMid = rawMid * currency.bkamUnit;

    const vS = config.virementSpreadPercent;
    const bS = config.billetSpreadPercent;

    rates.push({
      currency: currency.code,
      pair: `${currency.code}/MAD`,
      mid: +displayMid.toFixed(4),
      virementBuy:  +(displayMid * (1 - vS)).toFixed(4),
      virementSell: +(displayMid * (1 + vS)).toFixed(4),
      billetBuy:    +(displayMid * (1 - bS)).toFixed(4),
      billetSell:   +(displayMid * (1 + bS)).toFixed(4),
      change24h: 0, // Would require historical API call
      source: source as LiveRate['source'],
      timestamp: new Date().toISOString(),
    });
  }

  return { rates, ratesDate, lastFetch: new Date().toISOString() };
}

// Deterministic synthetic intraday chart data based on mid rate and currency pair
export function generateIntradayData(mid: number, pair: string): ChartDataPoint[] {
  const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];
  const seed = pair.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const volatility = mid * 0.0015; // 0.15% intraday volatility

  let current = mid * 0.999;
  return hours.map((time, i) => {
    // Deterministic wave using seed
    const wave = Math.sin((seed + i * 1.7) * 0.9) * volatility;
    const trend = (i / hours.length) * volatility * 0.5;
    current = mid * 0.999 + wave + trend;
    return { time, value: +current.toFixed(4) };
  });
}
