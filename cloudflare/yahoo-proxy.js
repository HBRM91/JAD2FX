/**
 * Cloudflare Worker — JAD2FX Multi-source API Proxy
 *
 * Routes:
 *   /{encoded-yahoo-url}            → Yahoo Finance (no auth)
 *   /bkam/{path}?{qs}               → BKAM FX API   (BKAM_FX_KEY secret)
 *   /bkam-bdt/{path}?{qs}           → BKAM BDT API  (BKAM_MONIA_KEY secret)
 *   POST /api/tavily/search         → Tavily web search (TAVILY_KEY secret)
 *   POST /api/llm/chat              → LLM proxy: Groq → Gemini fallback (no client-side keys)
 *   GET  /api/reports/published     → Current published report (public)
 *   GET  /api/reports               → List all reports (admin auth)
 *   POST /api/reports               → Save report draft (admin auth)
 *   POST /api/reports/:id/publish   → Publish a report (admin auth)
 *   DELETE /api/reports/:id         → Delete a report (admin auth)
 *
 * Required Worker secrets (wrangler secret put <NAME>):
 *   BKAM_FX_KEY, BKAM_MONIA_KEY, TAVILY_KEY, ADMIN_PASSCODE, GROQ_API_KEY, GEMINI_API_KEY
 *
 * Required KV binding:
 *   [[kv_namespaces]] binding = "REPORTS_KV" id = "..."
 */

const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/[a-z0-9-]+\.jad2fx\.pages\.dev$/,  // Cloudflare Pages preview URLs
  /^https:\/\/jad2fx\.pages\.dev$/,               // Cloudflare Pages production
  /^https:\/\/fx\.jad2advisory\.com$/,             // Primary custom domain
  /^https:\/\/jad2fx\.com$/,                       // Legacy domain
  /^http:\/\/localhost:(3000|5173|4173)$/,          // Local dev
];

const CORS_HEADERS = {
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization',
  'Access-Control-Max-Age': '86400',
};

const BKAM_BASE = 'https://api.centralbankofmorocco.ma';
const MAX_BODY_BYTES = 102_400; // 100 KB

function isAllowedOrigin(origin) {
  return ALLOWED_ORIGIN_PATTERNS.some(p => p.test(origin));
}

function corsHeaders(origin) {
  const allowed = isAllowedOrigin(origin) ? origin : 'https://fx.jad2advisory.com';
  return { ...CORS_HEADERS, 'Access-Control-Allow-Origin': allowed };
}

function json(data, status = 200, origin = '') {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

// ─── Report ID validation ─────────────────────────────────────────────────────
function isValidReportId(id) {
  return typeof id === 'string' && /^rpt-[0-9]{1,20}$/.test(id);
}

// ─── Safe body reader with size limit ────────────────────────────────────────
async function readBodySafe(request) {
  if (!request.body) return null;
  const reader = request.body.getReader();
  let total = 0;
  const chunks = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > MAX_BODY_BYTES) {
        reader.cancel();
        return { error: 'Body too large' };
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const all = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { all.set(chunk, offset); offset += chunk.length; }
  return new TextDecoder().decode(all);
}

// ─── Simple in-memory admin rate limiter (60 req / min per IP) ───────────────
const _adminRateLimit = new Map();
function checkAdminRateLimit(ip) {
  const now = Date.now();
  const windowMs = 60_000;
  const entry = _adminRateLimit.get(ip) ?? { count: 0, reset: now + windowMs };
  if (now > entry.reset) { entry.count = 0; entry.reset = now + windowMs; }
  entry.count++;
  _adminRateLimit.set(ip, entry);
  if (_adminRateLimit.size > 2000) {
    // Prune expired entries to avoid unbounded growth
    for (const [k, v] of _adminRateLimit) { if (now > v.reset) _adminRateLimit.delete(k); }
  }
  return entry.count <= 60;
}

// ─── Admin auth check ─────────────────────────────────────────────────────────
function isAdmin(request, env) {
  if (!env.ADMIN_PASSCODE) return false;
  const auth = request.headers.get('Authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  return token === env.ADMIN_PASSCODE;
}

// ─── Admin auth + rate limit gate ────────────────────────────────────────────
function adminGate(request, env, origin) {
  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  if (!checkAdminRateLimit(ip)) return json({ error: 'Too many requests' }, 429, origin);
  if (!isAdmin(request, env)) return json({ error: 'Unauthorized' }, 401, origin);
  return null; // allowed
}

// ─── BKAM proxy ───────────────────────────────────────────────────────────────
async function handleBkam(bkamPath, queryString, apiKey, origin) {
  if (!apiKey) return json({ error: 'BKAM key not configured' }, 503, origin);
  const qs = queryString ? `?${queryString}` : '';
  const targetUrl = `${BKAM_BASE}/${bkamPath}${qs}`;

  // ── Cloudflare Cache API — edge caching for BKAM rate responses ───────────
  // Reduces upstream API calls by ~95%. BKAM rates update at 12:30/16:15 Casablanca.
  // 20-min TTL safely serves cached rates between fixings without staleness risk.
  const cacheKey = new Request(`https://cache.bkam.internal/${bkamPath}${qs}`, { method: 'GET' });
  const cachedResponse = await caches.default.match(cacheKey);
  if (cachedResponse) {
    const cached = cachedResponse.clone();
    return new Response(await cached.text(), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=1200', 'X-Cache': 'HIT', ...corsHeaders(origin) },
    });
  }

  try {
    const upstream = await fetch(targetUrl, {
      headers: { Accept: 'application/json', 'Ocp-Apim-Subscription-Key': apiKey },
      signal: AbortSignal.timeout(12_000),
    });
    const body = await upstream.text();

    // Store in Cloudflare edge cache for 20 minutes
    if (upstream.ok) {
      const cacheResponse = new Response(body, {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=1200' },
      });
      caches.default.put(cacheKey, cacheResponse);
    }

    return new Response(body, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=1200', 'X-Cache': 'MISS', ...corsHeaders(origin) },
    });
  } catch (err) {
    return json({ error: 'BKAM upstream failed', detail: String(err) }, 502, origin);
  }
}

// ─── Tavily search proxy ──────────────────────────────────────────────────────
async function handleTavilySearch(request, env, origin) {
  const denied = adminGate(request, env, origin);
  if (denied) return denied;
  if (!env.TAVILY_KEY) return json({ error: 'TAVILY_KEY not configured' }, 503, origin);

  const rawBody = await readBodySafe(request);
  if (!rawBody || rawBody.error) return json({ error: rawBody?.error ?? 'Empty body' }, 400, origin);

  let body;
  try { body = JSON.parse(rawBody); }
  catch { return json({ error: 'Invalid JSON body' }, 400, origin); }

  if (!body.query || typeof body.query !== 'string' || body.query.length > 500) {
    return json({ error: 'query must be a non-empty string ≤500 chars' }, 400, origin);
  }

  // Only forward safe, expected fields
  const safeBody = {
    query: body.query,
    max_results: Math.min(typeof body.max_results === 'number' ? body.max_results : 5, 10),
    search_depth: body.search_depth === 'advanced' ? 'advanced' : 'basic',
    include_answer: body.include_answer === true,
  };

  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...safeBody, api_key: env.TAVILY_KEY }),
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
  const denied = adminGate(request, env, origin);
  if (denied) return denied;
  if (!env.REPORTS_KV) return json([], 200, origin);
  const index = await getIndex(env.REPORTS_KV);
  return json(index, 200, origin);
}

// POST /api/reports — admin: save new report
async function handleSaveReport(request, env, origin) {
  const denied = adminGate(request, env, origin);
  if (denied) return denied;
  if (!env.REPORTS_KV) return json({ error: 'KV not configured' }, 503, origin);

  const rawBody = await readBodySafe(request);
  if (!rawBody || rawBody.error) return json({ error: rawBody?.error ?? 'Empty body' }, 400, origin);

  let report;
  try { report = JSON.parse(rawBody); }
  catch { return json({ error: 'Invalid JSON' }, 400, origin); }

  const id = (report.id && isValidReportId(report.id)) ? report.id : `rpt-${Date.now()}`;
  report.id = id;

  await env.REPORTS_KV.put(`report:${id}`, JSON.stringify(report), { expirationTtl: 60 * 60 * 24 * 90 }); // 90 days

  const index = await getIndex(env.REPORTS_KV);
  const existing = index.findIndex(r => r.id === id);
  const meta = { id, createdAt: report.createdAt, titleFr: report.titleFr, isPublished: report.isPublished, llmModel: report.llmModel };
  if (existing >= 0) index[existing] = meta;
  else index.unshift(meta);
  await setIndex(env.REPORTS_KV, index.slice(0, 50));

  if (report.isPublished) await env.REPORTS_KV.put('published', id);

  return json({ ok: true, id }, 200, origin);
}

