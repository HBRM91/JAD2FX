import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ClipboardCheck, Mail, MessageSquare, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';

/**
 * P3.23 — Diagnostic FX PME
 * 5 questions → exposure score → CTA to consulting.
 * Educational funnel: a treasurer who completes this is a HOT lead.
 */

interface Answers {
  sector: string;
  invoiceCurrency: string;
  annualVolumeMAD: string;
  hedges: string;
  ocKnowledge: string;
}

const QUESTIONS = [
  {
    id: 'sector',
    title: 'Quel est votre secteur d\'activité principal ?',
    options: [
      { value: 'import',    label: 'Importateur (matières premières / biens d\'équipement)' },
      { value: 'export',    label: 'Exportateur (produits finis / services)' },
      { value: 'impex',     label: 'Import-Export (les deux)' },
      { value: 'service',   label: 'Services B2B / conseil / tech' },
      { value: 'industrie', label: 'Industrie / manufacturing local' },
    ],
  },
  {
    id: 'invoiceCurrency',
    title: 'En quelle devise sont vos factures fournisseurs / clients ?',
    options: [
      { value: 'EUR',     label: 'Principalement EUR' },
      { value: 'USD',     label: 'Principalement USD' },
      { value: 'EUR_USD', label: 'Mixte EUR + USD' },
      { value: 'CNY',     label: 'CNY (imports asie)' },
      { value: 'OTHER',   label: 'Autres (CHF, GBP, JPY…)' },
    ],
  },
  {
    id: 'annualVolumeMAD',
    title: 'Volume annuel d\'achats/ventes en devises ?',
    options: [
      { value: '<5M',   label: '< 5 Mds MAD' },
      { value: '5-20M', label: '5-20 Mds MAD' },
      { value: '20-50M', label: '20-50 Mds MAD' },
      { value: '50-200M', label: '50-200 Mds MAD' },
      { value: '>200M', label: '> 200 Mds MAD' },
    ],
  },
  {
    id: 'hedges',
    title: 'Comment couvrez-vous votre risque de change aujourd\'hui ?',
    options: [
      { value: 'none',         label: 'Pas de couverture — exposition ouverte' },
      { value: 'spontaneous',  label: 'Couverture ponctuelle (à l\'instinct)' },
      { value: 'forward',      label: 'Forwards systématiques (banque)' },
      { value: 'options',      label: 'Options / instruments dérivés' },
      { value: 'policy',       label: 'Politique de couverture documentée' },
    ],
  },
  {
    id: 'ocKnowledge',
    title: 'Connaissez-vous la Circ. OC 01/2024 sur les instruments de couverture autorisés ?',
    options: [
      { value: 'no',         label: 'Non, pas du tout' },
      { value: 'heard',      label: 'J\'en ai entendu parler' },
      { value: 'read',       label: 'J\'ai lu la circulaire' },
      { value: 'compliant',  label: 'On est en conformité' },
      { value: 'audit',      label: 'On a fait auditer nos procédures' },
    ],
  },
] as const;

interface DiagnosticResult {
  score: number;            // 0-100
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendations: string[];
  cta: 'NEWSLETTER' | 'TOOLS' | 'AUDIT' | 'CONTACT';
  summary: string;
}

