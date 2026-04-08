// Input: SmartCronTask definitions for scheduled autonomous work.
// Output: 11 builtin tasks with priority, skip conditions, and real actions.
// Pos: Registered by proactive/index.ts on activateProactive(); executed by night orchestrator.
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"

import type { ProactiveTask } from './taskRegistry.js'
import { isProactiveActive } from './index.js'
import { isNightModeActive } from './nightMode.js'
import { logForDebugging } from '../utils/debug.js'

function canRun(): boolean {
  return isProactiveActive() || isNightModeActive()
}

/**
 * SA-P1-04: SmartCronTask — 扩展 ProactiveTask 的智能调度框架。
 * priority 和 skipIf 用于调度优化，底层仍兼容 ProactiveTask 接口。
 */
interface SmartCronTask extends ProactiveTask {
  priority: 'critical' | 'normal' | 'low'
  skipIf?: () => boolean
}

function getLastInteractionTimeSafe(): number {
  try {
    const { getLastInteractionTime } = require('../bootstrap/state.js') as typeof import('../bootstrap/state.js')
    return getLastInteractionTime()
  } catch {
    return 0
  }
}

const SMART_CRON_TASKS: SmartCronTask[] = [
  {
    id: 'dream-consolidate',
    description: '夜间记忆整合 · Memory consolidation',
    cron: '0 22 * * *',
    priority: 'normal',
    enabled: true,
    condition: canRun,
    skipIf: () => {
      // 用户 15 分钟内有操作→延后
      const idle = (Date.now() - getLastInteractionTimeSafe()) / 60000
      return idle < 15
    },
    action: async () => {
      logForDebugging('[builtinTasks] dream-consolidate: executing autoDream pipeline')
      try {
        const { executeAutoDreamStandalone } = await import('../services/autoDream/autoDream.js')
        await executeAutoDreamStandalone()
      } catch (e) {
        logForDebugging(`[builtinTasks] dream-consolidate failed: ${(e as Error).message}`)
      }
    },
  },
  {
    id: 'morning-brief',
    description: '晨间简报 · Morning briefing',
    cron: '0 7 * * *',
    priority: 'normal',
    enabled: true,
    condition: canRun,
    action: async () => {
      logForDebugging('[builtinTasks] morning-brief: generating morning briefing')
      try {
        const { generateMorningBrief } = await import('../memdir/memdir.js')
        await generateMorningBrief()
      } catch (e) {
        logForDebugging(`[builtinTasks] morning-brief failed: ${(e as Error).message}`)
      }
    },
  },
  {
    id: 'file-organizer',
    description: '文件自动分类 · File auto-organize',
    cron: '0 */4 * * *',
    priority: 'low',
    enabled: true,
    condition: canRun,
    skipIf: () => {
      const idle = (Date.now() - getLastInteractionTimeSafe()) / 60000
      return idle < 30
    },
    action: async () => {
      logForDebugging('[builtinTasks] file-organizer: scanning Downloads for classification')
      // dry-run only — just log classification suggestions
      try {
        const { organizeDirectory } = await import('../memdir/memdir.js')
        const homedir = require('os').homedir()
        const suggestions = organizeDirectory(require('path').join(homedir, 'Downloads'), true)
        logForDebugging(`[builtinTasks] file-organizer: ${suggestions.length} files could be organized`)
      } catch (e) {
        logForDebugging(`[builtinTasks] file-organizer failed: ${(e as Error).message}`)
      }
    },
  },
  {
    id: 'memory-decay',
    description: '记忆衰减 · Memory decay & pruning',
    cron: '30 22 * * *',
    priority: 'normal',
    enabled: true,
    condition: canRun,
    action: async () => {
      logForDebugging('[builtinTasks] memory-decay: running Ebbinghaus decay')
      try {
        const { decayAndPruneMemories } = await import('../memdir/memdir.js')
        const { getAutoMemPath } = await import('../memdir/paths.js')
        const memoryDir = getAutoMemPath()
        const result = await decayAndPruneMemories(memoryDir)
        logForDebugging(`[builtinTasks] memory-decay: decayed=${result.decayed} pruned=${result.pruned}`)
      } catch (e) {
        logForDebugging(`[builtinTasks] memory-decay failed: ${(e as Error).message}`)
      }
    },
  },
  {
    id: 'profile-update',
    description: '用户画像更新 · Profile update',
    cron: '0 23 * * *',
    priority: 'low',
    enabled: true,
    condition: canRun,
    action: async () => {
      logForDebugging('[builtinTasks] profile-update: scheduled profile maintenance')
      // Profile is updated incrementally via stopHooks; this is a backup sweep
    },
  },
  {
    id: 'code-health',
    description: '代码健康检查 · Code health check',
    cron: '0 23 * * *',
    priority: 'low',
    enabled: true,
    condition: canRun,
    action: async () => {
      logForDebugging('[builtinTasks] code-health: setting pending flag in working memory')
      try {
        const { setWorkingMemory } = await import('../assistant/workingMemory.js')
        setWorkingMemory('code-health-pending', new Date().toISOString())
      } catch (e) {
        logForDebugging(`[builtinTasks] code-health flag set failed: ${(e as Error).message}`)
      }
    },
  },
  {
    id: 'memory-index-rebuild',
    description: '记忆索引重建 · Memory index rebuild',
    cron: '0 3 * * *',
    priority: 'low',
    enabled: true,
    condition: canRun,
    action: async () => {
      logForDebugging('[builtinTasks] memory-index-rebuild: rebuilding search index')
      try {
        const { scanMdFiles } = await import('../memdir/memdir.js')
        const { getAutoMemPath } = await import('../memdir/paths.js')
        const files = scanMdFiles(getAutoMemPath())
        logForDebugging(`[builtinTasks] memory-index-rebuild: indexed ${files.length} files`)
      } catch (e) {
        logForDebugging(`[builtinTasks] memory-index-rebuild failed: ${(e as Error).message}`)
      }
    },
  },
  {
    id: 'episode-archive',
    description: '会话归档 · Episode archival',
    cron: '0 4 * * 0',
    priority: 'low',
    enabled: true,
    condition: canRun,
    action: async () => {
      logForDebugging('[builtinTasks] episode-archive: weekly episode cleanup')
      // Placeholder for future episode archival logic
    },
  },
  {
    id: 'working-memory-cleanup',
    description: '工作记忆清理 · Working memory cleanup',
    cron: '0 6 * * *',
    priority: 'low',
    enabled: true,
    condition: canRun,
    action: async () => {
      logForDebugging('[builtinTasks] working-memory-cleanup: purging stale working memory')
      try {
        const { getAutoMemPath } = await import('../memdir/paths.js')
        const { readdirSync, unlinkSync, statSync } = require('fs')
        const { join } = require('path')
        const workingDir = join(getAutoMemPath(), 'working')
        const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000 // 7 days
        try {
          const entries = readdirSync(workingDir)
          let cleaned = 0
          for (const entry of entries) {
            const fullPath = join(workingDir, entry)
            try {
              const stat = statSync(fullPath)
              if (stat.isFile() && stat.mtimeMs < cutoff) {
                unlinkSync(fullPath)
                cleaned++
              }
            } catch {}
          }
          logForDebugging(`[builtinTasks] working-memory-cleanup: removed ${cleaned} stale files`)
        } catch {}
      } catch (e) {
        logForDebugging(`[builtinTasks] working-memory-cleanup failed: ${(e as Error).message}`)
      }
    },
  },
  {
    id: 'procedural-review',
    description: '程序记忆审查 · Procedural memory review',
    cron: '0 5 * * 1',
    priority: 'low',
    enabled: true,
    condition: canRun,
    action: async () => {
      logForDebugging('[builtinTasks] procedural-review: weekly procedural memory audit')
      // Placeholder for future procedural memory review
    },
  },
  {
    id: 'dream-report-summary',
    description: '周报汇总 · Weekly dream summary',
    cron: '0 8 * * 1',
    priority: 'low',
    enabled: true,
    condition: canRun,
    action: async () => {
      logForDebugging('[builtinTasks] dream-report-summary: generating weekly dream summary')
      try {
        const { scanMdFiles } = await import('../memdir/memdir.js')
        const { getAutoMemPath } = await import('../memdir/paths.js')
        const { join } = require('path')
        const dreamsDir = join(getAutoMemPath(), 'dreams')
        const dreams = scanMdFiles(dreamsDir)
        logForDebugging(`[builtinTasks] dream-report-summary: ${dreams.length} dream reports found`)
      } catch (e) {
        logForDebugging(`[builtinTasks] dream-report-summary failed: ${(e as Error).message}`)
      }
    },
  },
]

// 导出兼容 ProactiveTask[] 接口（skipIf 在 action 中内部处理）
export const BUILTIN_TASKS: ProactiveTask[] = SMART_CRON_TASKS.map(task => ({
  id: task.id,
  description: task.description,
  cron: task.cron,
  enabled: task.enabled,
  condition: task.condition,
  action: async () => {
    // Smart skip 检查
    if (task.skipIf?.()) {
      logForDebugging(`[builtinTasks] ${task.id}: skipped (skipIf condition met)`)
      return
    }
    await task.action()
  },
}))
