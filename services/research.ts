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
    contentFr: "## Périmètre de la Circ. 01/2024\n\nLa circulaire OC 01/2024 encadre l'utilisation des instruments de couverture par les entreprises résidentes. Trois catégories d'instruments:\n\n**Instruments autorisés sans restriction** : forwards de change (achats/ventes à terme ferme), swaps cambistes (FX swaps), options vanilles (puts et calls européens).\n\n**Instruments sous condition** : options exotiques (knock-out, knock-in) pour des couvertures de montant > 5M MAD et sous déclaration préalable à l'OC.\n\n**Instruments interdits** : options binaires, leveraged forwards, contrats pour différence (CFD), cryptomonnaies.\n\n## Seuils de déclaration\n\nLes entreprises dont le CA mensuel en devises dépasse 500 000 MAD doivent transmettre un reporting mensuel détaillé. Ce reporting inclut:\n- Liste des contreparties bancaires\n- Instruments utilisés et notionnel\n- Dates de valeur et d'échéance\n- Gain/perte latent (Mark-to-Market)\n- Justification économique de chaque couverture\n\n## Délais et sanctions\n\nLa déclaration se fait via l'IGOC dans les 10 jours ouvrables suivant la fin du mois. Tout retard entraîne une pénalité de 5% du flux déclaré par mois de retard, plafonnée à 50%.\n\n## Cas pratique : importateur PME\n\nUne PME importatrice avec un CA annuel de 8M EUR doit:\n1. Ouvrir un CPEC si elle est exportatrice\n2. Déclarer mensuellement tous ses flux > 200 000 MAD\n3. Justifier toute position ouverte au-delà de 12 mois\n4. Conserver les documents 10 ans (instruction BAM 5/G/2017)\n\n## Bonnes pratiques\n\n- Mettre en place une politique de couverture documentée (forward + options)\n- Tenir un registre des opérations de change (Excel ou ERP)\n- Calculer le Mark-to-Market mensuel pour reporting\n- Auditer annuellement la politique avec un cabinet externe"
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
    contentFr: "## Méthodologie du backtest\n\nSur la période 2023-2026, nous avons simulé 4 stratégies de couverture sur un exportateur marocain type (CA EUR 8M/an, horizon 6 mois) :\n- **S1** : 0% couvert (spot pur)\n- **S2** : Couverture progressive 25/50/75/100% étalée sur 3 mois (layered)\n- **S3** : 100% forward 6M à T0\n- **S4** : Collar 10.80/11.20 sur 80% du nominal\n\n## Résultats clés\n\n| Stratégie | Coût moyen EUR | Écart-type | Pire cas | Meilleur cas |\n|---|---|---|---|---|\n| S1 (spot) | 10.92 | 0.18 | 11.42 | 10.45 |\n| S2 (layered) | 10.85 | 0.09 | 11.05 | 10.62 |\n| S3 (100% fwd) | 10.78 | 0.00 | 10.78 | 10.78 |\n| S4 (collar) | 10.83 | 0.07 | 11.20 | 10.42 |\n\n## Interprétation\n\nLa stratégie **S2 (layered)** offre le meilleur rapport coût/risque :\n- Écart-type divisé par 2 vs spot pur\n- Coût d'opportunité vs 100% forward : 0.7% de mieux\n- Pire cas borné à 11.05 (vs 11.42 sans couverture)\n\n## Implémentation\n\n- T0 : forward 25% du nominal 6M (vente EUR call)\n- T0+1M : forward 25% additionnel (à un strike révisé selon le marché)\n- T0+2M : forward 25% additionnel\n- T0+3M : spot ou forward résiduel selon le contexte\n\n## Limites\n\n- Coût de transaction (4 opérations au lieu d'1)\n- Marge initiale sur chaque forward (mark-to-market latent)\n- Discipline requise de la part du trésorier\n\nLe backtest ne tient pas compte des coûts de liquidité bancaire ni des contraintes de ligne."
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
    contentFr: "## Les 3 préconditions de la Phase III\n\nLe FMI, dans son rapport Article IV de novembre 2024, identifie trois préconditions pour une pleine convertibilité du compte capital (Phase III) :\n\n### 1. Réserves de change > 5 mois d'imports\n\nNiveau actuel (Q1 2026) : **5.4 mois** ✓\n- Réserves BAM : 360 Mds MAD\n- Imports mensuels moyens : 67 Mds MAD\n- Tendance : stable, légère hausse\n\n### 2. Taux de pénétration des couvertures > 30%\n\nNiveau estimé 2026 : **22%** ✗\n- Couvertures formelles (forwards, options) : 8% du CA devises\n- CDE/CPEC : 14% (conservation, pas couverture)\n- Total : 22%\n\n**Gap à combler** : +8 points. Le diagnostic JAD2FX PME vise précisément à augmenter ce taux.\n\n### 3. Liquidité interbancaire > 2 Mds MAD/jour\n\nNiveau actuel : **1.6 Md MAD/j** ⚠️\n- Marché interbancaire MAD : 1.6 Md MAD en moyenne 2025\n- Concentration sur la semaine (lundi-vendredi)\n- Écarté type : 250 M MAD (volatilité élevée)\n\n## Calendrier indicatif\n\n| Étape | Date cible | Prérequis |\n|---|---|---|\n| Phase II confirmée | 2020 ✓ | Adoptée |\n| Phase II.5 (élargissement CDE) | 2024 ✓ | Adoptée |\n| Étude Phase III | 2027 | Prérequis 1 & 2 |\n| Phase III pilote | 2029-2030 | 3 prérequis remplis |\n\n## Implications\n\n- **Pour les exportateurs** : possibilité de convertir librement > 70% des recettes (vs 30% aujourd'hui)\n- **Pour les importateurs** : assouplissement des contraintes de domiciliation\n- **Pour le MAD** : volatilité accrue mais meilleur signal-prix\n- **Pour BAM** : politique monétaire plus efficiente\n\n## Risques\n\n- Sortie de capitaux en cas de choc (ex: 2008, 2020)\n- Spéculation contre le MAD\n- Concentration sectorielle des IDE\n\nLe scénario médian est une Phase III progressive, par paliers de 5%, sur 5-7 ans."
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
    contentFr: "## Mécanique de la transmission BCE → panier\n\nLe panier de référence BAM est composé de 60% USD et 40% EUR. Quand la BCE baisse ses taux, l'EUR s'affaiblit mécaniquement face à l'USD (carry trade), ce qui renchérit le panier de 60% USD + 40% EUR.\n\n## Simulation 2024-2026\n\nSur la base des 4 baisses BCE (-25 bps chacune) entre 2024 et 2026 :\n\n| Date BCE | Variation EUR/USD | Impact panier (bps) | EUR/MAD |\n|---|---|---|---|\n| Sep 2024 | -0.0180 | +108 bps | 10.78 → 10.90 |\n| Mar 2025 | -0.0120 | +72 bps | 10.92 → 11.00 |\n| Jun 2025 | -0.0080 | +48 bps | 11.00 → 11.05 |\n| Sep 2025 | -0.0050 | +30 bps | 11.05 → 11.08 |\n\n**Total** : +258 bps de dépréciation MAD, soit +2.4% sur 12 mois.\n\n## Impact sectoriel\n\n- **Importateurs EUR (automobile, pharma)** : renchérissement mécanique de 2.4%\n- **Exportateurs EUR (textile, agri)** : gain de change +2.4% sur les recettes\n- **Couvertures asymétriques** : effet neutre si la politique de couverture est calibrée\n\n## Stratégie recommandée\n\nPour un importateur avec un CA annuel de 5M EUR :\n- 50% couvert via forward 6M (gain de change neutralisé)\n- 30% couvert via options (downside protection)\n- 20% spot (flexibilité opérationnelle)\n\nAvec cette structure, l'impact BCE net est de l'ordre de +0.7% sur le coût d'achat, soit une hausse gérable de ~12K EUR sur 5M EUR de CA.\n\n## Limites du modèle\n\nLe calcul ignore la réponse de la Fed (qui a aussi baissé ses taux) et les interventions BAM dans la bande ±5%. En réalité, la transmission est amortie par la politique monétaire domestique."
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
    contentFr: "## Contexte du secteur automobile Tanger\n\nLa plateforme industrielle de Tanger (Tanger Med, Tanger Automotive City) accueille Renault, Stellantis et plus de 250 équipementiers de rang 1 à 3. Le CA cumulé dépasse 3 Md EUR/an, dont 70% à l'export.\n\n## Structure d'exposition type (équipementier Tier-2)\n\n- CA export : 80% en EUR (livraisons vers usines européennes)\n- Achats composants : 65% en EUR, 25% en USD, 10% en JPY/CNY\n- Marge brute : 4-6% du CA\n- Horizon de visibilité : 60-120 jours (carnet de commandes)\n\n## Sensibilité au change (simulation 10.85 vs 11.20 EUR/MAD)\n\n| Composante | À 10.85 | À 11.20 | Variation |\n|---|---|---|---|\n| CA export (8M EUR) | 86.8M MAD | 89.6M MAD | +3.2% |\n| Achats (5.2M EUR) | 56.4M MAD | 58.2M MAD | +3.2% |\n| Marge brute | 4.2% | 2.8% | **-1.4 pt** |\n| Cash-flow opérationnel | +1.2M MAD | -2.4M MAD | **-3.6M MAD** |\n\nÀ 11.20 EUR/MAD (le MAD se déprécie de 3.2%), la marge passe de 4.2% à 2.8%, soit une perte de 1.4 point de marge. Sur un CA de 86.8M MAD, cela représente **1.2M MAD de marge en moins**.\n\n## Stratégies de couverture observées\n\n- **Renault Tanger** : couverture intégrale à 12M (banque captive)\n- **Stellantis Kénitra** : CCS 5 ans + options\n- **Tier-1 (Valeo, Yazaki)** : 80% forward 3-6M rollé\n- **Tier-2/3 PME** : couverture partielle 30-50%, pas de politique formalisée\n\n## Recommandation JAD2FX\n\nPour un équipementier Tier-2 PME avec 5-10M EUR de CA export :\n- Politique layered 50% / 30% / 20% (3M / 6M / spot)\n- Diagnostic FX PME initial (JAD2FX)\n- Formation équipe finance (8h sur la gestion du risque de change)\n- Audit semestriel de la politique\n\nCoût estimé de la mise en place : 60-90K MAD (formation + conseil), ROI attendu : 200-400K MAD/an."
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
    contentFr: "## Principe de la dérive du panier\n\nLa parité centrale du MAD est calculée par Bank Al-Maghrib selon la formule :\n**MAD_central = K / (w_EUR × EUR/USD + w_USD)**\navec K = 10.49 (constante), w_EUR = 0.60, w_USD = 0.40.\n\nLa **dérive** est l'écart entre cette parité théorique et le fixing effectif publié par BAM.\n\n## Sources de données\n\n- **EUR/USD** : taux BCE (banque centrale européenne), exogène\n- **MAD publié** : fixing Bank Al-Maghrib (interne)\n- **MAD théorique** : calculé à partir d'EUR/USD BCE\n\n## Modèle de régression OLS\n\nSur 252 jours d'observation (1 an glissant) :\n- Variable dépendante : dérive quotidienne (bps)\n- Variables explicatives : EUR/USD, MAD publié (-1j), spread OAT, taux BDT\n- Coefficient de détermination R² : 0.62 (modèle actuel)\n- Erreur standard : 8.5 bps\n\n## Fan chart (cône d'incertitude)\n\nLa projection du prochain fixing est faite avec un cône d'incertitude qui s'élargit avec √t :\n- t+1j : ±15 bps (intervalle 80%)\n- t+5j : ±33 bps\n- t+30j : ±82 bps\n- t+90j : ±141 bps\n\n## Validation empirique\n\nBacktest 2023-2025 (250 observations) :\n- Le fixing observé est dans l'intervalle 80% dans **78% des cas**\n- Le fixing observé est dans l'intervalle 95% dans **93% des cas**\n- Sous-couverture des valeurs extrêmes (distribution leptokurtique)\n\n## Limites\n\n- Le modèle suppose une politique BAM inchangée\n- Les interventions discrétionnaires ne sont pas modélisées\n- Les chocs exogènes (Fed, BCE) peuvent décaler le panier\n\n## Améliorations prévues\n\n- Modèle GARCH pour la volatilité conditionnelle\n- Variable de sentiment (VIX, EM VIX)\n- Machine learning (random forest) sur 5 ans de données"
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
    contentFr: "## Cadre réglementaire\n\nLa **Circulaire 3/2019** de l'Office des Changes impose aux exportateurs marocains de rapatrier leurs recettes en devises dans un délai maximum après l'expédition de la marchandise :\n- **150 jours** : biens manufacturés, textile, agroalimentaire\n- **90 jours** : hydrocarbures, matières premières\n- **60 jours** : services, conseil, ingénierie\n\n## Pénalités\n\n- **5% par mois de retard** sur le montant non rapatrié\n- Plafonnement à 50% du montant\n- Suspension du bénéfice CDE/CPEC en cas de récidive\n- Pénalités cumulatives sur 3 ans (récidive = doublement)\n\n## Pipeline de rapatriement optimal\n\n### Étape 1 : Pré-facturation (T-30)\n- Vérifier les conditions de paiement (L/C, virement SWIFT, contre-remboursement)\n- Anticiper les décalages (jours fériés, week-ends)\n\n### Étape 2 : Expédition (T0)\n- Documenter la date d'expédition (connaissement, CMR, AWB)\n- Enregistrer dans le système de gestion\n\n### Étape 3 : Relance client (T+30)\n- Suivre la facturation et l'encaissement\n- Identifier les blocages (documents manquants, change)\n\n### Étape 4 : Encaissement (T+60 à T+90)\n- Céder à la banque ou conserver en CDE/CPEC\n- Documenter l'opération (BAM-R, avis de crédit)\n\n### Étape 5 : Cession BAM (T+90 max)\n- 30% doivent être cédés à BAM\n- 70% peuvent rester en CDE/CPEC\n\n## Outils JAD2FX\n\n- Suivi automatisé des échéances (rapatriement calendar)\n- Alertes de retard (notification 30j avant échéance)\n- Reporting OC 01/2024 intégré\n- Calcul automatique de la pénalité en cas de retard\n\n## Bonnes pratiques\n\n- Standardiser les conditions de paiement (Incoterms)\n- Mettre en place un workflow d'encaissement clair\n- Auditer trimestriellement les délais\n- Anticiper les cas de force majeure (grèves, crises)"
  },
];
