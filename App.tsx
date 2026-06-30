import React, { useEffect, useState, useRef, useCallback, Suspense, lazy } from 'react';
import { ViewState, LiveRate, LivePriceEntry } from './types';
import { DEFAULT_BASKET_CONFIG, MARKET_NEWS, DISCLAIMER_TEXT, DISCLAIMER_SHORT, BKAM_CURRENCIES } from './constants';
import { fetchAllMadRates } from './services/fxRates';

// P0.14 â€” Code-split all route components for fast initial load.
// Only shell components (nav, ticker, modals, charts used on home) stay eager.
import RatesTicker        from './components/RatesTicker';
import FloatingChat       from './components/FloatingChat';
import LogoJad2Fx         from './components/LogoJad2Fx';
import MarketSessionsClock from './components/MarketSessionsClock';
import DisclaimerModal    from './components/DisclaimerModal';
import DriftAlertChip     from './components/DriftAlertChip';
import ContactForm        from './components/ContactForm';
import CommandPalette     from './components/CommandPalette';
import CheatSheet         from './components/CheatSheet';
import NotFound           from './components/NotFound';
import NewsletterSignup   from './components/NewsletterSignup';
import { SkipToContent } from './utils/a11y';
import Onboarding from './components/Onboarding';

const FxDashboard           = lazy(() => import('./components/FxDashboard'));
const MarketAnalysis        = lazy(() => import('./components/MarketAnalysis'));
const ForwardCalculator     = lazy(() => import('./components/ForwardCalculator'));
const SwapSimulator         = lazy(() => import('./components/SwapSimulator'));
const LivePricer            = lazy(() => import('./components/LivePricer'));
const AdminDashboard        = lazy(() => import('./components/AdminDashboard'));
const AdminCockpit          = lazy(() => import('./components/AdminCockpit'));
const BkamFixing            = lazy(() => import('./components/BkamFixing'));
const BilletsPage           = lazy(() => import('./components/BilletsPage'));
const CommoditiesPage       = lazy(() => import('./components/CommoditiesPage'));
const MorningBriefing       = lazy(() => import('./components/MorningBriefing'));
const RegulationsPage       = lazy(() => import('./components/RegulationsPage'));
const CurrencyHeatmap       = lazy(() => import('./components/CurrencyHeatmap'));
const BkamBandsVisualizer   = lazy(() => import('./components/BkamBandsVisualizer'));
const ResourcesPage         = lazy(() => import('./components/ResourcesPage'));
const ResearchHub           = lazy(() => import('./components/ResearchHub'));
const AboutJad2             = lazy(() => import('./components/AboutJad2'));
const OcComplianceAssessment = lazy(() => import('./components/tools/OcComplianceAssessment'));
const CorridorCalculator    = lazy(() => import('./components/tools/CorridorCalculator'));
const InvoiceImpactCalc     = lazy(() => import('./components/tools/InvoiceImpactCalc'));
const ForwardExtension      = lazy(() => import('./components/tools/ForwardExtension'));
const BkamParityMatrix      = lazy(() => import('./components/BkamParityMatrix'));
const SectorLanding         = lazy(() => import('./components/SectorLanding'));
const FxCrossMatrix         = lazy(() => import('./components/FxCrossMatrix'));
const MarketRadar           = lazy(() => import('./components/MarketRadar'));
// P3 â€” Funnel tools
const PmeDiagnostic         = lazy(() => import('./components/PmeDiagnostic'));
const ImportCostCalc        = lazy(() => import('./components/ImportCostCalc'));
const QuarterlyHedge        = lazy(() => import('./components/QuarterlyHedge'));
const Watchlist             = lazy(() => import('./components/Watchlist'));
// P4 â€” Content authority
const Glossary              = lazy(() => import('./components/Glossary'));
const Blog                  = lazy(() => import('./components/Blog'));
const BasketExplainer       = lazy(() => import('./components/BasketExplainer'));
const PressKit              = lazy(() => import('./components/PressKit'));
const ApiDocs               = lazy(() => import('./components/ApiDocs'));
const Changelog             = lazy(() => import('./components/Changelog'));
const Partnerships         = lazy(() => import('./components/Partnerships'));
const PressWall             = lazy(() => import('./components/PressWall'));
const Podcast               = lazy(() => import('./components/Podcast'));
const QuarterlyOutlook      = lazy(() => import('./components/QuarterlyOutlook'));
import ThemeToggle from './components/ThemeToggle';
import BottomNav from './components/BottomNav';
// P3 â€” Funnel + social proof
const ServicesPage          = lazy(() => import('./components/ServicesPage'));
const AuditLanding          = lazy(() => import('./components/AuditLanding'));
const AuditLog              = lazy(() => import('./components/AuditLog'));
const SocialProofModule     = lazy(() => import('./components/SocialProof'));
const WhatsAppButton        = lazy(() => import('./components/WhatsAppButton'));
const ExitIntentModal       = lazy(() => import('./components/ExitIntentModal'));
const ContextualCTA         = lazy(() => import('./components/ContextualCTA'));
const PriceAlerts           = lazy(() => import('./components/PriceAlerts'));
const VolSurfacePage        = lazy(() => import('./components/VolSurfacePage'));
const MoneyMarketPage       = lazy(() => import('./components/MoneyMarketPage'));
const BlueChipsTable        = lazy(() => import('./components/BlueChipsTable'));
const VaRCalculator         = lazy(() => import('./components/VaRCalculator'));
const SovereignPage         = lazy(() => import('./components/SovereignPage'));
const BankRatesPage         = lazy(() => import('./components/BankRatesPage'));
const CorrelationHeatmap    = lazy(() => import('./components/CorrelationHeatmap'));
const MultiPane             = lazy(() => import('./components/MultiPane'));
const LiveCounterLazy       = lazy(() => import('./components/SocialProof').then(m => ({ default: m.LiveCounter })));

import { AdminProvider, useAdmin } from './context/AdminContext';
import { I18nProvider, useI18n, Locale } from './context/I18nContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import {
  Building2, FileText, LayoutDashboard, Menu,
  Globe, ChevronRight, TrendingUp, ArrowLeftRight, Activity,
  Lock, X, BarChart2, Banknote, PackageOpen, Newspaper, Scale,
  ChevronDown, ExternalLink, Zap, MessageSquare, BookOpen, Shield,
  ClipboardCheck, Calculator, Calendar, Search, Sun, Moon, Loader2,
  ArrowRight,
} from 'lucide-react';

// â”€â”€â”€ Nav data is in navConfig.tsx so other components (CommandPalette) can reuse it.
import { NAV_GROUPS as _NAV_GROUPS, type NavGroup } from './navConfig';

const NAV_GROUPS: NavGroup[] = _NAV_GROUPS as unknown as { id: string; label: string; items: { label: string; view: ViewState; icon: React.ElementType; desc: string }[] }[];
void NAV_GROUPS; // referenced for completeness; command palette uses _NAV_GROUPS directly

