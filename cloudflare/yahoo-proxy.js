/**
 * Cloudflare Worker — JAD2FX Multi-source API Proxy
 *
 * Routes:
 *   /{encoded-yahoo-url}            → Yahoo Finance (no auth)
 *   /bkam/{path}?{qs}               → BKAM FX API   (BKAM_FX_KEY secret)
 *   /bkam-bdt/{path}?{qs}           → BKAM BDT API  (BKAM_BDT_KEY secret)
 *   POST /api/tavily/search         → Tavily web search (TAVILY_KEY secret)
 *   GET  /api/reports/published     → Current published report (public)
 *   GET  /api/reports               → List all reports (admin auth)
 *   POST /api/reports               → Save report draft (admin auth)
 *   POST /api/reports/:id/publish   → Publish a report (admin auth)
 *   DELETE /api/reports/:id         → Delete a report (admin auth)
 *
 * Required Worker secrets (wrangler secret put <NAME>):
 *   BKAM_FX_KEY, BKAM_BDT_KEY, TAVILY_KEY, ADMIN_PASSCODE
 *
 * Required KV binding:
 *   [[kv_namespaces]] binding = "REPORTS_KV" id = "..."
 */

const ALLOWED_ORIGINS = [
  'https://jad2fx.pages.dev',
  'https://ce86f572.jad2fx.pages.dev',
  'https://jad2fx.com',
  'http://localhost:5173',
  'http://localhost:4173',
];

const CORS_HEADERS = {
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization',
  'Access-Control-Max-Age': '86400',
};

const BKAM_BASE = 'https://api.centralbankofmorocco.ma';

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return { ...CORS_HEADERS, 'Access-Control-Allow-Origin': allowed };
}

function json(data, status = 200, origin = '') {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

// ─── Admin auth check ─────────────────────────────────────────────────────────
function isAdmin(request, env) {
  if (!env.ADMIN_PASSCODE) return false;
  const auth = request.headers.get('Authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  return token === env.ADMIN_PASSCODE;
}

// ─── BKAM proxy ───────────────────────────────────────────────────────────────
async function handleBkam(bkamPath, queryString, apiKey, origin) {
  if (!apiKey) return json({ error: 'BKAM key not configured' }, 503, origin);
  const qs = queryString ? `?${queryString}` : '';
  const targetUrl = `${BKAM_BASE}/${bkamPath}${qs}`;
  try {
    const upstream = await fetch(targetUrl, {
      headers: { Accept: 'application/json', 'Ocp-Apim-Subscription-Key': apiKey },
      cf: { cacheTtl: 300, cacheEverything: true },
    });
    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300', ...corsHeaders(origin) },
    });
  } catch (err) {
    return json({ error: 'BKAM upstream failed', detail: String(err) }, 502, origin);
  }
}

// ─── Tavily search proxy ──────────────────────────────────────────────────────
async function handleTavilySearch(request, env, origin) {
  if (!isAdmin(request, env)) return json({ error: 'Unauthorized' }, 401, origin);
  if (!env.TAVILY_KEY) return json({ error: 'TAVILY_KEY not configured' }, 503, origin);

  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON body' }, 400, origin); }

  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, api_key: env.TAVILY_KEY }),
      signal: AbortSignal.timeout(20_000),
    });
    const data = await res.json();
    return json(data, res.status, origin);
  } catch (err) {
    return json({ error: 'Tavily fetch failed', detail: String(err) }, 502, origin);
  }
}

// ─── KV Report storage ────────────────────────────────────────────────────────

