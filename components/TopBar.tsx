/**
 * P2.15 — Top bar (mobile variant).
 * Slim, single-line, with logo and menu trigger.
 */

import LogoJad2Fx from './LogoJad2Fx';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { NAV_GROUPS } from '../navConfig';

export function TopBar({ variant }: { variant: 'mobile' | 'desktop' }) {
  const [menuOpen, setMenuOpen] = useState(false);

  if (variant === 'mobile') {
    return (
      <>
        <header className="sticky top-0 z-40 h-12 bg-navy-900 border-b border-navy-800 flex items-center justify-between px-4">
          <button onClick={() => (window.location.hash = '')} className="flex-shrink-0">
            <LogoJad2Fx height={22} dark={true} showSub={false} />
          </button>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 text-slate-400 hover:text-gold-400"
            aria-label="Menu"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </header>

        {menuOpen && (
          <div className="fixed inset-0 z-50 bg-navy-950/95 backdrop-blur-sm overflow-y-auto pt-12" onClick={() => setMenuOpen(false)}>
            <div className="p-4 space-y-4" onClick={(e) => e.stopPropagation()}>
              {NAV_GROUPS.map((g) => (
                <div key={g.id}>
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 px-2">{g.label}</h3>
                  <div className="space-y-0.5">
                    {g.items.map((it) => (
                      <button
                        key={it.view}
                        onClick={() => {
                          const fn = (window as any).__jad2_navigate;
                          if (typeof fn === 'function') fn(it.view);
                          else window.location.hash = it.view.toLowerCase();
                          setMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-navy-800 hover:text-gold-400 rounded"
                      >
                        {it.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop variant not used (the desktop top bar is in App.tsx itself)
  return null;
}
