import React, { useState } from 'react';
import { useI18n } from '../context/I18nContext';
import { BookOpen, ExternalLink, ChevronDown, ChevronRight, Shield, FileText, Scale, Globe } from 'lucide-react';
import { BKAM_LINKS } from '../constants/bkamLinks';

interface RegDoc {
  id: string;
  title: string;
  titleFr: string;
  titleAr: string;
  date: string;
  category: 'OC_CIRC' | 'OC_INSTR' | 'BKAM_NOTE' | 'BKAM_GUIDE';
  url: string;
  summary: string;
  summaryFr: string;
  summaryAr: string;
  tags: string[];
}

const REGULATIONS: RegDoc[] = [
  // â”€â”€ Office des Changes â€” Circulaires â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    id: 'circ-2017-01',
    title: 'Circular nÂ°2017/01 â€” Exchange Control Regulations for Imports & Exports',
    titleFr: 'Circulaire nÂ°2017/01 â€” RÃ©glementation des Changes Ã  l\'Import/Export',
    titleAr: 'Ù…Ù†Ø´ÙˆØ± Ø±Ù‚Ù… 2017/01 â€” Ø£Ø­ÙƒØ§Ù… Ø§Ù„ØµØ±Ù Ø§Ù„Ù…ØªØ¹Ù„Ù‚Ø© Ø¨Ø§Ù„Ø§Ø³ØªÙŠØ±Ø§Ø¯ ÙˆØ§Ù„ØªØµØ¯ÙŠØ±',
    date: '2017-01-01',
    category: 'OC_CIRC',
    url: 'https://www.oc.gov.ma/sites/default/files/2017-08/Circulaire_2017-01.pdf',
    summary: 'General framework for foreign exchange operations related to trade transactions â€” import/export repatriation obligations.',
    summaryFr: 'Cadre gÃ©nÃ©ral des opÃ©rations de change liÃ©es aux transactions commerciales â€” obligations de rapatriement import/export.',
    summaryAr: 'Ø§Ù„Ø¥Ø·Ø§Ø± Ø§Ù„Ø¹Ø§Ù… Ù„Ø¹Ù…Ù„ÙŠØ§Øª Ø§Ù„ØµØ±Ù Ø§Ù„Ù…ØªØ¹Ù„Ù‚Ø© Ø¨Ø§Ù„Ù…Ø¹Ø§Ù…Ù„Ø§Øª Ø§Ù„ØªØ¬Ø§Ø±ÙŠØ© â€” Ø§Ù„ØªØ²Ø§Ù…Ø§Øª Ø§Ù„Ø¥Ø¹Ø§Ø¯Ø© Ù„Ù„Ø§Ø³ØªÙŠØ±Ø§Ø¯/Ø§Ù„ØªØµØ¯ÙŠØ±.',
    tags: ['import', 'export', 'rapatriement', 'commerce'],
  },
  {
    id: 'circ-2014-02',
    title: 'Circular nÂ°2014/02 â€” Capital Operations and Direct Investment',
    titleFr: 'Circulaire nÂ°2014/02 â€” OpÃ©rations en Capital et Investissements Directs',
    titleAr: 'Ù…Ù†Ø´ÙˆØ± Ø±Ù‚Ù… 2014/02 â€” Ø¹Ù…Ù„ÙŠØ§Øª Ø±Ø£Ø³ Ø§Ù„Ù…Ø§Ù„ ÙˆØ§Ù„Ø§Ø³ØªØ«Ù…Ø§Ø±Ø§Øª Ø§Ù„Ù…Ø¨Ø§Ø´Ø±Ø©',
    date: '2014-04-01',
    category: 'OC_CIRC',
    url: 'https://www.oc.gov.ma/sites/default/files/2017-08/Circulaire_2014-02.pdf',
    summary: 'Rules governing foreign direct investment (FDI) flows, capital transfers, and repatriation of investment income.',
    summaryFr: 'RÃ¨gles rÃ©gissant les flux d\'investissements directs Ã©trangers (IDE), les transferts de capitaux et le rapatriement des revenus.',
    summaryAr: 'Ù‚ÙˆØ§Ø¹Ø¯ ØªÙ†Ø¸ÙŠÙ… ØªØ¯ÙÙ‚Ø§Øª Ø§Ù„Ø§Ø³ØªØ«Ù…Ø§Ø± Ø§Ù„Ø£Ø¬Ù†Ø¨ÙŠ Ø§Ù„Ù…Ø¨Ø§Ø´Ø± ÙˆØªØ­ÙˆÙŠÙ„Ø§Øª Ø±Ø£Ø³ Ø§Ù„Ù…Ø§Ù„ ÙˆØ¥Ø¹Ø§Ø¯Ø© Ø¯Ø®Ù„ Ø§Ù„Ø§Ø³ØªØ«Ù…Ø§Ø±.',
    tags: ['IDE', 'capital', 'investissement', 'rapatriement'],
  },
  {
    id: 'circ-2023-dotation',
    title: 'Circular â€” Travel Allowances & Personal Foreign Exchange Dotations',
    titleFr: 'Circulaire â€” Dotations de Voyage et Allocations de Change Personnelles',
    titleAr: 'Ù…Ù†Ø´ÙˆØ± â€” ØªØ®ØµÙŠØµØ§Øª Ø§Ù„Ø³ÙØ± ÙˆÙ…Ø®ØµØµØ§Øª Ø§Ù„ØµØ±Ù Ø§Ù„Ø´Ø®ØµÙŠØ©',
    date: '2023-01-01',
    category: 'OC_CIRC',
    url: 'https://www.oc.gov.ma/fr/reglementation/voyageurs',
    summary: 'Annual travel allowances for Moroccan residents: 45,000 MAD general travel, 20,000 MAD business, student dotations.',
    summaryFr: 'Dotations annuelles pour les rÃ©sidents marocains : 45 000 MAD voyages personnels, 20 000 MAD affaires, dotations Ã©tudiants.',
    summaryAr: 'Ø§Ù„Ù…Ø®ØµØµØ§Øª Ø§Ù„Ø³Ù†ÙˆÙŠØ© Ù„Ù„Ù…Ù‚ÙŠÙ…ÙŠÙ† Ø§Ù„Ù…ØºØ§Ø±Ø¨Ø©: 45,000 Ø¯Ø±Ù‡Ù… Ù„Ù„Ø³ÙØ± Ø§Ù„Ø´Ø®ØµÙŠØŒ 20,000 Ø¯Ø±Ù‡Ù… Ù„Ù„Ø£Ø¹Ù…Ø§Ù„ØŒ Ù…Ø®ØµØµØ§Øª Ø§Ù„Ø·Ù„Ø§Ø¨.',
    tags: ['voyage', 'dotation', 'tourisme', 'allocation'],
  },
  // â”€â”€ Office des Changes â€” Instructions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    id: 'instr-2023-01',
    title: 'Instruction nÂ°01/2023 â€” Hedging of FX Risk by Moroccan Companies',
    titleFr: 'Instruction nÂ°01/2023 â€” Couverture du Risque de Change par les Entreprises',
    titleAr: 'ØªØ¹Ù„ÙŠÙ…Ø§Øª Ø±Ù‚Ù… 01/2023 â€” ØªØºØ·ÙŠØ© Ù…Ø®Ø§Ø·Ø± Ø§Ù„ØµØ±Ù Ù…Ù† Ù‚Ø¨Ù„ Ø§Ù„Ø´Ø±ÙƒØ§Øª Ø§Ù„Ù…ØºØ±Ø¨ÙŠØ©',
    date: '2023-03-15',
    category: 'OC_INSTR',
    url: 'https://www.oc.gov.ma/fr/reglementation/entreprises/couverture-change',
    summary: 'Authorization and conditions for Moroccan companies to use FX forwards, options and swaps to hedge commercial FX risk.',
    summaryFr: 'Autorisation et conditions permettant aux entreprises marocaines d\'utiliser des forwards, options et swaps pour couvrir le risque de change commercial.',
    summaryAr: 'Ø§Ù„ØªØ±Ø®ÙŠØµ ÙˆØ§Ù„Ø´Ø±ÙˆØ· Ø§Ù„ØªÙŠ ØªØªÙŠØ­ Ù„Ù„Ø´Ø±ÙƒØ§Øª Ø§Ù„Ù…ØºØ±Ø¨ÙŠØ© Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø§Ù„Ø¹Ù‚ÙˆØ¯ Ø§Ù„Ø¢Ø¬Ù„Ø© ÙˆØ§Ù„Ø®ÙŠØ§Ø±Ø§Øª ÙˆØ§Ù„Ù…Ù‚Ø§ÙŠØ¶Ø§Øª Ù„ØªØºØ·ÙŠØ© Ù…Ø®Ø§Ø·Ø± Ø§Ù„ØµØ±Ù Ø§Ù„ØªØ¬Ø§Ø±ÙŠØ©.',
    tags: ['couverture', 'forward', 'swap', 'option', 'entreprise'],
  },
  {
    id: 'instr-services',
    title: 'Instruction â€” Payments for International Services & Royalties',
    titleFr: 'Instruction â€” RÃ¨glement des Services Internationaux et Redevances',
    titleAr: 'ØªØ¹Ù„ÙŠÙ…Ø§Øª â€” Ø³Ø¯Ø§Ø¯ Ø§Ù„Ø®Ø¯Ù…Ø§Øª Ø§Ù„Ø¯ÙˆÙ„ÙŠØ© ÙˆØ§Ù„Ø¥ØªØ§ÙˆØ§Øª',
    date: '2022-01-01',
    category: 'OC_INSTR',
    url: 'https://www.oc.gov.ma/fr/reglementation/entreprises/services',
    summary: 'Procedures and limits for outward payments for services: consulting, IT, royalties, technical assistance.',
    summaryFr: 'ProcÃ©dures et plafonds pour les paiements extÃ©rieurs de services : conseil, IT, redevances, assistance technique.',
    summaryAr: 'Ø§Ù„Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª ÙˆØ§Ù„Ø­Ø¯ÙˆØ¯ Ù„Ù…Ø¯ÙÙˆØ¹Ø§Øª Ø§Ù„Ø®Ø¯Ù…Ø§Øª Ø§Ù„Ø®Ø§Ø±Ø¬ÙŠØ©: Ø§Ù„Ø§Ø³ØªØ´Ø§Ø±Ø§Øª ÙˆØªÙƒÙ†ÙˆÙ„ÙˆØ¬ÙŠØ§ Ø§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª ÙˆØ§Ù„Ø¥ØªØ§ÙˆØ§Øª ÙˆØ§Ù„Ù…Ø³Ø§Ø¹Ø¯Ø© Ø§Ù„ØªÙ‚Ù†ÙŠØ©.',
    tags: ['services', 'IT', 'redevances', 'assistance technique'],
  },
  {
    id: 'instr-dividendes',
    title: 'Instruction â€” Repatriation of Dividends and Investment Income',
    titleFr: 'Instruction â€” Rapatriement de Dividendes et Revenus de Placement',
    titleAr: 'ØªØ¹Ù„ÙŠÙ…Ø§Øª â€” Ø¥Ø¹Ø§Ø¯Ø© ØªÙˆØ·ÙŠÙ† Ø£Ø±Ø¨Ø§Ø­ Ø§Ù„Ø£Ø³Ù‡Ù… ÙˆØ¯Ø®Ù„ Ø§Ù„Ø§Ø³ØªØ«Ù…Ø§Ø±',
    date: '2021-06-01',
    category: 'OC_INSTR',
    url: 'https://www.oc.gov.ma/fr/reglementation/entreprises/dividendes',
    summary: 'Conditions for transferring dividends, interest and profits from Morocco abroad by foreign investors.',
    summaryFr: 'Conditions de transfert de dividendes, intÃ©rÃªts et bÃ©nÃ©fices depuis le Maroc vers l\'Ã©tranger par les investisseurs Ã©trangers.',
    summaryAr: 'Ø´Ø±ÙˆØ· ØªØ­ÙˆÙŠÙ„ Ø£Ø±Ø¨Ø§Ø­ Ø§Ù„Ø£Ø³Ù‡Ù… ÙˆØ§Ù„ÙÙˆØ§Ø¦Ø¯ ÙˆØ§Ù„Ø£Ø±Ø¨Ø§Ø­ Ù…Ù† Ø§Ù„Ù…ØºØ±Ø¨ Ø¥Ù„Ù‰ Ø§Ù„Ø®Ø§Ø±Ø¬ Ù…Ù† Ù‚Ø¨Ù„ Ø§Ù„Ù…Ø³ØªØ«Ù…Ø±ÙŠÙ† Ø§Ù„Ø£Ø¬Ø§Ù†Ø¨.',
    tags: ['dividendes', 'IDE', 'transfert', 'investisseurs'],
  },
  // â”€â”€ BKAM Notes & Guides â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    id: 'bkam-methodo-fixing',
    title: 'BKAM â€” Methodology of the MAD Reference Exchange Rate',
    titleFr: 'BKAM â€” MÃ©thodologie du Cours de RÃ©fÃ©rence du Dirham',
    titleAr: 'Ø¨Ù†Ùƒ Ø§Ù„Ù…ØºØ±Ø¨ â€” Ù…Ù†Ù‡Ø¬ÙŠØ© Ø³Ø¹Ø± ØµØ±Ù Ø§Ù„Ø¯Ø±Ù‡Ù… Ø§Ù„Ù…Ø±Ø¬Ø¹ÙŠ',
    date: '2018-07-02',
    category: 'BKAM_NOTE',
    url: BKAM_LINKS.methodologyTCRE,
    summary: "Official methodology for computing the MAD fixing rate from the EUR/USD basket (60/40 weighting) and BKAM's 14-currency panel.",
    summaryFr: 'MÃ©thodologie officielle du calcul du cours de rÃ©fÃ©rence MAD Ã  partir du panier EUR/USD (pondÃ©ration 60/40) et panel 14 devises BKAM.',
    summaryAr: 'Ø§Ù„Ù…Ù†Ù‡Ø¬ÙŠØ© Ø§Ù„Ø±Ø³Ù…ÙŠØ© Ù„Ø­Ø³Ø§Ø¨ Ø³Ø¹Ø± ØµØ±Ù Ø§Ù„Ø¯Ø±Ù‡Ù… Ø§Ù„Ù…Ø±Ø¬Ø¹ÙŠ Ù…Ù† Ø³Ù„Ø© Ø§Ù„ÙŠÙˆØ±Ùˆ/Ø§Ù„Ø¯ÙˆÙ„Ø§Ø± (ØªØ±Ø¬ÙŠØ­ 60/40) ÙˆÙ„Ø¬Ù†Ø© 14 Ø¹Ù…Ù„Ø© Ù„Ø¨Ù†Ùƒ Ø§Ù„Ù…ØºØ±Ø¨.',
    tags: ['fixing', 'mÃ©thodologie', 'panier', 'EUR/USD', 'MAD'],
  },
  {
    id: 'bkam-flexibilite-2018',
    title: 'BKAM â€” Foreign Exchange Regime Flexibility (January 2018)',
    titleFr: 'BKAM â€” Ã‰largissement des Marges de Fluctuation du Dirham (Janvier 2018)',
    titleAr: 'Ø¨Ù†Ùƒ Ø§Ù„Ù…ØºØ±Ø¨ â€” ØªÙˆØ³ÙŠØ¹ Ù‡Ø§Ù…Ø´ ØªØ°Ø¨Ø°Ø¨ Ø§Ù„Ø¯Ø±Ù‡Ù… (ÙŠÙ†Ø§ÙŠØ± 2018)',
    date: '2018-01-15',
    category: 'BKAM_NOTE',
    url: BKAM_LINKS.regimeDeChange,
    summary: 'BKAM widens MAD fluctuation band from Â±0.3% to Â±2.5% against the EUR/USD basket, marking Morocco\'s move toward greater FX flexibility.',
    summaryFr: 'Ã‰largissement du taux de fluctuation du dirham de Â±0,3% Ã  Â±2,5% par rapport au panier EUR/USD â€” passage vers plus de flexibilitÃ©.',
    summaryAr: 'ØªÙˆØ³ÙŠØ¹ Ù‡Ø§Ù…Ø´ ØªØ°Ø¨Ø°Ø¨ Ø§Ù„Ø¯Ø±Ù‡Ù… Ù…Ù† Â±0.3% Ø¥Ù„Ù‰ Â±2.5% Ù…Ù‚Ø§Ø¨Ù„ Ø³Ù„Ø© Ø§Ù„ÙŠÙˆØ±Ùˆ/Ø§Ù„Ø¯ÙˆÙ„Ø§Ø± â€” Ø§Ù„ØªØ­ÙˆÙ„ Ù†Ø­Ùˆ Ù…Ø±ÙˆÙ†Ø© Ø£ÙƒØ¨Ø±.',
    tags: ['flexibilitÃ©', 'bande', 'fluctuation', 'regime change', '2018'],
  },
  {
    id: 'bkam-guide-entreprises',
    title: 'BKAM â€” Practical Guide for FX Operations by Moroccan Companies',
    titleFr: 'BKAM â€” Guide Pratique des OpÃ©rations de Change pour les Entreprises',
    titleAr: 'Ø¨Ù†Ùƒ Ø§Ù„Ù…ØºØ±Ø¨ â€” Ø§Ù„Ø¯Ù„ÙŠÙ„ Ø§Ù„Ø¹Ù…Ù„ÙŠ Ù„Ø¹Ù…Ù„ÙŠØ§Øª Ø§Ù„ØµØ±Ù Ù„Ù„Ø´Ø±ÙƒØ§Øª',
    date: '2020-03-01',
    category: 'BKAM_GUIDE',
    url: BKAM_LINKS.guideEntreprises,
    summary: 'Practical guide covering FX operations available to Moroccan companies: spot, forward, options, and documentary requirements.',
    summaryFr: 'Guide pratique des opÃ©rations de change disponibles aux entreprises marocaines : spot, forward, options et exigences documentaires.',
    summaryAr: 'Ø¯Ù„ÙŠÙ„ Ø¹Ù…Ù„ÙŠ Ù„Ø¹Ù…Ù„ÙŠØ§Øª Ø§Ù„ØµØ±Ù Ø§Ù„Ù…ØªØ§Ø­Ø© Ù„Ù„Ø´Ø±ÙƒØ§Øª Ø§Ù„Ù…ØºØ±Ø¨ÙŠØ©: Ø§Ù„ÙÙˆØ±ÙŠ ÙˆØ§Ù„Ø¢Ø¬Ù„ ÙˆØ§Ù„Ø®ÙŠØ§Ø±Ø§Øª ÙˆØ§Ù„Ù…ØªØ·Ù„Ø¨Ø§Øª Ø§Ù„ÙˆØ«Ø§Ø¦Ù‚ÙŠØ©.',
    tags: ['guide', 'entreprises', 'spot', 'forward', 'options'],
  },
];