// POST /api/reports/:id/publish — admin: publish/unpublish
async function handlePublishReport(reportId, request, env, origin) {
  const denied = adminGate(request, env, origin);
  if (denied) return denied;
  if (!isValidReportId(reportId)) return json({ error: 'Invalid report ID' }, 400, origin);
  if (!env.REPORTS_KV) return json({ error: 'KV not configured' }, 503, origin);

  const rawBody = await readBodySafe(request);
  let body = {};
  if (rawBody && !rawBody.error) {
    try { body = JSON.parse(rawBody); } catch { /* optional body */ }
  }
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
  const denied = adminGate(request, env, origin);
  if (denied) return denied;
  if (!isValidReportId(reportId)) return json({ error: 'Invalid report ID' }, 400, origin);
  if (!env.REPORTS_KV) return json({ error: 'KV not configured' }, 503, origin);

  await env.REPORTS_KV.delete(`report:${reportId}`);
  const index = await getIndex(env.REPORTS_KV);
  await setIndex(env.REPORTS_KV, index.filter(r => r.id !== reportId));

  const pubId = await env.REPORTS_KV.get('published');
  if (pubId === reportId) await env.REPORTS_KV.delete('published');

  return json({ ok: true }, 200, origin);
}

// ─── LLM chat proxy (Groq → Gemini fallback, keys never leave server) ────────

const _llmRateLimit = new Map();
function checkLlmRateLimit(ip) {
  const now = Date.now();
  const windowMs = 60_000;
  const entry = _llmRateLimit.get(ip) ?? { count: 0, reset: now + windowMs };
  if (now > entry.reset) { entry.count = 0; entry.reset = now + windowMs; }
  entry.count++;
  _llmRateLimit.set(ip, entry);
  if (_llmRateLimit.size > 5000) {
    for (const [k, v] of _llmRateLimit) { if (now > v.reset) _llmRateLimit.delete(k); }
  }
  return entry.count <= 20; // 20 LLM requests per minute per IP
}

async function handleLlmChat(request, env, origin) {
  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  if (!checkLlmRateLimit(ip)) return json({ error: 'Rate limit exceeded — try again in a minute' }, 429, origin);

  const rawBody = await readBodySafe(request);
  if (!rawBody || typeof rawBody !== 'string') return json({ error: 'Empty body' }, 400, origin);

  let body;
  try { body = JSON.parse(rawBody); }
  catch { return json({ error: 'Invalid JSON' }, 400, origin); }

  const { messages, systemPrompt, maxTokens = 900, temperature = 0.3 } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return json({ error: 'messages array required' }, 400, origin);
  }
  if (messages.length > 30) return json({ error: 'Too many messages' }, 400, origin);
  for (const m of messages) {
    if (!m.role || !m.content || typeof m.content !== 'string' || m.content.length > 8000) {
      return json({ error: 'Invalid message format' }, 400, origin);
    }
  }

  // Try Groq first
  if (env.GROQ_API_KEY) {
    try {
      const groqMessages = systemPrompt
        ? [{ role: 'system', content: String(systemPrompt).slice(0, 4000) }, ...messages]
        : messages;
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: groqMessages, max_tokens: maxTokens, temperature }),
        signal: AbortSignal.timeout(15_000),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) return json({ text, provider: 'groq', model: 'llama-3.3-70b-versatile' }, 200, origin);
      }
    } catch (err) {
      console.warn('[LLM] Groq failed:', err);
    }
  }

  // Gemini fallback
  if (env.GEMINI_API_KEY) {
    try {
      const contents = messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
      const geminiBody = {
        contents,
        generationConfig: { maxOutputTokens: maxTokens, temperature },
        ...(systemPrompt ? { systemInstruction: { parts: [{ text: String(systemPrompt).slice(0, 4000) }] } } : {}),
      };
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(geminiBody), signal: AbortSignal.timeout(20_000) }
      );
      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return json({ text, provider: 'gemini', model: 'gemini-2.5-flash' }, 200, origin);
      }
    } catch (err) {
      console.warn('[LLM] Gemini failed:', err);
    }
  }

  return json({ error: 'All LLM providers unavailable' }, 503, origin);
}

// ─── Twelve Data EUR cross-rates (Yahoo Finance failover) ─────────────────────
// Called when Yahoo Finance is unavailable. Returns EUR-cross rates in the same
// format as ECB Frankfurter: { rates: { USD: 1.085, GBP: 0.86, ... }, date: "..." }
const TWELVE_DATA_PAIRS = 'EUR/USD,EUR/GBP,EUR/CHF,EUR/JPY,EUR/CAD,EUR/NOK,EUR/SEK,EUR/DKK,EUR/CNY';

async function handleTwelveDataRates(env, origin) {
  if (!env.TWELVE_DATA_KEY) return json({ error: 'TWELVE_DATA_KEY not configured' }, 503, origin);
  try {
    const res = await fetch(
      `https://api.twelvedata.com/price?symbol=${encodeURIComponent(TWELVE_DATA_PAIRS)}&apikey=${env.TWELVE_DATA_KEY}`,
      { signal: AbortSignal.timeout(10_000) }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // Normalise to { currency: rate } — same shape as ECB Frankfurter response
    const rates = {};
    for (const [pair, val] of Object.entries(data)) {
      const parts = pair.split('/');
      if (parts.length === 2 && parts[0] === 'EUR') {
        const price = parseFloat(val.price);
        if (!isNaN(price)) rates[parts[1]] = price;
      }
    }
    return json({ rates, date: new Date().toISOString().slice(0, 10), source: 'twelve_data' }, 200, origin);
  } catch (err) {
    return json({ error: 'Twelve Data fetch failed', detail: String(err) }, 502, origin);
  }
}

// ─── Anonymous simulation telemetry (NO PII) ─────────────────────────────────
// POST /api/telemetry/sim — fire-and-forget from client
async function handleTelemetryPost(request, env, origin) {
  if (!env.REPORTS_KV) return json({ ok: true }, 200, origin);

  const rawBody = await readBodySafe(request);
  if (!rawBody || typeof rawBody !== 'string') return json({ ok: true }, 200, origin);

  let body;
  try { body = JSON.parse(rawBody); }
  catch { return json({ ok: true }, 200, origin); }

  // Strict allow-list — no free-form strings that could embed PII
  const pair = typeof body.pair === 'string' && /^[A-Z]{3}\/MAD$/.test(body.pair) ? body.pair : null;
  const scenario = typeof body.scenario === 'string' ? body.scenario.slice(0, 32).replace(/[^A-Z_]/g, '') : null;
  const gapDays  = typeof body.gapDays === 'number' && Number.isFinite(body.gapDays) ? Math.round(body.gapDays) : null;

  const date = new Date().toISOString().slice(0, 10);
  const key  = `telemetry:${date}`;
  try {
    const existing = await env.REPORTS_KV.get(key, { type: 'json' }) ?? { events: [] };
    existing.events.push({ ts: new Date().toISOString(), pair, scenario, gapDays });
    if (existing.events.length > 500) existing.events = existing.events.slice(-500);
    await env.REPORTS_KV.put(key, JSON.stringify(existing), { expirationTtl: 60 * 60 * 24 * 30 });
  } catch { /* telemetry is non-critical */ }

  return json({ ok: true }, 200, origin);
}

// GET /api/telemetry/sim — admin: aggregate counts for last 7 days
async function handleTelemetryGet(request, env, origin) {
  const denied = adminGate(request, env, origin);
  if (denied) return denied;
  if (!env.REPORTS_KV) return json({ dates: [] }, 200, origin);

  const result = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const date = d.toISOString().slice(0, 10);
    try {
      const data = await env.REPORTS_KV.get(`telemetry:${date}`, { type: 'json' });
      const events = data?.events ?? [];
      result.push({
        date,
        count: events.length,
        byPair: events.reduce((acc, e) => { if (e.pair) acc[e.pair] = (acc[e.pair] ?? 0) + 1; return acc; }, {}),
        byScenario: events.reduce((acc, e) => { if (e.scenario) acc[e.scenario] = (acc[e.scenario] ?? 0) + 1; return acc; }, {}),
      });
    } catch {
      result.push({ date, count: 0, byPair: {}, byScenario: {} });
    }
  }
  return json(result, 200, origin);
}

// ─── Contact form → Resend email ─────────────────────────────────────────────
// POST /api/contact  — public (rate-limited by IP)

const _contactRateLimit = new Map();
function checkContactRateLimit(ip) {
  const now = Date.now();
  const entry = _contactRateLimit.get(ip) ?? { count: 0, reset: now + 60_000 };
  if (now > entry.reset) { entry.count = 0; entry.reset = now + 60_000; }
  entry.count++;
  _contactRateLimit.set(ip, entry);
  if (_contactRateLimit.size > 2000) {
    for (const [k, v] of _contactRateLimit) { if (now > v.reset) _contactRateLimit.delete(k); }
  }
  return entry.count <= 5; // 5 contact submissions per minute per IP
}

// Allowed service types — no investment advice language
const ALLOWED_SERVICES = new Set([
  'Formation', 'Conseil marché', 'Analyse', 'Accompagnement réglementaire',
  'Automatisation', 'Autre',
]);

