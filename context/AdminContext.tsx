import React, {
  createContext, useContext, useState, useCallback, useEffect, useRef,
} from 'react';
import { AdminConfig, BlotterEntry, LivePriceEntry } from '../types';

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
};

const ADMIN_PASSCODE = 'KFXADMIN'; // change before production
const STORAGE_KEY    = 'khouyafx_admin_config';
const ADMIN_KEY      = 'khouyafx_admin_unlocked';

// ─── Context type ─────────────────────────────────────────────────────────────

interface AdminContextType {
  config: AdminConfig;
  updateConfig: (patch: Partial<AdminConfig>) => void;
  resetConfig: () => void;

  isAdmin: boolean;
  login:   (passcode: string) => boolean;
  logout:  () => void;

  blotter:         BlotterEntry[];
  addBlotterEntry: (e: Omit<BlotterEntry, 'id' | 'time'>) => void;
  clearBlotter:    () => void;

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
      return stored ? { ...DEFAULT_ADMIN_CONFIG, ...JSON.parse(stored) } : DEFAULT_ADMIN_CONFIG;
    } catch { return DEFAULT_ADMIN_CONFIG; }
  });

  // Admin auth
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem(ADMIN_KEY) === '1');

  // Blotter — circular buffer of 50 entries
  const [blotter, setBlotter] = useState<BlotterEntry[]>([]);
  const blotterIdRef = useRef(0);

  // Live prices fed by the streaming hook
  const [livePrices, setLivePricesState]   = useState<LivePriceEntry[]>([]);
  const [lastPriceUpdate, setLastPriceUpdate] = useState<string | null>(null);

  // Persist config changes
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(config)); } catch {}
  }, [config]);

  const updateConfig = useCallback((patch: Partial<AdminConfig>) => {
    setConfigState(prev => ({ ...prev, ...patch }));
  }, []);

  const resetConfig = useCallback(() => {
    setConfigState(DEFAULT_ADMIN_CONFIG);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const login = useCallback((passcode: string): boolean => {
    if (passcode === ADMIN_PASSCODE) {
      setIsAdmin(true);
      localStorage.setItem(ADMIN_KEY, '1');
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setIsAdmin(false);
    localStorage.removeItem(ADMIN_KEY);
  }, []);

  const addBlotterEntry = useCallback((e: Omit<BlotterEntry, 'id' | 'time'>) => {
    const entry: BlotterEntry = {
      ...e,
      id:   String(++blotterIdRef.current),
      time: new Date().toISOString(),
    };
    setBlotter(prev => [entry, ...prev].slice(0, 50));
  }, []);

  const clearBlotter = useCallback(() => setBlotter([]), []);

  const setLivePrices = useCallback((prices: LivePriceEntry[]) => {
    setLivePricesState(prices);
    setLastPriceUpdate(new Date().toISOString());
  }, []);

  return (
    <AdminContext.Provider value={{
      config, updateConfig, resetConfig,
      isAdmin, login, logout,
      blotter, addBlotterEntry, clearBlotter,
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
