'use client';

import { useState } from 'react';
import { FileText, Loader2, CheckCircle, AlertCircle, Building2 } from 'lucide-react';

const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'JPY', 'CAD', 'SAR', 'AED', 'CNY', 'TRY'];

const SERVICE_TYPES = [
  'Formation',
  'Conseil en marchés',
  'Analyse FX',
  'Accompagnement réglementaire',
  'Automatisation',
  'Autre',
];

type Status = 'idle' | 'loading' | 'success' | 'error';

// Basic corporate email filter — warn but don't block
function isFreeEmail(email: string): boolean {
  const free = ['gmail.', 'yahoo.', 'hotmail.', 'outlook.com', 'live.', 'aol.', 'icloud.'];
  return free.some(d => email.toLowerCase().includes(d));
}

export default function PDFReportSection() {
  const [form, setForm] = useState({
    company: '',
    currency: 'EUR',
    amount: '',
    email: '',
    serviceType: 'Analyse FX',
  });
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [freeEmailWarn, setFreeEmailWarn] = useState(false);

  const handleChange = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const v = e.target.value;
    setForm(f => ({ ...f, [field]: v }));
    if (field === 'email') setFreeEmailWarn(isFreeEmail(v));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company || !form.email) return;
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/generate-report', {
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

  return (
    <section id="rapport" className="max-w-screen-2xl mx-auto px-4 md:px-8 py-10">
      <div
        className="rounded border overflow-hidden"
        style={{ borderColor: 'rgba(212,160,23,0.2)' }}
      >
        {/* Section header */}
        <div
          className="p-6 border-b"
          style={{ borderColor: 'rgba(255,255,255,0.08)', backgroundColor: '#111827' }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div
              className="p-2 rounded"
              style={{ backgroundColor: 'rgba(212,160,23,0.12)' }}
            >
              <FileText className="w-5 h-5" style={{ color: '#D4A017' }} />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: '#F1F5F9' }}>
                Rapport de Risque FX — Génération Automatisée
              </h2>
              <p className="text-xs" style={{ color: '#64748B' }}>
                Recevez un rapport exécutif personnalisé avec vos métriques de risque de change.
                Livré par email en moins de 60 secondes.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-5 gap-8" style={{ backgroundColor: '#0D1420' }}>
          {/* Form — 3 cols */}
          <div className="lg:col-span-3">
            {status === 'success' ? (
              <div
                className="flex flex-col items-center justify-center gap-3 py-12 text-center"
              >
                <CheckCircle className="w-12 h-12" style={{ color: '#22C55E' }} />
                <h3 className="text-lg font-semibold" style={{ color: '#F1F5F9' }}>
                  Rapport généré
                </h3>
                <p className="text-sm max-w-xs" style={{ color: '#94A3B8' }}>
                  Votre rapport a été envoyé à <strong>{form.email}</strong>.
                  Vérifiez vos spams si vous ne le recevez pas dans 2 minutes.
                </p>
                <button
                  onClick={() => { setStatus('idle'); setForm(f => ({ ...f, company: '', amount: '', email: '' })); }}
                  className="mt-2 text-xs underline"
                  style={{ color: '#64748B' }}
                >
                  Générer un autre rapport
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: '#94A3B8' }}>
                      Nom de l&apos;entreprise *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Société Dupont Maroc SA"
                      value={form.company}
                      onChange={handleChange('company')}
                      className={inputBase}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: '#94A3B8' }}>
                      Devise principale d&apos;exposition *
                    </label>
                    <select
                      value={form.currency}
                      onChange={handleChange('currency')}
                      className={inputBase}
                      style={inputStyle}
                    >
                      {CURRENCIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: '#94A3B8' }}>
                      Exposition annuelle estimée ({form.currency})
                    </label>
                    <input
                      type="number"
                      placeholder="500000"
                      value={form.amount}
                      onChange={handleChange('amount')}
                      className={inputBase}
                      style={inputStyle}
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: '#94A3B8' }}>
                      Type de besoin
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
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#94A3B8' }}>
                    Email professionnel *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="direction@votreentreprise.ma"
                    value={form.email}
                    onChange={handleChange('email')}
                    className={inputBase}
                    style={inputStyle}
                  />
                  {freeEmailWarn && (
                    <p className="mt-1 text-xs flex items-center gap-1" style={{ color: '#D4A017' }}>
                      <AlertCircle className="w-3 h-3" />
                      Recommandé : utilisez votre email professionnel pour un rapport personnalisé
                    </p>
                  )}
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
                  disabled={status === 'loading' || !form.company || !form.email}
                  className="w-full py-3 px-4 text-sm font-semibold rounded transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#D4A017', color: '#0A0F1E' }}
                  onMouseEnter={e => { if (status !== 'loading') e.currentTarget.style.filter = 'brightness(1.1)'; }}
                  onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
                >
                  {status === 'loading' ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Génération en cours...</>
                  ) : (
                    <><FileText className="w-4 h-4" /> Générer mon rapport PDF →</>
                  )}
                </button>

                <p className="text-2xs text-center" style={{ color: '#374151' }}>
                  Ce rapport est généré à titre pédagogique uniquement. JAD2 Advisory n&apos;est
                  pas habilitée à fournir des services d&apos;investissement au sens de la réglementation AMMC.
                </p>
              </form>
            )}
          </div>

          {/* Preview — 2 cols */}
          <div className="lg:col-span-2">
            <div
              className="rounded border h-full flex flex-col overflow-hidden"
              style={{ borderColor: 'rgba(255,255,255,0.1)' }}
            >
              {/* Mock PDF preview */}
              <div
                className="p-3 border-b flex items-center gap-2"
                style={{ borderColor: 'rgba(255,255,255,0.08)', backgroundColor: '#111827' }}
              >
                <Building2 className="w-3.5 h-3.5" style={{ color: '#D4A017' }} />
                <span className="text-2xs font-mono uppercase tracking-wider" style={{ color: '#64748B' }}>
                  Aperçu du rapport
                </span>
              </div>
              <div className="p-4 flex-1" style={{ backgroundColor: '#0A0F1E' }}>
                <div className="space-y-3">
                  <div
                    className="h-6 rounded flex items-center px-2"
                    style={{ backgroundColor: '#1E293B' }}
                  >
                    <div className="h-2 w-32 rounded skeleton" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {['VaR 95%', 'VaR 99%', 'ES', 'Hedge ratio'].map(m => (
                      <div
                        key={m}
                        className="p-2 rounded border"
                        style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: '#111827' }}
                      >
                        <div className="text-2xs" style={{ color: '#64748B' }}>{m}</div>
                        <div className="skeleton h-4 w-16 mt-1 rounded" />
                      </div>
                    ))}
                  </div>
                  <div className="h-px" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
                  <div className="space-y-1">
                    {[120, 80, 100, 60, 90].map((w, i) => (
                      <div key={i} className="skeleton h-2.5 rounded" style={{ width: `${w}%` }} />
                    ))}
                  </div>
                  <div
                    className="p-2 rounded border-l-2 text-2xs"
                    style={{ borderColor: '#D4A017', backgroundColor: 'rgba(212,160,23,0.05)', color: '#64748B' }}
                  >
                    3 pages · Métriques VaR · Stress tests · Conformité OC
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
