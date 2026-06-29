import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Shield, LogOut, Settings, Activity, BarChart2, TrendingUp,
  AlertTriangle, FileText, RefreshCw, Lock, Eye, EyeOff,
  ChevronDown, RotateCcw, Plus, Trash2, CheckCircle, XCircle,
  ClipboardList, Bot, Send, Search,
} from 'lucide-react';
import { BKAM_CURRENCIES } from '../constants';
import { useAdmin, DEFAULT_TIER_COMMISSIONS } from '../context/AdminContext';
import { getDefaultCurve, CURVE_META } from '../services/interestRates';
import { STANDARD_TENORS } from '../services/forwardEngine';
import { BlotterEntry, ClientTier, TierConfig, AuditEntry } from '../types';
import { routeQuery, getAvailableProviders, PROVIDER_LABELS, PROVIDER_COLORS } from '../services/llmRouter';
import ReportsAdmin from './admin/ReportsAdmin';
import CurrencyFlag from './CurrencyFlag';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FMT4 = (v: number) => v.toFixed(4);
const FMT_PCT = (v: number) => (v * 100).toFixed(3) + '%';
const FMT_MAD = (v: number) =>
  new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 }).format(v);

const ACTION_COLOR: Record<string, string> = {
  SPOT:     'text-blue-400 bg-blue-900/30',
  FORWARD:  'text-gold-400 bg-yellow-900/30',
  SWAP:     'text-purple-400 bg-purple-900/30',
  ROLL:     'text-orange-400 bg-orange-900/30',
  OVERRIDE: 'text-red-400 bg-red-900/30',
  ALERT:    'text-pink-400 bg-pink-900/30',
};

// ─── Login Gate ───────────────────────────────────────────────────────────────

