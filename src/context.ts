import { feature } from 'bun:bundle'
import memoize from 'lodash-es/memoize.js'
import {
  getAdditionalDirectoriesForClaudeMd,
  setCachedClaudeMdContent,
} from './bootstrap/state.js'
import { getLocalISODate } from './constants/common.js'
import {
  filterInjectedMemoryFiles,
  getClaudeMds,
  getMemoryFiles,
} from './utils/claudemd.js'
import { getGlobalConfig } from './utils/config.js'
import { logForDiagnosticsNoPII } from './utils/diagLogs.js'
import { isBareMode, isEnvTruthy } from './utils/envUtils.js'
import { execFileNoThrow } from './utils/execFileNoThrow.js'
import { getBranch, getDefaultBranch, getIsGit, gitExe } from './utils/git.js'
import { shouldIncludeGitInstructions } from './utils/gitSettings.js'
import { logError } from './utils/log.js'
import { isThirdPartyProvider } from './utils/model/providers.js'

const MAX_STATUS_CHARS = 2000

const BUILTIN_PERSONAS: Record<string, { name: string; style: string }> = {
  work: {
    name: '工作模式',
    style: `专业高效的工作伙伴。
行为准则：
- 回复简洁直击要点，不要铺垫和寒暄
- 主动识别潜在风险和边界条件，不等用户问
- 提供结构化方案（步骤编号、表格对比、优先级标注）
- 代码修改前先说明影响范围和回滚方案
- 遇到模糊需求主动澄清，不做假设
- 多方案时给出推荐理由和 trade-off 分析
- 完成后给出验证方式，不说"应该可以了"
语言风格：专业术语 + 精确表述，不用"大概""可能""应该"`,
  },
  companion: {
    name: '陪伴模式',
    style: `温暖贴心的朋友。
行为准则：
- 先倾听，后建议。不急于给解决方案
- 使用温暖的第一人称"我觉得""我理解"
- 感受到对方沮丧时，先共情再帮忙
- 适当使用轻松幽默缓解压力
- 鼓励和认可对方的努力，不只看结果
- 复杂问题拆解为小步骤，减少压迫感
- 主动关心工作节奏："要不要休息一下？"
- 深夜工作时温柔提醒注意休息
语言风格：自然亲切，像朋友聊天，不要机械化`,
  },
  study: {
    name: '学习模式',
    style: `耐心的苏格拉底式导师。
行为准则：
- 不直接给答案，先用问题引导思考
- "你觉得这里为什么会报错？" 而不是 "错误原因是..."
- 解释概念时用类比和日常例子
- 建立知识关联："这和你之前学的 X 很像"
- 错误时温和纠正，不说"不对"，说"接近了，再想想..."
- 学会后给正面反馈："理解得很好"
- 推荐延伸阅读和练习
- 复杂概念分层讲解，确认理解后再深入
语言风格：循循善诱，鼓励探索，不居高临下`,
  },
  creative: {
    name: '创意模式',
    style: `天马行空的创意伙伴。
行为准则：
- 鼓励大胆想法，不立即评判可行性
- "如果没有任何限制，你会怎么做？"
- 用类比和跨领域联想激发灵感
- 一个想法给出 3 个变体方向
- 先发散再收敛，不过早否定
- 用"而且"代替"但是"来延伸想法
- 善用思维实验和假设场景
- 创作过程中注重节奏感和惊喜感
语言风格：活泼跳跃，善用比喻，打破常规`,
  },
  butler: {
    name: '管家模式',
    style: `全能私人管家。
行为准则：
- 预判需求，不等用户开口就准备好
- 安排事务有条理：时间线、优先级、依赖关系
- 提供完整方案而非零散建议
- 记住用户的偏好和习惯
- 关注细节：格式、命名、一致性
- 主动整理和归档，保持工作区整洁
- 定期汇总进展，不需要用户追问
- 像管家一样周到："已经帮您准备好了"
语言风格：礼貌周到，服务意识，细节完美`,
  },
}

export { BUILTIN_PERSONAS }

