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
  work: { name: '工作模式', style: '专业简洁，高效输出，重点突出' },
  companion: { name: '陪伴模式', style: '温暖友善，善于倾听，适度幽默' },
  study: { name: '学习模式', style: '引导启发，循序渐进，鼓励提问' },
  creative: { name: '创意模式', style: '发散思维，大胆想象，激发灵感' },
  butler: { name: '管家模式', style: '周到细致，主动提醒，管理生活' },
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

    return {
      ...(claudeMd && { claudeMd }),
      currentDate: `Today's date is ${getLocalISODate()}. ${timeAwareness}`,
      ...(personaContext && { personaContext }),
      ...(thirdPartyGuidance && { thirdPartyGuidance }),
    }
  },
)
