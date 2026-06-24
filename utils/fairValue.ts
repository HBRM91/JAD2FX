import { BasketConfig, FairValueResult } from '../types';

/**
 * Calculates MAD fair value from the BKAM currency basket.
 * Formula: USD/MAD = K / (wEUR × EUR_USD + wUSD)
 *          EUR/MAD = USD/MAD × EUR_USD
 */
export const calculateFairValue = (
  globalEurUsd: number,
  config: BasketConfig
): { eurMad: FairValueResult; usdMad: FairValueResult } => {
  const { eurWeight, usdWeight, referenceBasketValue } = config;
  const spread = config.virementSpreadPercent ?? config.spreadPercent ?? 0.008;

  const usdMadMid = referenceBasketValue / (eurWeight * globalEurUsd + usdWeight);
  const eurMadMid = usdMadMid * globalEurUsd;

  const build = (pair: string, mid: number): FairValueResult => ({
    pair,
    mid: +mid.toFixed(4),
    theoreticalBuy:  +(mid * (1 - spread)).toFixed(4),
    theoreticalSell: +(mid * (1 + spread)).toFixed(4),
    marketGap: 0,
  });

  return {
    eurMad: build('EUR/MAD', eurMadMid),
    usdMad: build('USD/MAD', usdMadMid),
  };
};

export const formatCurrency = (val: number) =>
  new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(val);
