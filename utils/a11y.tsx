/**
 * P2.30 — Accessibility utilities.
 * - Skip-to-content link
 * - useFocusTrap hook for modals
 * - ARIA helpers
 */

import { useEffect, useRef } from 'react';

/** Hook: trap focus within a container (for modals/dialogs). */
export function useFocusTrap(isOpen: boolean) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!isOpen || !ref.current) return;
    const container = ref.current;
    const sel = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const first = container.querySelector<HTMLElement>(sel);
    const focusables = () => Array.from(container.querySelectorAll<HTMLElement>(sel));
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) return;
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    container.addEventListener('keydown', onKey);
    first?.focus();
    return () => container.removeEventListener('keydown', onKey);
  }, [isOpen]);
  return ref;
}

/** Skip-to-content link (for keyboard users). */
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[9999] focus:px-3 focus:py-1.5 focus:bg-gold-500 focus:text-navy-950 focus:font-bold focus:rounded-lg"
    >
      Aller au contenu principal
    </a>
  );
}

/** Common ARIA label helpers. */
export const ARIA = {
  TICKER: 'Taux de change en temps réel, défilement horizontal',
  TABS: 'Onglets',
  MODAL: (title: string) => ({ 'aria-label': title, role: 'dialog', 'aria-modal': 'true' as const }),
  BUTTON_LABEL: (action: string) => ({ 'aria-label': action }),
  LIVE: (polite: 'polite' | 'assertive' = 'polite') => ({ 'aria-live': polite, role: 'status' }),
  DESCRIBED_BY: (id: string) => ({ 'aria-describedby': id }),
};

/** Helper: format number for screen readers. */
export function a11yNumber(n: number, suffix = ''): string {
  return `${n.toLocaleString('fr-FR')}${suffix ? ' ' + suffix : ''}`;
}
