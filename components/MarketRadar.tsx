import React, { useEffect, useState, useCallback } from 'react';
import { useI18n } from '../context/I18nContext';
import { TrendingUp, TrendingDown, Minus, RefreshCw, Zap } from 'lucide-react';
import { LiveRate } from '../types';
import CurrencyFlag from './CurrencyFlag';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface RadarQuote {
  symbol: string;
  label: string;
  labelFr: string;
  labelAr: string;
  price: number;
  change: number;
  changePercent: number;
  unit: string;
  category: 'FX' | 'ENERGY' | 'METALS' | 'AGRICULTURE';
  flag?: string;
  countryCode?: string;
}

// ─── Yahoo Finance fetcher via Worker proxy ───────────────────────────────────

async function fetchYahooPrice(symbol: string, corsProxy: string): Promise<{ price: number; change: number; pct: number } | null> {
  const base = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
  const url = corsProxy ? `${corsProxy.replace(/\/$/, '')}/${encodeURIComponent(base)}` : base;
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) return null;
    const price = meta.regularMarketPrice ?? 0;
    const prev  = meta.chartPreviousClose ?? meta.previousClose ?? price;
    return { price, change: price - prev, pct: prev ? (price - prev) / prev * 100 : 0 };
  } catch { return null; }
}

// ─── Radar definitions ─────────────────────────────────────────────────────────

const RADAR_ITEMS: Array<{
  symbol: string; label: string; labelFr: string; labelAr: string;
  unit: string; category: RadarQuote['category']; flag?: string; countryCode?: string;
  divisor?: number; fallback: number;
}> = [
  // FX — derived from Frankfurter (filled in at runtime from tickerRates)
  { symbol: 'EUR/USD', label: 'EUR/USD', labelFr: 'EUR/USD', labelAr: 'يورو/دولار', unit: '', category: 'FX', countryCode: 'eu', fallback: 1.085 },
  { symbol: 'GBP/USD', label: 'GBP/USD', labelFr: 'GBP/USD', labelAr: 'جنيه/دولار', unit: '', category: 'FX', countryCode: 'gb', fallback: 1.270 },
  { symbol: 'USD/CHF', label: 'USD/CHF', labelFr: 'USD/CHF', labelAr: 'دولار/فرنك', unit: '', category: 'FX', countryCode: 'ch', fallback: 0.905 },
  { symbol: 'USD/JPY', label: 'USD/JPY', labelFr: 'USD/JPY', labelAr: 'دولار/ين',   unit: '', category: 'FX', countryCode: 'jp', fallback: 155.0 },
  { symbol: 'USD/SEK', label: 'USD/SEK', labelFr: 'USD/SEK', labelAr: 'دولار/كرون', unit: '', category: 'FX', countryCode: 'se', fallback: 10.60 },
  { symbol: 'USD/DKK', label: 'USD/DKK', labelFr: 'USD/DKK', labelAr: 'دولار/كرون.د', unit: '', category: 'FX', countryCode: 'dk', fallback: 6.88 },
  { symbol: 'USD/NOK', label: 'USD/NOK', labelFr: 'USD/NOK', labelAr: 'دولار/كرون.ن', unit: '', category: 'FX', countryCode: 'no', fallback: 10.50 },
  // Commodities (Yahoo Finance symbols)
  { symbol: 'BZ=F',  label: 'Brent Oil',  labelFr: 'Brent',       labelAr: 'نفط برنت', unit: '$/bbl', category: 'ENERGY',      flag: '🛢️',  fallback: 82.0, divisor: 1 },
  { symbol: 'ZW=F',  label: 'Wheat',      labelFr: 'Blé',         labelAr: 'قمح',       unit: '¢/bu',  category: 'AGRICULTURE',  flag: '🌾',  fallback: 585, divisor: 1 },
  { symbol: 'HG=F',  label: 'Copper',     labelFr: 'Cuivre',      labelAr: 'نحاس',      unit: '$/lb',  category: 'METALS',       flag: '🔶', fallback: 4.35, divisor: 1 },
  { symbol: 'GC=F',  label: 'Gold',       labelFr: 'Or',          labelAr: 'ذهب',       unit: '$/oz',  category: 'METALS',       flag: '🥇', fallback: 2340, divisor: 1 },
  { symbol: 'SI=F',  label: 'Silver',     labelFr: 'Argent',      labelAr: 'فضة',       unit: '$/oz',  category: 'METALS',       flag: '🥈', fallback: 29.5, divisor: 1 },
  { symbol: 'SCOA.L', label: 'Iron (SGX)', labelFr: 'Fer (SGX)', labelAr: 'حديد',      unit: '$/t',   category: 'METALS',       flag: '⚙️', fallback: 115, divisor: 1 },
];

// Map from our FX pseudo-symbol to Frankfurter cross-rate computation
const FX_SYMBOLS = new Set(['EUR/USD', 'GBP/USD', 'USD/CHF', 'USD/JPY', 'USD/SEK', 'USD/DKK', 'USD/NOK']);

