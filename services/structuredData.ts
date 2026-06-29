/**
 * P4.9 — Schema.org structured data for SEO.
 *
 * Centralised JSON-LD generators for the major page types.
 * Inject via <script type="application/ld+json"> in the page head.
 */

import { BKAM_CURRENCIES, DISCLAIMER_TEXT, APP_NAME } from '../constants';

const SITE_URL = 'https://fx.jad2advisory.com';
const ORG_URL = 'https://jad2advisory.com';

const PUBLISHER = {
  '@type': 'Organization',
  name: 'JAD2 Advisory',
  url: ORG_URL,
  logo: {
    '@type': 'ImageObject',
    url: `${SITE_URL}/jad2-logo.svg`,
  },
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Casablanca',
    addressCountry: 'MA',
  },
  sameAs: [
    'https://www.linkedin.com/company/jad2advisory',
  ],
};

/** WebSite schema — emits on every page */
export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: APP_NAME,
    alternateName: 'JAD2FX — Terminal taux de change MAD',
    url: SITE_URL,
    description: 'Terminal pédagogique des taux de change du dirham marocain (MAD) — 24 devises, simulations forward/swap, conformité OC.',
    inLanguage: ['fr-FR', 'en-US', 'ar-MA'],
    publisher: PUBLISHER,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

/** WebApplication schema — for the main app */
export function webApplicationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: APP_NAME,
    url: SITE_URL,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Any (web browser)',
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'MAD',
      description: 'Outil pédagogique gratuit. Données indicatives uniquement.',
    },
    description: DISCLAIMER_TEXT.slice(0, 200),
    publisher: PUBLISHER,
    featureList: [
      'Taux de change 24 devises vs MAD',
      'Simulateur de forward CIP',
      'Simulateur de swap de change',
      'Diagnostic conformité OC 01/2024',
      'Cotation billets de banque',
      'Morning Briefing IA',
    ].join(', '),
  };
}

/** FinancialProduct schema — per currency pair */
export function financialProductJsonLd(currencyCode: string, currentRate: number) {
  const ccy = BKAM_CURRENCIES.find((c) => c.code === currencyCode);
  if (!ccy) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FinancialProduct',
    name: `${currencyCode}/MAD — Taux de change indicatif`,
    description: `Taux de change indicatif ${ccy.nameFr} (${currencyCode}) contre Dirham Marocain (MAD) — données pédagogiques issues de sources officielles.`,
    category: 'Currency Exchange Rate',
    url: `${SITE_URL}/?view=LIVE&ccy=${currencyCode}`,
    provider: PUBLISHER,
    feesAndCommissionsSpecification: '0% — Outil pédagogique sans exécution',
    interestRate: {
      '@type': 'QuantitativeValue',
      value: currentRate,
      unitText: 'MAD',
    },
  };
}

/** FAQPage schema — for the home page */
export function faqJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Les taux affichés sur JAD2FX sont-ils officiels ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Non. JAD2FX est un outil pédagogique. Les taux sont indicatifs et basés sur les cotations officielles de Bank Al-Maghrib et de la BCE. Pour toute opération, contactez votre banque agréée.',
        },
      },
      {
        '@type': 'Question',
        name: 'JAD2FX propose-t-il l\'exécution de transactions de change ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Non. JAD2FX est uniquement un outil de simulation et d\'information. Il ne fournit pas de conseil en investissement et n\'exécute aucune transaction. Pour vos opérations, adressez-vous à un établissement de crédit agréé par Bank Al-Maghrib.',
        },
      },
      {
        '@type': 'Question',
        name: 'Comment fonctionne la simulation de forward ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'La simulation utilise la formule CIP (Covered Interest Parity) avec les courbes de taux MONIA, EUR, USD, GBP et JPY. Le résultat est pédagogique et peut différer du cours ferme proposé par votre banque.',
        },
      },
      {
        '@type': 'Question',
        name: 'Puis-je exporter les données de change ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Oui. JAD2FX propose l\'export CSV sur le tableau de bord et l\'export PDF du Morning Briefing. Pour des exports automatisés, une API publique est disponible (voir page API).',
        },
      },
      {
        '@type': 'Question',
        name: 'Qu\'est-ce que la Circ. OC 01/2024 ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'La circulaire Office des Changes 01/2024 encadre les instruments de couverture autorisés pour les entreprises marocaines : forwards, FX swaps, options vanilla sont autorisés ; les options exotiques et les produits à effet de levier sont interdits.',
        },
      },
      {
        '@type': 'Question',
        name: 'JAD2FX est-il conforme à la réglementation marocaine ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Oui. JAD2FX est un outil de JAD2 Advisory, cabinet de conseil et formation. Il est strictement réservé à l\'information et la formation, conformément aux Lois 19-14 et 103-12 et aux circulaires OC.',
        },
      },
    ],
  };
}

/** Organization schema — for about page */
export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'JAD2 Advisory',
    legalName: 'JAD2 Advisory — Conseil stratégique',
    url: ORG_URL,
    logo: PUBLISHER.logo,
    description: 'Cabinet de conseil stratégique et de formation en gestion du risque de change — Casablanca, Maroc.',
    foundingDate: '2020',
    address: PUBLISHER.address,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'contact@jad2advisory.com',
      areaServed: ['MA', 'FR', 'TN', 'DZ'],
      availableLanguage: ['French', 'English', 'Arabic'],
    },
  };
}

/** BreadcrumbList schema */
export function breadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

/** SoftwareApplication schema — for the diagnostic tool */
export function toolJsonLd(name: string, description: string, url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name,
    description,
    url,
    applicationCategory: 'FinanceApplication',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'MAD' },
    operatingSystem: 'Web',
    publisher: PUBLISHER,
  };
}

/** Serialize a single schema to a <script> tag */
export function schemaScript(json: object): string {
  return `<script type="application/ld+json">${JSON.stringify(json)}</script>`;
}

/** Multiple schemas as combined script */
export function schemaScripts(...schemas: object[]): string {
  // Schema.org recommends a single <script> with @graph for multiple items
  if (schemas.length === 1) return schemaScript(schemas[0]);
  return schemaScript({
    '@context': 'https://schema.org',
    '@graph': schemas,
  });
}
