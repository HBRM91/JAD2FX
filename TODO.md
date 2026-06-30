# JAD2FX — Master Action Plan

Generated: 2026-06-30  
Context: Ponytail dead-code audit (shipped) + Professional UI/UX design audit + Next-level enhancements brainstorm.

---

## ✅ ALREADY SHIPPED (2026-06-30)

| What | Files |
|---|---|
| Deleted dead component `ChartAnnotations` (147 lines, zero callers) | `components/ChartAnnotations.tsx` |
| Deleted dead component `CalendarSpreadPanel` (171 lines, zero callers) | `components/CalendarSpreadPanel.tsx` |
| Deleted dead component `MacroPanel` (203 lines, zero callers) | `components/MacroPanel.tsx` |
| Deleted dead component `SectorCaseStudy` (170 lines, only self-referential) | `components/SectorCaseStudy.tsx` |
| Deleted dead component `Jad2Logo` (76 lines, `LogoJad2Fx` is the live one) | `components/Jad2Logo.tsx` |
| Deleted dead utility `abTest.ts` (92 lines, full A/B framework, zero callers) | `utils/abTest.ts` |
| Deleted one-off deploy scripts | `scripts/screenshot-deploy.mjs`, `scripts/screenshot-final.mjs` |
| Removed unused `@google/genai` prod dependency (all LLM calls go via Worker proxy) | `package.json` |
| Unexported `toCsv`, `toXlsx`, `toJson` — only `downloadData` is public API | `utils/export.ts` |
| Unexported `autoLinkTerms`, `findTermsInText` — only `injectGlossaryTerms` is called externally | `utils/autoLink.ts` |
| Removed duplicate `process.env.API_KEY` alias (same value as `GEMINI_API_KEY`) | `vite.config.ts` |

**Net: ~−860 lines, −1 prod dep**

---

## 🔴 P0 — CRITICAL (Fix This Week)

These are user-facing bugs or UX failures that actively harm conversion and trust.

---

### P0-1 · Fix hover-only megamenu → click-to-toggle

**File:** `App.tsx:378–418`

**Problem:** Desktop nav uses `onMouseEnter`/`onMouseLeave` to open/close dropdown groups. This fails:
- Users accidentally dismiss the menu when their cursor crosses the gap between button and panel
- Not keyboard-accessible (`Tab` key never opens it)
- Broken on touch devices that simulate hover unpredictably

**Fix:** Wire `onClick` instead of hover. The state is already there (`openGroup`/`setOpenGroup`). Remove `onMouseEnter`/`onMouseLeave` from the group button. Add `onBlur` on the dropdown panel container to close when focus leaves.

```tsx
// BEFORE
onMouseEnter={() => setOpenGroup(group.id)}
onMouseLeave={() => setOpenGroup(null)}

// AFTER
onClick={() => setOpenGroup(o => o === group.id ? null : group.id)}
// + close on outside click (already wired via navDropdownRef useEffect)
```

---

### P0-2 · Collapse 3 disclaimer banners into 1

**File:** `App.tsx:578–601`

**Problem:** On LIVE / FORWARDS / SWAPS / BANDS views, users see three consecutive full-width banners before reaching content:
1. Compliance banner (always visible) — `text-[11px] text-slate-500`
2. Rate notice — "Taux JAD2FX strictement indicatifs…"
3. Mobile simulator warning — "Mode Simulateur — Résultats Non-Exécutables…"

Three banners trained to be ignored. Also eats ~80px of vertical space on mobile.

**Fix:** Collapse into a single compact header badge pinned inside the navbar right side (or immediately below it as a 20px strip). One line, one color (gold/amber), always visible. Remove the 3-banner stack entirely. Example:

```tsx
// Single persistent badge in navbar right area:
<span className="hidden md:inline text-[10px] text-amber-500/70 font-medium">
  Données indicatives · Non-exécutables · Usage pédagogique
</span>
```

---

### P0-3 · Eliminate dual-hero — merge into one

**File:** `App.tsx:639–850`

**Problem:** Home page has two competing hero experiences back-to-back:
1. **PME & Corporate Maroc card** (line 641–673) — correct primary CTA, persona-driven
2. **Giant `JAD2FX` serif banner** (line 775–850) — the old hero, now a ghost

Two heroes = no visual hierarchy. Users don't know which CTA to follow. The serif banner also repeats the same CTAs (Live Pricer, Forward Calc, Dashboard) already present 300px earlier.

**Fix:** Delete the old serif banner section entirely (lines 775–850). Move the brand identity elements (JAD2FX name, tagline, stat badges) into the PME card header. The PME card becomes the single, unified hero. The tool tiles grid (lines 826–849) can be kept as a separate section below the hero.

