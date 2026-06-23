/**
 * Official BKAM API client — routed through the CORS proxy worker.
 *
 * Proxy routes (configured in cloudflare/yahoo-proxy.js):
 *   {PROXY}/bkam/{path}?{qs}      → api.centralbankofmorocco.ma  (FX key)
 *   {PROXY}/bkam-bdt/{path}?{qs}  → api.centralbankofmorocco.ma  (BDT key)
 *
 * Authentication is handled entirely in the worker via secrets —
 * no API keys are shipped in the client bundle.
 */

// ─── Response types ───────────────────────────────────────────────────────────

export interface BkamVirementRate {
  date: string;           // "2026-06-23T12:30:00"
  libDevise: string;      // "EUR", "USD", "JPY"
  moyen: number;          // MAD per uniteDevise units (e.g. 5.7951 per 100 JPY)
  uniteDevise: number;    // 1 or 100
}

export interface BkamBBERate {
  date: string;
  libDevise: string;
  achatClientele: number;  // buy from client (bid), MAD per uniteDevise
  venteClientele: number;  // sell to client (ask), MAD per uniteDevise
  uniteDevise: number;
}

export interface BkamBdtPoint {
  date: string;
  maturite: string;   // tenor from BKAM (e.g. "13 semaines")
  tauxMoyen: number;  // yield as percentage (3.25 = 3.25%)
}

// ─── Cache ────────────────────────────────────────────────────────────────────

interface CacheEntry<T> { data: T; ts: number }

let _virementToday: CacheEntry<BkamVirementRate[]> | null = null;
let _bbeToday: CacheEntry<BkamBBERate[]> | null = null;
const _virementByDate = new Map<string, CacheEntry<BkamVirementRate[]>>();

const VIREMENT_CACHE_MS = 20 * 60 * 1000;  // 20 min — rates update at 12:30
const BBE_CACHE_MS      = 60 * 60 * 1000;  // 60 min — BBE published at 08:30
const HIST_CACHE_MS     = 24 * 60 * 60 * 1000;  // 24h for historical dates

// ─── HTTP helper ──────────────────────────────────────────────────────────────

async function bkamGet<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    throw new Error(`BKAM ${res.status} — ${url}`);
  }
  const json = await res.json();
  // BKAM returns an object with a data array, or directly an array
  if (Array.isArray(json)) return json as T;
  if (json && Array.isArray((json as Record<string, unknown>).data)) {
    return (json as Record<string, unknown>).data as T;
  }
  return json as T;
}

function proxyPath(corsProxy: string, route: 'bkam' | 'bkam-bdt', path: string, params?: Record<string, string>): string {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return `${corsProxy}/${route}/${path}${qs}`;
}

// ─── CoursVirement — today ────────────────────────────────────────────────────

export async function fetchBkamVirement(corsProxy: string): Promise<BkamVirementRate[]> {
  if (_virementToday && Date.now() - _virementToday.ts < VIREMENT_CACHE_MS) {
    return _virementToday.data;
  }
  const data = await bkamGet<BkamVirementRate[]>(
    proxyPath(corsProxy, 'bkam', 'CoursVirement'),
  );
  _virementToday = { data, ts: Date.now() };
  return data;
}

// ─── CoursVirement — specific date ───────────────────────────────────────────

export async function fetchBkamVirementDate(corsProxy: string, date: string): Promise<BkamVirementRate[]> {
  const cached = _virementByDate.get(date);
  if (cached && Date.now() - cached.ts < HIST_CACHE_MS) return cached.data;

  // Try with date query param first, then as path segment
  let data: BkamVirementRate[];
  try {
    data = await bkamGet<BkamVirementRate[]>(
      proxyPath(corsProxy, 'bkam', 'CoursVirement', { date }),
    );
    if (!Array.isArray(data) || data.length === 0) throw new Error('empty');
  } catch {
    data = await bkamGet<BkamVirementRate[]>(
      proxyPath(corsProxy, 'bkam', `CoursVirement/${date}`),
    );
  }

  _virementByDate.set(date, { data, ts: Date.now() });
  return data;
}

// ─── CoursBBE — today ─────────────────────────────────────────────────────────

export async function fetchBkamBBE(corsProxy: string): Promise<BkamBBERate[]> {
  if (_bbeToday && Date.now() - _bbeToday.ts < BBE_CACHE_MS) {
    return _bbeToday.data;
  }
  const data = await bkamGet<BkamBBERate[]>(
    proxyPath(corsProxy, 'bkam', 'CoursBBE'),
  );
  _bbeToday = { data, ts: Date.now() };
  return data;
}

// ─── CourbeBDT — BDT yield curve ─────────────────────────────────────────────

export async function fetchBkamBdt(corsProxy: string): Promise<BkamBdtPoint[]> {
  return bkamGet<BkamBdtPoint[]>(
    proxyPath(corsProxy, 'bkam-bdt', 'CourbeBDT'),
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Convert CoursVirement response to a map of currency → MAD per 1 unit.
 * (moyen is MAD per uniteDevise units, so divide to get per-1-unit)
 */
export function virementToMadPerUnit(rates: BkamVirementRate[]): Record<string, number> {
  const m: Record<string, number> = {};
  for (const r of rates) {
    if (r.uniteDevise > 0) m[r.libDevise] = r.moyen / r.uniteDevise;
  }
  return m;
}

/**
 * Convert CoursVirement response to a display-unit map: currency → MAD per bkamUnit.
 * For JPY/NOK/SEK: moyen is already per 100 units (uniteDevise=100).
 * So just index by libDevise → moyen directly.
 */
export function virementToDisplayMap(rates: BkamVirementRate[]): Record<string, number> {
  const m: Record<string, number> = {};
  for (const r of rates) {
    m[r.libDevise] = r.moyen;
  }
  return m;
}

/**
 * Convert CoursBBE response to bid/ask per 1 unit maps.
 */
export function bbeToMadPerUnit(rates: BkamBBERate[]): Record<string, { bid: number; ask: number }> {
  const m: Record<string, { bid: number; ask: number }> = {};
  for (const r of rates) {
    if (r.uniteDevise > 0) {
      m[r.libDevise] = {
        bid: r.achatClientele / r.uniteDevise,
        ask: r.venteClientele / r.uniteDevise,
      };
    }
  }
  return m;
}

/**
 * Get the working-day date strings for the last N days.
 */
export function getLastNWorkingDays(n: number): string[] {
  const days: string[] = [];
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  while (days.length < n) {
    d.setUTCDate(d.getUTCDate() - 1);
    const dow = d.getUTCDay();
    if (dow !== 0 && dow !== 6) days.unshift(d.toISOString().slice(0, 10));
  }
  return days;
}
