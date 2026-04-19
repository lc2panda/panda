// Input:  NativeNotificationOptions（title / body / level / soundCue?）
// Output: Windows native 通知 — 优先 electron@41 内置 Notification API（含 appUserModelId）；fallback PowerShell BurntToast
// Pos:    panda-on-desk P2-T2 native 子模块；Windows 分支
//         严守 anthropic byte-equal — 仅 electron / child_process，无 anthropic 通道
//
// [NEW-FILE:#20260419-P2-08]
// 2026-04-19 +08:00 agent-β-P2-system-notify-retry · P2-T2 系统通知 win 分支

/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, global-require */

import type { NativeNotificationOptions } from './index.js'

/** PowerShell spawn 超时 — BurntToast/原生 toast 卡顿 5s 即放弃 */
export const WIN_POWERSHELL_TIMEOUT_MS = 5_000

/**
 * Windows AppUserModelId — Windows 10/11 toast 需此值绑定 Start Menu 入口
 * （否则系统通知中心标题为 "Electron"）。与 main.ts 保持同源。
 */
export const WIN_APP_USER_MODEL_ID = 'com.lc2panda.panda-on-desk' as const

/**
 * 仅供测试与诊断使用的模式枚举 —
 *   - 'electron'：成功走 electron 内置 Notification API
 *   - 'powershell'：electron 不可用 → 回退 PowerShell BurntToast
 *   - 'failed'：两条路径均失败（已捕获，向上不抛）
 */
export type WinShowMode = 'electron' | 'powershell' | 'failed'

/**
 * 测试钩子 — 替换 spawn powershell 实现（避免单测真发系统通知）。
 */
type PowerShellSpawner = (script: string, timeoutMs: number) => Promise<void>

let powershellSpawner: PowerShellSpawner | null = null

export function __setPowerShellSpawnerForTesting(fn: PowerShellSpawner | null): void {
  powershellSpawner = fn
}

/** 测试钩子 — 强制 electron 路径不可用（模拟非 electron 运行时） */
let forceDisableElectron = false
export function __setForceDisableElectronForTesting(v: boolean): void {
  forceDisableElectron = v
}

/**
 * 默认 powershell 实现 — child_process.spawn powershell.exe -Command <script>
 * 不抛错；失败 resolve。优先尝试 BurntToast 模块，无则回退原生 [Windows.UI.Notifications.ToastNotificationManager]。
 */
async function defaultPowerShellSpawner(script: string, timeoutMs: number): Promise<void> {
  let spawn: (
    cmd: string,
    args: string[],
    opts?: { timeout?: number; windowsHide?: boolean },
  ) => { on: (ev: string, cb: (...args: unknown[]) => void) => void; kill?: () => void }
  try {
    const cp = require('node:child_process') as typeof import('node:child_process')
    spawn = cp.spawn as unknown as typeof spawn
  } catch {
    return
  }

  return new Promise<void>(resolve => {
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      resolve()
    }
    let proc: ReturnType<typeof spawn>
    try {
      proc = spawn(
        'powershell.exe',
        ['-NoProfile', '-NoLogo', '-NonInteractive', '-Command', script],
        { timeout: timeoutMs, windowsHide: true },
      )
    } catch {
      finish()
      return
    }
    proc.on('error', finish)
    proc.on('exit', finish)
    proc.on('close', finish)
    setTimeout(() => {
      try {
        proc.kill?.()
      } catch {
        // ignore
      }
      finish()
    }, timeoutMs).unref?.()
  })
}

/**
 * PowerShell 单引号字符串字面量转义 — 单引号 ' → ''
 * 防止 title/body 含 ' 导致 PowerShell 解析破裂。
 */
function escapePowerShell(s: string): string {
  return s.replace(/'/g, "''")
}

/**
 * 构建 Windows 10/11 原生 toast PowerShell 脚本 —
 * 优先 BurntToast 模块（若用户安装）；否则使用 [Windows.UI.Notifications] WinRT API。
 *
 * 设计：单脚本两路径 — try BurntToast，catch fallback WinRT；
 *      避免 dispatcher 端二次 spawn 检测 BurntToast 存在性的开销。
 */
function buildWinToastScript(title: string, body: string): string {
  const escTitle = escapePowerShell(title)
  const escBody = escapePowerShell(body)
  const escAppId = escapePowerShell(WIN_APP_USER_MODEL_ID)
  // why: BurntToast 已成事实标准；缺失时回退 WinRT 原生 ToastNotificationManager
  //      两条路径产物在 Action Center 表现一致
  return `try {
  Import-Module BurntToast -ErrorAction Stop;
  New-BurntToastNotification -Text '${escTitle}', '${escBody}' -AppLogo $null;
} catch {
  [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null;
  $template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02);
  $textNodes = $template.GetElementsByTagName('text');
  $textNodes.Item(0).AppendChild($template.CreateTextNode('${escTitle}')) | Out-Null;
  $textNodes.Item(1).AppendChild($template.CreateTextNode('${escBody}')) | Out-Null;
  $toast = [Windows.UI.Notifications.ToastNotification]::new($template);
  [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('${escAppId}').Show($toast);
}`
}

/**
 * Windows 系统通知主入口 —
 *   1) 优先 electron@41 内置 Notification API（含 setAppUserModelId）
 *   2) 失败 → PowerShell（BurntToast → WinRT 原生 toast）
 *   3) 全失败 → 静默 resolve
 */
export async function showWinNotification(
  opts: NativeNotificationOptions,
): Promise<WinShowMode> {
  // ── 路径 1：electron 内置 Notification ───────────────────────────────
  if (!forceDisableElectron) {
    try {
      const electron = require('electron') as {
        Notification?: new (cfg: {
          title: string
          body?: string
          silent?: boolean
        }) => { show: () => void; on?: (ev: string, cb: () => void) => void }
        app?: {
          isReady?: () => boolean
          setAppUserModelId?: (id: string) => void
        }
      }
      const ready = electron.app?.isReady?.() ?? false
      if (electron.Notification && ready) {
        // why: Win10/11 必须 setAppUserModelId，否则通知中心 owner 显错
        try {
          electron.app?.setAppUserModelId?.(WIN_APP_USER_MODEL_ID)
        } catch {
          // ignore — 重复设置 / 测试环境
        }
        const n = new electron.Notification({
          title: opts.title,
          body: opts.body ?? '',
          silent: !!opts.soundCue,
        })
        n.show()
        return 'electron'
      }
    } catch {
      // 落到 powershell fallback
    }
  }

  // ── 路径 2：PowerShell ───────────────────────────────────────────────
  const spawner = powershellSpawner ?? defaultPowerShellSpawner
  const script = buildWinToastScript(opts.title, opts.body ?? '')
  try {
    await spawner(script, WIN_POWERSHELL_TIMEOUT_MS)
    return 'powershell'
  } catch {
    return 'failed'
  }
}

// 仅供测试 — 暴露脚本构建器以便断言转义正确
export function __buildWinToastScriptForTesting(title: string, body: string): string {
  return buildWinToastScript(title, body)
}
