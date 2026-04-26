// Input: locale key + interpolation params
// Output: translated string
// Pos: i18n root — used by all UI components
//
// Comdr 指令: 简化为仅支持 zh / en（删除 ja/ko 支持），降低维护成本。

import en from './locales/en';
import zh from './locales/zh';
import type { TranslationKey } from './locales/en';

export type Locale = 'en' | 'zh';
export type { TranslationKey };

const catalogs: Record<Locale, Record<string, string>> = { en, zh };

const STORAGE_KEY = 'panda-locale';

let currentLocale: Locale = detectLocale();

function detectLocale(): Locale {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored in catalogs) return stored as Locale;
    // 历史 ja/ko 用户迁移到 zh（首次启动默认中文）
    if (stored === 'ja' || stored === 'ko') {
      localStorage.setItem(STORAGE_KEY, 'zh');
      return 'zh';
    }
  }

  // Comdr 指令: 学习助手 + Output Styles 重组 — 首次启动默认中文。
  //   只有当用户显式选择 'en'（落到 localStorage）才用英文，
  //   browser navigator.language 不再决定首次默认。
  return 'zh';
}

/**
 * Translate a key with optional interpolation params.
 * Falls back to en, then to the key itself if no translation is found.
 */
export function translate(
  locale: Locale,
  key: TranslationKey,
  params?: Record<string, string | number>,
): string {
  let text = catalogs[locale]?.[key] ?? catalogs.en[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return text;
}

/**
 * Translate using the current global locale (for non-React callers).
 *
 * Accepts a wider `string` key so panda-side helpers (e.g. cron describe)
 * that pass dynamically-built keys still type-check. Unknown keys
 * fall back to the key itself (cc-haha desktop behaviour).
 */
export function t(key: string, params?: Record<string, string | number>): string {
  return translate(currentLocale, key as TranslationKey, params);
}

/**
 * React hook returning a `t()` function bound to the current locale.
 * Subscribes to `panda-locale-change` event so component re-renders when locale changes.
 */
import { useState, useEffect } from 'react';
export function useTranslation() {
  const [, force] = useState(0);
  useEffect(() => {
    const handler = () => force((n) => n + 1);
    window.addEventListener('panda-locale-change', handler);
    return () => window.removeEventListener('panda-locale-change', handler);
  }, []);
  return (key: string, params?: Record<string, string | number>) =>
    translate(currentLocale, key as TranslationKey, params);
}

export function setLocale(locale: Locale): void {
  // 幂等：同一 locale 不触发 reload（避免 PdGeneralSettings 重复点同语言时的死循环）
  if (currentLocale === locale) return;
  currentLocale = locale;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, locale);
  }
  if (typeof window !== 'undefined') {
    // Comdr 指令: 双保险 — 1) 同步 dispatch 事件让 useTranslation hook 即时刷新；
    //   2) 同步 reload 整页（不再 setTimeout 包裹），让所有 t() 直调组件（sidebar/composer/messages）
    //   全部从干净状态重新初始化。setTimeout 旧实现在 Electron + React 18 StrictMode 下
    //   偶发被 React fiber 抢走，导致 reload 不触发但 hook 订阅者已切换文案 → 视觉割裂。
    //   App.tsx 顶层另加 key={currentLocale} 兜底，即便 reload 失败也能整树重挂载。
    window.dispatchEvent(new CustomEvent('panda-locale-change', { detail: locale }));
    try {
      window.location.reload();
    } catch {
      /* noop — 测试环境无 reload */
    }
  }
}

export function getLocale(): Locale {
  return currentLocale;
}
