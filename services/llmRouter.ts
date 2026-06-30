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
  /** Override the proxy URL. Falls back to process.env.CORS_PROXY_URL (build-time inject).
   *  Pass config.corsProxyUrl from useAdmin() to ensure the admin-configured URL is used
   *  even when the build-time env var was not set (e.g. CI secret missing). */
  proxyUrl?: string;
}

// ─── Worker proxy call ────────────────────────────────────────────────────────

function getBuildTimeProxy(): string {
  return (process.env.CORS_PROXY_URL ?? '').replace(/\/$/, '');
}

export async function routeQuery(config: RouteConfig): Promise<LLMResponse> {
  // Prefer runtime-provided URL (from admin config) over build-time env var
  const base = (config.proxyUrl?.replace(/\/$/, '')) || getBuildTimeProxy();
  if (!base) throw new Error('CORS_PROXY_URL not configured — cannot reach LLM proxy');

  const res = await fetch(`${base}/api/llm/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages:     [{ role: 'user', content: config.userMessage }],
      systemPrompt: config.systemPrompt,
      maxTokens:    config.maxTokens  ?? 900,
      temperature:  config.temperature ?? 0.3,
      strategy:     config.strategy   ?? 'cost-first',
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

export function getAvailableProviders(runtimeProxyUrl?: string): LLMProvider[] {
  return (runtimeProxyUrl?.trim() || getBuildTimeProxy()) ? (['groq', 'gemini'] as LLMProvider[]) : [];
}

export const PROVIDER_LABELS: Record<LLMProvider, string> = {
  groq:        'Groq',
  openrouter:  'OpenRouter',
  gemini:      'Gemini',
};

export const PROVIDER_COLORS: Record<LLMProvider, string> = {
  groq:       'bg-orange-900/30 text-orange-300 border-orange-700/40',
  openrouter: 'bg-purple-900/30 text-purple-300 border-purple-700/40',
  gemini:     'bg-blue-900/30 text-blue-300 border-blue-700/40',
};
