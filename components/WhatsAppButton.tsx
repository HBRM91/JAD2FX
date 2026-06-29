/**
 * P3.17 — WhatsApp click-to-chat button.
 * Floating button bottom-right; uses env WHATSAPP_NUMBER or fallback.
 */

import { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';

const DEFAULT_MESSAGE = 'Bonjour JAD2, je viens de JAD2FX et je souhaite en savoir plus sur vos services.';

export default function WhatsAppButton() {
  const { config } = useAdmin();
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 5000);
    return () => clearTimeout(t);
  }, []);

  // Stop pulse after 30s to reduce visual noise
  useEffect(() => {
    const t = setTimeout(() => setPulse(false), 30000);
    return () => clearTimeout(t);
  }, []);

  // WHATSAPP_NUMBER env injected at build time
  const number = (typeof process !== 'undefined' && (process.env as any)?.WHATSAPP_NUMBER) || '';
  if (!number || !visible) return null;

  const url = `https://wa.me/${number}?text=${encodeURIComponent(DEFAULT_MESSAGE)}`;

  return (
    <>
      {/* Pulse glow */}
      {pulse && !open && (
        <div className="fixed bottom-20 right-5 z-40 pointer-events-none">
          <div className="w-14 h-14 rounded-full bg-emerald-500/40 animate-ping" />
        </div>
      )}

      {/* Tooltip popup */}
      {open && (
        <div className="fixed bottom-32 right-5 z-50 w-72 bg-navy-900 border border-emerald-700/50 rounded-2xl shadow-2xl p-4">
          <button onClick={() => setOpen(false)} className="absolute top-2 right-2 text-slate-500 hover:text-slate-300">
            <X size={14} />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center">
              <MessageCircle size={18} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-[12px] font-bold text-white">Discutons sur WhatsApp</p>
              <p className="text-[10px] text-slate-500">Réponse en moins d'1h ouvrée</p>
            </div>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
            Notre équipe FX est disponible pour répondre à vos questions en direct.
            Posez votre question par écrit — on revient vers vous dans l'heure.
          </p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              if (typeof window !== 'undefined' && (window as any).plausible) {
                (window as any).plausible('whatsapp_click', { props: { source: 'floating_button' } });
              }
            }}
            className="block w-full text-center px-3 py-2.5 bg-emerald-500 text-navy-950 text-[12px] font-bold rounded-lg hover:bg-emerald-400 transition-colors"
          >
            Ouvrir WhatsApp
          </a>
        </div>
      )}

      {/* Main button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Contact WhatsApp"
        className="fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full bg-emerald-500 text-navy-950 flex items-center justify-center shadow-2xl shadow-emerald-900/50 hover:scale-105 transition-transform"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </>
  );
}