function scoreDiagnostic(a: Answers): DiagnosticResult {
  let score = 0;

  // Volume score (0-25)
  const volMap: Record<string, number> = { '<5M': 5, '5-20M': 12, '20-50M': 18, '50-200M': 22, '>200M': 25 };
  score += volMap[a.annualVolumeMAD] ?? 0;

  // Hedge gap (0-30)
  const hedgeMap: Record<string, number> = { none: 30, spontaneous: 22, forward: 10, options: 6, policy: 0 };
  score += hedgeMap[a.hedges] ?? 0;

  // OC knowledge gap (0-25)
  const ocMap: Record<string, number> = { no: 25, heard: 18, read: 10, compliant: 4, audit: 0 };
  score += ocMap[a.ocKnowledge] ?? 0;

  // Currency exposure (0-20)
  const ccyMap: Record<string, number> = { EUR: 12, USD: 14, EUR_USD: 18, CNY: 16, OTHER: 10 };
  score += ccyMap[a.invoiceCurrency] ?? 0;

  score = Math.min(100, score);

  const level: DiagnosticResult['level'] =
    score < 25  ? 'LOW' :
    score < 50  ? 'MEDIUM' :
    score < 75  ? 'HIGH' : 'CRITICAL';

  const recommendations: string[] = [];
  if ((hedgeMap[a.hedges] ?? 0) >= 20) {
    recommendations.push('Mettez en place une politique de couverture structurée (forward, options) avec votre banque domiciliataire.');
  }
  if ((ocMap[a.ocKnowledge] ?? 0) >= 18) {
    recommendations.push('Priorisez la mise en conformité OC 01/2024 — instruments autorisés, plafonds, reporting.');
  }
  if ((volMap[a.annualVolumeMAD] ?? 0) >= 12) {
    recommendations.push('Avec ce volume, l\'économie potentielle d\'une couverture optimisée se chiffre en millions de MAD/an.');
  }
  if (a.hedges === 'none') {
    recommendations.push('Documentez votre exposition actuelle : nature (transactionnelle vs économique), devises, échéances.');
  }

  const cta: DiagnosticResult['cta'] =
    score < 25  ? 'NEWSLETTER' :
    score < 50  ? 'TOOLS' :
    score < 75  ? 'AUDIT' : 'CONTACT';

  const summary =
    level === 'LOW'      ? 'Votre exposition FX est bien gérée. Restez informé des évolutions réglementaires.' :
    level === 'MEDIUM'   ? 'Vous avez des zones d\'amélioration concrètes. Nos outils peuvent vous aider à structurer.' :
    level === 'HIGH'     ? 'Votre exposition présente des risques significatifs. Un cadrage professionnel est recommandé.' :
                           'URGENT — exposition critique non couverte + non-conformité probable. Contactez-nous rapidement.';

  return { score, level, recommendations, cta, summary };
}

