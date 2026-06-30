/**
 * P4.18 â€” Partnerships page.
 * Institutional, academic, and media partners.
 */

import { Handshake, Building2, GraduationCap, Newspaper, ExternalLink, Award } from 'lucide-react';
import { BKAM_LINKS } from '../constants/bkamLinks';

const PARTNERS = [
  {
    category: 'AcadÃ©mique',
    icon: GraduationCap,
    color: 'text-purple-400',
    items: [
      { name: 'ISCAE Casablanca', desc: 'Master Banque & Finance â€” formation continue', url: 'https://www.iscae.ma' },
      { name: 'ENCG Settat',       desc: 'Master Commerce International â€” module FX', url: 'https://www.encgsettat.ac.ma' },
      { name: 'EMI Rabat',         desc: 'IngÃ©nierie FinanciÃ¨re â€” partenariat pÃ©dagogique', url: 'https://www.emi.ac.ma' },
    ],
  },
  {
    category: 'Institutionnel',
    icon: Building2,
    color: 'text-gold-400',
    items: [
      { name: 'Bank Al-Maghrib',         desc: 'DonnÃ©es officielles Â· Cours de change Â· BDT', url: BKAM_LINKS.mainSite },
      { name: 'Office des Changes',      desc: 'Circulaires, instructions, FAQ', url: 'https://www.oc.gov.ma' },
      { name: 'HCP (Haut-Commissariat au Plan)', desc: 'DonnÃ©es macroÃ©conomiques Â· IPC', url: 'https://www.hcp.ma' },
      { name: 'AMMC',                     desc: 'AutoritÃ© Marocaine du MarchÃ© des Capitaux', url: 'https://www.ammc.ma' },
    ],
  },
  {
    category: 'MÃ©dias & Presse',
    icon: Newspaper,
    color: 'text-blue-400',
    items: [
      { name: 'Le Matin',     desc: 'Citations rÃ©guliÃ¨res sur le panier BKAM', url: 'https://www.lematin.ma' },
      { name: 'L\'Ã‰conomiste', desc: 'Analyses macroÃ©conomiques citÃ©es', url: 'https://www.leconomiste.com' },
      { name: 'MÃ©dias24',     desc: 'Couverture des Ã©volutions du rÃ©gime de change', url: 'https://www.medias24.com' },
      { name: 'Yabiladi',     desc: 'CommunautÃ© MRE â€” change et transferts', url: 'https://www.yabiladi.com' },
    ],
  },
  {
    category: 'Associations professionnelles',
    icon: Award,
    color: 'text-emerald-400',
    items: [
      { name: 'CGEM',              desc: 'ConfÃ©dÃ©ration GÃ©nÃ©rale des Entreprises du Maroc', url: 'https://www.cgem.ma' },
      { name: 'ASMEX',             desc: 'Association Marocaine des Exportateurs', url: 'https://www.asmex.ma' },
      { name: 'FIMME',             desc: 'FÃ©dÃ©ration des Industries MÃ©tallurgiques', url: 'https://www.fimme.org' },
      { name: 'FENIP',             desc: 'FÃ©dÃ©ration Nationale de l\'Industrie', url: 'https://www.fenip.com' },
    ],
  },
];

export default function Partnerships() {
  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center gap-2">
        <Handshake size={14} className="text-gold-500" />
        <h1 className="text-base font-bold text-white uppercase tracking-wider">Partenariats & CrÃ©dits</h1>
      </div>

      <div className="bg-navy-900 border border-navy-700 rounded-2xl p-5">
        <p className="text-[12px] text-slate-300 leading-relaxed">
          JAD2FX s'appuie sur les donnÃ©es officielles de <strong>Bank Al-Maghrib</strong> et de l'<strong>Office des Changes</strong>.
          Nos partenariats acadÃ©miques et professionnels nous permettent de proposer une vision complÃ¨te
          de la gestion du risque de change au Maroc. Si vous Ãªtes une institution et souhaitez
          un partenariat, contactez-nous.
        </p>
      </div>

      {PARTNERS.map((cat) => {
        const Icon = cat.icon;
        return (
          <div key={cat.category} className="bg-navy-900 border border-navy-700 rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Icon size={14} className={cat.color} /> {cat.category}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {cat.items.map((p) => (
                <a
                  key={p.name}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-navy-950 border border-navy-800 rounded-lg p-3 hover:border-gold-500/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-[12px] font-bold text-slate-200">{p.name}</h3>
                    <ExternalLink size={10} className="text-slate-500 flex-shrink-0" />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">{p.desc}</p>
                </a>
              ))}
            </div>
          </div>
        );
      })}

      <div className="bg-navy-900 border border-gold-700/40 rounded-2xl p-5 text-center">
        <p className="text-[12px] text-slate-300 mb-2">Votre institution souhaite figurer ici ?</p>
        <a
          href="mailto:partenariats@jad2advisory.com"
          className="text-[12px] text-gold-400 hover:text-gold-300 font-bold"
        >
          partenariats@jad2advisory.com â†’
        </a>
      </div>
    </div>
  );
}
