import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { GEMINI_SYSTEM_INSTRUCTION } from '../constants';
import { retrieveContext, getDocumentCount } from '../services/ragService';
import { routeQuery, getAvailableProviders, PROVIDER_LABELS, PROVIDER_COLORS } from '../services/llmRouter';
import { Send, Bot, ShieldAlert, Briefcase, BookOpen, Zap } from 'lucide-react';

const ChatInterface: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'model',
      text: `Bonjour. Je suis l'Assistant Réglementaire JAD2FX — ${getDocumentCount()} documents OC & BKAM indexés.\n\nJe peux vous renseigner sur la réglementation marocaine des changes : délais de rapatriement, allocations voyage, commissions OC, fixing BKAM, comptes devises (CPEC/CDE), couverture de change, investissements étrangers.\n\nPour une consultation personnalisée ou un accompagnement sur vos opérations de change, JAD2 Advisory est à votre disposition — jad2advisory.com`,
      timestamp: new Date(),
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const available = getAvailableProviders();
  const hasAnyKey = available.length > 0;

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !hasAnyKey) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setActiveProvider(null);

    try {
      const context = retrieveContext(text, 3);
      const userMessage = `REGULATORY CONTEXT (Office des Changes documents):\n\n${context}\n\n---\nUSER QUESTION: ${text}`;

      const result = await routeQuery({
        strategy: 'cost-first',
        systemPrompt: GEMINI_SYSTEM_INSTRUCTION,
        userMessage,
        maxTokens: 900,
        temperature: 0.3,
      });

      setActiveProvider(result.provider);

      const isUpsell = result.text.toLowerCase().includes("consultation") ||
                       result.text.toLowerCase().includes("expert");

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: result.text,
        timestamp: new Date(),
        isUpsell,
        provider: result.provider,
        isFallback: result.isFallback,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Service temporairement indisponible. Veuillez réessayer dans un moment.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const SUGGESTED = [
    "Délai de rapatriement des exportations?",
    "Allocation voyage annuelle?",
    "Comment couvrir risque de change import?",
    "Puis-je investir à l'étranger?",
  ];

  return (
    <div className="flex flex-col h-[640px] bg-white rounded-none border border-slate-200 shadow-xl font-sans">
      {/* Header */}
      <div className="bg-navy-900 p-4 flex items-center justify-between border-b-4 border-gold-500">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-sm">
            <Bot size={20} className="text-gold-400" />
          </div>
          <div>
            <h3 className="text-white font-bold tracking-widest uppercase text-sm">JAD2FX Assistant</h3>
            <p className="text-[10px] text-slate-300 tracking-wider">
              Réglementation OC · {getDocumentCount()} Documents · by JAD2 Advisory
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Provider status badge */}
          {available.length > 0 && (
            <div className="flex items-center gap-1 text-[9px] text-emerald-400 bg-emerald-900/20 border border-emerald-700/30 px-2 py-0.5 rounded-full">
              <Zap size={8} />
              {available[0] === 'groq' ? 'Groq Free' : available[0] === 'openrouter' ? 'OpenRouter' : 'Gemini'}
            </div>
          )}
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <BookOpen size={11} />
            <span>Office des Changes</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-slate-50">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[88%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`p-3.5 text-sm leading-relaxed shadow-sm ${
                msg.role === 'user'
                  ? 'bg-navy-800 text-white rounded-l-xl rounded-tr-xl'
                  : 'bg-white border border-slate-200 text-slate-800 rounded-r-xl rounded-tl-xl'
              }`}>
                {msg.text.split('\n').map((line, i) => (
                  <p key={i} className={`${i > 0 ? 'mt-1' : ''} last:mb-0`}>{line}</p>
                ))}
              </div>

              {/* Provider badge on model messages */}
              {msg.role === 'model' && msg.provider && (
                <div className={`mt-1 flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                  PROVIDER_COLORS[msg.provider as keyof typeof PROVIDER_COLORS] ?? 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  <Zap size={8} />
                  {PROVIDER_LABELS[msg.provider as keyof typeof PROVIDER_LABELS] ?? msg.provider}
                  {msg.isFallback && <span className="text-amber-400 ml-1">↩ fallback</span>}
                </div>
              )}

              {msg.isUpsell && (
                <div className="mt-2 bg-gold-50 border border-gold-200 p-3 rounded-lg flex items-center gap-3 w-full">
                  <Briefcase className="text-navy-900 flex-shrink-0" size={16} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-navy-900">Cas Complexe — Conseil JAD2 Advisory</p>
                    <p className="text-[10px] text-navy-700">Ce scénario nécessite un accompagnement personnalisé par nos experts en structuration de change.</p>
                  </div>
                  <a
                    href="https://jad2advisory.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs bg-gold-500 text-navy-900 px-3 py-1.5 rounded hover:bg-gold-400 transition flex-shrink-0 font-bold"
                  >
                    Contacter →
                  </a>
                </div>
              )}

              <span className="text-[10px] text-slate-400 mt-1">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 ml-2">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 bg-gold-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-gold-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 bg-gold-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            Searching regulatory documents...
          </div>
        )}

        {messages.length === 1 && !isLoading && (
          <div className="space-y-2">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Suggested questions</p>
            {SUGGESTED.map((q, i) => (
              <button
                key={i}
                onClick={() => setInput(q)}
                className="block w-full text-left text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg hover:border-navy-900 hover:text-navy-900 text-slate-600 transition"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {!hasAnyKey && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[10px] text-amber-700">
            ⚠️ Aucune clé API configurée. Ajoutez <code className="font-mono bg-amber-100 px-1">GROQ_API_KEY</code> dans votre fichier <code className="font-mono bg-amber-100 px-1">.env</code> pour activer le chatbot (gratuit).
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Legal note */}
      <div className="border-t border-slate-100 px-4 py-2.5 flex items-center justify-between gap-4">
        <p className="text-[10px] text-slate-400 leading-tight">
          Informations réglementaires uniquement · Vos questions ne sont pas conservées ·{' '}
          <a href="https://jad2advisory.com" target="_blank" rel="noopener noreferrer" className="text-gold-600 hover:text-gold-500 font-medium">jad2advisory.com</a>
        </p>
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-200">
        <div className="flex gap-0 shadow-sm rounded-lg overflow-hidden border border-slate-300 focus-within:ring-1 focus-within:ring-navy-900 focus-within:border-navy-900 transition">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder={hasAnyKey ? "Posez votre question sur la réglementation OC..." : "Clé API requise — voir .env.example"}
            disabled={!hasAnyKey}
            className="flex-1 px-4 py-3 bg-white focus:outline-none text-sm text-slate-800 placeholder:text-slate-400 disabled:bg-slate-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim() || !hasAnyKey}
            className="bg-navy-900 hover:bg-navy-800 text-white px-5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
