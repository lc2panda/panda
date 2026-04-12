// Input: proactive task list (ProactiveTask[]) + 磁盘上的 task-exec-history.json
// Output: 立即补跑"今天应该已经触发但错过"的每日定时 task，返回补跑的 id 列表
// Pos: proactive/ 启动补跑层，由 activateProactive() 末尾 fire-and-forget 调用
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import type { ProactiveTask } from './taskRegistry.js'
import { logForDebugging } from '../utils/debug.js'
import { getDefaultOnScenarios } from './proactiveConfig.js'

/**
 * exec-history 磁盘文件路径，必须与 nightMode.ts 中的 _EXEC_HISTORY_PATH 保持一致。
 */
function execHistoryPath(): string {
  return join(homedir(), '.pandacc', 'data', 'task-exec-history.json')
}

/**
 * 读取 task 最后执行时间戳映射。文件缺失或损坏时返回空 Map。
 */
function loadExecHistory(): Map<string, number> {
  const map = new Map<string, number>()
  try {
    const path = execHistoryPath()
    if (!existsSync(path)) return map
    const content = readFileSync(path, 'utf-8')
    const parsed = JSON.parse(content) as Array<[string, number]>
    if (!Array.isArray(parsed)) return map
    for (const entry of parsed) {
      if (!Array.isArray(entry) || entry.length !== 2) continue
      const [taskId, ts] = entry
      if (typeof taskId === 'string' && typeof ts === 'number') {
        map.set(taskId, ts)
      }
    }
  } catch {
    // 损坏或权限问题一律返回空 Map，降级为"全部视为未执行"
  }
  return map
}

/**
 * 今天 00:00 本地时间的时间戳。
 */
function todayStart(now: Date): number {
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/**
 * 判断 task 在今天 00:00 之后是否已被执行过。
 */
function hasRunToday(taskId: string, execHistory: Map<string, number>, now: Date): boolean {
  const lastRun = execHistory.get(taskId)
  if (typeof lastRun !== 'number') return false
  return lastRun >= todayStart(now)
}

/**
 * 判断 cron 表达式今天是否"应该已经触发"。
 *
 * 只处理最简单的"日内固定时间点"格式：
 *   "M H * * *"  — 每天 H:M（dow 可为 *）
 *   "M H * * D"  — 每周 D 的 H:M，仅当今天正好是 D 时补跑
 *
 * 以下格式一律不补跑（返回 false），等下次自然 tick：
 *   - 频繁触发（如 '*\/5 * * * *'）— 下一次触发 <= 几分钟，无补跑必要
 *   - 按月/日限定（dom / month 非 *）— 语义复杂，不冒险
 *   - hour/minute 带 ',' 或 '/' — 多触发点，不做补跑
 */
function shouldHaveRunToday(cron: string | undefined, now: Date): boolean {
  if (!cron || typeof cron !== 'string') return false
  const parts = cron.trim().split(/\s+/)
  if (parts.length !== 5) return false

  const [minStr, hourStr, domStr, monStr, dowStr] = parts

  // 按日 / 按月限定：直接放弃
  if (domStr !== '*' || monStr !== '*') return false

  // hour / minute 必须为单一数字（排除 *, */N, 列表 M1,M2, 范围 A-B）
  if (!/^\d+$/.test(hourStr) || !/^\d+$/.test(minStr)) return false

  const hour = parseInt(hourStr, 10)
  const minute = parseInt(minStr, 10)
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return false

  // dow 必须是 * 或今天对应的单一数字（0=周日）
  if (dowStr !== '*') {
    if (!/^\d+$/.test(dowStr)) return false
    const dow = parseInt(dowStr, 10)
    if (dow !== now.getDay()) return false
  }

  // 今天 H:M 时间点
  const triggerToday = new Date(now)
  triggerToday.setHours(hour, minute, 0, 0)

  // 还没到触发时刻 → 今天不该跑
  if (triggerToday.getTime() > now.getTime()) return false

  return true
}

/**
 * 主函数：扫描 tasks，补跑"今天应跑却没跑"的安全清单内定时 task。
 *
 * 准入规则（必须全部满足）：
 *   1. task.enabled !== false
 *   2. task.id 在 DEFAULT_ON_SAFE_SCENARIOS 白名单内（和 P1-1 联动，避免补跑冲击）
 *   3. task.cron 是日内固定时间点（详见 shouldHaveRunToday）
 *   4. 今天尚未执行过（hasRunToday === false）
 *   5. task.condition() 满足（或未定义）
 *
 * 执行以 try/catch 隔离，单个 task 失败不影响其他。失败的 task 不计入返回列表。
 *
 * @returns 已补跑的 task id 列表
 */
export async function runCatchup(
  tasks: ReadonlyArray<ProactiveTask>,
): Promise<string[]> {
  const now = new Date()
  const execHistory = loadExecHistory()
  const safeList = new Set(getDefaultOnScenarios())
  const caughtUp: string[] = []

  for (const task of tasks) {
    try {
      if (!task || typeof task.id !== 'string') continue
      if (task.enabled === false) continue

      // 只补跑 P1-1 安全清单内的 task，避免大规模补跑冲击
      if (!safeList.has(task.id)) continue

      if (!shouldHaveRunToday(task.cron, now)) continue
      if (hasRunToday(task.id, execHistory, now)) continue

      // condition gate（例如 canRun / isScenarioEnabled）
      if (task.condition) {
        let ok = false
        try {
          ok = task.condition() === true
        } catch {
          ok = false
        }
        if (!ok) continue
      }

      logForDebugging(`[catchupRunner] running missed task: ${task.id}`)
      try {
        await task.action()
        caughtUp.push(task.id)
      } catch (e) {
        const msg = (e as Error)?.message ?? String(e)
        if (msg.includes('__SKIPPED__')) {
          logForDebugging(`[catchupRunner] ${task.id} skipped via skipIf`)
        } else {
          logForDebugging(`[catchupRunner] ${task.id} failed: ${msg}`)
        }
      }
    } catch {
      // 整个 task 处理流程级别的兜底，确保循环不中断
    }
  }

  if (caughtUp.length > 0) {
    logForDebugging(
      `[catchupRunner] caught up ${caughtUp.length} missed task(s): ${caughtUp.join(', ')}`,
    )
  } else {
    logForDebugging('[catchupRunner] nothing to catch up')
  }

  return caughtUp
}

/**
 * 暴露内部判定给测试使用（仅 test 导入）。
 */
export const __internals = {
  shouldHaveRunToday,
  hasRunToday,
  loadExecHistory,
  todayStart,
}
