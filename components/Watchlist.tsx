import { useState, useEffect, useMemo, useCallback } from 'react';
import { Star, StarOff, X, ArrowUpDown, AlertTriangle, TrendingUp, TrendingDown, Bell } from 'lucide-react';
import CurrencyFlag from './CurrencyFlag';
import { BKAM_CURRENCIES } from '../constants';
import { useWatchlist } from '../hooks/useWatchlist';
import { LiveRate } from '../types';

/**
 * P2.4 — Watchlist UI
 * Persistent (localStorage) with star toggle on any rate, reordering, alerts.
 * Shows mid + 24h change for each tracked pair.
 */
export default function Watchlist({ rates, isRTL }: { rates: LiveRate[]; isRTL?: boolean }) {
  const { items, add, remove, reorder, has, max } = useWatchlist();
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const ratesByCode = useMemo(() => {
    const m = new Map<string, LiveRate>();
    rates.forEach((r) => m.set(r.currency, r));
    return m;
  }, [rates]);

  // Sort by the user's chosen order (already preserved in `items`)
  const tracked = items.map((it) => ({ item: it, rate: ratesByCode.get(it.code) })).filter((x) => x.rate);

  const availableToAdd = BKAM_CURRENCIES.filter((c) => !has(c.code));

  return (
    <div className="bg-navy-900 border border-navy-700 rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-navy-700 flex items-center gap-2">
        <Star size={14} className="text-gold-500" />
        <h3 className="text-xs font-bold text-white uppercase tracking-widest">Watchlist</h3>
        <span className="text-[10px] text-slate-500 ml-auto">
          {items.length}/{max} · Persistante (localStorage)
        </span>
      </div>

      {tracked.length === 0 ? (
        <div className="p-6 text-center text-[12px] text-slate-500">
          <p>Aucune devise dans votre watchlist.</p>
          <p className="text-[10px] mt-1">Ajoutez-en via le sélecteur ci-dessous.</p>
        </div>
      ) : (
        <div className="divide-y divide-navy-800">
          {tracked.map(({ item, rate }, idx) => {
            const chg = rate!.change24h ?? 0;
            const isUp = chg > 0.01;
            const isDn = chg < -0.01;
            const hasAlert = item.alertAbove != null || item.alertBelow != null;
            return (
              <div
                key={item.code}
                draggable
                onDragStart={() => setDraggedIdx(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (draggedIdx !== null && draggedIdx !== idx) reorder(draggedIdx, idx);
                  setDraggedIdx(null);
                }}
                onDragEnd={() => setDraggedIdx(null)}
                className={`flex items-center gap-3 px-4 py-2.5 hover:bg-navy-800/40 cursor-grab active:cursor-grabbing ${
                  draggedIdx === idx ? 'opacity-50' : ''
                }`}
              >
                <ArrowUpDown size={10} className="text-slate-600 flex-shrink-0" />
                <CurrencyFlag
                  countryCode={BKAM_CURRENCIES.find((c) => c.code === item.code)?.countryCode ?? item.code.toLowerCase().slice(0, 2)}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-white">{item.code}/MAD</p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {BKAM_CURRENCIES.find((c) => c.code === item.code)?.nameFr ?? ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[12px] font-mono font-bold text-white tabular-nums">{rate!.mid.toFixed(4)}</p>
                  <p className={`text-[10px] font-mono font-bold ${
                    isUp ? 'text-emerald-400' : isDn ? 'text-red-400' : 'text-slate-500'
                  }`}>
                    {isUp ? '+' : ''}{chg.toFixed(2)}%
                  </p>
                </div>
                {hasAlert && (
                  <span title="Alerte configurée" className="text-amber-400">
                    <Bell size={10} />
                  </span>
                )}
                <button
                  onClick={() => remove(item.code)}
                  className="text-slate-500 hover:text-red-400 transition-colors"
                  aria-label={`Retirer ${item.code}`}
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add new */}
      {availableToAdd.length > 0 && (
        <div className="px-4 py-3 border-t border-navy-800">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Ajouter</p>
          <div className="flex flex-wrap gap-1.5">
            {availableToAdd.slice(0, 8).map((c) => (
              <button
                key={c.code}
                onClick={() => add(c.code)}
                className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold bg-navy-800 border border-navy-700 text-slate-300 rounded hover:border-gold-500/50 hover:text-gold-300 transition-colors"
              >
                <Star size={9} /> {c.code}
              </button>
            ))}
            {availableToAdd.length > 8 && (
              <span className="text-[10px] text-slate-500 px-2 py-1">+{availableToAdd.length - 8} autres</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
