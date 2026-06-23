import { CommodityQuote, CommodityCategory } from '../types';

interface CommodityDef {
  symbol: string;
  name: string;
  nameFr: string;
  nameAr: string;
  category: CommodityCategory;
  unit: string;
  yfDivisor: number;    // 100 for cents-quoted contracts (sugar, cotton, etc.)
  fallbackPrice: number;
  moroccanRelevance: string;
  moroccanRelevanceFr: string;
  moroccanRelevanceAr: string;
}

export const COMMODITY_DEFINITIONS: CommodityDef[] = [
  // ─── Energy ──────────────────────────────────────────────────────────────────
  {
    symbol: 'BZ=F',
    name: 'Brent Crude Oil', nameFr: 'Pétrole Brent', nameAr: 'نفط برنت',
    category: 'ENERGY', unit: '/bbl', yfDivisor: 1,
    fallbackPrice: 82.40,
    moroccanRelevance: 'Morocco imports ~100% of crude oil needs. MAD hedging critical for refiners & importers.',
    moroccanRelevanceFr: 'Le Maroc importe ~100% de ses besoins en pétrole brut. Couverture MAD essentielle.',
    moroccanRelevanceAr: 'يستورد المغرب ~100% من احتياجاته النفطية. التحوط بالدرهم ضروري للمصافي والمستوردين.',
  },
  {
    symbol: 'CL=F',
    name: 'WTI Crude Oil', nameFr: 'Pétrole WTI', nameAr: 'نفط WTI',
    category: 'ENERGY', unit: '/bbl', yfDivisor: 1,
    fallbackPrice: 78.60,
    moroccanRelevance: 'US benchmark referenced by some long-term supply contracts. Tracks Brent closely.',
    moroccanRelevanceFr: 'Référence US citée dans certains contrats d\'approvisionnement à long terme.',
    moroccanRelevanceAr: 'معيار أمريكي مُستشهد به في بعض عقود التوريد طويلة الأجل.',
  },
  {
    symbol: 'NG=F',
    name: 'Natural Gas', nameFr: 'Gaz Naturel', nameAr: 'الغاز الطبيعي',
    category: 'ENERGY', unit: '/MMBtu', yfDivisor: 1,
    fallbackPrice: 2.85,
    moroccanRelevance: 'Growing LNG imports via Jorf Lasfar. Power generation input cost driver.',
    moroccanRelevanceFr: 'Importations de GNL croissantes via Jorf Lasfar. Coût de production électrique.',
    moroccanRelevanceAr: 'واردات متنامية من الغاز المسال عبر جرف اليسفر. محرك تكاليف توليد الكهرباء.',
  },
  // ─── Precious Metals ─────────────────────────────────────────────────────────
  {
    symbol: 'GC=F',
    name: 'Gold', nameFr: 'Or', nameAr: 'الذهب',
    category: 'PRECIOUS_METALS', unit: '/oz', yfDivisor: 1,
    fallbackPrice: 2340.00,
    moroccanRelevance: 'BAM reserves component. Strong jewellery demand (MAD buying power indicator).',
    moroccanRelevanceFr: 'Composant des réserves BAM. Forte demande bijouterie (indicateur pouvoir d\'achat MAD).',
    moroccanRelevanceAr: 'مكوّن احتياطيات بنك المغرب. طلب قوي على المجوهرات (مؤشر قوة شراء الدرهم).',
  },
  {
    symbol: 'SI=F',
    name: 'Silver', nameFr: 'Argent Métal', nameAr: 'الفضة',
    category: 'PRECIOUS_METALS', unit: '/oz', yfDivisor: 1,
    fallbackPrice: 29.50,
    moroccanRelevance: 'Industrial use in solar panels (Morocco 2030 green energy targets). Jewellery export.',
    moroccanRelevanceFr: 'Usage industriel panneaux solaires (objectifs verts 2030). Joaillerie export.',
    moroccanRelevanceAr: 'الاستخدام الصناعي في الألواح الشمسية (أهداف الطاقة الخضراء 2030). تصدير المجوهرات.',
  },
  // ─── Industrial Metals ───────────────────────────────────────────────────────
  {
    symbol: 'HG=F',
    name: 'Copper', nameFr: 'Cuivre', nameAr: 'النحاس',
    category: 'INDUSTRIAL_METALS', unit: '/lb', yfDivisor: 1,
    fallbackPrice: 4.35,
    moroccanRelevance: 'Key input for electrical infrastructure & cable manufacturers (Nexans Maroc, etc.).',
    moroccanRelevanceFr: 'Intrant clé pour l\'infrastructure électrique & câbliers (Nexans Maroc, etc.).',
    moroccanRelevanceAr: 'مدخل رئيسي للبنية التحتية الكهربائية وصناعة الكابلات (نيكسانس المغرب وغيرها).',
  },
  {
    symbol: 'ALI=F',
    name: 'Aluminum', nameFr: 'Aluminium', nameAr: 'الألومنيوم',
    category: 'INDUSTRIAL_METALS', unit: '/lb', yfDivisor: 1,
    fallbackPrice: 1.02,
    moroccanRelevance: 'Packaging, automotive (Tanger Med supply chain). Vulnerable to energy cost swings.',
    moroccanRelevanceFr: 'Emballage, automobile (chaîne Tanger Med). Sensible aux coûts énergétiques.',
    moroccanRelevanceAr: 'التغليف والسيارات (سلسلة تنجة المتوسط). حساس لتقلبات تكاليف الطاقة.',
  },
  // ─── Agriculture ─────────────────────────────────────────────────────────────
  {
    symbol: 'ZW=F',
    name: 'Wheat', nameFr: 'Blé', nameAr: 'القمح',
    category: 'AGRICULTURE', unit: '/bu', yfDivisor: 100,
    fallbackPrice: 5.85,
    moroccanRelevance: 'Morocco is top-5 wheat importer in MENA. BAM monitors staple food price pressure on MAD.',
    moroccanRelevanceFr: 'Le Maroc est top-5 importateur de blé MENA. BAM surveille la pression sur le MAD.',
    moroccanRelevanceAr: 'المغرب من أكبر 5 مستوردي القمح في منطقة الشرق الأوسط. يرصد بنك المغرب ضغط الأسعار على الدرهم.',
  },
  {
    symbol: 'ZC=F',
    name: 'Corn', nameFr: 'Maïs', nameAr: 'الذرة',
    category: 'AGRICULTURE', unit: '/bu', yfDivisor: 100,
    fallbackPrice: 4.60,
    moroccanRelevance: 'Poultry & livestock feed import. Directly impacts food inflation & trade deficit.',
    moroccanRelevanceFr: 'Import aliment bétail & volaille. Impact direct inflation alimentaire & balance commerciale.',
    moroccanRelevanceAr: 'استيراد أعلاف الدواجن والماشية. تأثير مباشر على التضخم الغذائي والميزان التجاري.',
  },
  {
    symbol: 'SB=F',
    name: 'Sugar', nameFr: 'Sucre', nameAr: 'السكر',
    category: 'AGRICULTURE', unit: '/lb', yfDivisor: 100,
    fallbackPrice: 0.195,
    moroccanRelevance: 'COSUMAR imports raw sugar. Subsidy regime means MAD depreciation hits state budget directly.',
    moroccanRelevanceFr: 'COSUMAR importe du sucre brut. Régime de subvention: dépréciation MAD → coût budgétaire.',
    moroccanRelevanceAr: 'كوسومار تستورد السكر الخام. دعم الدولة يعني أن تراجع الدرهم يؤثر مباشرة على الميزانية.',
  },
  {
    symbol: 'CT=F',
    name: 'Cotton', nameFr: 'Coton', nameAr: 'القطن',
    category: 'AGRICULTURE', unit: '/lb', yfDivisor: 100,
    fallbackPrice: 0.82,
    moroccanRelevance: 'Textile sector input. Offshoring hubs (Casablanca, Tangier) exposed to raw material FX risk.',
    moroccanRelevanceFr: 'Intrant textile. Zones offshoring (Casablanca, Tanger) exposées au risque change matière.',
    moroccanRelevanceAr: 'مدخل صناعة النسيج. مناطق الاستثمار الخارجي (الدار البيضاء، طنجة) معرضة لمخاطر الصرف.',
  },
];

