# JAD2FX Senior Audit — 2026-06-29

**Codebase audited**: Vite SPA (`App.tsx` ~1266 lines) + Cloudflare Worker (`cloudflare/yahoo-proxy.js` ~3482 lines) + Pages Functions shim.
**Commit under review**: `4f2e677` "feat: ship all 52 audit tasks (P0-P3)+…".

This document is the source of truth for: (1) what's structurally broken, (2) what the admin is missing, (3) what the previous "52 tasks shipped" claim actually delivered, and (4) the prioritized developer TODO list to roll out the next iteration.

---

## AREA 1 — Structural UI / Design Issues + Broken Things

### 1.1 Unreachable views (render exists, no nav path)

Cross-referenced `types.ts:284` ViewState union (56 members) against every `view === '…'` block in `App.tsx:622-1041`. Every union member has a render handler, **but 9 views have no entry in any nav surface** (only reachable via `?view=…` deep link):

| View | Render at | Reachability |
|---|---|---|
| `SOVEREIGN` | `App.tsx:1005` | Direct URL only |
| `MULTIPANE` | `App.tsx:1008` | Direct URL only |
| `TESTIMONIALS` | `App.tsx:1000` | Direct URL only |
| `SECTOR_AUTO` … `SECTOR_PHOSPHATE` (5) | `App.tsx:1009-1013` | Only via `SectorCaseStudy` (which is itself dead — see 1.2) |

The home "trust bar" (`App.tsx:709-727`) lists sectors as plain text — not clickable. The 5 sector views are operational orphans.

### 1.2 Dead lazy imports (App.tsx lines 22-90)

9 lazy imports are pure dead code-bloat in the route bundle:

| Lazy import | App.tsx line | Status |
|---|---|---|
| `MarketReportPage` | `:32` | Orphan — `view==='REPORT'` uses `MorningBriefing` (`:971`) |
| `NewsletterAdmin` | `:64` | Duplicate — already eager-imported + rendered in `AdminDashboard.tsx:15,1220` |
| `ApiKeyManagement` | `:65` | Same — rendered at `AdminDashboard.tsx:1221` |
| `BacklinkTracker` | `:66` | Same — rendered at `AdminDashboard.tsx:1222` |
| `LeadsDashboard` | `:67` | Eager-imported in `AdminDashboard.tsx:18` but tab was missing handler — **now fixed (P0-4)** |
| `SectorCaseStudy` | `:74` | Dead — never rendered in App.tsx (and `SectorCaseStudy.tsx:21` itself comments "SECTOR_PHOSPHATE not yet wired") |
| `TimeWindowSelector` | `:80` | Dead in App.tsx but `ForwardCalculator.tsx:25` imports + renders it directly |
| `GlobalSearch` | `:88` | Dead — `CommandPalette` (App.tsx:335) covers the search role |

### 1.3 Broken prop wiring

- **`MarketRadar` ignores its `tickerRates` prop** (`MarketRadar.tsx:160-162,173`). Home passes it (`App.tsx:913`); it's silently dropped. FX quotes come from a second independent Frankfurter fetch (`:75-118`), duplicating `App.tsx:261`.
- **`MarketRadar` used build-time `process.env.CORS_PROXY_URL`** (`:181`) — now fixed in P0-2: it reads `config.corsProxyUrl` from `useAdmin()`.

### 1.4 Dead CTAs (no listener reads the hash)

3 buttons mutate `window.location.hash` but `utils/deepLink.tsx:16-26` parses the hash as `key=value` pairs only; a bare `audit-gratuit` produces an empty key that no consumer reads:

- `ContextualCTA.tsx:84,113` → hash = `'audit-gratuit'` (now fixed in P0-3: replaced with `navTo`)
- `ForwardCalculator.tsx:300` → hash = `'audit-gratuit'` (now fixed in P0-3: replaced with pushState + popstate)

### 1.5 Visual / UX issues

