// Input: locale key + interpolation params
// Output: translated string
// Pos: i18n root — used by all UI components

import zh from './locales/zh';
import en from './locales/en';
import ja from './locales/ja';
import ko from './locales/ko';

export type Locale = 'zh' | 'en' | 'ja' | 'ko';
export type TranslationKey = keyof typeof zh;

const catalogs: Record<Locale, Record<string, string>> = { zh, en, ja, ko };

let currentLocale: Locale = detectLocale();

function detectLocale(): Locale {
  const stored = localStorage.getItem('pd-locale');
  if (stored && stored in catalogs) return stored as Locale;

  const nav = navigator.language.toLowerCase();
  if (nav.startsWith('zh')) return 'zh';
  if (nav.startsWith('ja')) return 'ja';
  if (nav.startsWith('ko')) return 'ko';
  return 'en';
}

export function t(key: string, params?: Record<string, string | number>): string {
  const catalog = catalogs[currentLocale] || catalogs.zh;
  let text = catalog[key] || catalogs.zh[key] || key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    });
  }
  return text;
}

export function setLocale(locale: Locale): void {
  currentLocale = locale;
  localStorage.setItem('pd-locale', locale);
  // Dispatch event for React re-render
  window.dispatchEvent(new CustomEvent('pd-locale-change', { detail: locale }));
}

export function getLocale(): Locale {
  return currentLocale;
}
