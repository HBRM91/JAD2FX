import React, { useState } from 'react';
import { Shield, X, ExternalLink } from 'lucide-react';

interface Props {
  toolName?: string;
}

export default function ComplianceBanner({ toolName }: Props) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/15 rounded-lg px-4 py-3 text-[11px] text-amber-400/80 leading-relaxed">
      <Shield size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <span className="font-bold text-amber-300">Outil de simulation pédagogique</span>
        {toolName && <span className="text-amber-400/60"> · {toolName}</span>}
        {' '}—{' '}
        Les résultats sont <strong className="text-amber-300">indicatifs et non-exécutables</strong>.
        JAD2 Advisory est un cabinet de <strong className="text-amber-300">conseil stratégique et de formation</strong>{' '}
        en gestion du risque de change. Il ne fournit pas de conseil en investissement et n'exécute aucune transaction de change.
        Pour toute opération, rapprochez-vous de votre établissement bancaire habilité.{' '}
        <a
          href="https://jad2advisory.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 text-gold-500/70 hover:text-gold-400 underline"
        >
          jad2advisory.com <ExternalLink size={9} />
        </a>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-amber-700 hover:text-amber-500 flex-shrink-0 transition-colors"
        title="Fermer"
      >
        <X size={12} />
      </button>
    </div>
  );
}
