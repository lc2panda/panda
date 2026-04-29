import { c as _c } from "react/compiler-runtime";
import { feature } from 'bun:bundle';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import useStdin from '../../ink/hooks/use-stdin.js';
import { getGlobalConfig, saveGlobalConfig } from '../../utils/config.js';
import { getSystemThemeName, type SystemTheme } from '../../utils/systemTheme.js';
import type { ThemeName, ThemeSetting } from '../../utils/theme.js';
import { setMatrixThemeCache } from '../MatrixTheme/isMatrixTheme.js';
type ThemeContextValue = {
  /** The saved user preference. May be 'auto'. */
  themeSetting: ThemeSetting;
  setThemeSetting: (setting: ThemeSetting) => void;
  setPreviewTheme: (setting: ThemeSetting) => void;
  savePreview: () => void;
  cancelPreview: () => void;
  /** The resolved theme to render with. Never 'auto'. */
  currentTheme: ThemeName;
};

// Non-'auto' default so useTheme() works without a provider (tests, tooling).
const DEFAULT_THEME: ThemeName = 'dark';
const ThemeContext = createContext<ThemeContextValue>({
  themeSetting: DEFAULT_THEME,
  setThemeSetting: () => {},
  setPreviewTheme: () => {},
  savePreview: () => {},
  cancelPreview: () => {},
  currentTheme: DEFAULT_THEME
});
type Props = {
  children: React.ReactNode;
  initialState?: ThemeSetting;
  onThemeSave?: (setting: ThemeSetting) => void;
};
function defaultInitialTheme(): ThemeSetting {
  return getGlobalConfig().theme;
}
function defaultSaveTheme(setting: ThemeSetting): void {
  saveGlobalConfig(current => ({
    ...current,
    theme: setting
  }));
}

/**
 * 单一入口同步 process.env.PANDA_THEME 与 isMatrixTheme prefetch 缓存。
 * Comdr #4 修复（2026-04-26）：原代码在四处分别 set/delete env，且 savePreview
 * 不同步 env，prefetch 缓存又永久不刷新 → /theme 热切失效。
 */
