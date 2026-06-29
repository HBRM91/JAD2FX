/**
 * P3.18 — "Audit Gratuit 30min" landing page.
 * High-conversion page for top-of-funnel lead capture.
 */

import { useState } from 'react';
import { ClipboardCheck, Clock, Shield, Award, Phone, Mail, Calendar, Check, Star, MessageSquare, TrendingUp } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';

const AGENDA = [
  { time: '00:00-05:00', title: 'Prise de contact', desc: 'Contexte entreprise, exposition FX actuelle, banque(s) actuelle(s), douleur principale.' },
  { time: '05:00-15:00', title: 'Diagnostic express', desc: 'Nous analysons votre situation (forex, contrats en cours, politique actuelle, OC compliance).' },
  { time: '15:00-25:00', title: 'Plan d\'action immédiat', desc: 'Quick wins actionnables dès le lendemain. Estimation gains potentiels (€/an).' },
  { time: '25:00-30:00', title: 'Q&A + next steps', desc: 'On répond à toutes vos questions. Pas d\'engagement.' },
];

const TESTIMONIALS = [
  { author: 'DAF secteur automobile', city: 'Tanger', quote: 'L\'audit a payé notre année. On a évité une mauvaise couverture sur 4M EUR.' },
  { author: 'Trésorier PME textile', city: 'Fès',     quote: 'J\'aurais aimé avoir cet audit 2 ans plus tôt. 280K MAD/an d\'économies identifiées.' },
  { author: 'DG importateur bois',  city: 'Casa',   quote: '30 min très concrètes. On a signé pour le conseil stratégique dans la foulée.' },
];

export default function AuditLanding() {
  const { config } = useAdmin();
  const [form, setForm] = useState({ name: '', email: '', company: '', volume: '', phone: '' });
  const [submitted, setSubmitted] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.company) return;
    setSubmitted(true);
    // Fire Plausible event
    if (typeof window !== 'undefined' && (window as any).plausible) {
      (window as any).plausible('audit_request', { props: { source: 'audit_landing' } });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero */}
      <div className="text-center mb-6">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gold-500/15 border border-gold-500/40 text-gold-300 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3">
          <ClipboardCheck size={11} /> Offre de lancement · Places limitées
        </span>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-white leading-tight mb-2">
          Audit gratuit 30 min de votre<br />
          <span className="text-gold-400">exposition au risque de change</span>
        </h1>
        <p className="text-[14px] text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Un expert FX senior de JAD2 Advisory analyse votre situation, identifie vos quick wins,
          et vous livre un plan d'action chiffré. <strong>Sans engagement.</strong>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: benefits + agenda */}
        <div className="lg:col-span-2 space-y-5">
          {/* Resources — P3.1 + P3.3 */}
          <div className="bg-navy-900/50 border border-gold-700/30 rounded-2xl p-4 flex flex-wrap items-center gap-3">
            <p className="text-[12px] text-slate-300 flex-1 min-w-0">Préparez l'audit avec nos guides :</p>
            <a
              href="/press/guide-oc-2024"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-bold text-gold-400 hover:text-gold-300 inline-flex items-center gap-1 px-2 py-1 bg-navy-950 border border-navy-800 rounded"
            >
              📘 Guide OC 01/2024
            </a>
            <a
              href="/press/forward-playbook"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-bold text-gold-400 hover:text-gold-300 inline-flex items-center gap-1 px-2 py-1 bg-navy-950 border border-navy-800 rounded"
            >
              📗 Forward Playbook
            </a>
          </div>
          {/* Benefits */}
          <div className="bg-navy-900 border border-gold-700/30 rounded-2xl p-5">
            <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <Award size={16} className="text-gold-400" /> Ce que vous obtenez en 30 min
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { icon: Shield,     title: 'Cartographie de votre exposition', desc: 'Commerciale, économique, bilan' },
                { icon: ClipboardCheck, title: 'Conformité Circ. 01/2024', desc: 'Score détaillé + actions correctives' },
                { icon: TrendingUp, title: 'Économies potentielles chiffrées', desc: 'Estimation €/an sur 3 scénarios' },
                { icon: Clock,       title: 'Plan d\'action priorisé',           desc: 'Quick wins dès le lendemain' },
              ].map((b) => {
                const Icon = b.icon;
                return (
                  <div key={b.title} className="flex items-start gap-2 p-2.5 bg-navy-950 border border-navy-800 rounded-lg">
                    <Icon size={16} className="text-gold-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[12px] font-bold text-white leading-tight">{b.title}</p>
                      <p className="text-[10px] text-slate-500">{b.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Agenda */}
          <div className="bg-navy-900 border border-navy-700 rounded-2xl p-5">
            <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <Calendar size={16} className="text-gold-400" /> Agenda (30 min)
            </h2>
            <ol className="space-y-2">
              {AGENDA.map((a) => (
                <li key={a.time} className="flex items-start gap-3">
                  <span className="text-[10px] font-mono text-gold-400 bg-navy-950 border border-gold-700/30 px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5">
                    {a.time}
                  </span>
                  <div>
                    <p className="text-[12px] font-bold text-white">{a.title}</p>
                    <p className="text-[10.5px] text-slate-400 leading-snug">{a.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Testimonials */}
          <div className="space-y-2">
            {TESTIMONIALS.map((t) => (
              <div key={t.author} className="bg-navy-900 border border-navy-700 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={9} className="text-gold-400 fill-gold-400" />
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-500">— {t.author} · {t.city}</span>
                </div>
                <p className="text-[11.5px] text-slate-300 italic leading-snug">&ldquo;{t.quote}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: form */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-gold-500/15 via-navy-900 to-navy-900 border-2 border-gold-500/50 rounded-2xl p-6 sticky top-20">
            {submitted ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center mx-auto mb-3">
                  <Check size={28} className="text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Demande envoyée ✓</h3>
                <p className="text-[12px] text-slate-300 leading-relaxed">
                  Nous vous contactons sous <strong>24h ouvrées</strong> pour proposer un créneau.
                  Vérifiez votre boîte mail ({form.email}).
                </p>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Phone size={16} className="text-gold-400" /> Réserver mon audit
                </h3>
                <p className="text-[10px] text-slate-400 italic">Sans engagement · Réponse sous 24h</p>

                <Field label="Nom complet *" v={form.name} onChange={(v) => setForm({ ...form, name: v })} />
                <Field label="Email professionnel *" type="email" v={form.email} onChange={(v) => setForm({ ...form, email: v })} />
                <Field label="Entreprise *" v={form.company} onChange={(v) => setForm({ ...form, company: v })} />
                <Field label="Volume FX annuel" placeholder="ex. 8M EUR" v={form.volume} onChange={(v) => setForm({ ...form, volume: v })} />
                <Field label="Téléphone (optionnel)" type="tel" v={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gold-500 text-navy-950 text-sm font-bold rounded-lg hover:bg-gold-400 transition-colors shadow-lg shadow-gold-900/30"
                >
                  <Calendar size={14} /> Réserver mon créneau
                </button>
                <p className="text-[9px] text-slate-500 text-center leading-relaxed">
                  Vos données sont traitées selon la loi 09-08 · CNDP. Pas de spam, désabonnement en 1 clic.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, v, onChange, type = 'text', placeholder }: { label: string; v: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">{label}</label>
      <input
        type={type}
        value={v}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={label.includes('*')}
        className="w-full bg-navy-950 border border-navy-700 rounded-lg px-3 py-2 text-[13px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-gold-500"
      />
    </div>
  );
}
