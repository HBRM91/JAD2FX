import { routeQuery, LLMProvider } from './llmRouter';
import { tavilySearch } from './tavilyService';
import { MarketReport, RadarEntry } from '../types';

// ─── Radar currencies used in Morocco ────────────────────────────────────────

const RADAR_CURRENCIES = [
  { code: 'EUR', flag: '🇪🇺', nameFr: 'Euro'                },
  { code: 'USD', flag: '🇺🇸', nameFr: 'Dollar américain'    },
  { code: 'GBP', flag: '🇬🇧', nameFr: 'Livre sterling'      },
  { code: 'SAR', flag: '🇸🇦', nameFr: 'Riyal saoudien'      },
  { code: 'AED', flag: '🇦🇪', nameFr: 'Dirham des Émirats'  },
  { code: 'QAR', flag: '🇶🇦', nameFr: 'Riyal qatarien'      },
];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GeneratorInput {
  tavilyQueries: string[];
  editorialLine:   string;
  editorialLineAr: string;
  adminNotes:      string;
  liveRates:       Record<string, number>;
  corsProxyUrl:    string;
  passcode:        string;
  preferredModel?: LLMProvider;
}

export interface GeneratorProgress {
  step:        'SEARCHING' | 'GENERATING' | 'PARSING' | 'DONE' | 'ERROR';
  detail:      string;
  searchCount: number;
}

// ─── Fallback radar if LLM output is invalid ─────────────────────────────────

function fallbackRadar(liveRates: Record<string, number>): RadarEntry[] {
  return RADAR_CURRENCIES.map(c => ({
    currency:       c.code,
    flag:           c.flag,
    currentRate:    liveRates[c.code] ?? 0,
    weeklyChangeBps: 0,
    headline:       'Données indicatives – veuillez régénérer le rapport.',
    headlineAr:     'بيانات استرشادية – يرجى إعادة توليد التقرير.',
    sentiment:      'NEUTRAL' as const,
    expectation:    'Stabilité attendue',
    expectationAr:  'استقرار متوقع',
  }));
}

// ─── Simple JSON extractor (handles ```json ... ``` or raw {…}) ───────────────

function extractJson(raw: string): string {
  const block = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (block) return block[1];
  const start = raw.indexOf('{');
  const end   = raw.lastIndexOf('}');
  if (start >= 0 && end > start) return raw.slice(start, end + 1);
  return raw;
}

// ─── Main generator ───────────────────────────────────────────────────────────

