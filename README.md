# JAD2FX — Terminal de Change MAD

Bloomberg Terminal-aesthetic FX data platform for the Moroccan dirham, built by **JAD2 Advisory** (Casablanca). Provides live Bank Al-Maghrib rates, a currency converter, institutional risk reports, and a regulatory RAG chatbot — all deployed on Cloudflare Pages.

**Live URL:** `https://jad2fx.jad2advisory.com`

---

## Architecture

```
Next.js 15 App Router (Edge runtime)
        │
        ├── Cloudflare Pages  ← frontend + API routes (edge functions)
        │       └── /api/chat, /api/rates, /api/contact, /api/generate-report
        │
        └── Cloudflare Worker (cloudflare/)
                └── /api/llm/chat   — Groq → Gemini LLM proxy
                └── cron @ 08:00 UTC weekdays — daily market report
                └── KV store        — report cache
```

API keys (BKAM, Groq, Gemini, Tavily) live **exclusively** as Cloudflare secrets. They never touch the client bundle.

---

## Design System

| Token | Value | Usage |
|---|---|---|
| `#0A0F1E` | Deep navy | Page background |
| `#111827` | Surface | Cards, chat bubbles |
| `#1E293B` | Elevated | Hover states |
| `#00C896` | Teal | Positive rates, accents |
| `#D4A017` | Gold | CTA, chat button, warnings |
| `#22C55E` | Green | Rate up flash |
| `#EF4444` | Red | Rate down flash |
| JetBrains Mono | Monospace | All rate numbers |

Tailwind custom tokens live in `tailwind.config.ts` under `colors.bg`, `colors.accent`, `colors.text`.

---

## Project Structure

```
/
├── app/                        ← Next.js App Router (active codebase)
│   ├── layout.tsx              ← Root layout, SEO metadata, JSON-LD, FloatingChat
│   ├── page.tsx                ← SSR homepage (revalidate 900s, edge runtime)
│   ├── sitemap.ts
│   ├── globals.css
│   ├── api/
│   │   ├── chat/route.ts       ← RAG chatbot edge function (Groq → Gemini)
│   │   ├── rates/route.ts      ← BKAM rate proxy (Cache-Control 15min)
│   │   ├── contact/route.ts    ← Contact form → Resend email
│   │   └── generate-report/route.ts  ← Risk report HTML email → Resend
│   ├── sections/
│   │   ├── Header.tsx
│   │   ├── RateTable.tsx       ← 24-currency table, sortable, sparklines, flash
│   │   ├── CurrencyConverter.tsx
│   │   ├── ValueProposition.tsx
│   │   ├── CommentStrip.tsx    ← Editorial FX comment (data/comment.json)
│   │   ├── PDFReportSection.tsx ← Lead funnel: email → risk report
│   │   ├── ContactForm.tsx
│   │   ├── FloatingChat.tsx    ← Floating chat button (client component)
│   │   ├── ChatInterface.tsx   ← RAG chat UI (client component)
│   │   └── Footer.tsx
│   └── components/
│       ├── PulseDot.tsx
│       ├── SkeletonTable.tsx
│       └── Sparkline.tsx       ← Recharts mini chart (dynamic, ssr:false)
│
├── lib/
│   ├── bam.ts                  ← BKAM API: 24 currencies + 7-day sparklines, 15min cache
│   ├── rag.ts                  ← 10 OC/BKAM regulatory docs, keyword retrieval
│   └── utils.ts                ← cn(), fmtRate(), fmtPercent(), fmtTime()
│
├── data/
│   └── comment.json            ← Daily editorial FX comment (JSON import, edge-safe)
│
├── public/
│   ├── robots.txt
│   └── manifest.json           ← PWA manifest
│
├── cloudflare/                 ← Cloudflare Worker (separate deployment)
│   ├── wrangler.toml           ← Worker config, KV binding, cron triggers
│   └── yahoo-proxy.js          ← LLM proxy + market report cron + BKAM proxy
│
├── .github/workflows/
│   └── deploy.yml              ← CI: next build → pages deploy + worker deploy
│
├── wrangler.toml               ← Cloudflare Pages config (root)
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json               ← target: ES2017, excludes old Vite dirs
└── package.json                ← build: next build | pages:build: npx @cloudflare/next-on-pages

── Legacy Vite SPA (excluded from Next.js build, not deleted yet) ──────────────
components/    services/    context/    hooks/    utils/    locales/
App.tsx        index.tsx    types.ts    constants.ts
```

---

## Data Sources

| Source | What | How |
|---|---|---|
| BKAM `api.centralbankofmorocco.ma` | 14 official MAD rates | Server-side, `Ocp-Apim-Subscription-Key` header |
| ECB Frankfurter API | Cross-rates for 10 additional currencies | Fallback + cross-rate calculation |
| Hardcoded Gulf pegs | SAR, AED, QAR, KWD, OMR, BHD, JOD | Static table in `lib/bam.ts` |
| `data/comment.json` | Editorial FX comment | JSON import (edge-safe, no `fs`) |

