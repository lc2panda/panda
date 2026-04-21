// Input: none
// Output: { t, locale, changeLocale } — i18n utilities for React components
// Pos: hooks — bridges i18n module with React reactivity

import { useState, useEffect, useCallback } from 'react';
import { t, setLocale, getLocale, type Locale } from '../i18n';

export function useI18n() {
  const [locale, setLocaleState] = useState<Locale>(getLocale());

  useEffect(() => {
    const handler = (e: Event) => {
      setLocaleState((e as CustomEvent).detail as Locale);
    };
    window.addEventListener('pd-locale-change', handler);
    return () => window.removeEventListener('pd-locale-change', handler);
  }, []);

  const changeLocale = useCallback((newLocale: Locale) => {
    setLocale(newLocale);
    setLocaleState(newLocale);
  }, []);

  return { t, locale, changeLocale };
}
