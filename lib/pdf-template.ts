/**
 * PDF report template for FX Risk Report.
 * Uses @react-pdf/renderer for server-side PDF generation (no browser/Puppeteer needed).
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2' },
  ],
});

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#0A0F1E',
    color: '#F1F5F9',
    fontFamily: 'Helvetica',
    fontSize: 9,
    padding: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  logoText: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: -0.5,
    color: '#F1F5F9',
  },
  logoFX: { color: '#00C896' },
  headerRight: { textAlign: 'right' },
  headerLabel: { fontSize: 7, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 },
  headerValue: { fontSize: 9, color: '#94A3B8', marginTop: 1 },
  sectionTitle: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#64748B',
    marginBottom: 8,
    marginTop: 16,
  },
  card: {
    backgroundColor: '#111827',
    borderRadius: 4,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardTitle: { fontSize: 7, color: '#64748B', marginBottom: 4 },
  cardValue: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#00C896' },
  cardUnit: { fontSize: 8, color: '#94A3B8', marginTop: 2 },
  grid2: { flexDirection: 'row', gap: 8 },
  grid4: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  gridItem: { flex: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  rowLabel: { color: '#64748B', fontSize: 8 },
  rowValue: { color: '#F1F5F9', fontSize: 8, fontFamily: 'Helvetica-Bold' },
  alertBox: {
    backgroundColor: 'rgba(212,160,23,0.08)',
    borderLeftWidth: 3,
    borderLeftColor: '#D4A017',
    padding: 10,
    marginVertical: 8,
    borderRadius: 2,
  },
  alertTitle: { fontSize: 8, color: '#D4A017', fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  alertText: { fontSize: 8, color: '#94A3B8', lineHeight: 1.5 },
  ctaBox: {
    backgroundColor: 'rgba(0,200,150,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(0,200,150,0.15)',
    borderRadius: 4,
    padding: 16,
    marginTop: 16,
  },
  ctaTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#00C896', marginBottom: 4 },
  ctaText: { fontSize: 8, color: '#94A3B8', marginBottom: 8, lineHeight: 1.5 },
  ctaEmail: { fontSize: 9, color: '#D4A017', fontFamily: 'Helvetica-Bold' },
  disclaimer: {
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  disclaimerText: { fontSize: 6.5, color: '#374151', lineHeight: 1.5 },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
  checkMark: { color: '#22C55E', fontSize: 8, marginRight: 6, fontFamily: 'Helvetica-Bold' },
  checkLabel: { fontSize: 8, color: '#94A3B8', flex: 1 },
  pageNumber: { position: 'absolute', bottom: 20, right: 32, fontSize: 7, color: '#374151' },
  refId: { fontFamily: 'Helvetica-Bold', fontSize: 7, color: '#64748B' },
});

interface ReportData {
  company: string;
  currency: string;
  amount: number;
  serviceType: string;
  refId: string;
  date: string;
}

function computeMetrics(amount: number, currency: string) {
  // Illustrative risk metrics — for pedagogical purposes only
  const madRate = { EUR: 10.92, USD: 9.95, GBP: 12.65, CHF: 11.06, JPY: 0.064, CAD: 7.21, SAR: 2.65, AED: 2.71 }[currency] ?? 10.0;
  const exposureMad = amount * madRate;
  const varFactor = { EUR: 0.068, USD: 0.072, GBP: 0.085, CHF: 0.058, JPY: 0.092 }[currency] ?? 0.075;
  const var95 = exposureMad * varFactor;
  const var99 = var95 * 1.45;
  const es = var99 * 1.18;
  const hedgeRatio = Math.min(0.75, 0.4 + (exposureMad / 5_000_000) * 0.25);
  const unhedged = exposureMad * (1 - hedgeRatio);

  return {
    exposureMad,
    var95,
    var99,
    es,
    hedgeRatio,
    unhedged,
    madRate,
  };
}

function fmt(n: number, dec = 0): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function fmtMAD(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} M MAD`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} K MAD`;
  return `${fmt(n)} MAD`;
}

export function buildReport(data: ReportData) {
  const { company, currency, amount, refId, date } = data;
  const m = computeMetrics(amount, currency);

  return React.createElement(
    Document,
    {
      title: `Rapport de Risque FX — ${company}`,
      author: 'JAD2 Advisory',
      subject: 'Analyse de risque de change — pédagogique',
    },

    // ── PAGE 1: Executive Risk Dashboard ────────────────────────────────────
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },

      // Header
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(
          View,
          null,
          React.createElement(
            Text,
            { style: styles.logoText },
            'JAD2',
            React.createElement(Text, { style: styles.logoFX }, 'FX'),
          ),
          React.createElement(Text, { style: [styles.headerLabel, { marginTop: 4 }] }, 'Rapport de Risque FX'),
          React.createElement(Text, { style: [styles.headerValue, { color: '#D4A017', fontFamily: 'Helvetica-Bold' }] }, company),
        ),
        React.createElement(
          View,
          { style: styles.headerRight },
          React.createElement(Text, { style: styles.headerLabel }, 'Référence'),
          React.createElement(Text, { style: styles.refId }, refId),
          React.createElement(Text, { style: [styles.headerLabel, { marginTop: 6 }] }, 'Date'),
          React.createElement(Text, { style: styles.headerValue }, date),
          React.createElement(Text, { style: [styles.headerLabel, { marginTop: 6 }] }, 'Devise exposée'),
          React.createElement(Text, { style: [styles.headerValue, { color: '#00C896' }] }, currency),
        ),
      ),

      // Alert
      React.createElement(
        View,
        { style: styles.alertBox },
        React.createElement(Text, { style: styles.alertTitle }, '⚠ Avertissement pédagogique'),
        React.createElement(
          Text,
          { style: styles.alertText },
          'Ce rapport est généré à titre pédagogique uniquement. Les métriques présentées sont illustratives et ne constituent pas un conseil en investissement. JAD2 Advisory n\'est pas habilitée à fournir des services d\'investissement au sens de la réglementation AMMC.',
        ),
      ),

      // Section: Exposure
      React.createElement(Text, { style: styles.sectionTitle }, '1. Snapshot d\'exposition'),
      React.createElement(
        View,
        { style: styles.grid2 },
        React.createElement(
          View,
          { style: [styles.card, styles.gridItem] },
          React.createElement(Text, { style: styles.cardTitle }, 'Exposition brute déclarée'),
          React.createElement(Text, { style: styles.cardValue }, `${fmt(amount)} ${currency}`),
          React.createElement(Text, { style: styles.cardUnit }, `≈ ${fmtMAD(m.exposureMad)} au cours indicatif`),
        ),
        React.createElement(
          View,
          { style: [styles.card, styles.gridItem] },
          React.createElement(Text, { style: styles.cardTitle }, 'Position nette non couverte (estimée)'),
          React.createElement(Text, { style: [styles.cardValue, { color: '#EF4444' }] }, fmtMAD(m.unhedged)),
          React.createElement(Text, { style: styles.cardUnit }, `Ratio de couverture suggéré : ${(m.hedgeRatio * 100).toFixed(0)}%`),
        ),
      ),

      // Section: Core Risk Metrics
      React.createElement(Text, { style: styles.sectionTitle }, '2. Métriques de risque illustratives'),
      React.createElement(
        View,
        { style: styles.grid4 },
        ...[
          { label: 'VaR 95% (10j)', value: fmtMAD(m.var95), color: '#D4A017' },
          { label: 'VaR 99% (10j)', value: fmtMAD(m.var99), color: '#EF4444' },
          { label: 'Expected Shortfall', value: fmtMAD(m.es), color: '#EF4444' },
          { label: 'Cours central utilisé', value: `${m.madRate.toFixed(4)} MAD/${currency}`, color: '#00C896' },
        ].map(({ label, value, color }) =>
          React.createElement(
            View,
            { key: label, style: [styles.card, { flex: 1 }] },
            React.createElement(Text, { style: styles.cardTitle }, label),
            React.createElement(Text, { style: [styles.cardValue, { fontSize: 12, color }] }, value),
          )
        ),
      ),

      React.createElement(Text, { style: styles.pageNumber }, '1 / 3'),
    ),

    // ── PAGE 2: Stress Testing ────────────────────────────────────────────────
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },
      React.createElement(Text, { style: styles.sectionTitle }, '3. Stress Testing — Scénarios historiques'),
      React.createElement(
        View,
        { style: styles.card },
        ...[
          ['Scénario 2008 (crise financière)', '+8.2%', fmtMAD(m.exposureMad * 0.082)],
          ['Scénario 2020 (pandémie COVID-19)', '+5.4%', fmtMAD(m.exposureMad * 0.054)],
          ['Scénario 2022 (choc inflation USD)', '+6.8%', fmtMAD(m.exposureMad * 0.068)],
          ['Dévaluation MAD de 5%', '–5.0%', fmtMAD(m.exposureMad * 0.050)],
          ['Choc extrême (tail risk)', '+12.0%', fmtMAD(m.exposureMad * 0.120)],
        ].map(([label, move, impact]) =>
          React.createElement(
            View,
            { key: label as string, style: styles.row },
            React.createElement(Text, { style: styles.rowLabel }, label),
            React.createElement(Text, { style: [styles.rowValue, { color: '#D4A017' }] }, `Mouvement: ${move} · Impact: ${impact}`),
          )
        ),
      ),

      React.createElement(Text, { style: styles.sectionTitle }, '4. Analyse de la courbe forward (indicative)'),
      React.createElement(
        View,
        { style: styles.card },
        ...[
          ['30 jours', m.madRate * 1.002, 0.2],
          ['90 jours', m.madRate * 1.005, 0.5],
          ['180 jours', m.madRate * 1.009, 0.9],
          ['360 jours', m.madRate * 1.015, 1.5],
        ].map(([tenor, rate, cost]) =>
          React.createElement(
            View,
            { key: tenor as string, style: styles.row },
            React.createElement(Text, { style: styles.rowLabel }, `Forward ${tenor}`),
            React.createElement(
              Text,
              { style: styles.rowValue },
              `${(rate as number).toFixed(4)} MAD/${currency} · Coût couverture: ${cost}%`,
            ),
          )
        ),
      ),

      React.createElement(Text, { style: styles.pageNumber }, '2 / 3'),
    ),

    // ── PAGE 3: Regulatory & CTA ───────────────────────────────────────────────
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },
      React.createElement(Text, { style: styles.sectionTitle }, '5. Conformité réglementaire — Office des Changes'),
      React.createElement(
        View,
        { style: styles.card },
        ...[
          ['Déclaration statistique BKAM requise (>1M MAD)', true],
          ['Justificatifs commerciaux pour import/export', true],
          ['Règles de rapatriement des recettes export', true],
          ['Plafonds de couverture par anticipation (Office des Changes)', true],
          ['Reporting position de change (si applicable)', m.exposureMad > 5_000_000],
        ].map(([label, ok]) =>
          React.createElement(
            View,
            { key: label as string, style: styles.checkRow },
            React.createElement(Text, { style: styles.checkMark }, ok ? '✓' : '○'),
            React.createElement(Text, { style: styles.checkLabel }, label),
          )
        ),
      ),

      React.createElement(
        View,
        { style: styles.ctaBox },
        React.createElement(Text, { style: styles.ctaTitle }, 'PROCHAINES ÉTAPES — JAD2 ADVISORY'),
        React.createElement(
          Text,
          { style: styles.ctaText },
          `Ce rapport pédagogique révèle une exposition FX de ${fmtMAD(m.exposureMad)} en ${currency}/MAD. ` +
          'JAD2 Advisory peut vous accompagner pour:\n\n' +
          '• Audit détaillé de votre exposition réelle\n' +
          '• Structuration d\'une politique de couverture adaptée\n' +
          '• Formation de vos équipes à la gestion du risque de change\n' +
          '• Accompagnement dans la conformité Office des Changes\n' +
          '• Automatisation du reporting de positions FX',
        ),
        React.createElement(Text, { style: styles.ctaEmail }, 'contact@jad2advisory.com'),
        React.createElement(Text, { style: [styles.ctaText, { marginTop: 6 }] }, 'jad2advisory.com'),
      ),

      React.createElement(
        View,
        { style: styles.disclaimer },
        React.createElement(
          Text,
          { style: styles.disclaimerText },
          'Ce rapport est généré à titre pédagogique uniquement. Les métriques VaR, Expected Shortfall et les cours forward présentés sont estimatifs et basés sur des données indicatives. Ils ne constituent pas un conseil en investissement, une recommandation de couverture, ni une offre de service financier. JAD2 Advisory n\'est pas habilitée à fournir des services d\'investissement au sens de la réglementation AMMC. Pour toute opération de change, adressez-vous à un établissement de crédit agréé par Bank Al-Maghrib. © JAD2 Advisory ' + new Date().getFullYear(),
        ),
      ),

      React.createElement(Text, { style: styles.pageNumber }, '3 / 3'),
    ),
  );
}