// Frankfurter ECB cross rates with real daily % change (today vs previous business day)
async function fetchFxRadarRates(): Promise<Record<string, { price: number; pct: number }>> {
  try {
    // Get yesterday's date (Frankfurter /latest returns the last published ECB rate)
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    const yestStr = yest.toISOString().slice(0, 10);

    const [todayRes, yestRes] = await Promise.all([
      fetch('https://api.frankfurter.app/latest?from=EUR', { signal: AbortSignal.timeout(6000) }),
      fetch(`https://api.frankfurter.app/${yestStr}?from=EUR`, { signal: AbortSignal.timeout(6000) }),
    ]);
    if (!todayRes.ok) return {};
    const today = await todayRes.json();
    const rates = today.rates as Record<string, number>;
    const usd = rates['USD'] ?? 1;

    // Previous rates (fall back to today if yesterday unavailable)
    let prev: Record<string, number> = rates;
    if (yestRes.ok) {
      const yestData = await yestRes.json();
      if (yestData.rates) prev = yestData.rates as Record<string, number>;
    }
    const prevUsd = prev['USD'] ?? usd;

    function pct(today: number, prev: number) { return prev ? (today - prev) / prev * 100 : 0; }

    const result: Record<string, { price: number; pct: number }> = {};
    const gbp = rates['GBP'] ?? 1; const prevGbp = prev['GBP'] ?? gbp;
    const chf = rates['CHF'] ?? 1; const prevChf = prev['CHF'] ?? chf;
    const jpy = rates['JPY'] ?? 1; const prevJpy = prev['JPY'] ?? jpy;
    const sek = rates['SEK'] ?? 1; const prevSek = prev['SEK'] ?? sek;
    const dkk = rates['DKK'] ?? 1; const prevDkk = prev['DKK'] ?? dkk;
    const nok = rates['NOK'] ?? 1; const prevNok = prev['NOK'] ?? nok;

    result['EUR/USD'] = { price: usd,        pct: pct(usd, prevUsd) };
    result['GBP/USD'] = { price: usd / gbp,  pct: pct(usd / gbp, prevUsd / prevGbp) };
    result['USD/CHF'] = { price: chf / usd,  pct: pct(chf / usd, prevChf / prevUsd) };
    result['USD/JPY'] = { price: jpy / usd,  pct: pct(jpy / usd, prevJpy / prevUsd) };
    result['USD/SEK'] = { price: sek / usd,  pct: pct(sek / usd, prevSek / prevUsd) };
    result['USD/DKK'] = { price: dkk / usd,  pct: pct(dkk / usd, prevDkk / prevUsd) };
    result['USD/NOK'] = { price: nok / usd,  pct: pct(nok / usd, prevNok / prevUsd) };
    return result;
  } catch { return {}; }
}

// ─── Quote card (module-level to avoid React nested-component warning) ─────────

