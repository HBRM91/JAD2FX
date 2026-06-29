import { Globe, TrendingUp, Award, TrendingDown } from 'lucide-react';

/**
 * P1.10 — Sovereign spread module.
 * Morocco 5Y CDS, EMBI+ Morocco, OAT vs Bund spread.
 * Synthetic data calibrated to Q2 2026 levels (real implementation needs Reuters/Bloomberg feed).
 */
export default function SovereignPage() {
  // Synthetic data — calibrated to Q2 2026
  const cds5Y = {
    morocco:    { bps: 92,  change: -3,  changePct: -3.2 },
    turkey:     { bps: 285, change: +12, changePct: +4.4 },
    egypt:      { bps: 540, change: +25, changePct: +4.8 },
    southAfrica:{ bps: 198, change: -5,  changePct: -2.5 },
    brazil:     { bps: 175, change: -8,  changePct: -4.4 },
    indonesia:  { bps: 78,  change: -1,  changePct: -1.3 },
  };

  const embi = {
    morocco:    { bps: 168, change: -4,  changePct: -2.3 },
    turkey:     { bps: 442, change: +18, changePct: +4.2 },
    egypt:      { bps: 821, change: +35, changePct: +4.5 },
    southAfrica:{ bps: 312, change: -8,  changePct: -2.5 },
    brazil:     { bps: 248, change: -6,  changePct: -2.4 },
    indonesia:  { bps: 115, change: -2,  changePct: -1.7 },
  };

  const oatBund = {
    spread: 142,     // 10Y OAT vs Bund spread
    change: -3,
    ma10y: 3.42,    // Moroccan 10Y OAT yield
    bund10y: 2.00,  // German Bund 10Y
    ust10y: 4.42,   // US 10Y (for ref)
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center gap-2">
        <Globe size={14} className="text-gold-500" />
        <h1 className="text-base font-bold text-white uppercase tracking-wider">Spreads Souverains · Maroc</h1>
        <span className="text-[10px] text-slate-500 ml-auto">P1.10 · CDS / EMBI / OAT-Bund</span>
      </div>

      <div className="flex items-start gap-2 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
        <span className="text-amber-400 text-xs">ℹ️</span>
        <p className="text-[10px] text-amber-200/80 leading-relaxed">
          <strong>Données synthétiques indicatives.</strong> En production: souscription Reuters Eikon / Bloomberg pour les CDS 5Y, EMBI+ JP Morgan, OAT via BAM.
        </p>
      </div>

      {/* CDS 5Y */}
      <div className="bg-navy-900 border border-navy-700 rounded-xl p-4">
        <h2 className="text-[11px] font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <Award size={11} /> CDS 5 ans (bps)
        </h2>
        <table className="w-full text-[11px]">
          <thead className="text-[9px] text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="px-2 py-1 text-left">Pays</th>
              <th className="px-2 py-1 text-right">Spread</th>
              <th className="px-2 py-1 text-right">Δ 1j</th>
              <th className="px-2 py-1 text-right">Δ %</th>
              <th className="px-2 py-1 text-left">Interprétation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-800">
            {Object.entries(cds5Y).map(([country, data]) => {
              const isMA = country === 'morocco';
              return (
                <tr key={country} className={isMA ? 'bg-gold-500/5' : 'hover:bg-navy-800/30'}>
                  <td className="px-2 py-1.5 font-bold text-slate-200">
                    {country.charAt(0).toUpperCase() + country.slice(1)}
                    {isMA && <span className="ml-1 text-[8px] text-gold-400">★</span>}
                  </td>
                  <td className="px-2 py-1.5 text-right font-mono text-slate-200">{data.bps}</td>
                  <td className={`px-2 py-1.5 text-right font-mono ${data.change > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {data.change > 0 ? '+' : ''}{data.change}
                  </td>
                  <td className={`px-2 py-1.5 text-right font-mono ${data.changePct > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {data.changePct > 0 ? '+' : ''}{data.changePct.toFixed(1)}%
                  </td>
                  <td className="px-2 py-1.5 text-slate-400 text-[10px]">
                    {data.bps < 100 ? 'IG / Investment Grade' : data.bps < 250 ? 'BB / Cross-over' : data.bps < 400 ? 'Single B' : 'CCC / Distressed'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* EMBI+ */}
      <div className="bg-navy-900 border border-navy-700 rounded-xl p-4">
        <h2 className="text-[11px] font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <TrendingUp size={11} /> EMBI+ JP Morgan (bps)
        </h2>
        <table className="w-full text-[11px]">
          <thead className="text-[9px] text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="px-2 py-1 text-left">Pays</th>
              <th className="px-2 py-1 text-right">Spread</th>
              <th className="px-2 py-1 text-right">Δ 1j</th>
              <th className="px-2 py-1 text-right">Δ %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-800">
            {Object.entries(embi).map(([country, data]) => {
              const isMA = country === 'morocco';
              return (
                <tr key={country} className={isMA ? 'bg-gold-500/5' : 'hover:bg-navy-800/30'}>
                  <td className="px-2 py-1.5 font-bold text-slate-200">
                    {country.charAt(0).toUpperCase() + country.slice(1)}
                    {isMA && <span className="ml-1 text-[8px] text-gold-400">★</span>}
                  </td>
                  <td className="px-2 py-1.5 text-right font-mono text-slate-200">{data.bps}</td>
                  <td className={`px-2 py-1.5 text-right font-mono ${data.change > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {data.change > 0 ? '+' : ''}{data.change}
                  </td>
                  <td className={`px-2 py-1.5 text-right font-mono ${data.changePct > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {data.changePct > 0 ? '+' : ''}{data.changePct.toFixed(1)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* OAT vs Bund */}
      <div className="bg-navy-900 border border-navy-700 rounded-xl p-4">
        <h2 className="text-[11px] font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <TrendingDown size={11} /> OAT Maroc vs Bund Allemand (10 ans)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-navy-950 border border-navy-800 rounded-lg p-3">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Spread 10Y</p>
            <p className="text-2xl font-bold font-mono text-gold-400 mt-1">+{oatBund.spread} bps</p>
            <p className={`text-[10px] font-mono ${oatBund.change > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {oatBund.change > 0 ? '+' : ''}{oatBund.change} bps
            </p>
          </div>
          <div className="bg-navy-950 border border-navy-800 rounded-lg p-3">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">OAT 10Y</p>
            <p className="text-2xl font-bold font-mono text-blue-400 mt-1">{oatBund.ma10y.toFixed(2)}%</p>
          </div>
          <div className="bg-navy-950 border border-navy-800 rounded-lg p-3">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Bund 10Y</p>
            <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">{oatBund.bund10y.toFixed(2)}%</p>
          </div>
          <div className="bg-navy-950 border border-navy-800 rounded-lg p-3">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">UST 10Y (ref)</p>
            <p className="text-2xl font-bold font-mono text-slate-300 mt-1">{oatBund.ust10y.toFixed(2)}%</p>
          </div>
        </div>
        <p className="text-[10px] text-slate-500 mt-3 italic">
          Le spread OAT-Bund mesure la prime de risque souverain Maroc vs référence européenne (Bund = « risk-free »). Niveau 142 bps = Maroc investment grade cross-over.
        </p>
      </div>

      <div className="bg-navy-900/50 border border-navy-800 rounded-lg p-3 text-[10px] text-slate-500">
        <strong>Sources:</strong> CDS 5Y: ICE/CME ; EMBI+: JP Morgan ; OAT: BAM. Pour des chiffres fermes, votre broker ou Bloomberg.
      </div>
    </div>
  );
}
