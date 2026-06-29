import { useState, useMemo } from 'react';
import { TrendingUp, Info, ChevronDown } from 'lucide-react';
import CurrencyFlag from './CurrencyFlag';
import { BKAM_CURRENCIES } from '../constants';
import { buildCalendarSpread, buildButterfly } from '../services/forwardEngine';
import { useAdmin } from '../context/AdminContext';

const STD_TENORS = ['1M', '2M', '3M', '6M', '9M', '1Y', '2Y'] as const;
type StdTenor = (typeof STD_TENORS)[number];

/**
 * Calendar spread + butterfly UI tab.
 * P1.6 — Companion to ForwardCalculator that visualises forward curve trades
 * (spreads and butterflies) without leaving the FX context.
 */
export default function CalendarSpreadPanel() {
  const { config } = useAdmin();
  const [currency, setCurrency] = useState('EUR');
  const [spot, setSpot] = useState<number>(0);

  const [nearTenor, setNearTenor] = useState<StdTenor>('1M');
  const [middleTenor, setMiddleTenor] = useState<StdTenor>('3M');
  const [farTenor, setFarTenor] = useState<StdTenor>('6M');

  // Pull live spot from configured context (admin live prices)
  const liveSpot = useMemo(() => {
    const found = config.corsProxyUrl ? null : null;
    return found ?? spot ?? 10.85; // fallback EUR/MAD demo
  }, [config.corsProxyUrl, spot]);

  const spread = useMemo(() => {
    if (!liveSpot) return null;
    return buildCalendarSpread(currency, liveSpot, nearTenor, farTenor, undefined, undefined);
  }, [currency, liveSpot, nearTenor, farTenor]);

  const butterfly = useMemo(() => {
    if (!liveSpot) return null;
    return buildButterfly(currency, liveSpot, nearTenor, middleTenor, farTenor, undefined, undefined);
  }, [currency, liveSpot, nearTenor, middleTenor, farTenor]);

  const directionColor = (dir: string) => {
    if (dir === 'CONTANGO' || dir === 'BULL_STEEPENER') return 'text-emerald-400';
    if (dir === 'BACKWARDATION' || dir === 'BEAR_FLATTENER') return 'text-red-400';
    return 'text-slate-300';
  };

  return (
    <div className="space-y-5">
      {/* Inputs */}
      <div className="bg-navy-900 border border-navy-700 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp size={14} className="text-gold-500" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Spreads Calendaires & Butterfly</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Currency */}
          <div>
            <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1.5">Devise</label>
            <div className="relative">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full appearance-none bg-navy-950 border border-navy-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-gold-500"
              >
                {BKAM_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.code} — {c.nameFr}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
          </div>

          {/* Spot override */}
          <div>
            <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1.5">Spot {currency}/MAD</label>
            <input
              type="number"
              step="0.0001"
              value={spot || ''}
              onChange={(e) => setSpot(parseFloat(e.target.value) || 0)}
              placeholder="ex. 10.85"
              className="w-full bg-navy-950 border border-navy-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-gold-500"
            />
          </div>

          {/* Near */}
          <div>
            <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1.5">Near tenor</label>
            <select value={nearTenor} onChange={(e) => setNearTenor(e.target.value as StdTenor)} className="w-full appearance-none bg-navy-950 border border-navy-700 rounded-lg px-3 py-2 text-sm text-slate-200">
              {STD_TENORS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Middle (butterfly only) */}
          <div>
            <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1.5">Middle (butterfly)</label>
            <select value={middleTenor} onChange={(e) => setMiddleTenor(e.target.value as StdTenor)} className="w-full appearance-none bg-navy-950 border border-navy-700 rounded-lg px-3 py-2 text-sm text-slate-200">
              {STD_TENORS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Far */}
          <div>
            <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1.5">Far tenor</label>
            <select value={farTenor} onChange={(e) => setFarTenor(e.target.value as StdTenor)} className="w-full appearance-none bg-navy-950 border border-navy-700 rounded-lg px-3 py-2 text-sm text-slate-200">
              {STD_TENORS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {spot === 0 && (
          <p className="text-[11px] text-amber-400/80 flex items-center gap-1.5">
            <Info size={11} /> Saisir le spot ou utiliser le spot live du tableau de bord.
          </p>
        )}
      </div>

      {/* Results */}
      {spot > 0 && spread && butterfly && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Calendar spread */}
          <div className="bg-navy-900 border border-navy-700 rounded-xl p-5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Calendar Spread {nearTenor} × {farTenor}
            </h4>
            <div className="space-y-2 text-[12px]">
              <Row label={`Forward ${nearTenor}`} value={spread.nearRate.toFixed(4)} />
              <Row label={`Forward ${farTenor}`}  value={spread.farRate.toFixed(4)} />
              <Row label="Spread (brut)" value={spread.spread.toFixed(4)} mono />
              <Row label="Spread (pips)" value={`${spread.spreadPips > 0 ? '+' : ''}${spread.spreadPips.toFixed(2)}`} mono highlight />
              <Row label="Direction" value={spread.direction} color={directionColor(spread.direction)} />
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed mt-3 border-t border-navy-800 pt-3">
              {spread.interpretation}
            </p>
          </div>

          {/* Butterfly */}
          <div className="bg-navy-900 border border-navy-700 rounded-xl p-5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Butterfly {nearTenor} × {middleTenor} × {farTenor}
            </h4>
            <div className="space-y-2 text-[12px]">
              <Row label={`Forward ${nearTenor}`}    value={butterfly.nearRate.toFixed(4)} />
              <Row label={`Forward ${middleTenor}`}  value={butterfly.middleRate.toFixed(4)} />
              <Row label={`Forward ${farTenor}`}     value={butterfly.farRate.toFixed(4)} />
              <Row label="Butterfly (brut)" value={butterfly.butterfly.toFixed(6)} mono />
              <Row label="Butterfly (pips)" value={`${butterfly.butterflyPips > 0 ? '+' : ''}${butterfly.butterflyPips.toFixed(2)}`} mono highlight />
              <Row label="Position" value={butterfly.direction} color={directionColor(butterfly.direction)} />
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed mt-3 border-t border-navy-800 pt-3">
              {butterfly.interpretation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, mono, highlight, color }: { label: string; value: string; mono?: boolean; highlight?: boolean; color?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-400">{label}</span>
      <span className={`${mono ? 'font-mono' : ''} ${highlight ? 'text-gold-400 font-bold' : 'text-slate-200'} ${color ?? ''}`}>
        {value}
      </span>
    </div>
  );
}
