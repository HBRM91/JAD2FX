import React, {
  createContext, useContext, useState, useCallback, useEffect, useRef,
} from 'react';
import { AdminConfig, BlotterEntry, LivePriceEntry, ClientTier, TierConfig, AuditEntry } from '../types';

export const DEFAULT_TIER_COMMISSIONS: Record<ClientTier, TierConfig> = {
  CORPORATE: {
    label: 'Large Corporate / MNC',
    labelFr: 'Grande Entreprise / Multinationale',
    description: 'CA > 500M MAD · Accès produits dérivés · Négociation directe',
    virementCommBps: 25,
    billetCommBps:   60,
    forwardMarkupBps: 10,
  },
  SME: {
    label: 'SME / PME',
    labelFr: 'Petite et Moyenne Entreprise',
    description: 'CA 10–500M MAD · Couverture OC Circ. 01/2024 · Forwards autorisés',
    virementCommBps: 50,
    billetCommBps:   120,
    forwardMarkupBps: 20,
  },
  TPE: {
    label: 'TPE / Auto-Entrepreneur',
    labelFr: 'Très Petite Entreprise',
    description: 'CA < 10M MAD · Opérations courantes import/export',
    virementCommBps: 80,
    billetCommBps:   180,
    forwardMarkupBps: 35,
  },
  INDIVIDUAL: {
    label: 'Individual / Particulier',
    labelFr: 'Particulier',
    description: 'Voyages & allocation annuelle 45 000 MAD · Billets de banque',
    virementCommBps: 120,
    billetCommBps:   250,
    forwardMarkupBps: 60,
  },
};

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const DEFAULT_ADMIN_CONFIG: AdminConfig = {
  refreshIntervalMs:  120_000, // 2 min
  spotOverrides:      {},
  curveOverrides:     {},
  forwardMarkupBps:   0,
  virementSpreadPct:  0.008,
  billetSpreadPct:    0.018,
  dealerSpreadPips:   {
    EUR: 16, USD: 12, GBP: 20, CHF: 14, JPY: 12,
    CAD: 16, SAR:  6, AED:  6, KWD:  8, QAR:  6,
    DKK: 18, NOK: 20, SEK: 20, CNY: 22,
  },
  isLive:             true,
  alertThresholds: [
    { pair: 'EUR/MAD', min: 10.50, max: 11.20, enabled: false },
    { pair: 'USD/MAD', min:  9.60, max: 10.20, enabled: false },
  ],
  tierCommissions: DEFAULT_TIER_COMMISSIONS,
  corsProxyUrl: process.env.CORS_PROXY_URL ?? 'https://jad2fx-yahoo-proxy.hamzaelbouhali.workers.dev',
};

const STORAGE_KEY    = 'jad2fx_admin_config';
const ADMIN_KEY      = 'jad2fx_admin_unlocked';

// ─── Context type ─────────────────────────────────────────────────────────────

interface AdminContextType {
  config: AdminConfig;
  updateConfig: (patch: Partial<AdminConfig>) => void;
  resetConfig: () => void;

  isAdmin: boolean;
  login:   (passcode: string) => Promise<boolean>;
  logout:  () => Promise<void>;

  blotter:         BlotterEntry[];
  addBlotterEntry: (e: Omit<BlotterEntry, 'id' | 'time'>) => void;
  clearBlotter:    () => void;

  auditLog:       AuditEntry[];
  addAuditEntry:  (action: string, detail: string) => void;
  clearAuditLog:  () => void;

  livePrices:     LivePriceEntry[];
  setLivePrices:  (p: LivePriceEntry[]) => void;
  lastPriceUpdate: string | null;
}

