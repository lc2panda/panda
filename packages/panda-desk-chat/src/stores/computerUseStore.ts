// Input:  ApprovalRequest items from UI + policy config from backend via bridge
// Output: Zustand store — policy state + pending approval queue + load/update actions
// Pos:    State layer — v2.27.1 computer-use 审批通道前端状态管理
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { create } from 'zustand';
import {
  getComputerUsePolicy,
  updateComputerUsePolicy,
} from '../ipc/bridge';
import type { ComputerUsePolicy, ApprovalRequest } from '../ipc/types';

// ---------------------------------------------------------------------------
// State & Store
// ---------------------------------------------------------------------------

interface ComputerUseState {
  policy: ComputerUsePolicy | null;
  pendingApprovals: ApprovalRequest[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadPolicy(): Promise<void>;
  updatePolicy(policy: ComputerUsePolicy): Promise<{ ok: boolean }>;
  addPendingApproval(req: ApprovalRequest): void;
  approveRequest(index: number): void;
  denyRequest(index: number): void;
  dismissAll(): void;
  clearError(): void;
}

export const useComputerUseStore = create<ComputerUseState>()((set, get) => ({
  policy: null,
  pendingApprovals: [],
  isLoading: false,
  error: null,

  loadPolicy: async () => {
    set({ isLoading: true, error: null });
    try {
      const policy = await getComputerUsePolicy();
      set({ policy, isLoading: false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      set({ isLoading: false, error: msg });
    }
  },

  updatePolicy: async (policy: ComputerUsePolicy) => {
    set({ isLoading: true, error: null });
    try {
      const result = await updateComputerUsePolicy(policy);
      if (result.ok) {
        set({ policy, isLoading: false });
      } else {
        set({ isLoading: false, error: 'Policy update failed' });
      }
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      set({ isLoading: false, error: msg });
      return { ok: false };
    }
  },

  addPendingApproval: (req: ApprovalRequest) => {
    set((state) => ({
      pendingApprovals: [...state.pendingApprovals, req],
    }));
  },

  approveRequest: (index: number) => {
    set((state) => ({
      pendingApprovals: state.pendingApprovals.filter((_, i) => i !== index),
    }));
  },

  denyRequest: (index: number) => {
    set((state) => ({
      pendingApprovals: state.pendingApprovals.filter((_, i) => i !== index),
    }));
  },

  dismissAll: () => {
    set({ pendingApprovals: [] });
  },

  clearError: () => set({ error: null }),
}));
