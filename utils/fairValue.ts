import { BasketConfig, FairValueResult } from '../types';

/**
 * Calculates the "Fair Value" of MAD based on the currency basket.
 * Formula Approximation: MAD = K / (wEUR * EURUSD + wUSD)
 * 
 * @param globalEurUsd Live Global EUR/USD rate
 * @param config System configuration (weights and spread)
 */
export const calculateFairValue = (
  globalEurUsd: number,
  config: BasketConfig
): { eurMad: FairValueResult, usdMad: FairValueResult } => {
  
  const { eurWeight, usdWeight, referenceBasketValue, spreadPercent } = config;

  // 1. Calculate Theoretical USD/MAD Mid
  // Based on the basket structure where MAD is pegged to a specific weighted sum
  const theoreticalUsdMadMid = referenceBasketValue / ((eurWeight * globalEurUsd) + usdWeight);

  // 2. Derive Theoretical EUR/MAD Mid (Cross Rate)
  const theoreticalEurMadMid = theoreticalUsdMadMid * globalEurUsd;

  // 3. Helper to structure result
  const buildResult = (pair: string, mid: number): FairValueResult => {
    return {
      pair,
      mid: parseFloat(mid.toFixed(4)),
      theoreticalBuy: parseFloat((mid * (1 - spreadPercent)).toFixed(4)),
      theoreticalSell: parseFloat((mid * (1 + spreadPercent)).toFixed(4)),
      marketGap: 0 // To be calculated against scraped bank data
    };
  };

  return {
    eurMad: buildResult('EUR/MAD', theoreticalEurMadMid),
    usdMad: buildResult('USD/MAD', theoreticalUsdMadMid)
  };
};

export const formatCurrency = (val: number) => 
  new Intl.NumberFormat('en-MA', { style: 'currency', currency: 'MAD' }).format(val);
