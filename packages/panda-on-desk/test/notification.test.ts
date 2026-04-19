// Input:  bun test 触发
// Output: ≥ 6 用例 — 验证 P2-T2 system 通知 native 分发 + 平台 stub fallback + dispatcher 接入
// Pos:    Phase 2 P2-T2 系统通知（mac/win/linux native）验证 [NEW-FILE:#20260419-P2-11]
//         严守 byte-equal — 不引用 src/services/api/{claude,oauth,providers}

import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

import {
  __setForceDisableElectronForTesting as macForceDisable,
  __setOsascriptSpawnerForTesting,
  showMacNotification,
} from '../src/notification/native/mac.js'
import {
  __buildWinToastScriptForTesting,
  __setForceDisableElectronForTesting as winForceDisable,
  __setPowerShellSpawnerForTesting,
  showWinNotification,
  WIN_APP_USER_MODEL_ID,
} from '../src/notification/native/win.js'
import {
  __mapLevelToUrgencyForTesting,
  __setForceDisableElectronForTesting as linuxForceDisable,
  __setNotifySendSpawnerForTesting,
  showLinuxNotification,
} from '../src/notification/native/linux.js'
import {
  __setPlatformForTesting,
  showNativeNotification,
} from '../src/notification/native/index.js'
import { dispatchNotification } from '../src/notification/dispatcher.js'
import { __resetDndStateForTesting } from '../src/dnd/state.js'

// ─────────────────────────────────────────────────────────────────────────────
// 测试隔离 — 每个用例前后清空 spawner mock + 平台覆盖 + DND 状态
// ─────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  __setOsascriptSpawnerForTesting(null)
  __setPowerShellSpawnerForTesting(null)
  __setNotifySendSpawnerForTesting(null)
  macForceDisable(true)
  winForceDisable(true)
  linuxForceDisable(true)
  __setPlatformForTesting(null)
  __resetDndStateForTesting()
})

afterEach(() => {
  __setOsascriptSpawnerForTesting(null)
  __setPowerShellSpawnerForTesting(null)
  __setNotifySendSpawnerForTesting(null)
  macForceDisable(false)
  winForceDisable(false)
  linuxForceDisable(false)
  __setPlatformForTesting(null)
  __resetDndStateForTesting()
})

// ─────────────────────────────────────────────────────────────────────────────
// Group A：mac.ts — electron 不可用 → osascript fallback；脚本含 title/body
// ─────────────────────────────────────────────────────────────────────────────

