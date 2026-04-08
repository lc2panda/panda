// Input: SmartCronTask definitions for scheduled autonomous work.
// Output: 8 builtin tasks with priority, skip conditions, and real actions.
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
    id: 'code-health',
    description: '代码健康检查 · Code health check',
    cron: '0 23 * * *',
    priority: 'low',
    enabled: true,
    condition: canRun,
    action: async () => {
      logForDebugging('[builtinTasks] code-health: running build check')
      try {
        const { execSync } = require('child_process')
        const output = execSync('bun run build 2>&1 || true', { encoding: 'utf-8', timeout: 60000 })
        const hasError = /error/i.test(output) && !/0 errors/i.test(output)
        logForDebugging(`[builtinTasks] code-health: build ${hasError ? 'FAILED' : 'OK'}`)
        if (hasError) {
          const { setWorkingMemory } = await import('../assistant/workingMemory.js')
          setWorkingMemory('code-health-failed', output.slice(-500))
        }
      } catch (e) {
        logForDebugging(`[builtinTasks] code-health failed: ${(e as Error).message}`)
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
        const { scanMdFiles, searchMemory } = await import('../memdir/memdir.js')
        const { getAutoMemPath } = await import('../memdir/paths.js')
        const memoryDir = getAutoMemPath()
        const files = scanMdFiles(memoryDir)
        // 预热搜索：对常见关键词执行一次搜索以验证索引完整性
        searchMemory('project', memoryDir, 1)
        logForDebugging(`[builtinTasks] memory-index-rebuild: indexed ${files.length} files`)
      } catch (e) {
        logForDebugging(`[builtinTasks] memory-index-rebuild failed: ${(e as Error).message}`)
      }
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
        const { readFileSync, writeFileSync } = require('fs')
        const { mkdir } = require('fs/promises')
        const memoryDir = getAutoMemPath()
        const dreamsDir = join(memoryDir, 'dreams')
        const dreams = scanMdFiles(dreamsDir)

        // 读取最近 7 天的 dream 报告
        const weekAgo = Date.now() - 7 * 86400000
        const recentDreams = dreams.filter((f: string) => {
          const dateMatch = f.match(/(\d{4}-\d{2}-\d{2})\.md$/)
          return dateMatch && new Date(dateMatch[1]).getTime() >= weekAgo
        })

        if (recentDreams.length > 0) {
          const summaryLines: string[] = [`# 周报汇总 — ${new Date().toISOString().split('T')[0]}\n`]
          summaryLines.push(`本周 ${recentDreams.length} 份 DeepDream 报告:\n`)
          for (const f of recentDreams) {
            try {
              const content = readFileSync(f, 'utf-8') as string
              const dateName = f.split('/').pop()?.replace('.md', '') || ''
              // 提取每份报告的关键数据行
              const keyLines = content.split('\n').filter((l: string) => l.startsWith('- ')).slice(0, 5)
              summaryLines.push(`## ${dateName}`)
              summaryLines.push(keyLines.join('\n'))
              summaryLines.push('')
            } catch {}
          }
          await mkdir(join(memoryDir, 'working'), { recursive: true })
          writeFileSync(join(memoryDir, 'working', `weekly_summary_${new Date().toISOString().split('T')[0]}.md`), summaryLines.join('\n'), 'utf-8')
        }
        logForDebugging(`[builtinTasks] dream-report-summary: summarized ${recentDreams.length} of ${dreams.length} reports`)
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
