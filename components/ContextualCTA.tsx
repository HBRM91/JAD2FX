/**
 * P3.5 — Contextual CTA engine.
 * Renders a small inline CTA block whose content adapts to the
 * user's lead score. Used on the home page and after tool usage.
 */

import { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, Clock, Award, X, Flame } from 'lucide-react';
import { getLeadScore, getRecommendedCta, trackEvent } from '../utils/leadScoring';
import type { ViewState } from '../types';

interface Props {
  variant?: 'banner' | 'inline' | 'corner';
  pageKey?: string;
  navTo?: (v: ViewState) => void;
}

export default function ContextualCTA({ variant = 'banner', pageKey = 'home', navTo }: Props) {
  const [state, setState] = useState(() => getLeadScore());
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (pageKey) trackEvent('view', pageKey);
    setState(getLeadScore());
    // Refresh every 5s to catch events from other tabs
    const id = setInterval(() => setState(getLeadScore()), 5000);
    return () => clearInterval(id);
  }, [pageKey]);

  // Fire lead event on view of this CTA
  useEffect(() => { trackEvent('view', 'contextual_cta'); }, []);

  if (dismissed && variant === 'corner') return null;
  if (state.score < 5 && variant === 'inline') return null;

  // P0-3 FIX: replace dead `window.location.hash` (no listener reads it)
  // and unused CustomEvents (no listener subscribed) with real SPA navigation.
  const handleCtaClick = () => {
    trackEvent('contact', `${variant}_cta_${cta}`);
    if (cta === 'AUDIT' && navTo) navTo('AUDIT_LANDING');
    else if (cta === 'NEWSLETTER' && navTo) navTo('RESEARCH');
    else if (cta === 'TOOLS' && navTo) navTo('DASHBOARD');
    else if (cta === 'CONTACT' && navTo) navTo('CONTACT');
  };

  const cta = getRecommendedCta(state);
  const isBurning = state.level === 'BURNING' || state.level === 'HOT';

  const MESSAGES: Record<typeof cta, { title: string; sub: string; cta: string; icon: any; color: string }> = {
    NEWSLETTER: {
      title: 'Recevez le Morning Briefing',
      sub: 'Taux de change + analyses FX — chaque lundi à 8h.',
      cta: 'S\'abonner gratuitement',
      icon: Sparkles,
      color: 'gold',
    },
    TOOLS: {
      title: 'Vos outils FX vous attendent',
      sub: 'Forward, swap, couverture trimestrielle, diagnostic OC.',
      cta: 'Explorer les outils',
      icon: Sparkles,
      color: 'blue',
    },
    AUDIT: {
      title: 'Vous êtes prêt pour un audit FX',
      sub: '30 min gratuites avec un expert senior. Sans engagement.',
      cta: 'Réserver mon audit',
      icon: Award,
      color: 'emerald',
    },
    CONTACT: {
      title: 'Parlons-en — devis sous 24h',
      sub: 'Conseil stratégique, formation, automatisation. Casablanca.',
      cta: 'Prendre contact',
      icon: Clock,
      color: 'gold',
    },
  };
  const msg = MESSAGES[cta];
  const Icon = msg.icon;

  if (variant === 'banner') {
    return (
      <div className={`bg-gradient-to-r from-${msg.color}-500/15 to-navy-900 border border-${msg.color}-500/40 rounded-2xl p-4`}>
        <div className="flex items-center gap-3 flex-wrap">
          <div className={`flex-shrink-0 w-10 h-10 rounded-xl bg-${msg.color}-500/15 border border-${msg.color}-500/40 flex items-center justify-center`}>
            <Icon size={18} className={`text-${msg.color}-400`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">{msg.title}</p>
            <p className="text-[11px] text-slate-400">{msg.sub}</p>
          </div>
          <button
            onClick={handleCtaClick}
            className={`flex items-center gap-1.5 px-4 py-2 bg-${msg.color}-500 text-navy-950 text-[12px] font-bold rounded-lg hover:opacity-90 transition-opacity`}
          >
            {msg.cta} <ArrowRight size={12} />
          </button>
        </div>
      </div>
    );
  }

  if (variant === 'corner') {
    return (
      <div className="fixed bottom-5 left-5 z-30 max-w-xs">
        <div className={`relative bg-navy-900 border-2 border-${isBurning ? 'gold' : 'navy-700'}/60 rounded-2xl shadow-2xl p-3`}>
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-1.5 right-1.5 text-slate-500 hover:text-slate-300"
            aria-label="Fermer"
          >
            <X size={12} />
          </button>
          <p className="text-[11px] text-slate-500 mb-0.5 flex items-center gap-1">{state.level === 'BURNING' ? (<><Flame size={11} className="text-amber-400" /> Vous y êtes presque</>) : 'Pendant que vous explorez...'}</p>
          <p className="text-[12px] font-bold text-white mb-1.5 leading-tight pr-3">{msg.title}</p>
          <button
            onClick={handleCtaClick}
            className="w-full text-[11px] font-bold text-gold-400 hover:text-gold-300 transition-colors flex items-center justify-center gap-1"
          >
            {msg.cta} <ArrowRight size={11} />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
