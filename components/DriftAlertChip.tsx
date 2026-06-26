import React, { useEffect, useState } from 'react';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { fetchDriftHistory } from '../services/driftHistory';

interface Props {
  proxyUrl: string;
  onNavigate: () => void;
}

export default function DriftAlertChip({ proxyUrl, onNavigate }: Props) {
  const [drift, setDrift]     = useState<number | null>(null);
  const [util, setUtil]       = useState<number | null>(null);
  const [date, setDate]       = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!proxyUrl) { setLoading(false); return; }
    fetchDriftHistory(proxyUrl, 5)
      .then(r => {
        const last = r.points[r.points.length - 1];
        if (last) { setDrift(last.driftBps); setUtil(last.bandUtilPct); setDate(last.date); }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [proxyUrl]);

  if (loading || drift === null) return null;

  const isNegative = drift < 0;
  const isExtreme  = Math.abs(drift) > 300 || (util !== null && (util < 20 || util > 80));
  const Icon = drift > 20 ? TrendingUp : drift < -20 ? TrendingDown : Minus;

  const borderColor = isExtreme ? 'border-amber-700/40' : 'border-navy-700';
  const bgColor     = isExtreme ? 'bg-amber-500/5' : 'bg-navy-900/60';
  const textColor   = isExtreme ? 'text-amber-300' : 'text-slate-400';
  const iconColor   = isExtreme ? 'text-amber-400' : isNegative ? 'text-emerald-400' : 'text-red-400';

  return (
    <button
      onClick={onNavigate}
      className={`w-full flex items-center justify-between gap-3 ${bgColor} border ${borderColor} rounded-xl px-4 py-2.5 hover:brightness-110 transition-all text-left`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <Icon size={14} className={`${iconColor} flex-shrink-0`} />
        <div className="min-w-0">
          <span className={`text-[11px] font-semibold ${textColor}`}>
            MAD Drift BKAM · {date.slice(5)} :&nbsp;
            <span className="font-mono font-bold text-white">{drift > 0 ? '+' : ''}{drift.toFixed(0)} bps</span>
            {util !== null && (
              <span className="text-slate-600"> · Bande {util.toFixed(0)}%</span>
            )}
          </span>
          {isExtreme && (
            <span className="block text-[9px] text-amber-500/80">
              Positionnement MAD hors zone neutre — impact sur vos flux EUR/USD
            </span>
          )}
        </div>
      </div>
      <span className="text-[10px] text-gold-500 font-bold flex-shrink-0 whitespace-nowrap">
        Analyser →
      </span>
    </button>
  );
}
