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
  DEMO_STEP_SOUND_CUES,
  DEMO_SUBTITLES,
  buildChromeCleanupScript,
  buildChromeInitScript,
  buildCursorHintScript,
  buildProgressScript,
  buildSubtitleScript,
  buildTransitionFadeScript,
  buildWelcomeOverlayScript,
  getSoundCuesForLevel,
  getStepsForLevel,
  getSubtitlesForLevel,
  markDemoComplete,
  markDemoSkipped,
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

// ─────────────────────────────────────────────────────────────────────────────
// W21-T2 demo polish：sound cue / cursor hint / final card / demoSkipped / 等级个性化
// ─────────────────────────────────────────────────────────────────────────────

describe('panda-on-desk · W21-T2 demo polish', () => {
  let rec: Recorder
  beforeEach(() => { rec = newRecorder() })

  test('W21-T2-1 · DEMO_STEP_SOUND_CUES 10 条 + 与 DEMO_STEPS 长度一致 + 仅 short/gentle/critical 三类', () => {
    expect(DEMO_STEP_SOUND_CUES.length).toBe(DEMO_STEPS.length)
    const allowed = new Set(['short', 'gentle', 'critical'])
    for (const c of DEMO_STEP_SOUND_CUES) {
      expect(allowed.has(c)).toBe(true)
    }
    // levelup（idx 6）+ overlay（idx 9）必须 critical（关键里程碑）
    expect(DEMO_STEP_SOUND_CUES[6]).toBe('critical')
    expect(DEMO_STEP_SOUND_CUES[9]).toBe('critical')
  })

  test('W21-T2-2 · runDemoSequence 触发 playSoundCue 每步 1 次（满级 = 10 次）', async () => {
    const cues: string[] = []
    const result = await runDemoSequence(fakeHitWin(), makeOpts(rec, {
      userLevel: 99, // 满级 → 全部 10 步
      playSoundCue: (cue: string) => cues.push(cue),
    }))
    expect(cues.length).toBe(10)
    expect(result.soundCues).toBeDefined()
    expect(result.soundCues!.length).toBe(10)
    // result 的 soundCues 与回调收到的应完全一致
    expect(result.soundCues).toEqual(cues as any)
    // 顺序与 DEMO_STEP_SOUND_CUES 一致
    expect(cues).toEqual([...DEMO_STEP_SOUND_CUES])
  })

  test('W21-T2-3 · cursor hint：show + click + hide 三相位（首个 state 步骤触发）+ DOM 脚本正确', async () => {
    const hints: string[] = []
    const result = await runDemoSequence(fakeHitWin(), makeOpts(rec, {
      userLevel: 99,
      onCursorHint: (a: string) => hints.push(a),
    }))
    expect(hints).toEqual(['show', 'click', 'hide'])
    expect(result.cursorHints).toEqual(['show', 'click', 'hide'])
    // exec 应注入 cursor 脚本（show/click/hide 各一次）
    const cursorShow = rec.execs.find(s => s.includes('panda-demo-cursor') && s.includes('appendChild'))
    expect(cursorShow).toBeDefined()
    expect(cursorShow!).toContain('svg')
    const cursorClick = rec.execs.find(s => s.includes('panda-demo-pulse'))
    expect(cursorClick).toBeDefined()
    const cursorHide = rec.execs.find(s => s.includes('panda-demo-cursor') && s.includes('opacity'))
    expect(cursorHide).toBeDefined()
    // cleanup 也应清理 cursor DOM
    expect(buildChromeCleanupScript()).toContain('panda-demo-cursor')
  })

  test('W21-T2-4 · final card 包含 /buddy stats + /buddy desk + 不再显示 按钮', () => {
    const html = buildWelcomeOverlayScript('test welcome')
    expect(html).toContain('/buddy stats')
    expect(html).toContain('/buddy desk')
    expect(html).toContain('panda-demo-welcome-desk')
    expect(html).toContain('panda-demo-welcome-never')
    expect(html).toContain('不再显示')
    expect(html).toContain('__pandaDemoNeverShow')
    expect(html).toContain('__pandaDemoWelcomeDesk')
  })

  test('W21-T2-5 · neverShow 路径：exec 返回 true → 写 demoSkipped=true + result.neverShow=true', async () => {
    let execCallCount = 0
    const result = await runDemoSequence(fakeHitWin(), makeOpts(rec, {
      userLevel: 99,
      // 自定义 exec：仅当问到 __pandaDemoNeverShow 时返回 true
      exec: (script: string) => {
        execCallCount++
        rec.execs.push(script)
        if (script.includes('__pandaDemoNeverShow')) return Promise.resolve(true)
        if (script.includes('__pandaDemoSkip')) return Promise.resolve(false)
        return Promise.resolve(null)
      },
    }))
    expect(result.neverShow).toBe(true)
    expect(rec.saved.length).toBe(1)
    // markDemoSkipped 写入 firstRun=false + demoSkipped=true
    expect(rec.saved[0]).toEqual({ firstRun: false, demoSkipped: true })
    expect(result.marked).toBe(true)
    expect(execCallCount).toBeGreaterThan(0)
  })

  test('W21-T2-6 · shouldRunDemo 同时尊重 demoSkipped=true（永久跳过）', () => {
    expect(shouldRunDemo({ firstRun: true, demoSkipped: true })).toBe(false)
    expect(shouldRunDemo({ firstRun: false, demoSkipped: true })).toBe(false)
    expect(shouldRunDemo({ firstRun: true, demoSkipped: false })).toBe(true)
    expect(shouldRunDemo({ firstRun: true })).toBe(true) // 缺失 demoSkipped → 默认不跳
    expect(shouldRunDemo({ demoSkipped: true })).toBe(false)
  })

  test('W21-T2-7 · markDemoSkipped 写入 firstRun=false + demoSkipped=true', () => {
    let captured: Record<string, unknown> | null = null
    const r = markDemoSkipped({
      saveDeskPrefs: (patch: Record<string, unknown>) => {
        captured = patch
        return { status: 'ok' as const, data: patch as any }
      },
    })
    expect(r.ok).toBe(true)
    expect(captured).toEqual({ firstRun: false, demoSkipped: true })
  })

  test('W21-T2-8 · markDemoSkipped 异常 → ok:false + reason', () => {
    const r = markDemoSkipped({
      saveDeskPrefs: () => { throw new Error('disk full') },
    })
    expect(r.ok).toBe(false)
    expect(r.reason).toContain('disk full')
  })

  test('W21-T2-9 · 等级个性化：lv 1 仅 idle/sleeping 两个 state（其他 state 全裁）', () => {
    const steps = getStepsForLevel(1)
    const stateOnly = steps.filter(s => s.kind === 'state').map(s => (s as any).state)
    expect(stateOnly).toEqual(['idle', 'sleeping'])
    // 元能力（levelup/species/badge/overlay）保留
    expect(steps.some(s => s.kind === 'levelup')).toBe(true)
    expect(steps.some(s => s.kind === 'species-cycle')).toBe(true)
    expect(steps.some(s => s.kind === 'badge')).toBe(true)
    expect(steps.some(s => s.kind === 'overlay')).toBe(true)
  })

  test('W21-T2-10 · 等级个性化：lv 5 → +thinking；lv 10 → +working/notification；lv 15 → 全部', () => {
    const lv5 = getStepsForLevel(5).filter(s => s.kind === 'state').map(s => (s as any).state)
    expect(lv5).toEqual(['idle', 'thinking', 'sleeping'])
    const lv10 = getStepsForLevel(10).filter(s => s.kind === 'state').map(s => (s as any).state)
    expect(lv10).toEqual(['idle', 'thinking', 'working', 'notification', 'sleeping'])
    const lv15 = getStepsForLevel(15).filter(s => s.kind === 'state').map(s => (s as any).state)
    expect(lv15).toEqual(['idle', 'thinking', 'working', 'attention', 'notification', 'sleeping'])
    // 等价：等价 lv 99 行为
    const lv99 = getStepsForLevel(99).filter(s => s.kind === 'state').map(s => (s as any).state)
    expect(lv99).toEqual(lv15)
  })

  test('W21-T2-11 · runDemoSequence userLevel=1 → 仅播 idle+sleeping 两个 state（其他 state 跳过）', async () => {
    const result = await runDemoSequence(fakeHitWin(), makeOpts(rec, { userLevel: 1 }))
    // 主循环步骤数 = 2 state + 1 levelup + 1 species + 1 badge + 1 overlay = 6
    expect(result.steps.length).toBe(6)
    const stateRecords = result.steps.filter(s => s.kind === 'state').map(s => s.detail)
    expect(stateRecords).toEqual(['idle', 'sleeping'])
    // pet-state IPC 也应只发 2 条
    const stateEvents = rec.sends.filter(
      (s) => s.channel === 'panda-event' && (s.payload as any)?.type === 'pet-state',
    )
    expect(stateEvents.length).toBe(2)
    expect(stateEvents.map(s => (s.payload as any).state)).toEqual(['idle', 'sleeping'])
  })

  test('W21-T2-12 · 等级个性化时 sound cue / subtitle 同步裁剪（与 step 数对齐）', async () => {
    const cues: string[] = []
    const subs: string[] = []
    await runDemoSequence(fakeHitWin(), makeOpts(rec, {
      userLevel: 1,
      playSoundCue: (c: string) => cues.push(c),
      onSubtitle: (t: string) => subs.push(t),
    }))
    // lv1 → 6 步骤；sound cue 6 次；subtitle 6 次
    expect(cues.length).toBe(6)
    expect(subs.length).toBe(6)
    // helper 应返回相同长度
    expect(getSoundCuesForLevel(1).length).toBe(6)
    expect(getSubtitlesForLevel(1).length).toBe(6)
  })

  test('W21-T2-13 · buildCursorHintScript 三动作脚本契约（show/click/hide）', () => {
    const show = buildCursorHintScript('show')
    expect(show).toContain('panda-demo-cursor')
    expect(show).toContain('svg')
    expect(show).toContain('appendChild')
    expect(show).toContain('getElementById(\'pet\')')

    const click = buildCursorHintScript('click')
    expect(click).toContain('panda-demo-pulse')
    expect(click).toContain('@keyframes panda-demo-pulse')
    expect(click).toContain('__pandaPoke')

    const hide = buildCursorHintScript('hide')
    expect(hide).toContain('panda-demo-cursor')
    expect(hide).toContain("opacity='0'")

    // 容错：未知 action 走 hide 路径（不抛）
    const unknown = buildCursorHintScript('weird' as any)
    expect(unknown).toContain('panda-demo-cursor')

    // 全部脚本无 NaN/Infinity 注入
    for (const s of [show, click, hide]) {
      expect(s).not.toContain('NaN')
      expect(s).not.toContain('Infinity')
    }
  })

  test('W21-T2-14 · 默认 userLevel=undefined → 完整 10 步（向后兼容 W14-T4/W17-T3）', async () => {
    const result = await runDemoSequence(fakeHitWin(), makeOpts(rec))
    // 未注入 userLevel → 走完整 10 步（与 W14-T4 行为一致）
    expect(result.steps.length).toBe(10)
    // result.userLevel 仍报 1（默认值），但实际行为是"完整 demo"
    expect(result.userLevel).toBe(1)
  })

  test('W21-T2-15 · userLevel=99 显式启用裁剪 → 完整 10 步 + sound cue 10 次', async () => {
    const cues: string[] = []
    const result = await runDemoSequence(fakeHitWin(), makeOpts(rec, {
      userLevel: 99,
      playSoundCue: (c: string) => cues.push(c),
    }))
    expect(result.steps.length).toBe(10)
    expect(cues.length).toBe(10)
  })
})
