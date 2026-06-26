import React, { useState, useMemo } from 'react';
import { Calculator, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import CurrencyFlag from '../CurrencyFlag';
import { useAdmin } from '../../context/AdminContext';
import { BKAM_CURRENCIES } from '../../constants';

const BKAM_CC: Record<string, string> = Object.fromEntries(BKAM_CURRENCIES.map(c => [c.code, c.countryCode]));

export default function InvoiceImpactCalc() {
  const { livePrices } = useAdmin();
  const [amount, setAmount]   = useState('100000');
  const [currency, setCurrency] = useState('EUR');
  const [margin, setMargin]   = useState('15');

  const spotRate = useMemo(() => {
    const entry = livePrices.find(p => p.currency === currency);
    return entry?.mid ?? null;
  }, [livePrices, currency]);

  const invoiceMAD  = spotRate ? parseFloat(amount || '0') * spotRate : null;
  const bps100      = spotRate ? parseFloat(amount || '0') * spotRate * 0.01   : null; // 100 bps = 1%
  const bps200      = spotRate ? parseFloat(amount || '0') * spotRate * 0.02   : null;
  const bps300      = spotRate ? parseFloat(amount || '0') * spotRate * 0.03   : null;
  const marginMAD   = invoiceMAD && parseFloat(margin || '0') > 0
    ? invoiceMAD * (parseFloat(margin) / 100)
    : null;

  const pctOfMargin100 = marginMAD && bps100 ? (bps100 / marginMAD * 100) : null;
  const pctOfMargin200 = marginMAD && bps200 ? (bps200 / marginMAD * 100) : null;
  const pctOfMargin300 = marginMAD && bps300 ? (bps300 / marginMAD * 100) : null;

  const fmt = (n: number) => n.toLocaleString('fr-MA', { maximumFractionDigits: 0 });

  const availableCurrencies = BKAM_CURRENCIES.filter(c =>
    livePrices.some(p => p.currency === c.code)
  );

  return (
    <div className="space-y-5">
      <div className="bg-navy-900 border border-navy-700 rounded-2xl overflow-hidden">
        <div className="h-0.5 bg-gradient-to-r from-purple-700 via-purple-400 to-purple-700" />
        <div className="p-5">
          <div className="flex items-center gap-2 mb-1">
            <Calculator size={15} className="text-purple-400" />
            <span className="text-[9px] font-bold text-purple-400 uppercase tracking-[0.2em] bg-purple-500/10 border border-purple-500/25 px-2 py-0.5 rounded">
              Outil — Impact Marge
            </span>
          </div>
          <h2 className="text-lg font-serif font-bold text-white mb-1">
            Calculateur d'Impact Change sur Facture
          </h2>
          <p className="text-sm text-slate-400">
            Estimez l'érosion de marge commerciale en dirhams selon les scénarios de change — 100, 200, 300 bps.
          </p>
        </div>
      </div>

      {/* Inputs */}
      <div className="bg-navy-900 border border-navy-700 rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          {/* Amount */}
          <div>
            <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 font-bold">
              Montant facture
            </label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full bg-navy-950 border border-navy-700 rounded-lg px-3 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="100000"
            />
          </div>

          {/* Currency */}
          <div>
            <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 font-bold">
              Devise
            </label>
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className="w-full bg-navy-950 border border-navy-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors appearance-none"
            >
              {availableCurrencies.map(c => (
                <option key={c.code} value={c.code}>{c.code}/MAD — {c.nameFr}</option>
              ))}
            </select>
          </div>

          {/* Margin % */}
          <div>
            <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 font-bold">
              Marge brute (%)
            </label>
            <input
              type="number"
              value={margin}
              onChange={e => setMargin(e.target.value)}
              min="1" max="100" step="0.5"
              className="w-full bg-navy-950 border border-navy-700 rounded-lg px-3 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="15"
            />
          </div>
        </div>

        {/* Spot rate display */}
        {spotRate && (
          <div className="flex items-center gap-2 p-3 bg-navy-800 border border-navy-700 rounded-lg">
            <CurrencyFlag countryCode={BKAM_CC[currency] ?? 'un'} size="sm" />
            <span className="text-[11px] text-slate-400">Taux indicatif actuel</span>
            <span className="font-mono font-bold text-white ml-1">{currency}/MAD {spotRate.toFixed(4)}</span>
            <span className="text-[9px] text-slate-600 ml-auto">indicatif · non exécutable</span>
          </div>
        )}
      </div>

      {/* Results */}
      {invoiceMAD && invoiceMAD > 0 ? (
        <div className="space-y-3">
          {/* Baseline */}
          <div className="bg-navy-900 border border-navy-700 rounded-xl p-5">
            <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-3 font-bold">Valorisation au taux actuel</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-navy-800 rounded-lg p-3">
                <p className="text-[9px] text-slate-500 mb-1">Facture en MAD</p>
                <p className="text-xl font-mono font-bold text-white">{fmt(invoiceMAD)}</p>
                <p className="text-[10px] text-slate-600">MAD</p>
              </div>
              {marginMAD && (
                <div className="bg-navy-800 rounded-lg p-3">
                  <p className="text-[9px] text-slate-500 mb-1">Marge brute ({margin}%)</p>
                  <p className="text-xl font-mono font-bold text-gold-400">{fmt(marginMAD)}</p>
                  <p className="text-[10px] text-slate-600">MAD</p>
                </div>
              )}
            </div>
          </div>

          {/* Scenarios */}
          <div className="bg-navy-900 border border-navy-700 rounded-xl p-5">
            <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-3 font-bold">
              Impact d'un mouvement défavorable {currency}/MAD
            </p>
            <div className="space-y-2">
              {[
                { bps: 100, loss: bps100, pct: pctOfMargin100, color: 'text-amber-400', bg: 'bg-amber-500/5 border-amber-700/30', Icon: TrendingDown },
                { bps: 200, loss: bps200, pct: pctOfMargin200, color: 'text-orange-400', bg: 'bg-orange-500/5 border-orange-700/30', Icon: TrendingDown },
                { bps: 300, loss: bps300, pct: pctOfMargin300, color: 'text-red-400',    bg: 'bg-red-500/5 border-red-700/30',    Icon: AlertTriangle },
              ].map(s => s.loss !== null && (
                <div key={s.bps} className={`flex items-center justify-between p-3 rounded-lg border ${s.bg}`}>
                  <div className="flex items-center gap-2.5">
                    <s.Icon size={13} className={s.color} />
                    <div>
                      <p className="text-[11px] font-bold text-white">Scénario +{s.bps} bps ({s.bps/100}%)</p>
                      {s.pct !== null && (
                        <p className="text-[9px] text-slate-500">
                          Représente {s.pct.toFixed(1)}% de votre marge brute
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-mono font-bold ${s.color}`}>−{fmt(s.loss)} MAD</p>
                  </div>
                </div>
              ))}
            </div>

            {pctOfMargin200 && pctOfMargin200 > 25 && (
              <div className="mt-3 flex items-start gap-2 p-3 bg-amber-500/8 border border-amber-700/30 rounded-lg">
                <AlertTriangle size={12} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-300/80 leading-snug">
                  Un mouvement de 200 bps absorberait plus de 25% de votre marge brute. La Circulaire OC
                  n°01/2024 autorise la couverture jusqu'à 100% de l'exposition documentée via votre banque agréée BAM.
                </p>
              </div>
            )}
          </div>

          {/* Favorable scenario */}
          <div className="bg-navy-900 border border-navy-700 rounded-xl p-4">
            <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-2 font-bold">
              Scénario favorable (mouvement −{currency}/MAD)
            </p>
            {[100, 200, 300].map(b => (
              bps100 !== null && (
                <div key={b} className="flex items-center justify-between py-1.5 border-b border-navy-800 last:border-0">
                  <span className="text-[11px] text-slate-400">−{b} bps ({b/100}%)</span>
                  <span className="text-[11px] font-mono font-bold text-emerald-400">+{fmt(invoiceMAD * (b/10000))} MAD</span>
                </div>
              )
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-navy-900 border border-navy-700 rounded-xl p-8 text-center">
          {livePrices.length === 0 ? (
            <p className="text-slate-500 text-sm">Chargement des taux en cours…</p>
          ) : (
            <p className="text-slate-500 text-sm">Saisissez un montant pour voir l'impact de change.</p>
          )}
        </div>
      )}

      <p className="text-[9px] text-slate-700 text-center leading-relaxed">
        Estimations indicatives basées sur les taux JAD2FX (non exécutables). Marge brute et scénarios sont
        des hypothèses de l'utilisateur. JAD2 Advisory — non établissement financier agréé BAM (Loi n° 43-12).
      </p>
    </div>
  );
}
