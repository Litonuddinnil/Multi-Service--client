import React, { createContext, useContext, useState, useEffect } from 'react';
import { DICTIONARY, Locale, TranslationKey } from '../constants/i18n';

export interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
  formatBDT: (amount: number) => string;
  formatNumber: (n: number) => string;
  formatDate: (isoString: string) => string;
  formatDateTime: (isoString: string) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const saved = localStorage.getItem('withu_lang') as Locale;
    if (saved === 'en' || saved === 'bn') {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem('withu_lang', l);
  };

  const t = (key: TranslationKey): string => {
    return DICTIONARY[locale]?.[key] || DICTIONARY.en[key] || String(key);
  };

  const formatBDT = (amount: number): string => {
    const isInt = Number.isInteger(amount);
    const formatted = new Intl.NumberFormat(locale === 'bn' ? 'bn-BD' : 'en-BD', {
      minimumFractionDigits: isInt ? 0 : 2,
      maximumFractionDigits: 2
    }).format(amount);
    return `৳${formatted}`;
  };

  const formatNumber = (n: number): string => {
    return new Intl.NumberFormat(locale === 'bn' ? 'bn-BD' : 'en-US').format(n);
  };

  const formatDate = (isoString: string): string => {
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat(locale === 'bn' ? 'bn-BD' : 'en-US', {
        timeZone: 'Asia/Dhaka',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }).format(d);
    } catch {
      return isoString;
    }
  };

  const formatDateTime = (isoString: string): string => {
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat(locale === 'bn' ? 'bn-BD' : 'en-US', {
        timeZone: 'Asia/Dhaka',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(d);
    } catch {
      return isoString;
    }
  };

  return (
    <LanguageContext.Provider value={{
      locale,
      setLocale,
      t,
      formatBDT,
      formatNumber,
      formatDate,
      formatDateTime
    }}>
      {children}
    </LanguageContext.Provider>
  );
};