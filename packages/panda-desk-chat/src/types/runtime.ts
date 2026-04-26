// Input: cc-haha desktop/src/types/runtime.ts — 1:1 复刻
// Output: RuntimeSelection 类型（per-session model + provider 选择）
// Pos: Type foundation — sessionRuntimeStore / Composer ModelSelector 使用
//
// Source: cc-haha desktop/src/types/runtime.ts
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

export type RuntimeSelection = {
  providerId: string | null;
  modelId: string;
};
