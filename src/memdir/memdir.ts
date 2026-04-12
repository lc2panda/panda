import { feature } from 'bun:bundle'
import { join, relative } from 'path'
import { readFileSync, readdirSync, statSync, unlinkSync, writeFileSync, mkdirSync, renameSync, copyFileSync, existsSync } from 'fs'
import { access, writeFile, readFile, appendFile, mkdir } from 'fs/promises'
import { homedir, tmpdir } from 'os'
import { getFsImplementation } from '../utils/fsOperations.js'
import { getAutoMemPath, isAutoMemoryEnabled } from './paths.js'

/* eslint-disable @typescript-eslint/no-require-imports */
const teamMemPaths = feature('TEAMMEM')
  ? (require('./teamMemPaths.js') as typeof import('./teamMemPaths.js'))
  : null

import { getKairosActive, getOriginalCwd } from '../bootstrap/state.js'
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../services/analytics/growthbook.js'
/* eslint-enable @typescript-eslint/no-require-imports */
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../services/analytics/index.js'
import { GREP_TOOL_NAME } from '../tools/GrepTool/prompt.js'
import { isReplModeEnabled } from '../tools/REPLTool/constants.js'
import { localDateStr } from '../utils/date.js'
import { logForDebugging } from '../utils/debug.js'
import { hasEmbeddedSearchTools } from '../utils/embeddedTools.js'
import { isEnvTruthy } from '../utils/envUtils.js'
import { formatFileSize } from '../utils/format.js'
import { getProjectDir } from '../utils/sessionStorage.js'
import { getInitialSettings } from '../utils/settings/settings.js'
import {
  MEMORY_FRONTMATTER_EXAMPLE,
  TRUSTING_RECALL_SECTION,
  TYPES_SECTION_INDIVIDUAL,
  WHAT_NOT_TO_SAVE_SECTION,
  WHEN_TO_ACCESS_SECTION,
} from './memoryTypes.js'

export const ENTRYPOINT_NAME = 'MEMORY.md'
export const MAX_ENTRYPOINT_LINES = 200
// ~125 chars/line at 200 lines. At p97 today; catches long-line indexes that
// slip past the line cap (p100 observed: 197KB under 200 lines).
export const MAX_ENTRYPOINT_BYTES = 25_000
const AUTO_MEM_DISPLAY_NAME = 'auto memory'

export type EntrypointTruncation = {
  content: string
  lineCount: number
  byteCount: number
  wasLineTruncated: boolean
  wasByteTruncated: boolean
}

/**
 * Truncate MEMORY.md content to the line AND byte caps, appending a warning
 * that names which cap fired. Line-truncates first (natural boundary), then
 * byte-truncates at the last newline before the cap so we don't cut mid-line.
 *
 * Shared by buildMemoryPrompt and claudemd getMemoryFiles (previously
 * duplicated the line-only logic).
 */
export function truncateEntrypointContent(raw: string): EntrypointTruncation {
  const trimmed = raw.trim()
  const contentLines = trimmed.split('\n')
  const lineCount = contentLines.length
  const byteCount = trimmed.length

  const wasLineTruncated = lineCount > MAX_ENTRYPOINT_LINES
  // Check original byte count — long lines are the failure mode the byte cap
  // targets, so post-line-truncation size would understate the warning.
  const wasByteTruncated = byteCount > MAX_ENTRYPOINT_BYTES

  if (!wasLineTruncated && !wasByteTruncated) {
    return {
      content: trimmed,
      lineCount,
      byteCount,
      wasLineTruncated,
      wasByteTruncated,
    }
  }

  let truncated = wasLineTruncated
    ? contentLines.slice(0, MAX_ENTRYPOINT_LINES).join('\n')
    : trimmed

  if (truncated.length > MAX_ENTRYPOINT_BYTES) {
    const cutAt = truncated.lastIndexOf('\n', MAX_ENTRYPOINT_BYTES)
    truncated = truncated.slice(0, cutAt > 0 ? cutAt : MAX_ENTRYPOINT_BYTES)
  }

  const reason =
    wasByteTruncated && !wasLineTruncated
      ? `${formatFileSize(byteCount)} (limit: ${formatFileSize(MAX_ENTRYPOINT_BYTES)}) — index entries are too long`
      : wasLineTruncated && !wasByteTruncated
        ? `${lineCount} lines (limit: ${MAX_ENTRYPOINT_LINES})`
        : `${lineCount} lines and ${formatFileSize(byteCount)}`

  return {
    content:
      truncated +
      `\n\n> WARNING: ${ENTRYPOINT_NAME} is ${reason}. Only part of it was loaded. Keep index entries to one line under ~200 chars; move detail into topic files.`,
    lineCount,
    byteCount,
    wasLineTruncated,
    wasByteTruncated,
  }
}

/**
 * Write-time validation for MEMORY.md content. Returns a warning string
 * if the content exceeds line or byte caps, null if within limits.
 * Does NOT block writes — callers can log or surface the warning.
 */
export function warnIfEntrypointExceedsLimits(content: string): string | null {
  const trimmed = content.trim()
  const lineCount = trimmed.split('\n').length
  const byteCount = trimmed.length

  if (lineCount <= MAX_ENTRYPOINT_LINES && byteCount <= MAX_ENTRYPOINT_BYTES) {
    return null
  }

  const issues: string[] = []
  if (lineCount > MAX_ENTRYPOINT_LINES) {
    issues.push(`${lineCount} lines (limit: ${MAX_ENTRYPOINT_LINES})`)
  }
  if (byteCount > MAX_ENTRYPOINT_BYTES) {
    issues.push(`${byteCount} bytes (limit: ${MAX_ENTRYPOINT_BYTES})`)
  }
  return `${ENTRYPOINT_NAME} exceeds limits: ${issues.join(', ')}. Consider pruning.`
}

/* eslint-disable @typescript-eslint/no-require-imports */
const teamMemPrompts = feature('TEAMMEM')
  ? (require('./teamMemPrompts.js') as typeof import('./teamMemPrompts.js'))
  : null
/* eslint-enable @typescript-eslint/no-require-imports */

/**
 * Shared guidance text appended to each memory directory prompt line.
 * Shipped because Claude was burning turns on `ls`/`mkdir -p` before writing.
 * Harness guarantees the directory exists via ensureMemoryDirExists().
 */
export const DIR_EXISTS_GUIDANCE =
  'This directory already exists — write to it directly with the Write tool (do not run mkdir or check for its existence).'
export const DIRS_EXIST_GUIDANCE =
  'Both directories already exist — write to them directly with the Write tool (do not run mkdir or check for their existence).'

/**
 * Ensure a memory directory exists. Idempotent — called from loadMemoryPrompt
 * (once per session via systemPromptSection cache) so the model can always
 * write without checking existence first. FsOperations.mkdir is recursive
 * by default and already swallows EEXIST, so the full parent chain
 * (~/.pandacc/projects/<slug>/memory/) is created in one call with no
 * try/catch needed for the happy path.
 */
export async function ensureMemoryDirExists(memoryDir: string): Promise<void> {
  // 确保 ~/.pandacc/ 基础目录结构存在（首次启动）
  try {
    const { ensurePandaccDirs } = require('../proactive/platform.js') as typeof import('../proactive/platform.js')
    ensurePandaccDirs()
  } catch {}

  const fs = getFsImplementation()
  try {
    await fs.mkdir(memoryDir)
  } catch (e) {
    // fs.mkdir already handles EEXIST internally. Anything reaching here is
    // a real problem (EACCES/EPERM/EROFS) — log so --debug shows why. Prompt
    // building continues either way; the model's Write will surface the
    // real perm error (and FileWriteTool does its own mkdir of the parent).
    const code =
      e instanceof Error && 'code' in e && typeof e.code === 'string'
        ? e.code
        : undefined
    logForDebugging(
      `ensureMemoryDirExists failed for ${memoryDir}: ${code ?? String(e)}`,
      { level: 'debug' },
    )
  }

  // ── Patterns & Scars subdirectories (Meta_Kim P1-5) ──────────
  // Create subdirectories for structured memory:
  //   patterns/ — successful approaches worth repeating
  //   scars/    — failures and lessons learned to avoid
  // fs.mkdir is recursive and swallows EEXIST, so these are idempotent.
  for (const subdir of ['patterns', 'scars']) {
    try {
      await fs.mkdir(join(memoryDir, subdir))
    } catch (e) {
      const code =
        e instanceof Error && 'code' in e && typeof e.code === 'string'
          ? e.code
          : undefined
      logForDebugging(
        `ensureMemoryDirExists failed for ${join(memoryDir, subdir)}: ${code ?? String(e)}`,
        { level: 'debug' },
      )
    }
  }

  // ── 五层记忆目录 (SA-P0-01) ──────────
  const memorySubdirs = ['working', 'episodes', 'semantic', 'procedural', 'dreams']
  for (const sub of memorySubdirs) {
    try {
      await mkdir(join(memoryDir, sub), { recursive: true })
    } catch {}
  }

  // 初始化 semantic/profile.md（仅首次）
  const profilePath = join(memoryDir, 'semantic', 'profile.md')
  try {
    await access(profilePath)
  } catch {
    const template = `---
name: 用户画像
description: 自动维护的用户特征档案
type: user
---

## 基础信息
（自动填充）

## 工作模式
（自动填充）

## 偏好
（自动填充）

## 进化日志
`
    await writeFile(profilePath, template, 'utf-8')
  }
}

// ═══════════════════════════════════════════════════════════════════
// 情景记忆写入 (P0-2)
// ═══════════════════════════════════════════════════════════════════

/**
 * 保存情景记忆到 episodes/ 目录。
 * 每次会话结束或 DeepDream 触发时调用。
 * 写入 episodes/YYYY-MM-DD_HH-mm.md 格式文件。
 */
