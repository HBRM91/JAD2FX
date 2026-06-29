import { DEFAULT_MONEY_MARKET, DEFAULT_INFLATION, computePppFairValue } from '../services/macroData';
import { Activity, TrendingUp, Globe, BarChart3, Building2, FileText, Calendar } from 'lucide-react';
import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BKAM_CURRENCIES } from '../constants';

/**
 * P1.9 — Money market page (standalone view).
 * Combines the macroData data (already defined) with a dedicated page layout.
 */
export default function MoneyMarketPage() {
  const mad = DEFAULT_MONEY_MARKET.find((m) => m.currency === 'MAD');
  const inflationMAD = DEFAULT_INFLATION.find((i) => i.currency === 'MAD');

  // Simulated MONIA time series (last 30 days) — synthetic for now
  const moniaSeries = useMemo(() => {
    const data = [];
    const base = mad?.overnightRate || 0.025;
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const noise = (Math.random() - 0.5) * 0.0010;
      const rate = +(base + noise).toFixed(4);
      data.push({ date: `${day}/${month}`, rate: +(rate * 100).toFixed(3) });
    }
    return data;
  }, [mad]);

  const reserveCoverage = mad?.fxReservesUSDbn ? (mad.fxReservesUSDbn / 9.95 * 12 / 100).toFixed(1) : 'N/A';

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center gap-2">
        <Activity size={14} className="text-gold-500" />
        <h1 className="text-base font-bold text-white uppercase tracking-wider">Marché Monétaire · BAM</h1>
        <span className="text-[10px] text-slate-500 ml-auto">P1.9 · Money market module</span>
      </div>

      {mad && (
        <>
          {/* Key KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPI label="Taux directeur BAM" value={`${(mad.policyRate * 100).toFixed(2)}%`} sub="Policy rate" color="text-gold-400" />
            <KPI label="MONIA" value={`${(mad.overnightRate * 100).toFixed(2)}%`} sub="Overnight" color="text-emerald-400" />
            <KPI label="Réserves oblig." value={`${(mad.reserveRequirementPct * 100).toFixed(1)}%`} sub="Dépôts à vue" color="text-blue-400" />
            <KPI label="Réserves de change" value={`${mad.fxReservesUSDbn} Mds$`} sub={`${reserveCoverage} mois d'imports`} color="text-amber-400" />
          </div>

          {/* MONIA chart */}
          <div className="bg-navy-900 border border-navy-700 rounded-xl p-4">
            <h2 className="text-[11px] font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
              <TrendingUp size={11} /> MONIA — 30 derniers jours
            </h2>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={moniaSeries}>
                  <CartesianGrid stroke="#1E3E5C" strokeDasharray="2 2" />
                  <XAxis dataKey="date" tick={{ fill: '#91B8D8', fontSize: 9 }} interval={4} />
                  <YAxis tick={{ fill: '#91B8D8', fontSize: 9 }} unit="%" domain={['dataMin - 0.05', 'dataMax + 0.05']} />
                  <Tooltip
                    contentStyle={{ background: '#040C1C', border: '1px solid #D4AF37', borderRadius: 4, fontSize: 11 }}
                    formatter={((v: number) => [`${v.toFixed(3)}%`, 'MONIA']) as any}
                  />
                  <Line type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 italic">
              Données synthétiques indicatives · Source officielle: BAM (Bank Al-Maghrib)
            </p>
          </div>

          {/* Cross-currency rates table */}
          <div className="bg-navy-900 border border-navy-700 rounded-xl p-4">
            <h2 className="text-[11px] font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <Globe size={11} /> Taux directeurs G10 + Chine
            </h2>
            <table className="w-full text-[11px]">
              <thead className="text-[9px] text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-2 py-1 text-left">Devise</th>
                  <th className="px-2 py-1 text-left">Pays</th>
                  <th className="px-2 py-1 text-right">Policy rate</th>
                  <th className="px-2 py-1 text-right">Overnight</th>
                  <th className="px-2 py-1 text-right">Réserves</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800">
                {DEFAULT_MONEY_MARKET.map((m) => {
                  const isMAD = m.currency === 'MAD';
                  return (
                    <tr key={m.currency} className={isMAD ? 'bg-gold-500/5' : 'hover:bg-navy-800/30'}>
                      <td className="px-2 py-1.5 font-bold text-slate-200">
                        {m.currency}{isMAD && <span className="ml-1 text-[8px] text-gold-400">★</span>}
                      </td>
                      <td className="px-2 py-1.5 text-slate-400 text-[10px]">{m.label}</td>
                      <td className="px-2 py-1.5 text-right font-mono text-gold-400">{(m.policyRate * 100).toFixed(2)}%</td>
                      <td className="px-2 py-1.5 text-right font-mono text-emerald-400">{(m.overnightRate * 100).toFixed(2)}%</td>
                      <td className="px-2 py-1.5 text-right font-mono text-slate-400">{(m.reserveRequirementPct * 100).toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Inflation + PPP */}
          <div className="bg-navy-900 border border-navy-700 rounded-xl p-4">
            <h2 className="text-[11px] font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <BarChart3 size={11} /> Inflation & PPP
            </h2>
            <table className="w-full text-[11px]">
              <thead className="text-[9px] text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-2 py-1 text-left">Pays</th>
                  <th className="px-2 py-1 text-right">CPI YoY</th>
                  <th className="px-2 py-1 text-right">CPI Core</th>
                  <th className="px-2 py-1 text-right">Diff vs MA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800">
                {DEFAULT_INFLATION.map((i) => {
                  const diff = inflationMAD ? i.cpiYoYPct - inflationMAD.cpiYoYPct : 0;
                  const isMAD = i.currency === 'MAD';
                  return (
                    <tr key={i.currency} className={isMAD ? 'bg-gold-500/5' : 'hover:bg-navy-800/30'}>
                      <td className="px-2 py-1.5 font-bold text-slate-200">
                        {i.currency}{isMAD && <span className="ml-1 text-[8px] text-gold-400">★</span>}
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono">{i.cpiYoYPct.toFixed(1)}%</td>
                      <td className="px-2 py-1.5 text-right font-mono text-slate-400">{i.cpiCoreYoYPct.toFixed(1)}%</td>
                      <td className={`px-2 py-1.5 text-right font-mono font-bold ${diff > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {diff > 0 ? '+' : ''}{diff.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* PPP calculator */}
          {inflationMAD && (
            <div className="bg-navy-900 border border-navy-700 rounded-xl p-4">
              <h2 className="text-[11px] font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                <Calendar size={11} /> Calculateur PPP 5 ans
              </h2>
              <PppCalculator />
            </div>
          )}

          <p className="text-[10px] text-slate-500 text-center italic">
            Données synthétiques indicatives · Pour des chiffres officiels, consultez directement BAM et le HCP
          </p>
        </>
      )}
    </div>
  );
}

function KPI({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="bg-navy-900 border border-navy-700 rounded-xl p-3">
      <p className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold font-mono ${color} mt-1`}>{value}</p>
      <p className="text-[10px] text-slate-500">{sub}</p>
    </div>
  );
}

function PppCalculator() {
  const [ccy, setCcy] = useState('EUR');
  const [spot, setSpot] = useState(10.85);
  const inflationCcy = DEFAULT_INFLATION.find((i) => i.currency === ccy);
  const inflationMAD = DEFAULT_INFLATION.find((i) => i.currency === 'MAD');
  const result = useMemo(() => {
    if (!inflationCcy || !inflationMAD) return null;
    return computePppFairValue(`${ccy}/MAD`, spot, inflationMAD.cpiYoYPct, inflationCcy.cpiYoYPct, 5);
  }, [ccy, spot, inflationCcy, inflationMAD]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">Devise</label>
          <select value={ccy} onChange={(e) => setCcy(e.target.value)} className="w-full bg-navy-950 border border-navy-700 rounded px-2 py-1.5 text-[12px] text-slate-200">
            {BKAM_CURRENCIES.filter((c) => c.code !== 'MAD').map((c) => (
              <option key={c.code} value={c.code}>{c.code} — {c.nameFr}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">Spot actuel</label>
          <input
            type="number"
            step="0.0001"
            value={spot}
            onChange={(e) => setSpot(parseFloat(e.target.value) || 0)}
            className="w-full bg-navy-950 border border-navy-700 rounded px-3 py-1.5 text-[12px] font-mono text-slate-200"
          />
        </div>
      </div>
      {result && (
        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-navy-800">
          <div>
            <p className="text-[10px] text-slate-500">Spot</p>
            <p className="text-base font-mono font-bold text-slate-200">{result.spot.toFixed(4)}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500">PPP 5Y</p>
            <p className="text-base font-mono font-bold text-gold-400">{result.pppLongTerm.toFixed(4)}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500">Déviation</p>
            <p className={`text-base font-mono font-bold ${result.deviationPct > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {result.deviationPct > 0 ? '+' : ''}{result.deviationPct.toFixed(2)}%
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