async function handleContact(request, env, origin) {
  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  if (!checkContactRateLimit(ip)) return json({ error: 'Trop de requêtes — réessayez dans une minute' }, 429, origin);

  const rawBody = await readBodySafe(request);
  if (!rawBody || rawBody.error) return json({ error: rawBody?.error ?? 'Corps vide' }, 400, origin);

  let body;
  try { body = JSON.parse(rawBody); }
  catch { return json({ error: 'JSON invalide' }, 400, origin); }

  const name    = typeof body.name    === 'string' ? body.name.slice(0, 100).trim()    : '';
  const email   = typeof body.email   === 'string' ? body.email.slice(0, 200).trim()   : '';
  const company = typeof body.company === 'string' ? body.company.slice(0, 100).trim() : '';
  const service = typeof body.service === 'string' ? body.service.slice(0, 60).trim()  : '';
  const message = typeof body.message === 'string' ? body.message.slice(0, 2000).trim(): '';

  if (!name || name.length < 2)   return json({ error: 'Nom requis (2 caractères minimum)' }, 400, origin);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Email invalide' }, 400, origin);
  if (!ALLOWED_SERVICES.has(service)) return json({ error: 'Type de service invalide' }, 400, origin);

  if (!env.RESEND_API_KEY) return json({ error: 'Service email non configuré' }, 503, origin);

  const to = env.CONTACT_EMAIL ?? 'contact@jad2advisory.com';
  const subject = `[JAD2FX] Nouveau contact — ${service} — ${name}`;
  const html = `
<h2>Nouveau message JAD2FX</h2>
<table cellpadding="8" style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
  <tr><td style="font-weight:600;color:#555">Nom</td><td>${escHtml(name)}</td></tr>
  <tr><td style="font-weight:600;color:#555">Email</td><td><a href="mailto:${escHtml(email)}">${escHtml(email)}</a></td></tr>
  ${company ? `<tr><td style="font-weight:600;color:#555">Entreprise</td><td>${escHtml(company)}</td></tr>` : ''}
  <tr><td style="font-weight:600;color:#555">Service</td><td>${escHtml(service)}</td></tr>
  ${message ? `<tr><td style="font-weight:600;color:#555;vertical-align:top">Message</td><td>${escHtml(message).replace(/\n/g, '<br/>')}</td></tr>` : ''}
</table>
<hr/>
<p style="font-size:12px;color:#888">Envoyé depuis JAD2FX · jad2fx.pages.dev</p>
`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'JAD2FX <noreply@jad2advisory.com>', to, subject, html }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error('[Contact] Resend error:', res.status, err);
      return json({ error: 'Erreur envoi email — réessayez plus tard' }, 502, origin);
    }
  } catch (err) {
    console.error('[Contact] fetch failed:', err);
    return json({ error: 'Erreur réseau — réessayez plus tard' }, 502, origin);
  }

  return json({ ok: true }, 200, origin);
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Newsletter — subscribe / unsubscribe / admin list ───────────────────────

const _nlRateLimit = new Map();
function checkNlRateLimit(ip) {
  const now = Date.now();
  const entry = _nlRateLimit.get(ip) ?? { count: 0, reset: now + 3_600_000 };
  if (now > entry.reset) { entry.count = 0; entry.reset = now + 3_600_000; }
  entry.count++;
  _nlRateLimit.set(ip, entry);
  return entry.count <= 3; // 3 subscribe attempts per IP per hour
}

function nlToken(email) {
  // Simple non-secret token: base64url of email (sufficient for educational newsletter)
  return btoa(email).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Build the subscriber index (array of emails)
async function getNlIndex(kv) {
  try { const r = await kv.get('newsletter:index'); return r ? JSON.parse(r) : []; }
  catch { return []; }
}
async function setNlIndex(kv, list) {
  await kv.put('newsletter:index', JSON.stringify(list));
}

async function sendWelcomeEmail(email, env, siteUrl) {
  if (!env.RESEND_API_KEY) return;
  const unsubUrl = `${siteUrl}/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}&token=${nlToken(email)}`;
  const html = buildNewsletterHtml({
    subject: 'Bienvenue au Morning Briefing JAD2FX',
    preheader: 'Vous recevrez désormais le briefing FX quotidien chaque matin à 09h00 Casablanca.',
    title: 'Inscription confirmée — Morning Briefing FX',
    bodyHtml: `
      <p style="font-size:14px;color:#334155;margin:0 0 16px">Bonjour,</p>
      <p style="font-size:14px;color:#334155;margin:0 0 16px">
        Vous êtes maintenant inscrit(e) au <strong>Morning Briefing FX quotidien de JAD2FX</strong>.<br/>
        Chaque matin ouvrable à 09h00 heure de Casablanca, vous recevrez une analyse contextuelle
        des marchés des changes MAD : données BKAM, dynamiques EUR et USD, et faits macro du jour.
      </p>
      <p style="font-size:13px;color:#64748b;margin:0 0 16px">
        <strong>Ce briefing est strictement informatif et éducatif.</strong><br/>
        Il ne constitue pas un conseil en investissement ni une recommandation de transaction de change.
        Pour toute opération, adressez-vous à votre établissement bancaire agréé par Bank Al-Maghrib.
      </p>
      <div style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:16px;margin:16px 0">
        <p style="font-size:12px;color:#92400e;margin:0 0 6px;font-weight:600">
          Vous souhaitez approfondir votre compréhension des marchés de change ?
        </p>
        <p style="font-size:12px;color:#b45309;margin:0">
          JAD2 Advisory accompagne les entreprises marocaines dans la formation et la compréhension
          des dynamiques de change et de la réglementation Office des Changes.
          <a href="https://jad2advisory.com" style="color:#b45309;font-weight:700">→ jad2advisory.com</a>
        </p>
      </div>`,
    unsubUrl,
    siteUrl,
  });
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'JAD2FX Morning Briefing <briefing@jad2advisory.com>',
      to: email,
      subject: '✅ Inscription confirmée — Morning Briefing FX quotidien',
      html,
    }),
    signal: AbortSignal.timeout(10_000),
  }).catch(e => console.warn('[NL] Welcome email failed:', e));
}