function syncMatrixEnv(setting: ThemeSetting): void {
  const isMatrix = setting === 'matrix';
  if (isMatrix) {
    process.env.PANDA_THEME = 'matrix';
  } else if (process.env.PANDA_THEME === 'matrix') {
    delete process.env.PANDA_THEME;
  }
  // 必须刷新 prefetch 缓存：env 删除后 isMatrixTheme() 走 prefetch 路径，
  // 旧值（module-load 时为 true）会盖过 env 删除的语义。
  setMatrixThemeCache(isMatrix);
}
export function ThemeProvider({
  children,
  initialState,
  onThemeSave = defaultSaveTheme
}: Props) {
  const [themeSetting, setThemeSetting] = useState(initialState ?? defaultInitialTheme);
  const [previewTheme, setPreviewTheme] = useState<ThemeSetting | null>(null);

  // Sync PANDA_THEME env var + prefetch cache on mount for Matrix detection
  useEffect(() => {
    syncMatrixEnv(themeSetting);
  }, []); // run once on mount

  // Track terminal theme for 'auto' resolution. Seeds from $COLORFGBG (or
  // 'dark' if unset); the OSC 11 watcher corrects it on first poll.
  const [systemTheme, setSystemTheme] = useState<SystemTheme>(() => (initialState ?? themeSetting) === 'auto' ? getSystemThemeName() : 'dark');

  // The setting currently in effect (preview wins while picker is open)
  const activeSetting = previewTheme ?? themeSetting;
  const {
    internal_querier
  } = useStdin();

  // Watch for live terminal theme changes while 'auto' is active.
  // Positive feature() pattern so the watcher import is dead-code-eliminated
  // in external builds.
  useEffect(() => {
    if (feature('AUTO_THEME')) {
      if (activeSetting !== 'auto' || !internal_querier) return;
      let cleanup: (() => void) | undefined;
      let cancelled = false;
      void import('../../utils/systemThemeWatcher.js').then(({
        watchSystemTheme
      }) => {
        if (cancelled) return;
        cleanup = watchSystemTheme(internal_querier, setSystemTheme);
      });
      return () => {
        cancelled = true;
        cleanup?.();
      };
    }
  }, [activeSetting, internal_querier]);
  const currentTheme: ThemeName = activeSetting === 'auto' ? systemTheme : activeSetting;
  const value = useMemo<ThemeContextValue>(() => ({
    themeSetting,
    setThemeSetting: (newSetting: ThemeSetting) => {
      setThemeSetting(newSetting);
      setPreviewTheme(null);
      // Matrix: sync env var + prefetch cache so isMatrixTheme() /
      // color-diff-napi detect the new theme. See syncMatrixEnv for cache
      // invalidate semantics (Comdr #4 fix, 2026-04-26).
      syncMatrixEnv(newSetting);
      // Switching to 'auto' restarts the watcher (activeSetting dep), whose
      // first poll fires immediately. Seed from the cache so the OSC
      // round-trip doesn't flash the wrong palette.
      if (newSetting === 'auto') {
        setSystemTheme(getSystemThemeName());
      }
      onThemeSave?.(newSetting);
    },
    setPreviewTheme: (newSetting_0: ThemeSetting) => {
      setPreviewTheme(newSetting_0);
      // Matrix: sync env var + prefetch cache for live preview
      syncMatrixEnv(newSetting_0);
      if (newSetting_0 === 'auto') {
        setSystemTheme(getSystemThemeName());
      }
    },
    savePreview: () => {
      if (previewTheme !== null) {
        setThemeSetting(previewTheme);
        setPreviewTheme(null);
        // Comdr #4 fix (2026-04-26): savePreview previously DID NOT sync
        // env / prefetch cache — only setThemeSetting wrap did. When
        // ThemePicker confirms (Enter), savePreview runs first; if it
        // doesn't sync, isMatrixTheme() may flip-flop until the wrap-version
        // setter is called (race depending on call order).
        syncMatrixEnv(previewTheme);
        onThemeSave?.(previewTheme);
      }
    },
    cancelPreview: () => {
      if (previewTheme !== null) {
        setPreviewTheme(null);
        // Restore env var + prefetch cache to match the saved theme (not
        // the preview).
        syncMatrixEnv(themeSetting);
      }
    },
    currentTheme
  }), [themeSetting, previewTheme, currentTheme, onThemeSave]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Returns the resolved theme for rendering (never 'auto') and a setter that
 * accepts any ThemeSetting (including 'auto').
 */
export function useTheme() {
  const $ = _c(3);
  const {
    currentTheme,
    setThemeSetting
  } = useContext(ThemeContext);
  let t0;
  if ($[0] !== currentTheme || $[1] !== setThemeSetting) {
    t0 = [currentTheme, setThemeSetting];
    $[0] = currentTheme;
    $[1] = setThemeSetting;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  return t0;
}

/**
 * Returns the raw theme setting as stored in config. Use this in UI that
 * needs to show 'auto' as a distinct choice (e.g., ThemePicker).
 */
export function useThemeSetting() {
  return useContext(ThemeContext).themeSetting;
}
export function usePreviewTheme() {
  const $ = _c(4);
  const {
    setPreviewTheme,
    savePreview,
    cancelPreview
  } = useContext(ThemeContext);
  let t0;
  if ($[0] !== cancelPreview || $[1] !== savePreview || $[2] !== setPreviewTheme) {
    t0 = {
      setPreviewTheme,
      savePreview,
      cancelPreview
    };
    $[0] = cancelPreview;
    $[1] = savePreview;
    $[2] = setPreviewTheme;
    $[3] = t0;
  } else {
    t0 = $[3];
  }
  return t0;
}
