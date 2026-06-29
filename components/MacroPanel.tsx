import { useState, useMemo } from 'react';
import { TrendingUp, Banknote, AlertCircle } from 'lucide-react';
import { DEFAULT_MONEY_MARKET, DEFAULT_INFLATION, computePppFairValue } from '../services/macroData';
import { BKAM_CURRENCIES } from '../constants';

type Tab = 'MONEY' | 'INFLATION' | 'PPP';

/**
 * P1.9 + P1.11 — Money market, inflation, and PPP fair value module.
 */
export default function MacroPanel() {
  const [tab, setTab] = useState<Tab>('MONEY');

  // PPP inputs
  const [pppCcy, setPppCcy] = useState('EUR');
  const [pppSpot, setPppSpot] = useState<number>(10.85);

  const pppResult = useMemo(() => {
    if (!pppSpot) return null;
    // Find the inflation for both currencies
    const morocco = DEFAULT_INFLATION.find((i) => i.currency === 'MAD');
    const ccy = DEFAULT_INFLATION.find((i) => i.currency === pppCcy);
    if (!morocco || !ccy) return null;
    return computePppFairValue(`${pppCcy}/MAD`, pppSpot, morocco.cpiYoYPct, ccy.cpiYoYPct, 5);
  }, [pppCcy, pppSpot]);

  const madMm = DEFAULT_MONEY_MARKET.find((m) => m.currency === 'MAD');

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex items-center gap-1 bg-navy-900 border border-navy-700 rounded-xl p-1">
        {(['MONEY', 'INFLATION', 'PPP'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 px-3 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-colors ${
              tab === t ? 'bg-gold-500 text-navy-950' : 'text-slate-400 hover:text-white hover:bg-navy-800'
            }`}
          >
            {t === 'MONEY' ? 'Money Market' : t === 'INFLATION' ? 'Inflation' : 'PPP Fair Value'}
          </button>
        ))}
      </div>

      {/* Money Market tab */}
      {tab === 'MONEY' && (
        <div className="space-y-3">
          {madMm && madMm.fxReservesUSDbn !== undefined && (
            <div className="bg-navy-900 border border-navy-700 rounded-xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center">
                <Banknote size={20} className="text-gold-400" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Réserves de change BAM</p>
                <p className="text-2xl font-bold font-mono text-gold-400">{madMm.fxReservesUSDbn.toFixed(1)} Mds USD</p>
                <p className="text-[10px] text-slate-500 mt-0.5">≈ {(madMm.fxReservesUSDbn / 9.95 * 12).toFixed(0)} mois d'imports (cible FMI: 5+)</p>
              </div>
            </div>
          )}

          <div className="bg-navy-900 border border-navy-700 rounded-xl overflow-hidden">
            <table className="w-full text-[12px]">
              <thead className="bg-navy-950">
                <tr className="text-[10px] text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-2 text-left">Devise</th>
                  <th className="px-4 py-2 text-right">Taux directeur</th>
                  <th className="px-4 py-2 text-right">Overnight</th>
                  <th className="px-4 py-2 text-right">Réserves oblig.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800">
                {DEFAULT_MONEY_MARKET.map((m) => (
                  <tr key={m.currency} className="hover:bg-navy-800/40">
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{m.currency}</span>
                        <span className="text-slate-500 text-[11px]">{m.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-gold-400">{(m.policyRate * 100).toFixed(2)}%</td>
                    <td className="px-4 py-2 text-right font-mono text-slate-300">{(m.overnightRate * 100).toFixed(2)}%</td>
                    <td className="px-4 py-2 text-right font-mono text-slate-300">{(m.reserveRequirementPct * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inflation tab */}
      {tab === 'INFLATION' && (
        <div className="bg-navy-900 border border-navy-700 rounded-xl overflow-hidden">
          <table className="w-full text-[12px]">
            <thead className="bg-navy-950">
              <tr className="text-[10px] text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-2 text-left">Pays</th>
                <th className="px-4 py-2 text-right">CPI YoY</th>
                <th className="px-4 py-2 text-right">CPI Core</th>
                <th className="px-4 py-2 text-right">Diff. vs MA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-800">
              {DEFAULT_INFLATION.map((i) => {
                const morocco = DEFAULT_INFLATION.find((m) => m.currency === 'MAD')!;
                const diff = i.cpiYoYPct - morocco.cpiYoYPct;
                return (
                  <tr key={i.currency} className="hover:bg-navy-800/40">
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{i.currency}</span>
                        <span className="text-slate-500 text-[11px]">{i.country}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-slate-200">{i.cpiYoYPct.toFixed(1)}%</td>
                    <td className="px-4 py-2 text-right font-mono text-slate-300">{i.cpiCoreYoYPct.toFixed(1)}%</td>
                    <td className={`px-4 py-2 text-right font-mono font-bold ${diff > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {diff > 0 ? '+' : ''}{diff.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="text-[10px] text-slate-500 px-4 py-2 italic">
            Source: HCP + BCE/Fed/BOE/SNB/BOJ/BOC. Données indicatives, mises à jour trimestrielles.
          </p>
        </div>
      )}

      {/* PPP tab */}
      {tab === 'PPP' && (
        <div className="space-y-3">
          <div className="bg-navy-900 border border-navy-700 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1.5">Devise</label>
              <select
                value={pppCcy}
                onChange={(e) => setPppCcy(e.target.value)}
                className="w-full appearance-none bg-navy-950 border border-navy-700 rounded-lg px-3 py-2 text-sm text-slate-200"
              >
                {BKAM_CURRENCIES.filter((c) => c.code !== 'MAD').map((c) => (
                  <option key={c.code} value={c.code}>{c.code} — {c.nameFr}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1.5">Spot actuel</label>
              <input
                type="number"
                step="0.0001"
                value={pppSpot || ''}
                onChange={(e) => setPppSpot(parseFloat(e.target.value) || 0)}
                placeholder="ex. 10.85"
                className="w-full bg-navy-950 border border-navy-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-200"
              />
            </div>
          </div>

          {pppResult && (
            <div className="bg-navy-900 border border-navy-700 rounded-xl p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center flex-shrink-0">
                  <TrendingUp size={18} className="text-gold-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-white mb-1">Fair Value Long Terme — PPP 5Y</h4>
                  <p className="text-[12px] text-slate-400 leading-relaxed">{pppResult.interpretation}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-navy-800">
                <div className="text-center">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Spot</p>
                  <p className="text-base font-bold font-mono text-slate-200 mt-1">{pppResult.spot.toFixed(4)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">PPP 5Y</p>
                  <p className="text-base font-bold font-mono text-gold-400 mt-1">{pppResult.pppLongTerm.toFixed(4)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Déviation</p>
                  <p className={`text-base font-bold font-mono mt-1 ${pppResult.deviationPct > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {pppResult.deviationPct > 0 ? '+' : ''}{pppResult.deviationPct.toFixed(2)}%
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-start gap-2 p-2.5 bg-navy-950 border border-navy-800 rounded-lg">
                <AlertCircle size={12} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Le PPP est une référence académique sur 5-10 ans. Les taux de change peuvent rester déviés du PPP pendant des années
                  (ex: USD/CAD 2002-2007). À utiliser comme cible de long terme, pas comme signal de trading.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
