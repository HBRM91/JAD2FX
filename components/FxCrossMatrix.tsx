import React, { useMemo } from 'react';
import { LiveRate } from '../types';
import { BKAM_CURRENCIES } from '../constants';
import { useI18n } from '../context/I18nContext';

interface Props {
  rates: LiveRate[];
}

const DISPLAY_CODES = ['EUR', 'USD', 'GBP', 'CHF', 'JPY', 'CAD', 'SAR', 'AED', 'CNY', 'MAD'];
const currencyMeta = Object.fromEntries(BKAM_CURRENCIES.map(c => [c.code, c]));

export default function FxCrossMatrix({ rates }: Props) {
  const { locale, isRTL } = useI18n();

  // Build a map of code → MAD mid rate
  const madRates = useMemo<Record<string, number>>(() => {
    const m: Record<string, number> = { MAD: 1 };
    for (const r of rates) {
      // bkamUnit already applied in LiveRate.mid
      const meta = currencyMeta[r.currency];
      if (meta) m[r.currency] = r.mid / meta.bkamUnit;
    }
    return m;
  }, [rates]);

  // Cross rate: how many units of B per 1 unit of A
  function cross(a: string, b: string): number | null {
    if (a === b) return 1;
    const aMad = madRates[a]; // MAD per 1 A
    const bMad = madRates[b]; // MAD per 1 B
    if (!aMad || !bMad) return null;
    return aMad / bMad;
  }

  function cellColor(a: string, b: string): string {
    if (a === b) return 'bg-navy-800/60';
    return 'bg-navy-900/40 hover:bg-navy-700/60';
  }

  const title = locale === 'ar' ? 'مصفوفة تقاطع العملات' : locale === 'en' ? 'FX Cross-Rates Matrix' : 'Matrice des Taux Croisés';
  const subtitle = locale === 'ar' ? 'عدد وحدات العمود لكل وحدة من الصف' : locale === 'en' ? 'Units of column per 1 unit of row' : 'Unités de la colonne par 1 unité de ligne';

  return (
    <div className={`bg-navy-900/90 border border-navy-700 rounded-xl overflow-hidden ${isRTL ? 'text-right' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="px-5 py-3 border-b border-navy-700 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-white uppercase tracking-widest">{title}</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">{subtitle}</p>
        </div>
        <span className="text-[9px] text-gold-500 font-mono uppercase tracking-wider">Bloomberg FXGO</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-xs font-mono">
          <thead>
            <tr className="border-b border-navy-800">
              <th className="py-2 px-3 text-slate-600 font-medium text-[10px] w-20 text-left">↓ / →</th>
              {DISPLAY_CODES.map(code => (
                <th key={code} className="py-2 px-2 text-center">
                  <div className="text-[10px] text-slate-400 font-bold">
                    {currencyMeta[code]?.flag ?? '🏛'} {code}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DISPLAY_CODES.map(rowCode => (
              <tr key={rowCode} className="border-b border-navy-800/50">
                <td className="py-2 px-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{currencyMeta[rowCode]?.flag ?? '🏛'}</span>
                    <span className="text-slate-300 font-bold text-[10px]">{rowCode}</span>
                  </div>
                </td>
                {DISPLAY_CODES.map(colCode => {
                  const val = cross(rowCode, colCode);
                  const isdiag = rowCode === colCode;
                  return (
                    <td key={colCode} className={`py-2 px-2 text-center transition-colors ${cellColor(rowCode, colCode)}`}>
                      {isdiag ? (
                        <span className="text-navy-600 text-[10px]">—</span>
                      ) : val !== null ? (
                        <span className={`text-[11px] font-bold ${
                          val > 1000 ? 'text-gold-400' :
                          val > 10   ? 'text-slate-200' :
                          val > 1    ? 'text-slate-300' : 'text-slate-400'
                        }`}>
                          {val >= 100 ? val.toFixed(2) : val >= 10 ? val.toFixed(3) : val.toFixed(4)}
                        </span>
                      ) : (
                        <span className="text-navy-700 text-[10px]">N/A</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-5 py-2 border-t border-navy-800">
        <p className="text-[9px] text-navy-600 font-mono">
          {locale === 'ar' ? 'أسعار استرشادية · محسوبة عبر MAD · مصدر: ECB / BKAM' : locale === 'en' ? 'Indicative cross-rates · computed via MAD pivot · Source: ECB / BKAM basket' : 'Taux croisés indicatifs · calculés via pivot MAD · Source: ECB / panier BKAM'}
        </p>
      </div>
    </div>
  );
}
