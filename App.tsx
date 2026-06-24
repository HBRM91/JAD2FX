import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ViewState, LiveRate, LivePriceEntry } from './types';
import { DEFAULT_BASKET_CONFIG, MARKET_NEWS, DISCLAIMER_TEXT, DISCLAIMER_SHORT, BKAM_CURRENCIES } from './constants';
import { fetchAllMadRates } from './services/fxRates';
import FxDashboard        from './components/FxDashboard';
import MarketAnalysis     from './components/MarketAnalysis';
import RatesTicker        from './components/RatesTicker';
import ForwardCalculator  from './components/ForwardCalculator';
import SwapSimulator      from './components/SwapSimulator';
import LivePricer         from './components/LivePricer';
import AdminDashboard     from './components/AdminDashboard';
import BkamFixing         from './components/BkamFixing';
import BilletsPage        from './components/BilletsPage';
import CommoditiesPage    from './components/CommoditiesPage';
import MarketReportPage   from './components/MarketReport';
import RegulationsPage    from './components/RegulationsPage';
import FloatingChat       from './components/FloatingChat';
import Jad2Logo           from './components/Jad2Logo';
import MarketSessionsClock from './components/MarketSessionsClock';
import DisclaimerModal    from './components/DisclaimerModal';
import CurrencyHeatmap   from './components/CurrencyHeatmap';
import BkamBandsVisualizer from './components/BkamBandsVisualizer';
import ResourcesPage from './components/ResourcesPage';
import FxCrossMatrix      from './components/FxCrossMatrix';
import MarketRadar        from './components/MarketRadar';
import { AdminProvider, useAdmin } from './context/AdminContext';
import { I18nProvider, useI18n, Locale } from './context/I18nContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import {
  Building2, FileText, LayoutDashboard, Menu,
  Globe, ChevronRight, TrendingUp, ArrowLeftRight, Activity,
  Lock, X, BarChart2, Banknote, PackageOpen, Newspaper, Scale,
  ChevronDown, ExternalLink, Zap,
} from 'lucide-react';

// ─── Nav data ─────────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  view: ViewState;
  icon: React.ElementType;
  desc: string;
}

interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'market',
    label: 'Données Marché',
    items: [
      { label: 'Tableau de Bord',    view: 'DASHBOARD',   icon: LayoutDashboard, desc: '20 devises MAD live' },
      { label: 'Live Pricer',        view: 'LIVE',        icon: Activity,         desc: 'Séances & cotations' },
      { label: 'Fixing BKAM',        view: 'FIXING',      icon: BarChart2,        desc: 'Cours officiels BAM' },
      { label: 'Billets & Chèques',  view: 'BILLETS',     icon: Banknote,         desc: 'Taux billets OC' },
      { label: 'Matières Premières', view: 'COMMODITIES', icon: PackageOpen,       desc: 'Pétrole & métaux' },
    ],
  },
  {
    id: 'tools',
    label: 'Outils Trading',
    items: [
      { label: 'Forward Calculator', view: 'FORWARDS',  icon: TrendingUp,    desc: 'Couverture CIP terme' },
      { label: 'FX Swap Simulator',  view: 'SWAPS',     icon: ArrowLeftRight, desc: 'Near / Far legs' },
      { label: 'Analyse de Marché',  view: 'ANALYSIS',  icon: FileText,       desc: 'Indicateurs & drift' },
      { label: 'Bandes BKAM',        view: 'BANDS',     icon: BarChart2,      desc: 'Cage ±5% & oiseau' },
    ],
  },
  {
    id: 'research',
    label: 'Recherche',
    items: [
      { label: 'Market Report IA',   view: 'REPORT',      icon: Newspaper,    desc: 'Rapport hebdo Groq/Gemini' },
      { label: 'Réglementation OC',  view: 'REGULATIONS', icon: Scale,        desc: 'Circulaires Office des Changes' },
      { label: 'Ressources',         view: 'RESOURCES',   icon: ExternalLink, desc: 'Liens institutionnels & data' },
    ],
  },
];

