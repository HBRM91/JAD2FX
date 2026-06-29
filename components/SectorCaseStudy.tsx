/**
 * P3.9 — Sector case study page.
 */

import { Factory, Shirt, TreePine, Wheat, Pickaxe, CheckCircle2, Quote, MapPin, Building2, TrendingUp } from 'lucide-react';
import { SECTOR_CASES, type SectorCase } from '../services/sectorCases';

const ICON_MAP = {
  car: Factory,
  shirt: Shirt,
  wood: TreePine,
  wheat: Wheat,
  phosphate: Pickaxe,
};

const SLUG_TO_ICON: Record<string, { icon: string; label: string }> = {
  'SECTOR_AUTO':     { icon: 'car',       label: 'Équipementier automobile' },
  'SECTOR_TEXTILE':  { icon: 'shirt',     label: 'Textile & Habillement' },
  'SECTOR_NORDIQUE': { icon: 'wood',      label: 'Bois & Papier' },
  'SECTOR_AGRI':     { icon: 'wheat',     label: 'Agroalimentaire' },
  // SECTOR_PHOSPHATE not yet wired
};

export function SectorCaseStudy({ slug }: { slug: string }) {
  // Map SECTOR_* slugs to case slugs
  const slugToCase: Record<string, string> = {
    'SECTOR_AUTO': 'automobile-tanger',
    'SECTOR_TEXTILE': 'textile-export-fes',
    'SECTOR_NORDIQUE': 'bois-casablanca',
    'SECTOR_AGRI': 'phosphates-khouribga',
  };
  const caseSlug = slugToCase[slug] || 'automobile-tanger';
  const c = SECTOR_CASES.find((s) => s.slug === caseSlug);
  if (!c) return null;
  const Icon = ICON_MAP[c.icon];

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div className="bg-navy-900 border border-navy-700 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-12 h-12 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center">
            <Icon size={20} className="text-gold-400" />
          </div>
          <div className="flex-1 min-w-0">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${c.color}`}>{c.sector}</span>
            <h1 className="text-xl font-serif font-bold text-white mt-0.5 leading-tight">{c.company}</h1>
            <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
              <MapPin size={10} /> {c.city}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-navy-950 border border-navy-800 rounded-lg p-3">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">CA annuel</p>
            <p className="text-sm font-mono font-bold text-gold-400 mt-0.5">{c.revenueEUR}</p>
          </div>
          <div className="bg-navy-950 border border-navy-800 rounded-lg p-3">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Exposition</p>
            <p className="text-[11px] text-slate-300 leading-snug mt-0.5">{c.exposure}</p>
          </div>
        </div>
      </div>

      <div className="bg-navy-900 border border-navy-700 rounded-2xl p-6 space-y-4">
        <Section title="Le défi" content={c.challenge} />
        <Section title="La solution JAD2FX + JAD2 Advisory" content={c.solution} />

        <div>
          <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
            <TrendingUp size={14} className="text-emerald-400" /> Résultats obtenus
          </h3>
          <div className="space-y-1.5">
            {c.results.map((r, i) => (
              <div key={i} className="flex items-start gap-2 p-2 bg-navy-950 border border-emerald-700/30 rounded-lg">
                <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-[12px] text-slate-300 leading-snug">{r}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {c.testimonial && (
        <div className="bg-gradient-to-br from-gold-500/10 to-navy-900 border border-gold-700/30 rounded-2xl p-6">
          <Quote size={20} className="text-gold-500/40 mb-2" />
          <p className="text-[14px] text-slate-200 leading-relaxed italic mb-3">
            &ldquo;{c.testimonial}&rdquo;
          </p>
          <p className="text-[11px] text-slate-500 flex items-center gap-1">
            <Building2 size={10} /> {c.testimonialAuthor}
          </p>
        </div>
      )}

      <div className="bg-navy-900/50 border border-gold-700/30 rounded-2xl p-5 text-center">
        <p className="text-[12px] text-slate-300 mb-2">Votre secteur a un cas similaire ?</p>
        <button className="text-[12px] font-bold text-gold-400 hover:text-gold-300 transition-colors">
          Demander un audit gratuit 30 min →
        </button>
      </div>
    </div>
  );
}

function Section({ title, content }: { title: string; content: string }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-white mb-1.5">{title}</h3>
      <p className="text-[12px] text-slate-300 leading-relaxed">{content}</p>
    </div>
  );
}

export function SectorCaseIndex() {
  // Default to first case if no slug
  return <SectorCaseStudy slug="automobile-tanger" />;
}

// Renamed placeholder — actual implementation in original
function _origSectorCaseIndex() {
  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="text-center">
        <h1 className="text-xl font-serif font-bold text-white mb-1">Études de cas sectorielles</h1>
        <p className="text-[12px] text-slate-400">Comment les entreprises marocaines gèrent leur risque de change — 4 secteurs clés.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {SECTOR_CASES.map((c) => {
          const Icon = ICON_MAP[c.icon];
          return (
            <a
              key={c.slug}
              href={`?view=SECTOR_AUTO`}
              className="block bg-navy-900 border border-navy-700 rounded-2xl p-4 hover:border-gold-500/40 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg bg-navy-950 border border-navy-800 flex items-center justify-center flex-shrink-0`}>
                  <Icon size={18} className={c.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${c.color}`}>{c.sector}</p>
                  <p className="text-[13px] font-bold text-white mt-0.5 leading-tight">{c.company}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{c.city} · {c.revenueEUR}</p>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

export function SectorLanding({ sectorId }: { sectorId: string }) {
  const meta = SLUG_TO_ICON[sectorId];
  if (!meta) return <div>Secteur inconnu</div>;
  const slugToCase: Record<string, string> = {
    'SECTOR_AUTO': 'automobile-tanger',
    'SECTOR_TEXTILE': 'textile-export-fes',
    'SECTOR_NORDIQUE': 'bois-casablanca',
    'SECTOR_AGRI': 'phosphates-khouribga',
  };
  const caseSlug = slugToCase[sectorId];
  return <SectorCaseStudy slug={caseSlug} />;
}

// Default export for lazy() consumption
export default function SectorCaseStudyPage() {
  return <SectorCaseStudy slug="automobile-tanger" />;
}
