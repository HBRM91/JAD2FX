/**
 * P2.8 — Historical comparison slider.
 * Compare a metric (rate / drift / forward points) over different
 * time windows: 1D, 1W, 1M, 3M, YTD, 1Y, ALL.
 */

import { useState } from 'react';
import { Calendar } from 'lucide-react';

export type TimeWindow = '1D' | '1W' | '1M' | '3M' | 'YTD' | '1Y' | '5Y' | 'ALL';

const WINDOWS: { id: TimeWindow; label: string; days: number | null }[] = [
  { id: '1D',  label: '1J',   days: 1 },
  { id: '1W',  label: '1S',   days: 7 },
  { id: '1M',  label: '1M',   days: 30 },
  { id: '3M',  label: '3M',   days: 90 },
  { id: 'YTD', label: 'YTD',  days: null /* special: from Jan 1 */ },
  { id: '1Y',  label: '1A',   days: 365 },
  { id: '5Y',  label: '5A',   days: 365 * 5 },
  { id: 'ALL', label: 'Max',  days: null /* all data */ },
];

interface Props {
  value: TimeWindow;
  onChange: (w: TimeWindow) => void;
}

export default function TimeWindowSelector({ value, onChange }: Props) {
  return (
    <div className="inline-flex items-center gap-1 bg-navy-900 border border-navy-700 rounded-lg p-0.5">
      <Calendar size={11} className="text-slate-500 ml-1.5" />
      {WINDOWS.map((w) => {
        const active = w.id === value;
        return (
          <button
            key={w.id}
            onClick={() => onChange(w.id)}
            className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${
              active
                ? 'bg-gold-500 text-navy-950'
                : 'text-slate-400 hover:text-white hover:bg-navy-800'
            }`}
          >
            {w.label}
          </button>
        );
      })}
    </div>
  );
}

export function getStartDateForWindow(window: TimeWindow): Date {
  const now = new Date();
  const entry = WINDOWS.find((w) => w.id === window);
  if (!entry) return new Date(now.getTime() - 365 * 24 * 3600 * 1000);
  if (window === 'YTD') return new Date(now.getFullYear(), 0, 1);
  if (window === 'ALL') return new Date(now.getTime() - 10 * 365 * 24 * 3600 * 1000);
  if (entry.days == null) return new Date(now.getTime() - 365 * 24 * 3600 * 1000);
  return new Date(now.getTime() - entry.days * 24 * 3600 * 1000);
}
