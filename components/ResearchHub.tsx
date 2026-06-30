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
  STRATEGIC:  { label: 'Brief StratÃ©gique', style: 'bg-red-500/15 text-red-400 border-red-500/30' },
  REGULATORY: { label: 'Alerte RÃ©gl.',      style: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
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
    'JAD2FX est un outil pÃ©dagogique. DonnÃ©es Ã  titre informatif. JAD2 Advisory n\'est pas habilitÃ©e Ã  fournir des services d\'investissement.',
  standard:
    'Cette publication est strictement informative et pÃ©dagogique. Elle ne constitue pas un conseil en investissement, ni une recommandation d\'achat, de vente ou de couverture. JAD2 Advisory est enregistrÃ©e sous dÃ©claration simplifiÃ©e. Les dÃ©cisions de change relÃ¨vent de la seule responsabilitÃ© de l\'entreprise et de ses conseillers bancaires agrÃ©Ã©s BAM.',
  long:
    'Cet outil est fourni Ã  titre pÃ©dagogique et ne constitue pas un conseil en investissement, en gestion de portefeuille, ou en trÃ©sorerie. Les rÃ©sultats dÃ©pendent des hypothÃ¨ses saisies par l\'utilisateur. JAD2 Advisory dÃ©cline toute responsabilitÃ© quant aux dÃ©cisions prises sur la base de cet outil. Pour toute opÃ©ration de change, adressez-vous Ã  un Ã©tablissement de crÃ©dit agrÃ©Ã© par Bank Al-Maghrib.',
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
        title: 'Le mÃ©canisme de fixing du dirham : sÃ©ance MIC de 11h30 et publication officielle',
        excerpt:
          'Bank Al-Maghrib publie chaque jour ouvrÃ© Ã  12h30 les cours officiels de rÃ©fÃ©rence issus de la sÃ©ance du MarchÃ© Interbancaire des Changes (MIC) ouverte Ã  11h30. Ces taux â€” dits "cours virements" â€” constituent le rÃ©fÃ©rentiel lÃ©gal pour toutes les opÃ©rations de change au Maroc. Le taux central rÃ©sulte de l\'Ã©quilibre offre/demande dans le corridor de Â±5% autour de la paritÃ© panier thÃ©orique K=10,49. Hors sÃ©ance, BKAM peut intervenir discrÃ©tionnairement pour stabiliser le cours.',
        readTime: '3 min',
        date: 'Juin 2026',
        tags: ['BKAM', 'MIC', 'fixing', 'dirham'],
      },
      {
        id: 'bam-2',
        title: 'Comparatif rÃ©gional : MAD, TND, EGP, TRY â€” quatre ancrages, quatre trajectoires',
        excerpt:
          'La comparaison des rÃ©gimes de change rÃ©gionaux Ã©claire la spÃ©cificitÃ© marocaine. Le dinar tunisien (TND) flotte librement depuis 2016, gÃ©nÃ©rant une volatilitÃ© structurelle supÃ©rieure. La livre Ã©gyptienne (EGP) a subi deux dÃ©valuations significatives (2016, 2022) liÃ©es au manque de rÃ©serves. La livre turque (TRY) reflÃ¨te une politique monÃ©taire sous contrainte politique. Le dirham marocain, ancrÃ© Ã  un panier EUR/USD supervisÃ© par BKAM, affiche la volatilitÃ© la plus faible de la rÃ©gion â€” un avantage structurel pour la planification de trÃ©sorerie.',
        readTime: '4 min',
        date: 'Juin 2026',
        tags: ['MAD', 'TND', 'EGP', 'TRY', 'comparatif'],
      },
    ],
  },

  // â”€â”€ Pillar 2 â€” RÃ©glementaire & Office des Changes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    id: 'reglementaire',
    name: 'RÃ©glementaire & OC',
    tier: 'REGULATORY' as ContentTier,
    icon: Scale,
    color: 'text-blue-400',
    border: 'border-blue-700/40',
    bg: 'bg-blue-500/8',
    badgeColor: 'text-blue-400 bg-blue-500/10 border-blue-500/25',
    ctaLabel: 'TÃ©lÃ©charger le guide de conformitÃ© OC',
    ctaType: 'contact',
    disclaimerLevel: 'standard',
    articles: [
      {
        id: 'oc-1',
        title: 'Seuils de dÃ©claration 2026 : tableau complet des obligations OC pour les entreprises',
        excerpt:
          'L\'Office des Changes impose des obligations dÃ©claratives diffÃ©renciÃ©es selon le montant et la nature des opÃ©rations. Les importations supÃ©rieures Ã  100 000 MAD requiÃ¨rent une domiciliation bancaire prÃ©alable. Les exportations de services sont soumises Ã  un rapatriement dans les 60 jours suivant l\'encaissement. Les transferts de dividendes Ã  des actionnaires Ã©trangers sont libres pour les investissements rÃ©guliÃ¨rement constituÃ©s (visa de change obtenu Ã  l\'entrÃ©e). JAD2FX compile ces seuils Ã  titre informatif â€” consultez l\'Office des Changes pour toute interprÃ©tation.',
        readTime: '5 min',
        date: 'Juin 2026',
        tags: ['OC', 'dÃ©claration', 'seuils', 'conformitÃ©'],
      },
      {
        id: 'oc-2',
        title: 'CPEC & CDE 2026 : conditions d\'ouverture et utilisation des comptes en devises',
        excerpt:
          'Le Compte Professionnel en Devises (CPEC) est accessible aux exportateurs ayant rÃ©alisÃ© plus de 5 millions MAD de recettes en devises sur l\'exercice prÃ©cÃ©dent. Il permet de conserver jusqu\'Ã  70% des recettes d\'exportation rapatriÃ©es et de les utiliser pour rÃ©gler importations, frais de mission et dividendes. Le plafond de solde est limitÃ© Ã  6 mois de recettes d\'exportation. Le Compte en Devises Ã‰tranger (CDE) suit des rÃ¨gles distinctes pour les non-rÃ©sidents. Source : Instruction OC nÂ°01/2020.',
        readTime: '4 min',
        date: 'Juin 2026',
        tags: ['CPEC', 'CDE', 'comptes devises', 'exportateurs'],
      },
      {
        id: 'oc-3',
        title: 'Compliance OC : checklist trimestrielle pour les PME exportatrices',
        excerpt:
          'Les obligations trimestrielles de conformitÃ© couvrent : (1) dÃ©claration des encaissements d\'exportation dans les dÃ©lais impartis (150 jours pour les biens, 60 jours pour les services), (2) cession obligatoire de 30% des recettes en devises, (3) mise Ã  jour des domiciliations bancaires pour les importations rÃ©currentes, (4) rapport d\'activitÃ© CPEC si applicable. La non-conformitÃ© expose l\'entreprise Ã  des pÃ©nalitÃ©s de 5% par mois de retard sur les montants non rapatriÃ©s. Source : OC / IGOC 2024.',
        readTime: '4 min',
        date: 'Juin 2026',
        tags: ['PME', 'checklist', 'trimestriel', 'IGOC'],
      },
    ],
  },

  // â”€â”€ Pillar 3 â€” Macro & MonÃ©taire â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    id: 'macro',
    name: 'Macro & MonÃ©taire',
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
        title: 'Le rÃ©gime de change marocain : comprendre le flottement administrÃ© en 5 points clÃ©s',
        excerpt:
          'Le dirham marocain opÃ¨re sous un rÃ©gime de "flottement administrÃ©" depuis janvier 2018 (Phase I : bande Â±2,5%) Ã©largi Ã  Â±5% en mars 2020 (Phase II). Ce rÃ©gime combine la prÃ©visibilitÃ© d\'un ancrage (panier 60% EUR / 40% USD) et la flexibilitÃ© d\'une bande d\'absorption des chocs. BKAM intervient discrÃ©tionnairement sur le MarchÃ© Interbancaire des Changes pour maintenir le cours dans le corridor. Les rÃ©serves officielles â€” Ã  6 mois d\'importations â€” constituent le capital d\'intervention. La Phase III (bande Ã©largie) est conditionnÃ©e Ã  l\'inflation < 2% et aux rÃ©serves > 5 mois.',
        readTime: '5 min',
        date: 'Juin 2026',
        tags: ['rÃ©gime', 'flottement', 'bandes', 'BKAM', 'Phase II'],
      },
      {
        id: 'macro-2',
        title: 'Les trois moteurs du MAD : BCE, Fed, et la balance des paiements marocaine',
        excerpt:
          'La valeur du dirham rÃ©sulte de l\'interaction de trois forces : (1) la politique monÃ©taire de la BCE (60% du panier â€” chaque hausse BCE apprÃ©cie mÃ©caniquement le MAD si EUR/USD monte), (2) la Fed (40% du panier â€” un USD fort compresse le MAD via le mÃ©canisme inverse), (3) la balance des paiements marocaine (exportations OCP + phosphates en USD, remises MRE en EUR, facture pÃ©troliÃ¨re en USD). La position nette en devises du Maroc â€” structurellement dÃ©ficitaire sur les importations Ã©nergÃ©tiques â€” crÃ©e une pression de dÃ©prÃ©ciation endÃ©mique partiellement compensÃ©e par les MRE (9+ Mds EUR/an).',
        readTime: '5 min',
        date: 'Juin 2026',
        tags: ['BCE', 'Fed', 'balance paiements', 'MRE', 'OCP'],
      },
      {
        id: 'macro-3',
        title: 'Inflation et taux directeur BKAM : le triangle de politique monÃ©taire marocain',
        excerpt:
          'Bank Al-Maghrib opÃ¨re avec un double mandat implicite : stabilitÃ© des prix (cible d\'inflation ~2%) et soutien Ã  la croissance. Le taux directeur actuel (2,75% en 2025) reflÃ¨te un cycle de relÃ¢chement monÃ©taire initiÃ© aprÃ¨s le choc inflationniste post-COVID. La transmission Ã  l\'Ã©conomie rÃ©elle passe par les taux interbancaires (MONIA) et les spreads bancaires sur crÃ©dits. Pour les trÃ©soriers, le taux directeur BKAM constitue le plancher thÃ©orique pour le calcul des points de swap MAD dans les opÃ©rations de change Ã  terme.',
        readTime: '4 min',
        date: 'Juin 2026',
        tags: ['inflation', 'taux directeur', 'MONIA', 'politique monÃ©taire'],
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
        title: 'Secteur Automobile â€” Renault, BYD, Stellantis : l\'exposition EUR/JPY/USD des Ã©quipementiers marocains',
        excerpt:
          'L\'industrie automobile marocaine (Tanger Med, KÃ©nitra) gÃ©nÃ¨re une exposition de change structurellement bi-devises : les composants technologiques europÃ©ens (moteurs, Ã©lectronique) sont facturÃ©s en EUR, les technologies asiatiques (batteries, semi-conducteurs) en JPY/USD, tandis que les revenus d\'exportation vers l\'UE arrivent en EUR. Les Ã©quipementiers de rang 2 et 3 supportent la volatilitÃ© EUR/JPY â€” une paire non cotÃ©e directement par BKAM mais dÃ©rivable via les cross-rates. Une apprÃ©ciation du JPY de 100 bps renchÃ©rit mÃ©caniquement les inputs technologiques.',
        readTime: '5 min',
        date: 'Juin 2026',
        tags: ['automobile', 'EUR/JPY', 'Ã©quipementiers', 'Tanger Med'],
      },
      {
        id: 'sec-2',
        title: 'Couronnes nordiques (NOK/SEK/DKK) : l\'exposition mÃ©connue des importateurs de bois et matiÃ¨res premiÃ¨res',
        excerpt:
          'Les importateurs marocains de bois, papier, pÃ¢te Ã  papier et Ã©quipements industriels scandinaves font face Ã  une exposition NOK/SEK/DKK structurellement sous-couverte. Ces trois devises â€” toutes cotÃ©es par BKAM â€” affichent une corrÃ©lation EUR de 60-75% mais intÃ¨grent une prime spÃ©cifique : la NOK est liÃ©e au Brent (Ã©conomie pÃ©troliÃ¨re norvÃ©gienne), crÃ©ant une double exposition pour les importateurs exposÃ©s simultanÃ©ment aux hydrocarbures. Une apprÃ©ciation NOK de 200 bps impacte mÃ©caniquement les coÃ»ts d\'importation bois-construction, packaging et papier.',
        readTime: '4 min',
        date: 'Juin 2026',
        tags: ['NOK', 'SEK', 'DKK', 'bois', 'matiÃ¨res premiÃ¨res'],
      },
      {
        id: 'sec-3',
        title: 'Secteur Textile & Habillement : cartographie de l\'exposition EUR/USD des importateurs et exportateurs',
        excerpt:
          'L\'industrie textile marocaine prÃ©sente une exposition bi-monÃ©taire asymÃ©trique : les matiÃ¨res premiÃ¨res (coton en USD, fils synthÃ©tiques en EUR) gÃ©nÃ¨rent des besoins en devises, tandis que 65% des exportations finales vers l\'UE arrivent en EUR. Les transformateurs pure-players â€” achetant en EUR et vendant en EUR â€” bÃ©nÃ©ficient d\'une couverture naturelle partielle. Les importateurs de coton brut (facturÃ© en USD) sans revenus correspondants en USD subissent une exposition nette USD/MAD non compensÃ©e. La saisonnalitÃ© Q1 (importations) vs Q3 (exportations) crÃ©e un dÃ©calage temporel qui structure le besoin en liquiditÃ© devise.',
        readTime: '5 min',
        date: 'Juin 2026',
        tags: ['textile', 'habillement', 'coton', 'EUR/USD'],
      },
    ],
  },

  // â”€â”€ Pillar 5 â€” Ã‰ducation Hedging â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    id: 'hedging',
    name: 'Ã‰ducation Hedging',
    tier: 'TOOL' as ContentTier,
    icon: BookOpen,
    color: 'text-amber-400',
    border: 'border-amber-700/40',
    bg: 'bg-amber-500/8',
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/25',
    ctaLabel: 'AccÃ©der au simulateur Forward',
    ctaType: 'nav',
    ctaNav: 'FORWARDS',
    disclaimerLevel: 'long',
    articles: [
      {
        id: 'hedg-1',
        title: 'Le Forward de Change : mÃ©canisme, coÃ»t et cadre rÃ©glementaire marocain (Circ. OC 01/2024)',
        excerpt:
          'Le contrat Ã  terme de change (forward) permet Ã  une entreprise de fixer aujourd\'hui le taux de change applicable Ã  une date future. Le taux forward rÃ©sulte de la formule CIP (Covered Interest Parity) : F = S Ã— (1 + r_MAD)^T / (1 + r_Devise)^T. Les points de swap (F - S) reflÃ¨tent le diffÃ©rentiel de taux d\'intÃ©rÃªt entre le MAD et la devise. En 2026, avec un taux MONIA de ~2,75%, les points forward EUR/MAD Ã  6 mois sont structurellement positifs (MAD moins cher en terme de taux). La Circulaire OC nÂ°01/2024 autorise les entreprises Ã  utiliser les forwards jusqu\'Ã  100% de leur exposition commerciale documentÃ©e.',
        readTime: '6 min',
        date: 'Juin 2026',
        tags: ['forward', 'CIP', 'points de swap', 'Circ 01/2024'],
      },
      {
        id: 'hedg-2',
        title: 'Swap de change : structure Near/Far legs et utilisation comme outil de trÃ©sorerie',
        excerpt:
          'Le swap de change combine deux opÃ©rations de sens inverse : une vente (ou achat) au comptant (leg Near) et un rachat (ou revente) Ã  terme (leg Far). Pour un importateur ayant encaissÃ© une remise en EUR mais ne devant payer son fournisseur qu\'Ã  90 jours, le swap permet de placer les EUR jusqu\'Ã  l\'Ã©chÃ©ance sans les convertir immÃ©diatement. Les points de swap payÃ©s/reÃ§us reflÃ¨tent le coÃ»t de portage du MAD vs. la devise. La Circulaire OC nÂ°01/2024 autorise les swaps aux entreprises rÃ©sidentes disposant d\'une exposition commerciale documentÃ©e. Pour toute opÃ©ration, contactez votre banque domiciliataire agrÃ©Ã©e par Bank Al-Maghrib.',
        readTime: '5 min',
        date: 'Juin 2026',
        tags: ['swap', 'Near leg', 'Far leg', 'trÃ©sorerie'],
      },
      {
        id: 'hedg-3',
        title: 'Options de change plain vanilla : mÃ©canisme des puts et calls pour les entreprises marocaines',
        excerpt:
          'La Circulaire OC nÂ°01/2024 officialise l\'accÃ¨s des entreprises marocaines aux options de change vanilla (puts EUR pour les importateurs, calls EUR pour les exportateurs). Une option de change confÃ¨re le droit â€” et non l\'obligation â€” d\'acheter ou de vendre une devise Ã  un prix fixÃ© (strike). Le coÃ»t (prime) dÃ©pend de la volatilitÃ© implicite EUR/MAD, du tenor et de la moneyness. Contrairement au forward, l\'option prÃ©serve la capacitÃ© Ã  bÃ©nÃ©ficier d\'un mouvement favorable. Les options exotiques, binaires et Ã  effet de levier restent interdites. Source : Circ. OC nÂ°01/2024.',
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
        title: 'Mars 2020 : L\'impact du choc COVID sur EUR/MAD et la rÃ©ponse de Bank Al-Maghrib',
        excerpt:
          'En mars 2020, la crise COVID a provoquÃ© un choc de liquiditÃ© mondial sans prÃ©cÃ©dent. Le EUR/MAD est passÃ© de 10,65 Ã  11,20 (+5,2%) en 10 jours ouvrÃ©s sous l\'effet de la fuite vers les actifs refuges (USD, CHF) et de l\'effondrement des recettes de change marocaines (tourisme, MRE, phosphates). BKAM a dÃ©ployÃ© ses instruments de stabilisation (interventions directes, swap de liquiditÃ© en devises) pour contenir la volatilitÃ© dans la bande Â±2,5% alors applicable. Les entreprises non couvertes importatrices ont enregistrÃ© un impact mÃ©canique de +5% sur leur facture devise â€” une leÃ§on sur la valeur de la visibilitÃ© Ã  terme.',
        readTime: '5 min',
        date: 'Juin 2026',
        tags: ['COVID', 'Mars 2020', 'EUR/MAD', 'choc liquiditÃ©'],
      },
      {
        id: 'hist-2',
        title: 'Dix ans de EUR/MAD (2015-2025) : les cinq rÃ©gimes de volatilitÃ© et leurs dÃ©clencheurs macro',
        excerpt:
          'L\'analyse dÃ©cennale du EUR/MAD rÃ©vÃ¨le cinq rÃ©gimes distincts : (1) 2015-2017 : stabilitÃ© sous ancrage fixe prÃ©-rÃ©forme, volatilitÃ© historiquement basse ; (2) 2018-2019 : introduction du flottement (Phase I Â±2,5%), lÃ©gÃ¨re volatilitÃ© d\'adaptation ; (3) 2020 : choc COVID, pic de volatilitÃ©, intervention BKAM ; (4) 2021-2022 : choc inflationniste post-COVID, pression sur les matiÃ¨res premiÃ¨res, EUR/MAD sous tension ; (5) 2023-2025 : normalisation graduelle, rÃ©serves BKAM robustes (6 mois d\'import), volatilitÃ© revenue Ã  des niveaux prÃ©-COVID. La volatilitÃ© rÃ©alisÃ©e du EUR/MAD reste structurellement infÃ©rieure Ã  celle des devises Ã©mergentes comparables (TND, EGP, TRY).',
        readTime: '6 min',
        date: 'Juin 2026',
        tags: ['EUR/MAD', 'historique', '2015-2025', 'volatilitÃ©'],
      },
      {
        id: 'hist-3',
        title: 'Crise de change 2022 : comment les importateurs marocains ont naviguÃ© la flambÃ©e EUR/MAD',
        excerpt:
          'La flambÃ©e des prix des matiÃ¨res premiÃ¨res post-Ukraine (mars 2022) a coÃ¯ncidÃ© avec un EUR/USD historiquement bas (paritÃ© en juillet 2022), crÃ©ant un choc atypique sur le MAD : l\'EUR affaibli rÃ©duisait mÃ©caniquement la pression du panier europÃ©en, mais la hausse des prix en USD des hydrocarbures et cÃ©rÃ©ales alourdissait simultanÃ©ment la facture d\'importation. Les entreprises disposant d\'un compte CPEC ont pu utiliser leurs rÃ©serves en devises pour lisser l\'impact. Cette pÃ©riode illustre la complexitÃ© de l\'exposition nette MAD pour les entreprises bi-devises. Note : Cette analyse est rÃ©trospective et descriptive â€” elle ne constitue pas un conseil de gestion applicable aux situations futures.',
        readTime: '5 min',
        date: 'Juin 2026',
        tags: ['2022', 'Ukraine', 'matiÃ¨res premiÃ¨res', 'CPEC'],
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
    ctaLabel: 'AccÃ©der aux simulateurs JAD2FX',
    ctaType: 'nav',
    ctaNav: 'FORWARDS',
    disclaimerLevel: 'long',
    articles: [
      {
        id: 'tool-1',
        title: 'Template : Cartographie d\'exposition FX pour PME marocaine (modÃ¨le en 5 colonnes)',
        excerpt:
          'Un modÃ¨le de cartographie d\'exposition FX efficace structure les flux par : (1) Devise de facturation (EUR, USD, GBP...), (2) Sens (achat = besoin devise, vente = source devise), (3) Montant et pÃ©riodicitÃ© (mensuel, trimestriel, spot), (4) Contrepartie et dÃ©lai de rÃ¨glement, (5) Exposition nette par devise aprÃ¨s netting naturel. Ce cadre permet d\'identifier les expositions non compensÃ©es qui justifient une dÃ©marche auprÃ¨s de la banque domiciliataire. JAD2FX propose un accÃ¨s direct aux simulateurs Forward et Swap pour estimer le coÃ»t thÃ©orique d\'un instrument de couverture.',
        readTime: '4 min',
        date: 'Juin 2026',
        tags: ['template', 'cartographie', 'exposition', 'netting'],
      },
      {
        id: 'tool-2',
        title: 'Simulateur Forward EUR/MAD : estimez le coÃ»t thÃ©orique de votre couverture',
        excerpt:
          'Le simulateur Forward intÃ©grÃ© Ã  JAD2FX calcule le taux Ã  terme EUR/MAD en appliquant la formule CIP Ã  partir des donnÃ©es BKAM/ECB en temps rÃ©el. Le taux forward est purement indicatif et ne constitue pas une offre commerciale. Il permet d\'estimer l\'Ã©cart entre le cours spot et le cours terme pour une maturitÃ© donnÃ©e (1M, 3M, 6M, 12M), et de comprendre comment le diffÃ©rentiel de taux MONIA/EURIBOR se traduit en points de swap. Pour un taux ferme et exÃ©cutable, contactez votre banque commerciale agrÃ©Ã©e par Bank Al-Maghrib.',
        readTime: '3 min',
        date: 'Juin 2026',
        tags: ['simulateur', 'forward', 'CIP', 'MONIA', 'EURIBOR'],
      },
      {
        id: 'tool-3',
        title: 'Checklist de conformitÃ© OC : les 10 vÃ©rifications trimestrielles pour les exportateurs marocains',
        excerpt:
          'La checklist trimestrielle de conformitÃ© Office des Changes pour les exportateurs couvre : (1) VÃ©rification des dÃ©lais de rapatriement (150j biens, 60j services), (2) Cession obligatoire 30% des recettes, (3) Solde CPEC < 6 mois recettes, (4) Mise Ã  jour des domiciliations d\'exportation, (5) DÃ©claration des prestations de services >50 000 MAD, (6) ConformitÃ© des contrats-cadres pour les clients rÃ©currents, (7) Rapprochement des relevÃ©s devises avec les dÃ©clarations douaniÃ¨res, (8) Archivage documentaire 5 ans minimum, (9) Mise Ã  jour des mandats bancaires si changement de signataire, (10) Auto-Ã©valuation des risques de change non couverts. Source : IGOC 2024 / Office des Changes.',
        readTime: '5 min',
        date: 'Juin 2026',
        tags: ['checklist', 'conformitÃ©', 'OC', 'exportateurs', 'IGOC'],
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
            <><ChevronUp size={12} /> RÃ©duire</>
          ) : (
            <><ChevronDown size={12} /> Lire la suite</>
          )}
        </button>

        {/* Footer meta */}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-navy-800">
          <span className="text-[10px] text-slate-500 font-mono">{article.readTime} de lecture</span>
          <span className="text-slate-700">Â·</span>
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
        {pillar.ctaType === 'newsletter' && 'Restez informÃ© des derniÃ¨res analyses sur ce pilier. Publication hebdomadaire â€” sans conseil d\'investissement.'}
        {pillar.ctaType === 'contact' && 'Nos Ã©quipes peuvent vous accompagner sur ce pilier dans un cadre de conseil stratÃ©gique ou de formation.'}
        {pillar.ctaType === 'nav' && 'AccÃ©dez directement aux outils de simulation JAD2FX pour estimer vos couvertures Ã  titre indicatif.'}
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
          <p className="text-[13px] font-bold text-white">Intelligence de MarchÃ© JAD2FX</p>
          <p className="text-[10px] text-slate-500">Analyses hebdomadaires Â· Sans conseil d'investissement</p>
        </div>
      </div>

      {status === 'success' ? (
        <div className="bg-emerald-500/10 border border-emerald-700/40 rounded-lg px-4 py-3">
          <p className="text-[12px] text-emerald-400 font-semibold">Inscription enregistrÃ©e. Vous recevrez nos prochaines analyses.</p>
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
        <p className="text-[11px] text-rose-400 mt-2">Une erreur s'est produite. RÃ©essayez ou contactez-nous directement.</p>
      )}

      <p className="text-[10px] text-slate-600 mt-3 leading-relaxed">
        DonnÃ©es pÃ©dagogiques uniquement Â· Aucune recommandation d'investissement Â· DÃ©sabonnement Ã  tout moment
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
            <h2 className="text-xl font-bold text-white tracking-wide">Intelligence de MarchÃ© JAD2FX</h2>
            <p className="text-slate-400 text-[12px] mt-1 leading-relaxed">
              7 piliers d'analyse â€” BAM Watch Â· RÃ©glementaire OC Â· Macro & MonÃ©taire Â· Profils Sectoriels Â· Ã‰ducation Hedging Â· Analyse Historique Â· Outils & Templates
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
            placeholder="Rechercher dans tous les piliers (forward, CPEC, NOK, automobileâ€¦)"
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
              RÃ©sultats ({globalSearchResults.length})
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
        <div className="text-center py-8 text-slate-500 text-sm">Aucun rÃ©sultat pour "{search}"</div>
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
                  {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''} Â· Intelligence Ã©ditoriale JAD2FX
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
          Intelligence de MarchÃ© JAD2FX Â· DonnÃ©es pÃ©dagogiques indicatives Â· Aucun conseil en investissement Â·{' '}
          <a href="https://jad2advisory.com" target="_blank" rel="noopener noreferrer" className="text-gold-600 hover:text-gold-500">
            jad2advisory.com
          </a>
        </p>
      </div>
    </div>
  );
}
