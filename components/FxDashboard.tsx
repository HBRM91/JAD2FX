import React, { useState, useEffect, useCallback } from 'react';
import { DashboardTab, LiveRate, BasketConfig, CurrencyInfo } from '../types';
import FxChart from './FxChart';
import { BKAM_CURRENCIES, BANKS, BANK_SPREAD_PREMIUM, DEFAULT_BASKET_CONFIG } from '../constants';
import { fetchAllMadRates, generateIntradayData } from '../services/fxRates';
import { isJumuahReducedLiquidity } from '../services/holidays';
import { Download, RefreshCw, Search, ArrowUpDown, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useI18n } from '../context/I18nContext';

const SPREAD_TOOLTIP = "Marges simulées sur base des moyennes mondiales marchés émergents. Sources : Banque Mondiale (Remittance Prices 2024) / BIS (Triennial Survey 2022). Non contractuelles.";

const currencyMeta = Object.fromEntries(BKAM_CURRENCIES.map(c => [c.code, c]));

function getCurrencyName(meta: CurrencyInfo | undefined, locale: string): string {
  if (!meta) return '';
  if (locale === 'ar') return meta.nameAr;
  if (locale === 'en') return meta.name;
  return meta.nameFr;
}

const TAB_LABELS: Record<DashboardTab, Record<string, string>> = {
  VIREMENTS: { fr: 'Virements', en: 'Wire Transfers', ar: 'تحويلات' },
  BILLETS:   { fr: 'Billets',   en: 'Banknotes',      ar: 'أوراق نقدية' },
  GLOBAL_FX: { fr: 'Global FX', en: 'Global FX',      ar: 'صرف عالمي' },
};

