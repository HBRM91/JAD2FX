/**
 * LLM Router — proxies all LLM calls through the Cloudflare Worker.
 * API keys (Groq, Gemini) live as Worker secrets and never touch the client bundle.
 *
 * The Worker endpoint POST /api/llm/chat tries Groq → Gemini fallback.
 */

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

// ─── Worker proxy call ────────────────────────────────────────────────────────

function getProxyUrl(): string {
  return (import.meta.env.VITE_CORS_PROXY_URL ?? '').replace(/\/$/, '');
}

export async function routeQuery(config: RouteConfig): Promise<LLMResponse> {
  const base = getProxyUrl();
  if (!base) throw new Error('VITE_CORS_PROXY_URL not set — cannot reach LLM proxy');

  const res = await fetch(`${base}/api/llm/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages:     [{ role: 'user', content: config.userMessage }],
      systemPrompt: config.systemPrompt,
      maxTokens:    config.maxTokens  ?? 900,
      temperature:  config.temperature ?? 0.3,
    }),
    signal: AbortSignal.timeout(25_000),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(`LLM proxy ${res.status}: ${err.error ?? res.statusText}`);
  }

  const data = await res.json() as { text: string; provider: string; model: string };
  return {
    text:       data.text,
    provider:   (data.provider as LLMProvider) ?? 'groq',
    model:      data.model ?? 'llama-3.3-70b-versatile',
    isFallback: data.provider === 'gemini',
  };
}

// ─── Helpers — kept for UI compatibility ─────────────────────────────────────

export function getAvailableProviders(): LLMProvider[] {
  // Providers are available if the proxy URL is configured (keys live in Worker)
  return getProxyUrl() ? ['groq', 'gemini'] : [];
}

export const PROVIDER_LABELS: Record<LLMProvider, string> = {
  groq:        'Groq / Llama 3.3',
  openrouter:  'OpenRouter / Llama 3.1',
  gemini:      'Gemini 2.5 Flash',
};

export const PROVIDER_COLORS: Record<LLMProvider, string> = {
  groq:       'bg-orange-900/30 text-orange-300 border-orange-700/40',
  openrouter: 'bg-purple-900/30 text-purple-300 border-purple-700/40',
  gemini:     'bg-blue-900/30 text-blue-300 border-blue-700/40',
};