export async function saveEpisodicMemory(sessionSummary: string, opts?: {
  tools?: string[]
  decisions?: string[]
}): Promise<string | null> {
  const memoryDir = getAutoMemPath()
  if (!memoryDir) return null

  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}`
  const episodesDir = join(memoryDir, 'episodes')
  const filePath = join(episodesDir, `${dateStr}.md`)

  const toolsList = opts?.tools ?? []
  const decisionsList = opts?.decisions ?? []
  const timestamp = now.getTime()
  const turnCount = toolsList.length
  const durationSec = Math.round((Date.now() - ((globalThis as any).__sessionStartMs || Date.now())) / 1000)

  const frontmatter = [
    '---',
    'type: episodic',
    `date: ${now.toISOString()}`,
    `tools: [${toolsList.map(t => `"${t}"`).join(', ')}]`,
    `turnCount: ${turnCount}`,
    `duration: ${durationSec}`,
    'strength: 1.0',
    `lastAccessed: ${timestamp}`,
    '---',
  ].join('\n')

  const body = [
    '',
    `## 会话摘要`,
    '',
    sessionSummary,
    '',
  ]

  if (decisionsList.length > 0) {
    body.push('## 关键决策', '')
    for (const d of decisionsList) {
      body.push(`- ${d}`)
    }
    body.push('')
  }

  if (toolsList.length > 0) {
    body.push('## 使用工具', '')
    for (const t of toolsList) {
      body.push(`- ${t}`)
    }
    body.push('')
  }

  body.push(`> 记录时间: ${now.toISOString()}`)

  try {
    await mkdir(episodesDir, { recursive: true })
    await writeFile(filePath, frontmatter + '\n' + body.join('\n') + '\n', 'utf-8')
    return filePath
  } catch {
    return null
  }
}

/**
 * 读取最近 N 条情景记忆摘要，供系统提示注入使用。
 * 按 mtime 倒序，每条取前 8 行。任何异常返回空串。
 */
