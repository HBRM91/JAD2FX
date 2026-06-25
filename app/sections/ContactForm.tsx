'use client';

import { useState } from 'react';
import { Send, Loader2, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react';

const SERVICE_TYPES = [
  'Formation en marchés financiers',
  'Conseil en marchés de change',
  'Analyse FX',
  'Accompagnement réglementaire',
  'Automatisation',
  'Autre',
];

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function ContactForm() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    serviceType: 'Conseil en marchés de change',
    message: '',
  });
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? 'Erreur serveur');
      }
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  };

  const inputBase = 'w-full px-3 py-2.5 text-sm rounded border bg-transparent transition-colors';
  const inputStyle = {
    borderColor: 'rgba(255,255,255,0.1)',
    color: '#F1F5F9',
    outlineColor: '#00C896',
    backgroundColor: '#0A0F1E',
  };

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

  return (
    <section id="contact" className="max-w-screen-2xl mx-auto px-4 md:px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left: Context */}
        <div className="lg:col-span-2 space-y-4">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: '#F1F5F9' }}>
              Auditer mon exposition FX
            </h2>
            <p className="text-sm mt-2 leading-relaxed" style={{ color: '#94A3B8' }}>
              JAD2 Advisory accompagne les entreprises marocaines dans la gestion de leur
              risque de change — formation, analyse et structuration d&apos;expositions.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { title: 'Formation', detail: 'Initiation et perfectionnement aux marchés des changes' },
              { title: 'Conseil en marchés', detail: 'Analyse des expositions et stratégies de couverture' },
              { title: 'Accompagnement réglementaire', detail: 'Conformité Office des Changes et BKAM' },
              { title: 'Automatisation', detail: 'Reporting FX et suivi de positions' },
            ].map(s => (
              <div
                key={s.title}
                className="flex gap-3 p-3 rounded border"
                style={{ borderColor: 'rgba(255,255,255,0.07)', backgroundColor: '#111827' }}
              >
                <div
                  className="w-1.5 flex-shrink-0 rounded-full mt-1"
                  style={{ backgroundColor: '#00C896' }}
                />
                <div>
                  <p className="text-sm font-medium" style={{ color: '#F1F5F9' }}>{s.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>{s.detail}</p>
                </div>
              </div>
            ))}
          </div>

          {whatsappNumber && (
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 rounded border text-sm font-medium transition-colors"
              style={{
                borderColor: 'rgba(37,211,102,0.2)',
                color: '#25D366',
                backgroundColor: 'rgba(37,211,102,0.05)',
              }}
            >
              <MessageSquare className="w-4 h-4" />
              Poser une question rapide sur WhatsApp
            </a>
          )}

          <p className="text-xs leading-relaxed" style={{ color: '#374151' }}>
            JAD2 Advisory intervient en conseil en marchés, formation et analyse.
            Ces activités ne constituent pas des services d&apos;investissement au sens de
            la réglementation AMMC. Aucune recommandation d&apos;achat ou de vente n&apos;est
            formulée.
          </p>
        </div>

        {/* Right: Form */}
        <div className="lg:col-span-3">
          <div
            className="rounded border overflow-hidden"
            style={{ borderColor: 'rgba(255,255,255,0.08)' }}
          >
            <div
              className="p-4 border-b"
              style={{ borderColor: 'rgba(255,255,255,0.08)', backgroundColor: '#111827' }}
            >
              <h3 className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>
                Envoyer un message
              </h3>
              <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>
                Réponse sous 48h ouvrées · Aucune donnée stockée côté serveur
              </p>
            </div>

            <div className="p-6" style={{ backgroundColor: '#0D1420' }}>
              {status === 'success' ? (
                <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                  <CheckCircle className="w-10 h-10" style={{ color: '#22C55E' }} />
                  <h3 className="text-base font-semibold" style={{ color: '#F1F5F9' }}>
                    Message envoyé
                  </h3>
                  <p className="text-sm max-w-xs" style={{ color: '#94A3B8' }}>
                    Votre message a été transmis. L&apos;équipe JAD2 Advisory vous répondra sous 48h.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: '#94A3B8' }}>
                        Nom complet *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Mohammed Alami"
                        value={form.name}
                        onChange={handleChange('name')}
                        className={inputBase}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: '#94A3B8' }}>
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="m.alami@entreprise.ma"
                        value={form.email}
                        onChange={handleChange('email')}
                        className={inputBase}
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: '#94A3B8' }}>
                        Entreprise
                      </label>
                      <input
                        type="text"
                        placeholder="Nom de votre société"
                        value={form.company}
                        onChange={handleChange('company')}
                        className={inputBase}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: '#94A3B8' }}>
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        placeholder="+212 6XX XXX XXX"
                        value={form.phone}
                        onChange={handleChange('phone')}
                        className={inputBase}
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: '#94A3B8' }}>
                      Type de service recherché
                    </label>
                    <select
                      value={form.serviceType}
                      onChange={handleChange('serviceType')}
                      className={inputBase}
                      style={inputStyle}
                    >
                      {SERVICE_TYPES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: '#94A3B8' }}>
                      Message
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Décrivez votre besoin ou posez votre question..."
                      value={form.message}
                      onChange={handleChange('message')}
                      className={`${inputBase} resize-none`}
                      style={inputStyle}
                    />
                  </div>

                  {status === 'error' && (
                    <div
                      className="flex items-center gap-2 p-3 rounded text-xs"
                      style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444' }}
                    >
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {errorMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'loading' || !form.name || !form.email}
                    className="w-full py-3 px-4 text-sm font-semibold rounded transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{ backgroundColor: '#00C896', color: '#0A0F1E' }}
                    onMouseEnter={e => { if (status !== 'loading') e.currentTarget.style.filter = 'brightness(1.1)'; }}
                    onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
                  >
                    {status === 'loading' ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Envoi en cours...</>
                    ) : (
                      <><Send className="w-4 h-4" /> Envoyer le message</>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
