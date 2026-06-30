/**
 * P3.20 + P3.27 — Lead dashboard + Funnel analytics (admin).
 * Combined view: KPI tiles, lead list, funnel stages, source breakdown.
 */

import { useState, useEffect } from 'react';
import { Users, Mail, TrendingUp, Target, Award, RefreshCw, ChevronRight, Check, X, Eye } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';

interface Lead {
  id: string;
  email: string;
  name?: string;
  company?: string;
  source: string;
  service?: string;
  leadScore: number;
  status: string;
  createdAt: string;
}

interface FunnelStats {
  total: number;
  hot: number;
  contacted: number;
  won: number;
  avgScore: number;
  bySource: Record<string, number>;
  byStatus: Record<string, number>;
  byService: Record<string, number>;
  byDay: Record<string, number>;
  funnel: { stage: string; count: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  NEW:        'bg-blue-500/15 text-blue-400',
  CONTACTED:  'bg-amber-500/15 text-amber-400',
  QUALIFIED:  'bg-purple-500/15 text-purple-400',
  PROPOSAL:   'bg-cyan-500/15 text-cyan-400',
  WON:        'bg-emerald-500/15 text-emerald-400',
  LOST:       'bg-red-500/15 text-red-400',
  ARCHIVED:   'bg-slate-500/15 text-slate-500',
};

export default function LeadsDashboard() {
  const { config } = useAdmin();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<FunnelStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const base = (config.corsProxyUrl ?? '').replace(/\/$/, '');
      if (!base) { setLoading(false); return; }
      const [leadsRes, statsRes] = await Promise.all([
        fetch(`${base}/api/leads`, { credentials: 'include' }),
        fetch(`${base}/api/admin/funnel-stats`, { credentials: 'include' }),
      ]);
      if (leadsRes.ok) {
        const data = await leadsRes.json();
        setLeads(data.leads || []);
      }
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [config.corsProxyUrl]);

