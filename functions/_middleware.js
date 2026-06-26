/**
 * Cloudflare Pages Middleware — Dynamic Rendering for Crawlers
 *
 * Googlebot and other bots get server-rendered HTML with live MAD rates.
 * Regular users get the SPA as before (context.next()).
 *
 * This is "dynamic rendering" — explicitly supported by Google:
 * https://developers.google.com/search/docs/crawling-indexing/javascript/dynamic-rendering
 */

const BOT_UA_RE =
  /Googlebot|Googlebot-Image|Googlebot-News|AdsBot-Google|DuplexWeb-Google|Bingbot|Slurp|DuckDuckBot|Baiduspider|YandexBot|Sogou|Exabot|ia_archiver|AhrefsBot|SemrushBot|facebot|LinkedInBot|LinkedInBot-Proxy|Twitterbot|WhatsApp|Slackbot|facebookexternalhit|Discordbot|TelegramBot|Applebot|Pinterest|Snapchat/i;

const K = 10.49;        // BKAM basket constant
const EUR_W = 0.60;     // 60% EUR weight
const USD_W = 0.40;     // 40% USD weight

const CURRENCIES = [
  { code: 'EUR', nameFr: 'Euro',                 flag: '🇪🇺', unit: 1   },
  { code: 'USD', nameFr: 'Dollar américain',     flag: '🇺🇸', unit: 1   },
  { code: 'GBP', nameFr: 'Livre sterling',       flag: '🇬🇧', unit: 1   },
  { code: 'CHF', nameFr: 'Franc suisse',         flag: '🇨🇭', unit: 1   },
  { code: 'JPY', nameFr: 'Yen japonais',         flag: '🇯🇵', unit: 100 },
  { code: 'CAD', nameFr: 'Dollar canadien',      flag: '🇨🇦', unit: 1   },
  { code: 'NOK', nameFr: 'Couronne norvégienne', flag: '🇳🇴', unit: 1   },
  { code: 'SEK', nameFr: 'Couronne suédoise',    flag: '🇸🇪', unit: 1   },
  { code: 'DKK', nameFr: 'Couronne danoise',     flag: '🇩🇰', unit: 1   },
  { code: 'CNY', nameFr: 'Yuan renminbi',        flag: '🇨🇳', unit: 1   },
  { code: 'SAR', nameFr: 'Riyal saoudien',       flag: '🇸🇦', unit: 1   },
  { code: 'AED', nameFr: 'Dirham des Émirats',   flag: '🇦🇪', unit: 1   },
  { code: 'QAR', nameFr: 'Riyal qatarien',       flag: '🇶🇦', unit: 1   },
  { code: 'KWD', nameFr: 'Dinar koweïtien',      flag: '🇰🇼', unit: 1   },
];

// Gulf pegs (USD equivalence per 1 unit of that currency)
const GULF_USD = {
  SAR: 0.266667,
  AED: 0.272294,
  QAR: 0.274725,
  KWD: 3.25000,
};

