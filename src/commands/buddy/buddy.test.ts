// Input:  /buddy 子命令调用（5 旧 + 4 新）+ mocked globalConfig + onDone/context
// Output: 9 + 守护用例 — 旧 5 子命令 byte-equal 文案 + 新 4 子命令落盘 globalConfig
// Pos:    panda 形象宠物 D4 P5-T1 — /buddy 命令扩展集成测试
//
// 一旦本测试或 src/commands/buddy/index.ts 被修改，请同步更新 src/commands/buddy/README.md。
//
// 设计目标（D4 DoD）：
//   - 旧 5 子命令文案 byte-equal：'Companion muted...' 'Companion unmuted...' 'Companion hidden.'
//     'Companion visible!' 'Your companion:'
//   - 新 4 子命令均 display: 'system'：state / wake / sleep / theme
//   - state/wake/sleep 写 companionForcedState + companionForcedStateExpiresAt
//   - theme 写 companionForcedSpecies；非法物种走 fallback 提示

import { describe, expect, test, mock, beforeEach, afterEach } from 'bun:test'

// ─── 共享：mocked globalConfig 工厂 + 命令 driver ─────────────────────────────

type ConfigShape = Record<string, unknown>

let configState: ConfigShape = {}
let savedDisplay: string | undefined
let savedResult: string | undefined
let savedShouldQuery: boolean | undefined
const appState: ConfigShape = { companionVisible: false }
const events: Array<{ name: string; data: unknown }> = []

function resetState() {
  configState = {}
  savedDisplay = undefined
  savedResult = undefined
  savedShouldQuery = undefined
  appState.companionVisible = false
  events.length = 0
}

beforeEach(() => {
  resetState()
  // why: 命令体 await import('../../utils/config.js') — 必须 mock.module 注入
  mock.module('../../utils/config.js', () => ({
    getGlobalConfig: () => configState,
    saveGlobalConfig: (
      updater: (prev: ConfigShape) => ConfigShape,
    ) => {
      configState = updater(configState)
    },
  }))
  mock.module('../../services/analytics/index.js', () => ({
    logEvent: (name: string, data: unknown) => {
      events.push({ name, data })
    },
  }))
  mock.module('../../buddy/companion.js', () => ({
    roll: (_userId: string) => ({
      bones: { species: 'panda', rarity: 'common', stats: {}, eye: '·', hat: 'none', shiny: false },
      inspirationSeed: 1,
    }),
    companionUserId: () => 'test-user',
  }))
})

afterEach(() => {
  mock.restore()
})

async function runBuddy(args: string): Promise<{
  result: string | undefined
  display: string | undefined
}> {
  // why 每次 import 加 query 旁路：bun test 模块缓存绕开（同 openai-oauth.test.ts 模式）
  const mod = await import(`./index.js?case=${Date.now()}-${Math.random()}`)
  const cmd = mod.default
  const onDone = (
    result?: string,
    options?: { display?: string; shouldQuery?: boolean },
  ) => {
    savedResult = result
    savedDisplay = options?.display
    savedShouldQuery = options?.shouldQuery
  }
  const context = {
    setAppState: (updater: (prev: ConfigShape) => ConfigShape) => {
      Object.assign(appState, updater(appState))
    },
    getAppState: () => appState,
  } as never
  const loaded = await cmd.load()
  await loaded.call(onDone, context, args)
  return { result: savedResult, display: savedDisplay }
}

// ─── argumentHint 守护 ───────────────────────────────────────────────────────

describe('argumentHint 同步 12 子命令（D4 9 + Phase 0 P0-T5 +2 + W16-T2 +1）', () => {
  test('argumentHint 含全部 12 子命令', async () => {
    const mod = await import('./index.js?hint=1')
    const cmd = mod.default
    // why D4 9 + Phase 0 P0-T5 + W16-T2：旧 9 byte-equal 在前；stats / milestones / desk 追加在末尾
    expect(cmd.argumentHint).toBe(
      '[show|hide|mute|unmute|info|state|wake|sleep|theme|stats|milestones|desk]',
    )
  })
})

