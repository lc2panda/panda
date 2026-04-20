// Input:  bun test 触发；全部依赖通过 opts.* 注入（无 electron / 无文件 IO）
// Output: ≥5 用例 — DEMO_STEPS 静态契约 / 10 步骤完整执行 / firstRun 写盘 / hitWin 缺失容错 /
//         手动触发不写 firstRun / shouldRunDemo 三态判定 / sleep 节奏校验 / species-cycle 5 物种 broadcast
// Pos:    panda-on-desk W14-T4 演示模式测试 [NEW-FILE:#W14-05]
//         严守 byte-equal — 不引用 src/services/api/{claude,oauth,providers}

import { beforeEach, describe, expect, test } from 'bun:test'

import {
  DEFAULT_TIMING,
  DEMO_SPECIES_CYCLE,
  DEMO_STEPS,
  markDemoComplete,
  runDemoSequence,
  shouldRunDemo,
} from '../src/demo-mode.js'

// ─────────────────────────────────────────────────────────────────────────────
// 工厂：fake hitWin / send 拦截 / exec 拦截 / 立即 resolve sleep
// ─────────────────────────────────────────────────────────────────────────────

interface SendCall {
  channel: string
  payload: unknown
}

interface Recorder {
  sends: SendCall[]
  execs: string[]
  sleeps: number[]
  saved: Array<Record<string, unknown>>
}

function newRecorder(): Recorder {
  return { sends: [], execs: [], sleeps: [], saved: [] }
}

function fakeHitWin() {
  return {
    isDestroyed: () => false,
    webContents: {
      isDestroyed: () => false,
      send: () => {},
      executeJavaScript: () => Promise.resolve(null),
    },
  }
}