function LoginGate({ onLogin }: { onLogin: (pw: string) => Promise<boolean> }) {
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const ok = await onLogin(pw);
      if (ok) { setErr(false); }
      else { setErr(true); setPw(''); }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center justify-center py-24">
      <div className="bg-navy-900 border border-navy-700 rounded-xl p-10 w-80 space-y-6">
        <div className="text-center">
          <div className="w-14 h-14 bg-gold-500/10 border border-gold-600/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={24} className="text-gold-500" />
          </div>
          <h2 className="text-lg font-serif font-bold text-white">Admin Access</h2>
          <p className="text-xs text-slate-500 mt-1">Enter your admin passcode</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              value={pw}
              onChange={e => { setPw(e.target.value); setErr(false); }}
              placeholder="Passcode"
              className={`w-full bg-navy-800 border rounded px-3 py-2.5 text-white text-sm focus:outline-none font-mono tracking-widest ${
                err ? 'border-red-500' : 'border-navy-600 focus:border-gold-500'
              }`}
            />
            <button
              type="button"
              onClick={() => setShow(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            >
              {show ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          {err && <p className="text-xs text-red-400">Invalid passcode</p>}
          <button
            type="submit"
            className="w-full py-2.5 bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold text-sm rounded transition"
          >
            Authenticate
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Tab Button ───────────────────────────────────────────────────────────────

function TabBtn({
  label, icon: Icon, active, onClick,
}: { label: string; icon: React.ElementType; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wider transition whitespace-nowrap border-b-2 ${
        active
          ? 'border-gold-500 text-gold-400'
          : 'border-transparent text-slate-500 hover:text-slate-300'
      }`}
    >
      <Icon size={12} />
      {label}
    </button>
  );
}

// ─── SYSTEM Tab ───────────────────────────────────────────────────────────────

function SystemTab() {
  const { config, updateConfig, livePrices, lastPriceUpdate } = useAdmin();
  const intervalSecs = Math.round(config.refreshIntervalMs / 1000);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Live Mode', value: config.isLive ? 'ENABLED' : 'DISABLED',
            color: config.isLive ? 'text-emerald-400' : 'text-red-400' },
          { label: 'Last Price Update',
            value: lastPriceUpdate ? new Date(lastPriceUpdate).toLocaleTimeString('fr-MA', { hour12: false }) : '—',
            color: 'text-slate-300' },
          { label: 'Pairs Loaded', value: `${livePrices.length} / 14`, color: 'text-slate-300' },
          { label: 'Refresh Interval', value: `${intervalSecs}s`, color: 'text-gold-400' },
        ].map(item => (
          <div key={item.label} className="bg-navy-800 border border-navy-600 rounded p-3">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{item.label}</p>
            <p className={`text-sm font-mono font-bold ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Live toggle */}
      <div className="bg-navy-800 border border-navy-600 rounded p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-white">Live Mode</p>
          <p className="text-xs text-slate-500">Controls whether rates stream from Frankfurter API</p>
        </div>
        <button
          onClick={() => updateConfig({ isLive: !config.isLive })}
          className={`w-12 h-6 rounded-full relative transition-colors ${config.isLive ? 'bg-emerald-600' : 'bg-slate-700'}`}
        >
          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${config.isLive ? 'left-6' : 'left-0.5'}`} />
        </button>
      </div>

      {/* Refresh interval slider */}
      <div className="bg-navy-800 border border-navy-600 rounded p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-white">Refresh Interval</p>
            <p className="text-xs text-slate-500">How often to poll Frankfurter API for new rates</p>
          </div>
          <span className="text-gold-400 font-mono font-bold text-lg">{intervalSecs}s</span>
        </div>
        <input
          type="range"
          min={30}
          max={300}
          step={15}
          value={intervalSecs}
          onChange={e => updateConfig({ refreshIntervalMs: Number(e.target.value) * 1000 })}
          className="w-full accent-gold-500"
        />
        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
          <span>30s (min)</span>
          <span>1m</span>
          <span>2m (default)</span>
          <span>5m (max)</span>
        </div>
      </div>

      {/* CORS Proxy URL */}
      <div className="bg-navy-800 border border-navy-600 rounded p-4 space-y-2">
        <div>
          <p className="text-sm font-bold text-white">Yahoo Finance CORS Proxy</p>
          <p className="text-xs text-slate-500">Optional Cloudflare Worker URL to proxy Yahoo Finance requests (e.g. https://your-worker.workers.dev)</p>
        </div>
        <input
          type="url"
          value={config.corsProxyUrl ?? ''}
          onChange={e => updateConfig({ corsProxyUrl: e.target.value })}
          placeholder="https://your-cf-worker.workers.dev"
          className="w-full bg-navy-900 border border-navy-600 rounded px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-gold-500 placeholder:text-slate-600"
        />
        {config.corsProxyUrl && (
          <p className="text-[10px] text-emerald-400">✓ Proxy configured — commodities will use this URL</p>
        )}
      </div>
    </div>
  );
}

// ─── RATES Tab ────────────────────────────────────────────────────────────────

function RatesTab() {
  const { config, updateConfig, livePrices } = useAdmin();
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  const handleSetOverride = (code: string) => {
    const v = parseFloat(editValues[code] ?? '');
    if (isNaN(v) || v <= 0) return;
    updateConfig({ spotOverrides: { ...config.spotOverrides, [code]: v } });
    setEditValues(prev => { const n = { ...prev }; delete n[code]; return n; });
  };

  const handleClear = (code: string) => {
    const next = { ...config.spotOverrides };
    delete next[code];
    updateConfig({ spotOverrides: next });
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">
        Override spot rates manually. Live market rates are used when no override is set.
      </p>
      <div className="overflow-x-auto rounded border border-navy-700">
        <table className="w-full text-xs font-mono min-w-[520px]">
          <thead>
            <tr className="bg-navy-800 text-slate-500 uppercase text-[10px] border-b border-navy-700">
              {['Pair', 'Live Mid', 'Override', '', 'Status'].map(h => (
                <th key={h} className="text-left py-2.5 px-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BKAM_CURRENCIES.map(c => {
              const live     = livePrices.find(p => p.currency === c.code);
              const override = config.spotOverrides[c.code];
              const hasOvr   = override !== undefined;
              return (
                <tr key={c.code} className="border-b border-navy-800 hover:bg-navy-800/40">
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <CurrencyFlag countryCode={c.countryCode} size="xs" />
                      <span className="text-white font-bold">{c.code}/MAD</span>
                    </div>
                  </td>
                  <td className="px-3 text-slate-300">
                    {live ? FMT4(live.mid) : <span className="text-slate-600">—</span>}
                  </td>
                  <td className="px-3">
                    <input
                      type="number"
                      step="0.0001"
                      value={editValues[c.code] ?? (hasOvr ? String(override) : '')}
                      onChange={e => setEditValues(prev => ({ ...prev, [c.code]: e.target.value }))}
                      placeholder={live ? FMT4(live.mid) : 'e.g. 10.8234'}
                      className="w-28 bg-navy-900 border border-navy-600 rounded px-2 py-1 text-white focus:outline-none focus:border-gold-500"
                    />
                  </td>
                  <td className="px-3 space-x-1">
                    <button
                      onClick={() => handleSetOverride(c.code)}
                      className="px-2 py-1 bg-gold-500 text-navy-900 rounded text-[10px] font-bold hover:bg-gold-400 transition"
                    >
                      Set
                    </button>
                    {hasOvr && (
                      <button
                        onClick={() => handleClear(c.code)}
                        className="px-2 py-1 bg-navy-700 border border-navy-500 text-slate-300 rounded text-[10px] hover:text-red-400 transition"
                      >
                        Clear
                      </button>
                    )}
                  </td>
                  <td className="px-3">
                    {hasOvr ? (
                      <span className="text-amber-400 text-[10px] font-bold">OVERRIDE {FMT4(override!)}</span>
                    ) : (
                      <span className="text-slate-600 text-[10px]">market</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── CURVES Tab ───────────────────────────────────────────────────────────────

function CurvesTab() {
  const { config, updateConfig } = useAdmin();
  const [selCcy, setSelCcy] = useState('MAD');

  const allCurrencies = ['MAD', ...BKAM_CURRENCIES.map(c => c.code)];
  const defaultCurve  = useMemo(() => getDefaultCurve(selCcy), [selCcy]);
  const overrides     = config.curveOverrides[selCcy] ?? {};
  const meta          = CURVE_META[selCcy] ?? { label: selCcy, benchmark: selCcy };

  const handleRateChange = (tenor: string, raw: string) => {
    const v = parseFloat(raw);
    if (isNaN(v)) return;
    const next = { ...config.curveOverrides, [selCcy]: { ...overrides, [tenor]: v / 100 } };
    updateConfig({ curveOverrides: next });
  };

  const handleResetTenor = (tenor: string) => {
    const next = { ...overrides };
    delete next[tenor];
    updateConfig({ curveOverrides: { ...config.curveOverrides, [selCcy]: next } });
  };

  const handleResetAll = () => {
    const next = { ...config.curveOverrides };
    delete next[selCcy];
    updateConfig({ curveOverrides: next });
  };

  const hasAnyOverride = Object.keys(overrides).length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs text-slate-500">
            Edit yield curve rates used for CIP forward pricing. Rates in % p.a.
          </p>
          <p className="text-[10px] text-slate-600 mt-0.5">{meta.label} — {meta.benchmark}</p>
        </div>
        <div className="flex items-center gap-3">
          {hasAnyOverride && (
            <button
              onClick={handleResetAll}
              className="text-xs text-slate-400 hover:text-red-400 transition flex items-center gap-1"
            >
              <RotateCcw size={11} /> Reset All
            </button>
          )}
          <div className="relative">
            <select
              value={selCcy}
              onChange={e => setSelCcy(e.target.value)}
              className="appearance-none bg-navy-800 border border-navy-600 text-white text-sm rounded px-3 py-1.5 pr-7 focus:outline-none focus:border-gold-500"
            >
              {allCurrencies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {defaultCurve.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-8">No default curve for {selCcy}</p>
      ) : (
        <div className="overflow-x-auto rounded border border-navy-700">
          <table className="w-full text-xs font-mono min-w-[400px]">
            <thead>
              <tr className="bg-navy-800 text-slate-500 uppercase text-[10px] border-b border-navy-700">
                {['Tenor', 'Default %', 'Override %', 'Effective %', ''].map(h => (
                  <th key={h} className="text-left py-2.5 px-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {defaultCurve.map(pt => {
                const ovr = overrides[pt.tenor];
                const eff = ovr !== undefined ? ovr : pt.rate;
                const hasOvr = ovr !== undefined;
                return (
                  <tr key={pt.tenor} className={`border-b border-navy-800 hover:bg-navy-800/40 ${hasOvr ? 'bg-amber-950/10' : ''}`}>
                    <td className={`py-2 px-3 font-bold ${hasOvr ? 'text-amber-400' : 'text-white'}`}>{pt.tenor}</td>
                    <td className="px-3 text-slate-500">{(pt.rate * 100).toFixed(3)}</td>
                    <td className="px-3">
                      <input
                        type="number"
                        step="0.001"
                        defaultValue={hasOvr ? (ovr! * 100).toFixed(3) : ''}
                        placeholder={(pt.rate * 100).toFixed(3)}
                        onBlur={e => handleRateChange(pt.tenor, e.target.value)}
                        className="w-20 bg-navy-900 border border-navy-600 rounded px-2 py-0.5 text-white focus:outline-none focus:border-amber-500"
                      />
                    </td>
                    <td className={`px-3 font-bold ${hasOvr ? 'text-amber-400' : 'text-slate-300'}`}>
                      {(eff * 100).toFixed(3)}%
                    </td>
                    <td className="px-3">
                      {hasOvr && (
                        <button
                          onClick={() => handleResetTenor(pt.tenor)}
                          className="text-slate-600 hover:text-red-400 transition"
                        >
                          <RotateCcw size={11} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── FORWARDS Tab ─────────────────────────────────────────────────────────────

function ForwardsTab() {
  const { config, updateConfig } = useAdmin();

  return (
    <div className="space-y-5">
      <p className="text-xs text-slate-500">
        Forward markup adds basis points on top of the CIP forward rate, widening the dealer's spread.
      </p>

      {/* Markup slider */}
      <div className="bg-navy-800 border border-navy-600 rounded p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-white">Forward Markup</p>
            <p className="text-xs text-slate-500">Applied to all forward calculations</p>
          </div>
          <span className="text-gold-400 font-mono font-bold text-xl">{config.forwardMarkupBps} bps</span>
        </div>
        <input
          type="range" min={0} max={100} step={1}
          value={config.forwardMarkupBps}
          onChange={e => updateConfig({ forwardMarkupBps: Number(e.target.value) })}
          className="w-full accent-gold-500"
        />
        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
          <span>0 bps (raw CIP)</span><span>25 bps</span><span>50 bps</span><span>100 bps</span>
        </div>
      </div>

      {/* Dealer spread pips */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dealer Spread Pips (per currency)</p>
        <div className="overflow-x-auto rounded border border-navy-700">
          <table className="w-full text-xs font-mono min-w-[400px]">
            <thead>
              <tr className="bg-navy-800 text-slate-500 text-[10px] uppercase border-b border-navy-700">
                <th className="text-left py-2 px-3">Currency</th>
                <th className="text-right px-3">Total Pips</th>
                <th className="text-right px-3">Half-Spread</th>
                <th className="px-3 w-40">Adjust</th>
              </tr>
            </thead>
            <tbody>
              {BKAM_CURRENCIES.map(c => {
                const pips = config.dealerSpreadPips?.[c.code] ?? 8;
                return (
                  <tr key={c.code} className="border-b border-navy-800 hover:bg-navy-800/40">
                    <td className="py-1.5 px-3">
                      <CurrencyFlag countryCode={c.countryCode} size="xs" />
                      <span className="text-white font-bold">{c.code}</span>
                    </td>
                    <td className="text-right px-3 text-gold-400 font-bold">{pips}</td>
                    <td className="text-right px-3 text-slate-400">±{pips / 2}</td>
                    <td className="px-3">
                      <input
                        type="range" min={1} max={50} step={1}
                        value={pips}
                        onChange={e => updateConfig({
                          dealerSpreadPips: {
                            ...config.dealerSpreadPips,
                            [c.code]: Number(e.target.value),
                          },
                        })}
                        className="w-full accent-gold-500"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── SPREADS Tab ──────────────────────────────────────────────────────────────

function SpreadsTab() {
  const { config, updateConfig } = useAdmin();

  const virPct = (config.virementSpreadPct * 100).toFixed(2);
  const bilPct = (config.billetSpreadPct * 100).toFixed(2);

  return (
    <div className="space-y-5">
      <p className="text-xs text-slate-500">
        Controls the BKAM-style spread applied to spot rates for the FX Dashboard.
      </p>

      {[
        {
          key: 'virementSpreadPct' as const,
          label: 'Virement Spread',
          value: config.virementSpreadPct,
          display: virPct + '%',
          desc: 'Wire transfer spread (±0.8% each side by default)',
          min: 0.1, max: 3, step: 0.05,
        },
        {
          key: 'billetSpreadPct' as const,
          label: 'Billet Spread',
          value: config.billetSpreadPct,
          display: bilPct + '%',
          desc: 'Cash banknote spread (±1.8% each side by default)',
          min: 0.1, max: 5, step: 0.1,
        },
      ].map(item => (
        <div key={item.key} className="bg-navy-800 border border-navy-600 rounded p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white">{item.label}</p>
              <p className="text-xs text-slate-500">{item.desc}</p>
            </div>
            <span className="text-gold-400 font-mono font-bold text-xl">{item.display}</span>
          </div>
          <input
            type="range"
            min={item.min} max={item.max} step={item.step}
            value={item.value * 100}
            onChange={e => updateConfig({ [item.key]: Number(e.target.value) / 100 })}
            className="w-full accent-gold-500"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>{item.min}%</span><span>{item.max / 2}%</span><span>{item.max}%</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── ALERTS Tab ───────────────────────────────────────────────────────────────

function AlertsTab() {
  const { config, updateConfig } = useAdmin();
  const [newPair, setNewPair] = useState('');
  const [newMin, setNewMin]   = useState('');
  const [newMax, setNewMax]   = useState('');

  const thresholds = config.alertThresholds ?? [];

  const toggle = (i: number) => {
    const next = thresholds.map((t, j) => j === i ? { ...t, enabled: !t.enabled } : t);
    updateConfig({ alertThresholds: next });
  };

  const remove = (i: number) => {
    updateConfig({ alertThresholds: thresholds.filter((_, j) => j !== i) });
  };

  const add = () => {
    const min = parseFloat(newMin);
    const max = parseFloat(newMax);
    if (!newPair || isNaN(min) || isNaN(max) || min >= max) return;
    updateConfig({ alertThresholds: [...thresholds, { pair: newPair, min, max, enabled: true }] });
    setNewPair(''); setNewMin(''); setNewMax('');
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">
        Set price alert thresholds. Alerts trigger when mid rate moves outside the [min, max] band.
      </p>

      <div className="overflow-x-auto rounded border border-navy-700">
        <table className="w-full text-xs font-mono min-w-[480px]">
          <thead>
            <tr className="bg-navy-800 text-slate-500 text-[10px] uppercase border-b border-navy-700">
              {['Pair', 'Min', 'Max', 'Status', 'Toggle', ''].map(h => (
                <th key={h} className="text-left py-2.5 px-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {thresholds.map((t, i) => (
              <tr key={i} className="border-b border-navy-800 hover:bg-navy-800/40">
                <td className="py-2 px-3 font-bold text-white">{t.pair}</td>
                <td className="px-3 text-emerald-400">{t.min}</td>
                <td className="px-3 text-red-400">{t.max}</td>
                <td className="px-3">
                  {t.enabled
                    ? <span className="text-emerald-400 flex items-center gap-1"><CheckCircle size={11} /> Active</span>
                    : <span className="text-slate-500 flex items-center gap-1"><XCircle size={11} /> Off</span>
                  }
                </td>
                <td className="px-3">
                  <button
                    onClick={() => toggle(i)}
                    className={`w-10 h-5 rounded-full relative transition-colors ${t.enabled ? 'bg-emerald-600' : 'bg-slate-700'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${t.enabled ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </td>
                <td className="px-3">
                  <button onClick={() => remove(i)} className="text-slate-600 hover:text-red-400">
                    <Trash2 size={11} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add new */}
      <div className="bg-navy-800 border border-navy-600 rounded p-4 space-y-3">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <Plus size={11} /> Add Alert
        </p>
        <div className="grid grid-cols-4 gap-2">
          {[
            { placeholder: 'Pair e.g. EUR/MAD', value: newPair, set: setNewPair },
            { placeholder: 'Min rate', value: newMin, set: setNewMin },
            { placeholder: 'Max rate', value: newMax, set: setNewMax },
          ].map((f, i) => (
            <input
              key={i}
              value={f.value}
              onChange={e => f.set(e.target.value)}
              placeholder={f.placeholder}
              className="bg-navy-900 border border-navy-600 text-white text-xs rounded px-2 py-1.5 focus:outline-none focus:border-gold-500 font-mono col-span-1"
            />
          ))}
          <button
            onClick={add}
            className="px-3 py-1.5 bg-gold-500 text-navy-900 text-xs font-bold rounded hover:bg-gold-400 transition"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── BLOTTER Tab ──────────────────────────────────────────────────────────────

function BlotterTab() {
  const { blotter, clearBlotter, addBlotterEntry } = useAdmin();
  const [filter, setFilter] = useState<string>('ALL');

  const actions = ['ALL', 'SPOT', 'FORWARD', 'SWAP', 'ROLL', 'OVERRIDE', 'ALERT'] as const;

  const filtered = filter === 'ALL'
    ? blotter
    : blotter.filter(e => e.action === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 flex-wrap">
          {actions.map(a => (
            <button
              key={a}
              onClick={() => setFilter(a)}
              className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded transition ${
                filter === a ? 'bg-gold-500 text-navy-900' : 'bg-navy-800 text-slate-400 border border-navy-600 hover:text-white'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
        <button
          onClick={clearBlotter}
          className="text-xs text-slate-500 hover:text-red-400 transition flex items-center gap-1"
        >
          <Trash2 size={11} /> Clear All
        </button>
      </div>

      <div className="overflow-x-auto rounded border border-navy-700">
        <table className="w-full text-xs font-mono min-w-[600px]">
          <thead>
            <tr className="bg-navy-800 text-slate-500 text-[10px] uppercase border-b border-navy-700">
              {['Time', 'Action', 'Pair', 'Tenor', 'Rate', 'Fwd Pts', 'Notional', 'Details'].map(h => (
                <th key={h} className="text-left py-2.5 px-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-600">
                  No entries {filter !== 'ALL' && `for ${filter}`}
                </td>
              </tr>
            ) : (
              filtered.map(entry => (
                <tr key={entry.id} className="border-b border-navy-800 hover:bg-navy-800/40">
                  <td className="py-1.5 px-3 text-slate-500 text-[10px]">
                    {new Date(entry.time).toLocaleTimeString('fr-MA', { hour12: false })}
                  </td>
                  <td className="px-3">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${ACTION_COLOR[entry.action] ?? 'text-slate-400'}`}>
                      {entry.action}
                    </span>
                  </td>
                  <td className="px-3 text-white font-bold">{entry.pair}</td>
                  <td className="px-3 text-slate-400">{entry.tenor ?? '—'}</td>
                  <td className="px-3 text-gold-400">{entry.rate.toFixed(4)}</td>
                  <td className="px-3">
                    {entry.fwdPtsPips !== undefined ? (
                      <span className={entry.fwdPtsPips >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                        {entry.fwdPtsPips >= 0 ? '+' : ''}{entry.fwdPtsPips.toFixed(2)}
                      </span>
                    ) : <span className="text-slate-600">—</span>}
                  </td>
                  <td className="px-3 text-slate-300">
                    {entry.notional ? FMT_MAD(entry.notional) : '—'}
                  </td>
                  <td className="px-3 text-slate-500 max-w-[180px] truncate" title={entry.details}>
                    {entry.details ?? '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── PRICING Tab ─────────────────────────────────────────────────────────────

const TIER_ORDER: ClientTier[] = ['CORPORATE', 'SME', 'TPE', 'INDIVIDUAL'];
const TIER_COLORS: Record<ClientTier, string> = {
  CORPORATE: 'border-purple-700/50 bg-purple-950/20',
  SME:       'border-blue-700/50 bg-blue-950/20',
  TPE:       'border-amber-700/50 bg-amber-950/20',
  INDIVIDUAL:'border-slate-600/50 bg-slate-900/20',
};
const TIER_LABEL_COLORS: Record<ClientTier, string> = {
  CORPORATE: 'text-purple-400',
  SME:       'text-blue-400',
  TPE:       'text-amber-400',
  INDIVIDUAL:'text-slate-300',
};

function PricingTab() {
  const { config, updateConfig, livePrices } = useAdmin();
  const tiers = config.tierCommissions ?? DEFAULT_TIER_COMMISSIONS;

  // Use EUR/MAD from live prices or fallback
  const eurMadBase = livePrices.find(p => p.currency === 'EUR')?.mid ?? 10.82;
  const virSpread  = config.virementSpreadPct;
  const bilSpread  = config.billetSpreadPct;

  const updateTier = (tier: ClientTier, patch: Partial<TierConfig>) => {
    updateConfig({
      tierCommissions: {
        ...tiers,
        [tier]: { ...tiers[tier], ...patch },
      },
    });
  };

  const resetTier = (tier: ClientTier) => {
    updateConfig({
      tierCommissions: {
        ...tiers,
        [tier]: DEFAULT_TIER_COMMISSIONS[tier],
      },
    });
  };

  const calcRate = (base: number, spreadPct: number, commBps: number, side: 'buy' | 'sell') => {
    const totalPct = spreadPct + commBps / 10000;
    return side === 'sell' ? base * (1 + totalPct) : base * (1 - totalPct);
  };

  return (
    <div className="space-y-5">
      <div className="bg-navy-800 border border-navy-600 rounded p-4">
        <p className="text-xs font-bold text-white mb-1 flex items-center gap-2">
          <RefreshCw size={12} className="text-gold-400" />
          Base Rate (EUR/MAD Live)
        </p>
        <p className="text-2xl font-mono font-bold text-gold-400">{eurMadBase.toFixed(4)}</p>
        <p className="text-[10px] text-slate-500 mt-0.5">
          Virement base spread: {(virSpread * 100).toFixed(2)}% · Billet base spread: {(bilSpread * 100).toFixed(2)}%
          · Configure in SPREADS tab
        </p>
      </div>

      <p className="text-xs text-slate-500">
        Commercial commission in basis points (bps) added on top of the BKAM base spread per client segment.
        1 bps = 0.01%. These are admin-configurable and not disclosed to end users beyond the quoted rate.
      </p>

      {TIER_ORDER.map(tier => {
        const t = tiers[tier];
        const virSell = calcRate(eurMadBase, virSpread, t.virementCommBps, 'sell');
        const virBuy  = calcRate(eurMadBase, virSpread, t.virementCommBps, 'buy');
        const bilSell = calcRate(eurMadBase, bilSpread, t.billetCommBps,   'sell');
        const bilBuy  = calcRate(eurMadBase, bilSpread, t.billetCommBps,   'buy');
        const totalVirPct = ((virSpread + t.virementCommBps / 10000) * 100).toFixed(3);
        const totalBilPct = ((bilSpread + t.billetCommBps / 10000) * 100).toFixed(3);

        return (
          <div key={tier} className={`border rounded-lg p-4 space-y-4 ${TIER_COLORS[tier]}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-bold uppercase tracking-wider ${TIER_LABEL_COLORS[tier]}`}>{t.label}</p>
                <p className="text-[11px] text-slate-400">{t.description}</p>
              </div>
              <button
                onClick={() => resetTier(tier)}
                className="text-[10px] text-slate-500 hover:text-amber-400 flex items-center gap-1 transition"
              >
                <RotateCcw size={10} /> Reset
              </button>
            </div>

            {/* Live rate preview */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-navy-900/60 rounded p-3">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Virement EUR/MAD</p>
                <div className="flex justify-between font-mono text-sm">
                  <span className="text-emerald-400 font-bold">{virBuy.toFixed(4)}</span>
                  <span className="text-[10px] text-slate-500 self-center">↔</span>
                  <span className="text-red-400 font-bold">{virSell.toFixed(4)}</span>
                </div>
                <p className="text-[9px] text-slate-500 mt-0.5">Buy / Sell · Total spread: {totalVirPct}%</p>
              </div>
              <div className="bg-navy-900/60 rounded p-3">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Billet EUR/MAD</p>
                <div className="flex justify-between font-mono text-sm">
                  <span className="text-emerald-400 font-bold">{bilBuy.toFixed(4)}</span>
                  <span className="text-[10px] text-slate-500 self-center">↔</span>
                  <span className="text-red-400 font-bold">{bilSell.toFixed(4)}</span>
                </div>
                <p className="text-[9px] text-slate-500 mt-0.5">Buy / Sell · Total spread: {totalBilPct}%</p>
              </div>
            </div>

            {/* Sliders */}
            <div className="space-y-3">
              {[
                {
                  label: 'Virement Commission',
                  value: t.virementCommBps,
                  key: 'virementCommBps' as const,
                  min: 0, max: 300, color: 'text-emerald-400',
                },
                {
                  label: 'Billet Commission',
                  value: t.billetCommBps,
                  key: 'billetCommBps' as const,
                  min: 0, max: 500, color: 'text-amber-400',
                },
                {
                  label: 'Forward Markup',
                  value: t.forwardMarkupBps,
                  key: 'forwardMarkupBps' as const,
                  min: 0, max: 200, color: 'text-purple-400',
                },
              ].map(item => (
                <div key={item.key} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">{item.label}</span>
                    <span className={`text-xs font-mono font-bold ${item.color}`}>
                      {item.value} bps ({(item.value / 100).toFixed(2)}%)
                    </span>
                  </div>
                  <input
                    type="range"
                    min={item.min} max={item.max} step={5}
                    value={item.value}
                    onChange={e => updateTier(tier, { [item.key]: Number(e.target.value) })}
                    className="w-full accent-gold-500 h-1"
                  />
                  <div className="flex justify-between text-[9px] text-slate-600 font-mono">
                    <span>0</span><span>{item.max / 2} bps</span><span>{item.max} bps</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="bg-amber-950/30 border border-amber-800/40 rounded p-3">
        <p className="text-[10px] text-amber-400 leading-relaxed">
          ⚠️ Ces commissions sont des paramètres internes. Les cours publiés aux clients sont les cours finaux (base + spread + commission).
          Conformément à la réglementation OC, les intermédiaires agréés doivent afficher leurs grilles tarifaires dans leurs locaux.
          JAD2FX est un outil pédagogique — ces paramètres ne constituent pas des cours contraignants.
        </p>
      </div>
    </div>
  );
}

// ─── AUDIT Tab ────────────────────────────────────────────────────────────────

const AUDIT_ACTION_COLOR: Record<string, string> = {
  CONFIG_UPDATE: 'text-blue-400 bg-blue-900/30',
  LOGIN:         'text-emerald-400 bg-emerald-900/30',
  LOGOUT:        'text-slate-400 bg-slate-700/30',
  OVERRIDE:      'text-red-400 bg-red-900/30',
  RESET:         'text-orange-400 bg-orange-900/30',
};

function AuditTab() {
  const { auditLog, clearAuditLog, addAuditEntry } = useAdmin();
  const [search, setSearch] = useState('');

  const filtered = search
    ? auditLog.filter(e => e.action.toLowerCase().includes(search.toLowerCase()) || e.detail.toLowerCase().includes(search.toLowerCase()))
    : auditLog;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter actions..."
            className="w-full bg-navy-800 border border-navy-600 rounded px-3 py-2 pl-8 text-white text-xs focus:outline-none focus:border-gold-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500">{filtered.length} entries</span>
          <button
            onClick={clearAuditLog}
            className="px-3 py-1.5 text-xs text-slate-400 border border-navy-600 rounded hover:border-red-600 hover:text-red-400 transition flex items-center gap-1.5"
          >
            <Trash2 size={11} /> Clear
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-600 text-sm">No audit entries</div>
      ) : (
        <div className="overflow-x-auto rounded border border-navy-700">
          <table className="w-full text-xs font-mono min-w-[560px]">
            <thead>
              <tr className="bg-navy-800 text-slate-500 uppercase text-[10px] border-b border-navy-700">
                {['Time', 'Action', 'Detail', 'User'].map(h => (
                  <th key={h} className="text-left py-2.5 px-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(entry => (
                <tr key={entry.id} className="border-b border-navy-800 hover:bg-navy-800/40">
                  <td className="py-2 px-3 text-slate-500 whitespace-nowrap">
                    {new Date(entry.time).toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    <br />
                    <span className="text-[9px]">{new Date(entry.time).toLocaleDateString('fr-MA')}</span>
                  </td>
                  <td className="py-2 px-3">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${AUDIT_ACTION_COLOR[entry.action] ?? 'text-slate-400 bg-slate-700/30'}`}>
                      {entry.action}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-slate-300 max-w-[300px] truncate">{entry.detail}</td>
                  <td className="py-2 px-3 text-gold-500 font-bold">{entry.user}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── CONSULTANT AI Tab ────────────────────────────────────────────────────────

const CONSULTANT_SYSTEM = `You are an expert internal FX consultant assistant for JAD2 Advisory, Casablanca, Morocco.
You have deep expertise in:
- Moroccan FX market (MAD/BKAM basket, Office des Changes regulations)
- FX hedging strategies: forwards, swaps, options, cross-currency
- Corporate treasury management for Moroccan exporters/importers
- BAM/OC compliance: Circ. 01/2024, rapatriement, comptes devises (CPEC/CDE)
- Emerging market FX dynamics (MAD peg structure, Gulf currency analysis)

This is an INTERNAL tool for JAD2 Advisory consultants ONLY — not a public interface.
You MAY provide advisory-grade analysis, scenario modeling, and strategic recommendations.
Always cite relevant OC regulation when applicable.
Respond in the language of the question (French, English, or Arabic).`;

interface ConsultantMsg { id: string; role: 'user' | 'model'; text: string; ts: Date; provider?: string; isFallback?: boolean; }

function ConsultantTab() {
  const [messages, setMessages] = useState<ConsultantMsg[]>([{
    id: '0', role: 'model', ts: new Date(),
    text: 'JAD2 Advisory Internal Assistant — accès consultant uniquement.\n\nJe peux vous aider avec : stratégies de couverture, structuration de forwards/swaps, analyse réglementaire OC, scénarios de risque de change, préparation de dossiers clients.\n\n⚡ Cet outil est réservé aux consultants JAD2 Advisory.',
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const available = getAvailableProviders();

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || available.length === 0) return;
    setInput('');
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text, ts: new Date() }]);
    setLoading(true);
    try {
      const result = await routeQuery({
        strategy: 'quality-first',
        systemPrompt: CONSULTANT_SYSTEM,
        userMessage: text,
        maxTokens: 1200,
        temperature: 0.4,
      });
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(), role: 'model', text: result.text, ts: new Date(),
        provider: result.provider, isFallback: result.isFallback,
      }]);
    } catch {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', text: 'Erreur — aucun fournisseur LLM disponible. Vérifiez votre .env.', ts: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[540px]">
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-navy-700">
        <div className="p-1.5 bg-gold-500/10 rounded">
          <Bot size={16} className="text-gold-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-white tracking-wider">JAD2 Advisory — Assistant Interne</p>
          <p className="text-[10px] text-slate-500">
            quality-first: {available.length > 0
              ? available.map(p => PROVIDER_LABELS[p]).join(' → ')
              : 'aucun fournisseur configuré'}
          </p>
        </div>
        <div className="ml-auto text-[10px] font-bold bg-red-900/30 text-red-400 border border-red-800/40 px-2 py-0.5 rounded">
          INTERNAL ONLY
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-3">
        {messages.map(msg => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[88%] px-3 py-2.5 rounded-lg text-xs leading-relaxed ${
              msg.role === 'user'
                ? 'bg-navy-700 text-white'
                : 'bg-navy-800 border border-navy-600 text-slate-200'
            }`}>
              {msg.text.split('\n').map((line, i) => <p key={i} className={i > 0 ? 'mt-1' : ''}>{line}</p>)}
            </div>
            {msg.role === 'model' && msg.provider && (
              <div className={`mt-0.5 flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                PROVIDER_COLORS[msg.provider as keyof typeof PROVIDER_COLORS] ?? 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                <Send size={7} />
                {PROVIDER_LABELS[msg.provider as keyof typeof PROVIDER_LABELS] ?? msg.provider}
                {msg.isFallback && <span className="text-amber-400 ml-1">↩ fallback</span>}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-[10px] text-slate-500 ml-2">
            <div className="flex gap-1">
              {[0, 150, 300].map(d => (
                <div key={d} className="w-1.5 h-1.5 bg-gold-500 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
            Analyzing...
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="flex gap-0 border border-navy-600 rounded overflow-hidden focus-within:border-gold-500 transition">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Analyse stratégie, réglementation OC, structuration..."
          className="flex-1 bg-navy-800 px-4 py-2.5 text-white text-xs focus:outline-none placeholder:text-slate-600"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="bg-gold-500 hover:bg-gold-400 text-navy-900 px-4 transition disabled:opacity-50"
        >
          <Send size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type AdminTab = 'SYSTEM' | 'RATES' | 'CURVES' | 'FORWARDS' | 'SPREADS' | 'PRICING' | 'ALERTS' | 'BLOTTER' | 'AUDIT' | 'CONSULTANT' | 'REPORTS';

const TABS: { id: AdminTab; label: string; icon: React.ElementType }[] = [
  { id: 'SYSTEM',     label: 'System',     icon: Activity },
  { id: 'RATES',      label: 'Rates',      icon: BarChart2 },
  { id: 'CURVES',     label: 'Curves',     icon: TrendingUp },
  { id: 'FORWARDS',   label: 'Forwards',   icon: Settings },
  { id: 'SPREADS',    label: 'Spreads',    icon: BarChart2 },
  { id: 'PRICING',    label: 'Pricing',    icon: TrendingUp },
  { id: 'ALERTS',     label: 'Alerts',     icon: AlertTriangle },
  { id: 'BLOTTER',    label: 'Blotter',    icon: FileText },
  { id: 'AUDIT',      label: 'Audit',      icon: ClipboardList },
  { id: 'CONSULTANT', label: 'Consultant', icon: Bot },
  { id: 'REPORTS',    label: 'Rapports',   icon: FileText },
];

export default function AdminDashboard() {
  const { isAdmin, login, logout, blotter, auditLog, resetConfig } = useAdmin();
  const [activeTab, setActiveTab] = useState<AdminTab>('SYSTEM');

  if (!isAdmin) return <LoginGate onLogin={login} />;

  return (
    <div className="space-y-5">

      {/* ── Terminal header ── */}
      <div className="bg-navy-900 border border-navy-700 rounded-lg p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-gold-500/10 border border-gold-600/30 flex items-center justify-center">
              <Shield size={20} className="text-gold-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2 tracking-widest uppercase">
                JAD2FX Admin Terminal
                <span className="text-[10px] bg-emerald-900/40 border border-emerald-700/40 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold">
                  AUTHENTICATED
                </span>
              </h2>
              <p className="text-xs text-slate-500">JAD2 Advisory · Panneau de Contrôle · {new Date().toLocaleDateString('fr-MA')}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={resetConfig}
              className="px-3 py-1.5 text-xs text-slate-400 border border-navy-600 rounded hover:border-red-600 hover:text-red-400 transition flex items-center gap-1.5"
            >
              <RotateCcw size={11} /> Reset All
            </button>
            <button
              onClick={logout}
              className="px-3 py-1.5 text-xs bg-navy-800 text-slate-300 border border-navy-600 rounded hover:text-red-400 hover:border-red-600 transition flex items-center gap-1.5"
            >
              <LogOut size={11} /> Logout
            </button>
          </div>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="bg-navy-900 border border-navy-700 rounded-lg overflow-hidden">
        <div className="flex items-center border-b border-navy-700 px-4 overflow-x-auto">
          {TABS.map(tab => (
            <React.Fragment key={tab.id}>
              <TabBtn
                label={tab.label}
                icon={tab.icon}
                active={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              />
            </React.Fragment>
          ))}
          {blotter.length > 0 && activeTab !== 'BLOTTER' && (
            <span className="ml-auto flex-shrink-0 bg-gold-500 text-navy-900 text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {Math.min(blotter.length, 9)}
            </span>
          )}
        </div>

        {/* Tab content */}
        <div className="p-5">
          {activeTab === 'SYSTEM'     && <SystemTab />}
          {activeTab === 'RATES'      && <RatesTab />}
          {activeTab === 'CURVES'     && <CurvesTab />}
          {activeTab === 'FORWARDS'   && <ForwardsTab />}
          {activeTab === 'SPREADS'    && <SpreadsTab />}
          {activeTab === 'PRICING'    && <PricingTab />}
          {activeTab === 'ALERTS'     && <AlertsTab />}
          {activeTab === 'BLOTTER'    && <BlotterTab />}
          {activeTab === 'AUDIT'      && <AuditTab />}
          {activeTab === 'CONSULTANT' && <ConsultantTab />}
          {activeTab === 'REPORTS'    && <ReportsAdmin />}
        </div>
      </div>
    </div>
  );
}
