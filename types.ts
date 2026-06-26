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
  nameAr: string;
  flag: string;
  countryCode: string;
  bkamUnit: number;
  /** Doc 1 §I.1.b: UMA currencies (TND, DZD, LYD) use bilateral convention rates,
   *  NOT market cross-rates from ECB. Their cross-USD are set per the Convention de
   *  paiement bilatérale unifiée des Banques centrales UMA. */
  umaConvention?: boolean;
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
  isCapped?: boolean;
  feedStatus?: 'LIVE' | 'DELAYED' | 'STALE' | 'FALLBACK';
  /** Basket formula central parity (K / (w_EUR×EUR/USD + w_USD)) scaled by bkamUnit.
   *  This is the regulatory reference midpoint from which the ±5% band is measured.
   *  Doc 1 §I.1: USD/MAD_central = K / (0.60 × EUR/USD + 0.40), K ≈ 10.49. */
  centralParity?: number;
  /** Band utilisation 0–100%: position of mid within the ±5% regulatory band.
   *  50% = at central parity; <35% = lower zone; >65% = upper zone.
   *  Doc 3, Art 3: banks must apply rates within BKAM-published fluctuation bands. */
  bandUtilPct?: number;
  /** True for TND/DZD/LYD: rates set by UMA bilateral convention, not ECB market.
   *  Doc 1 §I.1.b footnote. */
  umaConvention?: boolean;
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

// ─── Client Tiers ─────────────────────────────────────────────────────────────
export type ClientTier = 'CORPORATE' | 'SME' | 'TPE' | 'INDIVIDUAL';

export interface TierConfig {
  label: string;
  labelFr: string;
  description: string;
  virementCommBps: number;   // commercial commission on top of BKAM fixing (bps)
  billetCommBps: number;     // commercial commission for banknotes (bps)
  forwardMarkupBps: number;  // forward markup for this tier (bps)
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
  tierCommissions: Record<ClientTier, TierConfig>;
  corsProxyUrl: string;
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

// ─── BKAM Fixing ─────────────────────────────────────────────────────────────
export interface FixingDayRow {
  date: string;           // ISO "2025-06-23"
  dateLabel: string;      // "Lun 23 Juin"
  eurUsd: number;         // EUR/USD from ECB

  // EUR/MAD
  eurMad_ecb: number;     // ECB reference rate (proxy for BKAM fixing)
  eurMad_basket: number;  // Theoretical BKAM basket parity
  eurMad_div_bps: number; // Divergence (actual − basket) × 10 000
  eurMad_div_pct: number; // Divergence as % of basket

  // USD/MAD
  usdMad_ecb: number;
  usdMad_basket: number;
  usdMad_div_bps: number;

  // All 20 currency cross-rates against MAD (bkamUnit applied)
  allRates: Record<string, number>;

  source: 'BKAM_OFFICIAL' | 'ECB_PROXY' | 'COMPUTED';
}

// ─── Commodities ─────────────────────────────────────────────────────────────
export type CommodityCategory = 'ENERGY' | 'PRECIOUS_METALS' | 'INDUSTRIAL_METALS' | 'AGRICULTURE';

export interface CommodityQuote {
  symbol: string;
  name: string;
  nameFr: string;
  nameAr: string;
  category: CommodityCategory;
  price: number;
  change: number;
  changePercent: number;
  high52w: number;
  low52w: number;
  madEquiv: number;
  unit: string;
  source: 'LIVE' | 'FALLBACK';
  moroccanRelevance: string;
  moroccanRelevanceFr: string;
  moroccanRelevanceAr: string;
  timestamp: string;
}

// ─── Audit ────────────────────────────────────────────────────────────────────
export interface AuditEntry {
  id: string;
  time: string;
  action: string;
  detail: string;
  user: 'ADMIN';
}

// ─── Navigation ───────────────────────────────────────────────────────────────
export type ViewState = 'HOME' | 'DASHBOARD' | 'ANALYSIS' | 'FIXING' | 'BILLETS' | 'COMMODITIES' | 'FORWARDS' | 'SWAPS' | 'LIVE' | 'ADMIN' | 'ABOUT' | 'REPORT' | 'REGULATIONS' | 'BANDS' | 'RESOURCES' | 'CONTACT' | 'RESEARCH' | 'ABOUT_JAD2' | 'TOOL_OC_ASSESS' | 'TOOL_CORRIDOR' | 'TOOL_INVOICE' | 'TOOL_FWD_EXT' | 'SECTOR_AUTO' | 'SECTOR_TEXTILE' | 'SECTOR_NORDIQUE' | 'SECTOR_AGRI';
export type DashboardTab = 'VIREMENTS' | 'BILLETS' | 'GLOBAL_FX';

// ─── Market Reports ───────────────────────────────────────────────────────────

export interface RadarEntry {
  currency: string;
  flag: string;
  currentRate: number;
  weeklyChangeBps: number;
  headline: string;
  headlineAr: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  expectation: string;
  expectationAr: string;
  sourceUrl?: string;
}

export interface MarketReport {
  id: string;
  createdAt: string;
  publishedAt: string | null;
  titleFr: string;
  titleAr: string;
  excerptFr: string;
  excerptAr: string;
  contentFr: string;
  contentAr: string;
  radarData: RadarEntry[];
  llmModel: string;
  tavilyQueries: string[];
  adminNotes: string;
  isPublished: boolean;
  generation: {
    durationMs: number;
    tavilySearchCount: number;
  };
}

export interface ReportSettings {
  editorialLine: string;
  editorialLineAr: string;
  defaultQueries: string[];
  defaultModel: string;
  autoPublish: boolean;
}

// ─── Chat ─────────────────────────────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isUpsell?: boolean;
  provider?: string;
  isFallback?: boolean;
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
