import { Calendar, Clock, ArrowLeft, User, Tag, Share2 } from 'lucide-react';
import { useMemo } from 'react';
import { getArticleById, type ResearchArticle } from '../services/research';
import { injectGlossaryTerms } from '../utils/autoLink';

/**
 * P4.1 — Blog article detail view.
 * Renders a single article with its full content (when available) and
 * auto-linked glossary terms.
 */

interface Props {
  articleId: string;
  onBack: () => void;
  onShare: (a: ResearchArticle) => void;
}

export default function BlogArticleView({ articleId, onBack, onShare }: Props) {
  const article = getArticleById(articleId);
  const html = useMemo(() => {
    if (!article?.contentFr) return null;
    return renderMarkdown(article.contentFr);
  }, [article]);

  if (!article) {
    return (
      <div className="text-center py-12 text-slate-500 text-sm">
        Article introuvable. <button onClick={onBack} className="text-gold-400 underline ml-2">Retour</button>
      </div>
    );
  }

  return (
    <article className="max-w-2xl mx-auto space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-gold-400"
        >
          <ArrowLeft size={12} /> Retour aux articles
        </button>
        <button
          onClick={() => onShare(article)}
          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-gold-400"
        >
          <Share2 size={12} /> Partager
        </button>
      </div>

      {/* Header */}
      <div className="bg-navy-900 border border-navy-700 rounded-2xl p-6 space-y-3">
        <span className="inline-block text-[10px] font-bold text-gold-400 uppercase tracking-wider bg-gold-500/10 border border-gold-500/25 px-2 py-0.5 rounded">
          {article.category}
        </span>
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-white leading-tight">
          {article.title}
        </h1>
        <p className="text-[14px] text-slate-300 leading-relaxed">{article.excerpt}</p>
        <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500 pt-2 border-t border-navy-800">
          <span className="flex items-center gap-1"><User size={10} /> {article.authorRole || article.author}</span>
          <span className="flex items-center gap-1"><Calendar size={10} /> {article.date}</span>
          <span className="flex items-center gap-1"><Clock size={10} /> {article.readTimeMin} min</span>
        </div>
      </div>

      {/* Body */}
      {html ? (
        <div
          className="bg-navy-900 border border-navy-700 rounded-2xl p-6 prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <div className="bg-navy-900/50 border border-navy-800 rounded-2xl p-6 text-center text-slate-500 text-[12px]">
          Article complet bientôt disponible.
        </div>
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {article.tags.map((t) => (
          <span key={t} className="text-[10px] text-slate-400 bg-navy-900 border border-navy-700 px-2 py-0.5 rounded">
            <Tag size={9} className="inline mr-0.5" />{t}
          </span>
        ))}
      </div>

      {/* Author */}
      <div className="bg-navy-900/50 border border-navy-800 rounded-2xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gold-500/20 border border-gold-500/40 flex items-center justify-center text-[10px] font-bold text-gold-400">
          {article.author.replace(/JAD2 Advisory|JAD2FX Research|Morning Briefing/, 'JAD2').slice(0, 4).toUpperCase()}
        </div>
        <div>
          <p className="text-[12px] font-bold text-white">{article.authorRole || article.author}</p>
          <p className="text-[10px] text-slate-500">JAD2 Advisory · Casablanca</p>
        </div>
      </div>
    </article>
  );
}

/**
 * Very small markdown-like renderer. Supports:
 *  - `## heading` (h2)
 *  - `### heading` (h3)
 *  - **bold** / *italic*
 *  - `code`
 *  - `- list`
 *  - paragraphs
 *  - injects glossary auto-links
 *
 * Not a full markdown parser — we control the article format so we keep
 * it dependency-free and predictable.
 */
function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderMarkdown(input: string): string {
  // Auto-link glossary terms first
  const linked = injectGlossaryTerms(escapeHtml(input), ['cip', 'forward', 'monia', 'panier-bkam', 'bande-5-pct', 'taux-directeur-bam', 'igoc', 'circ-oc-01-2024', 'risque-transactionnel', 'risque-economique', 'office-des-changes', 'xcs'], 5);

  const lines = linked.split('\n');
  let out = '';
  let inList = false;
  let inCode = false;
  let buffer: string[] = [];

  const flush = () => {
    if (buffer.length === 0) return;
    const text = buffer.join(' ').trim();
    if (text) {
      // Apply inline formatting (bold, italic, code)
      const html = text
        .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 bg-navy-800 text-gold-300 rounded text-[11px] font-mono">$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-slate-100 font-semibold">$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em class="text-slate-300">$1</em>');
      out += `<p class="text-[13px] text-slate-300 leading-relaxed mb-3">${html}</p>`;
    }
    buffer = [];
  };

  for (const raw of lines) {
    const line: string = raw.trimEnd();
    if (line.startsWith('```')) {
      if (inCode) { out += `</code></pre>`; inCode = false; }
      else { out += `<pre class="bg-navy-950 border border-navy-800 rounded p-3 my-3 overflow-x-auto"><code class="text-[11px] text-slate-300 font-mono">`; inCode = true; }
      continue;
    }
    if (inCode) { out += escapeHtml(line) + '\n'; continue; }

    if (line.startsWith('### ')) { flush(); out += `<h3 class="text-[15px] font-bold text-white mt-5 mb-2">${line.slice(4)}</h3>`; continue; }
    if (line.startsWith('## '))  { flush(); out += `<h2 class="text-[17px] font-bold text-gold-400 mt-6 mb-3 border-b border-navy-800 pb-2">${line.slice(3)}</h2>`; continue; }
    if (line.startsWith('- '))  {
      if (!inList) { out += '<ul class="list-disc list-inside text-[13px] text-slate-300 space-y-1 mb-3">'; inList = true; }
      out += `<li class="ml-2">${line.slice(2).replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 bg-navy-800 text-gold-300 rounded text-[10px] font-mono">$1</code>')}</li>`;
      continue;
    }
    if (line.trim() === '') { flush(); if (inList) { out += '</ul>'; inList = false; } continue; }
    buffer.push(line);
  }
  flush();
  if (inList) out += '</ul>';

  return out;
}
