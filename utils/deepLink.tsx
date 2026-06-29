import { useEffect, useState, useCallback } from 'react';
import { useAdmin } from '../context/AdminContext';

/**
 * P2.17 — Shareable deep links.
 * State is encoded in URL hash (#view=...&param1=...&param2=...).
 * Restores on mount. Updates on change (no full reload).
 *
 * Usage:
 *   const { params, updateParam } = useDeepLinkParams();
 *   updateParam('ccy', 'EUR');
 */

export type DeepLinkParams = Record<string, string>;

function parseHash(): DeepLinkParams {
  if (typeof window === 'undefined') return {};
  const h = window.location.hash.replace(/^#/, '');
  if (!h) return {};
  return Object.fromEntries(
    h.split('&').filter(Boolean).map((kv) => {
      const [k, v] = kv.split('=');
      return [decodeURIComponent(k), decodeURIComponent(v || '')];
    }),
  );
}

function buildHash(params: DeepLinkParams): string {
  const keys = Object.keys(params);
  if (keys.length === 0) return '';
  return '#' + keys
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k] || '')}`)
    .join('&');
}

export function useDeepLinkParams(): {
  params: DeepLinkParams;
  updateParam: (k: string, v: string | null) => void;
  clear: () => void;
} {
  const [params, setParams] = useState<DeepLinkParams>(() => parseHash());

  useEffect(() => {
    const onHash = () => setParams(parseHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const updateParam = useCallback((k: string, v: string | null) => {
    setParams((p) => {
      const next = { ...p };
      if (v == null || v === '') delete next[k];
      else next[k] = v;
      const hash = buildHash(next);
      // Update without scrolling
      if (typeof window !== 'undefined') {
        const url = window.location.pathname + window.location.search + hash;
        window.history.replaceState(null, '', url);
      }
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setParams({});
    if (typeof window !== 'undefined') {
      const url = window.location.pathname + window.location.search;
      window.history.replaceState(null, '', url);
    }
  }, []);

  return { params, updateParam, clear };
}

/**
 * Helper: encode full tool state into a shareable URL.
 */
export function buildShareableUrl(view: string, params: DeepLinkParams = {}): string {
  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.href);
  url.searchParams.set('view', view);
  const hash = buildHash(params);
  return url.toString() + hash;
}

/** React component: a "Share" button that copies the current URL with tool state. */
export function ShareLinkButton({ view, params, label = 'Partager' }: { view: string; params?: DeepLinkParams; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    const url = buildShareableUrl(view, params);
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [view, params]);
  return (
    <button
      onClick={copy}
      className="text-[10px] flex items-center gap-1 px-2 py-1 text-gold-400 hover:text-gold-300 transition-colors"
    >
      {copied ? '✓ Copié' : `🔗 ${label}`}
    </button>
  );
}
