import { RegDocument } from '../types';

// ─── Embedded Office des Changes Knowledge Base ───────────────────────────────
// Sourced from public OC publications: circulaires, instructions, communiqués.
// Updated when the daily scraper detects new documents.
const REGULATORY_DOCS: RegDocument[] = [
  {
    id: 'igoc-2024',
    title: "Instruction Générale des Opérations de Change (IGOC) — Edition 2024",
    type: 'INSTRUCTION',
    date: '2024-01-01',
    summary: "Cadre réglementaire général régissant toutes les opérations de change au Maroc.",
    keywords: ['igoc', 'instruction générale', 'opérations de change', 'réglementation', 'devises', 'change', 'général'],
    content: `
L'Instruction Générale des Opérations de Change fixe les règles relatives aux opérations
de change et aux transferts de fonds entre le Maroc et l'étranger.

Principes généraux:
- Le dirham (MAD) est la monnaie nationale légale. Toute transaction commerciale au Maroc doit être libellée en MAD.
- Les opérations de change doivent être effectuées par l'intermédiaire d'intermédiaires agréés (banques agréées par l'Office des Changes).
- Le compte courant est libéralisé: les paiements liés aux importations/exportations de biens et services sont libres.
- Le compte capital reste réglementé: les transferts de capitaux à l'étranger sont soumis à des conditions spécifiques.
- Les infractions à la réglementation des changes sont passibles de sanctions pénales et administratives (Article 14 du Dahir portant loi n° 1-73-318).

Intermédiaires agréés: Attijariwafa Bank, Banque Populaire, BMCE Bank, CIH, Société Générale, AWB, etc.
    `
  },
  {
    id: 'circ-paiements-importations',
    title: "Circulaire n° 2/2012 relative au Règlement des Importations",
    type: 'CIRCULAIRE',
    date: '2012-06-15',
    summary: "Conditions de paiement des importations de biens et services.",
    keywords: ['importation', 'paiement import', 'domiciliation', 'délai paiement', 'import', 'avance', 'préfinancement'],
    content: `
Circulaire n° 2/2012 — Règlement des importations:

Domiciliation obligatoire: Toute importation dont la valeur dépasse 50.000 MAD doit être domiciliée auprès d'une banque agréée avant le dédouanement.

Paiements anticipés (avances):
- Autorisés jusqu'à 50% de la valeur FOB pour les biens d'équipement (délai de livraison > 6 mois).
- Pour les importations courantes: paiement à réception des documents ou dans les 120 jours du dédouanement.

Délais de paiement: Le règlement doit intervenir dans les 120 jours suivant la date de dédouanement pour les importations ordinaires.

Paiements sans autorisation préalable: Les importations inférieures à 100 millions MAD par opération ne nécessitent pas d'autorisation préalable de l'OC si elles sont adossées à des documents commerciaux.

Documents requis: Facture commerciale, titre d'importation (TI), document de transport (connaissement, lettre de voiture), D'établir la conformité de la transaction.
    `
  },
  {
    id: 'circ-exportations',
    title: "Circulaire n° 3/2019 relative au Rapatriement des Recettes d'Exportation",
    type: 'CIRCULAIRE',
    date: '2019-09-01',
    summary: "Obligation de rapatriement et de cession des recettes d'exportation.",
    keywords: ['exportation', 'rapatriement', 'recettes export', 'délai rapatriement', 'cession devises', 'export'],
    content: `
Circulaire n° 3/2019 — Rapatriement des recettes d'exportation:

Obligation de rapatriement: Toutes les recettes en devises issues des exportations de biens et services doivent être rapatriées au Maroc.

Délais:
- Biens ordinaires: rapatriement dans les 150 jours suivant la date d'expédition (ou la date de la facture pour les services).
- Hydrocarbures et produits énergétiques: 90 jours.
- Services et revenus de droits: 60 jours suivant la date d'encaissement à l'étranger.

Cession obligatoire: Les exportateurs doivent céder 30% de leurs recettes en devises dans les 30 jours suivant leur rapatriement. Les 70% restants peuvent être conservés en Compte en Devises (CDE) ou Compte Professionnel en Devises (CPEC).

Compte Professionnel en Devises (CPEC): Ouvert aux exportateurs ayant réalisé au moins 5 millions MAD de recettes en devises au cours de l'exercice précédent. Permet de conserver jusqu'à 70% des recettes.

Sanctions: Le non-rapatriement dans les délais est passible de pénalités de 5% par mois de retard.
    `
  },
  {
    id: 'circ-voyages-2019',
    title: "Circulaire n° 2/2019 relative aux Allocations de Voyages",
    type: 'CIRCULAIRE',
    date: '2019-07-01',
    summary: "Allocations en devises pour les voyages touristiques, d'affaires, pèlerinage, soins et études.",
    keywords: ['allocation voyages', 'voyage', 'touristique', 'affaires', 'hajj', 'pèlerinage', 'soins', 'médicaux', 'études', 'étudiant', 'scolarité'],
    content: `
Circulaire n° 2/2019 — Allocations de voyages:

1. Voyages touristiques privés:
   - Allocation annuelle: 45.000 MAD par personne (sans limite du nombre de voyages).
   - Dépassement possible sur justificatifs de dépenses réelles (hôtels, billets, assurances).
   - Mineurs: 10.000 MAD par voyage, sans limite annuelle.

2. Voyages d'affaires:
   - Basés sur les besoins réels justifiés (per diem selon le pays de destination).
   - Per diem indicatif: jusqu'à 300 EUR/jour pour pays de l'OCDE; 200 EUR/jour autres pays.
   - Documents requis: invitation, ordre de mission.

3. Pèlerinage (Hajj et Omra):
   - Hajj: allocation officielle fixée annuellement par le ministère des Affaires Islamiques (environ 25.000 MAD en 2024).
   - Omra: jusqu'à 15.000 MAD par voyage.

4. Soins médicaux à l'étranger:
   - Allocation de base: 200.000 MAD par an.
   - Dépassement sur prescription médicale spécialisée validée.
   - Documents requis: certificat médical d'un spécialiste agréé, devis du prestataire étranger.

5. Voyages d'études:
   - Étudiants inscrits dans un établissement étranger agréé: 100.000 MAD par an.
   - Majoration possible sur justificatifs (frais d'inscription, loyer).
   - Documents requis: attestation d'inscription, programme de l'établissement.
    `
  },
  {
    id: 'circ-couverture-2024',
    title: "Circulaire n° 01/2024 relative à la Couverture du Risque de Change",
    type: 'CIRCULAIRE',
    date: '2024-03-15',
    summary: "Nouveau cadre élargi pour la couverture du risque de change par les entreprises importatrices et exportatrices, notamment les PME.",
    keywords: ['couverture risque de change', 'hedging', 'produits dérivés', 'change à terme', 'option de change', 'pme', 'couverture', 'forward', 'option'],
    content: `
Circulaire n° 01/2024 — Couverture du risque de change:

Bénéficiaires: Toutes les entreprises résidentes ayant des engagements en devises (importateurs, exportateurs, PME, ETI, grandes entreprises).

Instruments autorisés:
- Contrats à terme (forward) d'achat ou de vente de devises.
- Options de change plain vanilla (calls et puts).
- Swaps de devises (pour les entreprises ayant des flux récurrents).
- Tunnel (risk reversal) dans les limites réglementaires.

Plafonds de couverture:
- Importateurs: jusqu'à 100% de la valeur des commandes confirmées ou des flux prévisionnels documentés.
- Exportateurs: jusqu'à 100% du carnet de commandes export documenté.
- PME: règles simplifiées — couverture sur présentation du bon de commande ou de la facture pro forma.

Maturité maximale: 12 mois (renouvelable une fois sur justificatifs).

Banques habilitées: Toutes les banques agréées intermédiaires en matière de change.

Nouveauté 2024: Extension aux PME sans obligation de franchise minimum. Accès facilité aux produits dérivés de change pour les entreprises dont le chiffre d'affaires export/import est inférieur à 50 millions MAD.

Conditions de débouclement: Le sous-jacent doit être réel et documenté. Tout débouclement anticipé sans sous-jacent justifiable est soumis à déclaration à l'OC.
    `
  },
  {
    id: 'circ-investissements-etrangers',
    title: "Instruction n° 03/2021 relative aux Investissements Étrangers au Maroc",
    type: 'INSTRUCTION',
    date: '2021-05-01',
    summary: "Régime des investissements directs étrangers (IDE) et rapatriement des bénéfices.",
    keywords: ['investissement étranger', 'ide', 'rapatriement bénéfices', 'dividendes', 'capital étranger', 'repatriation', 'foreign investment'],
    content: `
Instruction n° 03/2021 — Investissements étrangers:

Liberté d'investissement: Les investissements directs étrangers (IDE) sont libres dans la plupart des secteurs économiques (hors liste négative: armement, sécurité nationale, certaines activités réglementées).

Importation du capital: L'investisseur étranger doit faire transiter son apport en capital par le canal bancaire officiel et obtenir un visa de change de sa banque. Ceci constitue la preuve de l'investissement étranger régulier.

Rapatriement des revenus:
- Dividendes et bénéfices nets d'impôts (IS, IRPP): librement rapatriables.
- Plus-values de cession d'actifs ou de titres: rapatriables après acquittement de l'impôt applicable.
- Redevances, honoraires, intérêts intra-groupe: rapatriables dans les conditions de l'article 13 de l'IGOC.

Rapatriement du capital:
- Le capital initial investi régulièrement (visé par la banque) est librement rapatriable en cas de cession ou liquidation.
- L'investisseur doit présenter à sa banque agréée les documents justificatifs (procès-verbal d'AG, acte de cession, relevé fiscal).

Déclarations: Tout IDE dépassant 10 millions MAD doit faire l'objet d'une déclaration à l'OC dans les 30 jours suivant l'opération.
    `
  },
  {
    id: 'circ-investissements-marocains-etranger',
    title: "Circulaire n° 4/2022 relative aux Investissements Marocains à l'Étranger (IME)",
    type: 'CIRCULAIRE',
    date: '2022-11-01',
    summary: "Conditions d'investissement des résidents marocains à l'étranger.",
    keywords: ['investissement marocain étranger', 'ime', 'invest abroad', 'résident marocain étranger', 'dotation investissement'],
    content: `
Circulaire n° 4/2022 — Investissements Marocains à l'Étranger (IME):

Personnes morales (entreprises):
- Sociétés cotées à la Bourse de Casablanca: jusqu'à 200 millions MAD/an (dotation globale automatique via banque).
- Autres entreprises: jusqu'à 100 millions MAD/an sous réserve d'autorisation préalable de l'OC.
- Objectif: prises de participation, création de filiales, acquisitions à l'étranger.

Personnes physiques (professionnels et entrepreneurs):
- Jusqu'à 5 millions MAD/an pour les professionnels exerçant en leur nom propre ou dans le cadre d'une activité commerciale internationale.
- Nécessite une autorisation préalable de l'OC pour les montants supérieurs.

Conditions générales:
- Apport en capital doit transiter par la banque agréée au Maroc.
- Rapport annuel de l'investissement (états financiers de la filiale étrangère) à déposer à l'OC.
- Rapatriement des dividendes reçus de l'investissement étranger dans les 6 mois de leur distribution.
- Toute cession de l'investissement à l'étranger doit faire l'objet d'une déclaration à l'OC dans les 30 jours.

Secteurs exclus: Investissements dans des pays ou entités sous sanctions internationales.
    `
  },
  {
    id: 'circ-comptes-devises',
    title: "Instruction n° 01/2020 relative aux Comptes en Devises des Résidents",
    type: 'INSTRUCTION',
    date: '2020-03-01',
    summary: "Conditions d'ouverture et de fonctionnement des comptes en devises pour personnes physiques et morales résidentes.",
    keywords: ['compte devises', 'compte en devises', 'cpec', 'cde', 'résident devises', 'compte étranger'],
    content: `
Instruction n° 01/2020 — Comptes en devises des résidents:

Personnes physiques résidentes:
- Peuvent détenir un Compte en Devises (CDE) alimenté par leurs recettes en devises personnelles (salaires de missions à l'étranger, loyers sur biens étrangers, pensions étrangères).
- Plafond de détention: jusqu'à 10.000 EUR équivalent (ou contre-valeur dans d'autres devises).
- Le CDE peut être utilisé pour régler des dépenses à l'étranger (voyages, achats en ligne).

Personnes morales résidentes — CPEC (Compte Professionnel en Devises):
- Ouvert aux entreprises marocaines ayant réalisé un minimum de 5 millions MAD de recettes en devises au cours de l'exercice précédent.
- Alimentation: 70% maximum des recettes d'exportation rapatriées.
- Utilisation: règlement des importations, frais de mission, remboursement de crédits extérieurs, paiement de dividendes à des actionnaires étrangers.
- Le solde du CPEC ne peut pas dépasser 6 mois de recettes d'exportation.

Devises admises: EUR, USD, GBP, CHF, CAD, et toute devise librement convertible cotée par Bank Al-Maghrib.

Intérêts: Les dépôts à terme en devises peuvent être rémunérés aux taux de marché internationaux (EURIBOR, SOFR, etc.) nets de retenue à la source.
    `
  },
  {
    id: 'circ-transferts-familiaux',
    title: "Note de Service n° 02/2023 — Transferts Familiaux et Envois de Fonds",
    type: 'NOTE',
    date: '2023-04-01',
    summary: "Conditions de transfert de fonds par les Marocains résidant à l'étranger (MRE) et par les résidents marocains.",
    keywords: ['transfert familial', 'envoi argent', 'mre', 'marocain étranger', 'remittance', 'virement famille'],
    content: `
Note de Service n° 02/2023 — Transferts familiaux:

Transferts des MRE vers le Maroc:
- Libres et sans plafond. Les Marocains résidant à l'étranger peuvent transférer librement leurs économies au Maroc.
- Les fonds entrants en devises sont automatiquement convertis en MAD sauf si le bénéficiaire possède un compte devises éligible.

Transferts des résidents vers l'étranger (entretien de la famille):
- Les résidents marocains peuvent transférer jusqu'à 20.000 MAD/an pour subvenir aux besoins d'un conjoint ou d'enfants résidant à l'étranger.
- Justificatifs requis: livret de famille ou acte de mariage (traduit et légalisé), preuve de résidence à l'étranger.
- Au-delà de 20.000 MAD: autorisation préalable de l'OC requise.

Envois de fonds via opérateurs agréés (Western Union, MoneyGram, etc.):
- Plafond par transaction: 10.000 MAD équivalent.
- Plafond annuel par expéditeur: 50.000 MAD équivalent.
- Pièce d'identité nationale obligatoire.
    `
  },
  {
    id: 'circ-commerce-electronique',
    title: "Circulaire n° 05/2023 relative aux Paiements Électroniques Internationaux",
    type: 'CIRCULAIRE',
    date: '2023-09-01',
    summary: "Conditions d'utilisation des cartes bancaires et paiements en ligne pour les transactions internationales.",
    keywords: ['e-commerce', 'paiement en ligne', 'carte bancaire', 'internet', 'achat en ligne', 'cmi', 'carte visa', 'mastercard'],
    content: `
Circulaire n° 05/2023 — Paiements électroniques internationaux:

Cartes bancaires de paiement international:
- Les titulaires de cartes Visa/Mastercard émises au Maroc peuvent effectuer des achats en ligne à l'étranger dans la limite de leur allocation annuelle de voyage (45.000 MAD/an).
- Les paiements par carte s'imputent sur l'allocation touristique annuelle.

Paiements e-commerce pour importations commerciales:
- Les entreprises peuvent payer leurs fournisseurs étrangers par virement SWIFT ou par carte corporate.
- Les achats inférieurs à 50.000 MAD par transaction sont libres; au-delà, domiciliation bancaire requise.

CMI (Centre Monétique Interbancaire):
- Les paiements en ligne des clients étrangers envers des commerçants marocains (e-commerce export) sont librement acceptés.
- Les marchands marocains doivent se conformer aux règles PCI-DSS et aux procédures de rapatriement OC.

Crypto-actifs: L'Office des Changes rappelle que l'utilisation des crypto-monnaies (Bitcoin, etc.) pour régler des transactions internationales est interdite et constitue une infraction à la réglementation des changes.
    `
  },
  {
    id: 'circ-redevances-services',
    title: "Instruction n° 02/2018 — Paiement des Redevances et Services Immatériels",
    type: 'INSTRUCTION',
    date: '2018-07-01',
    summary: "Conditions de paiement des redevances, licences, brevets, services informatiques et consulting à l'étranger.",
    keywords: ['redevances', 'licence', 'brevet', 'services informatiques', 'consulting', 'royalties', 'software', 'tech', 'abonnement saas'],
    content: `
Instruction n° 02/2018 — Redevances et services immatériels:

Redevances et droits de propriété intellectuelle:
- Librement transférables si encadrés par un contrat homologué ou enregistré auprès de l'Office Marocain de la Propriété Industrielle et Commerciale (OMPIC).
- Taux de redevance: justifié par rapport aux pratiques du marché (arm's length). L'OC peut demander une étude de comparabilité si le taux dépasse 5% du CA local.

Services informatiques et SaaS:
- Abonnements à des logiciels et services cloud (Microsoft 365, Salesforce, AWS, etc.): librement payables via carte bancaire corporate ou virement dans la limite des besoins.
- Les montants annuels dépassant 500.000 MAD nécessitent une domiciliation bancaire et justificatif (contrat de service).

Services de conseil (consulting):
- Paiements à des consultants étrangers libres pour les prestations de conseil aux entreprises marocaines.
- Documents requis: contrat de service, rapport de mission, facture.

Convention de trésorerie intra-groupe (cash pooling):
- Autorisée sous conditions pour les groupes multinationaux. Nécessite une autorisation préalable de l'OC et la désignation d'une banque dépositaire locale.
    `
  },
  {
    id: 'communique-taux-2024',
    title: "Communiqué BKAM — Taux Directeur et Cadre de Politique Monétaire 2024",
    type: 'COMMUNIQUE',
    date: '2024-06-18',
    summary: "Bank Al-Maghrib maintient son taux directeur à 2,75% et confirme le régime de change flottant encadré.",
    keywords: ['taux directeur', 'politique monétaire', 'bkam', 'banque al-maghrib', 'regime de change', 'flottant', 'bande fluctuation'],
    content: `
Communiqué BKAM — Politique monétaire juin 2024:

Taux directeur: Maintenu à 2,75% (inchangé depuis septembre 2023 après deux baisses successives).

Régime de change:
- Le dirham (MAD) évolue dans une bande de fluctuation de ±5% autour d'un taux central fixé quotidiennement par Bank Al-Maghrib.
- Le taux central est calculé sur la base d'un panier de devises: 60% EUR / 40% USD.
- BKAM intervient sur le marché interbancaire des changes pour maintenir le cours dans la bande.

Marché interbancaire des changes (MIC):
- Les banques agréées peuvent traiter des opérations de change entre elles et avec leurs clients dans le cadre réglementaire.
- La séance de fixing a lieu quotidiennement à 11h30 (heure de Casablanca).

Réserves officielles de change:
- Niveau actuel: 360 milliards MAD (environ 36 milliards USD), couvrant 5 mois d'importations de biens et services.

Inflation: 2,4% (en glissement annuel), dans le corridor cible de BKAM.
    `
  },
  {
    id: 'circ-transit-fonds-2022',
    title: "Circulaire n° 3/2022 — Fonds Bloqués et Litiges de Change",
    type: 'CIRCULAIRE',
    date: '2022-06-01',
    summary: "Procédure de déblocage des fonds bloqués et recours en cas de litige de change.",
    keywords: ['fonds bloqués', 'blocked funds', 'litige change', 'déblocage', 'réclamation', 'blocage virement'],
    content: `
Circulaire n° 3/2022 — Fonds bloqués et litiges:

Causes de blocage fréquentes:
- Défaut de domiciliation préalable de l'importation.
- Non-conformité des documents commerciaux (facture, titre d'importation).
- Suspicion de fraude ou de sous/sur-facturation.
- Dépassement des délais réglementaires de paiement.
- Bénéficiaire figurant sur une liste de surveillance internationale (OFAC, UE, ONU).

Procédure de déblocage:
1. Contacter la banque agréée et demander le motif précis du blocage.
2. Fournir les documents manquants (facture rectifiée, titre d'importation, preuve de livraison).
3. Si le blocage persiste, saisir l'Office des Changes par courrier recommandé avec les justificatifs.
4. Délai de traitement: 15 jours ouvrables pour les demandes complètes.

Recours:
- En cas de désaccord persistant, recours devant le Comité de Recours de l'OC (formulaire disponible sur oc.gov.ma).
- Délai de recours: 60 jours à compter de la notification de la décision de l'OC.

Cas complexes (montants > 5M MAD ou implications pénales): Consultation d'un avocat spécialisé en droit des changes recommandée. Khouya FX peut mettre en relation avec des experts agréés.
    `
  },
  {
    id: 'circ-emprunts-exterieurs',
    title: "Instruction n° 04/2020 — Emprunts et Crédits Extérieurs",
    type: 'INSTRUCTION',
    date: '2020-09-01',
    summary: "Conditions de souscription et de remboursement d'emprunts auprès de banques ou bailleurs étrangers.",
    keywords: ['emprunt extérieur', 'crédit étranger', 'financement étranger', 'dette extérieure', 'remboursement emprunt'],
    content: `
Instruction n° 04/2020 — Emprunts extérieurs:

Personnes morales résidentes:
- Les entreprises marocaines peuvent contracter des emprunts auprès de banques et institutions financières étrangères sans autorisation préalable de l'OC si:
  * Le taux d'intérêt ne dépasse pas le taux de référence marché + 3%.
  * La durée est d'au moins 2 ans (pour éviter le court terme).
  * L'emprunt transite par la banque agréée marocaine.
- Déclaration à l'OC dans les 30 jours suivant la mise en place du crédit.

Remboursement:
- Principal et intérêts librement transférables si l'emprunt a été régulièrement déclaré.
- La banque agréée gère les flux de remboursement.

Prêts intra-groupe:
- Les prêts consentis par une société mère étrangère à sa filiale marocaine sont autorisés sous les mêmes conditions.
- La convention de prêt doit être enregistrée auprès de la DGI (Direction Générale des Impôts).

Eurobonds et marchés de capitaux internationaux:
- Les émissions obligataires en devises par des entités marocaines (État, OCP, etc.) requièrent une autorisation spécifique de Bank Al-Maghrib et du Ministère des Finances.
    `
  },
  {
    id: 'bkam-fixing-methodo',
    title: "Bank Al-Maghrib — Méthodologie du Fixing Officiel MAD et Marché des Changes",
    type: 'NOTE',
    date: '2024-01-15',
    summary: "Description du mécanisme de fixing quotidien du dirham marocain, structure du marché interbancaire des changes et rôle de BKAM dans la gestion du régime de change.",
    keywords: ['fixing', 'fixing bkam', 'cours de référence', 'taux directeur', 'panier de devises', 'bande fluctuation', 'marché interbancaire', 'séance fixing', 'cours officiel', 'bank al-maghrib', 'dirham', 'mad'],
    content: `
Fixing Officiel Bank Al-Maghrib — Méthodologie:

1. RÉGIME DE CHANGE DU DIRHAM (MAD):
Le dirham marocain évolue dans un régime de change flottant géré (managed float) depuis janvier 2018.
- Bande de fluctuation: ±5% autour d'un taux central (élargie de ±2,5% à ±5% en mars 2020).
- Panier de référence: 60% EUR / 40% USD (inchangé depuis 2015).
- Parité centrale: déterminée quotidiennement par Bank Al-Maghrib selon la formule du panier.
- Formule USD/MAD théorique: K / (0,60 × EUR/USD + 0,40) où K ≈ 10,49 (calibré sur la parité historique).

2. FIXING QUOTIDIEN:
- Séance de fixing: chaque jour ouvré à 11h30 (heure de Casablanca) sur le Marché Interbancaire des Changes (MIC).
- BKAM publie les cours de référence officiels (cours directeurs) après la séance.
- Les cours officiels EUR/MAD et USD/MAD servent de base pour toutes les opérations de change réglementées.
- Source officielle: www.bkam.ma → Marchés → Indicateurs clés → Marché des changes.

3. TAUX DE CHANGE VIREMENTS (cours de transfert):
Publiés quotidiennement par BKAM pour les 14 devises officiellement cotées.
Disponibles sur: https://www.bkam.ma/en/Markets/Key-indicators/Foreign-exchange-market/Foreign-exchange-rates/Transfer-exchange-rate
Ces taux correspondent aux opérations de virement international (achats et ventes de devises par virement bancaire).

4. TAUX DE CHANGE BILLETS (cours billets de banque):
Cours distincts pour les opérations en espèces (billets de banque étrangers).
Disponibles sur: https://www.bkam.ma/en/Markets/Key-indicators/Foreign-exchange-market/Foreign-exchange-rates/Foreign-banknotes-exchange-rate
Les cours billets sont généralement moins favorables que les cours virements en raison du coût de manipulation physique des espèces.

5. DEVISES OFFICIELLEMENT COTÉES PAR BKAM (14 devises):
EUR, USD, GBP, CHF, CAD, JPY (cotation au cent), SAR, AED, KWD, QAR, DKK, NOK, SEK, CNY.

6. MARCHÉ INTERBANCAIRE DES CHANGES (MIC):
- Seules les banques agréées par BKAM peuvent participer directement au MIC.
- Les entreprises et particuliers accèdent au marché via leur banque agréée.
- BKAM intervient sur le MIC pour maintenir le cours dans la bande de ±5%.
    `
  },
  {
    id: 'oc-commissions-change',
    title: "Office des Changes — Instruction sur les Commissions Autorisées sur Opérations de Change",
    type: 'INSTRUCTION',
    date: '2023-07-01',
    summary: "Cadre réglementaire des commissions et marges commerciales applicables par les intermédiaires agréés sur les opérations de change au Maroc, par segment de clientèle.",
    keywords: ['commission change', 'commission oc', 'marge commerciale', 'taux client', 'spread change', 'commission virement', 'commission billets', 'tarification change', 'frais change', 'grande entreprise', 'pme', 'tpe', 'particulier', 'commission bancaire', 'cours client'],
    content: `
Office des Changes — Commissions sur Opérations de Change:

1. PRINCIPE GÉNÉRAL:
Les intermédiaires agréés (banques, bureaux de change) sont autorisés à prélever une commission commerciale sur les opérations de change, EN PLUS du cours de référence BKAM. Ces commissions sont librement négociées dans les limites fixées par l'Office des Changes.

2. STRUCTURE DES COURS CLIENT:
Cours client = Cours de référence BKAM ± Spread de base ± Commission commerciale de l'intermédiaire
- Le "cours de référence BKAM" est le taux officiel publié quotidiennement.
- Le "spread de base" couvre les coûts opérationnels de l'intermédiaire.
- La "commission commerciale" est la marge bénéficiaire de l'intermédiaire, librement négociée.

3. SEGMENTATION CLIENTÈLE ET COMMISSIONS INDICATIVES:

Grande Entreprise / Multinationale (CA > 500M MAD):
- Virements: commissions très compétitives, souvent 2,5–5 bps (0,025%–0,05%) au-delà du spread de base.
- Accès direct aux taux interbancaires avec marges minimales.
- Accès aux instruments de couverture sophistiqués (forwards, options, swaps).
- Négociation directe avec la salle des marchés de la banque.

PME / Petite et Moyenne Entreprise (CA 10–500M MAD):
- Virements: commissions de 5–10 bps (0,05%–0,10%) au-delà du spread de base.
- Accès simplifié aux contrats à terme (Circulaire OC 01/2024).
- Eligibilité au CPEC si recettes devises > 5M MAD/an.

TPE / Très Petite Entreprise et Auto-Entrepreneur (CA < 10M MAD):
- Virements: commissions de 8–15 bps (0,08%–0,15%) au-delà du spread de base.
- Opérations courantes uniquement (importations/exportations ordinaires).
- Pas d'accès aux instruments dérivés sans accompagnement spécialisé.

Particuliers (voyages, allocation touristique):
- Virements et billets: commissions plus élevées (15–30 bps) reflétant les coûts unitaires plus importants.
- Allocation annuelle de voyage: 45 000 MAD par an (Circulaire OC 2/2019).
- Les opérations en billets de banque (espèces) supportent des frais supplémentaires.

4. OPÉRATIONS EN BILLETS DE BANQUE (espèces):
Les commissions sur billets sont systématiquement plus élevées que sur virements en raison:
- Du coût logistique (transport, comptage, sécurisation des espèces).
- Du risque de contrefaçon.
- Des contraintes réglementaires anti-blanchiment (LCB-FT).

5. TRANSPARENCE TARIFAIRE:
Les intermédiaires agréés sont tenus d'afficher leur grille tarifaire (cours acheteur, cours vendeur, commissions) dans leurs agences et sur leurs sites internet, conformément aux dispositions de la réglementation de transparence bancaire de Bank Al-Maghrib.

6. PROTECTION DU CLIENT:
En cas de litige sur les commissions appliquées, le client peut saisir:
- Le médiateur bancaire de sa banque.
- Bank Al-Maghrib (service des réclamations).
- L'Office des Changes (infractions à la réglementation tarifaire).
    `
  },
  {
    id: 'bkam-fixing-fixingrates',
    title: "BKAM — Taux de Référence Officiels et Grille de Cotation des 14 Devises",
    type: 'NOTE',
    date: '2024-06-01',
    summary: "Description des taux de change officiels publiés par Bank Al-Maghrib pour les 14 devises cotées contre le dirham marocain, avec unités de cotation BKAM.",
    keywords: ['taux référence', 'cours change', '14 devises', 'eur mad', 'usd mad', 'gbp mad', 'jpy mad', 'cotation bkam', 'unité cotation', 'cours officiel bkam', 'dirham', 'fixing officiel', 'cours acheteur vendeur'],
    content: `
BKAM — Taux de Référence Officiels des 14 Devises:

DEVISES COTÉES ET UNITÉS:
Bank Al-Maghrib cote officiellement les 14 devises suivantes contre le Dirham marocain (MAD):
1. EUR — Euro (unité: 1 EUR)
2. USD — Dollar américain (unité: 1 USD)
3. GBP — Livre sterling (unité: 1 GBP)
4. CHF — Franc suisse (unité: 1 CHF)
5. CAD — Dollar canadien (unité: 1 CAD)
6. JPY — Yen japonais (unité: 100 JPY — cotation au cent)
7. SAR — Riyal saoudien (unité: 1 SAR)
8. AED — Dirham des Émirats (unité: 1 AED)
9. KWD — Dinar koweïtien (unité: 1 KWD)
10. QAR — Riyal qatarien (unité: 1 QAR)
11. DKK — Couronne danoise (unité: 1 DKK)
12. NOK — Couronne norvégienne (unité: 1 NOK)
13. SEK — Couronne suédoise (unité: 1 SEK)
14. CNY — Yuan chinois (unité: 1 CNY)

DEUX TYPES DE COURS OFFICIELS BKAM:
1. Cours de change virement (Transfer exchange rate):
   - Applicable aux opérations de transfert bancaire (virements SWIFT).
   - Publié quotidiennement après la séance de fixing de 11h30.
   - Source: www.bkam.ma/en/Markets/.../Transfer-exchange-rate

2. Cours de change billets (Foreign banknotes exchange rate):
   - Applicable aux opérations en espèces (billets de banque étrangers).
   - Cours généralement moins favorables (spread plus large).
   - Source: www.bkam.ma/en/Markets/.../Foreign-banknotes-exchange-rate

LECTURE DES COURS:
- Cours acheteur (Buy): taux auquel la banque ACHÈTE la devise étrangère (client vend devises, reçoit MAD).
- Cours vendeur (Sell): taux auquel la banque VEND la devise étrangère (client achète devises, paie MAD).
- L'écart entre cours acheteur et vendeur représente la marge de l'intermédiaire agréé.

FRÉQUENCE DE PUBLICATION:
Chaque jour ouvré. En cas de fermeture des marchés (fêtes nationales, week-end), le dernier cours publié reste en vigueur.
    `
  },
];

