import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { GEMINI_SYSTEM_INSTRUCTION } from '../constants';
import { Send, Bot, ShieldAlert, Briefcase } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

const ChatInterface: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'model',
      text: 'Salam. I am the Khouya FX Regulatory Assistant. I can clarify Office des Changes circulars for your business transactions.',
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !process.env.API_KEY) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // MOCK RAG Retrieval: In production, fetch 'regulatory_docs' from Supabase using vector similarity
      const mockContext = "Document Context: Circular 01/2024 permits SMEs to hedge up to 100% of underlying import value.";

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', // Use Flash for lowest cost
        contents: [
            { role: 'user', parts: [{ text: `CONTEXT: ${mockContext}\n\nUSER QUESTION: ${userMsg.text}` }] }
        ],
        config: {
          systemInstruction: GEMINI_SYSTEM_INSTRUCTION,
          thinkingConfig: { thinkingBudget: 0 } // Disable thinking to save tokens
        },
      });

      const text = response.text || "Unable to retrieve regulation.";
      // Check for Upsell Trigger in response (based on system prompt)
      const isUpsell = text.includes("schedule a consultation");

      const modelMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: text,
        timestamp: new Date(),
        isUpsell
      };

      setMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "System is currently updating regulatory indices. Please try again later.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-none border border-slate-200 shadow-xl font-sans">
      {/* Professional Header */}
      <div className="bg-navy-900 p-4 flex items-center justify-between border-b-4 border-gold-500">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-sm backdrop-blur-sm">
            <Bot size={20} className="text-gold-400" />
          </div>
          <div>
            <h3 className="text-white font-serif font-medium tracking-wide">Regulatory Assistant</h3>
            <p className="text-[10px] text-slate-300 uppercase tracking-wider">AI-Powered • Compliance Focused</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                <div className={`p-4 text-sm leading-relaxed shadow-sm ${
                msg.role === 'user' 
                    ? 'bg-navy-800 text-white rounded-l-lg rounded-tr-lg' 
                    : 'bg-white border border-slate-200 text-slate-800 rounded-r-lg rounded-tl-lg'
                }`}>
                    {msg.text.split('\n').map((line, i) => (
                        <p key={i} className="mb-1 last:mb-0">{line}</p>
                    ))}
                </div>
                
                {/* Upsell Card Injection */}
                {msg.isUpsell && (
                    <div className="mt-2 bg-gold-50 border border-gold-200 p-3 rounded-md flex items-center gap-3 w-full animate-fade-in">
                        <Briefcase className="text-navy-900" size={18} />
                        <div className="flex-1">
                            <p className="text-xs font-bold text-navy-900">Expert Consultation Recommended</p>
                            <p className="text-[10px] text-navy-800">For complex cases like this, we suggest a review.</p>
                        </div>
                        <button className="text-xs bg-navy-900 text-white px-3 py-1.5 rounded-sm hover:bg-navy-800 transition">
                            Book Now
                        </button>
                    </div>
                )}
                <span className="text-[10px] text-slate-400 mt-1">{msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex items-center gap-2 text-xs text-slate-400 ml-2">
                <div className="w-2 h-2 bg-gold-500 rounded-full animate-bounce" />
                Processing Regulatory Index...
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Disclaimer */}
      <div className="bg-slate-100 px-4 py-2 border-t border-slate-200 flex items-start gap-2">
        <ShieldAlert size={12} className="text-slate-500 mt-0.5" />
        <p className="text-[10px] text-slate-500 leading-tight">
            Use of this bot is subject to our Terms. Responses are based on OCR of public documents and may be erroneous. <span className="font-bold">Not Financial Advice.</span>
        </p>
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-200">
        <div className="flex gap-0 shadow-sm rounded-md overflow-hidden border border-slate-300 focus-within:ring-1 focus-within:ring-navy-900 focus-within:border-navy-900 transition">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your regulatory question..."
            className="flex-1 px-4 py-3 bg-white focus:outline-none text-sm text-slate-800 placeholder:text-slate-400"
          />
          <button 
            onClick={handleSend}
            disabled={isLoading}
            className="bg-navy-900 hover:bg-navy-800 text-white px-6 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;