---

### P0-4 · Fix SpreadsTab hardcoded fake data

**File:** `components/ForwardCalculator.tsx:52–58`

**Problem:** `SpreadsTab` initializes with hardcoded placeholder pip values:
```tsx
const [near, setNear] = useState([
  { tenor: '1M', rate: 8,  pipMultiplier: 100 },
  { tenor: '3M', rate: 22, pipMultiplier: 100 },
  ...
]);
```
Even after a real forward quote is computed, the Spreads tab still shows these fake numbers. This is a serious trust issue on a financial tool — users may think these are real market spreads.

**Fix:** Pass the computed `forwardCurve` (already built in the PRICER tab via `buildForwardCurve`) as a prop to `SpreadsTab`. Derive real forward points from the curve instead of hardcoded state.

---

### P0-5 · Floor font sizes — replace all sub-11px text

**Files:** Throughout — `components/LivePricer.tsx`, `components/ForwardCalculator.tsx`, `App.tsx`, etc.

**Problem:** `text-[9px]` and `text-[10px]` appear 60+ times. At these sizes on slate-500/600 colors against dark navy backgrounds, the contrast ratio fails WCAG AA (requires 4.5:1 for normal text). Also literally unreadable for users over 40 or on non-retina screens.

**Fix:** Global find-and-replace:
- `text-[9px]` → `text-[10px]` for purely decorative labels (timestamps, units)
- `text-[10px]` → `text-[11px]` for anything users need to read (categories, sub-labels, descriptions)
- Never use below `text-[11px]` going forward

Run: `grep -r "text-\[9px\]" components/ --include="*.tsx"` to find all instances.

---

### P0-6 · Add sticky `<thead>` on Live Pricer + FxDashboard tables

**Files:** `components/LivePricer.tsx`, `components/FxDashboard.tsx`

**Problem:** Rate tables with 14–24 rows have no sticky header. After scrolling 3+ rows, the user loses track of which column is Bid, Ask, Mid, Change, Spread.

**Fix:** Add to the `<thead>` element:
```tsx
<thead className="sticky top-0 z-10 bg-navy-900">
```
One line per table.

---

## 🟡 P1 — HIGH (Next Sprint)

---

### P1-1 · Lift rate fetching into context — eliminate 3× duplicate API calls

**Files:** `App.tsx:270–304`, `components/FxDashboard.tsx:46–56`, `hooks/usePriceStream.ts`

**Problem:** Three components independently fetch from the same API endpoint:
- `App.tsx` polls `fetchAllMadRates` on interval → sets `tickerRates` + `livePrices` in AdminContext
- `FxDashboard.tsx` polls `fetchAllMadRates` on its own 5-minute interval
- `LivePricer` uses `usePriceStream` which also fetches

On the LIVE view, this means 3 simultaneous in-flight requests to the same Cloudflare Worker. Doubles load, wastes bandwidth, can cause race conditions where different parts of the UI show different rate values.

**Fix:** `AdminContext` already stores `livePrices`. Extend it with a `rates: LiveRate[]` field fed by App.tsx's existing poll. `FxDashboard` and `LivePricer` read from context instead of fetching independently.

---

### P1-2 · Fix WhatsApp + FloatingChat mobile overlap

**Files:** `App.tsx:356–357`, `components/WhatsAppButton.tsx`, `components/FloatingChat.tsx`

**Problem:** Both components use `fixed bottom-4 right-4` (or similar). On 375px mobile they stack on top of each other, obscuring content and making both inaccessible.

**Fix option A (quick):** Give WhatsApp `bottom-20` and FloatingChat `bottom-4` so they stack vertically with a gap.

**Fix option B (better):** Merge into a single "Contact" FAB that expands to show two options (WhatsApp / AI Chat) on click. Reduces visual noise to one persistent element.

---

### P1-3 · Restore scroll position on browser back/forward

**File:** `App.tsx:224–233` (popstate handler)

**Problem:** `navTo()` correctly scrolls to top. But when the user presses browser Back, the `popstate` handler just calls `setView(v)` — it doesn't restore the scroll position they were at. Users navigating back to a long page (Home, Glossary, Blog) land at the top instead of where they were.

**Fix:** Before any `navTo()` call, save `window.scrollY` to `sessionStorage` keyed by current view. In the `popstate` handler, after `setView`, restore from sessionStorage:
```ts
const scrollKey = (v: string) => `jad2fx_scroll_${v}`;
// Before navTo:
sessionStorage.setItem(scrollKey(view), String(window.scrollY));
// In popstate apply():
const saved = sessionStorage.getItem(scrollKey(v));
if (saved) requestAnimationFrame(() => window.scrollTo(0, +saved));
```

---

