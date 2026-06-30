import { useState } from 'react';
import { Info, X } from 'lucide-react';
import { BKAM_LINKS } from '../constants/bkamLinks';
import { LiveRate } from '../types';

interface ProvenanceMeta {
  source: string;
  publishedAt: string;
  methodology: string;
  url?: string;
}

const PROVENANCE: Record<string, ProvenanceMeta> = {
  BKAM_OFFICIAL: {
    source: 'Bank Al-Maghrib â€” Cours de change officiels',
    publishedAt: '12:30 / 16:15 Casablanca',
    methodology: 'Doc 1 Â§I.1.a â€” Moyenne pondÃ©rÃ©e des transactions interbancaires',
    url: BKAM_LINKS.mainSite,
  },
  ECB_PROXY: {
    source: 'ECB / Frankfurter (fallback)',
    publishedAt: '~16:00 CET quotidien',
    methodology: 'Taux de change BCE â€” proxy pour le calcul du panier',
    url: 'https://www.frankfurter.app',
  },
  YAHOO_INTRADAY: {
    source: 'Yahoo Finance â€” 1h intraday',
    publishedAt: 'Continu pendant les heures de marchÃ©',
    methodology: 'Ticks 1h agrÃ©gÃ©s depuis le carnet d\'ordres Yahoo',
  },
  END_OF_DAY: {
    source: 'JAD2FX â€” DonnÃ©es fin de journÃ©e uniquement',
    publishedAt: '16:15 Casablanca',
    methodology: 'Taux de rÃ©fÃ©rence (mid) du jour â€” pas d\'historique intraday disponible',
  },
  CALCULATED: {
    source: 'JAD2FX â€” Calcul interne',
    publishedAt: 'Maintenant',
    methodology: 'Mid calculÃ© Ã  partir de la formule panier BKAM et des taux ECB',
  },
};

/**
 * P1.21 â€” Data Provenance Chip
 * Click any rate â†’ see its source, publication time, and methodology.
 */
export default function ProvenanceChip({ rate, isRTL }: { rate: LiveRate; isRTL?: boolean }) {
  const [open, setOpen] = useState(false);
  const meta = PROVENANCE[rate.source] ?? PROVENANCE.CALCULATED;

  return (
    <span className="relative inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-slate-500 hover:text-gold-400 transition-colors"
        aria-label="Source de la donnÃ©e"
        title={`Source: ${meta.source}`}
      >
        <Info size={10} />
      </button>
      {open && (
        <div
          className="absolute z-50 mt-1 w-72 bg-navy-900 border border-gold-700/50 rounded-lg shadow-2xl p-3 text-left"
          style={isRTL ? { right: 0 } : { left: 0 }}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="text-[11px] font-bold text-gold-400 uppercase tracking-wider">Provenance</h4>
            <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-300">
              <X size={11} />
            </button>
          </div>
          <dl className="space-y-1.5 text-[11px] text-slate-300">
            <div>
              <dt className="text-slate-500">Source</dt>
              <dd className="font-medium">{meta.source}</dd>
            </div>
            <div>
              <dt className="text-slate-500">PubliÃ©</dt>
              <dd>{meta.publishedAt}</dd>
            </div>
            <div>
              <dt className="text-slate-500">MÃ©thodologie</dt>
              <dd className="leading-relaxed">{meta.methodology}</dd>
            </div>
            {rate.timestamp && (
              <div>
                <dt className="text-slate-500">Cache local</dt>
                <dd className="font-mono text-[10px]">{new Date(rate.timestamp).toLocaleString('fr-MA')}</dd>
              </div>
            )}
            {rate.feedStatus && (
              <div>
                <dt className="text-slate-500">Ã‰tat du flux</dt>
                <dd>
                  <span className={
                    rate.feedStatus === 'LIVE' ? 'text-emerald-400' :
                    rate.feedStatus === 'DELAYED' ? 'text-amber-400' :
                    rate.feedStatus === 'STALE' ? 'text-orange-400' :
                    'text-red-400'
                  }>
                    â— {rate.feedStatus}
                  </span>
                </dd>
              </div>
            )}
            {meta.url && (
              <div className="pt-1.5 border-t border-navy-800">
                <a href={meta.url} target="_blank" rel="noopener noreferrer" className="text-gold-400 hover:text-gold-300 text-[10px]">
                  â†— Source officielle
                </a>
              </div>
            )}
          </dl>
        </div>
      )}
    </span>
  );
}