export async function loadRecentEpisodes(n: number = 3): Promise<string> {
  try {
    const memDir = getAutoMemPath()
    if (!memDir) return ''
    const episodesDir = join(memDir, 'episodes')
    let files: string[]
    try {
      files = readdirSync(episodesDir).filter(f => f.endsWith('.md'))
    } catch {
      return ''
    }
    if (files.length === 0) return ''
    const sorted = files
      .map(f => ({ f, mtime: statSync(join(episodesDir, f)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime)
      .slice(0, n)
    const summaries: string[] = []
    for (const { f } of sorted) {
      try {
        const content = readFileSync(join(episodesDir, f), 'utf-8')
        const lines = content.split('\n').slice(0, 8).join('\n')
        summaries.push(`### ${f.replace('.md', '')}\n${lines}`)
      } catch {}
    }
    return summaries.join('\n\n')
  } catch {
    return ''
  }
}

// ═══════════════════════════════════════════════════════════════════
// 前瞻记忆 (Prospective Memory)
// ═══════════════════════════════════════════════════════════════════

export function saveProspectiveMemory(content: string): void {
  try {
    const memDir = getAutoMemPath()
    if (!memDir) return
    const dir = join(memDir, 'dreams', 'prospective')
    mkdirSync(dir, { recursive: true })
    const date = localDateStr()
    const filePath = join(dir, `${date}.md`)

    // 读取 habits.md 生成行为预测
    let habitsPrediction = ''
    try {
      const habitsPath = join(memDir, 'procedural', 'habits.md')
      if (existsSync(habitsPath)) {
        const habitsContent = readFileSync(habitsPath, 'utf-8')
        const peakMatch = habitsContent.match(/高频时段[：:]\s*(.+)/)?.[1]
        if (peakMatch) {
          habitsPrediction = `\n## 行为预测（基于习惯）\n- 预计高产时段: ${peakMatch}\n`
          // 判断明天是周几
          const tomorrow = new Date(Date.now() + 86400000)
          const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
          habitsPrediction += `- 明天是${dayNames[tomorrow.getDay()]}，参考历史同天活动模式\n`
        }
      }
    } catch {}

    const frontmatter = [
      '---',
      'type: prospective',
      `date: ${date}`,
      `generated: ${new Date().toISOString()}`,
      '---',
      '',
    ].join('\n')
    writeFileSync(filePath, frontmatter + content + habitsPrediction, 'utf-8')
  } catch {}
}

// ═══════════════════════════════════════════════════════════════════
// 程序记忆 — 成功模式 & 失败教训
// ═══════════════════════════════════════════════════════════════════

export function recordPattern(tools: string[], context: string): void {
  try {
    const memDir = getAutoMemPath()
    if (!memDir) return
    const dir = join(memDir, 'procedural', 'patterns')
    mkdirSync(dir, { recursive: true })
    const now = new Date()
    const ts = now.toISOString().replace(/[:.]/g, '-').slice(0, 16)
    const filePath = join(dir, `${ts}.md`)
    const content = [
      '---',
      'type: pattern',
      `date: ${now.toISOString()}`,
      `tools: [${tools.map(t => `"${t}"`).join(', ')}]`,
      `context: "${context.replace(/"/g, '\\"')}"`,
      'strength: 1.0',
      '---',
      '',
      `## 成功模式`,
      '',
      `工具链: ${tools.join(' → ')}`,
      `场景: ${context}`,
      '',
    ].join('\n')
    writeFileSync(filePath, content, 'utf-8')
  } catch {}
}

export function recordScar(error: string, context: string): void {
  try {
    const memDir = getAutoMemPath()
    if (!memDir) return
    const dir = join(memDir, 'procedural', 'scars')
    mkdirSync(dir, { recursive: true })
    const now = new Date()
    const ts = now.toISOString().replace(/[:.]/g, '-').slice(0, 16)
    const filePath = join(dir, `${ts}.md`)
    const content = [
      '---',
      'type: scar',
      `date: ${now.toISOString()}`,
      `error: "${error.slice(0, 100).replace(/"/g, '\\"')}"`,
      `context: "${context.replace(/"/g, '\\"')}"`,
      '---',
      '',
      `## 失败教训`,
      '',
      `错误: ${error.slice(0, 200)}`,
      `场景: ${context}`,
      '',
    ].join('\n')
    writeFileSync(filePath, content, 'utf-8')
  } catch {}
}

// ═══════════════════════════════════════════════════════════════════
// 记忆访问时间更新 (P1-7)
// ═══════════════════════════════════════════════════════════════════

/**
 * 更新记忆文件 frontmatter 中的 lastAccessed 字段。
 * 用于搜索命中时刷新访问时间，使 Ebbinghaus 衰减机制正常工作。
 * 注意：不在 decayAndPruneMemories 中调用，避免循环。
 */
export function touchMemoryAccess(filePath: string): void {
  try {
    let content = readFileSync(filePath, 'utf-8')
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/)
    if (!fmMatch) return

    const now = Date.now()
    const fmEnd = content.indexOf('\n---', 4)
    if (fmEnd < 0) return

    const fmSection = content.slice(0, fmEnd)
    const rest = content.slice(fmEnd)

    if (/lastAccessed:\s*\d+/.test(fmSection)) {
      content = fmSection.replace(/lastAccessed:\s*\d+/, `lastAccessed: ${now}`) + rest
    } else {
      content = fmSection + `\nlastAccessed: ${now}` + rest
    }

    writeFileSync(filePath, content, 'utf-8')
  } catch {}
}

/**
 * Log memory directory file/subdir counts asynchronously.
 * Fire-and-forget — doesn't block prompt building.
 */
function logMemoryDirCounts(
  memoryDir: string,
  baseMetadata: Record<
    string,
    | number
    | boolean
    | AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
  >,
): void {
  const fs = getFsImplementation()
  void fs.readdir(memoryDir).then(
    dirents => {
      let fileCount = 0
      let subdirCount = 0
      for (const d of dirents) {
        if (d.isFile()) {
          fileCount++
        } else if (d.isDirectory()) {
          subdirCount++
        }
      }
      logEvent('tengu_memdir_loaded', {
        ...baseMetadata,
        total_file_count: fileCount,
        total_subdir_count: subdirCount,
      })
    },
    () => {
      // Directory unreadable — log without counts
      logEvent('tengu_memdir_loaded', baseMetadata)
    },
  )
}

/**
 * Build the typed-memory behavioral instructions (without MEMORY.md content).
 * Constrains memories to a closed four-type taxonomy (user / feedback / project /
 * reference) — content that is derivable from the current project state (code
 * patterns, architecture, git history) is explicitly excluded.
 *
 * Individual-only variant: no `## Memory scope` section, no <scope> tags
 * in type blocks, and team/private qualifiers stripped from examples.
 *
 * Used by both buildMemoryPrompt (agent memory, includes content) and
 * loadMemoryPrompt (system prompt, content injected via user context instead).
 */
export function buildMemoryLines(
  displayName: string,
  memoryDir: string,
  extraGuidelines?: string[],
  skipIndex = false,
): string[] {
  const howToSave = skipIndex
    ? [
        '## How to save memories',
        '',
        'Write each memory to its own file (e.g., `user_role.md`, `feedback_testing.md`) using this frontmatter format:',
        '',
        ...MEMORY_FRONTMATTER_EXAMPLE,
        '',
        '- Keep the name, description, and type fields in memory files up-to-date with the content',
        '- Organize memory semantically by topic, not chronologically',
        '- Update or remove memories that turn out to be wrong or outdated',
        '- Do not write duplicate memories. First check if there is an existing memory you can update before writing a new one.',
      ]
    : [
        '## How to save memories',
        '',
        'Saving a memory is a two-step process:',
        '',
        '**Step 1** — write the memory to its own file (e.g., `user_role.md`, `feedback_testing.md`) using this frontmatter format:',
        '',
        ...MEMORY_FRONTMATTER_EXAMPLE,
        '',
        `**Step 2** — add a pointer to that file in \`${ENTRYPOINT_NAME}\`. \`${ENTRYPOINT_NAME}\` is an index, not a memory — each entry should be one line, under ~150 characters: \`- [Title](file.md) — one-line hook\`. It has no frontmatter. Never write memory content directly into \`${ENTRYPOINT_NAME}\`.`,
        '',
        `- \`${ENTRYPOINT_NAME}\` is always loaded into your conversation context — lines after ${MAX_ENTRYPOINT_LINES} will be truncated, so keep the index concise`,
        '- Keep the name, description, and type fields in memory files up-to-date with the content',
        '- Organize memory semantically by topic, not chronologically',
        '- Update or remove memories that turn out to be wrong or outdated',
        '- Do not write duplicate memories. First check if there is an existing memory you can update before writing a new one.',
      ]

  const lines: string[] = [
    `# ${displayName}`,
    '',
    `You have a persistent, file-based memory system at \`${memoryDir}\`. ${DIR_EXISTS_GUIDANCE}`,
    '',
    "You should build up this memory system over time so that future conversations can have a complete picture of who the user is, how they'd like to collaborate with you, what behaviors to avoid or repeat, and the context behind the work the user gives you.",
    '',
    'If the user explicitly asks you to remember something, save it immediately as whichever type fits best. If they ask you to forget something, find and remove the relevant entry.',
    '',
    ...TYPES_SECTION_INDIVIDUAL,
    ...WHAT_NOT_TO_SAVE_SECTION,
    '',
    ...howToSave,
    '',
    ...WHEN_TO_ACCESS_SECTION,
    '',
    ...TRUSTING_RECALL_SECTION,
    '',
    '## Memory and other forms of persistence',
    'Memory is one of several persistence mechanisms available to you as you assist the user in a given conversation. The distinction is often that memory can be recalled in future conversations and should not be used for persisting information that is only useful within the scope of the current conversation.',
    '- When to use or update a plan instead of memory: If you are about to start a non-trivial implementation task and would like to reach alignment with the user on your approach you should use a Plan rather than saving this information to memory. Similarly, if you already have a plan within the conversation and you have changed your approach persist that change by updating the plan rather than saving a memory.',
    '- When to use or update tasks instead of memory: When you need to break your work in current conversation into discrete steps or keep track of your progress use tasks instead of saving to memory. Tasks are great for persisting information about the work that needs to be done in the current conversation, but memory should be reserved for information that will be useful in future conversations.',
    '',
    ...(extraGuidelines ?? []),
    '',
    '## Patterns & Scars',
    '',
    `Two special subdirectories exist under \`${memoryDir}\` for structured learning:`,
    '',
    `- **\`patterns/\`** — Successful approaches worth repeating. When a strategy, workflow, or solution works well, save a concise \`.md\` file here describing the pattern, when to apply it, and why it works.`,
    `- **\`scars/\`** — Failures and lessons learned. When something goes wrong (a debugging dead-end, a broken assumption, a regressed approach), save a concise \`.md\` file here describing what happened, the root cause, and how to avoid it.`,
    '',
    'Each file should be a short, focused note (under 50 lines). Use descriptive filenames like `patterns/bun-test-watch.md` or `scars/recursive-import-loop.md`. These directories already exist — write directly.',
    '',
  ]

  lines.push(...buildSearchingPastContextSection(memoryDir))

  // 搜索指引
  lines.push('## Memory search')
  lines.push('If the user asks to search memories, use the Read tool to scan files in the memory directory.')
  lines.push('')

  // 用户画像自主维护指引
  lines.push('## User Profile (自主维护)')
  lines.push(`Your memory directory has a \`semantic/profile.md\` file — this is the user's evolving profile.`)
  lines.push('**You MUST proactively update it** when you learn new things about the user during conversation:')
  lines.push('- Communication style, language preferences, tone preferences')
  lines.push('- Work habits, active hours, project focus areas')
  lines.push('- Technical preferences (languages, frameworks, tools, conventions)')
  lines.push('- Decision-making patterns, priorities, management style')
  lines.push('- Interests, goals, recurring topics')
  lines.push('- People they work with, relationships, team structure')
  lines.push('')
  lines.push('Use the Edit tool to update `semantic/profile.md` directly — fill in structured sections and append to the evolution log.')
  lines.push('Also append raw observations to the monthly log: `semantic/profile-logs/YYYY-MM.md`')
  lines.push('Do NOT wait until the end of the conversation — update as soon as you observe something noteworthy.')
  lines.push('The longer the user uses you, the more accurate and detailed this profile should become.')
  lines.push('')

  // 非编码能力指引
  lines.push('## Non-coding capabilities')
  lines.push('The assistant has these built-in functions available through natural language:')
  lines.push('- **Writing**: Ask to "generate outline for [topic]" or "compile writings in [dir]"')
  lines.push('- **Knowledge capture**: Ask to "capture this idea: [text]" or "search my notes for [query]"')
  lines.push('- **Learning**: Ask to "generate flashcards from [content]" or "plan learning path for [topic]"')
  lines.push('- **File organization**: Ask to "organize my Downloads folder" or "classify files in [dir]"')
  lines.push('')

  return lines
}

/**
 * Build the typed-memory prompt with MEMORY.md content included.
 * Used by agent memory (which has no getClaudeMds() equivalent).
 */
export function buildMemoryPrompt(params: {
  displayName: string
  memoryDir: string
  extraGuidelines?: string[]
}): string {
  const { displayName, memoryDir, extraGuidelines } = params
  const fs = getFsImplementation()
  const entrypoint = memoryDir + ENTRYPOINT_NAME

  // Directory creation is the caller's responsibility (loadMemoryPrompt /
  // loadAgentMemoryPrompt). Builders only read, they don't mkdir.

  // Read existing memory entrypoint (sync: prompt building is synchronous)
  let entrypointContent = ''
  try {
    // eslint-disable-next-line custom-rules/no-sync-fs
    entrypointContent = fs.readFileSync(entrypoint, { encoding: 'utf-8' })
  } catch {
    // No memory file yet
  }

  const lines = buildMemoryLines(displayName, memoryDir, extraGuidelines)

  if (entrypointContent.trim()) {
    const t = truncateEntrypointContent(entrypointContent)
    const memoryType = displayName === AUTO_MEM_DISPLAY_NAME ? 'auto' : 'agent'
    logMemoryDirCounts(memoryDir, {
      content_length: t.byteCount,
      line_count: t.lineCount,
      was_truncated: t.wasLineTruncated,
      was_byte_truncated: t.wasByteTruncated,
      memory_type:
        memoryType as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    })
    lines.push(`## ${ENTRYPOINT_NAME}`, '', t.content)
  } else {
    lines.push(
      `## ${ENTRYPOINT_NAME}`,
      '',
      `Your ${ENTRYPOINT_NAME} is currently empty. When you save new memories, they will appear here.`,
    )
  }

  // ── Patterns & Scars content injection (Meta_Kim P1-5) ───────
  // Scan patterns/ and scars/ subdirectories for .md files and append
  // their content to the prompt so the model has access to accumulated
  // lessons. Sync reads match the rest of buildMemoryPrompt.
  for (const [subdir, heading] of [
    ['patterns', 'Patterns (成功模式)'],
    ['scars', 'Scars (失败教训)'],
  ] as const) {
    const subdirPath = join(memoryDir, subdir)
    try {
      // eslint-disable-next-line custom-rules/no-sync-fs
      const dirents = fs.readdirSync(subdirPath)
      const mdFiles = dirents
        .filter(d => d.isFile() && d.name.endsWith('.md'))
        .map(d => d.name)
        .sort()
      if (mdFiles.length > 0) {
        lines.push('', `## ${heading}`, '')
        for (const fileName of mdFiles) {
          try {
            // eslint-disable-next-line custom-rules/no-sync-fs
            const content = fs.readFileSync(join(subdirPath, fileName), {
              encoding: 'utf-8',
            })
            lines.push(`### ${fileName}`, content.trim(), '')
          } catch {
            // Individual file unreadable — skip silently
          }
        }
      }
    } catch {
      // Subdirectory doesn't exist or unreadable — skip silently
    }
  }

  // SA-P4: 感知上下文注入
  try {
    const { getGitSense, getProjectSense } = require('../assistant/sense.js') as typeof import('../assistant/sense.js')
    const git = getGitSense()
    const project = getProjectSense()
    lines.push('', '## Current Context')
    lines.push(`- Git: branch=${git.branch}, uncommitted=${git.uncommitted}`)
    if (project.todoCount > 0) lines.push(`- Project: ${project.todoCount} TODOs`)
  } catch {}

  return lines.join('\n')
}

/**
 * Assistant-mode daily-log prompt. Gated behind feature('KAIROS').
 *
 * Assistant sessions are effectively perpetual, so the agent writes memories
 * append-only to a date-named log file rather than maintaining MEMORY.md as
 * a live index. A separate nightly /dream skill distills logs into topic
 * files + MEMORY.md. MEMORY.md is still loaded into context (via claudemd.ts)
 * as the distilled index — this prompt only changes where NEW memories go.
 */
function buildAssistantDailyLogPrompt(skipIndex = false): string {
  const memoryDir = getAutoMemPath()
  // Describe the path as a pattern rather than inlining today's literal path:
  // this prompt is cached by systemPromptSection('memory', ...) and NOT
  // invalidated on date change. The model derives the current date from the
  // date_change attachment (appended at the tail on midnight rollover) rather
  // than the user-context message — the latter is intentionally left stale to
  // preserve the prompt cache prefix across midnight.
  const logPathPattern = join(memoryDir, 'logs', 'YYYY', 'MM', 'YYYY-MM-DD.md')

  const lines: string[] = [
    '# auto memory',
    '',
    `You have a persistent, file-based memory system found at: \`${memoryDir}\``,
    '',
    "This session is long-lived. As you work, record anything worth remembering by **appending** to today's daily log file:",
    '',
    `\`${logPathPattern}\``,
    '',
    "Substitute today's date (from `currentDate` in your context) for `YYYY-MM-DD`. When the date rolls over mid-session, start appending to the new day's file.",
    '',
    'Write each entry as a short timestamped bullet. Create the file (and parent directories) on first write if it does not exist. Do not rewrite or reorganize the log — it is append-only. A separate nightly process distills these logs into `MEMORY.md` and topic files.',
    '',
    '## What to log',
    '- User corrections and preferences ("use bun, not npm"; "stop summarizing diffs")',
    '- Facts about the user, their role, or their goals',
    '- Project context that is not derivable from the code (deadlines, incidents, decisions and their rationale)',
    '- Pointers to external systems (dashboards, Linear projects, Slack channels)',
    '- Anything the user explicitly asks you to remember',
    '',
    ...WHAT_NOT_TO_SAVE_SECTION,
    '',
    ...(skipIndex
      ? []
      : [
          `## ${ENTRYPOINT_NAME}`,
          `\`${ENTRYPOINT_NAME}\` is the distilled index (maintained nightly from your logs) and is loaded into your context automatically. Read it for orientation, but do not edit it directly — record new information in today's log instead.`,
          '',
        ]),
    ...buildSearchingPastContextSection(memoryDir),
  ]

  return lines.join('\n')
}

/**
 * Build the "Searching past context" section if the feature gate is enabled.
 */
export function buildSearchingPastContextSection(autoMemDir: string): string[] {
  if (!getFeatureValue_CACHED_MAY_BE_STALE('tengu_coral_fern', false)) {
    return []
  }
  const projectDir = getProjectDir(getOriginalCwd())
  // Ant-native builds alias grep to embedded ugrep and remove the dedicated
  // Grep tool, so give the model a real shell invocation there.
  // In REPL mode, both Grep and Bash are hidden from direct use — the model
  // calls them from inside REPL scripts, so the grep shell form is what it
  // will write in the script anyway.
  const embedded = hasEmbeddedSearchTools() || isReplModeEnabled()
  const memSearch = embedded
    ? `grep -rn "<search term>" ${autoMemDir} --include="*.md"`
    : `${GREP_TOOL_NAME} with pattern="<search term>" path="${autoMemDir}" glob="*.md"`
  const transcriptSearch = embedded
    ? `grep -rn "<search term>" ${projectDir}/ --include="*.jsonl"`
    : `${GREP_TOOL_NAME} with pattern="<search term>" path="${projectDir}/" glob="*.jsonl"`
  return [
    '## Searching past context',
    '',
    'When looking for past context:',
    '1. Search topic files in your memory directory:',
    '```',
    memSearch,
    '```',
    '2. Session transcript logs (last resort — large files, slow):',
    '```',
    transcriptSearch,
    '```',
    'Use narrow search terms (error messages, file paths, function names) rather than broad keywords.',
    '',
  ]
}

/**
 * Load the unified memory prompt for inclusion in the system prompt.
 * Dispatches based on which memory systems are enabled:
 *   - auto + team: combined prompt (both directories)
 *   - auto only: memory lines (single directory)
 * Team memory requires auto memory (enforced by isTeamMemoryEnabled), so
 * there is no team-only branch.
 *
 * Returns null when auto memory is disabled.
 */
export async function loadMemoryPrompt(): Promise<string | null> {
  const autoEnabled = isAutoMemoryEnabled()

  const skipIndex = getFeatureValue_CACHED_MAY_BE_STALE(
    'tengu_moth_copse',
    false,
  )

  // KAIROS daily-log mode takes precedence over TEAMMEM: the append-only
  // log paradigm does not compose with team sync (which expects a shared
  // MEMORY.md that both sides read + write). Gating on `autoEnabled` here
  // means the !autoEnabled case falls through to the tengu_memdir_disabled
  // telemetry block below, matching the non-KAIROS path.
  if (feature('KAIROS') && autoEnabled && getKairosActive()) {
    // 确保五层记忆目录在 KAIROS 路径下也被创建
    await ensureMemoryDirExists(getAutoMemPath())
    logMemoryDirCounts(getAutoMemPath(), {
      memory_type:
        'auto' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    })
    return buildAssistantDailyLogPrompt(skipIndex)
  }

  // Cowork injects memory-policy text via env var; thread into all builders.
  const coworkExtraGuidelines =
    process.env.CLAUDE_COWORK_MEMORY_EXTRA_GUIDELINES
  const extraGuidelines =
    coworkExtraGuidelines && coworkExtraGuidelines.trim().length > 0
      ? [coworkExtraGuidelines]
      : undefined

  if (feature('TEAMMEM')) {
    if (teamMemPaths!.isTeamMemoryEnabled()) {
      const autoDir = getAutoMemPath()
      const teamDir = teamMemPaths!.getTeamMemPath()
      // Harness guarantees these directories exist so the model can write
      // without checking. The prompt text reflects this ("already exists").
      // Only creating teamDir is sufficient: getTeamMemPath() is defined as
      // join(getAutoMemPath(), 'team'), so recursive mkdir of the team dir
      // creates the auto dir as a side effect. If the team dir ever moves
      // out from under the auto dir, add a second ensureMemoryDirExists call
      // for autoDir here.
      await ensureMemoryDirExists(teamDir)
      logMemoryDirCounts(autoDir, {
        memory_type:
          'auto' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      })
      logMemoryDirCounts(teamDir, {
        memory_type:
          'team' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      })
      return teamMemPrompts!.buildCombinedMemoryPrompt(
        extraGuidelines,
        skipIndex,
      )
    }
  }

  if (autoEnabled) {
    const autoDir = getAutoMemPath()
    // Harness guarantees the directory exists so the model can write without
    // checking. The prompt text reflects this ("already exists").
    await ensureMemoryDirExists(autoDir)
    logMemoryDirCounts(autoDir, {
      memory_type:
        'auto' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    })
    return buildMemoryLines(
      'auto memory',
      autoDir,
      extraGuidelines,
      skipIndex,
    ).join('\n')
  }

  logEvent('tengu_memdir_disabled', {
    disabled_by_env_var: isEnvTruthy(
      process.env.CLAUDE_CODE_DISABLE_AUTO_MEMORY,
    ),
    disabled_by_setting:
      !isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_AUTO_MEMORY) &&
      getInitialSettings().autoMemoryEnabled === false,
  })
  // Gate on the GB flag directly, not isTeamMemoryEnabled() — that function
  // checks isAutoMemoryEnabled() first, which is definitionally false in this
  // branch. We want "was this user in the team-memory cohort at all."
  if (getFeatureValue_CACHED_MAY_BE_STALE('tengu_herring_clock', false)) {
    logEvent('tengu_team_memdir_disabled', {})
  }
  return null
}

// ═══════════════════════════════════════════════════════════════════
// SA-P0-02: 用户画像
// ═══════════════════════════════════════════════════════════════════

/**
 * 用户画像维护——主要由模型在对话中直接通过 Edit/Write 工具更新 profile.md。
 * 这个函数仅作为 fallback，记录会话时间戳到月度日志。
 * 真正的画像内容由 memory prompt 中的指引驱动模型自主写入。
 */
export async function updateUserProfile(messages: readonly any[]): Promise<void> {
  if (!isAutoMemoryEnabled()) return

  const memoryDir = getAutoMemPath()
  if (!memoryDir) return

  // 仅记录会话活跃时间到月度日志（轻量 fallback）
  try {
    const monthStr = new Date().toISOString().slice(0, 7)
    const logsDir = join(memoryDir, 'semantic', 'profile-logs')
    await mkdir(logsDir, { recursive: true })
    const monthLogPath = join(logsDir, `${monthStr}.md`)
    const timestamp = new Date().toISOString()
    const userMsgCount = messages.filter((m: any) => m.type === 'user').length
    const toolCount = messages.filter((m: any) => m.type === 'assistant')
      .reduce((sum: number, m: any) => sum + ((m.message?.content || []).filter((b: any) => b.type === 'tool_use').length), 0)
    await appendFile(monthLogPath, `- ${timestamp}: session (${userMsgCount} user msgs, ${toolCount} tool calls)\n`)
  } catch {}

  // ─── SA-P0-02 增强：纯本地用户特征提取 ───
  try {
    await _extractUserFeatures(messages, memoryDir)
  } catch {
    // 特征提取失败静默跳过，不影响主流程
  }
}

// ═══════════════════════════════════════════════════════════════════
// SA-P0-02 增强：用户特征提取（纯本地，零 API 调用）
// ═══════════════════════════════════════════════════════════════════

// 技术关键词词典——用于从用户消息中识别技术偏好
const TECH_KEYWORDS: Record<string, string[]> = {
  语言: ['typescript', 'javascript', 'python', 'rust', 'go', 'java', 'c\\+\\+', 'c#', 'ruby', 'php', 'swift', 'kotlin', 'scala', 'elixir', 'lua', 'zig', 'haskell', 'ocaml', 'dart', 'sql', 'bash', 'shell', 'zsh'],
  框架: ['react', 'vue', 'angular', 'next\\.?js', 'nuxt', 'svelte', 'express', 'fastapi', 'django', 'flask', 'spring', 'nestjs', 'astro', 'remix', 'solid'],
  工具: ['bun', 'node', 'npm', 'yarn', 'pnpm', 'docker', 'kubernetes', 'k8s', 'git', 'terraform', 'ansible', 'webpack', 'vite', 'esbuild', 'turbo', 'nx', 'redis', 'postgres', 'mysql', 'mongo', 'sqlite'],
}

/**
 * 从用户消息中提取文本内容
 */
function _extractUserText(messages: readonly any[]): string {
  return messages
    .filter((m: any) => m.type === 'user')
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
    .join('\n')
}

/**
 * 检测语言偏好：中文 / 英文 / 混合
 */
function _detectLanguagePreference(text: string): string {
  const cnChars = (text.match(/[\u4e00-\u9fff]/g) || []).length
  const enWords = (text.match(/[a-zA-Z]{2,}/g) || []).length
  const total = cnChars + enWords
  if (total === 0) return '未知'
  const cnRatio = cnChars / total
  if (cnRatio > 0.6) return '中文为主'
  if (cnRatio < 0.2) return '英文为主'
  return '中英混合'
}

/**
 * 提取技术关键词
 */
function _extractTechKeywords(text: string): Record<string, string[]> {
  const lower = text.toLowerCase()
  const result: Record<string, string[]> = {}
  for (const [category, patterns] of Object.entries(TECH_KEYWORDS)) {
    const found = new Set<string>()
    for (const pattern of patterns) {
      const re = new RegExp(`\\b${pattern}\\b`, 'i')
      if (re.test(lower)) {
        // 用原始关键词名（去掉正则转义）
        found.add(pattern.replace(/\\(.)/g, '$1'))
      }
    }
    if (found.size > 0) result[category] = [...found]
  }
  return result
}

/**
 * 识别工作模式：根据当前时间判断活跃时段
 */
function _detectWorkPattern(): { hour: number; dateStr: string } {
  const now = new Date()
  return {
    hour: now.getHours(),
    dateStr: localDateStr(now),
  }
}

/**
 * 检测沟通风格
 */
function _detectCommunicationStyle(text: string): string {
  const lines = text.split('\n').filter(Boolean)
  const avgLen = lines.reduce((s, l) => s + l.length, 0) / Math.max(lines.length, 1)
  // 命令式语气特征：短句、祈使句、感叹号
  const imperativeMarkers = (text.match(/[！!。\n]/g) || []).length
  const questionMarkers = (text.match(/[？?]/g) || []).length
  if (avgLen < 30 && imperativeMarkers > questionMarkers) return '指令式，直接高效'
  if (questionMarkers > imperativeMarkers) return '探索式，提问导向'
  if (avgLen > 100) return '详细描述式'
  return '简洁对话式'
}

/**
 * 将提取的特征写入 profile.md
 * 使用区段匹配——读取现有内容，更新对应区段
 */
async function _extractUserFeatures(messages: readonly any[], memoryDir: string): Promise<void> {
  const userText = _extractUserText(messages)
  if (userText.trim().length < 10) return // 消息太短，跳过

  const profileDir = join(memoryDir, 'semantic')
  await mkdir(profileDir, { recursive: true })
  const profilePath = join(profileDir, 'profile.md')

  // 提取各维度特征
  const langPref = _detectLanguagePreference(userText)
  const techKw = _extractTechKeywords(userText)
  const workPattern = _detectWorkPattern()
  const commStyle = _detectCommunicationStyle(userText)
  const dateStr = workPattern.dateStr
  const hourStr = String(workPattern.hour).padStart(2, '0') + ':00'

  // 读取现有 profile.md（如果存在）
  let existingContent = ''
  try {
    existingContent = readFileSync(profilePath, 'utf-8')
  } catch {
    // 文件不存在，使用初始模板
  }

  if (!existingContent.trim()) {
    // 初始化 profile.md
    existingContent = [
      '---',
      'name: 用户画像',
      'description: 自动维护的用户特征档案',
      'type: user',
      '---',
      '',
      '## 基础信息',
      `- 语言偏好: ${langPref}`,
      `- 时区: ${Intl.DateTimeFormat().resolvedOptions().timeZone} (UTC${new Date().getTimezoneOffset() <= 0 ? '+' : '-'}${String(Math.abs(Math.floor(new Date().getTimezoneOffset() / 60))).padStart(2, '0')}:${String(Math.abs(new Date().getTimezoneOffset() % 60)).padStart(2, '0')})`,
      '',
      '## 工作模式',
      `- 活跃时段: ${hourStr}-${hourStr}`,
      `- 近期活跃: ${dateStr} ${hourStr}`,
      '',
      '## 技术偏好',
      ...Object.entries(techKw).map(([cat, kws]) => `- ${cat}: ${kws.join(', ')}`),
      ...(Object.keys(techKw).length === 0 ? ['- (待检测)'] : []),
      '',
      '## 沟通风格',
      `- 风格: ${commStyle}`,
      '',
      '## 进化日志',
      `- ${dateStr}: 初始画像生成`,
    ].join('\n') + '\n'
    await writeFile(profilePath, existingContent, 'utf-8')
    return
  }

  // 已有 profile.md——增量更新各区段
  let updated = existingContent

  // 更新语言偏好
  updated = updated.replace(
    /- 语言偏好: .*/,
    `- 语言偏好: ${langPref}`,
  )

  // 更新近期活跃时间
  updated = updated.replace(
    /- 近期活跃: .*/,
    `- 近期活跃: ${dateStr} ${hourStr}`,
  )

  // 更新活跃时段范围（扩展已有范围）
  const activeMatch = updated.match(/- 活跃时段: (\d{2}):00-(\d{2}):00/)
  if (activeMatch) {
    const existMin = parseInt(activeMatch[1], 10)
    const existMax = parseInt(activeMatch[2], 10)
    const newMin = Math.min(existMin, workPattern.hour)
    const newMax = Math.max(existMax, workPattern.hour)
    updated = updated.replace(
      /- 活跃时段: .*/,
      `- 活跃时段: ${String(newMin).padStart(2, '0')}:00-${String(newMax).padStart(2, '0')}:00`,
    )
  }

  // 合并技术关键词
  for (const [cat, newKws] of Object.entries(techKw)) {
    const catRegex = new RegExp(`- ${cat}: (.*)`)
    const catMatch = updated.match(catRegex)
    if (catMatch) {
      const existing = catMatch[1].split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
      const merged = [...new Set([...existing, ...newKws.map(k => k.toLowerCase())])]
      updated = updated.replace(catRegex, `- ${cat}: ${merged.join(', ')}`)
    } else {
      // 在技术偏好区段末尾追加
      const techSectionEnd = updated.indexOf('\n## 沟通风格')
      if (techSectionEnd > 0) {
        updated = updated.slice(0, techSectionEnd) + `\n- ${cat}: ${newKws.join(', ')}` + updated.slice(techSectionEnd)
      }
    }
  }

  // 更新沟通风格
  updated = updated.replace(
    /- 风格: .*/,
    `- 风格: ${commStyle}`,
  )

  // 追加进化日志（同一天不重复）
  if (!updated.includes(`- ${dateStr}:`)) {
    const logEntries: string[] = []
    if (langPref !== '未知') logEntries.push(`检测到偏好${langPref}输出`)
    if (Object.keys(techKw).length > 0) {
      const allKws = Object.values(techKw).flat()
      logEntries.push(`使用技术: ${allKws.join(', ')}`)
    }
    if (logEntries.length > 0) {
      updated = updated.trimEnd() + `\n- ${dateStr}: ${logEntries.join('；')}\n`
    }
  }

  if (updated !== existingContent) {
    // ── Bounded Memory 守门：profile.md ≤ 1375 字符（Hermes 标准）──
    try {
      const { enforceBounded } = await import('./boundedMemory.js')
      const result = enforceBounded(profilePath, updated)
      if (result.compressed) {
        updated = result.content
        logForDebugging(
          `[boundedMemory] ${profilePath} 压缩 ${result.check.currentChars} → ${result.check.maxChars} 字符`,
        )
      }
    } catch {}
    await writeFile(profilePath, updated, 'utf-8')
  }
}

// ═══════════════════════════════════════════════════════════════════
// SA-P0-03: 本地全文索引
// ═══════════════════════════════════════════════════════════════════

/**
 * 本地全文索引——SQLite FTS5 全文搜索，fallback 到 TF-IDF。
 * 扫描 memory/ 下所有 .md 文件，使用 Bun 内置 SQLite FTS5 进行排序。
 * 零外部依赖，支持中英文混合查询。
 */
export function searchMemory(query: string, memoryDir: string, topK: number = 5): Array<{ file: string; score: number; excerpt: string }> {
  const files = scanMdFiles(memoryDir)
  if (files.length === 0) return []

  // 优先 FTS5，不可用时 fallback 到 TF-IDF
  let results: Array<{ file: string; score: number; excerpt: string }>
  try {
    results = _searchMemoryFTS5(query, memoryDir, files, topK)
  } catch {
    results = _searchMemoryTFIDF(query, memoryDir, files, topK)
  }

  // 更新命中记忆的 lastAccessed（驱动 Ebbinghaus 衰减）
  for (const r of results) {
    const absPath = r.file.startsWith('/') ? r.file : join(memoryDir, r.file)
    touchMemoryAccess(absPath)
  }

  return results
}

/**
 * 中文 bigram 分词——将连续中文字符提取并生成二元组。
 * 例如 "机器学习" → "机器 器学 学习"
 * 非中文部分原样保留，用于改善 FTS5 unicode61 分词器对中文的召回率。
 */
function chineseBigram(text: string): string {
  // 匹配连续中文字符块
  return text.replace(/[\u4e00-\u9fff]{2,}/g, (match) => {
    const bigrams: string[] = []
    for (let i = 0; i < match.length - 1; i++) {
      bigrams.push(match[i] + match[i + 1])
    }
    // 保留原始字符 + bigram，提高精确匹配和模糊匹配的召回率
    return match + ' ' + bigrams.join(' ')
  })
}

/** SQLite FTS5 全文搜索实现 */
function _searchMemoryFTS5(query: string, memoryDir: string, files: string[], topK: number): Array<{ file: string; score: number; excerpt: string }> {
  const { Database } = require('bun:sqlite')
  // 当前使用 :memory: 数据库，每次搜索重建，无磁盘腐败风险。
  // 未来若切换到持久化 SQLite，请在此处调用 checkAndRecoverSQLite(dbPath)
  // —— integrity check 逻辑已在 src/memdir/sqliteIntegrity.ts 就位。
  const dbPath = ':memory:'
  if (dbPath !== ':memory:') {
    try {
      const { checkAndRecoverSQLite } = require('./sqliteIntegrity.js')
      const result = checkAndRecoverSQLite(dbPath)
      if (!result.ok && result.recovered) {
        logForDebugging(`[memdir] SQLite ${dbPath} corruption detected, backed up. Errors: ${result.errors.join(', ')}`)
      }
    } catch {}
  }
  const db = new Database(dbPath)

  // 创建 FTS5 虚拟表，unicode61 分词器支持中英文
  db.run("CREATE VIRTUAL TABLE IF NOT EXISTS memory_fts USING fts5(path, content, tokenize='unicode61')")

  const insert = db.prepare('INSERT INTO memory_fts (path, content) VALUES (?, ?)')
  for (const filePath of files) {
    try {
      const content = readFileSync(filePath, 'utf-8')
      // 对中文内容做 bigram 预处理，提高中文召回率
      insert.run(relative(memoryDir, filePath), chineseBigram(content))
    } catch {}
  }

  // 对查询词做 bigram 处理 + tokenize 以兼容 FTS5 MATCH 语法
  const bigramQuery = chineseBigram(query)
  const queryTerms = tokenize(bigramQuery)
  if (queryTerms.length === 0) { db.close(); return [] }

  // 用 OR 连接各词项，提高召回率
  const ftsQuery = queryTerms.join(' OR ')

  const rows = db.query(`
    SELECT path, snippet(memory_fts, 1, '', '', '...', 30) as excerpt, rank
    FROM memory_fts
    WHERE content MATCH ?
    ORDER BY rank
    LIMIT ?
  `).all(ftsQuery, topK) as Array<{ path: string; excerpt: string; rank: number }>

  db.close()

  // rank 是负数（越小越好），转为正分数
  return rows.map(row => ({
    file: row.path,
    score: -row.rank,
    excerpt: row.excerpt.replace(/\n+/g, ' ').trim(),
  }))
}

/** TF-IDF fallback 实现（当 FTS5 不可用时） */
function _searchMemoryTFIDF(query: string, memoryDir: string, files: string[], topK: number): Array<{ file: string; score: number; excerpt: string }> {
  const results: Array<{ file: string; score: number; excerpt: string }> = []

  const queryTerms = tokenize(query)
  if (queryTerms.length === 0) return results

  const docCount = files.length
  const termDocFreq = new Map<string, number>()
  const fileContents = new Map<string, { content: string; terms: string[] }>()

  for (const filePath of files) {
    try {
      const content = readFileSync(filePath, 'utf-8')
      const terms = tokenize(content)
      const termSet = new Set(terms)
      fileContents.set(filePath, { content, terms })
      for (const t of termSet) {
        termDocFreq.set(t, (termDocFreq.get(t) || 0) + 1)
      }
    } catch {}
  }

  for (const [filePath, { content, terms }] of fileContents) {
    let score = 0
    for (const qt of queryTerms) {
      const tf = terms.filter(t => t === qt).length / Math.max(terms.length, 1)
      const idf = Math.log((docCount + 1) / ((termDocFreq.get(qt) || 0) + 1))
      score += tf * idf
    }

    if (score > 0) {
      const excerpt = extractExcerpt(content, queryTerms)
      results.push({
        file: relative(memoryDir, filePath),
        score,
        excerpt,
      })
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, topK)
}

function tokenize(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^\w\u4e00-\u9fff]+/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1)
}

