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

  const accept = () => {
    try { localStorage.setItem(STORAGE_KEY, new Date().toISOString()); } catch { /* noop */ }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-navy-950 backdrop-blur-sm">
      <div className="bg-navy-900 border border-navy-700 rounded-t-2xl sm:rounded-xl shadow-2xl shadow-black/60 max-w-lg w-full overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-gold-500/10 to-transparent border-b border-navy-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gold-500/15 border border-gold-500/30 flex items-center justify-center flex-shrink-0">
            <Shield size={18} className="text-gold-400" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-white text-base">Avertissement Légal</h2>
            <p className="text-[9px] text-gold-500/70 tracking-widest uppercase font-bold">
              JAD2FX · Loi n° 43-12 · Loi 103-12
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-[12px] text-navy-300 leading-relaxed">
            En utilisant JAD2FX, vous reconnaissez et acceptez les conditions suivantes :
          </p>

          <ol className="list-none space-y-3">
            {DISCLAIMER_POINTS.map((text, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gold-500/15 border border-gold-500/30 text-gold-400 text-[10px] font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span
                  className="text-[11px] text-navy-300 leading-relaxed [&>strong]:text-slate-200 [&>strong]:font-semibold"
                  dangerouslySetInnerHTML={{ __html: text }}
                />
              </li>
            ))}
          </ol>

          <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
            <p className="text-[10px] text-amber-400/80 leading-relaxed">
              ⚠️ Conformément aux Lois n° 19-14 et n° 103-12 et aux circulaires de l'Office des Changes,
              cet outil est strictement réservé à des fins d'information et de formation.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-navy-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-navy-950/30">
          <p className="text-[11px] text-slate-500 leading-relaxed text-center sm:text-left">
            En cliquant « J'ai compris », vous confirmez avoir pris connaissance de ces conditions.
          </p>
          <button
            onClick={accept}
            className="flex-shrink-0 w-full sm:w-auto px-6 py-2.5 bg-gold-500 text-navy-950 text-xs font-bold rounded hover:bg-gold-400 transition-colors shadow-lg shadow-gold-900/30"
          >
            J'ai compris →
          </button>
        </div>
      </div>
    </div>
  );
}
