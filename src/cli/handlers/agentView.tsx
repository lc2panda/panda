// Input: process.argv 经过 Commander 解析 → `claude agents`（无子命令）
// Output: 进入 Ink TUI dashboard；用户退出后视 ExitAction 决定 quit / attach / dispatch / shell
// Pos: src/cli/handlers/ —— v2.1.139 Agent View 旗舰子命令入口
/* eslint-disable custom-rules/no-process-exit -- CLI subcommand handler intentionally exits */

import * as React from 'react';
import { spawn } from 'child_process';
import { createRoot } from '../../ink.js';
import { getBaseRenderOptions } from '../../utils/renderOptions.js';
import { AgentViewDashboard, getLastExitAction } from '../../components/AgentView/index.js';
import { exec } from '../../utils/Shell.js';
import { spawnShellTask } from '../../tasks/LocalShellTask/LocalShellTask.js';
import { getDefaultAppState } from '../../state/AppStateStore.js';

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
 *   - 'shell'    → spawn command via LocalShellTask as background session, then exit(0)
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
    case 'shell': {
      // `! <command>` 分流：上游 2.1.154 后台 shell session 能力。
      // Ink 已 unmount，构造最小化 no-op TaskContext 来复用 spawnShellTask 路径
      // （包含 background() detach、stall watchdog、spillToDisk 等基础设施）。
      // AppState 更新无活跃 UI 可渲染，用内存快照承接——进程运行不受影响。
      // 等待 shellCommand.result 以避免 process.exit() 在子进程完成前杀掉它。
      const abortController = new AbortController();
      let appStateSnapshot = getDefaultAppState();
      const ctx = {
        abortController,
        getAppState: () => appStateSnapshot,
        setAppState: (fn: (prev: typeof appStateSnapshot) => typeof appStateSnapshot) => {
          appStateSnapshot = fn(appStateSnapshot);
        },
      };
      try {
        const shellCommand = await exec(action.command, abortController.signal, 'bash', {
          shouldAutoBackground: false,
        });
        await spawnShellTask(
          {
            command: action.command,
            description: `! ${action.command}`,
            shellCommand,
            kind: 'bash',
          },
          ctx,
        );
        // Wait for the spawned command to finish before exiting, so the child
        // process is not killed prematurely when the parent exits.
        await shellCommand.result;
      } catch {
        // Errors are captured in the task output file; don't crash the CLI.
      }
      process.exit(0);
      return;
    }
    case 'quit':
    default:
      process.exit(0);
  }
}