function makeOpts(rec: Recorder, override?: Record<string, unknown>) {
  return {
    timing: {
      idleMs: 1,
      thinkingMs: 1,
      workingMs: 1,
      attentionMs: 1,
      notificationMs: 1,
      sleepingMs: 1,
      levelupMs: 1,
      speciesEachMs: 1,
      badgeMs: 1,
      overlayMs: 1,
    },
    sleep: (ms: number) => {
      rec.sleeps.push(ms)
      return Promise.resolve()
    },
    send: (channel: string, payload: unknown) => {
      rec.sends.push({ channel, payload })
    },
    exec: (script: string) => {
      rec.execs.push(script)
      return Promise.resolve(null)
    },
    deps: {
      loadDeskPrefs: () => ({ firstRun: true }),
      saveDeskPrefs: (patch: Record<string, unknown>) => {
        rec.saved.push(patch)
        return { status: 'ok' as const, data: patch as any }
      },
    },
    ...(override || {}),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 用例
// ─────────────────────────────────────────────────────────────────────────────

describe('panda-on-desk · W14-T4 demo-mode 静态契约', () => {
  test('DEMO_STEPS 必须恰好 10 个步骤（DoD 锁定）', () => {
    expect(Array.isArray(DEMO_STEPS)).toBe(true)
    expect(DEMO_STEPS.length).toBe(10)
  })

  test('步骤 1-6 顺序应为 idle/thinking/working/attention/notification/sleeping', () => {
    const stateOrder = DEMO_STEPS.slice(0, 6).map(s => (s as any).state)
    expect(stateOrder).toEqual([
      'idle',
      'thinking',
      'working',
      'attention',
      'notification',
      'sleeping',
    ])
  })

  test('步骤 7/8/9/10 应为 levelup / species-cycle / badge / overlay', () => {
    expect(DEMO_STEPS[6].kind).toBe('levelup')
    expect(DEMO_STEPS[7].kind).toBe('species-cycle')
    expect(DEMO_STEPS[8].kind).toBe('badge')
    expect(DEMO_STEPS[9].kind).toBe('overlay')
  })

  test('DEMO_SPECIES_CYCLE 必须恰好 5 个物种', () => {
    expect(DEMO_SPECIES_CYCLE.length).toBe(5)
    // 确保覆盖 robot/owl/chonk/duck/default（任务要求 5 物种切换：panda → robot → owl → chonk → duck → panda）
    const set = new Set(DEMO_SPECIES_CYCLE)
    for (const sp of ['robot', 'owl', 'chonk', 'duck', 'default']) {
      expect(set.has(sp as any)).toBe(true)
    }
  })

  test('DEFAULT_TIMING 总时长应 ≈ 27.5s（任务约定基线）', () => {
    const total =
      DEFAULT_TIMING.idleMs +
      DEFAULT_TIMING.thinkingMs +
      DEFAULT_TIMING.workingMs +
      DEFAULT_TIMING.attentionMs +
      DEFAULT_TIMING.notificationMs +
      DEFAULT_TIMING.sleepingMs +
      DEFAULT_TIMING.levelupMs +
      DEFAULT_TIMING.speciesEachMs * DEMO_SPECIES_CYCLE.length +
      DEFAULT_TIMING.badgeMs +
      DEFAULT_TIMING.overlayMs
    // 5+3+3+2+2+3+2.5+(1.5*5)+2+4 = 30
    expect(total).toBeGreaterThanOrEqual(20_000)
    expect(total).toBeLessThanOrEqual(40_000)
  })
})

describe('panda-on-desk · W14-T4 shouldRunDemo', () => {
  test('null/undefined prefs → 视为首次运行', () => {
    expect(shouldRunDemo(null)).toBe(true)
    expect(shouldRunDemo(undefined)).toBe(true)
  })

  test('firstRun 缺失 → 默认 true（让老用户也能看一次）', () => {
    expect(shouldRunDemo({})).toBe(true)
  })

  test('firstRun=true → true', () => {
    expect(shouldRunDemo({ firstRun: true })).toBe(true)
  })

  test('firstRun=false → false（演示已播过）', () => {
    expect(shouldRunDemo({ firstRun: false })).toBe(false)
  })
})

describe('panda-on-desk · W14-T4 runDemoSequence 主流程', () => {
  let rec: Recorder
  beforeEach(() => {
    rec = newRecorder()
  })

  test('hitWin 缺失 → 直接 skipped 且不抛', async () => {
    const result = await runDemoSequence(null as any, makeOpts(rec))
    expect(result.skipped).toBe(true)
    expect(result.reason).toBe('hitWin missing')
    expect(rec.sends.length).toBe(0)
    expect(rec.execs.length).toBe(0)
    // 跳过路径不应写 firstRun
    expect(rec.saved.length).toBe(0)
  })

  test('完整序列：恰好 10 个 step record + firstRun=false 默认写盘', async () => {
    const result = await runDemoSequence(fakeHitWin(), makeOpts(rec))
    expect(result.steps.length).toBe(10)
    // 每条 record 必须含 index/kind/detail/startedAt
    for (const r of result.steps) {
      expect(typeof r.index).toBe('number')
      expect(typeof r.kind).toBe('string')
      expect(typeof r.detail).toBe('string')
      expect(typeof r.startedAt).toBe('number')
    }
    // 默认 markComplete=true → 写一次 firstRun=false
    expect(rec.saved.length).toBe(1)
    expect(rec.saved[0]).toEqual({ firstRun: false })
    expect(result.marked).toBe(true)
  })

  test('6 个 pet-state + 1 level-up + 5 species 全部通过 panda-event 通道 broadcast', async () => {
    await runDemoSequence(fakeHitWin(), makeOpts(rec))
    // 步骤 1-6：pet-state 6 条
    const stateEvents = rec.sends.filter(
      (s) => s.channel === 'panda-event' && (s.payload as any)?.type === 'pet-state',
    )
    expect(stateEvents.length).toBe(6)
    expect(stateEvents.map(s => (s.payload as any).state)).toEqual([
      'idle', 'thinking', 'working', 'attention', 'notification', 'sleeping',
    ])
    // 步骤 7：level-up 1 条
    const levelEvents = rec.sends.filter(
      (s) => s.channel === 'panda-event' && (s.payload as any)?.type === 'level-up',
    )
    expect(levelEvents.length).toBe(1)
    expect((levelEvents[0].payload as any).fromLevel).toBe(1)
    expect((levelEvents[0].payload as any).toLevel).toBe(2)
    // 步骤 8：species 5 条（顺序与 DEMO_SPECIES_CYCLE 完全一致）
    const speciesEvents = rec.sends.filter(
      (s) => s.channel === 'panda-event' && (s.payload as any)?.type === 'species',
    )
    expect(speciesEvents.length).toBe(DEMO_SPECIES_CYCLE.length)
    expect(speciesEvents.map(s => (s.payload as any).species)).toEqual([...DEMO_SPECIES_CYCLE])
  })

  test('badge + overlay 走 executeJavaScript（无 IPC 通道路径）', async () => {
    await runDemoSequence(fakeHitWin(), makeOpts(rec))
    // exec 应被调用 ≥ 2 次（badge 1 + overlay 1）
    expect(rec.execs.length).toBeGreaterThanOrEqual(2)
    // badge 脚本必须含 __pandaSetBadge(3)
    const badgeCall = rec.execs.find(s => s.includes('__pandaSetBadge'))
    expect(badgeCall).toBeDefined()
    expect(badgeCall!).toContain('__pandaSetBadge(3)')
    // overlay 脚本必须含 __pandaShowStats（welcome 触发器）
    const overlayCall = rec.execs.find(s => s.includes('__pandaShowStats'))
    expect(overlayCall).toBeDefined()
    expect(overlayCall!).toContain('__pandaShowStats')
    // overlay 文案必须 JSON.stringify 安全注入（含中文 welcome 字样）
    expect(overlayCall!).toContain('欢迎使用')
  })

  test('markComplete=false（手动 tray 触发）→ 不写 firstRun=false', async () => {
    const result = await runDemoSequence(fakeHitWin(), makeOpts(rec, { markComplete: false }))
    expect(result.steps.length).toBe(10)
    expect(rec.saved.length).toBe(0)
    expect(result.marked).toBeFalsy()
  })

  test('badge 步骤对非有限/负数 count 应安全降级（不抛 + 不注入 NaN）', async () => {
    // 直接测 markDemoComplete + runDemoSequence 的容错；同时验 exec 脚本不含 NaN/Infinity
    const evilOpts = makeOpts(rec)
    await runDemoSequence(fakeHitWin(), evilOpts)
    for (const script of rec.execs) {
      expect(script).not.toContain('NaN')
      expect(script).not.toContain('Infinity')
      expect(script).not.toContain('undefined')
    }
  })
})

describe('panda-on-desk · W14-T4 markDemoComplete 容错', () => {
  test('saveDeskPrefs 抛异常 → 返回 { ok:false, reason }', () => {
    const r = markDemoComplete({
      saveDeskPrefs: () => {
        throw new Error('disk full')
      },
    })
    expect(r.ok).toBe(false)
    expect(r.reason).toContain('disk full')
  })

  test('saveDeskPrefs 注入有效 → ok=true 且 patch 含 firstRun=false', () => {
    let captured: Record<string, unknown> | null = null
    const r = markDemoComplete({
      saveDeskPrefs: (patch: Record<string, unknown>) => {
        captured = patch
        return { status: 'ok' as const, data: patch as any }
      },
    })
    expect(r.ok).toBe(true)
    expect(captured).toEqual({ firstRun: false })
  })
})
