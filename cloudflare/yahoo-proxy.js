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
  /^https:\/\/[a-z0-9-]+\.jad2fx\.pages\.dev$/,  // all Pages preview + prod URLs
  /^https:\/\/jad2fx\.com$/,
  /^https:\/\/jad2fx\.pages\.dev$/,
  /^http:\/\/localhost:(5173|4173)$/,
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
  const allowed = isAllowedOrigin(origin) ? origin : 'https://jad2fx.pages.dev';
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
  if (!env.GROQ_API_KEY) {
    console.error('[CRON] GROQ_API_KEY not configured — skipping report generation');
    return;
  }
  if (!env.REPORTS_KV) {
    console.error('[CRON] REPORTS_KV not configured');
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
    'taux de change dirham marocain EUR USD actualité semaine',
    'Bank Al-Maghrib BKAM politique monétaire inflation Maroc',
    'économie marocaine commerce extérieur import export actualité',
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

  const systemPrompt = [
    'Tu es un analyste FX senior spécialisé dans le marché des changes marocain (MAD).',
    'Tu rédiges des rapports hebdomadaires pour des PME et TPE marocaines (import/export).',
    'Ton ton est informatif, pédagogique et prudent. Les informations sont strictement indicatives.',
    '',
    'Consignes éditoriales FR : Rapport factuel, accessible aux non-spécialistes. Contexte MAD en priorité.',
    'Consignes éditoriales AR : تقرير واقعي وسهل الفهم للمؤسسات المغربية.',
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
    '    { "currency":"USD","flag":"🇺🇸","currentRate":0,"weeklyChangeBps":0,"headline":"...","headlineAr":"...","sentiment":"BULLISH|BEARISH|NEUTRAL","expectation":"...","expectationAr":"..." },',
    '    { "currency":"GBP","flag":"🇬🇧","currentRate":0,"weeklyChangeBps":0,"headline":"...","headlineAr":"...","sentiment":"BULLISH|BEARISH|NEUTRAL","expectation":"...","expectationAr":"..." },',
    '    { "currency":"SAR","flag":"🇸🇦","currentRate":0,"weeklyChangeBps":0,"headline":"...","headlineAr":"...","sentiment":"BULLISH|BEARISH|NEUTRAL","expectation":"...","expectationAr":"..." },',
    '    { "currency":"AED","flag":"🇦🇪","currentRate":0,"weeklyChangeBps":0,"headline":"...","headlineAr":"...","sentiment":"BULLISH|BEARISH|NEUTRAL","expectation":"...","expectationAr":"..." },',
    '    { "currency":"QAR","flag":"🇶🇦","currentRate":0,"weeklyChangeBps":0,"headline":"...","headlineAr":"...","sentiment":"BULLISH|BEARISH|NEUTRAL","expectation":"...","expectationAr":"..." }',
    '  ]',
    '}',
  ].join('\n');

  const userMessage = [
    `Date : ${today}`,
    `Taux BKAM (avec variation hebdomadaire en bps) : ${ratesCtx}`,
    '',
    '## Veille web',
    searchCtx,
    '',
    'Notes : Rapport automatique hebdomadaire — généré à 09h00 heure Casablanca.',
    '',
    'Génère maintenant le rapport JSON complet. Les weeklyChangeBps dans radarData doivent refléter les chiffres réels fournis ci-dessus.',
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
        max_tokens: 3500,
        temperature: 0.4,
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
  const radarData = (parsed.radarData && Array.isArray(parsed.radarData) && parsed.radarData.length >= 3)
    ? parsed.radarData.map(r => ({
        ...r,
        // Use real BKAM rate if available, else keep LLM value
        currentRate: todayRates?.[r.currency] ?? r.currentRate,
        // Overlay computed drift (real data beats LLM estimate)
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

  // Also refresh BDT yield curve in KV for forward pricing
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
