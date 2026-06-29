# JAD2FX — Master Build Plan

**Prepared by**: Master Consultant  
**Date**: 2026-06-29  
**Version**: 1.0  
**Target**: SME & Moroccan Corporate (primary)  
**Repository**: C:\GITHUB\KhouyaFX (React 19 + Vite + Cloudflare Workers)

---

## Status Legend

| Icon | Meaning |
|------|---------|
| 🔴 **Not Started** | Not yet begun |
| 🟡 **In Progress** | Active work |
| 🟢 **Done** | Completed and verified |
| ⚪ **Blocked** | Waiting on dependency |
| 🔵 **Deferred** | Moved to later phase |

## Effort Legend

| Class | Hours | Suitable for |
|-------|-------|-------------|
| **XS** | 1-2h | Simple edit, config change |
| **S** | 2-4h | Single component or service change |
| **M** | 4-8h | Multi-file feature, new component |
| **L** | 1-3d | New module, integration work |
| **XL** | 3-5d | Major new system, cross-cutting |

---

## Phase 0 — Critical Foundations

**Status**: 🔴 Not Started  
**Goal**: Ship a correct, lint-clean, test-backed, performant base before adding anything new.  
**Duration**: 1-2 weeks | **22 tasks** | **Priority: 🔴 CRITICAL**

| # | Task | Files | Effort | Deps | Owner | Status |
|---|---|---|---|---|---|---|
| P0.1 | Activate TS strict mode + fix errors | `tsconfig.json` | S | — | Dev | 🔴 |
| P0.2 | Add ESLint + Prettier config + fix lint | `.eslintrc.cjs`, `.prettierrc` | S | — | Dev | 🔴 |
| P0.3 | Install Vitest + RTL + jsdom + setup | `package.json`, `vitest.config.ts`, `tests/setup.ts` | XS | — | Dev | 🔴 |
| P0.4 | Top-level ErrorBoundary | `components/ErrorBoundary.tsx`, `App.tsx` | XS | — | Dev | 🔴 |
| P0.5 | **FIX F1**: dealer markup → spread, not mid (critical bug) | `services/forwardEngine.ts:96` | S | P0.3 | Dev FX | 🔴 |
| P0.6 | **FIX F8**: JPY pip convention (*100 not *10000) | `services/forwardEngine.ts:98` | XS | P0.3 | Dev FX | 🔴 |
| P0.7 | **FIX F9**: prevBizDay uses MA holiday calendar | `services/fxRates.ts:69` | S | P0.3 | Dev FX | 🔴 |
| P0.8 | **FIX F7**: replace synthetic intraday sine wave | `services/fxRates.ts:435`, `services/intraday.ts` | M | — | Dev FX | 🔴 |
| P0.9 | **FIX F5**: drift ECB fallback (not BKAM cross) | `services/driftModel.ts:181` | S | P0.3 | Dev FX | 🔴 |
| P0.10 | **FIX F4**: scope band util to USD/MAD only | `services/fxRates.ts:256,340` | S | — | Dev FX | 🔴 |
| P0.11 | **FIX A8**: remove ADMIN_PASSCODE from client bundle | `vite.config.ts`, `context/AdminContext.tsx`, worker | M | — | Dev + DevOps | 🔴 |
| P0.12 | **FIX A9**: align Plausible domain | `index.html:216` | XS | — | DevOps | 🔴 |
| P0.13 | Tailwind CDN → build-time | `tailwind.config.ts`, `package.json`, remove `index.html:62` | S | — | Dev | 🔴 |
| P0.14 | Code-split all routes (React.lazy) | `App.tsx` | M | — | Dev | 🔴 |
| P0.15 | LRU caches for all module-level Maps | `services/fxRates.ts:11,58,161` | S | — | Dev | 🔴 |
| P0.16 | Unit tests: forwardEngine (12 cases) | `tests/services/forwardEngine.test.ts` | S | P0.3 | Dev FX | 🔴 |
| P0.17 | Unit tests: fxRates core (10 cases) | `tests/services/fxRates.test.ts` | S | P0.3 | Dev FX | 🔴 |
| P0.18 | Unit tests: holidays (10 cases) | `tests/services/holidays.test.ts` | S | P0.3 | Dev FX | 🔴 |
| P0.19 | Unit tests: driftModel OLS (5 cases) | `tests/services/driftModel.test.ts` | S | P0.3 | Dev FX | 🔴 |
| P0.20 | Logo PNG 302KB → SVG < 5KB | `JAD2 Logo.png` → `public/jad2-logo.svg` | XS | — | Design | 🔴 |
| P0.21 | ErrorBoundary RTL test | `tests/components/ErrorBoundary.test.tsx` | XS | P0.3, P0.4 | Dev | 🔴 |
| P0.22 | PWA service worker (offline) | `vite-plugin-pwa` config, `public/manifest.json` | S | P0.13 | Dev | 🔴 |

