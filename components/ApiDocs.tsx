import { Code, ExternalLink, Copy, Check, BookOpen } from 'lucide-react';
import { useState } from 'react';

/**
 * P4.19 — Developer API documentation.
 * OpenAPI spec, code examples (curl, JS, Python), rate limits.
 */

interface Endpoint {
  method: string;
  path: string;
  description: string;
  auth?: 'api-key' | 'public';
  example: string;
}

const ENDPOINTS: Endpoint[] = [
  {
    method: 'GET',
    path: '/api/rates',
    description: '24 currency rates vs MAD with bid/ask, change, and source.',
    auth: 'public',
    example: `curl https://api.jad2fx.com/v1/rates`,
  },
  {
    method: 'GET',
    path: '/api/rates/{ccy}',
    description: 'Single currency pair (e.g. EUR) vs MAD.',
    auth: 'public',
    example: `curl https://api.jad2fx.com/v1/rates/EUR`,
  },
  {
    method: 'GET',
    path: '/api/forward',
    description: 'Forward quote for a pair. Query params: ccy, tenor, notional, direction, markup_bps.',
    auth: 'public',
    example: `curl 'https://api.jad2fx.com/v1/forward?ccy=EUR&tenor=3M&notional=1000000&direction=BUY'`,
  },
  {
    method: 'GET',
    path: '/api/intraday/{symbol}',
    description: '1h intraday ticks (Yahoo). 5-min cache.',
    auth: 'public',
    example: `curl https://api.jad2fx.com/v1/intraday/EURMAD=X`,
  },
  {
    method: 'GET',
    path: '/api/fixing/history',
    description: 'BKAM fixing history. Up to 30 days back, 5-day forecast.',
    auth: 'public',
    example: `curl https://api.jad2fx.com/v1/fixing/history?days=10`,
  },
  {
    method: 'GET',
    path: '/api/glossary',
    description: '200+ FX/MAD/OC terms. Optional ?q= search.',
    auth: 'public',
    example: `curl 'https://api.jad2fx.com/v1/glossary?q=forward'`,
  },
  {
    method: 'GET',
    path: '/api/newsletter/subscribe',
    description: 'Subscribe an email. POST with body { email, name?, company? }.',
    auth: 'api-key',
    example: `curl -X POST 'https://api.jad2fx.com/v1/newsletter/subscribe' \\
  -H 'Content-Type: application/json' \\
  -H 'X-API-Key: jad2_xxx' \\
  -d '{"email": "treso@acme.ma", "company": "Acme"}'`,
  },
];

const OPENAPI_SPEC = {
  openapi: '3.0.3',
  info: {
    title: 'JAD2FX Public API',
    version: '1.0.0',
    description: 'Taux de change MAD, simulations forward, données OC. Free tier 100 req/jour, paid 10k req/jour.',
    contact: { email: 'api@jad2advisory.com', url: 'https://jad2advisory.com' },
    license: { name: 'Proprietary' },
  },
  servers: [{ url: 'https://api.jad2fx.com/v1', description: 'Production' }],
  paths: {
    '/rates': { get: { summary: 'List all 24 currency rates vs MAD', security: [] } },
    '/rates/{ccy}': {
      get: {
        summary: 'Single pair',
        parameters: [{ name: 'ccy', in: 'path', required: true, schema: { type: 'string' } }],
      },
    },
    '/forward': {
      get: {
        summary: 'Forward quote',
        parameters: [
          { name: 'ccy', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'tenor', in: 'query', required: true, schema: { type: 'string', enum: ['1M', '3M', '6M', '1Y'] } },
          { name: 'notional', in: 'query', required: true, schema: { type: 'number' } },
          { name: 'direction', in: 'query', required: true, schema: { type: 'string', enum: ['BUY', 'SELL'] } },
        ],
      },
    },
  },
};

