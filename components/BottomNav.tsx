import { Activity, TrendingUp, BarChart2, BookOpen, Menu, X, Search } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import type { ViewState } from '../types';

interface Tab {
  id: string;
  label: string;
  icon: any;
  view: ViewState;
}

const TABS: Tab[] = [
  { id: 'markets',  label: 'Marchés',   icon: TrendingUp, view: 'LIVE' },
  { id: 'forward',  label: 'Forward',   icon: BarChart2,  view: 'FORWARDS' },
  { id: 'tools',    label: 'Outils',    icon: Activity,   view: 'TOOL_PME_DIAG' },
  { id: 'home',     label: 'Accueil',   icon: BookOpen,   view: 'HOME' },
  { id: 'menu',     label: 'Plus',      icon: Menu,       view: 'HOME' },
];

const MORE_ITEMS: { v: ViewState; l: string }[] = [
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
  { v: 'BLUE_CHIPS',     l: 'Blue Chips Casa' },
  { v: 'VAR_CALC',       l: 'Calculateur VaR' },
  { v: 'CORRELATION',    l: 'Corrélation' },
  { v: 'TOOL_PME_DIAG',  l: 'Diagnostic PME' },
  { v: 'TOOL_OC_ASSESS', l: 'Diagnostic OC' },
  { v: 'REGULATIONS',    l: 'Réglementation' },
  { v: 'SERVICES',       l: 'Services' },
  { v: 'AUDIT_LANDING',  l: 'Audit Gratuit' },
  { v: 'CHANGELOG',      l: 'Changelog' },
];

/**
 * P2.15 — Bottom tab nav (mobile only).
 */
export default function BottomNav({ view, navTo }: { view: ViewState; navTo: (v: ViewState) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');

  // P2-7: Escape closes the slide-up menu drawer
  useEffect(() => {
    if (typeof window === 'undefined' || !menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const onTab = (tab: Tab) => {
    if (tab.id === 'menu') { setMenuOpen(true); return; }
    setMenuOpen(false);
    navTo(tab.view);
  };

  const filteredMore = useMemo(() => {
    if (!query.trim()) return MORE_ITEMS;
    const q = query.toLowerCase();
    return MORE_ITEMS.filter((it) => it.l.toLowerCase().includes(q));
  }, [query]);

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-navy-900 border-t border-navy-700 pb-[env(safe-area-inset-bottom)]">
        <ul className="flex items-center justify-around h-16">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = tab.id !== 'menu' && view === tab.view;
            return (
              <li key={tab.id}>
                <button
                  onClick={() => onTab(tab)}
                  className={`flex flex-col items-center justify-center w-16 h-16 gap-0.5 ${
                    active ? 'text-gold-400' : 'text-slate-500'
                  }`}
                  aria-label={tab.label}
                >
                  <Icon size={20} />
                  <span className="text-[10px] font-bold">{tab.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-navy-950/85 backdrop-blur-sm" onClick={() => setMenuOpen(false)}>
          <div
            className="absolute bottom-0 left-0 right-0 bg-navy-900 border-t-2 border-gold-500/50 rounded-t-2xl p-5 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-white">Menu complet</h2>
              <button onClick={() => setMenuOpen(false)} className="p-1 text-slate-500" aria-label="Fermer">
                <X size={18} />
              </button>
            </div>
            <div className="relative mb-3">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un outil…"
                className="w-full bg-navy-950 border border-navy-700 rounded-lg pl-8 pr-3 py-2 text-[12px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-gold-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {filteredMore.length === 0 ? (
                <p className="col-span-2 text-center text-[11px] text-slate-500 py-4">Aucun résultat pour « {query} »</p>
              ) : filteredMore.map((it) => (
                <button
                  key={it.v}
                  onClick={() => { navTo(it.v); setMenuOpen(false); }}
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
