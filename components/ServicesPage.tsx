/**
 * P3.15 — Services & Pricing page.
 * 4 advisory service offerings with clear pricing, scope, and CTAs.
 */

import { GraduationCap, FileCheck, Building, Cog, Check, ArrowRight, Star } from 'lucide-react';

interface ServiceTier {
  icon: any;
  name: string;
  tagline: string;
  price: string;
  priceUnit: string;
  badge?: 'POPULAR' | 'BEST VALUE';
  description: string;
  features: string[];
  cta: string;
  ctaAction: 'TRAINING' | 'AUDIT' | 'CONSULTING' | 'AUTOMATION';
  popularColor: string;
}

const SERVICES: ServiceTier[] = [
  {
    icon: GraduationCap,
    name: 'Formation Équipe Finance',
    tagline: 'Montez en compétence votre équipe sur le risque de change',
    price: '12 000',
    priceUnit: 'MAD / jour · groupe de 5 max',
    badge: 'POPULAR',
    description: 'Programme intensif de 1 à 3 jours sur la gestion du risque de change:.forward CIP, options, conventions OC, cas pratiques sur vos chiffres.',
    features: [
      '1-3 jours sur site ou visio (Casablanca, Tanger, Paris)',
      'Groupe de 5 personnes max (DAF, trésorier, ADV, compta, DG)',
      'Manuel pédagogique 80p + accès JAD2FX Pro 6 mois inclus',
      'Cas pratiques sur VOS chiffres (imports, exports, devis)',
      'Attestation de formation',
      'Suivi 30j post-formation par email',
    ],
    cta: 'Demander un devis formation',
    ctaAction: 'TRAINING',
    popularColor: 'border-gold-500',
  },
  {
    icon: FileCheck,
    name: 'Audit Exposition FX',
    tagline: 'Diagnostic complet de votre exposition + plan d\'action',
    price: '35 000',
    priceUnit: 'MAD · forfait · 2 semaines',
    badge: 'BEST VALUE',
    description: 'Audit approfondi de votre exposition au change (commerciale, économique, bilan). Identification des économies. Plan d\'action priorisé. Conformité Circ. 01/2024.',
    features: [
      'Cartographie complète des expositions (Bilan + Résultat)',
      'Revue de la politique de couverture existante',
      'Benchmark vs pratique de marché (4 banques)',
      'Conformité Circ. OC 01/2024 — scoring détaillé',
      'Plan d\'action priorisé (quick wins + chantier 6 mois)',
      'Rapport 40p + restitution DAF + DG',
      'Suivi 90j post-audit (2 calls de 1h)',
    ],
    cta: 'Demander un audit',
    ctaAction: 'AUDIT',
    popularColor: 'border-emerald-500',
  },
  {
    icon: Building,
    name: 'Conseil Stratégique & Couverture',
    tagline: 'Accompagnement mensuel de votre trésorerie',
    price: '25 000',
    priceUnit: 'MAD / mois · engagement 6 mois',
    description: 'Conseil mensuel: revue couverture, CODIR FX, validation des décisions de change. Accès illimité à JAD2FX Pro + ligne directe avec un expert.',
    features: [
      'Revue mensuelle de la politique de couverture (2h visio)',
      'Validation des décisions de change (forward roll, dénouement)',
      'Préparation CODIR FX (slides + scénario stress test)',
      'Accès JAD2FX Pro (toutes fonctionnalités, sans limite)',
      'Veille réglementaire OC (mensuelle)',
      'Ligne directe WhatsApp avec expert FX',
      'Bilan semestriel + recommandations',
    ],
    cta: 'Demander un entretien',
    ctaAction: 'CONSULTING',
    popularColor: 'border-blue-500',
  },
  {
    icon: Cog,
    name: 'Automatisation Couverture',
    tagline: 'Robo-hedging API + intégration ERP',
    price: 'Sur devis',
    priceUnit: 'à partir de 80 000 MAD',
    description: 'Mise en place d\'un système de couverture automatisée via API JAD2FX. Connexion à votre ERP (SAP, Sage, Odoo). Stratégie de couverture configurable, alertes temps réel.',
    features: [
      'Connexion API JAD2FX Pro (10k req/jour)',
      'Intégration ERP (SAP, Sage, Odoo, Dynamics)',
      'Stratégie de couverture configurable (forward roll, layered, etc.)',
      'Alertes temps réel (slack, teams, sms)',
      'Reporting automatisé (PDF/Excel quotidien)',
      'Formation des trésoriers (8h)',
      'Maintenance 12 mois incluse',
    ],
    cta: 'Demander un devis',
    ctaAction: 'AUTOMATION',
    popularColor: 'border-purple-500',
  },
];

export default function ServicesPage() {
  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div className="text-center">
        <h1 className="text-2xl font-serif font-bold text-white mb-2">Services JAD2 Advisory</h1>
        <p className="text-[13px] text-slate-400 max-w-2xl mx-auto">
          Cabinet de conseil stratégique et de formation en gestion du risque de change, basé à Casablanca.
          Partenaire des trésoriers marocains depuis 2020. 4 services adaptés à votre maturité FX.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SERVICES.map((s) => {
          const Icon = s.icon;
          return (
            <article
              key={s.name}
              className={`bg-navy-900 border-2 ${s.popularColor} rounded-2xl p-5 relative overflow-hidden`}
            >
              {s.badge && (
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 bg-gold-500 text-navy-950 rounded-full">
                  <Star size={9} className="fill-navy-950" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">{s.badge}</span>
                </div>
              )}
              <div className="w-12 h-12 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center mb-3">
                <Icon size={20} className="text-gold-400" />
              </div>
              <h2 className="text-lg font-serif font-bold text-white mb-1">{s.name}</h2>
              <p className="text-[11px] text-slate-400 leading-snug mb-3 italic">{s.tagline}</p>
              <p className="text-[12px] text-slate-300 leading-relaxed mb-3">{s.description}</p>

              <div className="border-t border-navy-800 pt-3 mb-3">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Tarif</p>
                <p className="text-base font-bold text-white">
                  {s.price.startsWith('Sur') ? (
                    <span>{s.price}</span>
                  ) : (
                    <>
                      <span className="font-mono text-gold-400">{s.price}</span>{' '}
                      <span className="text-[11px] text-slate-400 font-normal">MAD</span>
                    </>
                  )}
                </p>
                <p className="text-[10px] text-slate-500">{s.priceUnit}</p>
              </div>

              <ul className="space-y-1.5 mb-4">
                {s.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11.5px] text-slate-300">
                    <Check size={12} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gold-500 text-navy-950 text-sm font-bold rounded-lg hover:bg-gold-400 transition-colors">
                {s.cta} <ArrowRight size={13} />
              </button>
            </article>
          );
        })}
      </div>

      <div className="bg-navy-900/50 border border-navy-800 rounded-2xl p-5 text-center">
        <p className="text-[12px] text-slate-400 mb-2">
          Tous les tarifs sont HT. Déplacement international sur devis.
          Nos clients corporate ont accès à JAD2FX Pro (10 000 req/jour) inclus dans les forfaits Conseil & Automatisation.
        </p>
        <p className="text-[11px] text-slate-500">
          Besoin d'un tarif sur mesure ? <a href="mailto:contact@jad2advisory.com" className="text-gold-400 hover:underline">contact@jad2advisory.com</a>
        </p>
      </div>
    </div>
  );
}
