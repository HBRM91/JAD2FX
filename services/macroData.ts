/**
 * Money market & inflation data — Maroc + G10.
 *
 * P1.9 (Money market) + P1.11 (Inflation/PPP) — combined into a single macro
 * data module since they share the same display + data source pattern.
 *
 * Data sources:
 *   - BAM publishes MONIA (Moroccan Overnight Index Average) daily.
 *   - BAM policy rate (currently 2.75% in our hardcoded curves).
 *   - BAM publishes weekly monetary aggregates (M1, M2, M3) + reserve requirements.
 *   - HCP (Haut-Commissariat au Plan) publishes monthly CPI.
 *   - ECB / Fed / BOE / SNB publish policy rates + CPI for G10.
 *
 * In production these come from a daily cron → KV → /api/macro/* routes.
 * For now, the macro module exposes both:
 *   - a default (hardcoded) snapshot for offline / fallback
 *   - a fetch path for live data
 */

export interface MoneyMarketPoint {
  currency: string;
  label: string;
  policyRate: number;       // decimal, e.g. 0.0275
  overnightRate: number;    // decimal — MONIA for MAD, SOFR/€STR/etc.
  reserveRequirementPct: number; // decimal, e.g. 0.03 for 3% (MAD banks)
  fxReservesUSDbn?: number; // FX reserves in USD bn (for MAD only)
  lastUpdated: string;      // ISO date
}

export interface InflationPoint {
  country: string;
  currency: string;
  cpiYoYPct: number;        // % YoY headline CPI
  cpiCoreYoYPct: number;    // % YoY core CPI
  lastUpdated: string;
}

export interface MoroccoMacroKpi {
  id: string;
  label: string;
  value: number;
  unit: string;             // 'USDbn', '%', 'Mds MAD'
  year: number;             // reference year
  trend?: 'UP' | 'DOWN' | 'FLAT';
  source: 'BKAM' | 'HCP' | 'OC' | 'ONS' | 'Ministry of Tourism';
}

export interface FairValuePppResult {
  pair: string;
  spot: number;
  pppLongTerm: number;
  deviationPct: number;     // (spot - ppp) / ppp × 100
  interpretation: string;
}

// Default money market snapshot — updated quarterly in production via cron
export const DEFAULT_MONEY_MARKET: MoneyMarketPoint[] = [
  { currency: 'MAD', label: 'Maroc',           policyRate: 0.0275, overnightRate: 0.0250, reserveRequirementPct: 0.03,  fxReservesUSDbn: 36.5, lastUpdated: '2026-06-26' },
  { currency: 'EUR', label: 'Zone Euro',       policyRate: 0.0225, overnightRate: 0.0215, reserveRequirementPct: 0.01,  lastUpdated: '2026-06-26' },
  { currency: 'USD', label: 'États-Unis',      policyRate: 0.0475, overnightRate: 0.0433, reserveRequirementPct: 0.00,  lastUpdated: '2026-06-26' },
  { currency: 'GBP', label: 'Royaume-Uni',     policyRate: 0.0425, overnightRate: 0.0420, reserveRequirementPct: 0.00,  lastUpdated: '2026-06-26' },
  { currency: 'CHF', label: 'Suisse',          policyRate: 0.0025, overnightRate: 0.0025, reserveRequirementPct: 0.00,  lastUpdated: '2026-06-26' },
  { currency: 'JPY', label: 'Japon',           policyRate: 0.0050, overnightRate: 0.0050, reserveRequirementPct: 0.00,  lastUpdated: '2026-06-26' },
  { currency: 'CAD', label: 'Canada',          policyRate: 0.0325, overnightRate: 0.0330, reserveRequirementPct: 0.00,  lastUpdated: '2026-06-26' },
  { currency: 'CNY', label: 'Chine',           policyRate: 0.0300, overnightRate: 0.0205, reserveRequirementPct: 0.07,  lastUpdated: '2026-06-26' },
];

