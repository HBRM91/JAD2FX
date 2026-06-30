import React, { useState, useMemo } from 'react';
import {
  Eye, Scale, TrendingUp, BarChart2, BookOpen, Clock, Zap,
  ChevronDown, ChevronUp, Search, Mail, MessageSquare,
} from 'lucide-react';
import { ViewState } from '../types';
import { useAdmin } from '../context/AdminContext';
// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface Article {
  id: string;
  title: string;
  excerpt: string;
  readTime: string;
  date: string;
  tags: string[];
}

type ContentTier = 'STRATEGIC' | 'REGULATORY' | 'TACTICAL' | 'TOOL';

const TIER_META: Record<ContentTier, { label: string; style: string }> = {
  STRATEGIC:  { label: 'Brief Stratégique', style: 'bg-red-500/15 text-red-400 border-red-500/30' },
  REGULATORY: { label: 'Alerte Régl.',      style: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  TACTICAL:   { label: 'Tactique',           style: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  TOOL:       { label: 'Outil',              style: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
};

interface Pillar {
  id: string;
  name: string;
  tier: ContentTier;
  icon: React.ElementType;
  color: string;
  border: string;
  bg: string;
  badgeColor: string;
  articles: Article[];
  ctaLabel: string;
  ctaType: 'newsletter' | 'contact' | 'nav';
  ctaNav?: ViewState;
  disclaimerLevel: 'short' | 'standard' | 'long';
}

// â”€â”€â”€ Disclaimer texts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const DISCLAIMERS = {
  short:
    'JAD2FX est un outil pédagogique. Données à titre informatif. JAD2 Advisory n\'est pas habilitée à fournir des services d\'investissement.',
  standard:
    'Cette publication est strictement informative et pédagogique. Elle ne constitue pas un conseil en investissement, ni une recommandation d\'achat, de vente ou de couverture. JAD2 Advisory est enregistrée sous déclaration simplifiée. Les décisions de change relèvent de la seule responsabilité de l\'entreprise et de ses conseillers bancaires agréés BAM.',
  long:
    'Cet outil est fourni à titre pédagogique et ne constitue pas un conseil en investissement, en gestion de portefeuille, ou en trésorerie. Les résultats dépendent des hypothèses saisies par l\'utilisateur. JAD2 Advisory décline toute responsabilité quant aux décisions prises sur la base de cet outil. Pour toute opération de change, adressez-vous à un établissement de crédit agréé par Bank Al-Maghrib.',
};

// â”€â”€â”€ Pillar data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const PILLARS: Pillar[] = [
  // â”€â”€ Pillar 1 â€” BAM Watch â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    id: 'bam-watch',
    name: 'BAM Watch',
    tier: 'STRATEGIC' as ContentTier,
    icon: Eye,
    color: 'text-gold-400',
    border: 'border-gold-700/40',
    bg: 'bg-gold-500/8',
    badgeColor: 'text-gold-400 bg-gold-500/10 border-gold-500/25',
    ctaLabel: 'Recevoir l\'alerte BKAM quotidienne',
    ctaType: 'newsletter',
    disclaimerLevel: 'short',
    articles: [
      {
        id: 'bam-1',
        title: 'Le mécanisme de fixing du dirham : séance MIC de 11h30 et publication officielle',
        excerpt:
          'Bank Al-Maghrib publie chaque jour ouvré à 12h30 les cours officiels de référence issus de la séance du Marché Interbancaire des Changes (MIC) ouverte à 11h30. Ces taux â€” dits "cours virements" â€” constituent le référentiel légal pour toutes les opérations de change au Maroc. Le taux central résulte de l\'équilibre offre/demande dans le corridor de ±5% autour de la parité panier théorique K=10,49. Hors séance, BKAM peut intervenir discrétionnairement pour stabiliser le cours.',
        readTime: '3 min',
        date: 'Juin 2026',
        tags: ['BKAM', 'MIC', 'fixing', 'dirham'],
      },
      {
        id: 'bam-2',
        title: 'Comparatif régional : MAD, TND, EGP, TRY â€” quatre ancrages, quatre trajectoires',
        excerpt:
          'La comparaison des régimes de change régionaux éclaire la spécificité marocaine. Le dinar tunisien (TND) flotte librement depuis 2016, générant une volatilité structurelle supérieure. La livre égyptienne (EGP) a subi deux dévaluations significatives (2016, 2022) liées au manque de réserves. La livre turque (TRY) reflète une politique monétaire sous contrainte politique. Le dirham marocain, ancré à un panier EUR/USD supervisé par BKAM, affiche la volatilité la plus faible de la région â€” un avantage structurel pour la planification de trésorerie.',
        readTime: '4 min',
        date: 'Juin 2026',
        tags: ['MAD', 'TND', 'EGP', 'TRY', 'comparatif'],
      },
    ],
  },

  // â”€â”€ Pillar 2 â€” Réglementaire & Office des Changes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    id: 'reglementaire',
    name: 'Réglementaire & OC',
    tier: 'REGULATORY' as ContentTier,
    icon: Scale,
    color: 'text-blue-400',
    border: 'border-blue-700/40',
    bg: 'bg-blue-500/8',
    badgeColor: 'text-blue-400 bg-blue-500/10 border-blue-500/25',
    ctaLabel: 'Télécharger le guide de conformité OC',
    ctaType: 'contact',
    disclaimerLevel: 'standard',
    articles: [
      {
        id: 'oc-1',
        title: 'Seuils de déclaration 2026 : tableau complet des obligations OC pour les entreprises',
        excerpt:
          'L\'Office des Changes impose des obligations déclaratives différenciées selon le montant et la nature des opérations. Les importations supérieures à 100 000 MAD requièrent une domiciliation bancaire préalable. Les exportations de services sont soumises à un rapatriement dans les 60 jours suivant l\'encaissement. Les transferts de dividendes à des actionnaires étrangers sont libres pour les investissements régulièrement constitués (visa de change obtenu à l\'entrée). JAD2FX compile ces seuils à titre informatif â€” consultez l\'Office des Changes pour toute interprétation.',
        readTime: '5 min',
        date: 'Juin 2026',
        tags: ['OC', 'déclaration', 'seuils', 'conformité'],
      },
      {
        id: 'oc-2',
        title: 'CPEC & CDE 2026 : conditions d\'ouverture et utilisation des comptes en devises',
        excerpt:
          'Le Compte Professionnel en Devises (CPEC) est accessible aux exportateurs ayant réalisé plus de 5 millions MAD de recettes en devises sur l\'exercice précédent. Il permet de conserver jusqu\'à 70% des recettes d\'exportation rapatriées et de les utiliser pour régler importations, frais de mission et dividendes. Le plafond de solde est limité à 6 mois de recettes d\'exportation. Le Compte en Devises Étranger (CDE) suit des règles distinctes pour les non-résidents. Source : Instruction OC n°01/2020.',
        readTime: '4 min',
        date: 'Juin 2026',
        tags: ['CPEC', 'CDE', 'comptes devises', 'exportateurs'],
      },
      {
        id: 'oc-3',
        title: 'Compliance OC : checklist trimestrielle pour les PME exportatrices',
        excerpt:
          'Les obligations trimestrielles de conformité couvrent : (1) déclaration des encaissements d\'exportation dans les délais impartis (150 jours pour les biens, 60 jours pour les services), (2) cession obligatoire de 30% des recettes en devises, (3) mise à jour des domiciliations bancaires pour les importations récurrentes, (4) rapport d\'activité CPEC si applicable. La non-conformité expose l\'entreprise à des pénalités de 5% par mois de retard sur les montants non rapatriés. Source : OC / IGOC 2024.',
        readTime: '4 min',
        date: 'Juin 2026',
        tags: ['PME', 'checklist', 'trimestriel', 'IGOC'],
      },
    ],
  },

  // â”€â”€ Pillar 3 â€” Macro & Monétaire â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    id: 'macro',
    name: 'Macro & Monétaire',
    tier: 'STRATEGIC' as ContentTier,
    icon: TrendingUp,
    color: 'text-emerald-400',
    border: 'border-emerald-700/40',
    bg: 'bg-emerald-500/8',
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
    ctaLabel: 'Recevoir le Macro Brief hebdomadaire',
    ctaType: 'newsletter',
    disclaimerLevel: 'standard',
    articles: [
      {
        id: 'macro-1',
        title: 'Le régime de change marocain : comprendre le flottement administré en 5 points clés',
        excerpt:
          'Le dirham marocain opère sous un régime de "flottement administré" depuis janvier 2018 (Phase I : bande ±2,5%) élargi à ±5% en mars 2020 (Phase II). Ce régime combine la prévisibilité d\'un ancrage (panier 60% EUR / 40% USD) et la flexibilité d\'une bande d\'absorption des chocs. BKAM intervient discrétionnairement sur le Marché Interbancaire des Changes pour maintenir le cours dans le corridor. Les réserves officielles â€” à 6 mois d\'importations â€” constituent le capital d\'intervention. La Phase III (bande élargie) est conditionnée à l\'inflation < 2% et aux réserves > 5 mois.',
        readTime: '5 min',
        date: 'Juin 2026',
        tags: ['régime', 'flottement', 'bandes', 'BKAM', 'Phase II'],
      },
      {
        id: 'macro-2',
        title: 'Les trois moteurs du MAD : BCE, Fed, et la balance des paiements marocaine',
        excerpt:
          'La valeur du dirham résulte de l\'interaction de trois forces : (1) la politique monétaire de la BCE (60% du panier â€” chaque hausse BCE apprécie mécaniquement le MAD si EUR/USD monte), (2) la Fed (40% du panier â€” un USD fort compresse le MAD via le mécanisme inverse), (3) la balance des paiements marocaine (exportations OCP + phosphates en USD, remises MRE en EUR, facture pétrolière en USD). La position nette en devises du Maroc â€” structurellement déficitaire sur les importations énergétiques â€” crée une pression de dépréciation endémique partiellement compensée par les MRE (9+ Mds EUR/an).',
        readTime: '5 min',
        date: 'Juin 2026',
        tags: ['BCE', 'Fed', 'balance paiements', 'MRE', 'OCP'],
      },
      {
        id: 'macro-3',
        title: 'Inflation et taux directeur BKAM : le triangle de politique monétaire marocain',
        excerpt:
          'Bank Al-Maghrib opère avec un double mandat implicite : stabilité des prix (cible d\'inflation ~2%) et soutien à la croissance. Le taux directeur actuel (2,75% en 2025) reflète un cycle de relâchement monétaire initié après le choc inflationniste post-COVID. La transmission à l\'économie réelle passe par les taux interbancaires (MONIA) et les spreads bancaires sur crédits. Pour les trésoriers, le taux directeur BKAM constitue le plancher théorique pour le calcul des points de swap MAD dans les opérations de change à terme.',
        readTime: '4 min',
        date: 'Juin 2026',
        tags: ['inflation', 'taux directeur', 'MONIA', 'politique monétaire'],
      },
    ],
  },

  // â”€â”€ Pillar 4 â€” Profils Sectoriels FX â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    id: 'sectoriel',
    name: 'Profils Sectoriels FX',
    tier: 'TACTICAL' as ContentTier,
    icon: BarChart2,
    color: 'text-purple-400',
    border: 'border-purple-700/40',
    bg: 'bg-purple-500/8',
    badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/25',
    ctaLabel: 'Demander une analyse sectorielle',
    ctaType: 'contact',
    disclaimerLevel: 'standard',
    articles: [
      {
        id: 'sec-1',
        title: 'Secteur Automobile â€” Renault, BYD, Stellantis : l\'exposition EUR/JPY/USD des équipementiers marocains',
        excerpt:
          'L\'industrie automobile marocaine (Tanger Med, Kénitra) génère une exposition de change structurellement bi-devises : les composants technologiques européens (moteurs, électronique) sont facturés en EUR, les technologies asiatiques (batteries, semi-conducteurs) en JPY/USD, tandis que les revenus d\'exportation vers l\'UE arrivent en EUR. Les équipementiers de rang 2 et 3 supportent la volatilité EUR/JPY â€” une paire non cotée directement par BKAM mais dérivable via les cross-rates. Une appréciation du JPY de 100 bps renchérit mécaniquement les inputs technologiques.',
        readTime: '5 min',
        date: 'Juin 2026',
        tags: ['automobile', 'EUR/JPY', 'équipementiers', 'Tanger Med'],
      },
      {
        id: 'sec-2',
        title: 'Couronnes nordiques (NOK/SEK/DKK) : l\'exposition méconnue des importateurs de bois et matières premières',
        excerpt:
          'Les importateurs marocains de bois, papier, pâte à papier et équipements industriels scandinaves font face à une exposition NOK/SEK/DKK structurellement sous-couverte. Ces trois devises â€” toutes cotées par BKAM â€” affichent une corrélation EUR de 60-75% mais intègrent une prime spécifique : la NOK est liée au Brent (économie pétrolière norvégienne), créant une double exposition pour les importateurs exposés simultanément aux hydrocarbures. Une appréciation NOK de 200 bps impacte mécaniquement les coûts d\'importation bois-construction, packaging et papier.',
        readTime: '4 min',
        date: 'Juin 2026',
        tags: ['NOK', 'SEK', 'DKK', 'bois', 'matières premières'],
      },
      {
        id: 'sec-3',
        title: 'Secteur Textile & Habillement : cartographie de l\'exposition EUR/USD des importateurs et exportateurs',
        excerpt:
          'L\'industrie textile marocaine présente une exposition bi-monétaire asymétrique : les matières premières (coton en USD, fils synthétiques en EUR) génèrent des besoins en devises, tandis que 65% des exportations finales vers l\'UE arrivent en EUR. Les transformateurs pure-players â€” achetant en EUR et vendant en EUR â€” bénéficient d\'une couverture naturelle partielle. Les importateurs de coton brut (facturé en USD) sans revenus correspondants en USD subissent une exposition nette USD/MAD non compensée. La saisonnalité Q1 (importations) vs Q3 (exportations) crée un décalage temporel qui structure le besoin en liquidité devise.',
        readTime: '5 min',
        date: 'Juin 2026',
        tags: ['textile', 'habillement', 'coton', 'EUR/USD'],
      },
    ],
  },

  // â”€â”€ Pillar 5 â€” Éducation Hedging â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    id: 'hedging',
    name: 'Éducation Hedging',
    tier: 'TOOL' as ContentTier,
    icon: BookOpen,
    color: 'text-amber-400',
    border: 'border-amber-700/40',
    bg: 'bg-amber-500/8',
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/25',
    ctaLabel: 'Accéder au simulateur Forward',
    ctaType: 'nav',
    ctaNav: 'FORWARDS',
    disclaimerLevel: 'long',
    articles: [
      {
        id: 'hedg-1',
        title: 'Le Forward de Change : mécanisme, coût et cadre réglementaire marocain (Circ. OC 01/2024)',
        excerpt:
          'Le contrat à terme de change (forward) permet à une entreprise de fixer aujourd\'hui le taux de change applicable à une date future. Le taux forward résulte de la formule CIP (Covered Interest Parity) : F = S Ã— (1 + r_MAD)^T / (1 + r_Devise)^T. Les points de swap (F - S) reflètent le différentiel de taux d\'intérêt entre le MAD et la devise. En 2026, avec un taux MONIA de ~2,75%, les points forward EUR/MAD à 6 mois sont structurellement positifs (MAD moins cher en terme de taux). La Circulaire OC n°01/2024 autorise les entreprises à utiliser les forwards jusqu\'à 100% de leur exposition commerciale documentée.',
        readTime: '6 min',
        date: 'Juin 2026',
        tags: ['forward', 'CIP', 'points de swap', 'Circ 01/2024'],
      },
      {
        id: 'hedg-2',
        title: 'Swap de change : structure Near/Far legs et utilisation comme outil de trésorerie',
        excerpt:
          'Le swap de change combine deux opérations de sens inverse : une vente (ou achat) au comptant (leg Near) et un rachat (ou revente) à terme (leg Far). Pour un importateur ayant encaissé une remise en EUR mais ne devant payer son fournisseur qu\'à 90 jours, le swap permet de placer les EUR jusqu\'à l\'échéance sans les convertir immédiatement. Les points de swap payés/reçus reflètent le coût de portage du MAD vs. la devise. La Circulaire OC n°01/2024 autorise les swaps aux entreprises résidentes disposant d\'une exposition commerciale documentée. Pour toute opération, contactez votre banque domiciliataire agréée par Bank Al-Maghrib.',
        readTime: '5 min',
        date: 'Juin 2026',
        tags: ['swap', 'Near leg', 'Far leg', 'trésorerie'],
      },
      {
        id: 'hedg-3',
        title: 'Options de change plain vanilla : mécanisme des puts et calls pour les entreprises marocaines',
        excerpt:
          'La Circulaire OC n°01/2024 officialise l\'accès des entreprises marocaines aux options de change vanilla (puts EUR pour les importateurs, calls EUR pour les exportateurs). Une option de change confère le droit â€” et non l\'obligation â€” d\'acheter ou de vendre une devise à un prix fixé (strike). Le coût (prime) dépend de la volatilité implicite EUR/MAD, du tenor et de la moneyness. Contrairement au forward, l\'option préserve la capacité à bénéficier d\'un mouvement favorable. Les options exotiques, binaires et à effet de levier restent interdites. Source : Circ. OC n°01/2024.',
        readTime: '5 min',
        date: 'Juin 2026',
        tags: ['options', 'put', 'call', 'vanilla', 'prime'],
      },
    ],
  },

  // â”€â”€ Pillar 6 â€” Analyse Historique â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    id: 'historique',
    name: 'Analyse Historique',
    tier: 'STRATEGIC' as ContentTier,
    icon: Clock,
    color: 'text-cyan-400',
    border: 'border-cyan-700/40',
    bg: 'bg-cyan-500/8',
    badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/25',
    ctaLabel: 'Recevoir l\'analyse mensuelle',
    ctaType: 'newsletter',
    disclaimerLevel: 'standard',
    articles: [
      {
        id: 'hist-1',
        title: 'Mars 2020 : L\'impact du choc COVID sur EUR/MAD et la réponse de Bank Al-Maghrib',
        excerpt:
          'En mars 2020, la crise COVID a provoqué un choc de liquidité mondial sans précédent. Le EUR/MAD est passé de 10,65 à 11,20 (+5,2%) en 10 jours ouvrés sous l\'effet de la fuite vers les actifs refuges (USD, CHF) et de l\'effondrement des recettes de change marocaines (tourisme, MRE, phosphates). BKAM a déployé ses instruments de stabilisation (interventions directes, swap de liquidité en devises) pour contenir la volatilité dans la bande ±2,5% alors applicable. Les entreprises non couvertes importatrices ont enregistré un impact mécanique de +5% sur leur facture devise â€” une leçon sur la valeur de la visibilité à terme.',
        readTime: '5 min',
        date: 'Juin 2026',
        tags: ['COVID', 'Mars 2020', 'EUR/MAD', 'choc liquidité'],
      },
      {
        id: 'hist-2',
        title: 'Dix ans de EUR/MAD (2015-2025) : les cinq régimes de volatilité et leurs déclencheurs macro',
        excerpt:
          'L\'analyse décennale du EUR/MAD révèle cinq régimes distincts : (1) 2015-2017 : stabilité sous ancrage fixe pré-réforme, volatilité historiquement basse ; (2) 2018-2019 : introduction du flottement (Phase I ±2,5%), légère volatilité d\'adaptation ; (3) 2020 : choc COVID, pic de volatilité, intervention BKAM ; (4) 2021-2022 : choc inflationniste post-COVID, pression sur les matières premières, EUR/MAD sous tension ; (5) 2023-2025 : normalisation graduelle, réserves BKAM robustes (6 mois d\'import), volatilité revenue à des niveaux pré-COVID. La volatilité réalisée du EUR/MAD reste structurellement inférieure à celle des devises émergentes comparables (TND, EGP, TRY).',
        readTime: '6 min',
        date: 'Juin 2026',
        tags: ['EUR/MAD', 'historique', '2015-2025', 'volatilité'],
      },
      {
        id: 'hist-3',
        title: 'Crise de change 2022 : comment les importateurs marocains ont navigué la flambée EUR/MAD',
        excerpt:
          'La flambée des prix des matières premières post-Ukraine (mars 2022) a coïncidé avec un EUR/USD historiquement bas (parité en juillet 2022), créant un choc atypique sur le MAD : l\'EUR affaibli réduisait mécaniquement la pression du panier européen, mais la hausse des prix en USD des hydrocarbures et céréales alourdissait simultanément la facture d\'importation. Les entreprises disposant d\'un compte CPEC ont pu utiliser leurs réserves en devises pour lisser l\'impact. Cette période illustre la complexité de l\'exposition nette MAD pour les entreprises bi-devises. Note : Cette analyse est rétrospective et descriptive â€” elle ne constitue pas un conseil de gestion applicable aux situations futures.',
        readTime: '5 min',
        date: 'Juin 2026',
        tags: ['2022', 'Ukraine', 'matières premières', 'CPEC'],
      },
    ],
  },

  // â”€â”€ Pillar 7 â€” Outils & Templates â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    id: 'outils',
    name: 'Outils & Templates',
    tier: 'TOOL' as ContentTier,
    icon: Zap,
    color: 'text-rose-400',
    border: 'border-rose-700/40',
    bg: 'bg-rose-500/8',
    badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/25',
    ctaLabel: 'Accéder aux simulateurs JAD2FX',
    ctaType: 'nav',
    ctaNav: 'FORWARDS',
    disclaimerLevel: 'long',
    articles: [
      {
        id: 'tool-1',
        title: 'Template : Cartographie d\'exposition FX pour PME marocaine (modèle en 5 colonnes)',
        excerpt:
          'Un modèle de cartographie d\'exposition FX efficace structure les flux par : (1) Devise de facturation (EUR, USD, GBP...), (2) Sens (achat = besoin devise, vente = source devise), (3) Montant et périodicité (mensuel, trimestriel, spot), (4) Contrepartie et délai de règlement, (5) Exposition nette par devise après netting naturel. Ce cadre permet d\'identifier les expositions non compensées qui justifient une démarche auprès de la banque domiciliataire. JAD2FX propose un accès direct aux simulateurs Forward et Swap pour estimer le coût théorique d\'un instrument de couverture.',
        readTime: '4 min',
        date: 'Juin 2026',
        tags: ['template', 'cartographie', 'exposition', 'netting'],
      },
      {
        id: 'tool-2',
        title: 'Simulateur Forward EUR/MAD : estimez le coût théorique de votre couverture',
        excerpt:
          'Le simulateur Forward intégré à JAD2FX calcule le taux à terme EUR/MAD en appliquant la formule CIP à partir des données BKAM/ECB en temps réel. Le taux forward est purement indicatif et ne constitue pas une offre commerciale. Il permet d\'estimer l\'écart entre le cours spot et le cours terme pour une maturité donnée (1M, 3M, 6M, 12M), et de comprendre comment le différentiel de taux MONIA/EURIBOR se traduit en points de swap. Pour un taux ferme et exécutable, contactez votre banque commerciale agréée par Bank Al-Maghrib.',
        readTime: '3 min',
        date: 'Juin 2026',
        tags: ['simulateur', 'forward', 'CIP', 'MONIA', 'EURIBOR'],
      },
      {
        id: 'tool-3',
        title: 'Checklist de conformité OC : les 10 vérifications trimestrielles pour les exportateurs marocains',
        excerpt:
          'La checklist trimestrielle de conformité Office des Changes pour les exportateurs couvre : (1) Vérification des délais de rapatriement (150j biens, 60j services), (2) Cession obligatoire 30% des recettes, (3) Solde CPEC < 6 mois recettes, (4) Mise à jour des domiciliations d\'exportation, (5) Déclaration des prestations de services >50 000 MAD, (6) Conformité des contrats-cadres pour les clients récurrents, (7) Rapprochement des relevés devises avec les déclarations douanières, (8) Archivage documentaire 5 ans minimum, (9) Mise à jour des mandats bancaires si changement de signataire, (10) Auto-évaluation des risques de change non couverts. Source : IGOC 2024 / Office des Changes.',
        readTime: '5 min',
        date: 'Juin 2026',
        tags: ['checklist', 'conformité', 'OC', 'exportateurs', 'IGOC'],
      },
    ],
  },
];

