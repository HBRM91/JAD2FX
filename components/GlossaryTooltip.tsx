/**
 * P2.10 — Inline glossary tooltips.
 * Replaces glossary terms in any text/HTML with a styled hover-link to the
 * glossary page. Used in research articles, blog posts, About page, etc.
 */

import { useState, useEffect, useRef } from 'react';
import { BookOpen, X } from 'lucide-react';
import { getTermBySlug, type GlossaryTerm } from '../services/glossary';

const TERM_PATTERN_CACHE = new Map<string, RegExp>();

function getTermPattern(slug: string, term: string): RegExp {
  if (TERM_PATTERN_CACHE.has(slug)) return TERM_PATTERN_CACHE.get(slug)!;
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`\\b(${escaped})\\b`, 'g');
  TERM_PATTERN_CACHE.set(slug, pattern);
  return pattern;
}

interface TooltipState {
  term: GlossaryTerm;
  x: number;
  y: number;
}

/**
 * Replace first occurrence of each tracked term in `html` with a hover-link
 * that pops a tooltip showing the short definition.
 */
export function injectGlossaryLinks(
  html: string,
  trackedSlugs: string[],
  maxLinks = 8,
): string {
  let out = html;
  let count = 0;
  for (const slug of trackedSlugs) {
    if (count >= maxLinks) break;
    const term = getTermBySlug(slug);
    if (!term) continue;
    const pattern = getTermPattern(slug, term.term);
    // Replace only first occurrence
    let replaced = false;
    out = out.replace(pattern, (match) => {
      if (replaced) return match;
      replaced = true;
      count++;
      return `<a href="/glossary#${slug}" class="glossary-term" data-slug="${slug}">${match}</a>`;
    });
  }
  return out;
}

interface AutoLinkedTextProps {
  text: string;
  className?: string;
  maxLinks?: number;
}

/**
 * React component: renders plain text with glossary terms auto-linked.
 * Hover/click on a linked term shows a tooltip.
 */
export default function AutoLinkedText({ text, className = '', maxLinks = 8 }: AutoLinkedTextProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const containerRef = useRef<HTMLSpanElement>(null);

  // Find all tracked terms in text (up to maxLinks)
  const segments = useMemo(() => {
    if (!text) return [];
    const found: Array<{ start: number; end: number; term: GlossaryTerm }> = [];
    for (const slug of KNOWN_SLUGS) {
      if (found.length >= maxLinks) break;
      const term = getTermBySlug(slug);
      if (!term) continue;
      const pattern = getTermPattern(slug, term.term);
      // Only first occurrence of each
      const m = pattern.exec(text);
      pattern.lastIndex = 0;
      if (!m) continue;
      // Skip if overlaps an already-found term
      if (found.some((f) => !(m.index + m[0].length <= f.start || m.index >= f.end))) continue;
      found.push({ start: m.index, end: m.index + m[0].length, term });
    }
    found.sort((a, b) => a.start - b.start);
    // Build segments
    const out: Array<{ text: string; term?: GlossaryTerm }> = [];
    let cursor = 0;
    for (const f of found) {
      if (f.start > cursor) out.push({ text: text.slice(cursor, f.start) });
      out.push({ text: text.slice(f.start, f.end), term: f.term });
      cursor = f.end;
    }
    if (cursor < text.length) out.push({ text: text.slice(cursor) });
    return out;
  }, [text, maxLinks]);

  // Pre-load the known slugs once
  // (in production: from a config or import)
  return (
    <span ref={containerRef} className={className}>
      {segments.map((seg, i) =>
        seg.term ? (
          <span
            key={i}
            className="relative inline-block"
            onMouseEnter={(e) => {
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
              setTooltip({ term: seg.term!, x: rect.left, y: rect.bottom + 6 });
            }}
            onMouseLeave={() => setTooltip(null)}
            onClick={(e) => {
              e.preventDefault();
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
              setTooltip({ term: seg.term!, x: rect.left, y: rect.bottom + 6 });
            }}
          >
            <a
              href={`/glossary#${seg.term.slug}`}
              className="text-gold-400 hover:text-gold-300 underline decoration-dotted underline-offset-2 cursor-pointer"
            >
              {seg.text}
            </a>
          </span>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
      {tooltip && (
        <div
          className="fixed z-50 w-72 bg-navy-900 border border-gold-700/50 rounded-lg shadow-2xl p-3 pointer-events-auto"
          style={{ left: tooltip.x, top: tooltip.y }}
          onMouseLeave={() => setTooltip(null)}
        >
          <button
            onClick={() => setTooltip(null)}
            className="absolute top-1.5 right-1.5 text-slate-500 hover:text-slate-300"
          >
            <X size={11} />
          </button>
          <div className="flex items-center gap-1.5 mb-1">
            <BookOpen size={11} className="text-gold-400" />
            <span className="text-[10px] font-bold text-gold-300 uppercase tracking-wider">Glossaire</span>
          </div>
          <p className="text-[12px] font-bold text-white mb-1">{tooltip.term.term}</p>
          <p className="text-[11px] text-slate-300 leading-snug">{tooltip.term.shortFr}</p>
          <a
            href={`/glossary#${tooltip.term.slug}`}
            className="text-[10px] text-gold-400 hover:text-gold-300 mt-2 inline-block"
          >
            Lire la définition complète →
          </a>
        </div>
      )}
    </span>
  );
}

// Top slugs to auto-link (most-searched terms)
const KNOWN_SLUGS = [
  'cip', 'forward', 'swap', 'panier-bkam', 'bande-5-pct', 'monia', 'circ-oc-01-2024',
  'fixing', 'xcs', 'risque-transactionnel', 'risque-economique', 'option-vanilla',
  'igoc', 'office-des-changes', 'forward-points', 'reserve-change', 'taux-directeur-bam',
  'cross-currency-swap', 'volatilite-implicite', 'pips', 'spot', 'ccs-mad', 'phase-ii-2018',
];

import { useMemo } from 'react';
