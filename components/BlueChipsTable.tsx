/**
 * A2.4 — Moroccan Blue Chips table.
 * Fetches top Casablanca-listed companies via Yahoo Finance symbols.
 * Symbols end in .CS for Casablanca Stock Exchange.
 */

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, ExternalLink, RefreshCw } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';

interface BlueChip {
  symbol: string;
  name: string;
  sector: string;
}

const BLUE_CHIPS: BlueChip[] = [
  { symbol: 'ATW.CS', name: 'Attijariwafa Bank',  sector: 'Banking' },
  { symbol: 'IAM.CS', name: 'Maroc Telecom',       sector: 'Telecom' },
  { symbol: 'CSR.CS', name: 'Cosumar',             sector: 'Agribusiness' },
  { symbol: 'BCP.CS', name: 'Banque Populaire',    sector: 'Banking' },
  { symbol: 'BOA.CS', name: 'BMCE Bank of Africa', sector: 'Banking' },
  { symbol: 'MSA.CS', name: 'Marsa Maroc',         sector: 'Logistics' },
];

interface Quote { price: number; change: number; pct: number; }

export default function BlueChipsTable() {
  const { config } = useAdmin();
  const [quotes, setQuotes] = useState<Record<string, Quote | null>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const base = (config.corsProxyUrl ?? '').replace(/\/$/, '');
    if (!base) { setLoading(false); return; }
    Promise.all(
      BLUE_CHIPS.map(async (c) => {
        const yf = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(c.symbol)}?interval=1d&range=1d`;
        try {
          const res = await fetch(`${base}/${encodeURIComponent(yf)}`, { signal: AbortSignal.timeout(6000) });
          if (!res.ok) return [c.symbol, null] as const;
          const data = await res.json();
          const meta = data?.chart?.result?.[0]?.meta;
          if (!meta) return [c.symbol, null] as const;
          const price = meta.regularMarketPrice ?? 0;
          const prev = meta.chartPreviousClose ?? meta.previousClose ?? price;
          return [c.symbol, { price, change: price - prev, pct: prev ? (price - prev) / prev * 100 : 0 }] as const;
        } catch { return [c.symbol, null] as const; }
      })
    ).then((entries) => {
      setQuotes(Object.fromEntries(entries));
      setLoading(false);
    });
  }, [config.corsProxyUrl]);

  return (
    <div className="bg-navy-900 border border-navy-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
          🏛️ Blue Chips Casablanca
        </h2>
        <a
          href="https://www.casablanca-bourse.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-slate-400 hover:text-gold-400 flex items-center gap-0.5"
        >
          Source <ExternalLink size={9} />
        </a>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead className="text-[10px] text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="px-2 py-1 text-left">Société</th>
              <th className="px-2 py-1 text-left">Secteur</th>
              <th className="px-2 py-1 text-right">Cours (MAD)</th>
              <th className="px-2 py-1 text-right">Var %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-800">
            {BLUE_CHIPS.map((c) => {
              const q = quotes[c.symbol];
              const Trend = q ? (q.pct > 0 ? TrendingUp : q.pct < 0 ? TrendingDown : Minus) : RefreshCw;
              const color = q ? (q.pct > 0 ? 'text-emerald-400' : q.pct < 0 ? 'text-red-400' : 'text-slate-400') : 'text-slate-500';
              return (
                <tr key={c.symbol} className="hover:bg-navy-800/30">
                  <td className="px-2 py-1.5 font-bold text-slate-200">{c.name}</td>
                  <td className="px-2 py-1.5 text-slate-500 text-[10px]">{c.sector}</td>
                  <td className="px-2 py-1.5 text-right font-mono text-gold-300">
                    {loading ? '…' : q ? q.price.toFixed(2) : '—'}
                  </td>
                  <td className={`px-2 py-1.5 text-right font-mono text-[10px] flex items-center justify-end gap-0.5 ${color}`}>
                    <Trend size={9} className={loading ? 'animate-spin' : ''} />
                    {loading ? '…' : q ? `${q.pct >= 0 ? '+' : ''}${q.pct.toFixed(2)}%` : 'N/A'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-slate-500 mt-2 italic">
        Données via Yahoo Finance · Délai ~15min · Source officielle : casablanca-bourse.com
      </p>
    </div>
  );
}