// Default inflation snapshot (annual % YoY)
export const DEFAULT_INFLATION: InflationPoint[] = [
  { country: 'Maroc',         currency: 'MAD', cpiYoYPct: 2.1, cpiCoreYoYPct: 1.8, lastUpdated: '2026-06-26' },
  { country: 'Zone Euro',     currency: 'EUR', cpiYoYPct: 1.9, cpiCoreYoYPct: 2.2, lastUpdated: '2026-06-26' },
  { country: 'États-Unis',    currency: 'USD', cpiYoYPct: 2.7, cpiCoreYoYPct: 2.8, lastUpdated: '2026-06-26' },
  { country: 'Royaume-Uni',   currency: 'GBP', cpiYoYPct: 2.4, cpiCoreYoYPct: 3.1, lastUpdated: '2026-06-26' },
  { country: 'Suisse',        currency: 'CHF', cpiYoYPct: 0.6, cpiCoreYoYPct: 0.8, lastUpdated: '2026-06-26' },
  { country: 'Japon',         currency: 'JPY', cpiYoYPct: 1.5, cpiCoreYoYPct: 1.2, lastUpdated: '2026-06-26' },
  { country: 'Canada',        currency: 'CAD', cpiYoYPct: 1.9, cpiCoreYoYPct: 1.6, lastUpdated: '2026-06-26' },
  { country: 'Chine',         currency: 'CNY', cpiYoYPct: 0.3, cpiCoreYoYPct: 0.4, lastUpdated: '2026-06-26' },
];

// A1.4–A1.8 — Morocco structural macro indicators (BKAM / HCP / ONS, 2024 reference)
// Source: BKAM Annual Report 2024, HCP, Office des Changes.
export const MOROCCO_MACRO_KPIS: MoroccoMacroKpi[] = [
  { id: 'gdp_growth',     label: 'PIB · Croissance réelle',          value: 3.4,    unit: '%',       year: 2024, trend: 'UP',   source: 'HCP' },
  { id: 'unemployment',   label: 'Taux de chômage (15+)',             value: 13.3,   unit: '%',       year: 2024, trend: 'DOWN', source: 'HCP' },
  { id: 'mre_remit',      label: 'Transferts MRE',                    value: 117.5,  unit: 'Mds MAD', year: 2024, trend: 'UP',   source: 'OC'  },
  { id: 'tourism',        label: 'Recettes touristiques',             value: 96.5,   unit: 'Mds MAD', year: 2024, trend: 'UP',   source: 'Ministry of Tourism' },
  { id: 'current_account',label: 'Solde courant (% PIB)',             value: -1.2,   unit: '%',       year: 2024, trend: 'UP',   source: 'OC'  },
];

/**
 * Compute long-term fair value using PPP (Purchasing Power Parity).
 *
 *   PPP_target = Spot × ∏((1 + π_d) / (1 + π_f)) ^ years
 *
 * For long-term (5Y+): spot converges toward the inflation differential.
 * We expose both 5Y and 10Y fair values.
 */
export function computePppFairValue(
  pair: string,
  spot: number,
  domesticCpiPct: number,
  foreignCpiPct: number,
  years: 5 | 10 = 5,
): FairValuePppResult {
  const dom = domesticCpiPct / 100;
  const fgn = foreignCpiPct / 100;
  // Compounded inflation differential
  const ratio = Math.pow((1 + dom) / (1 + fgn), years);
  const pppLongTerm = +(spot * ratio).toFixed(4);
  const deviationPct = +(((spot - pppLongTerm) / pppLongTerm) * 100).toFixed(2);
  const direction = spot > pppLongTerm ? 'MAD sous-évalué' : 'MAD surévalué';
  const interpretation =
    spot > pppLongTerm
      ? `${pair} spot ${deviationPct}% au-dessus du PPP ${years}Y — ${direction} (PPP suggère un retour vers ${pppLongTerm} sur le long terme)`
      : `${pair} spot ${Math.abs(deviationPct)}% en-dessous du PPP ${years}Y — ${direction} (PPP suggère une appréciation vers ${pppLongTerm} sur le long terme)`;
  return { pair, spot, pppLongTerm, deviationPct, interpretation };
}
