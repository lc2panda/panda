// Input: Electron auto-updater status events from bridge.onUpdateStatus
// Output: status / availableVersion / progressPercent / releaseNotes / install actions for PdAboutSettings
// Pos: State layer — drives PdAboutSettings update card + PdUpdateChecker popup
//
// Source 1:1: cc-haha desktop/src/stores/updateStore.ts shape
//   panda 已有 bridge.checkForUpdates / installUpdate / onUpdateStatus；映射事件即可。
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { create } from 'zustand';
import {
  checkForUpdates as bridgeCheckForUpdates,
  installUpdate as bridgeInstallUpdate,
  onUpdateStatus,
} from '../ipc/bridge';
import type { UpdateStatus } from '../ipc/types';

export type UpdateUIStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'restarting'
  | 'up-to-date'
  | 'error';

export interface UpdateStore {
  status: UpdateUIStatus;
  availableVersion: string | null;
  releaseNotes: string | null;
  progressPercent: number;
  downloadedBytes: number;
  totalBytes?: number;
  error: string | null;
  checkedAt: number | null;

  initialize: () => Promise<void>;
  checkForUpdates: () => Promise<void>;
  installUpdate: () => Promise<void>;
}

let unsubFn: (() => void) | null = null;

function mapStatus(status: UpdateStatus['status']): UpdateUIStatus {
  if (status === 'up-to-date') return 'up-to-date';
  if (status === 'downloaded') return 'restarting';
  if (status === 'error') return 'error';
  if (status === 'downloading') return 'downloading';
  if (status === 'available') return 'available';
  if (status === 'checking') return 'checking';
  return 'idle';
}

export const useUpdateStore = create<UpdateStore>()((set) => ({
  status: 'idle',
  availableVersion: null,
  releaseNotes: null,
  progressPercent: 0,
  downloadedBytes: 0,
  totalBytes: undefined,
  error: null,
  checkedAt: null,

  initialize: async () => {
    if (unsubFn) return;
    try {
      unsubFn = onUpdateStatus((s: UpdateStatus) => {
        set({
          status: mapStatus(s.status),
          availableVersion: s.version ?? null,
          releaseNotes:
            typeof s.releaseNotes === 'string' ? s.releaseNotes : null,
          progressPercent: typeof s.percent === 'number' ? s.percent : 0,
          error: s.status === 'error' ? s.message ?? null : null,
        });
      });
    } catch {
      /* not in electron */
    }
  },

  checkForUpdates: async () => {
    set({ status: 'checking', error: null, checkedAt: Date.now() });
    try {
      await bridgeCheckForUpdates();
    } catch (err) {
      set({
        status: 'error',
        error: err instanceof Error ? err.message : String(err),
      });
    }
  },

  installUpdate: async () => {
    set({ status: 'downloading' });
    try {
      await bridgeInstallUpdate();
    } catch (err) {
      set({
        status: 'error',
        error: err instanceof Error ? err.message : String(err),
      });
    }
  },
}));