function extractExcerpt(content: string, queryTerms: string[], maxLen: number = 150): string {
  const lower = content.toLowerCase()
  for (const term of queryTerms) {
    const idx = lower.indexOf(term)
    if (idx >= 0) {
      const start = Math.max(0, idx - 50)
      const end = Math.min(content.length, idx + maxLen)
      return content.slice(start, end).replace(/\n+/g, ' ').trim()
    }
  }
  return content.slice(0, maxLen).replace(/\n+/g, ' ').trim()
}

export function scanMdFiles(dir: string): string[] {
  const results: string[] = []
  try {
    const entries = readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        results.push(...scanMdFiles(fullPath))
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        results.push(fullPath)
      }
    }
  } catch {}
  return results
}

// ═══════════════════════════════════════════════════════════════════
// SA-P0-04: 记忆遗忘/衰减机制
// ═══════════════════════════════════════════════════════════════════

/**
 * 记忆衰减——基于 Ebbinghaus 遗忘曲线。
 * 定期（每日 DeepDream 时）调用，衰减未访问记忆的强度。
 */
const PROTECTED_FILES = ['MEMORY.md', 'profile.md', 'preferences.md', 'habits.md']

export async function decayAndPruneMemories(memoryDir: string): Promise<{ decayed: number; pruned: number }> {
  let decayed = 0, pruned = 0
  const now = Date.now()
  const files = scanMdFiles(memoryDir)

  for (const filePath of files) {
    // 系统文件不衰减不删除
    const fileName = filePath.split('/').pop() || ''
    if (PROTECTED_FILES.includes(fileName)) continue

    try {
      let content = readFileSync(filePath, 'utf-8')

      // 解析 frontmatter 中的元数据
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
      if (!frontmatterMatch) continue

      const fm = frontmatterMatch[1]
      const lastAccessedMatch = fm.match(/lastAccessed:\s*(\d+)/)
      const strengthMatch = fm.match(/strength:\s*([\d.]+)/)
      const importantMatch = fm.match(/important:\s*true/)

      // 重要记忆不衰减
      if (importantMatch) continue

      const lastAccessed = lastAccessedMatch ? parseInt(lastAccessedMatch[1], 10) : now
      const currentStrength = strengthMatch ? parseFloat(strengthMatch[1]) : 1.0

      // Ebbinghaus 衰减：R = e^(-t/S)
      const daysSinceAccess = (now - lastAccessed) / (24 * 60 * 60 * 1000)
      const stability = Math.max(1, currentStrength * 30)
      const newStrength = Math.exp(-daysSinceAccess / stability)

      if (newStrength < 0.1) {
        unlinkSync(filePath)
        pruned++
      } else if (Math.abs(newStrength - currentStrength) > 0.05) {
        // 在 frontmatter 内更新或添加 strength 字段
        const fmEnd = content.indexOf('\n---', 4) // 跳过开头的 ---
        if (fmEnd > 0 && strengthMatch) {
          // 替换已有 strength（仅替换 frontmatter 内的第一个）
          const before = content.slice(0, fmEnd)
          const after = content.slice(fmEnd)
          content = before.replace(/strength:\s*[\d.]+/, `strength: ${newStrength.toFixed(2)}`) + after
        } else if (fmEnd > 0) {
          // frontmatter 内添加新字段
          content = content.slice(0, fmEnd) + `\nstrength: ${newStrength.toFixed(2)}` + content.slice(fmEnd)
        }
        writeFileSync(filePath, content, 'utf-8')
        decayed++
      }
    } catch {}
  }

  return { decayed, pruned }
}

