import React, { useEffect } from 'react';
import {
  Activity, RefreshCw, TrendingUp, TrendingDown, Minus, Wifi, WifiOff,
} from 'lucide-react';
import { BKAM_CURRENCIES } from '../constants';
import { usePriceStream } from '../hooks/usePriceStream';
import { useAdmin } from '../context/AdminContext';
import { LivePriceEntry } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt4(v: number) { return v.toFixed(4); }
function fmtPct(v: number) { return (v >= 0 ? '+' : '') + v.toFixed(4) + '%'; }

// ─── Price Row ─────────────────────────────────────────────────────────────────

function PriceRow({ entry }: { entry: LivePriceEntry }) {
  const up   = entry.change > 0;
  const dn   = entry.change < 0;
  const flat = !up && !dn;

  const info = BKAM_CURRENCIES.find(c => c.code === entry.currency);

  const changeColor = up ? 'text-emerald-400' : dn ? 'text-red-400' : 'text-slate-500';
  const bgFlash     = up ? 'group-hover:bg-emerald-950/20' : dn ? 'group-hover:bg-red-950/20' : 'group-hover:bg-navy-800/40';

  return (
    <tr className={`group border-b border-navy-800/60 transition-colors ${bgFlash}`}>
      {/* Pair */}
      <td className="py-2.5 pl-4 pr-3">
        <div className="flex items-center gap-2">
          <span className="text-base">{info?.flag ?? '🌐'}</span>
          <div>
            <div className="text-sm font-bold text-white font-mono">{entry.pair}</div>
            <div className="text-[10px] text-slate-500">{info?.name}</div>
          </div>
        </div>
      </td>

      {/* Bid */}
      <td className="text-right pr-3 font-mono">
        <span className="text-red-400 font-bold text-sm">{fmt4(entry.bid)}</span>
      </td>

      {/* Ask */}
      <td className="text-right pr-3 font-mono">
        <span className="text-emerald-400 font-bold text-sm">{fmt4(entry.ask)}</span>
      </td>

      {/* Mid */}
      <td className="text-right pr-3 font-mono">
        <span className="text-white text-sm">{fmt4(entry.mid)}</span>
      </td>

      {/* Change */}
      <td className="text-right pr-3 font-mono">
        <div className={`flex items-center justify-end gap-1 ${changeColor}`}>
          {up ? <TrendingUp size={12} /> : dn ? <TrendingDown size={12} /> : <Minus size={12} />}
          <span className="text-sm font-bold">{fmtPct(entry.changePercent)}</span>
        </div>
        <div className={`text-[10px] text-right ${changeColor}`}>
          {entry.change >= 0 ? '+' : ''}{entry.change.toFixed(4)}
        </div>
      </td>

      {/* Spread */}
      <td className="text-right pr-4 font-mono">
        <span className="text-slate-400 text-sm">{entry.spreadPips.toFixed(1)}</span>
        <span className="text-[10px] text-slate-600 ml-1">pip</span>
      </td>
    </tr>
  );
}

// ─── Countdown Ring ───────────────────────────────────────────────────────────

