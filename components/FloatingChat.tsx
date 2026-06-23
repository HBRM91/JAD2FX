import React, { useState, useEffect } from 'react';
import { MessageCircle, X, ChevronDown } from 'lucide-react';
import ChatInterface from './ChatInterface';

export default function FloatingChat() {
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(true);

  // Stop pulsing after first interaction
  useEffect(() => {
    if (open) setPulse(false);
  }, [open]);

  return (
    <>
      {/* ── Expanded chat panel ── */}
      {open && (
        <div
          className="fixed bottom-20 right-4 z-[9998] w-[370px] max-w-[calc(100vw-2rem)] shadow-2xl rounded-xl overflow-hidden"
          style={{ maxHeight: 'calc(100vh - 6rem)' }}
        >
          {/* Drag handle / close bar */}
          <div className="bg-navy-900 flex items-center justify-between px-4 py-2 border-b border-navy-800">
            <span className="text-[10px] text-slate-400 tracking-widest uppercase font-medium">
              Assistant Réglementaire JAD2FX
            </span>
            <button
              onClick={() => setOpen(false)}
              className="text-slate-400 hover:text-white transition p-1 rounded"
              aria-label="Fermer le chat"
            >
              <ChevronDown size={16} />
            </button>
          </div>
          <div style={{ maxHeight: 'calc(100vh - 8rem)', overflowY: 'auto' }}>
            <ChatInterface />
          </div>
        </div>
      )}

      {/* ── Floating action button ── */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Fermer le chatbot' : 'Ouvrir le chatbot réglementaire'}
        className={`
          fixed bottom-4 right-4 z-[9999]
          w-14 h-14 rounded-full shadow-2xl
          flex items-center justify-center
          bg-navy-900 border-2 border-gold-500
          hover:bg-navy-800 hover:scale-105
          active:scale-95
          transition-all duration-200
          ${pulse && !open ? 'animate-pulse' : ''}
        `}
      >
        {open
          ? <X size={22} className="text-gold-400" />
          : <MessageCircle size={22} className="text-gold-400" />
        }
        {/* Notification dot */}
        {!open && pulse && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-gold-500 rounded-full border-2 border-white" />
        )}
      </button>
    </>
  );
}
