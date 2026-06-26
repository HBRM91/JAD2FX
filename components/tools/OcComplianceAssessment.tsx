import React, { useState } from 'react';
import { Shield, ChevronRight, CheckCircle, AlertTriangle, XCircle, Download } from 'lucide-react';

// ─── Scoring engine (pure client-side — no backend) ──────────────────────────

interface Answers {
  regime: string;
  volume: string;
  instruments: string[];
  ratio: number;
  sector: string;
}

interface Gap {
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  text: string;
  citation: string;
}

interface Result {
  score: number;
  tier: 'Conforme' | 'Intermédiaire' | 'Critique';
  gaps: Gap[];
}

function computeScore(a: Answers): Result {
  let score = 100;
  const gaps: Gap[] = [];

  // No hedging instruments + significant volume
  if (a.instruments.length === 0 && parseFloat(a.volume) > 500000) {
    score -= 30;
    gaps.push({
      severity: 'CRITICAL',
      text: 'Aucun instrument de couverture détecté pour un volume d\'exposition significatif.',
      citation: 'Circ. OC n°01/2024, Art. 12 — accès aux forwards, swaps et options vanille autorisé.',
    });
  }

  // Ratio > 100%
  if (a.ratio > 100) {
    score -= 20;
    gaps.push({
      severity: 'CRITICAL',
      text: `Ratio de couverture déclaré (${a.ratio}%) dépasse la limite légale de 100% de l'exposition documentée.`,
      citation: 'Circ. OC n°01/2024 — couverture limitée à 100% du sous-jacent commercial documenté.',
    });
  }

  // No domiciliation
  if (!a.regime || a.regime === 'non_dom') {
    score -= 25;
    gaps.push({
      severity: 'CRITICAL',
      text: 'Absence de domiciliation bancaire — obligatoire pour toute importation supérieure à 100 000 MAD.',
      citation: 'Circ. OC n°2/2012, Art. 3 — domiciliation préalable au dédouanement.',
    });
  }

  // Options without CPEC
  if (a.instruments.includes('option') && a.regime !== 'cpec') {
    score -= 10;
    gaps.push({
      severity: 'WARNING',
      text: 'Options de change : vérifier que votre banque domiciliataire est agréée pour la structuration d\'options vanille.',
      citation: 'Circ. OC n°01/2024, Art. 12 — seules les banques agréées BAM peuvent structurer des options.',
    });
  }

  // No monthly FX statement for large exposure
  if (parseFloat(a.volume) > 2000000 && a.instruments.length < 2) {
    score -= 10;
    gaps.push({
      severity: 'WARNING',
      text: 'Pour ce niveau d\'exposition, un reporting mensuel des positions de change et un suivi du ratio de couverture sont recommandés.',
      citation: 'IGOC 2024 — bonnes pratiques de gouvernance change pour les entreprises d\'import/export.',
    });
  }

  // Low ratio with significant volume — missed opportunity
  if (a.ratio < 20 && parseFloat(a.volume) > 500000 && a.instruments.length > 0) {
    score -= 5;
    gaps.push({
      severity: 'INFO',
      text: `Ratio de couverture faible (${a.ratio}%) malgré un volume d'exposition élevé. La circulaire OC 01/2024 autorise jusqu'à 100%.`,
      citation: 'Circ. OC n°01/2024 — possibilité de couvrir jusqu\'à 100% du carnet de commandes documenté.',
    });
  }

  score = Math.max(0, score);
  const tier: Result['tier'] = score >= 80 ? 'Conforme' : score >= 55 ? 'Intermédiaire' : 'Critique';
  return { score, tier, gaps };
}