// ─── 旧 5 子命令 byte-equal 文案守护 ─────────────────────────────────────────

describe('旧 5 子命令文案 byte-equal（D4 守护）', () => {
  test('mute → "Companion muted. They will still be visible but stay quiet."', async () => {
    const { result, display } = await runBuddy('mute')
    expect(result).toBe(
      'Companion muted. They will still be visible but stay quiet.',
    )
    expect(display).toBe('system')
    expect(configState.companionMuted).toBe(true)
  })

  test('unmute → "Companion unmuted."', async () => {
    const { result, display } = await runBuddy('unmute')
    expect(result).toBe('Companion unmuted.')
    expect(display).toBe('system')
    expect(configState.companionMuted).toBe(false)
  })

  test('hide → "Companion hidden." + setAppState companionVisible=false', async () => {
    appState.companionVisible = true
    const { result, display } = await runBuddy('hide')
    expect(result).toBe('Companion hidden.')
    expect(display).toBe('system')
    expect(appState.companionVisible).toBe(false)
  })

  test('show → "Companion visible!" + setAppState companionVisible=true', async () => {
    const { result, display } = await runBuddy('show')
    expect(result).toBe('Companion visible!')
    expect(display).toBe('system')
    expect(appState.companionVisible).toBe(true)
  })

  test('info → "Your companion:" 前缀 + species/name 行', async () => {
    configState.companion = {
      name: 'Bamboo',
      species: 'panda',
      rarity: 'rare',
      hatchedAt: 1,
    }
    const { result, display } = await runBuddy('info')
    expect(result).toMatch(/^Your companion:\n {2}Species: panda/)
    expect(result).toContain('Name: Bamboo')
    expect(result).toContain('Rarity: rare')
    expect(display).toBe('system')
  })
})

// ─── 新 4 子命令（D4 P5-T1） ────────────────────────────────────────────────

describe('/buddy state <name>（P5-T1 新增）', () => {
  test('state working → 写 companionForcedState=working + expiresAt 5s 后', async () => {
    const t0 = Date.now()
    const { result, display } = await runBuddy('state working')
    expect(display).toBe('system')
    expect(result).toBe('Companion state forced to working for 5s.')
    expect(configState.companionForcedState).toBe('working')
    expect(typeof configState.companionForcedStateExpiresAt).toBe('number')
    const expiresAt = configState.companionForcedStateExpiresAt as number
    expect(expiresAt).toBeGreaterThanOrEqual(t0 + 4_999)
    expect(expiresAt).toBeLessThanOrEqual(t0 + 5_500)
  })

  test('state <unknown> → 错误提示（不写 globalConfig）', async () => {
    const { result, display } = await runBuddy('state nonsense')
    expect(display).toBe('system')
    expect(result).toContain('Unknown state: nonsense')
    expect(configState.companionForcedState).toBeUndefined()
  })

  test('state（无参数）→ Usage 提示', async () => {
    const { result, display } = await runBuddy('state')
    expect(display).toBe('system')
    expect(result).toContain('Usage: /buddy state <')
    expect(configState.companionForcedState).toBeUndefined()
  })

  test('state attention（one-shot 类）→ 也支持', async () => {
    await runBuddy('state attention')
    expect(configState.companionForcedState).toBe('attention')
  })
})

describe('/buddy wake（P5-T1 新增）', () => {
  test('wake → forced=idle + 1s TTL', async () => {
    const t0 = Date.now()
    const { result, display } = await runBuddy('wake')
    expect(display).toBe('system')
    expect(result).toBe('Companion is awake.')
    expect(configState.companionForcedState).toBe('idle')
    const expiresAt = configState.companionForcedStateExpiresAt as number
    expect(expiresAt).toBeGreaterThanOrEqual(t0 + 999)
    expect(expiresAt).toBeLessThanOrEqual(t0 + 1_500)
  })
})

