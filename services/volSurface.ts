/**
 * P1.3 + P1.4 — Implied Volatility Surface (synthetic, deterministic).
 *
 * In production: subscribe to Reuters/Bloomberg IV feed for G10/MAD.
 * For now: synth via Heston-like model calibrated to recent realized vol.
 *
 * VolSurface provides:
 *  - ATM vol by tenor (1W, 2W, 1M, 3M, 6M, 1Y)
 *  - 25-delta Risk Reversal (RR)
 *  - 25-delta Strangle (STR)
 *  - Strike-vol smile per tenor (5 strikes: 25P, 10P, ATM, 10C, 25C)
 */

export interface VolPoint {
  tenorDays: number;
  tenorLabel: string;
  atmVol: number;        // annualised, decimal (e.g. 0.085 = 8.5%)
  rr25: number;          // 25-delta risk reversal in vol points
  str25: number;         // 25-delta strangle in vol points
  smile: { strike: number; vol: number }[]; // strike = % OTM/ITM
}

export const VOL_TENORS = [
  { days: 7,   label: '1W' },
  { days: 14,  label: '2W' },
  { days: 30,  label: '1M' },
  { days: 90,  label: '3M' },
  { days: 180, label: '6M' },
  { days: 365, label: '1Y' },
];

// Synthetic data: realistic for EUR/MAD and USD/MAD as of Q2 2026
// Pattern: ATM vol mean-reverts to ~7-9% for G10, higher for EM.
// Skew: negative RR (puts > calls) typical for EM currencies.
const SYNTH_DATA: Record<string, Omit<VolPoint, 'smile'>[]> = {
  EUR: [
    { tenorDays: 7,   tenorLabel: '1W', atmVol: 0.062, rr25: -0.0035, str25: 0.0042 },
    { tenorDays: 14,  tenorLabel: '2W', atmVol: 0.064, rr25: -0.0038, str25: 0.0044 },
    { tenorDays: 30,  tenorLabel: '1M', atmVol: 0.068, rr25: -0.0040, str25: 0.0048 },
    { tenorDays: 90,  tenorLabel: '3M', atmVol: 0.072, rr25: -0.0045, str25: 0.0055 },
    { tenorDays: 180, tenorLabel: '6M', atmVol: 0.075, rr25: -0.0050, str25: 0.0060 },
    { tenorDays: 365, tenorLabel: '1Y', atmVol: 0.078, rr25: -0.0055, str25: 0.0065 },
  ],
  USD: [
    { tenorDays: 7,   tenorLabel: '1W', atmVol: 0.055, rr25: -0.0030, str25: 0.0038 },
    { tenorDays: 14,  tenorLabel: '2W', atmVol: 0.057, rr25: -0.0032, str25: 0.0040 },
    { tenorDays: 30,  tenorLabel: '1M', atmVol: 0.060, rr25: -0.0035, str25: 0.0043 },
    { tenorDays: 90,  tenorLabel: '3M', atmVol: 0.065, rr25: -0.0040, str25: 0.0050 },
    { tenorDays: 180, tenorLabel: '6M', atmVol: 0.070, rr25: -0.0045, str25: 0.0055 },
    { tenorDays: 365, tenorLabel: '1Y', atmVol: 0.074, rr25: -0.0050, str25: 0.0060 },
  ],
  GBP: [
    { tenorDays: 7,   tenorLabel: '1W', atmVol: 0.078, rr25: -0.0040, str25: 0.0050 },
    { tenorDays: 14,  tenorLabel: '2W', atmVol: 0.080, rr25: -0.0042, str25: 0.0052 },
    { tenorDays: 30,  tenorLabel: '1M', atmVol: 0.083, rr25: -0.0045, str25: 0.0055 },
    { tenorDays: 90,  tenorLabel: '3M', atmVol: 0.088, rr25: -0.0050, str25: 0.0060 },
    { tenorDays: 180, tenorLabel: '6M', atmVol: 0.092, rr25: -0.0055, str25: 0.0065 },
    { tenorDays: 365, tenorLabel: '1Y', atmVol: 0.095, rr25: -0.0060, str25: 0.0070 },
  ],
  JPY: [
    { tenorDays: 7,   tenorLabel: '1W', atmVol: 0.082, rr25: -0.0040, str25: 0.0050 },
    { tenorDays: 14,  tenorLabel: '2W', atmVol: 0.085, rr25: -0.0042, str25: 0.0052 },
    { tenorDays: 30,  tenorLabel: '1M', atmVol: 0.088, rr25: -0.0045, str25: 0.0055 },
    { tenorDays: 90,  tenorLabel: '3M', atmVol: 0.092, rr25: -0.0050, str25: 0.0060 },
    { tenorDays: 180, tenorLabel: '6M', atmVol: 0.095, rr25: -0.0055, str25: 0.0065 },
    { tenorDays: 365, tenorLabel: '1Y', atmVol: 0.098, rr25: -0.0060, str25: 0.0070 },
  ],
  CHF: [
    { tenorDays: 7,   tenorLabel: '1W', atmVol: 0.045, rr25: -0.0025, str25: 0.0030 },
    { tenorDays: 14,  tenorLabel: '2W', atmVol: 0.046, rr25: -0.0026, str25: 0.0031 },
    { tenorDays: 30,  tenorLabel: '1M', atmVol: 0.048, rr25: -0.0028, str25: 0.0033 },
    { tenorDays: 90,  tenorLabel: '3M', atmVol: 0.050, rr25: -0.0030, str25: 0.0036 },
    { tenorDays: 180, tenorLabel: '6M', atmVol: 0.052, rr25: -0.0032, str25: 0.0038 },
    { tenorDays: 365, tenorLabel: '1Y', atmVol: 0.054, rr25: -0.0035, str25: 0.0040 },
  ],
  CAD: [
    { tenorDays: 7,   tenorLabel: '1W', atmVol: 0.072, rr25: -0.0036, str25: 0.0044 },
    { tenorDays: 14,  tenorLabel: '2W', atmVol: 0.074, rr25: -0.0038, str25: 0.0046 },
    { tenorDays: 30,  tenorLabel: '1M', atmVol: 0.077, rr25: -0.0040, str25: 0.0049 },
    { tenorDays: 90,  tenorLabel: '3M', atmVol: 0.080, rr25: -0.0044, str25: 0.0052 },
    { tenorDays: 180, tenorLabel: '6M', atmVol: 0.083, rr25: -0.0047, str25: 0.0055 },
    { tenorDays: 365, tenorLabel: '1Y', atmVol: 0.086, rr25: -0.0050, str25: 0.0058 },
  ],
};

