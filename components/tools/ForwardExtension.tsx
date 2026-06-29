/**
 * Prorogation & Levée Anticipée — Extension et dénouement anticipé de forward
 *
 * Prorogation (Rollover):
 *   L'entreprise souhaite repousser la date d'échéance d'un forward existant.
 *   La banque dénoue le forward initial au cours spot courant, puis rebooke
 *   un nouveau forward pour la période d'extension.
 *   Nouveau cours ≈ Cours spot actuel + Points forward pour la période d'extension
 *
 * Levée Anticipée (Early Settlement):
 *   L'entreprise veut dénouer son forward avant l'échéance.
 *   Le gain/perte = (Cours spot actuel - Cours forward initial) × Notionnel
 *
 * Ingénierie de marge bancaire:
 *   Marge = |Cours communiqué par la banque - Cours théorique CIP| / Cours théorique × 10 000 bps
 */
import React, { useState, useMemo } from 'react';
import { Calculator, AlertTriangle, Info, TrendingDown, TrendingUp } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { buildForwardQuote } from '../../services/forwardEngine';
import { DEFAULT_BASKET_CONFIG, BKAM_CURRENCIES } from '../../constants';

const BKAM_CC: Record<string, string> = Object.fromEntries(BKAM_CURRENCIES.map(c => [c.code, c.countryCode]));

function daysBetween(a: Date, b: Date): number {
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86400000));
}
function fmt4(n: number): string { return n.toFixed(4); }
function fmtPips(n: number): string { return (n >= 0 ? '+' : '') + n.toFixed(1); }
function fmtBps(n: number): string { return (n >= 0 ? '+' : '') + n.toFixed(1) + ' bps'; }
function fmtMAD(n: number): string {
  return n.toLocaleString('fr-MA', { maximumFractionDigits: 0 });
}

type Mode = 'prorogation' | 'levee' | 'marge';

