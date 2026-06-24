import React, { useEffect, useState } from 'react';
import {
  Activity, RefreshCw, TrendingUp, TrendingDown, Minus, Wifi, WifiOff,
  BarChart2, AlertCircle,
} from 'lucide-react';
import { BKAM_CURRENCIES, DEFAULT_BASKET_CONFIG } from '../constants';
import { usePriceStream } from '../hooks/usePriceStream';
import { useAdmin } from '../context/AdminContext';
import { useI18n } from '../context/I18nContext';
import { LivePriceEntry } from '../types';
import { computeDriftModel, DriftRegression } from '../services/driftModel';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt4(v: number) { return v.toFixed(4); }
function fmtPct(v: number) { return (v >= 0 ? '+' : '') + v.toFixed(4) + '%'; }
function fmtBps(v: number) { return (v >= 0 ? '+' : '') + v.toFixed(1) + ' bps'; }

// ─── Price Row ─────────────────────────────────────────────────────────────────

function PriceRow({ entry }: { entry: LivePriceEntry }) {
  const up = entry.change > 0;
  const dn = entry.change < 0;

  const info = BKAM_CURRENCIES.find(c => c.code === entry.currency);

  const changeColor = up ? 'text-emerald-400' : dn ? 'text-red-400' : 'text-slate-500';
  const bgFlash     = up ? 'group-hover:bg-emerald-950/20' : dn ? 'group-hover:bg-red-950/20' : 'group-hover:bg-navy-800/40';

  return (
    <tr className={`group border-b border-navy-800/60 transition-colors ${bgFlash}`}>
      <td className="py-2.5 pl-4 pr-3">
        <div className="flex items-center gap-2">
          <span className="text-base">{info?.flag ?? '🌐'}</span>
          <div>
            <div className="text-sm font-bold text-white font-mono">{entry.pair}</div>
            <div className="text-[10px] text-slate-500">{info?.name}</div>
          </div>
        </div>
      </td>
      <td className="text-right pr-3 font-mono">
        <span className="text-red-400 font-bold text-sm">{fmt4(entry.bid)}</span>
      </td>
      <td className="text-right pr-3 font-mono">
        <span className="text-emerald-400 font-bold text-sm">{fmt4(entry.ask)}</span>
      </td>
      <td className="text-right pr-3 font-mono">
        <span className="text-white text-sm">{fmt4(entry.mid)}</span>
      </td>
      <td className="text-right pr-3 font-mono">
        <div className={`flex items-center justify-end gap-1 ${changeColor}`}>
          {up ? <TrendingUp size={12} /> : dn ? <TrendingDown size={12} /> : <Minus size={12} />}
          <span className="text-sm font-bold">{fmtPct(entry.changePercent)}</span>
        </div>
        <div className={`text-[10px] text-right ${changeColor}`}>
          {entry.change >= 0 ? '+' : ''}{entry.change.toFixed(4)}
        </div>
      </td>
      <td className="text-right pr-4 font-mono">
        <span className="text-slate-400 text-sm">{entry.spreadPips.toFixed(1)}</span>
        <span className="text-[10px] text-slate-600 ml-1">pip</span>
      </td>
    </tr>
  );
}

// ─── Countdown Ring ───────────────────────────────────────────────────────────

function CountdownRing({ seconds, total }: { seconds: number; total: number }) {
  const r    = 18;
  const circ = 2 * Math.PI * r;
  const fill = total > 0 ? (seconds / total) * circ : 0;
  const color = seconds > total * 0.5 ? '#10b981'
    : seconds > total * 0.2 ? '#f59e0b' : '#ef4444';

  return (
    <svg width={44} height={44} className="-rotate-90">
      <circle cx={22} cy={22} r={r} fill="none" stroke="#1e3a5f" strokeWidth={3} />
      <circle cx={22} cy={22} r={r} fill="none" stroke={color} strokeWidth={3}
        strokeDasharray={circ} strokeDashoffset={circ - fill} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.9s' }} />
      <text x={22} y={22} dominantBaseline="middle" textAnchor="middle"
        fill="#e2e8f0" fontSize={10} fontFamily="monospace" transform="rotate(90 22 22)">
        {seconds}s
      </text>
    </svg>
  );
}

