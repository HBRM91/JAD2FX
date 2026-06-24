import React, { useState, useMemo, useCallback } from 'react';
import { ArrowLeftRight, RotateCcw, RotateCw, ChevronDown, Trash2, TrendingDown } from 'lucide-react';
import { BKAM_CURRENCIES } from '../constants';
import ComplianceBanner from './ComplianceBanner';
import { STANDARD_TENORS, buildFxSwap, buildRollEvent, settlementDate } from '../services/forwardEngine';
import { useAdmin } from '../context/AdminContext';
import { FxSwapQuote, RollEvent } from '../types';
import { logSimTelemetry } from '../services/telemetry';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt4(v: number) { return v.toFixed(4); }
function fmtPips(v: number) { return (v >= 0 ? '+' : '') + v.toFixed(2); }
function fmtMAD(v: number) {
  return new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 }).format(v);
}

// ─── Cash-Flow Timeline ────────────────────────────────────────────────────────

function cfRow(receive: boolean, amount: number, ccy: string) {
  return (
    <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md ${receive ? 'bg-emerald-950/30' : 'bg-red-950/30'}`}>
      <span className={`text-sm font-bold leading-none select-none ${receive ? 'text-emerald-400' : 'text-red-400'}`}>
        {receive ? '↑' : '↓'}
      </span>
      <div>
        <p className="text-[9px] text-slate-500 uppercase">{receive ? 'Reçu' : 'Livré'}</p>
        <p className={`font-mono font-bold text-xs ${receive ? 'text-emerald-400' : 'text-red-400'}`}>
          {receive ? '+' : '−'}{fmtMAD(amount)} {ccy}
        </p>
      </div>
    </div>
  );
}

function CashFlowTimeline({ swap, notional, currency }: {
  swap: FxSwapQuote;
  notional: number;
  currency: string;
}) {
  const nearDate = settlementDate(swap.nearLeg.tenorLabel);
  const farDate  = settlementDate(swap.farLeg.tenorLabel);
  const today    = new Date().toISOString().slice(0, 10);

  const nearPct = Math.min(80, Math.max(20,
    (swap.nearLeg.tenorDays / (swap.farLeg.tenorDays || 1)) * 100,
  ));

  const isNearBuy  = swap.nearLeg.direction === 'BUY';
  const nearFcy    = notional;
  const nearMad    = swap.nearLeg.rate * notional;
  const farFcy     = notional;
  const farMad     = swap.farLeg.rate * notional;
  const netMad     = farMad - nearMad;

  return (
    <div className="border border-navy-700 bg-navy-800/40 rounded-xl p-4 space-y-4">
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-gold-500">
        Chronologie des Flux · {currency}/MAD
      </h4>

      {/* Timeline rail */}
      <div className="relative h-8">
        {/* Rail line */}
        <div className="absolute top-[13px] left-4 right-4 h-0.5 bg-navy-600" />

        {/* TODAY */}
        <div className="absolute left-4 top-[7px] flex flex-col items-center" style={{ transform: 'translateX(-50%)' }}>
          <div className="w-3 h-3 rounded-full bg-slate-600 border-2 border-slate-500 z-10" />
          <p className="text-[9px] text-slate-600 mt-1 whitespace-nowrap">{today}</p>
        </div>

        {/* NEAR */}
        <div
          className="absolute top-[6px] flex flex-col items-center"
          style={{ left: `calc(1rem + (100% - 2rem) * ${nearPct / 100})`, transform: 'translateX(-50%)' }}
        >
          <div className="w-4 h-4 rounded-full bg-blue-600 border-2 border-blue-400 z-10" />
          <p className="text-[9px] text-blue-400 font-bold mt-1 whitespace-nowrap">
            {swap.nearLeg.tenorLabel} · {nearDate}
          </p>
        </div>

        {/* FAR */}
        <div className="absolute right-4 top-[6px] flex flex-col items-center" style={{ transform: 'translateX(50%)' }}>
          <div className="w-4 h-4 rounded-full bg-purple-600 border-2 border-purple-400 z-10" />
          <p className="text-[9px] text-purple-400 font-bold mt-1 whitespace-nowrap">
            {swap.farLeg.tenorLabel} · {farDate}
          </p>
        </div>
      </div>

      {/* Cash flow grid */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        {/* NEAR leg */}
        <div className="border border-blue-800/40 bg-blue-950/10 rounded-lg p-3 space-y-2">
          <p className="text-[9px] font-bold uppercase tracking-widest text-blue-400">
            Jambe Near · {swap.nearLeg.tenorDays}j
          </p>
          {cfRow(isNearBuy, nearFcy, currency)}
          {cfRow(!isNearBuy, nearMad, 'MAD')}
          <p className="text-right text-[9px] text-slate-600 font-mono">@ {fmt4(swap.nearLeg.rate)}</p>
        </div>

        {/* FAR leg */}
        <div className="border border-purple-800/40 bg-purple-950/10 rounded-lg p-3 space-y-2">
          <p className="text-[9px] font-bold uppercase tracking-widest text-purple-400">
            Jambe Far · {swap.farLeg.tenorDays}j
          </p>
          {cfRow(!isNearBuy, farFcy, currency)}
          {cfRow(isNearBuy, farMad, 'MAD')}
          <p className="text-right text-[9px] text-slate-600 font-mono">@ {fmt4(swap.farLeg.rate)}</p>
        </div>
      </div>

      {/* Net summary bar */}
      <div className="bg-navy-900 rounded-lg px-4 py-2.5 flex items-center justify-between gap-4">
        <div className="text-[10px] text-slate-500">
          Net MAD ={' '}
          <span className="font-mono text-slate-400">{fmtMAD(farMad)}</span>
          {' − '}
          <span className="font-mono text-slate-400">{fmtMAD(nearMad)}</span>
          {' = '}
          <span className={`font-mono font-bold ${netMad >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {netMad >= 0 ? '+' : ''}{fmtMAD(netMad)} MAD
          </span>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[9px] text-slate-500 uppercase">Swap pts</p>
          <p className={`font-mono font-bold text-xs ${swap.swapPointsPips >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {fmtPips(swap.swapPointsPips)} pips
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Swap Leg Card ─────────────────────────────────────────────────────────────

function LegCard({
  label, tenor, days, rate, pips, direction, currency,
}: {
  label: 'NEAR' | 'FAR';
  tenor: string; days: number; rate: number;
  pips: number; direction: 'BUY' | 'SELL'; currency: string;
}) {
  const isBuy = direction === 'BUY';
  return (
    <div className={`flex-1 rounded-lg border p-4 ${
      label === 'NEAR'
        ? 'border-blue-800 bg-blue-950/20'
        : 'border-purple-800 bg-purple-950/20'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-bold uppercase tracking-widest ${
          label === 'NEAR' ? 'text-blue-400' : 'text-purple-400'
        }`}>
          {label} LEG
        </span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
          isBuy ? 'bg-emerald-800/40 text-emerald-400' : 'bg-red-800/40 text-red-400'
        }`}>
          {direction}
        </span>
      </div>
      <div className="space-y-1.5 font-mono text-sm">
        <div className="flex justify-between">
          <span className="text-slate-500 text-xs">Tenor</span>
          <span className="text-white font-bold">{tenor}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500 text-xs">Days</span>
          <span className="text-slate-300">{days}d</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500 text-xs">Rate</span>
          <span className="text-gold-400 font-bold">{fmt4(rate)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500 text-xs">Fwd Pts</span>
          <span className={pips >= 0 ? 'text-emerald-400' : 'text-red-400'}>{fmtPips(pips)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Roll Event Row ────────────────────────────────────────────────────────────

function RollRow({
  event, onRemove,
}: { event: RollEvent; onRemove: () => void }) {
  const isRollover = event.type === 'ROLLOVER';
  return (
    <tr className="border-b border-navy-800 hover:bg-navy-800/40 text-xs font-mono">
      <td className="py-2 pr-3">
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
          isRollover ? 'bg-blue-900/40 text-blue-400' : 'bg-orange-900/40 text-orange-400'
        }`}>
          {event.type.slice(4)}
        </span>
      </td>
      <td className="text-slate-300 pr-3">{event.pair}</td>
      <td className="text-slate-400 pr-3">{event.fromTenor} → {event.toTenor}</td>
      <td className="text-right pr-3">
        <span className={event.rollCostPips >= 0 ? 'text-emerald-400' : 'text-red-400'}>
          {fmtPips(event.rollCostPips)}
        </span>
      </td>
      <td className="text-right text-gold-400 pr-3">{fmtMAD(event.rollCostMAD)} MAD</td>
      <td className="text-right text-slate-500 text-[10px] pr-3">
        {event.timestamp.slice(11, 19)}
      </td>
      <td className="text-right">
        <button
          onClick={onRemove}
          className="text-slate-600 hover:text-red-400 transition p-0.5"
        >
          <Trash2 size={11} />
        </button>
      </td>
    </tr>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SwapSimulator() {
  const { config, livePrices, addBlotterEntry } = useAdmin();

  // Swap inputs
  const [currency, setCurrency]       = useState('EUR');
  const [notional, setNotional]       = useState(1_000_000);
  const [nearTenor, setNearTenor]     = useState('1M');
  const [farTenor, setFarTenor]       = useState('3M');
  const [nearDir, setNearDir]         = useState<'BUY' | 'SELL'>('BUY');

  // Roll event builder
  const [rollType, setRollType]       = useState<'ROLLOVER' | 'ROLLUNDER'>('ROLLOVER');
  const [rollFrom, setRollFrom]       = useState('3M');
  const [rollTo, setRollTo]           = useState('6M');

  // Local roll history (up to 20 entries)
  const [rollLog, setRollLog] = useState<RollEvent[]>([]);

  const spotEntry = livePrices.find(p => p.currency === currency);
  const spot      = config.spotOverrides[currency] ?? spotEntry?.mid ?? 0;

  const swap = useMemo(() => {
    if (!spot || nearTenor === farTenor) return null;
    try {
      return buildFxSwap(
        currency, spot, notional, nearTenor, farTenor, nearDir,
        config.forwardMarkupBps,
        config.curveOverrides['MAD'],
        config.curveOverrides[currency],
      );
    } catch { return null; }
  }, [currency, spot, notional, nearTenor, farTenor, nearDir, config.forwardMarkupBps, config.curveOverrides]);

  const computedRoll = useMemo(() => {
    if (!spot || rollFrom === rollTo) return null;
    try {
      return buildRollEvent(
        rollType, currency, spot, notional, rollFrom, rollTo,
        config.forwardMarkupBps,
        config.curveOverrides['MAD'],
        config.curveOverrides[currency],
      );
    } catch { return null; }
  }, [rollType, currency, spot, notional, rollFrom, rollTo, config.forwardMarkupBps, config.curveOverrides]);

  const handleBookSwap = useCallback(() => {
    if (!swap) return;
    addBlotterEntry({
      action: 'SWAP',
      pair: swap.pair,
      tenor: `${nearTenor}/${farTenor}`,
      rate: swap.nearLeg.rate,
      fwdPtsPips: swap.swapPointsPips,
      notional: swap.notional,
      details: `FX Swap ${nearDir} near @ ${fmt4(swap.nearLeg.rate)} / sell far @ ${fmt4(swap.farLeg.rate)} · ${fmtPips(swap.swapPointsPips)} pips`,
    });
    logSimTelemetry(config.corsProxyUrl, swap.pair, 'SWAP_SAVE', swap.farLeg.tenorDays - swap.nearLeg.tenorDays);
  }, [swap, nearTenor, farTenor, nearDir, addBlotterEntry, config.corsProxyUrl]);

  const handleBookRoll = useCallback(() => {
    if (!computedRoll) return;
    addBlotterEntry({
      action: 'ROLL',
      pair: computedRoll.pair,
      tenor: `${computedRoll.fromTenor}→${computedRoll.toTenor}`,
      rate: computedRoll.toRate,
      fwdPtsPips: computedRoll.rollCostPips,
      notional: computedRoll.notional,
      details: `${computedRoll.type} ${computedRoll.fromTenor}→${computedRoll.toTenor} · ${fmtPips(computedRoll.rollCostPips)} pips · ${fmtMAD(computedRoll.rollCostMAD)} MAD`,
    });
    logSimTelemetry(config.corsProxyUrl, computedRoll.pair, 'ROLL_SAVE');
    setRollLog(prev => [computedRoll, ...prev].slice(0, 20));
  }, [computedRoll, addBlotterEntry, config.corsProxyUrl]);

  const curInfo = BKAM_CURRENCIES.find(c => c.code === currency);
  const tenorOptions = STANDARD_TENORS as unknown as string[];

  return (
    <div className="space-y-5">
      <ComplianceBanner toolName="FX Swap Simulator" />

      {/* ── Header ── */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-3 tracking-widest uppercase">
          <ArrowLeftRight size={22} className="text-gold-500" />
          Simulateur Swap FX
        </h2>
        <p className="text-slate-400 text-sm mt-0.5">
          Jambes near/far · Rollover / roll-under · Calcul indicatif du coût
        </p>
        <div className="mt-1 inline-flex items-center gap-1.5 text-[10px] bg-amber-900/30 border border-amber-700/40 text-amber-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
          ⚠️ Simulation Pédagogique — Cours Indicatifs Uniquement
        </div>
      </div>

      {/* ── Swap Section ── */}
      <div className="bg-navy-900 border border-navy-700 rounded-lg p-5 space-y-5">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-gold-500 border-b border-navy-700 pb-2">
          Construction de la Simulation Swap
        </h3>

        {/* Currency + Notional + Near direction */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] text-slate-500 mb-1.5 uppercase tracking-wider">Currency</label>
            <div className="relative">
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="w-full appearance-none bg-navy-800 border border-navy-600 text-white text-sm rounded px-3 py-2 pr-7 focus:outline-none focus:border-gold-500"
              >
                {BKAM_CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.flag} {c.code}/MAD</option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-slate-500 mb-1.5 uppercase tracking-wider">Notional ({currency})</label>
            <input
              type="number"
              value={notional}
              onChange={e => setNotional(Math.max(0, Number(e.target.value)))}
              step={100_000}
              className="w-full bg-navy-800 border border-navy-600 text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-gold-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-[10px] text-slate-500 mb-1.5 uppercase tracking-wider">Near Side</label>
            <div className="flex gap-2 h-9">
              {(['BUY', 'SELL'] as const).map(d => (
                <button
                  key={d}
                  onClick={() => setNearDir(d)}
                  className={`flex-1 text-sm font-bold rounded transition ${
                    nearDir === d
                      ? d === 'BUY' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                      : 'bg-navy-800 text-slate-400 border border-navy-600'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tenor selectors */}
        <div className="grid grid-cols-2 gap-6">
          {(['NEAR', 'FAR'] as const).map(leg => {
            const val  = leg === 'NEAR' ? nearTenor : farTenor;
            const setV = leg === 'NEAR' ? setNearTenor : setFarTenor;
            const color = leg === 'NEAR' ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white';
            return (
              <div key={leg}>
                <label className={`block text-[10px] font-bold mb-2 uppercase tracking-wider ${
                  leg === 'NEAR' ? 'text-blue-400' : 'text-purple-400'
                }`}>
                  {leg} Tenor
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {tenorOptions.map(t => (
                    <button
                      key={t}
                      onClick={() => setV(t)}
                      className={`px-2.5 py-1.5 text-xs font-mono font-bold rounded transition ${
                        val === t ? color : 'bg-navy-800 text-slate-300 border border-navy-600 hover:bg-navy-700'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Swap results */}
        {swap ? (
          <>
            <div className="flex gap-4">
              <LegCard
                label="NEAR"
                tenor={swap.nearLeg.tenorLabel}
                days={swap.nearLeg.tenorDays}
                rate={swap.nearLeg.rate}
                pips={swap.nearLeg.forwardPointsPips}
                direction={swap.nearLeg.direction}
                currency={currency}
              />

              <div className="flex flex-col items-center justify-center gap-1 text-slate-600">
                <ArrowLeftRight size={18} />
                <span className="text-[10px] font-mono text-gold-500">
                  {fmtPips(swap.swapPointsPips)}
                </span>
                <span className="text-[10px] text-slate-500">pips</span>
              </div>

              <LegCard
                label="FAR"
                tenor={swap.farLeg.tenorLabel}
                days={swap.farLeg.tenorDays}
                rate={swap.farLeg.rate}
                pips={swap.farLeg.forwardPointsPips}
                direction={swap.farLeg.direction}
                currency={currency}
              />
            </div>

            {/* Cash-flow timeline */}
            <CashFlowTimeline swap={swap} notional={notional} currency={currency} />

            {/* Swap summary strip */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Swap Points', value: fmtPips(swap.swapPointsPips) + ' pips', color: swap.swapPointsPips >= 0 ? 'text-emerald-400' : 'text-red-400' },
                { label: 'Swap Cost MAD', value: fmtMAD(Math.abs(swap.swapPointsRaw) * swap.notional), color: 'text-gold-400' },
                { label: 'MAD Near/Far', value: `${(swap.madRateNear * 100).toFixed(2)}% / ${(swap.madRateFar * 100).toFixed(2)}%`, color: 'text-slate-300' },
                { label: `${currency} Near/Far`, value: `${(swap.fcyRateNear * 100).toFixed(2)}% / ${(swap.fcyRateFar * 100).toFixed(2)}%`, color: 'text-slate-300' },
              ].map(item => (
                <div key={item.label} className="bg-navy-800 rounded p-2.5 text-center">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{item.label}</p>
                  <p className={`text-sm font-mono font-bold ${item.color}`}>{item.value}</p>
                </div>
              ))}
            </div>

            {/* Break-even carry cost panel */}
            {(() => {
              const gapDays = swap.farLeg.tenorDays - swap.nearLeg.tenorDays;
              const carryCostMAD = Math.abs(swap.swapPointsRaw) * swap.notional;
              const annualizedPct = (spot > 0 && gapDays > 0)
                ? (Math.abs(swap.swapPointsRaw) / spot) * (365 / gapDays) * 100
                : 0;
              const beMove = Math.abs(swap.swapPointsPips);
              return (
                <div className="bg-navy-800/50 border border-amber-800/30 rounded-lg p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400 flex items-center gap-1.5 mb-2.5">
                    <TrendingDown size={11} /> Analyse du Coût de Portage (Break-Even)
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: 'Écart (jours)', value: `${gapDays}j` },
                      { label: 'Coût carry (MAD)', value: fmtMAD(carryCostMAD), color: 'text-gold-400' },
                      { label: 'Carry ann. %', value: annualizedPct > 0 ? `${annualizedPct.toFixed(3)}%` : 'N/A', color: 'text-amber-400' },
                      { label: 'Break-even (pips)', value: fmtPips(swap.swapPointsPips >= 0 ? beMove : -beMove), color: swap.swapPointsPips >= 0 ? 'text-emerald-400' : 'text-red-400' },
                    ].map(item => (
                      <div key={item.label} className="bg-navy-900/60 rounded p-2 text-center">
                        <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">{item.label}</p>
                        <p className={`text-xs font-mono font-bold ${item.color ?? 'text-white'}`}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[9px] text-slate-600 mt-2">
                    Carry annualisé = |pts fwd| / spot × 365 / écart jours · Break-even = mouvement spot min. pour couvrir le coût du swap
                  </p>
                </div>
              );
            })()}

            <div className="text-[10px] text-amber-400/80 text-center">
              ⚠️ Simulation indicative uniquement — pas un devis contraignant
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleBookSwap}
                className="py-2.5 bg-navy-800 hover:bg-navy-700 text-gold-400 border border-gold-600/40 text-sm font-bold rounded transition"
              >
                Enregistrer la Simulation
              </button>
              <a
                href="https://jad2advisory.com"
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 bg-gold-500 hover:bg-gold-400 text-navy-900 text-sm font-bold rounded transition text-center"
              >
                Accompagnement → JAD2 Advisory
              </a>
            </div>
          </>
        ) : (
          <div className="text-center py-6 text-slate-500 text-sm">
            {!spot
              ? 'No spot rate — fetch live prices or set override in Admin'
              : nearTenor === farTenor
              ? 'Near and far tenors must be different'
              : 'Configure swap parameters'}
          </div>
        )}
      </div>

      {/* ── Roll Event Builder ── */}
      <div className="bg-navy-900 border border-navy-700 rounded-lg p-5 space-y-4">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-gold-500 border-b border-navy-700 pb-2 flex items-center gap-2">
          <RotateCw size={12} />
          Roll Event Builder — Rollover / Roll-Under
        </h3>

        <div className="grid grid-cols-3 gap-4">
          {/* Type */}
          <div>
            <label className="block text-[10px] text-slate-500 mb-1.5 uppercase tracking-wider">Event Type</label>
            <div className="flex gap-2">
              {(['ROLLOVER', 'ROLLUNDER'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setRollType(t)}
                  className={`flex-1 py-2 text-xs font-bold rounded transition ${
                    rollType === t
                      ? t === 'ROLLOVER' ? 'bg-blue-600 text-white' : 'bg-orange-600 text-white'
                      : 'bg-navy-800 text-slate-400 border border-navy-600'
                  }`}
                >
                  {t === 'ROLLOVER' ? 'Rollover' : 'Roll-Under'}
                </button>
              ))}
            </div>
          </div>

          {/* From Tenor */}
          <div>
            <label className="block text-[10px] text-slate-500 mb-1.5 uppercase tracking-wider">From Tenor</label>
            <div className="relative">
              <select
                value={rollFrom}
                onChange={e => setRollFrom(e.target.value)}
                className="w-full appearance-none bg-navy-800 border border-navy-600 text-white text-sm rounded px-3 py-2 pr-7 focus:outline-none focus:border-gold-500 font-mono"
              >
                {tenorOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* To Tenor */}
          <div>
            <label className="block text-[10px] text-slate-500 mb-1.5 uppercase tracking-wider">To Tenor</label>
            <div className="relative">
              <select
                value={rollTo}
                onChange={e => setRollTo(e.target.value)}
                className="w-full appearance-none bg-navy-800 border border-navy-600 text-white text-sm rounded px-3 py-2 pr-7 focus:outline-none focus:border-gold-500 font-mono"
              >
                {tenorOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Roll result */}
        {computedRoll ? (
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'From Rate', value: fmt4(computedRoll.fromRate) },
                { label: 'To Rate',   value: fmt4(computedRoll.toRate) },
                {
                  label: 'Roll Cost (pips)',
                  value: fmtPips(computedRoll.rollCostPips),
                  color: computedRoll.rollCostPips >= 0 ? 'text-emerald-400' : 'text-red-400',
                },
                {
                  label: 'Roll Cost (MAD)',
                  value: fmtMAD(computedRoll.rollCostMAD) + ' MAD',
                  color: 'text-gold-400',
                },
              ].map(item => (
                <div key={item.label} className="bg-navy-800 rounded p-2.5 text-center">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{item.label}</p>
                  <p className={`text-sm font-mono font-bold ${item.color ?? 'text-white'}`}>{item.value}</p>
                </div>
              ))}
            </div>
            <button
              onClick={handleBookRoll}
              className="w-full py-2.5 bg-gold-500 hover:bg-gold-400 text-navy-900 text-sm font-bold rounded transition flex items-center justify-center gap-2"
            >
              <RotateCw size={14} />
              Simuler le Roll &amp; Ajouter au Journal
            </button>
          </div>
        ) : (
          <div className="text-center py-4 text-slate-500 text-sm">
            {!spot ? 'No spot rate available' : rollFrom === rollTo ? 'From and To tenors must differ' : 'Configure roll parameters'}
          </div>
        )}
      </div>

      {/* ── Roll Event Log ── */}
      {rollLog.length > 0 && (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-5 overflow-x-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gold-500 flex items-center gap-2">
              <RotateCcw size={12} />
              Roll Event Log ({rollLog.length})
            </h3>
            <button
              onClick={() => setRollLog([])}
              className="text-xs text-slate-500 hover:text-red-400 transition flex items-center gap-1"
            >
              <Trash2 size={11} /> Clear
            </button>
          </div>
          <table className="w-full text-xs font-mono min-w-[560px]">
            <thead>
              <tr className="text-slate-500 text-[10px] uppercase border-b border-navy-700">
                {['Type', 'Pair', 'Tenors', 'Pips', 'Cost MAD', 'Time', ''].map(h => (
                  <th key={h} className={`pb-2 pr-3 last:pr-0 ${h === '' ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rollLog.map((e, i) => (
                <React.Fragment key={e.id}>
                  <RollRow
                    event={e}
                    onRemove={() => setRollLog(prev => prev.filter((_, j) => j !== i))}
                  />
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
