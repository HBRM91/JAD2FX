const en: Record<string, string> = {
  // Navigation
  'nav.home': 'News',
  'nav.dashboard': 'FX Rates',
  'nav.analysis': 'Analysis',
  'nav.fixing': 'BKAM Fixing',
  'nav.billets': 'Banknotes',
  'nav.commodities': 'Commodities',
  'nav.forwards': 'Forwards',
  'nav.swaps': 'FX Swaps',
  'nav.live': 'Live Pricer',
  'nav.admin': 'Admin',
  'nav.about': 'About',
  'nav.advisory': 'FX Advisory →',

  // Common
  'common.buy': 'Buy',
  'common.sell': 'Sell',
  'common.rate': 'Rate',
  'common.loading': 'Loading…',
  'common.refresh': 'Refresh',
  'common.source': 'Source',
  'common.currency': 'Currency',
  'common.date': 'Date',
  'common.change': 'Change',
  'common.spread': 'Spread',
  'common.commission': 'Commission',
  'common.mid': 'Mid',
  'common.high': 'High',
  'common.low': 'Low',
  'common.close': 'Close',
  'common.last': 'Last',
  'common.updated': 'Updated',
  'common.official': 'Official',
  'common.estimated': 'Estimated',
  'common.pair': 'Pair',
  'common.tenor': 'Tenor',
  'common.notional': 'Notional',
  'common.indicative': 'Indicative',
  'common.fallback': 'Reference data',
  'common.live': 'Live',
  'common.offline': 'Offline',

  // Billets page
  'billets.title': 'Bureau de Change — Banknote Exchange Rates',
  'billets.subtitle': 'Cash banknote rates for 14 BKAM currencies · Indicative Buy / Sell',
  'billets.officialLink': 'Official BKAM banknote rates ↗',
  'billets.vsBillet': 'vs Transfer',
  'billets.cashNote': 'Banknote rates are less favorable than wire transfer rates (cash handling costs + OC commission).',
  'billets.ocCommission': 'OC Banknote Commission',

  // Commodities page
  'commodities.title': 'Commodities — MAD Impact',
  'commodities.subtitle': 'Indicative prices · International markets · Impact for Moroccan companies',
  'commodities.all': 'All',
  'commodities.energy': 'Energy',
  'commodities.preciousMetals': 'Precious Metals',
  'commodities.industrialMetals': 'Industrial Metals',
  'commodities.agriculture': 'Agriculture',
  'commodities.madEquiv': 'MAD Equivalent',
  'commodities.moroccanContext': 'Morocco Relevance',
  'commodities.source': 'Source: Yahoo Finance — Indicative prices for Moroccan companies',
  'commodities.corsNote': 'Live data via Yahoo Finance. Configure a CORS proxy in Admin if data fails to load.',
  'commodities.week52': '52w Range',
  'commodities.fallbackNotice': 'Reference data shown (Yahoo Finance connection unavailable)',

  // Disclaimer
  'disclaimer.short': 'Indicative market data for reference · Professional advisory: jad2advisory.com',
  'disclaimer.noInvestmentAdvice': 'For information purposes only',
  'disclaimer.notRegulated': 'Indicative market rates — not official BKAM fixings',
  'disclaimer.forAdvisory': 'For professional advice: jad2advisory.com',
  'disclaimer.cndp': 'Your queries are not stored or linked to your identity.',

  // Actions
  'action.viewOfficialRates': 'BKAM Official Rates',
  'action.contactAdvisory': 'Contact JAD2 Advisory →',
  'action.downloadCSV': 'Download CSV',
  'action.getQuote': 'Get a live quote',
  'action.bookAppointment': 'Book appointment',

  // Tiers
  'tier.CORPORATE': 'Large Corporate / MNC',
  'tier.SME': 'SME',
  'tier.TPE': 'Micro-Enterprise',
  'tier.INDIVIDUAL': 'Individual',

  // Footer
  'footer.advisory': 'Need professional FX advisory?',
  'footer.advisoryDesc': 'FX hedging · Structuring · Office des Changes compliance',
  'footer.cta': 'JAD2 Advisory →',
  'footer.legal': 'Legal Notices & Compliance',
  'footer.copyright': '© 2025 JAD2FX · JAD2 Advisory · Casablanca, Morocco',
};
export default en;