- **Font size chaos** — codebase mixes `text-[8px]` through `text-[12px]` (and `text-[14px]` for headings). B3.1 tokens `text-eyebrow/data/h1/h2/h3` are defined at `src/index.css:107-111` but referenced by **zero** `.tsx` files. See P2-2.
- **Contact drawer missing Escape + body scroll-lock** — fixed in P0-5.
- **BottomNav menu overlay missing Escape** — see P2-7.
- **`Podcast`, `Blog` article body, `MarketReport` empty-state** — all hardcode "bientôt disponible" placeholder text (`Podcast.tsx:3,74,80,120`, `BlogArticleView.tsx:75`, `MarketReport.tsx:467`).
- **Currency list inconsistency** — 4 different cuts across the codebase: `BKAM_CURRENCIES` (constants), `cockpitCurrencies` (`AdminCockpit.tsx:193`), `RADAR_CURRENCIES` (`yahoo-proxy.js:1446-1453`), `KEY_PAIRS` (`yahoo-proxy.js:791`).

### 1.6 Inconsistent navigation patterns

- **`navTo` prop** — canonical. Used by `ServicesPage`, `SectorLanding`, `AdminCockpit`, `ResearchHub`, `BottomNav`, `NotFound`, `ContextualCTA` (after P0-3).
- **`window.location.hash` mutation** — dead, eliminated in P0-3.
- **`ShareLinkButton` (`utils/deepLink.tsx:87`)** — legitimate hash usage for tool-state sharing; verify it's actually rendered somewhere.

### 1.7 Hardcoded values that should be configurable

- **Basket weights & K** — hardcoded 4× in worker (`yahoo-proxy.js:930,1158,1507,1822`). **Not in `AdminConfig`**.
- **Band ±5% default** — `BAND_DEFAULT = 0.05` in worker (`:1118`). Worker endpoint `POST /api/admin/band` exists (`:1321-1341`) but **no admin UI** invokes it.
- **Vol surface params, bank quotes** — synthetic, deterministic, not editable.
- **`isLive` toggle** — `AdminConfig.isLive` is read by `AdminDashboard.tsx:152` but no consumer in `services/fxRates.ts` (cosmetic toggle).
- **Glossary / Blog / Sector / Testimonials / Changelog / Podcast / Press / Partnerships** — all inline static strings; not editable in admin.
- **Cron schedule** — `0 16 * * 1-5` in `wrangler.toml`; not runtime-editable (this is acceptable infra, not a bug — see P1-7).

### 1.8 Dead exports (zero importers)

| Symbol | Defined at | Importers |
|---|---|---|
| `BKAM_LINKS` | `constants/bkamLinks.ts:6` | **0** (B7.6 orphan) |
| `EmptyState` default | `components/EmptyState.tsx:16` | **0** (B3.7 orphan) |
| `GlobalSearch` default | `components/GlobalSearch.tsx:70` | **0** (App.tsx lazy never rendered) |
| `MarketReportPage` default | `components/MarketReport.tsx` (legacy) | **0** |
| `SectorCaseStudyPage` default | `components/SectorCaseStudy.tsx:168` | **0** |
| `.text-eyebrow/.text-data/.text-h1/h2/h3` | `src/index.css:107-111` | **0** `.tsx` usages |

---

## AREA 2 — Admin Dashboard Gap Analysis

### 2.1 AdminConfig field-by-field consumption

`AdminConfig` interface (`types.ts:188-200`) — every field, where consumed, and notes:

| Field | Type | Consumed by | Note |
|---|---|---|---|
| `refreshIntervalMs` | number | `App.tsx:288`, `AdminCockpit.tsx:448`, `AdminDashboard.tsx:124,136,166,173` | ✓ |
| `spotOverrides` | Record | `AdminDashboard.tsx:215,242` | ✓ |
| `curveOverrides` | Record | `AdminDashboard.tsx:306-325` | ✓ |
| `forwardMarkupBps` | number | `AdminDashboard.tsx:434,439` | ✓ |
| `virementSpreadPct` | number | `AdminDashboard.tsx:500,766` | ✓ |
| `billetSpreadPct` | number | `AdminDashboard.tsx:501,767` | ✓ |
| `dealerSpreadPips` | Record | `AdminDashboard.tsx:462,476,479`; `App.tsx:262` | ✓ |
| `isLive` | boolean | `AdminDashboard.tsx:130,152` | ⚠️ Cosmetic — no consumer in `services/fxRates.ts` (P1-5) |
| `alertThresholds` | array | `AdminDashboard.tsx:553-653` | ⚠️ Disconnected from user-side `PriceAlerts.tsx:130,138` (P1-4) |
| `tierCommissions` | Record | `AdminDashboard.tsx:760-901` | ✓ |
| `corsProxyUrl` | string | `AdminContext.tsx:61,119,183,212`; `App.tsx:262`; `AuditLanding.tsx:31`; `LeadsDashboard.tsx:56`; `AdminDashboard.tsx:193`; `MarketRadar.tsx:182` (after P0-2) | ✓ |

