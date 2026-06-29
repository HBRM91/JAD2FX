import { useState, useMemo } from 'react';
import { Search, BookOpen, ArrowLeft, Tag } from 'lucide-react';
import { GLOSSARY, GLOSSARY_CATEGORIES, searchTerms, getTermBySlug, getRelatedTerms, type GlossaryTerm, type GlossaryCategory } from '../services/glossary';

type View = 'list' | 'detail';

/**
 * P4.2 — Public glossary UI
 * Browse 60+ FX / MAD / OC terms with search, categories, and cross-links.
 */
export default function Glossary() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<GlossaryCategory | 'all'>('all');
  const [view, setView] = useState<View>('list');
  const [selected, setSelected] = useState<GlossaryTerm | null>(null);

  const filtered = useMemo(() => {
    let list = searchTerms(query);
    if (category !== 'all') list = list.filter((t) => t.category === category);
    return list;
  }, [query, category]);

  const openTerm = (slug: string) => {
    const t = getTermBySlug(slug);
    if (t) {
      setSelected(t);
      setView('detail');
      try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch { /* noop */ }
    }
  };

  if (view === 'detail' && selected) {
    const related = getRelatedTerms(selected.slug);
    return (
      <div className="space-y-4">
        <button
          onClick={() => setView('list')}
          className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-gold-400 transition-colors"
        >
          <ArrowLeft size={12} /> Retour au glossaire
        </button>

        <article className="bg-navy-900 border border-navy-700 rounded-2xl p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center flex-shrink-0">
              <BookOpen size={18} className="text-gold-400" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-serif font-bold text-white leading-tight">{selected.term}</h1>
              <p className="text-[10px] text-slate-500 font-mono mt-1">/{selected.slug}/</p>
            </div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider bg-navy-800 border border-navy-700 px-2 py-1 rounded">
              {GLOSSARY_CATEGORIES[selected.category].icon} {GLOSSARY_CATEGORIES[selected.category].label}
            </span>
          </div>

          <p className="text-sm text-slate-200 leading-relaxed mb-3">
            <strong className="text-gold-400">FR:</strong> {selected.shortFr}
          </p>
          <p className="text-sm text-slate-400 leading-relaxed mb-4">
            <strong className="text-blue-400">EN:</strong> {selected.shortEn}
          </p>

          <div className="border-t border-navy-800 pt-4 space-y-3">
            <div>
              <h2 className="text-[11px] font-bold text-white uppercase tracking-wider mb-1.5">Définition détaillée</h2>
              <p className="text-[13px] text-slate-300 leading-relaxed">{selected.longFr}</p>
            </div>
            <div>
              <p className="text-[12px] text-slate-500 leading-relaxed italic">{selected.longEn}</p>
            </div>
            {selected.examples && selected.examples.length > 0 && (
              <div>
                <h2 className="text-[11px] font-bold text-white uppercase tracking-wider mb-1.5">Exemples</h2>
                <ul className="space-y-1">
                  {selected.examples.map((ex, i) => (
                    <li key={i} className="text-[12px] text-slate-400 bg-navy-950 border border-navy-800 rounded px-3 py-2 font-mono">
                      {ex}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </article>

        {related.length > 0 && (
          <div className="bg-navy-900 border border-navy-700 rounded-2xl p-5">
            <h2 className="text-[11px] font-bold text-white uppercase tracking-wider mb-3">Termes liés</h2>
            <div className="flex flex-wrap gap-2">
              {related.map((r) => (
                <button
                  key={r.slug}
                  onClick={() => openTerm(r.slug)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-navy-950 border border-navy-700 rounded-lg text-[12px] text-slate-300 hover:border-gold-500/50 hover:text-gold-300 transition-colors"
                >
                  <Tag size={10} className="text-gold-500" />
                  {r.term}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <BookOpen size={14} className="text-gold-500" />
        <h1 className="text-base font-bold text-white uppercase tracking-wider">Glossaire FX · MAD · OC</h1>
        <span className="text-[10px] text-slate-500 ml-auto">{GLOSSARY.length} termes</span>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un terme (FR, EN, ou définition)..."
          className="w-full bg-navy-900 border border-navy-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-gold-500"
        />
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setCategory('all')}
          className={`px-3 py-1.5 text-[11px] font-bold rounded-lg border transition-colors ${
            category === 'all'
              ? 'bg-gold-500 text-navy-950 border-gold-500'
              : 'bg-navy-900 text-slate-400 border-navy-700 hover:border-navy-500 hover:text-white'
          }`}
        >
          Tous ({GLOSSARY.length})
        </button>
        {(Object.keys(GLOSSARY_CATEGORIES) as GlossaryCategory[]).map((cat) => {
          const count = GLOSSARY.filter((t) => t.category === cat).length;
          if (count === 0) return null;
          return (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-lg border transition-colors ${
                category === cat
                  ? 'bg-gold-500 text-navy-950 border-gold-500'
                  : 'bg-navy-900 text-slate-400 border-navy-700 hover:border-navy-500 hover:text-white'
              }`}
            >
              {GLOSSARY_CATEGORIES[cat].icon} {GLOSSARY_CATEGORIES[cat].label} ({count})
            </button>
          );
        })}
      </div>

      {/* Results */}
      <div className="text-[10px] text-slate-500 uppercase tracking-wider">
        {filtered.length} terme{filtered.length > 1 ? 's' : ''}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {filtered.map((t) => (
          <button
            key={t.slug}
            onClick={() => openTerm(t.slug)}
            className="text-left bg-navy-900 border border-navy-700 rounded-lg p-3 hover:border-gold-500/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-[13px] font-bold text-white leading-tight">{t.term}</h3>
              <span className="text-[9px] text-slate-600 font-mono flex-shrink-0">/{t.slug}/</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-snug line-clamp-2">{t.shortFr}</p>
            <span className="text-[9px] text-slate-500 mt-1.5 inline-block">
              {GLOSSARY_CATEGORIES[t.category].icon} {GLOSSARY_CATEGORIES[t.category].label}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-sm text-slate-500">
          Aucun terme trouvé pour "{query}"
        </div>
      )}
    </div>
  );
}
