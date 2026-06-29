import { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, X, Check, Sparkles, Building2, TrendingUp, FileCheck, Mail, Target } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { trackWizardComplete } from '../utils/leadScoring';

interface Step {
  id: string;
  title: string;
  description: string;
  icon: any;
  cta: { label: string; view?: string; action?: () => void };
}

const STEPS: Step[] = [
  {
    id: 'welcome',
    title: 'Bienvenue sur JAD2FX',
    description: 'Le terminal pédagogique de référence pour les trésoriers marocains. 24 devises vs MAD, simulateurs CIP, conformité OC.',
    icon: Sparkles,
    cta: { label: 'Commencer' },
  },
  {
    id: 'profile',
    title: 'Quel est votre profil ?',
    description: 'DAF, trésorier, gérant PME, enseignant ? Cela nous aide à personnaliser votre expérience.',
    icon: Building2,
    cta: { label: 'PME & Corporate' },
  },
  {
    id: 'pair',
    title: 'Choisissez votre paire favorite',
    description: 'Sélectionnez la devise que vous suivez le plus. Nous personnaliserons votre watchlist et vos alertes.',
    icon: TrendingUp,
    cta: { label: 'EUR/MAD' },
  },
  {
    id: 'risk',
    title: 'Définissez votre tolérance au risque',
    description: 'Quel est votre horizon de couverture et votre appétit pour le risque ? Cela calibre nos suggestions de couverture.',
    icon: Target,
    cta: { label: 'Court terme (3-6M)' },
  },
  {
    id: 'tools',
    title: 'Découvrez les outils FX',
    description: 'Diagnostic FX PME, calculateur forward, simulateur trimestriel — tout ce qu\'il faut pour cadrer votre exposition.',
    icon: FileCheck,
    cta: { label: 'Lancer le diagnostic', view: 'TOOL_PME_DIAG' },
  },
  {
    id: 'done',
    title: 'Vous êtes prêt !',
    description: 'Recevez le Morning Briefing chaque lundi pour rester à jour sur le marché MAD.',
    icon: Mail,
    cta: { label: 'S\'abonner au Morning Briefing' },
  },
];

const STORAGE_KEY = 'jad2fx_onboarding_done_v1';

export default function Onboarding() {
  const { config } = useAdmin();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | null = null;
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        t = setTimeout(() => setOpen(true), 3000);
      }
    } catch { /* ignore */ }
    return () => { if (t) clearTimeout(t); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!open) return null;
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const progress = ((step + 1) / STEPS.length) * 100;
  const Icon = current.icon;

  const finish = () => {
    try { localStorage.setItem(STORAGE_KEY, new Date().toISOString()); } catch { /* ignore */ }
    trackWizardComplete('onboarding');
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[9995] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-navy-950/85 backdrop-blur-sm">
      <div className="bg-navy-900 border border-gold-700/40 rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Progress */}
        <div className="h-1 bg-navy-800">
          <div className="h-full bg-gold-500 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-navy-800">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gold-500/15 border border-gold-500/30 flex items-center justify-center">
              <Icon size={16} className="text-gold-400" />
            </div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Onboarding {step + 1}/{STEPS.length}</p>
          </div>
          <button onClick={finish} className="text-slate-500 hover:text-slate-300" aria-label="Passer">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-3">
          <h2 className="text-lg font-serif font-bold text-white">{current.title}</h2>
          <p className="text-[12px] text-slate-300 leading-relaxed">{current.description}</p>

          {isLast && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
              <p className="text-[11px] text-emerald-300 font-bold">🎉 Vous êtes prêt !</p>
              <p className="text-[10px] text-slate-400 mt-1">
                Explorez librement — l'app s'adapte à votre utilisation.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-navy-800 flex items-center justify-between bg-navy-950/30">
          <button
            onClick={() => step > 0 ? setStep(step - 1) : finish()}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-1"
          >
            <ChevronLeft size={12} /> {step > 0 ? 'Précédent' : 'Passer'}
          </button>
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${i === step ? 'bg-gold-500' : 'bg-slate-700'}`}
              />
            ))}
          </div>
          <button
            onClick={() => isLast ? finish() : setStep(step + 1)}
            className="flex items-center gap-1 text-[12px] font-bold px-3 py-1.5 bg-gold-500 text-navy-950 rounded hover:bg-gold-400"
          >
            {isLast ? 'Terminer' : 'Suivant'} <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

/** Reopen button (for users who skipped) */
export function OnboardingTrigger() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => {
          try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
          setOpen(true);
        }}
        className="text-[10px] text-slate-500 hover:text-gold-400 transition-colors"
        title="Relancer le tour guidé"
      >
        Relancer le tour
      </button>
      {open && <Onboarding />}
    </>
  );
}
