import { useEffect } from 'react';

export type HotkeyHandler = (e: KeyboardEvent) => void;

export interface HotkeyBinding {
  key: string;          // e.g. 'k', 'Escape', 'ArrowLeft'
  cmd?: boolean;        // Cmd on Mac, Ctrl on others
  shift?: boolean;
  alt?: boolean;
  description: string;  // e.g. "Open command palette"
  category: string;     // e.g. "Navigation"
  handler: HotkeyHandler;
}

/**
 * P2.12 — Register a single keyboard shortcut.
 */
export function useHotkey(binding: HotkeyBinding, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform);
      const cmd = isMac ? e.metaKey : e.ctrlKey;
      if (binding.cmd && !cmd) return;
      if (!binding.cmd && cmd) return;
      if (binding.shift && !e.shiftKey) return;
      if (!binding.shift && e.shiftKey) return;
      if (binding.alt && !e.altKey) return;
      if (!binding.alt && e.altKey) return;
      if (e.key.toLowerCase() === binding.key.toLowerCase()) {
        e.preventDefault();
        binding.handler(e);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [binding, enabled]);
}

/**
 * Register multiple shortcuts at once.
 */
export function useHotkeys(bindings: HotkeyBinding[], enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform);
    const handler = (e: KeyboardEvent) => {
      for (const b of bindings) {
        const cmd = isMac ? e.metaKey : e.ctrlKey;
        if (b.cmd && !cmd) continue;
        if (!b.cmd && cmd) continue;
        if (b.shift && !e.shiftKey) continue;
        if (!b.shift && e.shiftKey) continue;
        if (b.alt && !e.altKey) continue;
        if (!b.alt && e.altKey) continue;
        if (e.key.toLowerCase() === b.key.toLowerCase()) {
          e.preventDefault();
          b.handler(e);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [bindings, enabled]);
}
