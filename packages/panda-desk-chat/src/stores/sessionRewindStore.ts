// Input: sessionId (UUID) + userTurnIndex + optional restoreFiles flag
// Output: RewindPreview / RewindResult via IPC bridge; Zustand store state for UI
// Pos: renderer — session rewind state; consumed by rewind UI (v2.27.2+)
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { create } from 'zustand';
import { previewRewind, executeRewind } from '../ipc/bridge';
import type { RewindPreview, RewindResult } from '../ipc/types';

// ─── State ────────────────────────────────────────────────────────────────────

export interface SessionRewindState {
  /** Current preview result (null until a preview is loaded). */
  preview: RewindPreview | null;
  /** True while an async operation is in flight. */
  isLoading: boolean;
  /** Error message from the last failed operation. */
  error: string | null;
  /** Absolute path of the backup file created by the last execute. */
  lastBackupPath: string | null;
  /** Files restored by the last execute. */
  lastRestoredFiles: string[];
}

// ─── Actions ─────────────────────────────────────────────────────────────────

export interface SessionRewindActions {
  /**
   * Preview the impact of rewinding `sessionId` to `userTurnIndex`.
   * Sets `preview` or `error` on the store.
   */
  previewRewind(sessionId: string, userTurnIndex: number): Promise<void>;

  /**
   * Execute the rewind.  Must call `previewRewind` first so the preview is
   * shown to the user before a destructive operation.
   */
  executeRewind(
    sessionId: string,
    userTurnIndex: number,
    options?: { restoreFiles?: boolean },
  ): Promise<RewindResult>;

  /** Clear the error field. */
  clearError(): void;

  /** Reset the store to initial state. */
  reset(): void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

const initialState: SessionRewindState = {
  preview: null,
  isLoading: false,
  error: null,
  lastBackupPath: null,
  lastRestoredFiles: [],
};

export const useSessionRewindStore = create<SessionRewindState & SessionRewindActions>()(
  (set) => ({
    ...initialState,

    previewRewind: async (sessionId: string, userTurnIndex: number): Promise<void> => {
      set({ isLoading: true, error: null, preview: null });
      try {
        const result = await previewRewind(sessionId, userTurnIndex);
        set({ preview: result, isLoading: false });
      } catch (err) {
        set({
          isLoading: false,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    },

    executeRewind: async (
      sessionId: string,
      userTurnIndex: number,
      options?: { restoreFiles?: boolean },
    ): Promise<RewindResult> => {
      set({ isLoading: true, error: null });
      try {
        const result = await executeRewind(sessionId, userTurnIndex, options);
        if (result.ok) {
          set({
            isLoading: false,
            lastBackupPath: result.backupPath,
            lastRestoredFiles: result.restoredFiles,
            preview: null,
          });
        } else {
          set({
            isLoading: false,
            error: result.error ?? '回退失败',
          });
        }
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        set({ isLoading: false, error: msg });
        return { ok: false, backupPath: '', restoredFiles: [], error: msg };
      }
    },

    clearError: (): void => {
      set({ error: null });
    },

    reset: (): void => {
      set({ ...initialState });
    },
  }),
);
