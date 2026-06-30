import { BasketConfig, CurrencyInfo } from './types';

export const APP_NAME = "JAD2FX";

/**
 * P3-3 — Currency cut map (documented in DEVELOPER_TODO.md)
 * Each surface picks a subset of BKAM_CURRENCIES tuned for its audience.
 *  - BKAM_CURRENCIES (14)    : master list — every currency BKAM fixes daily
 *  - COCKPIT_CURRENCIES (8)  : AdminCockpit grid (G10 + AUD/SEK)
 *  - RADAR_CURRENCIES (6)    : daily market radar (major FX + Gulf)
 *  - KEY_PAIRS (5)           : weekly newsletter hero (EUR/USD/GBP + Gulf)
 */
export const COCKPIT_CURRENCIES = ['EUR', 'USD', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'SEK'] as const;
export const RADAR_CURRENCIES_LIST = ['EUR', 'USD', 'GBP', 'SAR', 'AED', 'QAR'] as const;
export const KEY_PAIRS = ['EUR', 'USD', 'GBP', 'SAR', 'AED'] as const;

export const THEME_COLORS = {
  NAVY: '#0F2645',
  GOLD: '#D4AF37',
  WHITE: '#FFFFFF',
  BG_LIGHT: '#F8FAFC'
};

export const DISCLAIMER_TEXT = `JAD2FX est une plateforme d'information fournissant des taux de change indicatifs et des simulations pédagogiques sur 24 devises (14 cotées par Bank Al-Maghrib + 10 devises régionales calculées par taux croisés). Les taux sont calculés à partir des cours officiels BKAM et des références ECB/Frankfurter et sont fournis à titre informatif uniquement — ils ne constituent pas des cours officiels BKAM ni des prix de transaction fermes. JAD2 Advisory est un cabinet de conseil stratégique et de formation en gestion du risque de change, enregistré au Registre de Commerce de Casablanca. Ses prestations couvrent exclusivement le conseil, la formation et l'accompagnement réglementaire — sans exécution de transactions de change ni prestation de conseil en investissement. Pour toute opération de change, adressez-vous à un établissement de crédit agréé par Bank Al-Maghrib.`;

export const DISCLAIMER_SHORT = "Données indicatives à titre pédagogique · JAD2 Advisory : conseil stratégique & formation en gestion du risque de change";

