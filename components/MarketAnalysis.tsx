import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, Minus, RefreshCw,
  Globe, BarChart3, Cpu, ExternalLink,
  ChevronDown, ChevronUp, Wifi, WifiOff,
  Building2, Truck, Wheat, Zap, ShieldAlert,
} from 'lucide-react';
import { routeQuery, LLMProvider, PROVIDER_LABELS, PROVIDER_COLORS } from '../services/llmRouter';
import { fetchCommodityQuotes } from '../services/yahooFinance';
import { useAdmin } from '../context/AdminContext';
import { DEFAULT_BASKET_CONFIG } from '../constants';
import CurrencyFlag from './CurrencyFlag';

// ─── Module-level constants & helpers ────────────────────────────────────────

const BASKET_K    = DEFAULT_BASKET_CONFIG.referenceBasketValue;
const EUR_WEIGHT  = DEFAULT_BASKET_CONFIG.eurWeight;
const USD_WEIGHT  = DEFAULT_BASKET_CONFIG.usdWeight;

const FALLBACK: Record<string, number> = {
  USD: 1.085, GBP: 0.860, CHF: 0.945, JPY: 162.5,
  CAD: 1.480, DKK: 7.460, NOK: 11.60, SEK: 11.40,
  CNY: 7.880, TRY: 36.5,  ZAR: 19.8,
};

function addGulf(r: Record<string, number>): Record<string, number> {
  const eu = r['USD'] ?? 1.085;
  return { ...r, SAR: eu / 0.266667, AED: eu / 0.272294, QAR: eu / 0.274725, KWD: eu / 3.25000 };
}

function usdMadFromEurUsd(eurUsd: number): number {
  return BASKET_K / (EUR_WEIGHT * eurUsd + USD_WEIGHT);
}

