import React, { useState, useMemo, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { Calculator, TrendingUp, Clock, ChevronDown } from 'lucide-react';
import { BKAM_CURRENCIES } from '../constants';
import {
  STANDARD_TENORS,
  buildForwardQuote,
  buildForwardCurve,
  settlementDate,
  customDateToYears,
} from '../services/forwardEngine';
import { getDefaultCurve, FORWARD_TENORS } from '../services/interestRates';
import { useAdmin } from '../context/AdminContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt4(v: number) { return v.toFixed(4); }
function fmtPips(v: number) { return (v >= 0 ? '+' : '') + v.toFixed(2); }
function fmtPct(v: number) { return (v * 100).toFixed(3) + '%'; }
function fmtMAD(v: number) { return new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 }).format(v); }

// ─── Small UI atoms ───────────────────────────────────────────────────────────

function TermRow({
  label, value, unit, highlight, color,
}: {
  label: string; value: string; unit?: string; highlight?: boolean; color?: string;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-navy-800 last:border-0">
      <span className="text-xs text-slate-500 uppercase tracking-wider">{label}</span>
      <span className={`text-sm font-mono font-bold ${color ?? (highlight ? 'text-gold-400' : 'text-white')}`}>
        {value}{unit ? <span className="text-slate-500 ml-1 font-normal text-xs">{unit}</span> : null}
      </span>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ForwardCalculator() {
  const { config, livePrices, addBlotterEntry } = useAdmin();

  const [currency, setCurrency]     = useState('EUR');
  const [tenor, setTenor]           = useState('3M');
  const [notional, setNotional]     = useState(1_000_000);
  const [direction, setDirection]   = useState<'BUY' | 'SELL'>('BUY');
  const [customDate, setCustomDate] = useState('');
  const [saved, setSaved]           = useState(false);

  const spotEntry = livePrices.find(p => p.currency === currency);
  const spot      = config.spotOverrides[currency] ?? spotEntry?.mid ?? 0;

  // Effective tenor for CUSTOM: if date given use it, else fall back to 3M
  const effectiveTenorYears = useMemo(() => {
    if (tenor === 'CUSTOM' && customDate) return customDateToYears(customDate);
    return undefined;
  }, [tenor, customDate]);

  const quote = useMemo(() => {
    if (!spot) return null;
    try {
      const t = (tenor === 'CUSTOM' && !customDate) ? '3M' : tenor;
      return buildForwardQuote(
        currency, spot, t, notional, direction,
        config.forwardMarkupBps,
        config.curveOverrides['MAD'],
        config.curveOverrides[currency],
      );
    } catch { return null; }
  }, [currency, tenor, notional, direction, spot, config.forwardMarkupBps, config.curveOverrides, customDate]);

  const curvePoints = useMemo(() => {
    if (!spot) return [];
    return buildForwardCurve(
      currency, spot,
      config.forwardMarkupBps,
      config.curveOverrides['MAD'],
      config.curveOverrides[currency],
    );
  }, [currency, spot, config.forwardMarkupBps, config.curveOverrides]);

  const settlement = useMemo(() => {
    if (tenor === 'CUSTOM' && customDate) return customDate;
    return settlementDate(tenor);
  }, [tenor, customDate]);

  const handleSave = useCallback(() => {
    if (!quote) return;
    addBlotterEntry({
      action: 'FORWARD',
      pair: quote.pair,
      tenor: quote.tenorLabel,
      rate: quote.forwardRate,
      fwdPtsPips: quote.forwardPointsPips,
      notional: quote.notional,
      details: `[SIM] ${direction} ${fmtMAD(notional)} ${currency} @ ${fmt4(quote.forwardRate)} (${fmtPips(quote.forwardPointsPips)} pips) — INDICATIF`,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [quote, direction, notional, currency, addBlotterEntry]);

  const curInfo = BKAM_CURRENCIES.find(c => c.code === currency);

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3 tracking-widest uppercase">
            <Calculator size={22} className="text-gold-500" />
            Simulateur Forward FX
          </h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Formule CIP · Interpolation cubique · 14 paires BKAM
          </p>
          <div className="mt-1 inline-flex items-center gap-1.5 text-[10px] bg-amber-900/30 border border-amber-700/40 text-amber-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
            ⚠️ Simulation Pédagogique — Cours Indicatifs Uniquement
          </div>
        </div>
        {spotEntry && (
          <div className="text-right font-mono">
            <div className="text-xs text-slate-500 uppercase">Live Spot</div>
            <div className="text-lg font-bold text-gold-400">{fmt4(spotEntry.mid)}</div>
            <div className="text-xs text-slate-500">{currency}/MAD</div>
          </div>
        )}
      </div>

      {/* ── Inputs + Quote ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Inputs */}
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-5 space-y-4">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-gold-500 border-b border-navy-700 pb-2">
            Paramètres de Simulation
          </h3>

          {/* Currency + Direction */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-slate-500 mb-1.5 uppercase tracking-wider">Pair</label>
              <div className="relative">
                <select
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  className="w-full appearance-none bg-navy-800 border border-navy-600 text-white text-sm rounded px-3 py-2 pr-8 focus:outline-none focus:border-gold-500"
                >
                  {BKAM_CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code}/MAD
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 mb-1.5 uppercase tracking-wider">Side</label>
              <div className="flex gap-2 h-9">
                <button
                  onClick={() => setDirection('BUY')}
                  className={`flex-1 text-sm font-bold rounded transition ${
                    direction === 'BUY'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-navy-800 text-slate-400 border border-navy-600 hover:border-emerald-600'
                  }`}
                >
                  BUY
                </button>
                <button
                  onClick={() => setDirection('SELL')}
                  className={`flex-1 text-sm font-bold rounded transition ${
                    direction === 'SELL'
                      ? 'bg-red-600 text-white'
                      : 'bg-navy-800 text-slate-400 border border-navy-600 hover:border-red-600'
                  }`}
                >
                  SELL
                </button>
              </div>
            </div>
          </div>

          {/* Tenor buttons */}
          <div>
            <label className="block text-[10px] text-slate-500 mb-1.5 uppercase tracking-wider">Tenor</label>
            <div className="flex flex-wrap gap-1.5">
              {([...STANDARD_TENORS, 'CUSTOM'] as string[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTenor(t)}
                  className={`px-2.5 py-1.5 text-xs font-mono font-bold rounded transition ${
                    tenor === t
                      ? 'bg-gold-500 text-navy-900'
                      : 'bg-navy-800 text-slate-300 border border-navy-600 hover:border-gold-600'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            {tenor === 'CUSTOM' && (
              <div className="mt-2">
                <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wider">Settlement Date</label>
                <input
                  type="date"
                  value={customDate}
                  onChange={e => setCustomDate(e.target.value)}
                  className="w-full bg-navy-800 border border-navy-600 text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-gold-500"
                />
              </div>
            )}
          </div>

          {/* Notional */}
          <div>
            <label className="block text-[10px] text-slate-500 mb-1.5 uppercase tracking-wider">
              Notional ({currency})
            </label>
            <input
              type="number"
              value={notional}
              onChange={e => setNotional(Math.max(0, Number(e.target.value)))}
              step={100_000}
              min={0}
              className="w-full bg-navy-800 border border-navy-600 text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-gold-500 font-mono"
            />
            <p className="text-[10px] text-slate-500 mt-1 font-mono">
              {new Intl.NumberFormat('fr-MA').format(notional)} {currency}
            </p>
          </div>

          {/* Markup info */}
          {config.forwardMarkupBps > 0 && (
            <div className="text-[10px] text-amber-400 bg-amber-950/30 border border-amber-800/30 rounded px-2 py-1">
              Admin markup: {config.forwardMarkupBps} bps applied
            </div>
          )}
        </div>

        {/* Quote Results */}
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-5 flex flex-col">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-gold-500 border-b border-navy-700 pb-2 mb-3">
            Forward Quote — {curInfo?.flag} {currency}/MAD
          </h3>

          {quote ? (
            <>
              <div className="flex-1 space-y-0">
                <TermRow label="Spot Rate"  value={fmt4(quote.spot)}        unit="MAD" />
                <TermRow label="Forward Rate" value={fmt4(quote.forwardRate)} unit="MAD" highlight />
                <TermRow
                  label="Forward Points"
                  value={fmtPips(quote.forwardPointsPips)}
                  unit="pips"
                  color={quote.forwardPointsPips >= 0 ? 'text-emerald-400' : 'text-red-400'}
                />
                <TermRow
                  label="Premium / Discount"
                  value={quote.forwardPointsPips >= 0.5 ? 'PREMIUM' : quote.forwardPointsPips <= -0.5 ? 'DISCOUNT' : 'PAR'}
                  color={quote.forwardPointsPips >= 0 ? 'text-emerald-400' : 'text-red-400'}
                />
                <TermRow label="Settlement"    value={settlement} />
                <TermRow label="Tenor Days"    value={String(quote.tenorDays)} unit="days" />
                <TermRow label="MAD Rate"      value={fmtPct(quote.madRate)} />
                <TermRow label={`${currency} Rate`} value={fmtPct(quote.fcyRate)} />
              </div>

              {/* Cost box */}
              <div className="mt-4 bg-navy-800 rounded-lg p-4 text-center border border-navy-600">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Coût Net Indicatif Forward</p>
                <p className="text-3xl font-mono font-bold text-gold-400">
                  {fmtMAD(quote.netCostMAD)} MAD
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  {notional.toLocaleString()} {currency} · {tenor} · {direction}
                </p>
              </div>

              <div className="text-[10px] text-amber-400/80 text-center mt-2">
                ⚠️ Simulation indicative uniquement — pas un devis contraignant
              </div>

              <button
                onClick={handleSave}
                className={`mt-2 w-full py-2.5 text-sm font-bold rounded transition ${
                  saved
                    ? 'bg-emerald-700 text-white'
                    : 'bg-navy-800 hover:bg-navy-700 text-gold-400 border border-gold-600/40'
                }`}
              >
                {saved ? '✓ Simulation enregistrée' : 'Enregistrer la Simulation'}
              </button>

              <a
                href="https://jad2advisory.com"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center py-2 mt-1 bg-gold-500 hover:bg-gold-400 text-navy-900 text-xs font-bold rounded transition"
              >
                Obtenir un devis réel → JAD2 Advisory
              </a>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-slate-500 text-sm text-center">
                {!spot
                  ? 'No live spot rate — fetch prices or set a spot override in Admin'
                  : 'Configure parameters to compute quote'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Forward Curve Chart ── */}
      {curvePoints.length > 0 && (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-5">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-gold-500 mb-4 flex items-center gap-2">
            <TrendingUp size={13} />
            {currency}/MAD — Forward Points Curve (pips vs tenor)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={curvePoints} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
              <XAxis dataKey="tenor" tick={{ fill: '#94a3b8', fontSize: 10 }} stroke="#1e3a5f" />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                stroke="#1e3a5f"
                tickFormatter={v => `${v > 0 ? '+' : ''}${v.toFixed(0)}`}
                width={45}
              />
              <Tooltip
                contentStyle={{ background: '#0A1A30', border: '1px solid #1e3a5f', borderRadius: 6 }}
                labelStyle={{ color: '#D4AF37', fontWeight: 'bold', fontSize: 11 }}
                itemStyle={{ color: '#94a3b8', fontSize: 11 }}
                formatter={(v: number) => [`${v >= 0 ? '+' : ''}${v.toFixed(2)} pips`, 'Fwd Points']}
              />
              <ReferenceLine y={0} stroke="#4b5563" strokeDasharray="4 4" />
              <Line
                type="monotone"
                dataKey="forwardPointsPips"
                stroke="#D4AF37"
                strokeWidth={2}
                dot={{ fill: '#D4AF37', r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Full Curve Table ── */}
      {curvePoints.length > 0 && (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-5 overflow-x-auto">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-gold-500 mb-4 flex items-center gap-2">
            <Clock size={13} />
            Full Forward Curve — {currency}/MAD
          </h3>
          <table className="w-full text-xs font-mono min-w-[600px]">
            <thead>
              <tr className="text-slate-500 uppercase text-[10px] border-b border-navy-700">
                {['Tenor', 'Days', `MAD%`, `${currency}%`, 'Spot', 'Fwd Rate', 'Pips', 'P/D'].map(h => (
                  <th key={h} className="text-right first:text-left pb-2 pr-3 last:pr-0 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {curvePoints.map(row => (
                <tr
                  key={row.tenor}
                  className={`border-b border-navy-800 hover:bg-navy-800/50 transition-colors ${
                    row.tenor === tenor ? 'bg-navy-800' : ''
                  }`}
                >
                  <td className={`py-2 pr-3 font-bold ${row.tenor === tenor ? 'text-gold-400' : 'text-white'}`}>
                    {row.tenor}
                  </td>
                  <td className="text-right text-slate-400 pr-3">{row.tenorDays}</td>
                  <td className="text-right text-slate-300 pr-3">{fmtPct(row.madRate)}</td>
                  <td className="text-right text-slate-300 pr-3">{fmtPct(row.fcyRate)}</td>
                  <td className="text-right text-slate-300 pr-3">{fmt4(row.spot)}</td>
                  <td className="text-right text-white font-bold pr-3">{fmt4(row.forwardRate)}</td>
                  <td className={`text-right font-bold pr-3 ${row.forwardPointsPips >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {fmtPips(row.forwardPointsPips)}
                  </td>
                  <td className={`text-right text-[10px] ${
                    row.premDisc === 'PREMIUM' ? 'text-emerald-400' :
                    row.premDisc === 'DISCOUNT' ? 'text-red-400' : 'text-slate-500'
                  }`}>
                    {row.premDisc.slice(0, 4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