// ═══════════════════════════════════════════════════════════════════
// SA-P1-02: 晨间简报引擎
// ═══════════════════════════════════════════════════════════════════

export async function generateMorningBrief(): Promise<void> {
  const memoryDir = getAutoMemPath()
  if (!memoryDir) return

  const dateStr = localDateStr()
  const briefPath = join(memoryDir, 'working', `morning_brief_${dateStr}.md`)

  // 避免重复生成
  try { await access(briefPath); return } catch {}

  const sections: string[] = [`# 晨间简报 — ${dateStr}\n`]

  // 今日日历事件
  try {
    const events = await readCalendarEvents(1)
    if (events.length > 0) {
      sections.push('## 今日日程')
      for (const evt of events.slice(0, 10)) {
        sections.push(`- ${evt.startDate} ${evt.title}${evt.location ? ` @ ${evt.location}` : ''}`)
      }
      sections.push('')
    }
  } catch {}

  // Git 状态
  try {
    const { getGitSense } = require('../assistant/sense.js') as typeof import('../assistant/sense.js')
    const git = getGitSense()
    sections.push('## Git 状态')
    sections.push(`- 分支: ${git.branch}`)
    sections.push(`- 未提交变更: ${git.uncommitted}`)
    if (git.behindRemote) sections.push('- ⚠ 落后于远程分支')
    sections.push('')
  } catch {}

  // 昨日 dream 报告
  const yesterday = localDateStr(new Date(Date.now() - 86400000))
  const dreamPath = join(memoryDir, 'dreams', `${yesterday}.md`)
  try {
    const dream = await readFile(dreamPath, 'utf-8')
    sections.push('## 昨夜整合摘要')
    sections.push(dream.split('\n').slice(0, 10).join('\n'))
  } catch {
    sections.push('## 昨夜整合\n（无记录）')
  }

  // 待处理事项（扫描 memory 中的 TODO）
  const allFiles = scanMdFiles(memoryDir)
  const todos: string[] = []
  for (const f of allFiles.slice(0, 50)) {
    try {
      const content = readFileSync(f, 'utf-8')
      const todoLines = content.split('\n').filter(l => /TODO|待办|待处理|FIXME/.test(l))
      todos.push(...todoLines.slice(0, 3))
    } catch {}
  }
  if (todos.length > 0) {
    sections.push('\n## 待处理')
    sections.push(todos.slice(0, 10).join('\n'))
  }

  // 工作模式推断（从 habits.md）
  try {
    const habitsContent = readFileSync(join(memoryDir, 'procedural', 'habits.md'), 'utf-8')
    const recentLines = habitsContent.split('\n').filter(Boolean).slice(-20)
    const toolMentions = recentLines.join(' ').match(/tools?=([^\s,)]+)/g) || []
    if (toolMentions.length > 0) {
      sections.push('\n## 近期工作模式')
      const toolFreq = new Map<string, number>()
      for (const m of toolMentions) {
        const tools = m.replace(/tools?=/, '').split(',')
        for (const t of tools) { toolFreq.set(t, (toolFreq.get(t) || 0) + 1) }
      }
      const topTools = [...toolFreq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
      sections.push(`- 常用工具: ${topTools.map(([t, c]) => `${t}(${c})`).join(', ')}`)
    }
  } catch {}

  // 前瞻记忆
  try {
    const prospDir = join(memoryDir, 'dreams', 'prospective')
    const prospFiles = readdirSync(prospDir).filter(f => f.endsWith('.md')).sort().reverse()
    if (prospFiles.length > 0) {
      const content = readFileSync(join(prospDir, prospFiles[0]), 'utf-8').slice(0, 500)
      sections.push('## 前瞻预览\n' + content)
    }
  } catch {}

  // 情感趋势
  try {
    const { getRecentEmotionalEvents } = require('../assistant/emotionalMemory.js')
    const events = getRecentEmotionalEvents()
    if (events && events.length > 0) {
      const frustrated = events.filter((e: any) => e.emotion === 'frustration').length
      const satisfied = events.filter((e: any) => e.emotion === 'satisfaction').length
      sections.push(`## 情绪趋势\n- 满意事件: ${satisfied} 次\n- 受挫事件: ${frustrated} 次`)
    }
  } catch {}

  // 通知摘要
  try {
    const statsDir = join(homedir(), '.pandacc', 'data', 'notification-stats')
    if (existsSync(statsDir)) {
      const statsFiles = readdirSync(statsDir).filter(f => f.endsWith('.json')).sort().reverse()
      if (statsFiles.length > 0) {
        const statsPath = join(statsDir, statsFiles[0])
        // 完整性校验：损坏文件自动备份为 .broken-<ts>，跳过本次读取
        try {
          const { checkAndRecoverJSON } = require('./sqliteIntegrity.js')
          checkAndRecoverJSON(statsPath)
        } catch {}
        if (existsSync(statsPath)) {
          const stats = JSON.parse(readFileSync(statsPath, 'utf-8'))
          sections.push(`## 通知摘要\n- 昨日通知: ${stats.total || 0} 条`)
        }
      }
    }
  } catch {}

  // 记忆状态
  sections.push('\n## 记忆状态')
  sections.push(`- 记忆文件总数: ${allFiles.length}`)

  await mkdir(join(memoryDir, 'working'), { recursive: true })
  await writeFile(briefPath, sections.join('\n'), 'utf-8')

  try {
    const briefingDir = join(memoryDir, 'semantic', 'briefing')
    await mkdir(briefingDir, { recursive: true })
    await writeFile(join(briefingDir, `${dateStr}.md`), sections.join('\n'), 'utf-8')
  } catch {}

  try {
    const { pushNotification } = await import('../assistant/sense.js')
    const contentLines = sections.slice(1).filter(l => l.trim() && !l.startsWith('#')).slice(0, 6)
    const body = contentLines.length > 0
      ? contentLines.join('\n')
      : `今日简报已生成，可在 ${briefPath} 查看`
    pushNotification({
      type: 'action',
      title: '📋 晨间简报已就绪',
      body,
      channel: 'all',
    })
  } catch {}
}

