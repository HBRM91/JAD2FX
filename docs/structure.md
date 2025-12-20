# Project Structure

This architecture follows the Next.js 14 App Router standards, optimized for separation of concerns between the Marketing frontend, the Dashboard application, and the backend/ETL utilities.

```
/
├── app/
│   ├── (marketing)/      # Route Group for Landing Page (SEO optimized, lightweight)
│   │   ├── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/      # Route Group for App (Auth protected, heavy UI)
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── analysis/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── api/              # Next.js API Routes (Serverless)
│   │   ├── chat/         # Endpoint for Gemini RAG
│   │   └── cron/         # Fallback cron for scraper
│   ├── layout.tsx        # Root layout
│   └── globals.css
├── components/           # Reusable UI Components
│   ├── ui/               # Atoms (Buttons, Inputs - Shadcn/Tailwind)
│   ├── charts/           # Recharts components
│   ├── fx/               # FX specific components (Ticker, Converter)
│   └── shell/            # Navbars, Sidebars
├── lib/
│   ├── supabase/         # Supabase Client instantiation (Client & Server)
│   ├── gemini/           # Gemini AI Service & Prompt logic
│   └── utils.ts          # Helper functions (cn, formatCurrency)
├── types/                # TypeScript Interfaces (db types, api types)
├── scripts/              # External scripts
│   └── scraper.py        # Python ETL for GitHub Actions
└── database/
    └── schema.sql        # SQL Migrations
```