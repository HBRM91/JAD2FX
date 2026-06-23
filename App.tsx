import React, { useEffect, useState } from 'react';
import { ViewState, LiveRate } from './types';
import { DEFAULT_BASKET_CONFIG, MARKET_NEWS, DISCLAIMER_TEXT } from './constants';
import { fetchAllMadRates } from './services/fxRates';
import FxDashboard from './components/FxDashboard';
import ChatInterface from './components/ChatInterface';
import MarketAnalysis from './components/MarketAnalysis';
import RatesTicker from './components/RatesTicker';
import { Building2, FileText, LayoutDashboard, Menu, Shield, Globe, ChevronRight } from 'lucide-react';

function App() {
  const [view, setView] = useState<ViewState>('HOME');
  const [tickerRates, setTickerRates] = useState<LiveRate[]>([]);

  useEffect(() => {
    // Fetch rates for the ticker on app load
    fetchAllMadRates(DEFAULT_BASKET_CONFIG).then(({ rates }) => setTickerRates(rates));
  }, []);

  const NavItem = ({ label, targetView, icon: Icon }: { label: string; targetView: ViewState; icon: React.ElementType }) => (
    <button
      onClick={() => setView(targetView)}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
        view === targetView ? 'text-gold-500' : 'text-slate-300 hover:text-white'
      }`}
    >
      {Icon && <Icon size={16} />}
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">

      {/* Top Navbar */}
      <nav className="bg-navy-900 sticky top-0 z-50 border-b border-navy-800 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('HOME')}>
              <div className="w-9 h-9 bg-gradient-to-br from-gold-400 to-gold-600 rounded flex items-center justify-center shadow-lg">
                <span className="font-serif font-bold text-navy-900 text-xl">K</span>
              </div>
              <div>
                <h1 className="font-serif text-lg font-bold text-white tracking-wide leading-none">Khouya FX</h1>
                <p className="text-[10px] text-gold-500 uppercase tracking-widest">Financial Intelligence</p>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-1">
              <NavItem label="News & Feed"         targetView="HOME"      icon={Globe} />
              <NavItem label="FX Tableau de Bord"  targetView="DASHBOARD" icon={LayoutDashboard} />
              <NavItem label="Analyses"            targetView="ANALYSIS"  icon={FileText} />
              <NavItem label="À Propos"            targetView="ABOUT"     icon={Building2} />
            </div>

            <div className="flex items-center gap-4">
              <button className="hidden md:block px-4 py-1.5 text-xs font-bold bg-gold-500 text-navy-900 rounded hover:bg-gold-400 transition">
                Client Portal
              </button>
              <button className="md:hidden text-white"><Menu /></button>
            </div>
          </div>
        </div>
      </nav>

      {/* Live Rates Ticker */}
      <RatesTicker rates={tickerRates} />

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {view === 'HOME' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Hero */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-navy-900 p-8 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500 opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
                  <h2 className="text-3xl font-serif font-bold mb-4 relative z-10">Market Insight: EUR/MAD Strategy</h2>
                  <p className="text-slate-300 mb-6 max-w-lg relative z-10">
                    Bank Al-Maghrib's basket model (60% EUR / 40% USD) drives the daily fixing. Live rates for all 14 BKAM-quoted currencies, updated every 5 minutes.
                  </p>
                  <button
                    onClick={() => setView('DASHBOARD')}
                    className="flex items-center gap-2 text-gold-400 font-bold text-sm hover:text-white transition"
                  >
                    Open FX Dashboard <ChevronRight size={16} />
                  </button>
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

        {view === 'ABOUT' && (
          <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-3xl font-serif font-bold text-navy-900 mb-6">About Khouya FX</h2>
            <div className="prose prose-slate">
              <p>
                Khouya FX is a private initiative founded by a collective of Moroccan financial experts and former banking executives. Our mission is to democratize access to institutional-grade foreign exchange data and regulatory clarity.
              </p>
              <p>
                We operate with a commitment to <strong>transparency</strong> and <strong>education</strong>, working in alignment with the overarching goals of financial inclusion promoted by national authorities.
              </p>
              <p className="text-xs text-slate-500 mt-8 border-t border-slate-100 pt-4">
                Khouya FX uses open data from Bank Al-Maghrib and the Office des Changes. We are an independent entity and not affiliated with any specific bank.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-navy-900 text-slate-400 py-8 border-t border-navy-800">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
            <Shield size={16} />
            <span className="text-xs font-bold uppercase tracking-widest text-white">Compliance & Security</span>
          </div>
          <p className="text-[10px] leading-relaxed max-w-2xl mx-auto opacity-70">{DISCLAIMER_TEXT}</p>
          <p className="text-[10px] mt-4 opacity-50">© 2024 Khouya FX. Casablanca, Morocco.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