**Exit Gate P0**: `tsc --noEmit` exits 0, `npm run lint` exits 0, 50+ tests green, bundle < 500KB initial, Lighthouse > 90 all categories.

---

## Phase 1 — FX Institutional Logic

**Status**: 🔴 Not Started  
**Goal**: A Bank Al-Maghrib treasurer opens the app and finds every data point they need.  
**Duration**: 3-4 weeks | **25 tasks** | **Priority: 🔴 CRITICAL (after P0)**

| # | Task | Files | Effort | Deps | Owner | Status |
|---|---|---|---|---|---|---|
| P1.1 | Live BDT yield curve from KV + cron | `services/interestRates.ts`, worker cron | M | P0.15 | Dev FX | 🔴 |
| P1.2 | Cross-currency basis (XCS) module EUR-MAD, USD-MAD | `services/xcsBasis.ts`, `forwardEngine.ts` | XL | P0.5, P1.1 | Dev FX | 🔴 |
| P1.3 | Implied vol surface (6 G10/MAD, 1W-1Y) | `services/volSurface.ts`, worker KV | XL | — | Dev FX | 🔴 |
| P1.4 | VolSurface UI (heatmap + smile + 25D RR chart) | `components/VolSurface.tsx` | M | P1.3 | Dev | 🔴 |
| P1.5 | Forward calendar spreads (1Mx2M, 1Mx3M, butterfly) | `services/forwardEngine.ts` | M | P0.5 | Dev FX | 🔴 |
| P1.6 | CalendarSpread UI tab | `components/ForwardCalculator.tsx` | M | P1.5 | Dev | 🔴 |
| P1.7 | Fixing fan chart (80/95% CI next-day fixing) | `components/FixingFanChart.tsx` | M | — | Dev | 🔴 |
| P1.8 | Real bank quotes scraper (5 banks → KV → UI) | worker route, `components/BankRates.tsx` | L | — | Dev + DevOps | 🔴 |
| P1.9 | Money market module (MONIA, BAM repo, reserves) | `components/MoneyMarket.tsx`, worker cron | M | — | Dev | 🔴 |
| P1.10 | Sovereign spread module (CDS 5Y, EMBI+, OAT) | `components/SovereignSpreads.tsx` | M | — | Dev | 🔴 |
| P1.11 | Inflation & PPP module | `components/PppFairValue.tsx` | M | — | Dev FX | 🔴 |
| P1.12 | Externalize RAG docs KV + daily scraper | `services/ragService.ts`, worker | L | — | Dev + DevOps | 🔴 |
| P1.13 | Holiday calendar 2028-2030 + hijri API | `services/holidays.ts` | S | P0.18 | Dev | 🔴 |
| P1.14 | Report generator KV cache (24h TTL) | `services/reportGenerator.ts` | S | — | Dev | 🔴 |
| P1.15 | Forward pricing integration tests | `tests/integration/forward.test.ts` | S | P0.3, P0.5 | Dev FX | 🔴 |
| P1.16 | SVG flag sprite (replace all emoji) | `components/FlagSprite.tsx`, all components | M | — | Dev | 🔴 |
| P1.17 | Yahoo Finance only through worker proxy | `services/yahooFinance.ts` | S | — | Dev | 🔴 |
| P1.18 | Rate-limit + CSRF on /api/contact | `cloudflare/yahoo-proxy.js` | S | — | DevOps | 🔴 |
| P1.19 | Fixing calendar component | `components/FixingCalendar.tsx` | S | — | Dev | 🔴 |
| P1.20 | Bid/ask invariant guard + UI ⚠ | `services/fxRates.ts:263` | XS | — | Dev | 🔴 |
| P1.21 | Data provenance chip (click rate → source) | `components/ProvenanceChip.tsx` | S | — | Dev | 🔴 |
| P1.22 | Unit tests: XCS, vol, calendars (15+ cases) | `tests/services/` | M | P1.2-P1.5 | Dev FX | 🔴 |
| P1.23 | Unit tests: money market + sovereign | `tests/services/` | S | P1.9-P1.10 | Dev | 🔴 |
| P1.24 | Sync _middleware.js with shared constants | `functions/_middleware.js`, `constants.ts` | S | — | DevOps | 🔴 |
| P1.25 | BKAM API fixture-based tests | `tests/services/bkamApi.test.ts` | S | P0.3 | Dev | 🔴 |