const AdminContext = createContext<AdminContextType | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Admin config — persisted in localStorage
  const [config, setConfigState] = useState<AdminConfig>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const merged = { ...DEFAULT_ADMIN_CONFIG, ...parsed };
        // Migrate: if stored config has empty corsProxyUrl, use the current default
        if (!merged.corsProxyUrl) merged.corsProxyUrl = DEFAULT_ADMIN_CONFIG.corsProxyUrl;
        return merged;
      }
      return DEFAULT_ADMIN_CONFIG;
    } catch { return DEFAULT_ADMIN_CONFIG; }
  });

  // Admin auth — P0.11: verify the server-side session cookie on mount, do not trust localStorage alone
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem(ADMIN_KEY) === '1');
  const configRef = useRef(config);
  configRef.current = config;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const base = (configRef.current.corsProxyUrl ?? '').replace(/\/$/, '');
      if (!base) return;
      try {
        const res = await fetch(`${base}/api/admin/session`, {
          method: 'GET',
          credentials: 'include',
          signal: AbortSignal.timeout(5_000),
        });
        if (cancelled) return;
        const data = (await res.json()) as { ok?: boolean };
        if (data.ok) {
          setIsAdmin(true);
          try { localStorage.setItem(ADMIN_KEY, '1'); } catch { /* ignore */ }
        } else {
          setIsAdmin(false);
          try { localStorage.removeItem(ADMIN_KEY); } catch { /* ignore */ }
        }
      } catch { /* offline → keep localStorage hint */ }
    })();
    return () => { cancelled = true; };
  }, []);

  // Blotter — circular buffer of 50 entries
  const [blotter, setBlotter] = useState<BlotterEntry[]>([]);
  const blotterIdRef = useRef(0);

  // Audit log — circular buffer of 200 entries
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const auditIdRef = useRef(0);

  // Live prices fed by the streaming hook
  const [livePrices, setLivePricesState]   = useState<LivePriceEntry[]>([]);
  const [lastPriceUpdate, setLastPriceUpdate] = useState<string | null>(null);

  // Persist config changes
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(config)); } catch {}
  }, [config]);

  // P0-6: hydrate audit log from KV when admin is unlocked
  useEffect(() => {
    if (!isAdmin) return;
    const base = (configRef.current.corsProxyUrl ?? '').replace(/\/$/, '');
    if (!base) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${base}/api/admin/audit`, {
          method: 'GET',
          credentials: 'include',
          signal: AbortSignal.timeout(5_000),
        });
        if (cancelled || !res.ok) return;
        const data = await res.json() as { entries: AuditEntry[] };
        if (Array.isArray(data.entries) && data.entries.length) {
          setAuditLog(data.entries);
        }
      } catch { /* offline */ }
    })();
    return () => { cancelled = true; };
  }, [isAdmin]);

  const updateConfig = useCallback((patch: Partial<AdminConfig>) => {
    setConfigState(prev => ({ ...prev, ...patch }));
    const keys = Object.keys(patch).join(', ');
    const entry: AuditEntry = {
      id: String(++auditIdRef.current),
      time: new Date().toISOString(),
      action: 'CONFIG_UPDATE',
      detail: `Fields updated: ${keys}`,
      user: 'ADMIN',
    };
    setAuditLog(prev => [entry, ...prev].slice(0, 200));
    // P0-6: persist to KV
    const base = (configRef.current.corsProxyUrl ?? '').replace(/\/$/, '');
    if (base) {
      fetch(`${base}/api/admin/audit`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CONFIG_UPDATE', detail: `Fields updated: ${keys}` }),
        signal: AbortSignal.timeout(4_000),
      }).catch(() => { /* offline */ });
    }
  }, []);

  const resetConfig = useCallback(() => {
    setConfigState(DEFAULT_ADMIN_CONFIG);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const login = useCallback(async (passcode: string): Promise<boolean> => {
    // P0.11: passcode is sent to the worker, which compares against the secret
    // and returns an HTTP-only cookie. The passcode is never compared client-side
    // and is no longer shipped in the bundle.
    try {
      const base = (config.corsProxyUrl ?? '').replace(/\/$/, '');
      if (!base) {
        if (typeof console !== 'undefined') console.error('login: corsProxyUrl not configured');
        return false;
      }
      const res = await fetch(`${base}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
        credentials: 'include',
        signal: AbortSignal.timeout(8_000),
      });
      if (!res.ok) return false;
      const data = (await res.json()) as { ok?: boolean };
      if (data.ok) {
        setIsAdmin(true);
        try { localStorage.setItem(ADMIN_KEY, '1'); } catch { /* ignore */ }
        return true;
      }
      return false;
    } catch (err) {
      if (typeof console !== 'undefined') console.error('login failed:', err);
      return false;
    }
  }, [config.corsProxyUrl]);

  const logout = useCallback(async () => {
    // P0.11: tell the worker to clear the HTTP-only cookie
    try {
      const base = (config.corsProxyUrl ?? '').replace(/\/$/, '');
      if (base) {
        await fetch(`${base}/api/admin/logout`, {
          method: 'POST',
          credentials: 'include',
          signal: AbortSignal.timeout(5_000),
        });
      }
    } catch { /* ignore */ }
    setIsAdmin(false);
    try { localStorage.removeItem(ADMIN_KEY); } catch { /* ignore */ }
  }, [config.corsProxyUrl]);

  const addBlotterEntry = useCallback((e: Omit<BlotterEntry, 'id' | 'time'>) => {
    const entry: BlotterEntry = {
      ...e,
      id:   String(++blotterIdRef.current),
      time: new Date().toISOString(),
    };
    setBlotter(prev => [entry, ...prev].slice(0, 50));
  }, []);

  const clearBlotter = useCallback(() => setBlotter([]), []);

  const addAuditEntry = useCallback((action: string, detail: string) => {
    const entry: AuditEntry = {
      id: String(++auditIdRef.current),
      time: new Date().toISOString(),
      action,
      detail,
      user: 'ADMIN',
    };
    setAuditLog(prev => [entry, ...prev].slice(0, 200));
    // P0-6: persist to worker KV (fire-and-forget; offline-safe)
    const base = (configRef.current.corsProxyUrl ?? '').replace(/\/$/, '');
    if (base) {
      fetch(`${base}/api/admin/audit`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, detail }),
        signal: AbortSignal.timeout(4_000),
      }).catch(() => { /* offline → keep in-memory entry only */ });
    }
  }, []);

  const clearAuditLog = useCallback(() => setAuditLog([]), []);

  const setLivePrices = useCallback((prices: LivePriceEntry[]) => {
    setLivePricesState(prices);
    setLastPriceUpdate(new Date().toISOString());
  }, []);

  return (
    <AdminContext.Provider value={{
      config, updateConfig, resetConfig,
      isAdmin, login, logout,
      blotter, addBlotterEntry, clearBlotter,
      auditLog, addAuditEntry, clearAuditLog,
      livePrices, setLivePrices, lastPriceUpdate,
    }}>
      {children}
    </AdminContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAdmin(): AdminContextType {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used inside AdminProvider');
  return ctx;
}
