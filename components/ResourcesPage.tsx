import React, { useState } from 'react';
import { ExternalLink, ChevronDown, ChevronUp, Shield, Globe, TrendingUp, BookOpen, Building2 } from 'lucide-react';
import { BKAM_LINKS } from '../constants/bkamLinks';

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Types Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

interface ResourceLink {
  name: string;
  url: string;
  desc: string;
  tag?: string;
}

interface ResourceSection {
  id: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  title: string;
  subtitle: string;
  links: ResourceLink[];
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Data Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

const SECTIONS: ResourceSection[] = [
  {
    id: 'authorities',
    icon: Shield,
    color: 'text-red-400',
    bgColor: 'bg-red-500/8',
    borderColor: 'border-red-500/20',
    title: 'AutoritÃƒÂ©s de RÃƒÂ©gulation Marocaines',
    subtitle: 'Sources officielles Ã¢â‚¬â€ rÃƒÂ©glementation & fixings',
    links: [
      { name: 'Bank Al-Maghrib (BKAM)', url: BKAM_LINKS.mainSite, desc: 'Banque centrale. Fixing officiel, politique monÃƒÂ©taire, circulaires, statistiques.', tag: 'Officiel' },
      { name: 'Office des Changes (OC)', url: 'https://www.oc.gov.ma', desc: 'RÃƒÂ©glementation des changes, circulaires, instructions, statistiques des flux.', tag: 'Officiel' },
      { name: 'AMMC', url: 'https://www.ammc.ma', desc: 'AutoritÃƒÂ© Marocaine du MarchÃƒÂ© des Capitaux Ã¢â‚¬â€ marchÃƒÂ©s financiers, OPCVM, OPCI.', tag: 'Officiel' },
      { name: 'Bourse de Casablanca', url: 'https://www.casablanca-bourse.com', desc: 'MarchÃƒÂ© des actions et obligations au Maroc Ã¢â‚¬â€ cotations et rapports.', tag: 'MarchÃƒÂ©' },
    ],
  },
  {
    id: 'international',
    icon: Globe,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/8',
    borderColor: 'border-blue-500/20',
    title: 'Institutions Internationales',
    subtitle: 'DonnÃƒÂ©es macro-ÃƒÂ©conomiques & recherche mondiale',
    links: [
      { name: 'FMI Ã¢â‚¬â€ Maroc', url: 'https://www.imf.org/en/Countries/MAR', desc: 'Article IV, revue du PLL (Precautionary Liquidity Line), rapports WEO pour le Maroc.', tag: 'Macro' },
      { name: 'Banque Mondiale Ã¢â‚¬â€ Maroc', url: 'https://www.worldbank.org/en/country/morocco', desc: 'Indicateurs macro, rapports de dÃƒÂ©veloppement, statistiques balance des paiements.', tag: 'Macro' },
      { name: 'Banque des RÃƒÂ¨glements Internationaux (BRI)', url: 'https://www.bis.org', desc: 'Standards BÃƒÂ¢le III/IV, triennial FX survey, taux directeurs mondiaux.', tag: 'RÃƒÂ©glementation' },
      { name: 'Banque Centrale EuropÃƒÂ©enne (BCE)', url: 'https://www.ecb.europa.eu', desc: 'DÃƒÂ©cisions de politique monÃƒÂ©taire Ã¢â‚¬â€ EUR est ÃƒÂ  60% du panier MAD.', tag: 'Banque centrale' },
      { name: 'RÃƒÂ©serve FÃƒÂ©dÃƒÂ©rale amÃƒÂ©ricaine (Fed)', url: 'https://www.federalreserve.gov', desc: 'FOMC minutes, dot plot, politique taux Ã¢â‚¬â€ USD ÃƒÂ  40% du panier MAD.', tag: 'Banque centrale' },
      { name: 'Banque de France', url: 'https://www.banque-france.fr', desc: 'Ãƒâ€°tudes zone euro, relations bilatÃƒÂ©rales franco-marocaines, statistiques BAFrance.', tag: 'Recherche' },
    ],
  },
  {
    id: 'data',
    icon: TrendingUp,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/8',
    borderColor: 'border-emerald-500/20',
    title: 'DonnÃƒÂ©es de MarchÃƒÂ© & Terminaux',
    subtitle: 'RÃƒÂ©fÃƒÂ©rentiels de cotation & flux de donnÃƒÂ©es',
    links: [
      { name: 'Bloomberg', url: 'https://www.bloomberg.com/markets/currencies', desc: 'Terminal de rÃƒÂ©fÃƒÂ©rence mondial. Cotations FX, taux, matiÃƒÂ¨res premiÃƒÂ¨res.', tag: 'Terminal' },
      { name: 'Reuters / LSEG', url: 'https://www.lseg.com/en/data-analytics', desc: 'Plateforme LSEG Eikon Ã¢â‚¬â€ flux temps rÃƒÂ©el, analytics, actualitÃƒÂ© financiÃƒÂ¨re.', tag: 'Terminal' },
      { name: 'Investing.com Ã¢â‚¬â€ MAD', url: 'https://fr.investing.com/currencies/usd-mad', desc: 'Cotations accessibles USD/MAD, EUR/MAD, graphiques, calendrier ÃƒÂ©conomique.', tag: 'Open' },
      { name: 'Xe.com', url: 'https://www.xe.com/currencyconverter/convert/?From=EUR&To=MAD', desc: 'Convertisseur EUR/MAD, USD/MAD en temps rÃƒÂ©el. Usage grand public.', tag: 'Open' },
      { name: 'Macrotrends Ã¢â‚¬â€ Maroc', url: 'https://www.macrotrends.net/countries/MAR/morocco/exchange-rate-historical-chart', desc: 'Historique long-terme des taux de change MAD. SÃƒÂ©ries temporelles 1993Ã¢â‚¬â€œprÃƒÂ©sent.', tag: 'Historique' },
    ],
  },
  {
    id: 'moroccan-banks',
    icon: Building2,
    color: 'text-gold-400',
    bgColor: 'bg-gold-500/8',
    borderColor: 'border-gold-500/20',
    title: 'Banques Marocaines Ã¢â‚¬â€ Services Change',
    subtitle: 'Ãƒâ€°tablissements habilitÃƒÂ©s ÃƒÂ  exÃƒÂ©cuter les opÃƒÂ©rations de change',
    links: [
      { name: 'Attijariwafa Bank', url: 'https://www.attijariwafabank.com', desc: 'PremiÃƒÂ¨re banque marocaine. Services change corporate, salle des marchÃƒÂ©s, produits de couverture.', tag: 'SBIC' },
      { name: 'CIH Bank', url: 'https://www.cihbank.ma', desc: 'Banque digitale marocaine. Virements internationaux, change au comptant.', tag: 'SBIC' },
      { name: 'BMCE Bank (Bank of Africa)', url: 'https://www.bankofafrica.ma', desc: 'RÃƒÂ©seau panafricain. Trade finance, change corporate, opÃƒÂ©rations import/export.', tag: 'SBIC' },
      { name: 'Banque Populaire', url: 'https://www.gbp.ma', desc: 'Banque des MRE. Change billets, virements diaspora, comptes devises.', tag: 'SBIC' },
      { name: 'BMCI (BNP Paribas Maroc)', url: 'https://www.bmci.ma', desc: 'Filiale BNP Paribas. Expertise produits dÃƒÂ©rivÃƒÂ©s, couverture change, trÃƒÂ©sorerie corporate.', tag: 'SBIC' },
    ],
  },
  {
    id: 'academic',
    icon: BookOpen,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/8',
    borderColor: 'border-purple-500/20',
    title: 'Recherche AcadÃƒÂ©mique & Formation',
    subtitle: 'Publications scientifiques et ressources pÃƒÂ©dagogiques',
    links: [
      { name: 'SSRN Ã¢â‚¬â€ FX Research Maroc', url: 'https://www.ssrn.com/index.cfm/en/', desc: 'Recherches acadÃƒÂ©miques sur les marchÃƒÂ©s de change, modÃƒÂ¨les de paritÃƒÂ©, gestion du risque.', tag: 'AcadÃƒÂ©mique' },
      { name: 'HEC Paris Ã¢â‚¬â€ Finance Executive', url: 'https://www.hec.edu/fr/executive-education', desc: 'Formation continue finance internationale, marchÃƒÂ©s de capitaux, trÃƒÂ©sorerie.', tag: 'Formation' },
      { name: 'ISCAE Casablanca', url: 'https://www.iscae.ac.ma', desc: 'Institut SupÃƒÂ©rieur de Commerce. Formation gestion financiÃƒÂ¨re, risk management.', tag: 'Formation' },
      { name: 'ENCG Maroc', url: 'https://www.encg.ac.ma', desc: 'Ãƒâ€°coles Nationales de Commerce et Gestion. Finance d\'entreprise, change.', tag: 'Formation' },
      { name: 'CFA Institute', url: 'https://www.cfainstitute.org', desc: 'Certification internationale en analyse financiÃƒÂ¨re. Standards GIPS, ÃƒÂ©thique.', tag: 'Certification' },
    ],
  },
];

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Component Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

export default function ResourcesPage() {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['authorities', 'international']));

  function toggle(id: string) {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="bg-navy-900 border border-navy-800 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-gold-500/10 border border-gold-500/20 flex items-center justify-center flex-shrink-0">
            <Globe size={18} className="text-gold-400" />
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-white uppercase tracking-[0.12em] mb-1">
              RÃƒÂ©pertoire Institutionnel
            </h2>
            <p className="text-[12px] text-navy-400 leading-relaxed max-w-2xl">
              Sources de rÃƒÂ©fÃƒÂ©rence pour les professionnels de la trÃƒÂ©sorerie et du risque de change au Maroc.
              Ces liens pointent vers des organismes officiels, des terminaux de marchÃƒÂ© et des institutions acadÃƒÂ©miques.
            </p>
            <div className="mt-3 flex items-center gap-2 bg-amber-500/5 border border-amber-500/15 rounded-lg px-3 py-2">
              <Shield size={11} className="text-amber-400 flex-shrink-0" />
              <p className="text-[10px] text-amber-400/80 leading-relaxed">
                JAD2 Advisory est un cabinet de conseil stratÃƒÂ©gique et de formation en gestion du risque de change.
                Il ne fournit pas de conseil en investissement et n'exÃƒÂ©cute aucune transaction de change. Pour vos opÃƒÂ©rations, adressez-vous ÃƒÂ  un ÃƒÂ©tablissement de crÃƒÂ©dit habilitÃƒÂ©.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sections */}
      {SECTIONS.map(section => {
        const isOpen = openSections.has(section.id);
        const Icon = section.icon;
        return (
          <div key={section.id} className="bg-navy-900 border border-navy-800 rounded-xl overflow-hidden">
            <button
              onClick={() => toggle(section.id)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-navy-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg ${section.bgColor} border ${section.borderColor} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={15} className={section.color} />
                </div>
                <div className="text-left">
                  <p className="text-[12px] font-bold text-white">{section.title}</p>
                  <p className="text-[10px] text-navy-500">{section.subtitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-navy-600 font-mono">{section.links.length} liens</span>
                {isOpen ? (
                  <ChevronUp size={14} className="text-navy-500" />
                ) : (
                  <ChevronDown size={14} className="text-navy-500" />
                )}
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-navy-800 divide-y divide-navy-800/60">
                {section.links.map(link => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start justify-between gap-4 px-5 py-3.5 hover:bg-navy-800/40 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[12px] font-semibold text-slate-200 group-hover:text-gold-400 transition-colors truncate">
                          {link.name}
                        </span>
                        {link.tag && (
                          <span className="flex-shrink-0 text-[9px] font-bold uppercase tracking-wider bg-navy-800 border border-navy-700 text-navy-400 px-1.5 py-0.5 rounded">
                            {link.tag}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-navy-400 leading-relaxed">{link.desc}</p>
                    </div>
                    <ExternalLink size={12} className="text-navy-600 group-hover:text-gold-500 flex-shrink-0 mt-0.5 transition-colors" />
                  </a>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Footer note */}
      <div className="text-center py-4">
        <p className="text-[10px] text-navy-600">
          Liens ÃƒÂ  titre informatif Ã‚Â· JAD2FX ne garantit pas l'exactitude des donnÃƒÂ©es tierces Ã‚Â·{' '}
          <a href="https://jad2advisory.com" target="_blank" rel="noopener noreferrer" className="text-gold-600 hover:text-gold-500">
            jad2advisory.com
          </a>
        </p>
      </div>
    </div>
  );
}