// â”€â”€â”€ Expandable news card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function NewsCard({ news }: { news: typeof MARKET_NEWS[0] }) {
  const [expanded, setExpanded] = React.useState(false);
  return (
    <div
      className="px-5 py-4 hover:bg-navy-800/40 transition-colors cursor-pointer"
      onClick={() => setExpanded(e => !e)}
    >
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-wide text-gold-500 bg-gold-500/10 border border-gold-500/25 px-2.5 py-0.5 rounded-full">
          {news.category}
        </span>
        {news.date && (
          <time dateTime={news.date} className="text-[9px] text-slate-600 font-mono">
            {new Date(news.date).toLocaleDateString('fr-MA', { day: '2-digit', month: 'short', year: 'numeric' })}
          </time>
        )}
      </div>
      <h4 className="text-[14px] font-semibold text-slate-100 mb-1.5 leading-snug">{news.title}</h4>
      <p className={`text-[12px] text-slate-400 leading-relaxed transition-all ${expanded ? '' : 'line-clamp-3'}`}>
        {news.summary}
      </p>
      <button className="text-[10px] text-gold-500 hover:text-gold-300 mt-1.5 font-semibold transition-colors">
        {expanded ? 'â–² RÃ©duire' : 'â–¼ Lire la suite'}
      </button>
    </div>
  );
}

// â”€â”€â”€ Inner app â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// P0.14 â€” Skeleton shown while a route chunk is loading.
function RouteFallback({ name }: { name?: string } = {}) {
  return (
    <div className="space-y-4 animate-pulse">
      {name && (
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <Loader2 size={12} className="animate-spin text-gold-500" />
          <span>Chargement de {name}â€¦</span>
        </div>
      )}
      <div className="h-8 w-1/3 bg-navy-800 rounded" />
      <div className="h-64 bg-navy-900 border border-navy-800 rounded-2xl" />
      <div className="grid grid-cols-3 gap-3">
        <div className="h-24 bg-navy-900 border border-navy-800 rounded-xl" />
        <div className="h-24 bg-navy-900 border border-navy-800 rounded-xl" />
        <div className="h-24 bg-navy-900 border border-navy-800 rounded-xl" />
      </div>
    </div>
  );
}

