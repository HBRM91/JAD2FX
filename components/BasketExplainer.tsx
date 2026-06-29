import { useState, useMemo } from 'react';
import { Calculator, TrendingUp, AlertCircle, Info } from 'lucide-react';
import { BKAM_CURRENCIES, DEFAULT_BASKET_CONFIG } from '../constants';

/**
 * P4.3 — Interactive BKAM basket explainer.
 * Sliders for EUR weight, USD weight, K (basket constant), and EUR/USD.
 * Shows real-time: central parity, band edges, comparison vs spot.
 */
export default function BasketExplainer() {
  const [eurWeight, setEurWeight] = useState(DEFAULT_BASKET_CONFIG.eurWeight * 100);
  const [usdWeight, setUsdWeight] = useState(DEFAULT_BASKET_CONFIG.usdWeight * 100);
  const [k, setK] = useState(DEFAULT_BASKET_CONFIG.referenceBasketValue);
  const [eurUsd, setEurUsd] = useState(1.085);
  const [spotUsdMad, setSpotUsdMad] = useState(9.95);

  const result = useMemo(() => {
    const totalWeight = eurWeight + usdWeight;
    if (Math.abs(totalWeight - 100) > 0.1) {
      return { error: `Poids total = ${totalWeight.toFixed(1)}% (doit = 100%)` };
    }
    const eurW = eurWeight / 100;
    const usdW = usdWeight / 100;
    const centralUsdMad = k / (eurW * eurUsd + usdW);
    const centralEurMad = centralUsdMad * eurUsd;
    const upper5 = centralUsdMad * 1.05;
    const lower5 = centralUsdMad * 0.95;
    const deviationPct = ((spotUsdMad - centralUsdMad) / centralUsdMad) * 100;
    return {
      centralUsdMad: +centralUsdMad.toFixed(4),
      centralEurMad: +centralEurMad.toFixed(4),
      upper5: +upper5.toFixed(4),
      lower5: +lower5.toFixed(4),
      deviationPct: +deviationPct.toFixed(2),
      direction: spotUsdMad > centralUsdMad ? 'MAD sous-évalué' : 'MAD surévalué',
    };
  }, [eurWeight, usdWeight, k, eurUsd, spotUsdMad]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Calculator size={14} className="text-gold-500" />
        <h1 className="text-base font-bold text-white uppercase tracking-wider">Comment fonctionne le panier BKAM</h1>
      </div>

      <div className="bg-navy-900 border border-navy-700 rounded-2xl p-5 space-y-5">
        {/* Formula reminder */}
        <div className="bg-navy-950 border border-navy-800 rounded-lg p-3">
          <p className="text-[11px] text-slate-400 font-mono">
            USD/MAD_central = <span className="text-gold-400">K</span> / (<span className="text-blue-400">w_eur</span> × EUR/USD + <span className="text-emerald-400">w_usd</span>)
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            Le panier est composé à 60% EUR + 40% USD depuis 2018 (Phase II). Le coefficient K est fixé à 10.49 par Bank Al-Maghrib. La bande de fluctuation autorisée est de ±5% (Phase II depuis 2020).
          </p>
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center justify-between text-[10px] text-blue-400 font-semibold uppercase tracking-wider mb-1.5">
              <span>Poids EUR (w_eur)</span>
              <span className="font-mono text-base text-white">{eurWeight.toFixed(0)}%</span>
            </label>
            <input
              type="range" min="0" max="100" step="5" value={eurWeight}
              onChange={(e) => setEurWeight(parseInt(e.target.value, 10))}
              className="w-full accent-blue-500"
            />
            <div className="flex justify-between text-[9px] text-slate-600 mt-0.5">
              <span>0%</span><span>50%</span><span>100%</span>
            </div>
          </div>
          <div>
            <label className="flex items-center justify-between text-[10px] text-emerald-400 font-semibold uppercase tracking-wider mb-1.5">
              <span>Poids USD (w_usd)</span>
              <span className="font-mono text-base text-white">{usdWeight.toFixed(0)}%</span>
            </label>
            <input
              type="range" min="0" max="100" step="5" value={usdWeight}
              onChange={(e) => setUsdWeight(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-500"
            />
            <div className="flex justify-between text-[9px] text-slate-600 mt-0.5">
              <span>0%</span><span>50%</span><span>100%</span>
            </div>
          </div>
          <div>
            <label className="flex items-center justify-between text-[10px] text-gold-400 font-semibold uppercase tracking-wider mb-1.5">
              <span>Coefficient K (USD/MAD à parité)</span>
              <span className="font-mono text-base text-white">{k.toFixed(2)}</span>
            </label>
            <input
              type="number" step="0.01" value={k}
              onChange={(e) => setK(parseFloat(e.target.value) || 10.49)}
              className="w-full bg-navy-950 border border-navy-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-200"
            />
          </div>
          <div>
            <label className="flex items-center justify-between text-[10px] text-purple-400 font-semibold uppercase tracking-wider mb-1.5">
              <span>EUR/USD (BCE exogène)</span>
              <span className="font-mono text-base text-white">{eurUsd.toFixed(4)}</span>
            </label>
            <input
              type="number" step="0.0001" value={eurUsd}
              onChange={(e) => setEurUsd(parseFloat(e.target.value) || 1.0)}
              className="w-full bg-navy-950 border border-navy-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-200"
            />
          </div>
        </div>

        <div>
          <label className="flex items-center justify-between text-[10px] text-amber-400 font-semibold uppercase tracking-wider mb-1.5">
            <span>Spot actuel USD/MAD (à comparer)</span>
            <span className="font-mono text-base text-white">{spotUsdMad.toFixed(4)}</span>
          </label>
          <input
            type="number" step="0.0001" value={spotUsdMad}
            onChange={(e) => setSpotUsdMad(parseFloat(e.target.value) || 0)}
            className="w-full bg-navy-950 border border-navy-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-200"
          />
        </div>

        {/* Result */}
        {'error' in result ? (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <AlertCircle size={14} className="text-red-400" />
            <p className="text-[12px] text-red-300 font-mono">{result.error}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-navy-950 border border-gold-700/50 rounded-lg p-3">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">USD/MAD central</p>
                <p className="text-2xl font-bold font-mono text-gold-400 mt-1">{result.centralUsdMad}</p>
                <p className="text-[10px] text-slate-500">parité panier calculée</p>
              </div>
              <div className="bg-navy-950 border border-navy-700 rounded-lg p-3">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">EUR/MAD central</p>
                <p className="text-2xl font-bold font-mono text-blue-400 mt-1">{result.centralEurMad}</p>
                <p className="text-[10px] text-slate-500">EUR/USD × USD/MAD</p>
              </div>
              <div className="bg-navy-950 border border-navy-700 rounded-lg p-3">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Bande ±5%</p>
                <p className="text-base font-bold font-mono text-slate-300 mt-1">
                  {result.lower5} → {result.upper5}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">inf → sup</p>
              </div>
            </div>

            <div className={`p-3 rounded-lg border ${
              Math.abs(result.deviationPct) > 2
                ? 'bg-amber-500/10 border-amber-500/30'
                : 'bg-navy-950 border-navy-800'
            }`}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] text-slate-300">
                  <span className="font-bold">Spot vs parité:</span>{' '}
                  <span className="font-mono">
                    {spotUsdMad.toFixed(4)} vs {result.centralUsdMad.toFixed(4)} ={' '}
                    <span className={result.deviationPct > 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {result.deviationPct > 0 ? '+' : ''}{result.deviationPct}%
                    </span>
                  </span>
                </p>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                  result.deviationPct > 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {result.direction}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-start gap-2 p-2.5 bg-amber-500/5 border border-amber-500/20 rounded-lg">
          <Info size={11} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-amber-200/80 leading-relaxed">
            <strong>Outil pédagogique.</strong> Les poids, K et la bande sont fixés par Bank Al-Maghrib dans le cadre du régime de change.
            Ce simulateur permet de comprendre la mécanique — pas de recalculer le fixing officiel.
          </p>
        </div>
      </div>
    </div>
  );
}
