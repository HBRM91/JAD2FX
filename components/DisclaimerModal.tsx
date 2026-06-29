import React, { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';

const STORAGE_KEY = 'jad2fx_disclaimer_v1';

const DISCLAIMER_POINTS = [
  "Les taux de change affichés sont <strong>indicatifs et pédagogiques uniquement</strong> — ils ne constituent pas des prix de transaction fermes ni des cours officiels Bank Al-Maghrib.",
  "JAD2 Advisory est un cabinet de <strong>conseil stratégique et de formation</strong> en gestion du risque de change. Il ne fournit pas de conseil en investissement et n'exécute aucune transaction de change.",
  "Les simulations de forwards et de swaps sont des <strong>outils pédagogiques</strong> basés sur la formule CIP. Elles ne constituent pas une offre commerciale d'instruments financiers.",
  "Pour toute opération de change, adressez-vous exclusivement à un <strong>établissement de crédit agréé par Bank Al-Maghrib</strong>.",
];

export default function DisclaimerModal() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setShow(true);
    } catch {
      setShow(true);
    }
  }, []);

  // Allow Escape to dismiss
  useEffect(() => {
    if (!show) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') accept(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [show]);

  const accept = () => {
    try { localStorage.setItem(STORAGE_KEY, new Date().toISOString()); } catch { /* noop */ }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-navy-950/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) accept(); }}
    >
      <div className="bg-navy-900 border border-navy-700 rounded-t-2xl sm:rounded-xl shadow-2xl shadow-black/60 max-w-md w-full overflow-hidden">

        {/* Header — more compact */}
        <div className="px-5 py-3 border-b border-navy-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gold-500/15 border border-gold-500/30 flex items-center justify-center flex-shrink-0">
            <Shield size={16} className="text-gold-400" />
          </div>
          <div className="flex-1">
            <h2 className="font-serif font-bold text-white text-sm">Avertissement Légal</h2>
            <p className="text-[8px] text-gold-500/70 tracking-widest uppercase font-bold">
              Outil pédagogique · Conformité OC
            </p>
          </div>
        </div>

        {/* Body — compact list */}
        <div className="px-5 py-4 space-y-3">
          <ol className="list-none space-y-2">
            {DISCLAIMER_POINTS.map((text, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-gold-500/15 border border-gold-500/30 text-gold-400 text-[9px] font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span
                  className="text-[10.5px] text-slate-300 leading-snug [&>strong]:text-slate-200 [&>strong]:font-semibold"
                  dangerouslySetInnerHTML={{ __html: text }}
                />
              </li>
            ))}
          </ol>

          <div className="p-2 bg-amber-500/5 border border-amber-500/20 rounded">
            <p className="text-[9.5px] text-amber-400/80 leading-snug">
              ⚠️ Lois 19-14 &amp; 103-12 · Réservé information et formation.
            </p>
          </div>
        </div>

        {/* Footer — bigger, more visible primary action */}
        <div className="px-5 py-3 border-t border-navy-800 bg-navy-950/30">
          <button
            onClick={accept}
            className="w-full px-6 py-3 bg-gold-500 text-navy-950 text-sm font-bold rounded hover:bg-gold-400 transition-colors shadow-lg shadow-gold-900/30"
          >
            J'ai compris — Accéder aux taux
          </button>
          <p className="text-[9px] text-slate-500 mt-1.5 text-center">
            ou appuyez sur <kbd className="px-1 bg-navy-800 border border-navy-700 rounded">Échap</kbd> · clic en dehors pour accepter
          </p>
        </div>
      </div>
    </div>
  );
}
