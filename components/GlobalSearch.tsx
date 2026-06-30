import { useState, useMemo, useEffect } from 'react';
import { Search, X, ArrowRight, Hash } from 'lucide-react';
import { BKAM_CURRENCIES } from '../constants';
import { GLOSSARY } from '../services/glossary';
import { RESEARCH_ARTICLES } from '../services/research';
import { NAV_GROUPS } from '../navConfig';
import { useAdmin } from '../context/AdminContext';

/**
 * P2.23 — Global search (currencies + reports + regulations + tools + glossary).
 * Modal opened via Cmd+K (already wired in App.tsx via the command palette).
 * This is the search logic — can be reused by the command palette or a dedicated search.
 */

export function globalSearchIndex() {
  const items: Array<{ id: string; type: string; label: string; desc?: string; view?: string; keywords?: string }> = [];
  // Currencies
  BKAM_CURRENCIES.forEach((c) => {
    items.push({
      id: `ccy-${c.code}`,
      type: 'currency',
      label: `${c.code}/MAD`,
      desc: c.nameFr,
      view: 'LIVE',
      keywords: `${c.code} ${c.nameFr} ${c.nameAr}`,
    });
  });
  // Views
  NAV_GROUPS.forEach((g) => g.items.forEach((it) => {
    items.push({
      id: `view-${it.view}`,
      type: 'view',
      label: it.label,
      desc: it.desc,
      view: it.view,
      keywords: `${g.label} ${it.label} ${it.desc}`,
    });
  }));
  // Glossary
  GLOSSARY.forEach((t) => {
    items.push({
      id: `term-${t.slug}`,
      type: 'glossary',
      label: t.term,
      desc: t.shortFr,
      view: 'GLOSSARY',
      keywords: `${t.term} ${t.shortFr} ${t.shortEn}`,
    });
  });
  // Research
  RESEARCH_ARTICLES.forEach((a) => {
    items.push({
      id: `blog-${a.id}`,
      type: 'article',
      label: a.title,
      desc: a.excerpt.slice(0, 100) + '…',
      view: 'BLOG',
      keywords: `${a.title} ${a.tags.join(' ')} ${a.category}`,
    });
  });
  return items;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (view: string) => void;
}

export default function GlobalSearch({ isOpen, onClose, onNavigate }: Props) {
  const [q, setQ] = useState('');
  const [hitIdx, setHitIdx] = useState(0);
  const { config } = useAdmin();

  useEffect(() => { if (isOpen) { setQ(''); setHitIdx(0); } }, [isOpen]);

  const results = useMemo(() => {
    if (!q.trim()) {
      // Default: most useful entries
      return globalSearchIndex()
        .filter((i) => i.type === 'view' || i.type === 'currency')
        .slice(0, 8);
    }
    const lq = q.toLowerCase();
    return globalSearchIndex()
      .filter((i) => (i.label + ' ' + (i.desc || '') + ' ' + (i.keywords || '')).toLowerCase().includes(lq))
      .slice(0, 12);
  }, [q]);

  if (!isOpen) return null;

  const nav = onNavigate ?? (() => {});

  return (
    <div className="fixed inset-0 z-[9994] flex items-start justify-center pt-[10vh] px-4 bg-navy-950/85 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-xl bg-navy-900 border border-navy-700 rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 px-4 py-3 border-b border-navy-700">
          <Search size={16} className="text-slate-400 flex-shrink-0" />
          <input
            type="text"
            autoFocus
            value={q}
            onChange={(e) => { setQ(e.target.value); setHitIdx(0); }}
            placeholder="Rechercher devise, outil, terme, article…"
            className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-500 outline-none"
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setHitIdx((h) => Math.min(h + 1, results.length - 1)); }
              if (e.key === 'ArrowUp')   { e.preventDefault(); setHitIdx((h) => Math.max(h - 1, 0)); }
              if (e.key === 'Enter')      {
                e.preventDefault();
                const r = results[hitIdx];
                if (r?.view) { nav(r.view); onClose(); }
              }
            }}
          />
          <kbd className="hidden sm:flex items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-500 bg-navy-800 border border-navy-700 rounded">Esc</kbd>
        </div>

        <div className="max-h-[50vh] overflow-y-auto">
          {results.length === 0 ? (
            <div className="p-8 text-center text-[12px] text-slate-500">Aucun résultat pour "{q}"</div>
          ) : (
            <ul>
              {results.map((r, i) => (
                <li key={r.id}>
                  <button
                    onClick={() => { if (r.view) { nav(r.view); onClose(); } }}
                    onMouseEnter={() => setHitIdx(i)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left ${hitIdx === i ? 'bg-gold-500/10' : 'hover:bg-navy-800/40'}`}
                  >
                    <span className={`flex-shrink-0 w-7 h-7 rounded text-[10px] font-bold flex items-center justify-center ${
                      r.type === 'currency' ? 'bg-blue-500/20 text-blue-400' :
                      r.type === 'glossary' ? 'bg-purple-500/20 text-purple-400' :
                      r.type === 'article' ? 'bg-emerald-500/20 text-emerald-400' :
                      'bg-gold-500/20 text-gold-400'
                    }`}>
                      {r.type === 'currency' ? r.label.slice(0, 3) : r.type === 'glossary' ? 'Aa' : r.type === 'article' ? '📄' : '⌘'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-slate-200 truncate">{r.label}</p>
                      {r.desc && <p className="text-[10px] text-slate-500 truncate">{r.desc}</p>}
                    </div>
                    <ArrowRight size={11} className={hitIdx === i ? 'text-gold-400' : 'text-slate-600'} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="px-4 py-2 border-t border-navy-700 flex items-center justify-between text-[10px] text-slate-500">
          <span>↑↓ Naviguer · ↵ Ouvrir · Esc Fermer</span>
          <span>{results.length} résultats</span>
        </div>
      </div>
    </div>
  );
}
