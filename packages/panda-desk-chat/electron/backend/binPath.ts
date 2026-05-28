// Input: bin name (currently only 'bun')
// Output: absolute path to the binary if found in common install locations,
//         else the bare name as a PATH fallback
// Pos: electron/backend — used by adapter-manager + cli-manager to bypass
//      macOS GUI app PATH limitation + Windows bun.exe resolution (v2.27.7)
//
// [NEW-FILE:#20260426-04]
//
// macOS Electron GUI app's process.env.PATH defaults to roughly
// /usr/bin:/bin:/usr/sbin:/sbin (no ~/.bun/bin, no /opt/homebrew/bin),
// which causes spawn ENOENT for user-installed bins like bun. Resolve to an
// absolute path before handing off to spawn().
//
// 一旦我被修改，请更新 utils/README.md（如果存在），以及所属文件夹的 md。

import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

let cachedBunPath: string | null = null;

/**
 * Resolve an absolute path to the `bun` executable. Search order:
 *
 * macOS / Linux:
 *   1. $BUN_INSTALL/bin/bun (Bun's official install env)
 *   2. ~/.bun/bin/bun (default user install)
 *   3. /opt/homebrew/bin/bun (Apple Silicon Homebrew)
 *   4. /usr/local/bin/bun (Intel Homebrew / manual install)
 *   5. 'bun' bare name (PATH fallback — works in dev, not in packaged app)
 *
 * Windows (process.platform === 'win32'):
 *   1. %BUN_INSTALL%\bin\bun.exe
 *   2. %USERPROFILE%\.bun\bin\bun.exe
 *   3. %LOCALAPPDATA%\bun\bun.exe
 *   4. 'bun.exe' bare name (PATH fallback)
 *
 * Result is cached for the lifetime of the process.
 */
export function resolveBunPath(): string {
  if (cachedBunPath !== null) return cachedBunPath;
  const home = homedir();

  if (process.platform === 'win32') {
    const bunInstall = process.env.BUN_INSTALL;
    const localAppData = process.env.LOCALAPPDATA ?? '';
    const windowsCandidates = [
      bunInstall ? join(bunInstall, 'bin', 'bun.exe') : null,
      join(home, '.bun', 'bin', 'bun.exe'),
      localAppData ? join(localAppData, 'bun', 'bun.exe') : null,
    ].filter((p): p is string => p !== null);
    for (const p of windowsCandidates) {
      if (existsSync(p)) {
        cachedBunPath = p;
        return p;
      }
    }
    cachedBunPath = 'bun.exe';
    return 'bun.exe';
  }

  const bunInstall = process.env.BUN_INSTALL;
  const candidates = [
    bunInstall ? join(bunInstall, 'bin', 'bun') : null,
    join(home, '.bun', 'bin', 'bun'),
    '/opt/homebrew/bin/bun',
    '/usr/local/bin/bun',
  ].filter((p): p is string => p !== null);
  for (const p of candidates) {
    if (existsSync(p)) {
      cachedBunPath = p;
      return p;
    }
  }
  cachedBunPath = 'bun';
  return 'bun';
}
