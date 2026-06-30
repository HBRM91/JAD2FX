/**
 * P1-6 — Generic KV-backed content admin (template for all static collections).
 * Each collection is a JSON array of records in `documents:<collection>` KV key.
 * CRUD operations: list / create / update / delete.
 *
 * Schema is intentionally generic — each collection defines its own field
 * shape in the schema prop. The admin renders an editable JSON view by
 * default, or a custom form if `renderForm` is provided.
 */

import { useEffect, useState } from 'react';
import { Plus, Trash2, Save, RefreshCw, Edit3, X, AlertCircle } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';

export interface ContentField {
  key: string;
  label: string;
  type: 'text' | 'longtext' | 'number' | 'url' | 'tags';
  required?: boolean;
  hint?: string;
}

export interface ContentSchema {
  collection: string;                       // e.g. 'glossary', 'articles', 'sectors'
  label: string;                            // human label for the tab
  itemLabel: string;                        // 'Terme', 'Article', etc.
  slugField?: string;                       // default: 'slug'
  fields: ContentField[];
}

export interface ContentRecord {
  id: string;
  [k: string]: unknown;
}

interface Props {
  schema: ContentSchema;
  className?: string;
}

export default function ContentManager({ schema, className }: Props) {
  const { config } = useAdmin();
  const [records, setRecords] = useState<ContentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing]   = useState<ContentRecord | null>(null);
  const [error, setError]     = useState<string | null>(null);
  const [msg, setMsg]         = useState<string | null>(null);
  const base = (config.corsProxyUrl ?? '').replace(/\/$/, '');
  const url = (id?: string) => `${base}/api/admin/content/${schema.collection}${id ? `/${id}` : ''}`;

  const load = async () => {
    if (!base) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url(), { credentials: 'include', signal: AbortSignal.timeout(5_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { records: ContentRecord[] };
      setRecords(data.records ?? []);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [base, schema.collection]);

  const save = async (rec: ContentRecord) => {
    try {
      const res = await fetch(url(rec.id), {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rec),
        signal: AbortSignal.timeout(5_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setMsg(`${schema.itemLabel} sauvegardé`);
      setEditing(null);
      load();
      setTimeout(() => setMsg(null), 2500);
    } catch (e) {
      setError(`Échec sauvegarde: ${String(e)}`);
    }
  };

  const del = async (id: string) => {
    if (!confirm(`Supprimer définitivement ce ${schema.itemLabel.toLowerCase()} ?`)) return;
    try {
      const res = await fetch(url(id), { method: 'DELETE', credentials: 'include', signal: AbortSignal.timeout(5_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setMsg(`${schema.itemLabel} supprimé`);
      load();
      setTimeout(() => setMsg(null), 2500);
    } catch (e) {
      setError(`Échec suppression: ${String(e)}`);
    }
  };

  const newRecord = (): ContentRecord => {
    const base: ContentRecord = { id: crypto.randomUUID().slice(0, 8) };
    for (const f of schema.fields) {
      base[f.key] = f.type === 'tags' ? [] : '';
    }
    return base;
  };

  return (
    <div className={`space-y-3 ${className ?? ''}`}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-[11px] text-slate-500">
          {records.length} {schema.itemLabel.toLowerCase()}{records.length > 1 ? 's' : ''} en base.
          Stockage KV <code className="font-mono text-gold-400 text-[10px]">documents:{schema.collection}</code>.
        </p>
        <div className="flex gap-2">
          <button onClick={load} className="px-2 py-1 text-[10px] border border-navy-700 text-slate-300 rounded hover:border-gold-500/50 flex items-center gap-1">
            <RefreshCw size={10} className={loading ? 'animate-spin' : ''} /> Recharger
          </button>
          <button
            onClick={() => setEditing(newRecord())}
            className="px-2.5 py-1 text-[10px] font-bold bg-gold-500 text-navy-900 rounded hover:bg-gold-400 flex items-center gap-1"
          >
            <Plus size={10} /> Nouveau
          </button>
        </div>
      </div>

      {error && (
        <p className="text-[10px] text-red-400 flex items-center gap-1">
          <AlertCircle size={10} /> {error}
        </p>
      )}
      {msg && <p className="text-[10px] text-emerald-400">{msg}</p>}

      {editing && (
        <ContentEditor
          schema={schema}
          record={editing}
          onSave={save}
          onCancel={() => setEditing(null)}
        />
      )}

      <div className="overflow-x-auto rounded border border-navy-700">
        <table className="w-full text-[11px] min-w-[480px]">
          <thead className="bg-navy-800 text-slate-500 uppercase text-[9px]">
            <tr>
              {schema.fields.slice(0, 3).map(f => (
                <th key={f.key} className="text-left py-2 px-3 font-medium">{f.label}</th>
              ))}
              <th className="text-right py-2 px-3 font-medium w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map(r => (
              <tr key={r.id} className="border-t border-navy-800 hover:bg-navy-800/30">
                {schema.fields.slice(0, 3).map(f => (
                  <td key={f.key} className="py-2 px-3 text-slate-300">
                    {f.type === 'tags' && Array.isArray(r[f.key])
                      ? (r[f.key] as string[]).join(', ')
                      : String(r[f.key] ?? '—').slice(0, 80)}
                  </td>
                ))}
                <td className="py-2 px-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => setEditing(r)} className="p-1 text-slate-400 hover:text-gold-400" aria-label="Éditer">
                      <Edit3 size={11} />
                    </button>
                    <button onClick={() => del(r.id)} className="p-1 text-slate-400 hover:text-red-400" aria-label="Supprimer">
                      <Trash2 size={11} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && records.length === 0 && (
              <tr><td colSpan={4} className="py-6 text-center text-slate-500 italic text-[10px]">Aucun contenu. Créez le premier.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ContentEditor({ schema, record, onSave, onCancel }: {
  schema: ContentSchema;
  record: ContentRecord;
  onSave: (r: ContentRecord) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<ContentRecord>(record);
  const update = (k: string, v: unknown) => setDraft(prev => ({ ...prev, [k]: v }));

  return (
    <div className="bg-navy-950 border border-gold-500/30 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-white">Édition : {schema.itemLabel}</p>
        <button onClick={onCancel} className="p-1 text-slate-500 hover:text-slate-300" aria-label="Annuler">
          <X size={12} />
        </button>
      </div>
      {schema.fields.map(f => (
        <div key={f.key}>
          <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
            {f.label}{f.required ? ' *' : ''}
            {f.hint && <span className="ml-1 normal-case text-slate-600">— {f.hint}</span>}
          </label>
          {f.type === 'longtext' ? (
            <textarea
              value={String(draft[f.key] ?? '')}
              onChange={(e) => update(f.key, e.target.value)}
              rows={5}
              className="w-full bg-navy-900 border border-navy-700 rounded px-2 py-1.5 text-slate-200 text-[11px] font-mono focus:outline-none focus:border-gold-500"
            />
          ) : f.type === 'tags' ? (
            <input
              type="text"
              value={Array.isArray(draft[f.key]) ? (draft[f.key] as string[]).join(', ') : ''}
              onChange={(e) => update(f.key, e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
              placeholder="tag1, tag2, tag3"
              className="w-full bg-navy-900 border border-navy-700 rounded px-2 py-1.5 text-slate-200 text-[11px] focus:outline-none focus:border-gold-500"
            />
          ) : (
            <input
              type={f.type === 'number' ? 'number' : f.type === 'url' ? 'url' : 'text'}
              value={String(draft[f.key] ?? '')}
              onChange={(e) => update(f.key, f.type === 'number' ? parseFloat(e.target.value) : e.target.value)}
              className="w-full bg-navy-900 border border-navy-700 rounded px-2 py-1.5 text-slate-200 text-[12px] focus:outline-none focus:border-gold-500"
            />
          )}
        </div>
      ))}
      <button
        onClick={() => onSave(draft)}
        className="px-3 py-1.5 text-[11px] font-bold bg-emerald-600 text-white rounded hover:bg-emerald-500 flex items-center gap-1"
      >
        <Save size={11} /> Sauvegarder
      </button>
    </div>
  );
}
