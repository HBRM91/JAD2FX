import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { SkeletonTable } from './Skeleton';
import { FixingDayRow } from '../types';
import { BKAM_CURRENCIES } from '../constants';
import { fetchFixingHistory, EXTRA_CURRENCY_META, formatDateLabel } from '../services/bkamFixing';
import { useAdmin } from '../context/AdminContext';
import { useI18n } from '../context/I18nContext';
import {
  RefreshCw, AlertTriangle, Info, Database,
  Download, Calendar, CheckCircle, ChevronDown,
} from 'lucide-react';
import CurrencyFlag from './CurrencyFlag';
import { BKAM_LINKS } from '../constants/bkamLinks';

// â”€â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const BAND_PCT = 5.0;
const BAND_BPS = 500;

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const fmt4 = (v: number) => v.toFixed(4);
const fmtBps = (v: number) => (v >= 0 ? '+' : '') + v.toFixed(1) + ' bps';
const fmtPct = (v: number) => (v >= 0 ? '+' : '') + v.toFixed(4) + '%';

function divColor(bps: number): string {
  const a = Math.abs(bps);
  return a < 50 ? 'text-emerald-400' : a < 150 ? 'text-amber-400' : 'text-red-400';
}
function divBg(bps: number): string {
  const a = Math.abs(bps);
  return a < 50
    ? 'bg-emerald-950/20 border-emerald-800/40'
    : a < 150
    ? 'bg-amber-950/20 border-amber-800/40'
    : 'bg-red-950/20 border-red-800/40';
}

// â”€â”€â”€ Band gauge â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function BandGauge({ bps, bandUtilPct }: { bps: number; bandUtilPct?: number }) {
  // bandUtilPct: 0â€“100% position in ±5% band (pre-computed by Worker); fallback from bps
  const pct   = bandUtilPct != null
    ? Math.min(Math.max(bandUtilPct, 1), 99)
    : Math.min(Math.max((bps / BAND_BPS) * 50 + 50, 1), 99);
  const color = Math.abs(bps) < 50 ? '#10b981' : Math.abs(bps) < 150 ? '#f59e0b' : '#ef4444';
  return (
    <div className="w-full">
      <div className="relative h-2.5 bg-navy-700/60 rounded-full overflow-hidden">
        <div className="absolute left-[12.5%] top-0 h-full w-px bg-red-400/50" />
        <div className="absolute right-[12.5%] top-0 h-full w-px bg-red-400/50" />
        <div className="absolute left-1/2 top-0 h-full w-px bg-slate-400/40" />
        <div
          className="absolute top-0.5 bottom-0.5 w-2 -translate-x-1/2 rounded-full shadow transition-all duration-700"
          style={{ left: `${pct}%`, background: color }}
        />
      </div>
      <div className="flex justify-between text-[9px] text-slate-600 mt-0.5 font-mono">
        <span>âˆ’{BAND_PCT}%</span><span>Parité</span><span>+{BAND_PCT}%</span>
      </div>
    </div>
  );
}