function printReport(a: Answers, result: Result) {
  const w = window.open('', '_blank');
  if (!w) return;
  const severityIcon = (s: Gap['severity']) => s === 'CRITICAL' ? '🔴' : s === 'WARNING' ? '🟡' : 'ℹ️';
  w.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/>
  <title>Diagnostic OC — JAD2FX</title>
  <style>
    body{font-family:Arial,sans-serif;max-width:720px;margin:40px auto;color:#1a1a2e;font-size:13px;line-height:1.6}
    h1{font-size:20px;font-weight:700;border-bottom:2px solid #D4AF37;padding-bottom:8px;color:#0E2336}
    h2{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#64748b;margin-top:24px}
    .score{font-size:48px;font-weight:900;color:${result.tier==='Conforme'?'#16a34a':result.tier==='Intermédiaire'?'#d97706':'#dc2626'}}
    .gap-crit{border-left:3px solid #dc2626;padding:8px 12px;margin:8px 0;background:#fff5f5}
    .gap-warn{border-left:3px solid #d97706;padding:8px 12px;margin:8px 0;background:#fffbeb}
    .gap-info{border-left:3px solid #64748b;padding:8px 12px;margin:8px 0;background:#f8fafc}
    .citation{font-size:11px;color:#64748b;font-style:italic}
    .footer{margin-top:32px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8}
  </style></head><body>
  <h1>Diagnostic de Conformité — Office des Changes</h1>
  <p style="color:#64748b">Généré par JAD2FX · ${new Date().toLocaleDateString('fr-MA')} · JAD2 Advisory</p>
  <h2>Score de Maturité</h2>
  <div class="score">${result.score}/100</div>
  <p><strong>Profil : ${result.tier}</strong></p>
  <h2>Paramètres Déclarés</h2>
  <ul>
    <li>Régime de domiciliation : ${a.regime}</li>
    <li>Volume annuel estimé : ${a.volume} EUR</li>
    <li>Instruments utilisés : ${a.instruments.join(', ') || 'Aucun'}</li>
    <li>Ratio de couverture actuel : ${a.ratio}%</li>
    <li>Secteur : ${a.sector}</li>
  </ul>
  <h2>Écarts Identifiés</h2>
  ${result.gaps.map(g => `<div class="gap-${g.severity==='CRITICAL'?'crit':g.severity==='WARNING'?'warn':'info'}">
    <p>${severityIcon(g.severity)} <strong>${g.text}</strong></p>
    <p class="citation">${g.citation}</p>
  </div>`).join('')}
  ${result.gaps.length === 0 ? '<p style="color:#16a34a">✅ Aucun écart critique identifié sur la base des informations déclarées.</p>' : ''}
  <h2>Prochaines Étapes Recommandées</h2>
  <ol>
    <li>Faire valider ce diagnostic par votre banque domiciliataire agréée BAM.</li>
    <li>Contacter JAD2 Advisory pour un accompagnement structuré (formation, politique de couverture).</li>
    <li>Consulter l'IGOC 2024 disponible sur oc.gov.ma pour les textes de référence.</li>
  </ol>
  <div class="footer">
    <strong>Avertissement :</strong> Ce diagnostic est fourni à titre pédagogique par JAD2 Advisory (cabinet de conseil en management,
    non établissement financier agréé BAM — Loi n° 43-12). Il ne constitue pas un conseil juridique ou financier.
    Les informations sont basées sur les déclarations de l'utilisateur. Faire valider par un conseiller bancaire et/ou juridique.
    JAD2 Advisory · contact@jad2advisory.com · fx.jad2advisory.com
  </div>
  </body></html>`);
  w.document.close();
  setTimeout(() => w.print(), 500);
}

// ─── Component ────────────────────────────────────────────────────────────────

const VOLUMES = [
  { label: '< 500K EUR', value: '250000' },
  { label: '500K – 2M EUR', value: '1000000' },
  { label: '2M – 10M EUR', value: '5000000' },
  { label: '> 10M EUR', value: '15000000' },
];
const REGIMES = [
  { label: 'CPEC (Compte Professionnel en Devises)', value: 'cpec' },
  { label: 'CDE (Compte en Devises)', value: 'cde' },
  { label: 'Compte Convertible', value: 'convertible' },
  { label: 'Non domicilié', value: 'non_dom' },
  { label: 'Je ne sais pas', value: 'unknown' },
];
const INSTRUMENTS = [
  { label: 'Forward (change à terme)', value: 'forward' },
  { label: 'Swap de change', value: 'swap' },
  { label: 'Option vanille (put/call)', value: 'option' },
  { label: 'Aucun', value: 'none' },
];
const SECTORS = [
  'Automobile & Équipementiers', 'Textile & Habillement', 'Agroalimentaire & Agriculture',
  'Bois, Papier & Matériaux', 'Énergie & Hydrocarbures', 'BTP & Construction',
  'Tourisme & Hôtellerie', 'Services & IT', 'Pharmaceutique', 'Autre',
];

export default function OcComplianceAssessment() {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [answers, setAnswers] = useState<Answers>({
    regime: '', volume: '', instruments: [], ratio: 30, sector: '',
  });

  const toggleInstrument = (val: string) => {
    if (val === 'none') { setAnswers(a => ({ ...a, instruments: [] })); return; }
    setAnswers(a => ({
      ...a,
      instruments: a.instruments.includes(val)
        ? a.instruments.filter(i => i !== val)
        : [...a.instruments.filter(i => i !== 'none'), val],
    }));
  };

  const compute = () => {
    const r = computeScore(answers);
    setResult(r);
    setStep(6); // results step
  };

  const tierColor = result
    ? result.tier === 'Conforme' ? 'text-emerald-400' : result.tier === 'Intermédiaire' ? 'text-amber-400' : 'text-red-400'
    : '';
  const tierBorder = result
    ? result.tier === 'Conforme' ? 'border-emerald-700/40' : result.tier === 'Intermédiaire' ? 'border-amber-700/40' : 'border-red-700/40'
    : '';

  const steps = [
    { label: 'Régime', q: 'Votre régime de domiciliation bancaire' },
    { label: 'Volume', q: 'Volume annuel import/export (estimé)' },
    { label: 'Instruments', q: 'Instruments de couverture actuellement utilisés' },
    { label: 'Ratio', q: 'Ratio de couverture actuel (en % de l\'exposition)' },
    { label: 'Secteur', q: 'Secteur d\'activité' },
    { label: 'Email', q: 'Recevoir le rapport PDF' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="bg-navy-900 border border-navy-700 rounded-2xl overflow-hidden">
        <div className="h-0.5 bg-gradient-to-r from-amber-700 via-amber-400 to-amber-700" />
        <div className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <Shield size={16} className="text-amber-400" />
            <span className="text-[9px] font-bold text-amber-400 uppercase tracking-[0.2em] bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded">
              Lead Magnet 1 — PME & Corporate
            </span>
          </div>
          <h1 className="text-xl font-serif font-bold text-white mb-1">
            Diagnostic de Conformité Office des Changes
          </h1>
          <p className="text-sm text-slate-400">
            Circulaire OC n°01/2024 · 4 minutes · Rapport PDF immédiat · 100% pédagogique
          </p>
        </div>
        {/* Progress bar */}
        {step < 6 && (
          <div className="h-1 bg-navy-800">
            <div
              className="h-1 bg-amber-500 transition-all duration-500"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* ── Steps ── */}
      {step < 6 && (
        <div className="bg-navy-900 border border-navy-700 rounded-2xl p-6">
          <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">
            Étape {step + 1} / {steps.length}
          </p>
          <h2 className="text-base font-bold text-white mb-5">{steps[step].q}</h2>

          {/* Step 0 — Regime */}
          {step === 0 && (
            <div className="space-y-2">
              {REGIMES.map(r => (
                <button key={r.value} onClick={() => { setAnswers(a => ({ ...a, regime: r.value })); setStep(1); }}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm ${
                    answers.regime === r.value ? 'border-amber-600/60 bg-amber-500/10 text-white' : 'border-navy-700 text-slate-300 hover:border-navy-600 hover:bg-navy-800/50'
                  }`}>
                  {r.label}
                </button>
              ))}
            </div>
          )}

          {/* Step 1 — Volume */}
          {step === 1 && (
            <div className="grid grid-cols-2 gap-3">
              {VOLUMES.map(v => (
                <button key={v.value} onClick={() => { setAnswers(a => ({ ...a, volume: v.value })); setStep(2); }}
                  className={`px-4 py-4 rounded-xl border transition-all text-sm font-semibold ${
                    answers.volume === v.value ? 'border-amber-600/60 bg-amber-500/10 text-white' : 'border-navy-700 text-slate-300 hover:border-navy-600'
                  }`}>
                  {v.label}
                </button>
              ))}
            </div>
          )}

          {/* Step 2 — Instruments (multi-select) */}
          {step === 2 && (
            <div className="space-y-2">
              {INSTRUMENTS.map(i => (
                <button key={i.value}
                  onClick={() => toggleInstrument(i.value)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm flex items-center gap-3 ${
                    (i.value === 'none' && answers.instruments.length === 0) ||
                    answers.instruments.includes(i.value)
                      ? 'border-amber-600/60 bg-amber-500/10 text-white'
                      : 'border-navy-700 text-slate-300 hover:border-navy-600'
                  }`}>
                  <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${
                    answers.instruments.includes(i.value) ? 'bg-amber-500 border-amber-500' : 'border-navy-600'
                  }`}>
                    {answers.instruments.includes(i.value) && <CheckCircle size={10} className="text-navy-950" />}
                  </div>
                  {i.label}
                </button>
              ))}
              <button onClick={() => setStep(3)}
                className="mt-3 w-full py-2.5 bg-amber-500 text-navy-950 font-bold text-sm rounded-xl hover:bg-amber-400 transition-colors">
                Continuer →
              </button>
            </div>
          )}

          {/* Step 3 — Ratio slider */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">0%</span>
                <span className="text-2xl font-mono font-bold text-white">{answers.ratio}%</span>
                <span className="text-slate-400 text-sm">100%</span>
              </div>
              <input type="range" min={0} max={120} step={5} value={answers.ratio}
                onChange={e => setAnswers(a => ({ ...a, ratio: parseInt(e.target.value) }))}
                className="w-full accent-amber-500" />
              <p className="text-[10px] text-slate-500">
                La Circulaire OC n°01/2024 autorise un ratio maximum de 100% de l'exposition commerciale documentée.
              </p>
              <button onClick={() => setStep(4)}
                className="w-full py-2.5 bg-amber-500 text-navy-950 font-bold text-sm rounded-xl hover:bg-amber-400 transition-colors">
                Continuer →
              </button>
            </div>
          )}

          {/* Step 4 — Sector */}
          {step === 4 && (
            <div className="grid grid-cols-2 gap-2">
              {SECTORS.map(s => (
                <button key={s} onClick={() => { setAnswers(a => ({ ...a, sector: s })); setStep(5); }}
                  className={`px-3 py-2.5 rounded-xl border text-left text-[12px] transition-all ${
                    answers.sector === s ? 'border-amber-600/60 bg-amber-500/10 text-white' : 'border-navy-700 text-slate-300 hover:border-navy-600'
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Step 5 — Email gate */}
          {step === 5 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-400">
                Votre diagnostic est prêt. Entrez votre email professionnel pour recevoir le rapport PDF
                et consulter vos résultats.
              </p>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="votre@entreprise.ma"
                className="w-full bg-navy-950 border border-navy-700 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors" />
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}
                  className="mt-0.5 flex-shrink-0 accent-amber-500" />
                <span className="text-[9px] text-slate-600 leading-relaxed">
                  J'accepte que JAD2 Advisory traite mon email pour m'envoyer ce rapport et me contacter.
                  Loi 09-08 / RGPD Art. 6(1)(a). Retrait : contact@jad2advisory.com.
                </span>
              </label>
              <button onClick={() => { if (email && consent) compute(); }}
                disabled={!email || !consent}
                className="w-full py-2.5 bg-amber-500 text-navy-950 font-bold text-sm rounded-xl hover:bg-amber-400 disabled:opacity-40 transition-colors">
                Voir mon diagnostic →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Results ── */}
      {step === 6 && result && (
        <div className="space-y-4">
          <div className={`bg-navy-900 border ${tierBorder} rounded-2xl p-6`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Score de Maturité OC</p>
                <p className={`text-5xl font-mono font-black ${tierColor}`}>{result.score}<span className="text-2xl text-slate-600">/100</span></p>
                <p className={`text-sm font-bold mt-1 ${tierColor}`}>{result.tier}</p>
              </div>
              <button onClick={() => printReport(answers, result)}
                className="flex items-center gap-2 px-4 py-2 border border-navy-600 text-slate-300 hover:text-white hover:border-navy-500 rounded-lg text-xs font-semibold transition-colors">
                <Download size={13} /> Rapport PDF
              </button>
            </div>

            {result.gaps.length === 0 ? (
              <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-700/40 rounded-lg">
                <CheckCircle size={14} className="text-emerald-400" />
                <p className="text-[12px] text-emerald-300">Aucun écart critique identifié sur la base des informations déclarées.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {result.gaps.map((g, i) => (
                  <div key={i} className={`p-3 rounded-lg border ${
                    g.severity === 'CRITICAL' ? 'bg-red-500/8 border-red-700/40' :
                    g.severity === 'WARNING' ? 'bg-amber-500/8 border-amber-700/40' :
                    'bg-navy-800 border-navy-700'
                  }`}>
                    <div className="flex items-start gap-2">
                      {g.severity === 'CRITICAL' ? <XCircle size={13} className="text-red-400 flex-shrink-0 mt-0.5" /> :
                       g.severity === 'WARNING' ? <AlertTriangle size={13} className="text-amber-400 flex-shrink-0 mt-0.5" /> :
                       <ChevronRight size={13} className="text-slate-500 flex-shrink-0 mt-0.5" />}
                      <div>
                        <p className="text-[12px] text-slate-200 leading-snug">{g.text}</p>
                        <p className="text-[10px] text-slate-600 mt-1 italic">{g.citation}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Follow-up CTA */}
          <div className="bg-gold-500/8 border border-gold-600/25 rounded-xl p-5">
            <p className="text-sm font-bold text-white mb-1">Approfondir avec JAD2 Advisory</p>
            <p className="text-[12px] text-slate-400 mb-3">
              Un consultant JAD2 peut vous accompagner dans la mise en conformité et l'élaboration
              de votre politique de couverture change — formation, audit documentaire, accompagnement OC.
            </p>
            <a href="mailto:contact@jad2advisory.com?subject=Diagnostic%20OC%20%E2%80%94%20Demande%20d%27accompagnement"
              className="inline-flex items-center gap-2 bg-gold-500 text-navy-950 font-bold text-sm px-5 py-2.5 rounded-lg hover:bg-gold-400 transition-colors">
              Contacter JAD2 Advisory →
            </a>
          </div>
        </div>
      )}

      <p className="text-[9px] text-slate-700 text-center leading-relaxed">
        Diagnostic pédagogique fourni par JAD2 Advisory (cabinet de conseil en management, non établissement financier agréé BAM).
        Loi n° 43-12. Faire valider par votre banque domiciliataire et/ou un conseil juridique.
      </p>
    </div>
  );
}
