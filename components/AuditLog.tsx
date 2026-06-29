import { useState, useEffect, useMemo } from 'react';
import { Shield, FileText, Download, Filter, Calendar, Activity } from 'lucide-react';
import { downloadData } from '../utils/export';

interface AuditEvent {
  ts: string;
  type: 'forward_calc' | 'telemetry' | 'admin_action' | 'lead_capture' | 'newsletter' | 'session';
  detail: string;
  context?: Record<string, any>;
}

const STORAGE_KEY = 'jad2fx:audit-log';
const MAX_EVENTS = 500;

/**
 * P2.25 — Treasurer session log: every simulation, alert action, export is
 * recorded locally with timestamp + context. Exportable as CSV for audit
 * trails and compliance (Circ. OC 01/2024).
 */
export default function AuditLog() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [filter, setFilter] = useState<string>('ALL');
  const [sessionStart] = useState(() => Date.now());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setEvents(JSON.parse(raw));
    } catch {}
    // Hook: also listen to telemetry events from the running app
    const handler = (e: Event) => {
      const ce = e as CustomEvent<AuditEvent>;
      if (ce.detail) {
        setEvents((prev) => {
          const next = [ce.detail, ...prev].slice(0, MAX_EVENTS);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          return next;
        });
      }
    };
    window.addEventListener('jad2fx:audit', handler);
    return () => window.removeEventListener('jad2fx:audit', handler);
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'ALL') return events;
    return events.filter((e) => e.type === filter);
  }, [events, filter]);

  const stats = useMemo(() => {
    const byType: Record<string, number> = {};
    for (const e of events) byType[e.type] = (byType[e.type] ?? 0) + 1;
    return {
      total: events.length,
      byType,
      session: Math.floor((Date.now() - sessionStart) / 1000),
    };
  }, [events, sessionStart]);

  function exportCsv() {
    const rows = filtered.map((e) => ({
      timestamp: e.ts,
      type: e.type,
      detail: e.detail,
      context: e.context ? JSON.stringify(e.context) : '',
    }));
    downloadData(rows, { filename: 'audit-log', format: 'csv' });
  }

  function clear() {
    if (!confirm('Effacer tout l\'historique de cette session ?')) return;
    setEvents([]);
    localStorage.removeItem(STORAGE_KEY);
  }

  // Demo: seed sample events for treasurer testing
  function seedSample() {
    const samples: AuditEvent[] = [
      { ts: new Date().toISOString(), type: 'forward_calc', detail: 'EUR/MAD 3M, notional 1M, BUY @ 10.8532', context: { pair: 'EUR/MAD', tenor: '3M', notional: 1000000, rate: 10.8532 } },
      { ts: new Date(Date.now() - 60000).toISOString(), type: 'telemetry', detail: 'Forward pricing simulation run', context: { views: ['DASHBOARD', 'FORWARDS'] } },
      { ts: new Date(Date.now() - 300000).toISOString(), type: 'session', detail: 'Session started' },
    ];
    setEvents((prev) => {
      const next = [...samples, ...prev].slice(0, MAX_EVENTS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div className="flex items-center gap-2">
        <Shield size={14} className="text-gold-500" />
        <h1 className="text-base font-bold text-white uppercase tracking-wider">Journal d'Audit · Trésorier</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Total événements" value={String(stats.total)} />
        <Stat label="Session active" value={`${Math.floor(stats.session / 60)}min`} />
        <Stat label="Forward calculs" value={String(stats.byType.forward_calc ?? 0)} />
        <Stat label="Téléchargements" value={String((stats.byType.lead_capture ?? 0) + (stats.byType.admin_action ?? 0))} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Filter size={12} className="text-slate-500" />
        {(['ALL', 'forward_calc', 'telemetry', 'lead_capture', 'newsletter', 'admin_action', 'session'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2 py-1 text-[10px] font-bold rounded uppercase ${
              filter === f ? 'bg-gold-500 text-navy-950' : 'bg-navy-900 text-slate-400 border border-navy-700 hover:border-gold-500/50'
            }`}
          >
            {f}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          {events.length === 0 && (
            <button onClick={seedSample} className="px-3 py-1 text-[10px] text-slate-400 hover:text-white">
              <Activity size={10} className="inline mr-1" /> Seed test
            </button>
          )}
          <button onClick={exportCsv} disabled={!events.length} className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 disabled:bg-navy-800 disabled:text-slate-500 text-white text-[10px] font-bold rounded inline-flex items-center gap-1">
            <Download size={10} /> Export CSV
          </button>
          <button onClick={clear} disabled={!events.length} className="px-3 py-1 bg-red-900/40 hover:bg-red-900/60 disabled:bg-navy-800 disabled:text-slate-500 text-red-200 text-[10px] font-bold rounded">
            Effacer
          </button>
        </div>
      </div>

      <div className="bg-navy-900 border border-navy-700 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FileText size={32} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm mb-1">Aucun événement enregistré</p>
            <p className="text-slate-500 text-xs">
              Le journal enregistre automatiquement chaque simulation, export, alerte et capture de lead.
              <br />Conformité Circ. OC 01/2024 — traçabilité des actions trésorier.
            </p>
          </div>
        ) : (
          <div className="max-h-[500px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-navy-950 sticky top-0">
                <tr className="text-[9px] text-slate-500 uppercase tracking-wider">
                  <th className="px-3 py-2 text-left w-40">
                    <Calendar size={10} className="inline mr-1" />Timestamp
                  </th>
                  <th className="px-3 py-2 text-left w-32">Type</th>
                  <th className="px-3 py-2 text-left">Détail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800">
                {filtered.map((e, i) => (
                  <tr key={i} className="hover:bg-navy-800/30">
                    <td className="px-3 py-2 font-mono text-slate-400 text-[10px]">
                      {new Date(e.ts).toLocaleString('fr-MA')}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                        e.type === 'forward_calc' ? 'bg-blue-500/20 text-blue-300' :
                        e.type === 'lead_capture' ? 'bg-emerald-500/20 text-emerald-300' :
                        e.type === 'admin_action' ? 'bg-amber-500/20 text-amber-300' :
                        e.type === 'session' ? 'bg-purple-500/20 text-purple-300' :
                        'bg-slate-500/20 text-slate-300'
                      }`}>{e.type}</span>
                    </td>
                    <td className="px-3 py-2 text-slate-200">{e.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-[10px] text-slate-500">
        Journal conservé localement (localStorage, max 500 événements). Pour l'archivage long terme et la conformité Circ. OC 01/2024,
        exportez régulièrement en CSV et conservez dans votre GED. Les événements ne quittent pas votre navigateur.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-navy-900 border border-navy-700 rounded-lg p-3">
      <p className="text-[9px] text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="text-xl font-bold text-gold-400 font-mono mt-1">{value}</p>
    </div>
  );
}
