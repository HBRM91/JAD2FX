/**
 * P4.4 — Newsletter admin UI.
 * Lists subscribers, sends campaigns via Resend.
 */

import { useState, useEffect } from 'react';
import { Mail, Users, Send, Trash2, Calendar, CheckCircle2, X } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';

interface Subscriber {
  email: string;
  name?: string;
  company?: string;
  source?: string;
  subscribedAt: string;
  confirmed: boolean;
}

export default function NewsletterAdmin() {
  const { config } = useAdmin();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [subject, setSubject] = useState('Morning Briefing — ');
  const [body, setBody] = useState('Bonjour,\n\nCette semaine sur JAD2FX...\n\nL\'équipe JAD2 Advisory');
  const [sending, setSending] = useState(false);
  const [lastSend, setLastSend] = useState<{ ok: number; failed: number } | null>(null);

  const fetchSubs = async () => {
    setLoading(true);
    try {
      const base = (config.corsProxyUrl ?? '').replace(/\/$/, '');
      if (!base) { setSubscribers([]); setLoading(false); return; }
      const res = await fetch(`${base}/api/admin/newsletter/subscribers`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setSubscribers(data.subscribers ?? []);
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchSubs(); }, [config.corsProxyUrl]);

  const send = async () => {
    if (!subject.trim() || !body.trim()) return;
    if (!confirm(`Envoyer "${subject}" à ${subscribers.filter((s) => s.confirmed).length} abonnés ?`)) return;
    setSending(true);
    try {
      const base = (config.corsProxyUrl ?? '').replace(/\/$/, '');
      const res = await fetch(`${base}/api/admin/newsletter/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ subject, body }),
      });
      if (res.ok) {
        const data = await res.json();
        setLastSend({ ok: data.sent || 0, failed: data.failed || 0 });
        setShowCompose(false);
      } else {
        setLastSend({ ok: 0, failed: 0 });
      }
    } catch {
      setLastSend({ ok: 0, failed: 0 });
    } finally { setSending(false); }
  };

  const confirmed = subscribers.filter((s) => s.confirmed).length;
  const bySource = subscribers.reduce((acc, s) => {
    const src = s.source || 'direct';
    acc[src] = (acc[src] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Mail size={14} className="text-gold-500" />
        <h2 className="text-base font-bold text-white uppercase tracking-wider">Newsletter</h2>
        <span className="text-[10px] text-slate-500 ml-auto">Resend · Hebdomadaire lundi 8h</span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-navy-900 border border-navy-700 rounded-xl p-3">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Total</p>
          <p className="text-2xl font-bold font-mono text-white mt-1">{subscribers.length}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">inscriptions</p>
        </div>
        <div className="bg-navy-900 border border-navy-700 rounded-xl p-3">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Confirmés</p>
          <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">{confirmed}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">double opt-in</p>
        </div>
        <div className="bg-navy-900 border border-navy-700 rounded-xl p-3">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Taux conversion</p>
          <p className="text-2xl font-bold font-mono text-gold-400 mt-1">
            {subscribers.length ? Math.round((confirmed / subscribers.length) * 100) : 0}%
          </p>
        </div>
        <div className="bg-navy-900 border border-navy-700 rounded-xl p-3">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Sources</p>
          <p className="text-2xl font-bold font-mono text-blue-400 mt-1">{Object.keys(bySource).length}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">canaux</p>
        </div>
      </div>

      {lastSend && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-center gap-2">
          <CheckCircle2 size={14} className="text-emerald-400" />
          <p className="text-[12px] text-emerald-300">
            Dernier envoi: {lastSend.ok} livrés, {lastSend.failed} échoués.
          </p>
        </div>
      )}

      {/* Sources breakdown */}
      {Object.keys(bySource).length > 0 && (
        <div className="bg-navy-900 border border-navy-700 rounded-xl p-4">
          <h3 className="text-[11px] font-bold text-white uppercase tracking-wider mb-2">Sources d'acquisition</h3>
          <div className="space-y-1">
            {Object.entries(bySource)
              .sort((a, b) => b[1] - a[1])
              .map(([src, count]) => (
                <div key={src} className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-400 w-32 truncate">{src}</span>
                  <div className="flex-1 bg-navy-950 rounded h-3 overflow-hidden">
                    <div
                      className="h-full bg-gold-500/60"
                      style={{ width: `${(count / subscribers.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-mono text-slate-300 w-8 text-right">{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Compose */}
      <div className="bg-navy-900 border border-navy-700 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[11px] font-bold text-white uppercase tracking-wider">Composer un envoi</h3>
          <button
            onClick={() => setShowCompose((s) => !s)}
            className="text-[10px] text-gold-400 hover:text-gold-300"
          >
            {showCompose ? 'Annuler' : 'Ouvrir'}
          </button>
        </div>
        {showCompose && (
          <div className="space-y-2">
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Sujet"
              className="w-full bg-navy-950 border border-navy-700 rounded px-3 py-2 text-sm text-slate-200"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              className="w-full bg-navy-950 border border-navy-700 rounded px-3 py-2 text-sm text-slate-200 font-mono"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={send}
                disabled={sending}
                className="flex items-center gap-1.5 px-4 py-2 bg-gold-500 text-navy-950 text-sm font-bold rounded hover:bg-gold-400 disabled:opacity-50 transition-colors"
              >
                <Send size={12} /> {sending ? 'Envoi...' : `Envoyer à ${confirmed} abonnés`}
              </button>
              <p className="text-[10px] text-slate-500">
                ⚠️ Envoi réel — pas d'aperçu. Testez avec un sujet "[TEST] ..." d'abord.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Subscribers list */}
      <div className="bg-navy-900 border border-navy-700 rounded-xl overflow-hidden">
        <div className="px-4 py-2 border-b border-navy-800 flex items-center gap-2">
          <Users size={12} className="text-slate-400" />
          <h3 className="text-[11px] font-bold text-white uppercase tracking-wider">Abonnés récents</h3>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {loading && <div className="p-4 text-center text-slate-500 text-[11px]">Chargement…</div>}
          {!loading && subscribers.length === 0 && (
            <div className="p-4 text-center text-slate-500 text-[11px]">Aucun abonné pour le moment.</div>
          )}
          {subscribers.slice(0, 50).map((s) => (
            <div key={s.email} className="flex items-center gap-3 px-4 py-2 border-b border-navy-800 last:border-0 hover:bg-navy-800/30">
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-slate-200 font-mono truncate">{s.email}</p>
                <p className="text-[10px] text-slate-500">
                  {s.name || s.company ? `${s.name ?? ''}${s.company ? ' · ' + s.company : ''}` : '—'}
                </p>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">{s.subscribedAt?.slice(0, 10)}</span>
              <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                s.confirmed ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
              }`}>
                {s.confirmed ? 'OK' : 'Pending'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