async function getIndex(kv) {
  try {
    const raw = await kv.get('index');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

async function setIndex(kv, index) {
  await kv.put('index', JSON.stringify(index));
}

// GET /api/reports/published — public
async function handleGetPublished(env, origin) {
  if (!env.REPORTS_KV) return json({ error: 'KV not configured' }, 503, origin);
  try {
    const pubId = await env.REPORTS_KV.get('published');
    if (!pubId) return json(null, 200, origin);
    const raw = await env.REPORTS_KV.get(`report:${pubId}`);
    if (!raw) return json(null, 200, origin);
    return json(JSON.parse(raw), 200, origin);
  } catch (err) {
    return json({ error: String(err) }, 500, origin);
  }
}

// GET /api/reports — admin: list all
async function handleListReports(request, env, origin) {
  if (!isAdmin(request, env)) return json({ error: 'Unauthorized' }, 401, origin);
  if (!env.REPORTS_KV) return json([], 200, origin);
  const index = await getIndex(env.REPORTS_KV);
  return json(index, 200, origin);
}

// POST /api/reports — admin: save new report
async function handleSaveReport(request, env, origin) {
  if (!isAdmin(request, env)) return json({ error: 'Unauthorized' }, 401, origin);
  if (!env.REPORTS_KV) return json({ error: 'KV not configured' }, 503, origin);

  let report;
  try { report = await request.json(); }
  catch { return json({ error: 'Invalid JSON' }, 400, origin); }

  const id = report.id ?? `rpt-${Date.now()}`;
  report.id = id;

  await env.REPORTS_KV.put(`report:${id}`, JSON.stringify(report), { expirationTtl: 60 * 60 * 24 * 90 }); // 90 days

  // Update index
  const index = await getIndex(env.REPORTS_KV);
  const existing = index.findIndex(r => r.id === id);
  const meta = { id, createdAt: report.createdAt, titleFr: report.titleFr, isPublished: report.isPublished, llmModel: report.llmModel };
  if (existing >= 0) index[existing] = meta;
  else index.unshift(meta);
  await setIndex(env.REPORTS_KV, index.slice(0, 50)); // keep last 50

  if (report.isPublished) await env.REPORTS_KV.put('published', id);

  return json({ ok: true, id }, 200, origin);
}

// POST /api/reports/:id/publish — admin: publish/unpublish
async function handlePublishReport(reportId, request, env, origin) {
  if (!isAdmin(request, env)) return json({ error: 'Unauthorized' }, 401, origin);
  if (!env.REPORTS_KV) return json({ error: 'KV not configured' }, 503, origin);

  let body = {};
  try { body = await request.json(); } catch { /* no body */ }
  const publish = body.publish !== false;

  const raw = await env.REPORTS_KV.get(`report:${reportId}`);
  if (!raw) return json({ error: 'Report not found' }, 404, origin);

  const report = JSON.parse(raw);
  report.isPublished = publish;
  report.publishedAt = publish ? new Date().toISOString() : null;
  await env.REPORTS_KV.put(`report:${reportId}`, JSON.stringify(report));

  if (publish) {
    await env.REPORTS_KV.put('published', reportId);
  } else {
    const pubId = await env.REPORTS_KV.get('published');
    if (pubId === reportId) await env.REPORTS_KV.delete('published');
  }

  const index = await getIndex(env.REPORTS_KV);
  const i = index.findIndex(r => r.id === reportId);
  if (i >= 0) index[i].isPublished = publish;
  await setIndex(env.REPORTS_KV, index);

  return json({ ok: true, isPublished: publish }, 200, origin);
}

// DELETE /api/reports/:id — admin: delete
async function handleDeleteReport(reportId, request, env, origin) {
  if (!isAdmin(request, env)) return json({ error: 'Unauthorized' }, 401, origin);
  if (!env.REPORTS_KV) return json({ error: 'KV not configured' }, 503, origin);

  await env.REPORTS_KV.delete(`report:${reportId}`);
  const index = await getIndex(env.REPORTS_KV);
  await setIndex(env.REPORTS_KV, index.filter(r => r.id !== reportId));

  const pubId = await env.REPORTS_KV.get('published');
  if (pubId === reportId) await env.REPORTS_KV.delete('published');

  return json({ ok: true }, 200, origin);
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') ?? '';

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    const url = new URL(request.url);
    const pathname = url.pathname;

    // ── BKAM BDT proxy ────────────────────────────────────────────────────────
    if (pathname.startsWith('/bkam-bdt/')) {
      if (request.method !== 'GET') return new Response('Method Not Allowed', { status: 405 });
      return handleBkam(pathname.slice('/bkam-bdt/'.length), url.searchParams.toString(), env.BKAM_BDT_KEY, origin);
    }

    // ── BKAM FX proxy ─────────────────────────────────────────────────────────
    if (pathname.startsWith('/bkam/')) {
      if (request.method !== 'GET') return new Response('Method Not Allowed', { status: 405 });
      return handleBkam(pathname.slice('/bkam/'.length), url.searchParams.toString(), env.BKAM_FX_KEY, origin);
    }

    // ── Tavily search ─────────────────────────────────────────────────────────
    if (pathname === '/api/tavily/search') {
      if (request.method !== 'POST') return json({ error: 'POST only' }, 405, origin);
      return handleTavilySearch(request, env, origin);
    }

    // ── Report API ────────────────────────────────────────────────────────────
    if (pathname === '/api/reports/published') {
      if (request.method !== 'GET') return json({ error: 'GET only' }, 405, origin);
      return handleGetPublished(env, origin);
    }

    // /api/reports/:id/publish
    const publishMatch = pathname.match(/^\/api\/reports\/([^/]+)\/publish$/);
    if (publishMatch) {
      if (request.method !== 'POST') return json({ error: 'POST only' }, 405, origin);
      return handlePublishReport(publishMatch[1], request, env, origin);
    }

    // /api/reports/:id (DELETE)
    const reportMatch = pathname.match(/^\/api\/reports\/([^/]+)$/);
    if (reportMatch) {
      if (request.method !== 'DELETE') return json({ error: 'DELETE only' }, 405, origin);
      return handleDeleteReport(reportMatch[1], request, env, origin);
    }

    // /api/reports (GET list | POST save)
    if (pathname === '/api/reports') {
      if (request.method === 'GET') return handleListReports(request, env, origin);
      if (request.method === 'POST') return handleSaveReport(request, env, origin);
      return json({ error: 'Method not allowed' }, 405, origin);
    }

    // ── Yahoo Finance proxy ───────────────────────────────────────────────────
    if (request.method !== 'GET') return new Response('Method Not Allowed', { status: 405 });

    const encodedTarget = pathname.slice(1);
    if (!encodedTarget) return new Response('Missing target URL', { status: 400 });

    let targetUrl;
    try { targetUrl = decodeURIComponent(encodedTarget); }
    catch { return new Response('Invalid URL encoding', { status: 400 }); }

    if (!targetUrl.startsWith('https://query1.finance.yahoo.com') &&
        !targetUrl.startsWith('https://query2.finance.yahoo.com')) {
      return new Response('Forbidden target domain', { status: 403 });
    }

    try {
      const upstream = await fetch(targetUrl, {
        headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0 (compatible; JAD2FX/1.0)' },
        cf: { cacheTtl: 60, cacheEverything: true },
      });
      const body = await upstream.text();
      return new Response(body, {
        status: upstream.status,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60', ...corsHeaders(origin) },
      });
    } catch (err) {
      return json({ error: 'Upstream fetch failed', detail: String(err) }, 502, origin);
    }
  },
};
