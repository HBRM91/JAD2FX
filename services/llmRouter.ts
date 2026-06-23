/**
 * LLM Router — tries providers in priority order and falls back gracefully.
 *
 * cost-first  (public chatbot): Groq → OpenRouter → Gemini
 * quality-first (consultant):   Gemini → Groq → OpenRouter
 *
 * Keys wired via vite.config.ts from .env:
 *   GROQ_API_KEY        → free tier, very fast (Llama 3.3-70B)
 *   OPENROUTER_API_KEY  → optional, free models available
 *   GEMINI_API_KEY      → paid fallback / quality-first primary
 */

import { GoogleGenAI } from '@google/genai';

export type LLMProvider = 'groq' | 'openrouter' | 'gemini';
export type RoutingStrategy = 'cost-first' | 'quality-first';

export interface LLMResponse {
  text: string;
  provider: LLMProvider;
  model: string;
  isFallback: boolean;
}

interface RouteConfig {
  strategy?: RoutingStrategy;
  systemPrompt: string;
  userMessage: string;
  maxTokens?: number;
  temperature?: number;
}

// ─── Groq (free tier — Llama 3.3-70B) ───────────────────────────────────────

const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_FALLBACK_MODEL = 'llama3-8b-8192';

async function queryGroq(config: RouteConfig): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY not set');

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: config.systemPrompt },
        { role: 'user',   content: config.userMessage },
      ],
      max_tokens:  config.maxTokens  ?? 900,
      temperature: config.temperature ?? 0.3,
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Groq ${res.status}: ${(err as { error?: { message?: string } }).error?.message ?? res.statusText}`);
  }

  const data = await res.json() as { choices: { message: { content: string } }[] };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Groq returned empty content');
  return content;
}

// ─── OpenRouter (optional — free models) ─────────────────────────────────────

const OPENROUTER_FREE_MODEL = 'meta-llama/llama-3.1-8b-instruct:free';

async function queryOpenRouter(config: RouteConfig): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error('OPENROUTER_API_KEY not set');

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://jad2fx.com',
      'X-Title': 'JAD2FX — by JAD2 Advisory',
    },
    body: JSON.stringify({
      model: OPENROUTER_FREE_MODEL,
      messages: [
        { role: 'system', content: config.systemPrompt },
        { role: 'user',   content: config.userMessage },
      ],
      max_tokens:  config.maxTokens  ?? 900,
      temperature: config.temperature ?? 0.3,
    }),
    signal: AbortSignal.timeout(20_000),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`OpenRouter ${res.status}: ${(err as { error?: { message?: string } }).error?.message ?? res.statusText}`);
  }

  const data = await res.json() as { choices: { message: { content: string } }[] };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenRouter returned empty content');
  return content;
}

// ─── Gemini (fallback / quality-first primary) ───────────────────────────────

const GEMINI_MODEL = 'gemini-2.0-flash';

async function queryGemini(config: RouteConfig): Promise<string> {
  const key = process.env.GEMINI_API_KEY ?? process.env.API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY not set');

  const ai = new GoogleGenAI({ apiKey: key });
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [{ role: 'user', parts: [{ text: config.userMessage }] }],
    config: {
      systemInstruction: config.systemPrompt,
      thinkingConfig: { thinkingBudget: 0 },
      maxOutputTokens: config.maxTokens ?? 900,
      temperature: config.temperature ?? 0.3,
    },
  });

  const text = response.text;
  if (!text) throw new Error('Gemini returned empty content');
  return text;
}

// ─── Provider registry ────────────────────────────────────────────────────────

interface ProviderEntry {
  id: LLMProvider;
  model: string;
  query: (config: RouteConfig) => Promise<string>;
}

const ALL_PROVIDERS: ProviderEntry[] = [
  { id: 'groq',        model: GROQ_MODEL,             query: queryGroq },
  { id: 'openrouter',  model: OPENROUTER_FREE_MODEL,  query: queryOpenRouter },
  { id: 'gemini',      model: GEMINI_MODEL,           query: queryGemini },
];

function orderedProviders(strategy: RoutingStrategy): ProviderEntry[] {
  if (strategy === 'quality-first') {
    // Gemini → Groq → OpenRouter
    return [ALL_PROVIDERS[2], ALL_PROVIDERS[0], ALL_PROVIDERS[1]];
  }
  // cost-first: Groq → OpenRouter → Gemini
  return ALL_PROVIDERS;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function routeQuery(config: RouteConfig): Promise<LLMResponse> {
  const strategy = config.strategy ?? 'cost-first';
  const providers = orderedProviders(strategy);
  const primary = providers[0];
  const errors: string[] = [];

  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i];
    try {
      const text = await provider.query(config);
      return {
        text,
        provider: provider.id,
        model: provider.model,
        isFallback: i > 0,
      };
    } catch (err) {
      errors.push(`${provider.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  throw new Error(`All LLM providers failed:\n${errors.join('\n')}`);
}

// ─── Helper: check which providers are available ──────────────────────────────

export function getAvailableProviders(): LLMProvider[] {
  const available: LLMProvider[] = [];
  if (process.env.GROQ_API_KEY)        available.push('groq');
  if (process.env.OPENROUTER_API_KEY)  available.push('openrouter');
  if (process.env.GEMINI_API_KEY || process.env.API_KEY) available.push('gemini');
  return available;
}

export const PROVIDER_LABELS: Record<LLMProvider, string> = {
  groq:        'Groq / Llama 3.3',
  openrouter:  'OpenRouter / Llama 3.1',
  gemini:      'Gemini 2.0 Flash',
};

export const PROVIDER_COLORS: Record<LLMProvider, string> = {
  groq:       'bg-orange-900/30 text-orange-300 border-orange-700/40',
  openrouter: 'bg-purple-900/30 text-purple-300 border-purple-700/40',
  gemini:     'bg-blue-900/30 text-blue-300 border-blue-700/40',
};
