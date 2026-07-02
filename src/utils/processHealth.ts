// Input: process.memoryUsage() RSS 采样、环境变量阈值配置
//         PANDA_RSS_WARN_MB / PANDA_RSS_CRITICAL_MB / PANDA_RSS_COMPACT_MB /
//         PANDA_RSS_SHUTDOWN_MB env 覆盖默认阈值；PANDA_RSS_HEALTH=0 完全关闭
// Output: 内存健康状态（normal/warn/critical）、内存压力回调触发、状态栏 RSS 值
// Pos: 进程生命周期监控层，动态心跳（5s~60s），连接 GC/compact/gracefulShutdown
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"
//
// 任务背景：实测 panda 跑 8.6h 后 Bun 1.3.11 segfault，Peak RSS 1.67 GB
// （监控报告 monitor/audit-pandacc-storage-2026-04-26.md）。在崩溃前提示用户
// /clear 或 restart 是低成本但实用的预警手段，避免无声失语 + 长会话丢失。
//
// 设计取舍：
// - 用 RSS 而非 heapUsed：Bun 对 buffer / decoder / FFI 的非堆内存占用很大，
//   heapUsed 不能完整反映 segfault 风险。
// - 单次性 warn：log 一条就静音，避免长跑刷屏。
// - 不依赖 React / Ink：避免 ScreenFrame 在第三方 host 渲染失败时也丢监控。
// - 阈值可调：1.2 GB warn / 1.5 GB critical 是基于实测 1.67 GB 崩溃点反推的
//   保守值，留 ~470 MB buffer 给用户操作。

import { isEnvDefinedFalsy, isEnvTruthy } from './envUtils.js'

const MB = 1024 * 1024
const GB = 1024 * MB

// 默认阈值；可被 env 覆盖
const DEFAULT_WARN_RSS = 1.2 * GB
const DEFAULT_CRITICAL_RSS = 1.5 * GB
const DEFAULT_INTERVAL_MS = 60_000 // 60s

// 三层内存防御阈值（L2 紧急压缩、L3 保命退出）
const COMPACT_RSS_MB =
  parseInt(process.env.PANDA_RSS_COMPACT_MB || '0') || 1400 // 1.4 GB
const SHUTDOWN_RSS_MB =
  parseInt(process.env.PANDA_RSS_SHUTDOWN_MB || '0') || 1600 // 1.6 GB

type HealthLevel = 'normal' | 'warn' | 'critical'

// --- 内存压力回调机制 ---
export type MemoryPressureLevel = 'warn' | 'compact' | 'critical'
export type MemoryPressureCallback = (
  level: MemoryPressureLevel,
  rssMB: number,
) => void | Promise<void>

let memoryPressureCallbacks: MemoryPressureCallback[] = []

/**
 * 注册内存压力回调。当 RSS 超过阈值时，processHealth 心跳会调用注册的回调。
 * 用于连接 QueryEngine 的上下文压缩机制。
 * 返回 unsubscribe 函数。
 */
export function onMemoryPressure(
  callback: MemoryPressureCallback,
): () => void {
  memoryPressureCallbacks.push(callback)
  return () => {
    memoryPressureCallbacks = memoryPressureCallbacks.filter(
      (cb) => cb !== callback,
    )
  }
}

let currentRssBytes = 0
let currentLevel: HealthLevel = 'normal'
let lastWarnedLevel: HealthLevel = 'normal'
let consecutiveCompactCount = 0 // 连续超过 compact 阈值的心跳次数
let intervalHandle: ReturnType<typeof setTimeout> | undefined

/**
 * 解析 env 阈值（单位 MB，例如 "1500" → 1.5 GB），失败回退默认。
 */
function resolveThresholdBytes(
  envValue: string | undefined,
  fallback: number,
): number {
  if (!envValue) return fallback
  const n = Number(envValue)
  if (!Number.isFinite(n) || n <= 0) return fallback
  return n * MB
}

/**
 * 当前 RSS（MB，向下取整）。failsafe：若 process.memoryUsage 抛错，返回 0。
 * 给 status bar 用：UI 层调用频次可达每 500ms 一次，必须便宜。
 */
export function getCurrentRssMB(): number {
  // 优先返回缓存值（最近一次心跳采样），避免 UI 重渲染压力
  if (currentRssBytes > 0) return Math.floor(currentRssBytes / MB)
  try {
    const rss = process.memoryUsage().rss
    return Math.floor(rss / MB)
  } catch {
    return 0
  }
}

/**
 * 当前健康级别：normal / warn / critical。供 ScreenFrame status bar 显示
 * `⚠ HIGH MEM` 红色标记用。
 */