### 2.2 Admin coverage audit

| Requirement | Status | Location / Action |
|---|---|---|
| Manage API keys (LLM, Resend, Tavily, Calendly, Plausible) | PARTIAL | `ApiKeyManagement.tsx:21` for custom keys; Cloudflare secrets for `GROQ_API_KEY`, `BKAM_FX_KEY` etc. (read-only masks). Calendly/Plausible not configured. |
| Spreads/commissions per client tier | SHIPPED | `AdminDashboard.tsx:760-911` |
| Alert thresholds (drift, band, vol) | PARTIAL | `AdminDashboard.tsx:553-653` (pair min/max). **No drift/vol thresholds in UI**; band % is worker-only. (P1-1) |
| Cron schedules | MISSING (doc only) | Hardcoded `wrangler.toml` (P1-7) |
| Leads + funnel | **NOW SHIPPED (P0-4)** | `AdminDashboard.tsx:1223` (added); worker `/api/leads` (`:3384`), `/api/admin/funnel-stats` (`:3398`) |
| Newsletter subscribers + send | SHIPPED | `AdminDashboard.tsx:1220` |
| RAG corpus management | PARTIAL | `POST /api/admin/rag/seed` exists (`:3418`), auto-seeded. **No content-editing UI** (P1-6) |
| Users / roles | MISSING | Single shared `ADMIN_PASSCODE`. (P1-3 — large lift) |
| Audit log persistence | MISSING (P0-6) | In-memory only, lost on refresh (`AdminContext.tsx:146`). |
| Basket weights + K | MISSING from admin | Worker-only hardcode (P1-2) |
| Band % UI | MISSING from admin | Worker endpoint only (P1-1) |
| Proxy URL | SHIPPED | `AdminDashboard.tsx:186-201` |
| Refresh interval | SHIPPED | `AdminDashboard.tsx:159-183` |
| Glossary content | MISSING | Static (P1-6a — ship first) |
| Research articles | MISSING (admin-editable) | Static; `BlogArticleView.tsx:75` "bientôt disponible" (P1-6) |
| Sector case studies | MISSING | 5 sector views unreachable + `SectorLanding` static (P2-1, P1-6) |
| Testimonials | MISSING | Hardcoded in `AuditLanding.tsx:17` (P1-6) |
| Changelog | MISSING | Static `components/Changelog.tsx` (P1-6) |
| Podcast episodes | MISSING | Stub `components/Podcast.tsx` (P1-6) |
| Press kit | MISSING | Static `components/PressKit.tsx` (P1-6) |
| Partnerships | MISSING | Static `components/Partnerships.tsx` (P1-6) |
| Quarterly outlook PDF | MISSING | Static (P1-6) |

### 2.3 Authentication

The auth flow is well-designed: HMAC-signed `jad2_admin` HTTP-only cookie (8h TTL, `yahoo-proxy.js:2035-2057`), constant-time passcode comparison, rate-limited (60/min/IP). **But there was a critical bug**: `adminGate` (line 112) only checked `Authorization: Bearer`, never the session cookie — so every admin sub-panel returned 401 after a real login. **Fixed in P0-1**: `adminGate` now also honors `verifySessionCookie` as a fallback.

### 2.4 Cockpit vs Dashboard

**Complementary, not redundant**:
- `AdminDashboard` (`:1143`, "Admin Terminal"): operations console — 15 tabs, persisted `AdminConfig`, source of truth for spreads/tiers/proxies.
- `AdminCockpit` (`:179`, "Master flight cockpit"): situational-awareness — 4 hero KPIs, 8-currency rate strip, positions table, alerts feed. Consumes `livePrices/config/lastPriceUpdate` only.