function CountdownRing({
  seconds, total,
}: { seconds: number; total: number }) {
  const r     = 18;
  const circ  = 2 * Math.PI * r;
  const fill  = total > 0 ? (seconds / total) * circ : 0;

  const color = seconds > total * 0.5
    ? '#10b981'
    : seconds > total * 0.2
    ? '#f59e0b'
    : '#ef4444';

  return (
    <svg width={44} height={44} className="-rotate-90">
      <circle cx={22} cy={22} r={r} fill="none" stroke="#1e3a5f" strokeWidth={3} />
      <circle
        cx={22} cy={22} r={r}
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeDasharray={circ}
        strokeDashoffset={circ - fill}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.9s' }}
      />
      <text
        x={22} y={22}
        dominantBaseline="middle"
        textAnchor="middle"
        className="rotate-90"
        fill="#e2e8f0"
        fontSize={10}
        fontFamily="monospace"
        transform="rotate(90 22 22)"
      >
        {seconds}s
      </text>
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LivePricer() {
  const { config, setLivePrices } = useAdmin();

  const stream = usePriceStream(config);

  // Feed prices back into AdminContext so forwards/swaps can use them
  useEffect(() => {
    if (stream.prices.length > 0) {
      setLivePrices(stream.prices);
    }
  }, [stream.prices, setLivePrices]);

  const intervalSecs = Math.max(30_000, config.refreshIntervalMs) / 1000;

  // Sort: by currency code
  const sorted = [...stream.prices].sort((a, b) => a.currency.localeCompare(b.currency));

  return (
    <div className="space-y-4">

      {/* ── Header bar ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3 tracking-widest uppercase">
            <Activity size={22} className="text-gold-500" />
            Tableau de Bord — Cours Indicatifs
          </h2>
          <p className="text-slate-400 text-sm mt-0.5">
            14 paires BKAM · Bid / Ask / Mid · Cycle {intervalSecs}s
          </p>
          <div className="mt-1 inline-flex items-center gap-1.5 text-[10px] border border-navy-600/30 text-slate-500 px-2 py-0.5 rounded tracking-wide">
            Cours indicatifs · Non officiels BKAM · Pour conseil : jad2advisory.com
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Status chip */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${
            stream.isRefreshing
              ? 'border-amber-600 bg-amber-950/30 text-amber-400'
              : stream.prices.length > 0
              ? 'border-emerald-700 bg-emerald-950/30 text-emerald-400'
              : 'border-slate-700 bg-slate-900/30 text-slate-400'
          }`}>
            {stream.isRefreshing ? (
              <><RefreshCw size={11} className="animate-spin" /> REFRESHING</>
            ) : stream.prices.length > 0 ? (
              <><Wifi size={11} /> LIVE</>
            ) : (
              <><WifiOff size={11} /> OFFLINE</>
            )}
          </div>

          {/* Countdown */}
          {stream.prices.length > 0 && !stream.isRefreshing && (
            <div className="flex items-center gap-2">
              <CountdownRing seconds={stream.countdown} total={intervalSecs} />
              <div className="text-[10px] text-slate-500 font-mono leading-tight">
                <div>Next refresh</div>
                <div className="text-slate-300">{stream.countdown}s</div>
              </div>
            </div>
          )}

          {/* Manual refresh */}
          <button
            onClick={stream.refresh}
            disabled={stream.isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-navy-800 border border-navy-600 hover:border-gold-600 text-slate-300 hover:text-white rounded text-xs font-medium transition disabled:opacity-50"
          >
            <RefreshCw size={12} className={stream.isRefreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Price table ── */}
      <div className="bg-navy-900 border border-navy-700 rounded-lg overflow-hidden">

        {/* Column headers */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr className="bg-navy-800/60 border-b border-navy-700 text-[10px] uppercase tracking-widest text-slate-500 font-medium">
                <th className="text-left py-2.5 pl-4 pr-3">Pair</th>
                <th className="text-right pr-3">Bid</th>
                <th className="text-right pr-3">Ask</th>
                <th className="text-right pr-3">Mid</th>
                <th className="text-right pr-3">Change %</th>
                <th className="text-right pr-4">Spread</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      {stream.isRefreshing ? (
                        <>
                          <RefreshCw size={28} className="text-gold-500 animate-spin" />
                          <p className="text-slate-400 text-sm">Fetching live rates…</p>
                        </>
                      ) : (
                        <>
                          <WifiOff size={28} className="text-slate-600" />
                          <p className="text-slate-400 text-sm">No data — click Refresh or check connection</p>
                          <button
                            onClick={stream.refresh}
                            className="px-4 py-2 bg-gold-500 text-navy-900 text-xs font-bold rounded hover:bg-gold-400 transition"
                          >
                            Fetch Now
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                sorted.map(entry => (
                  <React.Fragment key={entry.currency}>
                    <PriceRow entry={entry} />
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Stats strip ── */}
      {sorted.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: 'Last Refresh',
              value: stream.lastRefresh
                ? new Date(stream.lastRefresh).toLocaleTimeString('fr-MA', { hour12: false })
                : '—',
            },
            {
              label: 'Tick Count',
              value: String(stream.tickCount),
            },
            {
              label: 'Pairs Live',
              value: `${sorted.length} / 14`,
            },
            {
              label: 'Refresh Interval',
              value: `${intervalSecs}s`,
            },
          ].map(item => (
            <div key={item.label} className="bg-navy-900 border border-navy-700 rounded p-3 text-center">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{item.label}</p>
              <p className="text-sm font-mono font-bold text-white">{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Legal footer ── */}
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-500 font-mono px-1">
          <span><span className="text-red-400 font-bold">BID</span> — cours acheteur indicatif</span>
          <span><span className="text-emerald-400 font-bold">ASK</span> — cours vendeur indicatif</span>
          <span>Source: ECB/Frankfurter API — rafraîchi toutes les {intervalSecs}s</span>
        </div>
        <p className="text-[10px] text-slate-600 px-1">
          Cours indicatifs dérivés des références ECB/Frankfurter. Pour opérations de change ou conseil professionnel : <a href="https://jad2advisory.com" target="_blank" rel="noopener noreferrer" className="text-gold-600 hover:text-gold-400">jad2advisory.com</a>
        </p>
      </div>
    </div>
  );
}