export async function generateReport(
  input: GeneratorInput,
  onProgress: (p: GeneratorProgress) => void
): Promise<MarketReport> {
  const t0 = Date.now();

  // ── 1. Tavily searches ────────────────────────────────────────────────────
  const searchResults: { query: string; snippets: string[] }[] = [];

  for (let i = 0; i < input.tavilyQueries.length; i++) {
    const query = input.tavilyQueries[i];
    onProgress({ step: 'SEARCHING', detail: `Recherche: "${query}"`, searchCount: i });
    try {
      const data = await tavilySearch(query, input.corsProxyUrl, input.passcode, {
        maxResults:    4,
        searchDepth:   'basic',
        includeAnswer: false,
      });
      searchResults.push({
        query,
        snippets: data.results.slice(0, 4).map(r => `• ${r.title}: ${r.content?.slice(0, 250) ?? ''}`),
      });
    } catch (err) {
      console.warn(`Tavily failed for "${query}":`, err);
    }
  }

  // ── 2. Build prompt ───────────────────────────────────────────────────────
  onProgress({ step: 'GENERATING', detail: 'Génération IA en cours…', searchCount: searchResults.length });

  const ratesCtx = RADAR_CURRENCIES
    .map(c => `${c.code}/MAD: ${(input.liveRates[c.code] ?? 0).toFixed(4)}`)
    .join(' | ');

  const searchCtx = searchResults.length > 0
    ? searchResults.map(s => `### "${s.query}"\n${s.snippets.join('\n')}`).join('\n\n')
    : 'Aucun résultat de recherche disponible.';

  const today = new Date().toLocaleDateString('fr-MA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const systemPrompt = [
    'Tu es un analyste FX senior spécialisé dans le marché des changes marocain (MAD).',
    'Tu rédiges des rapports hebdomadaires pour des PME et TPE marocaines (import/export).',
    'Ton ton est informatif, pédagogique et prudent. Les informations sont strictement indicatives.',
    '',
    `Consignes éditoriales FR : ${input.editorialLine || 'Rapport factuel, accessible aux non-spécialistes.'}`,
    `Consignes éditoriales AR : ${input.editorialLineAr || 'تقرير واقعي وسهل الفهم.'}`,
    '',
    'Réponds UNIQUEMENT avec un objet JSON valide respectant exactement cette structure :',
    '{',
    '  "titleFr": "Titre court (≤80 cars)",',
    '  "titleAr": "العنوان بالعربية",',
    '  "excerptFr": "Résumé en 2 phrases",',
    '  "excerptAr": "ملخص في جملتين",',
    '  "contentFr": "Rapport markdown FR avec sections ## Synthèse, ## Paires MAD, ## Impact PME, ## Perspectives",',
    '  "contentAr": "التقرير بالعربية مع الأقسام نفسها",',
    '  "radarData": [',
    '    { "currency":"EUR","flag":"🇪🇺","currentRate":0,"weeklyChangeBps":0,"headline":"...","headlineAr":"...","sentiment":"BULLISH|BEARISH|NEUTRAL","expectation":"...","expectationAr":"..." },',
    '    ... (EUR, USD, GBP, SAR, AED, QAR)',
    '  ]',
    '}',
  ].join('\n');

  const userMessage = [
    `Date : ${today}`,
    `Taux BKAM actuels : ${ratesCtx}`,
    '',
    '## Veille web',
    searchCtx,
    '',
    `Notes admin : ${input.adminNotes || 'Aucune'}`,
    '',
    'Génère maintenant le rapport JSON complet.',
  ].join('\n');

  // ── 3. LLM call ───────────────────────────────────────────────────────────
  const strategy = input.preferredModel === 'gemini' ? 'quality-first' : 'cost-first';
  const llmResult = await routeQuery({
    strategy,
    systemPrompt,
    userMessage,
    maxTokens:   3500,
    temperature: 0.4,
  });

  // ── 4. Parse JSON ─────────────────────────────────────────────────────────
  onProgress({ step: 'PARSING', detail: 'Traitement du rapport…', searchCount: searchResults.length });

  type RawOutput = {
    titleFr?: string; titleAr?: string;
    excerptFr?: string; excerptAr?: string;
    contentFr?: string; contentAr?: string;
    radarData?: RadarEntry[];
  };

  let parsed: RawOutput = {};
  try {
    parsed = JSON.parse(extractJson(llmResult.text));
  } catch (err) {
    throw new Error(
      `Parsing JSON échoué: ${err instanceof Error ? err.message : String(err)}\n\nDébut: ${llmResult.text.slice(0, 300)}`
    );
  }

  // Overlay live rates on radar (LLM rates may be stale)
  const radarData: RadarEntry[] = (parsed.radarData && parsed.radarData.length >= 3)
    ? parsed.radarData.map(r => ({ ...r, currentRate: input.liveRates[r.currency] ?? r.currentRate }))
    : fallbackRadar(input.liveRates);

  const now = new Date().toISOString();
  const report: MarketReport = {
    id:          `rpt-${Date.now()}`,
    createdAt:   now,
    publishedAt: null,
    titleFr:     parsed.titleFr  ?? 'Rapport FX Maroc',
    titleAr:     parsed.titleAr  ?? 'تقرير سوق الصرف المغربي',
    excerptFr:   parsed.excerptFr ?? '',
    excerptAr:   parsed.excerptAr ?? '',
    contentFr:   parsed.contentFr ?? '',
    contentAr:   parsed.contentAr ?? '',
    radarData,
    llmModel:        `${llmResult.provider}/${llmResult.model}`,
    tavilyQueries:   input.tavilyQueries,
    adminNotes:      input.adminNotes,
    isPublished:     false,
    generation: {
      durationMs:        Date.now() - t0,
      tavilySearchCount: searchResults.length,
    },
  };

  onProgress({ step: 'DONE', detail: 'Rapport généré avec succès', searchCount: searchResults.length });
  return report;
}
