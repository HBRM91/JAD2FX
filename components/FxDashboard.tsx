import React, { useState, useEffect, useCallback } from 'react';
import { DashboardTab, LiveRate, BasketConfig } from '../types';
import FxChart from './FxChart';
import { BKAM_CURRENCIES, BANKS, BANK_SPREAD_PREMIUM, DEFAULT_BASKET_CONFIG } from '../constants';
import { fetchAllMadRates, generateIntradayData } from '../services/fxRates';
import { Download, RefreshCw, Search, ArrowUpDown, TrendingUp } from 'lucide-react';

const currencyMeta = Object.fromEntries(BKAM_CURRENCIES.map(c => [c.code, c]));

const FxDashboard: React.FC = () => {
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
    const interval = setInterval(refresh, 5 * 60 * 1000); // 5-minute auto-refresh
    return () => clearInterval(interval);
  }, [refresh]);

  const selectedRate = rates.find(r => r.currency === selectedCurrency);

  const chartData = selectedRate
    ? generateIntradayData(selectedRate.mid, selectedRate.pair)
    : [];

  const filteredRates = rates
    .filter(r => {
      const meta = currencyMeta[r.currency];
      return (
        r.currency.toLowerCase().includes(search.toLowerCase()) ||
        meta?.name.toLowerCase().includes(search.toLowerCase()) ||
        meta?.nameFr.toLowerCase().includes(search.toLowerCase())
      );
    })
    .sort((a, b) => {
      const midA = a.mid;
      const midB = b.mid;
      return sortAsc ? midA - midB : midB - midA;
    });

  const getBuyPrice = (r: LiveRate) =>
    activeTab === 'BILLETS' ? r.billetBuy : r.virementBuy;
  const getSellPrice = (r: LiveRate) =>
    activeTab === 'BILLETS' ? r.billetSell : r.virementSell;

  const exportCSV = () => {
    const headers = ['Currency', 'Pair', 'Mid', 'Buy', 'Sell', 'Source', 'Timestamp'];
    const rows = rates.map(r => [
      r.currency, r.pair, r.mid, getBuyPrice(r), getSellPrice(r), r.source, r.timestamp,
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jad2fx_cours_indicatifs_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderRatesTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-4 py-3 text-navy-900 font-serif text-xs uppercase tracking-wide">Currency</th>
            <th
              className="px-4 py-3 text-navy-900 font-serif text-xs uppercase tracking-wide cursor-pointer hover:text-gold-600 transition"
              onClick={() => setSortAsc(v => !v)}
            >
              <span className="flex items-center gap-1">
                Mid Rate <ArrowUpDown size={12} />
              </span>
            </th>
            <th className="px-4 py-3 text-navy-900 font-serif text-xs uppercase tracking-wide text-right">
              {activeTab === 'BILLETS' ? 'Billet Buy' : 'Virement Buy'}
            </th>
            <th className="px-4 py-3 text-navy-900 font-serif text-xs uppercase tracking-wide text-right">
              {activeTab === 'BILLETS' ? 'Billet Sell' : 'Virement Sell'}
            </th>
            <th className="px-4 py-3 text-navy-900 font-serif text-xs uppercase tracking-wide text-right">Spread</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filteredRates.map(rate => {
            const meta = currencyMeta[rate.currency];
            const buy = getBuyPrice(rate);
            const sell = getSellPrice(rate);
            const spreadPct = ((sell - buy) / rate.mid) * 100;
            const isSelected = rate.currency === selectedCurrency;
            return (
              <tr
                key={rate.currency}
                onClick={() => { setSelectedCurrency(rate.currency); setActiveTab('GLOBAL_FX'); }}
                className={`cursor-pointer transition-colors ${isSelected ? 'bg-gold-50/60' : 'hover:bg-slate-50'}`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{meta?.flag}</span>
                    <div>
                      <p className="font-medium text-navy-900 text-sm">{rate.currency}</p>
                      <p className="text-[10px] text-slate-400">{meta?.nameFr}</p>
                    </div>
                    {meta?.bkamUnit === 100 && (
                      <span className="text-[9px] bg-slate-100 text-slate-500 px-1 rounded">per 100</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 font-mono font-bold text-navy-900">{rate.mid.toFixed(4)}</td>
                <td className="px-4 py-3 text-right font-mono text-green-700">{buy.toFixed(4)}</td>
                <td className="px-4 py-3 text-right font-mono text-red-600">{sell.toFixed(4)}</td>
                <td className="px-4 py-3 text-right">
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
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

  const renderBankComparison = () => {
    if (!selectedRate) return null;
    const buy = getBuyPrice(selectedRate);
    const sell = getSellPrice(selectedRate);
    return (
      <div className="mt-6">
        <h4 className="font-serif text-sm font-bold text-navy-900 mb-3 px-4">
          Bank Comparison — {selectedRate.pair}
          <span className="ml-2 text-xs font-normal text-slate-400">(click any currency to compare)</span>
        </h4>
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-4 py-2 text-slate-600">Bank</th>
              <th className="px-4 py-2 text-right text-slate-600">Buy</th>
              <th className="px-4 py-2 text-right text-slate-600">Sell</th>
              <th className="px-4 py-2 text-right text-slate-600">vs Fair Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            <tr className="bg-gold-50/50">
              <td className="px-4 py-2 font-bold text-navy-900 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gold-500" />
                JAD2FX Référence Indicative
              </td>
              <td className="px-4 py-2 text-right font-mono font-bold text-green-700">{buy.toFixed(4)}</td>
              <td className="px-4 py-2 text-right font-mono font-bold text-red-600">{sell.toFixed(4)}</td>
              <td className="px-4 py-2 text-right text-slate-400 italic text-[10px]">Benchmark</td>
            </tr>
            {BANKS.map((bank, i) => {
              const premium = BANK_SPREAD_PREMIUM[i] ?? 0.004;
              const bankBuy = buy - premium * selectedRate.mid;
              const bankSell = sell + premium * selectedRate.mid;
              const extraSpread = ((bankSell - sell) / selectedRate.mid * 100);
              return (
                <tr key={bank} className="hover:bg-slate-50">
                  <td className="px-4 py-2 text-slate-700">{bank}</td>
                  <td className="px-4 py-2 text-right font-mono text-slate-600">{bankBuy.toFixed(4)}</td>
                  <td className="px-4 py-2 text-right font-mono text-slate-600">{bankSell.toFixed(4)}</td>
                  <td className="px-4 py-2 text-right text-red-500 font-medium">+{extraSpread.toFixed(2)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Indicative notice */}
      <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-xs text-amber-800">
        <span className="font-bold flex-shrink-0">⚠️ COURS INDICATIFS</span>
        <span>Ces taux sont calculés à titre indicatif sur base de la méthode du panier BKAM (60% EUR / 40% USD). Ils ne constituent pas des cours officiels Bank Al-Maghrib et ne sont pas contraignants. Données ECB via Frankfurter API. Pour des cours officiels, consultez <a href="https://www.bkam.ma" target="_blank" rel="noopener noreferrer" className="underline">bkam.ma</a> ou un <a href="https://jad2advisory.com" target="_blank" rel="noopener noreferrer" className="underline">intermédiaire agréé</a>.</span>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
          {(['VIREMENTS', 'BILLETS', 'GLOBAL_FX'] as DashboardTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 text-xs font-bold uppercase tracking-wide rounded-md transition-all ${
                activeTab === tab
                  ? 'bg-navy-900 text-white shadow'
                  : 'text-slate-500 hover:text-navy-900 hover:bg-slate-200'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {activeTab !== 'GLOBAL_FX' && (
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filter currency..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-900 w-40"
              />
            </div>
          )}
          <button
            onClick={refresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-50 disabled:opacity-50 transition"
          >
            <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-50 transition"
          >
            <Download size={12} /> Export CSV
          </button>
          <div className="text-[10px] text-slate-400">
            {ratesDate && <span>ECB {ratesDate}</span>}
            {rates[0]?.source === 'FALLBACK' && (
              <span className="ml-2 text-amber-500 font-medium">● Offline data</span>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && rates.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <RefreshCw size={24} className="animate-spin text-gold-500 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Fetching live rates from ECB / BKAM basket...</p>
        </div>
      )}

      {/* VIREMENTS / BILLETS Tab */}
      {activeTab !== 'GLOBAL_FX' && rates.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-serif text-base font-bold text-navy-900">
                  {activeTab === 'VIREMENTS' ? 'Taux VIREMENTS — Toutes Devises BKAM' : 'Taux BILLETS — Toutes Devises BKAM'}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {activeTab === 'VIREMENTS' ? 'Spread ±0.8% (spread bancaire indicatif)' : 'Spread ±1.8% (billets de banque)'}
                </p>
              </div>
              {lastUpdate && (
                <span className="text-[10px] text-slate-400">
                  Updated {new Date(lastUpdate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
            {renderRatesTable()}
          </div>

          {/* Side Panel */}
          <div className="xl:col-span-1 space-y-4">
            {/* Basket Model Card */}
            <div className="bg-navy-900 text-white rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-2 right-2 opacity-10">
                <TrendingUp size={80} />
              </div>
              <h4 className="text-gold-400 text-[10px] font-black uppercase tracking-widest mb-4">
                BKAM Basket Model
              </h4>
              <div className="space-y-3 relative z-10">
                <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-slate-300 text-[10px] mb-1">EUR/MAD</p>
                  <p className="text-2xl font-serif font-bold">
                    {rates.find(r => r.currency === 'EUR')?.mid.toFixed(4) ?? '—'}
                  </p>
                </div>
                <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-slate-300 text-[10px] mb-1">USD/MAD</p>
                  <p className="text-2xl font-serif font-bold">
                    {rates.find(r => r.currency === 'USD')?.mid.toFixed(4) ?? '—'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center pt-2 border-t border-white/10">
                  <div>
                    <p className="text-slate-400 text-[9px] uppercase">EUR Weight</p>
                    <p className="text-white font-bold text-sm">60%</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[9px] uppercase">USD Weight</p>
                    <p className="text-white font-bold text-sm">40%</p>
                  </div>
                </div>
              </div>
              <p className="text-[9px] text-slate-500 mt-4 border-t border-white/5 pt-3">
                Rates derived from ECB cross-rates via BKAM basket formula (K={config.referenceBasketValue})
              </p>
            </div>

            {/* Gulf Currencies Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <h4 className="text-xs font-bold text-navy-900 mb-3">Gulf Currencies (USD Pegs)</h4>
              <div className="space-y-2">
                {['SAR', 'AED', 'KWD', 'QAR'].map(code => {
                  const r = rates.find(x => x.currency === code);
                  const meta = currencyMeta[code];
                  if (!r) return null;
                  return (
                    <div key={code} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span>{meta?.flag}</span>
                        <span className="text-slate-600 text-xs">{code}/MAD</span>
                      </span>
                      <span className="font-mono font-bold text-navy-900 text-xs">{r.mid.toFixed(4)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bank Comparison (below the table, when currency selected) */}
      {activeTab !== 'GLOBAL_FX' && selectedRate && rates.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {renderBankComparison()}
        </div>
      )}

      {/* GLOBAL_FX Tab — Chart */}
      {activeTab === 'GLOBAL_FX' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {/* Currency selector */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex flex-wrap gap-2">
                {rates.map(r => {
                  const meta = currencyMeta[r.currency];
                  return (
                    <button
                      key={r.currency}
                      onClick={() => setSelectedCurrency(r.currency)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        r.currency === selectedCurrency
                          ? 'bg-navy-900 text-white shadow'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <span>{meta?.flag}</span>
                      {r.currency}
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedRate && (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{currencyMeta[selectedCurrency]?.flag}</span>
                    <div>
                      <h3 className="font-serif text-lg font-bold text-navy-900">{selectedRate.pair}</h3>
                      <p className="text-xs text-slate-400">{currencyMeta[selectedCurrency]?.nameFr}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-mono font-bold text-navy-900">{selectedRate.mid.toFixed(4)}</p>
                    <p className="text-[10px] text-slate-400">MAD per {currencyMeta[selectedCurrency]?.bkamUnit === 100 ? '100' : '1'} {selectedCurrency}</p>
                  </div>
                </div>
                <div className="p-4">
                  <FxChart pair={selectedRate.pair} data={chartData} />
                </div>
              </div>
            )}
          </div>

          {/* Side panel for GLOBAL_FX */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h4 className="font-serif font-bold text-navy-900 mb-4 text-sm">All BKAM Rates</h4>
              <div className="space-y-3">
                {rates.map(r => {
                  const meta = currencyMeta[r.currency];
                  return (
                    <div
                      key={r.currency}
                      onClick={() => setSelectedCurrency(r.currency)}
                      className={`flex items-center justify-between cursor-pointer p-2 rounded-lg transition ${
                        r.currency === selectedCurrency ? 'bg-gold-50 border border-gold-200' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{meta?.flag}</span>
                        <div>
                          <p className="text-xs font-bold text-navy-900">{r.currency}</p>
                          <p className="text-[10px] text-slate-400">{meta?.nameFr}</p>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-bold text-navy-900">{r.mid.toFixed(4)}</span>
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
