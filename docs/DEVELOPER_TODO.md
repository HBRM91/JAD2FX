# JAD2FX Developer TODO — Roll-out Plan

Generated 2026-06-29 by senior audit. This is the actionable punch-list. Tasks below are **not yet done** unless marked ✓ DONE.

Effort key: **XS** ≤ 30 min · **S** ≤ 2 h · **M** ≤ 1 day · **L** > 1 day.
Risk key: **Lo** (low — isolated change) · **Md** (medium — touches shared state) · **Hi** (high — auth, data layer, schema).

## P0 — broken / data-loss · must fix before next operator login

| # | Title | Where | Action | Effort | Risk | Status |
|---|---|---|---|---|---|---|
| P0-1 | Admin endpoints 401 on cookie login | `cloudflare/yahoo-proxy.js:104-117` | Make `adminGate` async; call `verifySessionCookie` as fallback to `isAdmin` Bearer check. `await` at 16 call sites. | S | Md | **✓ DONE** |
| P0-2 | MarketRadar bypasses admin corsProxyUrl | `components/MarketRadar.tsx:173,181` | Use `useAdmin()` + `config.corsProxyUrl`; fall back to `process.env.CORS_PROXY_URL` only if admin empty. | S | Lo | **✓ DONE** |
| P0-3 | Dead `audit-gratuit` hash CTAs | `ContextualCTA.tsx:84,113`, `ForwardCalculator.tsx:300` | Replace with `navTo('AUDIT_LANDING')` (thread `navTo` prop) / `pushState`+`popstate` where navTo unavailable. | S | Lo | **✓ DONE** |
| P0-4 | LEADS tab renders nothing | `components/AdminDashboard.tsx:1140,1209-1222` | Add `{activeTab === 'LEADS' && <LeadsDashboard />}` after `:1222`. | XS | Lo | **✓ DONE** |
| P0-5 | Contact drawer no Escape / scroll-lock | `App.tsx:1132-1158` | useEffect with `keydown` → `Escape`; lock `document.body.style.overflow` while open. | XS | Lo | **✓ DONE** |
| P0-6 | Audit log in-memory only (lost on refresh) | `context/AdminContext.tsx:146,236-249` | Persist to KV via new `POST /api/admin/audit` worker route (extend `adminGate` per P0-1). 30-day TTL ring. | M | Md | TODO |

## P1 — admin gaps

| # | Title | Where | Action | Effort | Risk | Status |
|---|---|---|---|---|---|---|
| P1-1 | Band % worker endpoint with no UI | `yahoo-proxy.js:1321-1341, :1118` | Add Band sub-panel under ALERTS tab in `AdminDashboard.tsx`. Calls `POST /api/admin/band` + `GET /api/band-config`. | S | Md | TODO |
| P1-2 | Basket weights + K not configurable | `yahoo-proxy.js:930,1158,1507,1822` | Add `basket: { wEUR, wUSD, K }` to `AdminConfig` (types.ts:188). Read in 4 worker sites. Expose in admin SystemTab. | M | Md | TODO |
| P1-3 | Multi-user / roles (single passcode only) | `yahoo-proxy.js:2094-2104` + `context/AdminContext.tsx:178` | `users:<email>` KV records; HMAC session w/ role claim; admin user-CRUD UI. | L | Hi | TODO |
| P1-4 | Admin alert thresholds don't reach user-side `PriceAlerts` | `components/PriceAlerts.tsx:130,138` | Read `config.alertThresholds` via `useAdmin()`; replace local state. | S | Md | TODO |
| P1-5 | `isLive` toggle is cosmetic (no service consumer) | `AdminConfig.isLive`, `AdminDashboard.tsx:130,152` | Either honor in `services/fxRates.ts` (offline/simulated mode) or remove the toggle. | S | Lo | TODO |
| P1-6a | Glossary content admin (ship first as template) | `components/Glossary.tsx` (inline) | Move to KV `glossary:<slug>`. Generic admin CRUD panel. Replicate for 6a. | M | Md | TODO |
| P1-6b | Research articles admin | `components/Blog.tsx`, `BlogArticleView.tsx:75` | Same pattern as P1-6a; KV `articles:<slug>`. | M | Md | TODO |
| P1-6c | Sector case studies admin | `components/SectorLanding.tsx` | KV `sectors:<id>`. | M | Md | TODO |
| P1-6d | Testimonials + Changelog + Press + Partnerships admin | hardcoded arrays / `components/Changelog.tsx` / `PressKit.tsx` / `Partnerships.tsx` | Same pattern. | M | Md | TODO |
| P1-6e | Podcast episodes admin (replace stub) | `components/Podcast.tsx` (stub) | Same pattern. | M | Md | TODO |
| P1-7 | Cron schedule management (doc only) | `wrangler.toml` | Document the limitation in the admin — Cloudflare cron is infra, not runtime-editable. | XS | Lo | TODO |

