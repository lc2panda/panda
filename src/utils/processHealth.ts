// Input: 进程运行时 RSS（process.memoryUsage().rss），可由 PANDA_RSS_WARN_MB /
//         PANDA_RSS_CRITICAL_MB env 覆盖默认阈值；可由 PANDA_RSS_HEALTH=0 完全关闭
// Output: 周期性自检，跨阈值时一次性 console.warn；getCurrentRssMB() 给 status bar 用
// Pos: 启动钩子（main.tsx preAction 之后调 installProcessHealthMonitor），与 React 渲染
//       层解耦 — 即便 USER_TYPE 被 build-time 替换、ScreenFrame 不渲染也能跑（避免
//       useMemoryUsage hook 在 external 构建被 DCE 的问题）
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

type HealthLevel = 'normal' | 'warn' | 'critical'

let currentRssBytes = 0
let currentLevel: HealthLevel = 'normal'
let lastWarnedLevel: HealthLevel = 'normal'
let intervalHandle: ReturnType<typeof setInterval> | undefined

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
  const intervalMs = (() => {
    const raw = process.env.PANDA_RSS_INTERVAL_MS
    if (!raw) return DEFAULT_INTERVAL_MS
    const n = Number(raw)
    return Number.isFinite(n) && n >= 1000 ? n : DEFAULT_INTERVAL_MS
  })()

  // 立即跑一次，给 UI 一个非零起始值（避免 status bar 首次渲染卡 0）
  probeProcessHealth({ warnBytes, criticalBytes })

  intervalHandle = setInterval(() => {
    probeProcessHealth({ warnBytes, criticalBytes })
  }, intervalMs)

  // unref 保证 panda 自然退出时不会卡 event loop
  intervalHandle.unref?.()
}

/**
 * 停止心跳。主要给单元测试用，也可在 graceful shutdown 显式清理。
 */
export function stopProcessHealthMonitor(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle)
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
  if (intervalHandle) {
    clearInterval(intervalHandle)
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
  INTERVAL_MS: DEFAULT_INTERVAL_MS,
} as const

// Avoid unused-import lint noise: keep isEnvTruthy reachable for future opt-in
// alternative (PANDA_RSS_HEALTH=1 explicit on) without re-importing later.
void isEnvTruthy
