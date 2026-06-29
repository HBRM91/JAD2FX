/**
 * P4.7 — API key management UI (admin only).
 * Generates, lists, revokes API keys. Keys are stored hashed in KV.
 */

import { useState, useEffect } from 'react';
import { Key, Copy, Check, Trash2, Plus, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';

interface ApiKey {
  id: string;
  label: string;
  createdAt: string;
  lastUsedAt?: string;
  rateLimit: number;
  enabled: boolean;
  /** Plain key — only shown once at creation */
  plainKey?: string;
}

export default function ApiKeyManagement() {
  const { config } = useAdmin();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLabel, setNewLabel] = useState('');
  const [creating, setCreating] = useState(false);
  const [revealKey, setRevealKey] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const base = (config.corsProxyUrl ?? '').replace(/\/$/, '');
      if (!base) { setKeys([]); setLoading(false); return; }
      const res = await fetch(`${base}/api/admin/api-keys`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys ?? []);
      } else {
        setKeys([]);
      }
    } catch {
      setKeys([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchKeys(); }, [config.corsProxyUrl]);

  const create = async () => {
    if (!newLabel.trim()) return;
    setCreating(true);
    try {
      const base = (config.corsProxyUrl ?? '').replace(/\/$/, '');
      const res = await fetch(`${base}/api/admin/api-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ label: newLabel.trim(), tier: 'pro' }),
      });
      if (res.ok) {
        const data = await res.json();
        setRevealKey(data.key);
        setNewLabel('');
        fetchKeys();
      }
    } catch { /* ignore */ } finally {
      setCreating(false);
    }
  };

  const revoke = async (id: string) => {
    if (!confirm('Révoquer cette clé ? Elle cessera de fonctionner immédiatement.')) return;
    const base = (config.corsProxyUrl ?? '').replace(/\/$/, '');
    await fetch(`${base}/api/admin/api-keys/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    fetchKeys();
  };

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Key size={14} className="text-gold-500" />
        <h2 className="text-base font-bold text-white uppercase tracking-wider">API Keys</h2>
        <span className="text-[10px] text-slate-500 ml-auto">Public API · Pro tier · 10k req/jour</span>
      </div>

      {/* Create new */}
      <div className="bg-navy-900 border border-navy-700 rounded-xl p-4">
        <h3 className="text-[11px] font-bold text-white uppercase tracking-wider mb-2">Créer une nouvelle clé</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Ex: Client Acme Corp"
            className="flex-1 bg-navy-950 border border-navy-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-gold-500"
          />
          <button
            onClick={create}
            disabled={!newLabel.trim() || creating}
            className="flex items-center gap-1.5 px-4 py-2 bg-gold-500 text-navy-950 text-sm font-bold rounded-lg hover:bg-gold-400 disabled:opacity-50 transition-colors"
          >
            <Plus size={12} /> {creating ? 'Création...' : 'Générer'}
          </button>
        </div>
      </div>

      {/* Reveal new key */}
      {revealKey && (
        <div className="bg-amber-500/10 border border-amber-500/40 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] text-amber-200 font-bold mb-1">
              Nouvelle clé générée — copiez-la MAINTENANT. Elle ne sera plus affichée.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-navy-950 border border-amber-500/30 rounded px-3 py-2 text-[11px] font-mono text-amber-200 overflow-x-auto">
                {revealKey}
              </code>
              <button
                onClick={() => copy(revealKey, 'new')}
                className="p-2 text-amber-400 hover:text-amber-300"
              >
                {copiedId === 'new' ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
            <button
              onClick={() => setRevealKey(null)}
              className="text-[10px] text-amber-300 underline mt-2"
            >
              J'ai copié la clé, fermer
            </button>
          </div>
        </div>
      )}

      {/* Keys list */}
      <div className="bg-navy-900 border border-navy-700 rounded-xl overflow-hidden">
        <table className="w-full text-[12px]">
          <thead className="bg-navy-950">
            <tr className="text-[10px] text-slate-500 uppercase tracking-wider">
              <th className="px-3 py-2 text-left">Label</th>
              <th className="px-3 py-2 text-left">Clé</th>
              <th className="px-3 py-2 text-left">Tier</th>
              <th className="px-3 py-2 text-left">Créée</th>
              <th className="px-3 py-2 text-left">Dernière utilisation</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-800">
            {loading && (
              <tr><td colSpan={6} className="px-3 py-4 text-center text-slate-500">Chargement…</td></tr>
            )}
            {!loading && keys.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-4 text-center text-slate-500">Aucune clé API. Créez-en une ci-dessus.</td></tr>
            )}
            {keys.map((k) => (
              <tr key={k.id} className="hover:bg-navy-800/40">
                <td className="px-3 py-2 font-bold text-slate-200">{k.label}</td>
                <td className="px-3 py-2 font-mono text-slate-400">
                  <div className="flex items-center gap-1">
                    <span>jad2_••••••••{k.id.slice(-4)}</span>
                    <button
                      onClick={() => setRevealKey(revealKey === k.id ? null : `jad2_${k.id}...`)}
                      className="text-slate-500 hover:text-gold-400"
                    >
                      {revealKey === k.id ? <EyeOff size={10} /> : <Eye size={10} />}
                    </button>
                  </div>
                </td>
                <td className="px-3 py-2 text-slate-300">
                  <span className="text-[10px] bg-blue-500/15 text-blue-400 px-1.5 py-0.5 rounded">PRO</span>
                </td>
                <td className="px-3 py-2 text-slate-500 font-mono">{k.createdAt.slice(0, 10)}</td>
                <td className="px-3 py-2 text-slate-500 font-mono">{k.lastUsedAt?.slice(0, 10) ?? '—'}</td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={() => revoke(k.id)}
                    className="p-1 text-slate-500 hover:text-red-400"
                    aria-label="Révoquer"
                  >
                    <Trash2 size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-navy-900/50 border border-navy-800 rounded-lg p-3">
        <p className="text-[10px] text-slate-500 leading-relaxed">
          <strong className="text-slate-300">Endpoints:</strong> <code className="text-gold-400">GET /v1/rates</code>,{' '}
          <code className="text-gold-400">GET /v1/rates/&#123;ccy&#125;</code>,{' '}
          <code className="text-gold-400">GET /v1/forward?ccy=EUR&tenor=3M&notional=1M&direction=BUY</code>.
          Auth: <code className="text-amber-400">X-API-Key: jad2_xxx</code>.
        </p>
      </div>
    </div>
  );
}
