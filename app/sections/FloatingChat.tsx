'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import dynamic from 'next/dynamic';

const ChatInterface = dynamic(() => import('./ChatInterface'), { ssr: false });

export default function FloatingChat() {
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setPulse(true), 3000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (open) setPulse(false);
  }, [open]);

  return (
    <>
      {open && (
        <div
          className="fixed bottom-20 right-4 z-[9998] w-[380px] max-w-[calc(100vw-2rem)] rounded-xl overflow-hidden shadow-2xl"
          style={{
            maxHeight: 'calc(100vh - 6rem)',
            border: '1px solid rgba(0,200,150,0.2)',
            background: '#0A0F1E',
          }}
        >
          {/* Panel title bar */}
          <div
            className="flex items-center justify-between px-4 py-2.5"
            style={{ background: '#080D1A', borderBottom: '1px solid rgba(0,200,150,0.15)' }}
          >
            <span className="text-[10px] tracking-widest uppercase font-medium" style={{ color: '#64748B' }}>
              JAD2FX — Assistant Réglementaire
            </span>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded transition-opacity hover:opacity-70"
              style={{ color: '#64748B' }}
              aria-label="Fermer le chatbot"
            >
              <X size={14} />
            </button>
          </div>

          <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 8.5rem)' }}>
            <ChatInterface />
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Fermer le chatbot' : 'Ouvrir l\'assistant réglementaire'}
        className="fixed bottom-4 right-4 z-[9999] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
        style={{
          background: open ? '#111827' : '#0D1426',
          border: `2px solid ${open ? 'rgba(255,255,255,0.15)' : '#D4A017'}`,
        }}
      >
        {open
          ? <X size={20} style={{ color: '#94A3B8' }} />
          : <MessageCircle size={20} style={{ color: '#D4A017' }} />
        }

        {!open && pulse && (
          <span
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 animate-pulse"
            style={{ background: '#00C896', borderColor: '#0A0F1E' }}
          />
        )}
      </button>
    </>
  );
}