  const updateStatus = async (id: string, status: string) => {
    const base = (config.corsProxyUrl ?? '').replace(/\/$/, '');
    await fetch(`${base}/api/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status }),
    });
    fetchAll();
  };

  const filtered = filter === 'all' ? leads : leads.filter((l) => l.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Users size={14} className="text-gold-500" />
        <h2 className="text-base font-bold text-white uppercase tracking-wider">Leads & Funnel</h2>
        <button
          onClick={fetchAll}
          className="ml-auto text-slate-500 hover:text-gold-400 p-1"
          aria-label="Rafraîchir"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Funnel KPIs */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { value: stats.total,     label: 'Total leads',  sub: 'all-time',    color: 'text-blue-400',   icon: Users },
            { value: stats.hot,       label: '🔥 Hot (50+)',  sub: 'prêts à closer', color: 'text-red-400',    icon: Target },
            { value: stats.contacted, label: 'Contactés',     sub: 'en cours',     color: 'text-amber-400',  icon: Mail },
            { value: stats.won,       label: 'Won',           sub: 'signés',       color: 'text-emerald-400',icon: Award },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-navy-900 border border-navy-700 rounded-xl p-3">
                <Icon size={12} className={`${s.color} mb-1.5`} />
                <p className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</p>
                <p className="text-[11px] font-bold text-slate-200">{s.label}</p>
                <p className="text-[10px] text-slate-500">{s.sub}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Funnel stages */}
      {stats && (
        <div className="bg-navy-900 border border-navy-700 rounded-xl p-4">
          <h3 className="text-[11px] font-bold text-white uppercase tracking-wider mb-3">Entonnoir de conversion</h3>
          <div className="space-y-2">
            {stats.funnel.map((stage, i) => {
              const pct = stats.total > 0 ? (stage.count / stats.total) * 100 : 0;
              const prev = i > 0 ? stats.funnel[i - 1].count : stage.count;
              const conv = prev > 0 ? (stage.count / prev) * 100 : 100;
              return (
                <div key={stage.stage} className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-300 w-24">{stage.stage}</span>
                  <div className="flex-1 bg-navy-950 rounded h-6 overflow-hidden relative">
                    <div
                      className="h-full bg-gold-500/40 flex items-center pl-2"
                      style={{ width: `${pct}%` }}
                    >
                      <span className="text-[10px] font-mono text-gold-300">{stage.count}</span>
                    </div>
                  </div>
                  {i > 0 && (
                    <span className="text-[10px] text-slate-500 font-mono w-14 text-right">
                      {conv.toFixed(0)}% conv
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Source breakdown */}
      {stats && Object.keys(stats.bySource).length > 0 && (
        <div className="bg-navy-900 border border-navy-700 rounded-xl p-4">
          <h3 className="text-[11px] font-bold text-white uppercase tracking-wider mb-3">Sources d'acquisition</h3>
          <div className="space-y-1.5">
            {Object.entries(stats.bySource)
              .sort((a, b) => b[1] - a[1])
              .map(([src, count]) => (
                <div key={src} className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-400 w-32 truncate">{src}</span>
                  <div className="flex-1 bg-navy-950 rounded h-3 overflow-hidden">
                    <div className="h-full bg-blue-500/60" style={{ width: `${(count / stats.total) * 100}%` }} />
                  </div>
                  <span className="text-[11px] font-mono text-slate-300 w-8 text-right">{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Filters + List */}
      <div className="bg-navy-900 border border-navy-700 rounded-xl overflow-hidden">
        <div className="px-4 py-2 border-b border-navy-800 flex flex-wrap items-center gap-2">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Filtrer</span>
          {['all', 'NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                filter === s
                  ? 'bg-gold-500 text-navy-950'
                  : 'bg-navy-950 text-slate-400 hover:text-white'
              }`}
            >
              {s} {s !== 'all' && stats?.byStatus[s] ? `(${stats.byStatus[s]})` : ''}
            </button>
          ))}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading && <div className="p-4 text-center text-slate-500 text-[11px]">Chargement…</div>}
          {!loading && filtered.length === 0 && (
            <div className="p-6 text-center text-slate-500 text-[11px]">
              Aucun lead. Le funnel se remplira dès qu'un visiteur soumet un formulaire.
            </div>
          )}
          {filtered.map((l) => (
            <div
              key={l.id}
              className="flex items-center gap-3 px-4 py-2.5 border-b border-navy-800 last:border-0 hover:bg-navy-800/30 cursor-pointer"
              onClick={() => setSelected(l)}
            >
              <div className={`w-2 h-2 rounded-full ${
                l.leadScore >= 75 ? 'bg-red-400' :
                l.leadScore >= 50 ? 'bg-amber-400' :
                l.leadScore >= 20 ? 'bg-blue-400' : 'bg-slate-500'
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-mono text-slate-200 truncate">{l.email}</p>
                <p className="text-[10px] text-slate-500 truncate">
                  {(l.name || '—')}{l.company ? ` · ${l.company}` : ''} · {l.source}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-mono text-gold-400 font-bold">{l.leadScore}</p>
                <p className="text-[10px] text-slate-500 font-mono">{(l.createdAt || '').slice(0, 10)}</p>
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${STATUS_COLORS[l.status] || STATUS_COLORS.NEW}`}>
                {l.status}
              </span>
              <ChevronRight size={12} className="text-slate-600" />
            </div>
          ))}
        </div>
      </div>

      {/* Lead detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-[9996] flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-navy-900 border border-navy-700 rounded-2xl max-w-md w-full p-5 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-white">{selected.name || 'Lead'}</h3>
                <p className="text-[11px] text-slate-500 font-mono">{selected.email}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-slate-300">
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-navy-950 border border-navy-800 rounded p-2">
                <p className="text-slate-500">Score</p>
                <p className="text-base font-mono font-bold text-gold-400">{selected.leadScore}/100</p>
              </div>
              <div className="bg-navy-950 border border-navy-800 rounded p-2">
                <p className="text-slate-500">Source</p>
                <p className="text-base font-mono text-slate-200">{selected.source}</p>
              </div>
              <div className="bg-navy-950 border border-navy-800 rounded p-2 col-span-2">
                <p className="text-slate-500">Service demandé</p>
                <p className="text-[12px] text-slate-200">{selected.service || '—'}</p>
              </div>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Statut</p>
              <div className="flex flex-wrap gap-1">
                {['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST', 'ARCHIVED'].map((s) => (
                  <button
                    key={s}
                    onClick={() => { updateStatus(selected.id, s); setSelected({ ...selected, status: s }); }}
                    className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                      selected.status === s
                        ? 'bg-gold-500 text-navy-950'
                        : STATUS_COLORS[s]
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
