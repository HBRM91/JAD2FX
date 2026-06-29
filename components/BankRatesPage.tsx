import { useState } from 'react';
import { Banknote, ArrowUpDown, ExternalLink, Building2 } from 'lucide-react';
import { BKAM_CURRENCIES } from '../constants';

/**
 * P1.8 — Bank quotes comparison page.
 * Synthetic display of 5 Moroccan banks' indicative EUR/MAD quotes.
 * In production: real quotes from a licensed FX data aggregator.
 */

const BANKS = [
  { id: 'attijariwafa', name: 'Attijariwafa Bank',      emoji: '🏛️', color: 'text-blue-400' },
  { id: 'bp',           name: 'Banque Populaire',      emoji: '🏛️', color: 'text-emerald-400' },
  { id: 'bmce',         name: 'BMCE (Bank of Africa)', emoji: '🏛️', color: 'text-amber-400' },
  { id: 'cih',          name: 'CIH Bank',              emoji: '🏛️', color: 'text-purple-400' },
  { id: 'sg',           name: 'Société Générale Maroc', emoji: '🏛️', color: 'text-red-400' },
];

/** Indicative quotes — synthetic spread pattern around mid. */
function getBankQuote(currency: string, mid: number, bankId: string): { bid: number; ask: number } {
  // Bank-specific spread premium (bps) — synthetic
  const premiums: Record<string, number> = {
    attijariwafa: 0.10,
    bp: 0.12,
    bmce: 0.15,
    cih: 0.18,
    sg: 0.08,
  };
  const p = premiums[bankId] || 0.10;
  const half = (mid * p) / 2;
  return { bid: +(mid - half).toFixed(4), ask: +(mid + half).toFixed(4) };
}

export default function BankRatesPage() {
  const [currency, setCurrency] = useState('EUR');
  // Use a synthetic mid — in production read from live ticker
  const midMap: Record<string, number> = {
    EUR: 10.85, USD: 9.95, GBP: 12.59, JPY: 6.66, CHF: 11.46, CAD: 7.32,
  };
  const mid = midMap[currency] || 10.85;

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center gap-2">
        <Banknote size={14} className="text-gold-500" />
        <h1 className="text-base font-bold text-white uppercase tracking-wider">Comparatif Banques</h1>
        <span className="text-[10px] text-slate-500 ml-auto">P1.8 · 5 banques · Indicatif virement</span>
      </div>

      <div className="flex items-start gap-2 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
        <span className="text-amber-400 text-xs">ℹ️</span>
        <p className="text-[10px] text-amber-200/80 leading-relaxed">
          <strong>Indicatif pédagogique.</strong> Cotes synthétiques simulant la structure de spreads virement typiques (8-18 bps par banque). Pour des taux fermes, contactez votre banque.
        </p>
      </div>

      {/* Currency selector */}
      <div className="bg-navy-900 border border-navy-700 rounded-xl p-3 flex items-center gap-3 flex-wrap">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">CCY / MAD</span>
        {Object.keys(midMap).map((c) => (
          <button
            key={c}
            onClick={() => setCurrency(c)}
            className={`px-3 py-1 text-[11px] font-bold rounded transition-colors ${
              currency === c
                ? 'bg-gold-500 text-navy-950'
                : 'bg-navy-950 text-slate-300 border border-navy-700 hover:border-gold-500/50'
            }`}
          >
            {c}/MAD
          </button>
        ))}
      </div>

      {/* Mid reference */}
      <div className="bg-navy-900 border border-gold-700/40 rounded-xl p-4 text-center">
        <p className="text-[10px] text-slate-500 uppercase tracking-wider">Mid de référence</p>
        <p className="text-3xl font-bold font-mono text-gold-400 mt-1">{mid.toFixed(4)}</p>
        <p className="text-[10px] text-slate-500 mt-1">{currency}/MAD · indicatif</p>
      </div>

      {/* Bank comparison table */}
      <div className="bg-navy-900 border border-navy-700 rounded-xl overflow-hidden">
        <table className="w-full text-[11px]">
          <thead className="bg-navy-950">
            <tr className="text-[9px] text-slate-500 uppercase tracking-wider">
              <th className="px-3 py-2 text-left">Banque</th>
              <th className="px-3 py-2 text-right">Bid (vous vendez)</th>
              <th className="px-3 py-2 text-right">Ask (vous achetez)</th>
              <th className="px-3 py-2 text-right">Spread (bps)</th>
              <th className="px-3 py-2 text-right">Coût 100k</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-800">
            {BANKS.map((bank) => {
              const q = getBankQuote(currency, mid, bank.id);
              const spreadBps = +(((q.ask - q.bid) / mid) * 10000).toFixed(1);
              const cost = +((q.ask - mid) * 100000).toFixed(0);
              return (
                <tr key={bank.id} className="hover:bg-navy-800/30">
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <Building2 size={12} className={bank.color} />
                      <span className="font-bold text-slate-200">{bank.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-emerald-400">{q.bid.toFixed(4)}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-red-400">{q.ask.toFixed(4)}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-slate-400">{spreadBps}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-amber-400">+{cost.toLocaleString('fr-MA')} {currency}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Best/worst analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-navy-900 border border-emerald-700/30 rounded-xl p-4">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Meilleur BID (vous vendez {currency})</p>
          <p className="text-base font-bold text-emerald-400 mt-1">Société Générale Maroc</p>
          <p className="text-[10px] text-slate-400 mt-1">Spread le plus serré · exécution rapide</p>
        </div>
        <div className="bg-navy-900 border border-amber-700/30 rounded-xl p-4">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Spread médian marché</p>
          <p className="text-base font-bold text-amber-400 mt-1">~12 bps</p>
          <p className="text-[10px] text-slate-400 mt-1">Pour 1M {currency} → ~1 200 MAD de coût de spread</p>
        </div>
      </div>

      <p className="text-[10px] text-slate-500 text-center italic">
        Pour exécuter au meilleur cours, contactez un trader FX de votre banque · Marché interbancaire BAM, 8h30-15h30.
      </p>
    </div>
  );
}
