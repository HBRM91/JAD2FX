import { useEffect, useState, useMemo } from 'react';
import { Search, ChevronRight, X, Command } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { NAV_GROUPS } from '../navConfig';
import { BKAM_CURRENCIES } from '../constants';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (view: string) => void;
}

interface SearchResult {
  id: string;
  type: 'view' | 'currency' | 'tool';
  label: string;
  desc?: string;
  action: () => void;
  keywords?: string[];
}

/**
 * P2.3 — Command palette (Cmd/Ctrl+K)
 * Fuzzy search across all views, currencies, and tools.
 * Keyboard-first navigation.
 */
export default function CommandPalette({ isOpen, onClose, onNavigate }: Props) {
  const { locale, isRTL } = useI18n();
  const [query, setQuery] = useState('');
  const [highlighted, setHighlighted] = useState(0);

  const navigate = onNavigate ?? (() => {});

  const results = useMemo<SearchResult[]>(() => {
    const out: SearchResult[] = [];
    const q = query.toLowerCase().trim();

    // All views
    for (const group of NAV_GROUPS) {
      for (const item of group.items) {
        if (!q || item.label.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q)) {
          out.push({
            id: `view-${item.view}`,
            type: 'view',
            label: item.label,
            desc: item.desc,
            action: () => { navigate(item.view); onClose(); },
            keywords: [group.label],
          });
        }
      }
    }

    // Currencies
    for (const c of BKAM_CURRENCIES) {
      if (!q || c.code.toLowerCase().includes(q) || c.nameFr.toLowerCase().includes(q) || (c.nameAr.includes(q))) {
        out.push({
          id: `ccy-${c.code}`,
          type: 'currency',
          label: `${c.code}/MAD`,
          desc: c.nameFr,
          action: () => { navigate('LIVE'); onClose(); },
        });
      }
    }

    return out.slice(0, 12);
  }, [query, onClose, onNavigate]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted((h) => Math.min(h + 1, results.length - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setHighlighted((h) => Math.max(h - 1, 0)); }
      if (e.key === 'Enter')      { e.preventDefault(); results[highlighted]?.action(); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, highlighted, results, onClose]);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) { setQuery(''); setHighlighted(0); }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-[12vh] px-4 bg-navy-950/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-navy-900 border border-navy-700 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-navy-700">
          <Search size={16} className="text-slate-400 flex-shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => { setQuery(e.target.value); setHighlighted(0); }}
            placeholder={locale === 'fr' ? 'Rechercher vue, devise, outil…' : locale === 'ar' ? 'ابحث…' : 'Search view, currency, tool…'}
            className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-500 outline-none"
            aria-label="Search"
          />
          <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-500 bg-navy-800 border border-navy-700 rounded">
            <Command size={9} />K
          </kbd>
          <button onClick={onClose} className="text-slate-500 hover:text-white p-0.5">
            <X size={14} />
          </button>
        </div>

        <div className="max-h-[50vh] overflow-y-auto">
          {results.length === 0 ? (
            <div className="p-8 text-center text-[12px] text-slate-500">
              Aucun résultat pour "{query}"
            </div>
          ) : (
            <ul className="py-1">
              {results.map((r, idx) => (
                <li key={r.id}>
                  <button
                    onClick={r.action}
                    onMouseEnter={() => setHighlighted(idx)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      highlighted === idx ? 'bg-gold-500/10' : 'hover:bg-navy-800/50'
                    }`}
                  >
                    <span className={`flex-shrink-0 w-6 h-6 rounded text-[10px] font-bold flex items-center justify-center ${
                      r.type === 'currency' ? 'bg-blue-500/20 text-blue-400' :
                      r.type === 'tool' ? 'bg-purple-500/20 text-purple-400' :
                                              'bg-gold-500/20 text-gold-400'
                    }`}>
                      {r.type === 'currency' ? r.label.slice(0, 3) :
                       r.type === 'tool'    ? '🛠' : '⌘'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-slate-200 font-medium truncate">{r.label}</p>
                      {r.desc && <p className="text-[10px] text-slate-500 truncate">{r.desc}</p>}
                    </div>
                    {highlighted === idx && <ChevronRight size={12} className="text-gold-400" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="px-4 py-2 border-t border-navy-700 flex items-center gap-3 text-[10px] text-slate-500">
          <span><kbd className="px-1 bg-navy-800 rounded">↑↓</kbd> Naviguer</span>
          <span><kbd className="px-1 bg-navy-800 rounded">↵</kbd> Ouvrir</span>
          <span><kbd className="px-1 bg-navy-800 rounded">Esc</kbd> Fermer</span>
        </div>
      </div>
    </div>
  );
}
