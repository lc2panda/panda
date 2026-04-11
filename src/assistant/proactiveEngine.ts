// Input: 对话上下文（消息列表、回合数、会话开始时间）
// Output: 主动建议列表 ProactiveSuggestion[]，格式化为系统消息
// Pos: assistant/ 主动交互引擎（被动层），由 stopHooks 在每轮结束后调用
//      主动层（时间驱动）在 proactive/builtinTasks.ts 中：日历提醒、Git 提醒、画像过期、前瞻扫描
//      检查器 6 桥接主动层通知到被动层（pending-notifications）
//      检查器 7 习惯偏差检查（深夜关怀 + 长时间连续工作提醒）
//      检查器 8 LLM 元检查器（本地智能推理：重复话题/错误累积/工具委派建议）
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的md。

import { join } from 'path'
import { existsSync, readFileSync, statSync } from 'fs'
import { homedir } from 'os'

// ═══════════════════════════════════════════════════════════════════
// SA-P4: 主动交互引擎——零 API 调用，纯本地条件检测
// ═══════════════════════════════════════════════════════════════════

export interface ProactiveSuggestion {
  type: 'uncommitted-changes' | 'profile-stale' | 'morning-briefing' | 'context-pressure' | 'repetitive-pattern' | 'pending-notifications' | 'habit-deviation' | 'llm-insight' | 'reminder' | 'insight' | 'alert' | 'tip'
  priority: 'low' | 'medium' | 'high'
  message: string
  source: string // 触发来源
}

// 频率限制：同类型建议 1 小时内最多推送 1 次（TTL Map，防止内存泄漏）
const _emittedTypes = new Map<string, number>()
const EMIT_TTL_MS = 60 * 60 * 1000 // 1 小时

/**
 * 主函数：检查所有条件并返回建议
 * 每个检查器独立 try/catch，一个失败不影响其他
 */
export async function checkProactiveSuggestions(context: {
  messages: readonly any[]
  turnCount: number
  sessionStartTime: number
}): Promise<ProactiveSuggestion[]> {
  const suggestions: ProactiveSuggestion[] = []

  // 逐个执行检查器，独立捕获异常
  const checkers = [
    () => _checkUncommittedChanges(context),
    () => _checkProfileStaleness(),
    () => _checkMorningBriefing(),
    () => _checkContextPressure(context),
    () => _checkRepetitivePattern(context),
    () => _checkPendingNotifications(),
    () => _checkHabitDeviation(),
    () => _checkLLMInsight(context),
  ]

  for (const checker of checkers) {
    try {
      const result = await Promise.resolve(checker())
      if (result) suggestions.push(result)
    } catch {
      // 单个检查器失败，静默跳过
    }
  }

  // 频率限制：同类型建议 1 小时内仅推送一次（TTL 自动过期，防止内存泄漏）
  const now = Date.now()
  // 清理过期条目
  for (const [k, t] of _emittedTypes) {
    if (now - t > EMIT_TTL_MS) _emittedTypes.delete(k)
  }
  const filtered = suggestions.filter(s => {
    const key = `${s.type}:${s.source}`
    const lastEmit = _emittedTypes.get(key)
    if (lastEmit && now - lastEmit < EMIT_TTL_MS) return false
    _emittedTypes.set(key, now)
    return true
  })

  return filtered
}

/**
 * 将建议列表格式化为可注入的系统消息字符串
 */
export function formatSuggestionsAsSystemMessage(suggestions: ProactiveSuggestion[]): string {
  if (suggestions.length === 0) return ''

  const priorityEmoji: Record<string, string> = {
    high: '🔴',
    medium: '🟡',
    low: '🟢',
  }

  const lines = suggestions.map(s => {
    const emoji = priorityEmoji[s.priority] || '💡'
    return `${emoji} [${s.type}] ${s.message}`
  })

  return [
    '── 🌿 主动助手提醒 ──',
    ...lines,
    '────────────────────',
  ].join('\n')
}

