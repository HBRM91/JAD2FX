import React, { useState, useMemo, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import CurrencyFlag from './CurrencyFlag';
import {
  Calculator, TrendingUp, Clock, ChevronDown, RotateCw,
  AlertTriangle, BookOpen, Printer,
} from 'lucide-react';
import { BKAM_CURRENCIES } from '../constants';
import { ForwardQuote } from '../types';
import ComplianceBanner from './ComplianceBanner';
import {
  STANDARD_TENORS,
  buildForwardQuote,
  buildForwardCurve,
  settlementDate,
  customDateToYears,
} from '../services/forwardEngine';
import { getDefaultCurve, FORWARD_TENORS } from '../services/interestRates';
import { useAdmin } from '../context/AdminContext';
import { useI18n } from '../context/I18nContext';
import { logSimTelemetry } from '../services/telemetry';
import TimeWindowSelector, { getStartDateForWindow, type TimeWindow } from './TimeWindowSelector';

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function fmt4(v: number) { return v.toFixed(4); }
function fmt2(v: number) { return v.toFixed(2); }
function fmtPips(v: number) { return (v >= 0 ? '+' : '') + v.toFixed(2); }
function fmtPct(v: number) { return (v * 100).toFixed(3) + '%'; }
function fmtMAD(v: number) { return new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 }).format(v); }

type Tab = 'PRICER' | 'CURVE' | 'MTM' | 'SPREADS';

// â”€â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function TermRow({ label, value, unit, highlight, color }: {
  label: string; value: string; unit?: string; highlight?: boolean; color?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-navy-800/80 last:border-0">
      <span className="text-[11px] text-slate-500 uppercase tracking-wider">{label}</span>
      <span className={`text-sm font-mono font-bold ${color ?? (highlight ? 'text-gold-400' : 'text-white')}`}>
        {value}{unit ? <span className="text-slate-500 ml-1 font-normal text-xs">{unit}</span> : null}
      </span>
    </div>
  );
}

