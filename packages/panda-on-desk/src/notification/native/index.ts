// Input:  NativeNotificationOptions（title / body / level / soundCue?）
// Output: showNativeNotification — 按 process.platform 动态分发到 mac/win/linux 子模块；不抛错
// Pos:    panda-on-desk P2-T2 native 通知统一入口；dispatcher.ts 唯一调用点
//         严守 anthropic byte-equal — 仅本地 IPC，无 anthropic 通道
//
// [NEW-FILE:#20260419-P2-10]
// 2026-04-19 +08:00 agent-β-P2-system-notify-retry · P2-T2 系统通知平台分发器

import type { NotificationLevel } from '../../bridge/types.js'

/**
 * native 通知统一入参 —
 *   subset of NotificationEvent，避免 dispatcher 把整个 event 透传给平台层（解耦）
 */
export interface NativeNotificationOptions {
  /** 通知标题 — mac/win/linux 通用 */
  title: string
  /** 通知正文（可空字符串；不传亦可） */
  body?: string
  /** 严重等级 — 影响 Linux urgency / mac/win 是否使用 silent */
  level: NotificationLevel
  /** 是否伴随 soundCue（dispatcher 已走 sound 通道，此处仅决定 native silent 标志） */
  soundCue?: 'short' | 'critical' | 'gentle'
}

/** 平台分发结果 — 用于联调诊断 / 测试断言；'unsupported' 表示当前进程不在 mac/win/linux 三平台 */
export type NativeShowResult =
  | { platform: 'darwin'; mode: 'electron' | 'osascript' | 'failed' }
  | { platform: 'win32'; mode: 'electron' | 'powershell' | 'failed' }
  | { platform: 'linux'; mode: 'electron' | 'notify-send' | 'failed' }
  | { platform: 'unsupported'; mode: 'noop' }

/**
 * 测试钩子 — 覆盖 process.platform（避免 setter 写只读属性）。
 * 设为 null 表示用真实 process.platform。
 */
let platformOverride: NodeJS.Platform | null = null

export function __setPlatformForTesting(p: NodeJS.Platform | null): void {
  platformOverride = p
}

/** 当前 platform — 测试可注入 */
function currentPlatform(): NodeJS.Platform {
  return platformOverride ?? process.platform
}

/**
 * native 通知主入口 — 按平台动态 import 子模块（lazy load），不抛错。
 *
 * 设计动机：
 *   · 动态 import 避免在不相关平台触发 ts 编译报错（mac.ts 内部仅 require 'electron'，
 *     非平台代码不会真正执行 spawn osascript / powershell）；
 *   · 失败统一 swallow —— dispatcher 端不应感知 native 通知失败，业务层依赖
 *     overlay/badge 通道兜底；
 *   · 返回 NativeShowResult 仅供测试 / 联调使用，生产代码可 await 不读结果。
 *
 * @returns NativeShowResult — 实际生效的平台与模式（生产可忽略）
 */
export async function showNativeNotification(
  opts: NativeNotificationOptions,
): Promise<NativeShowResult> {
  const platform = currentPlatform()
  try {
    switch (platform) {
      case 'darwin': {
        // why: 动态 import — 测试 / 非 mac 环境也不会因加载 mac.ts 触发副作用
        //      （mac.ts 内部 lazy require electron + child_process，无顶层副作用）
        const mod = await import('./mac.js')
        const mode = await mod.showMacNotification(opts)
        return { platform: 'darwin', mode }
      }
      case 'win32': {
        const mod = await import('./win.js')
        const mode = await mod.showWinNotification(opts)
        return { platform: 'win32', mode }
      }
      case 'linux': {
        const mod = await import('./linux.js')
        const mode = await mod.showLinuxNotification(opts)
        return { platform: 'linux', mode }
      }
      default:
        // freebsd/openbsd/sunos/aix/cygwin etc. — Phase 2 不支持，静默 noop
        return { platform: 'unsupported', mode: 'noop' }
    }
  } catch {
    // why: 动态 import 失败 / 子模块异常 — dispatcher 不应感知；
    //      业务层 overlay/badge 通道兜底
    if (platform === 'darwin') return { platform: 'darwin', mode: 'failed' }
    if (platform === 'win32') return { platform: 'win32', mode: 'failed' }
    if (platform === 'linux') return { platform: 'linux', mode: 'failed' }
    return { platform: 'unsupported', mode: 'noop' }
  }
}