### P1-4 · Fix Bid/Ask column labels for user-centric semantics

**File:** `components/LivePricer.tsx:47–54`

**Problem:** Red = Bid, Green = Ask follows Bloomberg dealer convention (market maker's perspective). JAD2FX users are importers/exporters who **buy** foreign currency at the Ask (the more expensive rate). Showing their cost in green and the rate they sell at in red is semantically backwards for their mental model.

**Fix options:**
- Rename columns: `Bid` → `Vente client` (what they receive when selling), `Ask` → `Achat client` (what they pay when buying)
- Or: use neutral slate color for both, with directional arrow icons for clarity
- Add a one-line tooltip on the column header explaining the direction

---

### P1-5 · Add error/empty state when rate fetch fails on Home

**File:** `App.tsx:676–712` (market snapshot section)

**Problem:** If `fetchAllMadRates` throws, `tickerRates` stays `[]` and the entire "Marché · Snapshot" section silently disappears with no explanation. Users don't know if rates will come back or if something is broken.

**Fix:** Track a `ratesError` boolean in App state. Show a compact error card in place of the snapshot:
```tsx
{ratesError && (
  <div className="bg-red-950/30 border border-red-800/50 rounded-xl p-4 text-sm text-red-300">
    Impossible de charger les taux en temps réel. <button onClick={refreshRates}>Réessayer</button>
  </div>
)}
```

---

## 🟢 P2 — NEXT LEVEL (Strategic Enhancements)

---

### P2-1 · Real path-based URL routing with React Router v6

**Current:** `?view=FORWARDS` — all 55 views share one URL. Google indexes one page.

**Impact:** Highest-ROI technical change available. Every tool and article gets its own indexable URL:
- `/live` → Live Pricer
- `/forwards` → Forward Calculator
- `/glossary` → Glossary
- `/blog/:slug` → Blog articles
- `/sector/auto` → Sector landing

**Implementation:**
1. `npm install react-router-dom`
2. Replace `useState<ViewState>('HOME')` with `useLocation` + `useNavigate`
3. Replace `view === 'FORWARDS'` render conditions with `<Route path="/forwards" element={<ForwardCalculator />} />`
4. Update `navTo()` to call `navigate('/forwards')` instead of `setView`
5. Add `<link rel="canonical">` per route

Estimated effort: 1 day. SEO return: weeks to months of compounding organic traffic.

---

### P2-2 · Persist calculator state in sessionStorage

**Files:** `components/ForwardCalculator.tsx`, `components/SwapSimulator.tsx`

**Problem:** Every navigation away from a calculator loses all inputs. Trésoriers run scenarios, navigate to check a rate, come back and have to re-enter everything.

**Fix:** Custom hook `useSessionState<T>(key, initialValue)` that mirrors `useState` but syncs to `sessionStorage`. Replace:
```tsx
const [currency, setCurrency] = useState('EUR');
// → 
const [currency, setCurrency] = useSessionState('fwd_currency', 'EUR');
```
10 lines of hook code, drop-in replacement for `useState` in calculators.

---

### P2-3 · Browser push alerts for price thresholds via Service Worker

**Files:** `components/PriceAlerts.tsx`, `vite.config.ts` (PWA already configured)

**Problem:** PriceAlerts shows in-app visual alerts only. If the tab is not active (user is in Excel, email, etc.) they miss the alert. This is the #1 missing feature for any FX monitoring tool.

**Implementation:**
1. On alert creation, call `Notification.requestPermission()`
2. In the rate polling loop in App.tsx, check thresholds and call `navigator.serviceWorker.ready.then(sw => sw.showNotification(...))`
3. The PWA Service Worker is already registered via `vite-plugin-pwa` — just add a `notificationclick` handler

---

### P2-4 · Morning Briefing → email delivery

**Files:** `components/MorningBriefing.tsx`, Cloudflare Worker

**Problem:** The AI-generated Morning Briefing is high-value daily content. Currently only readable in-app. Users who subscribe to the newsletter expect it delivered, not just available.

**Implementation:**
1. Add "Envoyer à ma boîte" button in MorningBriefing
2. POST current briefing markdown to `/api/briefing/deliver` on the Worker
3. Worker sends via Cloudflare Email Workers or Resend API to the subscriber list
4. Track delivery as a lead event in `leadScoring` (`trackEvent('download', 'MORNING_BRIEFING')`)

---

### P2-5 · Forward quote permalink (URL hash encoding)

**File:** `components/ForwardCalculator.tsx`

**Problem:** A trésorier calculates EUR/MAD 6M forward for 500K EUR and wants to share with their CFO. There's no way to share the specific calculation.

**Fix:** Add a "Copier le lien" button that encodes inputs into the URL hash:
```
/forwards#pair=EUR&tenor=6M&notional=500000&direction=buy
```
On mount, parse the hash and hydrate the form. Zero backend cost. Estimated effort: 2 hours.

---

### P2-6 · Keyboard J/K table navigation

**Files:** `components/LivePricer.tsx`, `hooks/useHotkeys.ts`

**Problem:** Command palette (Cmd+K) reveals power-user intent, but keyboard nav stops there. Bloomberg users expect `J`/`K` to move row focus in tables, `Enter` to expand, `F` to watchlist-add.

**Implementation:** Add to `useHotkeys` bindings in LivePricer:
```ts
useHotkeys([
  { key: 'j', handler: () => setFocusedRow(r => Math.min(r + 1, rows.length - 1)) },
  { key: 'k', handler: () => setFocusedRow(r => Math.max(r - 1, 0)) },
  { key: 'f', handler: () => addToWatchlist(rows[focusedRow].currency) },
])
```

---

### P2-7 · Comparison chart: two currencies overlaid in Live Pricer

**File:** `components/LivePricer.tsx`

**Problem:** Users constantly need to compare USD/MAD vs EUR/MAD trajectory. Currently impossible in one view.

**Fix:** Add a "Comparer avec…" currency selector that adds a second line to the intraday chart using a dashed stroke + secondary Y-axis. Recharts `ComposedChart` with dual `YAxis` handles this natively — it's already the charting library in use.

---

### P2-8 · Mobile swipe for tab navigation in calculators

**Files:** `components/ForwardCalculator.tsx`, `components/SwapSimulator.tsx`

**Problem:** PRICER / CURVE / MTM / SPREADS tabs in ForwardCalculator require precise taps on small tab buttons on mobile. Swipe-to-navigate between tabs is expected behavior on mobile apps.

**Fix:** `useDragToSwipe` hook using native `touchstart`/`touchend` events:
```ts
function useDragToSwipe(onLeft: () => void, onRight: () => void) {
  const startX = useRef(0);
  return {
    onTouchStart: (e: React.TouchEvent) => { startX.current = e.touches[0].clientX; },
    onTouchEnd: (e: React.TouchEvent) => {
      const delta = e.changedTouches[0].clientX - startX.current;
      if (delta < -50) onLeft();
      else if (delta > 50) onRight();
    },
  };
}
```
No library needed. Spread onto the tab panel container.

---

### P2-9 · Data freshness indicator per rate row

**Files:** `components/LivePricer.tsx`, `components/FxDashboard.tsx`

**Problem:** Each rate has a `lastUpdated` timestamp but it's hidden. Users on a live rate platform need to know at a glance whether data is fresh or stale. Critical during periods of low liquidity (Jumuah, holidays — already detected by `isJumuahReducedLiquidity`).

**Fix:** Colored dot in the first column, derived from `lastUpdated`:
```tsx
const age = Date.now() - new Date(entry.lastUpdated).getTime();
const dot = age < 5 * 60_000 ? 'bg-emerald-400'
  : age < 15 * 60_000 ? 'bg-amber-400' : 'bg-red-400';
<span className={`w-1.5 h-1.5 rounded-full ${dot} flex-shrink-0`} title={entry.lastUpdated} />
```

---

## Implementation Order Recommendation

```
Week 1:  P0-1, P0-2, P0-3 (nav, banners, hero merge — pure UX, highest visibility)
Week 1:  P0-4, P0-6 (SpreadsTab fix, sticky headers — data correctness)
Week 2:  P0-5 (font size sweep — WCAG compliance)
Week 2:  P1-1 (rate fetch consolidation — performance + correctness)
Week 2:  P1-2, P1-3, P1-4, P1-5 (UX polish sprint)
Week 3+: P2-1 (React Router — biggest strategic investment)
Week 4+: P2-2, P2-5 (session state, permalinks — quick wins post-routing)
Month 2: P2-3, P2-4 (push alerts, email delivery — growth features)
Month 2: P2-6, P2-7, P2-8, P2-9 (power-user features)
```

---

## Notes for Next Session

- All P0 fixes are self-contained, no new dependencies needed
- P2-1 (React Router) must come before P2-5 (permalinks) — hash routing needs real URL structure
- `useHotkeys` in `hooks/useHotkeys.ts` is the right home for all keyboard features (P2-6)
- `AdminContext` already has `livePrices: LivePriceEntry[]` — P1-1 just needs to expose `rates: LiveRate[]` alongside it
- Light mode (`src/light.css`) may be incomplete — verify before shipping ThemeToggle to users
- `playwright` devDep is still present (used by `scripts/verify-deploy.mjs`) — keep it, it's useful for smoke testing deploys
