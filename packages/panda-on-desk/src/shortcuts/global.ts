// Input:  registerGlobalShortcuts() / unregisterAll()
// Output: 注册 Ctrl+Shift+Y (Allow) + Ctrl+Shift+N (Deny) 全局快捷键 → permission-bubble 回调
// Pos:    panda-on-desk 全局快捷键管理；P2-T3 实装
//         与 src/shortcuts.ts（fork 自 clawd shortcut-actions.js — 仅含元数据/解析）
//         分工：global.ts 负责 electron globalShortcut 实际注册 + 生命周期。
//
// Forked from clawd-on-desk@4b07658:src/main.js L420-440 + src/permission.js L283-298
// — 抽出 globalShortcut.register / unregister 段；冲突 fallback 改 console.warn。
//
// [NEW-FILE:#20260419-P2-13]
// 2026-04-19 +08:00 agent-γ-P2-overlay · P2-T3 实装

import { hotkeyAllowLatest, hotkeyDenyLatest } from '../overlay/permission-bubble.js'

// ─────────────────────────────────────────────────────────────────────────────
// electron globalShortcut 接口（可注入 — 测试不依赖真 electron）
// ─────────────────────────────────────────────────────────────────────────────

/** electron globalShortcut 最小子集 */
export interface GlobalShortcutLike {
  register: (accelerator: string, callback: () => void) => boolean
  unregister: (accelerator: string) => void
  unregisterAll: () => void
  isRegistered?: (accelerator: string) => boolean
}

let globalShortcutImpl: GlobalShortcutLike | null = null

/**
 * 注入 electron globalShortcut。
 * 生产路径：main.ts 启动时调 setGlobalShortcutImpl(globalShortcut)。
 * 测试路径：注入 mock；未注入时 register 直接静默成功（noop fallback）。
 */
export function setGlobalShortcutImpl(impl: GlobalShortcutLike | null): void {
  globalShortcutImpl = impl
}

// ─────────────────────────────────────────────────────────────────────────────
// 主方案 §7 决策 #9 — 锁定快捷键（不走用户配置覆写，避免与 togglePet 三键冲突）
// ─────────────────────────────────────────────────────────────────────────────

const ALLOW_ACCELERATOR = 'Control+Shift+Y' as const
const DENY_ACCELERATOR = 'Control+Shift+N' as const

interface RegisteredEntry {
  accelerator: string
  ok: boolean
}

const registered: RegisteredEntry[] = []

function tryRegister(impl: GlobalShortcutLike, accel: string, handler: () => void): boolean {
  let ok = false
  try {
    ok = !!impl.register(accel, handler)
  } catch (err) {
    // why: 冲突 / 平台未支持时 fallback 到 console.warn 而不抛 — 不阻止 panda-on-desk 启动
    // eslint-disable-next-line no-console
    console.warn(
      `[panda-on-desk:shortcuts] globalShortcut.register threw for ${accel}: ${
        (err as Error).message
      }`,
    )
    return false
  }
  if (!ok) {
    // eslint-disable-next-line no-console
    console.warn(
      `[panda-on-desk:shortcuts] globalShortcut.register returned false for ${accel} (system conflict?)`,
    )
  }
  return ok
}

/**
 * 注册 P2-T3 锁定的两个快捷键。
 * 多次调用安全 — 重入时先 unregisterAll 再注册。
 */
export function registerGlobalShortcuts(): void {
  if (!globalShortcutImpl) {
    // 测试 / 未启动 main 时静默；不视为错误
    return
  }
  // 重入：先卸载旧的
  if (registered.length > 0) {
    unregisterAll()
  }
  const okAllow = tryRegister(globalShortcutImpl, ALLOW_ACCELERATOR, () => {
    hotkeyAllowLatest()
  })
  registered.push({ accelerator: ALLOW_ACCELERATOR, ok: okAllow })

  const okDeny = tryRegister(globalShortcutImpl, DENY_ACCELERATOR, () => {
    hotkeyDenyLatest()
  })
  registered.push({ accelerator: DENY_ACCELERATOR, ok: okDeny })
}

/**
 * 卸载所有由本模块注册的快捷键。
 * panda-on-desk 退出时（app.before-quit）必须调；与 main.ts 已有的
 * globalShortcut.unregisterAll() 互不冲突 — unregisterAll 幂等。
 */
export function unregisterAll(): void {
  if (!globalShortcutImpl) {
    registered.length = 0
    return
  }
  for (const entry of registered) {
    if (!entry.ok) continue
    try {
      globalShortcutImpl.unregister(entry.accelerator)
    } catch {
      // ignore — 卸载失败不阻止 panda-on-desk 退出
    }
  }
  registered.length = 0
}

// ─────────────────────────────────────────────────────────────────────────────
// 测试辅助
// ─────────────────────────────────────────────────────────────────────────────

export function __getRegisteredShortcutsForTesting(): ReadonlyArray<Readonly<RegisteredEntry>> {
  return registered.map(e => ({ ...e }))
}

export function __resetGlobalShortcutsForTesting(): void {
  registered.length = 0
  globalShortcutImpl = null
}

/** 测试辅助 — 直接拿 accelerator 常量做断言 */
export const __ACCELERATORS_FOR_TESTING = {
  allow: ALLOW_ACCELERATOR,
  deny: DENY_ACCELERATOR,
} as const
