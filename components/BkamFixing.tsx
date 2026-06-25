import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { FixingDayRow, ClientTier, CurrencyInfo } from '../types';
import { BKAM_CURRENCIES } from '../constants';
import { fetchFixingHistory } from '../services/bkamFixing';
import { useAdmin, DEFAULT_TIER_COMMISSIONS } from '../context/AdminContext';
import { useI18n } from '../context/I18nContext';
import {
  RefreshCw, AlertTriangle, Info, TrendingUp, TrendingDown,
  Minus, Database, Users,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const BAND_LIMIT_PCT = 5.0;         // BKAM ±5% fluctuation band (Phase II, March 2020)
const BAND_LIMIT_BPS = 500;         // ±500 bps

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt4(v: number) { return v.toFixed(4); }
function fmtBps(v: number) { return (v >= 0 ? '+' : '') + v.toFixed(1) + ' bps'; }
function fmtPct(v: number) { return (v >= 0 ? '+' : '') + v.toFixed(4) + '%'; }

function divColor(bps: number) {
  const abs = Math.abs(bps);
  if (abs < 50)  return 'text-emerald-400';
  if (abs < 150) return 'text-amber-400';
  return 'text-red-400';
}

function divBg(bps: number) {
  const abs = Math.abs(bps);
  if (abs < 50)  return 'bg-emerald-950/20 border-emerald-800/50';
  if (abs < 150) return 'bg-amber-950/20 border-amber-800/50';
  return 'bg-red-950/20 border-red-800/50';
}

function BandGauge({ bps }: { bps: number }) {
  const pct   = Math.min(Math.max((bps / BAND_LIMIT_BPS) * 50 + 50, 0), 100);
  const color = Math.abs(bps) < 50
    ? '#10b981'
    : Math.abs(bps) < 150
    ? '#f59e0b'
    : '#ef4444';

  return (
    <div className="w-full">
      <div className="relative h-3 bg-navy-700/60 rounded-full overflow-hidden">
        {/* Band limit markers */}
        <div className="absolute left-[12.5%] top-0 h-full w-px bg-red-300 opacity-70" />
        <div className="absolute right-[12.5%] top-0 h-full w-px bg-red-300 opacity-70" />
        {/* Center marker */}
        <div className="absolute left-1/2 top-0 h-full w-px bg-slate-400 opacity-50" />
        {/* Needle */}
        <div
          className="absolute top-0 h-full w-2 -translate-x-1/2 rounded-full shadow transition-all duration-700"
          style={{ left: `${pct}%`, background: color }}
        />
      </div>
      <div className="flex justify-between text-[9px] text-slate-400 mt-0.5 font-mono">
        <span>−{BAND_LIMIT_PCT}%</span>
        <span>Parité Centrale</span>
        <span>+{BAND_LIMIT_PCT}%</span>
      </div>
    </div>
  );
}

// ─── Summary card ─────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, color = 'text-white',
}: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-navy-900 border border-navy-700 rounded-lg p-4">
      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-xl font-bold font-mono ${color}`}>{value}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Divergence custom bar fill ───────────────────────────────────────────────

function DivergenceBar(props: { x?: number; y?: number; width?: number; height?: number; value?: number }) {
  const { x = 0, y = 0, width = 0, height = 0, value = 0 } = props;
  const color = Math.abs(value) < 50
    ? '#10b981'
    : Math.abs(value) < 150
    ? '#f59e0b'
    : '#ef4444';
  return <rect x={x} y={y} width={width} height={height} fill={color} rx={2} />;
}

// ─── Component ────────────────────────────────────────────────────────────────

const TIER_ORDER: ClientTier[] = ['CORPORATE', 'SME', 'TPE', 'INDIVIDUAL'];
const TIER_ACCENT: Record<ClientTier, string> = {
  CORPORATE: 'text-purple-300 bg-purple-900/30 border-purple-700/40',
  SME:       'text-blue-300 bg-blue-900/30 border-blue-700/40',
  TPE:       'text-amber-300 bg-amber-900/30 border-amber-700/40',
  INDIVIDUAL:'text-slate-300 bg-slate-800/30 border-slate-600/40',
};

function getCurrencyName(c: CurrencyInfo, locale: string): string {
  if (locale === 'ar') return c.nameAr;
  if (locale === 'en') return c.name;
  return c.nameFr;
}

export default function BkamFixing() {
  const { config } = useAdmin();
  const { locale, isRTL } = useI18n();
  const [rows,    setRows]    = useState<FixingDayRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const tiers = config.tierCommissions ?? DEFAULT_TIER_COMMISSIONS;

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFixingHistory(5);
      setRows(data);
    } catch {
      setError('Impossible de récupérer les données de fixing.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const latest = rows[rows.length - 1] ?? null;

  // Chart series
  const trendData = rows.map(r => ({
    date:            r.dateLabel,
    'EUR/MAD ECB':   r.eurMad_ecb,
    'EUR/MAD Basket':r.eurMad_basket,
    'USD/MAD ECB':   r.usdMad_ecb,
    'USD/MAD Basket':r.usdMad_basket,
  }));

  const divData = rows.map(r => ({
    date:       r.dateLabel,
    'EUR/MAD':  r.eurMad_div_bps,
    'USD/MAD':  r.usdMad_div_bps,
  }));

  return (
    <div className="space-y-6">

      {/* ── Page header ── */}
      <div className="bg-navy-900 rounded-xl border border-navy-700 overflow-hidden">
        <div className="bg-navy-800/60 px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white tracking-widest uppercase flex items-center gap-2">
                <Database size={18} className="text-gold-400" />
                Fixing Officiel BKAM — Parité MAD
              </h2>
              <p className="text-slate-400 text-sm mt-0.5">
                5 derniers jours ouvrés · Source: ECB/Frankfurter API (proxy BKAM) · Panier 60% EUR / 40% USD — K = 10.49
              </p>
            </div>
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-navy-800 border border-navy-600 hover:border-gold-600 text-slate-300 hover:text-white rounded text-xs font-medium transition disabled:opacity-50"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              Actualiser
            </button>
          </div>
        </div>

        {/* Source notice + official links */}
        <div className="bg-navy-800/40 border-b border-navy-700 px-6 py-3 space-y-2">
          <div className="flex items-start gap-2">
            <Info size={12} className="text-navy-400 mt-0.5 flex-shrink-0" />
            <p className="text-[10px] text-slate-400 leading-relaxed">
              <strong className="text-slate-300">Source des données :</strong> Les taux affichés sont les taux de référence BCE (Frankfurter API) utilisés comme proxy du fixing journalier BKAM. Le taux théorique est calculé via la formule du panier : USD/MAD = K / (0,60 × EUR/USD + 0,40), K = 10,49. Ces données sont indicatives et ne constituent pas les fixings officiels BKAM.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[10px] text-slate-500 font-semibold">Cours officiels BKAM :</span>
            <a
              href="https://www.bkam.ma/en/Markets/Key-indicators/Foreign-exchange-market/Foreign-exchange-rates/Transfer-exchange-rate"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-gold-500 hover:text-gold-400 font-medium"
            >
              ↗ Taux de change Virement (BKAM)
            </a>
            <a
              href="https://www.bkam.ma/en/Markets/Key-indicators/Foreign-exchange-market/Foreign-exchange-rates/Foreign-banknotes-exchange-rate"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-gold-500 hover:text-gold-400 font-medium"
            >
              ↗ Taux de change Billets (BKAM)
            </a>
          </div>
        </div>
      </div>

      {/* ── Loading / error states ── */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw size={28} className="text-gold-500 animate-spin" />
            <p className="text-slate-500 text-sm">Chargement des données de fixing…</p>
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-950/20 border border-red-800/40 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-400">{error}</p>
            <button onClick={load} className="text-xs text-red-400 underline mt-1">Réessayer</button>
          </div>
        </div>
      )}

      {!loading && !error && latest && (
        <>
          {/* ── Latest day summary ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Dernière Séance · {latest.dateLabel}
                {latest.source === 'COMPUTED' && (
                  <span className="ml-2 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">ESTIMÉ</span>
                )}
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatCard
                label="EUR/USD (ECB)"
                value={fmt4(latest.eurUsd)}
                sub="Taux de change pivot"
              />
              <StatCard
                label="EUR/MAD — Marché ECB"
                value={fmt4(latest.eurMad_ecb)}
                sub="Cours de référence ECB"
                color="text-navy-900"
              />
              <StatCard
                label="EUR/MAD — Parité Panier"
                value={fmt4(latest.eurMad_basket)}
                sub="Théorique BKAM"
                color="text-slate-600"
              />
              <StatCard
                label="Divergence EUR/MAD"
                value={fmtBps(latest.eurMad_div_bps)}
                sub={fmtPct(latest.eurMad_div_pct)}
                color={divColor(latest.eurMad_div_bps)}
              />
              <StatCard
                label="USD/MAD — Marché ECB"
                value={fmt4(latest.usdMad_ecb)}
                sub="Cours indicatif USD"
                color="text-navy-900"
              />
              <StatCard
                label="Divergence USD/MAD"
                value={fmtBps(latest.usdMad_div_bps)}
                sub={`Panier: ${fmt4(latest.usdMad_basket)}`}
                color={divColor(latest.usdMad_div_bps)}
              />
            </div>
          </div>

          {/* ── Peg band gauge ── */}
          <div className={`rounded-lg border p-4 ${divBg(latest.eurMad_div_bps)}`}>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div>
                <p className="text-sm font-bold text-white">
                  Position dans la Bande de Fluctuation BKAM (±{BAND_LIMIT_PCT}%)
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Divergence EUR/MAD : <span className={`font-bold ${divColor(latest.eurMad_div_bps)}`}>{fmtBps(latest.eurMad_div_bps)}</span>
                  {' '}· Bande limite : ±{BAND_LIMIT_BPS} bps
                </p>
              </div>
              <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${
                Math.abs(latest.eurMad_div_bps) < 50
                  ? 'bg-emerald-950/30 border-emerald-700 text-emerald-400'
                  : Math.abs(latest.eurMad_div_bps) < 150
                  ? 'bg-amber-950/30 border-amber-700 text-amber-400'
                  : 'bg-red-950/30 border-red-700 text-red-400'
              }`}>
                {Math.abs(latest.eurMad_div_bps) < 50
                  ? <><Minus size={12}/> SERRÉ</>
                  : Math.abs(latest.eurMad_div_bps) < 150
                  ? <><AlertTriangle size={12}/> MODÉRÉ</>
                  : latest.eurMad_div_bps > 0
                  ? <><TrendingUp size={12}/> HAUSSE</>
                  : <><TrendingDown size={12}/> BAISSE</>}
              </div>
            </div>
            <BandGauge bps={latest.eurMad_div_bps} />
          </div>

          {/* ── Charts row ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* EUR/MAD & USD/MAD trend */}
            <div className="bg-navy-900 rounded-xl border border-navy-700 p-5">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
                EUR/MAD — Marché vs Parité Théorique
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trendData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E3E5C" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={v => v.toFixed(3)} width={55} />
                  <Tooltip formatter={(v: number) => v.toFixed(4)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line
                    type="monotone"
                    dataKey="EUR/MAD ECB"
                    stroke="#0F2645"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#0F2645' }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="EUR/MAD Basket"
                    stroke="#D4AF37"
                    strokeWidth={2}
                    strokeDasharray="5 3"
                    dot={{ r: 3, fill: '#D4AF37' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Divergence bar chart */}
            <div className="bg-navy-900 rounded-xl border border-navy-700 p-5">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
                Divergence Marché vs Panier (bps)
              </h3>
              <p className="text-[10px] text-slate-400 mb-4">
                Vert &lt; 50 bps · Amber 50–150 · Rouge &gt; 150 · Bande BKAM ±{BAND_LIMIT_BPS} bps
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={divData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E3E5C" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis
                    domain={[-BAND_LIMIT_BPS, BAND_LIMIT_BPS]}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickFormatter={v => `${v}`}
                    width={40}
                  />
                  <Tooltip formatter={(v: number) => fmtBps(v)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <ReferenceLine y={0}   stroke="#94a3b8" strokeWidth={1} />
                  <ReferenceLine y={BAND_LIMIT_BPS}  stroke="#ef4444" strokeDasharray="4 3" strokeWidth={1} label={{ value: '+250', fontSize: 9, fill: '#ef4444' }} />
                  <ReferenceLine y={-BAND_LIMIT_BPS} stroke="#ef4444" strokeDasharray="4 3" strokeWidth={1} label={{ value: '−250', fontSize: 9, fill: '#ef4444' }} />
                  <Bar dataKey="EUR/MAD" shape={<DivergenceBar />} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── 5-day history table ── */}
          <div className="bg-navy-900 rounded-xl border border-navy-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-navy-700 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Historique — 5 Jours Ouvrés
              </h3>
              <span className="text-[10px] text-slate-400">Source: ECB via api.frankfurter.app</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-sm">
                <thead>
                  <tr className="bg-navy-800/60 border-b border-navy-700 text-[10px] uppercase tracking-wider text-slate-400">
                    <th className="text-left px-5 py-3 font-semibold">Date</th>
                    <th className="text-right px-4 py-3 font-semibold">EUR/USD</th>
                    <th className="text-right px-4 py-3 font-semibold">EUR/MAD ECB</th>
                    <th className="text-right px-4 py-3 font-semibold">EUR/MAD Panier</th>
                    <th className="text-right px-4 py-3 font-semibold">Div. EUR (bps)</th>
                    <th className="text-right px-4 py-3 font-semibold">USD/MAD ECB</th>
                    <th className="text-right px-4 py-3 font-semibold">USD/MAD Panier</th>
                    <th className="text-right px-5 py-3 font-semibold">Div. USD (bps)</th>
                  </tr>
                </thead>
                <tbody>
                  {[...rows].reverse().map(r => (
                    <React.Fragment key={r.date}>
                      <tr className="border-b border-navy-800/40 hover:bg-navy-800/40 transition-colors">
                        <td className="px-5 py-3">
                          <div className="font-semibold text-white">{r.dateLabel}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{r.date}</div>
                        </td>
                        <td className="text-right px-4 py-3 font-mono text-slate-400">{fmt4(r.eurUsd)}</td>
                        <td className="text-right px-4 py-3 font-mono font-bold text-white">{fmt4(r.eurMad_ecb)}</td>
                        <td className="text-right px-4 py-3 font-mono text-slate-500">{fmt4(r.eurMad_basket)}</td>
                        <td className={`text-right px-4 py-3 font-mono font-bold ${divColor(r.eurMad_div_bps)}`}>
                          {fmtBps(r.eurMad_div_bps)}
                        </td>
                        <td className="text-right px-4 py-3 font-mono font-bold text-white">{fmt4(r.usdMad_ecb)}</td>
                        <td className="text-right px-4 py-3 font-mono text-slate-500">{fmt4(r.usdMad_basket)}</td>
                        <td className={`text-right px-5 py-3 font-mono font-bold ${divColor(r.usdMad_div_bps)}`}>
                          {fmtBps(r.usdMad_div_bps)}
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── OC Commission info ── */}
          <div className="bg-navy-900 rounded-xl border border-navy-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-navy-700">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Commission Office des Changes — Taux Client Indicatifs
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Les cours BKAM sont des taux interbancaires. Les cours facturés aux clients incluent la commission OC et le spread de l'intermédiaire agréé.
              </p>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    type: 'Virement (Transfer)',
                    href: 'https://www.bkam.ma/en/Markets/Key-indicators/Foreign-exchange-market/Foreign-exchange-rates/Transfer-exchange-rate',
                    commission: '2 ‰ – 5 ‰',
                    commissionNote: 'Commission autorisée OC sur virements internationaux',
                    spread: '0,8% de chaque côté',
                    spreadNote: 'Spread indicatif intermédiaire agréé',
                    totalRoundTrip: '~1,6% – 2,6%',
                    color: 'border-navy-600 bg-navy-800/50',
                  },
                  {
                    type: 'Billets (Banknotes)',
                    href: 'https://www.bkam.ma/en/Markets/Key-indicators/Foreign-exchange-market/Foreign-exchange-rates/Foreign-banknotes-exchange-rate',
                    commission: '5 ‰ – 10 ‰',
                    commissionNote: 'Commission autorisée OC sur billets de banque',
                    spread: '1,8% de chaque côté',
                    spreadNote: 'Spread indicatif billets de banque',
                    totalRoundTrip: '~4,6% – 5,6%',
                    color: 'border-amber-800/40 bg-amber-900/10',
                  },
                ].map(item => (
                  <div key={item.type} className={`border rounded-lg p-4 ${item.color}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-white text-sm">{item.type}</h4>
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-gold-500 hover:text-gold-400"
                      >
                        Cours officiel BKAM ↗
                      </a>
                    </div>
                    <div className="space-y-2 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Fixing BKAM (ECB proxy)</span>
                        <span className="font-mono font-bold text-white">
                          {latest ? fmt4(latest.eurMad_ecb) : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">+ Commission OC</span>
                        <span className="font-mono text-slate-300">{item.commission}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">+ Spread intermédiaire</span>
                        <span className="font-mono text-slate-300">{item.spread}</span>
                      </div>
                      <div className="border-t border-navy-700 pt-2 flex justify-between font-bold">
                        <span className="text-white">Total Round-Trip (indicatif)</span>
                        <span className="font-mono text-white">{item.totalRoundTrip}</span>
                      </div>
                    </div>
                    <p className="text-[9px] text-slate-500 mt-2">{item.commissionNote} · {item.spreadNote}</p>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 italic">
                ⚠️ La commission OC est encadrée par la réglementation de l'Office des Changes. Les taux effectivement facturés par les intermédiaires agréés (banques, bureaux de change) peuvent varier dans les limites autorisées par l'OC. Pour connaître les taux en vigueur, consultez votre banque ou{' '}
                <a href="https://www.jad2advisory.com" target="_blank" rel="noopener noreferrer" className="text-gold-600 underline font-bold">JAD2 Advisory</a>.
              </p>
            </div>
          </div>

          {/* ── Full 14-currency table for latest day ── */}
          <div className="bg-navy-900 rounded-xl border border-navy-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-navy-700">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {locale === 'ar' ? `${BKAM_CURRENCIES.length} عملة BKAM — ${latest.dateLabel}` : locale === 'en' ? `${BKAM_CURRENCIES.length} BKAM Currencies — ${latest.dateLabel}` : `Les ${BKAM_CURRENCIES.length} Devises BKAM — ${latest.dateLabel}`}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {locale === 'ar' ? 'أسعار MAD الاسترشادية · محسوبة عبر أسعار BCR المرجعية + تعادل السلة · وحدات BKAM مطبقة' : locale === 'en' ? 'Indicative MAD rates per currency · Computed via ECB reference rates + basket parity · BKAM units applied' : 'Cours MAD indicatifs par devise · Calculés via taux ECB de référence + parité panier · Unités BKAM appliquées'}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] text-sm">
                <thead>
                  <tr className="bg-navy-800/60 border-b border-navy-700 text-[10px] uppercase tracking-wider text-slate-400">
                    <th className="text-left px-5 py-2.5 font-semibold">Devise</th>
                    <th className="text-left px-4 py-2.5 font-semibold">{locale === 'ar' ? 'الاسم' : locale === 'en' ? 'Name' : 'Nom'}</th>
                    <th className="text-right px-4 py-2.5 font-semibold">Unité</th>
                    <th className="text-right px-5 py-2.5 font-semibold">Cours MAD (indicatif)</th>
                  </tr>
                </thead>
                <tbody>
                  {BKAM_CURRENCIES.map(c => {
                    const rate = latest.allRates[c.code];
                    const isGulf = ['SAR', 'AED', 'KWD', 'QAR'].includes(c.code);
                    return (
                      <React.Fragment key={c.code}>
                        <tr className="border-b border-navy-800/40 hover:bg-navy-800/40 transition-colors">
                          <td className="px-5 py-2.5">
                            <div className="flex items-center gap-2">
                              <span className="text-base">{c.flag}</span>
                              <span className="font-mono font-bold text-white">{c.code}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-slate-400">{getCurrencyName(c, locale)}</td>
                          <td className="text-right px-4 py-2.5 font-mono text-slate-500 text-xs">
                            {c.bkamUnit === 100 ? '100 ' + c.code : '1 ' + c.code}
                          </td>
                          <td className="text-right px-5 py-2.5">
                            <span className="font-mono font-bold text-white text-base">
                              {rate !== undefined ? fmt4(rate) : '—'}
                            </span>
                            <span className="text-[10px] text-slate-500 ml-1">MAD</span>
                            {isGulf && (
                              <span className="ml-2 text-[9px] bg-amber-900/20 text-amber-400 border border-amber-800/40 px-1 rounded">peg USD</span>
                            )}
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Tiered pricing grid ── */}
          {latest && (
            <div className="bg-navy-900 rounded-xl border border-navy-700 overflow-hidden">
              <div className="px-5 py-4 border-b border-navy-700 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Users size={14} className="text-gold-500" />
                    Grille Tarifaire Indicative par Segment Client — EUR/MAD
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Commissions commerciales configurables dans Admin → Onglet Pricing · Cours indicatifs uniquement
                  </p>
                </div>
                <a
                  href="https://www.bkam.ma/en/Markets/Key-indicators/Foreign-exchange-market/Foreign-exchange-rates/Transfer-exchange-rate"
                  target="_blank" rel="noopener noreferrer"
                  className="text-[10px] text-gold-500 hover:text-gold-400 whitespace-nowrap"
                >
                  Cours officiels BKAM ↗
                </a>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-sm">
                  <thead>
                    <tr className="bg-navy-800/60 border-b border-navy-700 text-[10px] uppercase tracking-wider text-slate-400">
                      <th className="text-left px-5 py-3 font-semibold">Segment</th>
                      <th className="text-right px-4 py-3 font-semibold">Comm. Virement</th>
                      <th className="text-right px-4 py-3 font-semibold">EUR/MAD Achat (Virement)</th>
                      <th className="text-right px-4 py-3 font-semibold">EUR/MAD Vente (Virement)</th>
                      <th className="text-right px-4 py-3 font-semibold">Comm. Billet</th>
                      <th className="text-right px-5 py-3 font-semibold">EUR/MAD Vente (Billet)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TIER_ORDER.map(tier => {
                      const t = tiers[tier];
                      const base = latest.eurMad_ecb;
                      const virTotal = config.virementSpreadPct + t.virementCommBps / 10000;
                      const bilTotal = config.billetSpreadPct   + t.billetCommBps   / 10000;
                      const virBuy  = base * (1 - virTotal);
                      const virSell = base * (1 + virTotal);
                      const bilSell = base * (1 + bilTotal);
                      return (
                        <React.Fragment key={tier}>
                          <tr className="border-b border-navy-800/40 hover:bg-navy-800/40 transition-colors">
                            <td className="px-5 py-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${TIER_ACCENT[tier]}`}>
                                {t.label}
                              </span>
                              <p className="text-[10px] text-slate-500 mt-0.5">{t.description}</p>
                            </td>
                            <td className="text-right px-4 py-3 font-mono text-slate-500 text-xs">
                              +{t.virementCommBps} bps
                            </td>
                            <td className="text-right px-4 py-3 font-mono font-bold text-emerald-400">
                              {virBuy.toFixed(4)}
                            </td>
                            <td className="text-right px-4 py-3 font-mono font-bold text-red-400">
                              {virSell.toFixed(4)}
                            </td>
                            <td className="text-right px-4 py-3 font-mono text-slate-500 text-xs">
                              +{t.billetCommBps} bps
                            </td>
                            <td className="text-right px-5 py-3 font-mono font-bold text-red-400">
                              {bilSell.toFixed(4)}
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 bg-navy-800/40 border-t border-navy-700">
                <p className="text-[10px] text-slate-400">
                  Base BKAM fixing: <span className="font-mono font-bold text-white">{latest.eurMad_ecb.toFixed(4)}</span> EUR/MAD ·
                  Spread virement de base: <span className="font-mono">{(config.virementSpreadPct * 100).toFixed(2)}%</span> ·
                  Spread billet de base: <span className="font-mono">{(config.billetSpreadPct * 100).toFixed(2)}%</span> ·
                  Commissions configurables par Admin · <a href="https://www.jad2advisory.com" target="_blank" rel="noopener noreferrer" className="text-gold-500 hover:text-gold-400 font-bold">Conseil FX → JAD2 Advisory</a>
                </p>
              </div>
            </div>
          )}

          {/* ── Legal footer ── */}
          <div className="border-t border-navy-700 pt-4 space-y-1">
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Données indicatives calculées à partir des références ECB/Frankfurter. Les fixings officiels Bank Al-Maghrib sont publiés quotidiennement sur{' '}
              <a href="https://www.bkam.ma" target="_blank" rel="noopener noreferrer" className="text-gold-500 hover:text-gold-400 font-medium">www.bkam.ma</a>.
              Les divergences affichées sont calculées par rapport à la parité théorique du panier (K = 10,49).
            </p>
            <p className="text-[10px] text-slate-500">
              Source : ECB / Frankfurter API · Parités USD fixes Gulf · Pour conseil professionnel : <a href="https://jad2advisory.com" target="_blank" rel="noopener noreferrer" className="text-gold-500 hover:text-gold-400">jad2advisory.com</a>
            </p>
          </div>
        </>
      )}
    </div>
  );
}
