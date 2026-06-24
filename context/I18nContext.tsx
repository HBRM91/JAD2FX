import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import fr from '../locales/fr';
import en from '../locales/en';
import ar from '../locales/ar';

export type Locale = 'fr' | 'en' | 'ar';

const LOCALES: Record<Locale, Record<string, string>> = { fr, en, ar };
const STORAGE_KEY = 'jad2fx_locale';

interface I18nContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const I18nContext = createContext<I18nContextType | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
      return (stored && ['fr', 'en', 'ar'].includes(stored)) ? stored : 'fr';
    } catch { return 'fr'; }
  });

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch {}
  }, []);

  const t = useCallback((key: string): string => {
    return LOCALES[locale][key] ?? LOCALES['fr'][key] ?? key;
  }, [locale]);

  const isRTL = locale === 'ar';

  // Sync document direction
  useEffect(() => {
    document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', locale);
  }, [locale, isRTL]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, isRTL }}>
      {children}
    </I18nContext.Provider>
  );
};

export function useI18n(): I18nContextType {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be inside I18nProvider');
  return ctx;
}
