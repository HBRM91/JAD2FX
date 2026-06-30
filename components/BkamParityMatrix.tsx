/**
 * BKAM Parity Matrix â€” Dynamic cross-rate basket analysis
 *
 * For every BKAM-published currency:
 *   basket_parity = USD/MAD_basket × (CCY/USD cross)
 *   drift_bps     = (BKAM_fixing âˆ’ basket) / basket × 10 000
 *   band_util     = position in ±5% regulatory band (0â€“100%)
 *
 * Data from KV database (populated daily by cron + enriched with ECB cross-rates).
 */
import React, { useEffect, useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, ReferenceLine, Cell, ScatterChart, Scatter, ZAxis,
} from 'recharts';
import { RefreshCw, TrendingUp, TrendingDown, Minus, BarChart2, Download, Info } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import CurrencyFlag from './CurrencyFlag';
import { BKAM_CURRENCIES } from '../constants';
import { EXTRA_CURRENCY_META } from '../services/bkamFixing';

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface EnrichedRate {
  libDevise: string;
  moyen: number;
  uniteDevise: number;
  displayRate?: number;
  basketParity?: number;
  driftBps?: number;
  bandUtilPct?: number;
}

interface DBEntry {
  date: string;
  rates: EnrichedRate[];
  rawRates?: EnrichedRate[];
  ecbEurUsd?: number;
  usdMadBasket?: number;
  fetchedAt?: string;
  count?: number;
}

interface HistoryPayload {
  dates: string[];
  points: DBEntry[];
  totalDatesInDB: number;
}

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const ALL_META: Record<string, { nameFr: string; countryCode: string }> = {
  ...Object.fromEntries(BKAM_CURRENCIES.map(c => [c.code, { nameFr: c.nameFr, countryCode: c.countryCode }])),
  ...Object.fromEntries(Object.entries(EXTRA_CURRENCY_META).map(([k, v]) => [k, { nameFr: v.nameFr, countryCode: v.countryCode }])),
};

function driftColor(bps: number): string {
  const a = Math.abs(bps);
  return a < 100 ? '#10b981' : a < 250 ? '#f59e0b' : '#ef4444';
}

function bandUtilColor(u: number): string {
  return u < 20 || u > 80 ? '#ef4444' : u < 35 || u > 65 ? '#f59e0b' : '#10b981';
}

