import React, { useState } from 'react';
import { TrendingUp, Shield, ArrowRight, AlertTriangle } from 'lucide-react';
import CurrencyFlag from './CurrencyFlag';
import { useAdmin } from '../context/AdminContext';
import { ViewState } from '../types';

export interface SectorConfig {
  id: string;
  badge: string;
  badgeStyle: string;
  title: string;
  subtitle: string;
  description: string;
  primaryCurrency: string;   // e.g. 'EUR'
  primaryCountry: string;    // e.g. 'eu'
    secondaryCurrencies: Array<{ code: string; cc: string; role: string; label?: string }>;
  exposureType: string;
  keyRisk: string;
  keyRiskDetail: string;
  ocRelevance: string;
  ocArticle: string;
  watchpoints: string[];
  exposure?: string;
  challenges?: string[];
  solutions?: string[];
}

export const SECTORS: SectorConfig[] = [
  {
    id: 'auto',
    badge: 'Secteur Automobile',
    badgeStyle: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    title: 'Équipementiers Automobiles â€” Exposition EUR / JPY / USD',
    subtitle: 'Renault · BYD · Stellantis · Fournisseurs Tanger-Meknès',
    description: 'L\'industrie automobile marocaine génère une exposition bi-devises structurelle : composants européens (EUR), technologie asiatique (JPY/CNY), et revenus d\'export vers l\'UE (EUR). La double exposition EUR/JPY est le risque non compensé le plus fréquent chez les équipementiers de rang 2 et 3.',
    primaryCurrency: 'EUR',
    primaryCountry: 'eu',
    secondaryCurrencies: [
      { code: 'JPY', cc: 'jp', role: 'Technologie batteries & semi-conducteurs' },
      { code: 'USD', cc: 'us', role: 'Matières premières acier & plastiques' },
      { code: 'CNY', cc: 'cn', role: 'Composants électroniques' },
    ],
    exposureType: 'Import (JPY/USD) â†’ Production MAD â†’ Export EUR',
    keyRisk: 'Volatilité EUR/JPY non couverte',
    keyRiskDetail: 'Une appréciation du JPY de 100 bps renchérit les inputs technologiques de ~0.8% sur la facture totale. Sans couverture EUR/JPY, la marge brute d\'un équipementier de rang 2 (marges 8â€“12%) peut se contracter de 15 Ã  25% sur un choc de change de 500 bps.',
    ocRelevance: 'Circ. OC n°01/2024, Art. 12',
    ocArticle: 'Forwards et options vanille autorisés pour import récurrent. Maturité max 12 mois. Documentation : bon de commande ou facture pro forma suffisant pour les PME.',
    watchpoints: [
      'EUR/JPY : indicateur leading pour les coûts de composants electroniques',
      'USD/MAD : matières premières acier cotées en USD sur LME',
      'CNY/MAD : trend yuan (appréciation structurelle probable sur 3-5 ans)',
      'Calendrier production : Q1 achats composants, Q3 export finaux vers UE',
    ],
  },
  {
    id: 'textile',
    badge: 'Secteur Textile',
    badgeStyle: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    title: 'Textile & Habillement â€” Couverture naturelle incomplète',
    subtitle: 'Import coton USD · Export confection EUR · Gap net MAD',
    description: 'L\'industrie textile marocaine (65% des exports vers l\'UE) est structurellement bi-monétaire. La couverture naturelle partielle â€” coûts EUR équilibrant recettes EUR â€” masque une exposition USD nette significative sur les importations de coton, fibres et colorants.',
    primaryCurrency: 'USD',
    primaryCountry: 'us',
    secondaryCurrencies: [
      { code: 'EUR', cc: 'eu', role: 'Recettes export UE (65% CA export)' },
      { code: 'CNY', cc: 'cn', role: 'Fils synthétiques & matières premières' },
    ],
    exposureType: 'Import USD (coton) + Export EUR (confection) â†’ Gap net USD',
    keyRisk: 'Exposition USD/MAD nette non compensée',
    keyRiskDetail: 'Un importateur de coton pur (sans revenus USD) exposé Ã  1M USD annuel supporte un risque de change de ~60 000 MAD par 100 bps de mouvement USD/MAD. La saisonnalité Q1 (achats) vs Q3 (exports) crée un décalage temporel d\'exposition de 120 Ã  150 jours.',
    ocRelevance: 'Circ. OC n°01/2024 + Circ. n°2/2012',
    ocArticle: 'Couverture import coton : forward achat USD autorisé jusqu\'Ã  100% du carnet de commandes documenté. Domiciliation obligatoire pour importations >100 000 MAD.',
    watchpoints: [
      'USD/MAD : exposition directe sur achats coton (marché ICE, coton = 100% USD)',
      'EUR/USD : détermine la compétitivité prix des exports vers l\'UE',
      'Saisonnalité : pic d\'achats Q1, pic exports Q2-Q3',
      'CNY/MAD : approvisionnements alternatifs Asie en hausse',
    ],
  },
  {
    id: 'nordique',
    badge: 'Devises Nordiques',
    badgeStyle: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    title: 'Importateurs Bois & Matériaux â€” Couronnes NOK / SEK / DKK',
    subtitle: 'Bois construction · Papier & emballage · Équipements industriels',
    description: 'Les couronnes norvégienne (NOK), suédoise (SEK) et danoise (DKK) représentent une exposition de change structurellement sous-couverte pour les importateurs marocains. La NOK est doublement exposée : variation de change ET prix du Brent (économie pétrolière norvégienne), créant une double pression sur la facture totale.',
    primaryCurrency: 'NOK',
    primaryCountry: 'no',
    secondaryCurrencies: [
      { code: 'SEK', cc: 'se', role: 'Équipements industriels suédois (Volvo, SKF)' },
      { code: 'DKK', cc: 'dk', role: 'Pharmaceutique & agroalimentaire danois' },
    ],
    exposureType: 'Import NOK/SEK/DKK â€” non cotées directement BKAM â†’ cross via EUR',
    keyRisk: 'Double exposition NOK : change + Brent',
    keyRiskDetail: 'Une hausse simultanée du Brent (+10%) et de NOK/MAD (+200 bps) â€” corrélation positive historique â€” peut augmenter la facture d\'importation de bois de 3 Ã  4% sur un trimestre. Les DKK ont un quasi-peg EUR (±2,25%) â€” exposition plus stable mais toujours non nulle.',
    ocRelevance: 'Circ. OC n°01/2024 + Convention UMA (TND/DZD/LYD)',
    ocArticle: 'NOK/SEK/DKK : forwards EUR/NOK disponibles via banques agréées marocaines. Cross via EUR : banque calcule le taux implicite NOK/MAD = EUR/MAD Ã· EUR/NOK.',
    watchpoints: [
      'NOK/MAD : surveiller corrélation Brent (double exposition énergie + change)',
      'EUR/NOK : principal déterminant du cross NOK/MAD',
      'SEK : cycle Riksbank + exposition industrielle européenne',
      'DKK/EUR : spread quasi-fixe ±2.25% â€” risque résiduel faible',
    ],
  },
  {
    id: 'agri',
    badge: 'Agroalimentaire & Agriculture',
    badgeStyle: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    title: 'Agroalimentaire â€” Blé, Maïs, Sucre : Exposition USD Structurelle',
    subtitle: 'Importateurs céréales · Minoteries · COSUMAR · Éleveurs',
    description: 'Le secteur agroalimentaire marocain est massivement exposé au USD via les importations de blé tendre, maïs, soja et sucre â€” tous cotés sur les marchés ICE/CBOT en dollars. Cette exposition est amplifiée par la subvention partielle de l\'État, qui crée une asymétrie : les entreprises exposées supportent la hausse USD mais bénéficient partiellement des baisses via les mécanismes de compensation.',
    primaryCurrency: 'USD',
    primaryCountry: 'us',
    secondaryCurrencies: [
      { code: 'EUR', cc: 'eu', role: 'Intrants agricoles européens & emballages' },
      { code: 'BRL', cc: 'br', role: 'Soja brésilien (concurrent USD)' },
    ],
    exposureType: 'Import USD matières premières agricoles (ICE/CBOT)',
    keyRisk: 'Corrélation USD/MAD Ã— prix commodités',
    keyRiskDetail: 'Un choc USD/MAD (+300 bps) coïncidant avec un choc blé (+15%) sur le marché Chicago â€” scénarios corrélés lors de crises (2022) â€” peut augmenter le coût de revient d\'une minoterie de 8 Ã  12% en une semaine. La couverture réglementaire OC permet maintenant de couvrir simultanément le change ET les prix matières premières (Circ. OC 01/2024, Art. 14).',
    ocRelevance: 'Circ. OC n°01/2024, Art. 12 & 14',
    ocArticle: 'Art. 14 autorise la couverture contre la fluctuation des prix de produits de base via marchés organisés internationaux. Les banques ouvrent des sous-comptes dédiés pour garantir traçabilité (dépôt de garantie, appels de marge).',
    watchpoints: [
      'USD/MAD : exposition directe sur toutes les matières premières agricoles',
      'Prix blé Chicago (ZW=F) : corrélation avec tensions géopolitiques (Ukraine)',
      'Prix sucre ICE (SB=F) : COSUMAR et transformateurs directement exposés',
      'BRL/MAD : alternative brésilienne au soja américain (prix et change)',
    ],
  },
  {
    id: 'phosphate',
    badge: 'Phosphates & Mining',
    badgeStyle: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
    title: 'Phosphates & Mining â€” Exposition USD Massive, Couverture >120M EUR',
    subtitle: 'OCP & sous-traitants · Khouribga · Youssoufia · Jorf Lasfar',
    description: 'Le secteur phosphates marocain (OCP et sous-traitants) exporte massivement en USD (98% du CA). La conversion vers MAD pour les coûts opérationnels (énergie, salaires, fournitures) crée une exposition USD/MAD structurelle massive. La stratégie de couverture combine forwards, conservation en CDE/CPEC et options pour gérer des maturités longues non couvertes par les banques.',
    primaryCurrency: 'USD',
    primaryCountry: 'us',
    secondaryCurrencies: [
      { code: 'EUR', cc: 'eu', role: 'Equipement', label: 'EUR · Équipement industriel (Allemagne, France)' },
      { code: 'CNY', cc: 'cn', role: 'Composants', label: 'CNY · Composants chimiques' },
    ],
    exposureType: 'USD (98% CA) · 1.5-2 Md USD/an (OCP) · 50-200M USD/an (sous-traitants)',
    keyRisk: 'Couverture >12M refusée par les banques · Couts en MAD, CA en USD',
    keyRiskDetail: 'Forwards 12M refusés par les banques (ligne insuffisante). Couverture rollée 3M mais exposition résiduelle structurelle. Volatilité USD/MAD peut faire varier le résultat consolidé de 5-8% sur un trimestre.',
    ocRelevance: 'Circ. 3/2019 · CDE/CPEC · IFRS 9',
    ocArticle: 'CDE/CPEC pour conservation 70% recettes export (Circ. 3/2019). Forwards 12-24M non accessibles directement â€” utiliser CCS ou options exotiques auprès de la BMCE. Hedge accounting IFRS 9 requis pour couverture >12 mois.',
    watchpoints: [
      'USD/MAD : exposition directe et massive (volume Ã— variation)',
      'Prix DAP/TSP (engrais) sur les marchés mondiaux : corrélation prix Ã— change',
      'Spread OAT 10Y Maroc vs UST 10Y : indicateur souverain du risque de change',
      'Demande indienne et brésilienne (DAP) : impact sur le pricing power',
    ],
  },
];