// ─── 检查器 1: 长时间无 commit（>2 小时有未提交变更） ───

function _checkUncommittedChanges(context: {
  sessionStartTime: number
}): ProactiveSuggestion | null {
  try {
    const { execSync } = require('child_process')
    const status = execSync('git status --porcelain', { encoding: 'utf-8', timeout: 3000 })
    const changedFiles = status.split('\n').filter(Boolean).length
    if (changedFiles === 0) return null

    // 检查最后一次 commit 的时间
    const lastCommitTime = execSync('git log -1 --format=%ct', { encoding: 'utf-8', timeout: 3000 }).trim()
    const lastCommitMs = parseInt(lastCommitTime, 10) * 1000
    const elapsed = Date.now() - lastCommitMs
    const twoHours = 2 * 60 * 60 * 1000

    if (elapsed > twoHours) {
      return {
        type: 'reminder',
        priority: 'medium',
        message: `检测到 ${changedFiles} 个未提交文件，距上次 commit 已超过 ${Math.round(elapsed / 3600000)} 小时。建议及时提交。`,
        source: 'uncommitted_changes',
      }
    }
  } catch {
    // git 不可用或不在 repo 中
  }
  return null
}

// ─── 检查器 2: 记忆过期提醒（profile.md 超过 7 天未更新） ───

function _checkProfileStaleness(): ProactiveSuggestion | null {
  try {
    const { getAutoMemPath } = require('../memdir/paths.js') as typeof import('../memdir/paths.js')
    const memDir = getAutoMemPath()
    if (!memDir) return null

    const profilePath = join(memDir, 'semantic', 'profile.md')
    const stat = statSync(profilePath)
    const daysSinceUpdate = (Date.now() - stat.mtimeMs) / (1000 * 60 * 60 * 24)

    if (daysSinceUpdate > 7) {
      return {
        type: 'reminder',
        priority: 'low',
        message: `用户画像 (profile.md) 已 ${Math.round(daysSinceUpdate)} 天未更新，建议在本次会话中关注并更新。`,
        source: 'profile_stale',
      }
    }
  } catch {
    // 文件不存在等情况静默跳过
  }
  return null
}

// ─── 检查器 3: 晨间简报提醒（7:00-9:00 之间） ───

function _checkMorningBriefing(): ProactiveSuggestion | null {
  const hour = new Date().getHours()
  if (hour >= 7 && hour < 12) {
    try {
      const { getAutoMemPath } = require('../memdir/paths.js') as typeof import('../memdir/paths.js')
      const memDir = getAutoMemPath()
      if (!memDir) return null

      const { readdirSync } = require('fs')
      let count = 0
      try {
        const briefingDir = join(memDir, 'semantic', 'briefing')
        count += readdirSync(briefingDir).filter((f: string) => f.endsWith('.md')).length
      } catch {}
      try {
        const workingDir = join(memDir, 'working')
        count += readdirSync(workingDir).filter((f: string) => f.startsWith('morning_brief_') && f.endsWith('.md')).length
      } catch {}

      if (count > 0) {
        return {
          type: 'tip',
          priority: 'low',
          message: `早上好！发现 ${count} 份简报待阅读。可使用 /memory briefing 查看。`,
          source: 'morning_briefing',
        }
      }
    } catch {
      // 目录不存在等情况
    }
  }
  return null
}

// ─── 检查器 4: 上下文压力提醒（消息数 > 50 建议 /compact） ───

function _checkContextPressure(context: {
  messages: readonly any[]
}): ProactiveSuggestion | null {
  const msgCount = context.messages.length
  if (msgCount > 50) {
    return {
      type: 'alert',
      priority: 'high',
      message: `当前会话已有 ${msgCount} 条消息，上下文较长。建议使用 /compact 压缩上下文以保持响应质量。`,
      source: 'context_pressure',
    }
  }
  return null
}

// ─── 检查器 5: 重复模式识别（连续 3 次相似操作） ───