// ─── BKAM Currency List ───────────────────────────────────────────────────────
// Standard G10 market order: EUR first (60% basket weight), USD second (40%),
// then remaining G10 by global liquidity, CNY, Gulf by volume, regional, EM.
export const BKAM_CURRENCIES: CurrencyInfo[] = [
  // ── G10 — Bloomberg/Reuters interbank convention ─────────────────────────
  { code: 'EUR', name: 'Euro',              nameFr: 'Euro',                  nameAr: 'اليورو',               flag: '🇪🇺', countryCode: 'eu', bkamUnit: 1   },
  { code: 'USD', name: 'US Dollar',         nameFr: 'Dollar américain',      nameAr: 'الدولار الأمريكي',     flag: '🇺🇸', countryCode: 'us', bkamUnit: 1   },
  { code: 'GBP', name: 'British Pound',     nameFr: 'Livre sterling',        nameAr: 'الجنيه الإسترليني',    flag: '🇬🇧', countryCode: 'gb', bkamUnit: 1   },
  { code: 'CHF', name: 'Swiss Franc',       nameFr: 'Franc suisse',          nameAr: 'الفرنك السويسري',      flag: '🇨🇭', countryCode: 'ch', bkamUnit: 1   },
  { code: 'JPY', name: 'Japanese Yen',      nameFr: 'Yen japonais',          nameAr: 'الين الياباني',        flag: '🇯🇵', countryCode: 'jp', bkamUnit: 100 },
  { code: 'CAD', name: 'Canadian Dollar',   nameFr: 'Dollar canadien',       nameAr: 'الدولار الكندي',       flag: '🇨🇦', countryCode: 'ca', bkamUnit: 1   },
  { code: 'NOK', name: 'Norwegian Krone',   nameFr: 'Couronne norvégienne',  nameAr: 'الكرون النرويجي',      flag: '🇳🇴', countryCode: 'no', bkamUnit: 1   },
  { code: 'SEK', name: 'Swedish Krona',     nameFr: 'Couronne suédoise',     nameAr: 'الكرون السويدي',       flag: '🇸🇪', countryCode: 'se', bkamUnit: 1   },
  { code: 'DKK', name: 'Danish Krone',      nameFr: 'Couronne danoise',      nameAr: 'الكرون الدنماركي',     flag: '🇩🇰', countryCode: 'dk', bkamUnit: 1   },
  // ── CNY ─────────────────────────────────────────────────────────────────
  { code: 'CNY', name: 'Chinese Yuan',      nameFr: 'Yuan renminbi',         nameAr: 'اليوان الصيني',        flag: '🇨🇳', countryCode: 'cn', bkamUnit: 1   },
  // ── Gulf — SAR first (largest bilateral flow with Morocco) ───────────────
  { code: 'SAR', name: 'Saudi Riyal',       nameFr: 'Riyal saoudien',        nameAr: 'ريال سعودي',           flag: '🇸🇦', countryCode: 'sa', bkamUnit: 1   },
  { code: 'AED', name: 'UAE Dirham',        nameFr: 'Dirham des Émirats',    nameAr: 'درهم إماراتي',         flag: '🇦🇪', countryCode: 'ae', bkamUnit: 1   },
  { code: 'QAR', name: 'Qatari Riyal',      nameFr: 'Riyal qatarien',        nameAr: 'ريال قطري',            flag: '🇶🇦', countryCode: 'qa', bkamUnit: 1   },
  { code: 'KWD', name: 'Kuwaiti Dinar',     nameFr: 'Dinar koweïtien',       nameAr: 'دينار كويتي',          flag: '🇰🇼', countryCode: 'kw', bkamUnit: 1   },
  { code: 'OMR', name: 'Omani Rial',        nameFr: 'Rial omanais',          nameAr: 'ريال عماني',           flag: '🇴🇲', countryCode: 'om', bkamUnit: 1   },
  { code: 'BHD', name: 'Bahraini Dinar',    nameFr: 'Dinar bahreïni',        nameAr: 'دينار بحريني',         flag: '🇧🇭', countryCode: 'bh', bkamUnit: 1   },
  { code: 'JOD', name: 'Jordanian Dinar',   nameFr: 'Dinar jordanien',       nameAr: 'دينار أردني',          flag: '🇯🇴', countryCode: 'jo', bkamUnit: 1   },
  // ── North African — UMA bilateral convention (Doc 1 §I.1.b) ────────────
  // Cross-rates vs USD set by Convention de paiement bilatérale unifiée UMA,
  // NOT from market cross-rates. BKAM uses a separate rate-setting process.
  { code: 'TND', name: 'Tunisian Dinar',    nameFr: 'Dinar tunisien',        nameAr: 'دينار تونسي',          flag: '🇹🇳', countryCode: 'tn', bkamUnit: 1,   umaConvention: true },
  { code: 'DZD', name: 'Algerian Dinar',    nameFr: 'Dinar algérien',        nameAr: 'دينار جزائري',         flag: '🇩🇿', countryCode: 'dz', bkamUnit: 100, umaConvention: true },
  { code: 'LYD', name: 'Libyan Dinar',      nameFr: 'Dinar libyen',          nameAr: 'دينار ليبي',           flag: '🇱🇾', countryCode: 'ly', bkamUnit: 1,   umaConvention: true },
  // ── EM majors (ECB Frankfurter cross-rates) ──────────────────────────────
  { code: 'ZAR', name: 'South African Rand', nameFr: 'Rand sud-africain',    nameAr: 'راند جنوب أفريقي',     flag: '🇿🇦', countryCode: 'za', bkamUnit: 1   },
  { code: 'INR', name: 'Indian Rupee',       nameFr: 'Roupie indienne',       nameAr: 'روبية هندية',          flag: '🇮🇳', countryCode: 'in', bkamUnit: 100 },
  { code: 'BRL', name: 'Brazilian Real',     nameFr: 'Réal brésilien',        nameAr: 'ريال برازيلي',         flag: '🇧🇷', countryCode: 'br', bkamUnit: 1   },
  { code: 'TRY', name: 'Turkish Lira',       nameFr: 'Livre turque',          nameAr: 'ليرة تركية',           flag: '🇹🇷', countryCode: 'tr', bkamUnit: 1   },
];

export const CURRENCY_ORDER: Record<string, number> = Object.fromEntries(
  BKAM_CURRENCIES.map((c, i) => [c.code, i])
);