**`AdminCockpit` is misleading**:
- Positions are **synthetic demo data** (`:210-233`, comment at `:209` says "real desk would query the position book").
- P&L MTD = `pnlDay × 18.5` (`:237`) — magic multiplier.
- VaR = `totalNotional × 0.012` (`:240`) — fixed 1.2% coefficient.
- Sparklines are sine waves off `mid` (`:203, :244-247`).
- The `navTo('ADMIN')` button at `:324` is labeled **"Leads"** — mislabel.

Action: either label every Cockpit tile "DEMO" or back it by the real blotter (`AdminContext.tsx:142` 50-entry ring). (P2-6)

---

## AREA 3 — Verify the "52 tasks shipped" claim

Skeptical, code-evidence-based verdicts. See git `4f2e677`.

### P0 (5/5 actually shipped)

- **B1.1** `AuditLanding` posts to `/api/leads` → SHIPPED (`AuditLanding.tsx:28-41`)
- **B1.2** ServicesPage CTAs wired → SHIPPED (`ServicesPage.tsx:108-111`)
- **B1.3** Deep links via `?view=` → SHIPPED (`App.tsx:230-239`)
- **B1.4** 9 dead ViewState members removed → SHIPPED (`types.ts:284` confirmed clean)
- **B3.5** Mobile bottom nav rendered → SHIPPED (`App.tsx:1126`)

### P1 (named subset verification)

- **B2.6** Mobile menu search → SHIPPED (`BottomNav.tsx:57-61,102-121`)
- **B3.1** Font size tokens → **PARTIALLY SHIPPED**. Tokens defined at `src/index.css:107-111`. **Zero `.tsx` consumers**. Created-but-unused.
- **B3.7** EmptyState shared component → **NOT SHIPPED (orphan)**. Created at `EmptyState.tsx:16`. **Zero importers**.
- **B7.6** BKAM links constants → **NOT SHIPPED (orphan)**. Created at `bkamLinks.ts:6`. **Zero importers**. The URLs that BKAM_LINKS was supposed to centralize **remain hardcoded** in 8+ components.

### P2 (spot-checks)

- **A1.1-A1.3** new tiles (^MASI, ^GSPC, ^STOXX, ^FTSE, BTC-USD, ETH-USD) → **PARTIALLY SHIPPED** for inclusion, broken for runtime fetch (now fixed in P0-2: was using build-time env, now reads `config.corsProxyUrl`).
- **A2.3** VaR Calculator → SHIPPED (`App.tsx:1004`, `BottomNav.tsx:34`)
- **A2.4** Blue Chips table → SHIPPED (`App.tsx:1003`, `BottomNav.tsx:33`)

### Verdict on the 52-task claim

The "ship all 52 audit tasks" claim is **overstated**. At minimum 3 tasks were filed-but-not-wired (B3.7, B7.6, plus B3.1 deferred migration). The pattern of B7.6 is especially telling: the constants file exists with the exact BKAM URLs that remain hardcoded elsewhere — a textbook "file added to satisfy a checklist, never integrated" anti-pattern.

---

## AREA 4 — Prioritized TODO List

### P0 — broken / data-loss (fix before any operator logs in)

- **P0-1 — Admin endpoints reject session-cookie clients** → **FIXED in commit `4f2e677` follow-up**. `cloudflare/yahoo-proxy.js:112-120` now honors `verifySessionCookie` as fallback to Bearer.
- **P0-2 — MarketRadar bypasses admin corsProxyUrl** → **FIXED**. `MarketRadar.tsx:173,181-182` now reads `config.corsProxyUrl`.
- **P0-3 — Dead `audit-gratuit` hash CTAs** → **FIXED**. `ContextualCTA.tsx:84,113` and `ForwardCalculator.tsx:300` replaced with `navTo` / pushState+popstate.
- **P0-4 — LEADS admin tab declares itself but renders nothing** → **FIXED**. `AdminDashboard.tsx:1223` added `{activeTab === 'LEADS' && <LeadsDashboard />}`.
- **P0-5 — Contact drawer missing Escape + body scroll-lock** → **FIXED**. `App.tsx:172-184` added useEffect for keydown Escape + body overflow.
- **P0-6 — Audit log is in-memory only** → TODO. `AdminContext.tsx:146,236-249` is a 200-entry React state buffer; lost on refresh. Add `POST /api/admin/audit` (extend `adminGate` per P0-1) and persist to KV with 30d TTL. **Effort: M. Deps: P0-1.**