describe('/buddy sleep（P5-T1 新增）', () => {
  test('sleep → forced=sleeping + 60s TTL', async () => {
    const t0 = Date.now()
    const { result, display } = await runBuddy('sleep')
    expect(display).toBe('system')
    expect(result).toBe('Companion is sleeping.')
    expect(configState.companionForcedState).toBe('sleeping')
    const expiresAt = configState.companionForcedStateExpiresAt as number
    expect(expiresAt).toBeGreaterThanOrEqual(t0 + 59_999)
    expect(expiresAt).toBeLessThanOrEqual(t0 + 60_500)
  })
})

// v2.21.30 方向 A：theme 接 18 物种全集 + 旧 panda 系 alias 向后兼容
describe('/buddy theme — 18 物种全集 + alias（v2.21.30 方向 A）', () => {
  // 18 物种白名单 — 各物种均可被切换
  test('theme duck → 写 companionForcedSpecies=duck', async () => {
    const { result, display } = await runBuddy('theme duck')
    expect(display).toBe('system')
    expect(result).toBe('Companion theme set to duck.')
    expect(configState.companionForcedSpecies).toBe('duck')
  })

  test('theme robot → 写 companionForcedSpecies=robot', async () => {
    const { result } = await runBuddy('theme robot')
    expect(result).toBe('Companion theme set to robot.')
    expect(configState.companionForcedSpecies).toBe('robot')
  })

  test('theme owl → 写 companionForcedSpecies=owl', async () => {
    const { result } = await runBuddy('theme owl')
    expect(result).toBe('Companion theme set to owl.')
    expect(configState.companionForcedSpecies).toBe('owl')
  })

  test('theme chonk → 写 companionForcedSpecies=chonk', async () => {
    const { result } = await runBuddy('theme chonk')
    expect(result).toBe('Companion theme set to chonk.')
    expect(configState.companionForcedSpecies).toBe('chonk')
  })

  test('theme DUCK（大小写不敏感）→ 仍匹配 duck', async () => {
    const { result } = await runBuddy('theme DUCK')
    expect(result).toBe('Companion theme set to duck.')
    expect(configState.companionForcedSpecies).toBe('duck')
  })

  // 旧 panda 系 alias 向后兼容
  test('theme panda（alias）→ 切到 chonk 替代物种', async () => {
    const { result, display } = await runBuddy('theme panda')
    expect(display).toBe('system')
    expect(result).toContain('panda 系物种已退役')
    expect(result).toContain('chonk')
    expect(configState.companionForcedSpecies).toBe('chonk')
  })

  test('theme redPanda（alias）→ 切到 cat 替代物种', async () => {
    const { result, display } = await runBuddy('theme redPanda')
    expect(display).toBe('system')
    expect(result).toContain('redPanda 系物种已退役')
    expect(result).toContain('cat')
    expect(configState.companionForcedSpecies).toBe('cat')
  })

  test('theme kungFuPanda（alias）→ 切到 robot 替代物种', async () => {
    const { result, display } = await runBuddy('theme kungFuPanda')
    expect(display).toBe('system')
    expect(result).toContain('kungFuPanda 系物种已退役')
    expect(result).toContain('robot')
    expect(configState.companionForcedSpecies).toBe('robot')
  })

  test('theme PANDA（alias 大小写不敏感）→ 切到 chonk', async () => {
    const { result } = await runBuddy('theme PANDA')
    expect(result).toContain('chonk')
    expect(configState.companionForcedSpecies).toBe('chonk')
  })

  // 错误路径
  test('theme nonsense（非 18 物种 + 非 alias）→ 错误提示，不写 forced', async () => {
    const { result, display } = await runBuddy('theme nonsense')
    expect(display).toBe('system')
    expect(result).toContain('Unknown species: nonsense')
    expect(result).toContain('Current forced')
    expect(configState.companionForcedSpecies).toBeUndefined()
  })

  test('theme（无参数）→ Usage 提示含 18 物种', async () => {
    const { result, display } = await runBuddy('theme')
    expect(display).toBe('system')
    expect(result).toContain('Usage: /buddy theme <')
    expect(result).toContain('duck')
    expect(result).toContain('robot')
    expect(configState.companionForcedSpecies).toBeUndefined()
  })
})

