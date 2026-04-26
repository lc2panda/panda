/**
 * Input:  /cost 命令调用 LocalJSXCommandContext + onDone
 * Output: 委托给 /usage 命令并传入 args='cost' 让其默认显示 Cost tab
 * Pos:    src/commands/cost/cost.ts — thin shim，与 /usage /stats 共用 UnifiedUsage 组件
 *
 * 设计要点：
 * - 类型从 'local'(文本输出) 改为 'local-jsx'，配合 cost/index.ts 一并改
 * - 不直接 import usage 模块（避免循环 require），按 lazy module 形式 await import
 * - args 用字符串 'cost'（与 parseDefaultTab 约定一致）
 */
import type { LocalJSXCommandCall } from '../../types/command.js';

export const call: LocalJSXCommandCall = async (onDone, context, _args) => {
  const usageMod = await import('../usage/usage.js');
  return usageMod.call(onDone, context, 'cost');
};
