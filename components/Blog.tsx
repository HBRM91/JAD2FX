/**
 * P4.1 — Blog/Research index page.
 * Lists all research articles, supports category filter and search.
 */

import { useState, useMemo } from 'react';
import { BookOpen, Calendar, Search, Tag, ArrowRight } from 'lucide-react';
import { RESEARCH_ARTICLES, RESEARCH_CATEGORIES, type ResearchArticle, type ResearchCategory } from '../services/research';
import AutoLinkedText from './GlossaryTooltip';
import BlogArticleView from './BlogArticleView';

export default function Blog() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ResearchCategory | 'all'>('all');
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return RESEARCH_ARTICLES.filter((a) => {
      if (category !== 'all' && a.category !== category) return false;
      if (q && !a.title.toLowerCase().includes(q) && !a.excerpt.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [query, category]);

  if (openId) {
    return <BlogArticleView articleId={openId} onBack={() => setOpenId(null)} onShare={() => { /* hook */ }} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BookOpen size={14} className="text-gold-500" />
        <h1 className="text-base font-bold text-white uppercase tracking-wider">Research & Analyses</h1>
        <span className="text-[10px] text-slate-500 ml-auto">{RESEARCH_ARTICLES.length} articles · 1/sem cible</span>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un article..."
          className="w-full bg-navy-900 border border-navy-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-gold-500"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setCategory('all')}
          className={`px-3 py-1.5 text-[11px] font-bold rounded-lg border transition-colors ${
            category === 'all'
              ? 'bg-gold-500 text-navy-950 border-gold-500'
              : 'bg-navy-900 text-slate-400 border-navy-700 hover:border-navy-500 hover:text-white'
          }`}
        >
          Tous
        </button>
        {(Object.keys(RESEARCH_CATEGORIES) as ResearchCategory[]).map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-3 py-1.5 text-[11px] font-bold rounded-lg border transition-colors ${
              category === c
                ? 'bg-gold-500 text-navy-950 border-gold-500'
                : 'bg-navy-900 text-slate-400 border-navy-700 hover:border-navy-500 hover:text-white'
            }`}
          >
            {RESEARCH_CATEGORIES[c]}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((a) => (
          <article
            key={a.id}
            className="bg-navy-900 border border-navy-700 rounded-2xl p-5 hover:border-gold-500/40 transition-colors"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold bg-navy-800 border border-navy-700 px-2 py-0.5 rounded">
                {RESEARCH_CATEGORIES[a.category]}
              </span>
              <div className="flex items-center gap-1 text-[10px] text-slate-500">
                <Calendar size={9} /> {a.date}
              </div>
            </div>
                <h2 className="text-base font-serif font-bold text-white leading-tight mb-2">{a.title}</h2>
                <AutoLinkedText
                  text={a.excerpt}
                  className="text-[12px] text-slate-400 leading-relaxed mb-3 block"
                  maxLinks={3}
                />
            <div className="flex flex-wrap gap-1.5">
              {a.tags.map((t) => (
                <span key={t} className="text-[10px] text-slate-500 bg-navy-800 px-1.5 py-0.5 rounded">
                  <Tag size={8} className="inline mr-0.5" />{t}
                </span>
              ))}
            </div>
            <button
              onClick={() => setOpenId(a.id)}
              className="mt-3 flex items-center gap-1 text-[11px] font-bold text-gold-400 hover:text-gold-300 transition-colors"
            >
              Lire l'analyse <ArrowRight size={11} />
            </button>
          </article>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-sm text-slate-500">
          Aucun article pour cette recherche
        </div>
      )}
    </div>
  );
}
