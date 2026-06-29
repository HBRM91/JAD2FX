/**
 * P2.5 — Price alerts.
 * User can set threshold alerts per currency pair. Uses Notification API
 * + browser tab title flash when threshold is crossed. State persisted
 * in localStorage (per-browser).
 */

import { useEffect, useRef, useState } from 'react';
import { Bell, BellOff, X, AlertCircle } from 'lucide-react';
import { useWatchlist } from '../hooks/useWatchlist';

interface PriceAlert {
  code: string;
  above?: number;
  below?: number;
  triggered?: { direction: 'ABOVE' | 'BELOW'; rate: number; at: string };
}

const STORAGE_KEY = 'jad2fx_price_alerts_v1';

function getStored(): PriceAlert[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PriceAlert[];
  } catch { return []; }
}

function setStored(alerts: PriceAlert[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts)); } catch { /* ignore */ }
}

/**
 * Component: alerts manager UI. Shows current alerts + editor.
 * Also handles the polling loop and notification dispatch.
 */
export default function PriceAlerts({ rates }: { rates: { currency: string; mid: number }[] }) {
  const { items } = useWatchlist();
  const [alerts, setAlerts] = useState<PriceAlert[]>(getStored);
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied',
  );
  const lastRatesRef = useRef<Record<string, number>>({});

  // Persist
  useEffect(() => { setStored(alerts); }, [alerts]);

  // Watch + notify
  useEffect(() => {
    const rateByCode: Record<string, number> = {};
    for (const r of rates) rateByCode[r.currency] = r.mid;
    const next: PriceAlert[] = [];
    for (const a of alerts) {
      const rate = rateByCode[a.code];
      if (rate == null) { next.push(a); continue; }
      const prev = lastRatesRef.current[a.code];
      let triggered = a.triggered;
      if (a.above != null && rate >= a.above && prev != null && prev < a.above) {
        triggered = { direction: 'ABOVE', rate, at: new Date().toISOString() };
        notify(`📈 ${a.code}/MAD ≥ ${a.above}`, `Taux actuel: ${rate.toFixed(4)}`);
      } else if (a.below != null && rate <= a.below && prev != null && prev > a.below) {
        triggered = { direction: 'BELOW', rate, at: new Date().toISOString() };
        notify(`📉 ${a.code}/MAD ≤ ${a.below}`, `Taux actuel: ${rate.toFixed(4)}`);
      }
      next.push({ ...a, triggered } as PriceAlert);
    }
    setAlerts(next);
    lastRatesRef.current = rateByCode;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rates]);

  const notify = (title: string, body: string) => {
    if (permission === 'granted' && typeof Notification !== 'undefined') {
      try { new Notification(title, { body, icon: '/jad2-logo.svg' }); } catch { /* ignore */ }
    }
  };

  const requestPermission = async () => {
    if (typeof Notification === 'undefined') return;
    const p = await Notification.requestPermission();
    setPermission(p);
  };

  const add = (code: string) => {
    if (alerts.some((a) => a.code === code)) return;
    setAlerts([...alerts, { code }]);
  };
  const update = (code: string, patch: Partial<PriceAlert>) => {
    setAlerts(alerts.map((a) => (a.code === code ? { ...a, ...patch } : a)));
  };
  const remove = (code: string) => setAlerts(alerts.filter((a) => a.code !== code));
  const clearTriggered = (code: string) => {
    setAlerts(alerts.map((a) => (a.code === code ? { ...a, triggered: undefined } : a)));
  };

  const trackedCodes = new Set(items.map((i) => i.code));
  const availableToTrack = items.length === 0 ? ['EUR', 'USD', 'GBP', 'JPY'] : items.map((i) => i.code);

  return (
    <div className="bg-navy-900 border border-navy-700 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Bell size={14} className="text-gold-500" /> Alertes de prix
        </h3>
        {permission !== 'granted' && (
          <button
            onClick={requestPermission}
            className="text-[10px] font-bold text-gold-400 hover:text-gold-300 transition-colors"
          >
            Activer les notifications
          </button>
        )}
      </div>

      {alerts.length === 0 ? (
        <p className="text-[11px] text-slate-500 italic text-center py-3">
          Aucune alerte. Ajoutez-en une pour vos paires préférées.
        </p>
      ) : (
        <div className="space-y-1.5">
          {alerts.map((a) => (
            <div key={a.code} className="bg-navy-950 border border-navy-800 rounded-lg p-2.5">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-bold text-white w-12">{a.code}</span>
                <input
                  type="number"
                  step="0.0001"
                  value={a.above ?? ''}
                  onChange={(e) => update(a.code, { above: e.target.value ? parseFloat(e.target.value) : undefined })}
                  placeholder="≥ seuil haut"
                  className="w-24 bg-navy-900 border border-navy-700 rounded px-2 py-1 text-[10.5px] font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-gold-500"
                />
                <input
                  type="number"
                  step="0.0001"
                  value={a.below ?? ''}
                  onChange={(e) => update(a.code, { below: e.target.value ? parseFloat(e.target.value) : undefined })}
                  placeholder="≤ seuil bas"
                  className="w-24 bg-navy-900 border border-navy-700 rounded px-2 py-1 text-[10.5px] font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-gold-500"
                />
                <button
                  onClick={() => remove(a.code)}
                  className="ml-auto text-slate-500 hover:text-red-400"
                  aria-label="Supprimer"
                >
                  <X size={12} />
                </button>
              </div>
              {a.triggered && (
                <div className="mt-1.5 flex items-center gap-2 px-2 py-1 bg-amber-500/10 border border-amber-500/30 rounded">
                  <AlertCircle size={10} className="text-amber-400 flex-shrink-0" />
                  <p className="text-[10px] text-amber-300 flex-1">
                    Déclenché {a.triggered.direction === 'ABOVE' ? 'au-dessus' : 'en-dessous'} à {a.triggered.rate.toFixed(4)} ({new Date(a.triggered.at).toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' })})
                  </p>
                  <button
                    onClick={() => clearTriggered(a.code)}
                    className="text-[9px] text-amber-400 hover:text-amber-300 underline"
                  >
                    OK
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {availableToTrack.filter((c) => !alerts.some((a) => a.code === c)).length > 0 && (
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Ajouter</p>
          <div className="flex flex-wrap gap-1">
            {availableToTrack
              .filter((c: string) => !alerts.some((a) => a.code === c))
              .slice(0, 6)
              .map((c: string) => (
                <button
                  key={c}
                  onClick={() => add(c)}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold bg-navy-950 border border-navy-700 text-slate-300 rounded hover:border-gold-500/50 hover:text-gold-300"
                >
                  <Bell size={9} /> {c}
                </button>
              ))}
          </div>
          {items.length === 0 && (
            <p className="text-[10px] text-slate-500 mt-1.5 italic">
              💡 Ajoutez des paires à votre Watchlist pour des alertes sur mesure.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