function AppInner() {
  const { config, setLivePrices, isAdmin } = useAdmin();
  const [contactDrawerOpen, setContactDrawerOpen] = React.useState(false);
  useTheme(); // keeps ThemeProvider active (dark-only)
  const [view, setView]             = useState<ViewState>('HOME');
  const [tickerRates, setTickerRates] = useState<LiveRate[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);

  // P4.16 â€” Dynamic per-view OG image & title (sets document head for SEO/sharing)
  useEffect(() => {
    const titles: Partial<Record<ViewState, string>> = {
      HOME: 'JAD2FX â€” Conseil FX & StratÃ©gie Maroc',
      DASHBOARD: 'Tableau de Bord FX | JAD2FX',
      FORWARDS: 'Forward Calculator & CIP | JAD2FX',
      FIXING: 'Fixing Officiel BKAM | JAD2FX',
      VOL_SURFACE: 'Surface de VolatilitÃ© G10-MAD | JAD2FX',
      BANK_RATES: 'Comparatif 5 Banques Marocaines | JAD2FX',
      COCKPIT: 'Cockpit FX â€” Desk de Trading | JAD2FX',
      GLOSSARY: 'Glossaire FX & MarchÃ© Marocain | JAD2FX',
      BLOG: 'Recherche & Analyses FX | JAD2FX',
      REPORT: 'Morning Briefing FX | JAD2FX',
      SERVICES: 'Services & Tarification | JAD2FX',
      PRESS: 'Press Kit | JAD2FX',
      API_DOCS: 'API Documentation | JAD2FX',
      AUDIT_LANDING: 'Audit FX Gratuit 30min | JAD2FX',
      QUARTERLY_OUTLOOK: 'MAD Quarterly Outlook Q2 2026 | JAD2FX',
      AUDIT_LOG: 'Journal d\'Audit TrÃ©sorier | JAD2FX',
    };
    const subs: Partial<Record<ViewState, string>> = {
      HOME: 'Terminal pÃ©dagogique Â· Bank Al-Maghrib',
      DASHBOARD: 'Vue d\'ensemble 24 devises Â· P&L Â· VolatilitÃ©',
      FORWARDS: 'CIP Â· Cubic spline Â· Holiday-aware T+2',
      FIXING: 'Cours officiels Bank Al-Maghrib',
      VOL_SURFACE: 'Smile Â· 25D risk reversal Â· ATM forward',
      BANK_RATES: 'Attijariwafa Â· BP Â· BMCE Â· CIH Â· SG',
      COCKPIT: 'P&L live Â· VaR 95% Â· Positions Â· Alertes',
      GLOSSARY: '198 termes FX Â· MAD Â· OC',
      BLOG: 'Recherche institutionnelle sur le MAD',
      REPORT: 'Briefing quotidien Â· StratÃ©giste en chef',
      SERVICES: '4 offres Â· Conseil Â· Formation Â· Audit Â· Automatisation',
      PRESS: 'Logos Â· Bios Â· Assets',
      API_DOCS: 'REST API Â· OpenAPI 3.0 Â· ClÃ© gratuite',
      AUDIT_LANDING: 'ConformitÃ© Circ. OC 01/2024',
      QUARTERLY_OUTLOOK: 'Perspectives trimestrielles Â· Phosphate Â· Tourisme Â· MRE',
      AUDIT_LOG: 'TraÃ§abilitÃ© session Â· Export CSV',
    };
    const t = titles[view] ?? 'JAD2FX â€” Taux de Change MAD | Bank Al-Maghrib';
    const s = subs[view] ?? 'Terminal pÃ©dagogique Â· Bank Al-Maghrib';
    document.title = t;
    const setMeta = (prop: string, val: string) => {
      let el = document.querySelector(`meta[property="${prop}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement('meta'); el.setAttribute('property', prop); document.head.appendChild(el); }
      el.content = val;
    };
    setMeta('og:title', t);
    setMeta('og:description', s);
    setMeta('og:url', `https://fx.jad2advisory.com/?view=${view}`);
    setMeta('og:image', `https://jad2fx-yahoo-proxy.hamzaelbouhali.workers.dev/og-image?title=${encodeURIComponent(t)}&subtitle=${encodeURIComponent(s)}`);
  }, [view]);
  const [openGroup, setOpenGroup]   = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [cheatsheetOpen, setCheatsheetOpen] = useState(false);
  const { t, locale, setLocale, isRTL } = useI18n();
  const navDropdownRef = useRef<HTMLDivElement>(null);

  // B1.3 â€” Deep link from ?view=... on mount + popstate for back/forward.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const apply = () => {
      const v = new URLSearchParams(window.location.search).get('view');
      if (v && /^[A-Z_]+$/.test(v)) setView(v as ViewState);
    };
    apply();
    window.addEventListener('popstate', apply);
    return () => window.removeEventListener('popstate', apply);
  }, []);

  // P0-5 FIX: Escape closes the contact drawer + scroll-lock body when open
  useEffect(() => {
    if (typeof window === 'undefined' || !contactDrawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContactDrawerOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [contactDrawerOpen]);

  // P2.3 + P2.12 â€” Global keyboard shortcuts: Cmd+K (palette), ? (cheatsheet), h, etc.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return;
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
        return;
      }
      if (e.key === '?' || (e.key === 'h' && !e.metaKey && !e.ctrlKey)) {
        e.preventDefault();
        setCheatsheetOpen((o) => !o);
        return;
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const refreshRates = useCallback(() => {
    // P1-5: when isLive=false, skip the network call and clear the ticker
    if (!config.isLive) {
      setTickerRates([]);
      return;
    }
    fetchAllMadRates(DEFAULT_BASKET_CONFIG, config.corsProxyUrl, config.dealerSpreadPips)
      .then(({ rates }) => {
        setTickerRates(rates);
        const entries: LivePriceEntry[] = rates.map(r => {
          const changePercent = r.change24h ?? 0;
          const prevMid = changePercent !== 0 ? r.mid / (1 + changePercent / 100) : r.mid;
          return {
            currency: r.currency,
            pair: r.pair,
            bid: r.virementBuy,
            ask: r.virementSell,
            mid: r.mid,
            prevMid,
            change: +(r.mid - prevMid).toFixed(4),
            changePercent,
            spreadPips: Math.round((r.virementSell - r.virementBuy) * 10000),
            lastUpdated: r.timestamp,
          };
        });
        setLivePrices(entries);
      })
      .catch(() => {});
  }, [config.corsProxyUrl, setLivePrices]);

  useEffect(() => {
    refreshRates();
    const iv = setInterval(refreshRates, config.refreshIntervalMs);
    return () => clearInterval(iv);
  }, [refreshRates, config.refreshIntervalMs]);

  // Close dropdown on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (navDropdownRef.current && !navDropdownRef.current.contains(e.target as Node)) {
        setOpenGroup(null);
      }
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const navTo = (v: ViewState) => {
    setView(v);
    setMobileOpen(false);
    setOpenGroup(null);
    setPaletteOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('view', v);
      window.history.replaceState(null, '', url.toString());
    }
  };

  const activeGroupId = NAV_GROUPS.find(g => g.items.some(i => i.view === view))?.id ?? null;

  const LOCALE_OPTIONS: { code: Locale; label: string }[] = [
    { code: 'fr', label: 'FR' },
    { code: 'en', label: 'EN' },
    { code: 'ar', label: 'Ø¹Ø±Ø¨ÙŠ' },
  ];

  // â”€â”€ Page title chip â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const allItems = NAV_GROUPS.flatMap(g => g.items);
  const activeItem = allItems.find(i => i.view === view);

  return (
    <div
      className="min-h-screen flex flex-col font-sans bg-navy-950 text-slate-300"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <SkipToContent />
      <DisclaimerModal />
      <CommandPalette
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onNavigate={(v) => navTo(v as ViewState)}
      />
      <CheatSheet open={cheatsheetOpen} onClose={() => setCheatsheetOpen(false)} />
      <ExitIntentModal />
      <WhatsAppButton />
      <Onboarding />

      {/* â•â• Navbar â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <nav ref={navDropdownRef} className="bg-navy-900 sticky top-0 z-50 border-b border-navy-800">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">

            {/* Logo */}
            <button
              className="flex-shrink-0 focus:outline-none"
              onClick={() => navTo('HOME')}
              aria-label="JAD2FX â€” Accueil"
            >
              <LogoJad2Fx height={34} dark={true} showSub={false} />
            </button>

            {/* Desktop grouped nav */}
            <div className="hidden lg:flex items-center h-full gap-0">
              {NAV_GROUPS.map(group => (
                <div key={group.id} className="relative h-full flex items-center">
                  <button
                    onMouseEnter={() => setOpenGroup(group.id)}
                    onMouseLeave={() => setOpenGroup(null)}
                    className={`flex items-center gap-1.5 px-4 h-full text-[11px] font-semibold tracking-wide uppercase transition-colors ${
                      activeGroupId === group.id
                        ? 'text-gold-400 border-b-2 border-gold-500'
                        : 'text-navy-300 hover:text-white'
                    }`}
                  >
                    {group.label}
                    <ChevronDown size={10} className={`transition-transform duration-150 ${openGroup === group.id ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown panel */}
                  {openGroup === group.id && (
                    <div
                      className={`absolute top-full left-0 bg-navy-900 border border-navy-800 border-t-0 rounded-b-xl shadow-2xl py-1.5 z-50 ${
                        group.items.length > 4 ? 'grid grid-cols-2 gap-x-1 min-w-[460px]' : 'min-w-[230px]'
                      }`}
                      onMouseEnter={() => setOpenGroup(group.id)}
                      onMouseLeave={() => setOpenGroup(null)}
                    >
                      {group.items.map(item => (
                        <button
                          key={item.view}
                          onClick={() => navTo(item.view as ViewState)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors group ${
                            view === item.view
                              ? 'bg-gold-500/10 text-gold-400'
                              : 'text-slate-300 hover:bg-navy-800 hover:text-white'
                          }`}
                        >
                          <item.icon size={13} className={view === item.view ? 'text-gold-400' : 'text-navy-400 group-hover:text-slate-300'} />
                          <div>
                            <p className="text-[11px] font-semibold">{item.label}</p>
                            <p className="text-[9px] text-navy-400 group-hover:text-slate-500">{item.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Standalone items */}
              <button
                onClick={() => navTo('ABOUT_JAD2')}
                className={`flex items-center gap-1.5 px-4 h-full text-[11px] font-semibold tracking-wide uppercase transition-colors ${
                  view === 'ABOUT_JAD2' ? 'text-gold-400 border-b-2 border-gold-500' : 'text-navy-300 hover:text-white'
                }`}
              >
                Ã€ Propos
              </button>
              <button
                onClick={() => setContactDrawerOpen(true)}
                className="flex items-center gap-1.5 px-4 h-full text-[11px] font-semibold tracking-wide uppercase transition-colors text-navy-300 hover:text-white"
              >
                Contact
              </button>
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-2">
              {/* Language switcher */}
              <div className="hidden sm:flex items-center rounded border border-navy-700 overflow-hidden">
                {LOCALE_OPTIONS.map(opt => (
                  <button
                    key={opt.code}
                    onClick={() => setLocale(opt.code)}
                    className={`px-2.5 py-1 text-[10px] font-bold tracking-wider transition-colors ${
                      locale === opt.code
                        ? 'bg-gold-500 text-navy-950'
                        : 'text-navy-300 hover:text-white hover:bg-navy-800'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* P3.22 â€” external Advisory link removed from top nav (was bypassing funnel).
                  In-domain primary CTAs: Audit Gratuit + Morning Briefing. */}
              <div className="hidden md:flex items-center gap-2">
                <ThemeToggle />
                <button
                  onClick={() => setPaletteOpen(true)}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium border border-navy-700 rounded text-slate-400 hover:text-white hover:border-navy-600 transition-colors"
                  aria-label="Recherche globale (Cmd+K)"
                >
                  <Search size={11} />
                  <span>Rechercherâ€¦</span>
                  <kbd className="hidden lg:flex items-center gap-0.5 ml-1 px-1 py-0.5 text-[8px] font-mono text-slate-500 bg-navy-800 border border-navy-700 rounded">âŒ˜K</kbd>
                </button>
                <button
                  onClick={() => setContactDrawerOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-gold-500 text-navy-950 rounded hover:bg-gold-400 transition-colors shadow shadow-gold-900/30"
                >
                  <MessageSquare size={11} />
                  Audit Gratuit
                </button>
              </div>
              {isAdmin && (
                <button
                  onClick={() => navTo('ADMIN')}
                  className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium border rounded transition-colors ${
                    view === 'ADMIN'
                      ? 'text-gold-400 border-gold-700/50 bg-gold-500/5'
                      : 'text-navy-300 border-navy-700 hover:text-white hover:border-navy-600'
                  }`}
                >
                  <Lock size={9} />
                  Admin
                </button>
              )}

              {/* Mobile menu toggle */}
              <button
                className="lg:hidden text-slate-300 hover:text-white p-1.5"
                onClick={() => setMobileOpen(o => !o)}
              >
                {mobileOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-navy-800 bg-navy-900 max-h-[80vh] overflow-y-auto" style={{ backgroundColor: '#081628' }}>
            <button
              onClick={() => navTo('HOME')}
              className={`w-full flex items-center gap-3 px-5 py-3 text-sm font-semibold text-left border-b border-navy-800 ${
                view === 'HOME' ? 'text-gold-400 bg-navy-800' : 'text-slate-300 hover:text-white hover:bg-navy-800/50'
              }`}
            >
              <Globe size={14} /> Accueil
            </button>
            {NAV_GROUPS.map(group => (
              <div key={group.id}>
                <div className="px-5 pt-3 pb-1 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500">
                  {group.label}
                </div>
                {group.items.map(item => (
                  <button
                    key={item.view}
                    onClick={() => navTo(item.view as ViewState)}
                    className={`w-full flex items-center gap-3 px-5 py-2.5 text-[13px] font-medium text-left transition-colors ${
                      view === item.view ? 'text-gold-400 bg-navy-800' : 'text-slate-300 hover:text-white hover:bg-navy-800/50'
                    }`}
                  >
                    <item.icon size={14} />
                    {item.label}
                  </button>
                ))}
              </div>
            ))}
            <div className="px-5 pt-3 pb-1 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500">Autre</div>
            <button
              onClick={() => navTo('ABOUT')}
              className={`w-full flex items-center gap-3 px-5 py-2.5 text-[13px] font-medium text-left ${
                view === 'ABOUT' ? 'text-gold-400 bg-navy-800' : 'text-slate-300 hover:text-white hover:bg-navy-800/50'
              }`}
            >
              <Building2 size={14} /> Ã€ Propos
            </button>
            <button
              onClick={() => navTo('CONTACT')}
              className={`w-full flex items-center gap-3 px-5 py-2.5 text-[13px] font-medium text-left ${
                view === 'CONTACT' ? 'text-gold-400 bg-navy-800' : 'text-slate-300 hover:text-white hover:bg-navy-800/50'
              }`}
            >
              <MessageSquare size={14} /> Contact
            </button>
            {isAdmin && (
              <button
                onClick={() => navTo('ADMIN')}
                className={`w-full flex items-center gap-3 px-5 py-2.5 text-[13px] font-medium text-left border-t border-navy-800 ${
                  view === 'ADMIN' ? 'text-gold-400 bg-navy-800' : 'text-slate-400 hover:text-white hover:bg-navy-800/50'
                }`}
              >
                <Lock size={14} /> Admin
              </button>
            )}
            {/* Mobile language */}
            <div className="flex items-center gap-0 px-5 py-3 border-t border-navy-800">
              {LOCALE_OPTIONS.map(opt => (
                <button
                  key={opt.code}
                  onClick={() => setLocale(opt.code)}
                  className={`px-3 py-1.5 text-xs font-bold rounded transition-colors mr-1 ${
                    locale === opt.code ? 'bg-gold-500 text-navy-950' : 'text-navy-300 border border-navy-700 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* â•â• Compliance banner â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <div className="bg-navy-950 border-b border-navy-800 px-4 py-1">
        <p className="text-[11px] text-slate-500 tracking-wide text-center">{DISCLAIMER_SHORT}</p>
      </div>

      {/* â•â• Single sticky notice banner (rate disclaimer + simulator on mobile) â• */}
      {(() => {
        const isRateView = ['FORWARDS', 'SWAPS', 'ANALYSIS', 'BANDS', 'LIVE', 'DASHBOARD', 'FIXING', 'BILLETS'].includes(view);
        const isSimView = ['FORWARDS', 'SWAPS', 'ANALYSIS', 'BANDS', 'REPORT', 'RESEARCH'].includes(view);
        if (!isRateView && !isSimView) return null;
        return (
          <div className="sticky top-14 z-40 border-b border-gold-600/20 bg-gold-500/5 px-4 py-1 text-center">
            <p className="text-[9px] text-gold-600/80 font-medium">
              Taux JAD2FX strictement indicatifs â€” non utilisables pour des opÃ©rations de change
              (BKAM MÃ©thodologie 2024, Â§II) Â· Pour un cours ferme : votre banque domiciliataire agrÃ©Ã©e BAM
            </p>
            {isSimView && (
              <p className="lg:hidden text-[8px] font-bold text-amber-300 uppercase tracking-widest mt-0.5">
                Mode Simulateur â€” RÃ©sultats Non-ExÃ©cutables Â· Usage PÃ©dagogique Uniquement
              </p>
            )}
          </div>
        );
      })()}

      {/* â•â• Ticker â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <RatesTicker rates={tickerRates} />
      <div className="flex justify-end max-w-[1440px] mx-auto px-4 sm:px-6 -mt-1">
        <LiveCounterLazy />
      </div>

      {/* â•â• Page breadcrumb (non-home views) â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {view !== 'HOME' && activeItem && (
        <div className="bg-navy-950 border-b border-navy-900 px-4 sm:px-6">
          <div className="max-w-[1440px] mx-auto flex items-center gap-2 py-2">
            <button onClick={() => navTo('HOME')} className="text-xs text-slate-400 hover:text-gold-400 transition-colors">Accueil</button>
            <ChevronRight size={11} className="text-slate-600" />
            <activeItem.icon size={12} className="text-gold-500" />
            <span className="text-xs text-slate-200 font-medium">{activeItem.label}</span>
          </div>
        </div>
      )}
      {view === 'ADMIN' && (
        <div className="bg-navy-950 border-b border-navy-900 px-4 sm:px-6">
          <div className="max-w-[1440px] mx-auto flex items-center gap-2 py-2">
            <button onClick={() => navTo('HOME')} className="text-[10px] text-navy-500 hover:text-gold-500 transition-colors">Accueil</button>
            <ChevronRight size={10} className="text-navy-700" />
            <Lock size={11} className="text-gold-500" />
            <span className="text-[10px] text-slate-400 font-medium">Administration</span>
          </div>
        </div>
      )}

      {/* â•â• Main content â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <main id="main-content" role="main" className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 view-enter">
        <Suspense fallback={<RouteFallback />}>

        {/* â”€â”€â”€ HOME â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {view === 'HOME' && (
          <div className="space-y-6">

            {/* â”€â”€ Persona split hero (Task 2.1) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <div className="grid grid-cols-1 gap-4">
              {/* Corporate MAD persona */}
              <div className="bg-navy-900 border border-gold-700/30 rounded-2xl p-6 flex flex-col gap-4 hover:border-gold-600/50 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-gold-500 uppercase tracking-[0.2em] bg-gold-500/10 border border-gold-500/25 px-2 py-0.5 rounded">
                    PME &amp; Corporate Maroc
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-serif font-bold text-white leading-tight mb-2">
                    MaÃ®trisez votre exposition de change MAD
                  </h2>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Forward, swap, conformitÃ© OC 01/2024 â€” outils pÃ©dagogiques, Morning Briefing
                    quotidien et accompagnement stratÃ©gique pour les trÃ©soriers marocains.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 mt-auto">
                  <button
                    onClick={() => navTo('TOOL_PME_DIAG')}
                    className="flex items-center gap-2 bg-gold-500 text-navy-950 font-bold text-sm px-5 py-2.5 rounded-lg hover:bg-gold-400 transition-colors shadow-lg shadow-gold-900/30"
                  >
                    <Shield size={14} /> Diagnostiquer mon exposition
                  </button>
                  <button
                    onClick={() => navTo('FORWARDS')}
                    className="flex items-center gap-2 text-gold-300 border border-gold-500/40 font-semibold text-sm px-4 py-2.5 rounded-lg hover:border-gold-400 hover:bg-gold-500/5 transition-colors"
                  >
                    <TrendingUp size={14} /> Calculateur Forward
                  </button>
                </div>
              </div>

              {/* P2.19 â€” Removed: European Fintech persona per plan (single PME hero) */}
            </div>

            {/* â”€â”€ B4.4 â€” Dashboard summary: top 4 watched rates â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {tickerRates.length > 0 && (
              <div className="bg-navy-900 border border-navy-700 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2.5">
                  <h2 className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Activity size={11} className="text-gold-500" /> MarchÃ© Â· Snapshot
                  </h2>
                  <button
                    onClick={() => navTo('LIVE')}
                    className="text-[10px] font-bold text-gold-400 hover:text-gold-300 flex items-center gap-1"
                  >
                    Voir tout <ArrowRight size={10} />
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {tickerRates.slice(0, 4).map((r) => {
                    const chg = r.change24h ?? 0;
                    const isUp = chg > 0;
                    const isDn = chg < 0;
                    const chgColor = isUp ? 'text-emerald-400' : isDn ? 'text-red-400' : 'text-slate-500';
                    return (
                      <button
                        key={r.currency}
                        onClick={() => navTo('LIVE')}
                        className="bg-navy-950 border border-navy-800 hover:border-gold-500/50 rounded-lg p-2.5 text-left transition-colors"
                      >
                        <p className="text-[9px] text-slate-500 uppercase tracking-wider">{r.pair}</p>
                        <p className="text-sm font-bold text-white font-mono mt-0.5">{r.mid.toFixed(4)}</p>
                        <p className={`text-[9px] font-mono mt-0.5 ${chgColor}`}>
                          {isUp ? 'â–²' : isDn ? 'â–¼' : 'â€”'} {Math.abs(chg).toFixed(2)}%
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* â”€â”€ Drift alert chip (Task 2.3) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {config.corsProxyUrl && (
              <DriftAlertChip
                proxyUrl={config.corsProxyUrl}
                onNavigate={() => navTo('BANDS')}
              />
            )}

            {/* â”€â”€ Trust bar (Task 2.2) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <div className="bg-navy-900/60 border border-navy-800 rounded-xl px-5 py-3">
              <p className="text-[9px] text-slate-600 uppercase tracking-wider text-center mb-2.5 font-bold">
                Accompagne des entreprises dans leur gestion de change MAD
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
                {[
                  { sector: 'Ã‰quipementier automobile',  city: 'Tanger' },
                  { sector: 'Importateur bois & papier', city: 'Casablanca' },
                  { sector: 'Exportateur textile',        city: 'FÃ¨s-MeknÃ¨s' },
                  { sector: 'OpÃ©rateur phosphates',       city: 'Khouribga' },
                  { sector: 'Fintech europÃ©enne',         city: 'Corridor MENA' },
                ].map(c => (
                  <div key={c.city} className="flex items-center gap-1.5 text-[10px] text-slate-600">
                    <span className="w-1 h-1 rounded-full bg-gold-500/40 flex-shrink-0" />
                    <span>{c.sector} Â· <em className="not-italic text-slate-700">{c.city}</em></span>
                  </div>
                ))}
              </div>
            </div>

            {/* â”€â”€ P3 Funnel: Diagnostic FX PME (highest-intent tool) â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <div className="bg-gradient-to-br from-navy-900 to-navy-950 border border-gold-700/30 rounded-2xl p-5 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                <div className="lg:col-span-1 space-y-2">
                  <span className="inline-block text-[9px] font-bold text-gold-500 uppercase tracking-[0.2em] bg-gold-500/10 border border-gold-500/25 px-2 py-0.5 rounded">
                    Outil PME
                  </span>
                  <h2 className="text-xl font-serif font-bold text-white leading-tight">
                    Connaissez-vous vraiment votre exposition de change ?
                  </h2>
                  <p className="text-[12px] text-slate-400 leading-relaxed">
                    5 questions Â· 90 secondes Â· score 0-100 avec recommandations
                    personnalisÃ©es. Pour DAF, trÃ©soriers, gÃ©rants PME.
                  </p>
                  <button
                    onClick={() => navTo('TOOL_PME_DIAG')}
                    className="flex items-center gap-2 bg-gold-500 text-navy-950 font-bold text-[13px] px-4 py-2 rounded-lg hover:bg-gold-400 transition-colors shadow-lg shadow-gold-900/30"
                  >
                    <ClipboardCheck size={14} /> Lancer le diagnostic
                  </button>
                </div>
                <div className="lg:col-span-2">
                  <PmeDiagnostic />
                </div>
              </div>
            </div>

            {/* â”€â”€ Original hero banner (now secondary / data terminal showcase) */}
            <div className="relative rounded-2xl overflow-hidden border border-navy-700 min-h-[280px] sm:min-h-[340px]" style={{ background: 'linear-gradient(135deg, #040C1C 0%, #081628 50%, #0E2336 100%)' }}>
              {/* Subtle gold radial accent top-right */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_15%,rgba(212,175,55,0.12),transparent_55%)]" />
              {/* Grid lines for depth */}
              <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(#D4AF37 1px, transparent 1px), linear-gradient(90deg, #D4AF37 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

              {/* Content */}
              <div className="relative px-7 sm:px-12 py-10 sm:py-14 max-w-xl">
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-5">
                  {['Simulation PÃ©dagogique', 'DonnÃ©es BKAM Live', 'RÃ©glementation OC'].map(tag => (
                    <span key={tag} className="text-[11px] bg-gold-500/15 border border-gold-500/35 text-gold-400 px-3 py-0.5 rounded-full font-semibold uppercase tracking-wide">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Title */}
                <h1 className="text-5xl sm:text-6xl font-bold text-white tracking-[0.15em] uppercase mb-2 font-serif drop-shadow-xl">JAD2FX</h1>
                <p className="text-gold-400 text-[11px] uppercase tracking-[0.25em] mb-5 font-medium">
                  Outil de DonnÃ©es de Change Â· by JAD2 Advisory
                </p>

                {/* Subtitle */}
                <p className="text-slate-300 text-sm leading-relaxed mb-8">
                  DonnÃ©es indicatives sur {BKAM_CURRENCIES.length} devises MAD â€” 14 cotÃ©es BKAM + {BKAM_CURRENCIES.length - 14} dÃ©rivÃ©es. Simulateur pÃ©dagogique de forwards & swaps. RÃ©fÃ©rentiel rÃ©glementaire Office des Changes.
                </p>

                {/* CTA buttons */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => navTo('LIVE')}
                    className="flex items-center gap-2 bg-gold-500 text-navy-950 font-bold text-sm px-5 py-2.5 rounded-lg hover:bg-gold-400 transition-colors shadow-lg shadow-gold-900/40"
                  >
                    <Activity size={15} /> Live Pricer
                  </button>
                  <button
                    onClick={() => navTo('FORWARDS')}
                    className="flex items-center gap-2 text-gold-300 border border-gold-500/50 font-semibold text-sm px-5 py-2.5 rounded-lg hover:border-gold-400 hover:text-gold-200 hover:bg-gold-500/5 transition-colors"
                  >
                    <TrendingUp size={15} /> Forward Calc
                  </button>
                  <button
                    onClick={() => navTo('DASHBOARD')}
                    className="flex items-center gap-2 text-slate-200 border border-navy-600 font-medium text-sm px-5 py-2.5 rounded-lg hover:border-navy-500 hover:text-white hover:bg-navy-800/50 transition-colors"
                  >
                    <LayoutDashboard size={15} /> Tableau de Bord
                  </button>
                </div>
              </div>

              {/* Quick-access tool tiles â€” bottom strip inside hero */}
              <div className="relative px-7 sm:px-12 pb-7">
                <div className="border-t border-navy-700/50 pt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                  {[
                    { label: 'Diagnostic OC',    desc: 'ConformitÃ© 01/2024', view: 'TOOL_OC_ASSESS' as ViewState, icon: Shield,        color: 'text-amber-400',   border: 'border-amber-700/50',   bg: 'bg-amber-900/25' },
                    { label: 'FX Forwards',      desc: 'CIP terme',          view: 'FORWARDS'       as ViewState, icon: TrendingUp,    color: 'text-blue-400',    border: 'border-blue-700/50',    bg: 'bg-blue-900/30' },
                    { label: 'Bandes BKAM',      desc: 'Cage Â±5%',          view: 'BANDS'          as ViewState, icon: BarChart2,      color: 'text-gold-400',    border: 'border-gold-700/50',    bg: 'bg-yellow-900/20' },
                    { label: 'Morning Briefing', desc: 'Analyse Ã‰ditoriale', view: 'REPORT'         as ViewState, icon: Newspaper,      color: 'text-emerald-400', border: 'border-emerald-700/50', bg: 'bg-emerald-900/30' },
                    { label: 'Impact Facture',   desc: 'Ã‰rosion marge MAD',  view: 'TOOL_INVOICE'   as ViewState, icon: BarChart2,      color: 'text-purple-400',  border: 'border-purple-700/50',  bg: 'bg-purple-900/30' },
                  ].map(item => (
                    <button
                      key={item.view}
                      onClick={() => navTo(item.view)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border ${item.border} ${item.bg} hover:brightness-125 transition-all text-left backdrop-blur-sm`}
                    >
                      <item.icon size={16} className={`${item.color} flex-shrink-0`} />
                      <div>
                        <p className="text-[12px] font-semibold text-white leading-tight">{item.label}</p>
                        <p className="text-[10px] text-slate-400 leading-tight">{item.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* â”€â”€ Market sessions clock â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <MarketSessionsClock />

            {/* â”€â”€ 2-col: news + sidebar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

              {/* News feed */}
              <div className="lg:col-span-2 bg-navy-900 border border-navy-700 rounded-2xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-navy-700 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Globe size={14} className="text-gold-500" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-widest">Intelligence de MarchÃ©</h3>
                  </div>
                  <span className="text-[11px] text-slate-500 font-semibold px-2.5 py-0.5 border border-navy-600 rounded-full">Ã‰ditorial</span>
                </div>
                <div className="divide-y divide-navy-700/60">
                  {MARKET_NEWS.map(news => (
                    <NewsCard key={news.id} news={news} />
                  ))}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-4">

                {/* Advisory card */}
                <div className="bg-navy-900 border border-navy-700 rounded-2xl p-5 flex flex-col items-center text-center gap-4">
                  <LogoJad2Fx height={48} dark={true} showSub={true} />
                  <div>
                    <p className="text-xs font-bold text-white mb-1.5 uppercase tracking-wider">Cabinet de Conseil StratÃ©gique</p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Formation risque de change Â· Conseil stratÃ©gique Â· Accompagnement rÃ©glementaire OC
                    </p>
                  </div>
                  <a
                    href="https://jad2advisory.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-2.5 bg-gold-500 text-navy-950 text-sm font-bold rounded-lg hover:bg-gold-400 transition-colors"
                  >
                    jad2advisory.com â†’
                  </a>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Conseil stratÃ©gique Â· Formation Â· Accompagnement rÃ©glementaire OC
                  </p>
                </div>

                {/* AI assistant hint */}
                <div className="bg-navy-900 border border-navy-700 rounded-2xl p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gold-500/10 border border-gold-500/25 flex items-center justify-center flex-shrink-0">
                    <Zap size={16} className="text-gold-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white mb-1">Assistant IA RÃ©glementaire</p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Questions OC & BKAM via le bouton flottant â†˜
                    </p>
                  </div>
                </div>

                {/* Quick stat cards */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Devises CotÃ©es', value: '14', sub: 'par BKAM', color: 'text-gold-400' },
                    { label: 'Devises Totales', value: String(BKAM_CURRENCIES.length), sub: `+${BKAM_CURRENCIES.length - 14} dÃ©rivÃ©es`, color: 'text-blue-400' },
                    { label: 'Mise Ã  Jour', value: 'Live', sub: 'en continu', color: 'text-emerald-400' },
                    { label: 'AccÃ¨s', value: 'Gratuit', sub: 'pÃ©dagogique', color: 'text-purple-400' },
                  ].map(stat => (
                    <div key={stat.label} className="bg-navy-900 border border-navy-700 rounded-xl p-3.5 text-center flex flex-col items-center">
                      <p className={`text-xl font-bold font-mono tabular-nums ${stat.color}`}>{stat.value}</p>
                      <p className="text-[10px] text-slate-300 font-semibold mt-0.5 leading-tight text-center">{stat.label}</p>
                      <p className="text-[9px] text-slate-500 mt-0.5">{stat.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Market Radar â€” full width */}
            <MarketRadar tickerRates={tickerRates} />

            {/* P2.4 â€” Watchlist (persistent, drag-to-reorder) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <Watchlist rates={tickerRates} isRTL={isRTL} />
              <NewsletterSignup proxyUrl={config.corsProxyUrl} source="home_watchlist_card" variant="card" />
            </div>

            {/* P3.8 â€” Social proof: Stats + Testimonials + LogoWall */}
            <SocialProofModule />

            {/* P3.5 â€” Contextual CTA (engagement-based) */}
            <ContextualCTA variant="banner" pageKey="home" navTo={navTo} />

            {/* â”€â”€ Advisory CTA strip â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <div className="bg-navy-900 border border-navy-700 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-base font-bold text-white mb-1">Formation & Conseil en Gestion du Risque de Change</p>
                <p className="text-sm text-slate-400">
                  Auditez votre exposition FX Â· Optimisez votre stratÃ©gie de couverture Â· MaÃ®trisez la rÃ©glementation OC
                </p>
              </div>
              <div className="flex gap-3 flex-shrink-0">
                <button
                  onClick={() => navTo('CONTACT')}
                  className="flex items-center gap-2 bg-gold-500 text-navy-950 font-bold text-sm px-5 py-2.5 rounded-lg hover:bg-gold-400 transition-colors shadow-lg shadow-gold-900/30"
                >
                  <MessageSquare size={14} />
                  Nous contacter
                </button>
                <a
                  href="https://jad2advisory.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm font-semibold text-gold-400 border border-gold-500/50 px-4 py-2.5 rounded-lg hover:border-gold-400 hover:bg-gold-500/5 transition-colors"
                >
                  <ExternalLink size={13} />
                  jad2advisory.com
                </a>
              </div>
            </div>
          </div>
        )}

        {/* â”€â”€â”€ DASHBOARD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {view === 'DASHBOARD' && (
          <div className="space-y-6">
            <FxDashboard />
            <CurrencyHeatmap rates={tickerRates} />
            <PriceAlerts rates={tickerRates} />
          </div>
        )}

        {/* â”€â”€â”€ Other views â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {view === 'ANALYSIS'    && <MarketAnalysis />}
        {view === 'FIXING'      && <BkamFixing />}
        {view === 'BILLETS'     && <BilletsPage />}
        {view === 'COMMODITIES' && <CommoditiesPage />}
        {view === 'REPORT'      && <MorningBriefing />}
        {view === 'REGULATIONS' && <RegulationsPage />}
        {view === 'FORWARDS'    && <ForwardCalculator />}
        {view === 'SWAPS'       && <SwapSimulator />}
        {view === 'BANDS'       && <BkamBandsVisualizer />}
        {view === 'RESOURCES'   && <ResourcesPage />}
        {view === 'RESEARCH'       && <ResearchHub navTo={navTo} />}
        {view === 'ABOUT_JAD2'     && <AboutJad2 />}
        {view === 'TOOL_OC_ASSESS' && <OcComplianceAssessment />}
        {view === 'TOOL_CORRIDOR'  && <CorridorCalculator />}
        {view === 'TOOL_INVOICE'   && <InvoiceImpactCalc />}
        {view === 'TOOL_FWD_EXT'  && <ForwardExtension />}
        {view === 'PARITY_MATRIX' && <BkamParityMatrix />}
        {view === 'TOOL_PME_DIAG' && <PmeDiagnostic />}
        {view === 'TOOL_IMPORT_COST' && <ImportCostCalc />}
        {view === 'TOOL_QUARTERLY' && <QuarterlyHedge />}
        {view === 'GLOSSARY' && <Glossary />}
        {view === 'BLOG' && <Blog />}
        {view === 'BASKET' && <BasketExplainer />}
        {view === 'PRESS' && <PressKit />}
        {view === 'API_DOCS' && <ApiDocs />}
        {view === 'CHANGELOG' && <Changelog />}
        {view === 'PARTNERSHIPS' && <Partnerships />}
        {view === 'CITED' && <PressWall />}
        {view === 'PODCAST' && <Podcast />}
        {view === 'QUARTERLY_OUTLOOK' && <QuarterlyOutlook />}
        {view === 'SERVICES' && <ServicesPage navTo={navTo} />}
        {view === 'AUDIT_LANDING' && <AuditLanding />}
        {view === 'AUDIT_LOG' && <AuditLog />}
        {view === 'TESTIMONIALS' && <SocialProofModule />}
        {view === 'VOL_SURFACE' && <VolSurfacePage />}
        {view === 'MONEY_MARKET' && <MoneyMarketPage />}
        {view === 'BLUE_CHIPS'    && <BlueChipsTable />}
        {view === 'VAR_CALC'      && <VaRCalculator />}
        {view === 'SOVEREIGN' && <SovereignPage />}
        {view === 'BANK_RATES' && <BankRatesPage />}
        {view === 'CORRELATION' && <CorrelationHeatmap />}
        {view === 'MULTIPANE' && <MultiPane />}
        {view === 'SECTOR_AUTO'     && <SectorLanding sectorId="auto"     navTo={navTo} onContact={() => setContactDrawerOpen(true)} />}
        {view === 'SECTOR_TEXTILE'  && <SectorLanding sectorId="textile"  navTo={navTo} onContact={() => setContactDrawerOpen(true)} />}
        {view === 'SECTOR_NORDIQUE' && <SectorLanding sectorId="nordique" navTo={navTo} onContact={() => setContactDrawerOpen(true)} />}
        {view === 'SECTOR_AGRI'     && <SectorLanding sectorId="agri"     navTo={navTo} onContact={() => setContactDrawerOpen(true)} />}
        {view === 'SECTOR_PHOSPHATE' && <SectorLanding sectorId="phosphate" navTo={navTo} onContact={() => setContactDrawerOpen(true)} />}

        {view === 'LIVE' && (
          <div className="space-y-6">
            <MarketSessionsClock />
            <LivePricer />
            <CurrencyHeatmap rates={tickerRates} />
            <FxCrossMatrix rates={tickerRates} />
          </div>
        )}

        {view === 'ADMIN'   && <AdminDashboard />}
        {view === 'COCKPIT' && <AdminCockpit navTo={navTo} />}
        {view === 'NOT_FOUND' && <NotFound variant="404" onRetry={() => navTo('HOME')} />}

        {view === 'CONTACT' && (
          <div className="space-y-6">
            <div className="border-b border-navy-800 pb-4">
              <h1 className="text-2xl font-bold text-white">Contactez JAD2 Advisory</h1>
              <p className="text-sm text-slate-400 mt-1">
                Cabinet de conseil stratÃ©gique & formation en gestion du risque de change Â· Casablanca
              </p>
            </div>
            <ContactForm />
          </div>
        )}

        {/* â”€â”€â”€ ABOUT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {view === 'ABOUT' && (
          <div className="max-w-3xl mx-auto space-y-5">
            {/* Casablanca hero image */}
            <div className="relative rounded-xl overflow-hidden h-40 border border-navy-800">
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(/casablanca-night.jpg)' }} />
              <div className="absolute inset-0 bg-gradient-to-b from-navy-950/30 to-navy-950/80" />
              <div className="absolute bottom-4 left-6">
                <p className="text-[9px] text-navy-400 tracking-widest uppercase">Casablanca Â· Centre financier de rÃ©fÃ©rence du Maroc</p>
              </div>
            </div>
            <div className="bg-navy-900 border border-navy-800 rounded-xl p-8">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-navy-800">
                <LogoJad2Fx height={56} dark={true} showSub={true} />
                <div className="border-l border-navy-700 pl-4">
                  <p className="text-[10px] text-gold-500 tracking-wider mt-0.5">Outil de DonnÃ©es de Change MAD Â· PÃ©dagogique</p>
                </div>
              </div>

              <div className="space-y-4 text-navy-300 text-[13px] leading-relaxed">
                <p>
                  <strong className="text-slate-200">JAD2FX</strong> est l'outil en ligne de donnÃ©es de change et de simulation pÃ©dagogique
                  de <strong className="text-slate-200">JAD2 Advisory</strong>. Il permet aux entreprises et professionnels marocains de
                  comprendre les dynamiques du marchÃ© des changes MAD et la rÃ©glementation de l'Office des Changes.
                </p>
                <p>
                  JAD2FX est un outil de rÃ©fÃ©rence et de simulation pÃ©dagogique â€” il ne constitue pas un conseil en investissement.
                  Pour toute transaction ou conseil personnalisÃ©, consultez un{' '}
                  <strong className="text-slate-200">Ã©tablissement de crÃ©dit agrÃ©Ã© par Bank Al-Maghrib</strong>.
                </p>

                <h3 className="text-[11px] font-bold text-white mt-6 mb-3 uppercase tracking-[0.15em] flex items-center gap-2">
                  <span className="w-4 h-px bg-gold-500 inline-block" /> FonctionnalitÃ©s
                </h3>
                <ul className="space-y-2">
                  {[
                    `DonnÃ©es indicatives sur ${BKAM_CURRENCIES.length} devises (14 cotÃ©es BKAM + ${BKAM_CURRENCIES.length - 14} dÃ©rivÃ©es par taux croisÃ©s)`,
                    'Simulateur pÃ©dagogique de forwards (formule CIP) et de swaps de change',
                    'RÃ©fÃ©rentiel rÃ©glementaire Office des Changes (circulaires, instructions, FAQs)',
                    'Courbes de taux MONIA interpolÃ©es Ã  titre informatif et pÃ©dagogique',
                    'Market Report hebdomadaire gÃ©nÃ©rÃ© par IA (Groq Llama 3.3 + Gemini 2.5)',
                  ].map(f => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="text-gold-500 mt-0.5 flex-shrink-0 text-xs">â–¸</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <h3 className="text-[11px] font-bold text-white mt-6 mb-3 uppercase tracking-[0.15em] flex items-center gap-2">
                  <span className="w-4 h-px bg-gold-500 inline-block" /> JAD2 Advisory
                </h3>
                <p>
                  Cabinet de conseil stratÃ©gique et de formation en gestion du risque de change, enregistrÃ© au RC Casablanca.
                  Services : formation Ã©quipes financiÃ¨res, conseil en stratÃ©gie de couverture, accompagnement rÃ©glementaire OC.
                </p>

                <div className="mt-4 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                  <p className="text-[11px] text-amber-400/90">
                    â„¹ï¸ <strong className="text-amber-300">JAD2 Advisory fournit exclusivement</strong>{' '}
                    conseil stratÃ©gique et formation en gestion du risque de change â€” sans exÃ©cution de transactions de change ni conseil en investissement.
                    Pour vos opÃ©rations, adressez-vous Ã  un Ã©tablissement bancaire agrÃ©Ã©.
                  </p>
                </div>

                <a
                  href="https://jad2advisory.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-gold-500 text-navy-950 font-bold text-sm rounded hover:bg-gold-400 transition-colors"
                >
                  <ExternalLink size={13} /> Visiter jad2advisory.com
                </a>

                <div className="mt-6 p-4 bg-navy-950 border border-navy-700 rounded-lg">
                  <p className="text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Mentions LÃ©gales & ConformitÃ©</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{DISCLAIMER_TEXT}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        </Suspense>
      </main>

      {/* â•â• Mobile-only bottom tab nav (B3.5) â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <BottomNav view={view} navTo={navTo} />

      {/* â•â• Floating chatbot â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <FloatingChat />

      {/* â•â• In-platform contact drawer (Task 2.4) â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {contactDrawerOpen && (
        <div
          className="fixed inset-0 z-[9998] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-navy-950/85 backdrop-blur-sm"
          onClick={() => setContactDrawerOpen(false)}
        >
          <div
            className="bg-navy-900 border border-navy-700 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-navy-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Parler Ã  un expert JAD2</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">RÃ©ponse sous 24h ouvrÃ©es Â· Confidentiel</p>
              </div>
              <button
                onClick={() => setContactDrawerOpen(false)}
                className="text-navy-500 hover:text-slate-300 transition-colors p-1"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6">
              <ContactForm />
            </div>
          </div>
        </div>
      )}

      {/* â•â• Footer â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <footer className="bg-navy-900 text-slate-400 border-t border-navy-700 mt-auto">
        {/* Advisory CTA */}
        <div className="border-b border-navy-800 py-4">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-white">Formation & Conseil en Gestion du Risque de Change</p>
              <p className="text-xs text-slate-400">Cabinet de conseil Â· Formation en gestion du risque de change Â· Accompagnement rÃ©glementaire OC</p>
            </div>
            <button
              onClick={() => setContactDrawerOpen(true)}
              className="flex-shrink-0 px-5 py-2 bg-gold-500 text-navy-950 text-sm font-bold rounded hover:bg-gold-400 transition-colors"
            >
              Parler Ã  un expert â†’
            </button>
          </div>
        </div>

        {/* Legal + content links */}
        <div className="py-6">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
            {/* P4 â€” Footer resource links (SEO internal linking) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-6 pb-6 border-b border-navy-800">
              <div className="col-span-2 sm:col-span-3 md:col-span-2">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">Ressources</p>
                <p className="text-[10px] text-slate-600 leading-relaxed">
                  Outil pÃ©dagogique de JAD2 Advisory. DonnÃ©es BKAM, BCE, et Yahoo Finance. ConformitÃ© OC 01/2024.
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">Apprendre</p>
                <ul className="space-y-1">
                  <li><button onClick={() => navTo('GLOSSARY')} className="text-[11px] text-slate-400 hover:text-gold-400 transition-colors">Glossaire FX</button></li>
                  <li><button onClick={() => navTo('BLOG')} className="text-[11px] text-slate-400 hover:text-gold-400 transition-colors">Research</button></li>
                  <li><button onClick={() => navTo('BASKET')} className="text-[11px] text-slate-400 hover:text-gold-400 transition-colors">Panier BKAM</button></li>
                </ul>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">MÃ©dias</p>
                <ul className="space-y-1">
                  <li><button onClick={() => navTo('PRESS')} className="text-[11px] text-slate-400 hover:text-gold-400 transition-colors">Press Kit</button></li>
                  <li><button onClick={() => navTo('CITED')} className="text-[11px] text-slate-400 hover:text-gold-400 transition-colors">CitÃ© par</button></li>
                  <li><button onClick={() => navTo('PODCAST')} className="text-[11px] text-slate-400 hover:text-gold-400 transition-colors">Podcast</button></li>
                </ul>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">Outils</p>
                <ul className="space-y-1">
                  <li><button onClick={() => navTo('API_DOCS')} className="text-[11px] text-slate-400 hover:text-gold-400 transition-colors">API</button></li>
                  <li><button onClick={() => navTo('QUARTERLY_OUTLOOK')} className="text-[11px] text-slate-400 hover:text-gold-400 transition-colors">Quarterly</button></li>
                  <li><a href="/sitemap.xml" className="text-[11px] text-slate-400 hover:text-gold-400 transition-colors">Sitemap</a></li>
                </ul>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">SociÃ©tÃ©</p>
                <ul className="space-y-1">
                  <li><button onClick={() => navTo('ABOUT_JAD2')} className="text-[11px] text-slate-400 hover:text-gold-400 transition-colors">Ã€ propos</button></li>
                  <li><button onClick={() => navTo('PARTNERSHIPS')} className="text-[11px] text-slate-400 hover:text-gold-400 transition-colors">Partenaires</button></li>
                  <li><button onClick={() => navTo('CHANGELOG')} className="text-[11px] text-slate-400 hover:text-gold-400 transition-colors">Changelog</button></li>
                </ul>
              </div>
            </div>

            <p className="text-xs leading-relaxed max-w-3xl mx-auto text-slate-500 text-center">{DISCLAIMER_TEXT}</p>
            <div className="flex flex-wrap justify-center gap-3 mt-3 text-xs text-slate-500">
              <span>ECB / Frankfurter</span>
              <span className="text-slate-700">Â·</span>
              <span>Yahoo Finance</span>
              <span className="text-slate-700">Â·</span>
              <span>BKAM Fixing</span>
              <span className="text-slate-700">Â·</span>
              <a href="https://jad2advisory.com" target="_blank" rel="noopener noreferrer" className="text-gold-600 hover:text-gold-400 transition-colors">
                jad2advisory.com
              </a>
            </div>
            <p className="text-xs mt-2 text-slate-600 italic">
              Market data from Yahoo Finance for educational purposes only. Not for commercial trading.
            </p>
            <p className="text-[10px] mt-2 text-slate-600 leading-relaxed max-w-3xl mx-auto">
              JAD2 Advisory â€” Cabinet de conseil en management Â· Non Ã©tablissement financier agrÃ©Ã© BAM/AMMC Â·
              Loi nÂ° 43-12 &amp; Dahir nÂ° 1-13-21 Â· Les taux JAD2FX ne peuvent Ãªtre utilisÃ©s comme
              rÃ©fÃ©rence d'exÃ©cution conformÃ©ment Ã  la MÃ©thodologie BKAM 2024 (Â§II) Â·
              DonnÃ©es personnelles : Loi marocaine 09-08 Â· CNDP DÃ©claration en cours
            </p>
            <p className="text-xs mt-1.5 text-slate-600">{t('footer.copyright')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// â”€â”€â”€ Root export â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <I18nProvider>
          <AdminProvider>
            <AppInner />
          </AdminProvider>
        </I18nProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

