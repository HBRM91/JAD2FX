import { useState, useMemo, useEffect } from 'react';
import { TrendingUp, ChevronDown, Calendar, AlertTriangle } from 'lucide-react';
import { BKAM_CURRENCIES } from '../constants';

/**
 * P3.25 — Simulation Couverture Trimestrielle
 * Visualise 4 quarters of imports × spot/forward scenarios.
 * Helps treasurers see "should I lock now or wait?".
 */
export default function QuarterlyHedge() {
  const [currency, setCurrency] = useState('EUR');
  const [amountPerQ, setAmountPerQ] = useState<number>(250_000);
  const [spot, setSpot] = useState<number>(10.85);
  const [hedgeStrategy, setHedgeStrategy] = useState<'NONE' | 'FORWARD_3M' | 'FORWARD_ROLLING' | 'LAYERED'>('FORWARD_3M');

  // P3.12 — Plausible funnel event
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).plausible) {
      (window as any).plausible('tool_use', { props: { tool: 'quarterly_hedge', currency, strategy: hedgeStrategy } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const quarters = useMemo(() => {
    const out = [];
    const today = new Date();
    for (let q = 0; q < 4; q++) {
      const dueDate = new Date(today);
      dueDate.setMonth(dueDate.getMonth() + (q + 1) * 3);
      const forwardRate = spot * (1 + (0.025 - 0.015) * ((q + 1) * 0.25)); // approximate CIP
      out.push({
        index: q + 1,
        label: `Q${q + 1} ${dueDate.getFullYear()}`,
        dueDate: dueDate.toISOString().slice(0, 10),
        amountFCY: amountPerQ,
        amountMADspot: amountPerQ * spot,
        amountMADforward: amountPerQ * forwardRate,
        forwardRate: +forwardRate.toFixed(4),
      });
    }
    return out;
  }, [amountPerQ, spot]);

  const totalSpot = quarters.reduce((s, q) => s + q.amountMADspot, 0);
  const totalForward = quarters.reduce((s, q) => s + q.amountMADforward, 0);
  const lockIn = totalForward - totalSpot;

  // Shocks per quarter
  const shocks = [-5, -2, 0, 2, 5];
  const shockedTotals = shocks.map((shockPct) => {
    return {
      shockPct,
      totalMAD: quarters.reduce((sum, q, idx) => {
        // Each quarter has progressive shock
        const progression = (idx + 1) / 4;
        const qShock = shockPct * progression;
        const shockedRate = spot * (1 + qShock / 100);
        // If strategy hedges, use forward for covered portion
        let cost = 0;
        if (hedgeStrategy === 'NONE') {
          cost = q.amountFCY * shockedRate;
        } else if (hedgeStrategy === 'FORWARD_3M' || hedgeStrategy === 'FORWARD_ROLLING') {
          // For Q1, full hedge. For Q2-Q4, only the first 3M forward covers Q1
          if (idx === 0) {
            cost = q.amountFCY * q.forwardRate;
          } else {
            cost = q.amountFCY * shockedRate;
          }
        } else if (hedgeStrategy === 'LAYERED') {
          // Layer 50% of each quarter progressively
          const layer = (idx + 1) * 0.25;
          cost = q.amountFCY * (layer * q.forwardRate + (1 - layer) * shockedRate);
        }
        return sum + cost;
      }, 0),
    };
  });

  return (
    <div className="bg-navy-900 border border-navy-700 rounded-2xl p-6 space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center gap-2">
        <Calendar size={16} className="text-gold-500" />
        <h2 className="text-base font-bold text-white">Simulation Couverture Trimestrielle</h2>
        <span className="text-[10px] text-slate-500 ml-auto">4 trimestres · {currency}/MAD</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1.5">Devise</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full appearance-none bg-navy-950 border border-navy-700 rounded-lg px-3 py-2 text-sm text-slate-200"
          >
            {BKAM_CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.code}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1.5">Montant / trimestre</label>
          <input
            type="number"
            value={amountPerQ || ''}
            onChange={(e) => setAmountPerQ(parseFloat(e.target.value) || 0)}
            className="w-full bg-navy-950 border border-navy-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-200"
          />
        </div>
        <div>
          <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1.5">Spot ({currency}/MAD)</label>
          <input
            type="number"
            value={spot}
            onChange={(e) => setSpot(parseFloat(e.target.value) || 0)}
            step="0.0001"
            className="w-full bg-navy-950 border border-navy-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-200"
          />
        </div>
        <div>
          <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1.5">Stratégie</label>
          <div className="relative">
            <select
              value={hedgeStrategy}
              onChange={(e) => setHedgeStrategy(e.target.value as 'NONE' | 'FORWARD_3M' | 'FORWARD_ROLLING' | 'LAYERED')}
              className="w-full appearance-none bg-navy-950 border border-navy-700 rounded-lg px-3 py-2 text-sm text-slate-200"
            >
              <option value="NONE">Aucune couverture</option>
              <option value="FORWARD_3M">Forward 3M sur Q1 uniquement</option>
              <option value="FORWARD_ROLLING">Forward rolling 3M (renouvelé)</option>
              <option value="LAYERED">Couvertures échelonnées (25/50/75/100%)</option>
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Per-quarter table */}
      <div className="bg-navy-950 border border-navy-700 rounded-lg overflow-hidden">
        <table className="w-full text-[12px]">
          <thead className="bg-navy-900">
            <tr className="text-[10px] text-slate-500 uppercase tracking-wider">
              <th className="px-3 py-2 text-left">Trimestre</th>
              <th className="px-3 py-2 text-left">Échéance</th>
              <th className="px-3 py-2 text-right">Montant {currency}</th>
              <th className="px-3 py-2 text-right">@ Spot</th>
              <th className="px-3 py-2 text-right">@ Forward</th>
              <th className="px-3 py-2 text-right">Diff MAD</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-800">
            {quarters.map((q) => {
              const diff = q.amountMADforward - q.amountMADspot;
              return (
                <tr key={q.index} className="hover:bg-navy-900/40">
                  <td className="px-3 py-2 font-mono text-slate-300">{q.label}</td>
                  <td className="px-3 py-2 text-slate-400 text-[11px] font-mono">{q.dueDate}</td>
                  <td className="px-3 py-2 text-right font-mono text-slate-200">{q.amountFCY.toLocaleString('fr-MA')}</td>
                  <td className="px-3 py-2 text-right font-mono text-slate-300">{q.amountMADspot.toLocaleString('fr-MA', { maximumFractionDigits: 0 })}</td>
                  <td className="px-3 py-2 text-right font-mono text-emerald-400">{q.amountMADforward.toLocaleString('fr-MA', { maximumFractionDigits: 0 })}</td>
                  <td className={`px-3 py-2 text-right font-mono ${diff > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {diff > 0 ? '+' : '−'}{Math.abs(diff).toLocaleString('fr-MA', { maximumFractionDigits: 0 })}
                  </td>
                </tr>
              );
            })}
            <tr className="bg-navy-900 font-bold">
              <td colSpan={3} className="px-3 py-2 text-[10px] text-slate-400 uppercase tracking-wider">Total 4 trimestres</td>
              <td className="px-3 py-2 text-right font-mono text-slate-200">{totalSpot.toLocaleString('fr-MA', { maximumFractionDigits: 0 })}</td>
              <td className="px-3 py-2 text-right font-mono text-emerald-400">{totalForward.toLocaleString('fr-MA', { maximumFractionDigits: 0 })}</td>
              <td className={`px-3 py-2 text-right font-mono ${lockIn > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {lockIn > 0 ? '+' : '−'}{Math.abs(lockIn).toLocaleString('fr-MA', { maximumFractionDigits: 0 })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Shocks table */}
      <div className="space-y-2">
        <h3 className="text-[11px] font-bold text-white uppercase tracking-wider">Stress test — variation du spot sur l'horizon</h3>
        <div className="bg-navy-950 border border-navy-700 rounded-lg overflow-hidden">
          <table className="w-full text-[11px]">
            <thead className="bg-navy-900">
              <tr className="text-slate-500 text-[10px] uppercase tracking-wider">
                <th className="px-3 py-2 text-left">Variation max spot</th>
                <th className="px-3 py-2 text-right">Coût total ({hedgeStrategy})</th>
                <th className="px-3 py-2 text-right">Vs scénario médian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-800">
              {shockedTotals.map((s) => {
                const median = shockedTotals[2].totalMAD;
                const diff = s.totalMAD - median;
                return (
                  <tr key={s.shockPct} className="hover:bg-navy-900/40">
                    <td className="px-3 py-2 font-mono text-slate-300">
                      {s.shockPct > 0 ? '+' : ''}{s.shockPct}%
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-slate-200">{s.totalMAD.toLocaleString('fr-MA', { maximumFractionDigits: 0 })}</td>
                    <td className={`px-3 py-2 text-right font-mono ${diff > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {diff > 0 ? '+' : '−'}{Math.abs(diff).toLocaleString('fr-MA', { maximumFractionDigits: 0 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-start gap-2 p-2.5 bg-amber-500/5 border border-amber-500/20 rounded-lg">
        <AlertTriangle size={12} className="text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-[10px] text-amber-200/80 leading-relaxed">
          <strong>Outil pédagogique.</strong> Les taux forward sont indicatifs (CIP approx). Pour un cours ferme, contactez votre banque.
          Cette simulation suppose une progression linéaire du choc sur 4 trimestres — la réalité est stochastique.
        </p>
      </div>
    </div>
  );
}