export default function PmeDiagnostic() {
  const { config } = useAdmin();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<Answers>>({});
  const [done, setDone] = useState(false);

  const result = useMemo(() => scoreDiagnostic(answers as Answers), [answers]);

  const currentQ = QUESTIONS[step];
  const progress = ((step + (answers[currentQ?.id as keyof Answers] ? 1 : 0)) / QUESTIONS.length) * 100;

  if (done) {
    return (
      <div className="bg-navy-900 border border-navy-700 rounded-2xl p-6 space-y-5 max-w-2xl mx-auto">
        <div className="text-center">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 ${
            result.level === 'CRITICAL' ? 'bg-red-500/15 border border-red-500/40' :
            result.level === 'HIGH'     ? 'bg-orange-500/15 border border-orange-500/40' :
            result.level === 'MEDIUM'   ? 'bg-amber-500/15 border border-amber-500/40' :
                                          'bg-emerald-500/15 border border-emerald-500/40'
          }`}>
            {result.level === 'LOW' || result.level === 'MEDIUM' ? (
              <CheckCircle2 size={28} className="text-emerald-400" />
            ) : (
              <AlertCircle size={28} className={
                result.level === 'CRITICAL' ? 'text-red-400' : 'text-orange-400'
              } />
            )}
          </div>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest">Score d'Exposition FX</p>
          <p className="text-5xl font-bold font-mono text-gold-400 mt-1">{result.score}<span className="text-2xl text-slate-500">/100</span></p>
          <p className={`text-[11px] font-bold uppercase tracking-wider mt-2 ${
            result.level === 'CRITICAL' ? 'text-red-400' :
            result.level === 'HIGH'     ? 'text-orange-400' :
            result.level === 'MEDIUM'   ? 'text-amber-400' :
                                          'text-emerald-400'
          }`}>
            {result.level}
          </p>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed text-center">{result.summary}</p>

        {result.recommendations.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-[11px] font-bold text-white uppercase tracking-wider">Recommandations prioritaires</h3>
            <ul className="space-y-1.5">
              {result.recommendations.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-[12px] text-slate-300">
                  <span className="text-gold-500 mt-0.5">▸</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* CTAs based on result */}
        <div className="border-t border-navy-800 pt-4 space-y-2">
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Prochaine étape recommandée</p>
          {result.cta === 'NEWSLETTER' && (
            <a
              href="https://jad2advisory.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-gold-500 text-navy-950 font-bold text-sm py-3 rounded-lg hover:bg-gold-400 transition-colors"
            >
              <Mail size={14} /> S'abonner au Morning Briefing
            </a>
          )}
          {result.cta === 'TOOLS' && (
            <div className="grid grid-cols-2 gap-2">
              <a
                href="#forward"
                onClick={(e) => { e.preventDefault(); document.getElementById('forward-calc')?.scrollIntoView({ behavior: 'smooth' }); }}
                className="flex items-center justify-center gap-2 bg-gold-500 text-navy-950 font-bold text-sm py-3 rounded-lg hover:bg-gold-400 transition-colors"
              >
                Calculateur Forward
              </a>
              <a
                href="#oc"
                onClick={(e) => { e.preventDefault(); document.getElementById('oc-diagnostic')?.scrollIntoView({ behavior: 'smooth' }); }}
                className="flex items-center justify-center gap-2 border border-gold-500/50 text-gold-300 font-bold text-sm py-3 rounded-lg hover:bg-gold-500/5 transition-colors"
              >
                Diagnostic OC
              </a>
            </div>
          )}
          {result.cta === 'AUDIT' && (
            <a
              href="https://jad2advisory.com/audit"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-gold-500 text-navy-950 font-bold text-sm py-3 rounded-lg hover:bg-gold-400 transition-colors"
            >
              <ClipboardCheck size={14} /> Demander un audit gratuit 30 min
            </a>
          )}
          {result.cta === 'CONTACT' && (
            <div className="space-y-2">
              <a
                href="https://jad2advisory.com/contact"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-red-500 text-white font-bold text-sm py-3 rounded-lg hover:bg-red-400 transition-colors"
              >
                <MessageSquare size={14} /> Urgence — Parler à un expert
              </a>
              <p className="text-[10px] text-slate-500 text-center">Réponse sous 24h ouvrées · Confidentiel</p>
            </div>
          )}
        </div>

        <button
          onClick={() => { setDone(false); setStep(0); setAnswers({}); }}
          className="w-full text-[11px] text-slate-500 hover:text-gold-400 transition-colors"
        >
          ↻ Recommencer le diagnostic
        </button>
      </div>
    );
  }

  return (
    <div className="bg-navy-900 border border-navy-700 rounded-2xl p-6 max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Diagnostic FX PME</p>
          <p className="text-[10px] text-slate-500 font-mono">{step + 1}/{QUESTIONS.length}</p>
        </div>
        <div className="h-1.5 bg-navy-800 rounded-full overflow-hidden">
          <div className="h-full bg-gold-500 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <h2 className="text-lg font-bold text-white mb-4 leading-snug">{currentQ.title}</h2>

      <div className="space-y-2">
        {currentQ.options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setAnswers((a) => ({ ...a, [currentQ.id]: opt.value }))}
            className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
              answers[currentQ.id as keyof Answers] === opt.value
                ? 'bg-gold-500/15 border-gold-500/60 text-gold-100'
                : 'bg-navy-950 border-navy-700 text-slate-300 hover:border-navy-500 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                answers[currentQ.id as keyof Answers] === opt.value
                  ? 'border-gold-500 bg-gold-500'
                  : 'border-navy-600'
              }`} />
              <span className="text-[13px]">{opt.label}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mt-5">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="flex items-center gap-1 px-3 py-2 text-[12px] text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={12} /> Précédent
        </button>
        {step < QUESTIONS.length - 1 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!answers[currentQ.id as keyof Answers]}
            className="flex items-center gap-1 px-4 py-2 bg-gold-500 text-navy-950 text-[12px] font-bold rounded-lg hover:bg-gold-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Suivant <ChevronRight size={12} />
          </button>
        ) : (
          <button
            onClick={() => setDone(true)}
            disabled={!answers[currentQ.id as keyof Answers]}
            className="flex items-center gap-1 px-4 py-2 bg-gold-500 text-navy-950 text-[12px] font-bold rounded-lg hover:bg-gold-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Voir mon diagnostic <ChevronRight size={12} />
          </button>
        )}
      </div>
    </div>
  );
}