// ─── W16-T2：/buddy desk 5 子命令 ────────────────────────────────────────────

describe('/buddy desk（W16-T2 新增）', () => {
  // ─── 共享 mock：runtime + health + sendDeskQuit + launcher ───────────────
  type BridgeMock = {
    runtime: { version: number; port: number; secret: string; pid: number; startedAt: number; appVersion?: string } | null
    health: {
      app: string
      version: number
      pid: number
      uptimeMs: number
      appVersion?: string
      electronVersion?: string
      eventsProcessed?: number
      notifications?: number
      errors?: number
      startedAt?: number
    } | null
    quitResult: boolean
  }
  const bridgeState: BridgeMock = {
    runtime: null,
    health: null,
    quitResult: true,
  }
  const launcherCalls: string[] = []

  beforeEach(() => {
    bridgeState.runtime = null
    bridgeState.health = null
    bridgeState.quitResult = true
    launcherCalls.length = 0
    // why 连同前面 beforeEach 再叠 3 mock — resetState 不重置已 mock.module，
    //   但 afterEach mock.restore 会清；本 describe 内先注入。
    mock.module('../../desk/bridge.js', () => ({
      getRuntimeSnapshot: () => bridgeState.runtime,
      fetchDetailedHealth: async () => bridgeState.health,
      sendDeskQuit: async () => bridgeState.quitResult,
    }))
    mock.module('../../desk/launcher.js', () => ({
      __resetSpawnedFlagForTesting: () => {
        launcherCalls.push('reset')
      },
      maybeSpawnOnDesk: (_opts: unknown) => {
        launcherCalls.push('spawn')
      },
    }))
    mock.module('../../utils/envUtils.js', () => ({
      getClaudeConfigHomeDir: () => '/tmp/pandacc-test-W16-T2',
    }))
  })

  test('/buddy desk（默认 status）— 未运行 → Not Running 文案', async () => {
    bridgeState.runtime = null
    const { result, display } = await runBuddy('desk')
    expect(display).toBe('system')
    expect(result).toContain('Not Running')
    expect(result).toContain('panda --install-desk')
  })

  test('/buddy desk status — 运行中 → 完整字段', async () => {
    bridgeState.runtime = {
      version: 1,
      port: 1456,
      secret: 'testsecret',
      pid: 12345,
      startedAt: Date.now() - 754_000, // ~12m34s
    }
    bridgeState.health = {
      app: 'panda-on-desk',
      version: 1,
      pid: 12345,
      uptimeMs: 754_000,
      appVersion: '0.1.0-alpha',
      electronVersion: '41.2.1',
      eventsProcessed: 42,
      notifications: 3,
      errors: 0,
      startedAt: Date.now() - 754_000,
    }
    const { result, display } = await runBuddy('desk status')
    expect(display).toBe('system')
    expect(result).toContain('Running (PID 12345)')
    expect(result).toContain('Port:       1456')
    expect(result).toContain('Uptime:     12m 34s')
    expect(result).toContain('Version:    0.1.0-alpha')
    expect(result).toContain('Electron:   41.2.1')
    expect(result).toContain('Events processed: 42')
    expect(result).toContain('Notifications:    3')
    expect(result).toContain('Errors:           0')
  })

  test('/buddy desk status — runtime.json 存在但 /health 不通 → Stale 提示', async () => {
    bridgeState.runtime = {
      version: 1,
      port: 1457,
      secret: 'x',
      pid: 999,
      startedAt: 0,
    }
    bridgeState.health = null // /health 返回 null（进程可能 stale）
    const { result, display } = await runBuddy('desk')
    expect(display).toBe('system')
    expect(result).toContain('Stale')
    expect(result).toContain('PID 999')
    expect(result).toContain('restart')
  })

  test('/buddy desk start — 未运行 → spawn + 成功文案', async () => {
    bridgeState.runtime = null
    const { result, display } = await runBuddy('desk start')
    expect(display).toBe('system')
    expect(result).toContain('已启动')
    expect(launcherCalls).toContain('reset')
    expect(launcherCalls).toContain('spawn')
  })

  test('/buddy desk start — 已运行 → 跳过 spawn', async () => {
    bridgeState.runtime = {
      version: 1,
      port: 1455,
      secret: 'x',
      pid: 88,
      startedAt: 0,
    }
    bridgeState.health = {
      app: 'panda-on-desk',
      version: 1,
      pid: 88,
      uptimeMs: 5_000,
    }
    const { result } = await runBuddy('desk start')
    expect(result).toContain('已在运行')
    expect(launcherCalls).not.toContain('spawn')
  })

  test('/buddy desk stop — 运行中 → sendDeskQuit 成功', async () => {
    bridgeState.runtime = {
      version: 1,
      port: 1455,
      secret: 'x',
      pid: 77,
      startedAt: 0,
    }
    bridgeState.quitResult = true
    const { result, display } = await runBuddy('desk stop')
    expect(display).toBe('system')
    expect(result).toContain('已停止')
    expect(result).toContain('PID 77')
  })

  test('/buddy desk stop — 未运行 → 提示', async () => {
    bridgeState.runtime = null
    const { result } = await runBuddy('desk stop')
    expect(result).toBe('panda-on-desk 未在运行.')
  })

  test('/buddy desk restart — 调 sendDeskQuit + spawn', async () => {
    bridgeState.runtime = {
      version: 1,
      port: 1455,
      secret: 'x',
      pid: 66,
      startedAt: 0,
    }
    bridgeState.quitResult = true
    const { result, display } = await runBuddy('desk restart')
    expect(display).toBe('system')
    expect(result).toContain('重启请求已发出')
    expect(launcherCalls).toContain('spawn')
  }, 3_000)

  test('/buddy desk logs — 日志文件不存在 → 提示路径', async () => {
    const { result, display } = await runBuddy('desk logs')
    expect(display).toBe('system')
    expect(result).toContain('日志不存在')
    expect(result).toContain('panda-on-desk.log')
  })

  test('/buddy desk <unknown> → Usage 提示', async () => {
    const { result, display } = await runBuddy('desk nonsense')
    expect(display).toBe('system')
    expect(result).toContain('Usage: /buddy desk')
    expect(result).toContain('status')
    expect(result).toContain('start')
    expect(result).toContain('stop')
    expect(result).toContain('restart')
    expect(result).toContain('logs')
  })
})

