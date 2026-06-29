import { useState, useEffect, useRef } from 'react';
import { X, Maximize2, Minimize2, ChevronRight, Move } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';

/**
 * P2.6 — MultiPane grid.
 * 1/2/4 panes with drag-resize and fullscreen toggle. Each pane can host
 * a different view (Live, Forward, Bands, etc.).
 */

type ViewId = 'LIVE' | 'FORWARDS' | 'BANDS' | 'PARITY_MATRIX' | 'MARKET_ANALYSIS' | 'VOL_SURFACE' | 'BANK_RATES' | 'CORRELATION';

interface PaneConfig {
  id: string;
  view: ViewId;
  title: string;
}

interface MultiPaneProps {
  initialLayout?: PaneConfig[];
  defaultView?: ViewId;
}

const VIEW_LABELS: Record<ViewId, string> = {
  LIVE: 'Live Pricer',
  FORWARDS: 'Forward Calculator',
  BANDS: 'Bandes BKAM',
  PARITY_MATRIX: 'Matrice de Parité',
  MARKET_ANALYSIS: 'Analyse Marché',
  VOL_SURFACE: 'Vol Surface',
  BANK_RATES: 'Banques',
  CORRELATION: 'Corrélation',
};

const STORAGE_KEY = 'jad2fx_multipane_layout_v1';

const DEFAULT_LAYOUTS: Record<1 | 2 | 4, PaneConfig[][]> = {
  1: [[{ id: 'p1', view: 'LIVE', title: 'Live Pricer' }]],
  2: [
    [{ id: 'p1', view: 'LIVE', title: 'Live' }, { id: 'p2', view: 'FORWARDS', title: 'Forward' }],
    [{ id: 'p1', view: 'BANDS', title: 'Bandes' }, { id: 'p2', view: 'CORRELATION', title: 'Corrélation' }],
  ],
  4: [
    [
      { id: 'p1', view: 'LIVE',         title: 'Live' },
      { id: 'p2', view: 'FORWARDS',     title: 'Forward' },
      { id: 'p3', view: 'BANDS',        title: 'Bandes' },
      { id: 'p4', view: 'BANK_RATES',   title: 'Banques' },
    ],
  ],
};

const VIEW_LOADER: Record<ViewId, () => Promise<{ default: any }>> = {
  LIVE:            () => import('./LivePricer'),
  FORWARDS:        () => import('./ForwardCalculator'),
  BANDS:           () => import('./BkamBandsVisualizer'),
  PARITY_MATRIX:   () => import('./BkamParityMatrix'),
  MARKET_ANALYSIS: () => import('./MarketAnalysis'),
  VOL_SURFACE:     () => import('./VolSurfacePage'),
  BANK_RATES:      () => import('./BankRatesPage'),
  CORRELATION:     () => import('./CorrelationHeatmap'),
};

export default function MultiPane({ initialLayout, defaultView = 'LIVE' }: MultiPaneProps) {
  const { config: _config } = useAdmin();
  const [layoutCount, setLayoutCount] = useState<1 | 2 | 4>(2);
  const [panes, setPanes] = useState<PaneConfig[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch { /* ignore */ }
    return initialLayout ?? DEFAULT_LAYOUTS[2][0];
  });
  const [fullscreenId, setFullscreenId] = useState<string | null>(null);
  const [changingView, setChangingView] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Persist
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(panes)); } catch { /* ignore */ }
  }, [panes]);

  const setLayout = (n: 1 | 2 | 4) => {
    setLayoutCount(n);
    setPanes(DEFAULT_LAYOUTS[n][0].map((p, i) => ({ ...p, id: `p${i + 1}` })));
    setFullscreenId(null);
  };

  const setPaneView = (id: string, view: ViewId) => {
    setPanes((ps) => ps.map((p) => (p.id === id ? { ...p, view, title: VIEW_LABELS[view] } : p)));
    setChangingView(null);
  };

  const removePane = (id: string) => {
    setPanes((ps) => ps.filter((p) => p.id !== id));
    if (fullscreenId === id) setFullscreenId(null);
  };

  // Drag-resize
  const dragRef = useRef<{ paneId: string; startX: number; startWidth: number } | null>(null);
  const onMouseDown = (paneId: string, e: React.MouseEvent) => {
    dragRef.current = { paneId, startX: e.clientX, startWidth: (e.currentTarget as HTMLElement).offsetWidth };
    e.preventDefault();
  };
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const newWidth = Math.max(280, Math.min(900, dragRef.current.startWidth + dx));
      const el = document.querySelector(`[data-pane-id="${dragRef.current.paneId}"]`) as HTMLElement;
      if (el) el.style.flex = `0 0 ${newWidth}px`;
    };
    const onUp = () => { dragRef.current = null; };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, []);

  const visiblePanes = fullscreenId ? panes.filter((p) => p.id === fullscreenId) : panes;

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap bg-navy-900 border border-navy-700 rounded-lg p-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-2">Layout</span>
        {([1, 2, 4] as const).map((n) => (
          <button
            key={n}
            onClick={() => setLayout(n)}
            className={`px-3 py-1.5 text-[11px] font-bold rounded transition-colors ${
              layoutCount === n ? 'bg-gold-500 text-navy-950' : 'bg-navy-950 text-slate-300 border border-navy-700'
            }`}
          >
            {n === 1 ? '1' : n === 2 ? '2 côte' : '2×2'} ({n} pane{n > 1 ? 's' : ''})
          </button>
        ))}
        {fullscreenId && (
          <button
            onClick={() => setFullscreenId(null)}
            className="ml-auto flex items-center gap-1 text-[11px] text-gold-400 hover:text-gold-300"
          >
            <Minimize2 size={12} /> Quitter plein écran
          </button>
        )}
        <span className="text-[10px] text-slate-500 ml-auto">
          💡 Cliquez le bord droit d'un pane pour redimensionner
        </span>
      </div>

      {/* Panes container */}
      <div
        ref={containerRef}
        className="flex gap-3 overflow-x-auto"
        style={{ minHeight: '500px' }}
      >
        {visiblePanes.map((pane) => (
          <Pane
            key={pane.id}
            pane={pane}
            isFullscreen={!!fullscreenId}
            onFullscreen={() => setFullscreenId(pane.id === fullscreenId ? null : pane.id)}
            onClose={() => removePane(pane.id)}
            onChangeView={() => setChangingView(pane.id)}
            onResizeStart={(e) => onMouseDown(pane.id, e)}
            isChangingView={changingView === pane.id}
            onSelectView={(v) => setPaneView(pane.id, v)}
          />
        ))}
      </div>
    </div>
  );
}

