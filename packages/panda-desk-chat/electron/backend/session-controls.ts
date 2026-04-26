// Input: sessionId + 命令名（fork/branch/resume）+ 可选 args
// Output: { ok, message } — 通过 cliManager.sendMessage 把 panda CLI 内置 slash-command
//         注入活会话；命令名不会广播到聊天面板（仅 metadata 形式由 CLI 自身处理）
// Pos: electron main — panda CLI src/commands/{fork,branch,resume} 的 IPC 桥接
//
// 数据来源（panda CLI 真实命令）：
//   src/commands/fork/index.ts    — /fork <task>     派生后台 sub-agent
//   src/commands/branch/branch.ts — /branch          以当前 transcript 为基开新分叉
//   src/commands/resume/index.ts  — /resume          恢复历史会话
//
// 注意：Electron renderer 与 panda CLI subprocess 通过 sendMessage 单向 stdin 交互。
//       slash-command 解析在 CLI 主循环内完成（src/screens/REPL.tsx）。我们仅注入
//       含 slash 前缀的 message，让 CLI 自己把它当 command 处理。
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { cliManager } from './cli-manager.js';

export type SessionControlAction = 'fork' | 'branch' | 'resume';

const ACTION_TO_SLASH: Record<SessionControlAction, string> = {
  fork: '/fork',
  branch: '/branch',
  resume: '/resume',
};

export interface SessionControlResult {
  ok: boolean;
  /** 命令文本（含 slash），用于 UI 反馈。 */
  command: string;
  error?: string;
}

/**
 * 把 slash-command 注入活会话。
 *
 * - sessionId 必须对应正在运行的 cliManager session（不能是磁盘历史）。
 * - command 'fork' / 'branch' 不接受外部 args（保持极简，如需 args
 *   后续可加 args:string 字段）。
 * - 命令通过 stdin sendMessage 传递；CLI 自身在 REPL 内解析为 slash。
 */
export async function dispatchSessionControl(
  sessionId: string,
  action: SessionControlAction,
  args?: string,
): Promise<SessionControlResult> {
  if (!sessionId || typeof sessionId !== 'string') {
    return { ok: false, command: '', error: 'sessionId required' };
  }
  if (!Object.prototype.hasOwnProperty.call(ACTION_TO_SLASH, action)) {
    return { ok: false, command: '', error: `unknown action: ${action}` };
  }
  const slash = ACTION_TO_SLASH[action];
  const trimmedArgs = typeof args === 'string' ? args.trim() : '';
  const command = trimmedArgs ? `${slash} ${trimmedArgs}` : slash;
  try {
    await cliManager.sendMessage(sessionId, command);
    return { ok: true, command };
  } catch (err) {
    return {
      ok: false,
      command,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