function buildNewsletterHtml({ subject, preheader, title, bodyHtml, ratesTable = '', excerptFr = '', siteUrl, unsubUrl, date = '' }) {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${escHtml(subject)}</title>
</head>
<body style="margin:0;padding:20px;background:#f1f5f9;font-family:'Helvetica Neue',Arial,sans-serif">
<div style="max-width:600px;margin:0 auto">
  <!-- Header -->
  <div style="background:#040C1C;border-radius:10px 10px 0 0;padding:24px 28px">
    <p style="margin:0 0 4px;font-size:22px;font-weight:700;letter-spacing:0.15em;color:#D4AF37">JAD2FX</p>
    <p style="margin:0;font-size:11px;letter-spacing:0.1em;color:#5090C0;text-transform:uppercase">Morning Briefing · by JAD2 Advisory</p>
  </div>
  ${date ? `<div style="background:#081628;padding:8px 28px"><p style="margin:0;font-size:11px;color:#4E7EAC;letter-spacing:0.05em">${escHtml(date)} · Casablanca · Données indicatives</p></div>` : ''}
  <!-- Body -->
  <div style="background:#ffffff;padding:28px">
    ${title ? `<h1 style="margin:0 0 16px;font-size:18px;color:#0f172a;font-weight:700;line-height:1.3">${escHtml(title)}</h1>` : ''}
    ${excerptFr ? `<p style="margin:0 0 20px;font-size:14px;color:#334155;line-height:1.6;font-style:italic;border-left:3px solid #D4AF37;padding-left:12px">${escHtml(excerptFr)}</p>` : ''}
    ${bodyHtml}
    ${ratesTable}
    <div style="text-align:center;margin:24px 0">
      <a href="${siteUrl}" style="display:inline-block;background:#D4AF37;color:#040C1C;padding:12px 28px;border-radius:6px;font-weight:700;font-size:13px;text-decoration:none;letter-spacing:0.05em">
        Lire l'analyse complète →
      </a>
    </div>
    <!-- Advisory soft CTA -->
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px;margin-top:20px">
      <p style="margin:0 0 6px;font-size:12px;color:#92400e;font-weight:600">Formation & Accompagnement en marchés des changes</p>
      <p style="margin:0 0 8px;font-size:12px;color:#b45309;line-height:1.5">
        JAD2 Advisory accompagne les équipes financières des entreprises marocaines dans la
        compréhension des dynamiques de change et de la réglementation Office des Changes.
      </p>
      <a href="https://jad2advisory.com" style="font-size:12px;color:#92400e;font-weight:700;text-decoration:none">jad2advisory.com →</a>
    </div>
  </div>
  <!-- Footer -->
  <div style="background:#f8fafc;border-radius:0 0 10px 10px;padding:16px 28px;border-top:1px solid #e2e8f0">
    <p style="margin:0 0 6px;font-size:10px;color:#94a3b8;line-height:1.5">
      Données indicatives à titre éducatif uniquement · Non contractuelles · JAD2 Advisory ne fournit pas de conseil en investissement.
      Pour toute opération de change, adressez-vous à un établissement de crédit agréé par Bank Al-Maghrib.
    </p>
    <p style="margin:0;font-size:10px;color:#94a3b8">
      © ${year} JAD2 Advisory, Casablanca ·
      <a href="https://jad2advisory.com" style="color:#94a3b8">jad2advisory.com</a>
      ${unsubUrl ? ` · <a href="${escHtml(unsubUrl)}" style="color:#94a3b8">Se désinscrire</a>` : ''}
    </p>
  </div>
</div>
</body>
</html>`;
}

async function handleNewsletterSubscribe(request, env, origin) {
  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  if (!checkNlRateLimit(ip)) return json({ error: 'Trop de tentatives — réessayez plus tard' }, 429, origin);
  if (!env.REPORTS_KV) return json({ error: 'Service indisponible' }, 503, origin);

  const rawBody = await readBodySafe(request);
  let body;
  try { body = JSON.parse(rawBody); } catch { return json({ error: 'JSON invalide' }, 400, origin); }

  const email = (typeof body.email === 'string' ? body.email.trim().toLowerCase() : '');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) {
    return json({ error: 'Email invalide' }, 400, origin);
  }

  // Idempotent: return ok=true if already subscribed
  const existing = await env.REPORTS_KV.get(`newsletter:sub:${email}`);
  if (existing) {
    const sub = JSON.parse(existing);
    if (sub.active) return json({ ok: true, already: true }, 200, origin);
    // Re-activate
    sub.active = true;
    sub.resubscribedAt = new Date().toISOString();
    await env.REPORTS_KV.put(`newsletter:sub:${email}`, JSON.stringify(sub));
  } else {
    await env.REPORTS_KV.put(`newsletter:sub:${email}`, JSON.stringify({
      email, subscribedAt: new Date().toISOString(), active: true,
    }), { expirationTtl: 60 * 60 * 24 * 365 * 3 }); // 3 years
  }

  // Add to index (deduped)
  const index = await getNlIndex(env.REPORTS_KV);
  if (!index.includes(email)) {
    index.push(email);
    await setNlIndex(env.REPORTS_KV, index.slice(0, 5000));
  }

  // Send welcome email
  const siteUrl = env.SITE_URL ?? 'https://fx.jad2advisory.com';
  await sendWelcomeEmail(email, env, siteUrl);

  return json({ ok: true }, 200, origin);
}

async function handleNewsletterUnsubscribe(request, env, origin) {
  if (!env.REPORTS_KV) return json({ ok: true }, 200, origin);
  const url = new URL(request.url);
  const email = (url.searchParams.get('email') ?? '').toLowerCase();
  const token = url.searchParams.get('token') ?? '';
  if (!email || token !== nlToken(email)) return new Response('Lien invalide.', { status: 400 });

  const raw = await env.REPORTS_KV.get(`newsletter:sub:${email}`);
  if (raw) {
    const sub = JSON.parse(raw);
    sub.active = false;
    sub.unsubscribedAt = new Date().toISOString();
    await env.REPORTS_KV.put(`newsletter:sub:${email}`, JSON.stringify(sub));
  }
  const index = await getNlIndex(env.REPORTS_KV);
  await setNlIndex(env.REPORTS_KV, index.filter(e => e !== email));

  return new Response('Désinscription confirmée. Vous ne recevrez plus le Morning Briefing JAD2FX.', {
    status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

async function handleNewsletterAdmin(request, env, origin) {
  const denied = adminGate(request, env, origin);
  if (denied) return denied;
  if (!env.REPORTS_KV) return json({ count: 0, emails: [] }, 200, origin);
  const index = await getNlIndex(env.REPORTS_KV);
  return json({ count: index.length, emails: index }, 200, origin);
}

// Send daily briefing to all newsletter subscribers
async function sendDailyNewsletter(report, todayRates, env) {
  if (!env.RESEND_API_KEY || !env.REPORTS_KV) return;
  const index = await getNlIndex(env.REPORTS_KV);
  if (!index.length) { console.log('[CRON][NL] No subscribers'); return; }

  const siteUrl = env.SITE_URL ?? 'https://fx.jad2advisory.com';
  const dateStr = new Date().toLocaleDateString('fr-MA', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Casablanca',
  });

  // Build rates table rows
  const KEY_PAIRS = ['EUR', 'USD', 'GBP', 'SAR', 'AED'];
  const rateRows = KEY_PAIRS
    .filter(c => todayRates?.[c])
    .map(c => {
      const rate = todayRates[c].toFixed(4);
      return `<tr>
        <td style="padding:8px 12px;font-weight:700;color:#1e293b;border-bottom:1px solid #e2e8f0">${c}/MAD</td>
        <td style="padding:8px 12px;font-family:monospace;font-weight:700;color:#0f172a;border-bottom:1px solid #e2e8f0">${rate}</td>
      </tr>`;
    }).join('');

  const ratesTable = rateRows ? `
    <div style="margin:20px 0">
      <p style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 8px">Taux indicatifs du jour (BKAM/ECB)</p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:6px;overflow:hidden">
        <thead><tr style="background:#f8fafc">
          <th style="padding:8px 12px;font-size:11px;color:#64748b;text-align:left;text-transform:uppercase;letter-spacing:0.08em">Paire</th>
          <th style="padding:8px 12px;font-size:11px;color:#64748b;text-align:left;text-transform:uppercase;letter-spacing:0.08em">Cours indicatif</th>
        </tr></thead>
        <tbody>${rateRows}</tbody>
      </table>
      <p style="font-size:10px;color:#94a3b8;margin:6px 0 0">Taux indicatifs à titre éducatif uniquement · Non contractuels · Source: BKAM / ECB Frankfurter</p>
    </div>` : '';

  const html = buildNewsletterHtml({
    subject: report.titleFr,
    preheader: report.excerptFr,
    title: report.titleFr,
    excerptFr: report.excerptFr,
    bodyHtml: `<p style="font-size:13px;color:#64748b;margin:0 0 4px">Briefing quotidien · Données indicatives</p>`,
    ratesTable,
    siteUrl,
    date: dateStr,
    // unsubUrl per recipient — added in loop below
  });

  const subject = `JAD2FX · ${report.titleFr} · ${new Date().toLocaleDateString('fr-MA', { day: 'numeric', month: 'short', timeZone: 'Africa/Casablanca' })}`;

  // Send in small batches to respect Resend rate limits
  let sent = 0;
  for (const email of index.slice(0, 200)) {
    const sub = await env.REPORTS_KV.get(`newsletter:sub:${email}`);
    if (sub && !JSON.parse(sub).active) continue; // skip unsubscribed

    const unsubUrl = `${siteUrl}/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}&token=${nlToken(email)}`;
    // Inject per-recipient unsubscribe link
    const personalHtml = html.replace('</body>', `
      <div style="max-width:600px;margin:4px auto;text-align:center">
        <p style="font-size:10px;color:#94a3b8">
          <a href="${escHtml(unsubUrl)}" style="color:#94a3b8">Se désinscrire</a>
        </p>
      </div></body>`);

    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: 'JAD2FX Morning Briefing <briefing@jad2advisory.com>', to: email, subject, html: personalHtml }),
        signal: AbortSignal.timeout(8_000),
      });
      sent++;
    } catch (e) { console.warn('[CRON][NL] Send failed:', email, e); }
  }
  console.log(`[CRON][NL] Sent ${sent}/${index.length} emails`);
}

// ─── BKAM rate fetch (used in scheduled handler) ──────────────────────────────
async function fetchBkamRates(apiKey, dateStr) {
  if (!apiKey) return null;
  const qs = dateStr ? `?date=${dateStr}` : '';
  const url = `${BKAM_BASE}/cours/Version1/api/CoursVirement${qs}`;
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json', 'Ocp-Apim-Subscription-Key': apiKey },
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return null;
    const raw = await res.json();
    const arr = Array.isArray(raw) ? raw : (raw?.data ?? []);
    // Convert to { CURRENCY: madPerUnit }
    const map = {};
    for (const r of arr) {
      if (r.libDevise && r.moyen && r.uniteDevise > 0) {
        map[r.libDevise] = r.moyen / r.uniteDevise;
      }
    }
    return Object.keys(map).length > 0 ? map : null;
  } catch (err) {
    console.warn('[BKAM fetch]', dateStr ?? 'today', err);
    return null;
  }
}

// ─── Drift history — store/serve daily drift from BKAM fixing vs basket ──────
//
// CORRECT METHODOLOGY (per BKAM Doc 1 §I and user specification):
//   1. Get ECB EUR/USD at the time BKAM calculates its fixing (MIC closes 15:30
//      Casablanca = ~14:30 UTC). ECB publishes its official daily rate at ~16:00 CET
//      (≈15:00 UTC) via Frankfurter — close enough given T-day ECB publication.
//   2. Compute theoretical basket parity: USD/MAD_théorique = K/(0.60×EUR/USD_ECB+0.40)
//   3. Drift = (USD/MAD_BKAM_published − USD/MAD_théorique) / USD/MAD_théorique × 10 000 bps
//      Positive = MAD weaker than basket implies; Negative = MAD stronger.
//   This is non-circular: ECB EUR/USD is exogenous (not derived from BKAM's own cross).
//
// Band detection heuristic: if the last BAND_ALERT_WINDOW days show avg band
// utilisation >90% or <10%, a band change may have occurred. We flag it in KV.

const BAND_DEFAULT    = 0.05;  // BKAM Phase II ±5% (current since Mar 2020)
const BAND_ALERT_WINDOW = 10;  // days to look back for band change detection
const DRIFT_HISTORY_TTL = 60 * 60 * 24 * 400; // 400-day KV TTL

async function getBandPct(kv) {
  if (!kv) return BAND_DEFAULT;
  try {
    const v = await kv.get('config:band_pct');
    return v ? parseFloat(v) : BAND_DEFAULT;
  } catch { return BAND_DEFAULT; }
}

async function getDriftIndex(kv) {
  try { const r = await kv.get('drift:index'); return r ? JSON.parse(r) : []; }
  catch { return []; }
}
async function setDriftIndex(kv, idx) {
  await kv.put('drift:index', JSON.stringify(idx));
}

// Compute and persist daily drift point after each successful BKAM fetch.
// Called inside handleScheduled with todayRates (BKAM CoursVirement per-unit).
async function storeDailyDrift(env, date, todayRates) {
  if (!env.REPORTS_KV || !todayRates?.['USD']) return;

  // Step 1 — ECB EUR/USD for the fixing date (closest to 15:30 Casablanca session close)
  let ecbEurUsd = null;
  try {
    const ecbRes = await fetch(
      `https://api.frankfurter.app/${date}?from=EUR&to=USD`,
      { signal: AbortSignal.timeout(8_000) }
    );
    if (ecbRes.ok) {
      const ecbData = await ecbRes.json();
      ecbEurUsd = ecbData.rates?.['USD'] ?? null;
    }
  } catch (e) { console.warn('[DRIFT] ECB fetch failed:', e); }

  if (!ecbEurUsd) { console.warn('[DRIFT] No ECB EUR/USD — skipping drift storage'); return; }

  const K = 10.49, wEUR = 0.60, wUSD = 0.40;
  const bkamUsdMad  = todayRates['USD'];
  // Step 2 — Theoretical basket parity using ECB EUR/USD (non-circular)
  const basketUsdMad = K / (wEUR * ecbEurUsd + wUSD);
  // Step 3 — Drift
  const driftBps = ((bkamUsdMad - basketUsdMad) / basketUsdMad) * 10_000;

  const bandPct = await getBandPct(env.REPORTS_KV);
  const lower = basketUsdMad * (1 - bandPct);
  const upper = basketUsdMad * (1 + bandPct);
  const bandUtilPct = Math.max(0, Math.min(100, ((bkamUsdMad - lower) / (upper - lower)) * 100));

  const point = {
    date,
    actualUsdMad:  +bkamUsdMad.toFixed(4),
    actualEurMad:  todayRates['EUR'] ? +(todayRates['EUR']).toFixed(4) : null,
    basketUsdMad:  +basketUsdMad.toFixed(4),
    driftBps:      +driftBps.toFixed(2),
    eurUsd:        +ecbEurUsd.toFixed(4),
    bandPct,
    bandUtilPct:   +bandUtilPct.toFixed(1),
    source: 'BKAM_OFFICIAL',
  };

  await env.REPORTS_KV.put(`drift:${date}`, JSON.stringify(point), { expirationTtl: DRIFT_HISTORY_TTL });

  // Update chronological index (keep last 365 days)
  const idx = await getDriftIndex(env.REPORTS_KV);
  if (!idx.includes(date)) {
    idx.push(date);
    idx.sort();
    if (idx.length > 365) idx.splice(0, idx.length - 365);
    await setDriftIndex(env.REPORTS_KV, idx);
  }

  // ── Dynamic band change detection ────────────────────────────────────────
  // Heuristic: if recent fixings are consistently at the band extremes,
  // BKAM may have widened the band. We can't confirm without official data
  // so we flag it for admin review.
  const recentDates = idx.slice(-BAND_ALERT_WINDOW);
  if (recentDates.length >= BAND_ALERT_WINDOW) {
    const rawPoints = await Promise.all(
      recentDates.map(d => env.REPORTS_KV.get(`drift:${d}`).then(r => r ? JSON.parse(r) : null).catch(() => null))
    );
    const validPts = rawPoints.filter(Boolean);
    if (validPts.length >= Math.floor(BAND_ALERT_WINDOW * 0.8)) {
      const avgUtil = validPts.reduce((s, p) => s + (p.bandUtilPct ?? 50), 0) / validPts.length;
      const maxDrift = Math.max(...validPts.map(p => Math.abs(p.driftBps)));

      // Trigger alert if avg band util > 88% or < 12% for BAND_ALERT_WINDOW days
      if (avgUtil > 88 || avgUtil < 12) {
        const alert = {
          detectedAt: new Date().toISOString(),
          avgBandUtilPct: +avgUtil.toFixed(1),
          maxAbsDriftBps: +maxDrift.toFixed(1),
          currentBandPct: bandPct,
          severity: avgUtil > 95 || avgUtil < 5 ? 'HIGH' : 'MEDIUM',
          message: `Band change detection: avg utilisation ${avgUtil.toFixed(1)}% over last ${BAND_ALERT_WINDOW} days. Current assumed band ±${(bandPct * 100).toFixed(1)}%. Verify on bkam.ma.`,
        };
        await env.REPORTS_KV.put('drift:band_alert', JSON.stringify(alert), { expirationTtl: 60 * 60 * 24 * 30 });
        console.warn('[DRIFT][BAND] Potential band change:', alert.message);
      } else {
        // Clear stale alert if conditions have normalised
        await env.REPORTS_KV.delete('drift:band_alert').catch(() => {});
      }
    }
  }

  console.log(`[DRIFT] ${date}: drift=${driftBps.toFixed(1)}bps util=${bandUtilPct.toFixed(1)}% band=±${(bandPct*100).toFixed(1)}%`);
}