export function getRssHealthLevel(): HealthLevel {
  return currentLevel
}

/**
 * 一次心跳采样：刷新 RSS、判定级别、跨阈值时打印一次性 warn。
 * 导出给单元测试用，业务代码不必直接调用。
 */
export function probeProcessHealth(thresholds: {
  warnBytes: number
  criticalBytes: number
}): { rssBytes: number; level: HealthLevel; warned: boolean } {
  let rssBytes = 0
  try {
    rssBytes = process.memoryUsage().rss
  } catch {
    // 忽略异常，下一轮再试
    return { rssBytes: 0, level: currentLevel, warned: false }
  }
  currentRssBytes = rssBytes

  const level: HealthLevel =
    rssBytes >= thresholds.criticalBytes
      ? 'critical'
      : rssBytes >= thresholds.warnBytes
        ? 'warn'
        : 'normal'
  currentLevel = level

  // 仅在 level 单调升高时打印一次（normal→warn→critical），降回 normal 不打印
  let warned = false
  if (level !== 'normal' && shouldWarnAt(level)) {
    const rssMB = Math.floor(rssBytes / MB)
    if (level === 'warn') {
      // eslint-disable-next-line no-console
      console.warn(
        `[panda] Panda RSS exceeded ${Math.floor(thresholds.warnBytes / MB)} MB (current ${rssMB} MB) — long sessions may trigger Bun runtime instability. Consider /clear or restart.`,
      )
    } else {
      // eslint-disable-next-line no-console
      console.warn(
        `[panda] Panda RSS exceeded ${Math.floor(thresholds.criticalBytes / MB)} MB (current ${rssMB} MB) — high crash risk. Save your work and restart panda now.`,
      )
    }
    lastWarnedLevel = level
    warned = true
  }

  return { rssBytes, level, warned }
}

function shouldWarnAt(level: HealthLevel): boolean {
  // 单调升级才 warn：normal → warn → critical 各打印 1 次；
  // critical 之后维持，不再重复；warn → critical 升级再打印 1 次。
  if (level === 'warn' && lastWarnedLevel === 'normal') return true
  if (level === 'critical' && lastWarnedLevel !== 'critical') return true
  return false
}

/**
 * 动态心跳间隔：内存越高，检查越频繁。
 *   > 1 GB:  每 5 秒
 *   > 500 MB: 每 15 秒
 *   其他:    使用默认间隔（60 秒）
 */
function getDynamicIntervalMs(): number {
  const rssMB = Math.round(currentRssBytes / MB)
  if (rssMB > 1000) return 5_000
  if (rssMB > 500) return 15_000
  return DEFAULT_INTERVAL_MS
}

/**
 * 三层内存防御心跳（async 包装）:
 *   L1: RSS > warn → 触发 GC
 *   L2: RSS > compact 阈值 连续 2 次 → 触发注册的内存压力回调（紧急压缩）
 *   L3: RSS > shutdown 阈值 → heap dump + graceful shutdown
 */
async function heartbeatWithDefense(
  warnBytes: number,
  criticalBytes: number,
): Promise<void> {
  const { rssBytes } = probeProcessHealth({ warnBytes, criticalBytes })
  if (rssBytes === 0) return

  const rssMB = Math.floor(rssBytes / MB)

  // L1: RSS > warn 阈值 → 尝试 GC（Bun 环境下可用）+ 回收空闲后台 shell
  if (rssMB > Math.floor(warnBytes / MB)) {
    try {
      // Bun.gc 可能不存在（Node.js 环境）
      const bunGlobal = (globalThis as Record<string, unknown>).Bun as
        | { gc?: (aggressive: boolean) => void }
        | undefined
      bunGlobal?.gc?.(true)
    } catch {
      // Bun.gc 不可用，静默忽略
    }
    // v2.29.4: fire memory pressure callbacks at warn level for idle reaping
    for (const cb of memoryPressureCallbacks) {
      try {
        void cb('warn', rssMB)
      } catch {
        // handlers must not crash the health monitor
      }
    }
  }

  // L2: RSS > compact 阈值，连续 2 次心跳触发紧急压缩
  if (rssMB > COMPACT_RSS_MB) {
    consecutiveCompactCount++
    if (consecutiveCompactCount >= 2) {
      consecutiveCompactCount = 0
      for (const cb of [...memoryPressureCallbacks]) {
        try {
          await cb('compact', rssMB)
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn(
            `[panda] Memory pressure callback failed (compact): ${String(e)}`,
          )
        }
      }
    }
  } else {
    consecutiveCompactCount = 0 // 降回阈值以下，重置计数
  }

  // L3: RSS > shutdown 阈值 → heap dump + graceful shutdown（保命退出）
  if (rssMB > SHUTDOWN_RSS_MB) {
    // 通知所有回调
    for (const cb of [...memoryPressureCallbacks]) {
      try {
        await cb('critical', rssMB)
      } catch {
        // 退出路径不阻塞
      }
    }

    // 尝试 heap dump
    try {
      const { performHeapDump } = await import('./heapDumpService.js')
      await performHeapDump('auto-1.5GB')
    } catch {
      // 堆转储失败不阻塞退出
    }

    // eslint-disable-next-line no-console
    console.warn(
      `[panda] RSS ${rssMB} MB exceeded shutdown threshold ${SHUTDOWN_RSS_MB} MB — initiating graceful shutdown to prevent OOM kill.`,
    )

    // 动态 import 避免循环依赖（processHealth ↔ gracefulShutdown）
    const { gracefulShutdown } = await import('./gracefulShutdown.js')
    await gracefulShutdown(
      137,
      `OOM prevention: RSS ${rssMB} MB exceeded ${SHUTDOWN_RSS_MB} MB`,
    )
  }
}

