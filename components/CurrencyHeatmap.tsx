import React from 'react';
import { LiveRate } from '../types';
import { BKAM_CURRENCIES } from '../constants';
import { useI18n } from '../context/I18nContext';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

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

  const sorted = [...rates].sort((a, b) => (b.change24h ?? 0) - (a.change24h ?? 0));

  const title = locale === 'ar' ? 'خريطة حرارة العملات — 24 ساعة' : locale === 'en' ? 'Currency Heatmap — 24h Performance' : 'Heatmap Devises — Performance 24h';

  return (
    <div className={`bg-navy-900/90 border border-navy-700 rounded-xl overflow-hidden ${isRTL ? 'text-right' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="px-5 py-3 border-b border-navy-700 flex items-center justify-between">
        <h3 className="text-xs font-bold text-white uppercase tracking-widest">{title}</h3>
        <div className="flex items-center gap-3 text-[9px] font-mono">
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-emerald-600 rounded inline-block" /> {locale === 'ar' ? 'صعود' : locale === 'en' ? 'Rising' : 'Hausse'}</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-600 rounded inline-block" /> {locale === 'ar' ? 'هبوط' : locale === 'en' ? 'Falling' : 'Baisse'}</span>
        </div>
      </div>
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
              <div className="text-xl mb-0.5">{meta?.flag ?? '🌐'}</div>
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
