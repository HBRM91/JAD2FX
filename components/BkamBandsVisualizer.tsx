/**
 * BkamBandsVisualizer â€” "The Cage & The Bird"
 *
 * Visualises the BKAM Â±5% intervention band for EUR/MAD and USD/MAD.
 * The "cage"  = the Â±5% band around the basket central parity (K = 10.49).
 * The "bird"  = today's live fixing / mid-rate.
 *
 * Basket formula:  USD/MAD_central = K / (w_EUR Ã— EUR/USD + w_USD)
 *                  EUR/MAD_central = USD/MAD_central Ã— EUR/USD
 *
 * BKAM widened the band in two phases:
 *   Jan 2018 â†’ Â±2.5%   (Phase I, controlled float)
 *   Mar 2020 â†’ Â±5%     (Phase II, enlarged float â€” current regime)
 *
 * A NARROWING drift (bird near the floor) signals MAD strength vs basket.
 * A WIDENING drift (bird near the ceiling) signals MAD weakness vs basket.
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Area, ComposedChart,
} from 'recharts';
import { AlertTriangle, TrendingUp, TrendingDown, Minus, RefreshCw, Info, Printer } from 'lucide-react';
import { DEFAULT_BASKET_CONFIG } from '../constants';
import { BKAM_LINKS } from '../constants/bkamLinks';
import { useAdmin } from '../context/AdminContext';
import FixingCalendar from './FixingCalendar';
import ProvenanceChip from './ProvenanceChip';
import { computeDriftModel, DriftRegression, DriftPoint } from '../services/driftModel';
import { fetchDriftHistory, fetchBandConfig, driftStats, DriftHistoryPoint, BandAlert } from '../services/driftHistory';
import CurrencyFlag from './CurrencyFlag';

// â”€â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const K     = DEFAULT_BASKET_CONFIG.referenceBasketValue;
const EUR_W = DEFAULT_BASKET_CONFIG.eurWeight;
const USD_W = DEFAULT_BASKET_CONFIG.usdWeight;
const BAND  = 0.05;   // Â±5% current regime
const PHASE1_BAND = 0.025; // Â±2.5% phase I reference

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface BandState {
  spot: number;
  central: number;
  upper: number;
  lower: number;
  phase1Upper: number;
  phase1Lower: number;
  utilPct: number;        // 0â€“100%, 50 = at central parity
  distToCeilingBps: number;
  distToFloorBps: number;
  distToCeilingPct: number;
  distToFloorPct: number;
  zone: 'SAFE' | 'CAUTION' | 'DANGER';
}

function calcBand(spot: number, central: number): BandState {
  const upper       = central * (1 + BAND);
  const lower       = central * (1 - BAND);
  const phase1Upper = central * (1 + PHASE1_BAND);
  const phase1Lower = central * (1 - PHASE1_BAND);
  const utilPct     = ((spot - lower) / (upper - lower)) * 100;
  const distCeil    = upper - spot;
  const distFloor   = spot - lower;
  const distToCeilingBps = Math.round((distCeil / spot) * 10000);
  const distToFloorBps   = Math.round((distFloor / spot) * 10000);
  const distToCeilingPct = +((distCeil / central) * 100).toFixed(2);
  const distToFloorPct   = +((distFloor / central) * 100).toFixed(2);
  const fromCenter  = Math.abs(utilPct - 50) / 50;
  const zone = fromCenter < 0.60 ? 'SAFE' : fromCenter < 0.85 ? 'CAUTION' : 'DANGER';
  return { spot, central, upper, lower, phase1Upper, phase1Lower, utilPct, distToCeilingBps, distToFloorBps, distToCeilingPct, distToFloorPct, zone };
}

// â”€â”€â”€ Sub: Horizontal Gauge â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function BandGauge({ data, pair, countryCode }: { data: BandState; pair: string; countryCode: string }) {
  const pct = Math.max(1, Math.min(99, data.utilPct));

  // Zone colour for the bird marker
  const birdColor = data.zone === 'SAFE' ? '#10b981' : data.zone === 'CAUTION' ? '#f59e0b' : '#ef4444';

  // Phase I inner band positions
  const phase1LoPct = ((data.phase1Lower - data.lower) / (data.upper - data.lower)) * 100;
  const phase1HiPct = ((data.phase1Upper - data.lower) / (data.upper - data.lower)) * 100;

  const ZoneIcon = data.zone === 'SAFE' ? Minus : data.zone === 'CAUTION' ? TrendingUp : AlertTriangle;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CurrencyFlag countryCode={countryCode} size="lg" />
          <div>
            <p className="text-[13px] font-bold text-white font-mono">{pair}</p>
            <p className="text-[10px] text-navy-500 uppercase tracking-wider">
              Panier {countryCode === 'eu' ? '60% EUR' : '40% USD'} Â· BKAM Phase II Â±5%
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-mono font-bold text-gold-400">{data.spot.toFixed(4)}</p>
          <div className={`flex items-center gap-1 justify-end text-[10px] font-bold ${
            data.zone === 'SAFE' ? 'text-emerald-400' : data.zone === 'CAUTION' ? 'text-amber-400' : 'text-red-400'
          }`}>
            <ZoneIcon size={10} />
            {data.zone === 'SAFE' ? 'ZONE NEUTRE' : data.zone === 'CAUTION' ? 'APPROCHE LIMITE' : 'PROXIMITÃ‰ BANDE'}
          </div>
        </div>
      </div>

      {/* Gauge track */}
      <div className="relative h-12 rounded-lg overflow-visible bg-navy-800 border border-navy-700">
        {/* Full gradient background: red â†’ amber â†’ green â†’ amber â†’ red */}
        <div className="absolute inset-0 rounded-lg overflow-hidden">
          <div className="h-full w-full" style={{
            background: 'linear-gradient(to right, #ef4444 0%, #f59e0b 10%, #10b981 30%, #10b981 70%, #f59e0b 90%, #ef4444 100%)',
            opacity: 0.18,
          }} />
        </div>

        {/* Phase I inner band markers (dashed vertical lines) */}
        <div className="absolute top-0 bottom-0 border-l border-dashed border-blue-400/40" style={{ left: `${phase1LoPct}%` }} />
        <div className="absolute top-0 bottom-0 border-l border-dashed border-blue-400/40" style={{ left: `${phase1HiPct}%` }} />

        {/* Central parity line */}
        <div className="absolute top-0 bottom-0 border-l-2 border-gold-500/60 z-10" style={{ left: '50%' }}>
          <div className="absolute -top-1 -translate-x-1/2 w-1 h-2 bg-gold-500 rounded-sm" />
          <div className="absolute -bottom-0 -translate-x-1/2 text-[8px] text-gold-500 font-bold whitespace-nowrap font-mono">
            K={data.central.toFixed(4)}
          </div>
        </div>

        {/* The Bird â€” current rate indicator */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 transition-all duration-700"
          style={{ left: `${pct}%` }}
        >
          <div
            className="w-4 h-10 rounded-sm flex items-center justify-center shadow-lg"
            style={{ backgroundColor: birdColor, boxShadow: `0 0 8px ${birdColor}60` }}
          >
            <span className="text-[14px] select-none" title="Position actuelle">ðŸ¦</span>
          </div>
        </div>
      </div>

      {/* Labels under gauge */}
      <div className="flex justify-between text-[9px] text-navy-500 font-mono px-0.5">
        <div className="text-left">
          <p className="font-bold text-red-400">{data.lower.toFixed(4)}</p>
          <p>PLANCHER âˆ’5%</p>
        </div>
        <div className="text-center">
          <p className="text-[8px] text-blue-400/70">Â±2.5% Phase I</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-red-400">{data.upper.toFixed(4)}</p>
          <p>PLAFOND +5%</p>
        </div>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: 'Utilisation', value: `${(Math.abs(data.utilPct - 50) * 2).toFixed(1)}%`, sub: 'de la bande', color: birdColor },
          { label: 'Dist. Plafond', value: `${data.distToCeilingBps} pb`, sub: `${data.distToCeilingPct}%`, color: data.utilPct > 70 ? '#f59e0b' : '#94a3b8' },
          { label: 'Dist. Plancher', value: `${data.distToFloorBps} pb`, sub: `${data.distToFloorPct}%`, color: data.utilPct < 30 ? '#f59e0b' : '#94a3b8' },
          { label: 'Position', value: `${data.utilPct > 50 ? '+' : ''}${(data.spot - data.central).toFixed(4)}`, sub: 'vs paritÃ©', color: data.utilPct > 50 ? '#f59e0b' : '#10b981' },
        ].map(m => (
          <div key={m.label} className="bg-navy-900 border border-navy-800 rounded px-2 py-1.5 text-center">
            <p className="text-[9px] text-navy-500 uppercase tracking-wider">{m.label}</p>
            <p className="text-[13px] font-mono font-bold" style={{ color: m.color }}>{m.value}</p>
            <p className="text-[9px] text-navy-600">{m.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// â”€â”€â”€ Sub: Drift Chart â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function DriftChart({ drift, loading }: { drift: DriftRegression | null; loading: boolean }) {
  if (loading) {
    return (
      <div className="h-40 flex items-center justify-center gap-2 text-navy-500 text-sm">
        <RefreshCw size={14} className="animate-spin" />
        <span>Chargement dÃ©rive BKAMâ€¦</span>
      </div>
    );
  }
  if (!drift || drift.points.length < 2) {
    return (
      <div className="h-40 flex items-center justify-center text-navy-600 text-sm">
        DonnÃ©es de dÃ©rive non disponibles â€” vÃ©rifiez la connexion proxy.
      </div>
    );
  }

  const TrendIcon = drift.trendDir === 'WIDENING' ? TrendingUp : drift.trendDir === 'NARROWING' ? TrendingDown : Minus;
  const trendColor = drift.trendDir === 'WIDENING' ? '#f59e0b' : drift.trendDir === 'NARROWING' ? '#10b981' : '#94a3b8';

  const chartData = drift.points.map((p, i) => ({
    label: p.dateLabel,
    drift: +p.driftBps.toFixed(1),
    trend: +(drift.alpha + drift.beta * i).toFixed(1),
  }));

  return (
    <div className="space-y-3">
      {/* Drift header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold text-white uppercase tracking-wider">
            DÃ©rive BKAM vs ParitÃ© Panier Â· {drift.points.length}j
          </p>
          <p className="text-[10px] text-navy-500">
            (Fixing officiel âˆ’ paritÃ© thÃ©orique) en points de base Â· Positif = MAD faible vs panier
          </p>
        </div>
        <div className="flex items-center gap-2 bg-navy-900 border border-navy-800 rounded px-3 py-1.5">
          <TrendIcon size={12} style={{ color: trendColor }} />
          <div className="text-right">
            <p className="text-[10px] font-bold" style={{ color: trendColor }}>
              {drift.trendDir === 'WIDENING' ? 'Ã‰LARGISSEMENT' : drift.trendDir === 'NARROWING' ? 'RESSERREMENT' : 'STABLE'}
            </p>
            <p className="text-[9px] text-navy-500">
              Î² = {drift.beta >= 0 ? '+' : ''}{drift.beta.toFixed(1)} pb/j Â· RÂ²={drift.r2.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1C3558" />
            <XAxis dataKey="label" tick={{ fill: '#3D6491', fontSize: 9 }} />
            <YAxis tick={{ fill: '#3D6491', fontSize: 9 }} unit=" pb" width={48} />
            <Tooltip
              contentStyle={{ background: '#0A1628', border: '1px solid #1C3558', borderRadius: 6, fontSize: 11 }}
              formatter={((v: number, name: string) => [`${v} pb`, name === 'drift' ? 'DÃ©rive rÃ©elle' : 'Tendance OLS']) as any}
            />
            <ReferenceLine y={0} stroke="#D4AF37" strokeWidth={1} strokeDasharray="4 2" />
            <Area dataKey="drift" fill="#D4AF37" fillOpacity={0.1} stroke="#D4AF37" strokeWidth={1.5} dot={{ r: 3, fill: '#D4AF37' }} name="drift" />
            <Line dataKey="trend" stroke="#ef4444" strokeWidth={1} strokeDasharray="5 3" dot={false} name="trend" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Key stats â€” 6-cell grid (2 rows Ã— 3) */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
        {[
          { label: 'DÃ©rive actuelle', value: `${drift.latestDriftBps >= 0 ? '+' : ''}${drift.latestDriftBps.toFixed(0)} pb`, color: Math.abs(drift.latestDriftBps) > 20 ? '#f59e0b' : '#94a3b8', title: 'DÃ©rive = fixing BKAM âˆ’ paritÃ© panier (ECB EUR/USD exogÃ¨ne). Non-circulaire.' },
          { label: 'Pente OLS Î²', value: `${drift.beta >= 0 ? '+' : ''}${drift.beta.toFixed(1)} pb/j`, color: trendColor, title: 'Pente de la rÃ©gression OLS sur les N derniers jours. Positif = creusement de la dÃ©rive.' },
          { label: 'RÂ²', value: drift.r2.toFixed(2), color: drift.r2 > 0.7 ? '#10b981' : '#94a3b8', title: 'Coefficient de dÃ©termination du modÃ¨le OLS.' },
          { label: 'Util. bande', value: `${drift.bandUtilLatest.toFixed(0)}%`, color: drift.bandUtilLatest > 65 || drift.bandUtilLatest < 35 ? '#f59e0b' : '#10b981', title: 'Utilisation actuelle de la bande Â±5% BKAM. 50% = paritÃ© centrale.' },
          { label: 'Util. moy.', value: `${drift.bandUtilAvg.toFixed(0)}%`, color: '#94a3b8', title: 'Utilisation moyenne de la bande sur la pÃ©riode.' },
          { label: 'Source', value: drift.dataSource === 'BKAM_OFFICIAL' ? 'âœ“ BKAM' : drift.dataSource === 'ECB_PROXY' ? 'ECB' : 'MIXTE', color: drift.dataSource === 'BKAM_OFFICIAL' ? '#10b981' : '#f59e0b', title: drift.dataSource === 'BKAM_OFFICIAL' ? 'Fixing interb. pondÃ©rÃ© (Doc 1 Â§I.1.a)' : 'Proxy ECB/Frankfurter.' },
        ].map(m => (
          <div key={m.label} className="bg-navy-900 border border-navy-800 rounded px-2 py-1.5" title={m.title}>
            <p className="text-[9px] text-navy-500 uppercase tracking-wider">{m.label}</p>
            <p className="text-[12px] font-mono font-bold" style={{ color: m.color }}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Method footnote per BKAM Doc 1 */}
      <p className="text-[8px] text-navy-700 font-mono leading-relaxed">
        DÃ©rive = (USD/MAD_BKAM âˆ’ USD/MAD_basket) / USD/MAD_basket Ã— 10 000 pb Â·
        Basket = K / (w_EUR Ã— EUR/USD_ECB + w_USD), K=10.49 Â·
        Source: Doc 1 Â§I mÃ©thode principale (transactions &gt;12M USD, &gt;6 opÃ©rations, &gt;6 TM) ou mÃ©thode de substitution (cotations fermes 5 min)
      </p>
    </div>
  );
}

// â”€â”€â”€ Historical drift chart â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type HistDays = 30 | 60 | 90 | 180;

function HistoricalDriftChart({ corsProxyUrl }: { corsProxyUrl: string }) {
  const [days, setDays]             = useState<HistDays>(30);
  const [data, setData]             = useState<DriftHistoryPoint[]>([]);
  const [bandPct, setBandPct]       = useState(BAND);
  const [alert, setAlert]           = useState<BandAlert | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(false);

  useEffect(() => {
    setLoading(true); setError(false);
    fetchDriftHistory(corsProxyUrl, days)
      .then(res => { setData(res.points); setBandPct(res.bandPct); setAlert(res.alert); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [corsProxyUrl, days]);

  const stats = useMemo(() => driftStats(data), [data]);

  if (loading) return (
    <div className="h-48 flex items-center justify-center gap-2 text-navy-500 text-xs">
      <RefreshCw size={13} className="animate-spin" /> Chargement historiqueâ€¦
    </div>
  );
  if (error || !data.length) return (
    <div className="h-48 flex items-center justify-center text-navy-600 text-xs text-center px-4">
      {error
        ? 'Historique non disponible â€” le proxy doit Ãªtre configurÃ© et le cron doit avoir tournÃ© au moins une fois.'
        : `Aucun point d'historique pour les ${days} derniers jours. L'historique s'accumule au fil des jours ouvrÃ©s.`}
    </div>
  );

  const chartData = data.map(p => ({
    label:   p.date.slice(5),          // MM-DD
    date:    p.date,
    drift:   +p.driftBps.toFixed(1),
    util:    +p.bandUtilPct.toFixed(1),
    actual:  p.actualUsdMad,
    basket:  p.basketUsdMad,
  }));

  const maxAbsDrift = Math.max(Math.abs(stats?.min ?? 0), Math.abs(stats?.max ?? 0), 20);
  const yDomain: [number, number] = [-Math.ceil(maxAbsDrift * 1.15), Math.ceil(maxAbsDrift * 1.15)];
  // Alert thresholds in bps: Â±5% band â‰ˆ Â±500 bps max; show Â±100 bps caution lines
  const cautionBps = 100;

  return (
    <div className="space-y-4">
      {/* Header + days selector */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-[11px] font-bold text-white uppercase tracking-wider">
            Historique de DÃ©rive â€” {data.length} jours ouvrÃ©s
          </p>
          <p className="text-[9px] text-navy-500">
            Fixing BKAM officiel âˆ’ paritÃ© panier thÃ©orique (EUR/USD ECB Ã  l'heure du fixing)
          </p>
        </div>
        <div className="flex gap-1">
          {([30, 60, 90, 180] as HistDays[]).map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`text-[9px] font-mono px-2 py-0.5 rounded border transition ${
                days === d
                  ? 'bg-gold-500 text-navy-950 border-gold-500 font-bold'
                  : 'border-navy-700 text-navy-400 hover:border-navy-600 hover:text-slate-300'
              }`}
            >
              {d}j
            </button>
          ))}
        </div>
      </div>

      {/* Band alert */}
      {alert && (
        <div className={`flex items-start gap-2 px-3 py-2 rounded-lg border text-xs ${
          alert.severity === 'HIGH'
            ? 'bg-red-950/30 border-red-700/50 text-red-300'
            : 'bg-amber-950/30 border-amber-700/50 text-amber-300'
        }`}>
          <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-[10px]">
              âš ï¸ Alerte bande ({alert.severity}) â€” {new Date(alert.detectedAt).toLocaleDateString('fr-MA')}
            </p>
            <p className="text-[10px] opacity-90 leading-relaxed">{alert.message}</p>
          </div>
        </div>
      )}

      {/* Chart â€” drift bps over time */}
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1C3558" />
            <XAxis
              dataKey="label"
              tick={{ fill: '#3D6491', fontSize: 8 }}
              interval={Math.ceil(chartData.length / 8) - 1}
            />
            <YAxis tick={{ fill: '#3D6491', fontSize: 8 }} unit=" pb" width={48} domain={yDomain} />
            <Tooltip
              contentStyle={{ background: '#0A1628', border: '1px solid #1C3558', borderRadius: 6, fontSize: 10 }}
              formatter={((v: number, name: string) => [
                name === 'drift' ? `${v} pb` : name === 'util' ? `${v}%` : v.toFixed(4),
                name === 'drift' ? 'DÃ©rive (pb)' : name === 'util' ? 'Util. bande %' : name,
              ]) as any}
              labelFormatter={((l: string, payload: any) => payload?.[0]?.payload?.date ?? l) as any}
            />
            {/* Zero line = at basket parity */}
            <ReferenceLine y={0} stroke="#D4AF37" strokeWidth={1} strokeDasharray="4 2" label={{ value: 'ParitÃ©', fill: '#8a6a20', fontSize: 8 }} />
            {/* Caution lines */}
            <ReferenceLine y={cautionBps}  stroke="#f59e0b" strokeWidth={0.5} strokeDasharray="3 3" />
            <ReferenceLine y={-cautionBps} stroke="#10b981" strokeWidth={0.5} strokeDasharray="3 3" />
            <Area
              dataKey="drift"
              fill="#D4AF37"
              fillOpacity={0.12}
              stroke="#D4AF37"
              strokeWidth={1.5}
              dot={{ r: 2, fill: '#D4AF37' }}
              name="drift"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Rolling statistics */}
      {stats && (
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 text-center">
          {[
            { label: 'Moy.', value: `${stats.mean >= 0 ? '+' : ''}${stats.mean.toFixed(0)}pb`, color: Math.abs(stats.mean) < 20 ? '#10b981' : '#f59e0b' },
            { label: 'Ã‰cart-type', value: `${stats.stdDev.toFixed(0)}pb`, color: '#94a3b8' },
            { label: 'Min', value: `${stats.min.toFixed(0)}pb`, color: '#10b981' },
            { label: 'Max', value: `${stats.max.toFixed(0)}pb`, color: '#f59e0b' },
            { label: 'Util. moy.', value: `${stats.avgBandUtil}%`, color: stats.avgBandUtil > 65 || stats.avgBandUtil < 35 ? '#f59e0b' : '#10b981' },
            { label: 'â†‘ MADâˆ’', value: `${stats.positiveCount}j`, color: '#f59e0b', title: 'Jours MAD plus faible que panier' },
            { label: 'â†“ MAD+', value: `${stats.negativeCount}j`, color: '#10b981', title: 'Jours MAD plus fort que panier' },
          ].map(m => (
            <div key={m.label} className="bg-navy-900 border border-navy-800 rounded px-1.5 py-1" title={m.title}>
              <p className="text-[8px] text-navy-500 uppercase tracking-wider leading-tight">{m.label}</p>
              <p className="text-[11px] font-mono font-bold" style={{ color: m.color }}>{m.value}</p>
            </div>
          ))}
        </div>
      )}

      <p className="text-[8px] text-navy-700 font-mono">
        Bande assumÃ©e: Â±{(bandPct * 100).toFixed(1)}% Â· MÃ©thodologie: K/(w_EURÃ—EUR/USD_ECB+w_USD), K=10.49
        Â· Les donnÃ©es s'accumulent quotidiennement via le cron BKAM Ã  09h00 Casablanca
      </p>
    </div>
  );
}

// â”€â”€â”€ Main component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function BkamBandsVisualizer({ compact = false }: { compact?: boolean }) {
  const { config, livePrices } = useAdmin();
  const [drift, setDrift]     = useState<DriftRegression | null>(null);
  const [driftLoading, setDriftLoading] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // Get EUR/MAD and USD/MAD from live prices or overrides
  const eurEntry = livePrices.find(p => p.currency === 'EUR');
  const usdEntry = livePrices.find(p => p.currency === 'USD');
  const eurSpot  = config.spotOverrides['EUR'] ?? eurEntry?.mid ?? 0;
  const usdSpot  = config.spotOverrides['USD'] ?? usdEntry?.mid ?? 0;

  // Compute EUR/USD for basket central parity
  const eurUsd = usdSpot > 0 && eurSpot > 0 ? eurSpot / usdSpot : 1.085;

  // Theoretical basket central parities
  const usdCentral = K / (EUR_W * eurUsd + USD_W);
  const eurCentral = usdCentral * eurUsd;

  const eurBand = useMemo(() => eurSpot > 0 ? calcBand(eurSpot, eurCentral) : null, [eurSpot, eurCentral]);
  const usdBand = useMemo(() => usdSpot > 0 ? calcBand(usdSpot, usdCentral) : null, [usdSpot, usdCentral]);

  // Fetch drift model
  useEffect(() => {
    if (!config.corsProxyUrl) return;
    setDriftLoading(true);
    computeDriftModel(7, config.corsProxyUrl)
      .then(setDrift)
      .catch(() => setDrift(null))
      .finally(() => setDriftLoading(false));
  }, [config.corsProxyUrl]);

  const hasRates = eurSpot > 0 && usdSpot > 0;

  return (
    <div className="bg-navy-900 border border-navy-800 rounded-xl overflow-hidden">
      {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="px-5 py-3 border-b border-navy-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">ðŸª¤</span>
          <div>
            <h3 className="text-[11px] font-bold text-white uppercase tracking-[0.15em]">
              La Cage & L'Oiseau â€” Bande BKAM Â±5%
            </h3>
            <p className="text-[9px] text-navy-500">
              Panier 60% EUR / 40% USD Â· K = {K} Â· RÃ©gime Phase II (mars 2020)
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowInfo(v => !v)}
          className="text-navy-500 hover:text-gold-400 transition-colors"
          title="MÃ©thodologie"
        >
          <Info size={14} />
        </button>
      </div>

      {/* â”€â”€ Methodology note â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {showInfo && (
        <div className="px-5 py-3 bg-navy-950/40 border-b border-navy-800 text-[11px] text-navy-400 leading-relaxed space-y-1.5">
          <p>
            <strong className="text-slate-300">MÃ©thodologie de la bande :</strong> Bank Al-Maghrib gÃ¨re le dirham dans une bande de Â±5%
            autour d'une paritÃ© centrale calculÃ©e par le panier de rÃ©fÃ©rence (60% EUR + 40% USD, valeur K = {K}).
          </p>
          <p>
            <strong className="text-slate-300">Formule panier :</strong>{' '}
            <code className="bg-navy-800 px-1 rounded font-mono text-[10px]">
              USD/MAD_central = K / (0,60 Ã— EUR/USD + 0,40)
            </code>
          </p>
          <p>
            <strong className="text-slate-300">La dÃ©rive :</strong> Ã‰cart entre le fixing BKAM officiel et la paritÃ© thÃ©orique du panier en points de base.
            Une dÃ©rive positive signifie que BKAM laisse le MAD se dÃ©prÃ©cier au-delÃ  du panier.
          </p>
          <p className="text-[10px] text-navy-600">
            Phase I (jan. 2018) : Â±2,5% Â· Phase II (mars 2020) : Â±5% (rÃ©gime actuel).
            Source : BKAM CoursVirement officiel.
          </p>
        </div>
      )}

      <div className="p-5 space-y-6">
        {!hasRates ? (
          <div className="text-center py-8 text-navy-600 text-sm">
            <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-navy-700" />
            Chargement des taux BKAM en coursâ€¦
          </div>
        ) : (
          <>
            {/* EUR/MAD gauge */}
            {eurBand && (
              <div className="space-y-1">
                <BandGauge data={eurBand} pair="EUR/MAD" countryCode="eu" />
              </div>
            )}

            <div className="border-t border-navy-800" />

            {/* USD/MAD gauge */}
            {usdBand && (
              <div className="space-y-1">
                <BandGauge data={usdBand} pair="USD/MAD" countryCode="us" />
              </div>
            )}

            <div className="border-t border-navy-800" />

            {/* Basket parity breakdown */}
            <div>
              <p className="text-[10px] font-bold text-white uppercase tracking-wider mb-3">ParitÃ© ThÃ©orique du Panier</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: 'EUR/USD implicite', value: eurUsd.toFixed(4), sub: 'EUR/MAD Ã· USD/MAD', color: 'text-blue-400' },
                  { label: 'USD/MAD central', value: usdCentral.toFixed(4), sub: `KÃ·(0.6Ã—${eurUsd.toFixed(3)}+0.4)`, color: 'text-gold-400' },
                  { label: 'EUR/MAD central', value: eurCentral.toFixed(4), sub: `USD/MAD Ã— ${eurUsd.toFixed(3)}`, color: 'text-gold-400' },
                ].map(m => (
                  <div key={m.label} className="bg-navy-950 border border-navy-800 rounded-lg p-3 text-center">
                    <p className="text-[9px] text-navy-500 uppercase tracking-wider">{m.label}</p>
                    <p className={`text-[15px] font-mono font-bold ${m.color}`}>{m.value}</p>
                    <p className="text-[8px] text-navy-600 font-mono mt-0.5">{m.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Drift chart (recent 7d) â€” only when not compact */}
            {!compact && (
              <>
                <div className="border-t border-navy-800" />
                <DriftChart drift={drift} loading={driftLoading} />
              </>
            )}

            {/* Historical drift â€” requires cron to have run at least once */}
            {!compact && config.corsProxyUrl && (
              <>
                <div className="border-t border-navy-800" />
                <HistoricalDriftChart corsProxyUrl={config.corsProxyUrl} />
              </>
            )}
          </>
        )}

        {/* P1.19 â€” Fixing calendar */}
        <FixingCalendar />

        {/* P2.24 â€” Print CTA */}
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => {
              if (typeof window !== 'undefined') window.print();
            }}
            className="text-[10px] flex items-center gap-1 px-2 py-1 text-gold-400 hover:text-gold-300 transition-colors"
          >
            <Printer size={11} /> Imprimer / PDF
          </button>
          <ProvenanceChip rate={{ currency: 'EUR', source: 'CALCULATED', timestamp: new Date().toISOString() } as any} />
        </div>

        {/* Compliance note */}
        <div className="flex items-start gap-2 bg-navy-950/50 border border-navy-800/60 rounded-lg px-3 py-2">
          <AlertTriangle size={11} className="text-amber-500/70 flex-shrink-0 mt-0.5" />
          <p className="text-[9px] text-navy-600 leading-relaxed">
            Bandes calculÃ©es sur la base des taux indicatifs JAD2FX. Pour le fixing officiel quotidien, consultez{' '}
            <a href={BKAM_LINKS.mainSite} target="_blank" rel="noopener noreferrer" className="text-blue-500/70 hover:text-blue-400 underline">
              bkam.ma
            </a>
            {' '}Â· DonnÃ©es Ã  titre pÃ©dagogique uniquement â€” JAD2 Advisory, conseil stratÃ©gique & formation.
          </p>
        </div>
      </div>
    </div>
  );
}