// â”€â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ArticleCard({ article, badgeCategory, badgeColor }: {
  article: Article;
  badgeCategory: string;
  badgeColor: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-navy-900 border border-navy-700 rounded-xl overflow-hidden hover:border-navy-600 transition-colors">
      <div className="p-5">
        {/* Category badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-[10px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full border ${badgeColor}`}>
            {badgeCategory}
          </span>
        </div>

        {/* Title */}
        <h4 className="text-[14px] font-semibold text-white mb-2 leading-snug">{article.title}</h4>

        {/* Excerpt */}
        <p className={`text-[12px] text-slate-400 leading-relaxed transition-all ${expanded ? '' : 'line-clamp-3'}`}>
          {article.excerpt}
        </p>

        {/* Toggle */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-1 text-[11px] text-gold-500 hover:text-gold-300 mt-2 font-semibold transition-colors"
        >
          {expanded ? (
            <><ChevronUp size={12} /> Réduire</>
          ) : (
            <><ChevronDown size={12} /> Lire la suite</>
          )}
        </button>

        {/* Footer meta */}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-navy-800">
          <span className="text-[10px] text-slate-500 font-mono">{article.readTime} de lecture</span>
          <span className="text-slate-700">·</span>
          <span className="text-[10px] text-slate-500 font-mono">{article.date}</span>
          <div className="flex flex-wrap gap-1 ml-auto">
            {article.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-navy-800 text-slate-500 border border-navy-700">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PillarCTA({ pillar, onAction }: {
  pillar: Pillar;
  onAction: (type: 'newsletter' | 'contact' | 'nav', nav?: ViewState) => void;
}) {
  const Icon = pillar.icon;
  return (
    <div className={`rounded-xl border ${pillar.border} ${pillar.bg} p-5`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-8 h-8 rounded-lg border ${pillar.border} flex items-center justify-center flex-shrink-0`}>
          <Icon size={15} className={pillar.color} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-bold text-white">{pillar.name}</p>
          {pillar.tier && (
            <span className={`text-[9px] font-bold border px-1.5 py-0.5 rounded uppercase tracking-wide ${TIER_META[pillar.tier].style}`}>
              {TIER_META[pillar.tier].label}
            </span>
          )}
        </div>
      </div>
      <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
        {pillar.ctaType === 'newsletter' && 'Restez informé des dernières analyses sur ce pilier. Publication hebdomadaire â€” sans conseil d\'investissement.'}
        {pillar.ctaType === 'contact' && 'Nos équipes peuvent vous accompagner sur ce pilier dans un cadre de conseil stratégique ou de formation.'}
        {pillar.ctaType === 'nav' && 'Accédez directement aux outils de simulation JAD2FX pour estimer vos couvertures à titre indicatif.'}
      </p>
      <button
        onClick={() => onAction(pillar.ctaType, pillar.ctaNav)}
        className="flex items-center gap-2 w-full justify-center py-2.5 bg-gold-500 hover:bg-gold-400 text-navy-950 text-[12px] font-bold rounded-lg transition-colors"
      >
        {pillar.ctaType === 'newsletter' && <Mail size={13} />}
        {pillar.ctaType === 'contact' && <MessageSquare size={13} />}
        {pillar.ctaType === 'nav' && <Zap size={13} />}
        {pillar.ctaLabel}
      </button>
    </div>
  );
}

// â”€â”€â”€ Newsletter signup â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function NewsletterSignup() {
  const { config } = useAdmin();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    try {
      const base = (config.corsProxyUrl ?? '').replace(/\/$/, '');
      await fetch(`${base}/api/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), source: 'research-hub' }),
      });
      setStatus('success');
      setEmail('');
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="bg-navy-900 border border-navy-700 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-gold-500/10 border border-gold-700/40 flex items-center justify-center flex-shrink-0">
          <Mail size={16} className="text-gold-400" />
        </div>
        <div>
          <p className="text-[13px] font-bold text-white">Intelligence de Marché JAD2FX</p>
          <p className="text-[10px] text-slate-500">Analyses hebdomadaires · Sans conseil d'investissement</p>
        </div>
      </div>

      {status === 'success' ? (
        <div className="bg-emerald-500/10 border border-emerald-700/40 rounded-lg px-4 py-3">
          <p className="text-[12px] text-emerald-400 font-semibold">Inscription enregistrée. Vous recevrez nos prochaines analyses.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="votre@email.com"
            className="flex-1 bg-navy-800 border border-navy-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-gold-500 placeholder-slate-600"
            required
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="px-4 py-2 bg-gold-500 hover:bg-gold-400 text-navy-950 text-[12px] font-bold rounded-lg transition-colors disabled:opacity-60"
          >
            {status === 'loading' ? '...' : 'S\'abonner'}
          </button>
        </form>
      )}

      {status === 'error' && (
        <p className="text-[11px] text-rose-400 mt-2">Une erreur s'est produite. Réessayez ou contactez-nous directement.</p>
      )}

      <p className="text-[10px] text-slate-600 mt-3 leading-relaxed">
        Données pédagogiques uniquement · Aucune recommandation d'investissement · Désabonnement à tout moment
      </p>
    </div>
  );
}

