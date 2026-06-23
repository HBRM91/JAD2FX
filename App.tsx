import React, { useEffect, useState } from 'react';
import { ViewState, LiveRate } from './types';
import { DEFAULT_BASKET_CONFIG, MARKET_NEWS, DISCLAIMER_TEXT } from './constants';
import { fetchAllMadRates } from './services/fxRates';
import FxDashboard        from './components/FxDashboard';
import ChatInterface      from './components/ChatInterface';
import MarketAnalysis     from './components/MarketAnalysis';
import RatesTicker        from './components/RatesTicker';
import ForwardCalculator  from './components/ForwardCalculator';
import SwapSimulator      from './components/SwapSimulator';
import LivePricer         from './components/LivePricer';
import AdminDashboard     from './components/AdminDashboard';
import { AdminProvider }  from './context/AdminContext';
import {
  Building2, FileText, LayoutDashboard, Menu, Shield,
  Globe, ChevronRight, TrendingUp, ArrowLeftRight, Activity,
  Lock, X,
} from 'lucide-react';

// ─── Determines whether a view uses dark terminal bg ─────────────────────────

const TERMINAL_VIEWS: ViewState[] = ['FORWARDS', 'SWAPS', 'LIVE', 'ADMIN'];

// ─── Inner app (needs AdminProvider context) ──────────────────────────────────

function AppInner() {
  const [view, setView]             = useState<ViewState>('HOME');
  const [tickerRates, setTickerRates] = useState<LiveRate[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isDark = TERMINAL_VIEWS.includes(view);

  useEffect(() => {
    fetchAllMadRates(DEFAULT_BASKET_CONFIG)
      .then(({ rates }) => setTickerRates(rates))
      .catch(() => {});
  }, []);

  const navTo = (v: ViewState) => { setView(v); setMobileOpen(false); };

  // ── Nav items ─────────────────────────────────────────────────────────────

  const NAV_ITEMS: { label: string; view: ViewState; icon: React.ElementType }[] = [
    { label: 'Actualités',   view: 'HOME',      icon: Globe },
    { label: 'Taux FX',     view: 'DASHBOARD', icon: LayoutDashboard },
    { label: 'Analyses',    view: 'ANALYSIS',  icon: FileText },
    { label: 'Forwards',    view: 'FORWARDS',  icon: TrendingUp },
    { label: 'FX Swaps',    view: 'SWAPS',     icon: ArrowLeftRight },
    { label: 'Live Pricer', view: 'LIVE',      icon: Activity },
    { label: 'Admin',       view: 'ADMIN',     icon: Lock },
    { label: 'À Propos',    view: 'ABOUT',     icon: Building2 },
  ];

  return (
    <div className={`min-h-screen flex flex-col font-sans ${isDark ? 'bg-[#070F1A] text-slate-200' : 'bg-slate-50 text-slate-800'}`}>

      {/* ── Navbar ── */}
      <nav className="bg-navy-900 sticky top-0 z-50 border-b border-navy-800 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer flex-shrink-0" onClick={() => navTo('HOME')}>
              <div className="w-9 h-9 bg-gradient-to-br from-gold-400 to-gold-600 rounded flex items-center justify-center shadow-lg">
                <span className="font-serif font-bold text-navy-900 text-xl">K</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="font-serif text-lg font-bold text-white tracking-wide leading-none">Khouya FX</h1>
                <p className="text-[10px] text-gold-500 uppercase tracking-widest">Financial Intelligence</p>
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
            <div className="flex items-center gap-3">
              <button
                onClick={() => navTo('ADMIN')}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-gold-500 text-navy-900 rounded hover:bg-gold-400 transition"
              >
                <Lock size={11} />
                Admin
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
                      {['FX Forwards', 'Swaps', 'Live Pricer'].map(t => (
                        <span key={t} className="text-[10px] bg-gold-500/10 border border-gold-500/30 text-gold-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          {t}
                        </span>
                      ))}
                    </div>
                    <h2 className="text-3xl font-serif font-bold mb-4">Institutional FX Intelligence</h2>
                    <p className="text-slate-300 mb-6 max-w-lg text-sm">
                      Full-spectrum FX platform: live BKAM rates, CIP forward pricing, swap simulation, yield curve management — all 14 MAD pairs.
                    </p>
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
                  <p className="text-sm font-semibold text-navy-900 mb-2">Need Custom Hedging?</p>
                  <button className="w-full py-2 bg-navy-900 text-white text-xs font-bold rounded hover:bg-navy-800 transition">
                    Contact Our Experts
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'DASHBOARD' && <FxDashboard />}
        {view === 'ANALYSIS'  && <MarketAnalysis />}

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
          <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-3xl font-serif font-bold text-navy-900 mb-6">About Khouya FX</h2>
            <div className="prose prose-slate space-y-4 text-slate-700">
              <p>
                Khouya FX is a private initiative founded by a collective of Moroccan financial experts and former banking executives. Our mission is to democratize access to institutional-grade foreign exchange data and regulatory clarity.
              </p>
              <p>
                We operate with a commitment to <strong>transparency</strong> and <strong>education</strong>, working in alignment with the overarching goals of financial inclusion promoted by national authorities.
              </p>
              <h3 className="text-xl font-serif font-bold text-navy-900 mt-6">Platform Features</h3>
              <ul className="space-y-1 text-sm">
                {[
                  'Live BKAM FX rates — all 14 official MAD pairs (EUR, USD, GBP, CHF, JPY, CAD, DKK, NOK, SEK, SAR, AED, KWD, QAR, CNY)',
                  'FX Forward Calculator — CIP formula with natural cubic spline yield curve interpolation',
                  'FX Swap Simulator — near/far leg pricing, rollover & roll-under events',
                  'Near-live price streaming — bid/ask with configurable refresh interval',
                  'Admin Terminal — Bloomberg-style control panel for rate overrides and curve management',
                  'RAG Chatbot — Office des Changes regulatory intelligence',
                ].map(f => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="text-gold-600 mt-0.5">▸</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-slate-500 mt-8 border-t border-slate-100 pt-4">
                Khouya FX uses open data from Bank Al-Maghrib and the Office des Changes. We are an independent entity and not affiliated with any specific bank. All rates are indicative.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="bg-navy-900 text-slate-400 py-8 border-t border-navy-800">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
            <Shield size={16} />
            <span className="text-xs font-bold uppercase tracking-widest text-white">Compliance & Security</span>
          </div>
          <p className="text-[10px] leading-relaxed max-w-2xl mx-auto opacity-70">{DISCLAIMER_TEXT}</p>
          <p className="text-[10px] mt-4 opacity-50">© 2025 Khouya FX · Casablanca, Morocco</p>
        </div>
      </footer>
    </div>
  );
}

// ─── Root export (wraps with AdminProvider) ───────────────────────────────────

export default function App() {
  return (
    <AdminProvider>
      <AppInner />
    </AdminProvider>
  );
}