**24 currencies:** USD, EUR, GBP, CHF, JPY, CAD, NOK, SEK, DKK, CNY, AED, SAR, QAR, KWD, OMR, BHD, JOD, TND, DZD, LYD, ZAR, INR, BRL, TRY

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Copy env template
cp .env.example .env.local
# Fill in: BKAM_FX_KEY, RESEND_API_KEY, GROQ_API_KEY (minimum to run locally)

# 3. Start dev server
npm run dev
# → http://localhost:3000
```

The BKAM API will fall back to stale/estimated rates if `BKAM_FX_KEY` is missing. The RAG chat will error if neither `GROQ_API_KEY` nor `GEMINI_API_KEY` is set.

---

## Build & Deploy

### Build commands

```bash
# Local Next.js build only (for type-checking and development)
npm run build

# Full Cloudflare Pages build (runs next build + @cloudflare/next-on-pages transform)
npm run pages:build
# Output: .vercel/output/static/  (Cloudflare Pages format)
```

> The two scripts are intentionally separate. `@cloudflare/next-on-pages` internally calls
> `vercel build` which re-runs the `build` script — merging them causes infinite recursion.

### CI/CD (GitHub Actions)

Push to `main` or `master` triggers `.github/workflows/deploy.yml`:
1. `npm run pages:build` → builds Next.js app + Cloudflare transform
2. `wrangler pages deploy .vercel/output/static --project-name=jad2fx` → deploys to CF Pages
3. `wrangler deploy` (in `cloudflare/`) → deploys the Worker

Required GitHub secrets: see `ROLLOUT.md`.

---

## Environment Variables

### Cloudflare Pages (set in dashboard → Settings → Environment Variables)

| Variable | Required | Description |
|---|---|---|
| `BKAM_FX_KEY` | Yes | BKAM FX API subscription key |
| `RESEND_API_KEY` | Yes | Resend email API key |
| `RESEND_FROM_EMAIL` | Yes | Sender address (must be verified domain) |
| `RESEND_TO_EMAIL` | Yes | Recipient for contact/report notifications |
| `GROQ_API_KEY` | Yes* | Groq API key for RAG chatbot |
| `GEMINI_API_KEY` | Yes* | Gemini fallback for RAG chatbot |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | No | WhatsApp number for CTA (e.g. `212600000000`) |

*At least one of `GROQ_API_KEY` / `GEMINI_API_KEY` required for the chat to work.

### Cloudflare Worker secrets (set via `wrangler secret put <NAME>`)

| Secret | Description |
|---|---|
| `BKAM_FX_KEY` | BKAM FX API subscription key |
| `BKAM_MONIA_KEY` | BKAM MONIA rate key (BDT yield curve) |
| `GROQ_API_KEY` | Groq LLM key |
| `GEMINI_API_KEY` | Gemini LLM key (fallback) |
| `TAVILY_KEY` | Tavily search API (market reports) |
| `ADMIN_PASSCODE` | Admin dashboard password |

See `.env.example` for full documentation.

---

## RAG Chatbot

The floating chat widget on every page answers questions about Moroccan FX regulation.

**Architecture:**
1. User types question in `FloatingChat` / `ChatInterface`
2. POST to `/api/chat` (edge function, no browser API keys)
3. Edge function runs keyword-based retrieval against `lib/rag.ts` (10 embedded OC/BKAM docs)
4. Builds prompt: system instruction + regulatory context + user question
5. Calls Groq (`llama-3.3-70b-versatile`) → falls back to Gemini (`gemini-2.0-flash`)
6. Returns French response with regulatory citations

**Topics covered:** IGOC, import/export repatriation, travel allocations, FX hedging (Circ. 01/2024), IDE, IME, CDE/CPEC accounts, MRE transfers, bank commissions.

Rate limit: 20 requests/hour per IP.

---

## Legal & Compliance

- All rate data is **indicative only** — not official BKAM fixing, not executable prices
- The site carries full AMMC disclaimers in the footer
- JAD2 Advisory is a consulting firm, **not** a licensed FX intermediary
- No investment advice is given anywhere on the site
- Regulatory chatbot answers are informational only

---

## Key Technical Constraints

- **All API routes and `app/page.tsx` must have `export const runtime = 'edge'`** — required for Cloudflare Pages
- **No `fs`, `path`, or Node.js built-ins** in any file that runs at edge
- **No `@react-pdf/renderer`** — incompatible with edge runtime; reports use HTML email instead
- **JSON imports instead of `fs.readFile`** for static data files
- **Resend client must be instantiated inside the handler**, not at module level (no API key at build time)
- **`Map` iteration** uses `Array.from()` pattern to avoid downlevelIteration issues