**Exit Gate P1**: 6 new modules live (VolSurface, XCS, MoneyMarket, Sovereign, PPP, FixingFan), 100+ tests green, every rate shows source + freshness.

---

## Phase 2 — Bloomberg-Grade UX

**Status**: 🔴 Not Started  
**Goal**: Feel like a professional financial terminal, not a marketing website.  
**Duration**: 4-5 weeks | **30 tasks** | **Priority: 🟡 HIGH (parallel with P3)**

| # | Task | Files | Effort | Deps | Owner | Status |
|---|---|---|---|---|---|---|
| P2.1 | App shell: left sidebar + top bar + main area | `App.tsx:205+` | L | P0.14 | Dev | 🔴 |
| P2.2 | Collapse nav 17→6 modules | `App.tsx:63-99` | S | P2.1 | Dev | 🔴 |
| P2.3 | Command palette (Cmd+K) | `components/CommandPalette.tsx` | M | — | Dev | 🔴 |
| P2.4 | Persistent Watchlist (localStorage + KV) | `components/Watchlist.tsx` | M | — | Dev | 🔴 |
| P2.5 | Price alerts (Notification API + email via worker) | `services/alerts.ts`, worker | L | — | Dev + DevOps | 🔴 |
| P2.6 | MultiPane grid (1/2/4 panes, drag-drop) | `components/MultiPane.tsx` | XL | — | Dev | 🔴 |
| P2.7 | Chart annotations (BKAM fix, ECB, user markers) | `components/ChartAnnotations.tsx` | M | P0.14 | Dev | 🔴 |
| P2.8 | Historical comparison slider (1D-5Y) | `components/TimeSlider.tsx` | M | — | Dev | 🔴 |
| P2.9 | G10-MAD correlation heatmap (14×14, 30D/90D) | `components/CorrelationHeatmap.tsx` | M | — | Dev | 🔴 |
| P2.10 | Inline glossary tooltips (80 FX terms) | `components/GlossaryTooltip.tsx`, `locales/glossary.ts` | M | — | Dev + Content | 🔴 |
| P2.11 | Dark/light mode toggle | `context/ThemeContext.tsx`, UI control | S | — | Dev | 🔴 |
| P2.12 | Keyboard shortcuts + cheatsheet | `hooks/useHotkeys.ts`, modal | M | P2.3 | Dev | 🔴 |
| P2.13 | 5-step onboarding flow | `components/Onboarding.tsx` | M | — | Dev + Design | 🔴 |
| P2.14 | Empty states (illustration + CTA) on all modules | All module components | M | — | Dev + Design | 🔴 |
| P2.15 | Mobile-first redesign (360px views) | New `MobileShell.tsx`, all components | XL | P2.1 | Dev | 🔴 |
| P2.16 | CSV/Excel/JSON export on all data modules | `utils/export.ts` | M | — | Dev | 🔴 |
| P2.17 | Shareable deep links (tool state in URL hash) | `utils/urlState.ts` | S | — | Dev | 🔴 |
| P2.18 | Home redesign — single hero (PME) | `App.tsx:469-755` | M | — | Dev + Design | 🔴 |
| P2.19 | Remove Fintech persona block | `App.tsx:507-536` | XS | P2.18 | Dev | 🔴 |
| P2.20 | Consolidate compliance → 1 dismissible + toggle | `App.tsx:417-438` | S | — | Dev | 🔴 |
| P2.21 | Typography + contrast pass (min 11px, AA) | All components | M | — | Dev + Design | 🔴 |
| P2.22 | Loading skeletons (shimmer) on all async | `components/Skeleton.tsx` | M | — | Dev | 🔴 |
| P2.23 | Global search (currencies + reports + regs + tools) | `components/GlobalSearch.tsx` | L | — | Dev | 🔴 |
| P2.24 | Print stylesheet for ALL modules | `index.html:147`, per-component print classes | M | — | Dev | 🔴 |
| P2.25 | Audit log UI (treasurer session log + PDF export) | `components/AuditLog.tsx` | M | — | Dev | 🔴 |
| P2.26 | Wire or remove orphan routes | `App.tsx:783-786,779` | S | — | Dev | 🔴 |
| P2.27 | Align mobile menu with 6-module structure | `App.tsx:343-413` | S | P2.2, P2.15 | Dev | 🔴 |
| P2.28 | RTL-native Arabic layouts (numbers, units, dir) | `locales/ar.ts`, all components | M | — | Dev | 🔴 |
| P2.29 | RTL component tests (3 modules) | `tests/components/` | S | P2.28, P0.3 | Dev | 🔴 |
| P2.30 | Accessibility audit (keyboard, ARIA, focus traps) | All components | L | — | Dev + QA | 🔴 |

