// Input:  NativeNotificationOptions（title / body / level / soundCue?）
// Output: macOS native 通知 — 优先 electron@41 内置 Notification API；fallback osascript display notification
// Pos:    panda-on-desk P2-T2 native 子模块；macOS 分支
//         严守 anthropic byte-equal — 仅 electron / child_process，无 anthropic 通道
//
// [NEW-FILE:#20260419-P2-07]
// 2026-04-19 +08:00 agent-β-P2-system-notify-retry · P2-T2 系统通知 mac 分支

/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, global-require */

import type { NativeNotificationOptions } from './index.js'

/**
 * macOS Notification spawn 超时（保护进程不被 osascript 卡死）
 * 5s 远超正常通知触发时间；DND/通知中心被禁用时也能快速失败。
 */
export const MAC_OSASCRIPT_TIMEOUT_MS = 5_000

/**
 * 仅供测试与诊断使用的模式枚举 —
 *   - 'electron'：成功走 electron 内置 Notification API
 *   - 'osascript'：electron 不可用 → 回退 osascript display notification
 *   - 'failed'：两条路径均失败（已捕获，向上不抛）
 */
export type MacShowMode = 'electron' | 'osascript' | 'failed'

/**
 * 测试钩子 — 替换 spawn osascript 实现（避免单测真发系统通知）。
 * 默认走 child_process.spawn；测试可通过 __setOsascriptSpawnerForTesting 注入 mock。
 */
type OsascriptSpawner = (script: string, timeoutMs: number) => Promise<void>

let osascriptSpawner: OsascriptSpawner | null = null

export function __setOsascriptSpawnerForTesting(fn: OsascriptSpawner | null): void {
  osascriptSpawner = fn
}

/** 测试钩子 — 强制 electron 路径不可用（模拟非 electron 运行时） */
let forceDisableElectron = false
export function __setForceDisableElectronForTesting(v: boolean): void {
  forceDisableElectron = v
}

/**
 * 默认 osascript 实现 — child_process.spawn osascript -e <script>
 * 不抛错；失败 resolve（由上层 fallback 链处理）。
 */
async function defaultOsascriptSpawner(script: string, timeoutMs: number): Promise<void> {
  let spawn: (
    cmd: string,
    args: string[],
    opts?: { timeout?: number },
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
      proc = spawn('osascript', ['-e', script], { timeout: timeoutMs })
    } catch {
      finish()
      return
    }
    proc.on('error', finish)
    proc.on('exit', finish)
    proc.on('close', finish)
    // why: timeout 兜底 — 部分平台 spawn 不生效 timeout 选项时手动 kill
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
 * 转义 AppleScript 字符串字面量 —
 *   双引号 → \" ；反斜杠 → \\
 *   防止业务方 title/body 含引号导致 osascript 解析失败 / 注入。
 */
function escapeAppleScript(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

/**
 * macOS 系统通知主入口 —
 *   1) 优先 electron@41 内置 Notification API（依赖 darwin Notification Center）
 *   2) 失败 → osascript display notification
 *   3) 全失败 → 静默 resolve（不向上抛）
 *
 * @returns 实际生效的模式（用于测试断言；生产环境忽略返回值）
 */
export async function showMacNotification(
  opts: NativeNotificationOptions,
): Promise<MacShowMode> {
  // ── 路径 1：electron 内置 Notification ───────────────────────────────
  if (!forceDisableElectron) {
    try {
      const electron = require('electron') as {
        Notification?: new (cfg: {
          title: string
          body?: string
          silent?: boolean
        }) => { show: () => void; on?: (ev: string, cb: () => void) => void }
        app?: { isReady?: () => boolean }
      }
      // why: macOS 上 electron Notification 必须在 app ready 之后；
      //      未 ready 时 fallback osascript（避免 BrowserWindow 未启动场景崩）
      const ready = electron.app?.isReady?.() ?? false
      if (electron.Notification && ready) {
        const n = new electron.Notification({
          title: opts.title,
          body: opts.body ?? '',
          // why: 业务自带 soundCue 已由 dispatcher 走 playSound 通道，避免双声
          silent: !!opts.soundCue,
        })
        n.show()
        return 'electron'
      }
    } catch {
      // 落到 osascript fallback
    }
  }

  // ── 路径 2：osascript display notification ───────────────────────────
  const spawner = osascriptSpawner ?? defaultOsascriptSpawner
  const title = escapeAppleScript(opts.title)
  const body = escapeAppleScript(opts.body ?? '')
  const script = `display notification "${body}" with title "${title}"`
  try {
    await spawner(script, MAC_OSASCRIPT_TIMEOUT_MS)
    return 'osascript'
  } catch {
    return 'failed'
  }
}
