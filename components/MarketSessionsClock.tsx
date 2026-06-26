/**
 * MarketSessionsClock — BKAM-accurate FX session display
 *
 * Casablanca MIC hours per Doc 1 §I:
 *   Standard  : 08:30–15:30  (publication 16:15)
 *   Ramadan   : 09:15–13:15  (publication 14:00)
 *
 * Ramadan detection: Morocco uses UTC+0 during Ramadan (UTC+1 rest of year).
 * When Africa/Casablanca offset = UTC+0, we switch to Ramadan hours.
 */
import React, { useState, useEffect } from 'react';
import { useI18n } from '../context/I18nContext';
import { Clock } from 'lucide-react';

interface Session {
  city: string;
  cityAr: string;
  cityFr: string;
  tz: string;
  open: number;
  openMin?: number;
  close: number;
  closeMin?: number;
  color: string;
  bgColor: string;
  borderColor: string;
  /** True for BKAM MIC — Ramadan hours apply */
  bkamMic?: boolean;
}

// Detect whether Morocco is currently on Ramadan (UTC+0) vs standard (UTC+1).
// Morocco's timezone dynamically shifts; IntlDateTimeFormat reports the offset.
function isRamadanHours(): boolean {
  try {
    const fmt = new Intl.DateTimeFormat('en', {
      timeZone: 'Africa/Casablanca',
      timeZoneName: 'short',
    });
    const parts = fmt.formatToParts(new Date());
    const tzName = parts.find(p => p.type === 'timeZoneName')?.value ?? '';
    // UTC+0 (or WET/GMT) during Ramadan; UTC+1 (WEST) rest of year
    return tzName === 'UTC' || tzName === 'WET' || tzName === 'GMT';
  } catch {
    return false;
  }
}

function buildSessions(ramadan: boolean): Session[] {
  return [
    {
      city: 'Casablanca', cityAr: 'الدار البيضاء', cityFr: 'Casablanca',
      tz: 'Africa/Casablanca',
      // Doc 1 §I footnote ¹²: Ramadan 09:15–13:15; standard 08:30–15:30
      open:    ramadan ? 9  : 8,  openMin:  ramadan ? 15 : 30,
      close:   ramadan ? 13 : 15, closeMin: ramadan ? 15 : 30,
      color: 'text-gold-400',
      bgColor: 'bg-gold-500/10',
      borderColor: 'border-gold-700',
      bkamMic: true,
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
}

function getLocalTime(tz: string): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: tz }));
}

function isSessionOpen(session: Session): boolean {
  const local = getLocalTime(session.tz);
  const currentMin = local.getHours() * 60 + local.getMinutes();
  const isWeekday = local.getDay() >= 1 && local.getDay() <= 5;
  const openTotalMin  = session.open  * 60 + (session.openMin  ?? 0);
  const closeTotalMin = session.close * 60 + (session.closeMin ?? 0);
  return isWeekday && currentMin >= openTotalMin && currentMin < closeTotalMin;
}

function isFixingWindow(session: Session): boolean {
  if (!session.bkamMic) return false;
  const local = getLocalTime(session.tz);
  const currentMin = local.getHours() * 60 + local.getMinutes();
  const isWeekday = local.getDay() >= 1 && local.getDay() <= 5;
  const openTotalMin  = session.open  * 60 + (session.openMin  ?? 0);
  const closeTotalMin = session.close * 60 + (session.closeMin ?? 0);
  return isWeekday && currentMin >= openTotalMin && currentMin < closeTotalMin;
}

function isPublicationTime(ramadan: boolean): boolean {
  const local = getLocalTime('Africa/Casablanca');
  const isWeekday = local.getDay() >= 1 && local.getDay() <= 5;
  if (!isWeekday) return false;
  const currentMin = local.getHours() * 60 + local.getMinutes();
  // Doc 1 §II: 16:15 standard (14:00 Ramadan) ±5 min window
  const pubMin = ramadan ? 14 * 60 : 16 * 60 + 15;
  return currentMin >= pubMin && currentMin <= pubMin + 10;
}

function formatTime(tz: string, locale: string): string {
  return new Date().toLocaleTimeString(
    locale === 'ar' ? 'ar-MA' : locale === 'en' ? 'en-GB' : 'fr-FR',
    { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }
  );
}

function sessionHoursLabel(session: Session): string {
  const o = `${String(session.open).padStart(2, '0')}:${String(session.openMin ?? 0).padStart(2, '0')}`;
  const c = `${String(session.close).padStart(2, '0')}:${String(session.closeMin ?? 0).padStart(2, '0')}`;
  return `${o}–${c}`;
}

