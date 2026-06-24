import React, { useState, useMemo, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import {
  Calculator, TrendingUp, Clock, ChevronDown, RotateCw,
  DollarSign, AlertTriangle, BookOpen,
} from 'lucide-react';
import { BKAM_CURRENCIES } from '../constants';
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt4(v: number) { return v.toFixed(4); }
function fmt2(v: number) { return v.toFixed(2); }
function fmtPips(v: number) { return (v >= 0 ? '+' : '') + v.toFixed(2); }
function fmtPct(v: number) { return (v * 100).toFixed(3) + '%'; }
function fmtMAD(v: number) { return new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 }).format(v); }

type Tab = 'PRICER' | 'CURVE' | 'MTM';

// ─── Sub-components ───────────────────────────────────────────────────────────

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

// ─── MTM Calculator ───────────────────────────────────────────────────────────

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

  const heading = locale === 'ar' ? 'تقييم العقد بالسوق (MTM)' : locale === 'en' ? 'Mark-to-Market (MTM)' : 'Valorisation au Marché (MTM)';
  const desc    = locale === 'ar'
    ? 'أدخل معطيات العقد الآجل الأصلي لحساب الربح/الخسارة غير المحقق'
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
            ? 'نتائج تعليمية فقط — استخدم أسعار BKAM الرسمية لأي تقييم فعلي'
            : locale === 'en'
            ? 'Educational results only — use BKAM official fixing for any actual valuation'
            : 'Résultats indicatifs à titre pédagogique — utilisez le fixing BKAM officiel pour toute valorisation réelle'}
        </p>
      </div>

      <div className="bg-navy-900 border border-navy-700 rounded-xl p-5">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-gold-500 mb-4">{heading}</h3>
        <p className="text-[11px] text-slate-400 mb-5 leading-relaxed">{desc}</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          {/* Contract rate */}
          <div>
            <label className="block text-[10px] text-slate-500 mb-1.5 uppercase tracking-wider">
              {locale === 'ar' ? 'السعر الآجل المتعاقد عليه' : locale === 'en' ? 'Contracted Forward Rate' : 'Cours Forward Contracté'}
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
              {locale === 'ar' ? 'المبلغ الافتراضي' : locale === 'en' ? 'Notional' : 'Notionnel'} ({currency})
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
              {locale === 'ar' ? 'اتجاه العقد' : locale === 'en' ? 'Contract Side' : 'Sens du Contrat'}
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
                    ? (locale === 'ar' ? 'شراء' : locale === 'en' ? 'BUY' : 'ACHAT')
                    : (locale === 'ar' ? 'بيع' : locale === 'en' ? 'SELL' : 'VENTE')}
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
                  {locale === 'ar' ? 'السعر الآجل المتعاقد' : locale === 'en' ? 'Contracted Rate' : 'Cours Contracté'}
                </p>
                <p className="text-lg font-mono font-bold text-white">{fmt4(parseFloat(contractRate))}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                  {locale === 'ar' ? 'السعر الفوري الحالي' : locale === 'en' ? 'Current Spot' : 'Spot Actuel'}
                </p>
                <p className="text-lg font-mono font-bold text-gold-400">{fmt4(spot)}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                  {locale === 'ar' ? 'التحرك %' : locale === 'en' ? 'Move %' : 'Mouvement %'}
                </p>
                <p className={`text-lg font-mono font-bold ${mtm.pctMove >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {mtm.pctMove >= 0 ? '+' : ''}{mtm.pctMove.toFixed(3)}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                  {locale === 'ar' ? 'ر.غ. غير محقق (MAD)' : locale === 'en' ? 'Unrealised P&L (MAD)' : 'P&L Latente (MAD)'}
                </p>
                <p className={`text-xl font-mono font-bold ${mtm.mtmMAD >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {mtm.mtmMAD >= 0 ? '+' : ''}{fmtMAD(mtm.mtmMAD)}
                </p>
              </div>
            </div>

            <p className="text-center text-[10px] text-slate-500 mt-4 border-t border-navy-800/50 pt-3">
              {mtm.mtmMAD >= 0
                ? (locale === 'ar' ? '✅ الموقف في صالحك — قيمة السوق أعلى من السعر الآجل'
                  : locale === 'en' ? '✅ In-the-money — current market is more favorable than contracted rate'
                  : '✅ Gain latent — le marché actuel est plus favorable que votre cours forward contracté')
                : (locale === 'ar' ? '❌ الموقف ضدك — قيمة السوق أقل من السعر الآجل'
                  : locale === 'en' ? '❌ Out-of-the-money — current market is less favorable than contracted rate'
                  : '❌ Perte latente — le marché actuel est moins favorable que votre cours forward contracté')
              }
            </p>
          </div>
        )}

        {!contractRate && (
          <div className="text-center py-6 text-slate-600 text-sm">
            {locale === 'ar' ? 'أدخل السعر الآجل المتعاقد عليه لحساب MTM'
              : locale === 'en' ? 'Enter contracted forward rate to compute MTM'
              : 'Saisissez le cours forward contracté pour calculer le MTM'}
          </div>
        )}
      </div>

      {/* Advisory CTA */}
      <div className="text-center p-4 bg-gold-500/5 border border-gold-700/30 rounded-xl">
        <p className="text-xs text-slate-400 mb-2">
          {locale === 'ar' ? 'للحصول على تقييم MTM رسمي، تواصل مع مصرفك'
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

// ─── Main Component ────────────────────────────────────────────────────────────

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
      details: `[SIM] ${direction} ${fmtMAD(notional)} ${currency} @ ${fmt4(quote.forwardRate)} (${fmtPips(quote.forwardPointsPips)} pips) — INDICATIF`,
    });
    logSimTelemetry(config.corsProxyUrl, quote.pair, 'FORWARD_SAVE', quote.tenorDays);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [quote, direction, notional, currency, addBlotterEntry, config.corsProxyUrl]);

  // Labels
  const tabPricer = locale === 'ar' ? 'التسعير' : locale === 'en' ? 'Pricer' : 'Pricer';
  const tabCurve  = locale === 'ar' ? 'المنحنى' : locale === 'en' ? 'Curve' : 'Courbe';
  const tabMtm    = locale === 'ar' ? 'MTM' : 'MTM';

  return (
    <div className="space-y-0">

      {/* ── Bloomberg-style header ── */}
      <div className="bg-navy-950 border border-navy-700 rounded-t-xl px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Calculator size={16} className="text-gold-500" />
              <h2 className="text-base font-bold text-white tracking-widest uppercase">
                {locale === 'ar' ? 'حاسبة العقود الآجلة FX' : locale === 'en' ? 'FX Forward Calculator' : 'Calculateur Forward FX'}
              </h2>
              <span className="text-[9px] font-bold bg-amber-700/30 text-amber-400 border border-amber-700/40 px-1.5 py-0.5 rounded uppercase tracking-wider">
                {locale === 'ar' ? 'تعليمي' : locale === 'en' ? 'Indicative' : 'Indicatif'}
              </span>
            </div>
            <p className="text-slate-500 text-[11px]">
              {locale === 'ar' ? 'معادلة CIP · استيفاء مكعب · 20 زوجاً BKAM'
                : locale === 'en' ? 'CIP formula · Cubic interpolation · 20 BKAM pairs · Holiday-aware T+2 settlement'
                : 'Formule CIP · Interpolation cubique · 20 paires BKAM · Date valeur T+2 corrigée des fériés'}
            </p>
          </div>

          {/* Live spot chip */}
          {spot ? (
            <div className="bg-navy-800 border border-navy-600 rounded-lg px-4 py-2 text-right">
              <p className="text-[9px] text-slate-500 uppercase tracking-wider">
                {curInfo?.flag} {currency}/MAD {locale === 'ar' ? 'فوري' : 'Spot'}
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
                {locale === 'ar' ? 'جارٍ جلب الأسعار…'
                  : locale === 'en' ? 'Fetching rates…'
                  : 'Chargement des taux…'}
              </p>
            </div>
          )}
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 mt-4 border-b border-navy-700">
          <TabButton active={activeTab === 'PRICER'} onClick={() => setActiveTab('PRICER')}>{tabPricer}</TabButton>
          <TabButton active={activeTab === 'CURVE'}  onClick={() => setActiveTab('CURVE')}>{tabCurve}</TabButton>
          <TabButton active={activeTab === 'MTM'}    onClick={() => setActiveTab('MTM')}>{tabMtm}</TabButton>
        </div>
      </div>

      <div className="bg-navy-950/60 border border-t-0 border-navy-700 rounded-b-xl p-6">

        {/* ── PRICER TAB ── */}
        {activeTab === 'PRICER' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

            {/* Left: Inputs (2 cols) */}
            <div className="lg:col-span-2 space-y-4">

              {/* Currency + Direction */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1.5 uppercase tracking-wider">
                    {locale === 'ar' ? 'العملة' : locale === 'en' ? 'Currency' : 'Devise'}
                  </label>
                  <div className="relative">
                    <select
                      value={currency}
                      onChange={e => setCurrency(e.target.value)}
                      className="w-full appearance-none bg-navy-800 border border-navy-600 text-white text-sm rounded px-3 py-2 pr-8 focus:outline-none focus:border-gold-500"
                    >
                      {BKAM_CURRENCIES.map(c => (
                        <option key={c.code} value={c.code}>{c.flag} {c.code}/MAD</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1.5 uppercase tracking-wider">
                    {locale === 'ar' ? 'الاتجاه' : locale === 'en' ? 'Direction' : 'Sens'}
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
                          ? (locale === 'ar' ? 'شراء' : 'BUY')
                          : (locale === 'ar' ? 'بيع' : 'SELL')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tenor chips */}
              <div>
                <label className="block text-[10px] text-slate-500 mb-2 uppercase tracking-wider">
                  {locale === 'ar' ? 'الأجل' : locale === 'en' ? 'Tenor' : 'Échéance'}
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
                      {locale === 'ar' ? 'تاريخ التسوية المخصص' : locale === 'en' ? 'Custom Settlement Date' : 'Date de Valeur Personnalisée'}
                    </label>
                    <input type="date" value={customDate}
                      onChange={e => setCustomDate(e.target.value)}
                      className="w-full bg-navy-800 border border-navy-600 text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-gold-500"
                    />
                    <p className="text-[10px] text-slate-600 mt-1">
                      {locale === 'ar'
                        ? 'التاريخ المطلوب للتسوية (بعد T+2 فوري)'
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
                  {locale === 'ar' ? 'المبلغ' : locale === 'en' ? 'Notional' : 'Notionnel'} ({currency})
                </label>
                <input
                  type="number" value={notional}
                  onChange={e => setNotional(Math.max(0, Number(e.target.value)))}
                  step={100_000} min={0}
                  className="w-full bg-navy-800 border border-navy-600 text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-gold-500 font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1 font-mono">
                  ≈ {new Intl.NumberFormat(locale === 'ar' ? 'ar-MA' : locale === 'en' ? 'en-GB' : 'fr-FR').format(notional)} {currency}
                </p>
              </div>

              {config.forwardMarkupBps > 0 && (
                <p className="text-[10px] text-amber-400 bg-amber-950/30 border border-amber-800/30 rounded px-2 py-1">
                  {locale === 'ar' ? `هامش Admin: ${config.forwardMarkupBps} نقطة أساس مضافة`
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
                        {curInfo?.flag} {currency}/MAD — {locale === 'ar' ? 'عرض سعر آجل' : locale === 'en' ? 'Forward Quote' : 'Cotation Forward'}
                      </h3>
                      <span className="text-[9px] font-mono text-slate-500">{settlement}</span>
                    </div>

                    {/* Big forward rate */}
                    <div className="text-center border border-navy-700 rounded-lg py-4 mb-4 bg-navy-800/40">
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">
                        {locale === 'ar' ? 'السعر الآجل' : locale === 'en' ? 'Forward Rate' : 'Cours Forward'}
                      </p>
                      <p className="text-4xl font-mono font-bold text-gold-400">{fmt4(quote.forwardRate)}</p>
                      <p className="text-sm font-mono font-bold mt-1 {quote.forwardPointsPips >= 0 ? 'text-emerald-400' : 'text-red-400'}">
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
                      <TermRow label={locale === 'ar' ? 'السعر الفوري' : locale === 'en' ? 'Spot Rate' : 'Cours Spot'} value={fmt4(quote.spot)} unit="MAD" />
                      <TermRow label={locale === 'ar' ? 'أيام الأجل' : locale === 'en' ? 'Tenor Days' : 'Jours Échéance'} value={String(quote.tenorDays)} unit="j" />
                      <TermRow label={locale === 'ar' ? 'سعر MAD' : 'MAD Rate'} value={fmtPct(quote.madRate)} />
                      <TermRow label={locale === 'ar' ? `سعر ${currency}` : `${currency} Rate`} value={fmtPct(quote.fcyRate)} />
                      <TermRow label={locale === 'ar' ? 'تاريخ التسوية' : locale === 'en' ? 'Settlement' : 'Date Valeur'} value={settlement} />
                    </div>
                  </div>

                  {/* Net cost box */}
                  <div className="bg-navy-900 border border-gold-700/40 rounded-xl px-5 py-4">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">
                      {locale === 'ar' ? 'الكلفة الصافية الاسترشادية للعقد الآجل'
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
                        ? (locale === 'ar' ? '✓ تم الحفظ' : locale === 'en' ? '✓ Saved' : '✓ Enregistré')
                        : (locale === 'ar' ? 'حفظ في الدفتر' : locale === 'en' ? 'Save to Blotter' : 'Enregistrer la Simulation')}
                    </button>
                    <a href="https://jad2advisory.com" target="_blank" rel="noopener noreferrer"
                       className="flex-1 py-2.5 text-center text-xs font-bold bg-gold-500 hover:bg-gold-400 text-navy-900 rounded transition">
                      {locale === 'ar' ? 'عرض حقيقي ← JAD2' : locale === 'en' ? 'Live Quote → JAD2' : 'Devis Réel → JAD2 Advisory'}
                    </a>
                  </div>

                  <p className="text-[10px] text-amber-400/70 text-center">
                    ⚠️ {locale === 'ar' ? 'نتائج تعليمية فقط' : locale === 'en' ? 'Educational simulation only' : 'Simulation indicative uniquement'}
                  </p>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center min-h-[300px] bg-navy-900 border border-navy-700 rounded-xl">
                  <p className="text-slate-500 text-sm text-center px-4">
                    {!spot
                      ? (locale === 'ar' ? 'لا يوجد سعر — أضف بيانات أو اضبط في Admin'
                        : locale === 'en' ? 'No spot rate — fetch prices or set override in Admin'
                        : 'Pas de cours spot — actualisez ou configurez Admin')
                      : (locale === 'ar' ? 'حدد معاملات الحساب'
                        : locale === 'en' ? 'Configure parameters above'
                        : 'Configurez les paramètres ci-dessus')}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── CURVE TAB ── */}
        {activeTab === 'CURVE' && (
          <div className="space-y-5">
            {curvePoints.length > 0 ? (
              <>
                <div className="bg-navy-900 border border-navy-700 rounded-xl p-5">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-gold-500 mb-4 flex items-center gap-2">
                    <TrendingUp size={12} />
                    {currency}/MAD — {locale === 'ar' ? 'منحنى النقاط الآجلة (نقطة أساس / أجل)' : locale === 'en' ? 'Forward Points Curve (pips vs tenor)' : 'Courbe des Points Forward (pips vs échéance)'}
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
                        formatter={(v: number) => [`${v >= 0 ? '+' : ''}${v.toFixed(2)} pips`, 'Fwd Points']}
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
                    {locale === 'ar' ? `المنحنى الكامل — ${currency}/MAD` : locale === 'en' ? `Full Curve — ${currency}/MAD` : `Courbe Complète — ${currency}/MAD`}
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
                                locale === 'ar' ? 'معدل محسوب بالاستيفاء (ليس نقطة ارتكاز مباشرة)'
                                : locale === 'en' ? 'Interpolated — not a direct curve knot'
                                : 'Interpolé — pas de nœud direct sur la courbe'
                              }>
                                {row.tenor}<sup className="text-[8px] text-amber-400 ml-0.5">*</sup>
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
                        ? 'يُحسب هذا الأجل بالاستيفاء التكعيبي الطبيعي — ليست نقطة ارتكاز مباشرة في منحنى MAD أو العملة الأجنبية'
                        : locale === 'en'
                        ? 'Rate computed by natural cubic spline interpolation — not a direct knot in MAD or FCY base curve'
                        : 'Taux calculé par interpolation spline cubique — aucun nœud direct dans la courbe MAD ou FCY'}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center min-h-[250px] text-slate-500 text-sm">
                {locale === 'ar' ? 'لا يوجد سعر فوري متاح' : locale === 'en' ? 'No spot rate available — fetch prices first' : 'Pas de cours spot disponible — actualisez les prix d\'abord'}
              </div>
            )}
          </div>
        )}

        {/* ── MTM TAB ── */}
        {activeTab === 'MTM' && (
          <MtmSection spot={spot} currency={currency} />
        )}
      </div>
    </div>
  );
}
