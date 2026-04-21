/**
 * Input:  localStorage 'pd-theme' / 'pd-variant', prefers-color-scheme media query
 * Output: { mode, resolved, variant, setMode, setVariant } reactive theme state
 * Pos:    Hook layer — consumed by ThemeSwitcher, App shell, any theme-aware component
 *
 * 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。
 */

import { useState, useEffect, useCallback } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';
type ThemeVariant = '' | 'matrix';

function getResolvedTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return mode;
}

export function useTheme() {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem('pd-theme') as ThemeMode) || 'system';
  });
  const [variant, setVariantState] = useState<ThemeVariant>(() => {
    return (localStorage.getItem('pd-variant') as ThemeVariant) || '';
  });

  const resolved = getResolvedTheme(mode);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem('pd-theme', newMode);
    const resolved = getResolvedTheme(newMode);
    document.documentElement.setAttribute('data-pd-theme', resolved);
  }, []);

  const setVariant = useCallback((newVariant: ThemeVariant) => {
    setVariantState(newVariant);
    if (newVariant) {
      localStorage.setItem('pd-variant', newVariant);
      document.documentElement.setAttribute('data-pd-variant', newVariant);
    } else {
      localStorage.removeItem('pd-variant');
      document.documentElement.removeAttribute('data-pd-variant');
    }
  }, []);

  // Listen for system theme changes when in 'system' mode
  useEffect(() => {
    if (mode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      document.documentElement.setAttribute('data-pd-theme', e.matches ? 'dark' : 'light');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [mode]);

  return { mode, resolved, variant, setMode, setVariant };
}