// ─── Drift backfill — process historical dates in batches ────────────────────
// Triggered by setting KV key 'drift:backfill_trigger' = N (number of days).
// The scheduled handler detects the key, runs the backfill, then deletes the key.

async function runDriftBackfill(env, days) {
  if (!env.BKAM_FX_KEY || !env.REPORTS_KV) {
    console.warn('[BACKFILL] Missing BKAM_FX_KEY or REPORTS_KV');
    return { processed: 0, failed: 0 };
  }
  const t0 = Date.now();
  console.log(`[BACKFILL] Starting ${days}-day drift backfill...`);

  // Build list of working days (Mon–Fri), oldest first
  const dates = [];
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  while (dates.length < days) {
    d.setUTCDate(d.getUTCDate() - 1);
    const dow = d.getUTCDay();
    if (dow !== 0 && dow !== 6) dates.unshift(d.toISOString().slice(0, 10));
  }

  // Skip dates already stored in KV
  const idx = await getDriftIndex(env.REPORTS_KV);
  const toProcess = dates.filter(dt => !idx.includes(dt));
  console.log(`[BACKFILL] ${dates.length} working days, ${idx.length} already stored → ${toProcess.length} to fetch`);

  if (!toProcess.length) {
    console.log('[BACKFILL] Nothing to do.');
    return { processed: 0, failed: 0, skipped: dates.length };
  }

  let processed = 0, failed = 0;
  const BATCH = 5; // parallel requests per batch

  for (let i = 0; i < toProcess.length; i += BATCH) {
    const batch = toProcess.slice(i, i + BATCH);
    const settled = await Promise.allSettled(
      batch.map(async date => {
        const bkamData = await fetchBkamRates(env.BKAM_FX_KEY, date);
        if (bkamData && bkamData['USD']) {
          await storeDailyDrift(env, date, bkamData);
          return 'ok';
        }
        return 'no_bkam_data';
      })
    );
    settled.forEach(r => {
      if (r.status === 'fulfilled' && r.value === 'ok') processed++;
      else failed++;
    });
    const batchNum = Math.floor(i / BATCH) + 1;
    const totalBatches = Math.ceil(toProcess.length / BATCH);
    console.log(`[BACKFILL] Batch ${batchNum}/${totalBatches} → processed=${processed} failed=${failed}`);
  }

  console.log(`[BACKFILL] Complete: ${processed} stored, ${failed} failed in ${Date.now() - t0}ms`);
  return { processed, failed, total: toProcess.length };
}

// GET /api/drift/history?days=30 — public, serves historical drift from KV
async function handleGetDriftHistory(request, env, origin) {
  if (!env.REPORTS_KV) return json({ points: [], bandPct: BAND_DEFAULT }, 200, origin);
  const url = new URL(request.url);
  const days = Math.min(365, Math.max(1, parseInt(url.searchParams.get('days') ?? '30')));

  const idx = await getDriftIndex(env.REPORTS_KV);
  const requestedDates = idx.slice(-days);

  const points = [];
  for (const date of requestedDates) {
    try {
      const raw = await env.REPORTS_KV.get(`drift:${date}`);
      if (raw) points.push(JSON.parse(raw));
    } catch { /* skip corrupt entries */ }
  }

  const bandPct = await getBandPct(env.REPORTS_KV);
  const alert = await env.REPORTS_KV.get('drift:band_alert').then(r => r ? JSON.parse(r) : null).catch(() => null);

  return json({ points, bandPct, alert }, 200, origin);
}

