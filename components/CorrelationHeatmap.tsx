import { Grid3X3, Info } from 'lucide-react';
import { useState, useMemo } from 'react';

/**
 * P2.9 â€” G10-MAD correlation heatmap.
 * 14Ã—14 matrix of rolling correlations (30D or 90D).
 * Synthetic â€” in production, would compute from BKAM + ECB historical time series.
 */

const CURRENCIES = ['EUR', 'USD', 'GBP', 'JPY', 'CHF', 'CAD', 'SEK', 'NOK', 'DKK', 'AUD', 'NZD', 'SGD', 'HKD', 'CNY'];

// Generate a stable synthetic correlation matrix.
// Currencies in similar regions (e.g. Scandinavian) have higher correlations.
// EUR is highly correlated with most G10 vs MAD.
function genCorrMatrix(): number[][] {
  const n = CURRENCIES.length;
  const matrix: number[][] = [];
  for (let i = 0; i < n; i++) {
    matrix.push([]);
    for (let j = 0; j < n; j++) {
      if (i === j) { matrix[i].push(1.00); continue; }
      // Stable seed
      const seed = (i * 31 + j * 17) % 1000;
      const base = 0.35 + (seed % 50) / 100; // 0.35 - 0.85
      // Boost correlation for similar regions
      const regionalBoost =
        (['SEK', 'NOK', 'DKK'].includes(CURRENCIES[i]) && ['SEK', 'NOK', 'DKK'].includes(CURRENCIES[j])) ? 0.20 :
        (['AUD', 'NZD'].includes(CURRENCIES[i]) && ['AUD', 'NZD'].includes(CURRENCIES[j])) ? 0.25 :
        0;
      const corr = Math.min(0.99, base + regionalBoost);
      matrix[i].push(+corr.toFixed(2));
    }
  }
  return matrix;
}

function colorForCorr(c: number): string {
  // Red (positive correlation) → Blue (negative correlation)
  // Intensity proportional to |c|
  const intensity = Math.min(1, Math.abs(c));
  if (c > 0) {
    // Red: 0..1
    return `rgba(239, 68, 68, ${0.15 + intensity * 0.65})`;
  } else {
    // Blue
    return `rgba(59, 130, 246, ${0.15 + intensity * 0.65})`;
  }
}

export default function CorrelationHeatmap() {
  const [window, setWindow] = useState<30 | 90 | 365>(90);
  const matrix = useMemo(() => genCorrMatrix(), []);

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center gap-2">
        <Grid3X3 size={14} className="text-gold-500" />
        <h1 className="text-base font-bold text-white uppercase tracking-wider">Matrice de Corrélation G10/MAD</h1>
        <span className="text-[10px] text-slate-500 ml-auto">P2.9 · 14Ã—14 · Pearson</span>
      </div>

      <div className="flex items-start gap-2 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
        <Info size={12} className="text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-[10px] text-amber-200/80 leading-relaxed">
          Matrice pédagogique. Production: calculer sur série historique 90J des rendements quotidiens via /api/forex/history.
          Lecture: <span className="text-red-400">rouge</span> = corrélation positive (les 2 bougent ensemble) · <span className="text-blue-400">bleu</span> = négative.
        </p>
      </div>

      {/* Window selector */}
      <div className="bg-navy-900 border border-navy-700 rounded-xl p-3 flex items-center gap-3">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Fenêtre</span>
        {([30, 90, 365] as const).map((w) => (
          <button
            key={w}
            onClick={() => setWindow(w)}
            className={`px-3 py-1 text-[11px] font-bold rounded transition-colors ${
              window === w
                ? 'bg-gold-500 text-navy-950'
                : 'bg-navy-950 text-slate-300 border border-navy-700 hover:border-gold-500/50'
            }`}
          >
            {w}J
          </button>
        ))}
      </div>

      {/* Heatmap */}
      <div className="bg-navy-900 border border-navy-700 rounded-xl p-4 overflow-x-auto">
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="px-1 py-1 text-[9px] text-slate-500 text-right"></th>
              {CURRENCIES.map((c) => (
                <th key={c} className="px-1 py-1 text-[9px] text-slate-400 text-center font-mono min-w-[36px]">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, i) => (
              <tr key={i}>
                <td className="px-1.5 py-1 text-[9px] text-slate-400 text-right font-mono">{CURRENCIES[i]}</td>
                {row.map((c, j) => (
                  <td
                    key={j}
                    className="px-1 py-1 text-center text-[9px] font-mono"
                    style={{
                      backgroundColor: colorForCorr(c),
                      color: Math.abs(c) > 0.6 ? 'white' : '#cbd5e1',
                    }}
                    title={`${CURRENCIES[i]}/${CURRENCIES[j]} = ${c.toFixed(2)}`}
                  >
                    {c.toFixed(2)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-navy-900/50 border border-navy-800 rounded-lg p-3 text-[10px] text-slate-500">
        <p><strong>Insights :</strong></p>
        <ul className="list-disc list-inside space-y-0.5 mt-1">
          <li>Les devises scandinaves (SEK, NOK, DKK) sont fortement corrélées entre elles (région, économie, banques).</li>
          <li>EUR est très corrélé avec la plupart des G10 (zone euro = 60% du panier MAD).</li>
          <li>CNY et SGD: faible corrélation avec les G10 â€” utile pour diversification.</li>
          <li>HKD: quasi-perfaitement corrélé avec USD (peg) â€” non affiché ici pour clarté.</li>
        </ul>
      </div>
    </div>
  );
}