function SpreadsTab({ spot, currency }: { spot: number; currency: string }) {
  const [near, setNear] = useState<{ tenor: string; rate: number; pipMultiplier: number }[]>([
    { tenor: '1M', rate: 8,  pipMultiplier: 100 },
    { tenor: '3M', rate: 22, pipMultiplier: 100 },
    { tenor: '6M', rate: 42, pipMultiplier: 100 },
    { tenor: '1Y', rate: 88, pipMultiplier: 100 },
  ]);
  return (
    <div className="space-y-4">
      <p className="text-[12px] text-slate-300 leading-relaxed">
        Comparez les forwards 1M × 3M, 1M × 6M et 1M × 1Y. Le spread reflète l'évolution attendue des taux
        directeurs sur l'horizon. Idéal pour comprendre la structure par terme (yield curve) du marché
        des changes pour votre devise.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { from: '1M', to: '3M' },
          { from: '1M', to: '6M' },
          { from: '1M', to: '1Y' },
        ].map((p) => {
          const a = near.find((x) => x.tenor === p.from)?.rate || 0;
          const b = near.find((x) => x.tenor === p.to)?.rate || 0;
          const spread = b - a;
          const color = spread > 0 ? 'text-emerald-400' : spread < 0 ? 'text-red-400' : 'text-slate-400';
          return (
            <div key={p.from + p.to} className="bg-navy-950 border border-navy-800 rounded-lg p-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{p.from} × {p.to}</p>
              <p className={`text-xl font-mono font-bold ${color}`}>
                {spread > 0 ? '+' : ''}{spread} <span className="text-[10px] text-slate-400">pips</span>
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                {p.from} @ {a} → {p.to} @ {b}
              </p>
            </div>
          );
        })}
      </div>
      <div className="bg-navy-950 border border-navy-800 rounded-lg p-3">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Détails par tenor (forward points en pips)</p>
        <div className="grid grid-cols-4 gap-2">
          {near.map((n) => (
            <div key={n.tenor} className="text-center bg-navy-900 rounded p-2">
              <p className="text-[10px] text-slate-500">{n.tenor}</p>
              <p className="text-base font-mono font-bold text-gold-400">{n.rate}</p>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-slate-500 mt-2 italic">
          Forward points calculés sur la courbe de taux BAM. Pour vos opérations, contactez votre banque pour un cours ferme.
        </p>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
        active
          ? 'text-gold-400 border-gold-500'
          : 'text-slate-500 border-transparent hover:text-slate-300'
      }`}
    >
      {children}
    </button>
  );
}

// â”€â”€â”€ Printable Quote Sheet â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function PrintQuoteModal({ quote, currency, tenor, notional, direction, settlement, locale, onClose }: {
  quote: ForwardQuote;
  currency: string;
  tenor: string;
  notional: number;
  direction: 'BUY' | 'SELL';
  settlement: string;
  locale: 'fr' | 'en' | 'ar';
  onClose: () => void;
}) {
  const refNum = useMemo(() => Math.random().toString(36).slice(2, 10).toUpperCase(), []);
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const spotCost = quote.spot * notional;
  const fwdCost = quote.forwardRate * notional;
  const hedgeCost = fwdCost - spotCost;

  return (
    <>
      <style>{`
        @media print {
          body { visibility: hidden; }
          #fwd-quote-print, #fwd-quote-print * { visibility: visible; }
          #fwd-quote-print { position: fixed; top: 0; left: 0; right: 0; width: 100%; background: white; border-radius: 0; max-width: 100%; }
          .fwd-print-hidden { display: none !important; }
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="fwd-print-hidden fixed inset-0 z-50 flex items-start justify-center bg-black/80 overflow-y-auto py-8 px-4"
        onClick={onClose}
      >
        <div
          id="fwd-quote-print"
          className="bg-white w-full max-w-xl rounded-xl overflow-hidden shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-navy-950 text-white px-6 py-4 flex items-start justify-between">
            <div>
              <p className="text-gold-400 font-bold text-sm tracking-widest uppercase">JAD2 Advisory</p>
              <p className="text-slate-400 text-[11px]">Conseil Stratégique & Formation · Risque de Change</p>
              <p className="text-slate-500 text-[10px]">jad2advisory.com</p>
            </div>
            <div className="text-right text-[10px] text-slate-400">
              <p>{dateStr}</p>
              <p>{timeStr}</p>
              <p className="font-mono mt-1 text-slate-500">Réf. FWD-{refNum}</p>
            </div>
          </div>

          {/* Title bar */}
          <div className="bg-gold-500 text-navy-950 text-center py-2">
            <p className="text-xs font-bold uppercase tracking-widest">
              {locale === 'ar'
                ? 'ÙˆØ±Ù‚Ø© Ù…Ø­Ø§ÙƒØ§Ø© Ø¹Ù‚Ø¯ Ø¢Ø¬Ù„'
                : locale === 'en'
                ? 'Forward FX Simulation Sheet'
                : 'Fiche de Simulation Forward FX'}
            </p>
          </div>

          {/* Body */}
          <div className="p-6 bg-white space-y-4">
            {/* Transaction params */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                  {locale === 'en' ? 'Transaction Parameters' : 'Paramètres de Transaction'}
                </p>
              </div>
              <div className="divide-y divide-slate-100">
                {([
                  [locale === 'en' ? 'Pair' : 'Paire', `${currency}/MAD`],
                  [
                    locale === 'en' ? 'Direction' : 'Sens',
                    direction === 'BUY'
                      ? (locale === 'en' ? 'BUY FCY / SELL MAD' : 'ACHAT FCY / VENTE MAD')
                      : (locale === 'en' ? 'SELL FCY / BUY MAD' : 'VENTE FCY / ACHAT MAD'),
                  ],
                  [locale === 'en' ? 'Notional' : 'Notionnel', `${notional.toLocaleString('fr-FR')} ${currency}`],
                  [locale === 'en' ? 'Tenor' : 'Échéance', `${quote.tenorLabel} (${quote.tenorDays} j)`],
                  [locale === 'en' ? 'Settlement Date' : 'Date de Valeur', settlement],
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between px-4 py-2">
                    <span className="text-[11px] text-slate-500">{k}</span>
                    <span className="text-[11px] font-mono font-bold text-slate-900">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                  {locale === 'en' ? 'Pricing' : 'Tarification'}
                </p>
              </div>
              <div className="divide-y divide-slate-100">
                {([
                  [locale === 'en' ? 'Spot Rate' : 'Cours Spot', fmt4(quote.spot), 'MAD'],
                  ['Taux MAD', fmtPct(quote.madRate), ''],
                  [`Taux ${currency}`, fmtPct(quote.fcyRate), ''],
                  [
                    locale === 'en' ? 'Forward Points' : 'Points Forward',
                    `${fmtPips(quote.forwardPointsPips)} pips`,
                    quote.forwardPointsPips >= 0.5 ? 'PREMIUM' : quote.forwardPointsPips <= -0.5 ? 'DISCOUNT' : 'PAR',
                  ],
                ] as [string, string, string][]).map(([k, v, u]) => (
                  <div key={k} className="flex items-center justify-between px-4 py-2">
                    <span className="text-[11px] text-slate-500">{k}</span>
                    <span className="text-[11px] font-mono font-bold text-slate-900">
                      {v}
                      {u && <span className="text-[10px] text-slate-400 ml-1.5">{u}</span>}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between px-4 py-3 bg-amber-50">
                  <span className="text-sm font-bold text-slate-800">
                    {locale === 'en' ? 'Forward Rate' : 'Cours Forward'}
                  </span>
                  <span className="text-2xl font-mono font-bold text-amber-700">{fmt4(quote.forwardRate)}</span>
                </div>
              </div>
            </div>

            {/* Net cost */}
            <div className="border border-amber-200 bg-amber-50 rounded-lg p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2">
                {locale === 'en' ? 'Indicative Net Cost' : 'Coût Net Indicatif'}
              </p>
              <div className="flex items-end gap-3 mb-2">
                <p className="text-2xl font-mono font-bold text-slate-900">{fmtMAD(fwdCost)}</p>
                <p className="text-sm text-slate-500 mb-0.5">MAD</p>
              </div>
              <div className="text-[10px] text-slate-500 space-y-0.5">
                <p>
                  {locale === 'en' ? 'vs Spot:' : 'vs Spot:'}{' '}
                  <span className="font-mono">{fmtMAD(spotCost)} MAD</span>
                </p>
                <p>
                  {locale === 'en' ? 'Hedging premium:' : 'Prime de couverture:'}{' '}
                  <span className={`font-mono font-bold ${hedgeCost >= 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {hedgeCost >= 0 ? '+' : ''}{fmtMAD(hedgeCost)} MAD
                  </span>
                </p>
              </div>
            </div>

            {/* P3.6 â€” In-tool CTA after quote computed */}
            <div className="bg-gradient-to-r from-gold-500/10 to-navy-900 border border-gold-700/30 rounded-lg p-4 mt-3 flex items-start gap-3">
              <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gold-500/15 border border-gold-500/30 flex items-center justify-center">
                <TrendingUp size={16} className="text-gold-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-white mb-1">
                  {locale === 'en' ? 'Want a real bank rate for this forward?' : 'Vous voulez un taux ferme pour ce forward ?'}
                </p>
                <p className="text-[11px] text-slate-400 leading-snug mb-2">
                  {locale === 'en'
                    ? 'JAD2FX is pedagogical. For execution, your bank gives you a firm quote. We can help you structure the request and benchmark it.'
                    : 'JAD2FX est pédagogique. Pour exécution, votre banque vous donne un cours ferme. On vous aide à structurer la demande et la benchmarker.'}
                </p>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('jad2:open-contact')); }}
                    className="text-[10px] font-bold px-3 py-1.5 bg-gold-500 text-navy-950 rounded hover:bg-gold-400"
                  >
                    {locale === 'en' ? '15min with expert →' : '15 min avec un expert →'}
                  </button>
                  <button
                    onClick={() => {
                      // P0-3 FIX: replace dead hash. Dispatch a custom event that
                      // App.tsx catches and routes via the real navTo.
                      if (typeof window !== 'undefined') {
                        const url = new URL(window.location.href);
                        url.searchParams.set('view', 'AUDIT_LANDING');
                        window.history.pushState(null, '', url.toString());
                        window.dispatchEvent(new PopStateEvent('popstate'));
                      }
                    }}
                    className="text-[10px] font-bold px-3 py-1.5 border border-navy-600 text-slate-300 rounded hover:border-gold-500/50"
                  >
                    {locale === 'en' ? 'Free 30min audit' : 'Audit 30 min gratuit'}
                  </button>
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="border border-orange-200 bg-orange-50 rounded-lg p-4">
              <p className="text-[10px] text-orange-800 leading-relaxed">
                <strong>
                  âš ï¸{' '}
                  {locale === 'en' ? 'INDICATIVE SIMULATION ONLY' : 'SIMULATION INDICATIVE UNIQUEMENT'}
                </strong>
                {' â€” '}
                {locale === 'en'
                  ? 'This document is produced for educational purposes by JAD2 Advisory (strategic consulting & FX risk management training). Data is indicative only and does not constitute a transaction offer or investment advice. For actual transactions, contact a Bank Al-Maghrib approved institution.'
                  : "Ce document est produit à titre pédagogique par JAD2 Advisory (conseil stratégique & formation en gestion du risque de change). Ces données sont indicatives et ne constituent pas une offre de transaction ni un conseil en investissement. Pour l'exécution de vos opérations, adressez-vous à votre établissement bancaire habilité."}
              </p>
            </div>
          </div>

          {/* Footer actions */}
          <div className="fwd-print-hidden bg-slate-100 px-6 py-3 border-t border-slate-200 flex items-center justify-between gap-3">
            <button
              onClick={onClose}
              className="text-xs text-slate-500 hover:text-slate-800 transition px-3 py-1.5 rounded border border-slate-300 hover:border-slate-400"
            >
              â† {locale === 'en' ? 'Close' : 'Fermer'}
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-navy-950 hover:bg-navy-800 text-white text-xs font-bold rounded transition"
            >
              <Printer size={13} />
              {locale === 'en' ? 'Print / Save as PDF' : 'Imprimer / Enregistrer PDF'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// â”€â”€â”€ MTM Calculator â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function MtmSection({ spot, currency }: { spot: number; currency: string }) {
  const { locale } = useI18n();
  const [contractRate, setContractRate] = useState('');
  const [contractNotional, setContractNotional] = useState(1_000_000);
  const [contractSide, setContractSide] = useState<'BUY' | 'SELL'>('BUY');

  const mtm = useMemo(() => {
    const F0 = parseFloat(contractRate);
    if (!F0 || !spot) return null;
    const diff = spot - F0; // current spot vs. contracted rate
    const mtmMAD = contractSide === 'BUY'
      ? diff * contractNotional       // BUY FCY: gain if spot > F0 (FCY appreciated vs MAD)
      : -diff * contractNotional;    // SELL FCY: gain if spot < F0
    const pctMove = ((spot - F0) / F0) * 100;
    return { mtmMAD, pctMove, diff };
  }, [contractRate, contractNotional, contractSide, spot]);

  const heading = locale === 'ar' ? 'ØªÙ‚ÙŠÙŠÙ… Ø§Ù„Ø¹Ù‚Ø¯ Ø¨Ø§Ù„Ø³ÙˆÙ‚ (MTM)' : locale === 'en' ? 'Mark-to-Market (MTM)' : 'Valorisation au Marché (MTM)';
  const desc    = locale === 'ar'
    ? 'Ø£Ø¯Ø®Ù„ Ù…Ø¹Ø·ÙŠØ§Øª Ø§Ù„Ø¹Ù‚Ø¯ Ø§Ù„Ø¢Ø¬Ù„ Ø§Ù„Ø£ØµÙ„ÙŠ Ù„Ø­Ø³Ø§Ø¨ Ø§Ù„Ø±Ø¨Ø­/Ø§Ù„Ø®Ø³Ø§Ø±Ø© ØºÙŠØ± Ø§Ù„Ù…Ø­Ù‚Ù‚'
    : locale === 'en'
    ? 'Enter your existing forward contract details to compute unrealized P&L vs current spot'
    : 'Saisissez les détails de votre contrat forward existant pour calculer la P&L latente vs le cours spot actuel';

  return (
    <div className="space-y-5">
      {/* Disclaimer */}
      <div className="flex items-start gap-3 bg-amber-950/20 border border-amber-800/30 rounded-lg px-4 py-3">
        <AlertTriangle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-400/90 leading-relaxed">
          {locale === 'ar'
            ? 'Ù†ØªØ§Ø¦Ø¬ ØªØ¹Ù„ÙŠÙ…ÙŠØ© ÙÙ‚Ø· â€” Ø§Ø³ØªØ®Ø¯Ù… Ø£Ø³Ø¹Ø§Ø± BKAM Ø§Ù„Ø±Ø³Ù…ÙŠØ© Ù„Ø£ÙŠ ØªÙ‚ÙŠÙŠÙ… ÙØ¹Ù„ÙŠ'
            : locale === 'en'
            ? 'Educational results only â€” use BKAM official fixing for any actual valuation'
            : 'Résultats indicatifs à titre pédagogique â€” utilisez le fixing BKAM officiel pour toute valorisation réelle'}
        </p>
      </div>

      <div className="bg-navy-900 border border-navy-700 rounded-xl p-5">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-gold-500 mb-4">{heading}</h3>
        <p className="text-[11px] text-slate-400 mb-5 leading-relaxed">{desc}</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          {/* Contract rate */}
          <div>
            <label className="block text-[10px] text-slate-500 mb-1.5 uppercase tracking-wider">
              {locale === 'ar' ? 'Ø§Ù„Ø³Ø¹Ø± Ø§Ù„Ø¢Ø¬Ù„ Ø§Ù„Ù…ØªØ¹Ø§Ù‚Ø¯ Ø¹Ù„ÙŠÙ‡' : locale === 'en' ? 'Contracted Forward Rate' : 'Cours Forward Contracté'}
            </label>
            <input
              type="number"
              value={contractRate}
              onChange={e => setContractRate(e.target.value)}
              placeholder={spot ? fmt4(spot) : '0.0000'}
              step="0.0001"
              className="w-full bg-navy-800 border border-navy-600 text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-gold-500 font-mono placeholder-navy-600"
            />
          </div>

          {/* Notional */}
          <div>
            <label className="block text-[10px] text-slate-500 mb-1.5 uppercase tracking-wider">
              {locale === 'ar' ? 'Ø§Ù„Ù…Ø¨Ù„Øº Ø§Ù„Ø§ÙØªØ±Ø§Ø¶ÙŠ' : locale === 'en' ? 'Notional' : 'Notionnel'} ({currency})
            </label>
            <input
              type="number"
              value={contractNotional}
              onChange={e => setContractNotional(Math.max(0, Number(e.target.value)))}
              step={100_000}
              className="w-full bg-navy-800 border border-navy-600 text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-gold-500 font-mono"
            />
          </div>

          {/* Side */}
          <div>
            <label className="block text-[10px] text-slate-500 mb-1.5 uppercase tracking-wider">
              {locale === 'ar' ? 'Ø§ØªØ¬Ø§Ù‡ Ø§Ù„Ø¹Ù‚Ø¯' : locale === 'en' ? 'Contract Side' : 'Sens du Contrat'}
            </label>
            <div className="flex gap-2 h-9">
              {(['BUY', 'SELL'] as const).map(d => (
                <button key={d} onClick={() => setContractSide(d)}
                  className={`flex-1 text-xs font-bold rounded transition ${
                    contractSide === d
                      ? d === 'BUY' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                      : 'bg-navy-800 text-slate-400 border border-navy-600'
                  }`}>
                  {d === 'BUY'
                    ? (locale === 'ar' ? 'Ø´Ø±Ø§Ø¡' : locale === 'en' ? 'BUY' : 'ACHAT')
                    : (locale === 'ar' ? 'Ø¨ÙŠØ¹' : locale === 'en' ? 'SELL' : 'VENTE')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* MTM Result */}
        {mtm && contractRate && (
          <div className={`rounded-xl border p-5 ${
            mtm.mtmMAD >= 0
              ? 'bg-emerald-950/30 border-emerald-700/50'
              : 'bg-red-950/30 border-red-700/50'
          }`}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                  {locale === 'ar' ? 'Ø§Ù„Ø³Ø¹Ø± Ø§Ù„Ø¢Ø¬Ù„ Ø§Ù„Ù…ØªØ¹Ø§Ù‚Ø¯' : locale === 'en' ? 'Contracted Rate' : 'Cours Contracté'}
                </p>
                <p className="text-lg font-mono font-bold text-white">{fmt4(parseFloat(contractRate))}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                  {locale === 'ar' ? 'Ø§Ù„Ø³Ø¹Ø± Ø§Ù„ÙÙˆØ±ÙŠ Ø§Ù„Ø­Ø§Ù„ÙŠ' : locale === 'en' ? 'Current Spot' : 'Spot Actuel'}
                </p>
                <p className="text-lg font-mono font-bold text-gold-400">{fmt4(spot)}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                  {locale === 'ar' ? 'Ø§Ù„ØªØ­Ø±Ùƒ %' : locale === 'en' ? 'Move %' : 'Mouvement %'}
                </p>
                <p className={`text-lg font-mono font-bold ${mtm.pctMove >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {mtm.pctMove >= 0 ? '+' : ''}{mtm.pctMove.toFixed(3)}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                  {locale === 'ar' ? 'Ø±.Øº. ØºÙŠØ± Ù…Ø­Ù‚Ù‚ (MAD)' : locale === 'en' ? 'Unrealised P&L (MAD)' : 'P&L Latente (MAD)'}
                </p>
                <p className={`text-xl font-mono font-bold ${mtm.mtmMAD >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {mtm.mtmMAD >= 0 ? '+' : ''}{fmtMAD(mtm.mtmMAD)}
                </p>
              </div>
            </div>

            <p className="text-center text-[10px] text-slate-500 mt-4 border-t border-navy-800/50 pt-3">
              {mtm.mtmMAD >= 0
                ? (locale === 'ar' ? 'âœ… Ø§Ù„Ù…ÙˆÙ‚Ù ÙÙŠ ØµØ§Ù„Ø­Ùƒ â€” Ù‚ÙŠÙ…Ø© Ø§Ù„Ø³ÙˆÙ‚ Ø£Ø¹Ù„Ù‰ Ù…Ù† Ø§Ù„Ø³Ø¹Ø± Ø§Ù„Ø¢Ø¬Ù„'
                  : locale === 'en' ? 'âœ… In-the-money â€” current market is more favorable than contracted rate'
                  : 'âœ… Gain latent â€” le marché actuel est plus favorable que votre cours forward contracté')
                : (locale === 'ar' ? 'âŒ Ø§Ù„Ù…ÙˆÙ‚Ù Ø¶Ø¯Ùƒ â€” Ù‚ÙŠÙ…Ø© Ø§Ù„Ø³ÙˆÙ‚ Ø£Ù‚Ù„ Ù…Ù† Ø§Ù„Ø³Ø¹Ø± Ø§Ù„Ø¢Ø¬Ù„'
                  : locale === 'en' ? 'âŒ Out-of-the-money â€” current market is less favorable than contracted rate'
                  : 'âŒ Perte latente â€” le marché actuel est moins favorable que votre cours forward contracté')
              }
            </p>
          </div>
        )}

        {!contractRate && (
          <div className="text-center py-6 text-slate-600 text-sm">
            {locale === 'ar' ? 'Ø£Ø¯Ø®Ù„ Ø§Ù„Ø³Ø¹Ø± Ø§Ù„Ø¢Ø¬Ù„ Ø§Ù„Ù…ØªØ¹Ø§Ù‚Ø¯ Ø¹Ù„ÙŠÙ‡ Ù„Ø­Ø³Ø§Ø¨ MTM'
              : locale === 'en' ? 'Enter contracted forward rate to compute MTM'
              : 'Saisissez le cours forward contracté pour calculer le MTM'}
          </div>
        )}
      </div>

      {/* Advisory CTA */}
      <div className="text-center p-4 bg-gold-500/5 border border-gold-700/30 rounded-xl">
        <p className="text-xs text-slate-400 mb-2">
          {locale === 'ar' ? 'Ù„Ù„Ø­ØµÙˆÙ„ Ø¹Ù„Ù‰ ØªÙ‚ÙŠÙŠÙ… MTM Ø±Ø³Ù…ÙŠØŒ ØªÙˆØ§ØµÙ„ Ù…Ø¹ Ù…ØµØ±ÙÙƒ'
            : locale === 'en' ? 'For official MTM valuation, contact your bank or JAD2 Advisory'
            : 'Pour une valorisation MTM officielle, contactez votre banque ou JAD2 Advisory'}
        </p>
        <a href="https://jad2advisory.com" target="_blank" rel="noopener noreferrer"
           className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-400 text-navy-900 text-xs font-bold rounded transition">
          <BookOpen size={12} />
          JAD2 Advisory →
        </a>
      </div>
    </div>
  );
}

// â”€â”€â”€ P2.8 â€” Historical Comparison Section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Compare a currency's theoretical forward across multiple time windows.
function HistoricalComparisonSection({ currency }: { currency: string }) {
  const [window, setWindow] = useState<TimeWindow>('1M');
  const startDate = useMemo(() => getStartDateForWindow(window), [window]);

  // Theoretical forward points: change from spot = (r_dom - r_for) × days/360
  const MAD_RATE = 0.0275;
  const CCY_RATES: Record<string, number> = { EUR: 0.04, USD: 0.0475, GBP: 0.045, JPY: 0.005, CHF: 0.0275, CAD: 0.038, AUD: 0.041, CNY: 0.0295 };
  const spotMap: Record<string, number> = { EUR: 10.85, USD: 9.95, GBP: 12.59, JPY: 6.66, CHF: 11.46, CAD: 7.32, AUD: 6.42, CNY: 1.37 };
  const rForeign = CCY_RATES[currency] ?? 0.04;
  const spot = spotMap[currency] ?? 10;
  const daysSince = (d: Date) => Math.max(1, Math.floor((Date.now() - d.getTime()) / 86400000));

  const rows = useMemo(() => {
    return [1, 7, 30, 60, 90, 180, 365, 730].map(d => {
      const fwdRate = spot * (1 + (MAD_RATE - rForeign) * d / 360);
      const fwdPoints = fwdRate - spot;
      return { d, fwdRate, fwdPoints, isInWindow: d <= daysSince(startDate) };
    });
  }, [spot, rForeign, startDate]);

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Fenêtre:</span>
        <TimeWindowSelector value={window} onChange={setWindow} />
        <span className="text-[10px] text-slate-500">
          depuis {startDate.toLocaleDateString('fr-MA')}
        </span>
      </div>

      <div className="bg-navy-900 border border-navy-700 rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-navy-950">
            <tr className="text-[9px] text-slate-500 uppercase tracking-wider">
              <th className="px-3 py-2 text-left">Tenor</th>
              <th className="px-3 py-2 text-right">Forward théorique</th>
              <th className="px-3 py-2 text-right">Points forward</th>
              <th className="px-3 py-2 text-right">Bande (r_d - r_f)</th>
              <th className="px-3 py-2 text-right">Dans la fenêtre</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-800">
            {rows.map(r => (
              <tr key={r.d} className={r.isInWindow ? 'bg-gold-500/5' : ''}>
                <td className="px-3 py-2 font-mono text-slate-200">{r.d}J</td>
                <td className="px-3 py-2 text-right font-mono text-gold-400">{r.fwdRate.toFixed(4)}</td>
                <td className="px-3 py-2 text-right font-mono text-emerald-400">{(r.fwdPoints >= 0 ? '+' : '')}{r.fwdPoints.toFixed(4)}</td>
                <td className="px-3 py-2 text-right font-mono text-slate-400">{((MAD_RATE - rForeign) * 10000).toFixed(0)} bps</td>
                <td className="px-3 py-2 text-right text-slate-400">{r.isInWindow ? 'âœ“' : 'â€”'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[10px] text-slate-500 leading-relaxed">
        Forward théorique calculé par parité des taux d&apos;intérêt couverte (CIP): F = S × (1 + r_d × T) âˆ’ S.
        Taux domestiques: BAM 2.75% · Taux étranger variable par devise. Fenêtre sélectionnée met en surbrillance les maturités disponibles.
      </p>
    </div>
  );
}

// â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function ForwardCalculator() {
  const { config, livePrices, addBlotterEntry } = useAdmin();
  const { locale } = useI18n();

  const [activeTab, setActiveTab]     = useState<Tab>('PRICER');
  const [currency, setCurrency]       = useState('EUR'); // EUR first per G10 market convention
  const [tenor, setTenor]             = useState('3M');
  const [notional, setNotional]       = useState(1_000_000);
  const [direction, setDirection]     = useState<'BUY' | 'SELL'>('BUY');
  const [customDate, setCustomDate]   = useState('');
  const [saved, setSaved]             = useState(false);
  const [showPrint, setShowPrint]     = useState(false);

  const spotEntry = livePrices.find(p => p.currency === currency);
  const spot      = config.spotOverrides[currency] ?? spotEntry?.mid ?? 0;
  const curInfo   = BKAM_CURRENCIES.find(c => c.code === currency);

  const effectiveTenorYears = useMemo(() => {
    if (tenor === 'CUSTOM' && customDate) return customDateToYears(customDate);
    return undefined;
  }, [tenor, customDate]);

  const quote = useMemo(() => {
    if (!spot) return null;
    try {
      const t = (tenor === 'CUSTOM' && !customDate) ? '3M' : tenor;
      return buildForwardQuote(
        currency, spot, t, notional, direction,
        config.forwardMarkupBps,
        config.curveOverrides['MAD'],
        config.curveOverrides[currency],
      );
    } catch { return null; }
  }, [currency, tenor, notional, direction, spot, config.forwardMarkupBps, config.curveOverrides, customDate]);

  const curvePoints = useMemo(() => {
    if (!spot) return [];
    return buildForwardCurve(
      currency, spot,
      config.forwardMarkupBps,
      config.curveOverrides['MAD'],
      config.curveOverrides[currency],
    );
  }, [currency, spot, config.forwardMarkupBps, config.curveOverrides]);

  const settlement = useMemo(() => {
    if (tenor === 'CUSTOM' && customDate) return customDate;
    return settlementDate(tenor);
  }, [tenor, customDate]);

  const handleSave = useCallback(() => {
    if (!quote) return;
    addBlotterEntry({
      action: 'FORWARD',
      pair: quote.pair,
      tenor: quote.tenorLabel,
      rate: quote.forwardRate,
      fwdPtsPips: quote.forwardPointsPips,
      notional: quote.notional,
      details: `[SIM] ${direction} ${fmtMAD(notional)} ${currency} @ ${fmt4(quote.forwardRate)} (${fmtPips(quote.forwardPointsPips)} pips) â€” INDICATIF`,
    });
    logSimTelemetry(config.corsProxyUrl, quote.pair, 'FORWARD_SAVE', quote.tenorDays);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [quote, direction, notional, currency, addBlotterEntry, config.corsProxyUrl]);

  // Labels
  const tabPricer = locale === 'ar' ? 'Ø§Ù„ØªØ³Ø¹ÙŠØ±' : locale === 'en' ? 'Pricer' : 'Pricer';
  const tabCurve  = locale === 'ar' ? 'Ø§Ù„Ù…Ù†Ø­Ù†Ù‰' : locale === 'en' ? 'Curve' : 'Courbe';
  const tabMtm    = locale === 'ar' ? 'MTM' : 'MTM';

  return (
    <div className="space-y-4">
      <ComplianceBanner toolName="Forward Calculator" />

      <div className="space-y-0">
      {/* â”€â”€ Bloomberg-style header â”€â”€ */}
      <div className="bg-navy-950 border border-navy-700 rounded-t-xl px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Calculator size={16} className="text-gold-500" />
              <h2 className="text-base font-bold text-white tracking-widest uppercase">
                {locale === 'ar' ? 'Ø­Ø§Ø³Ø¨Ø© Ø§Ù„Ø¹Ù‚ÙˆØ¯ Ø§Ù„Ø¢Ø¬Ù„Ø© FX' : locale === 'en' ? 'FX Forward Calculator' : 'Calculateur Forward FX'}
              </h2>
              <span className="text-[9px] font-bold bg-amber-700/30 text-amber-400 border border-amber-700/40 px-1.5 py-0.5 rounded uppercase tracking-wider">
                {locale === 'ar' ? 'ØªØ¹Ù„ÙŠÙ…ÙŠ' : locale === 'en' ? 'Indicative' : 'Indicatif'}
              </span>
            </div>
            <p className="text-slate-500 text-[11px]">
              {locale === 'ar' ? 'Ù…Ø¹Ø§Ø¯Ù„Ø© CIP · Ø§Ø³ØªÙŠÙØ§Ø¡ Ù…ÙƒØ¹Ø¨ · 20 Ø²ÙˆØ¬Ø§Ù‹ BKAM'
                : locale === 'en' ? 'CIP formula · Cubic interpolation · 20 BKAM pairs · Holiday-aware T+2 settlement'
                : 'Formule CIP · Interpolation cubique · 20 paires BKAM · Date valeur T+2 corrigée des fériés'}
            </p>
          </div>

          {/* Live spot chip */}
          {spot ? (
            <div className="bg-navy-800 border border-navy-600 rounded-lg px-4 py-2 text-right">
              <p className="text-[9px] text-slate-500 uppercase tracking-wider">
                <span className="inline-flex items-center gap-1">{curInfo && <CurrencyFlag countryCode={curInfo.countryCode} size="xs" />} {currency}/MAD {locale === 'ar' ? 'ÙÙˆØ±ÙŠ' : 'Spot'}</span>
              </p>
              <p className="text-xl font-mono font-bold text-gold-400">{fmt4(spot)}</p>
              {spotEntry?.changePercent !== undefined && spotEntry.changePercent !== 0 && (
                <p className={`text-[10px] font-mono ${spotEntry.changePercent > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {spotEntry.changePercent > 0 ? '+' : ''}{spotEntry.changePercent.toFixed(2)}%
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-amber-950/20 border border-amber-800/30 rounded-lg px-3 py-2">
              <RotateCw size={12} className="text-amber-400 animate-spin" />
              <p className="text-[11px] text-amber-400/90">
                {locale === 'ar' ? 'Ø¬Ø§Ø±Ù Ø¬Ù„Ø¨ Ø§Ù„Ø£Ø³Ø¹Ø§Ø±…'
                  : locale === 'en' ? 'Fetching rates…'
                  : 'Chargement des taux…'}
              </p>
            </div>
          )}
        </div>

        {/* Tab bar â€” B4.1 PRICER is primary; others grouped under "Avancé" label */}
        <div className="flex items-center gap-1 mt-4 border-b border-navy-700">
          <TabButton active={activeTab === 'PRICER'} onClick={() => setActiveTab('PRICER')}>{tabPricer}</TabButton>
          <span className="text-[9px] text-slate-600 uppercase tracking-wider px-2 ml-1">{locale === 'ar' ? 'Ù…ØªÙ‚Ø¯Ù…' : 'Avancé'}</span>
          <TabButton active={activeTab === 'CURVE'}  onClick={() => setActiveTab('CURVE')}>{tabCurve}</TabButton>
          <TabButton active={activeTab === 'MTM'}    onClick={() => setActiveTab('MTM')}>{tabMtm}</TabButton>
          <TabButton active={activeTab === 'SPREADS' as any} onClick={() => setActiveTab('SPREADS' as any)}>{locale === 'ar' ? '??????' : locale === 'en' ? 'Spreads' : 'Spreads'}</TabButton>
          <TabButton active={activeTab === 'HISTORICAL' as any} onClick={() => setActiveTab('HISTORICAL' as any)}>{locale === 'ar' ? 'ØªØ§Ø±ÙŠØ®ÙŠ' : locale === 'en' ? 'Historical' : 'Historique'}</TabButton>
        </div>
      </div>

      <div className="bg-navy-950/60 border border-t-0 border-navy-700 rounded-b-xl p-6">

        {/* â”€â”€ PRICER TAB â”€â”€ */}
        {activeTab === 'PRICER' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

            {/* Left: Inputs (2 cols) */}
            <div className="lg:col-span-2 space-y-4">

              {/* Currency + Direction */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1.5 uppercase tracking-wider">
                    {locale === 'ar' ? 'Ø§Ù„Ø¹Ù…Ù„Ø©' : locale === 'en' ? 'Currency' : 'Devise'}
                  </label>
                  <div className="relative">
                    <select
                      value={currency}
                      onChange={e => setCurrency(e.target.value)}
                      className="w-full appearance-none bg-navy-800 border border-navy-600 text-white text-sm rounded px-3 py-2 pr-8 focus:outline-none focus:border-gold-500"
                    >
                      {BKAM_CURRENCIES.map(c => (
                        <option key={c.code} value={c.code}>{c.code}/MAD</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1.5 uppercase tracking-wider">
                    {locale === 'ar' ? 'Ø§Ù„Ø§ØªØ¬Ø§Ù‡' : locale === 'en' ? 'Direction' : 'Sens'}
                  </label>
                  <div className="flex gap-2 h-9">
                    {(['BUY', 'SELL'] as const).map(d => (
                      <button key={d} onClick={() => setDirection(d)}
                        className={`flex-1 text-xs font-bold rounded transition ${
                          direction === d
                            ? d === 'BUY' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                            : 'bg-navy-800 text-slate-400 border border-navy-600'
                        }`}>
                        {d === 'BUY'
                          ? (locale === 'ar' ? 'Ø´Ø±Ø§Ø¡' : 'BUY')
                          : (locale === 'ar' ? 'Ø¨ÙŠØ¹' : 'SELL')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tenor chips */}
              <div>
                <label className="block text-[10px] text-slate-500 mb-2 uppercase tracking-wider">
                  {locale === 'ar' ? 'Ø§Ù„Ø£Ø¬Ù„' : locale === 'en' ? 'Tenor' : 'Échéance'}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {([...STANDARD_TENORS, 'CUSTOM'] as string[]).map(t => (
                    <button key={t} onClick={() => setTenor(t)}
                      className={`px-2.5 py-1.5 text-[11px] font-mono font-bold rounded transition ${
                        tenor === t
                          ? 'bg-gold-500 text-navy-900'
                          : 'bg-navy-800 text-slate-300 border border-navy-600 hover:border-gold-600'
                      }`}>
                      {t}
                    </button>
                  ))}
                </div>
                {tenor === 'CUSTOM' && (
                  <div className="mt-2">
                    <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wider">
                      {locale === 'ar' ? 'ØªØ§Ø±ÙŠØ® Ø§Ù„ØªØ³ÙˆÙŠØ© Ø§Ù„Ù…Ø®ØµØµ' : locale === 'en' ? 'Custom Settlement Date' : 'Date de Valeur Personnalisée'}
                    </label>
                    <input type="date" value={customDate}
                      onChange={e => setCustomDate(e.target.value)}
                      className="w-full bg-navy-800 border border-navy-600 text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-gold-500"
                    />
                    <p className="text-[10px] text-slate-600 mt-1">
                      {locale === 'ar'
                        ? 'Ø§Ù„ØªØ§Ø±ÙŠØ® Ø§Ù„Ù…Ø·Ù„ÙˆØ¨ Ù„Ù„ØªØ³ÙˆÙŠØ© (Ø¨Ø¹Ø¯ T+2 ÙÙˆØ±ÙŠ)'
                        : locale === 'en'
                        ? 'Target settlement date (after T+2 spot, holidays adjusted)'
                        : 'Date de valeur souhaitée (après T+2 spot, fériés ajustés)'}
                    </p>
                  </div>
                )}
              </div>

              {/* Notional */}
              <div>
                <label className="block text-[10px] text-slate-500 mb-1.5 uppercase tracking-wider">
                  {locale === 'ar' ? 'Ø§Ù„Ù…Ø¨Ù„Øº' : locale === 'en' ? 'Notional' : 'Notionnel'} ({currency})
                </label>
                <input
                  type="number" value={notional}
                  onChange={e => setNotional(Math.max(0, Number(e.target.value)))}
                  step={100_000} min={0}
                  className="w-full bg-navy-800 border border-navy-600 text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-gold-500 font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1 font-mono">
                  â‰ˆ {new Intl.NumberFormat(locale === 'ar' ? 'ar-MA' : locale === 'en' ? 'en-GB' : 'fr-FR').format(notional)} {currency}
                </p>
              </div>

              {config.forwardMarkupBps > 0 && (
                <p className="text-[10px] text-amber-400 bg-amber-950/30 border border-amber-800/30 rounded px-2 py-1">
                  {locale === 'ar' ? `Ù‡Ø§Ù…Ø´ Admin: ${config.forwardMarkupBps} Ù†Ù‚Ø·Ø© Ø£Ø³Ø§Ø³ Ù…Ø¶Ø§ÙØ©`
                    : locale === 'en' ? `Admin markup: ${config.forwardMarkupBps} bps applied`
                    : `Markup Admin: ${config.forwardMarkupBps} bps appliqués`}
                </p>
              )}
            </div>

            {/* Right: Quote result (3 cols) */}
            <div className="lg:col-span-3 flex flex-col gap-4">
              {quote ? (
                <>
                  {/* Main quote panel */}
                  <div className="bg-navy-900 border border-navy-700 rounded-xl p-5 flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-gold-500">
                        <span className="inline-flex items-center gap-1.5">{curInfo && <CurrencyFlag countryCode={curInfo.countryCode} size="xs" />} {currency}/MAD â€” {locale === 'ar' ? 'Ø¹Ø±Ø¶ Ø³Ø¹Ø± Ø¢Ø¬Ù„' : locale === 'en' ? 'Forward Quote' : 'Cotation Forward'}</span>
                      </h3>
                      <span className="text-[9px] font-mono text-slate-500">{settlement}</span>
                    </div>

                    {/* Big forward rate */}
                    <div className="text-center border border-navy-700 rounded-lg py-4 mb-4 bg-navy-800/40">
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">
                        {locale === 'ar' ? 'Ø§Ù„Ø³Ø¹Ø± Ø§Ù„Ø¢Ø¬Ù„' : locale === 'en' ? 'Forward Rate' : 'Cours Forward'}
                      </p>
                      <p className="text-4xl font-mono font-bold text-gold-400">{fmt4(quote.forwardRate)}</p>
                      <p className={`text-sm font-mono font-bold mt-1 ${quote.forwardPointsPips >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        <span className={quote.forwardPointsPips >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                          {fmtPips(quote.forwardPointsPips)} pips
                        </span>
                        {' '}
                        <span className="text-slate-500 text-xs">
                          {quote.forwardPointsPips >= 0.5 ? 'PREMIUM' : quote.forwardPointsPips <= -0.5 ? 'DISCOUNT' : 'PAR'}
                        </span>
                      </p>
                    </div>

                    <div className="space-y-0">
                      <TermRow label={locale === 'ar' ? 'Ø§Ù„Ø³Ø¹Ø± Ø§Ù„ÙÙˆØ±ÙŠ' : locale === 'en' ? 'Spot Rate' : 'Cours Spot'} value={fmt4(quote.spot)} unit="MAD" />
                      <TermRow label={locale === 'ar' ? 'Ø£ÙŠØ§Ù… Ø§Ù„Ø£Ø¬Ù„' : locale === 'en' ? 'Tenor Days' : 'Jours Échéance'} value={String(quote.tenorDays)} unit="j" />
                      <TermRow label={locale === 'ar' ? 'Ø³Ø¹Ø± MAD' : 'MAD Rate'} value={fmtPct(quote.madRate)} />
                      <TermRow label={locale === 'ar' ? `Ø³Ø¹Ø± ${currency}` : `${currency} Rate`} value={fmtPct(quote.fcyRate)} />
                      <TermRow label={locale === 'ar' ? 'ØªØ§Ø±ÙŠØ® Ø§Ù„ØªØ³ÙˆÙŠØ©' : locale === 'en' ? 'Settlement' : 'Date Valeur'} value={settlement} />
                    </div>
                  </div>

                  {/* Net cost box */}
                  <div className="bg-navy-900 border border-gold-700/40 rounded-xl px-5 py-4">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">
                      {locale === 'ar' ? 'Ø§Ù„ÙƒÙ„ÙØ© Ø§Ù„ØµØ§ÙÙŠØ© Ø§Ù„Ø§Ø³ØªØ±Ø´Ø§Ø¯ÙŠØ© Ù„Ù„Ø¹Ù‚Ø¯ Ø§Ù„Ø¢Ø¬Ù„'
                        : locale === 'en' ? 'Indicative Net Forward Cost'
                        : 'Coût Net Indicatif Forward'}
                    </p>
                    <div className="flex items-end gap-3">
                      <p className="text-3xl font-mono font-bold text-gold-400">{fmtMAD(quote.netCostMAD)}</p>
                      <p className="text-sm text-slate-500 font-mono mb-0.5">MAD</p>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 font-mono">
                      {notional.toLocaleString()} {currency} · {tenor} · {direction}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button onClick={handleSave}
                      className={`flex-1 py-2.5 text-xs font-bold rounded transition ${
                        saved
                          ? 'bg-emerald-700 text-white'
                          : 'bg-navy-800 hover:bg-navy-700 text-gold-400 border border-gold-600/40'
                      }`}>
                      {saved
                        ? (locale === 'ar' ? 'âœ“ ØªÙ… Ø§Ù„Ø­ÙØ¸' : locale === 'en' ? 'âœ“ Saved' : 'âœ“ Enregistré')
                        : (locale === 'ar' ? 'Ø­ÙØ¸ ÙÙŠ Ø§Ù„Ø¯ÙØªØ±' : locale === 'en' ? 'Save to Blotter' : 'Enregistrer')}
                    </button>
                    <button
                      onClick={() => setShowPrint(true)}
                      className="px-3 py-2.5 text-xs font-bold rounded border border-navy-600 bg-navy-800 hover:bg-navy-700 text-slate-300 transition flex items-center gap-1.5"
                      title={locale === 'en' ? 'Print / Export quote sheet' : 'Imprimer / Exporter la fiche'}
                    >
                      <Printer size={12} />
                      {locale === 'ar' ? 'ÙÙŠØ´Ø©' : locale === 'en' ? 'Sheet' : 'Fiche'}
                    </button>
                    <a href="https://jad2advisory.com" target="_blank" rel="noopener noreferrer"
                       className="flex-1 py-2.5 text-center text-xs font-bold bg-gold-500 hover:bg-gold-400 text-navy-900 rounded transition">
                      {locale === 'ar' ? 'Ø¹Ø±Ø¶ Ø­Ù‚ÙŠÙ‚ÙŠ â† JAD2' : locale === 'en' ? 'Live Quote → JAD2' : 'JAD2 Advisory →'}
                    </a>
                  </div>

                  <p className="text-[10px] text-amber-400/70 text-center">
                    âš ï¸ {locale === 'ar' ? 'Ù†ØªØ§Ø¦Ø¬ ØªØ¹Ù„ÙŠÙ…ÙŠØ© ÙÙ‚Ø·' : locale === 'en' ? 'Educational simulation only' : 'Simulation indicative uniquement'}
                  </p>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center min-h-[300px] bg-navy-900 border border-navy-700 rounded-xl">
                  <p className="text-slate-500 text-sm text-center px-4">
                    {!spot
                      ? (locale === 'ar' ? 'Ù„Ø§ ÙŠÙˆØ¬Ø¯ Ø³Ø¹Ø± â€” Ø£Ø¶Ù Ø¨ÙŠØ§Ù†Ø§Øª Ø£Ùˆ Ø§Ø¶Ø¨Ø· ÙÙŠ Admin'
                        : locale === 'en' ? 'No spot rate â€” fetch prices or set override in Admin'
                        : 'Pas de cours spot â€” actualisez ou configurez Admin')
                      : (locale === 'ar' ? 'Ø­Ø¯Ø¯ Ù…Ø¹Ø§Ù…Ù„Ø§Øª Ø§Ù„Ø­Ø³Ø§Ø¨'
                        : locale === 'en' ? 'Configure parameters above'
                        : 'Configurez les paramètres ci-dessus')}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* â”€â”€ CURVE TAB â”€â”€ */}
        {activeTab === 'CURVE' && (
          <div className="space-y-5">
            {curvePoints.length > 0 ? (
              <>
                <div className="bg-navy-900 border border-navy-700 rounded-xl p-5">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-gold-500 mb-4 flex items-center gap-2">
                    <TrendingUp size={12} />
                    {currency}/MAD â€” {locale === 'ar' ? 'Ù…Ù†Ø­Ù†Ù‰ Ø§Ù„Ù†Ù‚Ø§Ø· Ø§Ù„Ø¢Ø¬Ù„Ø© (Ù†Ù‚Ø·Ø© Ø£Ø³Ø§Ø³ / Ø£Ø¬Ù„)' : locale === 'en' ? 'Forward Points Curve (pips vs tenor)' : 'Courbe des Points Forward (pips vs échéance)'}
                  </h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={curvePoints} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                      <XAxis dataKey="tenor" tick={{ fill: '#94a3b8', fontSize: 10 }} stroke="#1e3a5f" />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} stroke="#1e3a5f"
                        tickFormatter={v => `${v > 0 ? '+' : ''}${v.toFixed(0)}`} width={45} />
                      <Tooltip
                        contentStyle={{ background: '#0A1A30', border: '1px solid #1e3a5f', borderRadius: 6 }}
                        labelStyle={{ color: '#D4AF37', fontWeight: 'bold', fontSize: 11 }}
                        itemStyle={{ color: '#94a3b8', fontSize: 11 }}
                        formatter={((v: number) => [`${v >= 0 ? '+' : ''}${v.toFixed(2)} pips`, 'Fwd Points']) as any}
                      />
                      <ReferenceLine y={0} stroke="#4b5563" strokeDasharray="4 4" />
                      <Line type="monotone" dataKey="forwardPointsPips" stroke="#D4AF37" strokeWidth={2}
                        dot={{ fill: '#D4AF37', r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Curve table */}
                <div className="bg-navy-900 border border-navy-700 rounded-xl p-5 overflow-x-auto">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-gold-500 mb-4 flex items-center gap-2">
                    <Clock size={12} />
                    {locale === 'ar' ? `Ø§Ù„Ù…Ù†Ø­Ù†Ù‰ Ø§Ù„ÙƒØ§Ù…Ù„ â€” ${currency}/MAD` : locale === 'en' ? `Full Curve â€” ${currency}/MAD` : `Courbe Complète â€” ${currency}/MAD`}
                  </h3>
                  <table className="w-full text-xs font-mono min-w-[600px]">
                    <thead>
                      <tr className="text-slate-500 uppercase text-[10px] border-b border-navy-700">
                        {[
                          locale === 'en' ? 'Tenor' : 'Échéance',
                          locale === 'en' ? 'Days'  : 'Jours',
                          'MAD%', `${currency}%`,
                          locale === 'en' ? 'Spot'    : 'Spot',
                          locale === 'en' ? 'Fwd Rate': 'Taux Fwd',
                          'Pips',
                          locale === 'en' ? 'P/D'     : 'P/D',
                        ].map(h => (
                          <th key={h} className="text-right first:text-left pb-2 pr-3 last:pr-0 font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {curvePoints.map(row => (
                        <tr key={row.tenor} className={`border-b border-navy-800 hover:bg-navy-800/40 transition-colors ${row.tenor === tenor ? 'bg-navy-800/60' : ''}`}>
                          <td className={`py-2 pr-3 font-bold ${row.tenor === tenor ? 'text-gold-400' : 'text-white'}`}>
                            {row.isInterpolated ? (
                              <span className="italic text-slate-400" title={
                                locale === 'ar' ? 'Ù…Ø¹Ø¯Ù„ Ù…Ø­Ø³ÙˆØ¨ Ø¨Ø§Ù„Ø§Ø³ØªÙŠÙØ§Ø¡ (Ù„ÙŠØ³ Ù†Ù‚Ø·Ø© Ø§Ø±ØªÙƒØ§Ø² Ù…Ø¨Ø§Ø´Ø±Ø©)'
                                : locale === 'en' ? 'Interpolated â€” not a direct curve knot'
                                : 'Interpolé â€” pas de nÅ“ud direct sur la courbe'
                              }>
                                {row.tenor}<sup className="text-[9px] text-amber-400 ml-0.5">*</sup>
                              </span>
                            ) : row.tenor}
                          </td>
                          <td className="text-right text-slate-400 pr-3">{row.tenorDays}</td>
                          <td className="text-right text-slate-300 pr-3">{fmtPct(row.madRate)}</td>
                          <td className="text-right text-slate-300 pr-3">{fmtPct(row.fcyRate)}</td>
                          <td className="text-right text-slate-300 pr-3">{fmt4(row.spot)}</td>
                          <td className="text-right text-white font-bold pr-3">{fmt4(row.forwardRate)}</td>
                          <td className={`text-right font-bold pr-3 ${row.forwardPointsPips >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {fmtPips(row.forwardPointsPips)}
                          </td>
                          <td className={`text-right text-[10px] ${
                            row.premDisc === 'PREMIUM' ? 'text-emerald-400' :
                            row.premDisc === 'DISCOUNT' ? 'text-red-400' : 'text-slate-500'
                          }`}>
                            {row.premDisc.slice(0, 4)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {curvePoints.some(r => r.isInterpolated) && (
                    <p className="text-[10px] text-amber-400/60 mt-2 italic">
                      <sup>*</sup>{' '}
                      {locale === 'ar'
                        ? 'ÙŠÙØ­Ø³Ø¨ Ù‡Ø°Ø§ Ø§Ù„Ø£Ø¬Ù„ Ø¨Ø§Ù„Ø§Ø³ØªÙŠÙØ§Ø¡ Ø§Ù„ØªÙƒØ¹ÙŠØ¨ÙŠ Ø§Ù„Ø·Ø¨ÙŠØ¹ÙŠ â€” Ù„ÙŠØ³Øª Ù†Ù‚Ø·Ø© Ø§Ø±ØªÙƒØ§Ø² Ù…Ø¨Ø§Ø´Ø±Ø© ÙÙŠ Ù…Ù†Ø­Ù†Ù‰ MAD Ø£Ùˆ Ø§Ù„Ø¹Ù…Ù„Ø© Ø§Ù„Ø£Ø¬Ù†Ø¨ÙŠØ©'
                        : locale === 'en'
                        ? 'Rate computed by natural cubic spline interpolation â€” not a direct knot in MAD or FCY base curve'
                        : 'Taux calculé par interpolation spline cubique â€” aucun nÅ“ud direct dans la courbe MAD ou FCY'}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center min-h-[250px] text-slate-500 text-sm">
                {locale === 'ar' ? 'Ù„Ø§ ÙŠÙˆØ¬Ø¯ Ø³Ø¹Ø± ÙÙˆØ±ÙŠ Ù…ØªØ§Ø­' : locale === 'en' ? 'No spot rate available â€” fetch prices first' : 'Pas de cours spot disponible â€” actualisez les prix d\'abord'}
              </div>
            )}
          </div>
        )}

        {/* â”€â”€ MTM TAB â”€â”€ */}
        {activeTab === 'MTM' && (
          <MtmSection spot={spot} currency={currency} />
        )}

        {/* â”€â”€ HISTORICAL TAB (P2.8) â”€â”€ */}
        {activeTab === ('HISTORICAL' as any) && (
          <HistoricalComparisonSection currency={currency} />
        )}
        {activeTab === 'SPREADS' && (
          <SpreadsTab spot={spot} currency={currency} />
        )}
      </div>
      </div>

      {/* Print quote sheet modal */}
      {showPrint && quote && (
        <PrintQuoteModal
          quote={quote}
          currency={currency}
          tenor={tenor}
          notional={notional}
          direction={direction}
          settlement={settlement}
          locale={locale as 'fr' | 'en' | 'ar'}
          onClose={() => setShowPrint(false)}
        />
      )}
    </div>
  );
}