// GET /api/band-config — public, returns current band config + alert
async function handleGetBandConfig(env, origin) {
  const bandPct  = await getBandPct(env.REPORTS_KV);
  const updatedAt = env.REPORTS_KV ? await env.REPORTS_KV.get('config:band_updated_at').catch(() => null) : null;
  const alert    = env.REPORTS_KV ? await env.REPORTS_KV.get('drift:band_alert').then(r => r ? JSON.parse(r) : null).catch(() => null) : null;
  return json({ bandPct, updatedAt, alert, phase: bandPct <= 0.025 ? 'Phase I' : bandPct <= 0.05 ? 'Phase II' : 'Phase III+' }, 200, origin);
}

// POST /api/admin/band — admin only, update band assumption in KV
async function handleUpdateBand(request, env, origin) {
  const denied = adminGate(request, env, origin);
  if (denied) return denied;
  if (!env.REPORTS_KV) return json({ error: 'KV non configuré' }, 503, origin);

  const rawBody = await readBodySafe(request);
  let body;
  try { body = JSON.parse(rawBody); } catch { return json({ error: 'JSON invalide' }, 400, origin); }

  const bandPct = typeof body.bandPct === 'number' ? body.bandPct : null;
  if (!bandPct || bandPct < 0.01 || bandPct > 0.20) {
    return json({ error: 'bandPct must be 0.01–0.20 (1%–20%)' }, 400, origin);
  }

  await env.REPORTS_KV.put('config:band_pct', String(bandPct));
  await env.REPORTS_KV.put('config:band_updated_at', new Date().toISOString());
  // Clear any stale alert when admin manually updates the band
  await env.REPORTS_KV.delete('drift:band_alert').catch(() => {});

  return json({ ok: true, bandPct, message: `Band mis à jour: ±${(bandPct * 100).toFixed(1)}%` }, 200, origin);
}

// ─── BKAM BDT yield curve (KV-cached, refreshed by cron) ─────────────────────

// GET /api/bdt/curve — public; serves cached BDT data from KV
async function handleBdtCurve(env, origin) {
  if (!env.REPORTS_KV) return json({ points: [], stale: true, error: 'KV not configured' }, 503, origin);
  try {
    const raw = await env.REPORTS_KV.get('bdt:latest');
    if (!raw) return json({ points: [], stale: true }, 200, origin);
    return json(JSON.parse(raw), 200, origin);
  } catch (err) {
    return json({ points: [], stale: true, error: String(err) }, 500, origin);
  }
}

// Called by cron to fetch BKAM BDT and store in KV
async function fetchAndStoreBdt(env) {
  if (!env.BKAM_MONIA_KEY || !env.REPORTS_KV) return;
  try {
    const res = await fetch(
      `${BKAM_BASE}/mo/Version1/api/CourbeBDT`,
      { headers: { Accept: 'application/json', 'Ocp-Apim-Subscription-Key': env.BKAM_MONIA_KEY }, signal: AbortSignal.timeout(12_000) },
    );
    if (!res.ok) { console.warn('[CRON] BDT HTTP', res.status); return; }
    const raw = await res.json();
    const arr = Array.isArray(raw) ? raw : (raw?.data ?? []);
    if (arr.length > 0) {
      await env.REPORTS_KV.put(
        'bdt:latest',
        JSON.stringify({ points: arr, fetchedAt: new Date().toISOString() }),
        { expirationTtl: 60 * 60 * 25 }, // 25h — survives one missed cron
      );
      console.log(`[CRON] BDT stored: ${arr.length} points`);
    }
  } catch (err) {
    console.warn('[CRON] BDT fetch failed:', err);
  }
}