// ═══════════════════════════════════════════════════════════════════
// SA-P1-03: 文件分类器
// ═══════════════════════════════════════════════════════════════════

/**
 * 文件分类器——根据文件扩展名和名称模式分类。
 * 纯本地规则，零 API 调用。
 */
export function classifyFile(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() || ''
  const name = filePath.split('/').pop()?.toLowerCase() || ''

  // 截图检测优先（在扩展名匹配之前）
  if (name.includes('screenshot') || name.includes('截屏') || name.includes('screen shot')) return 'screenshots'
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'heic', 'heif'].includes(ext)) return 'images'
  if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'pages', 'numbers', 'key'].includes(ext)) return 'documents'
  if (['ts', 'tsx', 'js', 'jsx', 'py', 'rs', 'go', 'java', 'c', 'cpp', 'h', 'swift', 'kt'].includes(ext)) return 'code'
  if (['zip', 'tar', 'gz', 'bz2', 'rar', '7z', 'dmg', 'pkg'].includes(ext)) return 'archives'
  if (['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv'].includes(ext)) return 'videos'
  if (['mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg'].includes(ext)) return 'audio'
  if (['json', 'csv', 'xml', 'yaml', 'yml', 'toml', 'sql', 'db', 'sqlite'].includes(ext)) return 'data'
  if (['md', 'txt', 'rtf', 'log'].includes(ext)) return 'text'

  return 'other'
}

