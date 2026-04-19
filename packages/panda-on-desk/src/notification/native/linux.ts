// Input:  NativeNotificationOptions（title / body / level / soundCue?）
// Output: Linux native 通知 — 优先 electron@41 内置 Notification API（依赖 libnotify）；fallback notify-send
// Pos:    panda-on-desk P2-T2 native 子模块；Linux 分支
//         严守 anthropic byte-equal — 仅 electron / child_process，无 anthropic 通道
//
// [NEW-FILE:#20260419-P2-09]
// 2026-04-19 +08:00 agent-β-P2-system-notify-retry · P2-T2 系统通知 linux 分支

/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, global-require */

import type { NativeNotificationOptions } from './index.js'

/** notify-send spawn 超时（5s 远超 GNOME/KDE 弹通知正常时延） */
export const LINUX_NOTIFYSEND_TIMEOUT_MS = 5_000

/**
 * 仅供测试与诊断使用的模式枚举 —
 *   - 'electron'：成功走 electron 内置 Notification API
 *   - 'notify-send'：electron 不可用 → 回退 notify-send
 *   - 'failed'：两条路径均失败（已捕获，向上不抛）
 */
export type LinuxShowMode = 'electron' | 'notify-send' | 'failed'

/**
 * 测试钩子 — 替换 spawn notify-send 实现。
 */
type NotifySendSpawner = (
  args: { title: string; body: string; urgency: string },
  timeoutMs: number,
) => Promise<void>

let notifySendSpawner: NotifySendSpawner | null = null

export function __setNotifySendSpawnerForTesting(fn: NotifySendSpawner | null): void {
  notifySendSpawner = fn
}

/** 测试钩子 — 强制 electron 路径不可用（模拟非 electron 运行时 / 缺 libnotify） */
let forceDisableElectron = false
export function __setForceDisableElectronForTesting(v: boolean): void {
  forceDisableElectron = v
}

/**
 * 默认 notify-send 实现 — child_process.spawn notify-send <args>
 * 不抛错；失败 resolve。
 *
 * notify-send 参数走数组形式（不拼字符串）— 完全规避 shell 注入风险。
 */
async function defaultNotifySendSpawner(
  args: { title: string; body: string; urgency: string },
  timeoutMs: number,
): Promise<void> {
  let spawn: (
    cmd: string,
    cliArgs: string[],
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
      // why: 数组传参 — 完全规避 shell 解析；body 可空 ''（notify-send 接受）
      proc = spawn(
        'notify-send',
        ['--urgency', args.urgency, '--app-name', 'panda-on-desk', args.title, args.body],
        { timeout: timeoutMs },
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
 * NotificationLevel → notify-send urgency 映射
 *   error → critical（持久不消失，红色）
 *   warning → normal
 *   info / success → low
 */
function mapLevelToUrgency(level: NativeNotificationOptions['level']): string {
  switch (level) {
    case 'error':
      return 'critical'
    case 'warning':
      return 'normal'
    case 'info':
    case 'success':
    default:
      return 'low'
  }
}

/**
 * Linux 系统通知主入口 —
 *   1) 优先 electron@41 内置 Notification API（依赖 libnotify-bin）
 *   2) 失败 → notify-send
 *   3) 全失败 → 静默 resolve
 */
export async function showLinuxNotification(
  opts: NativeNotificationOptions,
): Promise<LinuxShowMode> {
  // ── 路径 1：electron 内置 Notification ───────────────────────────────
  if (!forceDisableElectron) {
    try {
      const electron = require('electron') as {
        Notification?: new (cfg: {
          title: string
          body?: string
          silent?: boolean
          urgency?: 'normal' | 'critical' | 'low'
        }) => { show: () => void; on?: (ev: string, cb: () => void) => void }
        app?: { isReady?: () => boolean }
      }
      const ready = electron.app?.isReady?.() ?? false
      if (electron.Notification && ready) {
        const n = new electron.Notification({
          title: opts.title,
          body: opts.body ?? '',
          silent: !!opts.soundCue,
          // why: electron Linux Notification 直接接 urgency 字段，
          //      与 notify-send 行为对齐（critical 持久弹）
          urgency:
            opts.level === 'error'
              ? 'critical'
              : opts.level === 'warning'
                ? 'normal'
                : 'low',
        })
        n.show()
        return 'electron'
      }
    } catch {
      // 落到 notify-send fallback
    }
  }

  // ── 路径 2：notify-send ──────────────────────────────────────────────
  const spawner = notifySendSpawner ?? defaultNotifySendSpawner
  try {
    await spawner(
      {
        title: opts.title,
        body: opts.body ?? '',
        urgency: mapLevelToUrgency(opts.level),
      },
      LINUX_NOTIFYSEND_TIMEOUT_MS,
    )
    return 'notify-send'
  } catch {
    return 'failed'
  }
}

// 仅供测试 — 暴露映射函数便于断言
export function __mapLevelToUrgencyForTesting(
  level: NativeNotificationOptions['level'],
): string {
  return mapLevelToUrgency(level)
}
