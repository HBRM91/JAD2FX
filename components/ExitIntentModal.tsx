/**
 * P3.11 — Exit-intent modal.
 * Triggers on desktop mouseleave (top) and mobile scroll-up. Offers a lead magnet.
 */

import { useEffect, useState } from 'react';
import { X, Download, Gift, Mail } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';

const STORAGE_KEY = 'jad2fx_exit_intent_v1';
const SHOW_DELAY_MS = 30_000; // 30s minimum on site before triggering

export default function ExitIntentModal() {
  const { config } = useAdmin();
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tryShow = () => {
      if (cancelled) return;
      try {
        if (localStorage.getItem(STORAGE_KEY)) return;
        localStorage.setItem(STORAGE_KEY, new Date().toISOString());
        setShow(true);
        if (typeof window !== 'undefined' && (window as any).plausible) {
          (window as any).plausible('exit_intent_show');
        }
      } catch { /* ignore */ }
    };

    // Desktop: mouseleave top
    const onMouseLeave = (e: MouseEvent) => {
      if (e.clientY < 10 && (Date.now() - (window as any).__jad2_start_ts) > SHOW_DELAY_MS) {
        tryShow();
      }
    };

    // Mobile: scroll up rapidly
    let lastY = window.scrollY;
    const onScroll = () => {
      const dy = window.scrollY - lastY;
      if (dy < -50 && (Date.now() - (window as any).__jad2_start_ts) > SHOW_DELAY_MS) {
        tryShow();
      }
      lastY = window.scrollY;
    };

    timer = setTimeout(() => {
      (window as any).__jad2_start_ts = Date.now();
      document.addEventListener('mouseleave', onMouseLeave);
      window.addEventListener('scroll', onScroll, { passive: true });
    }, 100);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
    if (typeof window !== 'undefined' && (window as any).plausible) {
      (window as any).plausible('exit_intent_lead', { props: { source: 'exit_intent' } });
    }
    // Fire newsletter subscribe
    const base = (config.corsProxyUrl ?? '').replace(/\/$/, '');
    if (base) {
      fetch(`${base}/api/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'exit_intent' }),
      }).catch(() => {});
    }
  };

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[9997] flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) setShow(false); }}
    >
      <div className="bg-navy-900 border-2 border-gold-500/50 rounded-2xl shadow-2xl shadow-gold-900/30 max-w-md w-full overflow-hidden">
        <div className="px-5 py-3 bg-gradient-to-r from-gold-500/15 to-transparent border-b border-navy-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift size={16} className="text-gold-400" />
            <span className="text-[10px] font-bold text-gold-300 uppercase tracking-wider">Avant de partir...</span>
          </div>
          <button onClick={() => setShow(false)} className="text-slate-500 hover:text-slate-300">
            <X size={16} />
          </button>
        </div>

        {submitted ? (
          <div className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center mx-auto mb-3">
              <Mail size={28} className="text-emerald-400" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Merci ✓</h2>
            <p className="text-[12px] text-slate-300 leading-relaxed">
              Le guide vous a été envoyé par email. Vérifiez votre boîte mail (et le spam).
            </p>
            <button onClick={() => setShow(false)} className="mt-4 text-[11px] text-gold-400 hover:text-gold-300">
              Fermer →
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-5 space-y-3">
            <h2 className="text-base font-serif font-bold text-white leading-tight">
              Recevez notre <span className="text-gold-400">Guide Forward de Change</span> (PDF, 25p)
            </h2>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Tout ce qu'un trésorier marocain doit savoir : CIP, conventions OC 01/2024, cas pratiques par secteur.
              Pas de spam, désabonnement en 1 clic.
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@entreprise.ma"
              required
              className="w-full bg-navy-950 border border-navy-700 rounded-lg px-3 py-2 text-[13px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-gold-500"
            />
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gold-500 text-navy-950 text-sm font-bold rounded-lg hover:bg-gold-400 transition-colors"
            >
              <Download size={14} /> Recevoir le guide gratuit
            </button>
            <p className="text-[9px] text-slate-500 text-center italic">
              Données traitées selon la loi 09-08 · CNDP
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
