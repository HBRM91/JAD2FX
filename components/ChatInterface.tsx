import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { GEMINI_SYSTEM_INSTRUCTION } from '../constants';
import { retrieveContext, getDocumentCount } from '../services/ragService';
import { Send, Bot, ShieldAlert, Briefcase, BookOpen } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

const GEMINI_MODEL = 'gemini-2.0-flash';

const ChatInterface: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'model',
      text: `Salam. I am the Khouya FX Regulatory Assistant, powered by a knowledge base of ${getDocumentCount()} Office des Changes circulaires and instructions.\n\nAsk me about: import/export payments, travel allocations, FX hedging, foreign investment, comptes en devises, or any OC circular.`,
      timestamp: new Date(),
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => { scrollToBottom(); }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !process.env.API_KEY) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      // Real RAG: retrieve relevant OC regulation context
      const context = retrieveContext(text, 3);

      const prompt = `REGULATORY CONTEXT (Office des Changes documents):\n\n${context}\n\n---\nUSER QUESTION: ${text}`;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction: GEMINI_SYSTEM_INSTRUCTION,
          thinkingConfig: { thinkingBudget: 0 },
        },
      });

      const replyText = response.text ?? "Unable to retrieve regulation.";
      const isUpsell = replyText.toLowerCase().includes("consultation") ||
                       replyText.toLowerCase().includes("expert");

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: replyText,
        timestamp: new Date(),
        isUpsell,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "System is currently updating regulatory indices. Please try again in a moment.",
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
            <h3 className="text-white font-serif font-medium tracking-wide">Regulatory Assistant</h3>
            <p className="text-[10px] text-slate-300 uppercase tracking-wider">
              RAG • {getDocumentCount()} OC Documents
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
          <BookOpen size={11} />
          <span>Office des Changes</span>
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

              {msg.isUpsell && (
                <div className="mt-2 bg-gold-50 border border-gold-200 p-3 rounded-lg flex items-center gap-3 w-full">
                  <Briefcase className="text-navy-900 flex-shrink-0" size={16} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-navy-900">Expert Consultation Recommended</p>
                    <p className="text-[10px] text-navy-700">Complex FX structuring case — our specialists can assist.</p>
                  </div>
                  <button className="text-xs bg-navy-900 text-white px-3 py-1.5 rounded hover:bg-navy-800 transition flex-shrink-0">
                    Book
                  </button>
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

        {/* Suggested questions (only on first load) */}
        {messages.length === 1 && !isLoading && (
          <div className="space-y-2">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Suggested questions</p>
            {SUGGESTED.map((q, i) => (
              <button
                key={i}
                onClick={() => { setInput(q); }}
                className="block w-full text-left text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg hover:border-navy-900 hover:text-navy-900 text-slate-600 transition"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Disclaimer */}
      <div className="bg-slate-100 px-4 py-2 border-t border-slate-200 flex items-start gap-2">
        <ShieldAlert size={11} className="text-slate-500 mt-0.5 flex-shrink-0" />
        <p className="text-[10px] text-slate-500 leading-tight">
          Answers based on public OC circulaires indexed in our RAG system. May not reflect latest amendments.{' '}
          <span className="font-bold">Not Financial/Legal Advice.</span>
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
            placeholder="Ask about OC regulations..."
            className="flex-1 px-4 py-3 bg-white focus:outline-none text-sm text-slate-800 placeholder:text-slate-400"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
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
