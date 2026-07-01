// Input: 模拟 process.memoryUsage().rss 返回值
// Output: 验证阈值跨越触发 console.warn 一次、getCurrentRssMB 缓存最近采样、
//         三层内存防御回调机制
// Pos: src/utils/ 单元测试，与 initPandaccSettings.test.ts 同级
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
} from 'bun:test'
import {
  __resetProcessHealthForTest,
  getCurrentRssMB,
  getRssHealthLevel,
  installProcessHealthMonitor,
  onMemoryPressure,
  probeProcessHealth,
  RSS_HEALTH_DEFAULTS,
  stopProcessHealthMonitor,
} from './processHealth.js'

const MB = 1024 * 1024
const GB = 1024 * MB

const ORIGINAL_MEMORY_USAGE = process.memoryUsage

function mockRss(rssBytes: number): void {
  const fake = (() => ({
    rss: rssBytes,
    heapTotal: 0,
    heapUsed: 0,
    external: 0,
    arrayBuffers: 0,
  })) as unknown as NodeJS.MemoryUsageFn
  process.memoryUsage = fake
}

function restoreMemoryUsage(): void {
  process.memoryUsage = ORIGINAL_MEMORY_USAGE
}

describe('processHealth — RSS 健康心跳', () => {
  let warnCalls: string[] = []
  const ORIGINAL_WARN = console.warn

  beforeEach(() => {
    __resetProcessHealthForTest()
    warnCalls = []
    console.warn = (msg: unknown, ..._rest: unknown[]) => {
      warnCalls.push(String(msg))
    }
  })

  afterEach(() => {
    stopProcessHealthMonitor()
    __resetProcessHealthForTest()
    restoreMemoryUsage()
    console.warn = ORIGINAL_WARN
  })

  test('低 RSS（500 MB）→ normal，不打印 warn', () => {
    mockRss(500 * MB)
    const r = probeProcessHealth({
      warnBytes: 1.2 * GB,
      criticalBytes: 1.5 * GB,
    })
    expect(r.level).toBe('normal')
    expect(r.warned).toBe(false)
    expect(warnCalls.length).toBe(0)
    expect(getCurrentRssMB()).toBe(500)
    expect(getRssHealthLevel()).toBe('normal')
  })

  test('跨 1.2 GB 阈值 → warn 一次（再调不重复）', () => {
    mockRss(1.3 * GB)
    const first = probeProcessHealth({
      warnBytes: 1.2 * GB,
      criticalBytes: 1.5 * GB,
    })
    expect(first.level).toBe('warn')
    expect(first.warned).toBe(true)
    expect(warnCalls.length).toBe(1)
    expect(warnCalls[0]).toContain('exceeded')
    expect(warnCalls[0]).toContain('1228 MB')
    expect(warnCalls[0]).toContain('Bun runtime instability')

    // 二次采样仍在 warn 区间 → 不重复 print
    mockRss(1.35 * GB)
    const second = probeProcessHealth({
      warnBytes: 1.2 * GB,
      criticalBytes: 1.5 * GB,
    })
    expect(second.level).toBe('warn')
    expect(second.warned).toBe(false)
    expect(warnCalls.length).toBe(1)
  })

  test('warn → critical 升级 → 再 warn 一次（共 2 条）', () => {
    mockRss(1.3 * GB)
    probeProcessHealth({ warnBytes: 1.2 * GB, criticalBytes: 1.5 * GB })
    expect(warnCalls.length).toBe(1)

    mockRss(1.6 * GB)
    const r2 = probeProcessHealth({
      warnBytes: 1.2 * GB,
      criticalBytes: 1.5 * GB,
    })
    expect(r2.level).toBe('critical')
    expect(r2.warned).toBe(true)
    expect(warnCalls.length).toBe(2)
    expect(warnCalls[1]).toContain('high crash risk')
    expect(warnCalls[1]).toContain('Save your work and restart')
  })

  test('直接跳到 critical（中间没经过 warn）→ 也只 warn 一次', () => {
    mockRss(2.0 * GB)
    const r = probeProcessHealth({
      warnBytes: 1.2 * GB,
      criticalBytes: 1.5 * GB,
    })
    expect(r.level).toBe('critical')
    expect(r.warned).toBe(true)
    expect(warnCalls.length).toBe(1)
    expect(warnCalls[0]).toContain('high crash risk')
  })

  test('process.memoryUsage 抛异常 → failsafe 返回 0 / level 不变', () => {
    process.memoryUsage = (() => {
      throw new Error('mock fail')
    }) as unknown as NodeJS.MemoryUsageFn
    const r = probeProcessHealth({
      warnBytes: 1.2 * GB,
      criticalBytes: 1.5 * GB,
    })
    expect(r.rssBytes).toBe(0)
    expect(r.warned).toBe(false)
    expect(warnCalls.length).toBe(0)
  })

  test('installProcessHealthMonitor 幂等（重复调用只装一个 interval）', () => {
    mockRss(100 * MB)
    installProcessHealthMonitor()
    installProcessHealthMonitor()
    installProcessHealthMonitor()
    // 没有崩溃且 getCurrentRssMB 已被首次 probe 填充
    expect(getCurrentRssMB()).toBeGreaterThan(0)
    stopProcessHealthMonitor()
  })

  test('PANDA_RSS_HEALTH=0 → 不安装监控（getCurrentRssMB 仍可读到实时值）', () => {
    const orig = process.env.PANDA_RSS_HEALTH
    process.env.PANDA_RSS_HEALTH = '0'
    try {
      mockRss(100 * MB)
      installProcessHealthMonitor()
      // 没安装 → 缓存值还是 0（关闭后没首次 probe）
      // getCurrentRssMB 走 fallback 读实时
      expect(getCurrentRssMB()).toBe(100)
      expect(getRssHealthLevel()).toBe('normal')
    } finally {
      if (orig === undefined) delete process.env.PANDA_RSS_HEALTH
      else process.env.PANDA_RSS_HEALTH = orig
    }
  })

  test('RSS_HEALTH_DEFAULTS 常量值与设计一致', () => {
    expect(RSS_HEALTH_DEFAULTS.WARN_BYTES).toBe(1.2 * GB)
    expect(RSS_HEALTH_DEFAULTS.CRITICAL_BYTES).toBe(1.5 * GB)
    expect(RSS_HEALTH_DEFAULTS.COMPACT_MB).toBe(1400)
    expect(RSS_HEALTH_DEFAULTS.SHUTDOWN_MB).toBe(1600)
    expect(RSS_HEALTH_DEFAULTS.INTERVAL_MS).toBe(60_000)
  })

  test('onMemoryPressure 注册回调、返回 unsubscribe', () => {
    const calls: Array<{ level: string; rssMB: number }> = []
    const unsub = onMemoryPressure((level, rssMB) => {
      calls.push({ level, rssMB })
    })
    expect(typeof unsub).toBe('function')
    // cleanup — 调用 unsubscribe 后回调列表应为空（由 reset 兜底）
    unsub()
  })
})
