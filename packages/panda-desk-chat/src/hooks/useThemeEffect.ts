// Input: settingsStore.theme ('light' | 'dark' | 'system'), pandaAPI.theme IPC, prefers-color-scheme
// Output: sets data-pd-theme attribute on <html> reactively; cleanup on unmount
// Pos: Hook layer — called once in App root to drive CSS variable theme switching
import { useEffect } from 'react';
import { useSettingsStore } from '../stores/settingsStore';

/**
 * Resolves the user's theme preference into 'light' | 'dark' and applies
 * `data-pd-theme` to `document.documentElement`.
 *
 * When `theme === 'system'`, listens to both the Electron `nativeTheme`
 * IPC channel (if available) and the CSS `prefers-color-scheme` media query
 * as a fallback.
 */
export function useThemeEffect(): void {
  const theme = useSettingsStore((s) => s.theme);

  useEffect(() => {
    const applyTheme = (resolved: 'light' | 'dark') => {
      document.documentElement.setAttribute('data-pd-theme', resolved);
    };

    if (theme !== 'system') {
      applyTheme(theme);
      return;
    }

    // --- system mode ---
    // 1. Electron IPC: pandaAPI.theme.getSystemTheme()
    const api = window.pandaAPI?.theme;
    if (api?.getSystemTheme) {
      const result = api.getSystemTheme();
      // The preload returns a Promise<'light' | 'dark'>
      if (result instanceof Promise) {
        result.then((t) => applyTheme(t));
      } else {
        applyTheme(result as 'light' | 'dark');
      }
    } else {
      // 2. Fallback: matchMedia
      applyTheme(
        window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
      );
    }

    // Listen for Electron nativeTheme changes
    const unsubIpc = api?.onThemeChange?.((isDark: boolean) => {
      applyTheme(isDark ? 'dark' : 'light');
    });

    // Also listen to matchMedia as fallback (browser / dev mode)
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const mqHandler = (e: MediaQueryListEvent) => applyTheme(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', mqHandler);

    return () => {
      unsubIpc?.();
      mq.removeEventListener('change', mqHandler);
    };
  }, [theme]);
}
