import React, { useState, useEffect, useCallback } from 'react';
import {
  Newspaper, Plus, Trash2, Globe, CheckCircle, XCircle, RefreshCw,
  ChevronDown, ChevronUp, Eye, Loader, Search, Zap, AlertTriangle,
  BookOpen,
} from 'lucide-react';
import CurrencyFlag from '../CurrencyFlag';

const RADAR_CC: Record<string, string> = {
  EUR:'eu', USD:'us', GBP:'gb', CHF:'ch', JPY:'jp', CAD:'ca',
  SAR:'sa', AED:'ae', QAR:'qa', KWD:'kw',
};
import { useAdmin } from '../../context/AdminContext';
import { generateReport, GeneratorProgress } from '../../services/reportGenerator';
import { listReports, saveReport, publishReport, deleteReport, ReportMeta } from '../../services/reportStorage';
import { MarketReport, ReportSettings } from '../../types';
import { getAvailableProviders, PROVIDER_LABELS, LLMProvider } from '../../services/llmRouter';

const PASSCODE  = process.env.ADMIN_PASSCODE ?? 'JAD2ADMIN';
const SETTINGS_KEY = 'jad2fx_report_settings';

const DEFAULT_SETTINGS: ReportSettings = {
  editorialLine:    'Rapport factuel et pédagogique pour PME/TPE marocaines. Inclure impact pratique sur coûts import/export. Mentionner les services JAD2 Advisory pour la couverture de change.',
  editorialLineAr:  'تقرير واقعي وتعليمي للمؤسسات الصغيرة والمتوسطة المغربية. تضمين التأثير العملي على تكاليف الاستيراد والتصدير.',
  defaultQueries: [
    'Marché des changes Maroc MAD EUR USD actualité semaine',
    'Bank Al-Maghrib fixing taux change MAD',
    'Économie Maroc PME import export devise',
    'Euro dollar taux change Banque Centrale Européenne',
    'Riyal saoudien dirham MAD marché de change',
  ],
  defaultModel:  'groq',
  autoPublish:   false,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('fr-MA', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function fmtMs(ms: number) {
  return ms < 60000 ? `${(ms / 1000).toFixed(0)}s` : `${(ms / 60000).toFixed(1)} min`;
}

const SENTIMENT_COLOR = {
  BULLISH: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/40',
  BEARISH: 'bg-red-900/40 text-red-300 border-red-700/40',
  NEUTRAL: 'bg-slate-800 text-slate-300 border-slate-600',
};

// ─── Inline preview ───────────────────────────────────────────────────────────

function ReportPreview({ report, onSave, onClose, isSaving }: {
  report: MarketReport;
  onSave:  () => void;
  onClose: () => void;
  isSaving: boolean;
}) {
  const [lang, setLang] = useState<'fr' | 'ar'>('fr');

  return (
    <div className="bg-navy-800 border border-gold-600/40 rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-bold text-white text-base">{lang === 'fr' ? report.titleFr : report.titleAr}</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Généré par {report.llmModel} · {fmtMs(report.generation.durationMs)}
            {report.generation.tavilySearchCount > 0 && ` · ${report.generation.tavilySearchCount} recherches Tavily`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setLang(lang === 'fr' ? 'ar' : 'fr')}
            className="px-3 py-1 text-xs border border-navy-600 rounded text-slate-300 hover:border-gold-500 hover:text-gold-400 transition"
          >
            {lang === 'fr' ? 'عربي' : 'Français'}
          </button>
          <button onClick={onClose} className="px-3 py-1 text-xs border border-navy-600 rounded text-slate-400 hover:text-white transition">
            Fermer
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="px-4 py-1.5 text-xs bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold rounded transition disabled:opacity-50"
          >
            {isSaving ? <Loader size={12} className="animate-spin inline mr-1" /> : null}
            Enregistrer
          </button>
        </div>
      </div>

      {/* Excerpt */}
      <div className="bg-navy-900 rounded p-3 border border-navy-700" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <p className="text-sm text-slate-300 italic">{lang === 'fr' ? report.excerptFr : report.excerptAr}</p>
      </div>

      {/* Radar quick view */}
      {report.radarData.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {report.radarData.map(r => (
            <div key={r.currency} className={`rounded border p-2 text-xs ${SENTIMENT_COLOR[r.sentiment]}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono font-bold inline-flex items-center gap-1">{RADAR_CC[r.currency] && <CurrencyFlag countryCode={RADAR_CC[r.currency]} size="xs" />} {r.currency}/MAD</span>
                <span className={`text-[10px] px-1 rounded font-bold border ${SENTIMENT_COLOR[r.sentiment]}`}>
                  {r.sentiment}
                </span>
              </div>
              <div className="text-slate-400 truncate">{lang === 'fr' ? r.headline : r.headlineAr}</div>
            </div>
          ))}
        </div>
      )}

      {/* Content preview (first 400 chars) */}
      <div className="bg-navy-900 rounded p-3 border border-navy-700 max-h-32 overflow-hidden relative" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">
          {(lang === 'fr' ? report.contentFr : report.contentAr).slice(0, 400)}…
        </p>
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-navy-900 pointer-events-none" />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ReportsAdmin() {
  const { config, livePrices } = useAdmin();
  const corsProxy = config.corsProxyUrl;

  // Settings (localStorage)
  const [settings, setSettings] = useState<ReportSettings>(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
    } catch { return DEFAULT_SETTINGS; }
  });

  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [progress,     setProgress]     = useState<GeneratorProgress | null>(null);
  const [genError,     setGenError]     = useState('');
  const [preview,      setPreview]      = useState<MarketReport | null>(null);
  const [isSaving,     setIsSaving]     = useState(false);
  const [reports,      setReports]      = useState<ReportMeta[]>([]);
  const [loadingList,  setLoadingList]  = useState(false);
  const [listError,    setListError]    = useState('');
  const [adminNotes,   setAdminNotes]   = useState('');
  const [queryInput,   setQueryInput]   = useState(settings.defaultQueries.join('\n'));

  const saveSettings = useCallback((patch: Partial<ReportSettings>) => {
    setSettings(s => {
      const next = { ...s, ...patch };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // Sync queryInput → settings.defaultQueries on blur
  const syncQueries = () => {
    const qs = queryInput.split('\n').map(q => q.trim()).filter(Boolean);
    saveSettings({ defaultQueries: qs });
  };

  // ── Load reports list ────────────────────────────────────────────────────
  const loadList = useCallback(async () => {
    if (!corsProxy) return;
    setLoadingList(true);
    setListError('');
    try {
      const list = await listReports(corsProxy, PASSCODE);
      setReports(list);
    } catch (err) {
      setListError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingList(false);
    }
  }, [corsProxy]);

  useEffect(() => { loadList(); }, [loadList]);

  // ── Generate report ──────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!corsProxy) { setGenError('CORS_PROXY_URL non configuré.'); return; }

    const queries = queryInput.split('\n').map(q => q.trim()).filter(Boolean);
    if (queries.length === 0) { setGenError('Ajoutez au moins une requête de recherche.'); return; }

    setGenError('');
    setPreview(null);

    const liveRates: Record<string, number> = {};
    for (const p of livePrices) liveRates[p.currency] = p.mid;

    try {
      const report = await generateReport(
        {
          tavilyQueries:  queries,
          editorialLine:   settings.editorialLine,
          editorialLineAr: settings.editorialLineAr,
          adminNotes,
          liveRates,
          corsProxyUrl:    corsProxy,
          passcode:        PASSCODE,
          preferredModel:  settings.defaultModel as LLMProvider,
        },
        (p) => setProgress(p)
      );
      setPreview(report);
      setProgress(null);
    } catch (err) {
      setProgress(null);
      setGenError(err instanceof Error ? err.message : String(err));
    }
  };

  // ── Save generated report ────────────────────────────────────────────────
  const handleSave = async () => {
    if (!preview || !corsProxy) return;
    setIsSaving(true);
    try {
      const toSave = { ...preview, isPublished: settings.autoPublish };
      await saveReport(toSave, corsProxy, PASSCODE);
      if (settings.autoPublish) {
        await publishReport(preview.id, true, corsProxy, PASSCODE);
      }
      setPreview(null);
      await loadList();
    } catch (err) {
      setGenError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSaving(false);
    }
  };

  // ── Publish / unpublish ──────────────────────────────────────────────────
  const handlePublish = async (id: string, pub: boolean) => {
    if (!corsProxy) return;
    try {
      await publishReport(id, pub, corsProxy, PASSCODE);
      await loadList();
    } catch (err) {
      setListError(err instanceof Error ? err.message : String(err));
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!corsProxy) return;
    if (!confirm('Supprimer ce rapport ?')) return;
    try {
      await deleteReport(id, corsProxy, PASSCODE);
      await loadList();
    } catch (err) {
      setListError(err instanceof Error ? err.message : String(err));
    }
  };

  const isGenerating = progress !== null && progress.step !== 'DONE' && progress.step !== 'ERROR';
  const availProviders = getAvailableProviders();

  // ─── No proxy configured ─────────────────────────────────────────────────
  if (!corsProxy) {
    return (
      <div className="bg-amber-900/20 border border-amber-700/40 rounded p-5 flex items-start gap-3">
        <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-300">
          <p className="font-bold mb-1">CORS_PROXY_URL non configuré</p>
          <p>Ajoutez <code className="bg-navy-900 px-1 rounded">VITE_CORS_PROXY_URL=https://…</code> dans votre fichier <code>.env</code> pour activer les rapports de marché.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Newspaper size={16} className="text-gold-400" />
          <h2 className="font-bold text-white text-sm">Rapports de Marché</h2>
        </div>
        <button
          onClick={() => setShowSettings(s => !s)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-navy-600 rounded text-slate-300 hover:border-gold-500 hover:text-gold-400 transition"
        >
          {showSettings ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          Paramètres
        </button>
      </div>

      {/* ── Settings panel ── */}
      {showSettings && (
        <div className="bg-navy-800 border border-navy-600 rounded-lg p-5 space-y-4">
          <h3 className="text-xs font-bold text-gold-400 uppercase tracking-wider">Paramètres de génération</h3>

          {/* Model selection */}
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Modèle LLM préféré</label>
            <div className="flex flex-wrap gap-2">
              {(['groq', 'gemini', 'openrouter'] as LLMProvider[]).map(p => {
                const avail = availProviders.includes(p);
                return (
                  <button
                    key={p}
                    onClick={() => saveSettings({ defaultModel: p })}
                    disabled={!avail}
                    className={`px-3 py-1.5 text-xs rounded border transition ${
                      settings.defaultModel === p
                        ? 'bg-gold-500/20 border-gold-500 text-gold-400'
                        : avail
                          ? 'border-navy-600 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                          : 'border-navy-700 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    {PROVIDER_LABELS[p]}
                    {!avail && ' (clé manquante)'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Auto-publish */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-white">Auto-publier</p>
              <p className="text-[10px] text-slate-500">Publier automatiquement après génération</p>
            </div>
            <button
              onClick={() => saveSettings({ autoPublish: !settings.autoPublish })}
              className={`w-10 h-5 rounded-full relative transition-colors ${settings.autoPublish ? 'bg-gold-500' : 'bg-slate-700'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${settings.autoPublish ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>

          {/* Editorial line FR */}
          <div>
            <label className="text-xs text-slate-400 block mb-1">Ligne éditoriale (Français)</label>
            <textarea
              value={settings.editorialLine}
              onChange={e => saveSettings({ editorialLine: e.target.value })}
              rows={3}
              className="w-full bg-navy-900 border border-navy-600 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-gold-500 resize-none"
            />
          </div>

          {/* Editorial line AR */}
          <div>
            <label className="text-xs text-slate-400 block mb-1">Ligne éditoriale (Arabe)</label>
            <textarea
              value={settings.editorialLineAr}
              onChange={e => saveSettings({ editorialLineAr: e.target.value })}
              rows={2}
              dir="rtl"
              className="w-full bg-navy-900 border border-navy-600 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-gold-500 resize-none font-arabic"
            />
          </div>
        </div>
      )}

      {/* ── Generation form ── */}
      <div className="bg-navy-800 border border-navy-600 rounded-lg p-5 space-y-4">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Zap size={12} className="text-gold-400" /> Générer un nouveau rapport
        </h3>

        {/* Tavily queries */}
        <div>
          <label className="text-xs text-slate-400 block mb-1">
            Requêtes de recherche Tavily <span className="text-slate-500">(une par ligne)</span>
          </label>
          <textarea
            value={queryInput}
            onChange={e => setQueryInput(e.target.value)}
            onBlur={syncQueries}
            rows={5}
            className="w-full bg-navy-900 border border-navy-600 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-gold-500 resize-none font-mono"
            placeholder="Marché des changes Maroc MAD EUR..."
          />
        </div>

        {/* Admin notes */}
        <div>
          <label className="text-xs text-slate-400 block mb-1">Notes additionnelles pour l'IA</label>
          <input
            type="text"
            value={adminNotes}
            onChange={e => setAdminNotes(e.target.value)}
            className="w-full bg-navy-900 border border-navy-600 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-gold-500"
            placeholder="Ex: Focus sur l'impact du dollar sur les importations de céréales"
          />
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full py-2.5 bg-gold-500 hover:bg-gold-400 disabled:opacity-60 text-navy-900 font-bold text-sm rounded transition flex items-center justify-center gap-2"
        >
          {isGenerating
            ? <><Loader size={14} className="animate-spin" /> {progress?.detail ?? 'En cours…'}</>
            : <><Search size={14} /> Générer le rapport</>
          }
        </button>

        {/* Progress steps */}
        {isGenerating && progress && (
          <div className="flex items-center gap-2 justify-center">
            {['SEARCHING', 'GENERATING', 'PARSING'].map(step => (
              <div key={step} className={`flex items-center gap-1 text-[10px] ${
                progress.step === step ? 'text-gold-400' : 'text-slate-600'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${progress.step === step ? 'bg-gold-400 animate-pulse' : 'bg-slate-700'}`} />
                {step === 'SEARCHING' ? 'Recherche' : step === 'GENERATING' ? 'Génération IA' : 'Traitement'}
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {genError && (
          <div className="bg-red-900/20 border border-red-700/40 rounded p-3 flex items-start gap-2">
            <AlertTriangle size={13} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-300 font-mono whitespace-pre-wrap break-all">{genError}</p>
          </div>
        )}
      </div>

      {/* ── Preview ── */}
      {preview && (
        <ReportPreview
          report={preview}
          onSave={handleSave}
          onClose={() => setPreview(null)}
          isSaving={isSaving}
        />
      )}

      {/* ── Reports list ── */}
      <div className="bg-navy-800 border border-navy-600 rounded-lg p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen size={12} className="text-gold-400" /> Rapports enregistrés
          </h3>
          <button
            onClick={loadList}
            disabled={loadingList}
            className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1"
          >
            <RefreshCw size={11} className={loadingList ? 'animate-spin' : ''} /> Actualiser
          </button>
        </div>

        {listError && (
          <p className="text-xs text-red-400">{listError}</p>
        )}

        {reports.length === 0 && !loadingList && (
          <p className="text-xs text-slate-500 text-center py-4">Aucun rapport enregistré.</p>
        )}

        <div className="space-y-2">
          {reports.map(r => (
            <div key={r.id} className="flex items-center gap-3 bg-navy-900 rounded p-3 border border-navy-700">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{r.titleFr}</p>
                <p className="text-[10px] text-slate-500">{fmtDate(r.createdAt)} · {r.llmModel}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {r.isPublished
                  ? <span className="text-[10px] bg-emerald-900/40 text-emerald-400 border border-emerald-700/40 px-1.5 py-0.5 rounded font-bold">PUBLIÉ</span>
                  : <span className="text-[10px] bg-navy-800 text-slate-500 border border-navy-600 px-1.5 py-0.5 rounded">BROUILLON</span>
                }
                <button
                  onClick={() => handlePublish(r.id, !r.isPublished)}
                  title={r.isPublished ? 'Dépublier' : 'Publier'}
                  className="p-1 rounded hover:bg-navy-700 transition"
                >
                  {r.isPublished
                    ? <XCircle size={14} className="text-slate-400 hover:text-red-400" />
                    : <CheckCircle size={14} className="text-slate-400 hover:text-emerald-400" />
                  }
                </button>
                <button
                  onClick={() => handleDelete(r.id)}
                  title="Supprimer"
                  className="p-1 rounded hover:bg-navy-700 transition"
                >
                  <Trash2 size={14} className="text-slate-500 hover:text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
