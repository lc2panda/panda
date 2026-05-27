// Input: bridge.getOAuthStatus IPC call
// Output: OAuthStatus + refreshStatus action for renderer consumption
// Pos: stores layer — read-only OAuth state derived from panda-cli ~/.pandacc.json.
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { create } from 'zustand';

import type { OAuthStatus } from '../ipc/types';

// ─── Store types ─────────────────────────────────────────────────────────────

export type { OAuthStatus };

export interface PandaOAuthStore {
  /** Last resolved OAuth status, or null before first refresh. */
  status: OAuthStatus | null;
  /** True while a refresh is in-flight. */
  isLoading: boolean;
  /** Error message from the last failed refresh, or null. */
  error: string | null;

  /**
   * Fetch current OAuth status from the backend (reads ~/.pandacc.json).
   * Always resolves — failures set error and return unauthenticated status.
   */
  refreshStatus(configDir?: string): Promise<void>;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const usePandaOAuthStore = create<PandaOAuthStore>((set) => ({
  status: null,
  isLoading: false,
  error: null,

  async refreshStatus(configDir?: string): Promise<void> {
    set({ isLoading: true, error: null });
    try {
      // Lazy import avoids top-level bridge import causing vi.mock hoisting issues in tests
      const { getOAuthStatus } = await import('../ipc/bridge');
      const result = await getOAuthStatus(configDir);
      set({ status: result, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      set({
        status: { authenticated: false, source: 'none', reason: 'parse-error' },
        isLoading: false,
        error: message,
      });
    }
  },
}));
