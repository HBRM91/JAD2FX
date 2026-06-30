import React, { useState, useEffect, useCallback } from 'react';
import { CommodityQuote, CommodityCategory } from '../types';
import { fetchCommodityQuotes, COMMODITY_DEFINITIONS } from '../services/yahooFinance';
import { fetchAllMadRates } from '../services/fxRates';
import { DEFAULT_BASKET_CONFIG } from '../constants';
import { useAdmin } from '../context/AdminContext';
import { useI18n } from '../context/I18nContext';
import {
  TrendingUp, TrendingDown, RefreshCw, AlertTriangle, Building2, ShieldAlert,
  Flame, Gem, Factory, Wheat,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FMT_PRICE = (v: number, symbol: string) => {
  if (v >= 1000) return v.toFixed(2);
  if (v >= 10)   return v.toFixed(3);
  return v.toFixed(4);
};

const FMT_MAD = (v: number) =>
  new Intl.NumberFormat('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

const CATEGORY_ICONS: Record<CommodityCategory, React.ElementType> = {
  ENERGY:           Flame,
  PRECIOUS_METALS:  Gem,
  INDUSTRIAL_METALS: Factory,
  AGRICULTURE:      Wheat,
};

const CATEGORY_COLORS: Record<CommodityCategory, string> = {
  ENERGY:           'text-orange-400 bg-orange-900/20 border-orange-700/40',
  PRECIOUS_METALS:  'text-yellow-400 bg-yellow-900/20 border-yellow-700/40',
  INDUSTRIAL_METALS:'text-slate-400 bg-slate-800/40 border-slate-600/40',
  AGRICULTURE:      'text-green-400 bg-green-900/20 border-green-700/40',
};

const CATEGORY_ACTIVE: Record<CommodityCategory, string> = {
  ENERGY:           'border-orange-500 bg-orange-900/20 text-orange-400',
  PRECIOUS_METALS:  'border-yellow-500 bg-yellow-900/20 text-yellow-400',
  INDUSTRIAL_METALS:'border-slate-500 bg-slate-800/40 text-slate-300',
  AGRICULTURE:      'border-green-500 bg-green-900/20 text-green-400',
};

type FilterCategory = 'ALL' | CommodityCategory;

// ─── Range bar ────────────────────────────────────────────────────────────────

function RangeBar({ low, high, current }: { low: number; high: number; current: number }) {
  const pct = high > low ? ((current - low) / (high - low)) * 100 : 50;
  return (
    <div className="relative w-full h-1.5 bg-navy-700 rounded-full overflow-visible mt-1">
      <div
        className="absolute top-0 left-0 h-full bg-navy-500 rounded-full"
        style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
      />
      <div
        className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-gold-400 rounded-full shadow border border-navy-800"
        style={{ left: `calc(${Math.max(0, Math.min(100, pct))}% - 4px)` }}
      />
    </div>
  );
}

// ─── Commodity Card ───────────────────────────────────────────────────────────

function CommodityCard({ q }: { q: CommodityQuote }) {
  const { locale } = useI18n();
  const [expanded, setExpanded] = useState(false);

  const isUp = q.changePercent >= 0;
  const CatIcon = CATEGORY_ICONS[q.category];
  const catColor = CATEGORY_COLORS[q.category];

  const name = locale === 'fr' ? q.nameFr : locale === 'ar' ? q.nameAr : q.name;
  const relevance = locale === 'fr' ? q.moroccanRelevanceFr : locale === 'ar' ? q.moroccanRelevanceAr : q.moroccanRelevance;

  return (
    <div
      className={`bg-navy-900 rounded-xl border overflow-hidden cursor-pointer transition-colors hover:border-navy-600 ${
        q.source === 'FALLBACK' ? 'border-dashed border-navy-600' : 'border-navy-700'
      }`}
      onClick={() => setExpanded(e => !e)}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded border text-xs ${catColor}`}>
              <CatIcon size={14} />
            </div>
            <div>
              <p className="font-bold text-white text-sm leading-tight">{name}</p>
              <p className="text-[10px] text-slate-400 font-mono">{q.symbol}</p>
            </div>
          </div>
          <div className={`flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${
            isUp ? 'bg-emerald-950/30 text-emerald-400' : 'bg-red-950/30 text-red-400'
          }`}>
            {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {isUp ? '+' : ''}{q.changePercent.toFixed(2)}%
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">USD{q.unit}</p>
            <p className="text-xl font-mono font-bold text-white">
              {FMT_PRICE(q.price, q.symbol)}
              <span className="text-xs text-slate-400 ml-1">
                {q.changePercent >= 0 ? '+' : ''}{FMT_PRICE(q.change, q.symbol)}
              </span>
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">MAD{q.unit}</p>
            <p className="text-xl font-mono font-bold text-gold-600">{FMT_MAD(q.madEquiv)}</p>
          </div>
        </div>

        {/* 52w range */}
        <div className="mt-3">
          <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-0.5">
            <span>L {FMT_PRICE(q.low52w, q.symbol)}</span>
            <span className="text-slate-500">52w</span>
            <span>H {FMT_PRICE(q.high52w, q.symbol)}</span>
          </div>
          <RangeBar low={q.low52w} high={q.high52w} current={q.price} />
        </div>

        {q.source === 'FALLBACK' && (
          <div className="mt-2 flex items-center gap-1 text-[10px] text-amber-600">
            <AlertTriangle size={9} />
            <span>Reference data</span>
          </div>
        )}
        {q.timestamp && q.source === 'LIVE' && (
          <p className="mt-1 text-[10px] text-slate-700 font-mono">
            {new Date(q.timestamp).toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>

      {/* Expanded moroccan relevance */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-navy-800 mt-2">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Morocco Relevance</p>
          <p className="text-xs text-slate-300 leading-relaxed">{relevance}</p>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const CommoditiesPage: React.FC = () => {
  const { config } = useAdmin();
  const { t, locale, isRTL } = useI18n();

  const [quotes, setQuotes] = useState<CommodityQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterCategory>('ALL');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [usdMad, setUsdMad] = useState(9.98);
  const [anyFallback, setAnyFallback] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Get current USD/MAD for MAD equivalents
      const { rates } = await fetchAllMadRates(DEFAULT_BASKET_CONFIG);
      const usd = rates.find(r => r.currency === 'USD');
      const mid = usd?.mid ?? 9.98;
      setUsdMad(mid);

      const qs = await fetchCommodityQuotes(mid, config.corsProxyUrl || undefined);
      setQuotes(qs);
      setAnyFallback(qs.some(q => q.source === 'FALLBACK'));
      setLastUpdate(new Date());
    } finally {
      setLoading(false);
    }
  }, [config.corsProxyUrl]);

  useEffect(() => { load(); }, [load]);

  const categories: { id: FilterCategory; label: string; icon: React.ElementType }[] = [
    { id: 'ALL',               label: t('commodities.all'),             icon: TrendingUp },
    { id: 'ENERGY',            label: t('commodities.energy'),          icon: Flame },
    { id: 'PRECIOUS_METALS',   label: t('commodities.preciousMetals'),  icon: Gem },
    { id: 'INDUSTRIAL_METALS', label: t('commodities.industrialMetals'),icon: Factory },
    { id: 'AGRICULTURE',       label: t('commodities.agriculture'),     icon: Wheat },
  ];

  const filtered = filter === 'ALL' ? quotes : quotes.filter(q => q.category === filter);

  // Counts per category
  const countFor = (cat: CommodityCategory) => quotes.filter(q => q.category === cat).length;

  return (
    <div className={`space-y-6 ${isRTL ? 'text-right' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>

      {/* ── Header ── */}
      <div className="bg-navy-900 rounded-xl border border-navy-700 overflow-hidden">
        <div className="bg-navy-900 p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gold-500 opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="relative z-10">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-xl font-bold tracking-widest uppercase">{t('commodities.title')}</h1>
                <p className="text-xs text-gold-500 tracking-wider mt-1">{t('commodities.subtitle')}</p>
              </div>
              <div className="flex items-center gap-2">
                {lastUpdate && (
                  <span className="text-[10px] text-slate-400">
                    {lastUpdate.toLocaleTimeString(locale === 'en' ? 'en-GB' : locale === 'ar' ? 'ar-MA' : 'fr-MA', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
                <button
                  onClick={load}
                  disabled={loading}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 bg-white/10 text-white rounded hover:bg-white/20 transition disabled:opacity-50"
                >
                  <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
                  {t('common.refresh')}
                </button>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3 flex-wrap">
              <div className="text-[10px] text-amber-400 bg-amber-900/20 border border-amber-800/30 rounded px-2 py-1">
                ⚠️ {t('common.indicative')}
              </div>
              <div className="text-[10px] text-slate-400">
                USD/MAD: <span className="text-gold-400 font-mono font-bold">{usdMad.toFixed(4)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Yahoo Finance note */}
        <div className="p-3 bg-navy-800/60 border-b border-navy-700 text-[10px] text-slate-500">
          {t('commodities.source')}
          {anyFallback && (
            <span className="ml-2 text-amber-400 font-medium">· {t('commodities.fallbackNotice')}</span>
          )}
        </div>
      </div>

      {/* ── Category filter ── */}
      <div className={`flex gap-2 flex-wrap ${isRTL ? 'flex-row-reverse' : ''}`}>
        {categories.map(cat => {
          const active = filter === cat.id;
          const CatIcon = cat.icon;
          const count = cat.id === 'ALL' ? quotes.length : countFor(cat.id as CommodityCategory);
          return (
            <button
              key={cat.id}
              onClick={() => setFilter(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition ${
                active
                  ? (cat.id === 'ALL'
                      ? 'bg-navy-900 text-white border-navy-900'
                      : CATEGORY_ACTIVE[cat.id as CommodityCategory])
                  : 'bg-navy-900 text-slate-400 border-navy-700 hover:border-navy-500'
              }`}
            >
              <CatIcon size={11} />
              {cat.label}
              <span className={`text-[10px] rounded-full px-1 ${active ? 'bg-white/20' : 'bg-navy-700 text-slate-400'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Commodity cards grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-navy-900 rounded-xl border border-navy-700 p-4 animate-pulse">
              <div className="h-4 bg-navy-700 rounded w-2/3 mb-3" />
              <div className="h-8 bg-navy-800 rounded w-1/2 mb-2" />
              <div className="h-2 bg-navy-800 rounded w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(q => (
            <React.Fragment key={q.symbol}>
              <CommodityCard q={q} />
            </React.Fragment>
          ))}
        </div>
      )}

      {/* ── CORS proxy hint ── */}
      {anyFallback && (
        <div className="p-4 bg-amber-950/20 border border-amber-800/40 rounded-xl flex items-start gap-3">
          <AlertTriangle size={15} className="text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-400">{t('common.offline')} — Yahoo Finance</p>
            <p className="text-xs text-amber-500 mt-0.5">{t('commodities.corsNote')}</p>
          </div>
        </div>
      )}

      {/* ── Advisory CTA ── */}
      <div className="bg-navy-900 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Building2 size={20} className="text-gold-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-white">{t('footer.advisory')}</p>
            <p className="text-xs text-slate-400">{t('footer.advisoryDesc')}</p>
          </div>
        </div>
        <a
          href="https://jad2advisory.com"
          target="_blank" rel="noopener noreferrer"
          className="flex-shrink-0 px-5 py-2 bg-gold-500 text-navy-900 text-sm font-bold rounded hover:bg-gold-400 transition"
        >
          {t('footer.cta')}
        </a>
      </div>

      <div className="flex items-start gap-2 text-[10px] text-slate-400">
        <ShieldAlert size={11} className="text-amber-500 mt-0.5 flex-shrink-0" />
        <p>{t('disclaimer.short')}</p>
      </div>
    </div>
  );
};

export default CommoditiesPage;
