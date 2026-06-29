/**
 * P3.10 — Behavioral lead scoring.
 * Tracks user behavior (pages visited, tools used, time on site)
 * and produces a 0-100 score. Used by the ContextualCTA engine to adapt
 * messaging. Persisted in localStorage per browser.
 */

const STORAGE_KEY = 'jad2fx_lead_score_v1';

export interface LeadEvent {
  type: 'view' | 'tool' | 'calc' | 'wizard' | 'download' | 'contact' | 'search' | 'cmd';
  detail: string;             // e.g. 'TOOL_PME_DIAG' or 'forward_calc'
  weight: number;             // 0-30
  timestamp: number;
}

export interface LeadState {
  score: number;
  level: 'COLD' | 'WARM' | 'HOT' | 'BURNING';
  signals: string[];
  lastUpdated: number;
}

const VIEW_WEIGHTS: Record<string, number> = {
  HOME: 1,
  DASHBOARD: 5,
  LIVE: 5,
  FIXING: 8,
  FORWARDS: 10,
  SWAPS: 10,
  BANDS: 8,
  PARITY_MATRIX: 6,
  REPORT: 8,
  RESEARCH: 4,
  REGULATIONS: 6,
  BILLETS: 4,
  COMMODITIES: 3,
  ABOUT_JAD2: 2,
  CONTACT: 4,
  TOOL_PME_DIAG: 15,
  TOOL_IMPORT_COST: 18,
  TOOL_QUARTERLY: 18,
  TOOL_OC_ASSESS: 12,
  TOOL_CORRIDOR: 10,
  TOOL_FWD_EXT: 14,
  TOOL_INVOICE: 14,
  BLOG: 3,
  GLOSSARY: 4,
  SECTOR_AUTO: 8,
  SECTOR_TEXTILE: 8,
  SECTOR_NORDIQUE: 8,
  SECTOR_AGRI: 8,
  AUDIT_LANDING: 25,
  SERVICES: 10,
  API_DOCS: 6,
  ADMIN: 0,
};

const TOOL_COMPLETION_WEIGHT = 20;

function getStored(): LeadState {
  const empty: LeadState = { score: 0, level: 'COLD', signals: [], lastUpdated: Date.now() };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as LeadState;
    return { ...empty, ...parsed };
  } catch { return empty; }
}

function setStored(s: LeadState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

export function trackEvent(type: LeadEvent['type'], detail: string, weight?: number) {
  const s = getStored();
  const w = weight ?? VIEW_WEIGHTS[detail] ?? 0;
  if (w === 0) return;
  const signal = `${type}:${detail}`;
  s.signals = [...s.signals, signal].slice(-20);
  s.score = Math.min(100, s.score + w);
  s.level = scoreToLevel(s.score);
  s.lastUpdated = Date.now();
  setStored(s);
  // Fire Plausible custom event
  if (typeof window !== 'undefined' && (window as any).plausible) {
    (window as any).plausible('lead_signal', { props: { type, detail, score: s.score } });
  }
  return s;
}

export function trackWizardComplete(wizard: string) {
  return trackEvent('wizard', wizard, TOOL_COMPLETION_WEIGHT);
}

export function trackCalculatorRun(calc: string) {
  return trackEvent('calc', calc, 15);
}

export function trackDownload(asset: string) {
  return trackEvent('download', asset, 20);
}

export function trackContact(source: string) {
  return trackEvent('contact', source, 30);
}

export function getLeadScore(): LeadState {
  return getStored();
}

export function resetLeadScore() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

function scoreToLevel(score: number): LeadState['level'] {
  if (score >= 75) return 'BURNING';
  if (score >= 50) return 'HOT';
  if (score >= 20) return 'WARM';
  return 'COLD';
}

export function getRecommendedCta(s: LeadState): 'NEWSLETTER' | 'TOOLS' | 'AUDIT' | 'CONTACT' {
  if (s.score < 15) return 'NEWSLETTER';
  if (s.score < 35) return 'TOOLS';
  if (s.score < 60) return 'AUDIT';
  return 'CONTACT';
}
