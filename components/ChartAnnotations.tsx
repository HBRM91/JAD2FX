import { Calendar, Clock, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot, ReferenceLine, ReferenceArea } from 'recharts';

/**
 * P2.7 — Chart annotations overlay.
 * Wraps a chart and lets the user add event markers (vertical lines, dots, areas).
 * Pairs with any line chart (FWD curve, fan chart, time series).
 */

export interface AnnotationEvent {
  id: string;
  date: string;        // ISO
  label: string;
  type: 'LINE' | 'DOT' | 'AREA';
  color?: string;
  description?: string;
}

interface Props {
  data: any[];
  dataKey: string;
  xKey: string;
  events?: AnnotationEvent[];
  height?: number;
  unit?: string;
}

/**
 * Default BKAM + ECB + FOMC calendar of past/upcoming events
 * (synthesized for demo; in production, fetch from /api/calendar).
 */
const DEFAULT_EVENTS: AnnotationEvent[] = [
  { id: 'evt-1', date: '2026-04-30', label: 'BKAM Q1 2026', type: 'LINE', color: '#D4AF37', description: 'Bank Al-Maghrib Q1 Council' },
  { id: 'evt-2', date: '2026-05-15', label: 'ECB cut 25bps', type: 'DOT', color: '#3b82f6', description: 'BCE -25bps' },
  { id: 'evt-3', date: '2026-06-06', label: 'FOMC hold', type: 'DOT', color: '#ef4444', description: 'Fed holds' },
  { id: 'evt-4', date: '2026-06-12', label: 'OC 01/2024 deadline', type: 'AREA', color: '#f59e0b', description: 'Reporting compliance' },
  { id: 'evt-5', date: '2026-07-23', label: 'BKAM Q2 Council', type: 'LINE', color: '#D4AF37', description: 'BAM Q2 Council' },
  { id: 'evt-6', date: '2026-07-30', label: 'FOMC', type: 'DOT', color: '#ef4444', description: 'Fed decision' },
];

export default function ChartAnnotations({ data, dataKey, xKey, events = DEFAULT_EVENTS, height = 280, unit = '' }: Props) {
  const [enabled, setEnabled] = useState(true);
  const [showAreas, setShowAreas] = useState(true);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap text-[10px]">
        <button
          onClick={() => setEnabled((e) => !e)}
          className={`px-2 py-1 rounded font-bold ${enabled ? 'bg-gold-500 text-navy-950' : 'bg-navy-950 text-slate-400'}`}
        >
          {enabled ? 'Annotations ON' : 'Annotations OFF'}
        </button>
        <button
          onClick={() => setShowAreas((s) => !s)}
          className={`px-2 py-1 rounded font-bold ${showAreas ? 'bg-amber-500/20 text-amber-300' : 'bg-navy-950 text-slate-400'}`}
        >
          {showAreas ? 'Zones ON' : 'Zones OFF'}
        </button>
        {events.length > 0 && (
          <span className="text-slate-500">
            {events.length} événement{events.length > 1 ? 's' : ''} : {events.filter((e) => e.type === 'LINE').length} ligne{events.filter((e) => e.type === 'LINE').length > 1 ? 's' : ''}, {events.filter((e) => e.type === 'DOT').length} point{events.filter((e) => e.type === 'DOT').length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <CartesianGrid stroke="#1E3E5C" strokeDasharray="2 2" />
            <XAxis dataKey={xKey} tick={{ fill: '#91B8D8', fontSize: 9 }} />
            <YAxis tick={{ fill: '#91B8D8', fontSize: 9 }} unit={unit} />
            <Tooltip
              contentStyle={{ background: '#040C1C', border: '1px solid #1E3E5C', borderRadius: 4, fontSize: 10 }}
            />
            <Line type="monotone" dataKey={dataKey} stroke="#D4AF37" strokeWidth={2} dot={false} />

            {enabled && events.map((e) => {
              const x = e.date;
              if (e.type === 'LINE') {
                return (
                  <ReferenceLine
                    key={e.id}
                    x={x}
                    stroke={e.color || '#D4AF37'}
                    strokeDasharray="4 2"
                    label={{ value: e.label, position: 'top', fill: e.color || '#D4AF37', fontSize: 9 }}
                  />
                );
              }
              if (e.type === 'DOT') {
                const point = data.find((d: any) => d[xKey] === e.date || d.date === e.date);
                if (point) {
                  return (
                    <ReferenceDot
                      key={e.id}
                      x={x}
                      y={point[dataKey]}
                      r={6}
                      fill={e.color || '#3b82f6'}
                      stroke="#040C1C"
                    />
                  );
                }
                return null;
              }
              return null;
            })}

            {showAreas && events.filter((e) => e.type === 'AREA').map((e, i) => (
              <ReferenceArea
                key={e.id}
                x1={events[Math.max(0, i - 1)]?.date || e.date}
                x2={e.date}
                fill={e.color || '#f59e0b'}
                fillOpacity={0.08}
                stroke={e.color || '#f59e0b'}
                strokeOpacity={0.4}
                strokeDasharray="3 3"
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {enabled && (
        <div className="bg-navy-900/50 border border-navy-800 rounded-lg p-3">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Légende événements</h3>
          <div className="flex flex-wrap gap-2">
            {events.map((e) => (
              <div key={e.id} className="flex items-center gap-1.5 bg-navy-950 border border-navy-800 rounded px-2 py-1 text-[10px]">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: e.color || '#D4AF37' }}
                />
                <span className="text-slate-300 font-mono">{e.date.slice(5)}</span>
                <span className="text-slate-200 font-bold">{e.label}</span>
                {e.description && <span className="text-slate-500">· {e.description}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
