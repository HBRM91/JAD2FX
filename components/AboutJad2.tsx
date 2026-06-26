import React from 'react';
import { Shield, BookOpen, BarChart2, Scale, ExternalLink } from 'lucide-react';
import ContactForm from './ContactForm';
import Jad2Logo from './Jad2Logo';

export default function AboutJad2() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="bg-navy-900 border border-navy-700 rounded-2xl overflow-hidden">
        <div className="h-0.5 bg-gradient-to-r from-gold-700 via-gold-400 to-gold-700" />
        <div className="p-8 flex flex-col sm:flex-row items-start gap-6">
          <Jad2Logo width={100} showAdvisory={true} />
          <div className="border-t sm:border-t-0 sm:border-l border-navy-700 pt-4 sm:pt-0 sm:pl-6">
            <h1 className="text-2xl font-serif font-bold text-white mb-1">JAD2 Advisory</h1>
            <p className="text-[11px] text-gold-500 tracking-widest uppercase">
              Cabinet de Conseil en Management · Casablanca, Maroc
            </p>
            <p className="text-sm text-slate-400 mt-3 leading-relaxed">
              JAD2 Advisory accompagne les entreprises marocaines et les opérateurs
              internationaux dans leur compréhension des dynamiques de change MAD, de la
              réglementation Office des Changes, et des enjeux de transformation digitale
              liés aux flux de paiement transfrontaliers.
            </p>
          </div>
        </div>
      </div>

      {/* ── Non-licensed status — regulatory clarity ── */}
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <Shield size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1.5">
              Statut Réglementaire — Information Obligatoire
            </p>
            <p className="text-[12px] text-amber-300/80 leading-relaxed">
              JAD2 Advisory est un <strong className="text-amber-200">cabinet de conseil en management</strong>,
              enregistré au Registre de Commerce de Casablanca. JAD2 Advisory <strong className="text-amber-200">n'est pas un
              établissement financier agréé</strong> par Bank Al-Maghrib (BAM), ni un prestataire de services
              d'investissement au sens de la <strong className="text-amber-200">Loi n° 43-12 et du Dahir n° 1-13-21</strong>.
              Ses prestations couvrent exclusivement le conseil en management, la formation, et
              l'accompagnement stratégique — sans exécution de transactions de change ni gestion d'actifs.
            </p>
            <p className="text-[11px] text-amber-500/70 mt-2">
              Pour toute opération de change, adressez-vous à un établissement de crédit agréé par Bank Al-Maghrib.
            </p>
          </div>
        </div>
      </div>

      {/* ── Services ── */}
      <div className="bg-navy-900 border border-navy-700 rounded-2xl p-6">
        <h2 className="text-[11px] font-bold text-white uppercase tracking-widest mb-4">Domaines d'Intervention</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              icon: BarChart2,
              color: 'text-gold-400',
              bg: 'bg-gold-500/10 border-gold-500/25',
              title: 'Stratégie de Change & Trésorerie',
              body: 'Accompagnement des trésoriers d\'entreprise dans la lecture des dynamiques de change MAD, la compréhension des instruments de couverture disponibles et la politique de gestion du risque de change conforme à l\'OC.',
            },
            {
              icon: Scale,
              color: 'text-blue-400',
              bg: 'bg-blue-500/10 border-blue-500/25',
              title: 'Réglementation Office des Changes',
              body: 'Audit de conformité des pratiques import/export au regard des circulaires OC et de l\'IGOC 2024. Accompagnement documentaire pour CPEC, CDE, domiciliations et déclarations.',
            },
            {
              icon: BookOpen,
              color: 'text-emerald-400',
              bg: 'bg-emerald-500/10 border-emerald-500/25',
              title: 'Formation & Transfert de Compétences',
              body: 'Programmes de formation sur-mesure pour les équipes financières : mécanique des changes, lecture des fixing BKAM, calcul des forward points CIP, gestion de l\'exposition devises.',
            },
            {
              icon: ExternalLink,
              color: 'text-purple-400',
              bg: 'bg-purple-500/10 border-purple-500/25',
              title: 'Corridor Maroc–Europe pour Fintechs',
              body: 'Conseil stratégique pour les opérateurs de paiement et fintechs européens en phase d\'entrée sur le marché marocain : roadmap réglementaire, identification de partenaires bancaires locaux, cadrage technique.',
            },
          ].map(s => (
            <div key={s.title} className={`border rounded-xl p-4 ${s.bg}`}>
              <div className="flex items-center gap-2.5 mb-2">
                <s.icon size={14} className={s.color} />
                <p className="text-[11px] font-bold text-white">{s.title}</p>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── JAD2FX methodology ── */}
      <div className="bg-navy-900 border border-navy-700 rounded-2xl p-6">
        <h2 className="text-[11px] font-bold text-white uppercase tracking-widest mb-4">Méthodologie JAD2FX</h2>
        <div className="space-y-3 text-[12px] text-slate-400 leading-relaxed">
          <p>
            <strong className="text-slate-200">Sources de données :</strong> JAD2FX s'appuie sur les données
            officielles de Bank Al-Maghrib (CoursVirement, CoursBBE via API officielle), les taux de référence
            BCE/Frankfurter pour les cross-rates EUR/USD, et des modèles analytiques propriétaires pour le calcul
            de la dérive du panier et l'interpolation de la courbe BDT/MONIA.
          </p>
          <p>
            <strong className="text-slate-200">Processus éditorial :</strong> Le Morning Briefing quotidien est
            généré via des workflows assistés par IA (Groq / Gemini) à partir de données officielles BKAM et d'une
            veille web automatisée. Toutes les analyses sont strictement indicatives et à vocation pédagogique.
          </p>
          <p>
            <strong className="text-slate-200">Cadence de publication :</strong> Morning Briefing quotidien à
            09h00 Casablanca (jours ouvrés) · Research Hub hebdomadaire · Drift Model : temps réel (cron 08h00 UTC).
          </p>
          <p>
            <strong className="text-slate-200">Conformité données personnelles :</strong> Collecte de données
            personnelles soumise à la Loi marocaine 09-08 (CNDP). Les données collectées via les formulaires
            JAD2FX sont traitées exclusivement à des fins de communication commerciale informative et de mise en
            relation. Durée de conservation : 24 mois. Droit de retrait : contact@jad2advisory.com.
          </p>
        </div>
      </div>

      {/* ── Contact ── */}
      <div className="bg-navy-900 border border-navy-700 rounded-2xl p-6">
        <h2 className="text-[11px] font-bold text-white uppercase tracking-widest mb-4">Contact</h2>
        <ContactForm />
      </div>

    </div>
  );
}
