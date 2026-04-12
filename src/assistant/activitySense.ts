// Input: git 状态、系统时间、工具调用事件、工作目录
// Output: 活跃感知对象（git状态 + 活跃时段 + 常用工具 + 项目切换）
// Pos: assistant/sense.ts 的数据源之一，被 getSenseContext() 调用
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的md。

import { execSync } from 'child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

// ─────────────────────────────────────────────────────────────────────
// 持久化路径与类型
// ─────────────────────────────────────────────────────────────────────

const PERSIST_DIR = join(homedir(), '.pandacc', 'assistant')
const STATS_PATH = join(PERSIST_DIR, 'activity-stats.json')

interface ActivityStats {
  /** 按小时 (0-23) 统计调用次数 */
  hourlyHits: number[]
  /** 工具使用计数 { toolName: count } */
  toolUsage: Record<string, number>
  /** 最近项目路径列表（最新在前，去重，最多 20 条） */
  recentProjects: string[]
  /** 上次持久化时间 (epoch ms) */
  lastSaved: number
}

// ─────────────────────────────────────────────────────────────────────
// 内存缓存 + 懒加载
// ─────────────────────────────────────────────────────────────────────

let _stats: ActivityStats | null = null

function defaultStats(): ActivityStats {
  return {
    hourlyHits: new Array(24).fill(0),
    toolUsage: {},
    recentProjects: [],
    lastSaved: 0,
  }
}

function loadStats(): ActivityStats {
  if (_stats) return _stats
  try {
    const raw = readFileSync(STATS_PATH, 'utf-8')
    const parsed = JSON.parse(raw) as Partial<ActivityStats>
    _stats = {
      hourlyHits: Array.isArray(parsed.hourlyHits) && parsed.hourlyHits.length === 24
        ? parsed.hourlyHits
        : new Array(24).fill(0),
      toolUsage: parsed.toolUsage && typeof parsed.toolUsage === 'object'
        ? parsed.toolUsage as Record<string, number>
        : {},
      recentProjects: Array.isArray(parsed.recentProjects) ? parsed.recentProjects : [],
      lastSaved: typeof parsed.lastSaved === 'number' ? parsed.lastSaved : 0,
    }
  } catch {
    _stats = defaultStats()
  }
  return _stats
}

function saveStats(): void {
  const stats = loadStats()
  stats.lastSaved = Date.now()
  try {
    mkdirSync(PERSIST_DIR, { recursive: true })
    writeFileSync(STATS_PATH, JSON.stringify(stats, null, 2))
  } catch {
    // 静默忽略写入错误
  }
}

// ─────────────────────────────────────────────────────────────────────
// 公共 API：记录工具使用（供外部模块调用）
// ─────────────────────────────────────────────────────────────────────

/**
 * 记录一次工具使用。可由 tool 执行层调用。
 */
export function recordToolUsage(toolName: string): void {
  if (!toolName) return
  const stats = loadStats()
  stats.toolUsage[toolName] = (stats.toolUsage[toolName] || 0) + 1
  saveStats()
}

// ─────────────────────────────────────────────────────────────────────
// 内部：记录活跃时段 + 项目切换
// ─────────────────────────────────────────────────────────────────────

function recordHourlyHit(): void {
  const stats = loadStats()
  const hour = new Date().getHours()
  stats.hourlyHits[hour] = (stats.hourlyHits[hour] || 0) + 1
}

function recordProjectSwitch(cwd: string): void {
  if (!cwd) return
  const stats = loadStats()
  // 去重：若已存在则移到最前面
  stats.recentProjects = stats.recentProjects.filter(p => p !== cwd)
  stats.recentProjects.unshift(cwd)
  // 限制 20 条
  if (stats.recentProjects.length > 20) {
    stats.recentProjects = stats.recentProjects.slice(0, 20)
  }
}

// ─────────────────────────────────────────────────────────────────────
// 派生数据：活跃时段 + Top 工具
// ─────────────────────────────────────────────────────────────────────

/**
 * 返回活跃度最高的时段（按 hit 降序，取 top 3）。
 */
function getActiveHours(): { hour: number; hits: number }[] {
  const stats = loadStats()
  return stats.hourlyHits
    .map((hits, hour) => ({ hour, hits }))
    .filter(e => e.hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .slice(0, 3)
}

/**
 * 返回最常用的 5 个工具。
 */
function getTopTools(): { tool: string; count: number }[] {
  const stats = loadStats()
  return Object.entries(stats.toolUsage)
    .map(([tool, count]) => ({ tool, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
}

// ─────────────────────────────────────────────────────────────────────
// 主函数（向后兼容：原有 3 字段保留）
// ─────────────────────────────────────────────────────────────────────

export function getActivitySense() {
  let gitBranch = ''
  let hasUncommitted = false

  try {
    gitBranch = execSync('git rev-parse --abbrev-ref HEAD', {
      encoding: 'utf-8',
      timeout: 3000,
    }).trim()
    const status = execSync('git status --porcelain', {
      encoding: 'utf-8',
      timeout: 3000,
    }).trim()
    hasUncommitted = status.length > 0
  } catch {}

  const cwd = process.cwd()

  // 每次调用都记录活跃数据
  recordHourlyHit()
  recordProjectSwitch(cwd)
  saveStats()

  return {
    // 原有字段（向后兼容）
    gitBranch,
    hasUncommitted,
    cwd,
    // 新增：行为学习维度
    activeHours: getActiveHours(),
    topTools: getTopTools(),
    recentProjects: loadStats().recentProjects.slice(0, 10),
  }
}