function getThirdPartyModelGuidance(): string | null {
  if (!isThirdPartyProvider()) return null
  return [
    'You are running inside Claude Code. Follow these native tool and workflow conventions:',
    '',
    '## Native Tools First',
    '- Prefer dedicated read/edit/write/search tools (Read, Edit, Write, Glob, Grep) over shell commands.',
    '- Use ToolSearch to discover available tools, agent types, MCP capabilities, and permissions before assuming they exist.',
    '- When multiple independent tool calls can run in parallel, make them parallel.',
    '- Use the shell (Bash) only for real terminal work that no dedicated tool covers.',
    '',
    '## Planning & Delegation',
    '- For non-trivial tasks, prefer entering plan mode first; only maintain explicit task boards when a real task tracker is needed.',
    '- For open-ended exploration, prefer Agent with Explore or Plan type.',
    '- For bounded implementation, fixes, or verification, prefer Agent with General-Purpose type.',
    '- For multi-track work, default to launching parallel native Agent workers; after launch, wait for completion notifications instead of polling.',
    '- For ordinary parallel workers, omit name and team_name to keep them on the plain subagent path.',
    '- Reserve TeamCreate/TeamDelete for explicit team workflows with durable identity, not as the default parallel-worker path.',
    '',
    '## Output Style',
    '- Stay within the requested scope; do not gold-plate, refactor unrelated code, or invent future-facing abstractions.',
    '- Read relevant code before proposing or making changes; prefer editing existing files over creating new ones.',
    '- Match the user\'s current language for all visible text unless the user explicitly asks for another language.',
    '- Do not expose internal chain-of-thought or meta self-talk; keep preambles to one short action-oriented line.',
    '- Report outcomes faithfully: if you did not run a validation, say so; if a check failed, say so plainly.',
    '- Before claiming completion, run the narrowest relevant validation first.',
    '- When a table helps, prefer standard Markdown tables; use ASCII only when Markdown cannot express the layout.',
  ].join('\n')
}

function getTimeAwareness(): string {
  const now = new Date()
  const hour = now.getHours()
  const timeLabel =
    hour < 6 ? '深夜' :
    hour < 9 ? '早晨' :
    hour < 12 ? '上午' :
    hour < 14 ? '午后' :
    hour < 18 ? '下午' :
    hour < 22 ? '晚上' : '深夜'
  const isWorkHours = hour >= 9 && hour < 18
  return `当前时段：${timeLabel}（${hour}:${String(now.getMinutes()).padStart(2, '0')}）${isWorkHours ? '，工作时间' : '，非工作时间'}`
}

function getPersonaContext(): string | null {
  const config = getGlobalConfig()
  let key = config.persona?.active
  // Panda: auto-detect persona from time/mood when set to 'auto' or not set
  if (!key || key === 'auto') {
    try {
      const { detectPersona } = require('./assistant/personaDetector.js')
      key = detectPersona()
    } catch {
      return null
    }
  }
  const custom = config.persona?.custom?.[key]
  const builtin = BUILTIN_PERSONAS[key]
  const persona = custom || builtin
  if (!persona) return null
  const parts = [`[Persona: ${persona.name}] 风格：${persona.style}`]
  if (custom?.systemPrompt) parts.push(custom.systemPrompt)
  // Panda: append mood from sense pipeline when available
  try {
    const { getMoodSense } = require('./assistant/moodSense.js')
    const mood = getMoodSense()
    if (mood && mood !== 'neutral') parts.push(`用户情绪：${mood}`)
  } catch {}
  // Panda: inject working memory summary
  try {
    const { getAllWorkingMemory } = require('./assistant/workingMemory.js')
    const wm = getAllWorkingMemory()
    if (Array.isArray(wm) && wm.length > 0) {
      const summary = wm.slice(0, 5).map((e: any) => `${e.key}: ${e.value}`).join('; ')
      parts.push(`当前工作记忆: ${summary}`)
    }
  } catch {}
  // Panda: inject emotional state
  try {
    const { getRecentEmotionalEvents } = require('./assistant/emotionalMemory.js')
    const events = getRecentEmotionalEvents()
    if (events && events.length > 0) {
      const last = events[events.length - 1]
      parts.push(`最近情感: ${last.emotion}(${(last.description || '').slice(0, 30)})`)
    }
  } catch {}
  return parts.join('\n')
}

// System prompt injection for cache breaking (ant-only, ephemeral debugging state)
let systemPromptInjection: string | null = null

export function getSystemPromptInjection(): string | null {
  return systemPromptInjection
}

