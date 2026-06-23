import React, { useState, useEffect, useCallback } from 'react';
import {
  Newspaper, Globe, RefreshCw, TrendingUp, TrendingDown, Minus,
  ExternalLink, AlertTriangle, Clock, ChevronDown, ChevronUp,
} from 'lucide-react';
import { MarketReport as MarketReportType, RadarEntry } from '../types';
import { getPublishedReport } from '../services/reportStorage';
import { fetchAllMadRates } from '../services/fxRates';
import { DEFAULT_BASKET_CONFIG } from '../constants';

const PROXY = process.env.CORS_PROXY_URL ?? '';

// ─── Simple Markdown renderer ─────────────────────────────────────────────────

function parseBold(text: string): React.ReactNode {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1
      ? <strong key={i} className="text-white font-semibold">{part}</strong>
      : part
  );
}

function MarkdownContent({ text, isRtl }: { text: string; isRtl?: boolean }) {
  if (!text) return null;
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = (key: string) => {
    if (listItems.length === 0) return;
    elements.push(
      <ul key={key} className="list-disc list-inside space-y-1 my-2 text-slate-300 text-sm">
        {listItems.map((item, i) => <li key={i}>{parseBold(item)}</li>)}
      </ul>
    );
    listItems = [];
  };

  lines.forEach((line, idx) => {
    const key = `l-${idx}`;
    if (line.startsWith('## ')) {
      flushList(`ul-${idx}`);
      elements.push(
        <h2 key={key} className="text-base font-bold text-gold-400 mt-6 mb-2 border-b border-navy-700/50 pb-1">
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith('### ')) {
      flushList(`ul-${idx}`);
      elements.push(
        <h3 key={key} className="text-sm font-semibold text-slate-200 mt-4 mb-1">{line.slice(4)}</h3>
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      listItems.push(line.slice(2));
    } else if (line.trim() === '') {
      flushList(`ul-${idx}`);
    } else {
      flushList(`ul-${idx}`);
      elements.push(
        <p key={key} className="text-sm text-slate-300 leading-relaxed my-1">{parseBold(line)}</p>
      );
    }
  });
  flushList('ul-end');

  return <div dir={isRtl ? 'rtl' : 'ltr'}>{elements}</div>;
}

// ─── Radar card ───────────────────────────────────────────────────────────────

const SENTIMENT_STYLES = {
  BULLISH: { bg: 'bg-emerald-900/30 border-emerald-700/40', badge: 'text-emerald-400', Icon: TrendingUp,  color: 'text-emerald-400' },
  BEARISH: { bg: 'bg-red-900/30 border-red-700/40',         badge: 'text-red-400',     Icon: TrendingDown, color: 'text-red-400'     },
  NEUTRAL: { bg: 'bg-navy-800 border-navy-600',             badge: 'text-slate-400',   Icon: Minus,        color: 'text-slate-400'   },
};

function RadarCard({ entry, lang }: { entry: RadarEntry; lang: 'fr' | 'ar'; key?: string }) {
  const s = SENTIMENT_STYLES[entry.sentiment];
  const Icon = s.Icon;
  const isRtl = lang === 'ar';

  return (
    <div className={`rounded-lg border p-4 space-y-2 ${s.bg}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <span className="font-mono font-bold text-white text-sm">
          {entry.flag} {entry.currency}/MAD
        </span>
        <Icon size={14} className={s.color} />
      </div>

      <div>
        <span className="text-xl font-mono font-bold text-white">
          {entry.currentRate > 0 ? entry.currentRate.toFixed(4) : '—'}
        </span>
        {entry.weeklyChangeBps !== 0 && (
          <span className={`text-xs ml-2 ${entry.weeklyChangeBps > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {entry.weeklyChangeBps > 0 ? '+' : ''}{entry.weeklyChangeBps} bps
          </span>
        )}
      </div>

      <p className="text-xs text-slate-300 leading-snug">
        {lang === 'fr' ? entry.headline : entry.headlineAr}
      </p>

      <div className="flex items-start gap-1.5">
        <span className={`text-[10px] font-bold ${s.badge}`}>{entry.sentiment}</span>
        <span className="text-[10px] text-slate-500">{lang === 'fr' ? entry.expectation : entry.expectationAr}</span>
      </div>
    </div>
  );
}

// ─── JAD2 Advisory CTA ────────────────────────────────────────────────────────

function AdvisoryCTA({ lang }: { lang: 'fr' | 'ar' }) {
  const isRtl = lang === 'ar';
  return (
    <div
      className="bg-gradient-to-r from-navy-900 to-navy-800 border border-gold-600/30 rounded-xl p-6 text-center space-y-3"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="inline-flex items-center gap-2 bg-gold-500/10 border border-gold-500/30 rounded-full px-4 py-1.5">
        <div className="w-5 h-5 bg-gradient-to-br from-gold-400 to-gold-600 rounded flex items-center justify-center">
          <span className="font-serif font-bold text-navy-900 text-xs">J</span>
        </div>
        <span className="text-gold-400 font-bold text-xs tracking-wider uppercase">JAD2 Advisory</span>
      </div>

      <h3 className="text-lg font-serif font-bold text-white">
        {lang === 'fr'
          ? 'Couvrez votre risque de change avec un expert'
          : 'احمِ مؤسستك من مخاطر صرف العملات مع خبير'}
      </h3>

      <p className="text-sm text-slate-400 max-w-lg mx-auto">
        {lang === 'fr'
          ? 'JAD2 Advisory accompagne les PME et TPE marocaines dans la gestion de leur exposition FX, la mise en place de couvertures à terme conformes à la réglementation Office des Changes, et l\'optimisation de leurs flux import/export.'
          : 'تواكب JAD2 Advisory المؤسسات الصغيرة والمتوسطة المغربية في إدارة مخاطر الصرف، وتأمين تغطيات آجلة متوافقة مع لوائح مكتب الصرف، وتحسين تدفقاتها من الاستيراد والتصدير.'}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {[
          lang === 'fr' ? 'Couverture à terme OC' : 'تغطية آجلة',
          lang === 'fr' ? 'Conseil FX PME'        : 'استشارة صرف للمؤسسات',
          lang === 'fr' ? 'Optimisation flux'      : 'تحسين التدفقات',
        ].map(tag => (
          <span key={tag} className="text-[10px] bg-gold-500/10 border border-gold-500/20 text-gold-400 px-2.5 py-1 rounded-full font-medium">
            {tag}
          </span>
        ))}
      </div>

      <a
        href="https://jad2advisory.com"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-6 py-2.5 bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold text-sm rounded-lg transition"
      >
        {lang === 'fr' ? 'Contacter JAD2 Advisory' : 'اتصل بـ JAD2 Advisory'}
        <ExternalLink size={14} />
      </a>
    </div>
  );
}

// ─── Disclaimer ───────────────────────────────────────────────────────────────

function Disclaimer({ lang }: { lang: 'fr' | 'ar' }) {
  const [expanded, setExpanded] = useState(false);
  const isRtl = lang === 'ar';

  return (
    <div className="bg-amber-900/10 border border-amber-700/30 rounded-lg p-4" dir={isRtl ? 'rtl' : 'ltr'}>
      <button
        onClick={() => setExpanded(e => !e)}
        className="flex items-center gap-2 text-amber-400 text-xs font-bold w-full text-left"
      >
        <AlertTriangle size={13} />
        {lang === 'fr' ? 'Avertissement – Informations indicatives uniquement' : 'تحذير – معلومات استرشادية فقط'}
        {expanded ? <ChevronUp size={12} className="ml-auto" /> : <ChevronDown size={12} className="ml-auto" />}
      </button>
      {expanded && (
        <p className="mt-2 text-xs text-amber-300/70 leading-relaxed">
          {lang === 'fr'
            ? 'Ce rapport de marché est fourni à titre purement informatif et pédagogique. Les taux et informations présentés sont indicatifs et ne constituent en aucun cas un conseil en investissement, une recommandation de trading, ou une offre de services financiers. Les taux de change réels peuvent différer significativement. JAD2 Advisory et JAD2FX déclinent toute responsabilité quant aux décisions prises sur la base de ces informations. Pour des opérations de change réelles, consultez votre banque ou un conseiller autorisé. Conforme à la réglementation de l\'Office des Changes du Maroc.'
            : 'يُقدَّم هذا التقرير للأغراض الإعلامية والتعليمية فقط. الأسعار والمعلومات المقدمة استرشادية ولا تمثل نصيحة استثمارية أو توصية تداول أو عرض خدمات مالية. قد تختلف أسعار الصرف الفعلية اختلافاً جوهرياً. تخلي JAD2 Advisory وJAD2FX مسؤوليتهما عن أي قرارات تُتخذ بناءً على هذه المعلومات. للعمليات الفعلية، يُرجى استشارة بنكك أو مستشار مرخص.'
          }
        </p>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MarketReport() {
  const [report,    setReport]    = useState<MarketReportType | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [lang,      setLang]      = useState<'fr' | 'ar'>('fr');
  const [refreshing, setRefreshing] = useState(false);
  const [liveRates, setLiveRates] = useState<Record<string, number>>({});

  const loadReport = useCallback(async () => {
    if (!PROXY) { setError('Proxy non configuré.'); setLoading(false); return; }
    setLoading(true);
    setError('');
    try {
      const r = await getPublishedReport(PROXY);
      setReport(r);
      if (r?.radarData) {
        const rates: Record<string, number> = {};
        for (const e of r.radarData) rates[e.currency] = e.currentRate;
        setLiveRates(rates);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshRates = async () => {
    setRefreshing(true);
    try {
      const { rates } = await fetchAllMadRates(DEFAULT_BASKET_CONFIG, PROXY || undefined);
      const updated: Record<string, number> = { ...liveRates };
      for (const r of rates) updated[r.currency] = r.mid;
      setLiveRates(updated);
    } catch (err) {
      console.warn('Refresh rates failed:', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { loadReport(); }, [loadReport]);

  // Merge live rates into radar
  const mergedRadar: RadarEntry[] = (report?.radarData ?? []).map(e => ({
    ...e,
    currentRate: liveRates[e.currency] ?? e.currentRate,
  }));

  const isRtl = lang === 'ar';

  // ── Loading ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500">
        <RefreshCw size={20} className="animate-spin mr-2" />
        <span className="text-sm">Chargement du rapport…</span>
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-700/40 rounded p-5 flex items-start gap-3 max-w-lg mx-auto mt-10">
        <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-red-300 mb-1">Erreur de chargement</p>
          <p className="text-xs text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  // ── No report published ─────────────────────────────────────────────────
  if (!report) {
    return (
      <div className="text-center py-24 space-y-4">
        <div className="w-16 h-16 bg-navy-800 border border-navy-600 rounded-full flex items-center justify-center mx-auto">
          <Newspaper size={28} className="text-slate-500" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-300">Aucun rapport publié</h2>
          <p className="text-sm text-slate-500 mt-1">
            Le prochain rapport de marché sera bientôt disponible.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] bg-gold-500/10 border border-gold-500/30 text-gold-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              {isRtl ? 'تقرير السوق' : 'Rapport de Marché'}
            </span>
            {report.isPublished && (
              <span className="text-[10px] bg-emerald-900/30 border border-emerald-700/40 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                {isRtl ? 'منشور' : 'PUBLIÉ'}
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-white leading-tight">
            {isRtl ? report.titleAr : report.titleFr}
          </h1>
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {new Date(report.createdAt).toLocaleDateString(isRtl ? 'ar-MA' : 'fr-MA', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              })}
            </span>
            <span className="text-slate-600">·</span>
            <span>{report.llmModel}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLang(lang === 'fr' ? 'ar' : 'fr')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-navy-600 bg-navy-800 rounded-lg text-slate-300 hover:border-gold-500 hover:text-gold-400 transition"
          >
            <Globe size={12} />
            {lang === 'fr' ? 'عربي' : 'Français'}
          </button>
          <button
            onClick={refreshRates}
            disabled={refreshing}
            title={isRtl ? 'تحديث الأسعار' : 'Rafraîchir les taux'}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-navy-600 bg-navy-800 rounded-lg text-slate-300 hover:border-gold-500 hover:text-gold-400 transition"
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            {isRtl ? 'تحديث' : 'Taux live'}
          </button>
        </div>
      </div>

      {/* ── Excerpt ── */}
      <div className="bg-navy-800 border-l-2 border-gold-500 pl-4 py-3 pr-3 rounded-r-lg">
        <p className="text-sm text-slate-300 leading-relaxed italic">
          {isRtl ? report.excerptAr : report.excerptFr}
        </p>
      </div>

      {/* ── Market Radar ── */}
      {mergedRadar.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-gold-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <TrendingUp size={14} />
            {isRtl ? 'رادار السوق' : 'Radar de Marché'}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {mergedRadar.map(entry => (
              <RadarCard key={entry.currency} entry={entry} lang={lang} />
            ))}
          </div>
        </div>
      )}

      {/* ── Full report content ── */}
      <div className="bg-white/5 border border-navy-700/50 rounded-xl p-6">
        <MarkdownContent
          text={isRtl ? report.contentAr : report.contentFr}
          isRtl={isRtl}
        />
      </div>

      {/* ── JAD2 Advisory CTA ── */}
      <AdvisoryCTA lang={lang} />

      {/* ── Disclaimer ── */}
      <Disclaimer lang={lang} />

      {/* ── Footer meta ── */}
      <div className="text-center text-[10px] text-slate-600 space-y-1 pb-4">
        <p>
          {isRtl ? 'تم التوليد بواسطة' : 'Généré par'} {report.llmModel}
          {report.generation.tavilySearchCount > 0 && ` · ${report.generation.tavilySearchCount} ${isRtl ? 'بحث ويب' : 'recherches web'}`}
        </p>
        <p>JAD2FX © {new Date().getFullYear()} — by JAD2 Advisory</p>
      </div>
    </div>
  );
}
