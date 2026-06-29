/**
 * P3 — Newsletter signup / Lead capture pipeline
 * Posts to the worker's /api/newsletter/subscribe endpoint which uses Resend.
 * Falls back to localStorage queue if offline (retry on next online event).
 */

import { useState } from 'react';
import { Mail, Check, AlertCircle, Loader2 } from 'lucide-react';

interface Props {
  /** Worker base URL */
  proxyUrl: string;
  /** Visual variant */
  variant?: 'inline' | 'card' | 'minimal';
  /** Where the lead came from (for analytics) */
  source: string;
  /** Optional pre-filled email */
  defaultEmail?: string;
}

const QUEUE_KEY = 'jad2fx_newsletter_queue_v1';

export default function NewsletterSignup({ proxyUrl, variant = 'card', source, defaultEmail = '' }: Props) {
  const [email, setEmail] = useState(defaultEmail);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('error');
      setMessage('Email invalide');
      return;
    }
    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch(`${proxyUrl.replace(/\/$/, '')}/api/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), name: name.trim(), company: company.trim(), source }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) {
        // Queue for retry
        queueLocally({ email, name, company, source, ts: Date.now() });
        throw new Error('Inscription différée — nous vous recontacterons');
      }
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (data.ok) {
        setStatus('success');
        setMessage('Merci ! Vérifiez votre boîte mail pour confirmer.');
        try { localStorage.setItem('jad2fx_newsletter_subscribed', '1'); } catch { /* ignore */ }
        if (typeof window !== 'undefined' && (window as any).plausible) {
          (window as any).plausible('newsletter_subscribe', { props: { source: 'signup_form' } });
        }
      } else {
        throw new Error(data.message ?? 'Erreur');
      }
    } catch (err) {
      // Fall back to local queue
      queueLocally({ email, name, company, source, ts: Date.now() });
      setStatus('success'); // UX: tell user it's queued
      setMessage('Inscription enregistrée localement — nous vous recontacterons dès que possible.');
    }
  };

  // Try to flush the queue on mount + on online
  if (typeof window !== 'undefined') {
    window.addEventListener('online', flushQueue);
  }

  const wrapperClass =
    variant === 'card'
      ? 'bg-navy-900 border border-navy-700 rounded-2xl p-6'
      : variant === 'inline'
      ? 'bg-navy-900/50 border border-navy-700 rounded-xl p-4'
      : '';

  return (
    <div className={wrapperClass}>
      {variant !== 'minimal' && (
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center">
            <Mail size={16} className="text-gold-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Recevez le Morning Briefing</h3>
            <p className="text-[10px] text-slate-400">Taux de change + analyses FX — chaque lundi à 8h.</p>
          </div>
        </div>
      )}

      <form onSubmit={submit} className="space-y-2">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@entreprise.ma"
            className="flex-1 bg-navy-950 border border-navy-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-gold-500"
            aria-label="Adresse email"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="px-4 py-2 bg-gold-500 text-navy-950 text-sm font-bold rounded-lg hover:bg-gold-400 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {status === 'loading' ? <Loader2 size={12} className="animate-spin" /> : 'S\'abonner'}
          </button>
        </div>
        {variant === 'card' && (
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Votre nom (optionnel)"
              className="flex-1 bg-navy-950 border border-navy-700 rounded-lg px-3 py-2 text-[12px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-gold-500"
            />
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Entreprise (optionnel)"
              className="flex-1 bg-navy-950 border border-navy-700 rounded-lg px-3 py-2 text-[12px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-gold-500"
            />
          </div>
        )}
        {message && (
          <div className={`flex items-start gap-1.5 text-[11px] ${
            status === 'success' ? 'text-emerald-400' : status === 'error' ? 'text-red-400' : 'text-slate-400'
          }`}>
            {status === 'success' ? <Check size={11} className="mt-0.5 flex-shrink-0" /> :
             status === 'error'   ? <AlertCircle size={11} className="mt-0.5 flex-shrink-0" /> : null}
            <span>{message}</span>
          </div>
        )}
      </form>
      <p className="text-[9px] text-slate-500 mt-2 leading-relaxed">
        Données traitées selon la loi 09-08 · CNDP · Désabonnement en 1 clic
      </p>
    </div>
  );
}

interface QueuedLead {
  email: string;
  name: string;
  company: string;
  source: string;
  ts: number;
}

function queueLocally(lead: QueuedLead) {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    const arr: QueuedLead[] = raw ? JSON.parse(raw) : [];
    arr.push(lead);
    // Cap at 50 to prevent unbounded growth
    localStorage.setItem(QUEUE_KEY, JSON.stringify(arr.slice(-50)));
  } catch { /* ignore */ }
}

async function flushQueue() {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return;
    const arr: QueuedLead[] = JSON.parse(raw);
    if (!arr.length) return;
    const proxyUrl = localStorage.getItem('jad2fx_proxy') ?? '';
    if (!proxyUrl) return;
    const remaining: QueuedLead[] = [];
    for (const lead of arr) {
      try {
        await fetch(`${proxyUrl.replace(/\/$/, '')}/api/newsletter/subscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lead),
        });
      } catch {
        remaining.push(lead);
      }
    }
    localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  } catch { /* ignore */ }
}