**Exit Gate P2**: Watchlist + alerts + command palette + multi-pane live; Lighthouse a11y > 95; user test: SME treasurer creates watchlist + alert + prices forward < 90s.

---

## Phase 3 — SME & Moroccan Corporate Funnel

**Status**: 🔴 Not Started  
**Goal**: 5% monthly uniques → email captured; 1% → call booked.  
**Duration**: 3-4 weeks | **27 tasks** | **Priority: 🔴 CRITICAL (starts after P0)**

| # | Task | Files | Effort | Deps | Owner | Status |
|---|---|---|---|---|---|---|
| P3.1 | Lead Magnet #1: Guide OC 01/2024 PDF (25p) | `content/lead-magnets/guide-oc-2024.pdf` | L | — | Content + Design | 🔴 |
| P3.2 | PDF download + email gate | `components/PdfGate.tsx`, worker `/api/lead-magnet` | M | P3.1 | Dev | 🔴 |
| P3.3 | Lead Magnet #2: Forward Pricing Playbook PDF (15p) | `content/lead-magnets/forward-playbook.pdf` | M | — | Content + Design | 🔴 |
| P3.4 | Morning Briefing newsletter signup pipeline | `components/NewsletterSignup.tsx`, worker, Resend | M | — | Dev + Content | 🔴 |
| P3.5 | Contextual CTA engine (3 tools OR 90s → slide-in) | `services/ctaEngine.ts`, `hooks/useEngagement.ts` | S | — | Dev | 🔴 |
| P3.6 | In-tool CTA: Forward Calculator "15min expert" | `components/ForwardCalculator.tsx` | S | P3.7 | Dev | 🔴 |
| P3.7 | Calendly inline in ContactForm drawer | `components/ContactForm.tsx` | S | — | Dev | 🔴 |
| P3.8 | Social proof block (testimonials, logos, live counter) | `components/SocialProof.tsx`, `App.tsx` | M | — | Content + Dev | 🔴 |
| P3.9 | Sector case studies (auto/textile/bois/agri/phosphates) | `content/cases/*.mdx`, `components/CaseStudy.tsx` | L | — | Content | 🔴 |
| P3.10 | Behavioral lead scoring (tools used, pages visited → score) | `services/leadScore.ts`, KV | M | P3.5 | Dev | 🔴 |
| P3.11 | Exit-intent modal (mouseleave + scroll-up trigger) | `components/ExitIntent.tsx` | S | — | Dev | 🔴 |
| P3.12 | Plausible goal events on all funnel CTAs | All funnel components | XS | — | Dev | 🔴 |
| P3.13 | Reactivate LinkedIn Insight Tag (env Partner ID) | `index.html:212` | XS | — | DevOps | 🔴 |
| P3.14 | Rebuild À Propos page (bio, succès, presse, RC) | `components/AboutJad2.tsx` | M | — | Content + Dev | 🔴 |
| P3.15 | Services/Pricing page (4 offres with per-CTA) | `components/Services.tsx`, nav | M | — | Content + Dev | 🔴 |
| P3.16 | Sector landing pages SEO (4 sectors) | `components/SectorLanding.tsx` | M | P3.9 | Dev + Content | 🔴 |
| P3.17 | WhatsApp click-to-chat (env-driven, all pages) | `components/WhatsAppButton.tsx` | XS | — | Dev | 🔴 |
| P3.18 | "Audit Gratuit 30min" landing + Calendly | `components/AuditLanding.tsx` | M | P3.7 | Dev + Content | 🔴 |
| P3.19 | Lead routing → Resend → KV → CONTACT_EMAIL | worker route `/api/lead`, KV `LEADS_KV` | M | — | DevOps | 🔴 |
| P3.20 | Lead dashboard (admin) | `components/admin/LeadsAdmin.tsx` | M | P3.10, P3.19 | Dev | 🔴 |
| P3.21 | A/B testing infra (KV-flagged variants) | `services/abTest.ts`, KV | S | — | Dev | 🔴 |
| P3.22 | Remove external Advisory link from top nav | `App.tsx:308-316` | XS | — | Dev | 🔴 |
| P3.23 | "Diagnostic FX PME" wizard (5 questions → score) | `components/PmeDiagnostic.tsx` | M | — | Dev + Content FX | 🔴 |
| P3.24 | "Calculateur Coût d'Import" (invoice → MAD at spot vs fwd) | `components/tools/ImportCostCalc.tsx` | M | — | Dev FX | 🔴 |
| P3.25 | "Simulation Couverture Trimestrielle" (4Q × notional) | `components/tools/QuarterlyHedge.tsx` | M | P0.5 | Dev FX | 🔴 |
| P3.26 | RTL Arabic funnel pages | All P3.x components | M | P2.28 | Dev | 🔴 |
| P3.27 | Funnel analytics dashboard (admin) | `components/admin/FunnelAdmin.tsx` | M | P3.12, P3.20 | Dev | 🔴 |

