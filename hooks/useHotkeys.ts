import { useEffect } from 'react';

export type HotkeyHandler = (e: KeyboardEvent) => void;

export interface HotkeyBinding {
  key: string;
  cmd?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: HotkeyHandler;
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
