/**
 * P4.14 — Backlink outreach tracker (admin).
 * Track SEO outreach: target sites, status, contact, DR (Domain Rating).
 */

import { useState, useMemo } from 'react';
import { Link2, Plus, ExternalLink, Mail, Check, X, Clock, Search } from 'lucide-react';

interface OutreachRow {
  id: string;
  domain: string;
  type: 'press' | 'blog' | 'edu' | 'directory' | 'forum';
  dr: number;          // Domain Rating (0-100)
  contactEmail?: string;
  status: 'todo' | 'contacted' | 'in-progress' | 'linked' | 'rejected';
  lastAction: string;
  notes?: string;
}

const SEED: OutreachRow[] = [
  { id: 'o1', domain: 'leconomiste.com',           type: 'press',     dr: 72, contactEmail: 'redaction@leconomiste.com', status: 'contacted', lastAction: '2026-06-15 — Article invité proposé' },
  { id: 'o2', domain: 'lematin.ma',                 type: 'press',     dr: 78, contactEmail: 'economie@lematin.ma',        status: 'linked',     lastAction: '2026-06-10 — Citation obtenue (article panier MAD)' },
  { id: 'o3', domain: 'medias24.com',               type: 'press',     dr: 65, contactEmail: 'contact@medias24.com',        status: 'in-progress', lastAction: '2026-06-22 — Devis étude conjointe envoyé' },
  { id: 'o4', domain: 'iscae.ma',                   type: 'edu',       dr: 58, contactEmail: 'partenariats@iscae.ma',     status: 'linked',     lastAction: '2026-05-12 — Convention signée' },
  { id: 'o5', domain: 'encgsettat.ac.ma',           type: 'edu',       dr: 42, contactEmail: 'master.ci@encgsettat.ac.ma', status: 'contacted',  lastAction: '2026-06-08 — Présentation master CI planifiée' },
  { id: 'o6', domain: 'bkam.ma',                     type: 'directory', dr: 88, contactEmail: 'communication@bkam.ma',     status: 'todo',       lastAction: '2026-06-25 — À contacter pour backlink pédagogique' },
  { id: 'o7', domain: 'oc.gov.ma',                   type: 'directory', dr: 82, contactEmail: 'webmaster@oc.gov.ma',        status: 'todo',       lastAction: 'Demande de citation à formaliser' },
  { id: 'o8', domain: 'reddit.com/r/Morocco',        type: 'forum',     dr: 91, contactEmail: '',                            status: 'in-progress', lastAction: '2026-06-20 — AMA / thread pédagogique' },
  { id: 'o9', domain: 'quora.com',                   type: 'forum',     dr: 93, contactEmail: '',                            status: 'todo',       lastAction: 'Réponses FX à créer' },
  { id: 'o10', domain: 'cgem.ma',                    type: 'directory', dr: 55, contactEmail: 'communication@cgem.ma',    status: 'contacted',  lastAction: '2026-06-12 — Newsletter PME à proposer' },
  { id: 'o11', domain: 'asmex.ma',                   type: 'directory', dr: 48, contactEmail: 'info@asmex.ma',             status: 'todo',       lastAction: '—' },
  { id: 'o12', domain: 'yabiladi.com',               type: 'press',     dr: 60, contactEmail: 'redaction@yabiladi.com',     status: 'linked',     lastAction: '2026-05-15 — Article transferts MRE' },
  { id: 'o13', domain: 'hespress.com',               type: 'press',     dr: 70, contactEmail: 'redaction@hespress.com',    status: 'todo',       lastAction: '—' },
  { id: 'o14', domain: 'le360.ma',                   type: 'press',     dr: 62, contactEmail: 'redaction@le360.ma',         status: 'linked',     lastAction: '2026-04-22 — Article forwards MAD' },
  { id: 'o15', domain: 'fr.wikipedia.org',           type: 'directory', dr: 96, contactEmail: '',                            status: 'todo',       lastAction: 'Article "Dirham marocain" à compléter avec lien JAD2FX' },
  { id: 'o16', domain: 'investopedia.com',           type: 'blog',      dr: 92, contactEmail: 'editor@investopedia.com',   status: 'rejected',   lastAction: '2026-05-20 — Pas de politique de guest posting' },
  { id: 'o17', domain: 'tradingview.com',            type: 'blog',      dr: 89, contactEmail: 'community@tradingview.com', status: 'todo',       lastAction: 'Publier une idée sur le MAD' },
];

const STATUS_META = {
  'todo':        { label: 'À faire',     color: 'bg-slate-500/20 text-slate-400',    icon: Clock },
  'contacted':   { label: 'Contacté',    color: 'bg-blue-500/20 text-blue-400',       icon: Mail },
  'in-progress': { label: 'En cours',    color: 'bg-amber-500/20 text-amber-400',     icon: Clock },
  'linked':       { label: 'Backlink OK', color: 'bg-emerald-500/20 text-emerald-400', icon: Check },
  'rejected':     { label: 'Refusé',      color: 'bg-red-500/20 text-red-400',         icon: X },
};