### P1 — admin gaps

- **P1-1 — Band % worker endpoint with no admin UI** → TODO. `yahoo-proxy.js:1321-1341` (`POST /api/admin/band`) and `:1118` (`BAND_DEFAULT`). Add a Band sub-panel under ALERTS tab. **Effort: S. Deps: P0-1.**
- **P1-2 — Basket weights + K not configurable** → TODO. Hardcoded at `yahoo-proxy.js:930,1158,1507,1822`. Extend `AdminConfig` with `basket: { wEUR; wUSD; K }`; expose in admin; read in 4 worker sites. **Effort: M. Deps: none.**
- **P1-3 — Multi-user / roles** → TODO (largest lift). Single shared `ADMIN_PASSCODE`. Add `users:<email>` KV records, HMAC-signed session with role claim, admin user-CRUD. **Effort: L. Deps: P0-1.**
- **P1-4 — Alert thresholds not connected to user-side PriceAlerts** → TODO. `PriceAlerts.tsx:130,138` uses local state; admin-managed `alertThresholds` not pushed. Have `PriceAlerts` read `config.alertThresholds` via `useAdmin()`. **Effort: S. Deps: none.**
- **P1-5 — `isLive` toggle is cosmetic** → TODO. `AdminConfig.isLive` is read in UI but no consumer in `services/fxRates.ts`. Either honor in fetch path (offline/simulated mode) or remove the toggle. **Effort: S. Deps: none.**
- **P1-6 — Content admin for all static collections** → TODO (largest content lift). Glossary / Research / Sector / Testimonials / Changelog / Podcast / Press / Partnerships are all inline static strings. Move each to KV-backed documents (`documents:<collection>:<slug>`) with a generic admin CRUD panel. **Ship Glossary first as P1-6a (M effort, 1 collection).** Then replicate. **Effort: L total, M per collection.**
- **P1-7 — Cron schedule management** → NO-OP (doc only). Hardcoded in `wrangler.toml` is the right design (Cloudflare cron is infra, not runtime-editable). Document the limitation in the admin. **Effort: XS.**

### P2 — UX / design polish

- **P2-1 — Reach the orphan views** → TODO. Add `SECTOR_*` entry tiles on the home "trust bar" (`App.tsx:709-727`); add `SOVEREIGN` and `MULTIPANE` to `BottomNav.tsx:20` MORE_ITEMS; remove or wire `TESTIMONIALS`. **Effort: S.**
- **P2-2 — Apply B3.1 font tokens across components** → TODO. Tokens at `src/index.css:107-111` unused. Bulk-replace `text-[9px]`/`text-[10px]`/`text-[11px]` → `text-eyebrow`/`text-data` headers (preserve genuinely per-instance sizes). **Effort: M.**
- **P2-3 — Consolidate navigation patterns** → TODO. Verify `ShareLinkButton` is rendered somewhere; if not, retire `utils/deepLink.tsx`. **Effort: XS.**
- **P2-4 — Strip the 8 dead App.tsx lazy imports** → TODO. Lines `:32,64,65,66,74,80,88` (MarketReportPage, NewsletterAdmin, ApiKeyManagement, BacklinkTracker, SectorCaseStudy, TimeWindowSelector, GlobalSearch). Each is either dead-duplicate (already imported in AdminDashboard) or never rendered. Delete lazy lines; keep AdminDashboard eager imports. **Effort: XS.**
- **P2-5 — Remove or integrate dead orphans** → TODO. `EmptyState.tsx` and `constants/bkamLinks.ts`. Either delete both, OR replace hardcoded URLs in `BkamFixing.tsx:268,492`, `BilletsPage.tsx:222,388`, `RegulationsPage.tsx:108,121,134` with `BKAM_LINKS` imports; adopt `<EmptyState>` in `MarketReport.tsx:467` (orphan), `BlogArticleView.tsx:75`, `Podcast.tsx:120`, `AdminDashboard.tsx:701-706` (blotter zero-state). **Effort: S.**
- **P2-6 — Label AdminCockpit as demo or back by real blotter** → TODO. `AdminCockpit.tsx:209-233` synthetic positions, `:237` magic multiplier, `:240` fixed VaR coef. Either (a) prefix each KPI with a "DEMO" badge and add a comment block [S], or (b) read from `blotter` (`AdminContext.tsx:142` 50-entry ring) [M]. Also fix mislabel at `:324` (button labeled "Leads" but `navTo('ADMIN')`). **Effort: S (path a) / M (path b).**
- **P2-7 — BottomNav menu overlay Escape close** → TODO. `BottomNav.tsx:88-125` missing keydown listener. **Effort: XS.**

