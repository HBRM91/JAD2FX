# JAD2FX — Rollout Checklist

Step-by-step guide to take the site from the current branch to production at `jad2fx.jad2advisory.com`.

**Branch:** `claude/fx-engine-rag-chatbot-im85ty`
**Target:** Cloudflare Pages project `jad2fx`, custom domain `jad2fx.jad2advisory.com`

---

## 0. Security — Do This First

- [ ] **Rotate the Cloudflare API token** that was shared in a previous chat session.
  Go to: https://dash.cloudflare.com/profile/api-tokens → find the token → Revoke → Create a new one with scope: `Cloudflare Pages:Edit` + `Workers Scripts:Edit` on the relevant account.
- [ ] Update `CLOUDFLARE_API_TOKEN` GitHub secret with the new token (see Step 2).

---

## 1. Cloudflare Pages — Initial Setup

If the Pages project `jad2fx` does not exist yet:

1. Go to Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. Select the `hbrm91/khouyafx` repository
3. Configure build settings:

   | Setting | Value |
   |---|---|
   | Framework preset | Next.js |
   | Build command | `npm run pages:build` |
   | Build output directory | `.vercel/output/static` |
   | Root directory | `/` (repo root) |
   | Node.js version | 20 |

4. Click **Save and Deploy** (first deploy will fail — environment variables are missing; that's expected)

---

## 2. GitHub Repository Secrets

Go to: `https://github.com/hbrm91/khouyafx` → Settings → Secrets and variables → Actions → **New repository secret**

| Secret name | Value |
|---|---|
| `CLOUDFLARE_API_TOKEN` | New token from Step 0 (scope: Pages:Edit + Workers:Edit) |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID (Dashboard → top-right menu → Account ID) |
| `BKAM_FX_KEY` | BKAM FX API subscription key |
| `BKAM_MONIA_KEY` | BKAM MONIA subscription key |
| `GROQ_API_KEY` | Groq API key (free at console.groq.com) |
| `GEMINI_API_KEY` | Google Gemini key (free at aistudio.google.com/apikey) |
| `TAVILY_KEY` | Tavily search key (free tier at tavily.com) |
| `ADMIN_PASSCODE` | Strong passcode for the admin dashboard |

These are used by the GitHub Actions workflow in `.github/workflows/deploy.yml`.

---

## 3. Cloudflare Pages — Environment Variables

Go to: Cloudflare Dashboard → Workers & Pages → `jad2fx` → Settings → **Environment Variables**

Set for **Production** (and optionally Preview):

| Variable | Value |
|---|---|
| `BKAM_FX_KEY` | BKAM FX API subscription key |
| `RESEND_API_KEY` | Resend API key (resend.com — free: 3k emails/month) |
| `RESEND_FROM_EMAIL` | `noreply@jad2fx.jad2advisory.com` (must be a verified Resend domain) |
| `RESEND_TO_EMAIL` | `contact@jad2advisory.com` |
| `GROQ_API_KEY` | Groq API key |
| `GEMINI_API_KEY` | Gemini API key |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | `212XXXXXXXXX` (your WhatsApp number) |

> These are read by the Next.js edge functions at runtime. They are **not** embedded in the client bundle.

---

## 4. Cloudflare Worker Secrets

The Worker in `cloudflare/` handles LLM proxying, BKAM API proxying, and the daily market report cron.

Navigate to: `cloudflare/` directory, then run:

```bash
cd cloudflare
wrangler secret put BKAM_FX_KEY
wrangler secret put BKAM_MONIA_KEY
wrangler secret put GROQ_API_KEY
wrangler secret put GEMINI_API_KEY
wrangler secret put TAVILY_KEY
wrangler secret put ADMIN_PASSCODE
# Optional: wrangler secret put TWELVE_DATA_KEY
```

Or set them via Cloudflare Dashboard → Workers → `jad2fx-yahoo-proxy` → Settings → Variables → **Secrets**.

---

## 5. Resend — Domain Verification

1. Log in to resend.com
2. Go to **Domains** → **Add Domain** → enter `jad2fx.jad2advisory.com`
3. Add the DNS records Resend provides to your DNS (Cloudflare DNS):
   - SPF: TXT record on `jad2fx.jad2advisory.com`
   - DKIM: CNAME records
   - DMARC: TXT record on `_dmarc.jad2fx.jad2advisory.com`
4. Click **Verify** in Resend after adding DNS records (propagation: 5–30 min)
5. Once verified, the `noreply@jad2fx.jad2advisory.com` from-address will work

---

## 6. Custom Domain — DNS Setup

In Cloudflare DNS (for `jad2advisory.com`):

1. Go to Cloudflare Dashboard → Workers & Pages → `jad2fx` → **Custom domains** → **Set up a custom domain**
2. Enter: `jad2fx.jad2advisory.com`
3. Cloudflare will automatically add a CNAME record pointing to your Pages project

Alternatively, add manually:
```
Type: CNAME
Name: jad2fx
Target: jad2fx.pages.dev
Proxy: ON (orange cloud)
TTL: Auto
```

SSL is automatic via Cloudflare (Universal SSL — no cert management needed).

---

## 7. BKAM API Access

1. Register at: https://api.centralbankofmorocco.ma (Bank Al-Maghrib developer portal)
2. Subscribe to the **CoursVirement** and **CoursBBE** API products
3. Copy your subscription key → use as `BKAM_FX_KEY` in Steps 2, 3, 4

Without this key, the site falls back to estimated/stale rates and displays a warning.

---

## 8. Merge and Deploy

```bash
# On the feature branch
git checkout claude/fx-engine-rag-chatbot-im85ty

# Merge to main (or create a PR first)
git checkout main
git merge claude/fx-engine-rag-chatbot-im85ty
git push origin main
```

GitHub Actions (`deploy.yml`) will automatically:
1. Run `npm run pages:build`
2. Deploy to Cloudflare Pages (`jad2fx` project, `main` branch)
3. Deploy the Cloudflare Worker (`cloudflare/`)

Monitor the deployment at: `https://github.com/hbrm91/khouyafx/actions`

---

## 9. Post-Deployment Verification

After deploy, verify each feature at `https://jad2fx.jad2advisory.com`:

- [ ] **Rate table loads** — 24 currencies with current MAD rates and % change
- [ ] **Sparklines render** — 7-day mini charts in the rate table
- [ ] **Currency converter works** — enter an amount, select a currency, result appears
- [ ] **Floating chat button appears** — bottom-right, gold border with pulse dot
- [ ] **Chat responds** — ask "Délai de rapatriement export?" — should get a French regulatory answer
- [ ] **PDF report form** — enter name + email → receive HTML risk report email
- [ ] **Contact form** — submit → receive email at `RESEND_TO_EMAIL`
- [ ] **SEO** — view source → check `<title>`, OG tags, JSON-LD
- [ ] **Mobile** — sticky first column in rate table, chat panel fits viewport
- [ ] **robots.txt** reachable at `/robots.txt`
- [ ] **sitemap.xml** reachable at `/sitemap.xml`

---

## 10. Optional: OG Image

The SEO metadata references `/og-image.png` (1200×630). This file does not yet exist in `public/`.

Create it: dark `#0A0F1E` background, JAD2FX logo/wordmark, tagline "Terminal de Change MAD · Bank Al-Maghrib · JAD2 Advisory". Export as PNG to `public/og-image.png` and `public/apple-touch-icon.png` (180×180).

---

## 11. Ongoing Maintenance

### Update the daily editorial comment
Edit `data/comment.json` and push to main. The site uses this JSON file via a static import (edge-safe — no `fs.readFile`).

### Update RAG knowledge base
Edit `lib/rag.ts` (add/update documents in the `DOCS` array) and push to main. The next deployment will pick up the new docs.

### Monitor rate table freshness
The BKAM API is polled server-side with a 15-minute stale-while-revalidate cache. If BKAM is down, the site shows stale data with a `fromCache` indicator in the rate table header.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Rate table shows stale/empty rates | `BKAM_FX_KEY` not set in CF Pages env vars | Add the key in Step 3 |
| Chat says "Service indisponible" | `GROQ_API_KEY` and `GEMINI_API_KEY` both missing | Add at least one in Step 3 |
| Contact/report emails not delivered | `RESEND_API_KEY` missing or domain not verified | Complete Step 5 |
| Build fails with peer dep error | `next` version below `14.3.0` | Currently on Next.js 15, should not occur |
| `pages:build` recursive loop | `build` script includes `@cloudflare/next-on-pages` | Keep `build: next build` and `pages:build: npx @cloudflare/next-on-pages` separate |
| Edge runtime error: `fs not found` | A server component uses `fs.readFile` | Replace with JSON import: `import data from '@/data/file.json'` |
