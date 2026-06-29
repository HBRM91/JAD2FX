import { Activity, BarChart2, TrendingUp, BookOpen, Menu, X } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { useState } from 'react';

interface Tab {
  id: string;
  label: string;
  icon: any;
  view: string;
}

const TABS: Tab[] = [
  { id: 'home',     label: 'Accueil',   icon: Activity,  view: 'HOME' },
  { id: 'live',     label: 'Live',      icon: TrendingUp, view: 'LIVE' },
  { id: 'forward',  label: 'Forward',   icon: BarChart2, view: 'FORWARDS' },
  { id: 'pme',      label: 'Diagnostic', icon: BookOpen,  view: 'TOOL_PME_DIAG' },
  { id: 'menu',     label: 'Menu',      icon: Menu,      view: 'MENU' },
];

/**
 * P2.15 — Bottom tab nav (mobile).
 */
export function BottomNav() {
  const { config: _config } = useAdmin();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeView, setActiveView] = useState('HOME');

  const nav = (view: string) => {
    if (typeof window === 'undefined') return;
    if (view === 'MENU') { setMenuOpen(true); return; }
    setMenuOpen(false);
    // Try to use a global navigate if available
    const fn = (window as any).__jad2_navigate;
    if (typeof fn === 'function') fn(view);
    else window.location.hash = view.toLowerCase();
    setActiveView(view);
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-navy-900 border-t border-navy-700">
        <ul className="flex items-center justify-around h-16">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeView === tab.view;
            return (
              <li key={tab.id}>
                <button
                  onClick={() => nav(tab.view)}
                  className={`flex flex-col items-center justify-center w-14 h-14 gap-0.5 ${
                    active ? 'text-gold-400' : 'text-slate-500'
                  }`}
                  aria-label={tab.label}
                >
                  <Icon size={18} />
                  <span className="text-[8px] font-bold">{tab.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Slide-up menu drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-navy-950/85 backdrop-blur-sm" onClick={() => setMenuOpen(false)}>
          <div
            className="absolute bottom-0 left-0 right-0 bg-navy-900 border-t-2 border-gold-500/50 rounded-t-2xl p-5 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-white">Menu complet</h2>
              <button onClick={() => setMenuOpen(false)} className="p-1 text-slate-500">
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { v: 'LIVE',           l: 'Live Pricer' },
                { v: 'DASHBOARD',      l: 'Tableau de bord' },
                { v: 'FIXING',         l: 'Fixing BKAM' },
                { v: 'FORWARDS',       l: 'Forward' },
                { v: 'SWAPS',          l: 'Swap' },
                { v: 'BANDS',          l: 'Bandes ±5%' },
                { v: 'GLOSSARY',       l: 'Glossaire' },
                { v: 'BLOG',           l: 'Research' },
                { v: 'BASKET',         l: 'Panier BKAM' },
                { v: 'VOL_SURFACE',    l: 'Vol Surface' },
                { v: 'BANK_RATES',     l: 'Banques' },
                { v: 'MONEY_MARKET',   l: 'Marché Monétaire' },
                { v: 'CORRELATION',    l: 'Corrélation' },
                { v: 'TOOL_PME_DIAG',  l: 'Diagnostic PME' },
                { v: 'TOOL_OC_ASSESS', l: 'Diagnostic OC' },
                { v: 'REGULATIONS',    l: 'Réglementation' },
                { v: 'SERVICES',       l: 'Services' },
                { v: 'AUDIT_LANDING',  l: 'Audit Gratuit' },
                { v: 'CHANGELOG',      l: 'Changelog' },
              ].map((it) => (
                <button
                  key={it.v}
                  onClick={() => nav(it.v)}
                  className="text-left p-2.5 bg-navy-950 border border-navy-800 rounded-lg text-[12px] text-slate-200 hover:border-gold-500/50"
                >
                  {it.l}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