/**
 * 扫描目录并生成分类建议。
 */
export function organizeDirectory(srcDir: string, dryRun: boolean = true): Array<{ src: string; dest: string; category: string }> {
  const moves: Array<{ src: string; dest: string; category: string }> = []

  // 隐私配置：跳过排除路径
  let privacyConfig: import('../assistant/privacyConfig.js').PrivacyConfig | null = null
  let isPathExcluded: ((p: string, c: any) => boolean) | null = null
  try {
    const pc = require('../assistant/privacyConfig.js') as typeof import('../assistant/privacyConfig.js')
    privacyConfig = pc.loadPrivacyConfig()
    isPathExcluded = pc.isPathExcluded
  } catch {}

  try {
    const entries = readdirSync(srcDir, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isFile()) continue
      if (entry.name.startsWith('.')) continue

      const srcPath = join(srcDir, entry.name)

      // 隐私过滤：跳过 excludePaths 匹配的文件
      if (privacyConfig && isPathExcluded && isPathExcluded(srcPath, privacyConfig)) continue

      const category = classifyFile(srcPath)
      if (category === 'other') continue

      const destDir = join(srcDir, category)
      const destPath = join(destDir, entry.name)

      moves.push({ src: srcPath, dest: destPath, category })

      if (!dryRun) {
        try {
          mkdirSync(destDir, { recursive: true })
          renameSync(srcPath, destPath)
        } catch {}
      }
    }
  } catch {}

  return moves
}

// ═══════════════════════════════════════════════════════════════════
// SA-P2: 数据连接器
// ═══════════════════════════════════════════════════════════════════

/**
 * 读取 Chrome 浏览器历史记录。
 * 数据库路径：~/Library/Application Support/Google/Chrome/Default/History
 * Chrome 运行时锁定数据库，需要先复制。
 */
export async function readBrowserHistory(
  since: Date = new Date(Date.now() - 7 * 86400000),
  limit: number = 100,
): Promise<Array<{ url: string; title: string; visitTime: Date; visitCount: number }>> {
  const results: Array<{ url: string; title: string; visitTime: Date; visitCount: number }> = []

  const chromePath = join(homedir(), 'Library/Application Support/Google/Chrome/Default/History')
  const tmpPath = join(tmpdir(), `panda_chrome_history_${Date.now()}.db`)

  try {
    // 复制数据库避免锁定问题
    copyFileSync(chromePath, tmpPath)

    // 使用 bun:sqlite 读取
    const { Database } = require('bun:sqlite')
    const db = new Database(tmpPath, { readonly: true })

    const sinceChrome = (since.getTime() * 1000) + 11644473600000000 // Chrome epoch offset
    const rows = db.query(`
      SELECT url, title, last_visit_time, visit_count
      FROM urls
      WHERE last_visit_time > ?
      ORDER BY last_visit_time DESC
      LIMIT ?
    `).all(sinceChrome, limit)

    // 隐私配置：过滤排除域名
    let isDomainExcludedFn: ((d: string, c: any) => boolean) | null = null
    let privacyConfig: any = null
    try {
      const pc = require('../assistant/privacyConfig.js') as typeof import('../assistant/privacyConfig.js')
      privacyConfig = pc.loadPrivacyConfig()
      isDomainExcludedFn = pc.isDomainExcluded
    } catch {}

    for (const row of rows as any[]) {
      // 隐私过滤：跳过排除域名
      if (privacyConfig && isDomainExcludedFn) {
        try {
          const domain = new URL(row.url).hostname
          if (isDomainExcludedFn(domain, privacyConfig)) continue
        } catch {}
      }

      results.push({
        url: row.url,
        title: row.title || '',
        visitTime: new Date((row.last_visit_time - 11644473600000000) / 1000),
        visitCount: row.visit_count,
      })
    }

    db.close()
  } catch {} finally {
    try { unlinkSync(tmpPath) } catch {}
  }

  return results
}

/**
 * 读取 macOS 日历事件。通过 osascript/AppleScript。
 */
export async function readCalendarEvents(
  daysAhead: number = 1,
): Promise<Array<{ title: string; startDate: string; endDate: string; location: string }>> {
  const events: Array<{ title: string; startDate: string; endDate: string; location: string }> = []

  try {
    const { execSync } = require('child_process')
    const script = `
      tell application "Calendar"
        set today to current date
        set endDay to today + (${daysAhead} * days)
        set eventList to ""
        repeat with cal in calendars
          repeat with evt in (every event of cal whose start date >= today and start date <= endDay)
            set eventList to eventList & summary of evt & "|||" & (start date of evt as string) & "|||" & (end date of evt as string) & "|||" & (location of evt as string) & "\\n"
          end repeat
        end repeat
        return eventList
      end tell
    `
    const output = execSync(`osascript -e '${script.replace(/'/g, "'\\''")}'`, { timeout: 10000, encoding: 'utf-8' })

    for (const line of output.split('\n').filter(Boolean)) {
      const [title, startDate, endDate, location] = line.split('|||')
      if (title) events.push({ title: title.trim(), startDate: startDate?.trim() || '', endDate: endDate?.trim() || '', location: location?.trim() || '' })
    }
  } catch {}

  return events
}

/**
 * 读取 Apple Notes。
 * 路径：~/Library/Group Containers/group.com.apple.notes/NoteStore.sqlite
 */
export async function readAppleNotes(
  limit: number = 50,
): Promise<Array<{ title: string; snippet: string; modDate: Date }>> {
  const notes: Array<{ title: string; snippet: string; modDate: Date }> = []

  const notesPath = join(homedir(), 'Library/Group Containers/group.com.apple.notes/NoteStore.sqlite')
  const tmpPath = join(tmpdir(), `panda_notes_${Date.now()}.db`)

  try {
    copyFileSync(notesPath, tmpPath)
    const { Database } = require('bun:sqlite')
    const db = new Database(tmpPath, { readonly: true })

    const rows = db.query(`
      SELECT ZTITLE2 as title, ZSNIPPET as snippet, ZMODIFICATIONDATE1 as modDate
      FROM ZICCLOUDSYNCINGOBJECT
      WHERE ZTITLE2 IS NOT NULL AND ZMARKEDFORDELETION = 0
      ORDER BY ZMODIFICATIONDATE1 DESC
      LIMIT ?
    `).all(limit)

    for (const row of rows as any[]) {
      notes.push({
        title: row.title || '',
        snippet: (row.snippet || '').slice(0, 200),
        modDate: new Date((row.modDate || 0) * 1000 + 978307200000), // Apple epoch
      })
    }

    db.close()
  } catch {} finally {
    try { unlinkSync(tmpPath) } catch {}
  }

  return notes
}

/**
 * 判定剪贴板内容是否包含敏感数据（clipboard-poll 轮询专用）。
 *
 * 覆盖四类：
 *   1. OpenAI / Anthropic key：`sk-[a-zA-Z0-9-_]{20,}`
 *   2. GitHub token：`ghp_[a-zA-Z0-9]{36,}`
 *   3. 密码/token/api key key=value 样式（中英文）
 *   4. 信用卡号 16 位（带分隔符）
 *
 * 抽成独立导出函数以便 unit test 验证模式覆盖。
 */
export function isSensitiveClipboardContent(text: string): boolean {
  if (!text) return false
  // 1. API key 格式
  if (/sk-[a-zA-Z0-9\-_]{20,}/.test(text)) return true
  // 2. GitHub token
  if (/ghp_[a-zA-Z0-9]{36,}/.test(text)) return true
  // 3. 通用 credential key=value
  if (/(?:password|passwd|secret|token|api[-_]?key)\s*[:=]\s*\S{8,}/i.test(text)) return true
  // 4. 信用卡号（4-4-4-4）
  if (/\b\d{4}[\s-]\d{4}[\s-]\d{4}[\s-]\d{4}\b/.test(text)) return true
  return false
}

/**
 * 读取当前剪贴板内容并追加到历史。
 * 历史存储：~/.pandacc/data/clipboard/YYYY-MM-DD.jsonl
 */
export async function captureClipboard(): Promise<string | null> {
  try {
    // P0-6 跨平台守门：pbpaste 仅 macOS 可用。Windows/Linux 静默 return null，
    // 避免 clipboard-poll cron 每 2 分钟抛 ENOENT 污染日志。
    const platform = require('os').platform()
    if (platform !== 'darwin') return null

    const { execSync } = require('child_process')
    const content = execSync('pbpaste', { encoding: 'utf-8', timeout: 3000 })
    if (!content || content.length > 10000) return null // 忽略空和超大内容

    // 隐私配置驱动的敏感内容检测（替代硬编码正则）
    let isSensitive = false
    try {
      const pc = require('../assistant/privacyConfig.js') as typeof import('../assistant/privacyConfig.js')
      const privacyConfig = pc.loadPrivacyConfig()
      isSensitive = pc.containsSensitiveContent(content, privacyConfig)
    } catch {
      // fallback: 原始硬编码检测
      isSensitive = /password|api[._-]?key|secret|token|sk-|private[._-]?key|credential|auth|bearer|ssh-rsa|BEGIN.*PRIVATE|BEGIN.*KEY|\b\d{13,19}\b/i.test(content)
    }
    if (isSensitive) return null

    const dataDir = join(homedir(), '.pandacc', 'data', 'clipboard')
    await mkdir(dataDir, { recursive: true })

    const dateStr = localDateStr()
    const logPath = join(dataDir, `${dateStr}.jsonl`)
    const entry = JSON.stringify({ time: new Date().toISOString(), content: content.slice(0, 500) })
    await appendFile(logPath, entry + '\n')

    return content
  } catch { return null }
}

