import { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line } from 'recharts';
import { Activity, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { getVolSurface, getAllCurrenciesWithVol, getDeltaStrikes, VOL_TENORS } from '../services/volSurface';
import { BKAM_CURRENCIES } from '../constants';
import { Skeleton } from './Skeleton';

/**
 * P1.4 — VolSurface UI: heatmap + smile + 25D RR time series.
 * Tries to fetch live surface from worker /v1/vol; falls back to local
 * synthetic surface if worker unavailable.
 */
export default function VolSurfacePage() {
  const [remoteSurface, setRemoteSurface] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<'local' | 'remote'>('local');

  useEffect(() => {
    const base = (import.meta as any).env?.VITE_API_BASE
      || (typeof window !== 'undefined' && (window as any).__JAD2_API__)
      || 'https://jad2fx-yahoo-proxy.hamzaelbouhali.workers.dev';
    fetch(`${base}/v1/vol`)
      .then(r => r.json())
      .then(d => {
        if (d && d.surface) {
          setRemoteSurface(d.surface);
          setSource(d.stale ? 'local' : 'remote');
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const availableCurrencies = useMemo(() => {
    const fromRemote = remoteSurface ? Object.keys(remoteSurface) : [];
    const fromLocal = getAllCurrenciesWithVol();
    const merged = Array.from(new Set([...fromRemote, ...fromLocal]));
    return merged.filter((c) => BKAM_CURRENCIES.some((b) => b.code === c));
  }, [remoteSurface]);

  const [currency, setCurrency] = useState(availableCurrencies[0] || 'EUR');

  const surface = useMemo(() => {
    if (remoteSurface && remoteSurface[currency]) {
      // Convert remote shape to local surface rows
      const r: any = remoteSurface[currency];
      const out: any[] = [];
      for (const tObj of VOL_TENORS) {
        const t = tObj.label;
        out.push({ tenor: t, ATM: r.ATM?.[t] ?? 0.06, RR25D: r.RR25D?.[t] ?? 0.003, BF25D: r.BF25D?.[t] ?? 0.0015 });
      }
      return out;
    }
    return getVolSurface(currency);
  }, [remoteSurface, currency]);

  // Heatmap data: tenor × strike
  const heatmap = useMemo(() => {
    return surface.map((d: any) => {
      const strikes = d.smile;
      const row: Record<string, number | string> = { tenor: d.tenorLabel };
      strikes.forEach((s: any) => {
        const label = s.strike === 0 ? 'ATM' : `${s.strike > 0 ? '+' : ''}${(s.strike * 100).toFixed(1)}%`;
        row[label] = +(s.vol * 100).toFixed(2); // vol in %
      });
      return row;
    });
  }, [surface]);

  const strikeLabels = ['-2.5%', '-1.0%', 'ATM', '+1.0%', '+2.5%'];

  // Compute "spot" proxy for strike display (use 10.85 if not provided)
  const spotProxy = 10.85;
  const { put25, call25 } = getDeltaStrikes(spotProxy);

  if (loading) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto p-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Activity size={14} className="text-gold-500" />
        <h1 className="text-base font-bold text-white uppercase tracking-wider">Surface de Volatilité</h1>
        <span className="text-[10px] text-slate-500 ml-auto">P1.4 · ATM, 25D RR, 25D STR par tenor</span>
      </div>

      {/* Currency selector */}
      <div className="bg-navy-900 border border-navy-700 rounded-xl p-3 flex items-center gap-3 flex-wrap">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">CCY / MAD</span>
        {availableCurrencies.map((c) => (
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

      {/* Disclaimer */}
      <div className="flex items-start gap-2 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
        <AlertCircle size={12} className="text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-[10px] text-amber-200/80 leading-relaxed">
          <strong>Données synthétiques.</strong> Surface de vol pédagogique, calibrée sur la vol réalisée récente.
          Pour des prix fermes, utilisez la fenêtre options de votre banque. En production: souscription Reuters/Bloomberg.
        </p>
      </div>

      {/* ATM vol by tenor bar chart */}
      <div className="bg-navy-900 border border-navy-700 rounded-xl p-4">
        <h2 className="text-[11px] font-bold text-white uppercase tracking-wider mb-2">
          Vol ATM par tenor (annualisée, %)
        </h2>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={surface.map((d) => ({ tenor: d.tenorLabel, vol: +(d.atmVol * 100).toFixed(2) }))}>
              <CartesianGrid stroke="#1E3E5C" strokeDasharray="3 3" />
              <XAxis dataKey="tenor" tick={{ fill: '#91B8D8', fontSize: 10 }} />
              <YAxis tick={{ fill: '#91B8D8', fontSize: 10 }} unit="%" domain={[0, 'dataMax + 1']} />
              <Tooltip
                contentStyle={{ background: '#040C1C', border: '1px solid #D4AF37', borderRadius: 6, fontSize: 11 }}
                formatter={((v: number) => [`${v.toFixed(2)}%`, 'ATM vol']) as any}
              />
              <Bar dataKey="vol" radius={[3, 3, 0, 0]}>
                {surface.map((d, i) => (
                  <Cell key={i} fill={d.atmVol > 0.10 ? '#ef4444' : d.atmVol > 0.075 ? '#f59e0b' : '#10b981'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Heatmap-style smile table */}
      <div className="bg-navy-900 border border-navy-700 rounded-xl p-4">
        <h2 className="text-[11px] font-bold text-white uppercase tracking-wider mb-3">
          Smile par tenor × strike
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="text-slate-400">
                <th className="px-2 py-1.5 text-left uppercase tracking-wider">Tenor</th>
                {strikeLabels.map((s) => (
                  <th key={s} className="px-2 py-1.5 text-center uppercase tracking-wider">{s}</th>
                ))}
                <th className="px-2 py-1.5 text-center text-gold-400">25D RR</th>
                <th className="px-2 py-1.5 text-center text-blue-400">25D STR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-800">
              {surface.map((d: any) => {
                const put25 = d.smile[0]?.vol || 0;
                const atm = d.smile[2]?.vol || 0;
                const call25 = d.smile[4]?.vol || 0;
                const maxVol = Math.max(...d.smile.map((s: any) => s.vol));
                return (
                  <tr key={d.tenorDays} className="hover:bg-navy-800/30">
                    <td className="px-2 py-1.5 text-slate-300 font-mono">{d.tenorLabel}</td>
                    {d.smile.map((s: any, i: number) => {
                      const intensity = (s.vol - 0.05) / 0.06; // 0..1
                      const bg = `rgba(212,175,55,${Math.min(0.6, intensity * 0.7)})`;
                      return (
                        <td
                          key={i}
                          className="px-2 py-1.5 text-center font-mono text-slate-200"
                          style={{ backgroundColor: s.vol === maxVol ? bg : 'transparent' }}
                        >
                          {(s.vol * 100).toFixed(2)}%
                        </td>
                      );
                    })}
                    <td className={`px-2 py-1.5 text-center font-mono font-bold ${d.rr25 < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {(d.rr25 * 100).toFixed(2)}%
                    </td>
                    <td className="px-2 py-1.5 text-center font-mono text-blue-400">
                      {(d.str25 * 100).toFixed(2)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex items-center gap-4 text-[10px] text-slate-500">
          <span>25D RR = Call25 - Put25 (négatif = puts plus chers = skew baissier)</span>
          <span>25D STR = (Call25 + Put25) / 2 - ATM (vol au-delà de l'ATM)</span>
        </div>
      </div>

      {/* Smile for selected tenor */}
      <div className="bg-navy-900 border border-navy-700 rounded-xl p-4">
        <h2 className="text-[11px] font-bold text-white uppercase tracking-wider mb-3">Smile détaillé</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {surface.slice(0, 3).map((d) => (
            <div key={d.tenorDays} className="bg-navy-950 border border-navy-800 rounded-lg p-3">
              <h3 className="text-[11px] font-bold text-slate-300 mb-1.5">
                Tenor {d.tenorLabel}
              </h3>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={d.smile.map((s: any) => ({ strike: s.strike * 100, vol: s.vol * 100 }))}>
                    <CartesianGrid stroke="#1E3E5C" strokeDasharray="2 2" />
                    <XAxis dataKey="strike" tick={{ fill: '#91B8D8', fontSize: 9 }} unit="%" />
                    <YAxis tick={{ fill: '#91B8D8', fontSize: 9 }} unit="%" />
                    <Tooltip
                      contentStyle={{ background: '#040C1C', border: '1px solid #1E3E5C', borderRadius: 4, fontSize: 10 }}
                      formatter={((v: number) => [`${v.toFixed(2)}%`, 'Vol']) as any}
                    />
                    <Line type="monotone" dataKey="vol" stroke="#D4AF37" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-slate-500 text-center mt-1">
                ATM: {(d.atmVol * 100).toFixed(2)}% · RR: {(d.rr25 * 100).toFixed(2)}% · STR: {(d.str25 * 100).toFixed(2)}%
              </p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[10px] text-slate-500 text-center">
        Strikes 25∆ proxy: put {put25} · call {call25} (estim. spot {spotProxy})
      </p>
    </div>
  );
}
