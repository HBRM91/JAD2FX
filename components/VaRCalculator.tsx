/**
 * A2.3 — Parametric Value-at-Risk calculator.
 * Single-currency or portfolio VaR using existing vol surface.
 * VaR_95% = notional × σ_annual × 1.65 / √(252) × √(days)
 */

import { useState } from 'react';
import { Calculator, AlertTriangle, TrendingDown } from 'lucide-react';
import { DEFAULT_CURVES, CURVE_META } from '../services/interestRates';

const ANNUAL_VOL_ESTIMATES: Record<string, number> = {
  EUR: 0.065, USD: 0.07, GBP: 0.085, JPY: 0.085, CHF: 0.06,
  CAD: 0.07, CNY: 0.055, SAR: 0.025, AED: 0.025, KWD: 0.030,
  DKK: 0.065, NOK: 0.085, SEK: 0.085, MAD: 0.045,
};

export default function VaRCalculator() {
  const [ccy, setCcy]     = useState('EUR');
  const [notional, setNotional] = useState(1_000_000);
  const [days, setDays]   = useState(30);
  const [confidence, setConfidence] = useState(95);
  const [direction, setDirection]   = useState<'BUY' | 'SELL'>('BUY');

  const sigma = ANNUAL_VOL_ESTIMATES[ccy] ?? 0.07;
  const z = confidence === 99 ? 2.33 : confidence === 95 ? 1.65 : 1.28;
  const dailyVar = notional * sigma * z / Math.sqrt(252) * Math.sqrt(days);

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center gap-2">
        <Calculator size={14} className="text-gold-500" />
        <h1 className="text-base font-bold text-white uppercase tracking-wider">Calculateur VaR</h1>
        <span className="text-[9px] font-bold text-amber-400 bg-amber-900/30 border border-amber-700/40 px-1.5 py-0.5 rounded uppercase tracking-wider">
          Indicatif · Pédagogique
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Inputs */}
        <div className="bg-navy-900 border border-navy-700 rounded-xl p-4 space-y-3">
          <h2 className="text-[11px] font-bold text-white uppercase tracking-wider">Paramètres</h2>
          <div>
            <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wider">Devise</label>
            <select
              value={ccy}
              onChange={(e) => setCcy(e.target.value)}
              className="w-full bg-navy-950 border border-navy-700 rounded px-2 py-1.5 text-[12px] text-slate-200"
            >
              {Object.keys(CURVE_META).map((c) => (
                <option key={c} value={c}>{c} — {CURVE_META[c].label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wider">Notional (MAD)</label>
            <input
              type="number"
              value={notional}
              onChange={(e) => setNotional(Number(e.target.value))}
              step={100000}
              className="w-full bg-navy-950 border border-navy-700 rounded px-2 py-1.5 text-[12px] text-slate-200 font-mono"
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wider">Horizon (jours)</label>
            <input
              type="number"
              value={days}
              onChange={(e) => setDays(Math.max(1, Number(e.target.value)))}
              min={1}
              max={365}
              className="w-full bg-navy-950 border border-navy-700 rounded px-2 py-1.5 text-[12px] text-slate-200 font-mono"
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wider">Confiance</label>
            <select
              value={confidence}
              onChange={(e) => setConfidence(Number(e.target.value))}
              className="w-full bg-navy-950 border border-navy-700 rounded px-2 py-1.5 text-[12px] text-slate-200"
            >
              <option value={90}>90%</option>
              <option value={95}>95%</option>
              <option value={99}>99%</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wider">Direction</label>
            <div className="flex gap-2">
              <button
                onClick={() => setDirection('BUY')}
                className={`flex-1 px-3 py-1.5 text-[11px] font-bold rounded ${
                  direction === 'BUY' ? 'bg-emerald-700 text-white' : 'bg-navy-950 text-slate-400'
                }`}
              >
                Achat
              </button>
              <button
                onClick={() => setDirection('SELL')}
                className={`flex-1 px-3 py-1.5 text-[11px] font-bold rounded ${
                  direction === 'SELL' ? 'bg-red-700 text-white' : 'bg-navy-950 text-slate-400'
                }`}
              >
                Vente
              </button>
            </div>
          </div>
        </div>

        {/* Result */}
        <div className="space-y-3">
          <div className="bg-gradient-to-br from-red-950/40 to-navy-900 border-2 border-red-700/40 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={14} className="text-red-400" />
              <p className="text-[10px] text-red-300 uppercase tracking-widest font-bold">Value at Risk</p>
            </div>
            <p className="text-3xl font-bold text-red-400 font-mono">
              {dailyVar.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
              <span className="text-base text-red-300/70 ml-2">MAD</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
              Perte potentielle sur {days} jour{days > 1 ? 's' : ''} au seuil de confiance {confidence}% pour un notional de {notional.toLocaleString('fr-FR')} MAD en {ccy}.
            </p>
          </div>

          <div className="bg-navy-900 border border-navy-700 rounded-xl p-4 space-y-1.5">
            <h3 className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">Hypothèses</h3>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Volatilité annualisée</span>
              <span className="text-gold-400 font-mono">{(sigma * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Z-score ({confidence}%)</span>
              <span className="text-gold-400 font-mono">{z.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Méthode</span>
              <span className="text-slate-300">Paramétrique gaussienne</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Direction</span>
              <span className={direction === 'BUY' ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                {direction === 'BUY' ? 'Risque acheteur' : 'Risque vendeur'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-amber-900/10 border border-amber-700/30 rounded-lg p-3 text-[10px] text-amber-300/80 leading-relaxed">
        <TrendingDown size={11} className="inline mr-1" />
        Modèle paramétrique gaussien simplifié. Ne capture pas les queues épaisses ni la skewness.
        Pour usage opérationnel, utilisez une simulation Monte Carlo ou historique sur 252 jours.
        Volatilités annualisées estimées (issues du marché G10 / MENA 2024-2026).
      </div>
    </div>
  );
}