## P2 — UX / design polish

| # | Title | Where | Action | Effort | Risk | Status |
|---|---|---|---|---|---|---|
| P2-1 | Reach the orphan views | `App.tsx:709-727` (trust bar), `BottomNav.tsx:20` | Add `SECTOR_*` tiles on home trust bar; add `SOVEREIGN`+`MULTIPANE` to BottomNav; remove or wire `TESTIMONIALS`. | S | Lo | TODO |
| P2-2 | Apply B3.1 font tokens | `src/index.css:107-111` (tokens), 80+ components | Bulk-replace `text-[9px]/text-[10px]/text-[11px]` → `text-eyebrow`/`text-data` headers. Preserve genuinely per-instance sizes. | M | Lo | TODO |
| P2-3 | Retire `utils/deepLink.tsx` if unused | `utils/deepLink.tsx:36,87` | Verify `ShareLinkButton` is rendered. If not, delete the file. | XS | Lo | TODO |
| P2-4 | Strip 8 dead App.tsx lazy imports | `App.tsx:32,64,65,66,74,80,88` | Delete lazy lines for `MarketReportPage`, `NewsletterAdmin`, `ApiKeyManagement`, `BacklinkTracker`, `SectorCaseStudy`, `TimeWindowSelector`, `GlobalSearch`. Keep AdminDashboard eager imports. | XS | Lo | TODO |
| P2-5 | Remove or integrate dead orphans | `components/EmptyState.tsx:16`, `constants/bkamLinks.ts:6` | Either delete both, OR: import `BKAM_LINKS` in `BkamFixing.tsx:268,492`, `BilletsPage.tsx:222,388`, `RegulationsPage.tsx:108,121,134`; import `<EmptyState>` in `MarketReport.tsx:467`, `BlogArticleView.tsx:75`, `Podcast.tsx:120`, `AdminDashboard.tsx:701-706`. | S | Lo | TODO |
| P2-6 | Label AdminCockpit as DEMO or back by real blotter | `components/AdminCockpit.tsx:209-233,237,240,324` | Path A (S): prefix every KPI with "DEMO" badge + add comment. Path B (M): read from `blotter` (`AdminContext.tsx:142`). Also fix mislabel at `:324` (button labeled "Leads" but `navTo('ADMIN')`). | S or M | Lo | TODO |
| P2-7 | BottomNav menu overlay Escape close | `components/BottomNav.tsx:88-125` | Add `keydown` listener for `Escape` → `setMenuOpen(false)`. | XS | Lo | TODO |

## P3 — content / data wiring

