import { useState, useMemo } from 'react';
import { Calculator, TrendingUp, TrendingDown, AlertTriangle, FileText, Info } from 'lucide-react';
import { BKAM_CURRENCIES } from '../constants';

/**
 * P3.24 — Calculateur de Coût d'Import
 * SME-focused tool: enter an invoice in EUR + delivery date, see
 * the MAD cost at spot vs 3M forward.
 *
 * Use case: a treasurer wants to know "if I import €100k of equipment
 * payable in 90 days, what is my MAD exposure? How much would a 3M
 * forward save me if the MAD moves?"
 */
export default function ImportCostCalc() {
  const [currency, setCurrency] = useState('EUR');
  const [amount, setAmount] = useState<number>(100_000);
  const [spotRate, setSpotRate] = useState<number>(10.85);
  const [daysUntil, setDaysUntil] = useState<number>(90);
  const [forwardRate, setForwardRate] = useState<number>(10.91); // Default plausible forward
  const [hedgePct, setHedgePct] = useState<number>(80); // % hedged via forward

  const result = useMemo(() => {
    const spotCostMAD = amount * spotRate;
    const forwardCostMAD = amount * forwardRate;
    // Cost of not hedging: 100% exposed to spot (which is currently what we show)
    // Cost of hedging X% at forward rate
    const hedgedAmount = amount * (hedgePct / 100);
    const unhedgedAmount = amount - hedgedAmount;
    const hedgedCostMAD = hedgedAmount * forwardRate + unhedgedAmount * spotRate;
    const lockedInMAD = hedgedAmount * forwardRate;

    // Scenarios: what if spot moves ±2%, ±5%?
    const scenarios = [-0.05, -0.02, 0, 0.02, 0.05].map((shock) => {
      const shockedSpot = spotRate * (1 + shock);
      const totalCostShock = hedgedAmount * forwardRate + unhedgedAmount * shockedSpot;
      return {
        shockPct: shock * 100,
        shockedSpot: +shockedSpot.toFixed(4),
        totalCostMAD: +totalCostShock.toFixed(0),
        savingVsSpot: +(spotCostMAD - totalCostShock).toFixed(0),
      };
    });

    return {
      spotCostMAD: +spotCostMAD.toFixed(0),
      forwardCostMAD: +forwardCostMAD.toFixed(0),
      hedgedCostMAD: +hedgedCostMAD.toFixed(0),
      lockedInMAD: +lockedInMAD.toFixed(0),
      unhedgedAmount,
      scenarios,
    };
  }, [amount, spotRate, forwardRate, hedgePct]);

  return (
    <div className="bg-navy-900 border border-navy-700 rounded-2xl p-6 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-2">
        <Calculator size={16} className="text-gold-500" />
        <h2 className="text-base font-bold text-white">Calculateur de Coût d'Import</h2>
        <span className="text-[10px] text-slate-500 ml-auto">Outil PME · Scénarios de couverture</span>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1.5">
            Devise facture
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full appearance-none bg-navy-950 border border-navy-700 rounded-lg px-3 py-2 text-sm text-slate-200"
          >
            {BKAM_CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} — {c.nameFr}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1.5">
            Montant facture ({currency})
          </label>
          <input
            type="number"
            value={amount || ''}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            step="1000"
            min="0"
            className="w-full bg-navy-950 border border-navy-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-200"
          />
        </div>

        <div>
          <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1.5">
            Spot actuel ({currency}/MAD)
          </label>
          <input
            type="number"
            value={spotRate}
            onChange={(e) => setSpotRate(parseFloat(e.target.value) || 0)}
            step="0.0001"
            min="0"
            className="w-full bg-navy-950 border border-navy-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-200"
          />
        </div>

        <div>
          <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1.5">
            Forward {daysUntil}j ({currency}/MAD)
          </label>
          <input
            type="number"
            value={forwardRate}
            onChange={(e) => setForwardRate(parseFloat(e.target.value) || 0)}
            step="0.0001"
            min="0"
            className="w-full bg-navy-950 border border-navy-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-200"
          />
        </div>

        <div>
          <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1.5">
            Échéance (jours)
          </label>
          <input
            type="number"
            value={daysUntil}
            onChange={(e) => setDaysUntil(parseInt(e.target.value, 10) || 0)}
            step="1"
            min="0"
            max="365"
            className="w-full bg-navy-950 border border-navy-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-200"
          />
        </div>

        <div>
          <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1.5">
            % couvert par forward
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              value={hedgePct}
              onChange={(e) => setHedgePct(parseInt(e.target.value, 10))}
              min="0"
              max="100"
              step="5"
              className="flex-1 accent-gold-500"
            />
            <span className="font-mono text-sm text-gold-400 w-12 text-right">{hedgePct}%</span>
          </div>
        </div>
      </div>

      {/* Results */}
      {amount > 0 && spotRate > 0 && (
        <div className="space-y-3 pt-2">
          <h3 className="text-[11px] font-bold text-white uppercase tracking-wider">Scénario à l'échéance</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-navy-950 border border-navy-700 rounded-lg p-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Coût total @ spot</p>
              <p className="text-lg font-bold font-mono text-slate-200 mt-1">
                {result.spotCostMAD.toLocaleString('fr-MA')}
              </p>
              <p className="text-[10px] text-slate-500">MAD · 100% non couvert</p>
            </div>
            <div className="bg-navy-950 border border-navy-700 rounded-lg p-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Coût total @ forward</p>
              <p className="text-lg font-bold font-mono text-emerald-400 mt-1">
                {result.forwardCostMAD.toLocaleString('fr-MA')}
              </p>
              <p className="text-[10px] text-slate-500">MAD · 100% couvert</p>
            </div>
            <div className="bg-navy-950 border border-gold-700/50 rounded-lg p-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Coût avec couverture {hedgePct}%</p>
              <p className="text-lg font-bold font-mono text-gold-400 mt-1">
                {result.hedgedCostMAD.toLocaleString('fr-MA')}
              </p>
              <p className="text-[10px] text-slate-500">MAD · mixte forward+spot</p>
            </div>
          </div>

          {/* Scenario shock table */}
          <div className="bg-navy-950 border border-navy-700 rounded-lg overflow-hidden">
            <table className="w-full text-[11px]">
              <thead className="bg-navy-900">
                <tr className="text-slate-500 text-[10px] uppercase tracking-wider">
                  <th className="px-3 py-2 text-left">Scénario</th>
                  <th className="px-3 py-2 text-right">Spot choqué</th>
                  <th className="px-3 py-2 text-right">Coût total</th>
                  <th className="px-3 py-2 text-right">Vs 100% spot</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800">
                {result.scenarios.map((s) => {
                  const isLoss = s.savingVsSpot < 0;
                  return (
                    <tr key={s.shockPct} className="hover:bg-navy-900/50">
                      <td className="px-3 py-2 font-mono text-slate-300">
                        {s.shockPct > 0 ? '+' : ''}{s.shockPct.toFixed(0)}%
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-slate-300">{s.shockedSpot.toFixed(4)}</td>
                      <td className="px-3 py-2 text-right font-mono text-slate-200">
                        {s.totalCostMAD.toLocaleString('fr-MA')}
                      </td>
                      <td className={`px-3 py-2 text-right font-mono font-bold ${isLoss ? 'text-red-400' : 'text-emerald-400'}`}>
                        {isLoss ? '+' : '−'}{Math.abs(s.savingVsSpot).toLocaleString('fr-MA')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-start gap-2 p-2.5 bg-amber-500/5 border border-amber-500/20 rounded-lg">
            <Info size={12} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-[10px] text-amber-200/80 leading-relaxed">
              <strong>Important :</strong> cet outil illustre l'impact économique d'une variation de change sur une facture non couverte.
              Le taux forward utilisé est indicatif — pour un cours ferme, contactez votre banque domiciliataire agréée BAM.
              <br />
              <span className="text-slate-400">
                Circ. OC 01/2024 : forwards et options vanilla autorisés. Exotiques et binaire interdits.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
