/**
 * Cloudflare Worker — Multi-source CORS Proxy
 *
 * Routes:
 *   /{encoded-yahoo-url}       → Yahoo Finance (no auth)
 *   /bkam/{path}?{qs}          → BKAM FX API   (injects BKAM_FX_KEY secret)
 *   /bkam-bdt/{path}?{qs}      → BKAM BDT API  (injects BKAM_BDT_KEY secret)
 *
 * Deploy:
 *   wrangler deploy cloudflare/yahoo-proxy.js --name jad2fx-yahoo-proxy
 *
 * Required secrets (set via wrangler secret put):
 *   BKAM_FX_KEY   — FX subscription key (CoursVirement, CoursBBE)
 *   BKAM_BDT_KEY  — BDT/MONIA subscription key (CourbeBDT, MONIA)
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

const BKAM_BASE = 'https://api.centralbankofmorocco.ma';

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return { ...CORS_HEADERS, 'Access-Control-Allow-Origin': allowed };
}

// ─── BKAM proxy handler ───────────────────────────────────────────────────────
async function handleBkam(bkamPath, queryString, apiKey, origin) {
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'BKAM API key not configured in Worker secrets' }),
      { status: 503, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) } },
    );
  }

  const qs = queryString ? `?${queryString}` : '';
  const targetUrl = `${BKAM_BASE}/${bkamPath}${qs}`;

  try {
    const upstream = await fetch(targetUrl, {
      headers: {
        'Accept': 'application/json',
        'Ocp-Apim-Subscription-Key': apiKey,
      },
      cf: { cacheTtl: 300, cacheEverything: true },
    });

    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
        ...corsHeaders(origin),
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'BKAM upstream failed', detail: String(err) }),
      { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) } },
    );
  }
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') ?? '';

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== 'GET') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const url = new URL(request.url);
    const pathname = url.pathname;

    // ── BKAM BDT/MONIA proxy (/bkam-bdt/<path>) ───────────────────────────────
    if (pathname.startsWith('/bkam-bdt/')) {
      const bkamPath = pathname.slice('/bkam-bdt/'.length);
      return handleBkam(bkamPath, url.searchParams.toString(), env.BKAM_BDT_KEY, origin);
    }

    // ── BKAM FX proxy (/bkam/<path>) ──────────────────────────────────────────
    if (pathname.startsWith('/bkam/')) {
      const bkamPath = pathname.slice('/bkam/'.length);
      return handleBkam(bkamPath, url.searchParams.toString(), env.BKAM_FX_KEY, origin);
    }

    // ── Yahoo Finance proxy (/{encoded-url}) ──────────────────────────────────
    const encodedTarget = pathname.slice(1);
    if (!encodedTarget) {
      return new Response('Missing target URL', { status: 400 });
    }

    let targetUrl;
    try {
      targetUrl = decodeURIComponent(encodedTarget);
    } catch {
      return new Response('Invalid URL encoding', { status: 400 });
    }

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
      return new Response(
        JSON.stringify({ error: 'Upstream fetch failed', detail: String(err) }),
        { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) } },
      );
    }
  },
};