/**
 * 启动周期心跳。重复调用是幂等的（保留首次 interval，后续直接 return）。
 *
 * 关闭机制：
 *   PANDA_RSS_HEALTH=0 / false / off  → 不安装监控
 *   process.exit / SIGTERM            → installer 注册 unref，自动随进程退出
 */
export function installProcessHealthMonitor(): void {
  if (intervalHandle) return

  // 显式关闭开关：CI / 嵌入式 / 第三方宿主可能不希望 panda 写 stderr
  if (isEnvDefinedFalsy(process.env.PANDA_RSS_HEALTH)) return

  const warnBytes = resolveThresholdBytes(
    process.env.PANDA_RSS_WARN_MB,
    DEFAULT_WARN_RSS,
  )
  const criticalBytes = resolveThresholdBytes(
    process.env.PANDA_RSS_CRITICAL_MB,
    DEFAULT_CRITICAL_RSS,
  )
  // 间隔由 getDynamicIntervalMs() 动态决定，不再需要固定 intervalMs

  // 立即跑一次，给 UI 一个非零起始值（避免 status bar 首次渲染卡 0）
  probeProcessHealth({ warnBytes, criticalBytes })

  // 动态 setTimeout 链：内存越高，心跳间隔越短
  function scheduleNextHeartbeat(): void {
    const delay = getDynamicIntervalMs()
    intervalHandle = setTimeout(() => {
      void (async () => {
        await heartbeatWithDefense(warnBytes, criticalBytes)
        scheduleNextHeartbeat()
      })()
    }, delay)
    // unref 保证 panda 自然退出时不会卡 event loop
    intervalHandle.unref?.()
  }
  scheduleNextHeartbeat()
}

/**
 * 停止心跳。主要给单元测试用，也可在 graceful shutdown 显式清理。
 */
export function stopProcessHealthMonitor(): void {
  if (intervalHandle) {
    clearTimeout(intervalHandle)
    intervalHandle = undefined
  }
}

/**
 * 测试钩子：重置内部状态，给单元测试每个 case 独立。
 * 不导出给业务代码用 — 业务里只调用 install + getCurrentRssMB / getRssHealthLevel。
 */
export function __resetProcessHealthForTest(): void {
  currentRssBytes = 0
  currentLevel = 'normal'
  lastWarnedLevel = 'normal'
  consecutiveCompactCount = 0
  memoryPressureCallbacks = []
  if (intervalHandle) {
    clearTimeout(intervalHandle)
    intervalHandle = undefined
  }
}

/**
 * 导出阈值常量，便于状态栏 / 调试展示同步。
 * Note: 显示用，不要用作判断 — 业务判断走 getRssHealthLevel()。
 */
export const RSS_HEALTH_DEFAULTS = {
  WARN_BYTES: DEFAULT_WARN_RSS,
  CRITICAL_BYTES: DEFAULT_CRITICAL_RSS,
  COMPACT_MB: COMPACT_RSS_MB,
  SHUTDOWN_MB: SHUTDOWN_RSS_MB,
  INTERVAL_MS: DEFAULT_INTERVAL_MS,
} as const

// Avoid unused-import lint noise: keep isEnvTruthy reachable for future opt-in
// alternative (PANDA_RSS_HEALTH=1 explicit on) without re-importing later.
void isEnvTruthy