function Pane({ pane, isFullscreen, onFullscreen, onClose, onChangeView, onResizeStart, isChangingView, onSelectView }: {
  pane: PaneConfig;
  isFullscreen: boolean;
  onFullscreen: () => void;
  onClose: () => void;
  onChangeView: () => void;
  onResizeStart: (e: React.MouseEvent) => void;
  isChangingView: boolean;
  onSelectView: (v: ViewId) => void;
}) {
  const [Component, setComponent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    VIEW_LOADER[pane.view]()
      .then((mod) => {
        if (!cancelled) {
          setComponent(() => mod.default);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(String(e));
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [pane.view]);

  return (
    <div
      data-pane-id={pane.id}
      className={`relative flex flex-col bg-navy-900 border border-navy-700 rounded-xl overflow-hidden ${
        isFullscreen ? 'flex-1' : ''
      }`}
      style={{ flex: isFullscreen ? '1' : '1 1 0%', minWidth: 280, minHeight: 480 }}
    >
      {/* Header */}
      <div className="flex items-center gap-1 px-2 py-1.5 bg-navy-950 border-b border-navy-800">
        <button onClick={onChangeView} className="flex-1 text-left text-[11px] font-bold text-slate-200 hover:text-gold-400 transition-colors truncate px-1">
          {pane.title}
        </button>
        {isChangingView && (
          <div className="absolute top-9 left-0 right-0 z-10 bg-navy-900 border border-navy-700 rounded-b-xl shadow-2xl max-h-72 overflow-y-auto">
            {Object.entries(VIEW_LABELS).map(([k, label]) => (
              <button
                key={k}
                onClick={() => onSelectView(k as ViewId)}
                className="w-full text-left px-3 py-1.5 text-[11px] text-slate-200 hover:bg-navy-800 hover:text-gold-400"
              >
                {label}
              </button>
            ))}
          </div>
        )}
        <button onClick={onFullscreen} className="p-1 text-slate-500 hover:text-gold-400" aria-label="Plein écran">
          {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
        </button>
        <button onClick={onClose} className="p-1 text-slate-500 hover:text-red-400" aria-label="Fermer">
          <X size={12} />
        </button>
      </div>

      {/* Resize handle (right edge) */}
      <div
        onMouseDown={onResizeStart}
        className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize bg-transparent hover:bg-gold-500/30 transition-colors z-10"
        title="Glisser pour redimensionner"
      >
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-0.5 h-8 bg-navy-700 rounded">
          <Move size={8} className="absolute -right-1 top-1/2 -translate-y-1/2 text-slate-700" />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto p-2">
        {loading && <div className="flex items-center justify-center h-full text-[11px] text-slate-500">Chargement…</div>}
        {error && <div className="flex items-center justify-center h-full text-[11px] text-red-400 p-3">Erreur: {error}</div>}
        {Component && !loading && !error && <Component />}
      </div>
    </div>
  );
}
