/**
 * P4.20 — Public changelog.
 * Lists versions with date, summary, and what changed.
 */

import { Tag, Calendar, CheckCircle2, Sparkles, Wrench, Shield, Zap } from 'lucide-react';

interface ChangelogEntry {
  version: string;
  date: string;
  type: 'major' | 'minor' | 'patch' | 'fix';
  title: string;
  changes: string[];
  tags: string[];
}

const ENTRIES: ChangelogEntry[] = [
  {
    version: '0.5.0',
    date: '2026-06-29',
    type: 'major',
    title: 'Bloomberg-grade terminal + funnel PME',
    changes: [
      'New: Diagnostic FX PME (5-question wizard → score 0-100 → contextual CTA)',
      'New: Calculateur Coût d\'Import (invoice + spot vs forward + shock table)',
      'New: Simulation Couverture Trimestrielle (4 quarters × 4 strategies)',
      'New: XCS basis module for real-world CIP pricing',
      'New: Calendar spreads + butterfly',
      'New: Money market, inflation, PPP module',
      'New: Fixing fan chart with 80%/95% CI',
      'New: Persistent Watchlist (localStorage, drag-reorder)',
      'New: Command palette (Cmd/Ctrl+K)',
      'New: Public glossary 60+ terms',
      'New: Blog/research CMS with 8 seeded articles',
      'New: Interactive BKAM basket explainer (sliders)',
      'New: Press kit page + developer API docs (OpenAPI)',
      'New: Public API v1 (free 100/day, pro 10k/day)',
      'New: Newsletter signup (Resend pipeline + offline queue)',
      'Fix: Forward markup on spread (not on mid) — P0.5',
      'Fix: JPY pip convention (*100 not *10000) — P0.6',
      'Fix: Replaced synthetic intraday sine wave with real Yahoo data — P0.8',
      'Fix: Non-circular drift fallback — P0.9',
      'Fix: Band util scoped to USD/MAD — P0.10',
      'Fix: ADMIN_PASSCODE removed from client bundle — P0.11',
      'Infra: Tailwind build-time (62KB purged CSS)',
      'Infra: Code-split all routes (50% bundle reduction)',
      'Infra: LRU caches for module-level Maps',
      'Infra: PWA service worker + manifest',
      'Tests: 89/89 passing (Vitest + RTL)',
    ],
    tags: ['funnel', 'FX', 'PWA', 'security'],
  },
  {
    version: '0.4.0',
    date: '2026-06-20',
    type: 'minor',
    title: 'Market Analysis + Reports v2',
    changes: [
      'New: AI-generated Morning Briefing (Groq Llama 3.3 + Gemini 2.5)',
      'New: BkamBandsVisualizer with drift model',
      'New: BkamParityMatrix for 30 currencies',
      'New: BkamFixing history (3-month basket parity backfill)',
      'New: LivePricer with cross-rates',
      'Improved: RAG chatbot with 10+ regulatory docs',
    ],
    tags: ['IA', 'visualization'],
  },
  {
    version: '0.3.0',
    date: '2026-06-10',
    type: 'minor',
    title: 'OC Compliance + Sector landing pages',
    changes: [
      'New: OC Compliance self-assessment tool (Circ. 01/2024)',
      'New: Sector landing pages (auto, textile, bois, agri)',
      'New: Admin dashboard with audit log + blotter',
      'Improved: Multi-language (FR/EN/AR with RTL support)',
    ],
    tags: ['OC', 'admin'],
  },
  {
    version: '0.2.0',
    date: '2026-05-25',
    type: 'minor',
    title: 'Forward calculator + Swap simulator',
    changes: [
      'New: Forward calculator (CIP-based, 12 standard tenors)',
      'New: Swap simulator with NEAR/FAR legs',
      'New: Forward extension & early settlement tool',
      'New: Bank quote comparison (5 Moroccan banks)',
    ],
    tags: ['forward', 'swap'],
  },
  {
    version: '0.1.0',
    date: '2026-05-15',
    type: 'major',
    title: 'Lancement JAD2FX',
    changes: [
      'New: Live FX rates for 14 BKAM currencies',
      'New: Billets de banque (banknotes) page',
      'New: Matières premières (commodities) page',
      'New: Rate ticker with 24h change',
      'New: Dark mode terminal UI',
    ],
    tags: ['launch'],
  },
];

const TYPE_META: Record<ChangelogEntry['type'], { label: string; color: string; icon: any }> = {
  major: { label: 'Major', color: 'bg-gold-500/20 text-gold-300', icon: Sparkles },
  minor: { label: 'Minor', color: 'bg-blue-500/20 text-blue-300',   icon: Zap },
  patch: { label: 'Patch', color: 'bg-emerald-500/20 text-emerald-300', icon: Wrench },
  fix:   { label: 'Fix',   color: 'bg-red-500/20 text-red-300',     icon: Shield },
};

export default function Changelog() {
  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center gap-2">
        <CheckCircle2 size={14} className="text-gold-500" />
        <h1 className="text-base font-bold text-white uppercase tracking-wider">Changelog JAD2FX</h1>
        <span className="text-[10px] text-slate-500 ml-auto">{ENTRIES.length} versions · 2026</span>
      </div>

      <div className="space-y-4">
        {ENTRIES.map((e) => {
          const Type = TYPE_META[e.type];
          return (
            <article key={e.version} className="bg-navy-900 border border-navy-700 rounded-2xl p-5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-gold-400 font-bold">v{e.version}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${Type.color}`}>
                    {Type.label}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                  <Calendar size={9} /> {e.date}
                </div>
              </div>
              <h2 className="text-base font-serif font-bold text-white mb-3">{e.title}</h2>
              <ul className="space-y-1.5 mb-3">
                {e.changes.map((c, i) => (
                  <li key={i} className="text-[12px] text-slate-300 leading-relaxed flex items-start gap-2">
                    <span className="text-gold-500 mt-1 flex-shrink-0 text-[10px]">▸</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-1">
                {e.tags.map((t) => (
                  <span key={t} className="text-[9px] text-slate-500 bg-navy-800 px-1.5 py-0.5 rounded">
                    <Tag size={8} className="inline mr-0.5" />{t}
                  </span>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