function pctChange(curr: number, prev: number | undefined): number {
  if (!prev || prev === 0) return 0;
  return ((curr - prev) / prev) * 100;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Chg({ pct }: { pct: number }) {
  const abs = Math.abs(pct);
  if (abs < 0.002) return <span className="text-slate-600 text-[10px] flex items-center gap-0.5"><Minus size={8} /> —</span>;
  const up = pct > 0;
  return (
    <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${up ? 'text-emerald-400' : 'text-rose-400'}`}>
      {up ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
      {up ? '+' : ''}{pct.toFixed(2)}%
    </span>
  );
}

function Badge({ live }: { live: boolean }) {
  return live
    ? <span className="inline-flex items-center gap-0.5 text-[8px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 rounded px-1 py-0.5"><Wifi size={6} /> LIVE</span>
    : <span className="inline-flex items-center gap-0.5 text-[8px] font-bold text-amber-400 bg-amber-950/60 border border-amber-800/50 rounded px-1 py-0.5"><WifiOff size={6} /> REF</span>;
}

interface G10Row { pair: string; rate: number; prev?: number; dec: number }
interface CommSnap { price: number; pct: number; source: string; madEquiv: number }

// ─── Component ────────────────────────────────────────────────────────────────

const MarketAnalysis: React.FC = () => {
  const { config } = useAdmin();

  const [loading,      setLoading]      = useState(true);
  const [fetchedAt,    setFetchedAt]    = useState<string | null>(null);
  const [rates,        setRates]        = useState<Record<string, number>>(addGulf(FALLBACK));
  const [prevRates,    setPrevRates]    = useState<Record<string, number> | null>(null);
  const [comms,        setComms]        = useState<Record<string, CommSnap | null>>({});
  const [aiBrief,      setAiBrief]      = useState<string | null>(null);
  const [briefProv,    setBriefProv]    = useState<LLMProvider | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefOpen,    setBriefOpen]    = useState(true);
  const [warn,         setWarn]         = useState<string | null>(null);

  const eu     = rates['USD'] ?? 1.085;
  const usdMad = usdMadFromEurUsd(eu);
  const eurMad = usdMad * eu;

  // ─── Data load ──────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true);
    setWarn(null);

    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yStr = d.toISOString().split('T')[0];

    const [todayRes, prevRes] = await Promise.allSettled([
      fetch('https://api.frankfurter.app/latest?from=EUR', { signal: AbortSignal.timeout(8000) }).then(r => r.json()),
      fetch(`https://api.frankfurter.app/${yStr}?from=EUR`,  { signal: AbortSignal.timeout(8000) }).then(r => r.json()),
    ]);

    const todayRates = addGulf(
      todayRes.status === 'fulfilled'
        ? { ...FALLBACK, ...todayRes.value.rates }
        : { ...FALLBACK }
    );
    if (todayRes.status === 'rejected') setWarn('Live FX rates unavailable — displaying reference values.');

    setPrevRates(prevRes.status === 'fulfilled'
      ? addGulf({ ...FALLBACK, ...prevRes.value.rates })
      : null);

    setRates(todayRates);
    setFetchedAt(new Date().toISOString());

    const freshEu     = todayRates['USD'] ?? 1.085;
    const freshUsdMad = usdMadFromEurUsd(freshEu);
    const freshEurMad = freshUsdMad * freshEu;

    // Commodities
    try {
      const quotes = await fetchCommodityQuotes(freshUsdMad, config.corsProxyUrl);
      const snap: Record<string, CommSnap | null> = {};
      for (const sym of ['BZ=F', 'GC=F', 'HG=F', 'ZW=F', 'ZC=F', 'SB=F']) {
        const q = quotes.find(x => x.symbol === sym);
        snap[sym] = q ? { price: q.price, pct: q.changePercent, source: q.source, madEquiv: q.madEquiv } : null;
      }
      setComms(snap);
    } catch { /* optional */ }

    // AI Brief
    setBriefLoading(true);
    setAiBrief(null);
    setBriefProv(null);
    try {
      const gbpUsd = freshEu / (todayRates['GBP'] ?? 0.860);
      const usdJpy = (todayRates['JPY'] ?? 162.5) / freshEu;
      const usdChf = (todayRates['CHF'] ?? 0.945) / freshEu;
      const usdCad = (todayRates['CAD'] ?? 1.480) / freshEu;
      const usdTry = (todayRates['TRY'] ?? 36.5)  / freshEu;
      const sarMad = 0.266667 * freshUsdMad;
      const aedMad = 0.272294 * freshUsdMad;

      const nokMad = freshEurMad / (todayRates['NOK'] ?? 11.60);
      const sekMad = freshEurMad / (todayRates['SEK'] ?? 11.40);
      const dkkMad = freshEurMad / (todayRates['DKK'] ?? 7.460);

      const result = await routeQuery({
        strategy: 'quality-first',
        systemPrompt: `You are the chief FX strategist at a Tier-1 MENA investment bank. Write terse, data-dense institutional commentary. Strict rules:
— Anchor EVERY claim to the live numbers provided. Do not state generic facts (e.g. "the band is ±5%" or "EUR has 60% weight") — those are known to the reader.
— Quantify every observation: use basis-point moves, percentage changes, level vs prior range.
— Do NOT give investment advice, price targets, or "you should hedge."
— Write in the same language as the user message (French unless specified).`,
        userMessage: `Rédige un brief institutionnel (3 paragraphes, max 300 mots) à partir de ce snapshot temps réel:

G10 FX: EUR/USD ${freshEu.toFixed(4)} | GBP/USD ${gbpUsd.toFixed(4)} | USD/JPY ${usdJpy.toFixed(2)} | USD/CHF ${usdChf.toFixed(4)} | USD/CAD ${usdCad.toFixed(4)} | USD/TRY ${usdTry.toFixed(2)}
Nordiques (EUR-cross): EUR/NOK ${(todayRates['NOK'] ?? 11.60).toFixed(2)} | EUR/SEK ${(todayRates['SEK'] ?? 11.40).toFixed(2)} | EUR/DKK ${(todayRates['DKK'] ?? 7.460).toFixed(3)}
MAD: USD/MAD ${freshUsdMad.toFixed(4)} | EUR/MAD ${freshEurMad.toFixed(4)} | NOK/MAD ${nokMad.toFixed(4)} | SEK/MAD ${sekMad.toFixed(4)} | DKK/MAD ${dkkMad.toFixed(4)} | SAR/MAD ${sarMad.toFixed(4)} | AED/MAD ${aedMad.toFixed(4)}
PANIER: K=${BASKET_K} · EUR/MAD_central théorique ≈ ${(BASKET_K * freshEu).toFixed(4)} vs actuel ${freshEurMad.toFixed(4)}

§1 — DRIVERS G10 ACTUELS: Quels mouvements G10 spécifiques expliquent la configuration EUR/USD aujourd'hui ? Divergences de politique monétaire BCE/Fed quantifiées. Impact mécanique calculé sur la parité USD/MAD.
§2 — MARCHÉ MAD: Position du dirham dans la bande (utilisation calculée). Flux structurels dominants cette semaine (MRE saisonnalité, recettes OCP, facture pétrolière) et leur sens sur la pression de change.
§3 — POINTS DE VIGILANCE CORPORATE: 2-3 thèmes concrets pour les trésoriers marocains — asymétrie de risque EUR vs USD sur le panier, exposition NOK/SEK des importateurs de bois-papier-équipements nordiques (NOK liée au Brent = double exposition), opportunités de refacturation Gulf (AED/SAR stables).

Terminer obligatoirement par: "⚠️ Données indicatives uniquement — pas de conseil en investissement (Loi 44-12/AMMC). Conseil: jad2advisory.com"`,
        maxTokens: 800,
        temperature: 0.25,
      });
      setAiBrief(result.text);
      setBriefProv(result.provider);
    } catch {
      setAiBrief(null);
    } finally {
      setBriefLoading(false);
    }

    setLoading(false);
  }, [config.corsProxyUrl]);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── Derived data for rendering ──────────────────────────────────────────────

  const g10: G10Row[] = [
    { pair: 'EUR/USD', rate: eu,                                                  prev: prevRates?.['USD'],                                                     dec: 4 },
    { pair: 'GBP/USD', rate: eu / (rates['GBP'] ?? 0.860),                       prev: prevRates ? (prevRates['USD'] ?? eu) / (prevRates['GBP'] ?? 0.860) : undefined, dec: 4 },
    { pair: 'USD/JPY', rate: (rates['JPY'] ?? 162.5) / eu,                       prev: prevRates ? (prevRates['JPY'] ?? 162.5) / (prevRates['USD'] ?? eu) : undefined, dec: 2 },
    { pair: 'USD/CHF', rate: (rates['CHF'] ?? 0.945) / eu,                       prev: prevRates ? (prevRates['CHF'] ?? 0.945) / (prevRates['USD'] ?? eu) : undefined, dec: 4 },
    { pair: 'USD/CAD', rate: (rates['CAD'] ?? 1.480) / eu,                       prev: prevRates ? (prevRates['CAD'] ?? 1.480) / (prevRates['USD'] ?? eu) : undefined, dec: 4 },
    { pair: 'EUR/GBP', rate: rates['GBP'] ?? 0.860,                              prev: prevRates?.['GBP'],                                                     dec: 4 },
    { pair: 'EUR/CHF', rate: rates['CHF'] ?? 0.945,                              prev: prevRates?.['CHF'],                                                     dec: 4 },
    { pair: 'EUR/JPY', rate: rates['JPY'] ?? 162.5,                              prev: prevRates?.['JPY'],                                                     dec: 2 },
    // Scandinavian pairs — essential for Moroccan wood/paper/equipment importers
    { pair: 'EUR/NOK', rate: rates['NOK'] ?? 11.60,                              prev: prevRates?.['NOK'],                                                     dec: 2 },
    { pair: 'EUR/SEK', rate: rates['SEK'] ?? 11.40,                              prev: prevRates?.['SEK'],                                                     dec: 2 },
    { pair: 'EUR/DKK', rate: rates['DKK'] ?? 7.460,                              prev: prevRates?.['DKK'],                                                     dec: 3 },
  ];

  const madCrosses = [
    { label: 'USD / MAD', rate: usdMad, prev: prevRates ? usdMadFromEurUsd(prevRates['USD'] ?? eu) : undefined, primary: true },
    { label: 'EUR / MAD', rate: eurMad, prev: prevRates ? usdMadFromEurUsd(prevRates['USD'] ?? eu) * (prevRates['USD'] ?? eu) : undefined, primary: true },
    { label: 'GBP / MAD', rate: usdMad * eu / (rates['GBP'] ?? 0.860),
      prev: prevRates ? usdMadFromEurUsd(prevRates['USD'] ?? eu) * (prevRates['USD'] ?? eu) / (prevRates['GBP'] ?? 0.860) : undefined },
    { label: 'CHF / MAD', rate: usdMad * eu / (rates['CHF'] ?? 0.945),
      prev: prevRates ? usdMadFromEurUsd(prevRates['USD'] ?? eu) * (prevRates['USD'] ?? eu) / (prevRates['CHF'] ?? 0.945) : undefined },
    { label: 'JPY ×100 / MAD', rate: usdMad * eu / (rates['JPY'] ?? 162.5) * 100,
      prev: prevRates ? usdMadFromEurUsd(prevRates['USD'] ?? eu) * (prevRates['USD'] ?? eu) / (prevRates['JPY'] ?? 162.5) * 100 : undefined },
    { label: 'CAD / MAD', rate: usdMad * eu / (rates['CAD'] ?? 1.480),
      prev: prevRates ? usdMadFromEurUsd(prevRates['USD'] ?? eu) * (prevRates['USD'] ?? eu) / (prevRates['CAD'] ?? 1.480) : undefined },
    { label: 'CNY / MAD', rate: usdMad * eu / (rates['CNY'] ?? 7.880),
      prev: prevRates ? usdMadFromEurUsd(prevRates['USD'] ?? eu) * (prevRates['USD'] ?? eu) / (prevRates['CNY'] ?? 7.880) : undefined },
    // Scandinavian — NOK/SEK/DKK are all EUR-cross pairs from Frankfurter
    { label: 'NOK / MAD', rate: eurMad / (rates['NOK'] ?? 11.60),
      prev: prevRates ? usdMadFromEurUsd(prevRates['USD'] ?? eu) * (prevRates['USD'] ?? eu) / (prevRates['NOK'] ?? 11.60) : undefined },
    { label: 'SEK / MAD', rate: eurMad / (rates['SEK'] ?? 11.40),
      prev: prevRates ? usdMadFromEurUsd(prevRates['USD'] ?? eu) * (prevRates['USD'] ?? eu) / (prevRates['SEK'] ?? 11.40) : undefined },
    { label: 'DKK / MAD', rate: eurMad / (rates['DKK'] ?? 7.460),
      prev: prevRates ? usdMadFromEurUsd(prevRates['USD'] ?? eu) * (prevRates['USD'] ?? eu) / (prevRates['DKK'] ?? 7.460) : undefined },
  ];

  const gulfCrosses = [
    { countryCode: 'sa', label: 'SAR / MAD', rate: 0.266667 * usdMad, note: 'Hard peg 3.75/USD' },
    { countryCode: 'ae', label: 'AED / MAD', rate: 0.272294 * usdMad, note: 'Hard peg 3.6725/USD' },
    { countryCode: 'qa', label: 'QAR / MAD', rate: 0.274725 * usdMad, note: 'Hard peg 3.64/USD' },
    { countryCode: 'kw', label: 'KWD / MAD', rate: 3.25000  * usdMad, note: 'Managed float basket' },
  ];

  // NOK/SEK/DKK: critical for Moroccan importers of wood, paper, pharma, equipment
  const nordCrosses = [
    { countryCode: 'no', label: 'NOK / MAD', rate: eurMad / (rates['NOK'] ?? 11.60), note: 'Lié au Brent — corr EUR ~70%' },
    { countryCode: 'se', label: 'SEK / MAD', rate: eurMad / (rates['SEK'] ?? 11.40), note: 'Riksbank — corr EUR ~75%' },
    { countryCode: 'dk', label: 'DKK / MAD', rate: eurMad / (rates['DKK'] ?? 7.460), note: 'Peg EUR quasi-fixe (±2.25%)' },
  ];

  const emPeers = [
    { countryCode: 'eg', label: 'USD/EGP', rate: 53.5,                                note: 'CBE float (ref)' },
    { countryCode: 'tr', label: 'USD/TRY', rate: (rates['TRY'] ?? 36.5) / eu,         note: 'CBRT normalisation' },
    { countryCode: 'za', label: 'USD/ZAR', rate: (rates['ZAR'] ?? 19.8) / eu,         note: 'Commodity-linked' },
    { countryCode: 'dz', label: 'USD/DZD', rate: 134.5,                               note: 'Parallel market gap' },
  ];

  // Morocco corporate watchpoints — static but data-contextual
  const corpWatchpoints = [
    {
      icon: <Zap size={13} className="text-amber-400 shrink-0 mt-0.5" />,
      title: 'Importateurs énergie',
      sub: 'Brent & WTI',
      body: `Brent actuel ${comms['BZ=F'] ? `$${comms['BZ=F']!.price.toFixed(2)}/bbl ≈ ${comms['BZ=F']!.madEquiv.toFixed(0)} MAD/bbl` : '—'}. Toute appréciation USD/MAD amplifie la facture énergétique. Couverture forward recommandée (Circ. OC 01/2024).`,
    },
    {
      icon: <Wheat size={13} className="text-lime-400 shrink-0 mt-0.5" />,
      title: 'Import alimentaire',
      sub: 'Blé & Maïs',
      body: `Blé ${comms['ZW=F'] ? `$${comms['ZW=F']!.price.toFixed(2)}/bu ≈ ${(comms['ZW=F']!.madEquiv).toFixed(2)} MAD/bu` : '—'}. COSUMAR, minoteries et éleveurs exposés aux fluctuations USD et aux subventions OC.`,
    },
    {
      icon: <Truck size={13} className="text-blue-400 shrink-0 mt-0.5" />,
      title: 'Export OCP / Phosphates',
      sub: 'Revenus USD/EUR',
      body: `OCP facture principalement en USD. Un USD/MAD élevé (${usdMad.toFixed(4)}) améliore les revenus en MAD. Risque de retournement à surveiller sur les échéances Q3-Q4.`,
    },
    {
      icon: <Building2 size={13} className="text-purple-400 shrink-0 mt-0.5" />,
      title: 'PME Gulf (AED/SAR)',
      sub: 'Prestataires & sous-traitants',
      body: `AED/MAD ${(0.272294 * usdMad).toFixed(4)} — SAR/MAD ${(0.266667 * usdMad).toFixed(4)}. Facturation Gulf en AED ou SAR expose à la variation USD/MAD (pégs stables mais MAD peut varier). Instruments de couverture disponibles via intermédiaires agréés BAM.`,
    },
    {
      icon: <ShieldAlert size={13} className="text-rose-400 shrink-0 mt-0.5" />,
      title: 'Risque EUR/USD',
      sub: 'Panier BKAM 60% EUR',
      body: `EUR/USD ${eu.toFixed(4)}. Le panier MAD pondère l'EUR à 60% : chaque 1% de variation EUR/USD déplace USD/MAD d'env. 0.6%. Impact direct sur les contrats import libellés en EUR.`,
    },
    {
      icon: <BarChart3 size={13} className="text-gold-400 shrink-0 mt-0.5" />,
      title: 'Couverture réglementaire',
      sub: 'Circulaire OC 01/2024',
      body: 'Les PME peuvent couvrir jusqu\'à 100% de la valeur sous-jacente import/export en forwards. Durée max 12 mois. Seuls les intermédiaires agréés BAM peuvent exécuter ces opérations.',
    },
  ];

  const todayStr = new Date().toLocaleDateString('fr-MA', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="max-w-7xl mx-auto space-y-5 animate-fade-in">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-3">
            <Globe size={20} className="text-gold-400" />
            Global Market Intelligence
          </h2>
          <p className="text-slate-400 text-sm mt-0.5">
            G10 FX · MAD Crosses · Matières Premières · Guide Corporates &amp; PME
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {fetchedAt && (
            <div className="text-right">
              <p className="text-[10px] text-slate-500 font-mono">{new Date(fetchedAt).toLocaleTimeString()}</p>
              <p className="text-[9px] text-slate-600">{todayStr} · ECB/Frankfurter</p>
            </div>
          )}
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-semibold bg-navy-800 border border-navy-600 text-slate-300 hover:text-white hover:border-gold-500/50 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
          >
            <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
            Actualiser
          </button>
        </div>
      </div>

      {warn && (
        <div className="flex items-center gap-2 bg-amber-950/40 border border-amber-800/40 rounded-lg px-4 py-2.5">
          <WifiOff size={12} className="text-amber-400 shrink-0" />
          <p className="text-amber-300/80 text-xs">{warn}</p>
        </div>
      )}

      {/* ── G10 FX Ticker ───────────────────────────────────────────────────── */}
      <div className="bg-[#0b1a30] border border-navy-700/50 rounded-xl overflow-hidden">
        <div className="px-4 py-2 border-b border-navy-700/40 flex items-center gap-2">
          <Globe size={11} className="text-gold-400" />
          <span className="text-[10px] font-bold text-gold-400 uppercase tracking-widest">G10 FX Monitor</span>
          <span className="text-[9px] text-slate-600 ml-auto">ECB Indicatif · {todayStr}</span>
        </div>
        <div className="overflow-x-auto">
          <div className="flex gap-px min-w-max bg-navy-800/20">
            {g10.map(({ pair, rate, prev, dec }) => {
              const chg = pctChange(rate, prev);
              const up  = chg > 0;
              const flat = Math.abs(chg) < 0.002;
              return (
                <div key={pair} className="flex flex-col items-center py-3 px-4 bg-[#0b1a30] hover:bg-navy-800/70 transition min-w-[100px] border-r border-navy-800/50 last:border-r-0">
                  <span className="text-[9px] font-bold text-slate-500 tracking-widest mb-1">{pair}</span>
                  <span className="text-[14px] font-mono font-bold text-white">{rate.toFixed(dec)}</span>
                  <span className={`text-[9px] font-semibold flex items-center gap-0.5 mt-0.5 ${flat ? 'text-slate-600' : up ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {flat ? <Minus size={7} /> : up ? <TrendingUp size={7} /> : <TrendingDown size={7} />}
                    {flat ? '—' : `${up ? '+' : ''}${chg.toFixed(2)}%`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── MAD Crosses + Gulf/EM ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* MAD Crosses — 3/5 cols */}
        <div className="lg:col-span-3 bg-[#0b1a30] border border-navy-700/50 rounded-xl overflow-hidden">
          <div className="px-4 py-2 border-b border-navy-700/40 flex items-center gap-2">
            <BarChart3 size={11} className="text-gold-400" />
            <span className="text-[10px] font-bold text-gold-400 uppercase tracking-widest">Cours MAD (Dirham)</span>
            <span className="text-[9px] text-slate-600 ml-auto">Panier K={BASKET_K} · {EUR_WEIGHT*100}%EUR+{USD_WEIGHT*100}%USD</span>
          </div>
          <div className="divide-y divide-navy-800/40">
            {madCrosses.map(({ label, rate, prev, primary }) => {
              const chg = pctChange(rate, prev ?? undefined);
              return (
                <div key={label} className={`flex items-center justify-between px-4 py-2.5 ${primary ? 'bg-navy-800/25' : ''}`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[11px] font-mono text-slate-400 w-28 shrink-0">{label}</span>
                    {primary && <span className="text-[8px] font-bold text-gold-500 bg-gold-950/50 border border-gold-800/40 rounded px-1 shrink-0">PANIER</span>}
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className={`font-mono font-bold ${primary ? 'text-base text-white' : 'text-[13px] text-slate-200'}`}>
                      {rate.toFixed(4)}
                    </span>
                    <div className="w-16 text-right">
                      {prev !== undefined ? <Chg pct={chg} /> : <span className="text-slate-700 text-[10px]">—</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="px-4 py-2.5 bg-navy-800/20 border-t border-navy-700/40">
            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">Composition Panier BKAM · Bande ±5%</p>
            <div className="flex rounded-full overflow-hidden h-1.5 w-full">
              <div className="bg-blue-500 h-full" style={{ width: '60%' }} />
              <div className="bg-emerald-500 h-full" style={{ width: '40%' }} />
            </div>
            <div className="flex justify-between text-[9px] text-slate-600 mt-1">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />EUR 60%</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />USD 40%</span>
            </div>
          </div>
        </div>

        {/* Gulf + EM — 2/5 cols */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#0b1a30] border border-navy-700/50 rounded-xl overflow-hidden">
            <div className="px-4 py-2 border-b border-navy-700/40 flex items-center gap-2">
              <Globe size={11} className="text-gold-400" />
              <span className="text-[10px] font-bold text-gold-400 uppercase tracking-widest">Gulf MAD</span>
              <span className="text-[9px] text-slate-600 ml-auto">Parités USD fixes</span>
            </div>
            <div className="grid grid-cols-2 gap-px bg-navy-800/30">
              {gulfCrosses.map(({ countryCode, label, rate, note }) => (
                <div key={label} className="bg-[#0b1a30] px-3 py-3">
                  <p className="text-[10px] text-slate-500 flex items-center gap-1"><CurrencyFlag countryCode={countryCode} size="xs" /> {label}</p>
                  <p className="text-sm font-mono font-bold text-white mt-0.5">{rate.toFixed(4)}</p>
                  <p className="text-[8px] text-slate-700 mt-0.5 leading-tight">{note}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Scandinavian MAD crosses — bois, papier, équipements */}
          <div className="bg-[#0b1a30] border border-navy-700/50 rounded-xl overflow-hidden">
            <div className="px-4 py-2 border-b border-navy-700/40 flex items-center gap-2">
              <Globe size={11} className="text-blue-400" />
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Nordiques MAD</span>
              <span className="text-[9px] text-slate-600 ml-auto">Bois · Papier · Pharma</span>
            </div>
            <div className="grid grid-cols-1 gap-px bg-navy-800/30">
              {nordCrosses.map(({ countryCode, label, rate, note }) => (
                <div key={label} className="bg-[#0b1a30] px-3 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-500 flex items-center gap-1"><CurrencyFlag countryCode={countryCode} size="xs" /> {label}</p>
                    <p className="text-[8px] text-slate-700 leading-tight">{note}</p>
                  </div>
                  <p className="text-sm font-mono font-bold text-white">{rate.toFixed(4)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0b1a30] border border-navy-700/50 rounded-xl overflow-hidden">
            <div className="px-4 py-2 border-b border-navy-700/40 flex items-center gap-2">
              <Globe size={11} className="text-slate-500" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">EM Pairs</span>
            </div>
            {emPeers.map(({ countryCode, label, rate, note }) => (
              <div key={label} className="flex items-center justify-between px-4 py-2 border-b border-navy-800/40 last:border-b-0">
                <div className="flex items-center gap-2">
                  <CurrencyFlag countryCode={countryCode} size="sm" />
                  <div>
                    <p className="text-[10px] font-mono text-slate-300">{label}</p>
                    <p className="text-[8px] text-slate-600">{note}</p>
                  </div>
                </div>
                <span className="font-mono text-[12px] text-slate-200">{rate.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Morocco Macro Drivers (Commodities) ─────────────────────────────── */}
      <div className="bg-[#0b1a30] border border-navy-700/50 rounded-xl overflow-hidden">
        <div className="px-4 py-2 border-b border-navy-700/40 flex items-center gap-2">
          <BarChart3 size={11} className="text-gold-400" />
          <span className="text-[10px] font-bold text-gold-400 uppercase tracking-widest">Matières Premières — Indicateurs Macro Maroc</span>
          <span className="text-[9px] text-slate-600 ml-auto">Yahoo Finance · CORS proxy</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-navy-800/30">
          {[
            { sym: 'BZ=F', label: 'Brent',   flag: '⚡', unit: '/bbl', note: 'Import énergie ~100%' },
            { sym: 'GC=F', label: 'Or',       flag: '🥇', unit: '/oz',  note: 'Réserves BAM' },
            { sym: 'HG=F', label: 'Cuivre',   flag: '🔧', unit: '/lb',  note: 'Nexans · câbliers' },
            { sym: 'ZW=F', label: 'Blé',      flag: '🌾', unit: '/bu',  note: 'MENA top-5 import' },
            { sym: 'ZC=F', label: 'Maïs',     flag: '🌽', unit: '/bu',  note: 'Aliment bétail' },
            { sym: 'SB=F', label: 'Sucre',    flag: '🍬', unit: '/lb',  note: 'COSUMAR · subvention' },
          ].map(({ sym, label, flag, unit, note }) => {
            const d = comms[sym];
            return (
              <div key={sym} className="bg-[#0b1a30] px-3 py-4">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">{flag} {label}</p>
                  {d ? <Badge live={d.source === 'LIVE'} /> : null}
                </div>
                {d ? (
                  <>
                    <p className="text-base font-mono font-bold text-white">
                      ${d.price < 5 ? d.price.toFixed(4) : d.price < 100 ? d.price.toFixed(2) : d.price.toFixed(0)}
                      <span className="text-[9px] text-slate-600 font-normal">{unit}</span>
                    </p>
                    <div className="flex flex-col gap-0.5 mt-1">
                      <Chg pct={d.pct} />
                      <span className="text-[9px] text-slate-600">≈{d.madEquiv.toFixed(1)} MAD</span>
                    </div>
                    <p className="text-[8px] text-slate-700 mt-1.5 leading-tight">{note}</p>
                  </>
                ) : (
                  <div className="flex items-center gap-1 text-slate-600 text-[10px] mt-2">
                    {loading ? <RefreshCw size={9} className="animate-spin" /> : <WifiOff size={9} />}
                    {loading ? 'Chargement...' : 'N/D'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Guide Corporates & PME ───────────────────────────────────────────── */}
      <div className="bg-[#0b1a30] border border-navy-700/50 rounded-xl overflow-hidden">
        <div className="px-4 py-2 border-b border-navy-700/40 flex items-center gap-2">
          <Building2 size={11} className="text-gold-400" />
          <span className="text-[10px] font-bold text-gold-400 uppercase tracking-widest">Points de Vigilance — Corporates &amp; PME Maroc</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-navy-800/30">
          {corpWatchpoints.map((wp, i) => (
            <div key={i} className="bg-[#0b1a30] px-4 py-4">
              <div className="flex items-start gap-2 mb-2">
                {wp.icon}
                <div>
                  <p className="text-[11px] font-bold text-slate-200">{wp.title}</p>
                  <p className="text-[9px] text-slate-500">{wp.sub}</p>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">{wp.body}</p>
            </div>
          ))}
        </div>
        <div className="px-4 py-2.5 border-t border-navy-700/40 bg-navy-800/10">
          <p className="text-[9px] text-slate-600">
            Circulaire OC n° 01/2024 · Instruction BKAM n° 03/2021 · Dahir n° 1-73-318 ·
            Pour couverture structurée: <span className="text-gold-600">jad2advisory.com</span>
          </p>
        </div>
      </div>

      {/* ── AI Market Brief ─────────────────────────────────────────────────── */}
      <div className="bg-[#0b1a30] border border-navy-700/50 rounded-xl overflow-hidden">
        <button
          onClick={() => setBriefOpen(o => !o)}
          className="w-full px-4 py-3 border-b border-navy-700/40 flex items-center gap-2 hover:bg-navy-800/30 transition text-left"
        >
          <Cpu size={11} className="text-gold-400" />
          <span className="text-[10px] font-bold text-gold-400 uppercase tracking-widest">Synthèse IA — Market Brief</span>
          {briefProv && (
            <span className={`ml-2 text-[8px] font-bold px-1.5 py-0.5 rounded border ${PROVIDER_COLORS[briefProv]}`}>
              {PROVIDER_LABELS[briefProv]}
            </span>
          )}
          <span className="text-[9px] text-slate-600 ml-1">Auto-généré · Llama 3.3-70B</span>
          <span className="ml-auto text-slate-500">
            {briefOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </span>
        </button>
        {briefOpen && (
          <div className="px-6 py-5">
            {briefLoading ? (
              <div className="flex items-center gap-3">
                <Cpu size={13} className="animate-pulse text-gold-400" />
                <span className="text-slate-400 text-sm">Génération du brief institutionnel en cours...</span>
              </div>
            ) : aiBrief ? (
              <div className="space-y-3">
                {aiBrief.split(/\n{2,}/).map((para, i) => (
                  <p key={i} className="text-slate-300 text-sm leading-relaxed">{para}</p>
                ))}
              </div>
            ) : (
              <p className="text-slate-600 text-sm">
                Configurez une clé API (Groq, Gemini, OpenRouter) dans Admin → Système pour activer les briefs IA.
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Sources & Disclaimer ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pb-1">
        {[
          { href: 'https://www.bkam.ma/en/Markets/Key-indicators/Foreign-exchange-market', label: 'BKAM Fixing Officiel' },
          { href: 'https://www.oc.gov.ma', label: 'Office des Changes' },
          { href: 'https://api.frankfurter.app', label: 'Frankfurter / BCE' },
        ].map(({ href, label }) => (
          <a key={label} href={href} target="_blank" rel="noreferrer"
            className="flex items-center gap-1 text-[10px] font-medium text-slate-600 hover:text-gold-400 transition">
            <ExternalLink size={9} /> {label}
          </a>
        ))}
        <span className="text-[9px] text-slate-700 ml-auto">
          Taux indicatifs uniquement · Pas de conseil en investissement · Non agréé AMMC/BAM ·{' '}
          <span className="text-gold-700">jad2advisory.com</span>
        </span>
      </div>
    </div>
  );
};

export default MarketAnalysis;
