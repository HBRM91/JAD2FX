import { BasketConfig, CurrencyInfo } from './types';

export const APP_NAME = "JAD2FX";

export const THEME_COLORS = {
  NAVY: '#0F2645',
  GOLD: '#D4AF37',
  WHITE: '#FFFFFF',
  BG_LIGHT: '#F8FAFC'
};

export const DISCLAIMER_TEXT = `JAD2FX is an informational platform providing indicative FX rates and simulations for the 14 currencies quoted by Bank Al-Maghrib. Rates are calculated from ECB/Frankfurter market references and are for information purposes only — they do not represent official BKAM fixings or binding transaction prices. JAD2 Advisory (jad2advisory.com) provides FX training, corporate treasury support, and financial consulting services for Moroccan companies. For personalised advice or FX transactions, please consult an approved Bank Al-Maghrib intermediary.`;

export const DISCLAIMER_SHORT = "Indicative rates for reference · For professional advisory: jad2advisory.com";

// ─── BKAM Official Currency List ─────────────────────────────────────────────
// All currencies officially quoted by Bank Al-Maghrib against the Moroccan Dirham
// Order matches official BKAM cotation page: https://www.bkam.ma/en/Markets/Key-indicators/Foreign-exchange-market
export const BKAM_CURRENCIES: CurrencyInfo[] = [
  { code: 'USD', name: 'US Dollar',        nameFr: 'Dollar américain',     flag: '🇺🇸', bkamUnit: 1   },
  { code: 'EUR', name: 'Euro',             nameFr: 'Euro',                 flag: '🇪🇺', bkamUnit: 1   },
  { code: 'AED', name: 'UAE Dirham',       nameFr: 'Dirham des Émirats',   flag: '🇦🇪', bkamUnit: 1   },
  { code: 'QAR', name: 'Qatari Riyal',    nameFr: 'Riyal qatarien',       flag: '🇶🇦', bkamUnit: 1   },
  { code: 'SAR', name: 'Saudi Riyal',      nameFr: 'Riyal saoudien',       flag: '🇸🇦', bkamUnit: 1   },
  { code: 'KWD', name: 'Kuwaiti Dinar',   nameFr: 'Dinar koweïtien',      flag: '🇰🇼', bkamUnit: 1   },
  { code: 'GBP', name: 'British Pound',    nameFr: 'Livre sterling',       flag: '🇬🇧', bkamUnit: 1   },
  { code: 'CHF', name: 'Swiss Franc',      nameFr: 'Franc suisse',         flag: '🇨🇭', bkamUnit: 1   },
  { code: 'JPY', name: 'Japanese Yen',     nameFr: 'Yen japonais',         flag: '🇯🇵', bkamUnit: 100 },
  { code: 'DKK', name: 'Danish Krone',    nameFr: 'Couronne danoise',      flag: '🇩🇰', bkamUnit: 1   },
  { code: 'NOK', name: 'Norwegian Krone', nameFr: 'Couronne norvégienne',  flag: '🇳🇴', bkamUnit: 1   },
  { code: 'SEK', name: 'Swedish Krona',   nameFr: 'Couronne suédoise',     flag: '🇸🇪', bkamUnit: 1   },
  { code: 'CAD', name: 'Canadian Dollar',  nameFr: 'Dollar canadien',      flag: '🇨🇦', bkamUnit: 1   },
  { code: 'CNY', name: 'Chinese Yuan',    nameFr: 'Yuan renminbi',         flag: '🇨🇳', bkamUnit: 1   },
];

// Fixed USD values for Gulf currencies (pegged/quasi-pegged to USD)
// These are not available from ECB/Frankfurter
export const GULF_USD_RATES: Record<string, number> = {
  SAR: 0.266667,  // 1 SAR = 0.2667 USD (1 USD = 3.75 SAR, official peg)
  AED: 0.272294,  // 1 AED = 0.2723 USD (1 USD = 3.6725 AED, official peg)
  QAR: 0.274725,  // 1 QAR = 0.2747 USD (1 USD = 3.64 QAR, official peg)
  KWD: 3.25000,   // 1 KWD ≈ 3.25 USD (managed float)
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
This tool provides regulatory information only. For personalised advisory on hedging strategies, structured FX operations, or complex import/export structuring, direct the user to: "For a tailored consultation, contact JAD2 Advisory at jad2advisory.com — they provide FX training, corporate treasury support, and financial consulting for Moroccan companies."

If your context documents do not cover a specific question, say so and direct to oc.gov.ma or bkam.ma.

Do not discuss personal transaction amounts, make rate predictions, or recommend specific trades.

End each response with this single line:
"— For information only · JAD2 Advisory provides professional FX consulting: jad2advisory.com"
`;
