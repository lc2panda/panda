// Input: { isPackaged, openAtLogin, execPath, appPath }（Electron 上下文）
// Output: 跨平台 LoginItem 设置 + Linux .desktop 文件读写
// Pos: panda-on-desk 平台层 — 开机自启
//
// Forked from clawd-on-desk@4b07658:src/login-item.js (MIT License)
// JS → TS 直接转 + 品牌词从 clawd 替换为 panda-on-desk。

// ── OS login item helpers ──
//
// Cross-platform "open at login" / "start on boot" plumbing.
//
//   - macOS / Windows: Electron's app.setLoginItemSettings handles it; we just
//     compute the right shape via getLoginItemSettings().
//   - Linux: Electron has no API, so we drop a .desktop file into
//     ~/.config/autostart/ ourselves (linuxGetOpenAtLogin / linuxSetOpenAtLogin).

import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

export const AUTOSTART_DIR = path.join(os.homedir(), '.config', 'autostart')
export const AUTOSTART_FILE = path.join(AUTOSTART_DIR, 'panda-on-desk.desktop')

export interface LoginItemArgs {
  isPackaged: boolean
  openAtLogin: boolean
  execPath?: string
  appPath?: string
}

export interface LoginItemSettings {
  openAtLogin: boolean
  path?: string
  args?: string[]
}

export function getLoginItemSettings({
  isPackaged,
  openAtLogin,
  execPath,
  appPath,
}: LoginItemArgs): LoginItemSettings {
  if (isPackaged) return { openAtLogin }
  return {
    openAtLogin,
    path: execPath,
    args: appPath ? [appPath] : [],
  }
}

export function linuxGetOpenAtLogin(): boolean {
  try {
    return fs.existsSync(AUTOSTART_FILE)
  } catch {
    return false
  }
}

export function linuxSetOpenAtLogin(
  enable: boolean,
  { execCmd }: { execCmd?: string } = {},
): void {
  if (enable) {
    if (!execCmd) {
      throw new Error('linuxSetOpenAtLogin: execCmd is required when enabling')
    }
    const desktop =
      [
        '[Desktop Entry]',
        'Type=Application',
        'Name=panda on desk',
        `Exec=${execCmd}`,
        'Hidden=false',
        'NoDisplay=false',
        'X-GNOME-Autostart-enabled=true',
      ].join('\n') + '\n'
    fs.mkdirSync(AUTOSTART_DIR, { recursive: true })
    fs.writeFileSync(AUTOSTART_FILE, desktop)
  } else {
    try {
      fs.unlinkSync(AUTOSTART_FILE)
    } catch (err: any) {
      if (err && err.code !== 'ENOENT') throw err
    }
  }
}