// ─── Inner app ─────────────────────────────────────────────────────────────────

function AppInner() {
  const { config, setLivePrices } = useAdmin();
  useTheme(); // keeps ThemeProvider active (dark-only)
  const [view, setView]             = useState<ViewState>('HOME');
  const [tickerRates, setTickerRates] = useState<LiveRate[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroup, setOpenGroup]   = useState<string | null>(null);
  const { t, locale, setLocale, isRTL } = useI18n();
  const navDropdownRef = useRef<HTMLDivElement>(null);

  const refreshRates = useCallback(() => {
    fetchAllMadRates(DEFAULT_BASKET_CONFIG, config.corsProxyUrl)
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

  const navTo = (v: ViewState) => { setView(v); setMobileOpen(false); setOpenGroup(null); };

  const activeGroupId = NAV_GROUPS.find(g => g.items.some(i => i.view === view))?.id ?? null;

  const LOCALE_OPTIONS: { code: Locale; label: string }[] = [
    { code: 'fr', label: 'FR' },
    { code: 'en', label: 'EN' },
    { code: 'ar', label: 'عر' },
  ];

  // ── Page title chip ───────────────────────────────────────────────────────
  const allItems = NAV_GROUPS.flatMap(g => g.items);
  const activeItem = allItems.find(i => i.view === view);

  return (
    <div
      className="min-h-screen flex flex-col font-sans bg-navy-950 text-slate-300"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <DisclaimerModal />

      {/* ══ Navbar ══════════════════════════════════════════════════════════ */}
      <nav ref={navDropdownRef} className="bg-navy-900 sticky top-0 z-50 border-b border-navy-800">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">

            {/* Logo */}
            <button
              className="flex items-center gap-3 flex-shrink-0"
              onClick={() => navTo('HOME')}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-gold-400 to-gold-700 rounded flex items-center justify-center shadow-lg shadow-gold-900/40">
                <span className="font-serif font-bold text-navy-950 text-sm leading-none">J2</span>
              </div>
              <div className="hidden sm:block">
                <span className="font-bold text-white tracking-[0.2em] text-sm uppercase">JAD2FX</span>
                <span className="text-[9px] text-navy-400 tracking-wider ml-2 hidden md:inline">by JAD2 Advisory</span>
              </div>
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
                          onClick={() => navTo(item.view)}
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
                onClick={() => navTo('ABOUT')}
                className={`flex items-center gap-1.5 px-4 h-full text-[11px] font-semibold tracking-wide uppercase transition-colors ${
                  view === 'ABOUT' ? 'text-gold-400 border-b-2 border-gold-500' : 'text-navy-300 hover:text-white'
                }`}
              >
                À Propos
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

              <a
                href="https://jad2advisory.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-gold-500 text-navy-950 rounded hover:bg-gold-400 transition-colors shadow shadow-gold-900/30"
              >
                <ExternalLink size={11} />
                Advisory
              </a>
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
          <div className="lg:hidden border-t border-navy-800 bg-navy-900 max-h-[80vh] overflow-y-auto">
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
                    onClick={() => navTo(item.view)}
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
              onClick={() => navTo('ADMIN')}
              className={`w-full flex items-center gap-3 px-5 py-2.5 text-[13px] font-medium text-left border-t border-navy-800 ${
                view === 'ADMIN' ? 'text-gold-400 bg-navy-800' : 'text-slate-400 hover:text-white hover:bg-navy-800/50'
              }`}
            >
              <Lock size={14} /> Admin
            </button>
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

      {/* ══ Mobile simulator-mode sticky banner (hidden on desktop) ══════════ */}
      <div className="lg:hidden sticky top-14 z-40 bg-amber-900/95 border-b border-amber-700/50 backdrop-blur-sm px-4 py-1.5 text-center">
        <p className="text-[9px] font-bold text-amber-300 uppercase tracking-widest">
          Mode Simulateur — Taux Non-Exécutables · Indicatif Uniquement
        </p>
      </div>

      {/* ══ Ticker ═══════════════════════════════════════════════════════════ */}
      <RatesTicker rates={tickerRates} />

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
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 view-enter">

        {/* ─── HOME ──────────────────────────────────────────────────────── */}
        {view === 'HOME' && (
          <div className="space-y-6">

            {/* ── Hero banner ─────────────────────────────────────────────── */}
            <div className="relative rounded-2xl overflow-hidden border border-navy-700 min-h-[280px] sm:min-h-[340px]">
              {/* Background image — actually visible */}
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: 'url(/hero-bg.jpg)' }}
              />
              {/* Single left-to-right gradient: content is left, image shows right */}
              <div className="absolute inset-0 bg-gradient-to-r from-navy-950/95 via-navy-950/65 to-navy-950/25" />
              {/* Subtle gold halo top-right */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(212,175,55,0.09),transparent_55%)]" />

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
                    { label: 'FX Forwards',    desc: 'CIP terme',         view: 'FORWARDS'    as ViewState, icon: TrendingUp,    color: 'text-blue-400',    border: 'border-blue-700/50',    bg: 'bg-blue-900/30' },
                    { label: 'FX Swaps',       desc: 'Near / Far legs',   view: 'SWAPS'       as ViewState, icon: ArrowLeftRight, color: 'text-purple-400',  border: 'border-purple-700/50',  bg: 'bg-purple-900/30' },
                    { label: 'Bandes BKAM',    desc: 'Cage ±5%',         view: 'BANDS'       as ViewState, icon: BarChart2,      color: 'text-gold-400',    border: 'border-gold-700/50',    bg: 'bg-yellow-900/20' },
                    { label: 'Market Report',  desc: 'Analyse IA',        view: 'REPORT'      as ViewState, icon: Newspaper,      color: 'text-emerald-400', border: 'border-emerald-700/50', bg: 'bg-emerald-900/30' },
                    { label: 'Réglementation', desc: 'Office des Changes', view: 'REGULATIONS' as ViewState, icon: Scale,          color: 'text-amber-400',   border: 'border-amber-700/50',   bg: 'bg-amber-900/25' },
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
                    <div key={news.id} className="px-5 py-4 hover:bg-navy-800/40 transition-colors cursor-default">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-gold-500 bg-gold-500/10 border border-gold-500/25 px-2.5 py-0.5 rounded-full">
                          {news.category}
                        </span>
                      </div>
                      <h4 className="text-[14px] font-semibold text-slate-100 mb-1.5 leading-snug">{news.title}</h4>
                      <p className="text-[12px] text-slate-400 line-clamp-3 leading-relaxed">{news.summary}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-4">

                {/* Advisory card */}
                <div className="bg-navy-900 border border-navy-700 rounded-2xl p-5 flex flex-col items-center text-center gap-4">
                  <Jad2Logo width={120} showAdvisory={true} />
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
                    Conseil et formation · non intermédiaire financier agréé BAM.
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
                    <div key={stat.label} className="bg-navy-900 border border-navy-700 rounded-xl p-3.5 text-center">
                      <p className={`text-xl font-bold font-mono tabular-nums ${stat.color}`}>{stat.value}</p>
                      <p className="text-[11px] text-slate-300 font-semibold mt-0.5">{stat.label}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{stat.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Market Radar — full width */}
            <MarketRadar tickerRates={tickerRates} />
          </div>
        )}

        {/* ─── DASHBOARD ─────────────────────────────────────────────────── */}
        {view === 'DASHBOARD' && (
          <div className="space-y-6">
            <FxDashboard />
            <CurrencyHeatmap rates={tickerRates} />
          </div>
        )}

        {/* ─── Other views ───────────────────────────────────────────────── */}
        {view === 'ANALYSIS'    && <MarketAnalysis />}
        {view === 'FIXING'      && <BkamFixing />}
        {view === 'BILLETS'     && <BilletsPage />}
        {view === 'COMMODITIES' && <CommoditiesPage />}
        {view === 'REPORT'      && <MarketReportPage />}
        {view === 'REGULATIONS' && <RegulationsPage />}
        {view === 'FORWARDS'    && <ForwardCalculator />}
        {view === 'SWAPS'       && <SwapSimulator />}
        {view === 'BANDS'       && <BkamBandsVisualizer />}
        {view === 'RESOURCES'   && <ResourcesPage />}

        {view === 'LIVE' && (
          <div className="space-y-6">
            <MarketSessionsClock />
            <LivePricer />
            <CurrencyHeatmap rates={tickerRates} />
            <FxCrossMatrix rates={tickerRates} />
          </div>
        )}

        {view === 'ADMIN' && <AdminDashboard />}

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
                <Jad2Logo width={110} showAdvisory={true} />
                <div className="border-l border-navy-700 pl-4">
                  <h2 className="text-2xl font-bold text-white tracking-[0.18em] uppercase font-serif">JAD2FX</h2>
                  <p className="text-[10px] text-gold-500 tracking-wider mt-0.5">Outil de Données de Change — by JAD2 Advisory</p>
                </div>
              </div>

              <div className="space-y-4 text-navy-300 text-[13px] leading-relaxed">
                <p>
                  <strong className="text-slate-200">JAD2FX</strong> est l'outil en ligne de données de change et de simulation pédagogique
                  de <strong className="text-slate-200">JAD2 Advisory</strong>. Il permet aux entreprises et professionnels marocains de
                  comprendre les dynamiques du marché des changes MAD et la réglementation de l'Office des Changes.
                </p>
                <p>
                  Cet outil ne constitue pas un conseil en investissement.{' '}
                  <strong className="text-slate-200">JAD2FX n'est pas agréé par l'AMMC ni par Bank Al-Maghrib</strong>.
                  Pour l'exécution de transactions, adressez-vous à un établissement de crédit agréé.
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
                    ⚠️ <strong className="text-amber-300">JAD2 Advisory n'est pas un intermédiaire financier agréé par Bank Al-Maghrib</strong>{' '}
                    et n'exécute aucune transaction de change. Nos prestations sont exclusivement du conseil et de la formation.
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
      </main>

      {/* ══ Floating chatbot ═════════════════════════════════════════════════ */}
      <FloatingChat />

      {/* ══ Footer ═══════════════════════════════════════════════════════════ */}
      <footer className="bg-navy-900 text-slate-400 border-t border-navy-700 mt-auto">
        {/* Advisory CTA */}
        <div className="border-b border-navy-800 py-4">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-white">Formation & Conseil en Gestion du Risque de Change</p>
              <p className="text-xs text-slate-400">Cabinet de conseil · Formation · Accompagnement réglementaire OC · Non intermédiaire financier</p>
            </div>
            <a
              href="https://jad2advisory.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 px-5 py-2 bg-gold-500 text-navy-950 text-sm font-bold rounded hover:bg-gold-400 transition-colors"
            >
              JAD2 Advisory →
            </a>
          </div>
        </div>

        {/* Legal */}
        <div className="py-5">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 text-center">
            <p className="text-xs leading-relaxed max-w-3xl mx-auto text-slate-500">{DISCLAIMER_TEXT}</p>
            <div className="flex flex-wrap justify-center gap-3 mt-3 text-xs text-slate-500">
              <span>ECB / Frankfurter</span>
              <span className="text-slate-700">·</span>
              <span>Yahoo Finance</span>
              <span className="text-slate-700">·</span>
              <span>Twelve Data</span>
              <span className="text-slate-700">·</span>
              <span>BKAM Fixing</span>
              <span className="text-slate-700">·</span>
              <a href="https://jad2advisory.com" target="_blank" rel="noopener noreferrer" className="text-gold-600 hover:text-gold-400 transition-colors">
                jad2advisory.com
              </a>
            </div>
            <p className="text-xs mt-2 text-slate-600 italic">
              Market data from Yahoo Finance / Twelve Data for educational purposes only. Not for commercial trading.
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
    <ThemeProvider>
      <I18nProvider>
        <AdminProvider>
          <AppInner />
        </AdminProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