export default function ForwardExtension() {
  const { config, livePrices } = useAdmin();
  const [mode, setMode] = useState<Mode>('prorogation');

  // Shared fields
  const [currency, setCurrency]       = useState('EUR');
  const [notional, setNotional]       = useState('500000');
  const [direction, setDirection]     = useState<'BUY'|'SELL'>('BUY');
  const [originalRate, setOriginalRate] = useState('');
  const [originalMaturity, setOriginalMaturity] = useState('');

  // Prorogation only
  const [newMaturity, setNewMaturity] = useState('');

  // Levée only — uses originalMaturity as "today"

  // Marge only
  const [bankRate, setBankRate]       = useState('');
  const [tenor, setTenor]             = useState('90');

  const spot = useMemo(() => {
    const e = livePrices.find(p => p.currency === currency);
    return e?.mid ?? null;
  }, [livePrices, currency]);

  // ── Prorogation calculation ──────────────────────────────────────────────────
  const prorResult = useMemo(() => {
    if (mode !== 'prorogation') return null;
    if (!spot || !originalRate || !originalMaturity || !newMaturity) return null;
    const orig = parseFloat(originalRate);
    if (!orig) return null;

    const today = new Date();
    const matDate = new Date(originalMaturity);
    const newMat  = new Date(newMaturity);
    if (newMat <= matDate) return null;

    const extensionDays = daysBetween(matDate, newMat);
    if (extensionDays <= 0) return null;

    // Build forward quote for extension period
    try {
      const extQuote = buildForwardQuote(
        currency, spot, extensionDays,
        parseFloat(notional) || 1,
        direction,
        0,
        config.curveOverrides?.['MAD'],
        config.curveOverrides?.[currency]
      );
      const extensionPoints = extQuote.forwardPointsPips; // pips
      const newForwardRate  = orig + extensionPoints / 10000;
      const cost = direction === 'BUY'
        ? (newForwardRate - orig) * (parseFloat(notional) || 0)
        : (orig - newForwardRate) * (parseFloat(notional) || 0);

      return { extensionDays, extensionPoints, newForwardRate, cost, extQuote };
    } catch { return null; }
  }, [mode, spot, originalRate, originalMaturity, newMaturity, newMaturity, currency, direction, notional, config]);

  // ── Levée Anticipée ──────────────────────────────────────────────────────────
  const leveeResult = useMemo(() => {
    if (mode !== 'levee') return null;
    if (!spot || !originalRate || !originalMaturity) return null;
    const orig = parseFloat(originalRate);
    const not  = parseFloat(notional);
    if (!orig || !not) return null;

    const today    = new Date();
    const matDate  = new Date(originalMaturity);
    const daysLeft = daysBetween(today, matDate);

    // P&L = (spot - original) × notional for a BUY forward
    const pnl = direction === 'BUY'
      ? (spot - orig) * not    // If you bought at orig and spot is now higher → loss at early termination
      : (orig - spot) * not;   // If you sold at orig and spot is now lower → loss at early termination

    // Remaining value of the forward (time value via CIP estimate)
    let remainingForwardRate: number | null = null;
    try {
      const q = buildForwardQuote(currency, spot, daysLeft, not, direction, 0, config.curveOverrides?.['MAD'], config.curveOverrides?.[currency]);
      remainingForwardRate = q.forwardRate;
    } catch { /* ignore */ }

    return { daysLeft, pnl, spot, orig, remainingForwardRate };
  }, [mode, spot, originalRate, originalMaturity, direction, notional, currency, config]);

  // ── Marge bancaire ───────────────────────────────────────────────────────────
  const margeResult = useMemo(() => {
    if (mode !== 'marge') return null;
    if (!spot || !bankRate || !tenor) return null;
    const bank = parseFloat(bankRate);
    const days = parseInt(tenor);
    if (!bank || !days) return null;

    let theoreticalRate: number | null = null;
    try {
      const q = buildForwardQuote(currency, spot, days, 1, direction, 0, config.curveOverrides?.['MAD'], config.curveOverrides?.[currency]);
      theoreticalRate = q.forwardRate;
    } catch { /* ignore */ }

    if (!theoreticalRate) return null;

    const marginBps = direction === 'BUY'
      ? ((bank - theoreticalRate) / theoreticalRate) * 10000  // You buy: higher rate = worse
      : ((theoreticalRate - bank) / theoreticalRate) * 10000; // You sell: lower rate = worse

    const marginMAD = Math.abs(bank - theoreticalRate) * (parseFloat(notional) || 0);

    return { theoreticalRate, bank, marginBps, marginMAD, days };
  }, [mode, spot, bankRate, tenor, direction, currency, notional, config]);

  const tabs: { id: Mode; label: string; desc: string }[] = [
    { id: 'prorogation', label: 'Prorogation', desc: 'Repousser l\'échéance' },
    { id: 'levee', label: 'Levée Anticipée', desc: 'Dénouer avant terme' },
    { id: 'marge', label: 'Marge Bancaire', desc: 'Rétro-ingénierie du taux banque' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-navy-900 border border-navy-700 rounded-2xl overflow-hidden">
        <div className="h-0.5 bg-gradient-to-r from-purple-700 via-purple-400 to-purple-700" />
        <div className="p-5">
          <div className="flex items-center gap-2 mb-1">
            <Calculator size={15} className="text-purple-400" />
            <span className="text-[9px] font-bold text-purple-400 uppercase tracking-[0.2em] bg-purple-500/10 border border-purple-500/25 px-2 py-0.5 rounded">
              Gestion Forward — Opérations Post-Booking
            </span>
          </div>
          <h2 className="text-lg font-serif font-bold text-white mb-1">
            Prorogation, Levée Anticipée & Analyse de Marge
          </h2>
          <p className="text-sm text-slate-400">
            Calculez le nouveau taux d'un forward prorogé, le coût d'une levée anticipée,
            ou rétro-calculez la marge prise par votre banque sur un taux communiqué.
          </p>
        </div>
      </div>

      {/* Mode tabs */}
      <div className="grid grid-cols-3 gap-2">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setMode(t.id)}
            className={`p-3 rounded-xl border text-left transition-all ${
              mode === t.id
                ? 'border-purple-600/60 bg-purple-500/10 text-white'
                : 'border-navy-700 text-slate-400 hover:border-navy-600'
            }`}>
            <p className="text-[11px] font-bold">{t.label}</p>
            <p className="text-[9px] text-slate-500 mt-0.5">{t.desc}</p>
          </button>
        ))}
      </div>

      {/* Shared inputs */}
      <div className="bg-navy-900 border border-navy-700 rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[9px] text-slate-500 uppercase tracking-wider mb-1.5 font-bold">Devise</label>
            <select value={currency} onChange={e => setCurrency(e.target.value)}
              className="w-full bg-navy-950 border border-navy-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors appearance-none">
              {BKAM_CURRENCIES.filter(c => c.bkamUnit === 1).map(c => (
                <option key={c.code} value={c.code}>{c.code}/MAD</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[9px] text-slate-500 uppercase tracking-wider mb-1.5 font-bold">Sens</label>
            <select value={direction} onChange={e => setDirection(e.target.value as 'BUY'|'SELL')}
              className="w-full bg-navy-950 border border-navy-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors appearance-none">
              <option value="BUY">Achat {currency}</option>
              <option value="SELL">Vente {currency}</option>
            </select>
          </div>
          <div>
            <label className="block text-[9px] text-slate-500 uppercase tracking-wider mb-1.5 font-bold">Notionnel ({currency})</label>
            <input type="number" value={notional} onChange={e => setNotional(e.target.value)}
              className="w-full bg-navy-950 border border-navy-700 rounded-lg px-3 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="500000" />
          </div>
          <div>
            <label className="block text-[9px] text-slate-500 uppercase tracking-wider mb-1.5 font-bold">Taux forward initial</label>
            <input type="number" step="0.0001" value={originalRate} onChange={e => setOriginalRate(e.target.value)}
              className="w-full bg-navy-950 border border-navy-700 rounded-lg px-3 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="10.8500" />
          </div>
        </div>

        {/* Spot display */}
        {spot && (
          <div className="flex items-center gap-2 p-2.5 bg-navy-800 rounded-lg">
            <Info size={11} className="text-purple-400" />
            <span className="text-[10px] text-slate-400">Cours spot indicatif actuel</span>
            <span className="font-mono font-bold text-white text-[12px]">{currency}/MAD {spot.toFixed(4)}</span>
            <span className="text-[8px] text-slate-600 ml-auto">non exécutable</span>
          </div>
        )}

        {/* Prorogation inputs */}
        {mode === 'prorogation' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] text-slate-500 uppercase tracking-wider mb-1.5 font-bold">Date d'échéance initiale</label>
              <input type="date" value={originalMaturity} onChange={e => setOriginalMaturity(e.target.value)}
                className="w-full bg-navy-950 border border-navy-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors" />
            </div>
            <div>
              <label className="block text-[9px] text-slate-500 uppercase tracking-wider mb-1.5 font-bold">Nouvelle date d'échéance</label>
              <input type="date" value={newMaturity} onChange={e => setNewMaturity(e.target.value)}
                className="w-full bg-navy-950 border border-navy-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors" />
            </div>
          </div>
        )}

        {/* Levée inputs */}
        {mode === 'levee' && (
          <div>
            <label className="block text-[9px] text-slate-500 uppercase tracking-wider mb-1.5 font-bold">Date d'échéance contractuelle</label>
            <input type="date" value={originalMaturity} onChange={e => setOriginalMaturity(e.target.value)}
              className="w-full sm:w-56 bg-navy-950 border border-navy-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors" />
          </div>
        )}

        {/* Marge inputs */}
        {mode === 'marge' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] text-slate-500 uppercase tracking-wider mb-1.5 font-bold">Taux communiqué par la banque</label>
              <input type="number" step="0.0001" value={bankRate} onChange={e => setBankRate(e.target.value)}
                className="w-full bg-navy-950 border border-navy-700 rounded-lg px-3 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="10.8750" />
            </div>
            <div>
              <label className="block text-[9px] text-slate-500 uppercase tracking-wider mb-1.5 font-bold">Durée (jours)</label>
              <input type="number" value={tenor} onChange={e => setTenor(e.target.value)}
                className="w-full bg-navy-950 border border-navy-700 rounded-lg px-3 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="90" />
            </div>
          </div>
        )}
      </div>

      {/* ── Prorogation result ── */}
      {mode === 'prorogation' && prorResult && (
        <div className="bg-navy-900 border border-purple-700/30 rounded-xl p-5 space-y-4">
          <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Résultat — Prorogation de {prorResult.extensionDays} jours</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Taux initial', value: fmt4(parseFloat(originalRate)), color: 'text-slate-400' },
              { label: 'Points d\'extension', value: fmtPips(prorResult.extensionPoints) + ' pips', color: prorResult.extensionPoints > 0 ? 'text-red-400' : 'text-emerald-400' },
              { label: 'Nouveau taux forward', value: fmt4(prorResult.newForwardRate), color: 'text-white' },
              { label: 'Coût prorogation', value: fmtMAD(Math.abs(prorResult.cost)) + ' MAD', color: prorResult.cost > 0 ? 'text-red-400' : 'text-emerald-400' },
            ].map(m => (
              <div key={m.label} className="bg-navy-800 rounded-lg p-3">
                <p className="text-[9px] text-slate-500 mb-1">{m.label}</p>
                <p className={`text-base font-mono font-bold ${m.color}`}>{m.value}</p>
              </div>
            ))}
          </div>
          <div className="flex items-start gap-2 p-3 bg-amber-500/8 border border-amber-700/30 rounded-lg">
            <AlertTriangle size={12} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-300/80 leading-snug">
              {prorResult.cost > 0
                ? `La prorogation coûte ${fmtMAD(prorResult.cost)} MAD car les points forward sont positifs (MAD plus cher à terme). Pour dénouement effectif, contactez votre établissement bancaire agréé par Bank Al-Maghrib.`
                : `La prorogation génère un gain apparent de ${fmtMAD(Math.abs(prorResult.cost))} MAD. Les conditions exactes dépendent des taux interbancaires au moment de l'opération avec votre banque agréée BAM.`}
            </p>
          </div>
        </div>
      )}

      {/* ── Levée anticipée result ── */}
      {mode === 'levee' && leveeResult && (
        <div className="bg-navy-900 border border-purple-700/30 rounded-xl p-5 space-y-4">
          <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">
            Résultat — Levée Anticipée ({leveeResult.daysLeft} jours avant échéance)
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Cours spot actuel', value: fmt4(leveeResult.spot) },
              { label: 'Cours forward initial', value: fmt4(leveeResult.orig) },
              { label: leveeResult.pnl >= 0 ? 'Gain levée anticipée' : 'Perte levée anticipée',
                value: fmtMAD(Math.abs(leveeResult.pnl)) + ' MAD',
                color: leveeResult.pnl >= 0 ? 'text-emerald-400' : 'text-red-400' },
            ].map(m => (
              <div key={m.label} className="bg-navy-800 rounded-lg p-3">
                <p className="text-[9px] text-slate-500 mb-1">{m.label}</p>
                <p className={`text-base font-mono font-bold ${(m as any).color ?? 'text-white'}`}>{m.value}</p>
              </div>
            ))}
          </div>
          {leveeResult.remainingForwardRate && (
            <div className="p-3 bg-navy-800 border border-navy-700 rounded-lg">
              <p className="text-[10px] text-slate-500 mb-1">Cours forward indicatif pour la durée résiduelle de {leveeResult.daysLeft} jours</p>
              <p className="text-sm font-mono font-bold text-white">{fmt4(leveeResult.remainingForwardRate)}</p>
              <p className="text-[9px] text-slate-600 mt-0.5">Calculé par CIP — à titre pédagogique uniquement</p>
            </div>
          )}
          <p className="text-[10px] text-slate-600">
            La levée anticipée entraîne un dénouement du forward au cours spot courant. Le gain ou la perte
            est réglé avec votre banque domiciliataire agréée par Bank Al-Maghrib à la date de levée.
          </p>
        </div>
      )}

      {/* ── Marge bancaire result ── */}
      {mode === 'marge' && margeResult && (
        <div className="bg-navy-900 border border-purple-700/30 rounded-xl p-5 space-y-4">
          <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">
            Analyse de Marge — Forward {margeResult.days} jours
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Cours spot', value: fmt4(spot!), color: 'text-slate-400' },
              { label: 'Taux CIP théorique', value: fmt4(margeResult.theoreticalRate), color: 'text-emerald-400' },
              { label: 'Taux banque communiqué', value: fmt4(margeResult.bank), color: 'text-white' },
              { label: 'Marge estimée', value: fmtBps(margeResult.marginBps), color: margeResult.marginBps > 50 ? 'text-red-400' : margeResult.marginBps > 20 ? 'text-amber-400' : 'text-emerald-400' },
            ].map(m => (
              <div key={m.label} className="bg-navy-800 rounded-lg p-3">
                <p className="text-[9px] text-slate-500 mb-1">{m.label}</p>
                <p className={`text-base font-mono font-bold ${m.color}`}>{m.value}</p>
              </div>
            ))}
          </div>
          {parseFloat(notional) > 0 && (
            <div className="p-3 bg-navy-800 border border-navy-700 rounded-lg">
              <p className="text-[10px] text-slate-500 mb-1">Impact marge sur notionnel {parseFloat(notional).toLocaleString('fr')} {currency}</p>
              <p className="text-sm font-mono font-bold text-white">{fmtMAD(margeResult.marginMAD)} MAD</p>
            </div>
          )}
          <div className="flex items-start gap-2 p-3 bg-amber-500/5 border border-amber-700/20 rounded-lg">
            <Info size={12} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-amber-300/70 leading-relaxed">
              Le taux CIP théorique est calculé à partir des taux MONIA interpolés. La marge estimée est
              purement indicative — la banque intègre également sa liquidité interne, le risque contrepartie
              et ses coûts opérationnels. Cette analyse est fournie à titre éducatif uniquement.
              Pour toute opération, adressez-vous à votre établissement bancaire agréé par Bank Al-Maghrib.
            </p>
          </div>
        </div>
      )}

      <p className="text-[9px] text-slate-700 text-center leading-relaxed">
        Calculs indicatifs basés sur les taux CIP JAD2FX (non exécutables). Les taux effectifs dépendent
        des conditions de marché au moment de l'opération avec votre banque agréée BAM.
        JAD2 Advisory — non établissement financier agréé (Loi n° 43-12).
      </p>
    </div>
  );
}
