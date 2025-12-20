export interface BasketConfig {
  eurWeight: number; // e.g., 0.60
  usdWeight: number; // e.g., 0.40
  referenceBasketValue: number; // The constant K
  spreadPercent: number; // e.g., 0.05
  lastUpdated: string;
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
  marketGap: number; // Percentage difference from market avg
}

export type ViewState = 'HOME' | 'DASHBOARD' | 'ANALYSIS' | 'ADMIN' | 'ABOUT';

export type DashboardTab = 'VIREMENTS' | 'BILLETS' | 'GLOBAL_FX';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isUpsell?: boolean;
}