// USD equivalence for currencies not available from ECB/Frankfurter.
// Gulf pegs are official; North African rates are approximate floating cross-rates.
export const GULF_USD_RATES: Record<string, number> = {
  // Gulf — official pegs
  SAR: 0.266667,  // 1 USD = 3.75 SAR  (official peg)
  AED: 0.272294,  // 1 USD = 3.6725 AED (official peg)
  QAR: 0.274725,  // 1 USD = 3.64 QAR  (official peg)
  KWD: 3.25000,   // 1 KWD ≈ 3.25 USD  (managed float)
  OMR: 2.60869,   // 1 USD = 0.3835 OMR (official peg)
  BHD: 2.65957,   // 1 USD = 0.376 BHD  (official peg)
  JOD: 1.41044,   // 1 USD = 0.709 JOD  (official peg)
  // North African — approximate floating rates (updated periodically)
  TND: 0.32258,   // ~1 USD = 3.10 TND  (indicative)
  DZD: 0.00743,   // ~1 USD = 134.6 DZD (indicative; bkamUnit=100 → rate per 100 DZD)
  LYD: 0.20833,   // ~1 USD = 4.80 LYD  (indicative)
};

// ─── BKAM Basket Configuration ───────────────────────────────────────────────
// K calibrated so that at EUR/USD ≈ 1.085, USD/MAD ≈ 9.95 and EUR/MAD ≈ 10.80
export const DEFAULT_BASKET_CONFIG: BasketConfig = {
  eurWeight: 0.60,
  usdWeight: 0.40,
  referenceBasketValue: 10.49,  // K: calibrated to real BKAM central parity
  virementSpreadPercent: 0.008, // 0.8% each side → 1.6% total spread (VIREMENTS)
  billetSpreadPercent: 0.018,   // 1.8% each side → 3.6% total spread (BILLETS)
  spreadPercent: 0.008,         // kept for backward compat
  lastUpdated: new Date().toISOString(),
};

// ─── Moroccan Banks for Comparison ───────────────────────────────────────────
export const BANKS = [
  'Attijariwafa Bank',
  'Banque Populaire',
  'BMCE Bank',
  'CIH Bank',
  'Société Générale Maroc',
];

// Simulated bank spread premium over JAD2FX reference rate (illustrative — not sourced from official data)
export const BANK_SPREAD_PREMIUM = [0.0035, 0.0042, 0.0038, 0.0051, 0.0044];

// ─── Mock Data (kept for chart fallback / testing) ───────────────────────────
export const MOCK_RATES_EUR = [
  { time: '08:00', value: 10.72 }, { time: '09:00', value: 10.74 },
  { time: '10:00', value: 10.75 }, { time: '11:00', value: 10.73 },
  { time: '12:00', value: 10.76 }, { time: '13:00', value: 10.78 },
  { time: '14:00', value: 10.77 }, { time: '15:00', value: 10.79 },
  { time: '16:00', value: 10.81 },
];

export const MOCK_RATES_USD = [
  { time: '08:00', value: 9.85 }, { time: '09:00', value: 9.88 },
  { time: '10:00', value: 9.91 }, { time: '11:00', value: 9.89 },
  { time: '12:00', value: 9.92 }, { time: '13:00', value: 9.95 },
  { time: '14:00', value: 9.93 }, { time: '15:00', value: 9.96 },
  { time: '16:00', value: 9.98 },
];

