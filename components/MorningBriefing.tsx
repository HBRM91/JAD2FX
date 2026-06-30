/**
 * Morning Briefing â€” Chief Strategist FX Dashboard
 * Institutional-grade daily briefing for corporate treasury.
 * Publishes at 09:00 Casablanca (matches Worker cron).
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  Activity, Calendar, TrendingUp, TrendingDown, Minus,
  AlertTriangle, ChevronRight, RefreshCw, Globe, Clock,
  Shield, BarChart2, Zap, Download, FileText, Building2,
  ArrowUp, ArrowDown, Target, Info, Mail, CheckCircle, Send,
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { useI18n } from '../context/I18nContext';
import { getPublishedReport } from '../services/reportStorage';
import { fetchAllMadRates } from '../services/fxRates';
import { MarketReport, LivePriceEntry } from '../types';
import { DEFAULT_BASKET_CONFIG, BKAM_CURRENCIES } from '../constants';
import CurrencyFlag from './CurrencyFlag';

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type BriefingTab = 'OVERVIEW' | 'CALENDAR' | 'ANALYSIS';
type NlStatus = 'idle' | 'loading' | 'success' | 'error';

interface CalendarEvent {
  date: string;          // ISO YYYY-MM-DD
  titleFr: string;
  titleEn: string;
  type: 'FOMC' | 'ECB' | 'BKAM' | 'NFP' | 'CPI_US' | 'CPI_EU' | 'OIL' | 'TRADE';
  currency: 'USD' | 'EUR' | 'MAD' | 'GLOBAL';
  countryCode: string;
  impact: 'DIRECT' | 'HIGH' | 'MEDIUM' | 'LOW';
  noteFr: string;
  noteEn: string;
  hasProjections?: boolean;
}

interface SentimentResult {
  label: string;
  labelEn: string;
  score: number;       // 0â€“100 (higher = more MAD depreciation pressure)
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL'; // for MAD (BULLISH = MAD strengthening)
  drivers: string[];
}

interface BandData {
  currency: string;
  pairLabel: string;
  countryCode: string;
  current: number;
  central: number;
  lower: number;
  upper: number;
  utilPct: number;       // 0â€“100 position in band
  driftBps: number;      // current vs central in bps
  change24h: number;
}

// â”€â”€â”€ 2026 Economic Calendar (key macro events impacting MAD) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const CALENDAR_2026: CalendarEvent[] = [
  // FOMC â€” 8 meetings
  { date: '2026-01-29', titleFr: 'FOMC â€” Décision Fed', titleEn: 'FOMC Rate Decision', type: 'FOMC', currency: 'USD', countryCode: 'us', impact: 'HIGH', noteFr: '40% du panier MAD. Toute surpri­se hawkish apprécie le USD/MAD.', noteEn: '40% of MAD basket. Hawkish surprise lifts USD/MAD.', },
  { date: '2026-03-19', titleFr: 'FOMC â€” Décision + Dot Plot', titleEn: 'FOMC + SEP Projections', type: 'FOMC', currency: 'USD', countryCode: 'us', impact: 'HIGH', hasProjections: true, noteFr: 'Réunion avec projections économiques (dot plot). Impact USD élevé.', noteEn: 'Summary of Economic Projections â€” high USD volatility expected.', },
  { date: '2026-05-07', titleFr: 'FOMC â€” Décision Fed', titleEn: 'FOMC Rate Decision', type: 'FOMC', currency: 'USD', countryCode: 'us', impact: 'HIGH', noteFr: 'Réunion sans projections. Surveillez le statement et conférence Powell.', noteEn: 'No SEP. Watch statement language and Powell presser.', },
  { date: '2026-06-18', titleFr: 'FOMC â€” Décision + Dot Plot', titleEn: 'FOMC + SEP Projections', type: 'FOMC', currency: 'USD', countryCode: 'us', impact: 'HIGH', hasProjections: true, noteFr: 'Réunion mi-année avec dot plot. Pivot point clé pour H2 2026.', noteEn: 'Mid-year SEP â€” key pivot for H2 2026 USD direction.', },
  { date: '2026-07-30', titleFr: 'FOMC â€” Décision Fed', titleEn: 'FOMC Rate Decision', type: 'FOMC', currency: 'USD', countryCode: 'us', impact: 'HIGH', noteFr: 'Réunion été. Sensible aux données emploi du mois précédent.', noteEn: 'Summer meeting. Highly sensitive to prior NFP print.', },
  { date: '2026-09-17', titleFr: 'FOMC â€” Décision + Dot Plot', titleEn: 'FOMC + SEP Projections', type: 'FOMC', currency: 'USD', countryCode: 'us', impact: 'HIGH', hasProjections: true, noteFr: 'Dot plot Q3 â€” réévaluation trajectoire taux. Décisif pour T4.', noteEn: 'Q3 SEP â€” recalibration of rate path. Decisive for Q4.', },
  { date: '2026-11-05', titleFr: 'FOMC â€” Décision Fed', titleEn: 'FOMC Rate Decision', type: 'FOMC', currency: 'USD', countryCode: 'us', impact: 'HIGH', noteFr: 'Réunion post-élections (si applicable). Risque politique élevé.', noteEn: 'Post-election meeting (if applicable). Elevated political risk.', },
  { date: '2026-12-17', titleFr: 'FOMC â€” Décision + Dot Plot', titleEn: 'FOMC + SEP Projections', type: 'FOMC', currency: 'USD', countryCode: 'us', impact: 'HIGH', hasProjections: true, noteFr: 'Dernière réunion 2026. Dot plot définit les attentes 2027.', noteEn: 'Final 2026 meeting. SEP sets 2027 expectations.', },
  // ECB â€” 8 meetings
  { date: '2026-01-30', titleFr: 'BCE â€” Conseil des gouverneurs', titleEn: 'ECB Governing Council', type: 'ECB', currency: 'EUR', countryCode: 'eu', impact: 'HIGH', noteFr: 'EUR = 60% panier MAD. La BCE est le principal driver externe du MAD.', noteEn: 'EUR = 60% of MAD basket. ECB is the primary external MAD driver.', },
  { date: '2026-03-05', titleFr: 'BCE â€” Conseil des gouverneurs', titleEn: 'ECB Governing Council', type: 'ECB', currency: 'EUR', countryCode: 'eu', impact: 'HIGH', noteFr: 'Réunion de printemps. Projections macroéconomiques trimestrielles.', noteEn: 'Spring meeting with quarterly macroeconomic projections.', },
  { date: '2026-04-23', titleFr: 'BCE â€” Conseil des gouverneurs', titleEn: 'ECB Governing Council', type: 'ECB', currency: 'EUR', countryCode: 'eu', impact: 'HIGH', noteFr: 'Réunion sans projections. Focus sur inflation zone euro.', noteEn: 'No projections. Focus on eurozone inflation trajectory.', },
  { date: '2026-06-04', titleFr: 'BCE â€” Conseil + Projections', titleEn: 'ECB Governing Council + Projections', type: 'ECB', currency: 'EUR', countryCode: 'eu', impact: 'HIGH', noteFr: 'Projections Q2. Impact majeur sur EUR/MAD et panier BKAM.', noteEn: 'Q2 projections. Major EUR/MAD and BKAM basket impact.', },
  { date: '2026-07-23', titleFr: 'BCE â€” Conseil des gouverneurs', titleEn: 'ECB Governing Council', type: 'ECB', currency: 'EUR', countryCode: 'eu', impact: 'HIGH', noteFr: 'Réunion estivale. Historiquement plus calme, sauf choc exogène.', noteEn: 'Summer meeting. Historically quieter unless exogenous shock.', },
  { date: '2026-09-10', titleFr: 'BCE â€” Conseil + Projections', titleEn: 'ECB Governing Council + Projections', type: 'ECB', currency: 'EUR', countryCode: 'eu', impact: 'HIGH', noteFr: 'Projections Q3 post-été. Point d\'inflexion potentiel EUR/USD.', noteEn: 'Post-summer Q3 projections. Potential EUR/USD inflection.', },
  { date: '2026-10-29', titleFr: 'BCE â€” Conseil des gouverneurs', titleEn: 'ECB Governing Council', type: 'ECB', currency: 'EUR', countryCode: 'eu', impact: 'HIGH', noteFr: 'Avant-dernière réunion. Orientations pour fin d\'année.', noteEn: 'Penultimate meeting. Sets year-end EUR guidance.', },
  { date: '2026-12-10', titleFr: 'BCE â€” Conseil + Projections', titleEn: 'ECB Governing Council + Projections', type: 'ECB', currency: 'EUR', countryCode: 'eu', impact: 'HIGH', noteFr: 'Dernière réunion + projections 2027. Orientations long terme EUR.', noteEn: 'Final meeting + 2027 projections. Long-term EUR direction.', },
  // BKAM â€” 4 quarterly meetings
  { date: '2026-03-18', titleFr: 'BKAM â€” Conseil de Politique Monétaire', titleEn: 'BKAM Monetary Policy Board', type: 'BKAM', currency: 'MAD', countryCode: 'ma', impact: 'DIRECT', noteFr: 'Décision directe sur taux directeur MAD et bandes de fluctuation.', noteEn: 'Direct MAD key rate and fluctuation band decision.', },
  { date: '2026-06-17', titleFr: 'BKAM â€” Conseil de Politique Monétaire', titleEn: 'BKAM Monetary Policy Board', type: 'BKAM', currency: 'MAD', countryCode: 'ma', impact: 'DIRECT', noteFr: 'Réunion mi-année. Revue des réserves et politique de change.', noteEn: 'Mid-year review of reserves and exchange rate policy.', },
  { date: '2026-09-16', titleFr: 'BKAM â€” Conseil de Politique Monétaire', titleEn: 'BKAM Monetary Policy Board', type: 'BKAM', currency: 'MAD', countryCode: 'ma', impact: 'DIRECT', noteFr: 'Réunion Q3 + revue FMI potential (Article IV). Haute attention.', noteEn: 'Q3 meeting + potential IMF Article IV review. High attention.', },
  { date: '2026-12-15', titleFr: 'BKAM â€” Conseil de Politique Monétaire', titleEn: 'BKAM Monetary Policy Board', type: 'BKAM', currency: 'MAD', countryCode: 'ma', impact: 'DIRECT', noteFr: 'Dernière réunion 2026. Rapport annuel + orientations 2027.', noteEn: 'Final 2026 meeting. Annual report and 2027 guidance.', },
  // US NFP â€” monthly
  { date: '2026-01-09', titleFr: 'NFP â€” Emplois non-agricoles USA', titleEn: 'US Non-Farm Payrolls', type: 'NFP', currency: 'USD', countryCode: 'us', impact: 'HIGH', noteFr: 'Indicateur emploi US décisif pour la trajectoire Fed → USD/MAD.', noteEn: 'Key US labor indicator driving Fed path and USD/MAD.', },
  { date: '2026-02-06', titleFr: 'NFP â€” Emplois non-agricoles USA', titleEn: 'US Non-Farm Payrolls', type: 'NFP', currency: 'USD', countryCode: 'us', impact: 'HIGH', noteFr: 'Impact USD immédiat ±0.3â€“0.8% sur surprise. Prudence en couverture.', noteEn: 'Immediate USD impact ±0.3â€“0.8% on surprise. Hedge with caution.', },
  { date: '2026-03-06', titleFr: 'NFP â€” Emplois non-agricoles USA', titleEn: 'US Non-Farm Payrolls', type: 'NFP', currency: 'USD', countryCode: 'us', impact: 'HIGH', noteFr: 'Précède la réunion FOMC du 19 mars. Influence directe sur la décision.', noteEn: 'Precedes Mar 19 FOMC. Direct influence on rate decision.', },
  { date: '2026-04-03', titleFr: 'NFP â€” Emplois non-agricoles USA', titleEn: 'US Non-Farm Payrolls', type: 'NFP', currency: 'USD', countryCode: 'us', impact: 'HIGH', noteFr: 'Vendredi saint (potentiel). Vérifier calendrier bancaire avant couverture.', noteEn: 'Potential Good Friday proximity. Check banking calendar.', },
  { date: '2026-05-08', titleFr: 'NFP â€” Emplois non-agricoles USA', titleEn: 'US Non-Farm Payrolls', type: 'NFP', currency: 'USD', countryCode: 'us', impact: 'HIGH', noteFr: 'Décalé au 2ème vendredi (1er mai = Fête du Travail).', noteEn: 'Delayed to 2nd Friday (May 1 = Labor Day holiday).', },
  { date: '2026-06-05', titleFr: 'NFP â€” Emplois non-agricoles USA', titleEn: 'US Non-Farm Payrolls', type: 'NFP', currency: 'USD', countryCode: 'us', impact: 'HIGH', noteFr: 'Précède BCE du 4 juin. Semaine à haut risque de volatilité MAD.', noteEn: 'Follows ECB Jun 4. High-volatility week for MAD.', },
  { date: '2026-07-02', titleFr: 'NFP â€” Emplois non-agricoles USA', titleEn: 'US Non-Farm Payrolls', type: 'NFP', currency: 'USD', countryCode: 'us', impact: 'HIGH', noteFr: 'Veille 4 juillet (liquidité réduite). Volatilité accrue possible.', noteEn: 'Day before July 4th (reduced liquidity). Elevated volatility.', },
  { date: '2026-08-07', titleFr: 'NFP â€” Emplois non-agricoles USA', titleEn: 'US Non-Farm Payrolls', type: 'NFP', currency: 'USD', countryCode: 'us', impact: 'HIGH', noteFr: 'Période estivale â€” liquidité internationale plus faible qu\'en hiver.', noteEn: 'Summer period â€” thinner international liquidity than winter.', },
  { date: '2026-09-04', titleFr: 'NFP â€” Emplois non-agricoles USA', titleEn: 'US Non-Farm Payrolls', type: 'NFP', currency: 'USD', countryCode: 'us', impact: 'HIGH', noteFr: 'Précède FOMC 17 sept + BKAM 16 sept. Semaine clé pour MAD.', noteEn: 'Precedes Sep 17 FOMC + Sep 16 BKAM. Critical MAD week.', },
  { date: '2026-10-02', titleFr: 'NFP â€” Emplois non-agricoles USA', titleEn: 'US Non-Farm Payrolls', type: 'NFP', currency: 'USD', countryCode: 'us', impact: 'HIGH', noteFr: 'Début T4. Orientations sur trimestre final USD.', noteEn: 'Q4 kickoff. Sets USD direction for final quarter.', },
  { date: '2026-11-06', titleFr: 'NFP â€” Emplois non-agricoles USA', titleEn: 'US Non-Farm Payrolls', type: 'NFP', currency: 'USD', countryCode: 'us', impact: 'HIGH', noteFr: 'Post-FOMC 5 nov. Confirme ou infirme décision Fed.', noteEn: 'Day after Nov 5 FOMC. Confirms or challenges Fed decision.', },
  { date: '2026-12-04', titleFr: 'NFP â€” Emplois non-agricoles USA', titleEn: 'US Non-Farm Payrolls', type: 'NFP', currency: 'USD', countryCode: 'us', impact: 'HIGH', noteFr: 'Avant FOMC 17 déc. Décisif pour la décision de décembre.', noteEn: 'Before Dec 17 FOMC. Decisive for December rate decision.', },
  // US CPI â€” monthly
  { date: '2026-01-14', titleFr: 'IPC USA â€” Inflation américaine', titleEn: 'US CPI Release', type: 'CPI_US', currency: 'USD', countryCode: 'us', impact: 'HIGH', noteFr: 'Indicateur inflation Fed. Surprise hawkish = USD fort = MAD sous pression.', noteEn: 'Fed inflation gauge. Hawkish surprise = strong USD = MAD pressure.', },
  { date: '2026-02-11', titleFr: 'IPC USA â€” Inflation américaine', titleEn: 'US CPI Release', type: 'CPI_US', currency: 'USD', countryCode: 'us', impact: 'HIGH', noteFr: 'Impact immédiat EUR/USD et USD/MAD dans les 30 min suivant la publication.', noteEn: 'Immediate EUR/USD and USD/MAD impact within 30 min of release.', },
  { date: '2026-03-11', titleFr: 'IPC USA â€” Inflation américaine', titleEn: 'US CPI Release', type: 'CPI_US', currency: 'USD', countryCode: 'us', impact: 'HIGH', noteFr: 'Avant FOMC 19 mars. Donnée critique pour la décision de taux.', noteEn: 'Before Mar 19 FOMC. Critical input for rate decision.', },
  { date: '2026-04-15', titleFr: 'IPC USA â€” Inflation américaine', titleEn: 'US CPI Release', type: 'CPI_US', currency: 'USD', countryCode: 'us', impact: 'HIGH', noteFr: 'Mi-Q2. Calibre les attentes pour réunion FOMC mai.', noteEn: 'Mid-Q2. Calibrates expectations for May FOMC.', },
  { date: '2026-05-13', titleFr: 'IPC USA â€” Inflation américaine', titleEn: 'US CPI Release', type: 'CPI_US', currency: 'USD', countryCode: 'us', impact: 'HIGH', noteFr: 'Post-FOMC mai. Valide ou contredit la posture Fed.', noteEn: 'Post-May FOMC. Validates or challenges Fed stance.', },
  { date: '2026-06-10', titleFr: 'IPC USA â€” Inflation américaine', titleEn: 'US CPI Release', type: 'CPI_US', currency: 'USD', countryCode: 'us', impact: 'HIGH', noteFr: 'Avant FOMC 18 juin + BCE 4 juin. Semaine triple impact.', noteEn: 'Before Jun 18 FOMC + Jun 4 ECB. Triple-impact week.', },
  // Eurozone CPI (flash, end of month)
  { date: '2026-01-30', titleFr: 'IPC Zone Euro (flash)', titleEn: 'Eurozone CPI Flash', type: 'CPI_EU', currency: 'EUR', countryCode: 'eu', impact: 'MEDIUM', noteFr: 'Mêmes dates que BCE â€” confluence. Inflation = mandataire BCE = EUR.', noteEn: 'Same day as ECB meeting â€” confluence. Inflation = ECB mandate = EUR.', },
  { date: '2026-03-31', titleFr: 'IPC Zone Euro (flash)', titleEn: 'Eurozone CPI Flash', type: 'CPI_EU', currency: 'EUR', countryCode: 'eu', impact: 'MEDIUM', noteFr: 'Flash estimé fin mars. Impact EUR/MAD modéré si dans ligne consensus.', noteEn: 'Flash estimate end of March. Moderate EUR/MAD impact if in-line.', },
  { date: '2026-04-30', titleFr: 'IPC Zone Euro (flash)', titleEn: 'Eurozone CPI Flash', type: 'CPI_EU', currency: 'EUR', countryCode: 'eu', impact: 'MEDIUM', noteFr: 'Avant réunion BCE 23 avril â€” influence directe sur décision.', noteEn: 'Before Apr 23 ECB â€” direct influence on decision.', },
];

// â”€â”€â”€ Calculation helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function getBandData(livePrices: LivePriceEntry[]): BandData[] {
  const K = DEFAULT_BASKET_CONFIG.referenceBasketValue;
  const W_EUR = DEFAULT_BASKET_CONFIG.eurWeight;
  const W_USD = DEFAULT_BASKET_CONFIG.usdWeight;

  const eurEntry = livePrices.find(p => p.currency === 'EUR');
  const usdEntry = livePrices.find(p => p.currency === 'USD');
  if (!eurEntry || !usdEntry || !usdEntry.mid || !eurEntry.mid) return [];

  const eurUsd = eurEntry.mid / usdEntry.mid;
  const centralUsd = K / (W_EUR * eurUsd + W_USD);
  const centralEur = centralUsd * eurUsd;

  const pairs: Array<{ currency: string; pairLabel: string; countryCode: string; central: number; current: number; change24h: number }> = [
    { currency: 'EUR', pairLabel: 'EUR/MAD', countryCode: 'eu', central: centralEur, current: eurEntry.mid, change24h: eurEntry.changePercent },
    { currency: 'USD', pairLabel: 'USD/MAD', countryCode: 'us', central: centralUsd, current: usdEntry.mid, change24h: usdEntry.changePercent },
  ];

  return pairs.map(p => {
    const lower = p.central * 0.95;
    const upper = p.central * 1.05;
    const utilPct = Math.max(0, Math.min(100, ((p.current - lower) / (upper - lower)) * 100));
    const driftBps = Math.round(((p.current - p.central) / p.central) * 10000);
    return { ...p, lower, upper, utilPct, driftBps };
  });
}

function computeSentiment(livePrices: LivePriceEntry[]): SentimentResult {
  const eur = livePrices.find(p => p.currency === 'EUR');
  const usd = livePrices.find(p => p.currency === 'USD');
  const gbp = livePrices.find(p => p.currency === 'GBP');
  if (!eur || !usd) return { label: 'INCONNU', labelEn: 'UNKNOWN', score: 50, bias: 'NEUTRAL', drivers: [] };

  let score = 50;
  const drivers: string[] = [];

  // EUR change: 60% basket weight
  if (eur.changePercent > 0.25) { score += 20; drivers.push('EUR →→ (pression panier 60%)'); }
  else if (eur.changePercent > 0.08) { score += 10; drivers.push('EUR → (panier 60%)'); }
  else if (eur.changePercent < -0.25) { score -= 20; drivers.push('EUR â†“â†“ (soutien panier 60%)'); }
  else if (eur.changePercent < -0.08) { score -= 10; drivers.push('EUR â†“ (panier 60%)'); }

  // USD change: 40% basket weight
  if (usd.changePercent > 0.25) { score += 15; drivers.push('USD →→ (pression panier 40%)'); }
  else if (usd.changePercent > 0.08) { score += 7; drivers.push('USD → (panier 40%)'); }
  else if (usd.changePercent < -0.25) { score -= 15; drivers.push('USD â†“â†“ (soutien panier 40%)'); }
  else if (usd.changePercent < -0.08) { score -= 7; drivers.push('USD â†“ (panier 40%)'); }

  // GBP signal (trade partner)
  if (gbp && Math.abs(gbp.changePercent) > 0.15) {
    drivers.push(`GBP ${gbp.changePercent > 0 ? '→' : 'â†“'} (signal risque global)`);
  }

  score = Math.max(5, Math.min(95, score));

  if (score >= 65) return { label: 'PRESSION BAISSIÈRE MAD', labelEn: 'MAD DEPRECIATION PRESSURE', score, bias: 'BEARISH', drivers };
  if (score <= 35) return { label: 'PRESSION HAUSSIÈRE MAD', labelEn: 'MAD APPRECIATION PRESSURE', score, bias: 'BULLISH', drivers };
  return { label: 'STABILITÉ RELATIVE', labelEn: 'RELATIVE STABILITY', score, bias: 'NEUTRAL', drivers };
}

function getKeyLevels(mid: number, centralParity: number) {
  const band5pct = mid * 0.05;
  return {
    r2: +(centralParity * 1.05 * 0.98).toFixed(4),  // cage ceiling
    r1: +(mid * 1.01).toFixed(4),
    mid: +mid.toFixed(4),
    s1: +(mid * 0.99).toFixed(4),
    s2: +(centralParity * 0.95 * 1.02).toFixed(4),  // cage floor
  };
}

// â”€â”€â”€ Upcoming calendar events â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function getUpcomingEvents(days = 45): CalendarEvent[] {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() + days);
  return CALENDAR_2026
    .filter(e => {
      const d = new Date(e.date);
      return d >= now && d <= cutoff;
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

// â”€â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ImpactBadge({ impact }: { impact: CalendarEvent['impact'] }) {
  const map = {
    DIRECT: 'bg-gold-500/20 border-gold-500/50 text-gold-300',
    HIGH:   'bg-red-500/20 border-red-500/50 text-red-300',
    MEDIUM: 'bg-amber-500/20 border-amber-500/50 text-amber-300',
    LOW:    'bg-slate-500/20 border-slate-600 text-slate-400',
  };
  const labels = { DIRECT: 'DIRECT MAD', HIGH: 'IMPACT ÉLEVÉ', MEDIUM: 'IMPACT MODÉRÉ', LOW: 'IMPACT FAIBLE' };
  return (
    <span className={`text-[9px] font-bold border px-1.5 py-0.5 rounded uppercase tracking-wide ${map[impact]}`}>
      {labels[impact]}
    </span>
  );
}

function EventTypeBadge({ type }: { type: CalendarEvent['type'] }) {
  const map: Record<string, string> = {
    FOMC: 'bg-blue-900/40 text-blue-300',
    ECB: 'bg-purple-900/40 text-purple-300',
    BKAM: 'bg-gold-500/15 text-gold-400',
    NFP: 'bg-emerald-900/40 text-emerald-300',
    CPI_US: 'bg-sky-900/40 text-sky-300',
    CPI_EU: 'bg-indigo-900/40 text-indigo-300',
  };
  return (
    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${map[type] ?? 'bg-navy-800 text-slate-400'}`}>
      {type.replace('_', ' ')}
    </span>
  );
}

function BandGauge({ data, locale }: { data: BandData; locale: string }) {
  const zone = data.utilPct < 20 ? 'DANGER_LOW' : data.utilPct > 80 ? 'DANGER_HIGH' : data.utilPct < 35 ? 'CAUTION_LOW' : data.utilPct > 65 ? 'CAUTION_HIGH' : 'NEUTRAL';
  const zoneColor = zone === 'NEUTRAL' ? 'text-emerald-400' : zone.startsWith('CAUTION') ? 'text-amber-400' : 'text-red-400';
  const zoneLabel = zone === 'NEUTRAL'
    ? (locale === 'ar' ? 'Ù…Ø­Ø§ÙŠØ¯' : locale === 'en' ? 'Neutral' : 'Zone Neutre')
    : zone.startsWith('CAUTION')
      ? (locale === 'ar' ? 'ØªÙ†Ø¨ÙŠÙ‡' : locale === 'en' ? 'Caution' : 'Zone Attention')
      : (locale === 'ar' ? 'Ø®Ø·Ø±' : locale === 'en' ? 'Danger' : 'Zone Danger');
  const driftSign = data.driftBps > 0 ? '+' : '';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <CurrencyFlag countryCode={data.countryCode} size="xs" />
          <span className="text-xs font-bold text-white">{data.pairLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold ${zoneColor}`}>{zoneLabel}</span>
          <span className="text-[10px] font-mono text-slate-400">{data.utilPct.toFixed(0)}%</span>
        </div>
      </div>
      {/* Gauge track */}
      <div className="relative h-4 bg-navy-800 rounded-full overflow-hidden border border-navy-700">
        {/* Danger zones */}
        <div className="absolute inset-y-0 left-0 w-[20%] bg-red-900/40 border-r border-red-800/50" />
        <div className="absolute inset-y-0 right-0 w-[20%] bg-red-900/40 border-l border-red-800/50" />
        {/* Caution zones */}
        <div className="absolute inset-y-0 left-[20%] w-[15%] bg-amber-900/30" />
        <div className="absolute inset-y-0 right-[20%] w-[15%] bg-amber-900/30" />
        {/* Neutral zone (35â€“65%) */}
        <div className="absolute inset-y-0 left-[35%] w-[30%] bg-emerald-900/20" />
        {/* Center parity line */}
        <div className="absolute inset-y-0 left-1/2 w-px bg-gold-500/60" />
        {/* Current position cursor */}
        <div
          className="absolute top-0.5 bottom-0.5 w-2 rounded-full shadow-lg transition-all"
          style={{
            left: `calc(${Math.max(2, Math.min(96, data.utilPct))}% - 4px)`,
            background: zone === 'NEUTRAL' ? '#10b981' : zone.startsWith('CAUTION') ? '#f59e0b' : '#ef4444',
          }}
        />
      </div>
      {/* Labels */}
      <div className="flex items-center justify-between text-[9px] font-mono text-slate-600">
        <span>{data.lower.toFixed(3)}</span>
        <span className="text-navy-500">{locale === 'ar' ? 'Ø§Ù„ØªØ¹Ø§Ø¯Ù„' : locale === 'en' ? 'Parity' : 'Parité'} {data.central.toFixed(3)}</span>
        <span>{data.upper.toFixed(3)}</span>
      </div>
      {/* Drift */}
      <div className="flex items-center gap-3 text-[10px] text-slate-400">
        <span>{locale === 'ar' ? 'Ø§Ù„Ø³Ø¹Ø± Ø§Ù„Ø­Ø§Ù„ÙŠ:' : locale === 'en' ? 'Current:' : 'Cours:'} <span className="font-mono font-bold text-white">{data.current.toFixed(4)}</span></span>
        <span>{locale === 'ar' ? 'Ø§Ù„Ø§Ù†Ø­Ø±Ø§Ù:' : locale === 'en' ? 'Drift:' : 'Dérive:'} <span className={`font-mono font-bold ${data.driftBps > 0 ? 'text-red-400' : data.driftBps < 0 ? 'text-emerald-400' : 'text-slate-400'}`}>{driftSign}{data.driftBps} bps</span></span>
      </div>
    </div>
  );
}

