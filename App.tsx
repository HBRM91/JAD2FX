import React, { useEffect, useState, useRef, useCallback, Suspense, lazy } from 'react';
import { ViewState, LiveRate, LivePriceEntry } from './types';
import { DEFAULT_BASKET_CONFIG, MARKET_NEWS, DISCLAIMER_TEXT, DISCLAIMER_SHORT, BKAM_CURRENCIES } from './constants';
import { fetchAllMadRates } from './services/fxRates';

// P0.14 — Code-split all route components for fast initial load.
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
import NewsletterSignup   from './components/NewsletterSignup';
import { SkipToContent } from './utils/a11y';
import Onboarding from './components/Onboarding';

const FxDashboard           = lazy(() => import('./components/FxDashboard'));
const MarketAnalysis        = lazy(() => import('./components/MarketAnalysis'));
const ForwardCalculator     = lazy(() => import('./components/ForwardCalculator'));
const SwapSimulator         = lazy(() => import('./components/SwapSimulator'));
const LivePricer            = lazy(() => import('./components/LivePricer'));
const AdminDashboard        = lazy(() => import('./components/AdminDashboard'));
const BkamFixing            = lazy(() => import('./components/BkamFixing'));
const BilletsPage           = lazy(() => import('./components/BilletsPage'));
const CommoditiesPage       = lazy(() => import('./components/CommoditiesPage'));
const MarketReportPage      = lazy(() => import('./components/MarketReport'));
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
// P3 — Funnel tools
const PmeDiagnostic         = lazy(() => import('./components/PmeDiagnostic'));
const ImportCostCalc        = lazy(() => import('./components/ImportCostCalc'));
const QuarterlyHedge        = lazy(() => import('./components/QuarterlyHedge'));
const Watchlist             = lazy(() => import('./components/Watchlist'));
// P4 — Content authority
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
const NewsletterAdmin       = lazy(() => import('./components/admin/NewsletterAdmin'));
const ApiKeyManagement      = lazy(() => import('./components/admin/ApiKeyManagement'));
const BacklinkTracker       = lazy(() => import('./components/admin/BacklinkTracker'));
const LeadsDashboard        = lazy(() => import('./components/admin/LeadsDashboard'));
import ThemeToggle from './components/ThemeToggle';
// P3 — Funnel + social proof
const ServicesPage          = lazy(() => import('./components/ServicesPage'));
const AuditLanding          = lazy(() => import('./components/AuditLanding'));
const AuditLog              = lazy(() => import('./components/AuditLog'));
const SectorCaseStudy       = lazy(() => import('./components/SectorCaseStudy'));
const SocialProofModule     = lazy(() => import('./components/SocialProof'));
const WhatsAppButton        = lazy(() => import('./components/WhatsAppButton'));
const ExitIntentModal       = lazy(() => import('./components/ExitIntentModal'));
const ContextualCTA         = lazy(() => import('./components/ContextualCTA'));
const PriceAlerts           = lazy(() => import('./components/PriceAlerts'));
const TimeWindowSelector    = lazy(() => import('./components/TimeWindowSelector'));
const VolSurfacePage        = lazy(() => import('./components/VolSurfacePage'));
const MoneyMarketPage       = lazy(() => import('./components/MoneyMarketPage'));
const SovereignPage         = lazy(() => import('./components/SovereignPage'));
const BankRatesPage         = lazy(() => import('./components/BankRatesPage'));
const CorrelationHeatmap    = lazy(() => import('./components/CorrelationHeatmap'));
const GlobalSearch          = lazy(() => import('./components/GlobalSearch'));
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
  ClipboardCheck, Calculator, Calendar, Search, Sun, Moon,
} from 'lucide-react';

// ─── Nav data is in navConfig.tsx so other components (CommandPalette) can reuse it.
import { NAV_GROUPS as _NAV_GROUPS, type NavGroup } from './navConfig';

const NAV_GROUPS: NavGroup[] = _NAV_GROUPS as unknown as { id: string; label: string; items: { label: string; view: ViewState; icon: React.ElementType; desc: string }[] }[];
void NAV_GROUPS; // referenced for completeness; command palette uses _NAV_GROUPS directly

// ─── Expandable news card ─────────────────────────────────────────────────────

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
        {expanded ? '▲ Réduire' : '▼ Lire la suite'}
      </button>
    </div>
  );
}

// ─── Inner app ─────────────────────────────────────────────────────────────────