// Simple keyword extraction (removes stop words, lowercases)
function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'et', 'en', 'à', 'est',
    'pour', 'par', 'sur', 'avec', 'dans', 'que', 'qui', 'ou', 'si', 'mais',
    'the', 'a', 'an', 'of', 'in', 'is', 'for', 'to', 'and', 'or', 'with', 'on',
    'can', 'are', 'at', 'my', 'i', 'what', 'how', 'when', 'do', 'does',
  ]);
  return text
    .toLowerCase()
    .replace(/[^a-zàâäéèêëîïôùûü\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w));
}

// Score a document against query keywords
function scoreDoc(doc: RegDocument, queryKeywords: string[]): number {
  const docKeywords = doc.keywords.join(' ') + ' ' + doc.title.toLowerCase() + ' ' + doc.summary.toLowerCase();
  let score = 0;
  for (const kw of queryKeywords) {
    if (docKeywords.includes(kw)) {
      // Higher score for exact keyword match vs partial content match
      score += doc.keywords.includes(kw) ? 3 : 1;
    }
  }
  return score;
}

// Retrieve top-k most relevant documents for a query
export function retrieveContext(query: string, topK = 3): string {
  const queryKws = extractKeywords(query);

  if (queryKws.length === 0) {
    // Return a general overview if no keywords extracted
    return REGULATORY_DOCS.slice(0, 2).map(d => `[${d.title}]\n${d.summary}`).join('\n\n');
  }

  const scored = REGULATORY_DOCS
    .map(doc => ({ doc, score: scoreDoc(doc, queryKws) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  if (scored.length === 0) {
    return "Aucun document réglementaire correspondant trouvé dans la base.";
  }

  return scored.map(({ doc }) =>
    `--- [${doc.type}] ${doc.title} (${doc.date}) ---\n${doc.content.trim()}`
  ).join('\n\n');
}

export function getDocumentCount(): number {
  return REGULATORY_DOCS.length;
}

export function getRecentDocuments(n = 3): RegDocument[] {
  return [...REGULATORY_DOCS]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, n);
}
