// Input: SmartCronTask definitions for scheduled autonomous work.
// Output: 核心内置任务（含前瞻记忆扫描） + Phase 1~4 场景模块（系统健康/开发/文件/个人生活/安全/效率/高级系统/高级文件/通信/扩展）
// Pos: Registered by proactive/index.ts on activateProactive(); executed by night orchestrator.
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"
//
// 2026-04-19 22:07 +08:00 P3-T4-γ 核心 SMART_CRON 漏接 10 项追加 panda-on-desk 接入：
//   git-uncommitted-badge / prospective-scan / file-organizer / working-memory-cleanup
//   memory-decay / memory-index-rebuild / dream-report-summary / profile-stale-reminder
//   code-health / clipboard-poll
//   严守 byte-equal — 只追加不替换 sense.pushNotification

import type { ProactiveTask } from './taskRegistry.js'
import { isProactiveActive } from './index.js'
import { isNightModeActive } from './nightMode.js'
import { localDateStr } from '../utils/date.js'
import { logForDebugging } from '../utils/debug.js'
import { platform } from 'os'
import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

// v2.12.1 hotfix: 静态 ESM import 替代 require('./tasks/xxx.js')
// 根因：Bun bundler 看不到运行时 require 的相对路径字符串，导致 dist 里
// 所有 15 个场景模块全部加载失败（静默 catch 吞异常 → 空数组），
// BUILTIN_TASKS 从 103 缩水到 13。改为静态 import 让 bundler 正确 resolve。
import { getSystemHealthTasks } from './tasks/systemHealth.js'
import { getPersonalLifeTasks } from './tasks/personalLife.js'
import { getDevTasks } from './tasks/devScenarios.js'
import { getFileTasks } from './tasks/fileScenarios.js'
import { getSecurityTasks } from './tasks/securityScenarios.js'
import { getEfficiencyTasks } from './tasks/efficiencyScenarios.js'
import { getAdvancedSystemTasks } from './tasks/advancedSystem.js'
import { getAdvancedFileTasks } from './tasks/advancedFiles.js'
import { getCommunicationTasks } from './tasks/communicationScenarios.js'
import { getExtendedTasks } from './tasks/extendedScenarios.js'
import { getKnowledgeTasks } from './tasks/knowledgeScenarios.js'
import { getLifestyleTasks } from './tasks/lifestyleScenarios.js'
import { getNotificationTasks } from './tasks/notificationScenarios.js'
import { getIMTasks } from './tasks/imScenarios.js'
import { getWechatSituationalTasks } from './tasks/wechatSituational.js'

const HOME = homedir()

// Bug fix: 日历提醒去重 — 记录已通知的 eventTitle+startDate 组合
const _calendarNotifiedSet = new Set<string>()
let _calendarNotifiedLastClean = Date.now()
const CALENDAR_DEDUP_TTL = 24 * 60 * 60 * 1000 // 24 小时后自动清理

function _calendarDedup(key: string): boolean {
  // 先清理过期记录
  const now = Date.now()
  if (now - _calendarNotifiedLastClean > CALENDAR_DEDUP_TTL) {
    _calendarNotifiedSet.clear()
    _calendarNotifiedLastClean = now
  }
  if (_calendarNotifiedSet.has(key)) return true
  _calendarNotifiedSet.add(key)
  return false
}

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

/**
 * 安全获取最近交互时间。失败时返回 Date.now()（视为"刚活跃"），
 * 使依赖 idle 判断的任务（dream-consolidate 等）跳过而非误执行。
 * 返回 0 会导致 idle 值约 56 年，触发不该执行的定时任务。
 */
function getLastInteractionTimeSafe(): number {
  try {
    const { getLastInteractionTime } =
      require('../bootstrap/state.js') as typeof import('../bootstrap/state.js')
    return getLastInteractionTime()
  } catch {
    return Date.now()
  }
}

