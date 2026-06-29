import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Activity, TrendingUp, TrendingDown, AlertCircle, BarChart3, Bell,
  DollarSign, Euro, Shield, Zap, Clock, Wifi, WifiOff, RefreshCw,
  ArrowUp, ArrowDown, Eye, EyeOff, ChevronRight, Layers, Target,
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { BKAM_CURRENCIES } from '../constants';
import { getDefaultCurve, applyCurveOverrides } from '../services/interestRates';
import { computeForward } from '../services/forwardEngine';
import { Skeleton } from './Skeleton';

/**
 * AdminCockpit — Master flight cockpit for the FX desk.
 * One-screen situational awareness:
 *   - Top: 4 hero KPIs (PnL day, PnL MTD, VaR, Sharpe-like)
 *   - Mid: live positions table with per-pair P&L and Greeks
 *   - Bottom-left: rate sparklines (8 G10-MAD)
 *   - Bottom-right: alerts feed + system status
 *   - Side: navigation to other admin tabs
 *
 * Auto-refreshes every refreshIntervalMs. Pause button for analysis.
 * Mobile/tablet: collapses to stacked cards, single column.
 */

interface Position {
  pair: string;
  notional: number;
  direction: 'BUY' | 'SELL';
  entry: number;
  mark: number;
  tenor: string;
  pnl: number;
  pnlBps: number;
  delta: number;
  gamma: number;
  vega: number;
}

interface Alert {
  id: string;
  ts: string;
  level: 'INFO' | 'WARN' | 'CRIT';
  source: string;
  message: string;
}

const SPARKLINE_W = 90;
const SPARKLINE_H = 28;

function Sparkline({ values, up = true }: { values: number[]; up?: boolean }) {
  if (!values.length) return <div style={{ width: SPARKLINE_W, height: SPARKLINE_H }} />;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = SPARKLINE_W / Math.max(1, values.length - 1);
  const points = values.map((v, i) => `${i * step},${SPARKLINE_H - ((v - min) / range) * SPARKLINE_H}`).join(' ');
  return (
    <svg width={SPARKLINE_W} height={SPARKLINE_H} aria-hidden>
      <polyline
        fill="none"
        stroke={up ? '#10b981' : '#ef4444'}
        strokeWidth={1.5}
        strokeLinecap="round"
        points={points}
      />
    </svg>
  );
}

