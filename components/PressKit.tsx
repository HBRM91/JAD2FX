import { Download, Mail, FileText, ExternalLink, Image as ImageIcon } from 'lucide-react';

/**
 * P4.15 — Press kit page.
 * Brand assets, founder bio, contact for journalists, downloadable logo pack.
 */

const ASSETS = [
  { name: 'Logo JAD2FX (SVG, transparent)', size: '4 KB', filename: 'jad2-logo.svg', mime: 'image/svg+xml' },
  { name: 'Logo JAD2FX (PNG, 1200×630 OG)', size: '~12 KB', filename: 'jad2-og.png', mime: 'image/png' },
  { name: 'Logo JAD2 Advisory (wordmark)', size: '6 KB', filename: 'jad2-advisory-logo.svg', mime: 'image/svg+xml' },
  { name: 'Brand colors (CSS variables)', size: '2 KB', filename: 'jad2-brand-colors.css', mime: 'text/css' },
  { name: 'Fact sheet (PDF, 1 page)', size: '~80 KB', filename: 'jad2fx-fact-sheet.pdf', mime: 'application/pdf' },
  { name: 'Founder photo (HD, 2400×1600)', size: '~1.5 MB', filename: 'founder-hd.jpg', mime: 'image/jpeg' },
];

export default function PressKit() {
  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div className="flex items-center gap-2">
        <FileText size={14} className="text-gold-500" />
        <h1 className="text-base font-bold text-white uppercase tracking-wider">Press Kit · JAD2FX</h1>
      </div>

      <div className="bg-navy-900 border border-navy-700 rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-white mb-2">À propos de JAD2FX</h2>
          <p className="text-[12px] text-slate-300 leading-relaxed">
            <strong>JAD2FX</strong> est le terminal pédagogique en ligne des taux de change du dirham marocain (MAD).
            Lancé en 2024 par <strong>JAD2 Advisory</strong>, cabinet de conseil stratégique et de formation en gestion du risque de change basé à Casablanca.
            L'outil affiche 24 devises avec des cotations indicatives, des simulateurs de forward/swap, et un diagnostic de conformité à la Circ. OC 01/2024.
            Destiné aux DAF, trésoriers et gérants d'entreprises marocaines.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-navy-800">
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Lancement</p>
            <p className="text-sm font-bold text-white">2024</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Siège</p>
            <p className="text-sm font-bold text-white">Casablanca, MA</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Devises</p>
            <p className="text-sm font-bold text-white">24 paires vs MAD</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Utilisateurs</p>
            <p className="text-sm font-bold text-white">PME + Corporate MA</p>
          </div>
        </div>
      </div>

      {/* Brand story */}
      <div className="bg-navy-900 border border-navy-700 rounded-2xl p-6 space-y-3">
        <h2 className="text-sm font-bold text-white">Histoire & mission</h2>
        <p className="text-[12px] text-slate-300 leading-relaxed">
          JAD2 Advisory a été fondé par Hamza El Bouhali, expert FX certifié, après 8 ans d'expérience en salle de marché
          et conseil auprès d'entreprises marocaines (équipementiers automobile Tanger, exportateurs textile Fès,
          opérateurs phosphates Khouribga). Constat : 80% des PME exportatrices/importatrices n'ont pas d'outil FX pédagogique
          et prennent leurs décisions de change "à l'instinct". JAD2FX comble ce gap.
        </p>
        <p className="text-[12px] text-slate-300 leading-relaxed">
          Mission : <em>« Démocratiser l'intelligence FX pour les trésoriers marocains »</em>.
          Outil 100% gratuit pour la dimension pédagogique ; services payants (formation, audit, accompagnement OC) via JAD2 Advisory.
        </p>
      </div>

      {/* Assets */}
      <div className="bg-navy-900 border border-navy-700 rounded-2xl p-6 space-y-3">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <ImageIcon size={14} className="text-gold-500" /> Brand Assets
        </h2>
        <p className="text-[10px] text-slate-500 leading-relaxed">
          Usage libre avec mention « JAD2FX — fx.jad2advisory.com ». Pour les guidelines complètes: contactez-nous.
        </p>
        <div className="space-y-1.5">
          {ASSETS.map((a) => (
            <a
              key={a.filename}
              href={`/press/${a.filename}`}
              download={a.filename}
              className="flex items-center gap-3 p-2.5 bg-navy-950 border border-navy-800 rounded-lg hover:border-gold-500/50 transition-colors"
            >
              <Download size={14} className="text-gold-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-slate-200 font-medium truncate">{a.name}</p>
                <p className="text-[10px] text-slate-500 font-mono">{a.mime} · {a.size}</p>
              </div>
              <span className="text-[10px] text-slate-500">↓</span>
            </a>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="bg-navy-900 border border-gold-700/40 rounded-2xl p-6 space-y-3">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Mail size={14} className="text-gold-500" /> Contact presse
        </h2>
        <p className="text-[12px] text-slate-300 leading-relaxed">
          Pour interviews, citations, ou collaborations éditoriales (podcasts, articles, études conjointes):
        </p>
        <div className="space-y-1.5">
          <a href="mailto:press@jad2advisory.com" className="flex items-center gap-2 text-[12px] text-gold-400 hover:text-gold-300">
            <Mail size={12} /> press@jad2advisory.com <ExternalLink size={10} />
          </a>
          <a href="https://jad2advisory.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[12px] text-gold-400 hover:text-gold-300">
            jad2advisory.com <ExternalLink size={10} />
          </a>
        </div>
        <p className="text-[10px] text-slate-500 italic">
          Temps de réponse habituel: 24-48h ouvrées. Pour les deadlines serrées, indiquez-le dans l'objet.
        </p>
      </div>
    </div>
  );
}