// ─── Fetch via Yahoo Finance v8 ───────────────────────────────────────────────

async function fetchYahooQuote(symbol: string, corsProxyUrl?: string): Promise<{ price: number; change: number; changePercent: number; high52w: number; low52w: number } | null> {
  const base = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
  const url  = corsProxyUrl ? `${corsProxyUrl.replace(/\/$/, '')}/${encodeURIComponent(base)}` : base;

  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) return null;

    return {
      price:         meta.regularMarketPrice   ?? meta.previousClose ?? 0,
      change:        (meta.regularMarketPrice ?? 0) - (meta.chartPreviousClose ?? meta.previousClose ?? 0),
      changePercent: meta.regularMarketChangePercent ?? 0,
      high52w:       meta.fiftyTwoWeekHigh ?? 0,
      low52w:        meta.fiftyTwoWeekLow  ?? 0,
    };
  } catch {
    return null;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function fetchCommodityQuotes(
  usdMad: number,
  corsProxyUrl?: string,
): Promise<CommodityQuote[]> {
  const results = await Promise.all(
    COMMODITY_DEFINITIONS.map(async def => {
      const live = await fetchYahooQuote(def.symbol, corsProxyUrl);
      if (live) {
        const price = live.price / def.yfDivisor;
        return {
          symbol:   def.symbol,
          name:     def.name,
          nameFr:   def.nameFr,
          nameAr:   def.nameAr,
          category: def.category,
          price,
          change:        live.change / def.yfDivisor,
          changePercent: live.changePercent,
          high52w:       live.high52w / def.yfDivisor,
          low52w:        live.low52w  / def.yfDivisor,
          madEquiv:      price * usdMad,
          unit:          def.unit,
          source:        'LIVE' as const,
          moroccanRelevance:   def.moroccanRelevance,
          moroccanRelevanceFr: def.moroccanRelevanceFr,
          moroccanRelevanceAr: def.moroccanRelevanceAr,
          timestamp: new Date().toISOString(),
        };
      }

      // Fallback
      const price = def.fallbackPrice;
      return {
        symbol:   def.symbol,
        name:     def.name,
        nameFr:   def.nameFr,
        nameAr:   def.nameAr,
        category: def.category,
        price,
        change: 0, changePercent: 0,
        high52w: price * 1.18, low52w: price * 0.82,
        madEquiv: price * usdMad,
        unit:     def.unit,
        source:   'FALLBACK' as const,
        moroccanRelevance:   def.moroccanRelevance,
        moroccanRelevanceFr: def.moroccanRelevanceFr,
        moroccanRelevanceAr: def.moroccanRelevanceAr,
        timestamp: new Date().toISOString(),
      };
    }),
  );
  return results;
}