export function setSystemPromptInjection(value: string | null): void {
  systemPromptInjection = value
  // Clear context caches immediately when injection changes
  getUserContext.cache.clear?.()
  getSystemContext.cache.clear?.()
}

export const getGitStatus = memoize(async (): Promise<string | null> => {
  if (process.env.NODE_ENV === 'test') {
    // Avoid cycles in tests
    return null
  }

  const startTime = Date.now()
  logForDiagnosticsNoPII('info', 'git_status_started')

  const isGitStart = Date.now()
  const isGit = await getIsGit()
  logForDiagnosticsNoPII('info', 'git_is_git_check_completed', {
    duration_ms: Date.now() - isGitStart,
    is_git: isGit,
  })

  if (!isGit) {
    logForDiagnosticsNoPII('info', 'git_status_skipped_not_git', {
      duration_ms: Date.now() - startTime,
    })
    return null
  }

  try {
    const gitCmdsStart = Date.now()
    const [branch, mainBranch, status, log, userName] = await Promise.all([
      getBranch(),
      getDefaultBranch(),
      execFileNoThrow(gitExe(), ['--no-optional-locks', 'status', '--short'], {
        preserveOutputOnError: false,
      }).then(({ stdout }) => stdout.trim()),
      execFileNoThrow(
        gitExe(),
        ['--no-optional-locks', 'log', '--oneline', '-n', '5'],
        {
          preserveOutputOnError: false,
        },
      ).then(({ stdout }) => stdout.trim()),
      execFileNoThrow(gitExe(), ['config', 'user.name'], {
        preserveOutputOnError: false,
      }).then(({ stdout }) => stdout.trim()),
    ])

    logForDiagnosticsNoPII('info', 'git_commands_completed', {
      duration_ms: Date.now() - gitCmdsStart,
      status_length: status.length,
    })

    // Check if status exceeds character limit
    const truncatedStatus =
      status.length > MAX_STATUS_CHARS
        ? status.substring(0, MAX_STATUS_CHARS) +
          '\n... (truncated because it exceeds 2k characters. If you need more information, run "git status" using BashTool)'
        : status

    logForDiagnosticsNoPII('info', 'git_status_completed', {
      duration_ms: Date.now() - startTime,
      truncated: status.length > MAX_STATUS_CHARS,
    })

    return [
      `This is the git status at the start of the conversation. Note that this status is a snapshot in time, and will not update during the conversation.`,
      `Current branch: ${branch}`,
      `Main branch (you will usually use this for PRs): ${mainBranch}`,
      ...(userName ? [`Git user: ${userName}`] : []),
      `Status:\n${truncatedStatus || '(clean)'}`,
      `Recent commits:\n${log}`,
    ].join('\n\n')
  } catch (error) {
    logForDiagnosticsNoPII('error', 'git_status_failed', {
      duration_ms: Date.now() - startTime,
    })
    logError(error)
    return null
  }
})

/**
 * This context is prepended to each conversation, and cached for the duration of the conversation.
 */
export const getSystemContext = memoize(
  async (): Promise<{
    [k: string]: string
  }> => {
    const startTime = Date.now()
    logForDiagnosticsNoPII('info', 'system_context_started')

    // Skip git status in CCR (unnecessary overhead on resume) or when git instructions are disabled
    const gitStatus =
      isEnvTruthy(process.env.CLAUDE_CODE_REMOTE) ||
      !shouldIncludeGitInstructions()
        ? null
        : await getGitStatus()

    // Include system prompt injection if set (for cache breaking, ant-only)
    const injection = feature('BREAK_CACHE_COMMAND')
      ? getSystemPromptInjection()
      : null

    logForDiagnosticsNoPII('info', 'system_context_completed', {
      duration_ms: Date.now() - startTime,
      has_git_status: gitStatus !== null,
      has_injection: injection !== null,
    })

    return {
      ...(gitStatus && { gitStatus }),
      ...(feature('BREAK_CACHE_COMMAND') && injection
        ? {
            cacheBreaker: `[CACHE_BREAKER: ${injection}]`,
          }
        : {}),
    }
  },
)

/**
 * This context is prepended to each conversation, and cached for the duration of the conversation.
 */