// â”€â”€â”€ Main component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface ResearchHubProps {
  navTo: (v: ViewState) => void;
}

export default function ResearchHub({ navTo }: ResearchHubProps) {
  const [activePillarId, setActivePillarId] = useState<string>(PILLARS[0].id);
  const [search, setSearch] = useState('');

  const activePillar = PILLARS.find(p => p.id === activePillarId) ?? PILLARS[0];

  // Filter articles by search query across all pillars when search is active
  const filteredArticles = useMemo(() => {
    if (!search.trim()) return activePillar.articles;
    const q = search.toLowerCase();
    return activePillar.articles.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.excerpt.toLowerCase().includes(q) ||
      a.tags.some(t => t.toLowerCase().includes(q))
    );
  }, [search, activePillar]);

  // Global search across all pillars
  const globalSearchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    const results: { pillar: Pillar; article: Article }[] = [];
    PILLARS.forEach(p => {
      p.articles.forEach(a => {
        if (
          a.title.toLowerCase().includes(q) ||
          a.excerpt.toLowerCase().includes(q) ||
          a.tags.some(t => t.toLowerCase().includes(q))
        ) {
          results.push({ pillar: p, article: a });
        }
      });
    });
    return results;
  }, [search]);

  function handleCTA(type: 'newsletter' | 'contact' | 'nav', nav?: ViewState) {
    if (type === 'nav' && nav) {
      navTo(nav);
    } else if (type === 'contact') {
      navTo('CONTACT');
    }
    // newsletter: scroll to signup below
  }

  const Icon = activePillar.icon;

  return (
    <div className="space-y-6">

      {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="bg-navy-900 border border-navy-700 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-gold-500/10 border border-gold-700/40 flex items-center justify-center flex-shrink-0">
            <Eye size={20} className="text-gold-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white tracking-wide">Intelligence de Marché JAD2FX</h2>
            <p className="text-slate-400 text-[12px] mt-1 leading-relaxed">
              7 piliers d'analyse â€” BAM Watch · Réglementaire OC · Macro & Monétaire · Profils Sectoriels · Éducation Hedging · Analyse Historique · Outils & Templates
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="mt-5 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher dans tous les piliers (forward, CPEC, NOK, automobile…)"
            className="w-full bg-navy-800 border border-navy-600 text-white text-sm rounded-lg pl-9 pr-4 py-2.5 focus:outline-none focus:border-gold-500 placeholder-slate-600"
          />
        </div>
      </div>

      {/* â”€â”€ Global search results â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {search.trim() && globalSearchResults.length > 0 && (
        <div className="bg-navy-900 border border-navy-700 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-navy-700 flex items-center gap-2">
            <Search size={13} className="text-gold-500" />
            <p className="text-xs font-bold text-white uppercase tracking-widest">
              Résultats ({globalSearchResults.length})
            </p>
          </div>
          <div className="p-4 space-y-3">
            {globalSearchResults.map(({ pillar, article }) => {
              const PIcon = pillar.icon;
              return (
                <div
                  key={article.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-navy-800/50 hover:bg-navy-800 transition-colors cursor-pointer"
                  onClick={() => { setActivePillarId(pillar.id); setSearch(''); }}
                >
                  <PIcon size={14} className={`${pillar.color} flex-shrink-0 mt-0.5`} />
                  <div>
                    <p className="text-[11px] font-semibold text-white leading-snug">{article.title}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{pillar.name}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {search.trim() && globalSearchResults.length === 0 && (
        <div className="text-center py-8 text-slate-500 text-sm">Aucun résultat pour "{search}"</div>
      )}

      {/* â”€â”€ Main layout â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {!search.trim() && (
        <div className="flex flex-col lg:flex-row gap-5">

          {/* â”€â”€â”€ Pillar sidebar (left on desktop, top on mobile) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div className="lg:w-56 flex-shrink-0">
            {/* Mobile: horizontal pill grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:hidden gap-2 mb-4">
              {PILLARS.map(p => {
                const PIcon = p.icon;
                const isActive = p.id === activePillarId;
                return (
                  <button
                    key={p.id}
                    onClick={() => setActivePillarId(p.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all text-[11px] font-semibold ${
                      isActive
                        ? `${p.bg} ${p.border} ${p.color}`
                        : 'bg-navy-900 border-navy-700 text-slate-400 hover:text-white hover:border-navy-600'
                    }`}
                  >
                    <PIcon size={12} className="flex-shrink-0" />
                    <span className="truncate">{p.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Desktop: vertical sidebar */}
            <div className="hidden lg:flex flex-col gap-1 bg-navy-900 border border-navy-700 rounded-xl p-2">
              {PILLARS.map(p => {
                const PIcon = p.icon;
                const isActive = p.id === activePillarId;
                return (
                  <button
                    key={p.id}
                    onClick={() => setActivePillarId(p.id)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all ${
                      isActive
                        ? `${p.bg} border ${p.border} ${p.color}`
                        : 'text-slate-400 hover:text-white hover:bg-navy-800/60'
                    }`}
                  >
                    <PIcon size={14} className="flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-semibold leading-tight block truncate">{p.name}</span>
                      {p.tier && !isActive && (
                        <span className={`text-[7px] font-bold border px-1 py-0 rounded uppercase ${TIER_META[p.tier].style}`}>
                          {TIER_META[p.tier].label}
                        </span>
                      )}
                    </div>
                    {isActive && (
                      <span className="ml-auto text-[9px] font-bold uppercase bg-gold-500 text-navy-950 px-1.5 py-0.5 rounded flex-shrink-0">
                        {activePillar.articles.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* â”€â”€â”€ Article feed (right on desktop) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* Pillar header card */}
            <div className={`rounded-xl border ${activePillar.border} ${activePillar.bg} p-5 flex items-center gap-4`}>
              <div className={`w-10 h-10 rounded-xl border ${activePillar.border} flex items-center justify-center flex-shrink-0`}>
                <Icon size={18} className={activePillar.color} />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-white">{activePillar.name}</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''} · Intelligence éditoriale JAD2FX
                </p>
              </div>
            </div>

            {/* Articles */}
            {filteredArticles.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm">
                Aucun article pour ce pilier.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredArticles.map(article => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    badgeCategory={activePillar.name}
                    badgeColor={activePillar.badgeColor}
                  />
                ))}
              </div>
            )}

            {/* Pillar CTA */}
            <PillarCTA pillar={activePillar} onAction={handleCTA} />

            {/* Pillar disclaimer */}
            <div className="bg-amber-950/20 border border-amber-800/30 rounded-lg px-4 py-3">
              <p className="text-[11px] text-amber-400/80 leading-relaxed italic">
                {DISCLAIMERS[activePillar.disclaimerLevel]}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ Newsletter signup â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <NewsletterSignup />

      {/* â”€â”€ Footer disclaimer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="text-center py-2">
        <p className="text-[10px] text-navy-600">
          Intelligence de Marché JAD2FX · Données pédagogiques indicatives · Aucun conseil en investissement ·{' '}
          <a href="https://jad2advisory.com" target="_blank" rel="noopener noreferrer" className="text-gold-600 hover:text-gold-500">
            jad2advisory.com
          </a>
        </p>
      </div>
    </div>
  );
}
