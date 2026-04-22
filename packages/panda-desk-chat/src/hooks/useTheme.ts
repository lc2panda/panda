// Input: settingsStore.theme, settingsStore.setTheme
// Output: { mode, resolved, variant, setMode, setVariant } reactive theme state
// Pos: Hook layer — consumed by AppearanceTab and any theme-aware component
/**
 * Thin hook wrapping the Zustand settings store for theme state.
 * Resolves 'system' → 'light' | 'dark' via prefers-color-scheme.
 *
 * NOTE: The actual DOM side-effect (setting data-pd-theme) is handled by
 * `useThemeEffect` in the App root. This hook is purely for reading state.
 */

import { useEffect, useState, useCallback } from 'react';
import { useSettingsStore, type Theme } from '../stores/settingsStore';

type ThemeVariant = '' | 'matrix';

function resolveTheme(mode: Theme): 'light' | 'dark' {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return mode;
}

export function useTheme() {
  const mode = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const [resolved, setResolved] = useState<'light' | 'dark'>(() => resolveTheme(mode));
  const [variant, setVariant] = useState<ThemeVariant>(() => {
    return (localStorage.getItem('pd-variant') as ThemeVariant) || '';
  });

  // Keep `resolved` in sync when mode or system preference changes
  useEffect(() => {
    setResolved(resolveTheme(mode));
    if (mode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setResolved(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [mode]);

  // Persist variant & apply to DOM
  useEffect(() => {
    if (variant) {
      document.documentElement.setAttribute('data-pd-variant', variant);
      localStorage.setItem('pd-variant', variant);
    } else {
      document.documentElement.removeAttribute('data-pd-variant');
      localStorage.removeItem('pd-variant');
    }
  }, [variant]);

  const setMode = useCallback((newMode: Theme) => {
    setTheme(newMode);
  }, [setTheme]);

  return { mode, resolved, variant, setMode, setVariant };
}
