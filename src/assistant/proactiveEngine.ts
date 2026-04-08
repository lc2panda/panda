// Input: 对话上下文（消息列表、回合数、会话开始时间）
// Output: 主动建议列表 ProactiveSuggestion[]，格式化为系统消息
// Pos: assistant/ 主动交互引擎（被动层），由 stopHooks 在每轮结束后调用
//      主动层（时间驱动）在 proactive/builtinTasks.ts 中：日历提醒、Git 提醒、画像过期
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的md。

import { join } from 'path'
import { readFileSync, statSync } from 'fs'

// ═══════════════════════════════════════════════════════════════════
// SA-P4: 主动交互引擎——零 API 调用，纯本地条件检测
// ═══════════════════════════════════════════════════════════════════

export interface ProactiveSuggestion {
  type: 'reminder' | 'insight' | 'alert' | 'tip'
  priority: 'low' | 'medium' | 'high'
  message: string
  source: string // 触发来源
}

// 频率限制：每会话每类型最多推送 1 次
const _emittedTypes = new Set<string>()

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
  ]

  for (const checker of checkers) {
    try {
      const result = checker()
      if (result) suggestions.push(result)
    } catch {
      // 单个检查器失败，静默跳过
    }
  }

  // 频率限制过滤：同类型建议每会话仅推送一次
  const filtered = suggestions.filter(s => {
    const key = `${s.type}:${s.source}`
    if (_emittedTypes.has(key)) return false
    _emittedTypes.add(key)
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
  if (hour >= 7 && hour < 9) {
    try {
      const { getAutoMemPath } = require('../memdir/paths.js') as typeof import('../memdir/paths.js')
      const memDir = getAutoMemPath()
      if (!memDir) return null

      // 检查是否有 briefing 目录下的文件
      const briefingDir = join(memDir, 'semantic', 'briefing')
      const { readdirSync } = require('fs')
      const files = readdirSync(briefingDir).filter((f: string) => f.endsWith('.md'))
      if (files.length > 0) {
        return {
          type: 'tip',
          priority: 'low',
          message: `早上好！发现 ${files.length} 份简报待阅读。可使用 /memory briefing 查看。`,
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