// ─── W16-T2：formatUptime 纯函数守护 ─────────────────────────────────────────

describe('formatUptime（W16-T2 纯函数）', () => {
  test('0ms → "0s"', async () => {
    const mod = await import('./index.js?fmt=1')
    expect(mod.formatUptime(0)).toBe('0s')
    expect(mod.formatUptime(-1)).toBe('0s')
    expect(mod.formatUptime(Number.NaN)).toBe('0s')
  })
  test('< 60s → 只显示秒', async () => {
    const mod = await import('./index.js?fmt=2')
    expect(mod.formatUptime(34_000)).toBe('34s')
    expect(mod.formatUptime(59_999)).toBe('59s')
  })
  test('< 1h → "Xm YYs"', async () => {
    const mod = await import('./index.js?fmt=3')
    expect(mod.formatUptime(754_000)).toBe('12m 34s')
    expect(mod.formatUptime(60_000)).toBe('1m 00s')
  })
  test('≥ 1h → "Xh YYm ZZs"', async () => {
    const mod = await import('./index.js?fmt=4')
    expect(mod.formatUptime(2 * 3_600_000 + 14 * 60_000 + 6_000)).toBe(
      '2h 14m 06s',
    )
  })
})

// 守护测试结尾用 noop 引用避免 TS 报未用变量
void savedShouldQuery
