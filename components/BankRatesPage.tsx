import { useState, useEffect } from 'react';
import { Banknote, ArrowUpDown, ExternalLink, Building2, RefreshCw } from 'lucide-react';
import { BKAM_CURRENCIES } from '../constants';
import { Skeleton } from './Skeleton';

/**
 * P1.8 — Bank quotes comparison page.
 * Fetches indicative quotes from worker /v1/bank-quotes (KV-cached, refreshed
 * daily by cron). Falls back to local synthetic quotes when worker offline.
 */

const BANKS = [
  { id: 'attijariwafa', name: 'Attijariwafa Bank',       emoji: '🏛️', color: 'text-blue-400' },
  { id: 'bp',           name: 'Banque Populaire',       emoji: '🏛️', color: 'text-emerald-400' },
  { id: 'bmce',         name: 'BMCE (Bank of Africa)',  emoji: '🏛️', color: 'text-amber-400' },
  { id: 'cih',          name: 'CIH Bank',               emoji: '🏛️', color: 'text-purple-400' },
  { id: 'sg',           name: 'Société Générale Maroc', emoji: '🏛️', color: 'text-red-400' },
];

/** Local fallback quotes — used when worker is offline. */
const FALLBACK_MID: Record<string, number> = {
  EUR: 10.85, USD: 9.95, GBP: 12.59, JPY: 6.66, CHF: 11.46, CAD: 7.32,
};
const FALLBACK_PREMIUMS: Record<string, number> = {
  attijariwafa: 0.0010, bp: 0.0012, bmce: 0.0015, cih: 0.0018, sg: 0.0008,
};

function getLocalQuote(currency: string, bankId: string): { bid: number; ask: number; spreadBps: number } {
  const mid = FALLBACK_MID[currency] || 10.85;
  const p = FALLBACK_PREMIUMS[bankId] || 0.001;
  const half = (mid * p) / 2;
  const bid = +(mid - half).toFixed(4);
  const ask = +(mid + half).toFixed(4);
  const spreadBps = +(((ask - bid) / mid) * 10000).toFixed(1);
  return { bid, ask, spreadBps };
}

export default function BankRatesPage() {
  const [currency, setCurrency] = useState('EUR');
  const [remoteQuotes, setRemoteQuotes] = useState<Record<string, { bid: number; ask: number; spreadBps: number; name: string }> | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  useEffect(() => {
    const base = (import.meta as any).env?.VITE_API_BASE
      || (typeof window !== 'undefined' && (window as any).__JAD2_API__)
      || 'https://jad2fx-yahoo-proxy.hamzaelbouhali.workers.dev';
    fetch(`${base}/v1/bank-quotes?pair=${currency}/MAD`)
      .then(r => r.json())
      .then(d => {
        if (d && d.quotes && d.quotes.banks) {
          const map: Record<string, any> = {};
          for (const b of d.quotes.banks) {
            map[b.id] = { bid: b.bid, ask: b.ask, spreadBps: b.spreadBps, name: b.name };
          }
          setRemoteQuotes(map);
          setGeneratedAt(d.generatedAt || null);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currency]);

  if (loading && !remoteQuotes) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto p-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const mid = remoteQuotes && Object.values(remoteQuotes)[0]
    ? (Object.values(remoteQuotes)[0] as any).bid + ((Object.values(remoteQuotes)[0] as any).spreadBps * 0.0001 * (remoteQuotes && Object.values(remoteQuotes)[0] ? (Object.values(remoteQuotes)[0] as any).bid : 10) / 2)
    : FALLBACK_MID[currency] || 10.85;

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
        {Object.keys(FALLBACK_MID).map((c) => (
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
        <p className="text-[10px] text-slate-500 mt-1">
          {currency}/MAD · {generatedAt ? `mis à jour ${new Date(generatedAt).toLocaleString('fr-MA')}` : 'indicatif'}
        </p>
      </div>

      {/* Bank comparison table */}
      <div className="bg-navy-900 border border-navy-700 rounded-xl overflow-hidden">
        <table className="w-full text-[11px]">
          <thead className="bg-navy-950">
            <tr className="text-[10px] text-slate-500 uppercase tracking-wider">
              <th className="px-3 py-2 text-left">Banque</th>
              <th className="px-3 py-2 text-right">Bid (vous vendez)</th>
              <th className="px-3 py-2 text-right">Ask (vous achetez)</th>
              <th className="px-3 py-2 text-right">Spread (bps)</th>
              <th className="px-3 py-2 text-right">Coût 100k</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-800">
            {BANKS.map((bank) => {
              const q = remoteQuotes?.[bank.id] || getLocalQuote(currency, bank.id);
              const spreadBps = q.spreadBps;
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
