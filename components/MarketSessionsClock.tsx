import React, { useState, useEffect } from 'react';
import { useI18n } from '../context/I18nContext';
import { Clock } from 'lucide-react';

interface Session {
  city: string;
  cityAr: string;
  cityFr: string;
  tz: string;
  open: number;      // hour in local time session opens
  openMin?: number;  // optional opening minute (default 0)
  close: number;
  closeMin?: number; // optional closing minute (default 0)
  color: string;
  bgColor: string;
  borderColor: string;
}

const SESSIONS: Session[] = [
  {
    city: 'Casablanca', cityAr: 'الدار البيضاء', cityFr: 'Casablanca',
    tz: 'Africa/Casablanca',
    open: 8, openMin: 30, close: 15, closeMin: 30,
    color: 'text-gold-400',
    bgColor: 'bg-gold-500/10',
    borderColor: 'border-gold-700',
  },
  {
    city: 'Frankfurt', cityAr: 'فرانكفورت', cityFr: 'Francfort',
    tz: 'Europe/Berlin',
    open: 8, close: 17,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-700',
  },
  {
    city: 'New York', cityAr: 'نيويورك', cityFr: 'New York',
    tz: 'America/New_York',
    open: 8, close: 17,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-700',
  },
  {
    city: 'Tokyo', cityAr: 'طوكيو', cityFr: 'Tokyo',
    tz: 'Asia/Tokyo',
    open: 9, close: 18,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-700',
  },
];

function getLocalTime(tz: string): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: tz }));
}

function sessionMinutes(session: Session): { openTotalMin: number; closeTotalMin: number } {
  return {
    openTotalMin: session.open * 60 + (session.openMin ?? 0),
    closeTotalMin: session.close * 60 + (session.closeMin ?? 0),
  };
}

function isSessionOpen(session: Session): boolean {
  const local = getLocalTime(session.tz);
  const currentMin = local.getHours() * 60 + local.getMinutes();
  const isWeekday = local.getDay() >= 1 && local.getDay() <= 5;
  const { openTotalMin, closeTotalMin } = sessionMinutes(session);
  return isWeekday && currentMin >= openTotalMin && currentMin < closeTotalMin;
}

function formatTime(tz: string, locale: string): string {
  return new Date().toLocaleTimeString(
    locale === 'ar' ? 'ar-MA' : locale === 'en' ? 'en-GB' : 'fr-FR',
    { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }
  );
}

export default function MarketSessionsClock() {
  const { locale, isRTL } = useI18n();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const anyOpen = SESSIONS.some(isSessionOpen);

  const title = locale === 'ar' ? 'جلسات السوق' : locale === 'en' ? 'Market Sessions' : 'Séances de Marché';
  const openLabel = locale === 'ar' ? 'مفتوح' : locale === 'en' ? 'Open' : 'Ouvert';
  const closedLabel = locale === 'ar' ? 'مغلق' : locale === 'en' ? 'Closed' : 'Fermé';

  return (
    <div
      className={`bg-navy-900/90 border border-navy-700 rounded-xl overflow-hidden ${isRTL ? 'text-right' : ''}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="px-5 py-3 border-b border-navy-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock size={13} className="text-gold-500" />
          <h3 className="text-xs font-bold text-white uppercase tracking-widest">{title}</h3>
        </div>
        <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded border ${
          anyOpen
            ? 'border-emerald-700 bg-emerald-950/30 text-emerald-400'
            : 'border-slate-700 bg-slate-900/30 text-slate-400'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${anyOpen ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
          {anyOpen ? openLabel : closedLabel}
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 divide-x divide-navy-800">
        {SESSIONS.map(session => {
          const open = isSessionOpen(session);
          const cityName = locale === 'ar' ? session.cityAr : locale === 'en' ? session.city : session.cityFr;
          return (
            <div
              key={session.city}
              className={`p-4 text-center ${open ? session.bgColor : 'bg-transparent'} transition-colors`}
            >
              <div className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${open ? session.color : 'text-slate-500'}`}>
                {cityName}
              </div>
              <div className={`text-xl font-mono font-bold tabular-nums ${open ? session.color : 'text-slate-500'}`}>
                {formatTime(session.tz, locale)}
              </div>
              <div className={`text-[10px] mt-1 font-mono ${open ? 'text-emerald-400' : 'text-slate-500'}`}>
                {open ? openLabel : closedLabel}
                {open && (
                  <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse align-middle" />
                )}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                {`${String(session.open).padStart(2,'0')}:${String(session.openMin ?? 0).padStart(2,'0')}–${String(session.close).padStart(2,'0')}:${String(session.closeMin ?? 0).padStart(2,'0')}`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