// ─── Drift Sparkline ──────────────────────────────────────────────────────────

function DriftSparkline({ model }: { model: DriftRegression }) {
  if (model.points.length < 2) return null;

  const W = 260, H = 60, PAD = 8;
  const drifts = model.points.map(p => p.driftBps);
  const allVals = [...drifts, model.expectedTodayBps];
  const minD = Math.min(...allVals) - 2;
  const maxD = Math.max(...allVals) + 2;
  const range = maxD - minD || 1;
  const n = drifts.length;
  const totalPts = n + 1;

  function px(i: number) { return PAD + (i / (totalPts - 1)) * (W - 2 * PAD); }
  function py(v: number) { return PAD + (1 - (v - minD) / range) * (H - 2 * PAD); }

  const actualPath = drifts
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${px(i).toFixed(1)},${py(v).toFixed(1)}`)
    .join(' ');

  const { alpha, beta } = model;
  const regPath = Array.from({ length: totalPts })
    .map((_, i) => `${i === 0 ? 'M' : 'L'}${px(i).toFixed(1)},${py(alpha + beta * i).toFixed(1)}`)
    .join(' ');

  const zeroY = py(0);
  const lineColor = model.trendDir === 'WIDENING' ? '#f59e0b'
    : model.trendDir === 'NARROWING' ? '#10b981' : '#64748b';

  return (
    <svg width={W} height={H} className="overflow-visible">
      <line x1={PAD} y1={zeroY} x2={W - PAD} y2={zeroY}
        stroke="#334155" strokeWidth={0.5} strokeDasharray="3,2" />
      <path d={regPath} fill="none" stroke={lineColor} strokeWidth={1}
        strokeDasharray="4,2" opacity={0.6} />
      <path d={actualPath} fill="none" stroke="#e2e8f0" strokeWidth={1.5} />
      {drifts.map((v, i) => (
        <circle key={i} cx={px(i)} cy={py(v)} r={3}
          fill={v >= 0 ? '#f59e0b' : '#10b981'} />
      ))}
      <circle cx={px(n)} cy={py(model.expectedTodayBps)} r={4}
        fill={lineColor} stroke="#0f2645" strokeWidth={1.5} opacity={0.9} />
      {model.points.map((pt, i) => (
        <text key={i} x={px(i)} y={H - 1} textAnchor="middle"
          fill="#475569" fontSize={7} fontFamily="monospace">
          {pt.dateLabel.split(' ')[0]}
        </text>
      ))}
      <text x={px(n)} y={H - 1} textAnchor="middle"
        fill={lineColor} fontSize={7} fontFamily="monospace">
        proj
      </text>
    </svg>
  );
}

// ─── Drift Model Panel ────────────────────────────────────────────────────────

function DriftPanel({ corsProxyUrl }: { corsProxyUrl?: string }) {
  const [model, setModel]     = useState<DriftRegression | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    computeDriftModel(5, corsProxyUrl)
      .then(m => { if (!cancelled) { setModel(m); setLoading(false); } })
      .catch(() => { if (!cancelled) { setError(true); setLoading(false); } });

    return () => { cancelled = true; };
  }, [corsProxyUrl]);

  const trendColor = !model ? 'text-slate-400'
    : model.trendDir === 'WIDENING' ? 'text-amber-400'
    : model.trendDir === 'NARROWING' ? 'text-emerald-400'
    : 'text-slate-400';

  const TrendIcon = !model ? Minus
    : model.trendDir === 'WIDENING' ? TrendingUp
    : model.trendDir === 'NARROWING' ? TrendingDown
    : Minus;

  return (
    <div className="bg-navy-900 border border-navy-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BarChart2 size={14} className="text-gold-500" />
          <h3 className="text-[11px] font-bold text-white uppercase tracking-widest">
            BKAM Drift Model — USD/MAD vs Basket Parity
          </h3>
        </div>
        {model && (
          <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${
            model.dataSource === 'BKAM_OFFICIAL'
              ? 'border-emerald-700 bg-emerald-950/30 text-emerald-400'
              : model.dataSource === 'MIXED'
              ? 'border-amber-700 bg-amber-950/30 text-amber-400'
              : 'border-slate-700 bg-slate-900/30 text-slate-400'
          }`}>
            {model.dataSource === 'BKAM_OFFICIAL' ? '✓ BKAM OFFICIAL'
              : model.dataSource === 'MIXED' ? '⚡ MIXED'
              : 'ECB PROXY'}
          </span>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-slate-500 text-xs py-4">
          <RefreshCw size={12} className="animate-spin" /> Computing drift model…
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-slate-500 text-xs py-4">
          <AlertCircle size={12} /> Drift data unavailable
        </div>
      )}

      {model && !loading && model.points.length >= 2 && (
        <>
          <div className="grid grid-cols-4 gap-2 mb-3">
            <div className="bg-navy-800 rounded p-2 text-center">
              <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">Latest Drift</p>
              <p className={`text-sm font-mono font-bold ${
                Math.abs(model.latestDriftBps) < 10 ? 'text-emerald-400'
                : Math.abs(model.latestDriftBps) < 25 ? 'text-amber-400'
                : 'text-red-400'
              }`}>{fmtBps(model.latestDriftBps)}</p>
            </div>
            <div className="bg-navy-800 rounded p-2 text-center">
              <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">Trend</p>
              <div className={`flex items-center justify-center gap-1 text-sm font-mono font-bold ${trendColor}`}>
                <TrendIcon size={12} />
                <span>{fmtBps(model.beta)}/d</span>
              </div>
            </div>
            <div className="bg-navy-800 rounded p-2 text-center">
              <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">Projected</p>
              <p className="text-sm font-mono font-bold text-white">{fmtBps(model.expectedTodayBps)}</p>
            </div>
            <div className="bg-navy-800 rounded p-2 text-center">
              <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">R²</p>
              <p className="text-sm font-mono font-bold text-slate-300">{model.r2.toFixed(2)}</p>
            </div>
          </div>

          <div className="flex items-center justify-center py-1">
            <DriftSparkline model={model} />
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-2 text-[9px] text-slate-500 font-mono">
            <span>— Actual drift &nbsp; - - Regression trend &nbsp; ● Projected</span>
            <span>▲ Positive = MAD weaker than basket &nbsp; ▼ Negative = MAD stronger</span>
          </div>
        </>
      )}

      {model && !loading && model.points.length < 2 && (
        <p className="text-slate-500 text-xs py-2">Insufficient data (need ≥2 trading days)</p>
      )}

      <p className="text-[9px] text-slate-600 mt-2">
        Drift = (BKAM fix − basket parity) × 10 000 bps · Model: USD/MAD = {DEFAULT_BASKET_CONFIG.referenceBasketValue} / (0.60 × EUR/USD + 0.40) · OLS linear regression
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LivePricer() {
  const { config, setLivePrices } = useAdmin();
  const { locale } = useI18n();
  const stream = usePriceStream(config);

  useEffect(() => {
    if (stream.prices.length > 0) setLivePrices(stream.prices);
  }, [stream.prices, setLivePrices]);

  const intervalSecs = Math.max(30_000, config.refreshIntervalMs) / 1000;
  const sorted = [...stream.prices].sort((a, b) => a.currency.localeCompare(b.currency));

  return (
    <div className="space-y-4">

      {/* ── Header bar ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3 tracking-widest uppercase">
            <Activity size={22} className="text-gold-500" />
            {locale === 'ar' ? 'لوحة التداول — أسعار استرشادية' : locale === 'en' ? 'Trading Board — Indicative Rates' : 'Tableau de Bord — Cours Indicatifs'}
          </h2>
          <p className="text-slate-400 text-sm mt-0.5">
            {locale === 'ar' ? `20 زوج BKAM · شراء / بيع / وسط · دورة ${intervalSecs}ث` : locale === 'en' ? `20 BKAM pairs · Bid / Ask / Mid · Cycle ${intervalSecs}s` : `20 paires BKAM · Bid / Ask / Mid · Cycle ${intervalSecs}s`}
          </p>
          <div className="mt-1 inline-flex items-center gap-1.5 text-[10px] border border-navy-600/30 text-slate-500 px-2 py-0.5 rounded tracking-wide">
            {locale === 'ar' ? 'أسعار استرشادية · غير رسمية BKAM · للتدريب والاستشارة الاستراتيجية: jad2advisory.com' : locale === 'en' ? 'Indicative rates · Not official BKAM · Strategic consulting & training: jad2advisory.com' : 'Cours indicatifs · Non officiels BKAM · Conseil stratégique & formation : jad2advisory.com'}
          </div>
        </div>

        <div className="flex items-center gap-4">
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

          {stream.prices.length > 0 && !stream.isRefreshing && (
            <div className="flex items-center gap-2">
              <CountdownRing seconds={stream.countdown} total={intervalSecs} />
              <div className="text-[10px] text-slate-500 font-mono leading-tight">
                <div>Next refresh</div>
                <div className="text-slate-300">{stream.countdown}s</div>
              </div>
            </div>
          )}

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
                          <button onClick={stream.refresh}
                            className="px-4 py-2 bg-gold-500 text-navy-900 text-xs font-bold rounded hover:bg-gold-400 transition">
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
            { label: 'Tick Count', value: String(stream.tickCount) },
            { label: locale === 'ar' ? 'أزواج نشطة' : locale === 'en' ? 'Pairs Live' : 'Paires actives', value: `${sorted.length} / 20` },
            { label: 'Refresh Interval', value: `${intervalSecs}s` },
          ].map(item => (
            <div key={item.label} className="bg-navy-900 border border-navy-700 rounded p-3 text-center">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{item.label}</p>
              <p className="text-sm font-mono font-bold text-white">{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── BKAM Drift Model ── */}
      <DriftPanel corsProxyUrl={config.corsProxyUrl || undefined} />

      {/* ── Legal footer ── */}
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-500 font-mono px-1">
          <span><span className="text-red-400 font-bold">BID</span> — {locale === 'ar' ? 'سعر الشراء الاسترشادي' : locale === 'en' ? 'indicative buy rate' : 'cours acheteur indicatif'}</span>
          <span><span className="text-emerald-400 font-bold">ASK</span> — {locale === 'ar' ? 'سعر البيع الاسترشادي' : locale === 'en' ? 'indicative sell rate' : 'cours vendeur indicatif'}</span>
          <span>{locale === 'ar' ? `المصدر: BCR/Frankfurter API — تحديث كل ${intervalSecs}ث` : locale === 'en' ? `Source: ECB/Frankfurter API — refreshed every ${intervalSecs}s` : `Source: ECB/Frankfurter API — rafraîchi toutes les ${intervalSecs}s`}</span>
        </div>
        <p className="text-[10px] text-slate-600 px-1">
          Cours indicatifs dérivés des références ECB/Frankfurter. Pour formation en gestion du risque de change et accompagnement stratégique :{' '}
          <a href="https://jad2advisory.com" target="_blank" rel="noopener noreferrer" className="text-gold-600 hover:text-gold-400">jad2advisory.com</a>
        </p>
      </div>
    </div>
  );
}
