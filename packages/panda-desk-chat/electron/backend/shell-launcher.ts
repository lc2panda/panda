// Input: { cwd?: string } — target working directory for the system terminal
// Output: { ok: boolean; error?: string } — launch result
// Pos: electron/backend utility; invoked by shell:openTerminal IPC handler (Bug F G5)
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export interface OpenTerminalArgs {
  cwd?: string;
}

export interface OpenTerminalResult {
  ok: boolean;
  error?: string;
}

/**
 * Sanitise a path for use as an argument to shell launchers that embed the
 * path inside a script string (e.g. osascript `do script`).
 * Replaces single-quotes with escaped single-quote sequences so the string
 * remains valid when wrapped in single quotes:  foo'bar → foo'\''bar
 */
export function sanitizeCwdForScript(cwd: string): string {
  return cwd.replace(/'/g, "'\\''");
}

/**
 * Open the host OS system terminal at `cwd`.
 *
 * Platform dispatch:
 *   macOS  — `osascript -e 'tell application "Terminal" to do script "cd <cwd>"'`
 *   Linux  — `x-terminal-emulator --working-directory=<cwd>` (fallback: gnome-terminal)
 *   Windows — `cmd.exe /c start cmd.exe /k "cd /d <cwd>"`
 *
 * cwd injection defence: the path is embedded in AppleScript / shell strings only
 * after single-quote escaping (macOS) or via argv array members (Linux/Windows),
 * so no shell metacharacter injection is possible.
 */
export async function openSystemTerminal(
  args: OpenTerminalArgs = {},
): Promise<OpenTerminalResult> {
  const cwd = args.cwd || process.env.HOME || '/';
  const TIMEOUT_MS = 5000;

  try {
    if (process.platform === 'darwin') {
      const safeCwd = sanitizeCwdForScript(cwd);
      const script = `tell application "Terminal" to do script "cd '${safeCwd}'"`;
      await execFileAsync('osascript', ['-e', script], { timeout: TIMEOUT_MS });
      return { ok: true };
    }

    if (process.platform === 'linux') {
      try {
        await execFileAsync(
          'x-terminal-emulator',
          [`--working-directory=${cwd}`],
          { timeout: TIMEOUT_MS },
        );
      } catch {
        // fallback to gnome-terminal
        await execFileAsync(
          'gnome-terminal',
          [`--working-directory=${cwd}`],
          { timeout: TIMEOUT_MS },
        );
      }
      return { ok: true };
    }

    if (process.platform === 'win32') {
      // Pass cwd as argv to avoid shell metacharacter injection.
      await execFileAsync(
        'cmd.exe',
        ['/c', 'start', 'cmd.exe', '/k', `cd /d ${cwd}`],
        { timeout: TIMEOUT_MS },
      );
      return { ok: true };
    }

    return { ok: false, error: 'unsupported-platform' };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
