import React, { useState } from 'react';
import { Send, ExternalLink, Phone, Mail, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';

const SERVICES = [
  'Formation',
  'Conseil marché',
  'Analyse',
  'Accompagnement réglementaire',
  'Automatisation',
  'Autre',
] as const;

type ServiceType = typeof SERVICES[number];

interface FormState {
  name: string;
  email: string;
  company: string;
  service: ServiceType | '';
  message: string;
}

type SubmitStatus = 'idle' | 'loading' | 'success' | 'error';

export default function ContactForm() {
  const { config } = useAdmin();
  const [form, setForm] = useState<FormState>({
    name: '', email: '', company: '', service: '', message: '',
  });
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [mode, setMode] = useState<'FORM' | 'CALENDLY'>(
    (typeof process !== 'undefined' && (process as any)?.CALENDLY_URL) ? 'CALENDLY' : 'FORM',
  );

  const set = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.service) return;

    setStatus('loading');
    setErrorMsg('');

    try {
      const base = (config.corsProxyUrl ?? '').replace(/\/$/, '');
      if (!base) throw new Error('Proxy non configuré');

      const res = await fetch(`${base}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:    form.name.trim(),
          email:   form.email.trim(),
          company: form.company.trim(),
          service: form.service,
          message: form.message.trim(),
        }),
        signal: AbortSignal.timeout(15_000),
      });

      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? `Erreur ${res.status}`);

      setStatus('success');
      setForm({ name: '', email: '', company: '', service: '', message: '' });
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Erreur inattendue — réessayez plus tard');
    }
  }

  const inputCls = `w-full bg-navy-950 border border-navy-700 rounded-lg px-4 py-2.5 text-sm
    text-slate-200 placeholder-slate-500 focus:outline-none focus:border-gold-500
    focus:ring-1 focus:ring-gold-500/30 transition-colors`;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── Left: info ───────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Parlons de votre projet</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Formation, conseil en stratégie de couverture, accompagnement réglementaire OC —
              l'équipe JAD2 Advisory vous répond sous 48h.
            </p>
          </div>

          {/* Contact info */}
          <div className="space-y-3">
            {[
              { icon: Mail,    text: 'contact@jad2advisory.com' },
              { icon: MapPin,  text: 'Casablanca, Maroc' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-sm text-slate-400">
                <div className="w-8 h-8 rounded-lg bg-gold-500/10 border border-gold-500/25 flex items-center justify-center flex-shrink-0">
                  <Icon size={14} className="text-gold-400" />
                </div>
                <span>{text}</span>
              </div>
            ))}
          </div>

          {/* WhatsApp CTA */}
          {process.env.WHATSAPP_NUMBER && (
            <a
              href={`https://wa.me/${process.env.WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <Phone size={14} />
              WhatsApp JAD2 Advisory
            </a>
          )}

          {/* Services list */}
          <div className="bg-navy-900 border border-navy-700 rounded-xl p-4 space-y-2">
            <p className="text-xs font-bold text-white uppercase tracking-wider mb-3">Nos prestations</p>
            {[
              'Formation équipes finance (risque de change)',
              'Conseil en stratégie de couverture',
              'Accompagnement réglementaire Office des Changes',
              'Analyse de l\'exposition FX corporate',
            ].map(s => (
              <div key={s} className="flex items-start gap-2 text-xs text-slate-400">
                <span className="text-gold-500 flex-shrink-0 mt-0.5">▸</span>
                <span>{s}</span>
              </div>
            ))}
          </div>

          {/* Compliance note */}
          <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
            <p className="text-[11px] text-amber-400/90 leading-relaxed">
              JAD2 Advisory fournit exclusivement conseil stratégique et formation
              en gestion du risque de change — sans exécution de transactions
              ni conseil en investissement.
            </p>
          </div>

          <a
            href="https://jad2advisory.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-gold-400 hover:text-gold-300 transition-colors"
          >
            <ExternalLink size={13} />
            jad2advisory.com
          </a>
        </div>

        {/* ── Right: form ──────────────────────────────────────────────── */}
        <div className="lg:col-span-3 bg-navy-900 border border-navy-700 rounded-2xl p-6">
          {/* P3.7 — Mode toggle: form vs Calendly */}
          {typeof process !== 'undefined' && (process as any).CALENDLY_URL && (
            <div className="flex items-center gap-1 bg-navy-950 border border-navy-700 rounded-lg p-1 mb-4">
              <button
                onClick={() => setMode('FORM')}
                className={`flex-1 px-3 py-1.5 text-[11px] font-bold rounded transition-colors ${
                  mode === 'FORM' ? 'bg-gold-500 text-navy-950' : 'text-slate-400'
                }`}
              >
                Formulaire
              </button>
              <button
                onClick={() => setMode('CALENDLY')}
                className={`flex-1 px-3 py-1.5 text-[11px] font-bold rounded transition-colors ${
                  mode === 'CALENDLY' ? 'bg-gold-500 text-navy-950' : 'text-slate-400'
                }`}
              >
                Réserver un créneau (30 min)
              </button>
            </div>
          )}

          {mode === 'CALENDLY' && (process as any).CALENDLY_URL ? (
            <div className="space-y-3">
              <p className="text-[12px] text-slate-300 text-center">
                Cliquez sur un créneau ci-dessous pour réserver votre session de 30 min
                avec un expert JAD2 Advisory.
              </p>
              {/* Calendly inline embed */}
              <div
                className="calendly-inline-widget rounded-lg overflow-hidden border border-navy-700"
                data-url={`${(process as any).CALENDLY_URL}?hide_gdpr_banner=1&background_color=081628&text_color=cbd5e1&primary_color=D4AF37`}
                style={{ minWidth: '320px', height: '650px' }}
              />
              <link rel="preconnect" href="https://assets.calendly.com" />
              <script async src="https://assets.calendly.com/assets/external/widget.js" />
            </div>
          ) : status === 'success' ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center gap-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                <CheckCircle size={28} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-white mb-1">Message transmis</p>
                <p className="text-sm text-slate-400">
                  L'équipe JAD2 Advisory vous répondra sous 48h ouvrées.
                </p>
              </div>
              <button
                onClick={() => setStatus('idle')}
                className="text-xs text-navy-400 hover:text-slate-300 transition-colors mt-2"
              >
                Envoyer un autre message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                    Nom <span className="text-gold-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={100}
                    value={form.name}
                    onChange={set('name')}
                    placeholder="Prénom Nom"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                    Email professionnel <span className="text-gold-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    maxLength={200}
                    value={form.email}
                    onChange={set('email')}
                    placeholder="vous@entreprise.ma"
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                    Entreprise
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    value={form.company}
                    onChange={set('company')}
                    placeholder="Nom de votre société"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                    Type de besoin <span className="text-gold-500">*</span>
                  </label>
                  <select
                    required
                    value={form.service}
                    onChange={set('service')}
                    className={inputCls}
                  >
                    <option value="">Sélectionnez...</option>
                    {SERVICES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Message (optionnel)
                </label>
                <textarea
                  rows={4}
                  maxLength={2000}
                  value={form.message}
                  onChange={set('message')}
                  placeholder="Décrivez votre projet, vos besoins spécifiques ou vos questions..."
                  className={`${inputCls} resize-none`}
                />
              </div>

              {status === 'error' && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                  <p className="text-xs text-red-400">{errorMsg}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
                  Pas de stockage de données · Transmission directe à JAD2 Advisory.
                </p>
                <button
                  type="submit"
                  disabled={status === 'loading' || !form.name || !form.email || !form.service}
                  className="flex items-center gap-2 bg-gold-500 text-navy-950 font-bold text-sm px-5 py-2.5
                    rounded-lg hover:bg-gold-400 disabled:opacity-50 disabled:cursor-not-allowed
                    transition-colors shadow-lg shadow-gold-900/30"
                >
                  {status === 'loading' ? (
                    <span className="animate-pulse">Envoi...</span>
                  ) : (
                    <>
                      <Send size={14} />
                      Envoyer
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