// ─── Scheduled handler — 9h00 Casablanca, auto market report ─────────────────
async function handleScheduled(env) {
  if (!env.REPORTS_KV) {
    console.error('[CRON] REPORTS_KV not configured');
    return;
  }

  // ── Backfill trigger check ─────────────────────────────────────────────────
  // Set KV key 'drift:backfill_trigger' = '90' (or any N) to trigger a one-shot
  // historical drift backfill on the next cron run. Key is deleted after execution.
  try {
    const backfillDays = await env.REPORTS_KV.get('drift:backfill_trigger');
    if (backfillDays) {
      console.log(`[CRON] Backfill trigger detected: ${backfillDays} days`);
      await env.REPORTS_KV.delete('drift:backfill_trigger');
      await runDriftBackfill(env, Math.min(365, Math.max(1, parseInt(backfillDays))));
    }
  } catch (e) {
    console.warn('[CRON] Backfill trigger check failed:', e);
  }

  if (!env.GROQ_API_KEY) {
    console.error('[CRON] GROQ_API_KEY not configured — skipping report generation');
    return;
  }

  const t0 = Date.now();
  console.log('[CRON] Starting 09h00 Casablanca market report generation');

  // ── 1. Fetch today's BKAM rates ───────────────────────────────────────────
  const todayRates = await fetchBkamRates(env.BKAM_FX_KEY, null);

  // ── 2. Fetch last week's BKAM rates (same weekday, -7 days) for drift calc ─
  const lastWeekDate = new Date();
  lastWeekDate.setUTCDate(lastWeekDate.getUTCDate() - 7);
  // Ensure it's a weekday
  const dow = lastWeekDate.getUTCDay();
  if (dow === 0) lastWeekDate.setUTCDate(lastWeekDate.getUTCDate() - 2); // Sun → Fri
  if (dow === 6) lastWeekDate.setUTCDate(lastWeekDate.getUTCDate() - 1); // Sat → Fri
  const lastWeekStr = lastWeekDate.toISOString().slice(0, 10);
  const lastWeekRates = await fetchBkamRates(env.BKAM_FX_KEY, lastWeekStr);

  // ── 3. Compute weekly drift in bps per currency ──────────────────────────
  function weeklyChangeBps(currency, today, lastWeek) {
    const t = today?.[currency];
    const l = lastWeek?.[currency];
    if (!t || !l || l === 0) return 0;
    return Math.round(((t - l) / l) * 10_000);
  }

  // ── 4. Build live rates context ──────────────────────────────────────────
  const RADAR_CURRENCIES = [
    { code: 'EUR', flag: '🇪🇺', nameFr: 'Euro' },
    { code: 'USD', flag: '🇺🇸', nameFr: 'Dollar américain' },
    { code: 'GBP', flag: '🇬🇧', nameFr: 'Livre sterling' },
    { code: 'SAR', flag: '🇸🇦', nameFr: 'Riyal saoudien' },
    { code: 'AED', flag: '🇦🇪', nameFr: 'Dirham des Émirats' },
    { code: 'QAR', flag: '🇶🇦', nameFr: 'Riyal qatarien' },
  ];

  const ratesCtx = todayRates
    ? RADAR_CURRENCIES
        .map(c => {
          const rate = todayRates[c.code];
          const bps = weeklyChangeBps(c.code, todayRates, lastWeekRates);
          return `${c.code}/MAD: ${rate ? rate.toFixed(4) : 'N/A'} (7j: ${bps > 0 ? '+' : ''}${bps} bps)`;
        })
        .join(' | ')
    : 'Taux BKAM indisponibles — utiliser estimations ECB.';

  // ── 5. Tavily web searches ────────────────────────────────────────────────
  const SEARCH_QUERIES = [
    'EUR USD exchange rate overnight move Federal Reserve ECB policy',
    'Bank Al-Maghrib BKAM Morocco monetary policy dirham reserves',
    'Morocco economy trade balance OCP phosphate remittances MRE',
    'Brent crude oil price today Morocco energy imports',
    'ECB European Central Bank interest rates decision eurozone inflation',
  ];
  const searchResults = [];

  if (env.TAVILY_KEY) {
    for (const query of SEARCH_QUERIES) {
      try {
        const res = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, api_key: env.TAVILY_KEY, max_results: 3, search_depth: 'basic' }),
          signal: AbortSignal.timeout(15_000),
        });
        if (res.ok) {
          const data = await res.json();
          const snippets = (data.results ?? []).slice(0, 3).map(r => `• ${r.title}: ${(r.content ?? '').slice(0, 220)}`);
          searchResults.push({ query, snippets });
        }
      } catch (e) {
        console.warn(`[CRON] Tavily "${query}" failed:`, e);
      }
    }
  }

  const searchCtx = searchResults.length > 0
    ? searchResults.map(s => `### "${s.query}"\n${s.snippets.join('\n')}`).join('\n\n')
    : 'Aucune donnée de veille disponible.';

  // ── 6. Build prompt for Groq ─────────────────────────────────────────────
  const today = new Date().toLocaleDateString('fr-MA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Africa/Casablanca',
  });

  // Compute basket-derived band utilization for context
  let bandCtx = '';
  if (todayRates?.['EUR'] && todayRates?.['USD']) {
    const K = 10.49, wEUR = 0.60, wUSD = 0.40;
    const eurUsd = todayRates['EUR'] / todayRates['USD'];
    const centralUsd = K / (wEUR * eurUsd + wUSD);
    const centralEur = centralUsd * eurUsd;
    const eurBand = ((todayRates['EUR'] - centralEur * 0.95) / (centralEur * 1.10)) * 100;
    const usdBand = ((todayRates['USD'] - centralUsd * 0.95) / (centralUsd * 1.10)) * 100;
    const driftEurBps = Math.round(((todayRates['EUR'] - centralEur) / centralEur) * 10000);
    const driftUsdBps = Math.round(((todayRates['USD'] - centralUsd) / centralUsd) * 10000);
    const eurZone = eurBand < 35 ? 'ZONE NEUTRE BAS' : eurBand > 65 ? 'ZONE ATTENTION HAUT' : 'ZONE NEUTRE';
    const usdZone = usdBand < 35 ? 'ZONE NEUTRE BAS' : usdBand > 65 ? 'ZONE ATTENTION HAUT' : 'ZONE NEUTRE';
    bandCtx = [
      `EUR/MAD: parité centrale ${centralEur.toFixed(4)} | cours ${todayRates['EUR'].toFixed(4)} | dérive ${driftEurBps > 0 ? '+' : ''}${driftEurBps} bps | utilisation bande ${eurBand.toFixed(0)}% (${eurZone})`,
      `USD/MAD: parité centrale ${centralUsd.toFixed(4)} | cours ${todayRates['USD'].toFixed(4)} | dérive ${driftUsdBps > 0 ? '+' : ''}${driftUsdBps} bps | utilisation bande ${usdBand.toFixed(0)}% (${usdZone})`,
    ].join('\n');
  }

  const systemPrompt = [
    'Tu es le Stratégiste FX en Chef d\'une banque d\'investissement de premier rang (standard Goldman Sachs GIR / JPMorgan FX Strategy).',
    'Tu rédiges le Morning Briefing MAD quotidien pour des Directeurs Financiers et Trésoriers d\'entreprises marocaines d\'envergure.',
    '',
    'TON STANDARD ÉDITORIAL :',
    '- Niveau : Goldman Sachs Global Investment Research — dense, précis, quantitatif',
    '- Aucune platitude générique : chaque phrase contient une donnée chiffrée ou un raisonnement analytique',
    '- Utilise systématiquement : bps (basis points), band utilization, CIP, panier 60/40, dérive, K=10.49',
    '- Cite les données concrètes fournies (taux BKAM, veille web) — ne les invente pas',
    '- Prose fluide professionnelle — pas de listes à puces sauf pour les risques',
    '- Longueur contentFr : 800-1200 mots, sections denses',
    '',
    '⚠️ CONTRAINTES LÉGALES STRICTES (violation = rapport invalide) :',
    '- JAMAIS : "couvrir", "hedger", "conseil", "recommandation", "acheter", "vendre", "contrat à terme", "prendre position"',
    '- JAMAIS : impératif transactionnel ("il faut", "vous devriez", "profitez de")',
    '- TOUJOURS : "niveau de référence", "données indicatives", "contexte de marché", "dynamique à surveiller"',
    '- Pour les opérations : "votre banque domiciliataire agréée par Bank Al-Maghrib"',
    '',
    'STRUCTURE OBLIGATOIRE contentFr (6 sections en markdown) :',
    '',
    '## Macro Backdrop — Les Trois Piliers du MAD',
    'Analyse les trois piliers structurels du dirham : (1) Pilier EUR (60% panier) — dynamique BCE/EUR/USD overnight ;',
    '(2) Pilier USD (40% panier) — trajectoire Fed, USD Index, données macro US ; (3) Pilier Maroc — BKAM, réserves,',
    'OCP/recettes phosphates, transferts MRE, facture pétrolière. Cite les mouvements overnight en bps.',
    '',
    '## Configuration Technique du MAD',
    'Position exacte dans la bande ±5% BKAM (en % d\'utilisation et zone). Dérive du cours vs parité panier',
    'théorique K=10.49 (en bps). Formule : USD/MAD central = K / (0.60×EUR/USD + 0.40). Niveaux techniques',
    'indicatifs : support/résistance naturels dérivés de la cage et de la parité. Conclusion sur le biais directionnel.',
    '',
    '## Banques Centrales — Signaux de Politique Monétaire',
    'BCE : posture actuelle, dernières déclarations, impact EUR/USD → EUR/MAD (60% basket). Fed : trajectoire FOMC,',
    'dot plot, impact USD/MAD (40% basket). BKAM : taux directeur 2.75%, prochain Conseil de Politique Monétaire,',
    'stance vis-à-vis de la flexibilité du régime de change. Calendrier des prochains événements macro (J-X).',
    '',
    '## Thèmes Structurels de la Semaine',
    'Trois thèmes analytiques majeurs affectant le MAD cette semaine. Chaque thème : une analyse causale',
    'complète (driver → transmission → impact MAD en bps/%) avec données quantitatives. Niveau d\'urgence.',
    '',
    '## Contexte Corporate — Lecture des Flux (Éducatif)',
    'Analyse des implications pour les entreprises marocaines à vocation internationale. IMPORTATEURS : contexte',
    'EUR/MAD et USD/MAD pour la lecture de leurs flux d\'approvisionnement. EXPORTATEURS : dynamique MAD',
    'pour l\'anticipation des recettes en devises. OCP/PHOSPHATES : impact prix phosphates sur flux USD.',
    'ÉNERGIE : facture pétrolière et pression sur le compte courant. Toujours conclure :',
    '"Pour toute opération de change, adressez-vous à votre banque domiciliataire agréée par Bank Al-Maghrib."',
    '',
    '## Moniteur de Risques',
    'Cinq risques quantifiés pour le MAD, classés par probabilité/impact. Format : [RISQUE] — [MÉCANISME',
    'DE TRANSMISSION] — [IMPACT ESTIMÉ EN BPS]. Couvre : géopolitique, macro global, technique marché,',
    'politique monétaire, spécifique Maroc.',
    '',
    'VERSION ARABE contentAr : Mêmes sections, même niveau analytique, en arabe professionnel financier.',
    '',
    'RADAR DATA : Pour chaque devise, sentiment BULLISH = pression baissière MAD, BEARISH = soutien MAD,',
    'NEUTRAL = stabilité. Les weeklyChangeBps DOIVENT refléter exactement les données fournies.',
    '',
    'Réponds UNIQUEMENT avec un objet JSON valide (pas de markdown autour) :',
    '{',
    '  "titleFr": "Titre court (≤80 cars)",',
    '  "titleAr": "العنوان بالعربية",',
    '  "excerptFr": "Résumé en 2 phrases",',
    '  "excerptAr": "ملخص في جملتين",',
    '  "contentFr": "Rapport markdown FR avec sections ## Synthèse, ## Paires MAD, ## Impact PME, ## Perspectives",',
    '  "contentAr": "التقرير بالعربية مع الأقسام نفسها",',
    '  "radarData": [',
    '    { "currency":"EUR","currentRate":0,"weeklyChangeBps":0,"headline":"one sentence FR","headlineAr":"جملة واحدة","sentiment":"BULLISH|BEARISH|NEUTRAL","expectation":"one sentence FR","expectationAr":"جملة واحدة" },',
    '    { "currency":"USD","currentRate":0,"weeklyChangeBps":0,"headline":"...","headlineAr":"...","sentiment":"BULLISH|BEARISH|NEUTRAL","expectation":"...","expectationAr":"..." },',
    '    { "currency":"GBP","currentRate":0,"weeklyChangeBps":0,"headline":"...","headlineAr":"...","sentiment":"BULLISH|BEARISH|NEUTRAL","expectation":"...","expectationAr":"..." },',
    '    { "currency":"SAR","currentRate":0,"weeklyChangeBps":0,"headline":"...","headlineAr":"...","sentiment":"BULLISH|BEARISH|NEUTRAL","expectation":"...","expectationAr":"..." },',
    '    { "currency":"AED","currentRate":0,"weeklyChangeBps":0,"headline":"...","headlineAr":"...","sentiment":"BULLISH|BEARISH|NEUTRAL","expectation":"...","expectationAr":"..." },',
    '    { "currency":"QAR","currentRate":0,"weeklyChangeBps":0,"headline":"...","headlineAr":"...","sentiment":"BULLISH|BEARISH|NEUTRAL","expectation":"...","expectationAr":"..." }',
    '  ]',
    '}',
  ].join('\n');

  const userMessage = [
    `═══ MORNING BRIEFING — ${today} ═══`,
    '',
    '── TAUX BKAM LIVE (MAD par unité, source officielle) ──',
    ratesCtx,
    '',
    '── ANALYSE DE BANDE (calculée sur données BKAM ci-dessus) ──',
    bandCtx || 'Données BKAM indisponibles — utiliser références ECB approximées.',
    '',
    `── DÉRIVE HEBDOMADAIRE (vs ${lastWeekStr}) ──`,
    RADAR_CURRENCIES.map(c => {
      const bps = weeklyChangeBps(c.code, todayRates, lastWeekRates);
      const t = todayRates?.[c.code];
      const l = lastWeekRates?.[c.code];
      return `${c.code}/MAD: ${t ? t.toFixed(4) : 'N/A'} (7j: ${bps > 0 ? '+' : ''}${bps} bps${l ? ` | semaine précédente: ${l.toFixed(4)}` : ''})`;
    }).join(' | '),
    '',
    '── VEILLE MARCHÉ OVERNIGHT (sources web) ──',
    searchCtx,
    '',
    '── INSTRUCTIONS RÉDACTIONNELLES ──',
    'Standard: Goldman Sachs GIR. Dense, quantitatif, institutionnel.',
    'Utilise les données chiffrées ci-dessus dans le rapport (ne pas inventer les taux).',
    'Calcule et cite l\'utilisation des bandes BKAM ±5% dans la section technique.',
    'Mentionne le prochain événement macro le plus proche parmi: FOMC, BCE, BKAM CPM, NFP, CPI.',
    'Rappel légal obligatoire en fin de section Corporate: "Pour toute opération de change, adressez-vous à votre banque domiciliataire agréée par Bank Al-Maghrib."',
    '',
    'Génère maintenant le briefing JSON complet. Les weeklyChangeBps dans radarData DOIVENT refléter les chiffres exacts ci-dessus.',
  ].join('\n');

  // ── 7. Groq API call ──────────────────────────────────────────────────────
  let groqText = '';
  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 6000,
        temperature: 0.35,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(90_000),
    });
    if (!groqRes.ok) {
      console.error('[CRON] Groq error:', groqRes.status, await groqRes.text());
      return;
    }
    const groqData = await groqRes.json();
    groqText = groqData.choices?.[0]?.message?.content ?? '';
  } catch (err) {
    console.error('[CRON] Groq call failed:', err);
    return;
  }

  // ── 8. Parse JSON ─────────────────────────────────────────────────────────
  let parsed = {};
  try {
    const block = groqText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const jsonStr = block ? block[1] : groqText.slice(groqText.indexOf('{'), groqText.lastIndexOf('}') + 1);
    parsed = JSON.parse(jsonStr);
  } catch (err) {
    console.error('[CRON] JSON parse failed:', err, groqText.slice(0, 300));
    return;
  }

  // ── 9. Overlay real BKAM rates and drift on radar ────────────────────────
  // Emoji flag lookup (LLM must never generate these — we inject them server-side)
  const RADAR_FLAGS = { EUR:'🇪🇺', USD:'🇺🇸', GBP:'🇬🇧', SAR:'🇸🇦', AED:'🇦🇪', QAR:'🇶🇦' };

  const radarData = (parsed.radarData && Array.isArray(parsed.radarData) && parsed.radarData.length >= 3)
    ? parsed.radarData.map(r => ({
        ...r,
        flag: RADAR_FLAGS[r.currency] ?? '',        // inject flag server-side, never from LLM
        currentRate: todayRates?.[r.currency] ?? r.currentRate,
        weeklyChangeBps: lastWeekRates ? weeklyChangeBps(r.currency, todayRates, lastWeekRates) : (r.weeklyChangeBps ?? 0),
      }))
    : RADAR_CURRENCIES.map(c => ({
        currency: c.code,
        flag: c.flag,
        currentRate: todayRates?.[c.code] ?? 0,
        weeklyChangeBps: weeklyChangeBps(c.code, todayRates, lastWeekRates),
        headline: 'Données indicatives — rapport auto-généré.',
        headlineAr: 'بيانات استرشادية.',
        sentiment: 'NEUTRAL',
        expectation: 'Stabilité attendue',
        expectationAr: 'استقرار متوقع',
      }));

  // ── 10. Build and publish report ──────────────────────────────────────────
  const now = new Date().toISOString();
  const reportId = `rpt-${Date.now()}`;
  const report = {
    id: reportId,
    createdAt: now,
    publishedAt: now,
    titleFr: parsed.titleFr ?? 'Rapport FX Maroc',
    titleAr: parsed.titleAr ?? 'تقرير سوق الصرف المغربي',
    excerptFr: parsed.excerptFr ?? '',
    excerptAr: parsed.excerptAr ?? '',
    contentFr: parsed.contentFr ?? '',
    contentAr: parsed.contentAr ?? '',
    radarData,
    llmModel: 'groq/llama-3.3-70b-versatile',
    tavilyQueries: SEARCH_QUERIES,
    adminNotes: `Auto-généré à 09h00 Casablanca · Taux BKAM ${todayRates ? 'live' : 'indisponibles'} · Veille ${searchResults.length} requêtes · Dérive hebdomadaire calculée sur ${lastWeekStr}`,
    isPublished: true,
    generation: {
      durationMs: Date.now() - t0,
      tavilySearchCount: searchResults.length,
      bkamLive: !!todayRates,
      driftBaseline: lastWeekStr,
    },
  };

  await env.REPORTS_KV.put(`report:${reportId}`, JSON.stringify(report), { expirationTtl: 60 * 60 * 24 * 90 });

  const index = await getIndex(env.REPORTS_KV);
  index.unshift({ id: reportId, createdAt: now, titleFr: report.titleFr, isPublished: true, llmModel: report.llmModel });
  await setIndex(env.REPORTS_KV, index.slice(0, 50));
  await env.REPORTS_KV.put('published', reportId);

  console.log(`[CRON] Report published: ${reportId} (${Date.now() - t0}ms)`);

  // Send daily newsletter to subscribers
  await sendDailyNewsletter(report, todayRates, env);

  // Store daily drift point with correct methodology:
  // theoretical = K/(0.60×ECB_EUR/USD+0.40) vs BKAM published fixing
  const driftDate = new Date().toISOString().slice(0, 10);
  await storeDailyDrift(env, driftDate, todayRates);

  // Refresh BDT yield curve in KV for forward pricing
  await fetchAndStoreBdt(env);
}

