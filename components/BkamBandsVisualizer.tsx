/**
 * BkamBandsVisualizer — "The Cage & The Bird"
 *
 * Visualises the BKAM ±5% intervention band for EUR/MAD and USD/MAD.
 * The "cage"  = the ±5% band around the basket central parity (K = 10.49).
 * The "bird"  = today's live fixing / mid-rate.
 *
 * Basket formula:  USD/MAD_central = K / (w_EUR × EUR/USD + w_USD)
 *                  EUR/MAD_central = USD/MAD_central × EUR/USD
 *
 * BKAM widened the band in two phases:
 *   Jan 2018 → ±2.5%   (Phase I, controlled float)
 *   Mar 2020 → ±5%     (Phase II, enlarged float — current regime)
 *
 * A NARROWING drift (bird near the floor) signals MAD strength vs basket.
 * A WIDENING drift (bird near the ceiling) signals MAD weakness vs basket.
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Area, ComposedChart,
} from 'recharts';
import { AlertTriangle, TrendingUp, TrendingDown, Minus, RefreshCw, Info } from 'lucide-react';
import { DEFAULT_BASKET_CONFIG } from '../constants';
import { useAdmin } from '../context/AdminContext';
import { computeDriftModel, DriftRegression, DriftPoint } from '../services/driftModel';

// ─── Constants ────────────────────────────────────────────────────────────────

const K     = DEFAULT_BASKET_CONFIG.referenceBasketValue;
const EUR_W = DEFAULT_BASKET_CONFIG.eurWeight;
const USD_W = DEFAULT_BASKET_CONFIG.usdWeight;
const BAND  = 0.05;   // ±5% current regime
const PHASE1_BAND = 0.025; // ±2.5% phase I reference

// ─── Types ────────────────────────────────────────────────────────────────────

interface BandState {
  spot: number;
  central: number;
  upper: number;
  lower: number;
  phase1Upper: number;
  phase1Lower: number;
  utilPct: number;        // 0–100%, 50 = at central parity
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

// ─── Sub: Horizontal Gauge ────────────────────────────────────────────────────

function BandGauge({ data, pair, flag }: { data: BandState; pair: string; flag: string }) {
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
          <span className="text-xl">{flag}</span>
          <div>
            <p className="text-[13px] font-bold text-white font-mono">{pair}</p>
            <p className="text-[10px] text-navy-500 uppercase tracking-wider">
              Panier {flag === '🇪🇺' ? '60% EUR' : '40% USD'} · BKAM Phase II ±5%
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-mono font-bold text-gold-400">{data.spot.toFixed(4)}</p>
          <div className={`flex items-center gap-1 justify-end text-[10px] font-bold ${
            data.zone === 'SAFE' ? 'text-emerald-400' : data.zone === 'CAUTION' ? 'text-amber-400' : 'text-red-400'
          }`}>
            <ZoneIcon size={10} />
            {data.zone === 'SAFE' ? 'ZONE NEUTRE' : data.zone === 'CAUTION' ? 'APPROCHE LIMITE' : 'PROXIMITÉ BANDE'}
          </div>
        </div>
      </div>

      {/* Gauge track */}
      <div className="relative h-12 rounded-lg overflow-visible bg-navy-800 border border-navy-700">
        {/* Full gradient background: red → amber → green → amber → red */}
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

        {/* The Bird — current rate indicator */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 transition-all duration-700"
          style={{ left: `${pct}%` }}
        >
          <div
            className="w-4 h-10 rounded-sm flex items-center justify-center shadow-lg"
            style={{ backgroundColor: birdColor, boxShadow: `0 0 8px ${birdColor}60` }}
          >
            <span className="text-[14px] select-none" title="Position actuelle">🐦</span>
          </div>
        </div>
      </div>

      {/* Labels under gauge */}
      <div className="flex justify-between text-[9px] text-navy-500 font-mono px-0.5">
        <div className="text-left">
          <p className="font-bold text-red-400">{data.lower.toFixed(4)}</p>
          <p>PLANCHER −5%</p>
        </div>
        <div className="text-center">
          <p className="text-[8px] text-blue-400/70">±2.5% Phase I</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-red-400">{data.upper.toFixed(4)}</p>
          <p>PLAFOND +5%</p>
        </div>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Utilisation', value: `${(Math.abs(data.utilPct - 50) * 2).toFixed(1)}%`, sub: 'de la bande', color: birdColor },
          { label: 'Dist. Plafond', value: `${data.distToCeilingBps} pb`, sub: `${data.distToCeilingPct}%`, color: data.utilPct > 70 ? '#f59e0b' : '#94a3b8' },
          { label: 'Dist. Plancher', value: `${data.distToFloorBps} pb`, sub: `${data.distToFloorPct}%`, color: data.utilPct < 30 ? '#f59e0b' : '#94a3b8' },
          { label: 'Position', value: `${data.utilPct > 50 ? '+' : ''}${(data.spot - data.central).toFixed(4)}`, sub: 'vs parité', color: data.utilPct > 50 ? '#f59e0b' : '#10b981' },
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

// ─── Sub: Drift Chart ─────────────────────────────────────────────────────────

function DriftChart({ drift, loading }: { drift: DriftRegression | null; loading: boolean }) {
  if (loading) {
    return (
      <div className="h-40 flex items-center justify-center gap-2 text-navy-500 text-sm">
        <RefreshCw size={14} className="animate-spin" />
        <span>Chargement dérive BKAM…</span>
      </div>
    );
  }
  if (!drift || drift.points.length < 2) {
    return (
      <div className="h-40 flex items-center justify-center text-navy-600 text-sm">
        Données de dérive non disponibles — vérifiez la connexion proxy.
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
            Dérive BKAM vs Parité Panier · {drift.points.length}j
          </p>
          <p className="text-[10px] text-navy-500">
            (Fixing officiel − parité théorique) en points de base · Positif = MAD faible vs panier
          </p>
        </div>
        <div className="flex items-center gap-2 bg-navy-900 border border-navy-800 rounded px-3 py-1.5">
          <TrendIcon size={12} style={{ color: trendColor }} />
          <div className="text-right">
            <p className="text-[10px] font-bold" style={{ color: trendColor }}>
              {drift.trendDir === 'WIDENING' ? 'ÉLARGISSEMENT' : drift.trendDir === 'NARROWING' ? 'RESSERREMENT' : 'STABLE'}
            </p>
            <p className="text-[9px] text-navy-500">
              β = {drift.beta >= 0 ? '+' : ''}{drift.beta.toFixed(1)} pb/j · R²={drift.r2.toFixed(2)}
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
              formatter={(v: number, name: string) => [`${v} pb`, name === 'drift' ? 'Dérive réelle' : 'Tendance OLS']}
            />
            <ReferenceLine y={0} stroke="#D4AF37" strokeWidth={1} strokeDasharray="4 2" />
            <Area dataKey="drift" fill="#D4AF37" fillOpacity={0.1} stroke="#D4AF37" strokeWidth={1.5} dot={{ r: 3, fill: '#D4AF37' }} name="drift" />
            <Line dataKey="trend" stroke="#ef4444" strokeWidth={1} strokeDasharray="5 3" dot={false} name="trend" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-4 gap-2 text-center">
        {[
          { label: 'Dérive actuelle', value: `${drift.latestDriftBps >= 0 ? '+' : ''}${drift.latestDriftBps.toFixed(0)} pb`, color: drift.latestDriftBps > 20 ? '#f59e0b' : drift.latestDriftBps < -20 ? '#10b981' : '#94a3b8' },
          { label: 'Pente OLS', value: `${drift.beta >= 0 ? '+' : ''}${drift.beta.toFixed(1)} pb/j`, color: trendColor },
          { label: 'R²', value: drift.r2.toFixed(2), color: drift.r2 > 0.7 ? '#10b981' : '#94a3b8' },
          { label: 'Source', value: drift.dataSource === 'BKAM_OFFICIAL' ? 'BKAM' : drift.dataSource === 'ECB_PROXY' ? 'ECB' : 'MIXTE', color: drift.dataSource === 'BKAM_OFFICIAL' ? '#10b981' : '#f59e0b' },
        ].map(m => (
          <div key={m.label} className="bg-navy-900 border border-navy-800 rounded px-2 py-1.5">
            <p className="text-[9px] text-navy-500 uppercase tracking-wider">{m.label}</p>
            <p className="text-[12px] font-mono font-bold" style={{ color: m.color }}>{m.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

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
      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="px-5 py-3 border-b border-navy-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🪤</span>
          <div>
            <h3 className="text-[11px] font-bold text-white uppercase tracking-[0.15em]">
              La Cage & L'Oiseau — Bande BKAM ±5%
            </h3>
            <p className="text-[9px] text-navy-500">
              Panier 60% EUR / 40% USD · K = {K} · Régime Phase II (mars 2020)
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowInfo(v => !v)}
          className="text-navy-500 hover:text-gold-400 transition-colors"
          title="Méthodologie"
        >
          <Info size={14} />
        </button>
      </div>

      {/* ── Methodology note ──────────────────────────────────────── */}
      {showInfo && (
        <div className="px-5 py-3 bg-navy-950/40 border-b border-navy-800 text-[11px] text-navy-400 leading-relaxed space-y-1.5">
          <p>
            <strong className="text-slate-300">Méthodologie de la bande :</strong> Bank Al-Maghrib gère le dirham dans une bande de ±5%
            autour d'une parité centrale calculée par le panier de référence (60% EUR + 40% USD, valeur K = {K}).
          </p>
          <p>
            <strong className="text-slate-300">Formule panier :</strong>{' '}
            <code className="bg-navy-800 px-1 rounded font-mono text-[10px]">
              USD/MAD_central = K / (0,60 × EUR/USD + 0,40)
            </code>
          </p>
          <p>
            <strong className="text-slate-300">La dérive :</strong> Écart entre le fixing BKAM officiel et la parité théorique du panier en points de base.
            Une dérive positive signifie que BKAM laisse le MAD se déprécier au-delà du panier.
          </p>
          <p className="text-[10px] text-navy-600">
            Phase I (jan. 2018) : ±2,5% · Phase II (mars 2020) : ±5% (régime actuel).
            Source : BKAM CoursVirement officiel.
          </p>
        </div>
      )}

      <div className="p-5 space-y-6">
        {!hasRates ? (
          <div className="text-center py-8 text-navy-600 text-sm">
            <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-navy-700" />
            Chargement des taux BKAM en cours…
          </div>
        ) : (
          <>
            {/* EUR/MAD gauge */}
            {eurBand && (
              <div className="space-y-1">
                <BandGauge data={eurBand} pair="EUR/MAD" flag="🇪🇺" />
              </div>
            )}

            <div className="border-t border-navy-800" />

            {/* USD/MAD gauge */}
            {usdBand && (
              <div className="space-y-1">
                <BandGauge data={usdBand} pair="USD/MAD" flag="🇺🇸" />
              </div>
            )}

            <div className="border-t border-navy-800" />

            {/* Basket parity breakdown */}
            <div>
              <p className="text-[10px] font-bold text-white uppercase tracking-wider mb-3">Parité Théorique du Panier</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'EUR/USD implicite', value: eurUsd.toFixed(4), sub: 'EUR/MAD ÷ USD/MAD', color: 'text-blue-400' },
                  { label: 'USD/MAD central', value: usdCentral.toFixed(4), sub: `K÷(0.6×${eurUsd.toFixed(3)}+0.4)`, color: 'text-gold-400' },
                  { label: 'EUR/MAD central', value: eurCentral.toFixed(4), sub: `USD/MAD × ${eurUsd.toFixed(3)}`, color: 'text-gold-400' },
                ].map(m => (
                  <div key={m.label} className="bg-navy-950 border border-navy-800 rounded-lg p-3 text-center">
                    <p className="text-[9px] text-navy-500 uppercase tracking-wider">{m.label}</p>
                    <p className={`text-[15px] font-mono font-bold ${m.color}`}>{m.value}</p>
                    <p className="text-[8px] text-navy-600 font-mono mt-0.5">{m.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Drift chart — only when not compact */}
            {!compact && (
              <>
                <div className="border-t border-navy-800" />
                <DriftChart drift={drift} loading={driftLoading} />
              </>
            )}
          </>
        )}

        {/* Compliance note */}
        <div className="flex items-start gap-2 bg-navy-950/50 border border-navy-800/60 rounded-lg px-3 py-2">
          <AlertTriangle size={11} className="text-amber-500/70 flex-shrink-0 mt-0.5" />
          <p className="text-[9px] text-navy-600 leading-relaxed">
            Bandes calculées sur la base des taux indicatifs JAD2FX. Pour le fixing officiel quotidien, consultez{' '}
            <a href="https://www.bkam.ma" target="_blank" rel="noopener noreferrer" className="text-blue-500/70 hover:text-blue-400 underline">
              bkam.ma
            </a>
            {' '}· Données à titre pédagogique uniquement — JAD2 Advisory, conseil stratégique & formation.
          </p>
        </div>
      </div>
    </div>
  );
}
