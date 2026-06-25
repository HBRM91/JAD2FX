'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, Briefcase, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  isUpsell?: boolean;
}

const GREETING = `Bonjour. Je suis l'Assistant Réglementaire JAD2FX — ${10} documents Office des Changes & BKAM indexés.

Je réponds à vos questions sur la réglementation marocaine des changes : délais de rapatriement, allocations voyage, comptes devises (CDE/CPEC), couverture de change, investissements étrangers, transferts MRE.

Pour un accompagnement stratégique en gestion du risque de change, JAD2 Advisory est à votre disposition.`;

const SUGGESTIONS = [
  "Délai de rapatriement des recettes d'exportation ?",
  "Allocation voyage annuelle ?",
  "Comment couvrir mon risque de change à l'import ?",
  "Puis-je investir à l'étranger en tant qu'entreprise marocaine ?",
];

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', role: 'assistant', text: GREETING },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || loading) return;

    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: q }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
        signal: AbortSignal.timeout(25_000),
      });

      const data = await res.json() as { text?: string; error?: string };

      if (!res.ok || !data.text) {
        throw new Error(data.error ?? 'Erreur inconnue');
      }

      const replyText = data.text;
      const isUpsell =
        replyText.toLowerCase().includes('jad2 advisory') ||
        replyText.toLowerCase().includes('couverture') ||
        replyText.toLowerCase().includes('stratégie');

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: replyText,
        isUpsell,
      }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Service indisponible';
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: `⚠️ ${msg}`,
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] rounded-none" style={{ background: '#0A0F1E' }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ background: '#0D1426', borderBottom: '1px solid rgba(0,200,150,0.2)' }}
      >
        <div
          className="p-1.5 rounded"
          style={{ background: 'rgba(0,200,150,0.12)', border: '1px solid rgba(0,200,150,0.3)' }}
        >
          <Bot size={16} style={{ color: '#00C896' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: '#F1F5F9' }}>
            JAD2FX — Assistant Réglementaire
          </p>
          <p className="text-[10px]" style={{ color: '#64748B' }}>
            Réglementation OC · 10 documents indexés · JAD2 Advisory
          </p>
        </div>
        <span
          className="text-[9px] font-mono px-1.5 py-0.5 rounded"
          style={{ background: 'rgba(0,200,150,0.1)', color: '#00C896', border: '1px solid rgba(0,200,150,0.2)' }}
        >
          LIVE
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className="px-3.5 py-2.5 text-sm leading-relaxed rounded-lg"
                style={
                  msg.role === 'user'
                    ? { background: 'rgba(0,200,150,0.15)', border: '1px solid rgba(0,200,150,0.3)', color: '#F1F5F9' }
                    : { background: '#111827', border: '1px solid rgba(255,255,255,0.07)', color: '#CBD5E1' }
                }
              >
                {msg.text.split('\n').map((line, i) => (
                  <p key={i} className={i > 0 ? 'mt-1' : ''}>
                    {line}
                  </p>
                ))}
              </div>

              {msg.isUpsell && (
                <div
                  className="mt-2 p-3 rounded-lg flex items-center gap-3 w-full"
                  style={{ background: 'rgba(212,160,23,0.08)', border: '1px solid rgba(212,160,23,0.25)' }}
                >
                  <Briefcase size={14} style={{ color: '#D4A017', flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold" style={{ color: '#D4A017' }}>
                      Formation & Conseil Stratégique — JAD2 Advisory
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: '#94A3B8' }}>
                      Accompagnement en gestion du risque de change pour entreprises marocaines.
                    </p>
                  </div>
                  <a
                    href="https://jad2advisory.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-bold px-2.5 py-1 rounded flex-shrink-0 transition-opacity hover:opacity-80"
                    style={{ background: '#D4A017', color: '#0A0F1E' }}
                  >
                    Contact →
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2">
            <Loader2 size={14} className="animate-spin" style={{ color: '#00C896' }} />
            <span className="text-[11px]" style={{ color: '#64748B' }}>
              Recherche dans les documents réglementaires…
            </span>
          </div>
        )}

        {messages.length === 1 && !loading && (
          <div className="space-y-2 pt-1">
            <p className="text-[10px] uppercase tracking-widest" style={{ color: '#64748B' }}>
              Questions fréquentes
            </p>
            {SUGGESTIONS.map((q, i) => (
              <button
                key={i}
                onClick={() => send(q)}
                className="block w-full text-left text-xs px-3 py-2 rounded-md transition-all hover:opacity-90"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#94A3B8',
                }}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Legal */}
      <div
        className="px-4 py-2 flex-shrink-0"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        <p className="text-[9px]" style={{ color: '#374151' }}>
          Informations réglementaires uniquement · Questions non conservées ·{' '}
          <a href="https://jad2advisory.com" target="_blank" rel="noopener noreferrer" style={{ color: '#D4A017' }}>
            jad2advisory.com
          </a>
        </p>
      </div>

      {/* Input */}
      <div className="p-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div
          className="flex rounded-lg overflow-hidden transition-all"
          style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(input)}
            placeholder="Posez votre question sur la réglementation OC…"
            disabled={loading}
            className="flex-1 px-4 py-3 text-sm bg-transparent focus:outline-none placeholder:opacity-40 disabled:cursor-not-allowed"
            style={{ color: '#F1F5F9' }}
          />
          <button
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            className="px-4 transition-opacity disabled:opacity-40"
            style={{ background: 'rgba(0,200,150,0.15)', color: '#00C896' }}
            aria-label="Envoyer"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