// P0.14 — Skeleton shown while a route chunk is loading.
function RouteFallback() {
  return (
    <div className="space-y-4 animate-pulse">
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
  const [openGroup, setOpenGroup]   = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [cheatsheetOpen, setCheatsheetOpen] = useState(false);
  const { t, locale, setLocale, isRTL } = useI18n();
  const navDropdownRef = useRef<HTMLDivElement>(null);

  // P2.3 + P2.12 — Global keyboard shortcuts: Cmd+K (palette), ? (cheatsheet), h, etc.
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
  };

  const activeGroupId = NAV_GROUPS.find(g => g.items.some(i => i.view === view))?.id ?? null;

  const LOCALE_OPTIONS: { code: Locale; label: string }[] = [
    { code: 'fr', label: 'FR' },
    { code: 'en', label: 'EN' },
    { code: 'ar', label: 'عربي' },
  ];

  // ── Page title chip ───────────────────────────────────────────────────────
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

      {/* ══ Navbar ══════════════════════════════════════════════════════════ */}
      <nav ref={navDropdownRef} className="bg-navy-900 sticky top-0 z-50 border-b border-navy-800">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">

            {/* Logo */}
            <button
              className="flex-shrink-0 focus:outline-none"
              onClick={() => navTo('HOME')}
              aria-label="JAD2FX — Accueil"
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
                      className="absolute top-full left-0 bg-navy-900 border border-navy-800 border-t-0 rounded-b-xl shadow-2xl min-w-[230px] py-1.5 z-50"
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
                À Propos
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

              {/* P3.22 — external Advisory link removed from top nav (was bypassing funnel).
                  In-domain primary CTAs: Audit Gratuit + Morning Briefing. */}
              <div className="hidden md:flex items-center gap-2">
                <ThemeToggle />
                <button
                  onClick={() => setPaletteOpen(true)}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium border border-navy-700 rounded text-slate-400 hover:text-white hover:border-navy-600 transition-colors"
                  aria-label="Recherche globale (Cmd+K)"
                >
                  <Search size={11} />
                  <span>Rechercher…</span>
                  <kbd className="hidden lg:flex items-center gap-0.5 ml-1 px-1 py-0.5 text-[8px] font-mono text-slate-500 bg-navy-800 border border-navy-700 rounded">⌘K</kbd>
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
              <Building2 size={14} /> À Propos
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

      {/* ══ Compliance banner ════════════════════════════════════════════════ */}
      <div className="bg-navy-950 border-b border-navy-800 px-4 py-1">
        <p className="text-[11px] text-slate-500 tracking-wide text-center">{DISCLAIMER_SHORT}</p>
      </div>

      {/* ══ Persistent non-executable rate notice (all tool views, all devices) ═ */}
      {['FORWARDS', 'SWAPS', 'ANALYSIS', 'BANDS', 'LIVE', 'DASHBOARD', 'FIXING', 'BILLETS'].includes(view) && (
        <div className="sticky top-14 z-40 border-b border-gold-600/20 bg-gold-500/5 px-4 py-1 text-center">
          <p className="text-[9px] text-gold-600/80 font-medium">
            Taux JAD2FX strictement indicatifs — non utilisables pour des opérations de change
            (BKAM Méthodologie 2024, §II) · Pour un cours ferme : votre banque domiciliataire agréée BAM
          </p>
        </div>
      )}
      {/* ══ Mobile simulator banner — calc/simulation views only ══════════════ */}
      {['FORWARDS', 'SWAPS', 'ANALYSIS', 'BANDS', 'REPORT', 'RESEARCH'].includes(view) && (
        <div className="lg:hidden sticky top-[calc(56px+28px)] z-39 bg-amber-900/95 border-b border-amber-700/50 backdrop-blur-sm px-4 py-1 text-center">
          <p className="text-[8px] font-bold text-amber-300 uppercase tracking-widest">
            Mode Simulateur — Résultats Non-Exécutables · Usage Pédagogique Uniquement
          </p>
        </div>
      )}

      {/* ══ Ticker ═══════════════════════════════════════════════════════════ */}
      <RatesTicker rates={tickerRates} />
      <div className="flex justify-end max-w-[1440px] mx-auto px-4 sm:px-6 -mt-1">
        <LiveCounterLazy />
      </div>

      {/* ══ Page breadcrumb (non-home views) ═════════════════════════════════ */}
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

      {/* ══ Main content ═════════════════════════════════════════════════════ */}
      <main id="main-content" role="main" className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 view-enter">
        <Suspense fallback={<RouteFallback />}>

        {/* ─── HOME ──────────────────────────────────────────────────────── */}
        {view === 'HOME' && (
          <div className="space-y-6">

            {/* ── Persona split hero (Task 2.1) ───────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Corporate MAD persona */}
              <div className="bg-navy-900 border border-gold-700/30 rounded-2xl p-6 flex flex-col gap-4 hover:border-gold-600/50 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-gold-500 uppercase tracking-[0.2em] bg-gold-500/10 border border-gold-500/25 px-2 py-0.5 rounded">
                    PME &amp; Corporate Maroc
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-serif font-bold text-white leading-tight mb-2">
                    Maîtrisez votre exposition de change MAD
                  </h2>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Forward, swap, conformité OC 01/2024 — outils pédagogiques, Morning Briefing
                    quotidien et accompagnement stratégique pour les trésoriers marocains.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 mt-auto">
                  <button
                    onClick={() => navTo('RESEARCH')}
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

              {/* P2.19 — Removed: European Fintech persona per plan (single PME hero) */}
            </div>

            {/* ── Drift alert chip (Task 2.3) ──────────────────────────────── */}
            {config.corsProxyUrl && (
              <DriftAlertChip
                proxyUrl={config.corsProxyUrl}
                onNavigate={() => navTo('BANDS')}
              />
            )}

            {/* ── Trust bar (Task 2.2) ─────────────────────────────────────── */}
            <div className="bg-navy-900/60 border border-navy-800 rounded-xl px-5 py-3">
              <p className="text-[9px] text-slate-600 uppercase tracking-wider text-center mb-2.5 font-bold">
                Accompagne des entreprises dans leur gestion de change MAD
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
                {[
                  { sector: 'Équipementier automobile',  city: 'Tanger' },
                  { sector: 'Importateur bois & papier', city: 'Casablanca' },
                  { sector: 'Exportateur textile',        city: 'Fès-Meknès' },
                  { sector: 'Opérateur phosphates',       city: 'Khouribga' },
                  { sector: 'Fintech européenne',         city: 'Corridor MENA' },
                ].map(c => (
                  <div key={c.city} className="flex items-center gap-1.5 text-[10px] text-slate-600">
                    <span className="w-1 h-1 rounded-full bg-gold-500/40 flex-shrink-0" />
                    <span>{c.sector} · <em className="not-italic text-slate-700">{c.city}</em></span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── P3 Funnel: Diagnostic FX PME (highest-intent tool) ───────── */}
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
                    5 questions · 90 secondes · score 0-100 avec recommandations
                    personnalisées. Pour DAF, trésoriers, gérants PME.
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

            {/* ── Original hero banner (now secondary / data terminal showcase) */}
            <div className="relative rounded-2xl overflow-hidden border border-navy-700 min-h-[280px] sm:min-h-[340px]" style={{ background: 'linear-gradient(135deg, #040C1C 0%, #081628 50%, #0E2336 100%)' }}>
              {/* Subtle gold radial accent top-right */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_15%,rgba(212,175,55,0.12),transparent_55%)]" />
              {/* Grid lines for depth */}
              <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(#D4AF37 1px, transparent 1px), linear-gradient(90deg, #D4AF37 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

              {/* Content */}
              <div className="relative px-7 sm:px-12 py-10 sm:py-14 max-w-xl">
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-5">
                  {['Simulation Pédagogique', 'Données BKAM Live', 'Réglementation OC'].map(tag => (
                    <span key={tag} className="text-[11px] bg-gold-500/15 border border-gold-500/35 text-gold-400 px-3 py-0.5 rounded-full font-semibold uppercase tracking-wide">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Title */}
                <h1 className="text-5xl sm:text-6xl font-bold text-white tracking-[0.15em] uppercase mb-2 font-serif drop-shadow-xl">JAD2FX</h1>
                <p className="text-gold-400 text-[11px] uppercase tracking-[0.25em] mb-5 font-medium">
                  Outil de Données de Change · by JAD2 Advisory
                </p>

                {/* Subtitle */}
                <p className="text-slate-300 text-sm leading-relaxed mb-8">
                  Données indicatives sur {BKAM_CURRENCIES.length} devises MAD — 14 cotées BKAM + {BKAM_CURRENCIES.length - 14} dérivées. Simulateur pédagogique de forwards & swaps. Référentiel réglementaire Office des Changes.
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

              {/* Quick-access tool tiles — bottom strip inside hero */}
              <div className="relative px-7 sm:px-12 pb-7">
                <div className="border-t border-navy-700/50 pt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                  {[
                    { label: 'Diagnostic OC',    desc: 'Conformité 01/2024', view: 'TOOL_OC_ASSESS' as ViewState, icon: Shield,        color: 'text-amber-400',   border: 'border-amber-700/50',   bg: 'bg-amber-900/25' },
                    { label: 'FX Forwards',      desc: 'CIP terme',          view: 'FORWARDS'       as ViewState, icon: TrendingUp,    color: 'text-blue-400',    border: 'border-blue-700/50',    bg: 'bg-blue-900/30' },
                    { label: 'Bandes BKAM',      desc: 'Cage ±5%',          view: 'BANDS'          as ViewState, icon: BarChart2,      color: 'text-gold-400',    border: 'border-gold-700/50',    bg: 'bg-yellow-900/20' },
                    { label: 'Morning Briefing', desc: 'Analyse Éditoriale', view: 'REPORT'         as ViewState, icon: Newspaper,      color: 'text-emerald-400', border: 'border-emerald-700/50', bg: 'bg-emerald-900/30' },
                    { label: 'Impact Facture',   desc: 'Érosion marge MAD',  view: 'TOOL_INVOICE'   as ViewState, icon: BarChart2,      color: 'text-purple-400',  border: 'border-purple-700/50',  bg: 'bg-purple-900/30' },
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

            {/* ── Market sessions clock ────────────────────────────────────── */}
            <MarketSessionsClock />

            {/* ── 2-col: news + sidebar ───────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

              {/* News feed */}
              <div className="lg:col-span-2 bg-navy-900 border border-navy-700 rounded-2xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-navy-700 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Globe size={14} className="text-gold-500" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-widest">Intelligence de Marché</h3>
                  </div>
                  <span className="text-[11px] text-slate-500 font-semibold px-2.5 py-0.5 border border-navy-600 rounded-full">Éditorial</span>
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
                    <p className="text-xs font-bold text-white mb-1.5 uppercase tracking-wider">Cabinet de Conseil Stratégique</p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Formation risque de change · Conseil stratégique · Accompagnement réglementaire OC
                    </p>
                  </div>
                  <a
                    href="https://jad2advisory.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-2.5 bg-gold-500 text-navy-950 text-sm font-bold rounded-lg hover:bg-gold-400 transition-colors"
                  >
                    jad2advisory.com →
                  </a>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Conseil stratégique · Formation · Accompagnement réglementaire OC
                  </p>
                </div>

                {/* AI assistant hint */}
                <div className="bg-navy-900 border border-navy-700 rounded-2xl p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gold-500/10 border border-gold-500/25 flex items-center justify-center flex-shrink-0">
                    <Zap size={16} className="text-gold-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white mb-1">Assistant IA Réglementaire</p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Questions OC & BKAM via le bouton flottant ↘
                    </p>
                  </div>
                </div>

                {/* Quick stat cards */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Devises Cotées', value: '14', sub: 'par BKAM', color: 'text-gold-400' },
                    { label: 'Devises Totales', value: String(BKAM_CURRENCIES.length), sub: `+${BKAM_CURRENCIES.length - 14} dérivées`, color: 'text-blue-400' },
                    { label: 'Mise à Jour', value: 'Live', sub: 'en continu', color: 'text-emerald-400' },
                    { label: 'Accès', value: 'Gratuit', sub: 'pédagogique', color: 'text-purple-400' },
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

            {/* Market Radar — full width */}
            <MarketRadar tickerRates={tickerRates} />

            {/* P2.4 — Watchlist (persistent, drag-to-reorder) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <Watchlist rates={tickerRates} isRTL={isRTL} />
              <NewsletterSignup proxyUrl={config.corsProxyUrl} source="home_watchlist_card" variant="card" />
            </div>

            {/* P3.8 — Social proof: Stats + Testimonials + LogoWall */}
            <SocialProofModule />

            {/* P3.5 — Contextual CTA (engagement-based) */}
            <ContextualCTA variant="banner" pageKey="home" />

            {/* ── Advisory CTA strip ───────────────────────────────────── */}
            <div className="bg-navy-900 border border-navy-700 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-base font-bold text-white mb-1">Formation & Conseil en Gestion du Risque de Change</p>
                <p className="text-sm text-slate-400">
                  Auditez votre exposition FX · Optimisez votre stratégie de couverture · Maîtrisez la réglementation OC
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

        {/* ─── DASHBOARD ─────────────────────────────────────────────────── */}
        {view === 'DASHBOARD' && (
          <div className="space-y-6">
            <FxDashboard />
            <CurrencyHeatmap rates={tickerRates} />
            <PriceAlerts rates={tickerRates} />
          </div>
        )}

        {/* ─── Other views ───────────────────────────────────────────────── */}
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
        {view === 'SERVICES' && <ServicesPage />}
        {view === 'AUDIT_LANDING' && <AuditLanding />}
        {view === 'AUDIT_LOG' && <AuditLog />}
        {view === 'TESTIMONIALS' && <SocialProofModule />}
        {view === 'VOL_SURFACE' && <VolSurfacePage />}
        {view === 'MONEY_MARKET' && <MoneyMarketPage />}
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

        {view === 'CONTACT' && (
          <div className="space-y-6">
            <div className="border-b border-navy-800 pb-4">
              <h1 className="text-2xl font-bold text-white">Contactez JAD2 Advisory</h1>
              <p className="text-sm text-slate-400 mt-1">
                Cabinet de conseil stratégique & formation en gestion du risque de change · Casablanca
              </p>
            </div>
            <ContactForm />
          </div>
        )}

        {/* ─── ABOUT ─────────────────────────────────────────────────────── */}
        {view === 'ABOUT' && (
          <div className="max-w-3xl mx-auto space-y-5">
            {/* Casablanca hero image */}
            <div className="relative rounded-xl overflow-hidden h-40 border border-navy-800">
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(/casablanca-night.jpg)' }} />
              <div className="absolute inset-0 bg-gradient-to-b from-navy-950/30 to-navy-950/80" />
              <div className="absolute bottom-4 left-6">
                <p className="text-[9px] text-navy-400 tracking-widest uppercase">Casablanca · Centre financier de référence du Maroc</p>
              </div>
            </div>
            <div className="bg-navy-900 border border-navy-800 rounded-xl p-8">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-navy-800">
                <LogoJad2Fx height={56} dark={true} showSub={true} />
                <div className="border-l border-navy-700 pl-4">
                  <p className="text-[10px] text-gold-500 tracking-wider mt-0.5">Outil de Données de Change MAD · Pédagogique</p>
                </div>
              </div>

              <div className="space-y-4 text-navy-300 text-[13px] leading-relaxed">
                <p>
                  <strong className="text-slate-200">JAD2FX</strong> est l'outil en ligne de données de change et de simulation pédagogique
                  de <strong className="text-slate-200">JAD2 Advisory</strong>. Il permet aux entreprises et professionnels marocains de
                  comprendre les dynamiques du marché des changes MAD et la réglementation de l'Office des Changes.
                </p>
                <p>
                  JAD2FX est un outil de référence et de simulation pédagogique — il ne constitue pas un conseil en investissement.
                  Pour toute transaction ou conseil personnalisé, consultez un{' '}
                  <strong className="text-slate-200">établissement de crédit agréé par Bank Al-Maghrib</strong>.
                </p>

                <h3 className="text-[11px] font-bold text-white mt-6 mb-3 uppercase tracking-[0.15em] flex items-center gap-2">
                  <span className="w-4 h-px bg-gold-500 inline-block" /> Fonctionnalités
                </h3>
                <ul className="space-y-2">
                  {[
                    `Données indicatives sur ${BKAM_CURRENCIES.length} devises (14 cotées BKAM + ${BKAM_CURRENCIES.length - 14} dérivées par taux croisés)`,
                    'Simulateur pédagogique de forwards (formule CIP) et de swaps de change',
                    'Référentiel réglementaire Office des Changes (circulaires, instructions, FAQs)',
                    'Courbes de taux MONIA interpolées à titre informatif et pédagogique',
                    'Market Report hebdomadaire généré par IA (Groq Llama 3.3 + Gemini 2.5)',
                  ].map(f => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="text-gold-500 mt-0.5 flex-shrink-0 text-xs">▸</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <h3 className="text-[11px] font-bold text-white mt-6 mb-3 uppercase tracking-[0.15em] flex items-center gap-2">
                  <span className="w-4 h-px bg-gold-500 inline-block" /> JAD2 Advisory
                </h3>
                <p>
                  Cabinet de conseil stratégique et de formation en gestion du risque de change, enregistré au RC Casablanca.
                  Services : formation équipes financières, conseil en stratégie de couverture, accompagnement réglementaire OC.
                </p>

                <div className="mt-4 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                  <p className="text-[11px] text-amber-400/90">
                    ℹ️ <strong className="text-amber-300">JAD2 Advisory fournit exclusivement</strong>{' '}
                    conseil stratégique et formation en gestion du risque de change — sans exécution de transactions de change ni conseil en investissement.
                    Pour vos opérations, adressez-vous à un établissement bancaire agréé.
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
                  <p className="text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Mentions Légales & Conformité</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{DISCLAIMER_TEXT}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        </Suspense>
      </main>

      {/* ══ Floating chatbot ═════════════════════════════════════════════════ */}
      <FloatingChat />

      {/* ══ In-platform contact drawer (Task 2.4) ═══════════════════════════ */}
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
                <h3 className="text-base font-bold text-white">Parler à un expert JAD2</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Réponse sous 24h ouvrées · Confidentiel</p>
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

      {/* ══ Footer ═══════════════════════════════════════════════════════════ */}
      <footer className="bg-navy-900 text-slate-400 border-t border-navy-700 mt-auto">
        {/* Advisory CTA */}
        <div className="border-b border-navy-800 py-4">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-white">Formation & Conseil en Gestion du Risque de Change</p>
              <p className="text-xs text-slate-400">Cabinet de conseil · Formation en gestion du risque de change · Accompagnement réglementaire OC</p>
            </div>
            <button
              onClick={() => setContactDrawerOpen(true)}
              className="flex-shrink-0 px-5 py-2 bg-gold-500 text-navy-950 text-sm font-bold rounded hover:bg-gold-400 transition-colors"
            >
              Parler à un expert →
            </button>
          </div>
        </div>

        {/* Legal + content links */}
        <div className="py-6">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
            {/* P4 — Footer resource links (SEO internal linking) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-6 pb-6 border-b border-navy-800">
              <div className="col-span-2 sm:col-span-3 md:col-span-2">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">Ressources</p>
                <p className="text-[10px] text-slate-600 leading-relaxed">
                  Outil pédagogique de JAD2 Advisory. Données BKAM, BCE, et Yahoo Finance. Conformité OC 01/2024.
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
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">Médias</p>
                <ul className="space-y-1">
                  <li><button onClick={() => navTo('PRESS')} className="text-[11px] text-slate-400 hover:text-gold-400 transition-colors">Press Kit</button></li>
                  <li><button onClick={() => navTo('CITED')} className="text-[11px] text-slate-400 hover:text-gold-400 transition-colors">Cité par</button></li>
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
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">Société</p>
                <ul className="space-y-1">
                  <li><button onClick={() => navTo('ABOUT_JAD2')} className="text-[11px] text-slate-400 hover:text-gold-400 transition-colors">À propos</button></li>
                  <li><button onClick={() => navTo('PARTNERSHIPS')} className="text-[11px] text-slate-400 hover:text-gold-400 transition-colors">Partenaires</button></li>
                  <li><button onClick={() => navTo('CHANGELOG')} className="text-[11px] text-slate-400 hover:text-gold-400 transition-colors">Changelog</button></li>
                </ul>
              </div>
            </div>

            <p className="text-xs leading-relaxed max-w-3xl mx-auto text-slate-500 text-center">{DISCLAIMER_TEXT}</p>
            <div className="flex flex-wrap justify-center gap-3 mt-3 text-xs text-slate-500">
              <span>ECB / Frankfurter</span>
              <span className="text-slate-700">·</span>
              <span>Yahoo Finance</span>
              <span className="text-slate-700">·</span>
              <span>BKAM Fixing</span>
              <span className="text-slate-700">·</span>
              <a href="https://jad2advisory.com" target="_blank" rel="noopener noreferrer" className="text-gold-600 hover:text-gold-400 transition-colors">
                jad2advisory.com
              </a>
            </div>
            <p className="text-xs mt-2 text-slate-600 italic">
              Market data from Yahoo Finance for educational purposes only. Not for commercial trading.
            </p>
            <p className="text-[10px] mt-2 text-slate-600 leading-relaxed max-w-3xl mx-auto">
              JAD2 Advisory — Cabinet de conseil en management · Non établissement financier agréé BAM/AMMC ·
              Loi n° 43-12 &amp; Dahir n° 1-13-21 · Les taux JAD2FX ne peuvent être utilisés comme
              référence d'exécution conformément à la Méthodologie BKAM 2024 (§II) ·
              Données personnelles : Loi marocaine 09-08 · CNDP Déclaration en cours
            </p>
            <p className="text-xs mt-1.5 text-slate-600">{t('footer.copyright')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── Root export ──────────────────────────────────────────────────────────────

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