// ─── Main fetch handler ───────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') ?? '';

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    const url = new URL(request.url);
    const pathname = url.pathname;

    // ── BKAM BDT/obligataire proxy (MONIA subscription) ──────────────────────
    if (pathname.startsWith('/bkam-bdt/')) {
      if (request.method !== 'GET') return new Response('Method Not Allowed', { status: 405 });
      return handleBkam(pathname.slice('/bkam-bdt/'.length), url.searchParams.toString(), env.BKAM_MONIA_KEY, origin);
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

    // ── LLM chat proxy ────────────────────────────────────────────────────────
    if (pathname === '/api/llm/chat') {
      if (request.method !== 'POST') return json({ error: 'POST only' }, 405, origin);
      return handleLlmChat(request, env, origin);
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

    // ── Twelve Data EUR cross-rates (Yahoo failover) ─────────────────────────
    if (pathname === '/api/forex/rates') {
      if (request.method !== 'GET') return json({ error: 'GET only' }, 405, origin);
      return handleTwelveDataRates(env, origin);
    }

    // ── BKAM BDT yield curve (KV cache) ──────────────────────────────────────
    if (pathname === '/api/bdt/curve') {
      if (request.method !== 'GET') return json({ error: 'GET only' }, 405, origin);
      return handleBdtCurve(env, origin);
    }

    // ── Drift history & band config ───────────────────────────────────────────
    if (pathname === '/api/drift/history') {
      if (request.method !== 'GET') return json({ error: 'GET only' }, 405, origin);
      return handleGetDriftHistory(request, env, origin);
    }
    if (pathname === '/api/band-config') {
      if (request.method !== 'GET') return json({ error: 'GET only' }, 405, origin);
      return handleGetBandConfig(env, origin);
    }
    if (pathname === '/api/admin/band') {
      if (request.method !== 'POST') return json({ error: 'POST only' }, 405, origin);
      return handleUpdateBand(request, env, origin);
    }

    // ── Newsletter ────────────────────────────────────────────────────────────
    if (pathname === '/api/newsletter/subscribe') {
      if (request.method !== 'POST') return json({ error: 'POST only' }, 405, origin);
      return handleNewsletterSubscribe(request, env, origin);
    }
    if (pathname === '/api/newsletter/unsubscribe') {
      if (request.method !== 'GET') return json({ error: 'GET only' }, 405, origin);
      return handleNewsletterUnsubscribe(request, env, origin);
    }
    if (pathname === '/api/newsletter/subscribers') {
      if (request.method !== 'GET') return json({ error: 'GET only' }, 405, origin);
      return handleNewsletterAdmin(request, env, origin);
    }

    // ── Contact form → Resend ─────────────────────────────────────────────────
    if (pathname === '/api/contact') {
      if (request.method !== 'POST') return json({ error: 'POST only' }, 405, origin);
      return handleContact(request, env, origin);
    }

    // ── Anonymous sim telemetry ───────────────────────────────────────────────
    if (pathname === '/api/telemetry/sim') {
      if (request.method === 'POST') return handleTelemetryPost(request, env, origin);
      if (request.method === 'GET')  return handleTelemetryGet(request, env, origin);
      return json({ error: 'GET or POST only' }, 405, origin);
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

  async scheduled(event, env, ctx) {
    ctx.waitUntil(handleScheduled(env));
  },
};
