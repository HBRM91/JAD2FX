/**
 * P4.13 — Internal linking utility.
 * Auto-replaces glossary terms in any text/markdown with hyperlinks to the glossary page.
 */

import { GLOSSARY, type GlossaryTerm } from '../services/glossary';

const TERM_TO_SLUG: Array<{ pattern: RegExp; slug: string }> = GLOSSARY
  .slice()
  .sort((a: GlossaryTerm, b: GlossaryTerm) => b.term.length - a.term.length)
  .map((t: GlossaryTerm) => ({
    pattern: new RegExp(`\\b${t.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g'),
    slug: t.slug,
  }));

/**
 * Convert plain text into HTML with glossary terms auto-linked.
 * Only the first occurrence of each term is linked (avoids spam).
 * Terms are case-sensitive (we don't want to over-link in middle of words).
 */
export function autoLinkTerms(text: string, options: { siteBase?: string; className?: string } = {}): string {
  const siteBase = options.siteBase || 'https://fx.jad2advisory.com';
  const className = options.className || 'text-gold-400 hover:text-gold-300 underline decoration-dotted underline-offset-2';
  const linked = new Set<string>();
  let out = text;
  for (const { pattern, slug } of TERM_TO_SLUG) {
    if (linked.has(slug)) continue;
    out = out.replace(pattern, (match) => {
      linked.add(slug);
      return `<a href="${siteBase}/glossary#${slug}" class="${className}">${match}</a>`;
    });
  }
  return out;
}

/**
 * Return all glossary term slugs that appear in a text.
 * Used to build "Related terms" sections on blog posts.
 */
export function findTermsInText(text: string): string[] {
  const found: string[] = [];
  for (const { pattern, slug } of TERM_TO_SLUG) {
    if (pattern.test(text)) found.push(slug);
    pattern.lastIndex = 0; // reset regex state
  }
  return found;
}