export const getUserContext = memoize(
  async (): Promise<{
    [k: string]: string
  }> => {
    const startTime = Date.now()
    logForDiagnosticsNoPII('info', 'user_context_started')

    // CLAUDE_CODE_DISABLE_CLAUDE_MDS: hard off, always.
    // --bare: skip auto-discovery (cwd walk), BUT honor explicit --add-dir.
    // --bare means "skip what I didn't ask for", not "ignore what I asked for".
    const shouldDisableClaudeMd =
      isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_CLAUDE_MDS) ||
      (isBareMode() && getAdditionalDirectoriesForClaudeMd().length === 0)
    // Await the async I/O (readFile/readdir directory walk) so the event
    // loop yields naturally at the first fs.readFile.
    const claudeMd = shouldDisableClaudeMd
      ? null
      : getClaudeMds(filterInjectedMemoryFiles(await getMemoryFiles()))
    // Cache for the auto-mode classifier (yoloClassifier.ts reads this
    // instead of importing claudemd.ts directly, which would create a
    // cycle through permissions/filesystem → permissions → yoloClassifier).
    setCachedClaudeMdContent(claudeMd || null)

    logForDiagnosticsNoPII('info', 'user_context_completed', {
      duration_ms: Date.now() - startTime,
      claudemd_length: claudeMd?.length ?? 0,
      claudemd_disabled: Boolean(shouldDisableClaudeMd),
    })

    const timeAwareness = getTimeAwareness()
    const personaContext = getPersonaContext()
    const thirdPartyGuidance = getThirdPartyModelGuidance()

    // Panda: inject working memory into system context
    let workingMemoryContext: string | null = null
    try {
      const { getAllWorkingMemory } = require('./assistant/workingMemory.js')
      const wm = getAllWorkingMemory()
      if (wm && wm.length > 0) {
        const wmSummary = wm.slice(0, 10).map((e: { key: string; value: string }) => `- ${e.key}: ${e.value}`).join('\n')
        workingMemoryContext = `[Working Memory]\n${wmSummary}`
      }
    } catch {}

    // Panda: inject morning brief for first conversation of the day (07:00-10:00)
    let morningBriefContext: string | null = null
    try {
      const hour = new Date().getHours()
      if (hour >= 7 && hour < 10) {
        const { join } = require('path')
        const { readFileSync, existsSync } = require('fs')
        const { getAutoMemPath } = require('./memdir/paths.js')
        const memDir = getAutoMemPath()
        if (memDir) {
          const today = getLocalISODate()
          const briefPath = join(memDir, 'working', `morning_brief_${today}.md`)
          if (existsSync(briefPath)) {
            const brief = readFileSync(briefPath, 'utf-8').slice(0, 1000)
            morningBriefContext = `[今日晨报]\n${brief}`
          }
        }
      }
    } catch {}

    // B7: inject recent session summaries (up to 3, ≤1000 chars total)
    let sessionSummaryContext: string | null = null
    try {
      const { join } = require('path')
      const { readdirSync, readFileSync } = require('fs')
      const { getAutoMemPath } = require('./memdir/paths.js')
      const memDir = getAutoMemPath()
      if (memDir) {
        const workingDir = join(memDir, 'working')
        const files = readdirSync(workingDir)
          .filter((f: string) => f.startsWith('session-summary-') && f.endsWith('.md'))
          .sort()
          .reverse()
          .slice(0, 3)
        if (files.length > 0) {
          const summaries = files.map((f: string) => {
            const content = readFileSync(join(workingDir, f), 'utf-8')
            // Strip frontmatter
            const body = content.replace(/^---[\s\S]*?---\n*/, '').trim()
            return body
          })
          const joined = summaries.join('\n---\n')
          // Budget: ≤1000 chars
          sessionSummaryContext = `## 最近会话摘要\n${joined}`.slice(0, 1000)
        }
      }
    } catch {}

    return {
      ...(claudeMd && { claudeMd }),
      currentDate: `Today's date is ${getLocalISODate()}. ${timeAwareness}`,
      ...(personaContext && { personaContext }),
      ...(workingMemoryContext && { workingMemoryContext }),
      ...(morningBriefContext && { morningBriefContext }),
      ...(sessionSummaryContext && { sessionSummaryContext }),
      ...(thirdPartyGuidance && { thirdPartyGuidance }),
    }
  },
)