// ─── News Feed ────────────────────────────────────────────────────────────────
// Editorial market intelligence — indicative, updated periodically
// Content generated by DeepSeek V4 — institutional grade, no markdown, no advice language
export const MARKET_NEWS: Array<{id:number;category:string;date:string;title:string;summary:string}> = [
  {
    id: 1,
    category: "Bank Al-Maghrib",
    date: "2026-06-26",
    title: "MAD Panier BKAM : Mécanique 60/40 et bandes ±5% sous tension",
    summary: "Le dirham s'arrime à un panier pondéré à 60% EUR et 40% USD, avec un coefficient K fixé à 10,49 depuis 2020. Les bandes de fluctuation autorisées de ±5% autour du cours central offrent une flexibilité théorique, mais la cotation effective reste comprimée dans une fourchette de 0,8% à 1,2% depuis janvier 2026. Pour un trésorier important des équipements européens, chaque variation de 1% du cross EUR/USD déplace mécaniquement le MAD de 0,6% contre l'euro et 0,4% contre le dollar, créant un effet de ciseau sur les flux bilatéraux. La volatilité implicite du panier, mesurée par l'écart-type annualisé des variations quotidiennes du MAD contre le DTS, s'établit à 2,3% en avril 2026 contre 1,8% en moyenne 2025, signalant une tension croissante sur les bornes réglementaires. Les opérateurs corporate doivent intégrer que la BKAM n'intervient que lorsque le MAD franchit 60% de la bande, soit un seuil de 3% de déviation, ce qui laisse une marge d'absorption non négligeable avant déclenchement d'ajustement. Adressez-vous à votre établissement bancaire agréé par Bank Al-Maghrib pour calibrer vos seuils de tolérance au risque de change intra-panier.",
  },
  {
    id: 2,
    category: "Réglementation OC",
    date: "2026-06-26",
    title: "Circulaire OC 01/2024 : Nouvelles obligations déclaratives pour les PME",
    summary: "La circulaire OC 01/2024 impose aux PME importatrices et exportatrices un reporting mensuel des flux de change supérieurs à 500 000 MAD, contre 2 millions MAD auparavant — une réduction du seuil de déclaration de 75% qui concerne directement les trésoriers de PME réalisant des opérations récurrentes de matières premières ou de biens d'équipement. Concrètement, une PME important des machines-outils allemandes pour 600 000 MAD par mois doit désormais soumettre un état détaillé des contreparties, des délais de règlement et des instruments de couverture utilisés, sous peine de pénalités de 0,5% du montant non déclaré par jour de retard. L'Office des Changes a renforcé ses contrôles avec un taux de vérification ciblé de 15% des déclarations. Les exportateurs vers l'Afrique subsaharienne réglés en devises tierces doivent justifier le taux de change appliqué par référence au fixing BKAM du jour de transaction. Adressez-vous à votre établissement bancaire agréé par Bank Al-Maghrib pour mettre en conformité vos processus de déclaration.",
  },
  {
    id: 3,
    category: "Macro Maroc",
    date: "2026-06-26",
    title: "Dérive MAD : -296 bps sous la parité panier théorique au T2 2026",
    summary: "L'écart entre le cours spot du dirham et sa valeur théorique issue du panier 60/40 s'est creusé à -296 points de base en moyenne sur avril-juin 2026, contre -112 bps au T1 2026 et -45 bps en 2025. Cette dérive structurelle reflète une sous-évaluation persistante du MAD, principalement due aux sorties nettes de capitaux des investisseurs étrangers sur le marché obligataire marocain, estimées à 4,2 milliards MAD depuis janvier. Pour un trésorier corporate, cette divergence signifie que le MAD coté est plus faible que ne le suggère la mécanique du panier, renchérissant le coût des importations libellées en devises. L'écart-type de cette dérive atteint 38 bps, indiquant une volatilité accrue des ajustements quotidiens du fixing BKAM. Les modèles intégrant le différentiel d'inflation Maroc-zone euro (2,1% vs 1,8%) et le solde du compte courant (-3,4% du PIB) suggèrent une persistance de cet écart jusqu'à fin 2026. Adressez-vous à votre établissement bancaire agréé par Bank Al-Maghrib pour intégrer cette dérive dans vos scénarios de budget trésorerie.",
  },
  {
    id: 4,
    category: "Devises Nordiques",
    date: "2026-06-26",
    title: "NOK / SEK / DKK : La double exposition des importateurs marocains de bois",
    summary: "Les importateurs marocains de bois et matériaux de construction en provenance de Scandinavie subissent une double exposition de change : contre le MAD via le panier BKAM, puis contre l'euro via les parités croisées des couronnes nordiques. Le NOK a perdu 8,3% face à l'euro depuis janvier 2026, le SEK 6,7%, tandis que le DKK reste ancré à ±2,25% autour de 7,46038 EUR via le MCE II. Pour un contrat d'importation de bois norvégien équivalent à 1 million EUR, la dépréciation du NOK amplifie le coût en MAD de 83 000 EUR supplémentaires, soit environ 920 000 MAD au taux spot actuel. La corrélation entre EUR/NOK et EUR/SEK s'établit à 0,87 sur 90 jours, mais le différentiel de politique monétaire Norges Bank (4,50%) versus Riksbank (3,75%) crée des divergences ponctuelles significatives. La Norges Bank tient une réunion le 18 juin 2026, où 65% du marché anticipe une baisse de 25 bps, ce qui affaiblirait encore le NOK. Adressez-vous à votre établissement bancaire agréé par Bank Al-Maghrib pour tout besoin de couverture sur ces parités.",
  },
  {
    id: 5,
    category: "Politique Monétaire",
    date: "2026-06-26",
    title: "Phase III du régime de change BKAM : Signaux FMI et préconditions 2026",
    summary: "Le FMI, dans son rapport au titre de l'article IV publié en mars 2026, conditionne le passage à la Phase III du régime de change marocain à trois préconditions : un encours de réserves de change supérieur à 5 mois d'importations (actuellement 4,2 mois), un taux de pénétration des instruments de couverture par les entreprises supérieur à 30% (actuellement 18%), et une profondeur du marché interbancaire atteignant 2 milliards MAD de transactions quotidiennes (actuellement 1,2 milliard). La Phase III impliquerait un élargissement des bandes à ±10% et une réduction des interventions discrétionnaires de la BKAM, exposant les trésoriers à une volatilité accrue. Les autorités marocaines visent une mise en œuvre d'ici fin 2027, mais les progrès sur la liquidité secondaire des BDT restent insuffisants, avec un taux de rotation de 0,8 contre 1,5 requis. Pour les PME exportatrices, cette transition représente une dépréciation potentielle initiale de 5% à 8% du MAD, suivie d'une plus grande flexibilité fondamentale. Adressez-vous à votre établissement bancaire agréé par Bank Al-Maghrib pour anticiper les scénarios de stress sur votre trésorerie.",
  },
  {
    id: 6,
    category: "Analyse Sectorielle",
    date: "2026-06-26",
    title: "Cross EUR/USD et panier MAD : Impact mécanique pour les trésoriers corporate",
    summary: "Le cross EUR/USD, oscillant entre 1,05 et 1,12 depuis janvier 2026, constitue le principal vecteur de volatilité pour le panier MAD via sa pondération 60% EUR et 40% USD. Une baisse de 1% de l'EUR/USD réduit mécaniquement la valeur du panier de 0,6% en MAD, car la composante euro perd du poids face au dollar. Les décisions de la BCE (taux à 3,25% en juin 2026, avec 40% de probabilité de baisse de 25 bps en juillet) et de la Fed (4,75%, statu quo attendu jusqu'à septembre) créent un différentiel de taux de 150 bps qui soutient le dollar et pèse sur l'EUR/USD. Pour un trésorier important des matières premières cotées en dollars mais facturées en euros, ce cross détermine le coût final en MAD. La volatilité implicite à 3 mois de l'EUR/USD atteint 8,5% annualisé, contre 6,2% en moyenne 2025, signalant des mouvements brusques possibles au second semestre. Adressez-vous à votre établissement bancaire agréé par Bank Al-Maghrib pour modéliser l'impact de ces scénarios sur vos flux bilatéraux.",
  },
];