export default function ApiDocs() {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const copy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1500);
    });
  };

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center gap-2">
        <Code size={14} className="text-gold-500" />
        <h1 className="text-base font-bold text-white uppercase tracking-wider">API Documentation</h1>
        <span className="text-[10px] text-slate-500 ml-auto">v1.0 · OpenAPI 3.0</span>
      </div>

      {/* Quickstart */}
      <div className="bg-navy-900 border border-navy-700 rounded-2xl p-6 space-y-3">
        <h2 className="text-sm font-bold text-white">Quickstart</h2>
        <p className="text-[12px] text-slate-300 leading-relaxed">
          Base URL: <code className="text-gold-400 font-mono">https://api.jad2fx.com/v1</code>.
          Toutes les requêtes sont <code className="font-mono">GET</code> sauf indication contraire.
          Réponses en <code className="font-mono">application/json</code> avec charset UTF-8.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className="bg-navy-950 border border-navy-800 rounded-lg p-3">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Free tier</p>
            <p className="text-sm font-bold text-emerald-400">100 req/jour</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Endpoints publics · Pas d'auth</p>
          </div>
          <div className="bg-navy-950 border border-navy-800 rounded-lg p-3">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Pro tier</p>
            <p className="text-sm font-bold text-blue-400">10 000 req/jour</p>
            <p className="text-[10px] text-slate-500 mt-0.5">API key · 99.9% SLA</p>
          </div>
          <div className="bg-navy-950 border border-navy-800 rounded-lg p-3">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Enterprise</p>
            <p className="text-sm font-bold text-gold-400">Sur devis</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Volumétrie + SLA custom</p>
          </div>
        </div>
      </div>

      {/* Endpoints */}
      <div className="bg-navy-900 border border-navy-700 rounded-2xl p-6 space-y-3">
        <h2 className="text-sm font-bold text-white">Endpoints</h2>
        <div className="space-y-2">
          {ENDPOINTS.map((e, i) => (
            <div key={i} className="bg-navy-950 border border-navy-800 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                  e.method === 'GET' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
                }`}>{e.method}</span>
                <code className="text-[12px] text-slate-200 font-mono flex-1">{e.path}</code>
                {e.auth === 'api-key' && (
                  <span className="text-[9px] text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold">
                    API KEY
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mb-2">{e.description}</p>
              <div className="relative">
                <pre className="bg-navy-900 border border-navy-700 rounded p-2.5 text-[10.5px] text-slate-300 font-mono overflow-x-auto whitespace-pre">
{e.example}
                </pre>
                <button
                  onClick={() => copy(e.example, i)}
                  className="absolute top-1.5 right-1.5 p-1 text-slate-500 hover:text-gold-400 transition-colors"
                  aria-label="Copier"
                >
                  {copiedIdx === i ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Code examples */}
      <div className="bg-navy-900 border border-navy-700 rounded-2xl p-6 space-y-3">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <BookOpen size={14} className="text-gold-500" /> Exemples d'intégration
        </h2>

        <div>
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">JavaScript / TypeScript</h3>
          <pre className="bg-navy-950 border border-navy-800 rounded p-3 text-[11px] text-slate-300 font-mono overflow-x-auto">
{`// Fetch EUR/MAD live rate
const res = await fetch('https://api.jad2fx.com/v1/rates/EUR');
const { mid, bid, ask, change24h } = await res.json();

// Build a forward curve
const fwd = await fetch(
  'https://api.jad2fx.com/v1/forward?ccy=USD&tenor=3M&notional=500000&direction=BUY',
  { headers: { 'X-API-Key': process.env.JAD2_API_KEY } }
);`}
          </pre>
        </div>

        <div>
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Python</h3>
          <pre className="bg-navy-950 border border-navy-800 rounded p-3 text-[11px] text-slate-300 font-mono overflow-x-auto">
{`import requests

r = requests.get('https://api.jad2fx.com/v1/rates/USD').json()
print(f"USD/MAD = {r['mid']:.4f} (24h: {r['change24h']:+.2f}%)")

# Forward pricing for hedge
fwd = requests.get(
    'https://api.jad2fx.com/v1/forward',
    params={'ccy': 'EUR', 'tenor': '6M', 'notional': 1_000_000, 'direction': 'SELL'},
    headers={'X-API-Key': os.environ['JAD2_API_KEY']}
).json()`}
          </pre>
        </div>
      </div>

      {/* OpenAPI download */}
      <div className="bg-navy-900 border border-navy-700 rounded-2xl p-6">
        <h2 className="text-sm font-bold text-white mb-3">OpenAPI 3.0 Spec</h2>
        <pre className="bg-navy-950 border border-navy-800 rounded p-3 text-[10.5px] text-slate-300 font-mono overflow-x-auto max-h-64">
{JSON.stringify(OPENAPI_SPEC, null, 2)}
        </pre>
        <div className="flex gap-2 mt-3">
          <a
            href={`data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(OPENAPI_SPEC, null, 2))}`}
            download="jad2fx-openapi.json"
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold bg-gold-500 text-navy-950 rounded hover:bg-gold-400 transition-colors"
          >
            <Code size={12} /> Télécharger OpenAPI JSON
          </a>
        </div>
      </div>

      {/* Auth + limits */}
      <div className="bg-navy-900 border border-navy-700 rounded-2xl p-6 space-y-3">
        <h2 className="text-sm font-bold text-white">Authentification & limites</h2>
        <ul className="text-[12px] text-slate-300 space-y-1.5 list-disc list-inside">
          <li>Endpoints <strong>publics</strong>: pas d'auth, 100 req/jour par IP.</li>
          <li>Endpoints <strong>API key</strong>: header <code className="text-gold-400">X-API-Key: jad2_xxx</code>.</li>
          <li>Rate limit: <strong>429</strong> si dépassé, avec <code className="font-mono">Retry-After</code>.</li>
          <li>Cache: 60s pour rates, 5min pour fixing, 1h pour glossary.</li>
          <li>Uptime cible: 99.9% (Pro) · 99.99% (Enterprise).</li>
        </ul>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-slate-500">
        <ExternalLink size={11} />
        Pour les questions, contactez <a href="mailto:api@jad2advisory.com" className="text-gold-400 hover:underline">api@jad2advisory.com</a>
      </div>
    </div>
  );
}
