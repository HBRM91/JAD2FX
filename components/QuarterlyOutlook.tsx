/**
 * P4.8 — MAD Quarterly Outlook PDF preview.
 * Stub: real implementation would generate via pdfkit or similar.
 * Here we provide a formatted HTML preview + a button to "Subscribe to receive the PDF".
 */

import { FileText, Download, BarChart3, TrendingUp, Globe, BookOpen, Calendar } from 'lucide-react';
import NewsletterSignup from './NewsletterSignup';
import { useAdmin } from '../context/AdminContext';

const SECTIONS = [
  {
    icon: Globe,
    title: 'Contexte macroéconomique global',
    pages: '2-5',
    summary: 'BCE, Fed, BKAM : posture monétaire, taux directeurs, et impact sur le MAD. Données Q2 2026.',
    bullets: [
      'BCE : taux directeur 2.25%, 9 baisses depuis 2023',
      'Fed : taux 4.75%, statu quo attendu jusqu\'à septembre',
      'BKAM : taux 2.75%, prochaine décision juillet 2026',
    ],
  },
  {
    icon: BarChart3,
    title: 'Évolution du panier BKAM 60/40',
    pages: '6-12',
    summary: 'EUR/USD impact, dérive observée, position dans la bande ±5%, fan chart 90 jours.',
    bullets: [
      'Dérive moyenne Q2 2026 : -296 bps (vs -45 bps en 2025)',
      'EUR/USD : 1.085 (vs 1.07-1.12 sur 12 mois)',
      'Position dans la bande : 80% (zone supérieure)',
    ],
  },
  {
    icon: TrendingUp,
    title: 'Implications sectorielles',
    pages: '13-22',
    summary: 'Automobile Tanger, textile Fès, bois Casablanca, phosphates Khouribga, agri.',
    bullets: [
      'Automobile : marge 4.2% à 10.85 EUR/MAD, vs 2.8% à 11.20',
      'Textile export : +12% de CA en EUR sur Q2',
      'Phosphates : prix stable, recettes USD en hausse',
    ],
  },
  {
    icon: BookOpen,
    title: 'Conformité OC 01/2024 — état des lieux',
    pages: '23-30',
    summary: 'Instruments autorisés, reporting PME 500K MAD/mois, sanctions, bonnes pratiques.',
    bullets: [
      'Forwards : autorisé, plafond illimité',
      'Options vanilla : autorisées (banque agréée uniquement)',
      'Options exotiques : interdites — sanctions 0.5%/jour',
    ],
  },
  {
    icon: Calendar,
    title: 'Calendrier & perspectives Q3 2026',
    pages: '31-38',
    summary: 'FOMC, BCE, BAM Council, échéances Phase III, prévisions JAD2FX.',
    bullets: [
      'FOMC : 30 juillet, 17 septembre 2026',
      'BCE : 31 juillet, 11 septembre 2026',
      'BKAM Council : 23 septembre 2026',
    ],
  },
];

export default function QuarterlyOutlook() {
  const { config } = useAdmin();
  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center gap-2">
        <FileText size={14} className="text-gold-500" />
        <h1 className="text-base font-bold text-white uppercase tracking-wider">MAD Quarterly Outlook</h1>
        <span className="text-[10px] text-slate-500 ml-auto">Q2 2026 · 38 pages · PDF</span>
      </div>

      <div className="bg-navy-900 border border-gold-700/40 rounded-2xl p-5">
        <p className="text-[12px] text-slate-300 leading-relaxed">
          Le <strong>MAD Quarterly Outlook</strong> est l'analyse trimestrielle de référence sur le dirham marocain.
          Macroéconomie, panier BKAM, secteur par secteur, conformité OC, et perspectives à 90 jours.
          Réservé à nos abonnés (newsletter Morning Briefing).
        </p>
        <div className="flex items-center gap-2 mt-3">
          <button
            disabled
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold bg-gold-500 text-navy-950 rounded disabled:opacity-50"
          >
            <Download size={12} /> Télécharger Q2 2026 PDF
          </button>
          <span className="text-[10px] text-slate-500">Réservé aux abonnés</span>
        </div>
      </div>

      {/* Table of contents */}
      <div className="bg-navy-900 border border-navy-700 rounded-2xl p-5">
        <h2 className="text-sm font-bold text-white mb-3">Sommaire</h2>
        <div className="space-y-2">
          {SECTIONS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="bg-navy-950 border border-navy-800 rounded-lg p-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gold-500/15 border border-gold-500/30 flex items-center justify-center flex-shrink-0">
                    <Icon size={14} className="text-gold-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-[12px] font-bold text-white">
                        <span className="text-slate-500 mr-2">{i + 1}.</span>{s.title}
                      </h3>
                      <span className="text-[10px] text-slate-500 font-mono flex-shrink-0">p. {s.pages}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug">{s.summary}</p>
                    <ul className="mt-2 space-y-0.5">
                      {s.bullets.map((b, j) => (
                        <li key={j} className="text-[10.5px] text-slate-500 flex items-start gap-1.5">
                          <span className="text-gold-500/60">▸</span> {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Subscribe to get the PDF */}
      <div className="bg-navy-900/50 border border-gold-700/30 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-white mb-2">Recevez le PDF complet</h3>
        <p className="text-[11px] text-slate-400 mb-3">
          Abonnez-vous au Morning Briefing et recevez le Quarterly Outlook PDF en avant-première, plus toutes les autres éditions.
        </p>
        <NewsletterSignup proxyUrl={config.corsProxyUrl} source="quarterly_outlook" variant="card" />
      </div>
    </div>
  );
}