function QuoteCard({ q, locale }: { q: RadarQuote; locale: string; key?: React.Key }) {
  const pct = q.changePercent;
  const isUp = pct > 0;
  const isDn = pct < 0;
  const Icon = isUp ? TrendingUp : isDn ? TrendingDown : Minus;
  const color = isUp ? 'text-emerald-400' : isDn ? 'text-red-400' : 'text-slate-500';
  const bg    = isUp ? 'bg-emerald-500/5 border-emerald-800/40' : isDn ? 'bg-red-500/5 border-red-800/40' : 'bg-navy-800/30 border-navy-700/40';
  const label = locale === 'ar' ? q.labelAr : locale === 'en' ? q.label : q.labelFr;
  const priceStr = q.category === 'FX'
    ? q.price.toFixed(q.price > 10 ? 2 : 4)
    : q.price >= 1000 ? q.price.toFixed(0) : q.price >= 10 ? q.price.toFixed(2) : q.price.toFixed(3);

  return (
    <div className={`border rounded-lg px-3 py-2.5 flex items-center justify-between gap-2 transition-all ${bg}`}>
      <div className="flex items-center gap-2 min-w-0">
        {q.countryCode
          ? <CurrencyFlag countryCode={q.countryCode} size="sm" />
          : q.flag && <span className="text-base flex-shrink-0">{q.flag}</span>}
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-white truncate">{label}</p>
          {q.unit && <p className="text-[9px] text-slate-600 font-mono">{q.unit}</p>}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-mono font-bold text-white">{priceStr}</p>
        <div className={`flex items-center gap-0.5 justify-end ${color}`}>
          <Icon size={9} />
          <span className="text-[9px] font-mono font-bold">
            {pct >= 0 ? '+' : ''}{pct.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  tickerRates: LiveRate[];
}

const CATEGORY_COLORS = {
  FX:          'text-blue-400',
  ENERGY:      'text-orange-400',
  METALS:      'text-yellow-400',
  AGRICULTURE: 'text-green-400',
};

export default function MarketRadar({ tickerRates }: Props) {
  const { locale, isRTL } = useI18n();
  const [quotes, setQuotes] = useState<RadarQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const corsProxy: string = process.env.CORS_PROXY_URL ?? '';
    try {
      const fxRates = await fetchFxRadarRates();
      const commoditySymbols = RADAR_ITEMS.filter(i => !FX_SYMBOLS.has(i.symbol));
      const commResults = await Promise.all(
        commoditySymbols.map(def => fetchYahooPrice(def.symbol, corsProxy))
      );

      const result: RadarQuote[] = RADAR_ITEMS.map(def => {
        if (FX_SYMBOLS.has(def.symbol)) {
          const r = fxRates[def.symbol];
          return {
            symbol: def.symbol, label: def.label, labelFr: def.labelFr, labelAr: def.labelAr,
            price: r?.price ?? def.fallback,
            change: 0, changePercent: r?.pct ?? 0,
            unit: def.unit, category: def.category, flag: def.flag, countryCode: def.countryCode,
          };
        } else {
          const idx = commoditySymbols.findIndex(c => c.symbol === def.symbol);
          const live = idx >= 0 ? commResults[idx] : null;
          return {
            symbol: def.symbol, label: def.label, labelFr: def.labelFr, labelAr: def.labelAr,
            price: live?.price ?? def.fallback,
            change: live?.change ?? 0,
            changePercent: live?.pct ?? 0,
            unit: def.unit, category: def.category, flag: def.flag, countryCode: def.countryCode,
          };
        }
      });

      setQuotes(result);
      setLastUpdate(new Date().toLocaleTimeString());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 5 * 60 * 1000); // refresh every 5 min
    return () => clearInterval(id);
  }, [fetchAll]);

  const title    = locale === 'ar' ? 'رادار السوق' : locale === 'en' ? 'Market Radar' : 'Radar Marché';
  const fxTitle  = locale === 'ar' ? 'العملات الرئيسية' : locale === 'en' ? 'Major FX' : 'Grandes Devises';
  const commTitle = locale === 'ar' ? 'السلع' : locale === 'en' ? 'Commodities' : 'Matières Premières';

  const fxQuotes   = quotes.filter(q => q.category === 'FX');
  const commQuotes = quotes.filter(q => q.category !== 'FX');

  return (
    <div
      className={`bg-navy-900/90 border border-navy-700 rounded-xl overflow-hidden ${isRTL ? 'text-right' : ''}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="px-5 py-3 border-b border-navy-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap size={13} className="text-gold-500" />
          <h3 className="text-xs font-bold text-white uppercase tracking-widest">{title}</h3>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdate && (
            <span className="text-[9px] text-slate-600 font-mono">{lastUpdate}</span>
          )}
          <button
            onClick={fetchAll}
            disabled={loading}
            className="text-slate-500 hover:text-gold-400 transition p-1"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* FX section */}
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-blue-400 mb-2">{fxTitle}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2">
            {(loading && fxQuotes.length === 0
              ? RADAR_ITEMS.filter(r => FX_SYMBOLS.has(r.symbol)).map(r => ({
                  symbol: r.symbol, label: r.label, labelFr: r.labelFr, labelAr: r.labelAr,
                  price: r.fallback, change: 0, changePercent: 0,
                  unit: r.unit, category: r.category as RadarQuote['category'], flag: r.flag, countryCode: r.countryCode,
                } as RadarQuote))
              : fxQuotes
            ).map((q: RadarQuote) => <QuoteCard key={q.symbol} q={q} locale={locale} />)}
          </div>
        </div>

        {/* Commodities section */}
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-yellow-400 mb-2">{commTitle}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
            {(loading && commQuotes.length === 0
              ? RADAR_ITEMS.filter(r => !FX_SYMBOLS.has(r.symbol)).map(r => ({
                  symbol: r.symbol, label: r.label, labelFr: r.labelFr, labelAr: r.labelAr,
                  price: r.fallback, change: 0, changePercent: 0,
                  unit: r.unit, category: r.category as RadarQuote['category'], flag: r.flag, countryCode: r.countryCode,
                } as RadarQuote))
              : commQuotes
            ).map((q: RadarQuote) => <QuoteCard key={q.symbol} q={q} locale={locale} />)}
          </div>
        </div>
      </div>

      <div className="px-5 py-2 border-t border-navy-800">
        <p className="text-[9px] text-slate-600 font-mono">
          {locale === 'ar'
            ? 'أسعار استرشادية · Frankfurter ECB + Yahoo Finance · يتجدد كل 5 دقائق'
            : locale === 'en'
            ? 'Indicative prices · Frankfurter ECB + Yahoo Finance · Refreshes every 5 min'
            : 'Cours indicatifs · Frankfurter ECB + Yahoo Finance · Actualisation toutes les 5 min'}
        </p>
      </div>
    </div>
  );
}
