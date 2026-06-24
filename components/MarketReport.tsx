import React, { useState, useEffect, useCallback } from 'react';
import {
  Newspaper, Globe, RefreshCw, TrendingUp, TrendingDown, Minus,
  ExternalLink, AlertTriangle, Clock, ChevronDown, ChevronUp,
  Building2, Users, FileText, BarChart2, Shield,
} from 'lucide-react';
import { MarketReport as MarketReportType, RadarEntry } from '../types';
import { getPublishedReport } from '../services/reportStorage';
import { fetchAllMadRates } from '../services/fxRates';
import { DEFAULT_BASKET_CONFIG } from '../constants';

const PROXY = process.env.CORS_PROXY_URL ?? '';

// ─── Markdown section parser ──────────────────────────────────────────────────

interface MdSection {
  id: string;
  title: string;
  content: string;
}

function parseSections(text: string): MdSection[] {
  if (!text) return [];
  const sections: MdSection[] = [];
  let current: MdSection | null = null;
  for (const line of text.split('\n')) {
    if (line.startsWith('## ')) {
      if (current) sections.push(current);
      const title = line.slice(3).trim();
      current = { id: title.toLowerCase().replace(/\s+/g, '-'), title, content: '' };
    } else if (current) {
      current.content += line + '\n';
    }
  }
  if (current) sections.push(current);
  return sections;
}

// ─── Markdown renderer ────────────────────────────────────────────────────────

function parseBold(text: string): React.ReactNode {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="text-slate-100 font-semibold">{part}</strong> : part
  );
}

function MarkdownContent({ text, isRtl }: { text: string; isRtl?: boolean }) {
  if (!text?.trim()) return null;
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = (key: string) => {
    if (!listItems.length) return;
    elements.push(
      <ul key={key} className="space-y-1.5 my-3 text-slate-300 text-[13px]">
        {listItems.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="text-gold-500 mt-0.5 flex-shrink-0 text-xs">▸</span>
            <span className="leading-relaxed">{parseBold(item)}</span>
          </li>
        ))}
      </ul>
    );
    listItems = [];
  };

  lines.forEach((line, idx) => {
    const key = `l-${idx}`;
    if (line.startsWith('### ')) {
      flushList(`ul-${idx}`);
      elements.push(
        <h3 key={key} className="text-[12px] font-bold text-slate-200 mt-4 mb-1.5 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-gold-500 flex-shrink-0" />
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      listItems.push(line.slice(2));
    } else if (line.startsWith('---')) {
      flushList(`ul-${idx}`);
      elements.push(<hr key={key} className="border-navy-700 my-4" />);
    } else if (line.trim() === '') {
      flushList(`ul-${idx}`);
    } else {
      flushList(`ul-${idx}`);
      elements.push(
        <p key={key} className="text-[13px] text-slate-300 leading-relaxed my-1.5">{parseBold(line)}</p>
      );
    }
  });
  flushList('ul-end');

  return <div dir={isRtl ? 'rtl' : 'ltr'} className="space-y-0.5">{elements}</div>;
}

// ─── Sentiment styles ─────────────────────────────────────────────────────────

