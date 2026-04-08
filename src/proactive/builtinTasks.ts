// Input: SmartCronTask definitions for scheduled autonomous work.
// Output: 核心内置任务 + Phase 1~4 场景模块（系统健康/开发/文件/个人生活/安全/效率/高级系统/高级文件/通信/扩展）
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
  // ─── 日历事件主动提醒 ───
  {
    id: 'calendar-reminder',
    description: '日历事件提醒 · Calendar event reminder',
    cron: '*/30 * * * *', // 每 30 分钟扫描一次
    priority: 'critical',
    enabled: true,
    condition: () => true, // 始终启用，不依赖 proactive 模式
    action: async () => {
      logForDebugging('[builtinTasks] calendar-reminder: scanning upcoming events')
      try {
        const { readCalendarEvents } = await import('../memdir/memdir.js')
        const events = await readCalendarEvents(1) // 未来 1 天
        if (events.length === 0) return

        const now = Date.now()
        for (const evt of events) {
          // 解析事件开始时间
          let evtTime: number | null = null
          try {
            evtTime = new Date(evt.startDate).getTime()
          } catch {
            // AppleScript 返回的日期格式可能不标准，尝试其他解析
            try {
              const { execSync } = require('child_process')
              const parsed = execSync(
                `date -j -f "%A, %B %e, %Y at %I:%M:%S %p" "${evt.startDate}" "+%s" 2>/dev/null || date -j -f "%Y年%m月%d日 %A %H:%M:%S" "${evt.startDate}" "+%s" 2>/dev/null`,
                { encoding: 'utf-8', timeout: 3000 },
              ).trim()
              if (parsed) evtTime = parseInt(parsed, 10) * 1000
            } catch {}
          }
          if (!evtTime || isNaN(evtTime)) continue

          const minutesBefore = (evtTime - now) / 60000

          // 提前 30 分钟和 10 分钟各提醒一次
          if ((minutesBefore > 8 && minutesBefore <= 30) ||
              (minutesBefore > 0 && minutesBefore <= 10)) {
            const { pushNotification } = await import('../assistant/sense.js')
            const timeLabel = minutesBefore <= 10
              ? `${Math.round(minutesBefore)} 分钟后`
              : `${Math.round(minutesBefore)} 分钟后`
            const body = `${timeLabel}：${evt.title}${evt.location ? ` @ ${evt.location}` : ''}`

            // 系统通知（macOS）
            pushNotification({
              type: 'action',
              title: '📅 日历提醒',
              body,
              channel: 'all',
            })

            // 同时记录到工作记忆，下次对话时模型可见
            try {
              const { setWorkingMemory } = await import('../assistant/workingMemory.js')
              setWorkingMemory(`calendar-upcoming-${evt.title.slice(0, 20)}`, {
                title: evt.title,
                startDate: evt.startDate,
                location: evt.location,
                minutesBefore: Math.round(minutesBefore),
              })
            } catch {}

            logForDebugging(`[builtinTasks] calendar-reminder: notified "${evt.title}" in ${Math.round(minutesBefore)}min`)
          }
        }
      } catch (e) {
        logForDebugging(`[builtinTasks] calendar-reminder failed: ${(e as Error).message}`)
      }
    },
  },
  // ─── Git 长时间未提交提醒 ───
  {
    id: 'git-uncommitted-reminder',
    description: 'Git 未提交提醒 · Uncommitted changes reminder',
    cron: '0 */1 * * *', // 每小时检查一次
    priority: 'normal',
    enabled: true,
    condition: () => true,
    action: async () => {
      logForDebugging('[builtinTasks] git-uncommitted-reminder: checking')
      try {
        const { execSync } = require('child_process')
        const status = execSync('git status --porcelain', { encoding: 'utf-8', timeout: 3000 })
        const changedFiles = status.split('\n').filter(Boolean).length
        if (changedFiles === 0) return

        const lastCommitTime = execSync('git log -1 --format=%ct', { encoding: 'utf-8', timeout: 3000 }).trim()
        const elapsed = Date.now() - parseInt(lastCommitTime, 10) * 1000
        const threeHours = 3 * 60 * 60 * 1000

        if (elapsed > threeHours) {
          const { pushNotification } = await import('../assistant/sense.js')
          pushNotification({
            type: 'warning',
            title: '⚠️ Git 提醒',
            body: `${changedFiles} 个文件未提交，距上次 commit 已 ${Math.round(elapsed / 3600000)} 小时`,
            channel: 'all',
          })
        }
      } catch (e) {
        logForDebugging(`[builtinTasks] git-uncommitted-reminder failed: ${(e as Error).message}`)
      }
    },
  },
  // ─── 记忆画像过期提醒 ───
  {
    id: 'profile-stale-reminder',
    description: '画像过期提醒 · Profile staleness reminder',
    cron: '0 9 * * *', // 每天早上 9 点检查一次
    priority: 'low',
    enabled: true,
    condition: canRun,
    action: async () => {
      logForDebugging('[builtinTasks] profile-stale-reminder: checking')
      try {
        const { getAutoMemPath } = await import('../memdir/paths.js')
        const { statSync: statSyncFs } = require('fs')
        const { join } = require('path')
        const memDir = getAutoMemPath()
        const profilePath = join(memDir, 'semantic', 'profile.md')
        const stat = statSyncFs(profilePath)
        const daysSince = (Date.now() - stat.mtimeMs) / (1000 * 60 * 60 * 24)

        if (daysSince > 14) {
          const { pushNotification } = await import('../assistant/sense.js')
          pushNotification({
            type: 'info',
            title: '🧠 记忆提醒',
            body: `用户画像已 ${Math.round(daysSince)} 天未更新，建议在下次会话中运行 /dream`,
            channel: 'all',
          })
        }
      } catch (e) {
        logForDebugging(`[builtinTasks] profile-stale-reminder failed: ${(e as Error).message}`)
      }
    },
  },
]

