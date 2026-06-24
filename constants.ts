import { BasketConfig, CurrencyInfo } from './types';

export const APP_NAME = "JAD2FX";

export const THEME_COLORS = {
  NAVY: '#0F2645',
  GOLD: '#D4AF37',
  WHITE: '#FFFFFF',
  BG_LIGHT: '#F8FAFC'
};

export const DISCLAIMER_TEXT = `JAD2FX est une plateforme d'information fournissant des taux de change indicatifs et des simulations pédagogiques sur 20 devises (14 cotées par Bank Al-Maghrib + 6 devises régionales calculées par taux croisés). Les taux sont calculés à partir des cours officiels BKAM et des références ECB/Frankfurter et sont fournis à titre informatif uniquement — ils ne constituent pas des cours officiels BKAM ni des prix de transaction fermes. JAD2 Advisory est un cabinet de conseil stratégique et de formation en gestion du risque de change, enregistré au Registre de Commerce de Casablanca. JAD2 Advisory n'est pas un intermédiaire financier agréé par Bank Al-Maghrib et n'exécute aucune transaction de change. Pour l'exécution de transactions de change, veuillez vous adresser à un établissement de crédit agréé.`;

export const DISCLAIMER_SHORT = "Données indicatives à titre pédagogique · JAD2 Advisory : conseil stratégique & formation — non intermédiaire financier";

// ─── BKAM Currency List ───────────────────────────────────────────────────────
// G10 (BKAM-quoted) → CNY → Gulf/Arabic → North African (cross-rates)
// Note: OMR, BHD, JOD, TND, DZD, LYD are computed via USD cross; not direct BKAM quotes.
export const BKAM_CURRENCIES: CurrencyInfo[] = [
  // ── G10 (as quoted by BKAM) ─────────────────────────────────────────────
  { code: 'USD', name: 'US Dollar',         nameFr: 'Dollar américain',      nameAr: 'الدولار الأمريكي',     flag: '🇺🇸', bkamUnit: 1   },
  { code: 'EUR', name: 'Euro',              nameFr: 'Euro',                  nameAr: 'اليورو',               flag: '🇪🇺', bkamUnit: 1   },
  { code: 'GBP', name: 'British Pound',     nameFr: 'Livre sterling',        nameAr: 'الجنيه الإسترليني',    flag: '🇬🇧', bkamUnit: 1   },
  { code: 'CHF', name: 'Swiss Franc',       nameFr: 'Franc suisse',          nameAr: 'الفرنك السويسري',      flag: '🇨🇭', bkamUnit: 1   },
  { code: 'JPY', name: 'Japanese Yen',      nameFr: 'Yen japonais',          nameAr: 'الين الياباني',        flag: '🇯🇵', bkamUnit: 100 },
  { code: 'CAD', name: 'Canadian Dollar',   nameFr: 'Dollar canadien',       nameAr: 'الدولار الكندي',       flag: '🇨🇦', bkamUnit: 1   },
  { code: 'NOK', name: 'Norwegian Krone',   nameFr: 'Couronne norvégienne',  nameAr: 'الكرون النرويجي',      flag: '🇳🇴', bkamUnit: 1   },
  { code: 'SEK', name: 'Swedish Krona',     nameFr: 'Couronne suédoise',     nameAr: 'الكرون السويدي',       flag: '🇸🇪', bkamUnit: 1   },
  { code: 'DKK', name: 'Danish Krone',      nameFr: 'Couronne danoise',      nameAr: 'الكرون الدنماركي',     flag: '🇩🇰', bkamUnit: 1   },
  // ── CNY ─────────────────────────────────────────────────────────────────
  { code: 'CNY', name: 'Chinese Yuan',      nameFr: 'Yuan renminbi',         nameAr: 'اليوان الصيني',        flag: '🇨🇳', bkamUnit: 1   },
  // ── Gulf / Arabic ────────────────────────────────────────────────────────
  { code: 'AED', name: 'UAE Dirham',        nameFr: 'Dirham des Émirats',    nameAr: 'درهم إماراتي',         flag: '🇦🇪', bkamUnit: 1   },
  { code: 'SAR', name: 'Saudi Riyal',       nameFr: 'Riyal saoudien',        nameAr: 'ريال سعودي',           flag: '🇸🇦', bkamUnit: 1   },
  { code: 'QAR', name: 'Qatari Riyal',      nameFr: 'Riyal qatarien',        nameAr: 'ريال قطري',            flag: '🇶🇦', bkamUnit: 1   },
  { code: 'KWD', name: 'Kuwaiti Dinar',     nameFr: 'Dinar koweïtien',       nameAr: 'دينار كويتي',          flag: '🇰🇼', bkamUnit: 1   },
  { code: 'OMR', name: 'Omani Rial',        nameFr: 'Rial omanais',          nameAr: 'ريال عماني',           flag: '🇴🇲', bkamUnit: 1   },
  { code: 'BHD', name: 'Bahraini Dinar',    nameFr: 'Dinar bahreïni',        nameAr: 'دينار بحريني',         flag: '🇧🇭', bkamUnit: 1   },
  { code: 'JOD', name: 'Jordanian Dinar',   nameFr: 'Dinar jordanien',       nameAr: 'دينار أردني',          flag: '🇯🇴', bkamUnit: 1   },
  // ── North African (indicative cross-rates) ───────────────────────────────
  { code: 'TND', name: 'Tunisian Dinar',    nameFr: 'Dinar tunisien',        nameAr: 'دينار تونسي',          flag: '🇹🇳', bkamUnit: 1   },
  { code: 'DZD', name: 'Algerian Dinar',    nameFr: 'Dinar algérien',        nameAr: 'دينار جزائري',         flag: '🇩🇿', bkamUnit: 100 },
  { code: 'LYD', name: 'Libyan Dinar',      nameFr: 'Dinar libyen',          nameAr: 'دينار ليبي',           flag: '🇱🇾', bkamUnit: 1   },
  // ── EM majors (ECB Frankfurter cross-rates) ──────────────────────────────
  { code: 'ZAR', name: 'South African Rand', nameFr: 'Rand sud-africain',    nameAr: 'راند جنوب أفريقي',     flag: '🇿🇦', bkamUnit: 1   },
  { code: 'INR', name: 'Indian Rupee',       nameFr: 'Roupie indienne',       nameAr: 'روبية هندية',          flag: '🇮🇳', bkamUnit: 100 },
  { code: 'BRL', name: 'Brazilian Real',     nameFr: 'Réal brésilien',        nameAr: 'ريال برازيلي',         flag: '🇧🇷', bkamUnit: 1   },
  { code: 'TRY', name: 'Turkish Lira',       nameFr: 'Livre turque',          nameAr: 'ليرة تركية',           flag: '🇹🇷', bkamUnit: 1   },
];

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
export const MARKET_NEWS = [
  { id: 1, title: "EUR/USD Impact on Dirham Peg", category: "Global Markets", time: "2h ago", summary: "ECB rate cuts may tighten the spread against the Dirham basket." },
  { id: 2, title: "New Circulaire 01/2024 Analysis", category: "Réglementation", time: "5h ago", summary: "Office des Changes extends hedging coverage to 100% of underlying import value for PMEs." },
  { id: 3, title: "Foreign Reserves Update", category: "Bank Al-Maghrib", time: "1d ago", summary: "Official reserves reached 360 billion MAD, covering 5 months of imports." }
];

