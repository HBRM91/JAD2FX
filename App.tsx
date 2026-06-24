import React, { useEffect, useState } from 'react';
import { ViewState, LiveRate } from './types';
import { DEFAULT_BASKET_CONFIG, MARKET_NEWS, DISCLAIMER_TEXT, DISCLAIMER_SHORT } from './constants';
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
import FloatingChat       from './components/FloatingChat';
import Jad2Logo           from './components/Jad2Logo';
import MarketSessionsClock from './components/MarketSessionsClock';
import CurrencyHeatmap   from './components/CurrencyHeatmap';
import FxCrossMatrix      from './components/FxCrossMatrix';
import { AdminProvider }  from './context/AdminContext';
import { I18nProvider, useI18n, Locale } from './context/I18nContext';
import {
  Building2, FileText, LayoutDashboard, Menu, Shield,
  Globe, ChevronRight, TrendingUp, ArrowLeftRight, Activity,
  Lock, X, BarChart2, Banknote, PackageOpen, Newspaper,
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
    { label: t('nav.report'),      view: 'REPORT',      icon: Newspaper },
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
              <Jad2Logo width={80} showAdvisory={false} className="hidden sm:block" />
              {/* Mobile: compact "J2" mark */}
              <div className="sm:hidden w-9 h-9 bg-gradient-to-br from-gold-500 to-gold-700 rounded flex items-center justify-center shadow-lg">
                <span className="font-serif font-bold text-navy-900 text-base">J2</span>
              </div>
              <div className="hidden sm:block border-l border-navy-700 pl-3">
                <h1 className="font-bold text-white tracking-widest leading-none text-sm uppercase">JAD2FX</h1>
                <p className="text-[10px] text-slate-500 tracking-wider">Outil de données de change</p>
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
                      Données indicatives sur 20 devises (14 cotées BKAM + 6 régionales), simulateur pédagogique de forwards/swaps et référentiel réglementaire Office des Changes.
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
                    { label: 'FX Tableau',  desc: '20 devises',  view: 'DASHBOARD' as ViewState, icon: LayoutDashboard },
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

            {/* Sidebar: JAD2 Advisory card */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                {/* Brand card */}
                <div className="bg-navy-900 rounded-xl p-6 flex flex-col items-center text-center gap-4 shadow-xl border border-navy-700">
                  <Jad2Logo width={130} showAdvisory={true} />
                  <div>
                    <p className="text-xs font-bold text-white mb-1 uppercase tracking-wider">Cabinet de Conseil Stratégique</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Formation en gestion du risque de change · Conseil stratégique · Accompagnement réglementaire Office des Changes
                    </p>
                  </div>
                  <a
                    href="https://jad2advisory.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-2.5 bg-gold-500 text-navy-900 text-xs font-bold rounded hover:bg-gold-400 transition"
                  >
                    jad2advisory.com →
                  </a>
                  <p className="text-[9px] text-slate-600 leading-relaxed">
                    JAD2 Advisory est un cabinet de conseil et de formation, non un intermédiaire financier agréé par Bank Al-Maghrib.
                  </p>
                </div>

                {/* Chatbot hint */}
                <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm text-center">
                  <p className="text-sm font-semibold text-navy-900 mb-1">Assistant Réglementaire</p>
                  <p className="text-xs text-slate-500 mb-3">Posez vos questions OC & BKAM via le bouton flottant en bas à droite</p>
                  <div className="flex items-center justify-center gap-2 text-xs text-gold-600 font-bold">
                    <span>💬</span> Cliquez sur l'icône chat →
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'DASHBOARD'   && (
          <div className="space-y-6">
            <FxDashboard />
            <CurrencyHeatmap rates={tickerRates} />
          </div>
        )}
        {view === 'ANALYSIS'    && <MarketAnalysis />}
        {view === 'FIXING'      && <BkamFixing />}
        {view === 'BILLETS'     && <BilletsPage />}
        {view === 'COMMODITIES' && <CommoditiesPage />}
        {view === 'REPORT'      && <MarketReportPage />}

        {/* Terminal views — dark panel wrapper */}
        {TERMINAL_VIEWS.includes(view) && (
          <div>
            {view === 'FORWARDS' && <ForwardCalculator />}
            {view === 'SWAPS'    && <SwapSimulator />}
            {view === 'LIVE'     && (
              <div className="space-y-6">
                <MarketSessionsClock />
                <LivePricer />
                <CurrencyHeatmap rates={tickerRates} />
                <FxCrossMatrix rates={tickerRates} />
              </div>
            )}
            {view === 'ADMIN'    && <AdminDashboard />}
          </div>
        )}

        {view === 'ABOUT' && (
          <div className="max-w-3xl mx-auto space-y-5">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-4 mb-6">
                <Jad2Logo width={110} showAdvisory={true} />
                <div className="border-l border-slate-200 pl-4">
                  <h2 className="text-2xl font-bold text-navy-900 tracking-widest uppercase">JAD2FX</h2>
                  <p className="text-xs text-gold-600 tracking-wider">Outil de Données de Change — by JAD2 Advisory</p>
                </div>
              </div>

              <div className="space-y-4 text-slate-700 text-sm">
                <p>
                  <strong>JAD2FX</strong> est l'outil en ligne de données de change et de simulation pédagogique de <strong>JAD2 Advisory</strong>. Il est conçu pour permettre aux entreprises et professionnels marocains de comprendre les dynamiques du marché des changes MAD et la réglementation de l'Office des Changes.
                </p>
                <p>
                  Cet outil ne constitue pas et ne doit pas être interprété comme un conseil en investissement, une recommandation d'achat ou de vente de devises, ni une offre de service de change. <strong>JAD2FX n'est pas agréé par l'AMMC ni par Bank Al-Maghrib</strong> pour la prestation de services d'investissement ou de change. Pour l'exécution de transactions de change, adressez-vous à un établissement de crédit agréé.
                </p>

                <h3 className="text-base font-bold text-navy-900 mt-5">Fonctionnalités</h3>
                <ul className="space-y-1.5">
                  {[
                    'Données indicatives sur 20 devises (14 cotées BKAM + 6 régionales calculées par taux croisés)',
                    'Simulateur pédagogique de forwards (formule CIP) et de swaps de change',
                    'Référentiel de la réglementation de l\'Office des Changes (circulaires, instructions)',
                    'Courbes de taux interpolées à titre informatif et pédagogique uniquement',
                    'Toutes les simulations sont illustratives et ne constituent pas des devis contraignants',
                  ].map(f => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="text-gold-600 mt-0.5 flex-shrink-0">▸</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <h3 className="text-base font-bold text-navy-900 mt-5">JAD2 Advisory — Cabinet de Conseil Stratégique & Formation</h3>
                <p>
                  JAD2 Advisory est un cabinet de conseil stratégique et de formation en gestion du risque de change, enregistré au Registre de Commerce de Casablanca. Nos services incluent la formation des équipes financières, le conseil en stratégie de couverture et l'accompagnement réglementaire Office des Changes.
                </p>
                <p className="text-xs text-slate-500 bg-amber-50 border border-amber-100 rounded p-3">
                  ⚠️ <strong>JAD2 Advisory n'est pas un intermédiaire financier agréé par Bank Al-Maghrib</strong> et n'exécute aucune transaction de change. Nos prestations sont exclusivement des services de conseil stratégique et de formation.
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
                  <p className="text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">Mentions Légales & Conformité</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{DISCLAIMER_TEXT}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Floating chatbot widget (visible on all views) ── */}
      <FloatingChat />

      {/* ── Footer ── */}
      <footer className="bg-navy-900 text-slate-400 border-t border-navy-800">
        {/* Advisory CTA strip */}
        <div className="bg-gold-500/10 border-b border-gold-600/20 py-4">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-white">Formation & Conseil Stratégique en Gestion du Risque de Change</p>
              <p className="text-xs text-slate-400">Cabinet de conseil stratégique · Formation · Accompagnement réglementaire OC — <em>Non intermédiaire financier</em></p>
            </div>
            <a
              href="https://jad2advisory.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 px-5 py-2 bg-gold-500 text-navy-900 text-sm font-bold rounded hover:bg-gold-400 transition"
            >
              JAD2 Advisory →
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
