/**
 * P3.2 — PDF download + email gate.
 * Shows a download form. On submit: validates email, captures lead,
 * then triggers the worker PDF download URL.
 */

import { useState } from 'react';
import { Download, Mail, FileText, CheckCircle2, X, Loader2 } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';

interface PdfGateProps {
  /** URL the user will download (relative or absolute) */
  pdfUrl: string;
  /** Display title for the gate */
  title: string;
  /** Short description shown above the form */
  description: string;
  /** PDF filename for the download */
  filename: string;
  /** Source label for analytics */
  source: string;
  /** Optional close handler */
  onClose?: () => void;
}

export default function PdfGate({ pdfUrl, title, description, filename, source, onClose }: PdfGateProps) {
  const { config } = useAdmin();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Email invalide');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const base = (config.corsProxyUrl ?? '').replace(/\/$/, '');
      // Capture lead in the worker
      if (base) {
        await fetch(`${base}/api/leads`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name, company, source, service: filename }),
        }).catch(() => {});
      }
      // Fire Plausible
      if (typeof window !== 'undefined' && (window as any).plausible) {
        (window as any).plausible('pdf_download', { props: { file: filename, source } });
      }
      setDone(true);
      // Auto-trigger download after a moment
      setTimeout(() => {
        const a = document.createElement('a');
        a.href = pdfUrl.startsWith('http') ? pdfUrl : `${base.replace(/\/$/, '')}${pdfUrl}`;
        a.download = filename;
        a.target = '_blank';
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }, 800);
    } catch {
      setError("Erreur réseau. Réessayez ou téléchargez directement.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9997] flex items-center justify-center p-4 bg-navy-950/85 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-navy-900 border border-gold-700/40 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-navy-800">
          <div className="w-9 h-9 rounded-lg bg-gold-500/15 border border-gold-500/30 flex items-center justify-center">
            <FileText size={16} className="text-gold-400" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-gold-400 uppercase tracking-widest font-bold">Téléchargement</p>
            <h2 className="text-sm font-bold text-white leading-tight">{title}</h2>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
              <X size={16} />
            </button>
          )}
        </div>

        {done ? (
          <div className="p-6 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center mx-auto">
              <CheckCircle2 size={26} className="text-emerald-400" />
            </div>
            <p className="text-sm font-bold text-white">Merci ! Téléchargement lancé</p>
            <p className="text-[11px] text-slate-400">
              Si le téléchargement ne démarre pas automatiquement,{' '}
              <a href={pdfUrl} target="_blank" rel="noopener" className="text-gold-400 underline">
                cliquez ici
              </a>.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="p-5 space-y-3">
            <p className="text-[12px] text-slate-300 leading-snug">{description}</p>
            <div className="space-y-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Votre nom (optionnel)"
                className="w-full bg-navy-950 border border-navy-700 rounded px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-gold-500"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@entreprise.ma *"
                required
                className="w-full bg-navy-950 border border-navy-700 rounded px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-gold-500"
              />
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Entreprise (optionnel)"
                className="w-full bg-navy-950 border border-navy-700 rounded px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-gold-500"
              />
            </div>
            {error && <p className="text-[11px] text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gold-500 text-navy-950 text-sm font-bold rounded-lg hover:bg-gold-400 disabled:opacity-50 transition-colors"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              {submitting ? 'Préparation…' : 'Recevoir le PDF'}
            </button>
            <p className="text-[9px] text-slate-500 text-center italic">
              Données traitées selon la loi 09-08 (CNDP) · Désabonnement en 1 clic
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
