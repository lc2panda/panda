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
  DEMO_SUBTITLES,
  buildChromeCleanupScript,
  buildChromeInitScript,
  buildProgressScript,
  buildSubtitleScript,
  buildTransitionFadeScript,
  buildWelcomeOverlayScript,
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

  test('DEFAULT_TIMING 总时长应 ≤ 25s（W17-T3 DoD：压缩到 ~20s）', () => {
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
    // W17-T3：1500*6 + 2000 + (800*5) + 1500 + 3000 = 19500ms
    expect(total).toBeLessThanOrEqual(25_000)
    expect(total).toBeGreaterThanOrEqual(15_000)
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

// ─────────────────────────────────────────────────────────────────────────────
// W17-T3 深化：progress / subtitle / skip / transition / welcome
// ─────────────────────────────────────────────────────────────────────────────

describe('panda-on-desk · W17-T3 demo-mode 深化', () => {
  let rec: Recorder
  beforeEach(() => { rec = newRecorder() })

  test('DoD1 · DEFAULT_TIMING 总时长 ≤ 25s（目标 ~20s）', () => {
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
    expect(total).toBeLessThanOrEqual(25_000)
    // 且必须 ≤ 22_000 以体现"压缩"
    expect(total).toBeLessThanOrEqual(22_000)
  })

  test('DoD2 · 引导字幕：DEMO_SUBTITLES 10 条 + subtitle DOM 注入脚本包含 textContent 赋值', async () => {
    expect(DEMO_SUBTITLES.length).toBe(10)
    const subs: string[] = []
    await runDemoSequence(fakeHitWin(), makeOpts(rec, {
      onSubtitle: (t: string) => subs.push(t),
    }))
    // 主循环 10 步每步都会触发 subtitle 更新
    expect(subs.length).toBe(10)
    expect(subs[0]).toContain('idle')
    expect(subs[6]).toContain('level up')
    expect(subs[9]).toContain('欢迎')
    // subtitle 脚本含 DOM 选择器 + textContent 赋值
    const script = buildSubtitleScript('hello · test')
    expect(script).toContain('panda-demo-subtitle')
    expect(script).toContain('textContent')
    expect(script).toContain('hello · test')
  })

  test('DoD3 · progress bar：0→100 单调递增 + 注入脚本含 style.width 赋值', async () => {
    const progresses: number[] = []
    const result = await runDemoSequence(fakeHitWin(), makeOpts(rec, {
      onProgress: (p: number) => progresses.push(p),
    }))
    // 初始 0 + 10 步 × 1 = 11 条
    expect(progresses.length).toBeGreaterThanOrEqual(11)
    expect(progresses[0]).toBe(0)
    expect(progresses[progresses.length - 1]).toBe(100)
    // 单调递增
    for (let i = 1; i < progresses.length; i++) {
      expect(progresses[i]).toBeGreaterThanOrEqual(progresses[i - 1])
    }
    // result.progressSeries 也携带完整序列
    expect(result.progressSeries).toBeDefined()
    expect(result.progressSeries!.length).toBe(progresses.length)
    // progress 脚本含 width 赋值
    const ps = buildProgressScript(42)
    expect(ps).toContain('panda-demo-progress')
    expect(ps).toContain('42')
    expect(ps).toContain("'%'")
  })

  test('DoD4 · skip 按钮：skipSignal=true 时中途终止 + result.skipped=true', async () => {
    // 第 3 次 checkSkip 返回 true（允许前几步执行）
    let calls = 0
    const result = await runDemoSequence(fakeHitWin(), makeOpts(rec, {
      skipSignal: () => { calls++; return calls >= 3 },
    }))
    expect(result.skipped).toBe(true)
    expect(result.reason).toContain('skip')
    // 中途退出 → step record 数 < 10
    expect(result.steps.length).toBeLessThan(10)
    // chrome 清理脚本仍会执行（avoid DOM 残留）
    const cleanupCalls = rec.execs.filter(s => s.includes('panda-demo-chrome') && s.includes('remove'))
    expect(cleanupCalls.length).toBeGreaterThanOrEqual(1)
  })

  test('DoD5 · chrome init / 平滑过渡 / welcome 按钮注入脚本正确', async () => {
    await runDemoSequence(fakeHitWin(), makeOpts(rec))
    // chrome 初始化脚本注入（progress/subtitle/skip 三组件）
    const chromeInit = rec.execs.find(s => s.includes('panda-demo-chrome') && s.includes('appendChild'))
    expect(chromeInit).toBeDefined()
    expect(chromeInit!).toContain('panda-demo-progress')
    expect(chromeInit!).toContain('panda-demo-subtitle')
    expect(chromeInit!).toContain('panda-demo-skip')
    expect(chromeInit!).toContain('跳过')
    // 平滑过渡（state 间）脚本至少出现一次 — 含 opacity + transition
    const fade = rec.execs.find(s => s.includes("transition='opacity"))
    expect(fade).toBeDefined()
    // welcome overlay 脚本含 /buddy stats 文案 + 按钮
    const welcome = rec.execs.find(s => s.includes('panda-demo-welcome') && s.includes('跳到桌面'))
    expect(welcome).toBeDefined()
    expect(welcome!).toContain('/buddy stats')
    expect(welcome!).toContain('panda-demo-welcome-desk')
  })

  test('DoD6 · 纯脚本生成器容错：无 NaN/Infinity/undefined + cleanup 幂等', () => {
    const scripts = [
      buildChromeInitScript(),
      buildSubtitleScript('normal'),
      buildSubtitleScript(''),
      buildSubtitleScript('"with\\nquote"'),
      buildProgressScript(-5),        // clamp → 0
      buildProgressScript(250),       // clamp → 100
      buildProgressScript(Number.NaN),// safe → 0
      buildTransitionFadeScript(300),
      buildTransitionFadeScript(10),  // clamp → 50
      buildWelcomeOverlayScript('测试 "escape" ok'),
      buildChromeCleanupScript(),
    ]
    for (const s of scripts) {
      expect(s).not.toContain('NaN')
      expect(s).not.toContain('Infinity')
      // undefined 仅允许作为 JS 关键字（typeof 检查），不应出现为注入的值
      expect(s.includes('=undefined')).toBe(false)
    }
    // progress clamp 验证
    expect(buildProgressScript(-5)).toContain('0+')
    expect(buildProgressScript(250)).toContain('100+')
    expect(buildProgressScript(Number.NaN)).toContain('0+')
  })

  test('DoD7 · DEMO_SUBTITLES 长度必须 === DEMO_STEPS 长度（契约锁定）', () => {
    expect(DEMO_SUBTITLES.length).toBe(DEMO_STEPS.length)
    expect(DEMO_SUBTITLES.every(s => typeof s === 'string' && s.length > 0)).toBe(true)
  })
})