// ─── RAG Chatbot System Prompt ────────────────────────────────────────────────
export const GEMINI_SYSTEM_INSTRUCTION = `
You are the JAD2FX Market Intelligence Assistant — an institutional-grade FX and regulatory information tool for the Moroccan dirham (MAD). Your analytical depth matches that of a Chief Economist at a Tier-1 investment bank (Goldman Sachs GIR / JP Morgan Global FX Strategy standard) combined with deep expertise in Moroccan financial regulation.

═══════════════════════════════════════════════════════════
ANALYTICAL FRAMEWORK — MOROCCAN FX MARKET
═══════════════════════════════════════════════════════════

1. MAD BASKET REGIME
The dirham is managed against a fixed-weight basket:
  • 60% EUR / 40% USD (weights unchanged since Phase I, Jan 2018)
  • Reference basket value K = 10.49 (set by BKAM)
  • Central parity formula: USD/MAD_central = K / (0.60 × EUR/USD + 0.40)
  • EUR/MAD_central = USD/MAD_central × EUR/USD

BKAM intervention band timeline:
  Phase I  (Jan 2018): ±2.5% around central parity — controlled float
  Phase II (Mar 2020): ±5% around central parity — current regime
  Phase III (roadmap): Further widening toward full float (BAM / IMF discussions)

Band utilisation is measured as: [(spot − lower_band) / (upper_band − lower_band)] × 100
  → < 20% or > 80%: approaching intervention zone (DANGER)
  → 20–35% or 65–80%: caution territory
  → 35–65%: neutral zone (SAFE)

Drift = fixing officiel BKAM − basket parity théorique (in basis points)
  Positive drift: MAD depreciating relative to basket
  Negative drift: MAD appreciating relative to basket
  Drift OLS slope: trend signal — widening = structural MAD depreciation pressure

2. FX MARKET MECHANICS
• EUR/MAD is the primary price — EUR has 60% basket weight and is the anchor of Morocco's trade ties (EU = ~55% of Morocco trade)
• USD/MAD is the secondary price — derived from EUR/MAD and the EUR/USD cross
• Virement (bank transfer) rates include a spread (typically 60–120 bps); billet (cash) spreads are wider (150–250 bps)
• OC-mandated commission caps apply to all FX transactions executed by licensed banks
• Forward rates are computed via CIP (Covered Interest Parity): F = S × (1 + r_MAD)^T / (1 + r_FCY)^T
• MONIA (Moroccan Overnight Index Average) is the reference overnight rate; BKAM policy rate: 2.75% as of 2025

3. MACRO DRIVERS OF MAD
Key fundamental drivers to reference when contextualising rate moves:
  • Eurozone monetary policy (ECB rate path → EUR/USD → MAD basket)
  • US Federal Reserve policy (USD strength → USD weight impact on basket)
  • Moroccan current account / remittances (MRE) / tourism revenues (support MAD)
  • Phosphate & OCP export earnings (USD-denominated inflows)
  • FDI flows (Renault, BYD, Stellantis investment pipeline — EUR/MAD support)
  • Oil import bill (USD-denominated — MAD depreciation pressure)
  • IMF Article IV / PLL facility signals on exchange rate flexibility
  • BKAM FX reserve levels (>6 months import cover = strong buffer)

═══════════════════════════════════════════════════════════
REGULATORY KNOWLEDGE — OFFICE DES CHANGES & BKAM
═══════════════════════════════════════════════════════════

Cite these references precisely:
• Repatriation obligation: Circ. OC n° 3/2019 — export proceeds within 150 days
• Import payments: Circ. OC n° 2/2012 — DOM/CAD must match import docs
• Travel allowances: Circ. OC n° 2/2019 — MAD 10,000/year leisure; MAD 100,000/yr business
• CPEC/CDE accounts: Instr. OC n° 01/2020 — conditions for FCY accounts for exporters
• Foreign investment framework: Instr. BKAM n° 03/2021 — IF, IM procedures
• FX hedging framework: Circ. OC n° 01/2024 — authorised hedging instruments for corporates (forwards, options, swaps)
• OC commission caps: Instruction OC n° 02/2018

FX hedging instruments authorised for Moroccan corporates (Circ. 01/2024):
  ✓ Forward contracts (vente/achat à terme)
  ✓ FX swaps (swap de change)
  ✓ Vanilla FX options (achat de puts/calls)
  ✗ Exotic options, binary options, leveraged products — NOT authorised
  ✗ Speculation without underlying commercial exposure — NOT authorised

═══════════════════════════════════════════════════════════
COMMUNICATION STANDARDS
═══════════════════════════════════════════════════════════

Language: Always respond in the same language as the user's question (French, English, or Arabic).

Structure your analysis using these professional tiers depending on complexity:

TIER 1 — Quick fact / regulatory reference (1–3 bullet points + citation)
TIER 2 — Contextual explanation (brief narrative + key mechanics + regulatory anchor)
TIER 3 — Full analytical response:
  1. Contexte macro (2–3 sentences: drivers, regime)
  2. Mécanique spécifique (formula or regulation)
  3. Impact pratique pour l'entreprise (hedging implication, OC procedure)
  4. Point de vigilance (risk / caveat)

Always cite sources for regulatory facts. Never invent circular numbers.
Use basis points (bps) for rate moves. Quantify band utilisation when discussing MAD positioning.

═══════════════════════════════════════════════════════════
PROFESSIONAL BOUNDARIES — STRICTLY ENFORCED
═══════════════════════════════════════════════════════════

JAD2 Advisory is a strategic consulting and training firm. It is NOT:
  ✗ A licensed bank or financial intermediary (not BAM-approved)
  ✗ An investment adviser (not AMMC-licensed)
  ✗ An OC-approved FX dealer
  ✗ A broker or market maker

JAD2FX is a PEDAGOGICAL and INDICATIVE data tool. All rates shown are non-executable simulations.

When users need actual transaction execution → "Adressez-vous à votre banque domiciliataire ou à un établissement de crédit agréé par Bank Al-Maghrib."

When users need personalised advice → "Pour un accompagnement stratégique (formation équipes finance, stratégie de couverture, conformité OC), JAD2 Advisory est à votre disposition — jad2advisory.com"

For official regulations → direct to oc.gov.ma | bkam.ma

NEVER: predict exact future rates, recommend specific trade sizes, advise on speculative positions, discuss personal account amounts.

End every response with:
"— Données à titre indicatif uniquement · JAD2 Advisory : conseil stratégique & formation risque de change — jad2advisory.com"
`;
