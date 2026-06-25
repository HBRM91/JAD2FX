import { ExternalLink, Mail, Linkedin } from 'lucide-react';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="border-t mt-16"
      style={{ borderColor: 'rgba(255,255,255,0.08)', backgroundColor: '#0A0F1E' }}
    >
      {/* Full disclaimer — mandatory, every viewport */}
      <div
        className="border-b px-4 py-4 md:px-8"
        style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: '#111827' }}
      >
        <p className="text-xs leading-relaxed max-w-5xl mx-auto" style={{ color: '#64748B' }}>
          <strong style={{ color: '#94A3B8' }}>Avertissement légal :</strong>{' '}
          JAD2FX est un outil pédagogique. Les taux affichés sont indicatifs, publiés par
          Bank Al-Maghrib. Ils ne constituent pas une offre de service ou un conseil en
          investissement. JAD2 Advisory n&apos;est pas habilitée à fournir des services
          d&apos;investissement au sens de la réglementation AMMC. Pour toute opération de
          change, adressez-vous à un établissement de crédit agréé par Bank Al-Maghrib.
          Les taux croisés et les données de devises régionales sont estimatifs et à titre
          indicatif uniquement.
        </p>
      </div>

      {/* Footer body */}
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left: Brand */}
          <div>
            <div
              className="font-bold text-lg tracking-tight mb-2"
              style={{ letterSpacing: '-0.04em' }}
            >
              <span style={{ color: '#F1F5F9' }}>JAD2</span>
              <span style={{ color: '#00C896' }}>FX</span>
            </div>
            <p className="text-sm" style={{ color: '#64748B' }}>
              Terminal de taux de change MAD
            </p>
            <p className="text-sm mt-1" style={{ color: '#64748B' }}>
              par <span style={{ color: '#94A3B8' }}>JAD2 Advisory</span> — Casablanca, Maroc
            </p>
          </div>

          {/* Center: Links */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#64748B' }}>
              Liens
            </p>
            <a
              href="https://jad2advisory.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm hover:text-white transition-colors"
              style={{ color: '#94A3B8' }}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              jad2advisory.com
            </a>
            <a
              href="https://www.bkam.ma/Marches/Principaux-indicateurs/Marche-des-changes"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm hover:text-white transition-colors"
              style={{ color: '#94A3B8' }}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Bank Al-Maghrib — Marché des changes
            </a>
            <a
              href="#contact"
              className="flex items-center gap-1.5 text-sm hover:text-white transition-colors"
              style={{ color: '#94A3B8' }}
            >
              <Mail className="w-3.5 h-3.5" />
              contact@jad2advisory.com
            </a>
          </div>

          {/* Right: Social */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#64748B' }}>
              Réseaux
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://www.linkedin.com/company/jad2advisory"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded border transition-colors hover:border-white/20"
                style={{ borderColor: 'rgba(255,255,255,0.08)', color: '#94A3B8' }}
                aria-label="LinkedIn JAD2 Advisory"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        <div
          className="mt-8 pt-6 border-t flex flex-col sm:flex-row justify-between items-center gap-2"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <p className="text-xs" style={{ color: '#64748B' }}>
            © {year} JAD2 Advisory. Tous droits réservés.
          </p>
          <p className="text-xs font-mono" style={{ color: '#374151' }}>
            Source primaire : Bank Al-Maghrib · api.centralbankofmorocco.ma
          </p>
        </div>
      </div>
    </footer>
  );
}