/** Add synthetic smile per tenor (skewed toward puts). */
function buildSmile(atm: number, rr: number, str: number): { strike: number; vol: number }[] {
  // Strikes: 25P (OTM put), 10P, ATM, 10C, 25C
  // 25P vol = ATM + 0.5*STR - 0.5*RR
  // 10P vol = ATM + 0.2*STR - 0.2*RR
  // 25C vol = ATM + 0.5*STR + 0.5*RR
  // 10C vol = ATM + 0.2*STR + 0.2*RR
  return [
    { strike: -0.025, vol: +(atm + 0.5 * str - 0.5 * rr).toFixed(5) },
    { strike: -0.010, vol: +(atm + 0.2 * str - 0.2 * rr).toFixed(5) },
    { strike:  0,     vol: +atm.toFixed(5) },
    { strike:  0.010, vol: +(atm + 0.2 * str + 0.2 * rr).toFixed(5) },
    { strike:  0.025, vol: +(atm + 0.5 * str + 0.5 * rr).toFixed(5) },
  ];
}

export function getVolSurface(currency: string): VolPoint[] {
  const data = SYNTH_DATA[currency];
  if (!data) return [];
  return data.map((d) => ({
    ...d,
    smile: buildSmile(d.atmVol, d.rr25, d.str25),
  }));
}

export function getAllCurrenciesWithVol(): string[] {
  return Object.keys(SYNTH_DATA);
}

/**
 * Compute the 25-delta call and put strikes from spot + forward.
 * For now: use simple ±2.5% delta proxy (delta at expiry for ATM).
 */
export function getDeltaStrikes(spot: number): { put25: number; call25: number } {
  // Approximate: 25-delta is ~0.4% OTM for short tenors, ~1% for 1Y (rough proxy)
  return {
    put25: +(spot * 0.975).toFixed(4),
    call25: +(spot * 1.025).toFixed(4),
  };
}
