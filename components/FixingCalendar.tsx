import { useMemo } from 'react';
import { Calendar, AlertCircle } from 'lucide-react';
import { isMoroccanHoliday, isBusinessDay, isWeekend } from '../services/holidays';

/**
 * P1.19 — Fixing calendar: next 10 business days, with MA holidays marked.
 * Helps treasurers plan their hedge settlements.
 */
export default function FixingCalendar() {
  const dates = useMemo(() => {
    const out: Array<{ date: Date; iso: string; label: string; isBiz: boolean; isHoliday: boolean; holidayName?: string }> = [];
    const d = new Date();
    for (let i = 0; out.length < 12 && i < 30; i++) {
      d.setDate(d.getDate() + 1);
      if (isWeekend(d)) continue;
      const isHol = isMoroccanHoliday(d);
      const isBiz = isBusinessDay(d) && !isHol;
      out.push({
        date: d,
        iso: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString('fr-MA', { weekday: 'short', day: '2-digit', month: 'short' }),
        isBiz,
        isHoliday: isHol,
        holidayName: getHolidayName(d),
      });
    }
    return out;
  }, []);

  return (
    <div className="bg-navy-900 border border-navy-700 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Calendar size={14} className="text-gold-500" />
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Calendrier des Fixings</h3>
        <span className="text-[10px] text-slate-500 ml-auto">12 prochains jours ouvrés</span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {dates.map((d) => (
          <div
            key={d.iso}
            className={`p-2.5 rounded-lg border text-center ${
              d.isHoliday
                ? 'bg-red-950/30 border-red-800/40'
                : d.isBiz
                ? 'bg-navy-950 border-navy-700'
                : 'bg-navy-950/40 border-navy-800'
            }`}
          >
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">{d.label.split(' ')[0]}</p>
            <p className={`text-base font-bold font-mono ${d.isBiz ? 'text-gold-400' : 'text-slate-500'}`}>
              {d.date.getDate()}
            </p>
            {d.isHoliday && d.holidayName && (
              <p className="text-[10px] text-red-400 leading-tight mt-1 line-clamp-2" title={d.holidayName}>
                {d.holidayName}
              </p>
            )}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-start gap-2 text-[10px] text-slate-500">
        <AlertCircle size={11} className="text-amber-400 flex-shrink-0 mt-0.5" />
        <span>Les fixings BKAM sont publiés à 12:30 (intraday) et 16:15 (clôture) heure de Casablanca. Les forwards T+2 s'ajustent pour ces dates.</span>
      </div>
    </div>
  );
}

function getHolidayName(d: Date): string | undefined {
  const iso = d.toISOString().slice(5, 10); // MM-DD
  const NAMES: Record<string, string> = {
    '01-01': 'Nouvel An',
    '01-11': 'Manifeste',
    '05-01': 'Fête du Travail',
    '07-30': 'Fête du Trône',
    '08-14': 'Provinces du Sud',
    '08-20': 'Révolution',
    '08-21': 'Jeunesse',
    '11-06': 'Marche Verte',
    '11-18': 'Indépendance',
  };
  return NAMES[iso];
}