describe('mac.ts — osascript fallback', () => {
  test('electron 不可用 → spawn osascript；返回 mode=osascript', async () => {
    const calls: Array<{ script: string; timeoutMs: number }> = []
    __setOsascriptSpawnerForTesting(async (script, timeoutMs) => {
      calls.push({ script, timeoutMs })
    })

    const mode = await showMacNotification({
      title: 'CI failed',
      body: 'build #42 broken',
      level: 'error',
    })

    expect(mode).toBe('osascript')
    expect(calls.length).toBe(1)
    expect(calls[0].script).toContain('display notification')
    expect(calls[0].script).toContain('CI failed')
    expect(calls[0].script).toContain('build #42 broken')
  })

  test('osascript 抛错 → mode=failed（不向上传播）', async () => {
    __setOsascriptSpawnerForTesting(async () => {
      throw new Error('osascript not found')
    })
    const mode = await showMacNotification({
      title: 't',
      body: 'b',
      level: 'info',
    })
    expect(mode).toBe('failed')
  })

  test('AppleScript 字符串注入防护 — 双引号 / 反斜杠转义', async () => {
    let captured = ''
    __setOsascriptSpawnerForTesting(async script => {
      captured = script
    })
    await showMacNotification({
      title: 'has "quote"',
      body: 'back\\slash',
      level: 'info',
    })
    expect(captured).toContain('\\"quote\\"')
    expect(captured).toContain('back\\\\slash')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group B：win.ts — electron 不可用 → PowerShell BurntToast / WinRT fallback
// ─────────────────────────────────────────────────────────────────────────────

describe('win.ts — PowerShell fallback', () => {
  test('electron 不可用 → spawn powershell；脚本含 BurntToast + WinRT 回退', async () => {
    const calls: Array<{ script: string; timeoutMs: number }> = []
    __setPowerShellSpawnerForTesting(async (script, timeoutMs) => {
      calls.push({ script, timeoutMs })
    })

    const mode = await showWinNotification({
      title: 'Disk Low',
      body: 'C: drive < 5GB',
      level: 'warning',
    })

    expect(mode).toBe('powershell')
    expect(calls.length).toBe(1)
    expect(calls[0].script).toContain('BurntToast')
    expect(calls[0].script).toContain('Windows.UI.Notifications')
    expect(calls[0].script).toContain('Disk Low')
  })

  test('PowerShell 单引号转义 — 防 PS 字符串破裂', () => {
    const script = __buildWinToastScriptForTesting("It's broken", "Don't panic")
    // 单引号必须被替换为 ''（双单引号）
    expect(script).toContain("It''s broken")
    expect(script).toContain("Don''t panic")
  })

  test('AppUserModelId 常量稳定 — 避免 Action Center owner 错位', () => {
    expect(WIN_APP_USER_MODEL_ID).toBe('com.lc2panda.panda-on-desk')
    const script = __buildWinToastScriptForTesting('a', 'b')
    expect(script).toContain('com.lc2panda.panda-on-desk')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group C：linux.ts — electron 不可用 → notify-send fallback；urgency 映射正确
// ─────────────────────────────────────────────────────────────────────────────

describe('linux.ts — notify-send fallback', () => {
  test('electron 不可用 → spawn notify-send；urgency=critical for error', async () => {
    const calls: Array<{ title: string; body: string; urgency: string }> = []
    __setNotifySendSpawnerForTesting(async args => {
      calls.push(args)
    })

    const mode = await showLinuxNotification({
      title: 'CI failed',
      body: 'pipeline broken',
      level: 'error',
    })

    expect(mode).toBe('notify-send')
    expect(calls.length).toBe(1)
    expect(calls[0]).toEqual({
      title: 'CI failed',
      body: 'pipeline broken',
      urgency: 'critical',
    })
  })

  test('urgency 级别映射 — error→critical / warning→normal / info→low', () => {
    expect(__mapLevelToUrgencyForTesting('error')).toBe('critical')
    expect(__mapLevelToUrgencyForTesting('warning')).toBe('normal')
    expect(__mapLevelToUrgencyForTesting('info')).toBe('low')
    expect(__mapLevelToUrgencyForTesting('success')).toBe('low')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group D：index.ts — 平台分发；unsupported / 各平台路由正确
// ─────────────────────────────────────────────────────────────────────────────

describe('native/index.ts — platform dispatch', () => {
  test('process.platform=darwin → 路由到 mac.ts', async () => {
    __setPlatformForTesting('darwin')
    __setOsascriptSpawnerForTesting(async () => {
      // 静默成功
    })
    const result = await showNativeNotification({
      title: 't',
      body: 'b',
      level: 'info',
    })
    expect(result.platform).toBe('darwin')
    expect(result.mode).toBe('osascript')
  })

  test('process.platform=win32 → 路由到 win.ts', async () => {
    __setPlatformForTesting('win32')
    __setPowerShellSpawnerForTesting(async () => {
      // 静默成功
    })
    const result = await showNativeNotification({
      title: 't',
      body: 'b',
      level: 'warning',
    })
    expect(result.platform).toBe('win32')
    expect(result.mode).toBe('powershell')
  })

  test('process.platform=linux → 路由到 linux.ts', async () => {
    __setPlatformForTesting('linux')
    __setNotifySendSpawnerForTesting(async () => {
      // 静默成功
    })
    const result = await showNativeNotification({
      title: 't',
      body: 'b',
      level: 'error',
    })
    expect(result.platform).toBe('linux')
    expect(result.mode).toBe('notify-send')
  })

  test('process.platform=freebsd → unsupported / noop（不抛错）', async () => {
    __setPlatformForTesting('freebsd' as NodeJS.Platform)
    const result = await showNativeNotification({
      title: 't',
      body: 'b',
      level: 'info',
    })
    expect(result.platform).toBe('unsupported')
    expect(result.mode).toBe('noop')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group E：dispatcher 接入 — kind='system' 触发 native；不抛错
// ─────────────────────────────────────────────────────────────────────────────

describe('dispatcher — kind=system 接入 native', () => {
  test('kind=system → 异步触发 showNativeNotification；dispatchNotification 同步不抛', async () => {
    // 用当前运行平台做端到端验证；spawner mock 全注入避免真发系统通知
    __setOsascriptSpawnerForTesting(async () => {})
    __setPowerShellSpawnerForTesting(async () => {})
    __setNotifySendSpawnerForTesting(async () => {})

    expect(() =>
      dispatchNotification({
        type: 'notification',
        kind: 'system',
        level: 'warning',
        scenarioId: 'disk-low',
        title: 'Disk Low',
        body: '5GB remaining',
        ts: Date.now(),
      }),
    ).not.toThrow()

    // 让 microtask + Promise 链执行完
    await new Promise(resolve => setTimeout(resolve, 50))
  })

  test('未知平台 + kind=system → dispatcher 不崩（不支持平台静默 noop）', async () => {
    __setPlatformForTesting('aix' as NodeJS.Platform)
    expect(() =>
      dispatchNotification({
        type: 'notification',
        kind: 'system',
        level: 'info',
        scenarioId: 'morning-brief',
        title: 'Hello',
        ts: Date.now(),
      }),
    ).not.toThrow()
    await new Promise(resolve => setTimeout(resolve, 20))
  })
})
