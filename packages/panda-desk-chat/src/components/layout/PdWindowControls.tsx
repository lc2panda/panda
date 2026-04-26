// Input: pandaAPI.window IPC（minimize / maximize / close / isMaximized / onResized）
// Output: Windows 平台自定义窗口控件（minimize/maximize/close）
// Pos: Layout layer — TabBar 右侧；对标 cc-haha desktop/src/components/layout/WindowControls.tsx
//
// Source: cc-haha desktop/src/components/layout/WindowControls.tsx L1-97（97 行）
//   panda 适配：
//     - cc-haha @tauri-apps/api/window getCurrentWindow → panda window.pandaAPI.window 桥接（若可用）
//     - 'electronAPI' in window 替代 __TAURI_INTERNALS__
//     - className 全部前缀替换：var(--color-*) → var(--pd-color-*)
//     - 仅 Windows 显示（macOS / Linux 走原生 frame）
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { useState, useEffect } from 'react';

const isElectron =
  typeof window !== 'undefined' &&
  ('electronAPI' in window || 'pandaAPI' in window);
const isWindows = typeof navigator !== 'undefined' && /Win/.test(navigator.platform);

/** Whether to render custom window controls (Windows + Electron only) */
export const showWindowControls = isElectron && isWindows;

interface WindowControlsAPI {
  minimize: () => Promise<void>;
  toggleMaximize: () => Promise<void>;
  close: () => Promise<void>;
  isMaximized: () => Promise<boolean>;
  onResized: (handler: () => void) => Promise<() => void>;
}

export function PdWindowControls() {
  const [maximized, setMaximized] = useState(false);
  const [win, setWin] = useState<WindowControlsAPI | null>(null);

  useEffect(() => {
    if (!showWindowControls) return;
    let unlisten: (() => void) | undefined;

    // panda IPC：从 window.pandaAPI.window 读取 BrowserWindow 控制接口（如果实现）
    // 否则保持 win = null（按钮不渲染）
    type PandaWindowAPI = Partial<WindowControlsAPI>;
    type PandaAPI = { window?: PandaWindowAPI };
    type WithPandaAPI = Window & { pandaAPI?: PandaAPI };
    const api = (window as WithPandaAPI).pandaAPI?.window;
    if (api && api.minimize && api.toggleMaximize && api.close && api.isMaximized && api.onResized) {
      const w = api as WindowControlsAPI;
      setWin(w);
      w.isMaximized().then(setMaximized).catch(() => {});
      w.onResized(async () => {
        try {
          setMaximized(await w.isMaximized());
        } catch {
          /* noop */
        }
      })
        .then((fn) => { unlisten = fn; })
        .catch(() => {});
    }

    return () => { unlisten?.(); };
  }, []);

  const runWindowAction = (action: () => Promise<void>) => {
    void action().catch((error) => {
      console.error('Window control action failed', error);
    });
  };

  if (!showWindowControls || !win) return null;

  return (
    <div data-testid="window-controls" className="flex items-stretch flex-shrink-0 -my-px">
      {/* Minimize */}
      <button
        onClick={() => runWindowAction(() => win.minimize())}
        aria-label="Minimize window"
        className="w-[46px] h-full flex items-center justify-center text-[var(--pd-color-text-secondary)] hover:bg-[var(--pd-color-surface-hover)] transition-colors"
      >
        <svg width="10" height="1" viewBox="0 0 10 1">
          <rect width="10" height="1" fill="currentColor" />
        </svg>
      </button>

      {/* Maximize / Restore */}
      <button
        onClick={() => runWindowAction(() => win.toggleMaximize())}
        aria-label={maximized ? 'Restore window' : 'Maximize window'}
        className="w-[46px] h-full flex items-center justify-center text-[var(--pd-color-text-secondary)] hover:bg-[var(--pd-color-surface-hover)] transition-colors"
      >
        {maximized ? (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
            <rect x="0" y="3" width="7" height="7" />
            <polyline points="3,3 3,0 10,0 10,7 7,7" />
          </svg>
        ) : (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
            <rect x="0.5" y="0.5" width="9" height="9" />
          </svg>
        )}
      </button>

      {/* Close */}
      <button
        onClick={() => runWindowAction(() => win.close())}
        aria-label="Close window"
        className="w-[46px] h-full flex items-center justify-center text-[var(--pd-color-text-secondary)] hover:bg-[var(--pd-color-window-close-hover)] hover:text-white transition-colors"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2">
          <line x1="0" y1="0" x2="10" y2="10" />
          <line x1="10" y1="0" x2="0" y2="10" />
        </svg>
      </button>
    </div>
  );
}

// cc-haha L1-97 — 97 行；panda 复刻 + Electron pandaAPI.window 桥接。