const SMART_CRON_TASKS: SmartCronTask[] = [
  {
    id: 'dream-consolidate',
    description: '夜间记忆整合 · Memory consolidation',
    cron: '0 22 * * *',
    priority: 'normal',
    enabled: true,
    condition: () => true, // Always run — cron already gates timing; canRun blocked catchup
    skipIf: () => {
      // 用户 15 分钟内有操作→延后
      const idle = (Date.now() - getLastInteractionTimeSafe()) / 60000
      return idle < 15
    },
    action: async () => {
      logForDebugging(
        '[builtinTasks] dream-consolidate: executing autoDream pipeline',
      )
      try {
        const { executeAutoDreamStandalone } = await import(
          '../services/autoDream/autoDream.js'
        )
        await executeAutoDreamStandalone()
        // Push notification after successful dream consolidation
        try {
          const { pushNotification } = await import('../assistant/sense.js')
          pushNotification({
            type: 'action',
            title: '🌙 DeepDream 记忆整合完成',
            body: '今日会话已整合到长期记忆。晨间简报将基于此次整合结果生成。',
            channel: 'all',
          })
        } catch {}
      } catch (e) {
        logForDebugging(
          `[builtinTasks] dream-consolidate failed: ${(e as Error).message}`,
        )
      }
    },
  },
  {
    id: 'morning-brief',
    description: '晨间简报 · Morning briefing',
    cron: '0 7 * * *',
    priority: 'normal',
    enabled: true,
    condition: () => true, // Always run — cron already gates timing; canRun blocked catchup
    action: async () => {
      logForDebugging(
        '[builtinTasks] morning-brief: generating morning briefing',
      )
      try {
        const { generateMorningBrief } = await import('../memdir/memdir.js')
        const content = await generateMorningBrief()
        if (content) {
          logForDebugging(`[builtinTasks] morning-brief: generated ${content.length} chars`)
          // 额外通过 IM 推送（sense.ts 的 pushNotification 已在 generateMorningBrief 内调用，
          // 这里补一个 channel push 确保到达微信等 IM 通道）
          try {
            const { pushViaChannelMCP } = await import('../assistant/channelRegistry.js')
            const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#')).slice(0, 8)
            pushViaChannelMCP('📋 晨间简报', lines.join('\n'))
          } catch {}

          // why: P2-T7 panda-on-desk 联动 — 晨间简报 system 横幅 + overlay 卡片（10s TTL）
          try {
            const { pushNotification: pushDeskNotification, isOnDeskEnabled } =
              await import('../desk/bridge.js')
            if (isOnDeskEnabled()) {
              pushDeskNotification({
                kind: 'system',
                level: 'info',
                scenarioId: 'morning-brief',
                title: 'Panda · 晨间简报',
                body: `今日简报 ${content.length} 字已生成`,
              })
              const preview = content
                .split('\n')
                .filter(l => l.trim() && !l.startsWith('#'))
                .slice(0, 3)
                .join('\n')
                .slice(0, 200)
              pushDeskNotification({
                kind: 'overlay',
                level: 'info',
                scenarioId: 'morning-brief',
                title: '📋 晨间简报',
                body: preview,
                ttlMs: 10_000,
              })
            }
          } catch {
            // 桥接失败不阻塞主路径
          }
        }
      } catch (e) {
        logForDebugging(
          `[builtinTasks] morning-brief failed: ${(e as Error).message}`,
        )
      }
    },
  },
  {
    id: 'file-organizer',
    description: '文件自动分类 · File auto-organize',
    cron: '0 */4 * * *',
    priority: 'low',
    enabled: true,
    condition: () => true, // Always run — cron already gates timing
    skipIf: () => {
      const idle = (Date.now() - getLastInteractionTimeSafe()) / 60000
      return idle < 30
    },
    action: async () => {
      logForDebugging(
        '[builtinTasks] file-organizer: scanning Downloads for classification',
      )
      // dry-run only — just log classification suggestions
      try {
        const { organizeDirectory } = await import('../memdir/memdir.js')
        // why: 走 platform.DOWNLOADS 跨平台抽象（Win OneDrive 重定向场景能正确解析）
        const { DOWNLOADS } = await import('./platform.js')
        const suggestions = organizeDirectory(DOWNLOADS, true)
        logForDebugging(
          `[builtinTasks] file-organizer: ${suggestions.length} files could be organized`,
        )
        // why: P3-T4-γ panda-on-desk 联动 — file-organizer 仅角标累加（默认 OFF）
        if (suggestions.length > 0) {
          try {
            const { bumpBadge, isOnDeskEnabled } = await import('../desk/bridge.js')
            if (isOnDeskEnabled()) {
              bumpBadge('file-organizer', suggestions.length)
            }
          } catch {}
        }
      } catch (e) {
        logForDebugging(
          `[builtinTasks] file-organizer failed: ${(e as Error).message}`,
        )
      }
    },
  },
  {
    id: 'memory-decay',
    description: '记忆衰减 · Memory decay & pruning',
    cron: '30 22 * * *',
    priority: 'normal',
    enabled: true,
    condition: () => true, // Always run — cron already gates timing
    action: async () => {
      logForDebugging('[builtinTasks] memory-decay: running Ebbinghaus decay')
      try {
        const { decayAndPruneMemories } = await import('../memdir/memdir.js')
        const { getAutoMemPath } = await import('../memdir/paths.js')
        const memoryDir = getAutoMemPath()
        const result = await decayAndPruneMemories(memoryDir)
        logForDebugging(
          `[builtinTasks] memory-decay: decayed=${result.decayed} pruned=${result.pruned}`,
        )
        // why: P3-T4-γ panda-on-desk 联动 — 仅角标提示（不打扰夜间任务）
        if ((result.decayed ?? 0) + (result.pruned ?? 0) > 0) {
          try {
            const { bumpBadge, isOnDeskEnabled } = await import('../desk/bridge.js')
            if (isOnDeskEnabled()) {
              bumpBadge('memory-decay', 1)
            }
          } catch {}
        }
      } catch (e) {
        logForDebugging(
          `[builtinTasks] memory-decay failed: ${(e as Error).message}`,
        )
      }
    },
  },
  {
    id: 'code-health',
    description: '代码健康检查 · Code health check',
    cron: '0 23 * * *',
    priority: 'low',
    enabled: true,
    condition: () => true, // Always run — cron already gates timing
    action: async () => {
      // why: 跨平台 build——Windows cmd.exe 不识别 `2>&1 || true` 复合语法；
      // 且 MEMORY 规则要求 build 前先 rm -rf dist 避免 stale chunk。
      // 改为 fs.rmSync + spawnSync 数组形式，绕开 shell 解析。
      logForDebugging('[builtinTasks] code-health: running build check')
      try {
        const { rmSync } = require('fs') as typeof import('fs')
        const { spawnSync } = require('child_process') as typeof import('child_process')
        const { join } = require('path') as typeof import('path')
        const distPath = join(process.cwd(), 'dist')
        // 1) 清理 dist（跨平台，幂等）
        try {
          rmSync(distPath, { recursive: true, force: true })
        } catch {}
        // 2) 调用 bun run build（数组参数 + shell:false 避免任何 shell 解析差异）
        const isWin = process.platform === 'win32'
        const result = spawnSync(isWin ? 'bun.exe' : 'bun', ['run', 'build'], {
          encoding: 'utf-8',
          timeout: 120000,
          shell: false,
          cwd: process.cwd(),
        })
        const output = `${result.stdout || ''}\n${result.stderr || ''}`
        const hasError =
          result.status !== 0 ||
          (/error/i.test(output) && !/0 errors/i.test(output))
        logForDebugging(
          `[builtinTasks] code-health: build ${hasError ? 'FAILED' : 'OK'} (exit=${result.status})`,
        )
        if (hasError) {
          const { setWorkingMemory } = await import(
            '../assistant/workingMemory.js'
          )
          setWorkingMemory('code-health-failed', output.slice(-500))
          // why: P3-T4-γ panda-on-desk 联动 — 构建失败 system + badge
          try {
            const { pushNotification: deskPush, bumpBadge, isOnDeskEnabled } =
              await import('../desk/bridge.js')
            if (isOnDeskEnabled()) {
              deskPush({
                kind: 'system',
                level: 'warning',
                scenarioId: 'code-health',
                title: 'Panda · 代码健康检查失败',
                body: `bun run build exit=${result.status}`,
              })
              bumpBadge('code-health', 1)
            }
          } catch {}
        }
      } catch (e) {
        logForDebugging(
          `[builtinTasks] code-health failed: ${(e as Error).message}`,
        )
      }
    },
  },
  {
    id: 'memory-index-rebuild',
    description: '记忆索引重建 · Memory index rebuild',
    cron: '0 3 * * *',
    priority: 'low',
    enabled: true,
    condition: () => true, // Always run — cron already gates timing
    action: async () => {
      logForDebugging(
        '[builtinTasks] memory-index-rebuild: rebuilding search index',
      )
      try {
        const { scanMdFiles, searchMemory } = await import(
          '../memdir/memdir.js'
        )
        const { getAutoMemPath } = await import('../memdir/paths.js')
        const memoryDir = getAutoMemPath()
        const files = scanMdFiles(memoryDir)
        // 预热搜索：对常见关键词执行一次搜索以验证索引完整性
        searchMemory('project', memoryDir, 1)
        logForDebugging(
          `[builtinTasks] memory-index-rebuild: indexed ${files.length} files`,
        )
        // why: P3-T4-γ panda-on-desk 联动 — 索引重建仅角标提示（凌晨任务）
        try {
          const { bumpBadge, isOnDeskEnabled } = await import('../desk/bridge.js')
          if (isOnDeskEnabled()) {
            bumpBadge('memory-index-rebuild', 1)
          }
        } catch {}
      } catch (e) {
        logForDebugging(
          `[builtinTasks] memory-index-rebuild failed: ${(e as Error).message}`,
        )
      }
    },
  },
  {
    id: 'working-memory-cleanup',
    description: '工作记忆清理 · Working memory cleanup',
    cron: '0 6 * * *',
    priority: 'low',
    enabled: true,
    condition: () => true, // Always run — cron already gates timing
    action: async () => {
      logForDebugging(
        '[builtinTasks] working-memory-cleanup: purging stale working memory',
      )
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
          logForDebugging(
            `[builtinTasks] working-memory-cleanup: removed ${cleaned} stale files`,
          )
          // why: P3-T4-γ panda-on-desk 联动 — 仅角标
          if (cleaned > 0) {
            try {
              const { bumpBadge, isOnDeskEnabled } = await import('../desk/bridge.js')
              if (isOnDeskEnabled()) {
                bumpBadge('working-memory-cleanup', 1)
              }
            } catch {}
          }
        } catch {}
      } catch (e) {
        logForDebugging(
          `[builtinTasks] working-memory-cleanup failed: ${(e as Error).message}`,
        )
      }
    },
  },
  {
    id: 'dream-report-summary',
    description: '周报汇总 · Weekly dream summary',
    cron: '0 8 * * 1',
    priority: 'low',
    enabled: true,
    condition: () => true, // Always run — cron already gates timing
    action: async () => {
      logForDebugging(
        '[builtinTasks] dream-report-summary: generating weekly dream summary',
      )
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
          const summaryLines: string[] = [`# 周报汇总 — ${localDateStr()}\n`]
          summaryLines.push(`本周 ${recentDreams.length} 份 DeepDream 报告:\n`)
          for (const f of recentDreams) {
            try {
              const content = readFileSync(f, 'utf-8') as string
              const dateName = f.split('/').pop()?.replace('.md', '') || ''
              // 提取每份报告的关键数据行
              const keyLines = content
                .split('\n')
                .filter((l: string) => l.startsWith('- '))
                .slice(0, 5)
              summaryLines.push(`## ${dateName}`)
              summaryLines.push(keyLines.join('\n'))
              summaryLines.push('')
            } catch {}
          }
          await mkdir(join(memoryDir, 'working'), { recursive: true })
          writeFileSync(
            join(memoryDir, 'working', `weekly_summary_${localDateStr()}.md`),
            summaryLines.join('\n'),
            'utf-8',
          )

          try {
            const { pushNotification } = await import('../assistant/sense.js')
            const drsTitle = '📊 本周 DeepDream 周报'
            const drsBody = `本周 ${recentDreams.length} 份 DeepDream 报告已汇总。可使用 /memory weekly 查看。`
            pushNotification({
              type: 'action',
              title: drsTitle,
              body: drsBody,
              channel: 'all',
            })
            // why: P3-T4-γ panda-on-desk 联动 — 周报 system + overlay
            try {
              const { pushNotification: deskPush, bumpBadge, isOnDeskEnabled } =
                await import('../desk/bridge.js')
              if (isOnDeskEnabled()) {
                deskPush({
                  kind: 'system',
                  level: 'info',
                  scenarioId: 'dream-report-summary',
                  title: 'Panda · DeepDream 周报',
                  body: drsBody,
                })
                deskPush({
                  kind: 'overlay',
                  level: 'info',
                  scenarioId: 'dream-report-summary',
                  title: drsTitle,
                  body: drsBody,
                  ttlMs: 8_000,
                })
                bumpBadge('dream-report-summary', 1)
              }
            } catch {}
          } catch {}
        }
        logForDebugging(
          `[builtinTasks] dream-report-summary: summarized ${recentDreams.length} of ${dreams.length} reports`,
        )
      } catch (e) {
        logForDebugging(
          `[builtinTasks] dream-report-summary failed: ${(e as Error).message}`,
        )
      }
    },
  },
  // ─── 日历事件主动提醒 ───
  // 去重：记录已通知的 eventTitle+startDate，防止重叠窗口重复通知
  {
    id: 'calendar-reminder',
    description: '日历事件提醒 · Calendar event reminder',
    cron: '*/30 * * * *', // 每 30 分钟扫描一次
    priority: 'critical',
    enabled: true,
    // why: 日历事件源 readCalendarEvents 依赖 macOS osascript，非 darwin 平台直接跳过
    // 整个任务（避免 cron 触发后 evtTime 永远 null 静默 no-op）。
    condition: () => process.platform === 'darwin',
    action: async () => {
      logForDebugging(
        '[builtinTasks] calendar-reminder: scanning upcoming events',
      )
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
            evtTime = null
          }
          // why: macOS-only 任务，原 date -j 兜底仅在 darwin 生效
          if ((!evtTime || isNaN(evtTime)) && process.platform === 'darwin') {
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
          if (
            (minutesBefore > 8 && minutesBefore <= 30) ||
            (minutesBefore > 0 && minutesBefore <= 10)
          ) {
            // 去重：同一事件同一窗口不重复通知
            const dedupKey = `${evt.title}|${evt.startDate}|${minutesBefore <= 10 ? '10min' : '30min'}`
            if (_calendarDedup(dedupKey)) {
              logForDebugging(
                `[builtinTasks] calendar-reminder: skipped duplicate "${evt.title}"`,
              )
              continue
            }
            const { pushNotification } = await import('../assistant/sense.js')
            const timeLabel =
              minutesBefore <= 10
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

            // why: P2-T7 panda-on-desk 联动 — 日历提醒 system 横幅 + overlay + short 音效
            try {
              const {
                pushNotification: pushDeskNotification,
                isOnDeskEnabled,
              } = await import('../desk/bridge.js')
              if (isOnDeskEnabled()) {
                pushDeskNotification({
                  kind: 'system',
                  level: 'info',
                  scenarioId: 'calendar-reminder',
                  title: 'Panda · 日历提醒',
                  body,
                  soundCue: 'short',
                })
                pushDeskNotification({
                  kind: 'overlay',
                  level: 'info',
                  scenarioId: 'calendar-reminder',
                  title: '📅 ' + evt.title,
                  body,
                  ttlMs: 5_000,
                })
                pushDeskNotification({
                  kind: 'sound',
                  level: 'info',
                  scenarioId: 'calendar-reminder',
                  title: 'calendar-reminder-sound',
                  soundCue: 'short',
                })
              }
            } catch {
              // 桥接失败不阻塞主路径
            }

            // 同时记录到工作记忆，下次对话时模型可见
            try {
              const { setWorkingMemory } = await import(
                '../assistant/workingMemory.js'
              )
              setWorkingMemory(`calendar-upcoming-${evt.title.slice(0, 20)}`, {
                title: evt.title,
                startDate: evt.startDate,
                location: evt.location,
                minutesBefore: Math.round(minutesBefore),
              })
            } catch {}

            logForDebugging(
              `[builtinTasks] calendar-reminder: notified "${evt.title}" in ${Math.round(minutesBefore)}min`,
            )
          }
        }
      } catch (e) {
        logForDebugging(
          `[builtinTasks] calendar-reminder failed: ${(e as Error).message}`,
        )
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
        const status = execSync('git status --porcelain', {
          encoding: 'utf-8',
          timeout: 3000,
        })
        const changedFiles = status.split('\n').filter(Boolean).length
        if (changedFiles === 0) return

        const lastCommitTime = execSync('git log -1 --format=%ct', {
          encoding: 'utf-8',
          timeout: 3000,
        }).trim()
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
          // why: P3-T4-γ panda-on-desk 联动 — git 未提交以 badge 提示（不打扰）
          try {
            const { bumpBadge, isOnDeskEnabled } = await import('../desk/bridge.js')
            if (isOnDeskEnabled()) {
              bumpBadge('git-uncommitted-badge', 1)
            }
          } catch {
            // 桥接失败不阻塞主路径
          }
        }
      } catch (e) {
        logForDebugging(
          `[builtinTasks] git-uncommitted-reminder failed: ${(e as Error).message}`,
        )
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
    condition: () => true, // Always run — cron already gates timing
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
          // why: P3-T4-γ panda-on-desk 联动 — profile 过期 badge + system 横幅
          try {
            const { pushNotification: deskPush, bumpBadge, isOnDeskEnabled } =
              await import('../desk/bridge.js')
            if (isOnDeskEnabled()) {
              deskPush({
                kind: 'system',
                level: 'info',
                scenarioId: 'profile-stale-reminder',
                title: 'Panda · 用户画像过期',
                body: `已 ${Math.round(daysSince)} 天未更新`,
              })
              bumpBadge('profile-stale-reminder', 1)
            }
          } catch {
            // 桥接失败不阻塞主路径
          }
        }
      } catch (e) {
        logForDebugging(
          `[builtinTasks] profile-stale-reminder failed: ${(e as Error).message}`,
        )
      }
    },
  },
  // ─── 前瞻记忆扫描 ───
  {
    id: 'prospective-scan',
    description: '前瞻记忆扫描 · Prospective memory scan',
    cron: '0 20 * * *',
    priority: 'normal',
    enabled: true,
    condition: () => true, // Always run — cron already gates timing
    action: async () => {
      logForDebugging(
        '[builtinTasks] prospective-scan: scanning upcoming events and deadlines',
      )
      const parts: string[] = []
      // 读取倒计时事件
      try {
        const countdowns = JSON.parse(
          readFileSync(join(HOME, '.pandacc/config/countdowns.json'), 'utf-8'),
        )
        if (Array.isArray(countdowns) && countdowns.length > 0) {
          const upcoming = countdowns.filter((c: any) => {
            const diff = (new Date(c.date).getTime() - Date.now()) / 86400000
            return diff > 0 && diff <= 3
          })
          if (upcoming.length > 0) {
            parts.push('## 即将到来的事件')
            upcoming.forEach((c: any) => {
              const days = Math.ceil(
                (new Date(c.date).getTime() - Date.now()) / 86400000,
              )
              parts.push(`- ${c.name}: ${days}天后 (${c.date})`)
            })
          }
        }
      } catch {}
      // 读取日历 (macOS)
      try {
        if (platform() === 'darwin') {
          const cal = execSync(
            `osascript -e 'tell application "Calendar" to get summary of (every event of every calendar whose start date > (current date) and start date < ((current date) + 3 * days))' 2>/dev/null`,
            { encoding: 'utf-8', timeout: 5000 },
          ).trim()
          if (cal) parts.push('## 日历事件\n' + cal)
        }
      } catch {}
      // 读取 TODO
      // why: grep -r 在 Windows PowerShell 不可用；改 Node fs 递归 + 正则跨平台
      try {
        const { readdirSync: rd, readFileSync: rf, statSync: st } = require('fs') as typeof import('fs')
        const { join: jn } = require('path') as typeof import('path')
        const HEAD_LIMIT = 5
        const SKIP_DIRS = new Set([
          'node_modules', '.git', 'dist', 'build', '.next',
          'coverage', '.cache', '.turbo',
        ])
        const matches: string[] = []
        const walk = (dir: string, depth: number): void => {
          if (matches.length >= HEAD_LIMIT || depth > 6) return
          let entries: import('fs').Dirent[] = []
          try { entries = rd(dir, { withFileTypes: true }) } catch { return }
          for (const e of entries) {
            if (matches.length >= HEAD_LIMIT) return
            const full = jn(dir, e.name)
            if (e.isDirectory()) {
              if (SKIP_DIRS.has(e.name) || e.name.startsWith('.')) continue
              walk(full, depth + 1)
            } else if (e.isFile() && (/\.tsx?$/.test(e.name))) {
              try {
                const sz = st(full).size
                if (sz > 1_000_000) continue
                const txt = rf(full, 'utf-8') as string
                if (/TODO|FIXME/.test(txt)) matches.push(full)
              } catch {}
            }
          }
        }
        walk(process.cwd(), 0)
        if (matches.length > 0) parts.push(`## 待办文件\n${matches.join('\n')}`)
      } catch {}

      if (parts.length > 0) {
        try {
          const { saveProspectiveMemory } = await import('../memdir/memdir.js')
          saveProspectiveMemory(parts.join('\n\n'))
          logForDebugging(
            `[builtinTasks] prospective-scan: completed with ${parts.length} data sources`,
          )

          try {
            const { pushNotification } = await import('../assistant/sense.js')
            const preview = parts[0].replace(/^##\s*/, '').slice(0, 100)
            const psBody = `检测到 ${parts.length} 项即将到来的事件/截止日期。${preview ? '\n' + preview : ''}`
            pushNotification({
              type: 'action',
              title: '🔮 前瞻提醒',
              body: psBody,
              channel: 'all',
            })
            // why: P3-T4-γ panda-on-desk 联动 — 前瞻提醒 system + overlay
            try {
              const { pushNotification: deskPush, bumpBadge, isOnDeskEnabled } =
                await import('../desk/bridge.js')
              if (isOnDeskEnabled()) {
                deskPush({
                  kind: 'system',
                  level: 'info',
                  scenarioId: 'prospective-scan',
                  title: 'Panda · 🔮 前瞻提醒',
                  body: psBody,
                })
                deskPush({
                  kind: 'overlay',
                  level: 'info',
                  scenarioId: 'prospective-scan',
                  title: '🔮 前瞻提醒',
                  body: psBody,
                  ttlMs: 8_000,
                })
                bumpBadge('prospective-scan', parts.length)
              }
            } catch {
              // 桥接失败不阻塞
            }
          } catch {}
        } catch (e) {
          logForDebugging(
            `[builtinTasks] prospective-scan save failed: ${(e as Error).message}`,
          )
        }
      } else {
        logForDebugging(
          '[builtinTasks] prospective-scan: no prospective items found',
        )
      }
    },
  },
  {
    id: 'clipboard-poll',
    description: '剪贴板实时捕获 · Clipboard real-time capture',
    cron: '*/2 * * * *',
    priority: 'low',
    enabled: true,
    condition: () => true, // Always run — frequent cron handles timing
    skipIf: () => {
      // 用户最近 30 分钟无任何操作 → 跳过（避免后台无意义抓取）
      const idle = (Date.now() - getLastInteractionTimeSafe()) / 60000
      return idle > 30
    },
    action: async () => {
      logForDebugging(
        '[builtinTasks] clipboard-poll: capturing clipboard snapshot',
      )
      try {
        const { captureClipboard, isSensitiveClipboardContent } = await import(
          '../memdir/memdir.js'
        )
        const snapshot = await captureClipboard()
        if (!snapshot) return
        // 双重脱敏：captureClipboard 已过滤一层，此处再用扩展模式兜底
        if (isSensitiveClipboardContent(snapshot)) {
          logForDebugging('[builtinTasks] clipboard-poll: 跳过敏感剪贴板内容')
          return
        }
        // 写入 working memory（后台采集，不推送通知）
        const { setWorkingMemory } = await import(
          '../assistant/workingMemory.js'
        )
        const payload = JSON.stringify({
          content: snapshot.slice(0, 500),
          timestamp: Date.now(),
        })
        setWorkingMemory('clipboard-recent', payload)
        // why: P3-T4-γ panda-on-desk 联动 — 剪贴板捕获仅角标（默认 OFF · privacy=medium）
        try {
          const { bumpBadge, isOnDeskEnabled } = await import('../desk/bridge.js')
          if (isOnDeskEnabled()) {
            bumpBadge('clipboard-poll', 1)
          }
        } catch {}
      } catch (e) {
        logForDebugging(
          `[builtinTasks] clipboard-poll failed: ${(e as Error).message}`,
        )
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
  // v2.12.1 hotfix: 改用静态 ESM import 直接调 getter（不再 require 相对路径字符串）
  // 根因：运行时 require('./tasks/xxx.js') 的相对路径 Bun bundler 不会解析，
  // dist 里 15 个模块全部加载失败 → BUILTIN_TASKS 缩水到 13。
  const modules: Array<{ name: string; getter: () => SmartCronTask[] }> = [
    // Phase 1
    { name: 'systemHealth', getter: getSystemHealthTasks },
    { name: 'personalLife', getter: getPersonalLifeTasks },
    { name: 'devScenarios', getter: getDevTasks },
    { name: 'fileScenarios', getter: getFileTasks },
    // Phase 2
    { name: 'securityScenarios', getter: getSecurityTasks },
    { name: 'efficiencyScenarios', getter: getEfficiencyTasks },
    // Phase 3
    { name: 'advancedSystem', getter: getAdvancedSystemTasks },
    { name: 'advancedFiles', getter: getAdvancedFileTasks },
    // Phase 4
    { name: 'communicationScenarios', getter: getCommunicationTasks },
    { name: 'extendedScenarios', getter: getExtendedTasks },
    { name: 'knowledgeScenarios', getter: getKnowledgeTasks },
    { name: 'lifestyleScenarios', getter: getLifestyleTasks },
    // Phase 5: 通知感知
    { name: 'notificationScenarios', getter: getNotificationTasks },
    // Phase 6: IM 聚合
    { name: 'imScenarios', getter: getIMTasks },
    // Phase 7: 微信态势感知
    { name: 'wechatSituational', getter: getWechatSituationalTasks },
  ]
  for (const { name, getter } of modules) {
    try {
      const tasks = getter()
      if (Array.isArray(tasks)) {
        extra.push(...tasks)
      }
    } catch (e) {
      logForDebugging(
        `[builtinTasks] 场景模块 ${name} 加载失败: ${(e as Error).message}`,
      )
    }
  }
  logForDebugging(`[builtinTasks] 场景模块加载完成：${extra.length} 个扩展任务`)
  return extra
}

// 合并核心任务 + 场景模块
const ALL_TASKS: SmartCronTask[] = [
  ...SMART_CRON_TASKS,
  ...loadScenarioModules(),
]

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
      logForDebugging(
        `[builtinTasks] ${task.id}: skipped (skipIf condition met)`,
      )
      throw new Error('__SKIPPED__') // 标记为跳过，nightMode 不更新 _taskLastExecMap
    }
    await task.action()
  },
}))
