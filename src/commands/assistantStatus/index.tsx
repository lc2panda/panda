// Input: no args
// Output: system message with full super-assistant runtime status (text panel)
// Pos: /assistant-status slash command — surfaces proactive + outbox + recent task health at a glance

import { feature } from 'bun:bundle'
import type { Command, LocalJSXCommandContext, LocalJSXCommandOnDone } from '../../types/command.js'

interface RecentExec {
  taskId: string
  ts: Date
}

interface StatusSnapshot {
  proactiveActive: boolean
  proactivePaused: boolean
  totalRegisteredTasks: number
  builtinTaskCount: number
  recentExecutions: RecentExec[]
  outboxTotal: number
  outboxUnseen: number
  enabledScenarios: number
  highPrivacyScenarios: number
  notes: string[]
}

async function collectStatus(): Promise<StatusSnapshot> {
  const notes: string[] = []

  // proactive state
  let proactiveActive = false
  let proactivePaused = false
  try {
    const mod = (await import('../../proactive/index.js')) as {
      isProactiveActive?: () => boolean
      isProactivePaused?: () => boolean
    }
    if (typeof mod.isProactiveActive === 'function') {
      proactiveActive = mod.isProactiveActive()
    }
    if (typeof mod.isProactivePaused === 'function') {
      proactivePaused = mod.isProactivePaused()
    }
  } catch (e) {
    notes.push(`proactive module unavailable: ${(e as Error).message}`)
  }

  // registered tasks (runtime map, reflects what's actually registered)
  let totalRegisteredTasks = 0
  try {
    const mod = (await import('../../proactive/taskRegistry.js')) as {
      getAllTasks?: () => Array<{ id: string }>
    }
    if (typeof mod.getAllTasks === 'function') {
      totalRegisteredTasks = mod.getAllTasks().length
    }
  } catch {
    /* registry empty or unavailable */
  }

  // builtin task count
  let builtinTaskCount = 0
  try {
    const mod = (await import('../../proactive/builtinTasks.js')) as {
      BUILTIN_TASKS?: Array<{ id: string }>
    }
    if (Array.isArray(mod.BUILTIN_TASKS)) {
      builtinTaskCount = mod.BUILTIN_TASKS.length
    }
  } catch {
    /* module unavailable */
  }

  // recent executions from ~/.pandacc/data/task-exec-history.json
  const recentExecutions: RecentExec[] = []
  try {
    const { readFileSync, existsSync } = await import('fs')
    const { join } = await import('path')
    const { homedir } = await import('os')
    const path = join(homedir(), '.pandacc', 'data', 'task-exec-history.json')
    if (existsSync(path)) {
      const content = readFileSync(path, 'utf-8')
      const parsed = JSON.parse(content) as unknown
      // Expected shape: Array<[taskId, ts]>
      if (Array.isArray(parsed)) {
        const cutoff = Date.now() - 24 * 60 * 60 * 1000
        for (const entry of parsed) {
          if (
            Array.isArray(entry) &&
            entry.length >= 2 &&
            typeof entry[0] === 'string' &&
            typeof entry[1] === 'number' &&
            entry[1] >= cutoff
          ) {
            recentExecutions.push({ taskId: entry[0], ts: new Date(entry[1]) })
          }
        }
        recentExecutions.sort((a, b) => b.ts.getTime() - a.ts.getTime())
      }
    }
  } catch (e) {
    notes.push(`task-exec-history read failed: ${(e as Error).message}`)
  }

  // outbox stats — prefer Nu's getOutboxStats, fall back to direct jsonl count
  let outboxTotal = 0
  let outboxUnseen = 0
  let outboxSourced = false
  try {
    const mod = (await import('../../assistant/notificationCatchup.js')) as {
      getOutboxStats?: () => { total: number; unseen: number; seenCount: number }
    }
    if (typeof mod.getOutboxStats === 'function') {
      const stats = mod.getOutboxStats()
      outboxTotal = stats.total
      outboxUnseen = stats.unseen
      outboxSourced = true
    }
  } catch {
    /* fall through to fallback */
  }
  if (!outboxSourced) {
    try {
      const { readFileSync, existsSync } = await import('fs')
      const { join } = await import('path')
      const { homedir } = await import('os')
      const path = join(
        homedir(),
        '.pandacc',
        'channels',
        'outbox',
        'notifications.jsonl',
      )
      if (existsSync(path)) {
        const content = readFileSync(path, 'utf-8')
        outboxTotal = content.split('\n').filter(l => l.trim().length > 0).length
        outboxUnseen = outboxTotal
        notes.push('outbox stats via fallback (notificationCatchup unavailable)')
      }
    } catch {
      /* no outbox */
    }
  }

  // scenario counts — from ~/.pandacc/config/proactive.json
  let enabledScenarios = 0
  try {
    const { readFileSync, existsSync } = await import('fs')
    const { join } = await import('path')
    const { homedir } = await import('os')
    const configPath = join(homedir(), '.pandacc', 'config', 'proactive.json')
    if (existsSync(configPath)) {
      const parsed = JSON.parse(readFileSync(configPath, 'utf-8')) as {
        enabledScenarios?: Record<string, unknown>
      }
      if (parsed.enabledScenarios && typeof parsed.enabledScenarios === 'object') {
        for (const v of Object.values(parsed.enabledScenarios)) {
          if (v === true) enabledScenarios += 1
        }
      }
    }
  } catch {
    /* no proactive config */
  }

  // HIGH_PRIVACY_SCENARIOS is not exported from proactiveConfig.ts.
  // Count by reading the source (dev mode) or fall back to a known constant.
  // The scenarios list is stable in the current build — we surface what
  // we can without hard-coding.
  let highPrivacyScenarios = 0
  try {
    const mod = (await import('../../proactive/proactiveConfig.js')) as {
      HIGH_PRIVACY_SCENARIOS?: Set<string> | string[]
    }
    const hp = mod.HIGH_PRIVACY_SCENARIOS
    if (hp instanceof Set) {
      highPrivacyScenarios = hp.size
    } else if (Array.isArray(hp)) {
      highPrivacyScenarios = hp.length
    }
  } catch {
    /* export not available */
  }

  return {
    proactiveActive,
    proactivePaused,
    totalRegisteredTasks,
    builtinTaskCount,
    recentExecutions,
    outboxTotal,
    outboxUnseen,
    enabledScenarios,
    highPrivacyScenarios,
    notes,
  }
}

function formatAbsoluteTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function padRight(s: string, width: number): string {
  // rough monospace padding — good enough for ASCII task ids
  const len = s.length
  if (len >= width) return s
  return s + ' '.repeat(width - len)
}

function renderStatusText(snapshot: StatusSnapshot): string {
  const lines: string[] = []
  lines.push('超级助手 · 运行状态')
  lines.push('────────────────────────────────────')

  const activeLabel = snapshot.proactiveActive
    ? snapshot.proactivePaused
      ? '● 已激活（已暂停）'
      : '● 已激活'
    : '○ 未激活'
  lines.push(`激活状态      : ${activeLabel}`)

  const taskCount = snapshot.totalRegisteredTasks || snapshot.builtinTaskCount
  const taskSuffix =
    snapshot.totalRegisteredTasks > 0
      ? `（registry 实时；builtin 基线 ${snapshot.builtinTaskCount}）`
      : snapshot.builtinTaskCount > 0
        ? '（builtin 基线，registry 尚未填充）'
        : '（无数据）'
  lines.push(`已注册任务数  : ${taskCount} ${taskSuffix}`)

  const hpSuffix =
    snapshot.highPrivacyScenarios > 0
      ? `  (高隐私默认关 ${snapshot.highPrivacyScenarios})`
      : ''
  lines.push(`启用的场景    : ${snapshot.enabledScenarios}${hpSuffix}`)

  const unseenMark = snapshot.outboxUnseen > 0 ? '⚠' : '✓'
  lines.push(
    `Outbox 通知   : ${snapshot.outboxTotal} 总 / ${snapshot.outboxUnseen} 未读 ${unseenMark}`,
  )

  lines.push('')
  lines.push(`最近 24h 执行的任务 (${snapshot.recentExecutions.length}):`)
  if (snapshot.recentExecutions.length === 0) {
    lines.push('  (暂无记录 — 可能 panda 刚启动，或定时器尚未触发)')
  } else {
    for (const e of snapshot.recentExecutions.slice(0, 12)) {
      lines.push(`  · ${padRight(e.taskId, 30)} ${formatAbsoluteTime(e.ts)}`)
    }
    if (snapshot.recentExecutions.length > 12) {
      lines.push(`  … +${snapshot.recentExecutions.length - 12} more`)
    }
  }

  if (snapshot.notes.length > 0) {
    lines.push('')
    lines.push('备注:')
    for (const n of snapshot.notes) {
      lines.push(`  · ${n}`)
    }
  }

  lines.push('')
  lines.push('提示: `/assistant` 切换助手模式；`/assistant-status` 随时查看本面板')
  return lines.join('\n')
}

const assistantStatus = {
  type: 'local-jsx',
  name: 'assistant-status',
  description:
    'Show super-assistant runtime status · 查看超级助手运行状态（激活/任务/通知）',
  isEnabled: () => {
    if (feature('KAIROS')) return true
    return false
  },
  immediate: true,
  load: () =>
    Promise.resolve({
      async call(
        onDone: LocalJSXCommandOnDone,
        _context: LocalJSXCommandContext,
      ): Promise<null> {
        try {
          const snapshot = await collectStatus()
          const text = renderStatusText(snapshot)
          onDone(text, { display: 'system' })
        } catch (e) {
          onDone(
            `assistant-status failed to collect snapshot: ${(e as Error).message}`,
            { display: 'system' },
          )
        }
        return null
      },
    }),
} satisfies Command

export default assistantStatus