const CATEGORY_META = {
  OC_CIRC:    { label: 'OC Circulaires',  labelEn: 'OC Circulars',   labelAr: 'Ù…Ù†Ø´ÙˆØ±Ø§Øª Ù….Øµ',  icon: Scale,    color: 'text-gold-400',    bg: 'bg-gold-500/10 border-gold-700' },
  OC_INSTR:   { label: 'OC Instructions', labelEn: 'OC Instructions', labelAr: 'ØªØ¹Ù„ÙŠÙ…Ø§Øª Ù….Øµ',  icon: FileText, color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-700' },
  BKAM_NOTE:  { label: 'Notes BKAM',      labelEn: 'BKAM Notes',      labelAr: 'Ù…Ù„Ø§Ø­Ø¸Ø§Øª Ø¨.Ù…',  icon: BookOpen, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-700' },
  BKAM_GUIDE: { label: 'Guides BKAM',     labelEn: 'BKAM Guides',     labelAr: 'Ø£Ø¯Ù„Ø© Ø¨.Ù…',     icon: Shield,   color: 'text-purple-400',  bg: 'bg-purple-500/10 border-purple-700' },
};

type Category = keyof typeof CATEGORY_META;

function getCatLabel(cat: Category, locale: string): string {
  const m = CATEGORY_META[cat];
  return locale === 'ar' ? m.labelAr : locale === 'en' ? m.labelEn : m.label;
}

function getDocText(doc: RegDoc, locale: string): { title: string; summary: string } {
  if (locale === 'ar') return { title: doc.titleAr, summary: doc.summaryAr };
  if (locale === 'en') return { title: doc.title,   summary: doc.summary };
  return { title: doc.titleFr, summary: doc.summaryFr };
}

export default function RegulationsPage() {
  const { locale, isRTL } = useI18n();
  const [activeCategory, setActiveCategory] = useState<Category | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const heading = locale === 'ar' ? 'Ø§Ù„Ù…Ø±Ø¬Ø¹ÙŠØ© Ø§Ù„ØªÙ†Ø¸ÙŠÙ…ÙŠØ©' : locale === 'en' ? 'Regulatory Reference' : 'RÃ©fÃ©rentiel RÃ©glementaire';
  const sub     = locale === 'ar'
    ? 'Ø§Ù„Ù†ØµÙˆØµ Ø§Ù„Ø±Ø³Ù…ÙŠØ© Ù„Ù…ÙƒØªØ¨ Ø§Ù„ØµØ±Ù ÙˆØ¨Ù†Ùƒ Ø§Ù„Ù…ØºØ±Ø¨ Ø§Ù„Ù…ØªØ¹Ù„Ù‚Ø© Ø¨Ø³ÙˆÙ‚ Ø§Ù„ØµØ±Ù'
    : locale === 'en'
    ? 'Official Office des Changes & BKAM texts governing the FX market'
    : 'Textes officiels de l\'Office des Changes & BKAM rÃ©gissant le marchÃ© des changes';
  const searchPlaceholder = locale === 'ar' ? 'Ø§Ø¨Ø­Ø« ÙÙŠ Ø§Ù„Ø£Ù†Ø¸Ù…Ø©â€¦' : locale === 'en' ? 'Search regulationsâ€¦' : 'Rechercherâ€¦';
  const openLabel = locale === 'ar' ? 'ÙØªØ­ Ø§Ù„ÙˆØ«ÙŠÙ‚Ø© Ø§Ù„Ø±Ø³Ù…ÙŠØ©' : locale === 'en' ? 'Open Official Document' : 'Ouvrir le Document Officiel';
  const updatedLabel = locale === 'ar' ? 'ØªØ§Ø±ÙŠØ® Ø§Ù„Ù†Ø´Ø±:' : locale === 'en' ? 'Date:' : 'Date:';
  const allLabel = locale === 'ar' ? 'Ø§Ù„ÙƒÙ„' : locale === 'en' ? 'All' : 'Tout';
  const disclaimerText = locale === 'ar'
    ? 'Ù‡Ø°Ù‡ Ø§Ù„Ù‚Ø§Ø¦Ù…Ø© Ù„Ù„Ø£ØºØ±Ø§Ø¶ Ø§Ù„ØªØ¹Ù„ÙŠÙ…ÙŠØ© ÙÙ‚Ø·. ØªØ­Ù‚Ù‚ Ø¯Ø§Ø¦Ù…Ù‹Ø§ Ù…Ù† Ø§Ù„Ø¥ØµØ¯Ø§Ø±Ø§Øª Ø§Ù„Ø±Ø³Ù…ÙŠØ© Ø§Ù„Ø£Ø­Ø¯Ø« Ø¹Ù„Ù‰ Ù…ÙˆØ§Ù‚Ø¹ Ù…ÙƒØªØ¨ Ø§Ù„ØµØ±Ù ÙˆØ¨Ù†Ùƒ Ø§Ù„Ù…ØºØ±Ø¨.'
    : locale === 'en'
    ? 'This list is for educational purposes only. Always verify against the latest official versions on oc.gov.ma and bkam.ma.'
    : 'Cette liste est fournie Ã  titre informatif. VÃ©rifiez toujours les versions officielles les plus rÃ©centes sur oc.gov.ma et bkam.ma.';

  const categories = Object.keys(CATEGORY_META) as Category[];

  const filtered = REGULATIONS.filter(doc => {
    const { title, summary } = getDocText(doc, locale);
    const matchesCat = activeCategory === 'ALL' || doc.category === activeCategory;
    const matchesSearch = !search || [title, summary, ...doc.tags].some(s =>
      s.toLowerCase().includes(search.toLowerCase())
    );
    return matchesCat && matchesSearch;
  });

  const grouped = categories.reduce<Record<Category, RegDoc[]>>((acc, cat) => {
    acc[cat] = filtered.filter(d => d.category === cat);
    return acc;
  }, {} as Record<Category, RegDoc[]>);

  return (
    <div className={`space-y-6 ${isRTL ? 'text-right' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>

      {/* Header */}
      <div className="bg-navy-900 border border-navy-700 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-gold-500/10 border border-gold-700 rounded-lg flex items-center justify-center flex-shrink-0">
            <Scale size={18} className="text-gold-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white tracking-wide">{heading}</h2>
            <p className="text-slate-400 text-sm mt-1">{sub}</p>
          </div>
          <div className="flex gap-3 text-[10px] font-mono text-slate-500">
            <a href="https://www.oc.gov.ma" target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-1 hover:text-gold-400 transition">
              <Globe size={10} /> oc.gov.ma
            </a>
            <a href={BKAM_LINKS.mainSite} target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-1 hover:text-gold-400 transition">
              <Globe size={10} /> bkam.ma
            </a>
          </div>
        </div>

        {/* Search + category filter */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="flex-1 bg-navy-800 border border-navy-600 text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-gold-500 placeholder-slate-600"
          />
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setActiveCategory('ALL')}
              className={`px-3 py-1.5 text-xs font-bold rounded transition ${
                activeCategory === 'ALL'
                  ? 'bg-gold-500 text-navy-900'
                  : 'bg-navy-800 text-slate-400 border border-navy-700 hover:border-gold-600'
              }`}
            >
              {allLabel}
            </button>
            {categories.map(cat => {
              const m = CATEGORY_META[cat];
              const Icon = m.icon;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded border transition ${
                    activeCategory === cat ? m.bg + ' ' + m.color : 'bg-navy-800 text-slate-400 border-navy-700 hover:border-navy-500'
                  }`}
                >
                  <Icon size={10} />
                  {getCatLabel(cat, locale)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          {locale === 'ar' ? 'Ù„Ø§ ØªÙˆØ¬Ø¯ Ù†ØªØ§Ø¦Ø¬' : locale === 'en' ? 'No results found' : 'Aucun rÃ©sultat'}
        </div>
      ) : (
        categories.map(cat => {
          const docs = grouped[cat];
          if (!docs.length) return null;
          const m = CATEGORY_META[cat];
          const Icon = m.icon;
          return (
            <div key={cat}>
              {/* Category heading */}
              <div className={`flex items-center gap-2 mb-3 px-1`}>
                <Icon size={13} className={m.color} />
                <h3 className={`text-xs font-bold uppercase tracking-widest ${m.color}`}>
                  {getCatLabel(cat, locale)}
                </h3>
                <span className="text-[10px] text-slate-600 font-mono">({docs.length})</span>
              </div>

              <div className="space-y-2">
                {docs.map(doc => {
                  const { title, summary } = getDocText(doc, locale);
                  const isOpen = expanded === doc.id;
                  return (
                    <div
                      key={doc.id}
                      className={`bg-navy-900 border rounded-lg overflow-hidden transition-all ${
                        isOpen ? 'border-gold-700/60' : 'border-navy-700 hover:border-navy-600'
                      }`}
                    >
                      {/* Row header */}
                      <button
                        className="w-full flex items-center justify-between px-4 py-3 text-left"
                        onClick={() => setExpanded(isOpen ? null : doc.id)}
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${m.bg.includes('gold') ? 'bg-gold-600' : m.bg.includes('blue') ? 'bg-blue-600' : m.bg.includes('emerald') ? 'bg-emerald-600' : 'bg-purple-600'}`} />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white leading-snug">{title}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                              {updatedLabel} {doc.date}
                            </p>
                          </div>
                        </div>
                        {isOpen ? <ChevronDown size={14} className="text-slate-400 flex-shrink-0 ml-3" /> : <ChevronRight size={14} className="text-slate-500 flex-shrink-0 ml-3" />}
                      </button>

                      {/* Expanded body */}
                      {isOpen && (
                        <div className="px-4 pb-4 border-t border-navy-800">
                          <p className="text-sm text-slate-300 mt-3 leading-relaxed">{summary}</p>
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {doc.tags.map(tag => (
                              <span key={tag} className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-navy-800 text-slate-500 border border-navy-700">
                                {tag}
                              </span>
                            ))}
                          </div>
                          <div className="mt-4">
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-400 text-navy-900 text-xs font-bold rounded transition"
                            >
                              <ExternalLink size={12} />
                              {openLabel}
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}

      {/* Disclaimer */}
      <div className="bg-amber-950/20 border border-amber-800/30 rounded-lg px-4 py-3">
        <p className="text-[11px] text-amber-400/80 leading-relaxed">{disclaimerText}</p>
      </div>
    </div>
  );
}