// ═══════════════════════════════════════════════════════════════════
// 场景模块：动态加载扩展场景（Phase 1 / 2 / 3）
// 新增场景请在 src/proactive/tasks/ 下创建模块，在此处注册
// ═══════════════════════════════════════════════════════════════════

function loadScenarioModules(): SmartCronTask[] {
  const extra: SmartCronTask[] = []
  // 每个模块独立 try/catch，单个模块加载失败不影响其他
  const modules = [
    // Phase 1
    { path: './tasks/systemHealth.js', getter: 'getSystemHealthTasks' },
    { path: './tasks/personalLife.js', getter: 'getPersonalLifeTasks' },
    { path: './tasks/devScenarios.js', getter: 'getDevTasks' },
    { path: './tasks/fileScenarios.js', getter: 'getFileTasks' },
    // Phase 2
    { path: './tasks/securityScenarios.js', getter: 'getSecurityTasks' },
    { path: './tasks/efficiencyScenarios.js', getter: 'getEfficiencyTasks' },
    // Phase 3
    { path: './tasks/advancedSystem.js', getter: 'getAdvancedSystemTasks' },
    { path: './tasks/advancedFiles.js', getter: 'getAdvancedFileTasks' },
    // Phase 4
    { path: './tasks/communicationScenarios.js', getter: 'getCommunicationTasks' },
    { path: './tasks/extendedScenarios.js', getter: 'getExtendedTasks' },
    { path: './tasks/knowledgeScenarios.js', getter: 'getKnowledgeTasks' },
    { path: './tasks/lifestyleScenarios.js', getter: 'getLifestyleTasks' },
    // Phase 5: 通知感知
    { path: './tasks/notificationScenarios.js', getter: 'getNotificationTasks' },
    // Phase 6: IM 聚合
    { path: './tasks/imScenarios.js', getter: 'getIMTasks' },
  ]
  for (const { path, getter } of modules) {
    try {
      const mod = require(path) as Record<string, () => SmartCronTask[]>
      if (mod[getter]) extra.push(...mod[getter]())
    } catch (e) {
      logForDebugging(`[builtinTasks] 场景模块 ${path} 加载失败: ${(e as Error).message}`)
    }
  }
  return extra
}

// 合并核心任务 + 场景模块
const ALL_TASKS: SmartCronTask[] = [...SMART_CRON_TASKS, ...loadScenarioModules()]

// 导出兼容 ProactiveTask[] 接口（skipIf 在 action 中内部处理）
export const BUILTIN_TASKS: ProactiveTask[] = ALL_TASKS.map(task => ({
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