// ═══════════════════════════════════════════════════════════════════
// SA-P3: 非编码场景
// ═══════════════════════════════════════════════════════════════════

/**
 * 写作工具——生成大纲。
 */
export function generateWritingOutline(topic: string): string {
  const sections: string[] = [`# ${topic}\n`]
  sections.push('## 1. 引言')
  sections.push(`  - 为什么${topic}值得讨论`)
  sections.push(`  - 当前背景和趋势\n`)
  sections.push('## 2. 核心概念')
  sections.push(`  - ${topic}的定义和范围`)
  sections.push(`  - 关键组成要素\n`)
  sections.push('## 3. 深度分析')
  sections.push(`  - ${topic}的机遇`)
  sections.push(`  - ${topic}的挑战`)
  sections.push(`  - 案例研究\n`)
  sections.push('## 4. 实践指南')
  sections.push(`  - 如何应用${topic}`)
  sections.push(`  - 最佳实践和工具\n`)
  sections.push('## 5. 未来展望')
  sections.push(`  - ${topic}的发展趋势`)
  sections.push('  - 总结和建议\n')
  sections.push('> 在 panda 对话中说："扩展第 N 节"来生成完整内容。')
  return sections.join('\n')
}

/**
 * 编译写作项目——合并目录下所有 .md 文件为单文档。
 */
export function compileWritingProject(dir: string): string {
  const files = scanMdFiles(dir).sort()
  const sections: string[] = ['# 编译输出\n']
  for (const f of files) {
    try {
      const content = readFileSync(f, 'utf-8')
      const name = f.split('/').pop()?.replace('.md', '') || ''
      sections.push(`\n## ${name}\n\n${content}`)
    } catch {}
  }
  return sections.join('\n')
}

/**
 * 快速捕获想法到 inbox。
 */
export async function captureNote(content: string, source: string = 'manual'): Promise<string> {
  const memoryDir = getAutoMemPath()
  if (!memoryDir) return 'memory dir not available'

  const inboxDir = join(memoryDir, 'working')
  await mkdir(inboxDir, { recursive: true })

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const fileName = `capture-${timestamp}.md`
  const filePath = join(inboxDir, fileName)

  const note = `---
name: 快速捕获
description: ${content.slice(0, 80)}
type: capture
source: ${source}
created: ${new Date().toISOString()}
---

${content}
`
  await writeFile(filePath, note, 'utf-8')
  return filePath
}

/**
 * PARA 分类建议。
 */
export function suggestPARACategory(content: string): 'projects' | 'areas' | 'resources' | 'archives' {
  const lower = content.toLowerCase()
  if (/deadline|sprint|release|发布|交付|版本/.test(lower)) return 'projects'
  if (/habit|routine|health|学习|锻炼|日常/.test(lower)) return 'areas'
  if (/reference|tutorial|documentation|参考|教程|文档/.test(lower)) return 'resources'
  return 'archives'
}

/**
 * 从文本生成闪卡（问答对）。
 * 返回 Markdown 格式的卡片列表。
 */
export function generateFlashcards(content: string, maxCards: number = 10): string {
  const sentences = content.split(/[。.!！?\n]+/).filter(s => s.trim().length > 20)
  const cards: string[] = ['# 闪卡\n']

  for (let i = 0; i < Math.min(sentences.length, maxCards); i++) {
    const s = sentences[i].trim()
    cards.push(`### 卡片 ${i + 1}`)
    cards.push(`**Q:** ${s.slice(0, 50)}...的关键要点是什么？`)
    cards.push(`**A:** ${s}\n`)
  }

  return cards.join('\n')
}

/**
 * FSRS-4 简化版间隔重复计算。
 * 基于 FSRS 核心公式: 可提取性衰减 R = e^(-t/S)，稳定度增长 SInc。
 * 返回下次复习间隔、更新后的稳定度和难度。
 */
export function fsrsNextInterval(
  grade: number,           // 0-3: again/hard/good/easy
  stability: number,       // 当前稳定度（天）
  difficulty: number,      // 0-1 难度
  elapsed: number,         // 距上次复习的天数
): { interval: number; nextStability: number; nextDifficulty: number } {
  // FSRS-4 核心: 可提取性 R = e^(-elapsed/stability)
  const retrievability = Math.exp(-elapsed / Math.max(stability, 0.1))

  // 难度更新: D' = D + w*(2 - grade)，grade越高难度越低
  const w = 0.1
  const nextDifficulty = Math.max(0, Math.min(1, difficulty + w * (2 - grade)))

  // 稳定度增长因子 SInc (FSRS-4 简化)
  const gradeMultipliers = [0.2, 0.8, 1.0, 1.3] // again/hard/good/easy
  const SInc = gradeMultipliers[grade] * (1 + 11 * Math.pow(nextDifficulty, -0.5))
    * Math.pow(stability, -0.2) * (Math.exp(0.05 * (1 - retrievability)) - 1)

  let nextStability: number
  if (grade === 0) {
    // again: 重置稳定度（大幅衰减）
    nextStability = Math.max(1, stability * 0.2)
  } else {
    nextStability = Math.max(1, stability * (1 + SInc))
  }

  // 间隔 = 稳定度 * 目标保留率系数
  const interval = Math.round(nextStability * 0.9)
  return { interval: Math.max(1, interval), nextStability, nextDifficulty }
}

// ═══════════════════════════════════════════════════════════════════
// SA-P4: 行为模式学习
// ═══════════════════════════════════════════════════════════════════

/**
 * 记录用户行为到 procedural/habits.md。
 * 追踪：活跃时段分布、常用工具、项目切换模式。
 */
export async function recordBehavior(
  action: string,
  context: Record<string, string>,
): Promise<void> {
  const memoryDir = getAutoMemPath()
  if (!memoryDir) return

  const entry = `- ${new Date().toISOString()}: ${action} (${Object.entries(context).map(([k, v]) => `${k}=${v}`).join(', ')})\n`

  try {
    await mkdir(join(memoryDir, 'procedural'), { recursive: true })
    await appendFile(join(memoryDir, 'procedural', 'habits.md'), entry)
  } catch {}
}

/**
 * 分析行为模式——返回用户的活跃时段分布。
 */
export function analyzeHabits(memoryDir: string): { peakHours: number[]; avgSessionLength: number; topTools: [string, number][] } {
  const habitsPath = join(memoryDir, 'procedural', 'habits.md')
  const hourCounts: Record<number, number> = {}

  try {
    const content = readFileSync(habitsPath, 'utf-8')
    const timeMatches = content.match(/\d{4}-\d{2}-\d{2}T(\d{2}):/g) || []
    for (const m of timeMatches) {
      const hour = parseInt(m.match(/T(\d{2})/)?.[1] || '0', 10)
      hourCounts[hour] = (hourCounts[hour] || 0) + 1
    }
  } catch {}

  // 识别高频工作时段（前 3 名）
  const peakHours = Object.entries(hourCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([h]) => parseInt(h, 10))

  // 识别工具使用偏好
  const toolCounts: Record<string, number> = {}
  try {
    const episodesDir = join(memoryDir, 'episodes')
    if (existsSync(episodesDir)) {
      for (const f of readdirSync(episodesDir).filter(f => f.endsWith('.md')).slice(-30)) {
        const content = readFileSync(join(episodesDir, f), 'utf-8')
        const toolMatch = content.match(/tools?:\s*\[([^\]]*)\]/i)
        if (toolMatch) {
          toolMatch[1].split(',').map(t => t.trim().replace(/['"]/g, '')).filter(Boolean)
            .forEach(t => { toolCounts[t] = (toolCounts[t] || 0) + 1 })
        }
      }
    }
  } catch {}

  // 扫描 working/ 目录提取工具名
  try {
    const workingDir = join(memoryDir, 'working')
    if (existsSync(workingDir)) {
      for (const f of readdirSync(workingDir).filter(f => f.endsWith('.md')).slice(-20)) {
        const content = readFileSync(join(workingDir, f), 'utf-8')
        const toolMatch = content.match(/tools?:\s*\[([^\]]*)\]/i)
        if (toolMatch) {
          toolMatch[1].split(',').map(t => t.trim().replace(/['"]/g, '')).filter(Boolean)
            .forEach(t => { toolCounts[t] = (toolCounts[t] || 0) + 1 })
        }
      }
    }
  } catch {}

  const topTools: [string, number][] = Object.entries(toolCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)

  // 估算平均连续工作时长（基于时间戳间隔）
  let avgSessionLength = 0
  try {
    const content = readFileSync(habitsPath, 'utf-8')
    const timestamps = (content.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/g) || [])
      .map(t => new Date(t).getTime())
      .filter(t => !isNaN(t))
      .sort((a, b) => a - b)
    if (timestamps.length >= 2) {
      const sessions: number[] = []
      let sessionStart = timestamps[0]
      for (let i = 1; i < timestamps.length; i++) {
        const gap = timestamps[i] - timestamps[i - 1]
        if (gap > 2 * 60 * 60 * 1000) { // 2小时间隔视为新 session
          sessions.push(timestamps[i - 1] - sessionStart)
          sessionStart = timestamps[i]
        }
      }
      sessions.push(timestamps[timestamps.length - 1] - sessionStart)
      const validSessions = sessions.filter(s => s > 0)
      if (validSessions.length > 0) {
        avgSessionLength = validSessions.reduce((a, b) => a + b, 0) / validSessions.length / 3600000
      }
    }
  } catch {}

  // 写入结构化 habits.md（覆盖写入）
  try {
    const proceduralDir = join(memoryDir, 'procedural')
    mkdirSync(proceduralDir, { recursive: true })
    const now = localDateStr()
    const peakHoursStr = peakHours.map(h => `${h}:00`).join(', ') || '暂无数据'
    const toolLines = topTools.length > 0
      ? topTools.map(([name, count], i) => `${i + 1}. ${name} (${count}次)`).join('\n')
      : '暂无数据'
    const avgStr = avgSessionLength > 0 ? `${avgSessionLength.toFixed(1)} 小时` : '暂无数据'

    const habitsContent = `---
type: procedural
updated: ${now}
---
## 工作时段
高频时段: ${peakHoursStr}

## 工具偏好
${toolLines}

## 行为模式
- 连续工作时长: 平均 ${avgStr}
`
    writeFileSync(habitsPath, habitsContent)
  } catch {}

  return { peakHours, avgSessionLength, topTools }
}