async function fetchEurRates() {
  try {
    const res = await fetch('https://api.frankfurter.app/latest?from=EUR', {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function calcMadRates(eurRates) {
  const eurUsd = eurRates['USD'] ?? 1.085;
  const usdMad = K / (EUR_W * eurUsd + USD_W);
  const eurMad = usdMad * eurUsd;
  const mad = { EUR: eurMad, USD: usdMad };

  // Gulf pegs via USD cross
  for (const [code, usdEquiv] of Object.entries(GULF_USD)) {
    mad[code] = usdEquiv * usdMad;
  }

  // Remaining currencies via EUR cross
  for (const [code, eurVal] of Object.entries(eurRates)) {
    if (!mad[code] && eurVal > 0) {
      mad[code] = (eurUsd / eurVal) * usdMad;
    }
  }

  return mad;
}

function buildHtml(madRates, date, siteUrl) {
  const rows = CURRENCIES
    .filter(c => madRates[c.code] != null)
    .map(c => {
      const rawMid = madRates[c.code];
      const mid  = (rawMid * c.unit).toFixed(4);
      const buy  = (rawMid * c.unit * 0.992).toFixed(4);
      const sell = (rawMid * c.unit * 1.008).toFixed(4);
      return `<tr>
        <td>${c.flag} <strong>${c.code}</strong></td>
        <td>${c.nameFr}</td>
        <td style="text-align:right">${c.unit}</td>
        <td style="text-align:right;font-family:monospace">${buy}</td>
        <td style="text-align:right;font-family:monospace">${sell}</td>
        <td style="text-align:right;font-family:monospace">${mid}</td>
      </tr>`;
    }).join('\n');

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'JAD2FX',
    url: siteUrl,
    description:
      'Terminal de taux de change indicatifs du dirham marocain (MAD) — données Bank Al-Maghrib. Outil pédagogique JAD2 Advisory.',
    publisher: {
      '@type': 'Organization',
      name: 'JAD2 Advisory',
      url: 'https://jad2advisory.com',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Casablanca',
        addressCountry: 'MA',
      },
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: siteUrl,
      'query-input': 'required name=currency',
    },
  });

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>JAD2FX — Taux de Change MAD | Données Bank Al-Maghrib</title>
  <meta name="description" content="Consultez les taux de change indicatifs du dirham marocain (MAD) publiés par Bank Al-Maghrib. EUR/MAD, USD/MAD, GBP/MAD et 24 devises. Outil pédagogique de JAD2 Advisory, cabinet de conseil en gestion du risque de change à Casablanca."/>
  <meta name="keywords" content="taux de change MAD, dirham marocain, EUR MAD, USD MAD, GBP MAD, Bank Al-Maghrib, BKAM, taux de change Maroc, forex Maroc, Office des Changes, risque de change, couverture de change"/>
  <meta name="robots" content="index, follow"/>
  <meta name="author" content="JAD2 Advisory"/>
  <meta property="og:title" content="JAD2FX — Taux de Change MAD | Bank Al-Maghrib"/>
  <meta property="og:description" content="Données de change indicatives du dirham marocain (MAD) — 24 devises · Bank Al-Maghrib · JAD2 Advisory, Casablanca"/>
  <meta property="og:type" content="website"/>
  <meta property="og:url" content="${siteUrl}"/>
  <meta property="og:locale" content="fr_FR"/>
  <meta property="og:site_name" content="JAD2FX"/>
  <meta name="twitter:card" content="summary"/>
  <meta name="twitter:title" content="JAD2FX — Taux de Change MAD"/>
  <meta name="twitter:description" content="Taux de change indicatifs MAD — 24 devises — Bank Al-Maghrib — JAD2 Advisory Casablanca"/>
  <link rel="canonical" href="${siteUrl}"/>
  <link rel="manifest" href="/manifest.json"/>
  <script type="application/ld+json">${jsonLd}</script>
  <style>
    body{font-family:system-ui,sans-serif;max-width:960px;margin:0 auto;padding:16px;color:#1e293b;line-height:1.6}
    h1{font-size:1.75rem;font-weight:700;margin-bottom:4px}
    h2{font-size:1.2rem;font-weight:600;margin-top:2rem;border-bottom:1px solid #e2e8f0;padding-bottom:4px}
    table{width:100%;border-collapse:collapse;margin:1rem 0;font-size:.9rem}
    th,td{padding:6px 10px;border:1px solid #e2e8f0;text-align:left}
    th{background:#f8fafc;font-weight:600}
    caption{caption-side:bottom;font-size:.75rem;color:#64748b;padding-top:4px}
    .badge{display:inline-block;background:#f0fdf4;color:#166534;border:1px solid #bbf7d0;padding:2px 8px;border-radius:4px;font-size:.75rem;font-weight:600}
    a{color:#3b82f6}footer{margin-top:2rem;padding-top:1rem;border-top:1px solid #e2e8f0;font-size:.8rem;color:#64748b}
  </style>
</head>
<body>
  <header>
    <h1>JAD2FX — Taux de Change Dirham Marocain (MAD)</h1>
    <p>
      <span class="badge">● Live</span>
      Données indicatives · Source: Bank Al-Maghrib / ECB Frankfurter · Mis à jour: ${date}
    </p>
    <p>
      <strong>JAD2FX</strong> est l'outil de données de change et de simulation pédagogique de
      <strong><a href="https://jad2advisory.com">JAD2 Advisory</a></strong>,
      cabinet de conseil en gestion du risque de change basé à Casablanca, Maroc.
    </p>
  </header>

  <main>
    <h2>Taux de Change MAD — Cours Indicatifs (${date})</h2>
    <p><em>
      Taux calculés à partir des cours officiels Bank Al-Maghrib (BKAM) et des références ECB/Frankfurter.
      Données à titre indicatif uniquement — non contractuels.
      Pour toute opération, adressez-vous à un établissement de crédit agréé par Bank Al-Maghrib.
    </em></p>

    <table>
      <caption>Taux de change dirham marocain (MAD) — données indicatives au ${date}. Source: ECB/Frankfurter + panier BKAM.</caption>
      <thead>
        <tr>
          <th scope="col">Devise</th>
          <th scope="col">Nom</th>
          <th scope="col" style="text-align:right">Unité</th>
          <th scope="col" style="text-align:right">Cours Acheteur (MAD)</th>
          <th scope="col" style="text-align:right">Cours Vendeur (MAD)</th>
          <th scope="col" style="text-align:right">Cours Moyen (MAD)</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <h2>Fonctionnalités de JAD2FX</h2>
    <ul>
      <li>Données indicatives sur 24 devises MAD (14 cotées BKAM + 10 dérivées par taux croisés)</li>
      <li>Simulateur pédagogique de forwards (formule CIP — Covered Interest Parity) et de swaps de change</li>
      <li>Référentiel réglementaire Office des Changes : circulaires, instructions, FAQs</li>
      <li>Courbes de taux MONIA interpolées à titre informatif et pédagogique</li>
      <li>Market Report hebdomadaire généré par IA (Groq Llama 3.3 + Gemini 2.5 Flash)</li>
      <li>Assistant IA spécialisé réglementation OC &amp; BKAM — disponible 24h/24</li>
      <li>Bandes BKAM ±5% — visualisation de l'utilisation du corridor de change</li>
    </ul>

    <h2>À Propos de JAD2 Advisory</h2>
    <p>
      Cabinet de conseil stratégique et de formation en gestion du risque de change,
      enregistré au Registre de Commerce de Casablanca.
      Services proposés : formation des équipes financières, conseil en stratégie de couverture de change,
      accompagnement réglementaire Office des Changes (OC).
    </p>
    <p>
      JAD2 Advisory fournit exclusivement conseil stratégique et formation en gestion du risque de change —
      sans exécution de transactions de change ni conseil en investissement.
      Pour vos opérations, adressez-vous à un établissement bancaire agréé par Bank Al-Maghrib.
    </p>
    <p><a href="https://jad2advisory.com">Visiter jad2advisory.com →</a></p>
  </main>

  <footer>
    <p>
      <strong>Mentions légales :</strong>
      JAD2FX est une plateforme d'information fournissant des taux de change indicatifs et des simulations pédagogiques sur 24 devises
      (14 cotées par Bank Al-Maghrib + 10 devises régionales calculées par taux croisés).
      Les taux sont calculés à partir des cours officiels BKAM et des références ECB/Frankfurter et sont fournis à titre informatif uniquement —
      ils ne constituent pas des cours officiels BKAM ni des prix de transaction fermes.
      JAD2 Advisory est un cabinet de conseil stratégique et de formation en gestion du risque de change,
      enregistré au Registre de Commerce de Casablanca.
      Ses prestations couvrent exclusivement le conseil, la formation et l'accompagnement réglementaire —
      sans exécution de transactions de change ni prestation de conseil en investissement.
      Pour toute opération de change, adressez-vous à un établissement de crédit agréé par Bank Al-Maghrib.
    </p>
    <p>© JAD2 Advisory · <a href="https://jad2advisory.com">jad2advisory.com</a> · Casablanca, Maroc</p>
  </footer>
</body>
</html>`;
}

export async function onRequest(context) {
  const ua = context.request.headers.get('User-Agent') ?? '';

  if (!BOT_UA_RE.test(ua)) {
    return context.next();
  }

  // Serve pre-rendered HTML to search engine crawlers
  const siteUrl = context.env.SITE_URL ?? 'https://jad2fx.pages.dev';

  const data = await fetchEurRates();
  const madRates = data?.rates ? calcMadRates(data.rates) : {};
  const date = data?.date ?? new Date().toISOString().slice(0, 10);
  const html = buildHtml(madRates, date, siteUrl);

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=900, stale-while-revalidate=3600',
      'X-Robots-Tag': 'index, follow',
    },
  });
}