interface Props {
  sectorId: string;
  navTo: (v: ViewState) => void;
  onContact: () => void;
}

export default function SectorLanding({ sectorId, navTo, onContact }: Props) {
  const { livePrices } = useAdmin();
  const [showAllRates, setShowAllRates] = useState(false);

  const sector = SECTORS.find(s => s.id === sectorId);
  if (!sector) return null;

  const primaryRate = livePrices.find(p => p.currency === sector.primaryCurrency);
  const secondaryRates = sector.secondaryCurrencies
    .map(c => ({ ...c, rate: livePrices.find(p => p.currency === c.code) }))
    .filter(c => c.rate);

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* Header */}
      <div className="bg-navy-900 border border-navy-700 rounded-2xl overflow-hidden">
        <div className="h-0.5 bg-gradient-to-r from-navy-700 via-gold-500 to-navy-700" />
        <div className="p-6">
          <span className={`text-[9px] font-bold border px-2 py-0.5 rounded uppercase tracking-[0.15em] ${sector.badgeStyle}`}>
            {sector.badge}
          </span>
          <h1 className="text-xl font-serif font-bold text-white mt-2 mb-1">{sector.title}</h1>
          <p className="text-[11px] text-slate-500 mb-3">{sector.subtitle}</p>
          <p className="text-sm text-slate-400 leading-relaxed">{sector.description}</p>
        </div>
      </div>

      {/* Live rate strip */}
      {(primaryRate || secondaryRates.length > 0) && (
        <div className="bg-navy-900 border border-navy-700 rounded-xl p-4">
          <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-3 font-bold">
            Taux indicatifs temps réel â€” devises du secteur
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {primaryRate && (
              <div className="bg-navy-800 border border-navy-700 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <CurrencyFlag countryCode={sector.primaryCountry} size="xs" />
                  <span className="text-[10px] font-bold text-white">{sector.primaryCurrency}/MAD</span>
                  <span className="text-[9px] text-gold-500 ml-auto font-bold">PRINCIPAL</span>
                </div>
                <p className="text-lg font-mono font-bold text-white">{primaryRate.mid.toFixed(4)}</p>
                <p className={`text-[9px] font-mono ${primaryRate.changePercent > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {primaryRate.changePercent >= 0 ? '+' : ''}{primaryRate.changePercent.toFixed(2)}%
                </p>
              </div>
            )}
            {secondaryRates.slice(0, 3).map(c => c.rate && (
              <div key={c.code} className="bg-navy-800/60 border border-navy-800 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <CurrencyFlag countryCode={c.cc} size="xs" />
                  <span className="text-[10px] font-bold text-slate-300">{c.code}/MAD</span>
                </div>
                <p className="text-sm font-mono font-bold text-white">{c.rate.mid.toFixed(4)}</p>
                <p className="text-[9px] text-slate-600 leading-tight mt-0.5">{c.role}</p>
              </div>
            ))}
          </div>
          <p className="text-[9px] text-slate-700 mt-2">Taux indicatifs JAD2FX · Non exécutables · Source ECB/BKAM</p>
        </div>
      )}

      {/* Exposure type + Key risk */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-navy-900 border border-navy-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={13} className="text-gold-500" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Type d'exposition</p>
          </div>
          <p className="text-[12px] text-white font-semibold leading-snug">{sector.exposureType}</p>
        </div>
        <div className="bg-red-500/5 border border-red-700/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={13} className="text-red-400" />
            <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Risque principal</p>
          </div>
          <p className="text-[12px] text-white font-semibold leading-snug">{sector.keyRisk}</p>
        </div>
      </div>

      {/* Risk detail */}
      <div className="bg-navy-900 border border-navy-700 rounded-xl p-5">
        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 font-bold">Mécanique de risque</p>
        <p className="text-[12px] text-slate-300 leading-relaxed">{sector.keyRiskDetail}</p>
      </div>

      {/* OC relevance */}
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Shield size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">
              Cadre Réglementaire â€” {sector.ocRelevance}
            </p>
            <p className="text-[12px] text-amber-300/80 leading-relaxed">{sector.ocArticle}</p>
          </div>
        </div>
      </div>

      {/* Watch-points */}
      <div className="bg-navy-900 border border-navy-700 rounded-xl p-5">
        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3 font-bold">
          Points de Vigilance â€” Trésorier Sectoriel
        </p>
        <div className="space-y-2">
          {sector.watchpoints.map((w, i) => (
            <div key={i} className="flex items-start gap-2.5 text-[12px] text-slate-300">
              <span className="text-gold-500 flex-shrink-0 mt-0.5 text-xs">▸</span>
              {w}
            </div>
          ))}
        </div>
      </div>

      {/* CTAs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => navTo('TOOL_OC_ASSESS')}
          className="flex items-center justify-center gap-2 bg-gold-500 text-navy-950 font-bold text-sm px-4 py-3 rounded-xl hover:bg-gold-400 transition-colors"
        >
          <Shield size={14} /> Diagnostic OC
        </button>
        <button
          onClick={() => navTo('FORWARDS')}
          className="flex items-center justify-center gap-2 border border-navy-600 text-slate-300 font-semibold text-sm px-4 py-3 rounded-xl hover:border-navy-500 hover:text-white hover:bg-navy-800/50 transition-colors"
        >
          <TrendingUp size={14} /> Simuler un Forward
        </button>
        <button
          onClick={onContact}
          className="flex items-center justify-center gap-2 border border-gold-600/40 text-gold-400 font-semibold text-sm px-4 py-3 rounded-xl hover:border-gold-500 hover:bg-gold-500/5 transition-colors"
        >
          <ArrowRight size={14} /> Audit sectoriel
        </button>
      </div>

      <p className="text-[9px] text-slate-700 text-center leading-relaxed">
        Analyse sectorielle indicative Ã  vocation pédagogique â€” JAD2 Advisory (non établissement financier agréé BAM, Loi n° 43-12).
        Les niveaux de risque et estimations sont basés sur des données historiques indicatives.
      </p>
    </div>
  );
}