// ─── RAG Chatbot System Prompt ────────────────────────────────────────────────
export const GEMINI_SYSTEM_INSTRUCTION = `
You are the JAD2FX Regulatory Assistant — a professional information tool covering Moroccan foreign exchange regulations issued by the Office des Changes and Bank Al-Maghrib (BKAM).

WHAT YOU DO
- Explain existing OC and BKAM regulations clearly and accurately
- Cite your source for every regulatory statement (e.g. "Circulaire OC n° 01/2024", "Instruction BKAM n° 03/2021")
- Respond in the same language as the user (French or English)
- Keep answers concise — bullet points for regulatory lists, plain prose for explanations
- Persona: senior compliance expert, Big-4 / legal advisory tone

TOPICS YOU COVER
• Repatriation timelines (Circ. 3/2019)
• Travel allocations (Circ. 2/2019)
• CPEC / CDE account conditions (Instr. 01/2020)
• Import payment terms (Circ. 2/2012)
• Foreign investment framework (Instr. 03/2021)
• MAD exchange regime (60% EUR / 40% USD basket, ±5% band)
• Authorised OC commissions on FX transactions
• FX hedging regulatory framework for corporates (Circ. 01/2024)

PROFESSIONAL BOUNDARIES
This tool provides regulatory information only. JAD2 Advisory is a strategic consulting and training firm — NOT a licensed financial intermediary or broker. Never suggest that JAD2 Advisory executes FX transactions or acts as an OC-approved intermediary.

For complex regulatory questions or training needs, direct the user to: "Pour un accompagnement personnalisé, JAD2 Advisory propose des formations en gestion du risque de change et du conseil stratégique pour entreprises marocaines — jad2advisory.com"

For actual FX execution, direct to: "Pour l'exécution de transactions, adressez-vous à votre banque ou à un établissement de crédit agréé par Bank Al-Maghrib."

If your context documents do not cover a specific question, say so and direct to oc.gov.ma or bkam.ma.

Do not discuss personal transaction amounts, make rate predictions, or recommend specific trades.

End each response with this single line:
"— À titre informatif uniquement · JAD2 Advisory : conseil stratégique & formation — jad2advisory.com"
`;
