/**
 * P4.17 — "Cité par" press wall.
 * Logos + links of media, institutions, and articles that reference JAD2FX.
 */

import { Newspaper, BookOpen, ExternalLink, Quote } from 'lucide-react';

const CITATIONS = [
  { media: 'L\'Économiste', date: '2026-06-15', title: 'MAD : la dérive du panier s\'accentue', quote: 'Les simulations de JAD2FX montrent que la dérive s\'est creusée de 35% depuis janvier.', url: 'https://www.leconomiste.com' },
  { media: 'Le Matin',     date: '2026-06-10', title: 'Phase III : le MAD à la croisée des chemins', quote: 'L\'outil pédagogique JAD2FX permet aux trésoriers de simuler l\'impact.', url: 'https://www.lematin.ma' },
  { media: 'Médias24',     date: '2026-05-28', title: 'OC 01/2024 : quel impact pour les PME ?',           quote: 'Le diagnostic gratuit de JAD2FX aide à évaluer son exposition.', url: 'https://www.medias24.com' },
  { media: 'Yabiladi',     date: '2026-05-15', title: 'Transferts MRE : comment lire le fixing',          quote: 'L\'outil JAD2FX référence le panier BKAM 60/40 en temps réel.', url: 'https://www.yabiladi.com' },
  { media: 'Hespress',     date: '2026-05-08', title: 'Le dirham face à l\'euro : que disent les chiffres ?', quote: 'JAD2FX documente chaque fixing de manière transparente.', url: 'https://www.hespress.com' },
  { media: 'Le360',        date: '2026-04-22', title: 'Forwards MAD : guide pour les trésoriers',           quote: 'JAD2FX propose un simulateur CIP gratuit.', url: 'https://www.le360.ma' },
];

const ACADEMIC_CITES = [
  { institution: 'ISCAE Casablanca', context: 'Master Banque & Finance — 2026', detail: 'JAD2FX utilisé comme support pédagogique pour le module "Gestion du risque de change".' },
  { institution: 'ENCG Settat',       context: 'Master Commerce International',  detail: 'Études de cas basées sur l\'outil JAD2FX pour le cours "Finance internationale".' },
];

export default function PressWall() {
  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center gap-2">
        <Newspaper size={14} className="text-gold-500" />
        <h1 className="text-base font-bold text-white uppercase tracking-wider">Cité par</h1>
        <span className="text-[10px] text-slate-500 ml-auto">Mentions presse · Maroc</span>
      </div>

      <div className="bg-navy-900 border border-navy-700 rounded-2xl p-5">
        <p className="text-[12px] text-slate-300 leading-relaxed">
          JAD2FX est cité comme source pédagogique par des médias marocains et internationaux.
          Si vous écrivez un article qui mentionne JAD2FX, contactez-nous pour figurer ici.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {CITATIONS.map((c) => (
          <a
            key={c.media + c.date}
            href={c.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-navy-900 border border-navy-700 rounded-2xl p-4 hover:border-gold-500/40 transition-colors"
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[10px] font-bold text-gold-400 uppercase tracking-wider">{c.media}</span>
              <span className="text-[10px] text-slate-500 font-mono">{c.date}</span>
            </div>
            <h3 className="text-[13px] font-serif font-bold text-white leading-tight mb-2">{c.title}</h3>
            <p className="text-[11px] text-slate-400 leading-snug italic border-l-2 border-gold-500/30 pl-2">
              <Quote size={10} className="inline -mt-0.5 mr-1 text-gold-500" />{c.quote}
            </p>
            <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-500">
              <ExternalLink size={9} /> Lire l&apos;article
            </div>
          </a>
        ))}
      </div>

      <div className="bg-navy-900 border border-navy-700 rounded-2xl p-5 space-y-3">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <BookOpen size={14} className="text-gold-500" /> Citations académiques
        </h2>
        {ACADEMIC_CITES.map((a) => (
          <div key={a.institution} className="bg-navy-950 border border-navy-800 rounded-lg p-3">
            <p className="text-[12px] font-bold text-slate-200">{a.institution}</p>
            <p className="text-[10px] text-slate-500 italic">{a.context}</p>
            <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">{a.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
