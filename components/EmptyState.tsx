/**
 * Shared empty/error state component.
 * Use for: zero-data messages, fetch failures, "nothing to show" states.
 */

import { Inbox, AlertTriangle, RefreshCw } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  variant?: 'empty' | 'error';
  title?: string;
  message: string;
  action?: { label: string; onClick: () => void; icon?: ReactNode };
}

export default function EmptyState({ variant = 'empty', title, message, action }: EmptyStateProps) {
  const Icon = variant === 'error' ? AlertTriangle : Inbox;
  const color = variant === 'error' ? 'text-red-400' : 'text-slate-500';
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      <Icon size={28} className={`${color} mb-2`} />
      {title && <p className="text-[13px] font-bold text-slate-200 mb-1">{title}</p>}
      <p className="text-[11px] text-slate-400 max-w-md leading-relaxed">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-3 flex items-center gap-1.5 px-3 py-1.5 bg-gold-500/10 border border-gold-500/30 text-gold-300 text-[11px] font-bold rounded hover:bg-gold-500/20 transition-colors"
        >
          {action.icon ?? <RefreshCw size={11} />}
          {action.label}
        </button>
      )}
    </div>
  );
}
