import { useState, useEffect } from 'react';
import { Keyboard, X } from 'lucide-react';

export interface HotkeyEntry {
  key: string;
  cmd?: boolean;
  shift?: boolean;
  description: string;
  category: string;
}

const DEFAULT_HOTKEYS: HotkeyEntry[] = [
  { key: 'k',       cmd: true,  description: 'Ouvrir la palette de commandes', category: 'Navigation' },
  { key: '/',                 description: 'Recherche globale',              category: 'Navigation' },
  { key: 'g',                 description: 'Aller à : d=Dashboard, f=Forwards, b=Bkam, n=News, p=Press, h=Help', category: 'Navigation' },
  { key: 'd',                 description: 'Vue Dashboard',                  category: 'Vues' },
  { key: 'f',                 description: 'Vue Forwards',                   category: 'Vues' },
  { key: 'b',                 description: 'Vue BKAM Fixing',                category: 'Vues' },
  { key: 'n',                 description: 'Vue News (Morning Briefing)',    category: 'Vues' },
  { key: 'p',                 description: 'Vue Press Kit',                  category: 'Vues' },
  { key: 'g',                 description: 'Vue Glossary',                   category: 'Vues' },
  { key: 'h',                 description: 'Afficher ce cheatsheet',         category: 'Aide' },
  { key: 'Escape',            description: 'Fermer modales / panneaux',      category: 'Aide' },
  { key: '?',       shift: true, description: 'Afficher ce cheatsheet',      category: 'Aide' },
  { key: 't',                 description: 'Toggle thème clair/sombre',      category: 'Aide' },
  { key: 'e',                 description: 'Exporter en CSV',                category: 'Actions' },
  { key: 'w',                 description: 'Ajouter à la Watchlist',         category: 'Actions' },
];

function formatKey(e: HotkeyEntry): string {
  const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform);
  const parts: string[] = [];
  if (e.cmd) parts.push(isMac ? '⌘' : 'Ctrl');
  if (e.shift) parts.push(isMac ? '⇧' : 'Shift');
  parts.push(e.key === ' ' ? 'Space' : e.key.length === 1 ? e.key.toUpperCase() : e.key);
  return parts.join(isMac ? '' : '+');
}

interface Props {
  open: boolean;
  onClose: () => void;
  customHotkeys?: HotkeyEntry[];
}

export default function CheatSheet({ open, onClose, customHotkeys }: Props) {
  const all = [...DEFAULT_HOTKEYS, ...(customHotkeys ?? [])];
  const grouped = all.reduce<Record<string, HotkeyEntry[]>>((acc, h) => {
    (acc[h.category] = acc[h.category] ?? []).push(h);
    return acc;
  }, {});

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="bg-navy-900 border border-navy-700 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Keyboard size={18} className="text-gold-400" />
            <h2 className="text-base font-bold text-white uppercase tracking-wider">Raccourcis Clavier</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1" aria-label="Fermer">
            <X size={16} />
          </button>
        </div>

        {Object.entries(grouped).map(([cat, list]) => (
          <div key={cat} className="mb-4">
            <h3 className="text-[10px] font-bold text-gold-400 uppercase tracking-widest mb-2">{cat}</h3>
            <div className="space-y-1">
              {list.map((h, i) => (
                <div key={i} className="flex items-center justify-between bg-navy-950/40 rounded px-3 py-1.5">
                  <span className="text-xs text-slate-200">{h.description}</span>
                  <kbd className="font-mono text-[10px] px-2 py-0.5 bg-navy-800 text-gold-300 rounded border border-navy-700">
                    {formatKey(h)}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        ))}

        <p className="text-[10px] text-slate-500 text-center mt-4">
          Appuyez sur <kbd className="px-1.5 py-0.5 bg-navy-800 rounded">Esc</kbd> pour fermer
        </p>
      </div>
    </div>
  );
}

export { DEFAULT_HOTKEYS };
