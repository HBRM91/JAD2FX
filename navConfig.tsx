// Shared nav data — extracted from App.tsx so other components (command palette, etc.)
// can use it without re-importing the whole App.

import { Activity, Award, BarChart2, BookOpen, Building2, Code, Calculator, Calendar, ClipboardCheck, FileText, Headphones, LayoutDashboard, Newspaper, PackageOpen, Scale, Shield, TrendingUp, ArrowLeftRight, Banknote } from 'lucide-react';

export interface NavItem {
  label: string;
  view: string;
  icon: React.ElementType;
  desc: string;
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'marches',
    label: 'Taux & Marchés',
    items: [
      { label: 'Live Pricer',          view: 'LIVE',        icon: Activity,        desc: 'Cours temps réel · 24 devises' },
      { label: 'Tableau de Bord',      view: 'DASHBOARD',   icon: LayoutDashboard, desc: 'Virements, billets, global FX' },
      { label: 'Fixing BKAM',          view: 'FIXING',      icon: BarChart2,       desc: 'Cours officiels Bank Al-Maghrib' },
      { label: 'Matrice de Parité',     view: 'PARITY_MATRIX', icon: BarChart2,     desc: 'Dérive panier · 30 devises · Graphes' },
      { label: 'Billets de Banque',    view: 'BILLETS',     icon: Banknote,        desc: 'Cours officiels billets BKAM' },
      { label: 'Matières Premières',   view: 'COMMODITIES', icon: PackageOpen,     desc: 'Brent · Or · Blé · Cuivre' },
    ],
  },
  {
    id: 'simulateurs',
    label: 'Simulateurs',
    items: [
      { label: 'Forward de Change',        view: 'FORWARDS',    icon: TrendingUp,     desc: 'Taux à terme CIP · T+2 ajusté' },
      { label: 'Prorogation & Levée',      view: 'TOOL_FWD_EXT', icon: ArrowLeftRight, desc: 'Extension · Dénouement · Marge banque' },
      { label: 'Swap de Change MAD',          view: 'SWAPS',       icon: ArrowLeftRight, desc: 'Points swap · Jambe proche / lointaine' },
      { label: 'Impact Facture MAD',        view: 'TOOL_INVOICE', icon: BarChart2,      desc: 'Érosion marge / scénarios change' },
      { label: 'Bandes BKAM ±5%',          view: 'BANDS',       icon: BarChart2,      desc: 'Cage réglementaire · Dérive · Modèle' },
    ],
  },
  {
    id: 'pme',
    label: 'Outils PME',
    items: [
      { label: 'Diagnostic FX PME',        view: 'TOOL_PME_DIAG',  icon: ClipboardCheck, desc: '5 questions · Score exposition · CTA contextual' },
      { label: "Coût d'Import",            view: 'TOOL_IMPORT_COST', icon: Calculator,   desc: 'Facture + spot vs forward · Stress test' },
      { label: 'Couverture Trimestrielle', view: 'TOOL_QUARTERLY', icon: Calendar,       desc: '4 trimestres · 4 stratégies · Hedging layered' },
    ],
  },
  {
    id: 'intelligence',
    label: 'Intelligence',
    items: [
      { label: 'Morning Briefing',         view: 'REPORT',          icon: Newspaper,    desc: 'Briefing quotidien · Stratégiste en chef' },
      { label: 'Analyse de Marché',        view: 'ANALYSIS',        icon: FileText,     desc: 'G10 FX · MAD · Macro · IA brief' },
      { label: 'Research Hub',             view: 'RESEARCH',        icon: BookOpen,     desc: '7 piliers · Recherche institutionnelle' },
      { label: 'Diagnostic OC',            view: 'TOOL_OC_ASSESS',  icon: Shield,       desc: 'Auto-évaluation Circ. OC 01/2024' },
      { label: 'Réglementation OC',        view: 'REGULATIONS',     icon: Scale,        desc: 'Circulaires · Instructions · Guides' },
      { label: 'À Propos JAD2',            view: 'ABOUT_JAD2',      icon: Building2,    desc: 'Statut · Services · Méthodologie' },
    ],
  },
];

// P4 — Content authority pages (linked from home/footer, not in main nav for simplicity)
export const CONTENT_NAV: NavItem[] = [
  { label: 'Glossaire',         view: 'GLOSSARY',          icon: BookOpen,    desc: '60+ termes FX · MAD · OC' },
  { label: 'Research',          view: 'BLOG',              icon: Newspaper,   desc: 'Analyses & rapports' },
  { label: 'Panier BKAM',       view: 'BASKET',            icon: BarChart2,   desc: 'Simulateur interactif 60/40' },
  { label: 'Press Kit',         view: 'PRESS',             icon: FileText,    desc: 'Logos · bios · assets' },
  { label: 'API Docs',          view: 'API_DOCS',          icon: Code,        desc: 'REST API · OpenAPI 3.0' },
  { label: 'Changelog',         view: 'CHANGELOG',         icon: FileText,    desc: 'Historique des versions' },
  { label: 'Podcast',           view: 'PODCAST',           icon: Headphones,  desc: 'MAD Talk · interviews' },
  { label: 'Quarterly',         view: 'QUARTERLY_OUTLOOK', icon: FileText,    desc: 'MAD Quarterly Outlook PDF' },
  { label: 'Partenaires',       view: 'PARTNERSHIPS',      icon: Award,       desc: 'Académique · presse · institutions' },
  { label: 'Cité par',          view: 'CITED',             icon: Award,       desc: 'Mentions presse de JAD2FX' },
];

// P4 — Footer links
export const FOOTER_LINKS: NavItem[] = [
  { label: 'Press Kit',   view: 'PRESS',      icon: FileText, desc: 'Logos & assets' },
  { label: 'API',         view: 'API_DOCS',   icon: Code,     desc: 'Pour les développeurs' },
  { label: 'Changelog',   view: 'CHANGELOG',  icon: FileText, desc: 'Historique' },
  { label: 'Glossaire',   view: 'GLOSSARY',   icon: BookOpen, desc: 'Termes FX/MAD' },
  { label: 'Recherche',   view: 'BLOG',       icon: Newspaper, desc: 'Articles' },
  { label: 'Partenaires', view: 'PARTNERSHIPS', icon: Award,  desc: 'Nos partenaires' },
];