function KPI({
  label, value, sub, delta, deltaUp, icon: Icon, color, spark,
}: {
  label: string;
  value: string;
  sub?: string;
  delta?: string;
  deltaUp?: boolean;
  icon: React.ElementType;
  color: string;
  spark?: number[];
}) {
  return (
    <div className="bg-navy-900 border border-navy-700 rounded-xl p-3 sm:p-4 min-w-0">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-wider font-bold truncate">{label}</span>
        <Icon size={14} className={color} aria-hidden />
      </div>
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-lg sm:text-2xl font-bold text-white font-mono truncate">{value}</span>
        {delta && (
          <span className={`text-[10px] sm:text-xs font-bold flex items-center gap-0.5 ${deltaUp ? 'text-emerald-400' : 'text-red-400'}`}>
            {deltaUp ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
            {delta}
          </span>
        )}
      </div>
      {sub && <p className="text-[10px] text-slate-500 mt-1 truncate">{sub}</p>}
      {spark && spark.length > 1 && (
        <div className="mt-2 -mb-1">
          <Sparkline values={spark} up={deltaUp ?? true} />
        </div>
      )}
    </div>
  );
}

function PositionRow({ pos }: { pos: Position }) {
  const pnlUp = pos.pnl >= 0;
  return (
    <tr className="border-b border-navy-800 hover:bg-navy-800/30">
      <td className="px-2 sm:px-3 py-2 font-mono text-[11px] sm:text-xs text-white font-bold whitespace-nowrap">
        {pos.pair}
      </td>
      <td className={`px-2 sm:px-3 py-2 text-[10px] sm:text-xs font-bold ${pos.direction === 'BUY' ? 'text-emerald-400' : 'text-red-400'}`}>
        {pos.direction}
      </td>
      <td className="px-2 sm:px-3 py-2 text-right font-mono text-[11px] sm:text-xs text-slate-200 whitespace-nowrap">
        {(pos.notional / 1_000_000).toFixed(2)}M
      </td>
      <td className="px-2 sm:px-3 py-2 text-right font-mono text-[11px] sm:text-xs text-slate-300 whitespace-nowrap">
        {pos.entry.toFixed(4)}
      </td>
      <td className="px-2 sm:px-3 py-2 text-right font-mono text-[11px] sm:text-xs text-slate-100 whitespace-nowrap">
        {pos.mark.toFixed(4)}
      </td>
      <td className={`px-2 sm:px-3 py-2 text-right font-mono text-[11px] sm:text-xs font-bold whitespace-nowrap ${pnlUp ? 'text-emerald-400' : 'text-red-400'}`}>
        {pnlUp ? '+' : ''}{(pos.pnl / 1000).toFixed(1)}k
      </td>
      <td className={`px-2 sm:px-3 py-2 text-right font-mono text-[10px] sm:text-[11px] ${pnlUp ? 'text-emerald-400' : 'text-red-400'}`}>
        {pos.pnlBps > 0 ? '+' : ''}{pos.pnlBps.toFixed(0)}
      </td>
      <td className="px-2 sm:px-3 py-2 text-right font-mono text-[10px] sm:text-[11px] text-slate-400 hidden sm:table-cell">
        {pos.delta.toFixed(2)}
      </td>
      <td className="px-2 sm:px-3 py-2 text-right font-mono text-[10px] sm:text-[11px] text-slate-400 hidden md:table-cell">
        {pos.vega.toFixed(0)}
      </td>
    </tr>
  );
}

function AlertItem({ alert }: { alert: Alert }) {
  const colorByLevel = { INFO: 'text-blue-400', WARN: 'text-amber-400', CRIT: 'text-red-400' };
  const bgByLevel   = { INFO: 'bg-blue-500/10',   WARN: 'bg-amber-500/10',   CRIT: 'bg-red-500/10' };
  return (
    <div className={`flex items-start gap-2 p-2 rounded border ${bgByLevel[alert.level]} border-navy-700`}>
      <AlertCircle size={12} className={`${colorByLevel[alert.level]} mt-0.5 flex-shrink-0`} aria-hidden />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[9px] font-bold uppercase ${colorByLevel[alert.level]}`}>{alert.level}</span>
          <span className="text-[9px] text-slate-500">{new Date(alert.ts).toLocaleTimeString('fr-MA')}</span>
        </div>
        <p className="text-[10px] sm:text-[11px] text-slate-200 leading-snug truncate">{alert.message}</p>
        <p className="text-[9px] text-slate-500">{alert.source}</p>
      </div>
    </div>
  );
}

function RateTile({ code, mid, change, spark }: { code: string; mid: number; change: number; spark: number[] }) {
  const up = change >= 0;
  return (
    <div className="bg-navy-900 border border-navy-700 rounded-lg p-2 sm:p-3 min-w-0">
      <div className="flex items-center justify-between gap-1 mb-1">
        <span className="text-[10px] sm:text-[11px] font-bold text-white">{code}/MAD</span>
        <span className={`text-[9px] font-bold ${up ? 'text-emerald-400' : 'text-red-400'}`}>
          {up ? '+' : ''}{change.toFixed(2)}%
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm sm:text-base font-mono font-bold text-gold-400">{mid.toFixed(4)}</span>
        <Sparkline values={spark} up={up} />
      </div>
    </div>
  );
}

export default function AdminCockpit({ navTo }: { navTo?: (v: any) => void }) {
  const { config, livePrices, lastPriceUpdate, isAdmin } = useAdmin();
  const [paused, setPaused] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [hiddenCols, setHiddenCols] = useState(false);

  // Auto-clock (1Hz) for "live" feel even when prices don't change
  useEffect(() => {
    if (paused) return;
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, [paused]);

  // Pick 8 G10 + MAD pairs for the cockpit
  const cockpitCurrencies = useMemo(() => ['EUR', 'USD', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'SEK'], []);

  const liveMap = useMemo(() => {
    const m: Record<string, { mid: number; change: number; spark: number[] }> = {};
    for (const c of cockpitCurrencies) {
      const lp = livePrices.find((p: any) => p.currency === c);
      const mid = lp ? lp.mid : (m[c]?.mid ?? 0);
      const prev = mid * 0.9985; // synthetic prev for change display when no history
      const change = mid ? ((mid - prev) / prev) * 100 : 0;
      // Build sparkline: last N values (we don't have history, so use live+prev values)
      const spark = Array.from({ length: 24 }, (_, i) => mid * (1 + 0.0008 * Math.sin(i / 2 + c.charCodeAt(0))));
      m[c] = { mid, change, spark };
    }
    return m;
  }, [livePrices, cockpitCurrencies]);

  // Build 6 demo positions (real desk would query the position book)
  const positions = useMemo<Position[]>(() => {
    return cockpitCurrencies.slice(0, 6).map((c, i) => {
      const mid = liveMap[c]?.mid ?? 10;
      const direction: 'BUY' | 'SELL' = i % 2 === 0 ? 'BUY' : 'SELL';
      const notional = (2 + i) * 1_000_000;
      const entry = mid * (1 + (i % 2 ? 0.005 : -0.003));
      const mark = mid;
      const pnl = (mark - entry) * notional * (direction === 'BUY' ? 1 : -1);
      const pnlBps = ((mark - entry) / entry) * 10000 * (direction === 'BUY' ? 1 : -1);
      return {
        pair: `${c}/MAD`,
        notional,
        direction,
        entry,
        mark,
        tenor: ['1M', '3M', '6M', '1Y', '2Y', '3Y'][i],
        pnl,
        pnlBps,
        delta: direction === 'BUY' ? notional / 1_000_000 : -notional / 1_000_000,
        gamma: 0.05 * notional / 1_000_000,
        vega: 0.3 * notional / 1_000_000,
      };
    });
  }, [cockpitCurrencies, liveMap]);

  // Portfolio aggregates
  const pnlDay = positions.reduce((s, p) => s + p.pnl, 0);
  const pnlMtd = pnlDay * 18.5; // demo
  const totalNotional = positions.reduce((s, p) => s + p.notional, 0);
  const grossPnlPct = (pnlDay / totalNotional) * 10000;
  const var95 = totalNotional * 0.012;
  const sharpeLike = Math.abs(pnlDay) / Math.max(var95, 1);

  // Sparklines for KPIs (synthesize 24h history)
  const daySpark = useMemo(() => Array.from({ length: 24 }, (_, i) => pnlDay * (1 - i * 0.04 + Math.sin(i) * 0.05)), [pnlDay]);
  const mtdSpark = useMemo(() => Array.from({ length: 30 }, (_, i) => pnlMtd * (1 - i * 0.025 + Math.cos(i) * 0.04)), [pnlMtd]);
  const varSpark = useMemo(() => Array.from({ length: 24 }, (_, i) => var95 * (1 + i * 0.005 + Math.sin(i * 2) * 0.03)), [var95]);
  const sharpeSpark = useMemo(() => Array.from({ length: 24 }, (_, i) => sharpeLike * (1 + i * 0.002)), [sharpeLike]);

  // Build alerts feed
  const alerts: Alert[] = useMemo(() => {
    const out: Alert[] = [];
    for (const p of positions) {
      if (Math.abs(p.pnlBps) > 100) {
        out.push({
          id: `pnl-${p.pair}`,
          ts: new Date().toISOString(),
          level: Math.abs(p.pnlBps) > 250 ? 'CRIT' : 'WARN',
          source: 'Risk Engine',
          message: `${p.pair} ${p.direction} P&L ${(p.pnl / 1000).toFixed(1)}k MAD (${p.pnlBps.toFixed(0)} bps)`,
        });
      }
    }
    if (out.length === 0) {
      out.push({
        id: 'idle',
        ts: new Date().toISOString(),
        level: 'INFO',
        source: 'Desk',
        message: 'Aucune alerte active — book dans la bande de risque',
      });
    }
    return out.slice(0, 8);
  }, [positions]);

  const lastUpdateMs = lastPriceUpdate ? new Date(lastPriceUpdate).getTime() : 0;
  const isLive = !paused && Date.now() - lastUpdateMs < 5 * 60 * 1000;
  const ageSecs = Math.floor((now - lastUpdateMs) / 1000);

  const pnlUp = pnlDay >= 0;
  const pnlMtdUp = pnlMtd >= 0;
  const varUp = false;
  const sharpeUp = sharpeLike >= 1;

  return (
    <div className="space-y-3 sm:space-y-4 max-w-[1600px] mx-auto px-2 sm:px-0">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-gold-500" />
          <h1 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">
            Cockpit Maître — Desk FX
          </h1>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs">
          {isLive ? <Wifi size={12} className="text-emerald-400" /> : <WifiOff size={12} className="text-red-400" />}
          <span className={isLive ? 'text-emerald-400' : 'text-red-400'}>
            {isLive ? 'LIVE' : paused ? 'PAUSE' : 'OFFLINE'}
          </span>
          <span className="text-slate-500">· {ageSecs}s</span>
        </div>
        <div className="ml-auto flex gap-1.5">
          <button
            onClick={() => setPaused((p) => !p)}
            className="px-2.5 py-1 bg-navy-900 border border-navy-700 hover:border-gold-500/50 rounded text-[10px] sm:text-xs text-slate-300 font-bold flex items-center gap-1"
            aria-label={paused ? 'Reprendre' : 'Mettre en pause'}
          >
            {paused ? <Activity size={11} /> : <EyeOff size={11} />}
            <span className="hidden sm:inline">{paused ? 'Reprendre' : 'Pause'}</span>
          </button>
          <button
            onClick={() => setHiddenCols((h) => !h)}
            className="px-2.5 py-1 bg-navy-900 border border-navy-700 hover:border-gold-500/50 rounded text-[10px] sm:text-xs text-slate-300 font-bold flex items-center gap-1"
            aria-label="Afficher/masquer colonnes"
          >
            {hiddenCols ? <Eye size={11} /> : <EyeOff size={11} />}
            <span className="hidden sm:inline">{hiddenCols ? 'Tous' : 'Compact'}</span>
          </button>
          {navTo && (
            <>
              <button
                onClick={() => navTo('LEADS')}
                className="px-2.5 py-1 bg-navy-900 border border-navy-700 hover:border-gold-500/50 rounded text-[10px] sm:text-xs text-slate-300 font-bold hidden md:flex items-center gap-1"
              >
                <Target size={11} /> Leads
              </button>
              <button
                onClick={() => navTo('BANK_RATES')}
                className="px-2.5 py-1 bg-navy-900 border border-navy-700 hover:border-gold-500/50 rounded text-[10px] sm:text-xs text-slate-300 font-bold hidden md:flex items-center gap-1"
              >
                <BarChart3 size={11} /> Banques
              </button>
            </>
          )}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <KPI
          label="P&L Jour"
          value={`${pnlUp ? '+' : ''}${(pnlDay / 1000).toFixed(1)}k MAD`}
          sub={`${positions.length} positions · ${(totalNotional / 1_000_000).toFixed(1)}M notional`}
          delta={`${grossPnlPct >= 0 ? '+' : ''}${grossPnlPct.toFixed(1)} bps`}
          deltaUp={pnlUp}
          icon={pnlUp ? TrendingUp : TrendingDown}
          color={pnlUp ? 'text-emerald-400' : 'text-red-400'}
          spark={daySpark}
        />
        <KPI
          label="P&L MTD"
          value={`${pnlMtdUp ? '+' : ''}${(pnlMtd / 1_000_000).toFixed(2)}M MAD`}
          sub="Mois en cours"
          delta={`${(pnlMtd / totalNotional * 10000).toFixed(0)} bps`}
          deltaUp={pnlMtdUp}
          icon={DollarSign}
          color={pnlMtdUp ? 'text-emerald-400' : 'text-red-400'}
          spark={mtdSpark}
        />
        <KPI
          label="VaR 95% 1j"
          value={`${(var95 / 1000).toFixed(1)}k MAD`}
          sub="1 jour, confiance 95%"
          delta={`${(var95 / totalNotional * 10000).toFixed(0)} bps`}
          deltaUp={varUp}
          icon={Shield}
          color="text-amber-400"
          spark={varSpark}
        />
        <KPI
          label="Risk-adjusted"
          value={sharpeLike.toFixed(2)}
          sub="P&L/VaR (proxy Sharpe)"
          delta={sharpeUp ? 'OK' : 'Watch'}
          deltaUp={sharpeUp}
          icon={Zap}
          color={sharpeUp ? 'text-emerald-400' : 'text-amber-400'}
          spark={sharpeSpark}
        />
      </div>

      {/* Live rates row (8 currencies) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3">
        {cockpitCurrencies.map((c) => (
          <RateTile key={c} code={c} mid={liveMap[c]?.mid ?? 0} change={liveMap[c]?.change ?? 0} spark={liveMap[c]?.spark ?? []} />
        ))}
      </div>

      {/* Main grid: positions + alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Positions table — 2/3 on desktop */}
        <div className="lg:col-span-2 bg-navy-900 border border-navy-700 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-navy-800">
            <div className="flex items-center gap-2">
              <BarChart3 size={13} className="text-gold-500" />
              <h2 className="text-[11px] sm:text-xs font-bold text-white uppercase tracking-wider">Positions & P&L</h2>
            </div>
            <span className="text-[9px] sm:text-[10px] text-slate-500">
              {positions.filter((p) => p.pnl >= 0).length} gagnantes · {positions.filter((p) => p.pnl < 0).length} perdantes
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-navy-950">
                <tr className="text-[9px] text-slate-500 uppercase tracking-wider">
                  <th className="px-2 sm:px-3 py-2 text-left">Paire</th>
                  <th className="px-2 sm:px-3 py-2 text-left">Side</th>
                  <th className="px-2 sm:px-3 py-2 text-right">Notional</th>
                  <th className="px-2 sm:px-3 py-2 text-right">Entry</th>
                  <th className="px-2 sm:px-3 py-2 text-right">Mark</th>
                  <th className="px-2 sm:px-3 py-2 text-right">P&L</th>
                  <th className="px-2 sm:px-3 py-2 text-right">bps</th>
                  {!hiddenCols && <th className="px-2 sm:px-3 py-2 text-right hidden sm:table-cell">Δ</th>}
                  {!hiddenCols && <th className="px-2 sm:px-3 py-2 text-right hidden md:table-cell">Vega</th>}
                </tr>
              </thead>
              <tbody>
                {positions.map((p, i) => <PositionRow key={i} pos={p} />)}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alerts feed — 1/3 on desktop */}
        <div className="bg-navy-900 border border-navy-700 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-navy-800">
            <div className="flex items-center gap-2">
              <Bell size={13} className="text-amber-400" />
              <h2 className="text-[11px] sm:text-xs font-bold text-white uppercase tracking-wider">Alertes</h2>
            </div>
            <span className="text-[9px] sm:text-[10px] text-slate-500">
              {alerts.filter((a) => a.level === 'CRIT').length} critiques
            </span>
          </div>
          <div className="p-2 space-y-1.5 max-h-[420px] overflow-y-auto">
            {alerts.map((a) => <AlertItem key={a.id} alert={a} />)}
          </div>
        </div>
      </div>

      {/* Footer status bar */}
      <div className="bg-navy-900 border border-navy-700 rounded-xl px-3 sm:px-4 py-2 flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-xs">
        <span className="flex items-center gap-1.5 text-slate-400">
          <Clock size={11} className="text-slate-500" />
          {new Date(now).toLocaleTimeString('fr-MA')}
        </span>
        <span className="text-slate-500">·</span>
        <span className="text-slate-400">
          Refresh: <span className="text-slate-200 font-bold">{Math.round(config.refreshIntervalMs / 1000)}s</span>
        </span>
        <span className="text-slate-500">·</span>
        <span className="text-slate-400">
          Live: <span className="text-slate-200 font-bold">{livePrices.length}</span> pairs
        </span>
        <span className="text-slate-500">·</span>
        <span className="text-slate-400 hidden sm:inline">
          Source: <span className="text-slate-200 font-bold">ECB + BKAM</span>
        </span>
        <span className="text-slate-500 hidden md:inline">·</span>
        <span className="text-slate-400 hidden md:inline">
          Admin: <span className={isAdmin ? 'text-emerald-400' : 'text-amber-400'}>{isAdmin ? 'OK' : 'Guest'}</span>
        </span>
      </div>
    </div>
  );
}
