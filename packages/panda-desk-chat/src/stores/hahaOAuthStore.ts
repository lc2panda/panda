// Input: (compat shim — delegates to pandaOAuthStore for IPC-backed state)
// Output: re-exports all of pandaOAuthStore + legacy HahaOAuthStore stub for existing imports
// Pos: State layer — backward-compat wrapper; new code should import from pandaOAuthStore directly.
//
// v2.27.1: pandaOAuthStore implements real IPC-backed OAuth status read.
//   hahaOAuthStore is retained as a compat re-export so existing component imports don't break.
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

export * from './pandaOAuthStore';

import { create } from 'zustand';

export type HahaOAuthStatus = {
  loggedIn: boolean;
  subscriptionType?: string;
  email?: string;
};

export interface HahaOAuthStore {
  status: HahaOAuthStatus | null;
  isLoading: boolean;
  error: string | null;

  fetchStatus: () => Promise<void>;
  login: () => Promise<{ authorizeUrl: string }>;
  logout: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
}

let pollHandle: ReturnType<typeof setInterval> | null = null;

export const useHahaOAuthStore = create<HahaOAuthStore>()((set, get) => ({
  status: null,
  isLoading: false,
  error: null,

  // TODO(IPC): panda 缺 hahaOAuthApi.getStatus；返回未登录占位。
  fetchStatus: async () => {
    set({ isLoading: true, error: null });
    try {
      // 默认未登录占位；接 panda OAuth 后端后这里改成实际查询。
      set({ status: { loggedIn: false }, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch status',
      });
    }
  },

  // TODO(IPC): panda 缺 hahaOAuthApi.login；当前直接报错。
  login: async () => {
    set({ error: 'Claude OAuth not yet wired in panda-desk-chat' });
    throw new Error('Claude OAuth not yet wired in panda-desk-chat');
  },

  logout: async () => {
    set({ status: { loggedIn: false } });
  },

  startPolling: () => {
    if (pollHandle) return;
    pollHandle = setInterval(() => {
      void get().fetchStatus();
    }, 2000);
  },

  stopPolling: () => {
    if (pollHandle) {
      clearInterval(pollHandle);
      pollHandle = null;
    }
  },
}));
