import React, { useState } from 'react';
import { LiveRate } from '../types';
import { BKAM_CURRENCIES, CURRENCY_ORDER } from '../constants';
import { useI18n } from '../context/I18nContext';
import { TrendingUp, TrendingDown, Minus, Settings2 } from 'lucide-react';
import CurrencyFlag from './CurrencyFlag';

interface Props {
  rates: LiveRate[];
}

const currencyMeta = Object.fromEntries(BKAM_CURRENCIES.map(c => [c.code, c]));

function heatColor(chg: number): string {
  if (chg > 0.5)  return 'bg-emerald-600 border-emerald-500 text-white';
  if (chg > 0.15) return 'bg-emerald-800/70 border-emerald-700 text-emerald-200';
  if (chg > 0)    return 'bg-emerald-900/50 border-emerald-800 text-emerald-400';
  if (chg === 0)  return 'bg-navy-800/60 border-navy-700 text-slate-400';
  if (chg > -0.15) return 'bg-red-900/50 border-red-800 text-red-400';
  if (chg > -0.5)  return 'bg-red-800/70 border-red-700 text-red-200';
  return 'bg-red-600 border-red-500 text-white';
}

export default function CurrencyHeatmap({ rates }: Props) {
  const { locale, isRTL } = useI18n();

  const [filterOpen, setFilterOpen] = useState(false);
  const [visibleCodes, setVisibleCodes] = useState<Set<string>>(() => {
    try {
      const s = localStorage.getItem('jad2fx_heat_ccy');
      return s ? new Set(JSON.parse(s)) : new Set(BKAM_CURRENCIES.map(c => c.code));
    } catch { return new Set(BKAM_CURRENCIES.map(c => c.code)); }
  });
  function toggleCode(code: string) {
    setVisibleCodes(prev => {
      const next = new Set(prev);
      if (next.has(code)) { if (next.size <= 1) return prev; next.delete(code); } else { next.add(code); }
      localStorage.setItem('jad2fx_heat_ccy', JSON.stringify([...next]));
      return next;
    });
  }

  const sorted = [...rates]
    .filter(r => visibleCodes.has(r.currency))
    .sort((a, b) => (CURRENCY_ORDER[a.currency] ?? 99) - (CURRENCY_ORDER[b.currency] ?? 99));

  const title = locale === 'ar' ? 'خريطة حرارة العملات — 24 ساعة' : locale === 'en' ? 'Currency Heatmap — 24h Performance' : 'Heatmap Devises — Performance 24h';

  return (
    <div className={`bg-navy-900/90 border border-navy-700 rounded-xl overflow-hidden ${isRTL ? 'text-right' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="px-5 py-3 border-b border-navy-700 flex items-center justify-between">
        <h3 className="text-xs font-bold text-white uppercase tracking-widest">{title}</h3>
        <div className="flex items-center gap-3 text-[9px] font-mono">
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-emerald-600 rounded inline-block" /> {locale === 'ar' ? 'صعود' : locale === 'en' ? 'Rising' : 'Hausse'}</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-600 rounded inline-block" /> {locale === 'ar' ? 'هبوط' : locale === 'en' ? 'Falling' : 'Baisse'}</span>
          <button
            onClick={() => setFilterOpen(o => !o)}
            className={`flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded border transition ${filterOpen ? 'border-gold-600/50 text-gold-400' : 'border-navy-700 text-navy-400 hover:border-navy-600 hover:text-slate-300'}`}
          >
            <Settings2 size={9} />
            {visibleCodes.size < BKAM_CURRENCIES.length ? `${visibleCodes.size}/${BKAM_CURRENCIES.length}` : 'Filtrer'}
          </button>
        </div>
      </div>
      {filterOpen && (
        <div className="px-4 pt-2 pb-3 border-b border-navy-800 flex flex-wrap gap-1.5">
          {BKAM_CURRENCIES.map(c => (
            <button key={c.code} onClick={() => toggleCode(c.code)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-all ${visibleCodes.has(c.code) ? 'bg-gold-500/15 border-gold-600/50 text-gold-300' : 'bg-navy-900 border-navy-700 text-slate-600 hover:border-navy-600'}`}>
              <CurrencyFlag countryCode={c.countryCode} size="xs" />
              {c.code}
            </button>
          ))}
        </div>
      )}
      <div className="p-4 grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-10 gap-2">
        {sorted.map(rate => {
          const meta = currencyMeta[rate.currency];
          const chg = rate.change24h ?? 0;
          const Icon = chg > 0 ? TrendingUp : chg < 0 ? TrendingDown : Minus;
          return (
            <div
              key={rate.currency}
              className={`border rounded-lg p-2 text-center cursor-default transition-all hover:scale-105 ${heatColor(chg)}`}
            >
              <div className="flex justify-center mb-0.5">
                {meta ? <CurrencyFlag countryCode={meta.countryCode} size="md" /> : <span className="text-base">🌐</span>}
              </div>
              <div className="text-[10px] font-bold">{rate.currency}</div>
              <div className="flex items-center justify-center gap-0.5 mt-0.5">
                <Icon size={9} />
                <span className="text-[9px] font-mono font-bold">
                  {chg >= 0 ? '+' : ''}{chg.toFixed(2)}%
                </span>
              </div>
              <div className="text-[9px] font-mono opacity-75 mt-0.5">
                {rate.mid.toFixed(3)}
              </div>
            </div>
          );
        })}
      </div>
      <div className="px-5 py-2 border-t border-navy-800">
        <p className="text-[9px] text-navy-600 font-mono">
          {locale === 'ar' ? 'التغيير مقارنةً بآخر يوم عمل · أسعار استرشادية' : locale === 'en' ? '24h change vs previous business day · indicative rates' : 'Variation 24h vs veille ouvrable · taux indicatifs'}
        </p>
      </div>
    </div>
  );
}
