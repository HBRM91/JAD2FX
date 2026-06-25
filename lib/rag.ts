interface RagDoc {
  id: string;
  title: string;
  keywords: string[];
  content: string;
}

const DOCS: RagDoc[] = [
  {
    id: 'igoc-2024',
    title: "Instruction Générale des Opérations de Change (IGOC) — 2024",
    keywords: ['igoc', 'instruction générale', 'opérations de change', 'réglementation', 'devises', 'change', 'général', 'dirham', 'mad', 'intermédiaire agréé'],
    content: `L'IGOC fixe les règles relatives aux opérations de change et transferts entre le Maroc et l'étranger.

Principes:
- Le dirham (MAD) est la monnaie nationale légale. Toute transaction au Maroc doit être libellée en MAD.
- Les opérations de change doivent être effectuées par des intermédiaires agréés (banques agréées OC).
- Compte courant libéralisé: paiements import/export de biens et services sont libres.
- Compte capital réglementé: transferts de capitaux soumis à conditions.
- Infractions passibles de sanctions pénales (Article 14, Dahir n° 1-73-318).
Intermédiaires agréés: Attijariwafa, Banque Populaire, BMCE, CIH, Société Générale, etc.`,
  },
  {
    id: 'importations',
    title: "Circulaire n° 2/2012 — Règlement des Importations",
    keywords: ['importation', 'paiement import', 'domiciliation', 'délai paiement', 'import', 'avance', 'préfinancement', '120 jours', 'dédouanement'],
    content: `Circulaire 2/2012 — Règlement des importations:

Domiciliation obligatoire: toute importation > 50 000 MAD doit être domiciliée avant dédouanement.

Délais de paiement: règlement dans les 120 jours suivant le dédouanement.

Paiements anticipés:
- Jusqu'à 50% FOB pour biens d'équipement (délai livraison > 6 mois).
- Importations courantes: paiement à réception des docs ou dans les 120 jours.

Documents requis: facture commerciale, titre d'importation (TI), document de transport.`,
  },
  {
    id: 'exportations',
    title: "Circulaire n° 3/2019 — Rapatriement des Recettes d'Exportation",
    keywords: ['exportation', 'rapatriement', 'recettes export', 'délai rapatriement', 'cession devises', 'export', '150 jours', '30%', 'cpec', 'cde'],
    content: `Circulaire 3/2019 — Rapatriement des recettes d'exportation:

Obligation de rapatriement: toutes les recettes en devises doivent être rapatriées.

Délais:
- Biens ordinaires: 150 jours après expédition.
- Hydrocarbures/énergie: 90 jours.
- Services/droits: 60 jours après encaissement à l'étranger.

Cession obligatoire: 30% des recettes doivent être cédées en MAD dans les 30 jours.
Les 70% restants peuvent être gardés en Compte en Devises (CDE) ou CPEC.

CPEC (Compte Professionnel en Devises): ouvert aux exportateurs ≥ 5 millions MAD de recettes l'année précédente. Conserve jusqu'à 70% des recettes.

Sanctions: pénalités de 5% par mois de retard.`,
  },
  {
    id: 'voyages',
    title: "Circulaire n° 2/2019 — Allocations de Voyages",
    keywords: ['allocation voyages', 'voyage', 'touristique', 'affaires', 'hajj', 'pèlerinage', 'soins', 'médicaux', 'études', 'étudiant', '45000', 'per diem'],
    content: `Circulaire 2/2019 — Allocations de voyages:

1. Voyages touristiques privés:
   - 45 000 MAD/an par personne (sans limite de voyages).
   - Dépassement sur justificatifs (hôtels, billets, assurances).
   - Mineurs: 10 000 MAD par voyage.

2. Voyages d'affaires:
   - Basés sur besoins réels justifiés.
   - Per diem indicatif: jusqu'à 300 EUR/jour (OCDE), 200 EUR/jour (autres).
   - Documents: invitation + ordre de mission.

3. Pèlerinage:
   - Hajj: ~25 000 MAD (fixé annuellement par le ministère des Affaires Islamiques).
   - Omra: jusqu'à 15 000 MAD par voyage.

4. Soins médicaux à l'étranger:
   - 200 000 MAD/an de base; dépassement sur prescription médicale spécialisée.

5. Études:
   - 100 000 MAD/an pour étudiants inscrits à l'étranger; majoration sur justificatifs.`,
  },
  {
    id: 'couverture-2024',
    title: "Circulaire n° 01/2024 — Couverture du Risque de Change",
    keywords: ['couverture risque de change', 'hedging', 'produits dérivés', 'change à terme', 'option de change', 'pme', 'couverture', 'forward', 'option', 'swap', 'tunnel'],
    content: `Circulaire 01/2024 — Couverture du risque de change:

Instruments autorisés:
- Contrats à terme (forward) achat/vente de devises.
- Options de change plain vanilla (calls et puts).
- Swaps de devises (flux récurrents).
- Tunnel (risk reversal) dans les limites réglementaires.

Plafonds:
- Importateurs: 100% de la valeur des commandes confirmées ou flux prévisionnels documentés.
- Exportateurs: 100% du carnet de commandes export documenté.
- PME: règles simplifiées — bon de commande ou facture pro forma suffisent.

Maturité max: 12 mois (renouvelable une fois sur justificatifs).

Nouveauté 2024: extension aux PME sans franchise minimum; CA export/import < 50 M MAD éligible.

Banques habilitées: toutes les banques agréées intermédiaires en matière de change.`,
  },
  {
    id: 'ide',
    title: "Instruction n° 03/2021 — Investissements Étrangers au Maroc (IDE)",
    keywords: ['investissement étranger', 'ide', 'rapatriement bénéfices', 'dividendes', 'capital étranger', 'foreign investment', 'non-résident'],
    content: `Instruction 03/2021 — Investissements étrangers (IDE):

Liberté d'investissement dans la plupart des secteurs (hors liste négative: armement, sécurité nationale, activités réglementées).

Importation du capital: apport doit transiter par canal bancaire officiel; visa de change = preuve d'investissement régulier.

Rapatriement:
- Dividendes/bénéfices nets d'impôts: librement rapatriables.
- Plus-values: rapatriables après acquittement de l'impôt applicable.
- Redevances/honoraires intra-groupe: selon article 13 IGOC.
- Capital initial régulier: librement rapatriable à la cession/liquidation.

Déclarations: IDE > 10 M MAD → déclaration à l'OC dans les 30 jours.`,
  },
  {
    id: 'ime',
    title: "Circulaire n° 4/2022 — Investissements Marocains à l'Étranger (IME)",
    keywords: ['investissement marocain étranger', 'ime', 'invest abroad', 'résident marocain étranger', 'dotation investissement', 'filiale étranger'],
    content: `Circulaire 4/2022 — Investissements Marocains à l'Étranger (IME):

Personnes morales:
- Sociétés cotées BVC: jusqu'à 200 M MAD/an (dotation automatique via banque).
- Autres entreprises: jusqu'à 100 M MAD/an (autorisation préalable OC requise).

Personnes physiques professionnels:
- Jusqu'à 5 M MAD/an; autorisation préalable OC pour montants supérieurs.

Obligations:
- Apport transite par banque agréée au Maroc.
- Rapport annuel (états financiers filiale étrangère) à l'OC.
- Dividendes reçus rapatriés dans les 6 mois.
- Cession → déclaration OC dans les 30 jours.`,
  },
  {
    id: 'comptes-devises',
    title: "Instruction n° 01/2020 — Comptes en Devises des Résidents (CDE/CPEC)",
    keywords: ['compte devises', 'cde', 'cpec', 'compte professionnel devises', 'résident', 'compte en devises'],
    content: `CDE (Compte en Devises): ouvert aux résidents marocains disposant de recettes en devises légitimes.
- Alimenté par: recettes d'exportation, revenus MRE, remboursements, revenus de placements.
- Utilisé pour: paiements courants en devises, achats de devises pour voyages (dans les limites OC).
- Pas de plafond strict mais solde justifiable.

CPEC (Compte Professionnel en Devises): pour exportateurs ≥ 5 M MAD de recettes l'année précédente.
- Permet de conserver 70% des recettes d'exportation.
- Utilisé pour régler directement des fournisseurs étrangers, payer des charges libellées en devises.
- Rémunéré aux taux du marché des dépôts en devises.`,
  },
  {
    id: 'mre',
    title: "Transferts des Marocains Résidant à l'Étranger (MRE)",
    keywords: ['mre', 'marocain résidant étranger', 'transfert mre', 'immigré', 'envoi argent', 'compte mre', 'bmt'],
    content: `Transferts MRE:

Les MRE peuvent transférer librement leurs économies constituées à l'étranger vers le Maroc, sans limite de montant ni de fréquence.

Comptes MRE:
- Compte en Devises (CDE): alimenté par les fonds reçus de l'étranger; conversion en MAD à la demande.
- Compte Dirham Convertible (CDC): crédité en MAD après conversion; reconvertible librement vers l'étranger.

Investissements MRE au Maroc: bénéficient du même régime que les IDE. Le capital investi est rapatriable librement ainsi que les revenus générés (loyers, dividendes, plus-values).

Frais: aucune commission OC sur les transferts entrants. Les banques et services de transfert appliquent leurs propres frais. Comparer Western Union, MoneyGram, Xpress Money et canaux bancaires.`,
  },
  {
    id: 'commissions-oc',
    title: "Commissions et Frais — Opérations de Change",
    keywords: ['commission', 'frais', 'spread', 'marge', 'billet', 'virement', 'taux achat', 'taux vente', 'banque', 'bureau de change'],
    content: `Commissions réglementées (Office des Changes):

Virements (transferts bancaires):
- Spread maximum: 6‰ (0.6%) de chaque côté du cours BKAM → spread total max ≈ 1.2%.
- En pratique: les banques appliquent entre 0.5% et 1.5% spread total.

Billets de banque (espèces):
- Spread plus élevé: de 1.5% à 3% de chaque côté selon les banques.
- Cours BKAM billets differ des cours virements (fixing distinct publié chaque matin).

Commissions fixes: certaines banques appliquent une commission fixe minimale par opération (ex: 20-50 MAD).

Conseil: pour les transferts entrants (MRE), préférer les virements bancaires; les services de transfert en ligne (Wise, Remitly) peuvent offrir de meilleurs spreads.`,
  },
];

export const DOC_COUNT = DOCS.length;

export function retrieveContext(query: string, maxDocs = 3): string {
  const q = query.toLowerCase();

  const scored = DOCS
    .map(doc => ({
      doc,
      score: doc.keywords.reduce((acc, kw) => acc + (q.includes(kw) ? 1 : 0), 0),
    }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxDocs);

  if (scored.length === 0) {
    return DOCS[0].content;
  }

  return scored
    .map(x => `[${x.doc.title}]\n${x.doc.content}`)
    .join('\n\n---\n\n');
}
