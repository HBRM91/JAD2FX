import { BasketConfig, CurrencyInfo } from './types';

export const APP_NAME = "JAD2FX";

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
  // ── North African (indicative cross-rates) ───────────────────────────────
  { code: 'TND', name: 'Tunisian Dinar',    nameFr: 'Dinar tunisien',        nameAr: 'دينار تونسي',          flag: '🇹🇳', countryCode: 'tn', bkamUnit: 1   },
  { code: 'DZD', name: 'Algerian Dinar',    nameFr: 'Dinar algérien',        nameAr: 'دينار جزائري',         flag: '🇩🇿', countryCode: 'dz', bkamUnit: 100 },
  { code: 'LYD', name: 'Libyan Dinar',      nameFr: 'Dinar libyen',          nameAr: 'دينار ليبي',           flag: '🇱🇾', countryCode: 'ly', bkamUnit: 1   },
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
export const MARKET_NEWS = [
  {
    id: 1,
    title: "EUR/MAD : L'ancre européenne domine la dynamique du panier",
    category: "Bank Al-Maghrib",
    time: "Éditorial",
    summary: "Avec 60% du panier de référence BKAM indexé sur l'euro, la politique monétaire de la BCE constitue la variable exogène la plus déterminante pour le dirham. La stabilisation du cycle de normalisation des taux BCE, combinée à un EUR/USD gravitant autour de 1,08–1,12, ancre la parité centrale USD/MAD dans un corridor étroit de 9,92–10,05. L'utilisation des bandes BKAM reste en zone neutre (35–65%) — une configuration favorable à la visibilité des entreprises exportatrices en EUR."
  },
  {
    id: 2,
    title: "Phosphates OCP & hydrocarbures : la matrice asymétrique du compte courant",
    category: "Macro Maroc",
    time: "Éditorial",
    summary: "Les recettes d'exportation d'OCP — libellées majoritairement en USD — génèrent un flux structurel de devises qui amortit la pression de dépréciation du dirham issue de la facture pétrolière (également en USD). Cette couverture naturelle partielle réduit le besoin net d'intervention de BKAM, mais expose la balance des paiements à une double vulnérabilité si les cours des phosphates et du Brent évoluent défavorablement en simultané — un scénario à intégrer dans les stress tests de trésorerie corporate."
  },
  {
    id: 3,
    title: "Circulaire OC n° 01/2024 : une refonte majeure du cadre de couverture",
    category: "Réglementation",
    time: "Éditorial",
    summary: "La Circulaire 01/2024 de l'Office des Changes élargit la couverture autorisée à 100% de l'exposition commerciale sous-jacente (imports et exports), et officialise les options de change vanille (puts pour importateurs, calls pour exportateurs). C'est la réforme la plus significative de l'arsenal de couverture depuis la Phase II de libéralisation (2020). Les entreprises disposant de comptes CPEC ou CDE doivent réviser leur politique de couverture pour intégrer les nouvelles limites et instruments autorisés."
  },
  {
    id: 4,
    title: "Remises MRE & tourisme : saisonnalité et impact EUR/MAD",
    category: "Flux de Capitaux",
    time: "Éditorial",
    summary: "Les transferts des Marocains résidant à l'étranger (MRE) dépassent structurellement 9 Mds EUR annuels, avec un pic saisonnier en Q2–Q3 (Ramadan / retour estival). Combinés à l'accélération des recettes touristiques, ces flux créent une pression acheteuse prévisible sur EUR/MAD entre mai et septembre. Les trésoriers corporate devraient anticiper ce biais saisonnier dans le calendrier de débouclement de leurs couvertures à terme EUR."
  },
  {
    id: 5,
    title: "Phase III du régime de change : signaux et préconditions BKAM",
    category: "Politique Monétaire",
    time: "Éditorial",
    summary: "Les discussions BKAM–FMI (Ligne de Précaution et de Liquidité) réaffirment l'objectif d'élargissement progressif des bandes d'intervention au-delà du ±5% actuel. Le Gouverneur Jouahri a conditionné cette transition à trois indicateurs : réserves officielles > 5 mois d'importations, inflation ancrée près de 2%, et consolidation du compte courant. À horizon 2027, un passage à ±7,5% est envisageable — un scénario à intégrer dans l'analyse de sensibilité des expositions MAD. Pour toute décision de couverture, consultez votre banque ou un intermédiaire agréé BAM."
  }
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