export default function MarketSessionsClock() {
  const { locale, isRTL } = useI18n();
  const [tick, setTick] = useState(0);
  const [ramadan, setRamadan] = useState(false);

  useEffect(() => {
    setRamadan(isRamadanHours());
    const id = setInterval(() => {
      setTick(t => t + 1);
      // Re-check Ramadan status hourly
      if (tick % 3600 === 0) setRamadan(isRamadanHours());
    }, 1000);
    return () => clearInterval(id);
  }, [tick]);

  const sessions = buildSessions(ramadan);
  const anyOpen = sessions.some(isSessionOpen);
  const micOpen = sessions.some(s => s.bkamMic && isFixingWindow(s));
  const pubWindow = isPublicationTime(ramadan);

  const title       = locale === 'ar' ? 'جلسات السوق' : locale === 'en' ? 'Market Sessions' : 'Séances de Marché';
  const openLabel   = locale === 'ar' ? 'مفتوح' : locale === 'en' ? 'Open' : 'Ouvert';
  const closedLabel = locale === 'ar' ? 'مغلق' : locale === 'en' ? 'Closed' : 'Fermé';

  return (
    <div
      className={`bg-navy-900/90 border border-navy-700 rounded-xl overflow-hidden ${isRTL ? 'text-right' : ''}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="px-5 py-3 border-b border-navy-700 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Clock size={13} className="text-gold-500" />
          <h3 className="text-xs font-bold text-white uppercase tracking-widest">{title}</h3>
          {ramadan && (
            <span className="text-[8px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded uppercase tracking-wide">
              Ramadan
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* BKAM MIC fixing window status */}
          {micOpen && (
            <span className="text-[8px] font-bold text-gold-400 bg-gold-500/10 border border-gold-500/30 px-1.5 py-0.5 rounded flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-gold-400 animate-pulse" />
              {locale === 'ar' ? 'نافذة التسعير BKAM' : locale === 'en' ? 'BKAM MIC fixing' : 'Fixing MIC BKAM'}
            </span>
          )}
          {/* Publication window */}
          {pubWindow && (
            <span className="text-[8px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
              {locale === 'en' ? 'Rate publication' : 'Publication des cours'}
            </span>
          )}
          <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded border ${
            anyOpen
              ? 'border-emerald-700 bg-emerald-950/30 text-emerald-400'
              : 'border-slate-700 bg-slate-900/30 text-slate-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${anyOpen ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
            {anyOpen ? openLabel : closedLabel}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 divide-x divide-navy-800">
        {sessions.map(session => {
          const open = isSessionOpen(session);
          const isMic = session.bkamMic && open;
          const cityName = locale === 'ar' ? session.cityAr : locale === 'en' ? session.city : session.cityFr;
          const hoursLabel = sessionHoursLabel(session);
          // Publication time label for Casablanca
          const pubLabel = session.bkamMic
            ? (locale === 'en' ? `Pub ${ramadan ? '14:00' : '16:15'}` : `Pub ${ramadan ? '14h00' : '16h15'}`)
            : null;

          return (
            <div
              key={session.city}
              className={`p-4 text-center ${open ? session.bgColor : 'bg-transparent'} transition-colors relative`}
            >
              {isMic && (
                <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" title="Fenêtre de fixing BKAM MIC" />
              )}
              <div className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${open ? session.color : 'text-slate-500'}`}>
                {cityName}
              </div>
              <div className={`text-xl font-mono font-bold tabular-nums ${open ? session.color : 'text-slate-500'}`}>
                {formatTime(session.tz, locale)}
              </div>
              <div className={`text-[10px] mt-1 font-mono ${open ? 'text-emerald-400' : 'text-slate-500'}`}>
                {open ? '🟢' : '🔴'} {open ? openLabel : closedLabel}
              </div>
              <div className="text-[9px] text-slate-600 mt-0.5 font-mono">{hoursLabel}</div>
              {pubLabel && (
                <div className="text-[8px] text-slate-700 font-mono">{pubLabel}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Regulatory note */}
      <div className="px-5 py-2 border-t border-navy-800">
        <p className="text-[8px] text-slate-700 font-mono">
          {locale === 'ar'
            ? 'ساعات MIC BKAM · التثبيت: متوسط مرجح بالحجم (المادة I §1) · النشر: 16:15 (14:00 رمضان)'
            : locale === 'en'
            ? 'BKAM MIC hours per Circular LC/BKAM/2018/1 · Fixing: volume-weighted avg (Doc 1 §I.1) · Publication: 16:15 (14:00 Ramadan)'
            : 'Horaires MIC BKAM selon LC/BKAM/2018/1 · Fixing: moyenne pondérée (Doc 1 §I.1) · Publication: 16h15 (14h00 Ramadan)'}
        </p>
      </div>
    </div>
  );
}