// â”€â”€â”€ Stat card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function StatCard({ label, value, sub, color = 'text-white' }: {
  label: string; value: string; sub?: string; color?: string;
}) {
  return (
    <div className="bg-navy-800/60 border border-navy-700 rounded-xl p-4">
      <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-lg font-bold font-mono tabular-nums ${color}`}>{value}</p>
      {sub && <p className="text-[10px] text-slate-500 mt-0.5 font-mono">{sub}</p>}
    </div>
  );
}

// â”€â”€â”€ CSV export â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function exportCSV(row: FixingDayRow) {
  const lines: string[] = [
    'Devise,Code ISO,Unité de cotation,Cours moyen (MAD),Source',
  ];

  // Use raw BKAM data if available for exact official values
  if (row.rawBkamRates?.length) {
    for (const r of row.rawBkamRates) {
      const meta = BKAM_CURRENCIES.find(c => c.code === r.libDevise)
        ?? (EXTRA_CURRENCY_META[r.libDevise]
          ? { nameFr: EXTRA_CURRENCY_META[r.libDevise].nameFr }
          : null);
      const name = (meta as { nameFr?: string } | null)?.nameFr ?? r.libDevise;
      lines.push(`"${name}",${r.libDevise},${r.uniteDevise},${r.moyen?.toFixed(4) ?? ''},BKAM Officiel`);
    }
  } else {
    // ECB proxy fallback
    for (const c of BKAM_CURRENCIES) {
      const rate = row.allRates[c.code];
      if (!rate) continue;
      lines.push(`"${c.nameFr}",${c.code},${c.bkamUnit},${rate.toFixed(4)},ECB Proxy`);
    }
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `BKAM_Fixing_${row.date}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// â”€â”€â”€ Custom divergence bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function DivBar(props: { x?: number; y?: number; width?: number; height?: number; value?: number }) {
  const { x = 0, y = 0, width = 0, height = 0, value = 0 } = props;
  const color = Math.abs(value) < 50 ? '#10b981' : Math.abs(value) < 150 ? '#f59e0b' : '#ef4444';
  return <rect x={x} y={y} width={width} height={height} fill={color} rx={2} />;
}

// â”€â”€â”€ Main component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function BkamFixing() {
  const { config } = useAdmin();
  const { locale, isRTL } = useI18n();

  const [rows,       setRows]       = useState<FixingDayRow[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [dateMode,   setDateMode]   = useState<'recent' | 'specific'>('recent');
  const [showTrend,  setShowTrend]  = useState(false);

  const proxyUrl = config.corsProxyUrl || undefined;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFixingHistory(
        5,
        proxyUrl,                                              // â† CRITICAL: pass proxy URL
        dateMode === 'specific' && selectedDate ? selectedDate : undefined,
      );
      if (dateMode === 'specific' && selectedDate && data.length === 0) {
        setError(`Aucune donnée disponible pour le ${formatDateLabel(selectedDate)}.`);
      }
      setRows(data);
    } catch (e) {
      setError('Impossible de récupérer les données de fixing.');
    } finally {
      setLoading(false);
    }
  }, [proxyUrl, dateMode, selectedDate]);

  useEffect(() => { load(); }, [load]);

  const latest = rows[rows.length - 1] ?? null;
  const isOfficial = latest?.source === 'BKAM_OFFICIAL';

  // Chart data
  const trendData = rows.map(r => ({
    date: r.dateLabel,
    'EUR/MAD Fixing': r.eurMad_ecb,
    'EUR/MAD Panier': r.eurMad_basket,
    'USD/MAD Fixing': r.usdMad_ecb,
    'USD/MAD Panier': r.usdMad_basket,
  }));

  const divData = rows.map(r => ({
    date: r.dateLabel,
    'EUR/MAD (bps)': r.eurMad_div_bps,
    'USD/MAD (bps)': r.usdMad_div_bps,
  }));

  // All currencies for the rate table (BKAM_CURRENCIES + extras)
  const extraCodes = Object.keys(EXTRA_CURRENCY_META);

  return (
    <div className={`space-y-5 ${isRTL ? 'text-right' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>

      {/* â”€â”€ Header â”€â”€ */}
      <div className="bg-navy-900 border border-navy-700 rounded-2xl overflow-hidden">
        <div className="h-0.5 bg-gradient-to-r from-gold-700 via-gold-400 to-gold-700" />
        <div className="px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2 uppercase tracking-widest">
                <Database size={18} className="text-gold-400" />
                Fixing Officiel BKAM â€” Parité MAD
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                {isOfficial
                  ? `Cours CoursVirement officiel BKAM · ${latest?.date} · 12h30 Casablanca · ${latest?.rawBkamRates?.length ?? 0} devises`
                  : 'Source: ECB/Frankfurter (proxy indicatif) · Formule panier K=10,49 · 60% EUR / 40% USD'}
              </p>
              {isOfficial && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <CheckCircle size={11} className="text-emerald-400" />
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wide">
                    BKAM CoursVirement Officiel â€” Données authentiques
                  </span>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Date picker */}
              <div className="flex items-center gap-1.5 bg-navy-800 border border-navy-700 rounded-lg px-3 py-1.5">
                <Calendar size={12} className="text-gold-500" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => { setSelectedDate(e.target.value); setDateMode('specific'); }}
                  className="bg-transparent text-sm text-white focus:outline-none w-36"
                  max={new Date().toISOString().slice(0, 10)}
                />
                {selectedDate && (
                  <button
                    onClick={() => { setSelectedDate(''); setDateMode('recent'); }}
                    className="text-slate-500 hover:text-white text-xs ml-1"
                  >
                    âœ•
                  </button>
                )}
              </div>

              <button
                onClick={load}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-navy-800 border border-navy-700 hover:border-gold-600 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition disabled:opacity-50"
              >
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                {dateMode === 'specific' ? 'Chercher' : 'Actualiser'}
              </button>

              {latest && (
                <button
                  onClick={() => exportCSV(latest)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-navy-800 border border-navy-700 hover:border-emerald-600 text-slate-300 hover:text-emerald-400 rounded-lg text-xs font-medium transition"
                >
                  <Download size={12} />
                  CSV
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Info bar */}
        <div className="px-6 py-3 border-t border-navy-800 bg-navy-800/20">
          <div className="flex items-start gap-2">
            <Info size={11} className="text-navy-400 mt-0.5 flex-shrink-0" />
            <p className="text-[10px] text-slate-500 leading-relaxed">
              {isOfficial
                ? <>Taux de change virements (CoursVirement) publiés par Bank Al-Maghrib Ã  16h15. Parité panier&nbsp;:
                    <span className="font-mono text-gold-600 mx-1">USD/MAD = K/(w<sub>EUR</sub>·EUR/USD<sub>BCE</sub> + w<sub>USD</sub>)</span>
                    avec K=10,49 · w<sub>EUR</sub>=0,60 · w<sub>USD</sub>=0,40.
                    Dérive = <span className="font-mono text-gold-600 mx-1">(Fixing<sub>BKAM</sub>âˆ’Parité)/Parité Ã— 10 000 pb</span>.
                    Art.&nbsp;3, Circ.&nbsp;LC/BKAM/2018/2 â€” non contractuel.</>
                : 'Aucun proxy configuré â€” données BCE/Frankfurter utilisées comme proxy indicatif. Configurez un proxy CORS dans Admin pour accéder aux fixing officiels BKAM.'}
              {' '}
              <a href={BKAM_LINKS.fixingTransfer}
                target="_blank" rel="noopener noreferrer" className="text-gold-600 hover:text-gold-400">
                Cours officiels BKAM â†—
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* â”€â”€ Loading â”€â”€ */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <RefreshCw size={28} className="text-gold-500 animate-spin" />
          <p className="text-slate-500 text-sm">Chargement du fixing BKAM…</p>
        </div>
      )}

      {/* â”€â”€ Error â”€â”€ */}
      {error && !loading && (
        <div className="bg-red-950/20 border border-red-800/40 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-400">{error}</p>
            <button onClick={load} className="text-xs text-red-400 underline mt-1">Réessayer</button>
          </div>
        </div>
      )}

      {/* â”€â”€ Data â”€â”€ */}
      {!loading && !error && latest && (
        <>
          {/* â”€â”€ Latest snapshot â”€â”€ */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[11px] font-bold text-white uppercase tracking-widest flex items-center gap-2">
                {isOfficial ? (
                  <span className="text-[9px] bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded font-mono">
                    BKAM OFFICIEL
                  </span>
                ) : (
                  <span className="text-[9px] bg-amber-950/40 text-amber-400 border border-amber-800/40 px-2 py-0.5 rounded font-mono">
                    ECB PROXY
                  </span>
                )}
                Séance {latest.dateLabel}
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatCard label="EUR/USD (ECB)" value={fmt4(latest.eurUsd)} sub="Cross de référence" color="text-slate-300" />
              <StatCard
                label={isOfficial ? 'EUR/MAD Fixing BKAM' : 'EUR/MAD (ECB Proxy)'}
                value={fmt4(latest.eurMad_ecb)}
                sub={isOfficial ? '▸ Cours officiel' : 'â‰ˆ Proxy indicatif'}
                color="text-white"
              />
              <StatCard label="EUR/MAD Parité Panier" value={fmt4(latest.eurMad_basket)} sub="K/(0.60Ã—EUR/USD+0.40)" color="text-slate-400" />
              <StatCard
                label="Dérive EUR/MAD"
                value={fmtBps(latest.eurMad_div_bps)}
                sub={fmtPct(latest.eurMad_div_pct)}
                color={divColor(latest.eurMad_div_bps)}
              />
              <StatCard
                label={isOfficial ? 'USD/MAD Fixing BKAM' : 'USD/MAD (ECB Proxy)'}
                value={fmt4(latest.usdMad_ecb)}
                sub={isOfficial ? '▸ Cours officiel' : 'â‰ˆ Proxy indicatif'}
                color="text-white"
              />
              <StatCard
                label="Dérive USD/MAD"
                value={fmtBps(latest.usdMad_div_bps)}
                color={divColor(latest.usdMad_div_bps)}
              />
            </div>
          </div>

          {/* â”€â”€ Divergence alert â”€â”€ */}
          {(Math.abs(latest.eurMad_div_bps) > 100 || Math.abs(latest.usdMad_div_bps) > 100) && (
            <div className={`border rounded-xl p-4 flex items-start gap-3 ${divBg(Math.max(Math.abs(latest.eurMad_div_bps), Math.abs(latest.usdMad_div_bps)))}`}>
              <AlertTriangle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-300">Dérive significative du fixing BKAM</p>
                <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                  Le cours EUR/MAD s'écarte de <strong className="text-white">{fmtBps(latest.eurMad_div_bps)}</strong> de la
                  parité panier théorique. Ce type de dérive reflète l'activité du Marché Interbancaire des Changes (MIC) BKAM,
                  qui intègre l'offre et la demande réelles de devises. Le MAD reste dans la bande légale de ±{BAND_PCT}%.
                </p>
              </div>
            </div>
          )}

          {/* â”€â”€ Full rate table â”€â”€ */}
          <div className="bg-navy-900 border border-navy-700 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-navy-800 flex items-center justify-between">
              <h3 className="text-[11px] font-bold text-white uppercase tracking-widest">
                {isOfficial
                  ? `Cours Officiels BKAM â€” ${latest.rawBkamRates?.length ?? 0} Devises · ${latest.date}`
                  : 'Cours Indicatifs (ECB Proxy) â€” 24 Devises'}
              </h3>
              <div className="flex items-center gap-2">
                {isOfficial && (
                  <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 px-2 py-0.5 rounded">
                    âœ“ CoursVirement BKAM
                  </span>
                )}
                <button onClick={() => exportCSV(latest)}
                  className="flex items-center gap-1 text-[9px] text-slate-400 hover:text-emerald-400 font-semibold transition px-2 py-1 border border-navy-700 hover:border-emerald-700 rounded">
                  <Download size={10} /> CSV
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              {loading && rows.length === 0 ? (
                <div className="p-4"><SkeletonTable rows={6} cols={7} /></div>
              ) : (
              <table className="w-full text-xs min-w-[600px]">
                <thead>
                  <tr className="bg-navy-800/40 text-[9px] text-slate-500 uppercase tracking-wider border-b border-navy-800">
                    <th className="text-left py-2.5 px-4 font-semibold">Devise</th>
                    <th className="text-right px-3 py-2.5 font-semibold">
                      {isOfficial ? 'Cours BKAM (MAD)' : 'Cours Proxy (MAD)'}
                    </th>
                    <th className="text-right px-3 py-2.5 font-semibold">Parité Panier</th>
                    <th className="text-right px-3 py-2.5 font-semibold">Dérive (bps)</th>
                    <th className="text-right px-4 py-2.5 font-semibold">Bande ±5%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-800/40">
                  {/* BKAM_CURRENCIES */}
                  {BKAM_CURRENCIES.map(c => {
                    const rate    = latest.allRates[c.code];
                    if (!rate) return null;

                    // KV-enriched data (BKAM official path) → ECB proxy allBasketParities fallback
                    const enriched = latest.rawBkamRates?.find(r => r.libDevise === c.code);
                    const basketRate = enriched?.basketParity
                      ?? latest.allBasketParities?.[c.code]
                      ?? null;
                    const divBps = enriched?.driftBps !== undefined && enriched.driftBps !== null
                      ? enriched.driftBps
                      : (basketRate ? ((rate - basketRate) / basketRate) * 10_000 : null);
                    const bandUtil = enriched?.bandUtilPct ?? null;

                    return (
                      <tr key={c.code} className="hover:bg-navy-800/30 transition-colors">
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <CurrencyFlag countryCode={c.countryCode} size="sm" />
                            <div>
                              <p className="font-bold text-white text-[12px]">{c.code}/MAD</p>
                              <p className="text-[9px] text-slate-500">
                                {locale === 'ar' ? c.nameAr : locale === 'en' ? c.name : c.nameFr}
                                {c.bkamUnit !== 1 && <span className="ml-1 text-navy-500">Ã—{c.bkamUnit}</span>}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className={`font-mono font-bold text-[13px] tabular-nums ${
                            c.code === 'EUR' || c.code === 'USD' ? 'text-gold-400' : 'text-white'
                          }`}>
                            {fmt4(rate)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-[12px] text-slate-500 tabular-nums">
                          {basketRate ? fmt4(basketRate) : 'â€”'}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {divBps !== null ? (
                            <span className={`font-mono text-[11px] font-bold tabular-nums ${divColor(divBps)}`}>
                              {fmtBps(divBps)}
                            </span>
                          ) : <span className="text-slate-700 text-[10px]">â€”</span>}
                        </td>
                        <td className="py-2.5 px-4 w-32">
                          {divBps !== null ? <BandGauge bps={divBps} bandUtilPct={bandUtil ?? undefined} /> : <span className="text-slate-700 text-[9px]">â€”</span>}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Extra currencies from BKAM API (AUD, EGP, GIP, XOF, RUB, MRO) */}
                  {isOfficial && extraCodes.map(code => {
                    const rate = latest.extraRates?.[code];
                    if (!rate) return null;
                    const meta = EXTRA_CURRENCY_META[code];
                    return (
                      <tr key={code} className="hover:bg-navy-800/30 transition-colors bg-navy-800/10">
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <CurrencyFlag countryCode={meta.countryCode} size="sm" />
                            <div>
                              <p className="font-bold text-white text-[12px]">{code}/MAD</p>
                              <p className="text-[9px] text-slate-500">
                                {locale === 'en' ? meta.name : meta.nameFr}
                                {meta.unit !== 1 && <span className="ml-1 text-navy-500">Ã—{meta.unit}</span>}
                                <span className="ml-1.5 text-[7px] text-navy-600 font-mono">BKAM+</span>
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="font-mono font-bold text-[13px] tabular-nums text-slate-300">
                            {fmt4(rate)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-700 text-[10px]">â€”</td>
                        <td className="py-2.5 px-3 text-right text-slate-700 text-[10px]">â€”</td>
                        <td className="py-2.5 px-4 text-slate-700 text-[9px]">â€”</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              )}
            </div>
            <div className="px-5 py-2.5 border-t border-navy-800 flex flex-wrap items-center gap-3">
              <p className="text-[9px] text-slate-600">
                {isOfficial
                  ? `Source: BKAM CoursVirement API · Fixing ${latest.date} 12h30 · ${latest.rawBkamRates?.length} devises`
                  : 'Source: ECB Frankfurter (proxy indicatif) · Non officiel BKAM'}
              </p>
              <a href={BKAM_LINKS.fixingTransfer}
                target="_blank" rel="noopener noreferrer"
                className="text-[9px] text-gold-600 hover:text-gold-400 ml-auto">
                Cours officiels BKAM â†—
              </a>
            </div>
          </div>

          {/* â”€â”€ Trend chart (B4.2 collapsed by default) â”€â”€ */}
          {rows.length >= 2 && dateMode === 'recent' && (
            <div className="bg-navy-900 border border-navy-700 rounded-2xl p-5 space-y-4">
              <button
                onClick={() => setShowTrend((s) => !s)}
                className="w-full flex items-center justify-between text-left"
                aria-expanded={showTrend}
              >
                <h3 className="text-[11px] font-bold text-white uppercase tracking-widest">
                  Tendance 5 Jours â€” EUR/MAD & USD/MAD vs Parité Panier
                </h3>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${showTrend ? 'rotate-180' : ''}`} />
              </button>
              {showTrend && (
                <>
                <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1C3558" />
                    <XAxis dataKey="date" tick={{ fill: '#3D6491', fontSize: 9 }} />
                    <YAxis
                      tick={{ fill: '#3D6491', fontSize: 9 }}
                      width={58}
                      domain={(['auto', 'auto'] as [string, string])}
                      tickFormatter={(v: number) => v.toFixed(3)}
                    />
                    <Tooltip
                      contentStyle={{ background: '#081628', border: '1px solid #1C3558', borderRadius: 6, fontSize: 11 }}
                      formatter={((v: number, name: string) => [v.toFixed(4), name]) as any}
                    />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                    <Line dataKey="EUR/MAD Fixing" stroke="#D4AF37" strokeWidth={2} dot={{ r: 3 }} />
                    <Line dataKey="EUR/MAD Panier" stroke="#D4AF37" strokeWidth={1} strokeDasharray="5 3" dot={false} opacity={0.5} />
                    <Line dataKey="USD/MAD Fixing" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                    <Line dataKey="USD/MAD Panier" stroke="#3b82f6" strokeWidth={1} strokeDasharray="5 3" dot={false} opacity={0.5} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <h3 className="text-[11px] font-bold text-white uppercase tracking-widest pt-2">
                Dérive Fixing vs Panier (bps) â€” {isOfficial ? 'Données BKAM Officielles' : 'Proxy ECB'}
              </h3>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={divData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1C3558" />
                    <XAxis dataKey="date" tick={{ fill: '#3D6491', fontSize: 9 }} />
                    <YAxis
                      tick={{ fill: '#3D6491', fontSize: 9 }}
                      unit=" pb"
                      width={56}
                      domain={(['auto', 'auto'] as [string, string])}
                      tickFormatter={(v: number) => v.toFixed(0)}
                    />
                    <Tooltip
                      contentStyle={{ background: '#081628', border: '1px solid #1C3558', borderRadius: 6, fontSize: 11 }}
                      formatter={((v: number) => [`${v.toFixed(1)} bps`]) as any}
                    />
                    <ReferenceLine y={0} stroke="#D4AF37" strokeWidth={1} strokeDasharray="4 2" />
                    <Bar dataKey="EUR/MAD (bps)" shape={<DivBar />} />
                    <Bar dataKey="USD/MAD (bps)" shape={<DivBar />} fill="#3b82f6" opacity={0.7} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[9px] text-slate-600">
                Dérive = (Fixing {isOfficial ? 'BKAM' : 'ECB'} âˆ’ Parité panier) / Parité panier Ã— 10 000 bps ·
                K=10,49 · Panier 60% EUR / 40% USD · Bande réglementaire ±{BAND_PCT}% (500 bps)
              </p>
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* â”€â”€ Legal â”€â”€ */}
      <p className="text-[9px] text-slate-700 leading-relaxed text-center">
        Les taux présentés sur cette page sont {isOfficial ? 'les cours officiels CoursVirement publiés par Bank Al-Maghrib' : 'des estimations indicatives basées sur les données BCE'}.
        Ils ne constituent pas des prix de transaction. Pour toute opération de change, adressez-vous Ã  un établissement de crédit agréé par Bank Al-Maghrib (Art. 3, LC/BKAM/2018/2).
        JAD2 Advisory â€” non établissement financier (Loi n° 43-12).
      </p>
    </div>
  );
}


