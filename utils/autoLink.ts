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
function autoLinkTerms(text: string, options: { siteBase?: string; className?: string } = {}): string {
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
function findTermsInText(text: string): string[] {
  const found: string[] = [];
  for (const { pattern, slug } of TERM_TO_SLUG) {
    if (pattern.test(text)) found.push(slug);
    pattern.lastIndex = 0;
  }
  return found;
}

/**
 * Inject glossary links into HTML/text. First occurrence of each tracked term
 * becomes a link to the glossary anchor. Returns the modified string.
 */
export function injectGlossaryTerms(
  text: string,
  trackedSlugs: string[] = KNOWN_SLUGS_DEFAULT,
  maxLinks = 8,
): string {
  return autoLinkTerms(text, { siteBase: 'https://fx.jad2advisory.com' })
    .split('\n')
    .map((line) => injectIntoLine(line, trackedSlugs, maxLinks))
    .join('\n');
}

function injectIntoLine(line: string, trackedSlugs: string[], maxLinks: number): string {
  let out = line;
  let count = 0;
  for (const slug of trackedSlugs) {
    if (count >= maxLinks) break;
    const term = GLOSSARY.find((t) => t.slug === slug);
    if (!term) continue;
    const pattern = TERM_TO_SLUG.find((p) => p.slug === slug)?.pattern;
    if (!pattern) continue;
    let replaced = false;
    out = out.replace(pattern, (match) => {
      if (replaced) return match;
      replaced = true;
      count++;
      return `<a href="/glossary#${slug}" class="text-gold-400 hover:text-gold-300 underline decoration-dotted underline-offset-2">${match}</a>`;
    });
  }
  return out;
}

const KNOWN_SLUGS_DEFAULT = [
  'cip', 'forward', 'swap', 'panier-bkam', 'bande-5-pct', 'monia', 'circ-oc-01-2024',
  'fixing', 'xcs', 'risque-transactionnel', 'risque-economique', 'option-vanilla',
  'igoc', 'office-des-changes', 'forward-points', 'reserve-change', 'taux-directeur-bam',
  'cross-currency-swap', 'volatilite-implicite',
];