const TYPE_META = {
  press:     { label: 'Presse', color: 'text-blue-400' },
  blog:      { label: 'Blog',   color: 'text-purple-400' },
  edu:       { label: 'Édu',    color: 'text-emerald-400' },
  directory: { label: 'Annuaire', color: 'text-gold-400' },
  forum:     { label: 'Forum',  color: 'text-orange-400' },
};

export default function BacklinkTracker() {
  const [rows] = useState<OutreachRow[]>(SEED);
  const [filter, setFilter] = useState<'all' | OutreachRow['status']>('all');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filter !== 'all' && r.status !== filter) return false;
      if (search && !r.domain.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [rows, filter, search]);

  const stats = useMemo(() => ({
    total: rows.length,
    linked: rows.filter((r) => r.status === 'linked').length,
    inProgress: rows.filter((r) => r.status === 'in-progress' || r.status === 'contacted').length,
    avgDr: Math.round(rows.reduce((s, r) => s + r.dr, 0) / rows.length),
  }), [rows]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link2 size={14} className="text-gold-500" />
        <h2 className="text-base font-bold text-white uppercase tracking-wider">Backlink Tracker</h2>
        <span className="text-[10px] text-slate-500 ml-auto">SEO Outreach</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-navy-900 border border-navy-700 rounded-xl p-3">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Total prospects</p>
          <p className="text-2xl font-bold font-mono text-white mt-1">{stats.total}</p>
        </div>
        <div className="bg-navy-900 border border-emerald-700/50 rounded-xl p-3">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Backlinks obtenus</p>
          <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">{stats.linked}</p>
        </div>
        <div className="bg-navy-900 border border-amber-700/50 rounded-xl p-3">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">En cours</p>
          <p className="text-2xl font-bold font-mono text-amber-400 mt-1">{stats.inProgress}</p>
        </div>
        <div className="bg-navy-900 border border-gold-700/50 rounded-xl p-3">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">DR moyen</p>
          <p className="text-2xl font-bold font-mono text-gold-400 mt-1">{stats.avgDr}</p>
        </div>
      </div>

      <div className="bg-navy-900 border border-navy-700 rounded-xl p-4 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un domaine…"
            className="w-full bg-navy-950 border border-navy-700 rounded pl-8 pr-3 py-1.5 text-[12px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-gold-500"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="appearance-none bg-navy-950 border border-navy-700 rounded px-3 py-1.5 text-[11px] text-slate-300"
        >
          <option value="all">Tous statuts</option>
          {Object.entries(STATUS_META).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <button
          onClick={() => setShowAdd((s) => !s)}
          className="flex items-center gap-1 px-3 py-1.5 bg-gold-500 text-navy-950 text-[11px] font-bold rounded hover:bg-gold-400"
        >
          <Plus size={12} /> Ajouter
        </button>
      </div>

      {showAdd && (
        <div className="bg-navy-900 border border-gold-700/30 rounded-xl p-4">
          <p className="text-[10px] text-slate-500 italic">
            Form d'ajout rapide (en production: intégration CRM) — drag un CSV depuis Ahrefs/Semrush.
          </p>
        </div>
      )}

      <div className="bg-navy-900 border border-navy-700 rounded-xl overflow-hidden">
        <table className="w-full text-[11px]">
          <thead className="bg-navy-950">
            <tr className="text-[10px] text-slate-500 uppercase tracking-wider">
              <th className="px-3 py-2 text-left">Domaine</th>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-right">DR</th>
              <th className="px-3 py-2 text-left">Contact</th>
              <th className="px-3 py-2 text-left">Statut</th>
              <th className="px-3 py-2 text-left">Dernière action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-800">
            {filtered.map((r) => {
              const St = STATUS_META[r.status];
              const Ty = TYPE_META[r.type];
              return (
                <tr key={r.id} className="hover:bg-navy-800/40">
                  <td className="px-3 py-2 font-mono text-slate-300">
                    <a href={`https://${r.domain}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-gold-400">
                      {r.domain} <ExternalLink size={9} />
                    </a>
                  </td>
                  <td className={`px-3 py-2 font-bold ${Ty.color}`}>{Ty.label}</td>
                  <td className={`px-3 py-2 text-right font-mono font-bold ${r.dr >= 70 ? 'text-gold-400' : r.dr >= 50 ? 'text-blue-400' : 'text-slate-400'}`}>
                    {r.dr}
                  </td>
                  <td className="px-3 py-2 text-slate-500 text-[10px]">{r.contactEmail || '—'}</td>
                  <td className="px-3 py-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${St.color}`}>
                      {St.label}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-400 text-[10px]">{r.lastAction}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
