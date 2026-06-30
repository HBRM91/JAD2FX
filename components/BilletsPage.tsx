import React, { useState, useEffect, useCallback } from 'react';
import { BKAM_CURRENCIES, CURRENCY_ORDER } from '../constants';
import { useAdmin } from '../context/AdminContext';
import { fetchBkamBBE, fetchBkamBBEDate, bbeToMadPerUnit, getLastNWorkingDays } from '../services/bkamApi';
import { previousBusinessDayISO } from '../services/holidays';
import { useI18n } from '../context/I18nContext';
import { Banknote, RefreshCw, ExternalLink, Info, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import CurrencyFlag from './CurrencyFlag';
import { BKAM_LINKS } from '../constants/bkamLinks';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BilletRow {
  code: string;
  countryCode: string;
  name: string;
  nameFr: string;
  nameAr: string;
  bkamUnit: number;
  // Official BKAM BBE rates (per bkamUnit, as published — no markup)
  officialBuy:  number;  // achatClientele scaled to bkamUnit
  officialSell: number;  // venteClientele scaled to bkamUnit
  // 24h comparison
  prevBuy:  number | null;
  prevSell: number | null;
  changeBuyBps:  number | null;
  source: 'BKAM_OFFICIAL' | 'COMPUTED';
  bbeDate: string;
}

// ─── LocalStorage — persist today's BBE rates for tomorrow's 24h diff ────────

const LS_BBE_KEY = 'jad2fx_bbe_prev_v2';

interface BbeStored {
  rates: Record<string, { bid: number; ask: number }>;
  date: string;
}

function loadPrevBbeRates(): { map: Record<string, { bid: number; ask: number }>; date: string } | null {
  try {
    const raw = localStorage.getItem(LS_BBE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BbeStored;
    return { map: parsed.rates, date: parsed.date };
  } catch { return null; }
}

function saveBbeRates(map: Record<string, { bid: number; ask: number }>, date: string): void {
  try {
    const today = new Date().toISOString().slice(0, 10);
    // Only overwrite if this is fresh data (today's date)
    if (date === today || date.startsWith(today)) {
      localStorage.setItem(LS_BBE_KEY, JSON.stringify({ rates: map, date: today }));
    }
  } catch {}
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function changeBps(curr: number, prev: number): number {
  if (!prev) return 0;
  return Math.round(((curr - prev) / prev) * 10_000);
}

function fmt4(v: number) { return v.toFixed(4); }

function getCurrencyName(row: Pick<BilletRow, 'name' | 'nameFr' | 'nameAr'>, locale: string): string {
  if (locale === 'ar') return row.nameAr;
  if (locale === 'en') return row.name;
  return row.nameFr;
}

// ─── Main component ───────────────────────────────────────────────────────────

const BilletsPage: React.FC = () => {
  const { config } = useAdmin();
  const { locale, isRTL } = useI18n();

  const [rows, setRows] = useState<BilletRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [bbeDate, setBbeDate] = useState<string>('');

  const buildRows = useCallback(async () => {
    setLoading(true);
    try {
      const proxy = config.corsProxyUrl || undefined;

      // Fetch current BBE from BKAM API
      let bbeMap: Record<string, { bid: number; ask: number }> = {};
      let fetchedDate = new Date().toISOString().slice(0, 10);
      let isOfficial = false;

      if (proxy) {
        try {
          const bbe = await fetchBkamBBE(proxy);
          if (bbe.length > 0) {
            bbeMap = bbeToMadPerUnit(bbe);
            isOfficial = true;
            fetchedDate = bbe[0]?.date?.slice(0, 10) ?? fetchedDate;
            // Persist today's BBE for tomorrow's 24h change
            saveBbeRates(bbeMap, fetchedDate);
          }
        } catch { /* fall through to computed */ }
      }

      // Previous day BBE — try API first, then localStorage
      let prevMap: Record<string, { bid: number; ask: number }> = {};
      const yesterday = previousBusinessDayISO();

      if (proxy && isOfficial) {
        try {
          const prevBbe = await fetchBkamBBEDate(proxy, yesterday);
          if (prevBbe.length > 0) prevMap = bbeToMadPerUnit(prevBbe);
        } catch {
          // Fall back to localStorage
          const stored = loadPrevBbeRates();
          if (stored?.date === yesterday) prevMap = stored.map;
        }
      } else {
        const stored = loadPrevBbeRates();
        if (stored?.date === yesterday) prevMap = stored.map;
      }

      // Admin-configured commercial margin (internal only — never shown to users)
      // Applied only when BKAM BBE is unavailable (COMPUTED mode).
      const adminMargin = config.billetSpreadPct ?? 0.018;

      // Build rows in canonical G10 order
      const built: BilletRow[] = BKAM_CURRENCIES
        .sort((a, b) => (CURRENCY_ORDER[a.code] ?? 99) - (CURRENCY_ORDER[b.code] ?? 99))
        .map(cur => {
          const bbePair = bbeMap[cur.code];
          const prevPair = prevMap[cur.code] ?? null;

          let buy: number, sell: number, source: 'BKAM_OFFICIAL' | 'COMPUTED';

          if (bbePair) {
            // Official BKAM rate — already in MAD per 1 unit; scale by bkamUnit for display
            buy  = bbePair.bid * cur.bkamUnit;
            sell = bbePair.ask * cur.bkamUnit;
            source = 'BKAM_OFFICIAL';
          } else {
            // Compute proxy from admin margin (internal, not shown as such)
            // Without BKAM we don't have a reliable mid — skip or show 0
            buy  = 0;
            sell = 0;
            source = 'COMPUTED';
          }

          const prevBuy  = prevPair ? prevPair.bid * cur.bkamUnit : null;
          const prevSell = prevPair ? prevPair.ask * cur.bkamUnit : null;

          return {
            code: cur.code,
            countryCode: cur.countryCode,
            name: cur.name,
            nameFr: cur.nameFr,
            nameAr: cur.nameAr,
            bkamUnit: cur.bkamUnit,
            officialBuy:  buy,
            officialSell: sell,
            prevBuy,
            prevSell,
            changeBuyBps: prevBuy && buy ? changeBps(buy, prevBuy) : null,
            source,
            bbeDate: fetchedDate,
          };
        })
        .filter(r => r.officialBuy > 0 || r.source === 'BKAM_OFFICIAL');

      setBbeDate(fetchedDate);
      setRows(built);
      setLastUpdate(new Date());
    } finally {
      setLoading(false);
    }
  }, [config.corsProxyUrl, config.billetSpreadPct]);

  useEffect(() => { buildRows(); }, [buildRows]);

  const officialCount = rows.filter(r => r.source === 'BKAM_OFFICIAL').length;

  return (
    <div className={`space-y-5 ${isRTL ? 'text-right' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>

      {/* ── Header ── */}
      <div className="bg-navy-900 border border-navy-700 rounded-xl overflow-hidden">
        <div className="h-0.5 bg-gradient-to-r from-gold-700 via-gold-400 to-gold-700" />
        <div className="px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <Banknote size={16} className="text-gold-500" />
                <h1 className="text-lg font-bold text-white uppercase tracking-widest">
                  {locale === 'ar' ? 'أسعار الأوراق النقدية الأجنبية — بنك المغرب' :
                   locale === 'en' ? 'Foreign Banknote Rates — Bank Al-Maghrib' :
                   'Cours Billets de Banque Étrangers — Bank Al-Maghrib'}
                </h1>
              </div>
              <p className="text-[11px] text-slate-400">
                {locale === 'ar' ? 'الأسعار الرسمية المنشورة يومياً · CoursBBE · مصدر: بنك المغرب' :
                 locale === 'en' ? 'Official daily rates · CoursBBE · Source: Bank Al-Maghrib' :
                 'Cours officiels publiés quotidiennement · CoursBBE · Source: Bank Al-Maghrib'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {lastUpdate && (
                <span className="text-[10px] text-slate-500 font-mono">
                  {lastUpdate.toLocaleTimeString(locale === 'ar' ? 'ar-MA' : 'fr-MA', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              <button
                onClick={buildRows}
                disabled={loading}
                className="flex items-center gap-1 text-xs px-3 py-1.5 bg-navy-800 border border-navy-700 text-slate-300 rounded hover:border-gold-600 hover:text-gold-400 transition disabled:opacity-40"
              >
                <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
                {locale === 'ar' ? 'تحديث' : locale === 'en' ? 'Refresh' : 'Actualiser'}
              </button>
              <a
                href={BKAM_LINKS.fixingBanknotes}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] text-gold-500 hover:text-gold-300 transition"
              >
                <ExternalLink size={11} />
                BKAM
              </a>
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div className="px-5 py-2 border-t border-navy-800 flex flex-wrap items-center gap-3">
          {officialCount > 0 && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-700/40 bg-emerald-950/20 text-emerald-400">
              ✓ {officialCount} {locale === 'ar' ? 'أسعار رسمية BKAM' : locale === 'en' ? 'official BKAM rates' : 'cours officiels BKAM'}
            </span>
          )}
          {bbeDate && (
            <span className="text-[10px] text-slate-500 font-mono">
              {locale === 'ar' ? 'تاريخ:' : locale === 'en' ? 'Date:' : 'Date:'} {bbeDate}
            </span>
          )}
          {officialCount === 0 && !loading && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-amber-700/40 bg-amber-950/20 text-amber-400">
              ⚠ {locale === 'ar' ? 'بيانات BKAM غير متاحة — تحقق Ù…Ù† إعداد الوكيل' :
                  locale === 'en' ? 'BKAM data unavailable — check proxy config' :
                  'Données BKAM indisponibles — vérifiez la configuration proxy'}
            </span>
          )}
        </div>
      </div>

      {/* ── Regulatory note ── */}
      <div className="flex items-start gap-3 bg-amber-950/15 border border-amber-800/30 rounded-xl px-4 py-3">
        <Info size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-300/90 leading-relaxed">
          {locale === 'ar'
            ? 'الأسعار أدناه Ù‡ÙŠ الأسعار الرسمية التي تنشرها يومياً بنك المغرب. تُطبِّق البنوك التجارية المعتمدة هوامشها الخاصة على هذه الأسعار. للحصول على السعر المطبَّق فعلياً على عمليتك، تواصل مع بنكك المعتمد لدى بنك المغرب.'
            : locale === 'en'
            ? 'The rates below are the official daily rates published by Bank Al-Maghrib. Licensed commercial banks apply their own commercial margins above these rates. For the exact rate applicable to your transaction, contact your BAM-licensed bank.'
            : 'Les cours ci-dessous sont les taux officiels quotidiens publiés par Bank Al-Maghrib. Les banques commerciales agréées appliquent leurs propres marges commerciales sur la base de ces cours. Pour le taux effectivement applicable à votre opération, contactez votre établissement bancaire agréé par Bank Al-Maghrib.'}
        </p>
      </div>

      {/* ── Rate table ── */}
      <div className="bg-navy-900 border border-navy-700 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-navy-800 flex items-center justify-between">
          <h2 className="text-[11px] font-bold text-white uppercase tracking-widest flex items-center gap-2">
            <Banknote size={13} className="text-gold-500" />
            {locale === 'ar' ? `الأسعار الرسمية — ${rows.length} عملة` :
             locale === 'en' ? `Official Rates — ${rows.length} currencies` :
             `Cours Officiels — ${rows.length} devises`}
          </h2>
          <span className="text-[10px] text-slate-500">
            {locale === 'ar' ? 'الأسعار المعروضة: achatClientele / venteClientele — بنك المغرب' :
             locale === 'en' ? 'Rates shown: achatClientele / venteClientele — Bank Al-Maghrib' :
             'Cours affichés: achatClientele / venteClientele — Bank Al-Maghrib'}
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            <RefreshCw size={20} className="animate-spin mx-auto mb-3 text-gold-500" />
            {locale === 'ar' ? 'جارٍ تحميل أسعار البنك المغرب…' :
             locale === 'en' ? 'Loading BKAM rates…' :
             'Chargement des cours BKAM…'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[640px]">
              <thead>
                <tr className="bg-navy-950/60 text-[10px] text-slate-400 uppercase tracking-wider border-b border-navy-800">
                  <th className="py-3 px-4 text-left font-semibold">
                    {locale === 'ar' ? 'العملة' : locale === 'en' ? 'Currency' : 'Devise'}
                  </th>
                  <th className="py-3 px-3 text-center font-semibold">
                    {locale === 'ar' ? 'الوحدة' : 'Unité'}
                  </th>
                  <th className="py-3 px-3 text-right font-semibold text-emerald-400">
                    {locale === 'ar' ? 'شراء (أوراق نقدية)' : locale === 'en' ? 'Buy (Banknotes)' : 'Achat (Billets)'}
                  </th>
                  <th className="py-3 px-3 text-right font-semibold text-red-400">
                    {locale === 'ar' ? 'بيع (أوراق نقدية)' : locale === 'en' ? 'Sell (Banknotes)' : 'Vente (Billets)'}
                  </th>
                  <th className="py-3 px-3 text-right font-semibold">
                    {locale === 'ar' ? 'التغير 24س (ش)' : locale === 'en' ? 'Change 24h (Buy)' : 'Var. 24h (Achat)'}
                  </th>
                  <th className="py-3 px-4 text-center font-semibold">
                    {locale === 'ar' ? 'المصدر' : 'Source'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800/40">
                {rows.map(row => {
                  const bps = row.changeBuyBps;
                  const isUp = bps !== null && bps > 0;
                  const isDn = bps !== null && bps < 0;
                  const ChgIcon = isUp ? TrendingUp : isDn ? TrendingDown : Minus;
                  const chgColor = isUp ? 'text-red-400' : isDn ? 'text-emerald-400' : 'text-slate-500';

                  return (
                    <tr key={row.code} className="hover:bg-navy-800/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className={`flex items-center gap-2.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <CurrencyFlag countryCode={row.countryCode} size="sm" />
                          <div>
                            <p className="font-bold text-white text-[12px]">{row.code}/MAD</p>
                            <p className="text-[10px] text-slate-500">{getCurrencyName(row, locale)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-400 text-[10px]">
                        {row.bkamUnit === 1 ? '1' : `×${row.bkamUnit}`}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="font-mono font-bold text-emerald-400 text-[13px] tabular-nums">
                          {fmt4(row.officialBuy)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="font-mono font-bold text-red-400 text-[13px] tabular-nums">
                          {fmt4(row.officialSell)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {bps !== null ? (
                          <div className={`flex items-center justify-end gap-1 ${chgColor}`}>
                            <ChgIcon size={10} />
                            <span className="font-mono text-[11px] font-bold tabular-nums">
                              {isUp ? '+' : ''}{bps} bps
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-600 text-[10px]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {row.source === 'BKAM_OFFICIAL' ? (
                          <span className="text-[10px] font-mono bg-emerald-950/30 text-emerald-400 border border-emerald-800/40 px-1.5 py-0.5 rounded">
                            BKAM
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono bg-amber-950/20 text-amber-500 border border-amber-800/30 px-1.5 py-0.5 rounded">
                            CALC
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table footer */}
        <div className="px-5 py-3 border-t border-navy-800 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] text-slate-500 leading-relaxed">
            {locale === 'ar'
              ? 'المصدر: بنك المغرب — CoursBBE (أوراق نقدية أجنبية) · منشور يومياً في 08:30 صباحاً · الأسعار الرسمية لا تشمل العمولات التجارية للبنوك'
              : locale === 'en'
              ? 'Source: Bank Al-Maghrib — CoursB.B.E · Published daily at 08:30 Casablanca · Official rates do not include commercial bank margins'
              : 'Source: Bank Al-Maghrib — CoursB.B.E (Billets de Banque Étrangers) · Publié quotidiennement à 08h30 · Ces cours ne comprennent pas les marges commerciales des banques'}
          </p>
          <a
            href={BKAM_LINKS.fixingBanknotes}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] text-gold-500 hover:text-gold-300 font-semibold transition"
          >
            <ExternalLink size={10} />
            {locale === 'ar' ? 'الأسعار الرسمية BKAM' :
             locale === 'en' ? 'Official BKAM rates' :
             'Cours officiels BKAM ↗'}
          </a>
        </div>
      </div>

      {/* ── Explanation card ── */}
      <div className="bg-navy-900 border border-navy-700 rounded-xl p-5 space-y-3">
        <h3 className="text-[11px] font-bold text-white uppercase tracking-widest">
          {locale === 'ar' ? 'فهم أسعار الأوراق النقدية' :
           locale === 'en' ? 'Understanding Banknote Rates' :
           'Comprendre les Cours Billets'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-[11px]">
          {[
            {
              title: locale === 'ar' ? 'المصدر الرسمي' : locale === 'en' ? 'Official Source' : 'Source officielle',
              body: locale === 'ar'
                ? 'يصدر بنك المغرب يومياً أسعار الشراء والبيع الرسمية للعملات الأجنبية في شكل أوراق نقدية. تُمثِّل هذه الأسعار الحدود المرجعية للعمليات.'
                : locale === 'en'
                ? 'Bank Al-Maghrib publishes daily official buy/sell rates for foreign banknotes. These rates represent the official regulatory reference for banknote transactions.'
                : 'Bank Al-Maghrib publie quotidiennement les cours officiels d\'achat et de vente pour les billets de banque étrangers. Ces cours constituent le référentiel réglementaire officiel.',
              icon: 'ðŸ›',
            },
            {
              title: locale === 'ar' ? 'أسعار البنوك التجارية' : locale === 'en' ? 'Commercial Bank Rates' : 'Cours bancaires commerciaux',
              body: locale === 'ar'
                ? 'تُطبِّق البنوك التجارية المعتمدة Ù…Ù† بنك المغرب هوامشها الخاصة فوق هذه الأسعار الرسمية. للاطلاع على السعر الفعلي المطبَّق، تواصل مباشرة مع بنكك.'
                : locale === 'en'
                ? 'Licensed commercial banks apply their own margins above these official rates. Contact your bank directly for the rate applicable to your specific transaction.'
                : 'Les banques commerciales agréées appliquent leurs propres marges commerciales au-dessus de ces cours. Pour le cours applicable à votre opération, contactez directement votre banque.',
              icon: 'ðŸ¦',
            },
            {
              title: locale === 'ar' ? 'الفرق بين التحويل والأوراق النقدية' : locale === 'en' ? 'Wire vs. Banknotes' : 'Virements vs. Billets',
              body: locale === 'ar'
                ? 'أسعار الأوراق النقدية أقل ملاءمةً عموماً Ù…Ù† أسعار التحويلات بسبب تكاليف المناولة المادية (Ù†Ù‚Ù„ الأموال، التأمين، التخزين الآمن، العد). هذا الفارق Ù‡ÙŠÙƒÙ„ÙŠ في النظام المصرفي.'
                : locale === 'en'
                ? 'Banknote rates are generally less favorable than wire transfer rates due to physical handling costs (cash transport, insurance, secure storage, counting). This differential is structural across banking systems.'
                : 'Les cours billets sont structurellement moins favorables que les cours virements en raison des coûts logistiques : transport de fonds, assurance, stockage sécurisé, manipulation physique des espèces.',
              icon: 'ðŸ’µ',
            },
          ].map(card => (
            <div key={card.title} className="bg-navy-950/50 border border-navy-700 rounded-lg p-3.5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{card.icon}</span>
                <p className="font-bold text-white text-[11px]">{card.title}</p>
              </div>
              <p className="text-slate-400 leading-relaxed">{card.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Disclaimer ── */}
      <p className="text-[10px] text-slate-600 leading-relaxed">
        {locale === 'ar'
          ? 'JAD2FX يعيد نشر الأسعار الرسمية لبنك المغرب لأغراض تعليمية وإعلامية فحسب. هذه الأسعار لا تمثل عروضاً قابلة للتنفيذ. JAD2 Advisory ليست مؤسسة مرخصة لتقديم خدمات الاستثمار ولا تُنفِّذ عمليات صرف العملات. لأي عملية صرف، تواصل مع بنك معتمد لدى بنك المغرب.'
          : locale === 'en'
          ? 'JAD2FX reproduces official Bank Al-Maghrib rates for educational and informational purposes only. These rates do not constitute executable offers. JAD2 Advisory is not a licensed investment service provider and does not execute currency transactions. For any exchange transaction, contact a BAM-licensed bank.'
          : 'JAD2FX reproduit les cours officiels de Bank Al-Maghrib à titre éducatif et informatif uniquement. Ces cours ne constituent pas des offres exécutables. JAD2 Advisory n\'est pas habilitée à fournir des services d\'investissement et n\'exécute aucune transaction de change. Pour toute opération de change, adressez-vous à un établissement de crédit agréé par Bank Al-Maghrib.'}
      </p>
    </div>
  );
};

export default BilletsPage;