const SENTIMENT_STYLES = {
  BULLISH: { bg: 'bg-emerald-900/25 border-emerald-700/40', badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', Icon: TrendingUp,  barColor: '#10b981' },
  BEARISH: { bg: 'bg-red-900/20 border-red-700/40',         badge: 'bg-red-500/15 text-red-400 border-red-500/30',            Icon: TrendingDown, barColor: '#ef4444' },
  NEUTRAL: { bg: 'bg-navy-800/80 border-navy-700',          badge: 'bg-navy-700 text-slate-400 border-navy-600',             Icon: Minus,        barColor: '#64748b' },
};

// ─── Radar Card ───────────────────────────────────────────────────────────────

function RadarCard({ entry, lang }: { entry: RadarEntry; lang: 'fr' | 'ar'; key?: React.Key }) {
  const s = SENTIMENT_STYLES[entry.sentiment];
  const Icon = s.Icon;
  const isRtl = lang === 'ar';
  const changeSign = entry.weeklyChangeBps >= 0 ? '+' : '';

  return (
    <div className={`rounded-xl border p-4 space-y-3 ${s.bg}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{entry.flag}</span>
          <div>
            <p className="font-mono font-bold text-white text-[13px] leading-none">{entry.currency}/MAD</p>
            <div className={`inline-flex items-center gap-1 mt-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded border ${s.badge}`}>
              <Icon size={9} />
              {entry.sentiment}
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[17px] font-mono font-bold text-white tabular-nums">
            {entry.currentRate > 0 ? entry.currentRate.toFixed(4) : '—'}
          </p>
          {entry.weeklyChangeBps !== 0 && (
            <p className={`text-[10px] font-mono font-bold ${entry.weeklyChangeBps > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {changeSign}{entry.weeklyChangeBps} bps
            </p>
          )}
        </div>
      </div>

      <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">
        {lang === 'fr' ? entry.headline : entry.headlineAr}
      </p>

      <p className="text-[10px] text-slate-500 leading-snug">
        {lang === 'fr' ? entry.expectation : entry.expectationAr}
      </p>
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────

interface SectionMeta {
  keyFr: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}

const SECTION_META: Record<string, SectionMeta> = {
  'synthèse': { keyFr: 'Synthèse Exécutive', icon: FileText, color: 'text-gold-400', bg: 'bg-gold-500/8' },
  'contexte': { keyFr: 'Contexte Macro',      icon: Globe,    color: 'text-blue-400', bg: 'bg-blue-500/8' },
  'analyse':  { keyFr: 'Analyse Panier MAD',  icon: BarChart2, color: 'text-emerald-400', bg: 'bg-emerald-500/8' },
  'niveaux':  { keyFr: 'Niveaux Techniques',  icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/8' },
  'scénarios': { keyFr: 'Scénarios de Risque', icon: Shield, color: 'text-amber-400', bg: 'bg-amber-500/8' },
  'implications': { keyFr: 'Implications Stratégiques', icon: Building2, color: 'text-cyan-400', bg: 'bg-cyan-500/8' },
};

function getSectionMeta(title: string): SectionMeta {
  const titleLc = title.toLowerCase();
  for (const [key, meta] of Object.entries(SECTION_META)) {
    if (titleLc.includes(key)) return meta;
  }
  return { keyFr: title, icon: FileText, color: 'text-slate-400', bg: 'bg-navy-800' };
}

function SectionCard({ section, isRtl, defaultOpen = false }: { section: MdSection; isRtl: boolean; defaultOpen?: boolean; key?: React.Key }) {
  const [open, setOpen] = useState(defaultOpen);
  const meta = getSectionMeta(section.title);
  const Icon = meta.icon;

  return (
    <div className="bg-navy-900 border border-navy-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-navy-800/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-7 h-7 rounded-lg ${meta.bg} border border-navy-700 flex items-center justify-center flex-shrink-0`}>
            <Icon size={13} className={meta.color} />
          </div>
          <span className="text-[12px] font-bold text-white" dir={isRtl ? 'rtl' : 'ltr'}>{section.title}</span>
        </div>
        {open ? <ChevronUp size={13} className="text-navy-500" /> : <ChevronDown size={13} className="text-navy-500" />}
      </button>
      {open && (
        <div className="px-5 py-4 border-t border-navy-800">
          <MarkdownContent text={section.content} isRtl={isRtl} />
        </div>
      )}
    </div>
  );
}

// ─── SME Executive Summary card ───────────────────────────────────────────────

function SmeCard({ sections, excerpt, isRtl }: { sections: MdSection[]; excerpt: string; isRtl: boolean }) {
  const execSection = sections.find(s => s.title.toLowerCase().includes('synthèse') || s.title.toLowerCase().includes('executive'));
  const riskSection = sections.find(s => s.title.toLowerCase().includes('scénarios'));

  return (
    <div className="space-y-4">
      {/* Exec summary */}
      <div className="bg-gradient-to-br from-navy-900 to-navy-800 border border-gold-500/20 rounded-xl p-5" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded bg-gold-500/15 border border-gold-500/25 flex items-center justify-center">
            <FileText size={12} className="text-gold-400" />
          </div>
          <span className="text-[10px] font-bold text-gold-400 uppercase tracking-wider">
            {isRtl ? 'للمؤسسات — ما يجب معرفته' : 'Essentiel PME — Ce qu\'il faut retenir'}
          </span>
        </div>
        <p className="text-[13px] text-slate-300 leading-relaxed italic border-l-2 border-gold-500/40 pl-3 mb-3">
          {excerpt}
        </p>
        {execSection && (
          <div className="mt-3">
            <MarkdownContent text={execSection.content.split('\n').filter(l => l.startsWith('- ') || l.startsWith('* ')).join('\n')} isRtl={isRtl} />
          </div>
        )}
      </div>

      {/* Risk alert */}
      {riskSection && (
        <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-4" dir={isRtl ? 'rtl' : 'ltr'}>
          <div className="flex items-center gap-2 mb-2">
            <Shield size={13} className="text-amber-400" />
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
              {isRtl ? 'سيناريوهات المخاطر' : 'Scénarios de Risque'}
            </span>
          </div>
          <MarkdownContent text={riskSection.content.split('\n').filter(l => l.startsWith('### ')).map(l => '- ' + l.slice(4)).join('\n')} isRtl={isRtl} />
        </div>
      )}
    </div>
  );
}

// ─── Advisory CTA ─────────────────────────────────────────────────────────────

function AdvisoryCTA({ lang }: { lang: 'fr' | 'ar' }) {
  const isRtl = lang === 'ar';
  return (
    <div className="bg-navy-900 border border-gold-600/25 rounded-xl p-5 flex flex-col sm:flex-row items-center gap-5" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 bg-gradient-to-br from-gold-400 to-gold-700 rounded flex items-center justify-center">
            <span className="font-serif font-bold text-navy-900 text-[10px]">J2</span>
          </div>
          <span className="text-[10px] font-bold text-gold-400 uppercase tracking-wider">JAD2 Advisory</span>
          <span className="text-[9px] text-navy-600 border border-navy-700 rounded px-1.5 py-0.5">
            {lang === 'fr' ? 'Conseil Stratégique & Formation' : 'استشارة استراتيجية وتدريب'}
          </span>
        </div>
        <p className="text-[13px] font-semibold text-white mb-1">
          {lang === 'fr'
            ? 'Renforcez la gestion de votre risque de change'
            : 'عزز إدارة مخاطر الصرف في مؤسستك'}
        </p>
        <p className="text-[11px] text-navy-400 leading-relaxed">
          {lang === 'fr'
            ? 'Formation équipes finance · Stratégie de couverture · Conformité OC/BKAM · Non intermédiaire financier agréé BAM'
            : 'تدريب فرق المالية · استراتيجية التحوط · الامتثال لمكتب الصرف / BAM · غير وسيط مالي'}
        </p>
      </div>
      <a
        href="https://jad2advisory.com"
        target="_blank"
        rel="noopener noreferrer"
        className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold text-[12px] rounded-lg transition-colors"
      >
        {lang === 'fr' ? 'jad2advisory.com' : 'jad2advisory.com'}
        <ExternalLink size={12} />
      </a>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type ViewMode = 'sme' | 'institution';

export default function MarketReport() {
  const [report,    setReport]    = useState<MarketReportType | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [lang,      setLang]      = useState<'fr' | 'ar'>('fr');
  const [viewMode,  setViewMode]  = useState<ViewMode>('sme');
  const [refreshing, setRefreshing] = useState(false);
  const [liveRates, setLiveRates] = useState<Record<string, number>>({});
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);

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
    } catch { /* silent */ } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { loadReport(); }, [loadReport]);

  const mergedRadar: RadarEntry[] = (report?.radarData ?? []).map(e => ({
    ...e,
    currentRate: liveRates[e.currency] ?? e.currentRate,
  }));

  const isRtl = lang === 'ar';

  // ── Loading ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-navy-500">
        <RefreshCw size={18} className="animate-spin mr-2" />
        <span className="text-[13px]">Chargement du rapport…</span>
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-700/40 rounded-xl p-5 flex items-start gap-3 max-w-lg mx-auto mt-10">
        <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-[13px] font-bold text-red-300 mb-1">Erreur de chargement</p>
          <p className="text-[11px] text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  // ── No report ───────────────────────────────────────────────────────────
  if (!report) {
    return (
      <div className="text-center py-24 space-y-4">
        <div className="w-16 h-16 bg-navy-800 border border-navy-700 rounded-full flex items-center justify-center mx-auto">
          <Newspaper size={28} className="text-navy-500" />
        </div>
        <div>
          <p className="text-[14px] font-bold text-slate-400">Aucun rapport publié</p>
          <p className="text-[12px] text-navy-500 mt-1">Le prochain rapport de marché sera bientôt disponible.</p>
        </div>
      </div>
    );
  }

  const sections = parseSections(isRtl ? report.contentAr : report.contentFr);
  const excerpt  = isRtl ? report.excerptAr : report.excerptFr;
  const title    = isRtl ? report.titleAr : report.titleFr;

  return (
    <div className="max-w-4xl mx-auto space-y-5" dir={isRtl ? 'rtl' : 'ltr'}>

      {/* ── Cover card ─────────────────────────────────────────────────── */}
      <div className="bg-navy-900 border border-navy-800 rounded-xl overflow-hidden">
        {/* Top stripe */}
        <div className="h-1 bg-gradient-to-r from-gold-600 via-gold-400 to-gold-600" />
        <div className="p-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex-1 min-w-0">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-[9px] bg-gold-500/15 border border-gold-500/30 text-gold-400 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  {isRtl ? 'تقرير أسبوعي' : 'Rapport Hebdomadaire'}
                </span>
                {report.isPublished && (
                  <span className="text-[9px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    {isRtl ? 'منشور' : 'PUBLIÉ'}
                  </span>
                )}
                <span className="text-[9px] bg-navy-800 border border-navy-700 text-navy-400 px-2 py-0.5 rounded font-mono">
                  {report.llmModel}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-[18px] sm:text-[22px] font-serif font-bold text-white leading-snug mb-2">
                {title}
              </h1>

              {/* Date */}
              <div className="flex items-center gap-1.5 text-[10px] text-navy-500">
                <Clock size={10} />
                {new Date(report.createdAt).toLocaleDateString(isRtl ? 'ar-MA' : 'fr-MA', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                })}
                {report.generation.tavilySearchCount > 0 && (
                  <>
                    <span className="text-navy-700">·</span>
                    <span>{report.generation.tavilySearchCount} {isRtl ? 'مصادر' : 'sources web'}</span>
                  </>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-2 items-end">
              {/* Language toggle */}
              <button
                onClick={() => setLang(lang === 'fr' ? 'ar' : 'fr')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] border border-navy-700 bg-navy-800 rounded-lg text-slate-300 hover:border-gold-500 hover:text-gold-400 transition-colors"
              >
                <Globe size={11} />
                {lang === 'fr' ? 'عربي' : 'Français'}
              </button>
              {/* Refresh rates */}
              <button
                onClick={refreshRates}
                disabled={refreshing}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] border border-navy-700 bg-navy-800 rounded-lg text-slate-300 hover:border-gold-500 hover:text-gold-400 transition-colors"
              >
                <RefreshCw size={11} className={refreshing ? 'animate-spin' : ''} />
                {isRtl ? 'تحديث' : 'Taux live'}
              </button>
            </div>
          </div>

          {/* Executive excerpt — always visible */}
          <div className="mt-4 border-l-2 border-gold-500/50 pl-4 py-1">
            <p className="text-[13px] text-slate-300 leading-relaxed italic">{excerpt}</p>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="border-t border-navy-800 px-6 py-3 flex items-center gap-2 bg-navy-950/30">
          <span className="text-[10px] text-navy-500 uppercase tracking-wider font-bold mr-2">Vue :</span>
          {([
            { mode: 'sme' as ViewMode,         icon: Users,      labelFr: 'PME / Trésorier',       labelAr: 'المؤسسات الصغيرة' },
            { mode: 'institution' as ViewMode, icon: Building2,  labelFr: 'Institutionnel / Analyste', labelAr: 'مؤسسي / محلل' },
          ]).map(opt => {
            const Icon = opt.icon;
            const active = viewMode === opt.mode;
            return (
              <button
                key={opt.mode}
                onClick={() => setViewMode(opt.mode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                  active
                    ? 'bg-gold-500 text-navy-950 font-bold'
                    : 'border border-navy-700 text-navy-400 hover:text-white hover:border-navy-600'
                }`}
              >
                <Icon size={11} />
                {isRtl ? opt.labelAr : opt.labelFr}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── SME view ──────────────────────────────────────────────────── */}
      {viewMode === 'sme' && (
        <SmeCard sections={sections} excerpt={excerpt} isRtl={isRtl} />
      )}

      {/* ── FX Radar (both views) ─────────────────────────────────────── */}
      {mergedRadar.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={13} className="text-gold-500" />
            <h2 className="text-[11px] font-bold text-white uppercase tracking-[0.12em]">
              {isRtl ? 'رادار السوق' : 'Radar de Marché MAD'}
            </h2>
            <span className="text-[9px] text-navy-600 border border-navy-800 rounded px-1.5 py-0.5">
              {mergedRadar.length} {isRtl ? 'عملات' : 'devises'}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {mergedRadar.map(entry => (
              <RadarCard key={entry.currency} entry={entry} lang={lang} />
            ))}
          </div>
        </div>
      )}

      {/* ── Institutional view — full sections ────────────────────────── */}
      {viewMode === 'institution' && sections.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Building2 size={13} className="text-gold-500" />
            <h2 className="text-[11px] font-bold text-white uppercase tracking-[0.12em]">
              {isRtl ? 'التقرير التحليلي الكامل' : 'Analyse Institutionnelle Complète'}
            </h2>
          </div>
          {sections.map((section, i) => (
            <SectionCard
              key={section.id}
              section={section}
              isRtl={isRtl}
              defaultOpen={i === 0}
            />
          ))}
        </div>
      )}

      {/* If no sections parsed in institution mode, fall back to raw content */}
      {viewMode === 'institution' && sections.length === 0 && (
        <div className="bg-navy-900 border border-navy-800 rounded-xl p-6">
          <MarkdownContent
            text={isRtl ? report.contentAr : report.contentFr}
            isRtl={isRtl}
          />
        </div>
      )}

      {/* ── Advisory CTA ──────────────────────────────────────────────── */}
      <AdvisoryCTA lang={lang} />

      {/* ── Disclaimer ────────────────────────────────────────────────── */}
      <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-4">
        <button
          onClick={() => setDisclaimerOpen(o => !o)}
          className="flex items-center gap-2 text-amber-400 text-[11px] font-bold w-full text-left"
        >
          <AlertTriangle size={12} />
          {isRtl ? 'تحذير — معلومات استرشادية فقط' : 'Avertissement — Informations indicatives uniquement'}
          {disclaimerOpen ? <ChevronUp size={11} className="ml-auto" /> : <ChevronDown size={11} className="ml-auto" />}
        </button>
        {disclaimerOpen && (
          <p className="mt-3 text-[11px] text-amber-300/70 leading-relaxed" dir={isRtl ? 'rtl' : 'ltr'}>
            {isRtl
              ? 'يُقدَّم هذا التقرير للأغراض الإعلامية والتعليمية فقط. الأسعار والمعلومات المقدمة استرشادية ولا تمثل نصيحة استثمارية أو توصية تداول. JAD2 Advisory غير مرخص من بنك المغرب كوسيط مالي. للعمليات الفعلية، يُرجى استشارة بنكك.'
              : 'Ce rapport est fourni à titre purement informatif et pédagogique. JAD2 Advisory est un cabinet de conseil stratégique et de formation — non intermédiaire financier agréé par Bank Al-Maghrib, non conseiller en investissement agréé AMMC. Les taux présentés sont indicatifs et non-exécutables. Pour des transactions de change, consultez votre banque ou un établissement agréé.'}
          </p>
        )}
      </div>

      {/* ── Footer meta ───────────────────────────────────────────────── */}
      <div className="text-center text-[10px] text-navy-700 pb-4" dir="ltr">
        <p>JAD2FX Market Intelligence · {report.llmModel} · {new Date(report.createdAt).toLocaleDateString('fr-MA')}</p>
        <p>© {new Date().getFullYear()} JAD2 Advisory — conseil stratégique & formation risque de change · Non conseil en investissement</p>
      </div>
    </div>
  );
}
