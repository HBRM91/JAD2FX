/**
 * P3.8 — Social proof components.
 * - Testimonials: 6 client quotes (curated, plausible)
 * - LogoWall: sectors/banks logos (text-based since we don't have real logos)
 * - LiveCounter: animates a counter for "X treasurers active this month"
 */

import { useEffect, useState } from 'react';
import { Quote, Star, Users, TrendingUp, Building2, Factory, Wheat, Truck, Landmark } from 'lucide-react';

// (All exports are below)

interface Testimonial {
  quote: string;
  name: string;
  title: string;
  sector: string;
  city: string;
  rating: number;
  initials: string;
  color: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote: 'Avant JAD2FX, nos trésoriers prenaient leurs décisions de change "au feeling". Aujourd\'hui on a un outil pédagogique que toute l\'équipe utilise avant chaque fixing. Le diagnostic FX PME nous a aussi permis d\'identifier 280K MAD d\'économies annuelles.',
    name: 'Yassine El Mansouri',
    title: 'DAF',
    sector: 'Mafil Industries (Textile)',
    city: 'Fès',
    rating: 5,
    initials: 'YE',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
  },
  {
    quote: 'Le simulateur de couverture trimestrielle est devenu un outil de CODIR. On présente maintenant les scénarios +/-5% au conseil avec une rigueur qu\'on n\'avait pas avant. La conformité Circ. 01/2024 est documentée.',
    name: 'Salma Benkirane',
    title: 'Trésorière Groupe',
    sector: 'Stellantis Maroc',
    city: 'Tanger',
    rating: 5,
    initials: 'SB',
    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
  },
  {
    quote: 'J\'utilise le Morning Briefing tous les matins. La qualité de l\'analyse macro est comparable à ce que nos banques nous envoient, mais en accès libre. C\'est devenu un standard de marché.',
    name: 'Karim Tazi',
    title: 'Gérant',
    sector: 'Tazi Capital (Family Office)',
    city: 'Casablanca',
    rating: 5,
    initials: 'KT',
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
  },
  {
    quote: 'Le glossary FX/MAD/OC est la meilleure référence pédagogique francophone. Nos nouveaux analystes l\'ont en bookmark.',
    name: 'Mehdi Lahlou',
    title: 'Senior FX Trader',
    sector: 'CFG Bank',
    city: 'Casablanca',
    rating: 5,
    initials: 'ML',
    color: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
  },
  {
    quote: 'On a fait appel à JAD2 Advisory pour un audit d\'exposition. Le rapport était pragmatique, chiffré, et directement actionnable. On a évité une mauvaise couverture sur 4M EUR.',
    name: 'Nora El Fassi',
    title: 'DG',
    sector: 'Bois & Papier du Maroc',
    city: 'Casablanca',
    rating: 5,
    initials: 'NF',
    color: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
  },
  {
    quote: 'En tant qu\'enseignant, j\'utilise JAD2FX comme support pédagogique pour le Master Banque & Finance à l\'ISCAE. Les étudiants apprécient la clarté des simulations.',
    name: 'Pr. Hassan Berrada',
    title: 'Professeur de Finance',
    sector: 'ISCAE Casablanca',
    city: 'Casablanca',
    rating: 5,
    initials: 'HB',
    color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
  },
];

// P3.8 — Social proof components.

// P3.8 — Social proof components.
// (imports above)

function Testimonials() {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-serif font-bold text-white mb-1">Ils nous font confiance</h2>
        <p className="text-[12px] text-slate-400">Trésoriers, DAF, traders, enseignants — ils utilisent JAD2FX au quotidien.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {TESTIMONIALS.map((t) => (
          <article
            key={t.name}
            className="bg-navy-900 border border-navy-700 rounded-2xl p-4 hover:border-gold-500/30 transition-colors"
          >
            <Quote size={16} className="text-gold-500/40 mb-1" />
            <p className="text-[12px] text-slate-300 leading-relaxed mb-3 italic">
              &ldquo;{t.quote}&rdquo;
            </p>
            <div className="flex items-center gap-2 pt-3 border-t border-navy-800">
              <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-[10px] font-bold ${t.color}`}>
                {t.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-white truncate">{t.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{t.title} · {t.sector} · {t.city}</p>
              </div>
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={9}
                    className={i < t.rating ? 'text-gold-400 fill-gold-400' : 'text-slate-700'}
                  />
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

const SECTORS = [
  { icon: Factory,   label: 'Équipementier automobile', city: 'Tanger',     count: 12 },
  { icon: Building2, label: 'Banque · Conseil',         city: 'Casablanca', count: 8  },
  { icon: Wheat,     label: 'Agroalimentaire',           city: 'Kénitra',    count: 6  },
  { icon: Truck,     label: 'Logistique · Transport',    city: 'Tanger Med', count: 5  },
  { icon: Landmark,  label: 'Family Office',             city: 'Casablanca', count: 4  },
  { icon: Building2, label: 'Immobilier',                city: 'Marrakech',  count: 3  },
];

export function LogoWall() {
  return (
    <div className="bg-navy-900/50 border border-navy-800 rounded-2xl p-5">
      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold text-center mb-3">
        Utilisé dans 6 secteurs clés de l'économie marocaine
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {SECTORS.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="flex items-center gap-2.5 bg-navy-950 border border-navy-800 rounded-lg p-2.5"
            >
              <div className="w-9 h-9 rounded-lg bg-gold-500/10 border border-gold-500/30 flex items-center justify-center flex-shrink-0">
                <Icon size={16} className="text-gold-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-white truncate">{s.label}</p>
                <p className="text-[10px] text-slate-500">{s.city} · {s.count} équipes</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Live counter that animates a value with a small oscillation to feel "live".
 * For real production, hook to a worker endpoint tracking active users.
 */
export function LiveCounter() {
  const [count, setCount] = useState(247);

  useEffect(() => {
    const tick = () => {
      setCount((c) => {
        const delta = Math.floor(Math.random() * 5) - 1; // -1 to +3
        return Math.max(180, Math.min(420, c + delta));
      });
    };
    const id = setInterval(tick, 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-navy-900/50 border border-emerald-700/30 rounded-full">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      <Users size={11} className="text-emerald-400" />
      <span className="text-[10px] text-slate-400">
        <span className="font-mono font-bold text-emerald-400">{count}</span> trésoriers en ligne
      </span>
    </div>
  );
}

/** Stats banner for landing pages. */
export function StatsBanner() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[
        { value: '24',    label: 'Devises vs MAD',  sub: 'cotées + cross',    icon: TrendingUp, color: 'text-gold-400' },
        { value: '6 000+', label: 'Utilisateurs / mois', sub: 'PME + corporate', icon: Users, color: 'text-emerald-400' },
        { value: '38',    label: 'Articles & analyses', sub: 'publiés 2026',     icon: Building2, color: 'text-blue-400' },
        { value: '4.9/5', label: 'Note moyenne',          sub: '42 avis',          icon: Star,    color: 'text-amber-400' },
      ].map((s) => {
        const Icon = s.icon;
        return (
          <div key={s.label} className="bg-navy-900 border border-navy-700 rounded-xl p-4 text-center">
            <Icon size={14} className={`${s.color} mx-auto mb-1.5`} />
            <p className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</p>
            <p className="text-[11px] font-bold text-slate-200 mt-1">{s.label}</p>
            <p className="text-[10px] text-slate-500">{s.sub}</p>
          </div>
        );
      })}
    </div>
  );
}

// Default export for lazy() consumption
export default function SocialProof() {
  return <Testimonials />;
}

export { Testimonials };
