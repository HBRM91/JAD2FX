export const APP_NAME = "Khouya FX";

export const THEME_COLORS = {
  NAVY: '#0F2645',
  GOLD: '#D4AF37',
  WHITE: '#FFFFFF',
  BG_LIGHT: '#F8FAFC'
};

export const DISCLAIMER_TEXT = "Disclaimer: All data and exchange rates provided on this platform are for informational purposes only and do not constitute financial advice or a binding offer. Rates are indicative and subject to change. Khouya FX accepts no liability for errors or omissions. Please verify with your financial institution and the Office des Changes.";

// Optimized Prompt: Short answers, Upsell logic, Strict Context
export const GEMINI_SYSTEM_INSTRUCTION = `
You are the "Khouya FX Regulatory Assistant," a senior consultant for the Moroccan FX market.

**Objective:**
Provide concise, legally grounded answers to regulatory questions using ONLY the provided context. If a case is complex, YOU MUST suggest contacting our experts.

**Strict Guidelines:**
1.  **Cost & Brevity:** Keep answers under 100 words unless absolutely necessary. Use bullet points.
2.  **No Speculation:** Never predict currency trends.
3.  **Upsell Mechanism:** If a user asks about "hedging," "large transfers (>1MDH)," "blocked funds," or "expatriation of assets," you MUST add this sentence: "This is a complex case. We recommend scheduling a consultation with our FX Structuring Experts for tailored assistance."
4.  **Context Only:** If the answer is not in the provided documents, say: "Reference documents do not cover this specific scenario. Please consult the Office des Changes."
5.  **Mandatory Footer:** End every message with: "*Info only. Not financial advice.*"

**Persona:**
Professional (Big 4 style), Helpful, Transparent. Use "We" (representing Khouya FX).
`;

// Mock Data for "Big 4" Style News Feed
export const MARKET_NEWS = [
  { id: 1, title: "EUR/USD Impact on Dirham Peg", category: "Global Markets", time: "2h ago", summary: "ECB rate cuts may tighten the spread against the Dirham basket." },
  { id: 2, title: "New Circular 09/2024 Analysis", category: "Regulation", time: "5h ago", summary: "Office des Changes eases prepayments for industrial machinery imports." },
  { id: 3, title: "Foreign Reserves Update", category: "Bank Al-Maghrib", time: "1d ago", summary: "Official reserves assets reached 360 billion MAD, covering 5 months of imports." }
];

// Mock Banks for Comparison
export const BANKS = ['Attijariwafa Bank', 'Banque Populaire', 'BMCE', 'CIH', 'Société Générale'];

export const MOCK_RATES_EUR = [
  { time: '08:00', value: 10.72 },
  { time: '09:00', value: 10.74 },
  { time: '10:00', value: 10.75 },
  { time: '11:00', value: 10.73 },
  { time: '12:00', value: 10.76 },
  { time: '13:00', value: 10.78 },
  { time: '14:00', value: 10.77 },
  { time: '15:00', value: 10.79 },
  { time: '16:00', value: 10.81 },
];

export const MOCK_RATES_USD = [
  { time: '08:00', value: 9.85 },
  { time: '09:00', value: 9.88 },
  { time: '10:00', value: 9.91 },
  { time: '11:00', value: 9.89 },
  { time: '12:00', value: 9.92 },
  { time: '13:00', value: 9.95 },
  { time: '14:00', value: 9.93 },
  { time: '15:00', value: 9.96 },
  { time: '16:00', value: 9.98 },
];