const FxDashboard: React.FC = () => {
  const { locale, isRTL } = useI18n();
  const [activeTab, setActiveTab] = useState<DashboardTab>('VIREMENTS');
  const [rates, setRates] = useState<LiveRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [ratesDate, setRatesDate] = useState<string>('');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('EUR');
  const [search, setSearch] = useState('');
  const [sortAsc, setSortAsc] = useState(false);
  const [config] = useState<BasketConfig>(DEFAULT_BASKET_CONFIG);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const { rates: r, ratesDate: d, lastFetch } = await fetchAllMadRates(config);
      setRates(r);
      setRatesDate(d);
      setLastUpdate(lastFetch);
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refresh]);

  const selectedRate = rates.find(r => r.currency === selectedCurrency);
  const chartData = selectedRate ? generateIntradayData(selectedRate.mid, selectedRate.pair) : [];

  const filteredRates = rates
    .filter(r => {
      const meta = currencyMeta[r.currency];
      const q = search.toLowerCase();
      return (
        r.currency.toLowerCase().includes(q) ||
        meta?.name.toLowerCase().includes(q) ||
        meta?.nameFr.toLowerCase().includes(q) ||
        meta?.nameAr.includes(search)
      );
    })
    .sort((a, b) => sortAsc ? a.mid - b.mid : b.mid - a.mid);

  const getBuyPrice  = (r: LiveRate) => activeTab === 'BILLETS' ? r.billetBuy  : r.virementBuy;
  const getSellPrice = (r: LiveRate) => activeTab === 'BILLETS' ? r.billetSell : r.virementSell;

  const exportCSV = () => {
    const headers = ['Currency', 'Pair', 'Mid', 'Buy', 'Sell', 'Change24h%', 'Source', 'Timestamp'];
    const rows = rates.map(r => [
      r.currency, r.pair, r.mid, getBuyPrice(r), getSellPrice(r), r.change24h, r.source, r.timestamp,
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `jad2fx_cours_indicatifs_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Rates Table ─────────────────────────────────────────────────────────────

  const renderRatesTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-navy-950 border-b border-navy-800">
          <tr>
            <th className="px-4 py-3 text-[10px] text-navy-400 font-bold uppercase tracking-wider">
              {locale === 'ar' ? 'العملة' : locale === 'en' ? 'Currency' : 'Devise'}
            </th>
            <th
              className="px-4 py-3 text-[10px] text-navy-400 font-bold uppercase tracking-wider cursor-pointer hover:text-gold-400 transition-colors"
              onClick={() => setSortAsc(v => !v)}
            >
              <span className="flex items-center gap-1">
                {locale === 'ar' ? 'سعر الوسط' : locale === 'en' ? 'Mid' : 'Moyen'} <ArrowUpDown size={10} />
              </span>
            </th>
            <th className="px-4 py-3 text-[10px] text-navy-400 font-bold uppercase tracking-wider text-right">
              {activeTab === 'BILLETS'
                ? (locale === 'en' ? 'Bid / Banknote' : 'Bid / Billet')
                : (locale === 'en' ? 'Bid / Wire'     : 'Bid / Virement')}
            </th>
            <th className="px-4 py-3 text-[10px] text-navy-400 font-bold uppercase tracking-wider text-right">
              {activeTab === 'BILLETS'
                ? (locale === 'en' ? 'Ask / Banknote' : 'Ask / Billet')
                : (locale === 'en' ? 'Ask / Wire'     : 'Ask / Virement')}
            </th>
            <th className="px-4 py-3 text-[10px] text-navy-400 font-bold uppercase tracking-wider text-right">
              24h
            </th>
            <th className="px-4 py-3 text-[10px] text-navy-400 font-bold uppercase tracking-wider text-right" title={SPREAD_TOOLTIP}>
              Spread ℹ
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-navy-800/60">
          {filteredRates.map(rate => {
            const meta      = currencyMeta[rate.currency];
            const buy       = getBuyPrice(rate);
            const sell      = getSellPrice(rate);
            const spreadPct = ((sell - buy) / rate.mid) * 100;
            const chg       = rate.change24h ?? 0;
            const isUp      = chg > 0.01;
            const isDn      = chg < -0.01;
            const isSelected = rate.currency === selectedCurrency;

            return (
              <tr
                key={rate.currency}
                onClick={() => { setSelectedCurrency(rate.currency); setActiveTab('GLOBAL_FX'); }}
                className={`cursor-pointer transition-colors ${
                  isSelected ? 'bg-gold-500/8 border-l-2 border-l-gold-500' : 'hover:bg-navy-800/40'
                }`}
              >
                {/* Currency */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg flex-shrink-0">{meta?.flag}</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white text-[13px]">{rate.currency}</span>
                        {isJumuahReducedLiquidity(rate.currency) && (
                          <span title="Vendredi — Liquidité réduite" className="text-[11px]">🕌</span>
                        )}
                        {rate.isCapped && (
                          <span title="Safety Cage activée" className="text-[8px] bg-amber-500/15 text-amber-400 border border-amber-500/30 px-1 py-0.5 rounded font-bold">CAGE</span>
                        )}
                        {meta?.bkamUnit === 100 && (
                          <span className="text-[8px] bg-navy-800 text-navy-400 border border-navy-700 px-1 rounded">×100</span>
                        )}
                      </div>
                      <p className="text-[10px] text-navy-500">{getCurrencyName(meta, locale)}</p>
                    </div>
                  </div>
                </td>

                {/* Mid */}
                <td className="px-4 py-3 font-mono font-bold text-white text-[13px] tabular-nums">
                  {rate.mid.toFixed(4)}
                </td>

                {/* Bid */}
                <td className="px-4 py-3 text-right font-mono text-emerald-400 text-[12px] tabular-nums">
                  {buy.toFixed(4)}
                </td>

                {/* Ask */}
                <td className="px-4 py-3 text-right font-mono text-red-400 text-[12px] tabular-nums">
                  {sell.toFixed(4)}
                </td>

                {/* 24h Change */}
                <td className="px-4 py-3 text-right">
                  {chg !== 0 ? (
                    <span className={`inline-flex items-center gap-0.5 text-[11px] font-mono font-bold ${
                      isUp ? 'text-emerald-400' : isDn ? 'text-red-400' : 'text-navy-500'
                    }`}>
                      {isUp ? <TrendingUp size={10} /> : isDn ? <TrendingDown size={10} /> : <Minus size={10} />}
                      {isUp ? '+' : ''}{chg.toFixed(2)}%
                    </span>
                  ) : (
                    <span className="text-[11px] text-navy-700">—</span>
                  )}
                </td>

                {/* Spread */}
                <td className="px-4 py-3 text-right" title={SPREAD_TOOLTIP}>
                  <span className="text-[10px] font-mono text-navy-500 bg-navy-800 border border-navy-700 px-1.5 py-0.5 rounded cursor-help">
                    {spreadPct.toFixed(2)}%
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  // ─── Bank comparison ──────────────────────────────────────────────────────────

  const renderBankComparison = () => {
    if (!selectedRate) return null;
    const buy  = getBuyPrice(selectedRate);
    const sell = getSellPrice(selectedRate);
    return (
      <div className="p-5">
        <h4 className="text-[11px] font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <TrendingUp size={12} className="text-gold-500" />
          {locale === 'en' ? 'Bank Comparison' : 'Comparatif Établissements'} — {selectedRate.pair}
          <span className="text-[9px] font-normal text-navy-600">
            {locale === 'en' ? '(click row to compare)' : '(cliquer pour comparer)'}
          </span>
        </h4>
        <table className="w-full text-[11px] text-left">
          <thead className="border-b border-navy-800">
            <tr>
              <th className="pb-2 text-navy-500 font-bold uppercase tracking-wider text-[9px]">
                {locale === 'en' ? 'Establishment' : 'Établissement'}
              </th>
              <th className="pb-2 text-right text-navy-500 font-bold uppercase tracking-wider text-[9px]">Bid Réf.</th>
              <th className="pb-2 text-right text-navy-500 font-bold uppercase tracking-wider text-[9px]">Ask Réf.</th>
              <th className="pb-2 text-right text-navy-500 font-bold uppercase tracking-wider text-[9px]">vs Ref.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-800/60">
            <tr>
              <td className="py-2 font-bold text-gold-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-gold-500 flex-shrink-0" />
                JAD2FX Référence
              </td>
              <td className="py-2 text-right font-mono text-emerald-400 font-bold">{buy.toFixed(4)}</td>
              <td className="py-2 text-right font-mono text-red-400 font-bold">{sell.toFixed(4)}</td>
              <td className="py-2 text-right text-navy-600 text-[9px] italic">Benchmark</td>
            </tr>
            {BANKS.map((bank, i) => {
              const premium    = BANK_SPREAD_PREMIUM[i] ?? 0.004;
              const bankBuy    = buy - premium * selectedRate.mid;
              const bankSell   = sell + premium * selectedRate.mid;
              const extraSpread = ((bankSell - sell) / selectedRate.mid * 100);
              return (
                <tr key={bank} className="hover:bg-navy-800/30 transition-colors">
                  <td className="py-2 text-slate-300">{bank}</td>
                  <td className="py-2 text-right font-mono text-slate-400">{bankBuy.toFixed(4)}</td>
                  <td className="py-2 text-right font-mono text-slate-400">{bankSell.toFixed(4)}</td>
                  <td className="py-2 text-right text-red-400 font-mono font-bold">+{extraSpread.toFixed(2)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="text-[9px] text-navy-700 mt-3">
          Marges simulées — non contractuelles. Sources : BM / BIS Triennial Survey. Pour taux exécutables, contactez votre banque.
        </p>
      </div>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-navy-900 border border-navy-800 rounded-xl p-3">
        {/* Tab switcher */}
        <div className="flex bg-navy-950 rounded-lg p-1 gap-0.5">
          {(['VIREMENTS', 'BILLETS', 'GLOBAL_FX'] as DashboardTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-[11px] font-bold uppercase tracking-wide rounded-md transition-all ${
                activeTab === tab
                  ? 'bg-gold-500 text-navy-950 shadow'
                  : 'text-navy-400 hover:text-white hover:bg-navy-800/60'
              }`}
            >
              {TAB_LABELS[tab][locale] ?? TAB_LABELS[tab].fr}
            </button>
          ))}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {activeTab !== 'GLOBAL_FX' && (
            <div className="relative">
              <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-navy-500" />
              <input
                type="text"
                placeholder={locale === 'ar' ? 'بحث...' : locale === 'en' ? 'Filter...' : 'Filtrer...'}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-7 pr-3 py-1.5 text-[11px] bg-navy-800 border border-navy-700 rounded-lg text-slate-300 placeholder-navy-600 focus:outline-none focus:border-gold-500/50 w-32"
              />
            </div>
          )}
          <button
            onClick={refresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-navy-800 border border-navy-700 text-slate-300 text-[11px] font-medium rounded-lg hover:border-navy-600 hover:text-white disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={11} className={isLoading ? 'animate-spin' : ''} />
            {locale === 'ar' ? 'تحديث' : locale === 'en' ? 'Refresh' : 'Actualiser'}
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-navy-800 border border-navy-700 text-slate-300 text-[11px] font-medium rounded-lg hover:border-navy-600 hover:text-white transition-colors"
          >
            <Download size={11} />
            CSV
          </button>
          <div className="text-[9px] text-navy-600 font-mono">
            {ratesDate && <span>ECB {ratesDate}</span>}
            {lastUpdate && (
              <span className="ml-2">
                {new Date(lastUpdate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            {rates[0]?.source === 'FALLBACK' && (
              <span className="ml-2 text-amber-500 font-bold">● Offline</span>
            )}
          </div>
        </div>
      </div>

      {/* Indicative notice */}
      <div className={`flex items-start gap-2 bg-amber-500/5 border border-amber-500/15 rounded-lg px-4 py-2.5 text-[11px] text-amber-400/80 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
        <span className="font-bold flex-shrink-0 text-amber-300">
          {locale === 'ar' ? '⚠ استرشادي' : '⚠ INDICATIF'}
        </span>
        <span className="leading-relaxed">
          {locale === 'ar'
            ? 'أسعار احترازية استرشادية (سلة 60%EUR/40%USD). ليست أسعاراً رسمية لبنك المغرب. '
            : locale === 'en'
            ? 'Indicative rates derived from the BKAM basket (60% EUR / 40% USD). Not official Bank Al-Maghrib rates. '
            : 'Taux indicatifs dérivés du panier BKAM (60% EUR / 40% USD). Non officiels Bank Al-Maghrib. '}
          <a href="https://www.bkam.ma" target="_blank" rel="noopener noreferrer" className="text-blue-400/70 hover:text-blue-400 underline">bkam.ma</a>
        </span>
      </div>

      {/* Loading */}
      {isLoading && rates.length === 0 && (
        <div className="bg-navy-900 border border-navy-800 rounded-xl p-12 text-center">
          <RefreshCw size={20} className="animate-spin text-gold-500 mx-auto mb-3" />
          <p className="text-[13px] text-navy-500">
            {locale === 'ar' ? 'جاري التحميل...' : locale === 'en' ? 'Loading rates...' : 'Chargement des taux…'}
          </p>
        </div>
      )}

      {/* VIREMENTS / BILLETS view */}
      {activeTab !== 'GLOBAL_FX' && rates.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

          {/* Rates table */}
          <div className="xl:col-span-2 bg-navy-900 rounded-xl border border-navy-800 overflow-hidden">
            <div className="px-5 py-3 border-b border-navy-800 flex items-center justify-between">
              <div>
                <h3 className="text-[11px] font-bold text-white uppercase tracking-wider">
                  {activeTab === 'VIREMENTS'
                    ? (locale === 'ar' ? 'تحويلات — جميع العملات' : locale === 'en' ? 'Wire Transfers — All Currencies' : 'Virements — Toutes Devises')
                    : (locale === 'ar' ? 'أوراق نقدية — جميع العملات' : locale === 'en' ? 'Banknotes — All Currencies' : 'Billets — Toutes Devises')}
                </h3>
                <p className="text-[9px] text-navy-500 mt-0.5">
                  {activeTab === 'VIREMENTS' ? 'Spread ±0.8% indicatif' : 'Spread ±1.8% indicatif'}
                  {' · '}{filteredRates.length} devises
                </p>
              </div>
              {isLoading && rates.length > 0 && <RefreshCw size={12} className="animate-spin text-navy-500" />}
            </div>
            {renderRatesTable()}
          </div>

          {/* Side panel */}
          <div className="xl:col-span-1 space-y-4">

            {/* BKAM Basket Card */}
            <div className="bg-navy-900 border border-navy-800 rounded-xl p-5 relative overflow-hidden">
              <div className="absolute top-3 right-3 opacity-5">
                <TrendingUp size={72} className="text-gold-400" />
              </div>
              <h4 className="text-[9px] font-black uppercase tracking-[0.18em] text-gold-400 mb-4">
                Panier BKAM · Taux Pivots
              </h4>
              <div className="space-y-3">
                {['EUR', 'USD'].map(code => {
                  const r    = rates.find(x => x.currency === code);
                  const chg  = r?.change24h ?? 0;
                  const isUp = chg > 0.01;
                  const isDn = chg < -0.01;
                  return (
                    <div key={code} className="bg-navy-950 border border-navy-800 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-navy-400 font-bold">{code}/MAD</span>
                        <span className="text-[9px] text-navy-600">{code === 'EUR' ? '60%' : '40%'} panier</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-[20px] font-mono font-bold text-white tabular-nums">
                          {r?.mid.toFixed(4) ?? '—'}
                        </span>
                        {chg !== 0 && (
                          <span className={`text-[10px] font-mono font-bold ${isUp ? 'text-emerald-400' : isDn ? 'text-red-400' : 'text-navy-500'}`}>
                            {isUp ? '+' : ''}{chg.toFixed(2)}%
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-navy-800 text-center">
                  {[
                    { label: 'K panier', value: String(config.referenceBasketValue) },
                    { label: 'Bande BKAM', value: '±5%' },
                  ].map(m => (
                    <div key={m.label} className="bg-navy-950 rounded px-2 py-1.5">
                      <p className="text-[8px] text-navy-600 uppercase tracking-wider">{m.label}</p>
                      <p className="text-[12px] font-mono font-bold text-gold-400">{m.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Gulf & Maghreb Card */}
            <div className="bg-navy-900 border border-navy-800 rounded-xl p-4">
              <h4 className="text-[10px] font-bold text-white uppercase tracking-wider mb-0.5">
                {locale === 'ar' ? 'الخليج وشمال أفريقيا' : locale === 'en' ? 'Gulf & North Africa' : 'Golfe & Maghreb'}
              </h4>
              <p className="text-[9px] text-navy-600 mb-3">
                {locale === 'en' ? 'USD cross-rates · indicative' : 'Taux croisés via USD · indicatif'}
              </p>
              <div className="space-y-1">
                {['SAR', 'AED', 'QAR', 'KWD', 'OMR', 'BHD', 'JOD', 'TND', 'DZD', 'LYD'].map(code => {
                  const r    = rates.find(x => x.currency === code);
                  const meta = currencyMeta[code];
                  const chg  = r?.change24h ?? 0;
                  const isUp = chg > 0.01;
                  const isDn = chg < -0.01;
                  if (!r) return null;
                  return (
                    <div
                      key={code}
                      onClick={() => { setSelectedCurrency(code); setActiveTab('GLOBAL_FX'); }}
                      className={`flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                        selectedCurrency === code ? 'bg-gold-500/10 border border-gold-500/20' : 'hover:bg-navy-800/50'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-[15px]">{meta?.flag}</span>
                        <div>
                          <span className="text-[11px] font-bold text-slate-300">{code}</span>
                          {meta?.bkamUnit === 100 && <span className="text-[8px] text-navy-600 ml-1">×100</span>}
                        </div>
                      </span>
                      <div className="text-right">
                        <span className="font-mono font-bold text-white text-[11px] tabular-nums">{r.mid.toFixed(4)}</span>
                        {chg !== 0 && (
                          <span className={`block text-[9px] font-mono ${isUp ? 'text-emerald-400' : isDn ? 'text-red-400' : 'text-navy-600'}`}>
                            {isUp ? '+' : ''}{chg.toFixed(2)}%
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bank comparison */}
      {activeTab !== 'GLOBAL_FX' && selectedRate && rates.length > 0 && (
        <div className="bg-navy-900 border border-navy-800 rounded-xl overflow-hidden">
          {renderBankComparison()}
        </div>
      )}

      {/* GLOBAL_FX view — Chart */}
      {activeTab === 'GLOBAL_FX' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Chart area */}
          <div className="lg:col-span-2 space-y-4">
            {/* Currency selector */}
            <div className="bg-navy-900 border border-navy-800 rounded-xl p-4">
              <div className="flex flex-wrap gap-1.5">
                {rates.map(r => {
                  const meta = currencyMeta[r.currency];
                  const chg  = r.change24h ?? 0;
                  const isUp = chg > 0.01;
                  const isDn = chg < -0.01;
                  const active = r.currency === selectedCurrency;
                  return (
                    <button
                      key={r.currency}
                      onClick={() => setSelectedCurrency(r.currency)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                        active
                          ? 'bg-gold-500 text-navy-950 font-bold shadow'
                          : 'bg-navy-800 text-navy-400 border border-navy-700 hover:text-white hover:border-navy-600'
                      }`}
                    >
                      <span className="text-[13px]">{meta?.flag}</span>
                      <span>{r.currency}</span>
                      {chg !== 0 && (
                        <span className={`text-[9px] font-mono ${active ? 'text-navy-800' : isUp ? 'text-emerald-400' : isDn ? 'text-red-400' : ''}`}>
                          {isUp ? '▲' : isDn ? '▼' : ''}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chart card */}
            {selectedRate && (
              <div className="bg-navy-900 border border-navy-800 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-navy-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{currencyMeta[selectedCurrency]?.flag}</span>
                    <div>
                      <h3 className="font-mono text-[16px] font-bold text-white">{selectedRate.pair}</h3>
                      <p className="text-[10px] text-navy-500">{getCurrencyName(currencyMeta[selectedCurrency], locale)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[22px] font-mono font-bold text-white tabular-nums">{selectedRate.mid.toFixed(4)}</p>
                    {(selectedRate.change24h ?? 0) !== 0 && (
                      <p className={`text-[11px] font-mono font-bold ${(selectedRate.change24h ?? 0) > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {(selectedRate.change24h ?? 0) > 0 ? '+' : ''}{(selectedRate.change24h ?? 0).toFixed(2)}% 24h
                      </p>
                    )}
                    <p className="text-[9px] text-navy-600">
                      per {currencyMeta[selectedCurrency]?.bkamUnit === 100 ? '100' : '1'} {selectedCurrency}
                    </p>
                  </div>
                </div>
                <div className="p-4">
                  <FxChart pair={selectedRate.pair} data={chartData} />
                </div>
              </div>
            )}
          </div>

          {/* All rates sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-navy-900 border border-navy-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-navy-800">
                <h4 className="text-[10px] font-bold text-white uppercase tracking-wider">
                  {locale === 'ar' ? 'جميع الأسعار' : locale === 'en' ? 'All Rates' : 'Toutes les devises'}
                </h4>
              </div>
              <div className="divide-y divide-navy-800/60 max-h-[480px] overflow-y-auto">
                {rates.map(r => {
                  const meta   = currencyMeta[r.currency];
                  const chg    = r.change24h ?? 0;
                  const isUp   = chg > 0.01;
                  const isDn   = chg < -0.01;
                  const active = r.currency === selectedCurrency;
                  return (
                    <div
                      key={r.currency}
                      onClick={() => setSelectedCurrency(r.currency)}
                      className={`flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors ${
                        active ? 'bg-gold-500/10 border-l-2 border-l-gold-500' : 'hover:bg-navy-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[14px]">{meta?.flag}</span>
                        <div>
                          <p className="text-[11px] font-bold text-white">{r.currency}</p>
                          <p className="text-[9px] text-navy-600">{getCurrencyName(meta, locale)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[12px] font-mono font-bold text-white tabular-nums">{r.mid.toFixed(4)}</p>
                        {chg !== 0 && (
                          <p className={`text-[9px] font-mono font-bold ${isUp ? 'text-emerald-400' : isDn ? 'text-red-400' : 'text-navy-600'}`}>
                            {isUp ? '+' : ''}{chg.toFixed(2)}%
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FxDashboard;