### P3 — content / data wiring

- **P3-1 — PodPage / Blog article / MarketReport placeholders** → TODO. Either remove nav entries until content exists, or wire to KV-backed content (per P1-6). **Effort: S (remove) / L (wire).**
- **P3-2 — SectorLanding content for all 5 ids** → TODO. `App.tsx:1009-1013` mounts all 5. Verify `SectorLanding.tsx` has real content for `auto/textile/nordique/agri/phosphate`; the `SectorCaseStudy.tsx:21` comment says `SECTOR_PHOSPHATE not yet wired` (may not be true of `SectorLanding` — verify). If `phosphate` returns empty state, fill or remove. **Effort: S.**
- **P3-3 — Consolidate currency lists** → TODO. 4 different cuts across the codebase (`BKAM_CURRENCIES`, `cockpitCurrencies`, `RADAR_CURRENCIES`, `KEY_PAIRS`). Define a single `TRADEABLE_FX` set in `constants.ts` and import where relevant; document which set serves which audience. **Effort: S.**

### P4 — verification needed (claimed-but-actually-works)

- **P4-1 — Verify Yahoo Finance symbols actually resolve** → TODO. After P0-2 deploy, curl each symbol via worker: `^MASI, ^GSPC, ^STOXX, ^FTSE, BTC-USD, ETH-USD, BZ=F, ZW=F, HG=F, GC=F, SI=F, SCOA.L, JKM=F, MOS`. Yahoo frequently blocks `^STOXX` and `SCOA.L` — replace fallbacks. **Effort: S. Deps: P0-2.**
- **P4-2 — Verify admin sub-panels load after login** → TODO. After P0-1 deploy, exercise `LeadsDashboard`, `ReportsAdmin`, `NewsletterAdmin`, `ApiKeyManagement`, `BacklinkTracker` POST/GET paths with a real login cookie. **Effort: S. Deps: P0-1.**
- **P4-3 — Verify Resend send works** → TODO. `yahoo-proxy.js:640-650,830-854` (welcome + daily). Confirm `RESEND_API_KEY` Worker secret set; send 1-recipient test. **Effort: XS.**
- **P4-4 — Verify corsProxyUrl change propagates to MarketRadar** → TODO. After P0-2 deploy, change value in SystemTab, reload, confirm radar INDEX/CRYPTO/ENERGY/METALS/AGRICULTURE tiles pick up live data. **Effort: S. Deps: P0-2.**
- **P4-5 — Verify og-image worker route** → TODO. Curl one title; confirm PNG returns. **Effort: XS.**

---

## Effort summary

- P0: 6 items — **5 FIXED in this push**, 1 remaining (P0-6 audit log persistence, M effort)
- P1: 7 items (3 S, 2 M, 1 L, 1 XS)
- P2: 7 items (4 XS, 2 S, 1 M)
- P3: 3 items (2 S, 1 L)
- P4: 5 items (4 S/XS)

**Single highest-leverage fix landed**: P0-1 (adminGate cookie-vs-bearer). Without it, every admin sub-panel returns 401 on real login — that is almost certainly why LEADS, Reports, Newsletter, ApiKeys, Backlinks tabs appeared "empty" to operators.

**Second highest-leverage**: P0-2 (MarketRadar corsProxyUrl). Without it, the 6 new financial tiles (MASI, S&P 500, STOXX 600, FTSE 100, BTC, ETH) silently fall back to placeholder values regardless of operator config.
