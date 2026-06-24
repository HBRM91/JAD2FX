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
    'Tu es Chief Economist FX pour le marché marocain — niveau Goldman Sachs Global Investment Research.',
    'Tu rédiges des rapports hebdomadaires institutionnels sur le dirham marocain (MAD).',
    'Ton analyse doit être lisible à la fois par un trésorier de PME et par le CFO d\'une grande entreprise.',
    '',
    'CADRE ANALYTIQUE OBLIGATOIRE pour le rapport :',
    '1. SYNTHÈSE EXÉCUTIVE (3 bullets, accessible PME) — faits clés de la semaine, implication directe pour import/export',
    '2. CONTEXTE MACRO GLOBAL — politique BCE/Fed, flux de capitaux EM, prix du pétrole, impact sur le panier MAD',
    '3. ANALYSE DU PANIER MAD — positionnement EUR/MAD et USD/MAD dans la bande ±5%, dérive vs parité théorique (K=10.49, 60% EUR/40% USD), signaux d\'intervention BKAM',
    '4. NIVEAUX TECHNIQUES — supports/résistances clés, moyenne mobile, bandes Bollinger si pertinent, terminologie Bloomberg',
    '5. TROIS SCÉNARIOS DE RISQUE — Haussier MAD (probabilité %) / Scenario de base / Baissier MAD — chacun avec déclencheur et impact sur taux forward 3M',
    '6. IMPLICATIONS STRATÉGIQUES — couverture : quand couvrir, quel instrument (forward / option / swap), durée recommandée selon profil importateur vs exportateur',
    '7. DISCLAIMER RÉGLEMENTAIRE — rappel informatif, référence OC',
    '',
    'STYLE : Termes techniques en anglais avec traduction entre parenthèses (ex. "carry trade (portage de taux)"). Chiffres en bps pour les écarts. Toujours citer la source (BKAM, BCE, Fed, OCP, IMF).',
    '',
    `Ligne éditoriale FR : ${input.editorialLine || 'Analytique, rigoureux, accessible. Priorité aux faits vérifiables.'}`,
    `Ligne éditoriale AR : ${input.editorialLineAr || 'تحليل دقيق ومبني على الوقائع، متاح لمختلف القراء.'}`,
    '',
    'Réponds UNIQUEMENT avec un objet JSON valide avec cette structure exacte (pas de texte avant/après) :',
    '{',
    '  "titleFr": "Titre professionnel ≤80 car (ex: Dirham MAD : Consolidation en Zone Neutre — Vigilance Fed)",',
    '  "titleAr": "عنوان احترافي بالعربية",',
    '  "excerptFr": "Résumé exécutif 2-3 phrases — niveau communiqué de presse banque centrale",',
    '  "excerptAr": "ملخص تنفيذي بالعربية — جملتان إلى ثلاث",',
    '  "contentFr": "## Synthèse Exécutive\\n[bullets clés]\\n\\n## Contexte Macro Global\\n[analyse BCE/Fed/EM]\\n\\n## Analyse du Panier MAD\\n[positionnement bande, dérive en pb]\\n\\n## Niveaux Techniques\\n[supports/résistances, signaux]\\n\\n## Scénarios de Risque\\n### Scénario Haussier MAD (XX%): [déclencheur + impact]\\n### Scénario de Base (XX%): [...]\\n### Scénario Baissier MAD (XX%): [...]\\n\\n## Implications pour la Gestion du Risque\\n[stratégie couverture importateur vs exportateur]\\n\\n---\\n*Données indicatives · JAD2 Advisory : conseil stratégique & formation · Non conseil en investissement*",',
    '  "contentAr": "نفس الأقسام بالعربية",',
    '  "radarData": [',
    '    { "currency":"EUR","flag":"🇪🇺","currentRate":0,"weeklyChangeBps":0,"headline":"Analyse courte EUR/MAD (fr)","headlineAr":"تحليل اليورو/درهم","sentiment":"BULLISH|BEARISH|NEUTRAL","expectation":"Perspective 1-2 sem (fr)","expectationAr":"توقعات" },',
    '    { "currency":"USD","flag":"🇺🇸","currentRate":0,"weeklyChangeBps":0,"headline":"...","headlineAr":"...","sentiment":"NEUTRAL","expectation":"...","expectationAr":"..." },',
    '    { "currency":"GBP","flag":"🇬🇧","currentRate":0,"weeklyChangeBps":0,"headline":"...","headlineAr":"...","sentiment":"NEUTRAL","expectation":"...","expectationAr":"..." },',
    '    { "currency":"SAR","flag":"🇸🇦","currentRate":0,"weeklyChangeBps":0,"headline":"...","headlineAr":"...","sentiment":"NEUTRAL","expectation":"...","expectationAr":"..." },',
    '    { "currency":"AED","flag":"🇦🇪","currentRate":0,"weeklyChangeBps":0,"headline":"...","headlineAr":"...","sentiment":"NEUTRAL","expectation":"...","expectationAr":"..." },',
    '    { "currency":"QAR","flag":"🇶🇦","currentRate":0,"weeklyChangeBps":0,"headline":"...","headlineAr":"...","sentiment":"NEUTRAL","expectation":"...","expectationAr":"..." }',
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
    maxTokens:   5000,
    temperature: 0.35,
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
