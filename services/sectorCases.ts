/**
 * P3.9 — Sector case studies data.
 * 4 sectors with realistic case studies (anon. data).
 */

export interface SectorCase {
  slug: string;
  sector: string;
  company: string;            // anonymized
  city: string;
  revenueEUR: string;         // annual revenue
  exposure: string;           // exposure profile
  challenge: string;
  solution: string;
  results: string[];
  testimonial?: string;
  testimonialAuthor?: string;
  icon: 'car' | 'shirt' | 'wood' | 'wheat' | 'phosphate';
  color: string;
}

export const SECTOR_CASES: SectorCase[] = [
  {
    slug: 'automobile-tanger',
    sector: 'Équipementier automobile',
    company: 'Équipementier Automobile Tier-1 (Stellantis supplier)',
    city: 'Tanger',
    revenueEUR: '€180M/an (90% export)',
    exposure: '8M EUR/an d\'achats composants · 100% en EUR · horizon 60-120j',
    challenge: 'Couverture à 100% impossible car la banque ne donnait pas assez de lignes. Risque résiduel non géré. Marge compressée en cas d\'appréciation EUR.',
    solution: 'Stratégie layered 50% forward 3M / 30% forward 6M / 20% spot. Cession mensuelle via CDE. Reporting Circ. 01/2024 mis en place. Audit trimestriel.',
    results: [
      'Réduction de 38% du coût de couverture vs 100% forward 3M',
      'Volatilité mensuelle du coût import divisée par 2.4',
      'Conformité OC 01/2024 documentée et auditée',
    ],
    testimonial: 'JAD2FX nous a permis de passer d\'une couverture "au feeling" à une politique documentée. L\'économie annuelle est estimée à 1.8M MAD.',
    testimonialAuthor: 'CFO, secteur automobile Tanger',
    icon: 'car',
    color: 'text-blue-400',
  },
  {
    slug: 'textile-export-fes',
    sector: 'Textile & Habillement',
    company: 'Confection & Export (marques européennes)',
    city: 'Fès',
    revenueEUR: '€35M/an (95% export EUR)',
    exposure: 'Factures clients EUR encaissées à 30-90j · couverture asymétrique (vendeurs EUR, acheteurs MAD)',
    challenge: 'PME familiale sans trésorier dédié. Devait choisir entre accepter la volatilité EUR/MAD ou payer des marges de couverture élevées à la banque.',
    solution: 'Mise en place d\'un diagnostic FX PME JAD2FX (score initial: 72/100 HIGH). Politique de couverture 60% forward 3M rollé. Formation équipe finance (8h).',
    results: [
      'Marge opérationnelle stabilisée à ±1.2% au lieu de ±3.5%',
      'Score diagnostic passé de 72 à 28 (LOW) en 6 mois',
      'Économie nette: 280K MAD/an sur 8M EUR de flux',
    ],
    testimonial: 'Le diagnostic JAD2FX nous a ouvert les yeux. On a découvert qu\'on perdait 280K MAD/an par manque de structure. Aujourd\'hui la couverture fait partie de notre CODIR mensuel.',
    testimonialAuthor: 'DAF, textile Fès',
    icon: 'shirt',
    color: 'text-purple-400',
  },
  {
    slug: 'bois-casablanca',
    sector: 'Bois & Papier',
    company: 'Importateur bois scandinave (NOK, SEK, EUR)',
    city: 'Casablanca',
    revenueEUR: '€22M/an import',
    exposure: 'Achats NOK + SEK + EUR · 4-6M EUR/an non couvert · risque double (NOK/EUR + EUR/MAD)',
    challenge: 'Double exposition: les couronnes scandinaves contre EUR, puis EUR contre MAD. Cible de marge stable difficile. Forward 12M pas accessible (banque refuse ligne).',
    solution: 'Programme de couverture 50% à 3M sur EUR/MAD (pas sur les couronnes), accepté par la banque. Monitoring des NOK/SEK avec scénarios +/-5% trimestriels.',
    results: [
      'Volatilité du coût d\'achat réduite de 45%',
      'Marge préservée malgré choc EUR +3.5% en 2025',
      'Mise en place d\'un scénario stress test trimestriel JAD2FX',
    ],
    testimonial: 'JAD2FX nous a aidés à comprendre la double exposition NOK/EUR/MAD. On n\'avait jamais modélisé ça avant. Le stress test trimestriel est devenu un standard.',
    testimonialAuthor: 'DG, importateur bois',
    icon: 'wood',
    color: 'text-amber-400',
  },
  {
    slug: 'phosphates-khouribga',
    sector: 'Phosphates & Mining',
    company: 'Opérateur mining (export phosphate)',
    city: 'Khouribga',
    revenueEUR: '€120M/an (98% export USD)',
    exposure: 'Recettes USD encaissées à 60-180j · risque de change USD/MAD · conversion vers MAD pour coûts opérationnels',
    challenge: 'Volume important (12M USD/an), forward 12M pas accessible. Volatilité USD/MAD affecte directement la marge consolidée en MAD.',
    solution: 'Programme structuré: 40% forward rollé 3M + 30% CDE (conservation USD) + 30% spot. Hedge accounting documenté pour conformité IFRS.',
    results: [
      'Écart-type de la marge MAD réduit de 60%',
      'Reporting IFRS 9 (instruments de couverture) propre',
      'Conformité Circ. 01/2024 validée par audit externe',
    ],
    testimonial: 'JAD2FX est notre outil de référence pour le CODIR mensuel. La visualisation des expositions et le stress test sont devenus indispensables.',
    testimonialAuthor: 'Trésorier Groupe, mining',
    icon: 'phosphate',
    color: 'text-emerald-400',
  },
];