**Exit Gate P3**: 5% unique→email capture, 1%→call booked, 50+ leads/month, LinkedIn retargeting active, funnel dashboard live.

---

## Phase 4 — Content Authority & Scale

**Status**: 🔴 Not Started  
**Goal**: SEO top-3 on "taux de change MAD", "forward dirham", "OC 01/2024 conformité".  
**Duration**: Ongoing | **20 tasks** | **Priority: 🟡 MEDIUM (after P0-P3)**

| # | Task | Files | Effort | Deps | Owner | Status |
|---|---|---|---|---|---|---|
| P4.1 | Blog/Research CMS (MDX + static gen, 1/week) | `content/research/*.mdx`, `components/Blog.tsx` | L | P0.14 | Dev + Content | 🔴 |
| P4.2 | Public glossary 200 terms (SEO, internal links) | `content/glossary/*.md`, `components/GlossaryPage.tsx` | L | P2.10 | Content + Dev | 🔴 |
| P4.3 | Interactive BKAM basket explainer (sliders) | `components/BasketExplainer.tsx` | M | — | Dev FX | 🔴 |
| P4.4 | Newsletter "L'Edito JAD2" weekly pipeline | worker cron + Resend template | S | P3.4 | Content + DevOps | 🔴 |
| P4.5 | Podcast "MAD Talk" RSS + embed player | `public/rss/mad-talk.xml`, `components/PodcastPlayer.tsx` | M | — | Content + Dev | 🔴 |
| P4.6 | Public API tier (free 100/day, paid 10k/day) | worker routes `/api/v1/*`, KV `API_KEYS_KV` | XL | P1.1-P1.11 | Dev + DevOps | 🔴 |
| P4.7 | API key management UI + Stripe (optional) | `components/admin/ApiKeysAdmin.tsx` | L | P4.6 | Dev | 🔴 |
| P4.8 | "MAD Quarterly Outlook" 40p PDF with lead gen | `content/quarterly/*.md` → PDF generator | L | — | Content + Dev | 🔴 |
| P4.9 | Schema.org structured data (all pages) | All pages | M | — | Dev SEO | 🔴 |
| P4.10 | Dynamic sitemap.xml | worker route `/sitemap.xml` | S | P4.9 | DevOps | 🔴 |
| P4.11 | RSS feed for Morning Briefing | worker route `/rss/briefing.xml` | S | — | DevOps | 🔴 |
| P4.12 | hreflang tags FR/EN/AR | `index.html`, all routes | S | — | Dev SEO | 🔴 |
| P4.13 | Internal linking automation (glossary→blog) | `utils/internalLinks.ts` | M | P4.2 | Dev | 🔴 |
| P4.14 | Backlink outreach tracker (admin CRM) | `components/admin/BacklinksAdmin.tsx` | S | — | Dev + Marketing | 🔴 |
| P4.15 | Press kit page (logos, bios, photos) | `components/PressKit.tsx` | S | — | Design + Marketing | 🔴 |
| P4.16 | Dynamic OG images per page | worker `/og-image?title=...` | M | — | Dev | 🔴 |
| P4.17 | "Cité par" press wall (logos + links) | `components/PressWall.tsx` | S | — | Marketing + Dev | 🔴 |
| P4.18 | Partnerships page (HCP, AMMC, ABI, univ) | `components/Partnerships.tsx` | S | — | Marketing + Dev | 🔴 |
| P4.19 | Developer API docs (OpenAPI + playground) | `components/ApiDocs.tsx` | M | P4.6 | Dev | 🔴 |
| P4.20 | Public changelog (FX logic updates) | `components/Changelog.tsx`, `content/changelog/*.md` | S | — | Dev + Content | 🔴 |

