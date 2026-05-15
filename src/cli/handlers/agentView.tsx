// Input: process.argv 经过 Commander 解析 → `claude agents`（无子命令）
// Output: 进入 Ink TUI dashboard；用户退出后视 ExitAction 决定 quit / attach / dispatch
// Pos: src/cli/handlers/ —— v2.1.139 Agent View 旗舰子命令入口
/* eslint-disable custom-rules/no-process-exit -- CLI subcommand handler intentionally exits */

import * as React from 'react';
import { spawn } from 'child_process';
import { createRoot } from '../../ink.js';
import { getBaseRenderOptions } from '../../utils/renderOptions.js';
import { AgentViewDashboard, getLastExitAction } from '../../components/AgentView/index.js';

/**
 * Re-spawn the panda CLI with the given args, inheriting stdio. Returns
 * the child's exit code (0 on attach/error). The dashboard process delegates
 * its TTY to the child so the attached session has a clean terminal.
 */
async function reSpawnPanda(args: string[], cwd: string): Promise<number> {
  const exe = process.argv0;
  const script = process.argv[1] ?? '';
  return new Promise<number>(resolve => {
    const child = spawn(exe, [script, ...args], {
      stdio: 'inherit',
      cwd,
      env: process.env,
    });
    child.on('exit', code => resolve(typeof code === 'number' ? code : 0));
    child.on('error', () => resolve(0));
  });
}

/**
 * Launch the Agent View TUI dashboard.
 * Exit actions:
 *   - 'quit'     → process.exit(0)
 *   - 'attach'   → re-spawn `panda --resume <sessionId>` in entry.cwd, then exit
 *   - 'dispatch' → re-spawn `panda` (fresh session) in entry.cwd, then exit
 */
export async function agentViewHandler(): Promise<void> {
  const root = await createRoot(getBaseRenderOptions(false));
  root.render(<AgentViewDashboard />);
  await root.waitUntilExit();

  const action = getLastExitAction();
  switch (action.kind) {
    case 'attach': {
      const code = await reSpawnPanda(['--resume', action.sessionId], action.cwd);
      process.exit(code);
      return;
    }
    case 'dispatch': {
      const args: string[] = [];
      // Tier 2 (v2.26.1, Worker P): dashboard 的 dispatchPrompt 通过 --prefill
      // 注入新 panda 子进程的 prompt input。--prefill 调 seedEarlyInput()，
      // REPL 渲染时 consumeEarlyInput() 把内容预填进输入框（不会自动提交）。
      //
      // 这里没用 `-p`（headless 模式）：dispatch + attach 的语义是“打开一个
      // 新交互会话，把草稿填好让用户决定是否回车”，不是“headless 跑完就退”。
      if (action.draft && action.draft.trim().length > 0) {
        args.push('--prefill', action.draft);
      }
      const code = await reSpawnPanda(args, action.cwd);
      process.exit(code);
      return;
    }
    case 'quit':
    default:
      process.exit(0);
  }
}
