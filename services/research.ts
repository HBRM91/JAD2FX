/**
 * P4.1 — Research articles data store.
 * In production this would be backed by MDX files or KV. For now: static seeds.
 */

export type ResearchCategory =
  | 'macro'
  | 'regulation'
  | 'fx-strategy'
  | 'sector'
  | 'tools';

export const RESEARCH_CATEGORIES: Record<ResearchCategory, string> = {
  'macro':       'Macro & Politique',
  'regulation':  'Réglementation OC',
  'fx-strategy': 'Stratégie FX',
  'sector':      'Analyse Sectorielle',
  'tools':       'Outils & Méthodo',
};

export interface ResearchArticle {
  id: string;
  title: string;
  excerpt: string;
  date: string;       // YYYY-MM-DD
  category: ResearchCategory;
  tags: string[];
  readTimeMin: number;
  author: 'JAD2 Advisory' | 'JAD2FX Research' | 'Morning Briefing';
  /**
   * Optional long-form content (P4.1). When present, the Blog detail view
   * renders this as a multi-section article. Plain markdown (no MDX deps)
   * with light formatting: ## heading, **bold**, *italic*, - list, code `inline`.
   */
  contentFr?: string;
  /** Author photo initials + role for the article header */
  authorRole?: string;
}

export function getArticleById(id: string): ResearchArticle | undefined {
  return RESEARCH_ARTICLES.find((a) => a.id === id);
}

export const RESEARCH_ARTICLES: ResearchArticle[] = [
  {
    id: 'r-001',
    title: 'MAD Drift BKAM Q2 2026 : -296 bps, la dérive structurelle',
    excerpt: 'L\'écart entre spot et parité panier s\'est creusé à -296 bps en moyenne au T2 2026. Analyse de la persistance et impact pour les trésoriers.',
    date: '2026-06-26',
    category: 'macro',
    tags: ['MAD', 'BKAM', 'drift', 'panier 60/40'],
    readTimeMin: 8,
    author: 'Morning Briefing',
    authorRole: 'Karim Tazi, Head of Research',
    contentFr: `## Contexte

Au T2 2026, l'écart entre le cours spot du dirham et la parité théorique issue du panier BKAM s'est creusé à **-296 bps** en moyenne, contre **-112 bps** au T1 2026 et seulement **-45 bps** en 2025. Cette dérive structurelle reflète un désalignement persistant entre le fixing BAM et les fondamentaux macroéconomiques du Maroc.

## Mécanique du panier 60/40

Le panier de référence BAM est composé à 60% d'EUR et 40% d'USD, avec un coefficient K=10.49. La parité centrale théorique se calcule ainsi :

\`\`\`
USD/MAD_central = K / (0.60 × EUR/USD + 0.40)
\`\`\`

Pour EUR/USD = 1.085, la parité centrale s'établit à **9.84 MAD**, contre un spot moyen de 9.71 au T2 2026 — soit une dérive de **-296 bps**.

## Sources de la dérive

Trois facteurs expliquent cette déviation :

1. **Sorties de capitaux étrangers** sur le marché obligataire marocain (estimées à 4.2 Mds MAD YTD)
2. **Compte courant dégradé** à -3.4% du PIB, sous l'effet de la facture énergétique
3. **Pression sur les réserves de change** BAM à 4.2 mois d'imports (cible FMI : 5+ mois)

## Impact pour les trésoriers

- **Importateurs** : exposition accrue, marge compressée
- **Exportateurs** : opportunité (MAD plus faible) mais à verrouiller
- **Volatilité** : dispersion accrue des fixing, exige des couvertures plus fines

## Recommandations

- Lock 60-80% de l'exposition à 3-6M forward (CIP typique)
- Compléter avec options vanilles pour les scénarios extrêmes (Circ. OC 01/2024)
- Stress tester les scénarios -5%/-10% EUR/USD`,
  },
  {
    id: 'r-002',
    title: 'Circ. OC 01/2024 : le guide opérationnel pour les PME',
    excerpt: 'Forwards, swaps, options vanilla sont autorisés. Exotiques, binaires, leviers sont interdits. Seuils de déclaration: 500K MAD/mois pour les PME importatrices/exportatrices.',
    date: '2026-06-20',
    category: 'regulation',
    tags: ['OC 01/2024', 'PME', 'conformité', 'couvertures'],
    readTimeMin: 12,
    author: 'JAD2 Advisory',
  },
  {
    id: 'r-003',
    title: 'Stratégie de couverture layered 25/50/75/100% : backtest 2023-2026',
    excerpt: 'Sur 3 ans, une couverture progressive des flux trimestriels réduit le coût d\'opportunité de 35% vs couverture intégrale à T0, pour un risque de Mark-to-Market limité à 2% du notionnel.',
    date: '2026-06-15',
    category: 'fx-strategy',
    tags: ['couverture', 'backtest', 'forward', 'stratégie'],
    readTimeMin: 15,
    author: 'JAD2FX Research',
  },
  {
    id: 'r-004',
    title: 'Phase III du régime de change : calendrier et implications',
    excerpt: 'Selon le FMI, trois préconditions pour Phase III : réserves > 5 mois d\'imports, taux de pénétration couverture > 30%, liquidité interbancaire > 2 Mds MAD/j. État des lieux 2026.',
    date: '2026-06-10',
    category: 'regulation',
    tags: ['Phase III', 'FMI', 'réserves de change', 'BAM'],
    readTimeMin: 10,
    author: 'JAD2 Advisory',
  },
  {
    id: 'r-005',
    title: 'EUR/MAD : l\'effet de la politique BCE sur le panier 60/40',
    excerpt: 'Avec 60% du panier en EUR, chaque coupe BCE de 25 bps déplace mécaniquement le MAD de ~15 bps. Simulation 2024-2026 et impact sur les importateurs marocains.',
    date: '2026-06-05',
    category: 'macro',
    tags: ['EUR/MAD', 'BCE', 'politique monétaire', 'panier'],
    readTimeMin: 7,
    author: 'Morning Briefing',
  },
  {
    id: 'r-006',
    title: 'Équipementiers automobile Tanger : impact change sur la marge',
    excerpt: 'Renault, Stellantis, BYD : 70% des achats composants en EUR. À 10.85 EUR/MAD, la marge moyenne est de 4.2%. À 11.20, elle passe à 2.8%. Stratégies de couverture observées.',
    date: '2026-05-30',
    category: 'sector',
    tags: ['automobile', 'Tanger', 'marge', 'couverture'],
    readTimeMin: 10,
    author: 'JAD2FX Research',
  },
  {
    id: 'r-007',
    title: 'Méthodologie : comment JAD2FX calcule le drift du panier',
    excerpt: 'Notre modèle utilise EUR/USD BCE (exogène) et non la cross BKAM (circulaire). Détail du calcul, du fan chart, et de la régression OLS pour la prédiction de fixing.',
    date: '2026-05-25',
    category: 'tools',
    tags: ['méthodologie', 'drift', 'OLS', 'fixing'],
    readTimeMin: 12,
    author: 'JAD2FX Research',
  },
  {
    id: 'r-008',
    title: 'Rapatriement 150 jours : sanctions et bonnes pratiques',
    excerpt: 'Circ. 3/2019 impose le rapatriement des recettes export sous 150 jours. Pénalité 5%/mois. Comment structurer un pipeline de rapatriement efficace.',
    date: '2026-05-20',
    category: 'regulation',
    tags: ['Circ. 3/2019', 'export', 'rapatriement', 'sanctions'],
    readTimeMin: 8,
    author: 'JAD2 Advisory',
  },
];
