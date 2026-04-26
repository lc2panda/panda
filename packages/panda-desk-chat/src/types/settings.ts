// Input: cc-haha desktop/src/types/settings.ts — 1:1 复刻 + panda 历史字面量 union 扩展
// Output: PermissionMode / EffortLevel / ModelInfo / ThemeMode 类型
// Pos: Type foundation — settingsStore / chatStore / 各设置面板使用
//
// Source: cc-haha desktop/src/types/settings.ts
//   cc-haha PermissionMode = default | acceptEdits | bypassPermissions | plan
//   panda IPC PermissionMode = default | plan | auto | bypassPermissions（保留 'auto'）
//   union 取并集以同时兼容；映射逻辑见 settingsStore.toIpcPermissionMode()
//
//   cc-haha EffortLevel = low | medium | high
//   panda 历史 EffortLevel = minimal | medium | high | max
//   union 取并集（minimal/max 为 panda 兼容值，store fetchAll/loadSettings
//   会做 migration 到 cc-haha 三档）。
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

export type PermissionMode =
  | 'default'
  | 'acceptEdits'
  | 'bypassPermissions'
  | 'plan'
  | 'auto'; // panda 历史字面量

export type EffortLevel =
  | 'low'
  | 'medium'
  | 'high'
  | 'minimal' // panda 历史字面量
  | 'max'; // panda 历史字面量

export type ThemeMode = 'light' | 'dark';

export type ModelInfo = {
  id: string;
  name: string;
  description?: string;
  contextWindow?: number;
  maxOutput?: number;
  inputPrice?: number;
  outputPrice?: number;
};