**Exit Gate P4**: Top-3 SEO on 5 target keywords, 30k uniques/month, 1+ paid API customer, cited by 2+ institutional sources.

---

## Dependencies Map

```
P0.1-P0.4 (config/setup)
  └──► P0.5-P0.12 (bug fixes) ──► P0.16-P0.19 (tests) ──► P0.22 (PWA)
         │                                                    │
         ▼                                                    ▼
       P1.1 (live BDT) ──► P1.2 (XCS) ──► P1.5 (spreads) ──► P1.6 (UI)
         │                    │
         ▼                    ▼
       P1.9-P1.11         P1.3 (vol) ──► P1.4 (VolSurface UI)
                              │
                              ▼
                            P1.15 (integration tests)

P0.14 (code-split) ──► P2.1 (shell) ──► P2.2-P2.30 (all UX)
P0.13 (Tailwind) ───► P2.22 (skeletons) ──► P2.15 (mobile)

P0.0 (any) ──────────► P3.5-P3.27 (funnel)
                              │
                              ▼
                            P4.1-P4.20 (content & scale)
```

---

## Staffing Recommendations

| Role | Phase 0 | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|------|---------|---------|---------|---------|---------|
| **Dev (React/TS)** | 1 FTE | 1 FTE | 1-2 FTE | 1 FTE | 0.5 FTE |
| **Dev FX (quant/math)** | 0.5 FTE | 1 FTE | — | 0.5 FTE | — |
| **DevOps (Cloudflare)** | 0.25 FTE | 0.25 FTE | — | 0.25 FTE | 0.25 FTE |
| **Design (UI/UX)** | — | — | 1 FTE | 0.5 FTE | 0.25 FTE |
| **Content (SEO/FR/AR)** | — | — | — | 1 FTE | 1 FTE |
| **QA (manual + a11y)** | 0.25 FTE | 0.25 FTE | 0.5 FTE | 0.25 FTE | 0.25 FTE |
| **Total** | 2 FTE | 3 FTE | 3-4 FTE | 3-4 FTE | 2-3 FTE |

---

## Key Milestones

| # | Date | Milestone | Phase |
|---|------|-----------|-------|
| M1 | Week 2 | Bundle < 500KB, 50+ tests, 0 lint errors | P0 |
| M2 | Week 6 | VolSurface + XCS + MoneyMarket live, 100+ tests | P1 |
| M3 | Week 10 | 2 PDF lead magnets live, first 100 emails captured | P3 |
| M4 | Week 12 | Terminal shell + watchlist + alerts + multi-pane | P2 |
| M5 | Week 14 | 50+ leads/month, funnel dashboard, LinkedIn retargeting | P3 |
| M6 | Month 5 | Top-3 SEO 3 keywords, 10k uniques/month | P4 |
| M7 | Month 6 | 30k uniques/month, 1 paid API customer, institutional citation | P4 |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| BKAM API changes/deprecation | High | Critical | Worker adapter layer + fallback to ECB/Frankfurter; 3 days buffer |
| Key developer leaves mid-phase | Medium | High | P0.1 (strict TS) + P0.3 (tests) as mandatory before any phase; no bus factor |
| Ramadan date discrepancy | Medium | Medium | Hijri API fallback (P1.13) before Phase 1 ship |
| Tailwind migration breaks styling | Low | High | Screenshot regression suite (backstopjs) before P0.13 |
| Plausible data undercounts | Low | Low | Self-host the script, don't rely on plausible.io CDN |
| SME treasurers reject English-only | Medium | Medium | P2.28 (RTL Arabic) scheduled before P3 funnel launches |
| Office des Changes changes Circ. 01/2024 | Low | Medium | P1.12 (daily scraper) catches changes within 24h |

---

## Quick Reference — Total by Phase

| Phase | Tasks | Effort (man-days) | Duration | Priority |
|-------|-------|-------------------|----------|----------|
| P0 | 22 | 18-22 days | 1-2 weeks | 🔴 Critical |
| P1 | 25 | 40-55 days | 3-4 weeks | 🔴 Critical |
| P2 | 30 | 45-65 days | 4-5 weeks | 🟡 High |
| P3 | 27 | 40-55 days | 3-4 weeks | 🔴 Critical |
| P4 | 20 | 30-45 days | ongoing | 🟡 Medium |
| **Total** | **124** | **173-242 days** | **~4-6 months** | — |
