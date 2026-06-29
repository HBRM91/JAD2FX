/**
 * Intraday tick data fetcher — replaces synthetic sine wave (F7).
 *
 * Strategy:
 *   1. Try Yahoo Finance via worker proxy for true intraday ticks.
 *   2. If unavailable, return empty with `dataSource: 'END_OF_DAY'` and let
 *      the UI show the spot only (no fake chart).
 *
 * IMPORTANT: Never fabricate tick data. If we don't have real ticks, we say so.
 */

import { ChartDataPoint } from '../types';

export interface IntradayResult {
  points: ChartDataPoint[];
  dataSource: 'YAHOO_INTRADAY' | 'END_OF_DAY' | 'STALE';
  /** ISO timestamp of when the source data was published. */
  sourceTimestamp: string | null;
  /** Free-form message for UI display when there is no intraday. */
  message: string | null;
}

/**
 * Fetch intraday 1h ticks for a currency pair from the worker.
 *
 * @param corsProxy Worker base URL (e.g. https://jad2fx-yahoo-proxy...workers.dev)
 * @param pair Yahoo symbol, e.g. "EURUSD=X"
 */
export async function fetchIntradayTicks(
  corsProxy: string,
  pair: string,
): Promise<IntradayResult> {
  if (!corsProxy) {
    return {
      points: [],
      dataSource: 'END_OF_DAY',
      sourceTimestamp: null,
      message: 'Données intraday indisponibles (proxy non configuré) — affichage du fixing.',
    };
  }
  try {
    const res = await fetch(`${corsProxy.replace(/\/$/, '')}/api/intraday/${encodeURIComponent(pair)}`, {
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) {
      return {
        points: [],
        dataSource: 'END_OF_DAY',
        sourceTimestamp: null,
        message: `Données intraday indisponibles (HTTP ${res.status}) — affichage du fixing.`,
      };
    }
    const data = (await res.json()) as {
      points?: Array<{ t: string; v: number }>;
      timestamp?: string;
    };
    const points: ChartDataPoint[] = (data.points ?? [])
      .filter((p) => Number.isFinite(p.v))
      .map((p) => ({ time: p.t, value: p.v }));
    if (points.length === 0) {
      return {
        points: [],
        dataSource: 'END_OF_DAY',
        sourceTimestamp: data.timestamp ?? null,
        message: 'Pas de ticks intraday disponibles pour cette paire — affichage du fixing.',
      };
    }
    return {
      points,
      dataSource: 'YAHOO_INTRADAY',
      sourceTimestamp: data.timestamp ?? null,
      message: null,
    };
  } catch (err) {
    return {
      points: [],
      dataSource: 'END_OF_DAY',
      sourceTimestamp: null,
      message: `Données intraday indisponibles (${err instanceof Error ? err.message : 'erreur'}) — affichage du fixing.`,
    };
  }
}

/**
 * Pair-symbol mapping for Yahoo Finance.
 * BKAM-quoted currencies have a MAD cross; non-BKAM use USD as anchor.
 */
const YAHOO_PAIRS: Record<string, { yahoo: string; isMad: boolean }> = {
  EUR: { yahoo: 'EURMAD=X', isMad: true },
  USD: { yahoo: 'USDMAD=X', isMad: true },
  GBP: { yahoo: 'GBPMAD=X', isMad: true },
  CHF: { yahoo: 'CHFMAD=X', isMad: true },
  JPY: { yahoo: 'JPYMAD=X', isMad: true },
  CAD: { yahoo: 'CADMAD=X', isMad: true },
  NOK: { yahoo: 'NOKMAD=X', isMad: true },
  SEK: { yahoo: 'SEKMAD=X', isMad: true },
  DKK: { yahoo: 'DKKMAD=X', isMad: true },
  CNY: { yahoo: 'CNYMAD=X', isMad: true },
  SAR: { yahoo: 'SARMAD=X', isMad: true },
  AED: { yahoo: 'AEDMAD=X', isMad: true },
  QAR: { yahoo: 'QARMAD=X', isMad: true },
  KWD: { yahoo: 'KWDMAD=X', isMad: true },
  OMR: { yahoo: 'OMRMAD=X', isMad: true },
  BHD: { yahoo: 'BHDMAD=X', isMad: true },
  JOD: { yahoo: 'JODMAD=X', isMad: true },
  TND: { yahoo: 'TNDMAD=X', isMad: true },
  DZD: { yahoo: 'DZDMAD=X', isMad: true },
  LYD: { yahoo: 'LYDMAD=X', isMad: true },
  ZAR: { yahoo: 'ZARMAD=X', isMad: true },
  INR: { yahoo: 'INRMAD=X', isMad: true },
  BRL: { yahoo: 'BRLMAD=X', isMad: true },
  TRY: { yahoo: 'TRYMAD=X', isMad: true },
};

export function getYahooSymbol(currency: string): string | null {
  return YAHOO_PAIRS[currency]?.yahoo ?? null;
}
