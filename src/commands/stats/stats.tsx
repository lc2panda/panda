/**
 * Input:  /stats 命令调用 LocalJSXCommandContext + onDone
 * Output: 委托给 /usage 命令并传入 args='stats' 让其默认显示 Stats tab
 * Pos:    src/commands/stats/stats.tsx — thin shim，与 /usage /cost 共用 UnifiedUsage 组件
 *
 * 设计要点：
 * - 与 cost.ts 同型，import 形式 lazy 加载 usage 模块避免循环 require
 * - args='stats'，UnifiedUsage 的 parseDefaultTab() 会落到 'Stats' tab
 */
import type { LocalJSXCommandCall } from '../../types/command.js';

export const call: LocalJSXCommandCall = async (onDone, context, _args) => {
  const usageMod = await import('../usage/usage.js');
  return usageMod.call(onDone, context, 'stats');
};
