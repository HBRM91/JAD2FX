export interface BasketConfig {
  eurWeight: number;
  usdWeight: number;
  referenceBasketValue: number;
  virementSpreadPercent: number;
  billetSpreadPercent: number;
  spreadPercent: number; // alias for virementSpreadPercent (backward compat)
  lastUpdated: string;
}

export interface CurrencyInfo {
  code: string;
  name: string;
  nameFr: string;
  flag: string;
  bkamUnit: number; // 1 for most currencies, 100 for JPY
}

export interface LiveRate {
  currency: string;
  pair: string;
  mid: number;          // MAD per 1 unit (or per 100 for JPY)
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

export type ViewState = 'HOME' | 'DASHBOARD' | 'ANALYSIS' | 'ABOUT';

export type DashboardTab = 'VIREMENTS' | 'BILLETS' | 'GLOBAL_FX';

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

export interface ChartDataPoint {
  time: string;
  value: number;
}
