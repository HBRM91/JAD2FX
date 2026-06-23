/**
 * Cloudflare Worker — Yahoo Finance CORS Proxy
 *
 * Deploy:
 *   wrangler deploy cloudflare/yahoo-proxy.js --name jad2fx-yahoo-proxy
 *
 * Usage from frontend:
 *   Admin Dashboard > System > Yahoo Finance CORS Proxy
 *   Enter: https://jad2fx-yahoo-proxy.<your-account>.workers.dev
 *
 * The frontend will call: {PROXY_URL}/{encodeURIComponent(yahoo_finance_url)}
 * This worker decodes it, fetches Yahoo Finance, and returns with CORS headers.
 */

const ALLOWED_ORIGINS = [
  'https://jad2fx.pages.dev',
  'https://ce86f572.jad2fx.pages.dev',
  'https://jad2fx.com',
  'http://localhost:5173',
  'http://localhost:4173',
];

const CORS_HEADERS = {
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
  'Access-Control-Max-Age': '86400',
};

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return { ...CORS_HEADERS, 'Access-Control-Allow-Origin': allowed };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') ?? '';

    // Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== 'GET') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const url = new URL(request.url);
    // Path is /<encoded-target-url>
    const encodedTarget = url.pathname.slice(1);
    if (!encodedTarget) {
      return new Response('Missing target URL', { status: 400 });
    }

    let targetUrl;
    try {
      targetUrl = decodeURIComponent(encodedTarget);
    } catch {
      return new Response('Invalid URL encoding', { status: 400 });
    }

    // Only allow Yahoo Finance domains
    if (!targetUrl.startsWith('https://query1.finance.yahoo.com') &&
        !targetUrl.startsWith('https://query2.finance.yahoo.com')) {
      return new Response('Forbidden target domain', { status: 403 });
    }

    try {
      const upstream = await fetch(targetUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; JAD2FX/1.0)',
        },
        cf: { cacheTtl: 60, cacheEverything: true },
      });

      const body = await upstream.text();

      return new Response(body, {
        status: upstream.status,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60',
          ...corsHeaders(origin),
        },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Upstream fetch failed', detail: String(err) }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }
  },
};