function exportCSV(entry: DBEntry) {
  const lines = ['Devise,Cours BKAM,Unité,Parité Panier,Dérive (bps),Util. Bande (%)'];
  for (const r of entry.rates) {
    if (r.basketParity == null) continue;
    lines.push(`${r.libDevise},${r.moyen},${r.uniteDevise},${r.basketParity ?? ''},${r.driftBps ?? ''},${r.bandUtilPct ?? ''}`);
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `BKAM_Parite_${entry.date}.csv`; a.click();
  URL.revokeObjectURL(url);
}

// â”€â”€â”€ Main component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type TabId = 'drift-bar' | 'history' | 'scatter' | 'table';

export default function BkamParityMatrix() {
  const { config } = useAdmin();
  const [latest, setLatest]   = useState<DBEntry | null>(null);
  const [history, setHistory] = useState<DBEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [tab, setTab]         = useState<TabId>('drift-bar');
  const [sortBy, setSortBy]   = useState<'g10' | 'drift' | 'band' | 'alpha'>('g10');
  const [showAll, setShowAll] = useState(false);

  const proxyUrl = config.corsProxyUrl?.replace(/\/$/, '') ?? '';

  const load = async () => {
    if (!proxyUrl) { setError('Proxy URL non configuré'); setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const histRes = await fetch(`${proxyUrl}/api/bkam-rates/history?days=90`, { signal: AbortSignal.timeout(15_000) });
      if (histRes.ok) {
        const h: HistoryPayload = await histRes.json();
        const pts = h.points ?? [];
        setHistory(pts);
        // Use most recent date with actual BKAM data as "latest"; fall back to most recent ECB-only
        const bkamEntry = [...pts].reverse().find(p => p.rates?.some(r => r.driftBps != null));
        const fallback  = pts[pts.length - 1] ?? null;
        setLatest(bkamEntry ?? fallback);
      } else {
        setError('Historique indisponible.');
      }
    } catch (e) {
      setError('Impossible de charger les données. Vérifiez la configuration du proxy.');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [proxyUrl]);

  // â”€â”€ Sorted enriched rates for today â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // G10 canonical order (MAD-relevant), then EM, then Gulf pegs
  const G10_ORDER: Record<string, number> = {
    EUR: 1, USD: 2, GBP: 3, CHF: 4, JPY: 5, CAD: 6,
    NOK: 7, SEK: 8, DKK: 9, AUD: 10, CNY: 11,
    SAR: 12, AED: 13, QAR: 14, KWD: 15, OMR: 16, BHD: 17, JOD: 18,
    TRY: 19, ZAR: 20, INR: 21, BRL: 22, RUB: 23,
    TND: 24, DZD: 25, LYD: 26, XOF: 27, EGP: 28, MRO: 29, GIP: 30,
  };

  const enrichedRates = useMemo(() => {
    if (!latest?.rates) return [];
    return latest.rates
      .filter(r => r.driftBps != null && r.basketParity != null)
      .sort((a, b) => {
        if (sortBy === 'g10')   return (G10_ORDER[a.libDevise] ?? 99) - (G10_ORDER[b.libDevise] ?? 99);
        if (sortBy === 'drift') return Math.abs(b.driftBps!) - Math.abs(a.driftBps!);
        if (sortBy === 'band')  return Math.abs((b.bandUtilPct ?? 50) - 50) - Math.abs((a.bandUtilPct ?? 50) - 50);
        return a.libDevise.localeCompare(b.libDevise);
      });
  }, [latest, sortBy]);

  const displayed = showAll ? enrichedRates : enrichedRates.slice(0, 15);

  // â”€â”€ Historical trend data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const trendData = useMemo(() => history.map(h => {
    const eur = h.rates?.find(r => r.libDevise === 'EUR');
    const usd = h.rates?.find(r => r.libDevise === 'USD');
    const gbp = h.rates?.find(r => r.libDevise === 'GBP');
    return {
      date:    h.date.slice(5),  // MM-DD
      fullDate: h.date,
      ecbEurUsd: h.ecbEurUsd,
      usdBasket: h.usdMadBasket,
      eurDrift: eur?.driftBps ?? null,
      usdDrift: usd?.driftBps ?? null,
      gbpDrift: gbp?.driftBps ?? null,
      eurFixing: eur?.moyen ?? null,
      eurBasket: eur?.basketParity ?? null,
      usdFixing: usd?.moyen ?? null,
      usdBasketRate: usd?.basketParity ?? null,
    };
  }), [history]);

  // â”€â”€ Scatter: drift vs band utilisation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const scatterData = enrichedRates.map(r => ({
    name: r.libDevise,
    drift: r.driftBps ?? 0,
    band:  r.bandUtilPct ?? 50,
    fixing: r.displayRate ?? r.moyen,
  }));

  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'drift-bar', label: 'Dérive par devise', icon: BarChart2 },
    { id: 'history',   label: 'Tendance historique', icon: TrendingUp },
    { id: 'scatter',   label: 'Carte drift/bande', icon: Info },
    { id: 'table',     label: 'Tableau complet', icon: Minus },
  ];

  const avg   = enrichedRates.length ? enrichedRates.reduce((s, r) => s + (r.driftBps ?? 0), 0) / enrichedRates.length : 0;
  const worst = enrichedRates.reduce((m, r) => Math.abs(r.driftBps ?? 0) > Math.abs(m.driftBps ?? 0) ? r : m, enrichedRates[0]);

  return (
    <div className="space-y-5">

      {/* â”€â”€ Header â”€â”€ */}
      <div className="bg-navy-900 border border-navy-700 rounded-2xl overflow-hidden">
        <div className="h-0.5 bg-gradient-to-r from-gold-700 via-gold-400 to-gold-700" />
        <div className="px-6 py-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <BarChart2 size={18} className="text-gold-400" />
              Matrice de Parité Panier â€” {latest?.count ?? 0} Devises
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Basket USD/MAD = K/(0.60×EUR/USD_ECB+0.40) · K=10.49 ·
              Dérive = (BKAM_fixing âˆ’ parité_panier) / parité × 10 000 bps
            </p>
            {latest && (
              <p className="text-[10px] text-slate-600 mt-1 font-mono">
                Séance {latest.date} · ECB EUR/USD: {latest.ecbEurUsd?.toFixed(4)} ·
                USD/MAD panier: {latest.usdMadBasket?.toFixed(4)} · Source: {latest.fetchedAt ? 'BKAM KV DB' : 'live'}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {latest && <button onClick={() => exportCSV(latest)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-navy-700 hover:border-emerald-600 text-slate-400 hover:text-emerald-400 rounded-lg text-xs transition">
              <Download size={11} /> CSV
            </button>}
            <button onClick={load} disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-navy-700 hover:border-gold-600 text-slate-400 hover:text-white rounded-lg text-xs transition disabled:opacity-40">
              <RefreshCw size={11} className={loading ? 'animate-spin' : ''} /> Actualiser
            </button>
          </div>
        </div>

        {/* KPI strip */}
        {latest && !loading && (
          <div className="px-6 py-3 border-t border-navy-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Dérive moyenne', value: avg.toFixed(1) + ' bps', color: driftColor(avg) },
              { label: 'Plus grande dérive', value: worst ? worst.libDevise + ' ' + worst.driftBps?.toFixed(0) + ' bps' : 'â€”', color: driftColor(worst?.driftBps ?? 0) },
              { label: 'USD/MAD basket', value: latest.usdMadBasket?.toFixed(4) ?? 'â€”', color: 'text-blue-400' },
              { label: 'ECB EUR/USD', value: latest.ecbEurUsd?.toFixed(4) ?? 'â€”', color: 'text-slate-300' },
            ].map(k => (
              <div key={k.label} className="bg-navy-800/40 rounded-lg px-3 py-2">
                <p className="text-[9px] text-slate-500 uppercase tracking-wider">{k.label}</p>
                <p className={`text-sm font-mono font-bold ${k.color}`}>{k.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {loading && <div className="flex justify-center py-16"><RefreshCw size={24} className="text-gold-500 animate-spin" /></div>}
      {error && <div className="bg-red-950/20 border border-red-800/40 rounded-xl p-4 text-sm text-red-400">{error}</div>}

      {!loading && !error && latest && (
        <>
          {/* â”€â”€ Tab bar â”€â”€ */}
          <div className="flex items-center gap-1 bg-navy-900 border border-navy-700 rounded-xl p-1">
            {tabs.map(t => {
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-semibold flex-1 justify-center transition-all ${
                    tab === t.id ? 'bg-gold-500 text-navy-950 shadow' : 'text-slate-400 hover:text-white hover:bg-navy-800/60'
                  }`}>
                  <Icon size={12} /> <span className="hidden sm:inline">{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* â”€â”€ Tab: Drift bar chart â”€â”€ */}
          {tab === 'drift-bar' && (
            <div className="bg-navy-900 border border-navy-700 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-[11px] font-bold text-white uppercase tracking-widest">
                  Dérive Fixing BKAM vs Parité Panier â€” {enrichedRates.length} Devises · {latest.date}
                </h3>
                <div className="flex items-center gap-1.5">
                  {(['g10', 'drift', 'band', 'alpha'] as const).map(s => (
                    <button key={s} onClick={() => setSortBy(s)}
                      className={`text-[9px] font-bold px-2 py-0.5 rounded border transition ${sortBy===s ? 'border-gold-600/60 bg-gold-500/10 text-gold-400' : 'border-navy-700 text-slate-500 hover:border-navy-600'}`}>
                      {s === 'g10' ? 'G10â†“' : s === 'drift' ? '|Dérive|â†“' : s === 'band' ? 'Bandeâ†“' : 'A→Z'}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ height: Math.max(300, displayed.length * 28) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={displayed} layout="vertical" margin={{ top: 0, right: 60, bottom: 0, left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1C3558" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#3D6491', fontSize: 9 }} unit=" pb"
                      domain={['auto', 'auto']} tickCount={7} />
                    <YAxis type="category" dataKey="libDevise" tick={{ fill: '#94a3b8', fontSize: 10 }}
                      width={38} />
                    <Tooltip
                      contentStyle={{ background: '#081628', border: '1px solid #1C3558', borderRadius: 6, fontSize: 11 }}
                      formatter={((v: number, name: string) => [
                        name === 'driftBps' ? `${v.toFixed(1)} bps` : v.toFixed(4),
                        name === 'driftBps' ? 'Dérive' : name,
                      ]) as any}
                      labelFormatter={((l: string) => {
                        const m = ALL_META[l];
                        const r = latest.rates.find(x => x.libDevise === l);
                        return `${l} â€” ${m?.nameFr ?? ''}\nBKAM: ${r?.moyen} | Panier: ${r?.basketParity} | Bande: ${r?.bandUtilPct}%`;
                      }) as any}
                    />
                    <ReferenceLine x={0} stroke="#D4AF37" strokeWidth={1} strokeDasharray="4 2" />
                    <Bar dataKey="driftBps" name="driftBps" radius={[0, 3, 3, 0]}>
                      {displayed.map((r) => (
                        <Cell key={r.libDevise} fill={driftColor(r.driftBps ?? 0)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {enrichedRates.length > 15 && (
                <button onClick={() => setShowAll(v => !v)}
                  className="w-full text-[10px] text-gold-500 hover:text-gold-300 py-1 border border-navy-800 rounded-lg transition">
                  {showAll ? `Afficher moins` : `Afficher les ${enrichedRates.length - 15} devises supplémentaires â†“`}
                </button>
              )}
              <p className="text-[9px] text-slate-700">
                Négatif = MAD plus fort que la parité panier implique (BKAM maintient le MAD en bas de la bande).
                Positif = MAD plus faible que la parité panier. Bande réglementaire ±5% (Phase II, mars 2020).
              </p>
            </div>
          )}

          {/* â”€â”€ Tab: Historical trend â”€â”€ */}
          {tab === 'history' && (
            <div className="bg-navy-900 border border-navy-700 rounded-2xl p-5 space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-[11px] font-bold text-white uppercase tracking-widest">
                  Tendance Dérive EUR/MAD · USD/MAD · GBP/MAD â€” {history.length} séances
                </h3>
                <div className="flex items-center gap-3 text-[9px]">
                  <span className="flex items-center gap-1"><span className="inline-block w-4 h-0.5 bg-gold-400" /> BKAM Officiel</span>
                  <span className="flex items-center gap-1"><span className="inline-block w-4 h-0.5 bg-gold-400 opacity-50" style={{borderTop:'1px dashed'}} /> Panier ECB (continu)</span>
                  <span className="text-slate-600">Points isolés = séances sans fixing BKAM (dérive N/A)</span>
                </div>
              </div>

              {/* Drift bps over time */}
              <div>
                <p className="text-[10px] text-slate-500 mb-2">Dérive fixing BKAM vs parité panier (bps)</p>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1C3558" />
                      <XAxis dataKey="date" tick={{ fill: '#3D6491', fontSize: 9 }} />
                      <YAxis tick={{ fill: '#3D6491', fontSize: 9 }} unit=" pb" width={52} />
                      <Tooltip contentStyle={{ background: '#081628', border: '1px solid #1C3558', borderRadius: 6, fontSize: 11 }}
                        formatter={((v: number) => [`${v?.toFixed(1)} bps`]) as any} />
                      <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                      <ReferenceLine y={0} stroke="#D4AF37" strokeWidth={1} strokeDasharray="4 2" label={{ value: 'Parité', fill: '#8a6a20', fontSize: 8 }} />
                      <Line type="monotone" dataKey="eurDrift" stroke="#D4AF37" strokeWidth={2} dot={{ r: 3 }} name="EUR/MAD drift" />
                      <Line type="monotone" dataKey="usdDrift" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="USD/MAD drift" />
                      <Line type="monotone" dataKey="gbpDrift" stroke="#a78bfa" strokeWidth={1.5} dot={{ r: 2 }} name="GBP/MAD drift" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* EUR/MAD fixing vs basket over time */}
              <div>
                <p className="text-[10px] text-slate-500 mb-2">EUR/MAD â€” Fixing BKAM vs Parité Panier</p>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1C3558" />
                      <XAxis dataKey="date" tick={{ fill: '#3D6491', fontSize: 9 }} />
                      <YAxis tick={{ fill: '#3D6491', fontSize: 9 }} domain={['auto', 'auto']} width={54} />
                      <Tooltip contentStyle={{ background: '#081628', border: '1px solid #1C3558', borderRadius: 6, fontSize: 11 }}
                        formatter={((v: number) => [v?.toFixed(4)]) as any} />
                      <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                      <Line type="monotone" dataKey="eurFixing" stroke="#D4AF37" strokeWidth={2} dot={{ r: 3, strokeWidth: 0 }} name="EUR/MAD BKAM" />
                      <Line type="monotone" dataKey="eurBasket" stroke="#D4AF37" strokeWidth={1} strokeDasharray="5 3" dot={false} name="EUR/MAD Panier" connectNulls opacity={0.6} />
                      <Line type="monotone" dataKey="usdFixing" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, strokeWidth: 0 }} name="USD/MAD BKAM" />
                      <Line type="monotone" dataKey="usdBasketRate" stroke="#3b82f6" strokeWidth={1} strokeDasharray="5 3" dot={false} name="USD/MAD Panier" connectNulls opacity={0.6} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* â”€â”€ Tab: Scatter drift vs band â”€â”€ */}
          {tab === 'scatter' && (
            <div className="bg-navy-900 border border-navy-700 rounded-2xl p-5 space-y-3">
              <h3 className="text-[11px] font-bold text-white uppercase tracking-widest">
                Carte Drift × Utilisation Bande â€” {scatterData.length} Devises · {latest.date}
              </h3>
              <p className="text-[10px] text-slate-500">
                X: Dérive (bps) | Y: Position dans bande ±5% (50% = parité centrale) | Cercle = fixing BKAM
              </p>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 16, right: 16, bottom: 16, left: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1C3558" />
                    <XAxis type="number" dataKey="drift" name="Dérive" unit=" pb"
                      tick={{ fill: '#3D6491', fontSize: 9 }} label={{ value: 'Dérive bps', fill: '#4E7EAC', fontSize: 9, position: 'insideBottom', offset: -8 }} />
                    <YAxis type="number" dataKey="band" name="Bande" unit="%"
                      tick={{ fill: '#3D6491', fontSize: 9 }} domain={[0, 100]}
                      label={{ value: 'Util. bande %', fill: '#4E7EAC', fontSize: 9, angle: -90, position: 'insideLeft' }} />
                    <ZAxis range={[60, 100]} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }}
                      contentStyle={{ background: '#081628', border: '1px solid #1C3558', borderRadius: 6, fontSize: 11 }}
                      content={({ payload }) => {
                        const d = payload?.[0]?.payload;
                        if (!d) return null;
                        const meta = ALL_META[d.name];
                        return (
                          <div className="p-2">
                            <p className="font-bold text-white">{d.name}/MAD â€” {meta?.nameFr}</p>
                            <p className="text-slate-400 text-[10px]">Fixing: {d.fixing}</p>
                            <p className="text-[10px]" style={{ color: driftColor(d.drift) }}>Dérive: {d.drift?.toFixed(1)} bps</p>
                            <p className="text-[10px]" style={{ color: bandUtilColor(d.band) }}>Bande: {d.band?.toFixed(1)}%</p>
                          </div>
                        );
                      }}
                    />
                    <ReferenceLine x={0} stroke="#D4AF37" strokeDasharray="4 2" strokeWidth={1} />
                    <ReferenceLine y={50} stroke="#94a3b8" strokeDasharray="4 2" strokeWidth={0.5} />
                    <Scatter data={scatterData} name="Devises">
                      {scatterData.map((d) => (
                        <Cell key={d.name} fill={driftColor(d.drift)} fillOpacity={0.8} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[9px] text-slate-600">
                Zone verte (|dérive| &lt;100 bps, bande 35â€“65%): MAD bien ancré sur la parité panier.
                Zone rouge: MAD significativement écarté â€” surveiller l'évolution.
              </p>
            </div>
          )}

          {/* â”€â”€ Tab: Full table â”€â”€ */}
          {tab === 'table' && (
            <div className="bg-navy-900 border border-navy-700 rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-navy-800 flex items-center justify-between">
                <h3 className="text-[11px] font-bold text-white uppercase tracking-widest">
                  Tableau Complet â€” {enrichedRates.length} Devises Enrichies · {latest.date}
                </h3>
                <button onClick={() => exportCSV(latest)}
                  className="flex items-center gap-1 text-[9px] text-slate-400 hover:text-emerald-400 font-semibold border border-navy-700 hover:border-emerald-700 px-2 py-1 rounded transition">
                  <Download size={10} /> CSV
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[700px]">
                  <thead>
                    <tr className="bg-navy-800/40 text-[9px] text-slate-500 uppercase tracking-wider border-b border-navy-800">
                      <th className="text-left py-2.5 px-4">Devise</th>
                      <th className="text-right px-3">BKAM Fixing</th>
                      <th className="text-right px-3">Parité Panier</th>
                      <th className="text-right px-3">Dérive (bps)</th>
                      <th className="text-right px-3">Util. Bande</th>
                      <th className="text-right px-4">Tendance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-800/40">
                    {enrichedRates.map(r => {
                      const meta = ALL_META[r.libDevise];
                      const driftAbs = Math.abs(r.driftBps ?? 0);
                      const Icon = (r.driftBps ?? 0) > 0 ? TrendingUp : (r.driftBps ?? 0) < 0 ? TrendingDown : Minus;
                      return (
                        <tr key={r.libDevise} className="hover:bg-navy-800/30 transition-colors">
                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-2.5">
                              {meta?.countryCode && <CurrencyFlag countryCode={meta.countryCode} size="sm" />}
                              <div>
                                <p className="font-bold text-white text-[12px]">{r.libDevise}/MAD</p>
                                <p className="text-[9px] text-slate-500">{meta?.nameFr ?? ''}</p>
                              </div>
                              {r.uniteDevise !== 1 && (
                                <span className="text-[9px] text-navy-500 bg-navy-800 px-1 rounded">×{r.uniteDevise}</span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <span className="font-mono font-bold text-white text-[13px] tabular-nums">{r.moyen}</span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-400 text-[12px] tabular-nums">
                            {r.basketParity?.toFixed(4) ?? 'â€”'}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <span className="font-mono font-bold text-[12px] tabular-nums"
                              style={{ color: driftColor(r.driftBps ?? 0) }}>
                              {(r.driftBps ?? 0) > 0 ? '+' : ''}{r.driftBps?.toFixed(1) ?? 'â€”'} pb
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <div className="w-16 h-1.5 bg-navy-800 rounded-full overflow-hidden">
                                <div className="h-full rounded-full"
                                  style={{ width: `${r.bandUtilPct ?? 50}%`, background: bandUtilColor(r.bandUtilPct ?? 50) }} />
                              </div>
                              <span className="text-[9px] font-mono tabular-nums"
                                style={{ color: bandUtilColor(r.bandUtilPct ?? 50) }}>
                                {r.bandUtilPct?.toFixed(0) ?? 'â€”'}%
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <Icon size={13} style={{ color: driftColor(r.driftBps ?? 0) }} className="ml-auto" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-2.5 border-t border-navy-800">
                <p className="text-[9px] text-slate-600">
                  Dérive = (Fixing BKAM âˆ’ Parité panier ECB) / Parité × 10 000 bps ·
                  Parité = USD/MAD_basket × (CCY/USD ECB ou peg officiel) ·
                  Bande réglementaire ±5% (Phase II BKAM, mars 2020) · Loi 43-12
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