// â”€â”€â”€ Newsletter subscription form â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function NewsletterSignup({ proxyUrl }: { proxyUrl: string }) {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<NlStatus>('idle');
  const [errMsg, setErrMsg] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !proxyUrl || !consent) return;
    setStatus('loading');
    try {
      const res = await fetch(`${proxyUrl.replace(/\/$/, '')}/api/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
        signal: AbortSignal.timeout(12_000),
      });
      const data = await res.json() as { ok?: boolean; error?: string; already?: boolean };
      if (!res.ok || !data.ok) throw new Error(data.error ?? `Erreur ${res.status}`);
      setStatus('success');
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : 'Erreur réseau');
      setStatus('error');
    }
  }

  if (status === 'success') return (
    <div className="flex items-center gap-3 py-3 px-4 bg-emerald-900/20 border border-emerald-700/40 rounded-xl">
      <CheckCircle size={18} className="text-emerald-400 flex-shrink-0" />
      <div>
        <p className="text-sm font-bold text-emerald-300">Inscription confirmée</p>
        <p className="text-xs text-emerald-400/80">Vous recevrez le briefing chaque matin à 09h00 Casablanca.</p>
      </div>
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="votre@email.ma"
          className="flex-1 bg-navy-950 border border-navy-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/30 transition-colors"
        />
        <button
          type="submit"
          disabled={status === 'loading' || !email || !consent}
          className="flex items-center gap-2 bg-gold-500 text-navy-950 font-bold text-sm px-5 py-2.5 rounded-lg hover:bg-gold-400 disabled:opacity-50 transition-colors flex-shrink-0"
        >
          <Send size={13} />
          {status === 'loading' ? 'Inscription...' : 'S\'inscrire'}
        </button>
      </div>
      {/* CNDP-compliant consent â€” Loi 09-08 / GDPR Art. 6(1)(a) */}
      <label className="flex items-start gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          required
          checked={consent}
          onChange={e => setConsent(e.target.checked)}
          className="mt-0.5 flex-shrink-0 accent-gold-500 w-3.5 h-3.5"
        />
        <span className="text-[9px] text-slate-600 leading-relaxed">
          J'accepte que <strong className="text-slate-500">JAD2 Advisory</strong> (contrôleur, RC Casablanca) traite mon email
          pour le Morning Briefing FX quotidien. Finalité : communication informative.
          Durée : 24 mois. Retrait : <span className="text-slate-500">contact@jad2advisory.com</span>.
          Conforme Loi marocaine 09-08 · RGPD Art. 6(1)(a).
        </span>
      </label>
      {status === 'error' && <p className="text-xs text-red-400">{errMsg}</p>}
    </form>
  );
}

// â”€â”€â”€ Funnel CTA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function FunnelCTA({ variant = 'default' }: { variant?: 'default' | 'compact' | 'calendar' }) {
  if (variant === 'compact') return (
    <div className="flex items-center justify-between gap-4 px-5 py-3 bg-navy-950/50 border border-navy-800 rounded-lg">
      <p className="text-[11px] text-slate-400 leading-snug">
        <span className="font-semibold text-white">Formation & Accompagnement</span> en gestion des flux de change
        pour vos équipes financières.
      </p>
      <a href="https://jad2advisory.com" target="_blank" rel="noopener noreferrer"
        className="flex-shrink-0 text-[11px] font-bold text-gold-400 hover:text-gold-300 transition-colors whitespace-nowrap">
        jad2advisory.com →
      </a>
    </div>
  );

  if (variant === 'calendar') return (
    <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
      <p className="text-xs font-semibold text-amber-300 mb-1">Un événement macro vous interpelle ?</p>
      <p className="text-[11px] text-amber-400/80 leading-relaxed mb-2">
        JAD2 Advisory aide les équipes financières à comprendre l'impact des décisions de politique monétaire
        sur les flux de change MAD et la réglementation Office des Changes.
      </p>
      <a href="https://jad2advisory.com" target="_blank" rel="noopener noreferrer"
        className="text-[11px] font-bold text-amber-300 hover:text-amber-200 transition-colors">
        Discuter avec un expert → jad2advisory.com
      </a>
    </div>
  );

  return (
    <div className="bg-navy-900 border border-navy-700 rounded-2xl p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div>
          <p className="text-base font-bold text-white mb-1">Formation en marchés des changes</p>
          <p className="text-sm text-slate-400 leading-relaxed max-w-md">
            JAD2 Advisory accompagne les directeurs financiers et trésoriers dans la compréhension
            des dynamiques de change MAD, la réglementation OC, et la lecture des données BKAM.
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <a href="https://jad2advisory.com/contact" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-gold-500 text-navy-950 font-bold text-sm px-5 py-2.5 rounded-lg hover:bg-gold-400 transition-colors">
            Parler à un expert
          </a>
        </div>
      </div>
    </div>
  );
}

// â”€â”€â”€ Print-only document layout â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function PrintLayout({
  casaDate, livePrices, bandData, sentiment, report, upcoming,
}: {
  casaDate: string;
  livePrices: import('../types').LivePriceEntry[];
  bandData: BandData[];
  sentiment: SentimentResult;
  report: import('../types').MarketReport | null;
  upcoming: CalendarEvent[];
}) {
  const eurBand = bandData.find(b => b.currency === 'EUR');
  const usdBand = bandData.find(b => b.currency === 'USD');

  return (
    <div className="briefing-print-doc" style={{ display: 'none' }}>
      {/* Header */}
      <div className="briefing-print-header">
        <div>
          <div className="briefing-print-logo">JAD2FX â€” MORNING BRIEFING</div>
          <div className="briefing-print-sub">by JAD2 Advisory · Casablanca, Maroc</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="briefing-print-date">{casaDate}</div>
          <div className="briefing-print-sub">09:00 Casablanca · CONFIDENTIEL</div>
        </div>
      </div>
      <div className="briefing-print-divider" />

      {/* Title from AI report */}
      {report && (
        <div className="briefing-print-section">
          <div className="briefing-print-section-title">{report.titleFr}</div>
          <p className="briefing-print-excerpt">{report.excerptFr}</p>
        </div>
      )}

      {/* Rates table */}
      <div className="briefing-print-section">
        <div className="briefing-print-label">Taux de Change Indicatifs</div>
        <table className="briefing-print-table">
          <thead>
            <tr><th>Paire</th><th>Bid</th><th>Ask</th><th>Mid</th><th>Var. 24h</th></tr>
          </thead>
          <tbody>
            {livePrices.slice(0, 8).map(p => (
              <tr key={p.currency}>
                <td><strong>{p.pair}</strong></td>
                <td>{p.bid.toFixed(4)}</td>
                <td>{p.ask.toFixed(4)}</td>
                <td><strong>{p.mid.toFixed(4)}</strong></td>
                <td>{p.changePercent >= 0 ? '+' : ''}{p.changePercent.toFixed(3)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="briefing-print-note">Taux indicatifs dérivés BKAM/ECB · Non exécutables · À titre pédagogique uniquement</p>
      </div>

      {/* Band utilization */}
      {(eurBand || usdBand) && (
        <div className="briefing-print-section">
          <div className="briefing-print-label">Position dans les Bandes BKAM ±5%</div>
          {[eurBand, usdBand].filter(Boolean).map(b => b && (
            <div key={b.currency} className="briefing-print-band-row">
              <strong>{b.pairLabel}</strong>:&nbsp;
              Cours {b.current.toFixed(4)} · Parité {b.central.toFixed(4)} ·
              Position {b.utilPct.toFixed(0)}% de la bande ·
              Dérive {b.driftBps > 0 ? '+' : ''}{b.driftBps} bps
            </div>
          ))}
        </div>
      )}

      {/* Sentiment */}
      <div className="briefing-print-section">
        <div className="briefing-print-label">Sentiment Composite MAD</div>
        <p className="briefing-print-sentiment">
          {sentiment.label} (score {sentiment.score}/100) ·{' '}
          {sentiment.drivers.length > 0 ? sentiment.drivers.join(' · ') : 'Stabilité relative'}
        </p>
      </div>

      {/* Upcoming events */}
      {upcoming.length > 0 && (
        <div className="briefing-print-section">
          <div className="briefing-print-label">Prochains Événements Macro (60 jours)</div>
          <table className="briefing-print-table">
            <thead>
              <tr><th>Date</th><th>Événement</th><th>Impact MAD</th><th>J-</th></tr>
            </thead>
            <tbody>
              {upcoming.slice(0, 6).map(ev => (
                <tr key={ev.date + ev.type}>
                  <td>{new Date(ev.date).toLocaleDateString('fr-MA', { day: '2-digit', month: 'short' })}</td>
                  <td>{ev.titleFr}</td>
                  <td>{ev.impact}</td>
                  <td>{daysUntil(ev.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* AI content */}
      {report?.contentFr && (
        <div className="briefing-print-section briefing-print-pagebreak">
          <div className="briefing-print-label">Analyse des Marchés</div>
          <div className="briefing-print-analysis">{report.contentFr}</div>
        </div>
      )}

      {/* Radar */}
      {report?.radarData && report.radarData.length > 0 && (
        <div className="briefing-print-section">
          <div className="briefing-print-label">Radar Devises</div>
          <table className="briefing-print-table">
            <thead>
              <tr><th>Devise/MAD</th><th>Cours</th><th>Var. 7j (bps)</th><th>Tendance</th><th>Perspective</th></tr>
            </thead>
            <tbody>
              {report.radarData.map(r => (
                <tr key={r.currency}>
                  <td><strong>{r.currency}/MAD</strong></td>
                  <td>{r.currentRate.toFixed(4)}</td>
                  <td>{r.weeklyChangeBps > 0 ? '+' : ''}{r.weeklyChangeBps}</td>
                  <td>{r.sentiment}</td>
                  <td>{r.expectation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      <div className="briefing-print-footer">
        <p>
          Données indicatives à titre éducatif uniquement · Non contractuelles · Non exécutables ·
          JAD2 Advisory n'est pas un prestataire de services d'investissement ·
          Pour toute opération de change, adressez-vous à un établissement de crédit agréé par Bank Al-Maghrib ·
          jad2advisory.com
        </p>
        <p>© JAD2 Advisory · Casablanca, Maroc · {new Date().getFullYear()}</p>
      </div>
    </div>
  );
}

// â”€â”€â”€ Markdown renderer (minimal) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function MarkdownSection({ content }: { content: string }) {
  if (!content?.trim()) return null;
  return (
    <div className="text-[13px] text-slate-300 leading-relaxed space-y-2">
      {content.split('\n').filter(Boolean).map((line, i) => {
        if (line.startsWith('## ')) return <h3 key={i} className="text-[13px] font-bold text-white mt-3 mb-1">{line.slice(3)}</h3>;
        if (line.startsWith('- ') || line.startsWith('• ')) return (
          <div key={i} className="flex items-start gap-2">
            <span className="text-gold-500 flex-shrink-0 mt-0.5 text-xs">▸</span>
            <span>{line.slice(2).replace(/\*\*(.+?)\*\*/g, '$1')}</span>
          </div>
        );
        return <p key={i}>{line.replace(/\*\*(.+?)\*\*/g, '$1')}</p>;
      })}
    </div>
  );
}

// â”€â”€â”€ Main component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function MorningBriefing() {
  const { config, livePrices } = useAdmin();
  const { locale } = useI18n();
  const L = (fr: string, en: string, ar: string) => locale === 'ar' ? ar : locale === 'en' ? en : fr;
  const [tab, setTab] = useState<BriefingTab>('OVERVIEW');
  const [report, setReport] = useState<MarketReport | null>(null);
  const [reportLoading, setReportLoading] = useState(true);
  const [localPrices, setLocalPrices] = useState<LivePriceEntry[]>([]);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [now, setNow] = useState(new Date());

  // Live Casablanca clock
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const loadReport = useCallback(async () => {
    if (!config.corsProxyUrl) { setReportLoading(false); return; }
    setReportLoading(true);
    try {
      const r = await getPublishedReport(config.corsProxyUrl);
      setReport(r);
    } catch { /* silent */ }
    finally { setReportLoading(false); }
  }, [config.corsProxyUrl]);

  useEffect(() => { loadReport(); }, [loadReport]);

  // Always fetch rates locally on mount â€” ensures Morning Briefing is never blank
  // (livePrices from AdminContext may be empty or stale during first render)
  useEffect(() => {
    setRatesLoading(true);
    fetchAllMadRates(DEFAULT_BASKET_CONFIG, config.corsProxyUrl || undefined)
      .then(({ rates }) => {
        const entries: LivePriceEntry[] = rates.map(r => {
          const chgPct = r.change24h ?? 0;
          const prevMid = chgPct !== 0 ? r.mid / (1 + chgPct / 100) : r.mid;
          return {
            currency: r.currency, pair: r.pair,
            bid: r.virementBuy, ask: r.virementSell, mid: r.mid,
            prevMid,
            change: +(r.mid - prevMid).toFixed(4),
            changePercent: chgPct,
            spreadPips: Math.round((r.virementSell - r.virementBuy) * 10000),
            lastUpdated: r.timestamp,
          };
        });
        setLocalPrices(entries);
      })
      .catch(() => {})
      .finally(() => setRatesLoading(false));
  }, [config.corsProxyUrl]); // fires on mount and when proxy changes; no livePrices dep

  // â”€â”€ Computed analytics â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const effectivePrices = livePrices.length > 0 ? livePrices : localPrices;
  const bandData   = getBandData(effectivePrices);
  const sentiment  = computeSentiment(effectivePrices);
  const upcoming   = getUpcomingEvents(60);
  const nextEvent  = upcoming[0];

  const eurEntry = effectivePrices.find(p => p.currency === 'EUR');
  const usdEntry = effectivePrices.find(p => p.currency === 'USD');
  const eurBand  = bandData.find(b => b.currency === 'EUR');
  const usdBand  = bandData.find(b => b.currency === 'USD');

  const eurLevels = eurBand ? getKeyLevels(eurBand.current, eurBand.central) : null;
  const usdLevels = usdBand ? getKeyLevels(usdBand.current, usdBand.central) : null;

  const casaTime = now.toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Casablanca' });
  const casaDate = now.toLocaleDateString('fr-MA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Casablanca' });

  const marketHour = parseInt(now.toLocaleTimeString('fr-MA', { hour: '2-digit', timeZone: 'Africa/Casablanca' }));
  const isMarketDay = now.getDay() >= 1 && now.getDay() <= 5;
  const isMarketOpen = isMarketDay && marketHour >= 9 && marketHour < 17;
  const isFixingHour = isMarketDay && marketHour === 11;

  const tabs: { id: BriefingTab; label: string; icon: React.ElementType }[] = [
    { id: 'OVERVIEW',  label: 'Vue Stratégique', icon: BarChart2 },
    { id: 'CALENDAR',  label: 'Calendrier Macro', icon: Calendar },
    { id: 'ANALYSIS',  label: 'Analyse Éditoriale', icon: FileText },
  ];

  return (
    <div className="space-y-5">

      {/* ╔╔ Print-only document (hidden in browser, appears in PDF) ╔╔╔╔╔╔╔╔╔╔╔╔ */}
      <PrintLayout
        casaDate={casaDate}
        livePrices={effectivePrices}
        bandData={bandData}
        sentiment={sentiment}
        report={report}
        upcoming={upcoming}
      />

      {/* ╔╔ Screen content (hidden when printing) ╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔ */}
      <div className="briefing-screen space-y-5">

      {/* ╔╔ Briefing Header ╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔ */}
      <div className="bg-navy-900 border border-navy-700 rounded-xl overflow-hidden">
        <div className="h-0.5 bg-gradient-to-r from-gold-700 via-gold-400 to-gold-700" />
        <div className="px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-bold text-gold-400 uppercase tracking-[0.2em] bg-gold-500/10 border border-gold-500/25 px-2 py-0.5 rounded">
                  MORNING BRIEFING · JAD2 ADVISORY
                </span>
                {isFixingHour && (
                  <span className="text-[9px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded uppercase animate-pulse">
                    âš¡ HEURE FIXING BKAM
                  </span>
                )}
              </div>
              <h1 className="text-xl font-serif font-bold text-white capitalize">{casaDate}</h1>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                Casablanca {casaTime} · Stratégiste en Chef · Direction des Risques de Change
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border ${
                isMarketOpen
                  ? 'border-emerald-600 bg-emerald-950/40 text-emerald-400'
                  : 'border-slate-700 bg-navy-800 text-slate-500'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isMarketOpen ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                {isMarketOpen ? 'MARCHÉ OUVERT · MIC BKAM ACTIF' : 'HORS SÉANCE'}
              </div>
              {nextEvent && (
                <div className="text-[10px] text-slate-500 font-mono">
                  Prochain événement: <span className="text-gold-400 font-bold">{nextEvent.type}</span> dans{' '}
                  <span className="text-white font-bold">{daysUntil(nextEvent.date)}j</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ╔╔ Tab navigation ╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔ */}
      <div className="flex items-center gap-1 bg-navy-900 border border-navy-700 rounded-xl p-1">
        {tabs.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[12px] font-semibold flex-1 justify-center transition-all ${
                active
                  ? 'bg-gold-500 text-navy-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-navy-800'
              }`}
            >
              <Icon size={13} />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ╔╔ OVERVIEW TAB ╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔ */}
      {tab === 'OVERVIEW' && (
        <div className="space-y-5">

          {/* â”€â”€ KPI bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                label: 'EUR/MAD', sub: 'Panier 60%',
                value: eurEntry ? eurEntry.mid.toFixed(4) : 'â€”',
                change: eurEntry?.changePercent ?? 0,
                color: 'text-purple-400', countryCode: 'eu',
              },
              {
                label: 'USD/MAD', sub: 'Panier 40%',
                value: usdEntry ? usdEntry.mid.toFixed(4) : 'â€”',
                change: usdEntry?.changePercent ?? 0,
                color: 'text-blue-400', countryCode: 'us',
              },
              {
                label: 'Bande EUR', sub: `Utilisation BKAM`,
                value: eurBand ? `${eurBand.utilPct.toFixed(0)}%` : 'â€”',
                change: 0,
                color: eurBand ? (eurBand.utilPct > 65 ? 'text-red-400' : eurBand.utilPct < 35 ? 'text-emerald-400' : 'text-gold-400') : 'text-slate-400',
                countryCode: '', customSub: eurBand ? (eurBand.utilPct > 65 ? 'Zone Attention →' : eurBand.utilPct < 35 ? 'Zone Attention â†' : 'Zone Neutre') : '',
              },
              {
                label: 'Sentiment',
                sub: sentiment.bias,
                value: sentiment.score > 65 ? '→ MAD' : sentiment.score < 35 ? 'â†“ MAD' : '→ MAD',
                change: 0,
                color: sentiment.bias === 'BEARISH' ? 'text-red-400' : sentiment.bias === 'BULLISH' ? 'text-emerald-400' : 'text-gold-400',
                countryCode: '', customSub: sentiment.label,
              },
            ].map(item => (
              <div key={item.label} className="bg-navy-900 border border-navy-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    {item.countryCode && <CurrencyFlag countryCode={item.countryCode} size="xs" />}
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</p>
                  </div>
                  {item.change !== 0 && (
                    <span className={`text-[10px] font-mono font-bold ${item.change > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {item.change > 0 ? '→' : 'â†“'}{Math.abs(item.change).toFixed(3)}%
                    </span>
                  )}
                </div>
                <p className={`text-2xl font-mono font-bold tabular-nums ${item.color}`}>{item.value}</p>
                <p className="text-[10px] text-slate-500 mt-1">{item.customSub || item.sub}</p>
              </div>
            ))}
          </div>

          {/* â”€â”€ Full rates strip â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div className="bg-navy-900 border border-navy-700 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-navy-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity size={13} className="text-gold-500" />
                <h3 className="text-[11px] font-bold text-white uppercase tracking-widest">Taux de Change Indicatifs â€” Séance en cours</h3>
              </div>
              <span className="text-[9px] text-slate-500 font-mono">{effectivePrices.length} paires · ECB / BKAM{ratesLoading ? ' · chargement…' : ''}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="bg-navy-950/50 text-[9px] uppercase tracking-widest text-slate-500 border-b border-navy-800">
                    <th className="text-left px-4 py-2.5">{L('Paire', 'Pair', 'Ø§Ù„Ø²ÙˆØ¬')}</th>
                    <th className="text-right px-3 py-2.5">{L('Achat', 'Bid', 'Ø´Ø±Ø§Ø¡')}</th>
                    <th className="text-right px-3 py-2.5">{L('Vente', 'Ask', 'Ø¨ÙŠØ¹')}</th>
                    <th className="text-right px-3 py-2.5">Mid</th>
                    <th className="text-right px-3 py-2.5">{L('Var. 24h', 'Change 24h', 'Ø§Ù„ØªØºÙŠØ± 24Ø³')}</th>
                    <th className="text-right px-3 py-2.5">{L('Écart', 'Spread', 'Ø§Ù„ÙØ§Ø±Ù‚')}</th>
                    <th className="text-right px-4 py-2.5">{L('Bande BKAM', 'BKAM Band', 'Ù†Ø·Ø§Ù‚ BKAM')}</th>
                  </tr>
                </thead>
                <tbody>
                  {effectivePrices.slice(0, 10).map(p => {
                    const up = p.changePercent > 0;
                    const dn = p.changePercent < 0;
                    const band = bandData.find(b => b.currency === p.currency);
                    return (
                      <tr key={p.currency} className="border-b border-navy-800/50 hover:bg-navy-800/30 transition-colors">
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <CurrencyFlag countryCode={
                              ({ EUR:'eu',USD:'us',GBP:'gb',CHF:'ch',JPY:'jp',
                                 CAD:'ca',NOK:'no',SEK:'se',DKK:'dk',CNY:'cn',
                                 SAR:'sa',AED:'ae',QAR:'qa',KWD:'kw',OMR:'om',
                                 BHD:'bh',JOD:'jo',TND:'tn',DZD:'dz',LYD:'ly',
                                 ZAR:'za',INR:'in',BRL:'br',TRY:'tr' }[p.currency]) ?? 'un'
                            } size="xs" />
                            <span className="font-mono font-bold text-white text-[12px]">{p.pair}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-emerald-400 text-[12px]">{p.bid.toFixed(4)}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-red-400 text-[12px]">{p.ask.toFixed(4)}</td>
                        <td className="px-3 py-2.5 text-right font-mono font-bold text-white text-[12px]">{p.mid.toFixed(4)}</td>
                        <td className="px-3 py-2.5 text-right">
                          <span className={`text-[11px] font-mono font-bold flex items-center justify-end gap-0.5 ${up ? 'text-red-400' : dn ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {up ? <ArrowUp size={10} /> : dn ? <ArrowDown size={10} /> : <Minus size={10} />}
                            {Math.abs(p.changePercent).toFixed(3)}%
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-[11px] text-slate-400">{p.spreadPips.toFixed(0)} pips</td>
                        <td className="px-4 py-2.5">
                          {band ? (
                            <div className="flex items-center gap-1.5 justify-end">
                              <div className="w-16 h-2 bg-navy-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${band.utilPct > 65 ? 'bg-amber-500' : band.utilPct < 35 ? 'bg-emerald-500' : 'bg-gold-500'}`}
                                  style={{ width: `${band.utilPct}%` }}
                                />
                              </div>
                              <span className="text-[9px] font-mono text-slate-400 w-6 text-right">{band.utilPct.toFixed(0)}%</span>
                            </div>
                          ) : <span className="text-slate-600 text-[10px]">â€”</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* â”€â”€ 3-col analytics â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* BKAM band gauges */}
            <div className="lg:col-span-1 bg-navy-900 border border-navy-700 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 size={13} className="text-gold-500" />
                <h3 className="text-[11px] font-bold text-white uppercase tracking-widest">Utilisation Bandes BKAM ±5%</h3>
              </div>
              <div className="space-y-5">
                {bandData.map(b => <BandGauge key={b.currency} data={b} locale={locale} />)}
              </div>
              <p className="text-[9px] text-slate-600 mt-4">
                Zone neutre 35â€“65% · Zone attention 20â€“35% & 65â€“80% · Zone danger &lt;20% & &gt;80%
              </p>
            </div>

            {/* Sentiment panel */}
            <div className="bg-navy-900 border border-navy-700 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Zap size={13} className="text-gold-500" />
                <h3 className="text-[11px] font-bold text-white uppercase tracking-widest">Sentiment Composite MAD</h3>
              </div>
              {/* Score gauge */}
              <div className="mb-5">
                <div className={`text-2xl font-bold font-serif mb-1 ${sentiment.bias === 'BEARISH' ? 'text-red-400' : sentiment.bias === 'BULLISH' ? 'text-emerald-400' : 'text-gold-400'}`}>
                  {sentiment.label}
                </div>
                <div className="text-[10px] text-slate-500 mb-3">{sentiment.labelEn}</div>
                <div className="h-3 bg-navy-800 rounded-full overflow-hidden border border-navy-700 mb-1">
                  <div
                    className={`h-full rounded-full transition-all ${sentiment.score > 65 ? 'bg-red-500' : sentiment.score < 35 ? 'bg-emerald-500' : 'bg-gold-500'}`}
                    style={{ width: `${sentiment.score}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] font-mono text-slate-600">
                  <span>MAD fort</span>
                  <span className="text-slate-400 font-bold">Score: {sentiment.score}/100</span>
                  <span>MAD faible</span>
                </div>
              </div>
              {/* Drivers */}
              {sentiment.drivers.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2">Facteurs identifiés</p>
                  {sentiment.drivers.map((d, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px] text-slate-300">
                      <ChevronRight size={10} className="text-gold-500 flex-shrink-0" />
                      {d}
                    </div>
                  ))}
                </div>
              )}
              {/* Interpretation */}
              <div className="mt-4 p-3 bg-navy-950/60 border border-navy-700 rounded-lg">
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  {sentiment.bias === 'BEARISH'
                    ? 'Contexte défavorable MAD. Les importateurs devraient prioriser les couvertures à terme à court terme. Les exportateurs peuvent attendre un retournement.'
                    : sentiment.bias === 'BULLISH'
                    ? 'Contexte favorable MAD. Les importateurs bénéficient de taux avantageux pour les achats de devises à terme. Fenêtre de couverture opportune.'
                    : 'Contexte stable MAD. Fenêtre neutre pour les opérations de couverture. Surveiller les données macro à venir.'
                  }
                </p>
              </div>
            </div>

            {/* Key levels */}
            <div className="bg-navy-900 border border-navy-700 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Target size={13} className="text-gold-500" />
                <h3 className="text-[11px] font-bold text-white uppercase tracking-widest">Niveaux Clés</h3>
              </div>
              {[
                { label: 'EUR/MAD', levels: eurLevels, countryCode: 'eu' },
                { label: 'USD/MAD', levels: usdLevels, countryCode: 'us' },
              ].map(pair => pair.levels && (
                <div key={pair.label} className="mb-5 last:mb-0">
                  <div className="flex items-center gap-1.5 mb-2">
                    <CurrencyFlag countryCode={pair.countryCode} size="xs" />
                    <span className="text-[11px] font-bold text-white">{pair.label}</span>
                    <span className="text-[9px] text-slate-500">(niveaux théoriques)</span>
                  </div>
                  <div className="space-y-1">
                    {[
                      { key: 'r2', label: 'R2 â€” Plafond cage BKAM', color: 'text-red-400', bg: 'bg-red-900/20 border-red-800/40' },
                      { key: 'r1', label: 'R1 â€” Résistance 1%', color: 'text-amber-400', bg: 'bg-amber-900/20 border-amber-800/40' },
                      { key: 'mid', label: 'MID â€” Cours actuel', color: 'text-white', bg: 'bg-navy-800 border-navy-600' },
                      { key: 's1', label: 'S1 â€” Support 1%', color: 'text-blue-400', bg: 'bg-blue-900/20 border-blue-800/40' },
                      { key: 's2', label: 'S2 â€” Plancher cage BKAM', color: 'text-emerald-400', bg: 'bg-emerald-900/20 border-emerald-800/40' },
                    ].map(level => (
                      <div key={level.key} className={`flex items-center justify-between px-2 py-1.5 rounded border text-[10px] ${level.bg}`}>
                        <span className="text-slate-400 truncate">{level.label}</span>
                        <span className={`font-mono font-bold tabular-nums ${level.color}`}>
                          {pair.levels![level.key as keyof typeof pair.levels]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <p className="text-[9px] text-slate-600 mt-3">
                Niveaux pédagogiques â€” non exécutables · Pour toute opération : banque agréée BAM
              </p>
            </div>
          </div>

          {/* â”€â”€ Corporate insights â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div className="bg-navy-900 border border-navy-700 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Building2 size={13} className="text-gold-500" />
              <h3 className="text-[11px] font-bold text-white uppercase tracking-widest">Actions Prioritaires â€” Trésorerie Corporate</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  priority: eurBand && eurBand.utilPct > 60 ? 'ÉLEVÉE' : eurBand && eurBand.utilPct < 40 ? 'FAIBLE' : 'MODÉRÉE',
                  priorityColor: eurBand && eurBand.utilPct > 60 ? 'text-red-400' : eurBand && eurBand.utilPct < 40 ? 'text-emerald-400' : 'text-amber-400',
                  icon: Shield,
                  title: 'Contexte EUR â€” Flux Import/Export',
                  body: eurBand
                    ? eurBand.utilPct > 60
                      ? `EUR/MAD à ${eurBand.utilPct.toFixed(0)}% de la bande BKAM â€” dynamique d'appréciation EUR visible. Contexte à surveiller pour les entreprises ayant des flux en EUR. Consultez votre banque domiciliataire.`
                      : eurBand.utilPct < 40
                      ? `EUR/MAD en zone basse (${eurBand.utilPct.toFixed(0)}%) â€” MAD en position relative favorable par rapport à l'EUR. Éclairage pédagogique : comprendre ce contexte aide à anticiper vos flux. Votre banque agréée peut vous accompagner.`
                      : `EUR/MAD en zone neutre (${eurBand.utilPct.toFixed(0)}%) â€” stabilité relative du panier. Contexte propice pour comprendre et planifier vos flux de change EUR. Adressez-vous à votre banque pour toute opération.`
                    : 'Données de bande non disponibles.',
                },
                {
                  priority: sentiment.bias === 'BEARISH' ? 'ÉLEVÉE' : sentiment.bias === 'BULLISH' ? 'FAVORABLE' : 'MODÉRÉE',
                  priorityColor: sentiment.bias === 'BEARISH' ? 'text-red-400' : sentiment.bias === 'BULLISH' ? 'text-emerald-400' : 'text-amber-400',
                  icon: TrendingUp,
                  title: 'Dynamique MAD â€” Éclairage Pédagogique',
                  body: `Sentiment composite ${sentiment.score}/100 â€” ${sentiment.label.toLowerCase()}. ${
                    sentiment.bias === 'BEARISH'
                      ? 'La pression sur le panier MAD mérite d\'être intégrée dans votre lecture des flux EUR/USD. À contextualiser avec votre banque domiciliataire.'
                      : sentiment.bias === 'BULLISH'
                      ? 'Le MAD affiche une dynamique positive par rapport au panier. Contexte favorable à la compréhension de vos flux de change. Pour toute opération, consultez votre banque agréée BAM.'
                      : 'Pas de pression directionnelle nette sur le MAD. Contexte de stabilité relative. Votre banque peut vous accompagner dans l\'anticipation de vos flux.'
                  }`,
                },
                {
                  priority: nextEvent?.impact === 'DIRECT' ? 'BKAM' : nextEvent?.impact === 'HIGH' ? 'ÉLEVÉE' : 'MODÉRÉE',
                  priorityColor: nextEvent?.impact === 'DIRECT' ? 'text-gold-400' : nextEvent?.impact === 'HIGH' ? 'text-red-400' : 'text-amber-400',
                  icon: Calendar,
                  title: 'Prochain Événement Macro à Surveiller',
                  body: nextEvent
                    ? `${nextEvent.titleFr} â€” J-${daysUntil(nextEvent.date)} (${new Date(nextEvent.date).toLocaleDateString('fr-MA', { day: 'numeric', month: 'long' })}). ${nextEvent.noteFr}`
                    : 'Aucun événement majeur dans les 60 prochains jours.',
                },
              ].map(item => (
                <div key={item.title} className="bg-navy-950/50 border border-navy-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <item.icon size={12} className="text-gold-500" />
                    <span className={`text-[9px] font-bold ${item.priorityColor}`}>PRIORITÉ {item.priority}</span>
                  </div>
                  <p className="text-[11px] font-bold text-white mb-1.5">{item.title}</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* â”€â”€ Funnel CTA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <FunnelCTA variant="compact" />

          {/* â”€â”€ Upcoming events preview â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div className="bg-navy-900 border border-navy-700 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-navy-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar size={13} className="text-gold-500" />
                <h3 className="text-[11px] font-bold text-white uppercase tracking-widest">Prochains Événements â€” Impact MAD</h3>
              </div>
              <button onClick={() => setTab('CALENDAR')} className="text-[10px] text-gold-400 hover:text-gold-300 transition-colors flex items-center gap-1">
                Voir tout <ChevronRight size={10} />
              </button>
            </div>
            <div className="divide-y divide-navy-800/60">
              {upcoming.slice(0, 5).map(ev => (
                <div key={ev.date + ev.type} className="px-5 py-3.5 flex items-start gap-4 hover:bg-navy-800/30 transition-colors">
                  <div className="text-center w-12 flex-shrink-0">
                    <div className="text-[11px] font-bold text-white font-mono">
                      {new Date(ev.date).toLocaleDateString('fr-MA', { day: '2-digit' })}
                    </div>
                    <div className="text-[9px] text-slate-500 uppercase">
                      {new Date(ev.date).toLocaleDateString('fr-MA', { month: 'short' })}
                    </div>
                    <div className={`text-[9px] font-mono font-bold mt-0.5 ${daysUntil(ev.date) <= 7 ? 'text-red-400' : daysUntil(ev.date) <= 21 ? 'text-amber-400' : 'text-slate-500'}`}>
                      J-{daysUntil(ev.date)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <CurrencyFlag countryCode={ev.countryCode} size="xs" />
                      <span className="text-[12px] font-semibold text-white">{ev.titleFr}</span>
                      {ev.hasProjections && <span className="text-[9px] bg-blue-500/15 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded font-bold">+ PROJECTIONS</span>}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <EventTypeBadge type={ev.type} />
                      <ImpactBadge impact={ev.impact} />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">{ev.noteFr}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* â”€â”€ Newsletter signup strip â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          {config.corsProxyUrl && (
            <div className="bg-navy-900 border border-navy-700 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Mail size={14} className="text-gold-500" />
                <h3 className="text-[11px] font-bold text-white uppercase tracking-widest">Recevoir ce briefing chaque matin</h3>
              </div>
              <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                Inscrivez-vous pour recevoir le Morning Briefing FX quotidien à 09h00 Casablanca.
                Données indicatives uniquement · Contenu éducatif · Non contractuel.
              </p>
              <NewsletterSignup proxyUrl={config.corsProxyUrl} />
            </div>
          )}

          {/* â”€â”€ Full advisory CTA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <FunnelCTA />
        </div>
      )}

      {/* ╔╔ CALENDAR TAB ╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔ */}
      {tab === 'CALENDAR' && (
        <div className="space-y-4">
          <div className="bg-navy-900 border border-navy-700 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-navy-800">
              <h3 className="text-[11px] font-bold text-white uppercase tracking-widest">Calendrier Macro 2026 â€” Impact sur le Dirham MAD</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">FOMC · BCE · BKAM · NFP · IPC â€” Événements majeurs affectant EUR/MAD et USD/MAD</p>
            </div>

            {/* Legend */}
            <div className="px-5 py-2.5 border-b border-navy-800 flex flex-wrap gap-3 text-[9px] font-bold">
              {[
                { color: 'bg-gold-500/30 text-gold-300', label: 'BKAM â€” DIRECT MAD' },
                { color: 'bg-red-500/20 text-red-300', label: 'HIGH IMPACT' },
                { color: 'bg-amber-500/15 text-amber-300', label: 'MEDIUM IMPACT' },
              ].map(l => (
                <div key={l.label} className={`flex items-center gap-1.5 px-2 py-0.5 rounded border ${l.color}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {l.label}
                </div>
              ))}
            </div>

            <div className="divide-y divide-navy-800/50">
              {upcoming.map(ev => {
                const d = daysUntil(ev.date);
                const isToday = d === 0;
                const isSoon = d <= 7;
                return (
                  <div key={ev.date + ev.type} className={`px-5 py-4 flex items-start gap-4 transition-colors ${isToday ? 'bg-gold-500/5 border-l-2 border-l-gold-500' : isSoon ? 'bg-red-500/3' : 'hover:bg-navy-800/20'}`}>
                    <div className="text-center w-16 flex-shrink-0">
                      <div className="text-[14px] font-bold text-white font-mono leading-tight">
                        {new Date(ev.date).toLocaleDateString('fr-MA', { day: '2-digit' })}
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase">
                        {new Date(ev.date).toLocaleDateString('fr-MA', { month: 'short', year: '2-digit' })}
                      </div>
                      <div className={`text-[10px] font-mono font-bold mt-1 ${d === 0 ? 'text-gold-400' : d <= 7 ? 'text-red-400' : d <= 21 ? 'text-amber-400' : 'text-slate-600'}`}>
                        {d === 0 ? 'AUJOURD\'HUI' : `J-${d}`}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <CurrencyFlag countryCode={ev.countryCode} size="xs" />
                        <span className="text-[13px] font-semibold text-white">{ev.titleFr}</span>
                        {ev.hasProjections && <span className="text-[9px] bg-blue-500/15 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded font-bold">+ PROJECTIONS SEP</span>}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <EventTypeBadge type={ev.type} />
                        <ImpactBadge impact={ev.impact} />
                        <span className="text-[9px] text-slate-500 font-mono">{ev.date}</span>
                      </div>
                      <p className="text-[12px] text-slate-400 leading-relaxed">{ev.noteFr}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-amber-900/10 border border-amber-700/30 rounded-lg p-3">
            <p className="text-[10px] text-amber-400/90 flex items-start gap-1.5">
              <Info size={11} className="flex-shrink-0 mt-0.5" />
              Calendrier indicatif 2026 â€” Dates susceptibles d'être révisées. Source: FRB/Fed, BCE, BKAM. Les dates NFP peuvent être décalées en cas de jours fériés américains. Pour les dates définitives, consultez federalreserve.gov, ecb.europa.eu, bkam.ma.
            </p>
          </div>

          <FunnelCTA variant="calendar" />
          <FunnelCTA />
        </div>
      )}

      {/* ╔╔ ANALYSIS TAB ╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔ */}
      {tab === 'ANALYSIS' && (
        <div className="space-y-5">
          {reportLoading ? (
            <div className="flex items-center justify-center py-20 text-slate-500">
              <RefreshCw size={18} className="animate-spin mr-2" />
              <span className="text-sm">Chargement du rapport IA…</span>
            </div>
          ) : !report ? (
            <div className="text-center py-20 space-y-4">
              <FileText size={32} className="text-slate-600 mx-auto" />
              <p className="text-slate-400 text-sm">Aucune analyse publiée disponible.</p>
              <p className="text-slate-500 text-xs">Le rapport hebdomadaire est généré automatiquement à 09h00 Casablanca (Lundiâ€“Vendredi).</p>
            </div>
          ) : (
            <>
              {/* Report header */}
              <div className="bg-navy-900 border border-navy-800 rounded-xl overflow-hidden">
                <div className="h-0.5 bg-gradient-to-r from-gold-700 via-gold-400 to-gold-700" />
                <div className="p-6">
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[9px] bg-gold-500/15 border border-gold-500/30 text-gold-400 px-2 py-0.5 rounded-full font-bold uppercase">Rapport IA · JAD2FX</span>
                        <span className="text-[9px] bg-navy-800 border border-navy-700 text-navy-400 px-1.5 py-0.5 rounded font-mono">{report.llmModel}</span>
                      </div>
                      <h2 className="text-xl font-serif font-bold text-white leading-snug mb-1">{report.titleFr}</h2>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {new Date(report.createdAt).toLocaleDateString('fr-MA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        {report.generation.tavilySearchCount > 0 && ` · ${report.generation.tavilySearchCount} sources web`}
                      </p>
                    </div>
                    <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] border border-navy-700 bg-navy-800 rounded-lg text-slate-300 hover:border-gold-500 hover:text-gold-400 transition-colors">
                      <Download size={11} /> PDF
                    </button>
                  </div>
                  <div className="mt-4 border-l-2 border-gold-500/50 pl-4 italic">
                    <p className="text-[13px] text-slate-300 leading-relaxed">{report.excerptFr}</p>
                  </div>
                </div>
              </div>

              {/* Radar */}
              {report.radarData?.length > 0 && (
                <div className="bg-navy-900 border border-navy-700 rounded-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-navy-800">
                    <h3 className="text-[11px] font-bold text-white uppercase tracking-widest">Radar Devises â€” Analyse Éditoriale</h3>
                  </div>
                  <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {report.radarData.map(r => (
                      <div key={r.currency} className={`border rounded-xl p-3 text-center ${r.sentiment === 'BULLISH' ? 'border-red-700/50 bg-red-900/15' : r.sentiment === 'BEARISH' ? 'border-emerald-700/50 bg-emerald-900/15' : 'border-navy-700 bg-navy-800/40'}`}>
                        <div className="flex justify-center mb-1.5">
                          <CurrencyFlag countryCode={
                            r.currency === 'EUR' ? 'eu' : r.currency === 'USD' ? 'us' :
                            r.currency === 'GBP' ? 'gb' : r.currency === 'SAR' ? 'sa' :
                            r.currency === 'AED' ? 'ae' : r.currency === 'QAR' ? 'qa' : 'un'
                          } size="md" />
                        </div>
                        <div className="text-[11px] font-bold text-white">{r.currency}/MAD</div>
                        <div className="text-[14px] font-mono font-bold text-white mt-0.5">{r.currentRate.toFixed(4)}</div>
                        <div className={`text-[9px] font-bold mt-1 ${r.weeklyChangeBps > 0 ? 'text-red-400' : r.weeklyChangeBps < 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {r.weeklyChangeBps > 0 ? '+' : ''}{r.weeklyChangeBps} bps/sem
                        </div>
                        <div className="text-[9px] text-slate-400 mt-1 leading-snug">{r.headline}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Full content */}
              <div className="bg-navy-900 border border-navy-700 rounded-xl p-6">
                <MarkdownSection content={report.contentFr} />
              </div>

              <div className="text-[10px] text-slate-600 text-center">
                Analyse générée par IA à partir des données BKAM, ECB et sources web Tavily.
                À titre informatif uniquement â€” non contractuel â€” JAD2 Advisory.
              </div>

              {/* Analysis tab funnel */}
              {config.corsProxyUrl && (
                <div className="bg-navy-900 border border-navy-700 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Mail size={14} className="text-gold-500" />
                    <h3 className="text-[11px] font-bold text-white uppercase tracking-widest">Recevoir ce briefing quotidiennement</h3>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">Inscription gratuite · Données éducatives · 09h00 Casablanca</p>
                  <NewsletterSignup proxyUrl={config.corsProxyUrl} />
                </div>
              )}
              <FunnelCTA />
            </>
          )}
        </div>
      )}

      {/* ╔╔ Footer ╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔╔ */}
      <div className="bg-navy-950/50 border border-navy-800 rounded-lg p-4">
        <p className="text-[10px] text-slate-600 text-center leading-relaxed">
          Morning Briefing JAD2FX â€” Données indicatives à titre éducatif uniquement · Cours BKAM / ECB Frankfurter · Non exécutables ·
          Ce contenu ne constitue pas un conseil en investissement ni une recommandation de transaction de change ·
          Pour toute opération, adressez-vous à un établissement de crédit agréé par Bank Al-Maghrib ·{' '}
          <a href="https://jad2advisory.com" target="_blank" rel="noopener noreferrer" className="text-gold-600 hover:text-gold-400">jad2advisory.com</a>
        </p>
      </div>

      </div>{/* end briefing-screen */}
    </div>
  );
}
