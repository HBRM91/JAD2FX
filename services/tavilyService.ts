export interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export interface TavilySearchResponse {
  results: TavilyResult[];
  answer?: string;
}

export async function tavilySearch(
  query: string,
  corsProxyUrl: string,
  passcode: string,
  options: {
    maxResults?: number;
    searchDepth?: 'basic' | 'advanced';
    includeAnswer?: boolean;
  } = {}
): Promise<TavilySearchResponse> {
  const base = corsProxyUrl.replace(/\/$/, '');
  const res = await fetch(`${base}/api/tavily/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${passcode}`,
    },
    body: JSON.stringify({
      query,
      max_results:    options.maxResults    ?? 5,
      search_depth:   options.searchDepth   ?? 'basic',
      include_answer: options.includeAnswer ?? false,
    }),
    signal: AbortSignal.timeout(25_000),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(`Tavily ${res.status}: ${err.error ?? res.statusText}`);
  }

  return res.json();
}
