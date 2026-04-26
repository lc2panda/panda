// Input: skill records discovered from user/project/plugin/mcp/bundled scopes
// Output: skills list + selected skill detail (file tree + frontmatter) for PdSkillSettings
// Pos: State layer — drives PdSkillSettings list/detail
//
// Source 1:1: cc-haha desktop/src/stores/skillStore.ts shape
//   panda IPC 缺 skillsApi → 全降级到空列表 stub + TODO 标记。
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { create } from 'zustand';
import type { SkillMeta, SkillDetail, SkillSource } from '../types/skill';

export interface SkillStore {
  skills: SkillMeta[];
  selectedSkill: SkillDetail | null;
  selectedSkillReturnTab: string | null;
  isLoading: boolean;
  isDetailLoading: boolean;
  error: string | null;

  fetchSkills: (cwd?: string) => Promise<void>;
  fetchSkillDetail: (
    source: SkillSource,
    name: string,
    cwd?: string,
    returnTab?: string,
  ) => Promise<void>;
  clearSelection: () => void;
}

export const useSkillStore = create<SkillStore>()((set) => ({
  skills: [],
  selectedSkill: null,
  selectedSkillReturnTab: null,
  isLoading: false,
  isDetailLoading: false,
  error: null,

  // TODO(IPC): panda 缺 skillsApi.list；目前返回空。
  fetchSkills: async (_cwd) => {
    set({ isLoading: true, error: null });
    try {
      set({ skills: [], isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load skills',
      });
    }
  },

  // TODO(IPC): panda 缺 skillsApi.detail；保持空。
  fetchSkillDetail: async (_source, _name, _cwd, returnTab) => {
    set({ selectedSkill: null, selectedSkillReturnTab: returnTab ?? null });
  },

  clearSelection: () =>
    set({ selectedSkill: null, selectedSkillReturnTab: null }),
}));
