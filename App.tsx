import React, { useEffect, useState } from 'react';
import { ViewState, LiveRate } from './types';
import { DEFAULT_BASKET_CONFIG, MARKET_NEWS, DISCLAIMER_TEXT, DISCLAIMER_SHORT } from './constants';
import { fetchAllMadRates } from './services/fxRates';
import FxDashboard        from './components/FxDashboard';
import ChatInterface      from './components/ChatInterface';
import MarketAnalysis     from './components/MarketAnalysis';
import RatesTicker        from './components/RatesTicker';
import ForwardCalculator  from './components/ForwardCalculator';
import SwapSimulator      from './components/SwapSimulator';
import LivePricer         from './components/LivePricer';
import AdminDashboard     from './components/AdminDashboard';
import BkamFixing         from './components/BkamFixing';
import BilletsPage        from './components/BilletsPage';
import CommoditiesPage    from './components/CommoditiesPage';
import { AdminProvider }  from './context/AdminContext';
import { I18nProvider, useI18n, Locale } from './context/I18nContext';
import {
  Building2, FileText, LayoutDashboard, Menu, Shield,
  Globe, ChevronRight, TrendingUp, ArrowLeftRight, Activity,
  Lock, X, BarChart2, Banknote, PackageOpen,
} from 'lucide-react';

// ─── Determines whether a view uses dark terminal bg ─────────────────────────

const TERMINAL_VIEWS: ViewState[] = ['FORWARDS', 'SWAPS', 'LIVE', 'ADMIN'];

// ─── Inner app (needs AdminProvider context) ──────────────────────────────────

