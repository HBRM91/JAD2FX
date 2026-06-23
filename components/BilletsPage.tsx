import React, { useState, useEffect, useCallback } from 'react';
import { BKAM_CURRENCIES } from '../constants';
import { useAdmin, DEFAULT_TIER_COMMISSIONS } from '../context/AdminContext';
import { fetchAllMadRates } from '../services/fxRates';
import { DEFAULT_BASKET_CONFIG } from '../constants';
import { ClientTier } from '../types';
import { useI18n } from '../context/I18nContext';
import {
  Banknote, RefreshCw, ExternalLink, Info, ChevronDown, ShieldAlert, Building2,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FMT4 = (v: number) => v.toFixed(4);
const FMT_BPS = (v: number) => `${v} bps`;

const TIER_ORDER: ClientTier[] = ['CORPORATE', 'SME', 'TPE', 'INDIVIDUAL'];

const TIER_ACCENT: Record<ClientTier, string> = {
  CORPORATE: 'border-gold-500 bg-gold-500/5',
  SME:       'border-blue-500 bg-blue-500/5',
  TPE:       'border-slate-400 bg-slate-50',
  INDIVIDUAL:'border-slate-300 bg-white',
};

const TIER_LABEL: Record<ClientTier, string> = {
  CORPORATE: 'text-gold-600',
  SME:       'text-blue-600',
  TPE:       'text-slate-600',
  INDIVIDUAL:'text-slate-500',
};

// BKAM OC authorized commission range for banknotes (per OC Circ. 01/2024)
const OC_BILLET_RANGE: Record<ClientTier, { min: number; max: number }> = {
  CORPORATE:  { min: 4, max: 8 },
  SME:        { min: 8, max: 15 },
  TPE:        { min: 12, max: 20 },
  INDIVIDUAL: { min: 15, max: 30 },
};

// ─── Rate row ─────────────────────────────────────────────────────────────────

interface BilletRow {
  code: string;
  flag: string;
  nameFr: string;
  bkamUnit: number;
  bkamBilletBuy: number;
  bkamBilletSell: number;
  virementBuy: number;
  virementSell: number;
  source: string;
}

// ─── Main component ───────────────────────────────────────────────────────────

const BilletsPage: React.FC = () => {
  const { config } = useAdmin();
  const { t, locale, isRTL } = useI18n();

  const [rows, setRows] = useState<BilletRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [selectedTier, setSelectedTier] = useState<ClientTier>('SME');
  const [showOcInfo, setShowOcInfo] = useState(false);

  const tierConfig = config.tierCommissions?.[selectedTier] ?? DEFAULT_TIER_COMMISSIONS[selectedTier];

  const buildRows = useCallback(async () => {
    setLoading(true);
    try {
      const { rates } = await fetchAllMadRates(DEFAULT_BASKET_CONFIG);
      const built: BilletRow[] = BKAM_CURRENCIES.map(cur => {
        const live = rates.find(r => r.currency === cur.code);
        const mid  = live?.mid ?? 0;
        const vBuy  = live?.virementBuy  ?? mid * (1 - DEFAULT_BASKET_CONFIG.virementSpreadPercent);
        const vSell = live?.virementSell ?? mid * (1 + DEFAULT_BASKET_CONFIG.virementSpreadPercent);

        // Billets = virement ± extra billet spread
        const bSpread = config.billetSpreadPct ?? DEFAULT_BASKET_CONFIG.billetSpreadPercent;
        const bBuy  = mid * (1 - bSpread);
        const bSell = mid * (1 + bSpread);

        return {
          code: cur.code,
          flag: cur.flag,
          nameFr: cur.nameFr,
          bkamUnit: cur.bkamUnit,
          bkamBilletBuy:  bBuy  * cur.bkamUnit,
          bkamBilletSell: bSell * cur.bkamUnit,
          virementBuy:    vBuy  * cur.bkamUnit,
          virementSell:   vSell * cur.bkamUnit,
          source: live?.source ?? 'FALLBACK',
        };
      });
      setRows(built);
      setLastUpdate(new Date());
    } finally {
      setLoading(false);
    }
  }, [config.billetSpreadPct]);

  useEffect(() => { buildRows(); }, [buildRows]);

  // Client rate with OC commission on top
  const clientBuy  = (row: BilletRow) => row.bkamBilletBuy  * (1 - tierConfig.billetCommBps / 10_000);
  const clientSell = (row: BilletRow) => row.bkamBilletSell * (1 + tierConfig.billetCommBps / 10_000);

  // vs Virement spread
  const vsVirBuy  = (row: BilletRow) => ((row.bkamBilletBuy  - row.virementBuy)  / row.virementBuy  * 10_000);
  const vsVirSell = (row: BilletRow) => ((row.bkamBilletSell - row.virementSell) / row.virementSell * 10_000);

  return (
    <div className={`space-y-6 ${isRTL ? 'text-right' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>

      {/* ── Page Header ── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-navy-900 p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gold-500 opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-white/10 rounded">
                <Banknote size={20} className="text-gold-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-widest uppercase">{t('billets.title')}</h1>
                <p className="text-xs text-gold-500 tracking-wider">{t('billets.subtitle')}</p>
              </div>
            </div>
            <div className="text-[10px] text-slate-400 border border-navy-600/30 rounded px-3 py-1.5 inline-block">
              {t('disclaimer.short')}
            </div>
          </div>
        </div>

        {/* Official links + meta */}
        <div className="p-4 flex flex-wrap gap-3 items-center justify-between border-b border-slate-100">
          <a
            href="https://www.bkam.ma/en/Markets/Key-indicators/Foreign-exchange-market/Foreign-exchange-rates/Foreign-banknotes-exchange-rate"
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-navy-800 font-semibold hover:text-gold-600 transition"
          >
            <ExternalLink size={12} />
            {t('billets.officialLink')}
          </a>
          <div className="flex items-center gap-3">
            {lastUpdate && (
              <span className="text-[10px] text-slate-400">
                {t('common.updated')}: {lastUpdate.toLocaleTimeString(locale === 'ar' ? 'ar-MA' : locale === 'en' ? 'en-GB' : 'fr-MA', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button
              onClick={buildRows}
              disabled={loading}
              className="flex items-center gap-1 text-xs px-3 py-1.5 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition disabled:opacity-50"
            >
              <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
              {t('common.refresh')}
            </button>
          </div>
        </div>

        {/* Cash vs Wire info */}
        <div className="p-4 bg-amber-50 border-b border-amber-100">
          <div className="flex items-start gap-2">
            <Info size={13} className="text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700 leading-relaxed">{t('billets.cashNote')}</p>
          </div>
        </div>
      </div>

      {/* ── Tier selector + OC commission ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Tier selector */}
        <div className="md:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-3">
          <h2 className="text-sm font-bold text-navy-900 uppercase tracking-wider">{t('common.currency')} · Segment Client</h2>
          {TIER_ORDER.map(tier => {
            const tc = config.tierCommissions?.[tier] ?? DEFAULT_TIER_COMMISSIONS[tier];
            const active = selectedTier === tier;
            return (
              <button
                key={tier}
                onClick={() => setSelectedTier(tier)}
                className={`w-full text-left p-3 rounded-lg border-2 transition ${active ? TIER_ACCENT[tier] : 'border-slate-200 bg-white hover:border-slate-300'}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${active ? TIER_LABEL[tier] : 'text-slate-600'}`}>
                    {t(`tier.${tier}`)}
                  </span>
                  {active && <span className="text-[10px] text-gold-600 font-bold">✓ actif</span>}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {t('billets.ocCommission')}: {FMT_BPS(tc.billetCommBps)}
                </div>
              </button>
            );
          })}
        </div>

        {/* OC commission breakdown */}
        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <button
            className="w-full flex items-center justify-between mb-3"
            onClick={() => setShowOcInfo(o => !o)}
          >
            <h2 className="text-sm font-bold text-navy-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert size={14} className="text-gold-600" />
              {t('billets.ocCommission')} — {t(`tier.${selectedTier}`)}
            </h2>
            <ChevronDown size={14} className={`text-slate-400 transition-transform ${showOcInfo ? 'rotate-180' : ''}`} />
          </button>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Commission billet (admin)</p>
              <p className="text-2xl font-mono font-bold text-navy-900">{tierConfig.billetCommBps}<span className="text-sm text-slate-500 ml-1">bps</span></p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Plage OC autorisée</p>
              <p className="text-2xl font-mono font-bold text-navy-900">
                {OC_BILLET_RANGE[selectedTier].min}–{OC_BILLET_RANGE[selectedTier].max}
                <span className="text-sm text-slate-500 ml-1">bps</span>
              </p>
            </div>
          </div>

          {showOcInfo && (
            <div className="mt-3 p-3 bg-gold-50 border border-gold-200 rounded-lg space-y-2 text-xs text-slate-600">
              <p className="font-semibold text-navy-900">Réglementation OC — Billets de banque</p>
              <p>
                Les commissions sur opérations de change billets sont encadrées par la Circulaire de l'Office des Changes.
                Elles se distinguent des commissions virement par les coûts logistiques supplémentaires :
                transport de fonds, assurance, stockage sécurisé, et manutention des espèces.
              </p>
              <p className="text-[10px] text-slate-400 border border-slate-200 rounded px-2 py-1">
                Taux indicatifs — pour un devis : <a href="https://jad2advisory.com" target="_blank" rel="noopener noreferrer" className="text-gold-600 hover:text-gold-500 font-medium">jad2advisory.com</a>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Rate table ── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-navy-900 uppercase tracking-wider flex items-center gap-2">
            <Banknote size={14} className="text-gold-600" />
            Cours Billets — 14 devises BKAM
          </h2>
          <div className="text-[10px] text-slate-400">
            Segment: <span className={`font-bold ${TIER_LABEL[selectedTier]}`}>{t(`tier.${selectedTier}`)}</span>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">{t('common.loading')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[720px]">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] border-b border-slate-200">
                  <th className={`py-3 px-4 font-semibold ${isRTL ? 'text-right' : 'text-left'}`}>{t('common.currency')}</th>
                  <th className="py-3 px-3 text-center font-semibold" colSpan={2}>
                    Cours BKAM Billet (base)
                  </th>
                  <th className="py-3 px-3 text-center font-semibold text-gold-600" colSpan={2}>
                    Cours Client ({t(`tier.${selectedTier}`)})
                  </th>
                  <th className="py-3 px-3 text-center font-semibold text-slate-400" colSpan={2}>
                    {t('billets.vsBillet')} (bps)
                  </th>
                </tr>
                <tr className="bg-slate-50 text-[10px] text-slate-400 border-b border-slate-200">
                  <th className="py-1 px-4" />
                  <th className="py-1 px-3 text-center">{t('common.buy')}</th>
                  <th className="py-1 px-3 text-center">{t('common.sell')}</th>
                  <th className="py-1 px-3 text-center font-medium text-gold-500">{t('common.buy')}</th>
                  <th className="py-1 px-3 text-center font-medium text-gold-500">{t('common.sell')}</th>
                  <th className="py-1 px-3 text-center">Achat</th>
                  <th className="py-1 px-3 text-center">Vente</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.code} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="py-3 px-4">
                      <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <span className="text-base">{row.flag}</span>
                        <div>
                          <p className="font-bold text-navy-900">{row.code}/MAD</p>
                          <p className="text-[10px] text-slate-400">{row.nameFr}</p>
                        </div>
                        {row.bkamUnit !== 1 && (
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">×{row.bkamUnit}</span>
                        )}
                      </div>
                    </td>
                    {/* BKAM billet base */}
                    <td className="py-3 px-3 text-center font-mono text-slate-600">{FMT4(row.bkamBilletBuy)}</td>
                    <td className="py-3 px-3 text-center font-mono text-slate-600">{FMT4(row.bkamBilletSell)}</td>
                    {/* Client rate */}
                    <td className="py-3 px-3 text-center font-mono font-bold text-emerald-700 bg-emerald-50">{FMT4(clientBuy(row))}</td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-red-700 bg-red-50">{FMT4(clientSell(row))}</td>
                    {/* vs Virement */}
                    <td className="py-3 px-3 text-center font-mono text-amber-600 text-[10px]">
                      {vsVirBuy(row) < 0 ? vsVirBuy(row).toFixed(0) : '+' + vsVirBuy(row).toFixed(0)}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-amber-600 text-[10px]">
                      {vsVirSell(row) > 0 ? '+' + vsVirSell(row).toFixed(0) : vsVirSell(row).toFixed(0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Advisory CTA ── */}
      <div className="bg-navy-900 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Building2 size={20} className="text-gold-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-white">{t('footer.advisory')}</p>
            <p className="text-xs text-slate-400">{t('footer.advisoryDesc')}</p>
          </div>
        </div>
        <a
          href="https://jad2advisory.com"
          target="_blank" rel="noopener noreferrer"
          className="flex-shrink-0 px-5 py-2 bg-gold-500 text-navy-900 text-sm font-bold rounded hover:bg-gold-400 transition"
        >
          {t('footer.cta')}
        </a>
      </div>

      {/* Legal */}
      <div className="text-[10px] text-slate-500">
        <p>{t('disclaimer.short')} · {t('disclaimer.noInvestmentAdvice')}</p>
      </div>
    </div>
  );
};

export default BilletsPage;
