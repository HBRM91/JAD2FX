import { useState, useEffect } from 'react';
import { AlertTriangle, Home, RefreshCw, Mail, ChevronRight } from 'lucide-react';
import LogoJad2Fx from './LogoJad2Fx';

/**
 * NotFound + ErrorView — Production-grade 404 / 500 page.
 *
 * - Auto-detects 404 vs 500 based on prop
 * - Sets HTTP status via document title (for SPA, no real status)
 * - Provides recovery actions (reload, home, contact)
 * - Logs to console for diagnostics
 * - Renders fully accessible, single-column on mobile
 */
interface Props {
  /** 404 (default) or 500 (server error) */
  variant?: '404' | '500' | 'maintenance';
  /** Optional reason / message to show */
  message?: string;
  /** Optional retry handler */
  onRetry?: () => void;
}

export default function NotFound({ variant = '404', message, onRetry }: Props) {
  const [traceId] = useState(() => Math.random().toString(36).slice(2, 10));

  useEffect(() => {
    const t = variant === '500' ? 'Erreur serveur (500)' : variant === 'maintenance' ? 'Maintenance' : 'Page introuvable (404)';
    document.title = `${t} | JAD2FX`;
    if (typeof console !== 'undefined') {
      console.warn(`[${variant}] trace=${traceId}`, message);
    }
  }, [variant, message, traceId]);

  const title =
    variant === '500' ? 'Erreur serveur' :
    variant === 'maintenance' ? 'Maintenance en cours' :
    'Page introuvable';

  const desc =
    variant === '500' ? 'Le serveur a rencontré une erreur. Notre équipe est notifiée. Réessayez dans quelques instants.' :
    variant === 'maintenance' ? 'Une mise à jour est en cours. La plateforme revient sous 30 minutes.' :
    'La page que vous cherchez n\'existe pas, a été déplacée, ou le lien est expiré.';

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-navy-950">
      <div className="max-w-lg w-full text-center space-y-6">
        <div className="flex justify-center">
          <LogoJad2Fx height={36} />
        </div>

        {/* Status code */}
        <div className="relative">
          <div className="text-[120px] sm:text-[180px] font-bold text-navy-800 leading-none select-none" aria-hidden>
            {variant === 'maintenance' ? 'WIP' : variant}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <AlertTriangle size={56} className="text-gold-500/80" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{title}</h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-md mx-auto">
            {message || desc}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <button
            onClick={() => { window.location.href = '/'; }}
            className="px-4 py-2 bg-gold-500 text-navy-950 font-bold text-sm rounded hover:bg-gold-400 transition-colors inline-flex items-center justify-center gap-2"
          >
            <Home size={14} /> Retour à l'accueil
          </button>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 border border-navy-700 text-slate-300 text-sm font-medium rounded hover:bg-navy-800 transition-colors inline-flex items-center justify-center gap-2"
            >
              <RefreshCw size={14} /> Réessayer
            </button>
          )}
          <a
            href="mailto:contact@jad2advisory.com"
            className="px-4 py-2 border border-navy-700 text-slate-300 text-sm font-medium rounded hover:bg-navy-800 transition-colors inline-flex items-center justify-center gap-2"
          >
            <Mail size={14} /> Nous contacter
          </a>
        </div>

        <details className="text-left text-xs text-slate-500 bg-navy-900/50 border border-navy-800 rounded p-3 max-w-md mx-auto">
          <summary className="cursor-pointer text-slate-400 font-bold flex items-center gap-1">
            <ChevronRight size={12} /> Détails techniques
          </summary>
          <div className="mt-2 space-y-1 font-mono text-[10px]">
            <div>trace_id: <span className="text-slate-300">{traceId}</span></div>
            <div>variant: <span className="text-slate-300">{variant}</span></div>
            <div>user_agent: <span className="text-slate-300 truncate block">{typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 60) : 'n/a'}</span></div>
            {message && <div>message: <span className="text-red-300">{message}</span></div>}
          </div>
        </details>

        <p className="text-[10px] text-slate-600">
          Code trace <span className="text-slate-400 font-mono">{traceId}</span> · JAD2FX Terminal pédagogique
        </p>
      </div>
    </div>
  );
}
