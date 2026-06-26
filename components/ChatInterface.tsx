import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { GEMINI_SYSTEM_INSTRUCTION } from '../constants';
import { retrieveContext, getDocumentCount } from '../services/ragService';
import { routeQuery, getAvailableProviders } from '../services/llmRouter';
import { useI18n } from '../context/I18nContext';
import { Send, Bot, Briefcase, BookOpen } from 'lucide-react';

function getGreeting(locale: string, docCount: number): string {
  if (locale === 'ar') {
    return `مرحباً. أنا مساعد JAD2FX التنظيمي — ${docCount} وثيقة من مكتب الصرف وبنك المغرب مفهرسة.\n\nيمكنني الإجابة على استفساراتكم حول تنظيم الصرف المغربي: آجال إعادة الأموال، مخصصات السفر، عمولات مكتب الصرف، تثبيت BKAM، حسابات العملة (CPEC/CDE)، تحوط المخاطر، الاستثمارات الأجنبية.\n\nللتدريب أو المرافقة الاستراتيجية في إدارة مخاطر الصرف، JAD2 Advisory رهن إشارتكم — jad2advisory.com`;
  }
  if (locale === 'en') {
    return `Hello. I am the JAD2FX Regulatory Assistant — ${docCount} Office des Changes & BKAM documents indexed.\n\nI can answer your questions on Moroccan foreign exchange regulations: repatriation timelines, travel allocations, OC commissions, BKAM fixing, forex accounts (CPEC/CDE), hedging, foreign investment.\n\nFor training or strategic FX risk management advisory, JAD2 Advisory is at your service — jad2advisory.com`;
  }
  return `Bonjour. Je suis l'Assistant Réglementaire JAD2FX — ${docCount} documents OC & BKAM indexés.\n\nJe peux vous renseigner sur la réglementation marocaine des changes : délais de rapatriement, allocations voyage, commissions OC, fixing BKAM, comptes devises (CPEC/CDE), couverture de change, investissements étrangers.\n\nPour une formation ou un accompagnement stratégique en gestion du risque de change, JAD2 Advisory est à votre disposition — jad2advisory.com`;
}

const SUGGESTED: Record<string, string[]> = {
  fr: [
    "Délai de rapatriement des exportations?",
    "Allocation voyage annuelle?",
    "Comment couvrir risque de change import?",
    "Puis-je investir à l'étranger?",
  ],
  en: [
    "Export repatriation timeline?",
    "Annual travel allowance?",
    "How to hedge FX import risk?",
    "Can I invest abroad?",
  ],
  ar: [
    "آجال إعادة أموال الصادرات؟",
    "المخصص السنوي للسفر؟",
    "كيفية تحوط مخاطر الاستيراد؟",
    "هل يمكنني الاستثمار في الخارج؟",
  ],
};