function AppInner() {
  const [view, setView]             = useState<ViewState>('HOME');
  const [tickerRates, setTickerRates] = useState<LiveRate[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t, locale, setLocale, isRTL } = useI18n();

  const isDark = TERMINAL_VIEWS.includes(view);

  useEffect(() => {
    fetchAllMadRates(DEFAULT_BASKET_CONFIG)
      .then(({ rates }) => setTickerRates(rates))
      .catch(() => {});
  }, []);

  const navTo = (v: ViewState) => { setView(v); setMobileOpen(false); };

  // ── Nav items ─────────────────────────────────────────────────────────────

  const NAV_ITEMS: { label: string; view: ViewState; icon: React.ElementType }[] = [
    { label: t('nav.home'),        view: 'HOME',        icon: Globe },
    { label: t('nav.dashboard'),   view: 'DASHBOARD',   icon: LayoutDashboard },
    { label: t('nav.analysis'),    view: 'ANALYSIS',    icon: FileText },
    { label: t('nav.fixing'),      view: 'FIXING',      icon: BarChart2 },
    { label: t('nav.billets'),     view: 'BILLETS',     icon: Banknote },
    { label: t('nav.commodities'), view: 'COMMODITIES', icon: PackageOpen },
    { label: t('nav.forwards'),    view: 'FORWARDS',    icon: TrendingUp },
    { label: t('nav.swaps'),       view: 'SWAPS',       icon: ArrowLeftRight },
    { label: t('nav.live'),        view: 'LIVE',        icon: Activity },
    { label: t('nav.admin'),       view: 'ADMIN',       icon: Lock },
    { label: t('nav.about'),       view: 'ABOUT',       icon: Building2 },
  ];

  const LOCALE_OPTIONS: { code: Locale; label: string }[] = [
    { code: 'fr', label: 'FR' },
    { code: 'en', label: 'EN' },
    { code: 'ar', label: 'عر' },
  ];

  return (
    <div
      className={`min-h-screen flex flex-col font-sans ${isDark ? 'bg-[#070F1A] text-slate-200' : 'bg-slate-50 text-slate-800'}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >

      {/* ── Navbar ── */}
      <nav className="bg-navy-900 sticky top-0 z-50 border-b border-navy-800 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer flex-shrink-0" onClick={() => navTo('HOME')}>
              <div className="w-9 h-9 bg-gradient-to-br from-gold-400 to-gold-600 rounded flex items-center justify-center shadow-lg">
                <span className="font-serif font-bold text-navy-900 text-xl">J</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="font-bold text-white tracking-widest leading-none text-base uppercase">JAD2FX</h1>
                <p className="text-[10px] text-gold-500 tracking-widest">by JAD2 Advisory</p>
              </div>
            </div>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center space-x-0 overflow-x-auto">
              {NAV_ITEMS.map(item => (
                <button
                  key={item.view}
                  onClick={() => navTo(item.view)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                    view === item.view
                      ? 'text-gold-400 border-b-2 border-gold-500'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <item.icon size={13} />
                  {item.label}
                </button>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* Language switcher */}
              <div className="hidden sm:flex items-center rounded border border-navy-700 overflow-hidden">
                {LOCALE_OPTIONS.map(opt => (
                  <button
                    key={opt.code}
                    onClick={() => setLocale(opt.code)}
                    className={`px-2.5 py-1 text-[10px] font-bold tracking-wider transition ${
                      locale === opt.code
                        ? 'bg-gold-500 text-navy-900'
                        : 'text-slate-400 hover:text-white hover:bg-navy-800'
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
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-gold-500 text-navy-900 rounded hover:bg-gold-400 transition"
              >
                {t('nav.advisory')}
              </a>
              <button
                onClick={() => navTo('ADMIN')}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 border border-navy-700 rounded hover:text-white hover:border-navy-500 transition"
              >
                <Lock size={11} />
                {t('nav.admin')}
              </button>
              <button
                className="lg:hidden text-slate-300 hover:text-white p-1"
                onClick={() => setMobileOpen(o => !o)}
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-navy-800 bg-navy-900">
            {NAV_ITEMS.map(item => (
              <button
                key={item.view}
                onClick={() => navTo(item.view)}
                className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium text-left transition-colors ${
                  view === item.view
                    ? 'text-gold-400 bg-navy-800'
                    : 'text-slate-300 hover:text-white hover:bg-navy-800/50'
                }`}
              >
                <item.icon size={15} />
                {item.label}
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* ── Compliance Banner ── */}
      <div className="bg-navy-900/60 border-b border-navy-700/40 px-4 py-1 text-center">
        <p className="text-[10px] text-slate-500 tracking-wide">
          {DISCLAIMER_SHORT}
        </p>
      </div>

      {/* ── Ticker ── */}
      <RatesTicker rates={tickerRates} />

      {/* ── Main content ── */}
      <main className={`flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${
        isDark ? 'text-slate-200' : ''
      }`}>

        {/* HOME */}
        {view === 'HOME' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Hero */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-navy-900 p-8 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500 opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
                  <div className="relative z-10">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {['Simulation Pédagogique', 'Données Indicatives', 'Réglementation OC'].map(t => (
                        <span key={t} className="text-[10px] bg-gold-500/10 border border-gold-500/30 text-gold-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          {t}
                        </span>
                      ))}
                    </div>
                    <h2 className="text-3xl font-bold mb-2 tracking-widest uppercase">JAD2FX</h2>
                    <p className="text-gold-500 text-xs uppercase tracking-widest mb-4">Outil de Données de Change — by JAD2 Advisory</p>
                    <p className="text-slate-300 mb-6 max-w-lg text-sm">
                      Données indicatives sur les 14 devises cotées par Bank Al-Maghrib, simulateur pédagogique de forwards/swaps et référentiel réglementaire Office des Changes.
                    </p>
                    <div className="text-[10px] text-slate-400 border border-navy-600/40 rounded px-3 py-1.5 mb-4 inline-block">
                      Données indicatives à titre de référence — Pour conseil : <span className="text-gold-400">jad2advisory.com</span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => navTo('LIVE')}
                        className="flex items-center gap-2 bg-gold-500 text-navy-900 font-bold text-sm px-4 py-2 rounded hover:bg-gold-400 transition"
                      >
                        <Activity size={15} /> Live Pricer
                      </button>
                      <button
                        onClick={() => navTo('FORWARDS')}
                        className="flex items-center gap-2 text-gold-400 font-bold text-sm hover:text-white transition"
                      >
                        Forward Calculator <ChevronRight size={15} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick-access strip */}
                <div className="grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100">
                  {[
                    { label: 'FX Forwards', desc: 'CIP calculator', view: 'FORWARDS' as ViewState, icon: TrendingUp },
                    { label: 'FX Swaps',    desc: 'Near/Far legs',  view: 'SWAPS'    as ViewState, icon: ArrowLeftRight },
                    { label: 'FX Tableau',  desc: '14 BKAM pairs',  view: 'DASHBOARD' as ViewState, icon: LayoutDashboard },
                  ].map(item => (
                    <button
                      key={item.view}
                      onClick={() => navTo(item.view)}
                      className="flex items-center gap-3 p-4 hover:bg-slate-50 transition text-left group"
                    >
                      <item.icon size={18} className="text-gold-600 group-hover:scale-110 transition-transform flex-shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-navy-900">{item.label}</p>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* News Feed */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-serif font-bold text-navy-900 mb-6 flex items-center gap-2">
                  <Globe size={18} className="text-gold-600" /> Latest Intelligence
                </h3>
                <div className="space-y-6">
                  {MARKET_NEWS.map(news => (
                    <div key={news.id} className="group cursor-pointer border-b border-slate-100 pb-6 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gold-600 bg-gold-50 px-2 py-0.5 rounded-full">
                          {news.category}
                        </span>
                        <span className="text-xs text-slate-400">{news.time}</span>
                      </div>
                      <h4 className="text-lg font-semibold text-navy-900 group-hover:text-gold-600 transition mb-1">
                        {news.title}
                      </h4>
                      <p className="text-sm text-slate-600 line-clamp-2">{news.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar: Chatbot */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                <ChatInterface />
                <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm text-center">
                  <p className="text-sm font-semibold text-navy-900 mb-1">Besoin d'un conseil FX structuré?</p>
                  <p className="text-xs text-slate-500 mb-3">Forwards, couvertures, rapatriement de fonds — expertise JAD2 Advisory</p>
                  <a
                    href="https://jad2advisory.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-2 bg-gold-500 text-navy-900 text-xs font-bold rounded hover:bg-gold-400 transition"
                  >
                    Contacter JAD2 Advisory →
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'DASHBOARD'   && <FxDashboard />}
        {view === 'ANALYSIS'    && <MarketAnalysis />}
        {view === 'FIXING'      && <BkamFixing />}
        {view === 'BILLETS'     && <BilletsPage />}
        {view === 'COMMODITIES' && <CommoditiesPage />}

        {/* Terminal views — dark panel wrapper */}
        {TERMINAL_VIEWS.includes(view) && (
          <div>
            {view === 'FORWARDS' && <ForwardCalculator />}
            {view === 'SWAPS'    && <SwapSimulator />}
            {view === 'LIVE'     && <LivePricer />}
            {view === 'ADMIN'    && <AdminDashboard />}
          </div>
        )}

        {view === 'ABOUT' && (
          <div className="max-w-3xl mx-auto space-y-5">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-gold-400 to-gold-600 rounded flex items-center justify-center">
                  <span className="font-bold text-navy-900 text-lg">J</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-navy-900 tracking-widest uppercase">JAD2FX</h2>
                  <p className="text-xs text-gold-600 tracking-wider">Outil de Données de Change — by JAD2 Advisory</p>
                </div>
              </div>

              <div className="space-y-4 text-slate-700 text-sm">
                <p>
                  <strong>JAD2FX</strong> est l'outil en ligne de données de change et de simulation pédagogique de <strong>JAD2 Advisory</strong>. Il est conçu pour permettre aux entreprises et professionnels marocains de comprendre les dynamiques du marché des changes MAD et la réglementation de l'Office des Changes.
                </p>
                <p>
                  Cet outil ne constitue pas et ne doit pas être interprété comme un conseil en investissement, une recommandation d'achat ou de vente de devises, ni une offre de service de change. <strong>JAD2FX n'est pas agréé par l'AMMC ni par Bank Al-Maghrib</strong> pour la prestation de services d'investissement ou de change.
                </p>

                <h3 className="text-base font-bold text-navy-900 mt-5">Fonctionnalités</h3>
                <ul className="space-y-1.5">
                  {[
                    'Données indicatives sur les 14 devises officiellement cotées par BKAM contre le MAD',
                    'Simulateur pédagogique de forwards (formule CIP) et de swaps de change',
                    'Référentiel de la réglementation de l\'Office des Changes (circulaires, instructions)',
                    'Courbes de taux interpolées à titre informatif uniquement',
                    'Toutes les simulations sont illustratives et ne constituent pas des devis contraignants',
                  ].map(f => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="text-gold-600 mt-0.5 flex-shrink-0">▸</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <h3 className="text-base font-bold text-navy-900 mt-5">JAD2 Advisory</h3>
                <p>
                  Pour des besoins de conseil personnalisé en matière de couverture de change, de structuration d'opérations, ou d'accompagnement réglementaire Office des Changes, veuillez contacter notre équipe de conseillers.
                </p>
                <a
                  href="https://jad2advisory.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-5 py-2.5 bg-gold-500 text-navy-900 font-bold text-sm rounded hover:bg-gold-400 transition"
                >
                  Visiter jad2advisory.com →
                </a>

                <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <p className="text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">Note d'information</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{DISCLAIMER_TEXT}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="bg-navy-900 text-slate-400 border-t border-navy-800">
        {/* Advisory CTA strip */}
        <div className="bg-gold-500/10 border-b border-gold-600/20 py-4">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-white">{t('footer.advisory')}</p>
              <p className="text-xs text-slate-400">{t('footer.advisoryDesc')}</p>
            </div>
            <a
              href="https://jad2advisory.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 px-5 py-2 bg-gold-500 text-navy-900 text-sm font-bold rounded hover:bg-gold-400 transition"
            >
              {t('footer.cta')}
            </a>
          </div>
        </div>

        {/* Legal disclaimer */}
        <div className="py-5">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-[10px] leading-relaxed max-w-3xl mx-auto text-slate-600">{DISCLAIMER_TEXT}</p>
            <div className="flex flex-wrap justify-center gap-4 mt-3 text-[10px] text-slate-700">
              <span>ECB/Frankfurter · Yahoo Finance</span>
              <span>·</span>
              <a href="https://jad2advisory.com" target="_blank" rel="noopener noreferrer" className="text-gold-600 hover:text-gold-400">jad2advisory.com</a>
            </div>
            <p className="text-[10px] mt-4 text-slate-600">{t('footer.copyright')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── Root export ─────────────────────────────────────────────────────────────

export default function App() {
  return (
    <I18nProvider>
      <AdminProvider>
        <AppInner />
      </AdminProvider>
    </I18nProvider>
  );
}
