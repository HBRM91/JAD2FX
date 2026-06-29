import { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { TrendingUp, Info } from 'lucide-react';
import { DriftRegression } from '../services/driftModel';

/**
 * P1.7 — Fixing fan chart
 * Shows the next N days' likely fixing range as a fan (80% / 95% CI)
 * derived from the historical drift regression.
 */
export default function FixingFanChart({ regression, currentSpot, daysAhead = 10 }: {
  regression: DriftRegression | null;
  currentSpot: number;
  daysAhead?: number;
}) {
  const fanData = useMemo(() => {
    if (!regression || regression.points.length === 0) return [];
    // Use last drift value as starting point and the regression beta to trend forward
    const lastDrift = regression.latestDriftBps;
    const stdErrBps = regression.stdErrBps;
    // Project drift linearly using beta (bps per day)
    const projection: { day: number; date: string; mid: number; p80Low: number; p80High: number; p95Low: number; p95High: number }[] = [];
    for (let d = 0; d <= daysAhead; d++) {
      const projectedDriftBps = regression.alpha + regression.beta * (regression.points.length + d);
      const p80 = 1.28 * Math.sqrt(d) * stdErrBps; // 1.28 = 80% z-score
      const p95 = 1.96 * Math.sqrt(d) * stdErrBps; // 1.96 = 95% z-score
      const midFixing = currentSpot * (1 + projectedDriftBps / 10_000);
      const p80Low = currentSpot * (1 + (projectedDriftBps - p80) / 10_000);
      const p80High = currentSpot * (1 + (projectedDriftBps + p80) / 10_000);
      const p95Low = currentSpot * (1 + (projectedDriftBps - p95) / 10_000);
      const p95High = currentSpot * (1 + (projectedDriftBps + p95) / 10_000);
      const date = new Date();
      date.setDate(date.getDate() + d);
      projection.push({
        day: d,
        date: date.toISOString().slice(5, 10),
        mid: +midFixing.toFixed(4),
        p80Low: +p80Low.toFixed(4),
        p80High: +p80High.toFixed(4),
        p95Low: +p95Low.toFixed(4),
        p95High: +p95High.toFixed(4),
      });
    }
    return projection;
  }, [regression, currentSpot, daysAhead]);

  if (fanData.length === 0) return null;

  return (
    <div className="bg-navy-900 border border-navy-700 rounded-xl p-5 space-y-3">
      <div className="flex items-center gap-2">
        <TrendingUp size={14} className="text-gold-500" />
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Fan Chart Fixing — {daysAhead}j</h3>
        <span className="text-[10px] text-slate-500 ml-auto">
          {regression
            ? `β = ${regression.beta > 0 ? '+' : ''}${regression.beta.toFixed(2)} bps/j · σ = ${regression.stdErrBps.toFixed(1)} bps`
            : 'Modèle de dérive indisponible (cron non exécuté)'}
        </span>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={fanData}>
            <defs>
              <linearGradient id="fan95" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#D4AF37" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="fan80" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#D4AF37" stopOpacity={0.15} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#1E3E5C" strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fill: '#91B8D8', fontSize: 10 }} />
            <YAxis tick={{ fill: '#91B8D8', fontSize: 10 }} domain={['dataMin - 0.05', 'dataMax + 0.05']} />
            <Tooltip
              contentStyle={{ background: '#040C1C', border: '1px solid #D4AF37', borderRadius: 6, fontSize: 11 }}
              formatter={((v: number, name: string) => {
                if (name === 'p95High' || name === 'p80High') return [v.toFixed(4), name === 'p95High' ? '95% max' : '80% max'];
                if (name === 'p95Low' || name === 'p80Low') return [v.toFixed(4), name === 'p95Low' ? '95% min' : '80% min'];
                if (name === 'mid') return [v.toFixed(4), 'Médian'];
                return [v, name];
              }) as any}
            />
            <ReferenceLine y={currentSpot} stroke="#5090C0" strokeDasharray="4 4" label={{ value: `Spot ${currentSpot.toFixed(4)}`, fill: '#62A0CC', fontSize: 10, position: 'right' }} />
            <Area dataKey="p95High" stroke="none" fill="url(#fan95)" stackId="a" />
            <Area dataKey="p95Low"  stroke="none" fill="#040C1C" stackId="b" />
            <Area dataKey="p80High" stroke="none" fill="url(#fan80)" stackId="c" />
            <Area dataKey="p80Low"  stroke="none" fill="#040C1C" stackId="d" />
            <Area dataKey="mid"     stroke="#D4AF37" strokeWidth={1.5} fill="none" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-start gap-2 text-[10px] text-slate-500">
        <Info size={11} className="text-amber-400 flex-shrink-0 mt-0.5" />
        <span>
          Projection basée sur la régression OLS du drift historique. L'incertitude augmente avec √t (forme de cône). Bandes 80% (intérieur) et 95% (extérieur).
          <strong className="text-slate-300"> Outil pédagogique — pas une prédiction. Pour vos décisions de couverture, consultez votre banque.</strong>
        </span>
      </div>
    </div>
  );
}