function _checkRepetitivePattern(context: {
  messages: readonly any[]
}): ProactiveSuggestion | null {
  try {
    // 提取最近的用户消息
    const userMsgs = context.messages
      .filter((m: any) => m.type === 'user')
      .slice(-5)
      .map((m: any) => {
        if (typeof m.message === 'string') return m.message
        if (m.message?.content) {
          if (typeof m.message.content === 'string') return m.message.content
          if (Array.isArray(m.message.content)) {
            return m.message.content
              .filter((b: any) => b.type === 'text')
              .map((b: any) => b.text || '')
              .join(' ')
          }
        }
        return ''
      })
      .filter(Boolean)

    if (userMsgs.length < 3) return null

    // 简单检测：最近 3 条消息的前 20 个字符是否相同
    const recent3 = userMsgs.slice(-3)
    const prefixes = recent3.map(m => m.slice(0, 20).toLowerCase().trim())
    const allSame = prefixes.every(p => p === prefixes[0]) && prefixes[0].length > 3

    if (allSame) {
      return {
        type: 'insight',
        priority: 'medium',
        message: `检测到连续 3 次相似操作模式（"${prefixes[0]}..."）。建议创建自定义工作流或 slash command 来自动化此任务。`,
        source: 'repetitive_pattern',
      }
    }
  } catch {
    // 消息格式异常
  }
  return null
}

// ─── 检查器 6: 未读通知消费（主动层 → 被动层桥接） ───

// ─── 检查器 7: 习惯偏差检查（深夜工作关怀 + 长时间连续工作） ───

function _checkHabitDeviation(): ProactiveSuggestion | null {
  try {
    const hour = new Date().getHours()
    // 深夜工作关怀
    if (hour >= 23 || hour < 5) {
      return {
        type: 'tip' as ProactiveSuggestion['type'],
        message: '🌙 深夜了，注意休息。持续工作效率会下降，明天继续也不迟。',
        priority: 'low',
        source: 'habit_deviation_late_night',
      }
    }
    // 长时间连续工作（通过工作记忆判断）
    const { getWorkingMemory } = require('./workingMemory.js') as typeof import('./workingMemory.js')
    const lastTime = getWorkingMemory('lastPromptTime')
    const firstTime = getWorkingMemory('sessionStartTime')
    if (lastTime && firstTime) {
      const duration = (new Date(lastTime).getTime() - new Date(firstTime).getTime()) / 3600000
      if (duration > 3) {
        return {
          type: 'tip' as ProactiveSuggestion['type'],
          message: `⏰ 已连续工作 ${Math.round(duration)} 小时，建议休息 10 分钟。`,
          priority: 'low',
          source: 'habit_deviation_long_session',
        }
      }
    }
  } catch {}
  return null
}

// ─── 检查器 6: 未读通知消费（主动层 → 被动层桥接） ───

const _displayedNotifTimestamps = new Set<string>()

function _checkPendingNotifications(): ProactiveSuggestion | null {
  try {
    const notifPath = join(homedir(), '.pandacc', 'channels', 'outbox', 'notifications.jsonl')
    if (!existsSync(notifPath)) return null
    const lines = readFileSync(notifPath, 'utf-8').trim().split('\n').filter(Boolean)
    const cutoff = Date.now() - 900000
    const recent = lines
      .map(l => { try { return JSON.parse(l) } catch { return null } })
      .filter((n: any) => n && n.timestamp && new Date(n.timestamp).getTime() > cutoff && !_displayedNotifTimestamps.has(String(n.timestamp)))
      .slice(-3)

    if (recent.length === 0) return null
    for (const n of recent) _displayedNotifTimestamps.add(String(n.timestamp))
    if (_displayedNotifTimestamps.size > 200) {
      const arr = [..._displayedNotifTimestamps]
      _displayedNotifTimestamps.clear()
      for (const t of arr.slice(-100)) _displayedNotifTimestamps.add(t)
    }
    return {
      type: 'pending-notifications',
      message: `\u{1F4EC} ${recent.length} 条未读通知: ${recent.map((n: any) => n.title || n.message?.slice(0, 30)).join(', ')}`,
      priority: 'medium',
      source: 'pending_notifications',
    }
  } catch { return null }
}

