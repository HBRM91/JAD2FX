// ─── Basket / FX Engine ───────────────────────────────────────────────────────
export interface BasketConfig {
  eurWeight: number;
  usdWeight: number;
  referenceBasketValue: number;
  virementSpreadPercent: number;
  billetSpreadPercent: number;
  spreadPercent: number;
  lastUpdated: string;
}

export interface CurrencyInfo {
  code: string;
  name: string;
  nameFr: string;
  flag: string;
  bkamUnit: number;
}

export interface LiveRate {
  currency: string;
  pair: string;
  mid: number;
  virementBuy: number;
  virementSell: number;
  billetBuy: number;
  billetSell: number;
  change24h: number;
  source: 'CALCULATED' | 'CACHED' | 'FALLBACK';
  timestamp: string;
}

export interface BankRate {
  bankName: string;
  buyRate: number;
  sellRate: number;
  lastUpdate: string;
}

export interface FairValueResult {
  pair: string;
  mid: number;
  theoreticalBuy: number;
  theoreticalSell: number;
  marketGap: number;
}

export interface ChartDataPoint {
  time: string;
  value: number;
}

// ─── Interest Rates & Yield Curves ───────────────────────────────────────────
export interface YieldCurvePoint {
  tenor: string;       // e.g. 'ON', '3M', '1Y'
  tenorYears: number;  // fractional years
  rate: number;        // decimal, e.g. 0.035 = 3.5%
}

export interface YieldCurveSnapshot {
  currency: string;
  label: string;       // display name, e.g. 'Morocco MAD'
  benchmark: string;   // e.g. 'BKAM / OAT'
  points: YieldCurvePoint[];
  isOverridden?: boolean;
}

// ─── FX Forwards ─────────────────────────────────────────────────────────────
export interface ForwardQuote {
  pair: string;
  currency: string;
  spot: number;
  tenorLabel: string;
  tenorDays: number;
  tenorYears: number;
  forwardRate: number;
  forwardPointsRaw: number;  // F - S
  forwardPointsPips: number; // (F - S) × 10000
  madRate: number;
  fcyRate: number;
  notional: number;
  direction: 'BUY' | 'SELL';
  netCostMAD: number;        // notional × |F - S|
  timestamp: string;
}

export type ForwardTenor = 'ON' | 'TN' | 'SW' | '1M' | '2M' | '3M' | '6M' | '9M' | '1Y' | '2Y' | '3Y' | '5Y' | 'CUSTOM';

// ─── FX Swaps & Rolls ─────────────────────────────────────────────────────────
export interface SwapLeg {
  label: 'NEAR' | 'FAR';
  tenorLabel: string;
  tenorDays: number;
  tenorYears: number;
  rate: number;
  forwardPointsPips: number;
  direction: 'BUY' | 'SELL';
}

export interface FxSwapQuote {
  pair: string;
  currency: string;
  spot: number;
  notional: number;
  nearLeg: SwapLeg;
  farLeg: SwapLeg;
  swapPointsPips: number;
  swapPointsRaw: number;
  madRateNear: number;
  madRateFar: number;
  fcyRateNear: number;
  fcyRateFar: number;
  timestamp: string;
}

export interface RollEvent {
  id: string;
  type: 'ROLLOVER' | 'ROLLUNDER';
  pair: string;
  fromTenor: string;
  toTenor: string;
  fromRate: number;
  toRate: number;
  spot: number;
  rollCostPips: number;
  rollCostMAD: number;
  notional: number;
  timestamp: string;
}

// ─── Live Price Stream ────────────────────────────────────────────────────────
export interface LivePriceEntry {
  currency: string;
  pair: string;
  bid: number;
  ask: number;
  mid: number;
  prevMid: number;
  change: number;
  changePercent: number;
  spreadPips: number;
  lastUpdated: string;
}

// ─── Admin ────────────────────────────────────────────────────────────────────
export interface AdminConfig {
  refreshIntervalMs: number;
  spotOverrides: Record<string, number>;
  curveOverrides: Record<string, Record<string, number>>;
  forwardMarkupBps: number;
  virementSpreadPct: number;
  billetSpreadPct: number;
  dealerSpreadPips: Record<string, number>;
  isLive: boolean;
  alertThresholds: { pair: string; min: number; max: number; enabled: boolean }[];
}

export interface BlotterEntry {
  id: string;
  time: string;
  action: 'SPOT' | 'FORWARD' | 'SWAP' | 'ROLL' | 'OVERRIDE' | 'ALERT';
  pair: string;
  tenor?: string;
  rate: number;
  fwdPtsPips?: number;
  notional?: number;
  details?: string;
}

// ─── Navigation ───────────────────────────────────────────────────────────────
export type ViewState = 'HOME' | 'DASHBOARD' | 'ANALYSIS' | 'FORWARDS' | 'SWAPS' | 'LIVE' | 'ADMIN' | 'ABOUT';
export type DashboardTab = 'VIREMENTS' | 'BILLETS' | 'GLOBAL_FX';

// ─── Chat ─────────────────────────────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isUpsell?: boolean;
}

export interface RegDocument {
  id: string;
  title: string;
  type: 'CIRCULAIRE' | 'INSTRUCTION' | 'COMMUNIQUE' | 'NOTE' | 'LOI';
  date: string;
  summary: string;
  content: string;
  keywords: string[];
}