const ChatInterface: React.FC<{ proxyUrl?: string }> = ({ proxyUrl }) => {
  const { locale, isRTL } = useI18n();
  const docCount = getDocumentCount();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: '1',
      role: 'model',
      text: getGreeting(locale, docCount),
      timestamp: new Date(),
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Update greeting if locale changes
  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].id === '1') {
        return [{ ...prev[0], text: getGreeting(locale, docCount) }];
      }
      return prev;
    });
  }, [locale, docCount]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const available = getAvailableProviders(proxyUrl);
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

    try {
      const context = retrieveContext(text, 3);
      const userMessage = `REGULATORY CONTEXT (Office des Changes documents):\n\n${context}\n\n---\nUSER QUESTION: ${text}`;

      const result = await routeQuery({
        strategy: 'cost-first',
        proxyUrl,
        systemPrompt: GEMINI_SYSTEM_INSTRUCTION,
        userMessage,
        maxTokens: 900,
        temperature: 0.3,
      });

      const isUpsell = result.text.toLowerCase().includes("consultation") ||
                       result.text.toLowerCase().includes("expert");

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: result.text,
        timestamp: new Date(),
        isUpsell,
      }]);
    } catch {
      const errMsg = locale === 'ar'
        ? 'الخدمة غير متاحة مؤقتاً. يرجى المحاولة لاحقاً.'
        : locale === 'en'
        ? 'Service temporarily unavailable. Please try again in a moment.'
        : 'Service temporairement indisponible. Veuillez réessayer dans un moment.';

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: errMsg,
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = SUGGESTED[locale] ?? SUGGESTED.fr;

  const placeholder = hasAnyKey
    ? (locale === 'ar'
      ? 'اطرح سؤالك حول تنظيم مكتب الصرف...'
      : locale === 'en'
      ? 'Ask your question about OC regulations...'
      : 'Posez votre question sur la réglementation OC...')
    : (locale === 'ar'
      ? 'المساعد غير متاح حالياً — الرجاء المحاولة لاحقاً'
      : locale === 'en'
      ? 'Assistant unavailable — please try again later'
      : 'Assistant temporairement indisponible — réessayez ultérieurement');

  return (
    <div
      className={`flex flex-col h-[640px] bg-navy-900 rounded-none border border-navy-700 shadow-xl font-sans ${isRTL ? 'text-right' : ''}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="bg-navy-900 p-4 flex items-center justify-between border-b-4 border-gold-500">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-sm">
            <Bot size={20} className="text-gold-400" />
          </div>
          <div>
            <h3 className="text-white font-bold tracking-widest uppercase text-sm">JAD2FX Assistant</h3>
            <p className="text-[10px] text-slate-300 tracking-wider">
              {locale === 'ar'
                ? `تنظيم مكتب الصرف · ${docCount} وثيقة · JAD2 Advisory`
                : locale === 'en'
                ? `OC Regulations · ${docCount} Documents · JAD2 Advisory`
                : `Réglementation OC · ${docCount} Documents · by JAD2 Advisory`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <BookOpen size={11} />
            <span>Office des Changes</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-navy-950">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? (isRTL ? 'justify-start' : 'justify-end') : (isRTL ? 'justify-end' : 'justify-start')}`}>
            <div className={`max-w-[88%] flex flex-col ${msg.role === 'user' ? (isRTL ? 'items-start' : 'items-end') : (isRTL ? 'items-end' : 'items-start')}`}>
              <div className={`p-3.5 text-sm leading-relaxed shadow-sm ${
                msg.role === 'user'
                  ? 'bg-navy-700 text-white rounded-l-xl rounded-tr-xl'
                  : 'bg-navy-800 border border-navy-700 text-slate-300 rounded-r-xl rounded-tl-xl'
              }`}>
                {msg.text.split('\n').map((line, i) => (
                  <p key={i} className={`${i > 0 ? 'mt-1' : ''} last:mb-0`}>{line}</p>
                ))}
              </div>

              {msg.isUpsell && (
                <div className="mt-2 bg-gold-900/20 border border-gold-700/40 p-3 rounded-lg flex items-center gap-3 w-full">
                  <Briefcase className="text-gold-400 flex-shrink-0" size={16} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gold-400">
                      {locale === 'ar'
                        ? 'تدريب ومشورة استراتيجية — JAD2 Advisory'
                        : locale === 'en'
                        ? 'Training & Strategic Advisory — JAD2 Advisory'
                        : 'Formation & Conseil Stratégique — JAD2 Advisory'}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {locale === 'ar'
                        ? 'JAD2 Advisory تقدم تدريبات ومشورة استراتيجية في إدارة مخاطر الصرف للشركات المغربية.'
                        : locale === 'en'
                        ? 'JAD2 Advisory offers training and strategic FX risk advisory for Moroccan companies.'
                        : 'JAD2 Advisory propose formations et conseil stratégique en gestion du risque de change pour entreprises marocaines.'}
                    </p>
                  </div>
                  <a
                    href="https://jad2advisory.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs bg-gold-500 text-navy-900 px-3 py-1.5 rounded hover:bg-gold-400 transition flex-shrink-0 font-bold"
                  >
                    {locale === 'ar' ? 'تواصل →' : locale === 'en' ? 'Contact →' : 'Contacter →'}
                  </a>
                </div>
              )}

              <span className="text-[10px] text-slate-400 mt-1">
                {msg.timestamp.toLocaleTimeString(
                  locale === 'ar' ? 'ar-MA' : locale === 'en' ? 'en-GB' : 'fr-MA',
                  { hour: '2-digit', minute: '2-digit' }
                )}
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
            {locale === 'ar' ? 'جاري البحث في الوثائق التنظيمية...' : locale === 'en' ? 'Searching regulatory documents...' : 'Recherche dans les documents réglementaires...'}
          </div>
        )}

        {messages.length === 1 && !isLoading && (
          <div className="space-y-2">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">
              {locale === 'ar' ? 'أسئلة مقترحة' : locale === 'en' ? 'Suggested questions' : 'Questions suggérées'}
            </p>
            {suggestions.map((q, i) => (
              <button
                key={i}
                onClick={() => setInput(q)}
                className="block w-full text-left text-xs px-3 py-2 bg-navy-800 border border-navy-700 rounded-lg hover:border-gold-500 hover:text-gold-400 text-slate-400 transition"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {!hasAnyKey && (
          <div className="p-3 bg-amber-950/20 border border-amber-800/40 rounded-lg text-[10px] text-amber-400">
            {locale === 'ar'
              ? <>⚠️ لم يتم تكوين مفتاح API. أضف <code className="font-mono bg-amber-900/40 px-1">GROQ_API_KEY</code> في ملف <code className="font-mono bg-amber-900/40 px-1">.env</code> لتفعيل المساعد (مجاني).</>
              : locale === 'en'
              ? <>⚠️ No API key configured. Add <code className="font-mono bg-amber-900/40 px-1">GROQ_API_KEY</code> to your <code className="font-mono bg-amber-900/40 px-1">.env</code> file to enable the chatbot (free).</>
              : <>⚠️ Aucune clé API configurée. Ajoutez <code className="font-mono bg-amber-900/40 px-1">GROQ_API_KEY</code> dans votre fichier <code className="font-mono bg-amber-900/40 px-1">.env</code> pour activer le chatbot (gratuit).</>}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Legal note */}
      <div className="border-t border-navy-700 px-4 py-2.5 flex items-center justify-between gap-4">
        <p className="text-[10px] text-slate-400 leading-tight">
          {locale === 'ar'
            ? <>معلومات تنظيمية فقط · لا يتم حفظ أسئلتك · <a href="https://jad2advisory.com" target="_blank" rel="noopener noreferrer" className="text-gold-600 hover:text-gold-500 font-medium">jad2advisory.com</a></>
            : locale === 'en'
            ? <>Regulatory information only · Your queries are not stored · <a href="https://jad2advisory.com" target="_blank" rel="noopener noreferrer" className="text-gold-600 hover:text-gold-500 font-medium">jad2advisory.com</a></>
            : <>Informations réglementaires uniquement · Vos questions ne sont pas conservées · <a href="https://jad2advisory.com" target="_blank" rel="noopener noreferrer" className="text-gold-600 hover:text-gold-500 font-medium">jad2advisory.com</a></>}
        </p>
      </div>

      {/* Input */}
      <div className="p-4 bg-navy-900 border-t border-navy-700">
        <div className="flex gap-0 rounded-lg overflow-hidden border border-navy-600 focus-within:ring-1 focus-within:ring-gold-500 focus-within:border-gold-500 transition">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder={placeholder}
            disabled={!hasAnyKey}
            dir={isRTL ? 'rtl' : 'ltr'}
            className="flex-1 px-4 py-3 bg-navy-800 focus:outline-none text-sm text-slate-200 placeholder:text-slate-500 disabled:bg-navy-900 disabled:cursor-not-allowed"
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