// ─── 检查器 8: LLM 驱动元检查器（本地智能推理，零 API 调用） ───

let _lastLLMInsightTime = 0
const LLM_INSIGHT_INTERVAL = 30 * 60 * 1000 // 30 分钟限频

function _checkLLMInsight(context: { messages: readonly any[]; turnCount: number }): ProactiveSuggestion | null {
  try {
    // 限频：30 分钟内只触发一次
    if (Date.now() - _lastLLMInsightTime < LLM_INSIGHT_INTERVAL) return null
    if (context.turnCount < 5) return null // 对话太短不分析

    _lastLLMInsightTime = Date.now()

    // 收集上下文信号
    const signals: string[] = []

    // 1. 分析对话模式
    const recentMessages = context.messages.slice(-10)
    const userMessages = recentMessages.filter((m: any) => m.type === 'user' || m.role === 'user')

    // 检测重复提问模式（用户可能卡住了）
    if (userMessages.length >= 3) {
      const lastThree = userMessages.slice(-3).map((m: any) => {
        const text = typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
        return text.slice(0, 50).toLowerCase()
      })
      // 简单相似度：共同词比例
      const words1 = new Set(lastThree[0]?.split(/\s+/) || [])
      const words2 = new Set(lastThree[1]?.split(/\s+/) || [])
      const words3 = new Set(lastThree[2]?.split(/\s+/) || [])
      const common12 = [...words1].filter(w => words2.has(w)).length
      const common23 = [...words2].filter(w => words3.has(w)).length
      if (common12 > words1.size * 0.5 && common23 > words2.size * 0.5) {
        signals.push('repeated-topic')
      }
    }

    // 2. 检测长时间未使用高效工具
    const toolUses = recentMessages
      .filter((m: any) => m.type === 'assistant')
      .flatMap((m: any) => {
        if (!Array.isArray(m.content)) return []
        return m.content.filter((b: any) => b.type === 'tool_use').map((b: any) => b.name)
      })

    const hasAgent = toolUses.some((t: string) => t === 'Agent' || t === 'agent')
    const hasPlan = toolUses.some((t: string) => t === 'EnterPlanMode')

    // 如果对话超过 10 轮但未使用 Agent 或 Plan，可能需要分解任务
    if (context.turnCount > 10 && !hasAgent && !hasPlan) {
      signals.push('no-delegation')
    }

    // 3. 检测错误累积
    const errorCount = recentMessages
      .filter((m: any) => m.type === 'assistant')
      .flatMap((m: any) => {
        if (!Array.isArray(m.content)) return []
        return m.content.filter((b: any) => b.type === 'tool_result' && b.is_error)
      }).length

    if (errorCount >= 3) {
      signals.push('error-accumulation')
    }

    // 4. 生成建议（按优先级返回最重要的一个）
    if (signals.includes('repeated-topic')) {
      return {
        type: 'llm-insight',
        message: '💡 检测到重复话题 — 试试换个角度描述需求，或用 /plan 先梳理思路？',
        priority: 'medium',
        source: 'llm_insight_repeated_topic',
      }
    }

    if (signals.includes('error-accumulation')) {
      return {
        type: 'llm-insight',
        message: '🔍 多次错误 — 建议先 /debug 查看日志，或用 Agent 分析根因。',
        priority: 'medium',
        source: 'llm_insight_error_accumulation',
      }
    }

    if (signals.includes('no-delegation')) {
      return {
        type: 'llm-insight',
        message: '🤖 长对话建议 — 考虑用 Agent 委派子任务，或 /plan 规划后再执行。',
        priority: 'low',
        source: 'llm_insight_no_delegation',
      }
    }

    return null
  } catch {
    return null
  }
}
