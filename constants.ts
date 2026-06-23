import { BasketConfig, CurrencyInfo } from './types';

export const APP_NAME = "JAD2FX";

export const THEME_COLORS = {
  NAVY: '#0F2645',
  GOLD: '#D4AF37',
  WHITE: '#FFFFFF',
  BG_LIGHT: '#F8FAFC'
};

export const DISCLAIMER_TEXT = `JAD2FX est un outil d'information et de simulation pédagogique sur les marchés de change. Les données affichées sont des cours à titre INDICATIF UNIQUEMENT et ne constituent pas une offre ferme, un conseil en investissement, ni une recommandation financière au sens de la Loi n° 44-12 relative à l'appel public à l'épargne et de la réglementation de l'AMMC. JAD2FX n'est pas un établissement de crédit agréé par Bank Al-Maghrib, ni un intermédiaire agréé de change au sens du Dahir n° 1-93-147. Les simulations produites (forwards, swaps, rolls) sont exclusivement pédagogiques et ne sauraient être invoquées comme base d'une opération de change réelle. Toute opération de change doit être réalisée auprès d'un intermédiaire agréé et dans le respect de la réglementation de l'Office des Changes. JAD2FX et ses éditeurs déclinent toute responsabilité pour les pertes ou dommages résultant d'une utilisation des données à des fins transactionnelles. Pour des besoins de conseil ou de couverture de change structurée, veuillez contacter JAD2 Advisory (jad2advisory.com). | FOR INFORMATION ONLY — NOT INVESTMENT ADVICE — NOT REGULATED BY AMMC OR BAM.`;

export const DISCLAIMER_SHORT = "Taux indicatifs uniquement • Pas de conseil en investissement • Non régulé AMMC/BAM • Pour conseil: jad2advisory.com";

// ─── BKAM Official Currency List ─────────────────────────────────────────────
// All currencies officially quoted by Bank Al-Maghrib against the Moroccan Dirham
export const BKAM_CURRENCIES: CurrencyInfo[] = [
  { code: 'EUR', name: 'Euro',             nameFr: 'Euro',            flag: '🇪🇺', bkamUnit: 1 },
  { code: 'USD', name: 'US Dollar',        nameFr: 'Dollar américain',flag: '🇺🇸', bkamUnit: 1 },
  { code: 'GBP', name: 'British Pound',    nameFr: 'Livre sterling',  flag: '🇬🇧', bkamUnit: 1 },
  { code: 'CHF', name: 'Swiss Franc',      nameFr: 'Franc suisse',    flag: '🇨🇭', bkamUnit: 1 },
  { code: 'CAD', name: 'Canadian Dollar',  nameFr: 'Dollar canadien', flag: '🇨🇦', bkamUnit: 1 },
  { code: 'JPY', name: 'Japanese Yen',     nameFr: 'Yen japonais',    flag: '🇯🇵', bkamUnit: 100 },
  { code: 'SAR', name: 'Saudi Riyal',      nameFr: 'Riyal saoudien',  flag: '🇸🇦', bkamUnit: 1 },
  { code: 'AED', name: 'UAE Dirham',       nameFr: 'Dirham émirien',  flag: '🇦🇪', bkamUnit: 1 },
  { code: 'KWD', name: 'Kuwaiti Dinar',   nameFr: 'Dinar koweïtien', flag: '🇰🇼', bkamUnit: 1 },
  { code: 'QAR', name: 'Qatari Riyal',    nameFr: 'Riyal qatarien',  flag: '🇶🇦', bkamUnit: 1 },
  { code: 'DKK', name: 'Danish Krone',    nameFr: 'Couronne danoise', flag: '🇩🇰', bkamUnit: 1 },
  { code: 'NOK', name: 'Norwegian Krone', nameFr: 'Couronne norvégienne', flag: '🇳🇴', bkamUnit: 1 },
  { code: 'SEK', name: 'Swedish Krona',   nameFr: 'Couronne suédoise', flag: '🇸🇪', bkamUnit: 1 },
  { code: 'CNY', name: 'Chinese Yuan',    nameFr: 'Yuan chinois',    flag: '🇨🇳', bkamUnit: 1 },
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
You are the "JAD2FX Regulatory Assistant," a senior specialist in Moroccan FX regulation and Office des Changes compliance, operating as a knowledge tool for JAD2 Advisory (jad2advisory.com).

**Objective:**
Provide concise, legally grounded answers using ONLY the regulatory context documents provided in each query. Cite document titles and dates when referencing specific rules.

**Strict Legal Guidelines:**
1. **Brevity:** Answers under 120 words unless strictly necessary. Use bullet points.
2. **Citations:** Reference the circular or instruction title (e.g., "Per Circulaire 01/2024…").
3. **No Speculation:** Never predict MAD exchange rates or BKAM policy changes. Never recommend specific FX transactions.
4. **No Investment Advice:** You are an information tool only. Never provide personalized investment recommendations. You are not regulated by AMMC.
5. **Escalation on complexity:** If the user asks about hedging >100% exposure, capital repatriation, investissements marocains à l'étranger >5M MAD, blocked funds, or structured products, reply: "Ce cas est complexe et nécessite un conseil personnalisé. Nous vous recommandons de prendre rendez-vous avec les experts de JAD2 Advisory sur jad2advisory.com."
6. **Knowledge gap:** If the context does not cover the question, reply: "Ce scénario spécifique n'est pas couvert par nos documents de référence. Veuillez consulter directement l'Office des Changes à oc.gov.ma."
7. **Mandatory Footer:** End EVERY reply with: "*Information réglementaire uniquement — Pas de conseil en investissement au sens de la Loi n° 44-12 — Pour conseil personnalisé: jad2advisory.com*"
8. **Data Privacy:** Never ask users for personally identifiable information. Do not store or repeat personal data.

**Persona:** Professional (Big 4 / compliance style), Helpful, bilingual FR/EN, uses "JAD2 Advisory" when referring to the advisory entity.
`;