| # | Title | Where | Action | Effort | Risk | Status |
|---|---|---|---|---|---|---|
| P3-1 | Replace placeholders in Podcast / Blog / MarketReport | `Podcast.tsx:3,74,80,120`, `BlogArticleView.tsx:75`, `MarketReport.tsx:467` | Either remove nav entries until content exists, or wire to KV-backed content (per P1-6). | S / L | Lo | TODO |
| P3-2 | SectorLanding real content for all 5 ids | `App.tsx:1009-1013`, `components/SectorLanding.tsx` | Verify `SectorLanding.tsx` has real content for `auto/textile/nordique/agri/phosphate`. The `SectorCaseStudy.tsx:21` comment says `SECTOR_PHOSPHATE not yet wired` — verify whether it applies to `SectorLanding`. Fill or remove. | S | Lo | TODO |
| P3-3 | Consolidate 4 currency lists | `constants.ts` (`BKAM_CURRENCIES`), `AdminCockpit.tsx:193` (`cockpitCurrencies`), `yahoo-proxy.js:1446-1453` (`RADAR_CURRENCIES`), `yahoo-proxy.js:791` (`KEY_PAIRS`) | Define single `TRADEABLE_FX` set; import where relevant; document which set serves which audience. | S | Lo | TODO |

## P4 — verification (post-deploy)

| # | Title | Where | Action | Effort | Risk | Status |
|---|---|---|---|---|---|---|
| P4-1 | Verify Yahoo symbols resolve | `MarketRadar.tsx:63-68`, `yahooFinance.ts` commodities | After P0-2 deploy, curl each symbol via worker. Yahoo frequently blocks `^STOXX` and `SCOA.L` — replace fallbacks. | S | Lo | TODO |
| P4-2 | Verify admin sub-panels after login | `LeadsDashboard`, `ReportsAdmin`, `NewsletterAdmin`, `ApiKeyManagement`, `BacklinkTracker` | After P0-1 deploy, exercise POST/GET paths with real login cookie. | S | Lo | TODO |
| P4-3 | Verify Resend send | `yahoo-proxy.js:640-650,830-854` | Confirm `RESEND_API_KEY` Worker secret set; send 1-recipient test. | XS | Lo | TODO |
| P4-4 | Verify corsProxyUrl change propagates to MarketRadar | `MarketRadar.tsx:182` | After P0-2 deploy, change value in SystemTab, reload, confirm radar picks up live data. | S | Lo | TODO |
| P4-5 | Verify og-image worker route | `yahoo-proxy.js:3340` | Curl one title; confirm PNG returns. | XS | Lo | TODO |

---

## Suggested roll-out order

1. **Today (next 1–2 hours)** — P0-6 (audit log persistence, M). Even though P0-1 is fixed, the audit log vanishing on every refresh is a real operator concern.
2. **Today** — P2-4 + P2-7 (small UX cleanups, ~30 min combined). Remove dead code, add Escape on BottomNav overlay.
3. **This week** — P1-1 (band % admin UI, S), P1-2 (basket config, M), P1-4 (PriceAlerts connect, S), P1-5 (isLive toggle, S). All "small" admin gaps.
4. **This week** — P2-2 (font token migration, M). This is the visible "polish" the audit's claims rest on.
5. **Next week** — P1-6a (Glossary content admin, M) as the **template**. Then P1-6b/c/d/e (replicate for each content type, M each). Start unblocking dead placeholders (P3-1).
6. **After P1-6a ships** — P2-1 (orphan views), P2-5 (wire `BKAM_LINKS` + `<EmptyState>`), P2-6 (Cockpit label/back).
7. **Sprint 3** — P1-3 (multi-user). Largest single lift; gate behind everything else.
8. **Throughout** — P4-1 through P4-5 (verification).

## Acceptance criteria per remaining TODO

Each TODO must satisfy before merge:

- `npx tsc --noEmit` → 0 errors
- `npx vitest run` → 114+/114+ pass
- `npx eslint .` → 0 new errors
- `npx vite build` → succeeds
- Live verification per P4-* where applicable
- Commit message format: `<scope>: <verb> <thing> (#<audit-id>)`
  e.g. `admin: persist audit log to KV (P0-6)`
