import { feature } from 'bun:bundle'
import { join, relative } from 'path'
import { readFileSync, readdirSync, unlinkSync, writeFileSync, mkdirSync, renameSync } from 'fs'
import { access, writeFile, readFile, appendFile, mkdir } from 'fs/promises'
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
// SA-P0-02: 用户画像自动维护
// ═══════════════════════════════════════════════════════════════════

/**
 * 从对话中提取用户特征，增量更新 semantic/profile.md。
 * 异步执行，不阻塞主循环。仅提取非敏感的行为模式。
 */
export async function updateUserProfile(messages: readonly any[]): Promise<void> {
  if (!isAutoMemoryEnabled()) return

  const memoryDir = getAutoMemPath()
  if (!memoryDir) return

  const profilePath = join(memoryDir, 'semantic', 'profile.md')

  // 提取用户消息的语言、长度、风格特征
  const userMessages = messages.filter((m: any) => m.type === 'user')
  if (userMessages.length === 0) return

  // 简单特征提取（纯本地，不调 API）
  const traits: string[] = []
  const now = new Date().toISOString().split('T')[0]

  // 检测语言偏好
  const allText = userMessages.map((m: any) => {
    const content = m.message?.content
    if (typeof content === 'string') return content
    if (Array.isArray(content)) return content.filter((b: any) => b.type === 'text').map((b: any) => b.text || '').join(' ')
    return ''
  }).join(' ')

  const chineseRatio = (allText.match(/[\u4e00-\u9fff]/g) || []).length / Math.max(allText.length, 1)
  if (chineseRatio > 0.3) traits.push(`${now}: 本次会话使用中文为主`)
  else if (chineseRatio < 0.05 && allText.length > 50) traits.push(`${now}: 本次会话使用英文为主`)

  // 检测消息风格
  const avgLength = allText.length / Math.max(userMessages.length, 1)
  if (avgLength < 30) traits.push(`${now}: 沟通风格简洁直接`)
  else if (avgLength > 200) traits.push(`${now}: 沟通风格详细完整`)

  // 检测活跃时段
  const hour = new Date().getHours()
  if (hour >= 22 || hour < 6) traits.push(`${now}: 深夜活跃 (${hour}:00)`)
  else if (hour >= 6 && hour < 9) traits.push(`${now}: 早起工作 (${hour}:00)`)

  if (traits.length === 0) return

  // 增量追加到进化日志
  try {
    const existing = await readFile(profilePath, 'utf-8').catch(() => '')
    const logEntry = traits.map(t => `- ${t}`).join('\n')
    if (!existing.includes(logEntry.split('\n')[0])) {
      await appendFile(profilePath, '\n' + logEntry + '\n')
    }
  } catch {}
}

// ═══════════════════════════════════════════════════════════════════
// SA-P0-03: 本地全文索引
// ═══════════════════════════════════════════════════════════════════

/**
 * 本地全文索引——基于文件系统的简易语义搜索。
 * 扫描 memory/ 下所有 .md 文件，建立倒排索引。
 * 零外部依赖，纯文本匹配 + 文件内容相关性排序。
 */
export function searchMemory(query: string, memoryDir: string, topK: number = 5): Array<{ file: string; score: number; excerpt: string }> {
  const results: Array<{ file: string; score: number; excerpt: string }> = []

  const files = scanMdFiles(memoryDir)

  // 分词（中英文混合）
  const queryTerms = tokenize(query)
  if (queryTerms.length === 0) return results

  for (const filePath of files) {
    try {
      const content = readFileSync(filePath, 'utf-8')
      const terms = tokenize(content)

      // TF-IDF 简易评分
      let score = 0
      for (const qt of queryTerms) {
        const tf = terms.filter(t => t === qt).length / Math.max(terms.length, 1)
        score += tf
      }

      if (score > 0) {
        const excerpt = extractExcerpt(content, queryTerms)
        results.push({
          file: relative(memoryDir, filePath),
          score,
          excerpt,
        })
      }
    } catch {}
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
export async function decayAndPruneMemories(memoryDir: string): Promise<{ decayed: number; pruned: number }> {
  let decayed = 0, pruned = 0
  const now = Date.now()
  const files = scanMdFiles(memoryDir)

  for (const filePath of files) {
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

      const lastAccessed = lastAccessedMatch ? parseInt(lastAccessedMatch[1]) : now
      const currentStrength = strengthMatch ? parseFloat(strengthMatch[1]) : 1.0

      // Ebbinghaus 衰减：R = e^(-t/S)
      const daysSinceAccess = (now - lastAccessed) / (24 * 60 * 60 * 1000)
      const stability = Math.max(1, currentStrength * 30)
      const newStrength = Math.exp(-daysSinceAccess / stability)

      if (newStrength < 0.1) {
        unlinkSync(filePath)
        pruned++
      } else if (Math.abs(newStrength - currentStrength) > 0.05) {
        if (strengthMatch) {
          content = content.replace(/strength:\s*[\d.]+/, `strength: ${newStrength.toFixed(2)}`)
        } else {
          content = content.replace(/^---\n/, `---\nstrength: ${newStrength.toFixed(2)}\n`)
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

  const dateStr = new Date().toISOString().split('T')[0]
  const briefPath = join(memoryDir, 'working', `morning_brief_${dateStr}.md`)

  // 避免重复生成
  try { await access(briefPath); return } catch {}

  const sections: string[] = [`# 晨间简报 — ${dateStr}\n`]

  // 昨日 dream 报告
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
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

  // 记忆状态
  sections.push('\n## 记忆状态')
  sections.push(`- 记忆文件总数: ${allFiles.length}`)

  await mkdir(join(memoryDir, 'working'), { recursive: true })
  await writeFile(briefPath, sections.join('\n'), 'utf-8')
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

  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'heic', 'heif'].includes(ext)) return 'images'
  if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'pages', 'numbers', 'key'].includes(ext)) return 'documents'
  if (['ts', 'tsx', 'js', 'jsx', 'py', 'rs', 'go', 'java', 'c', 'cpp', 'h', 'swift', 'kt'].includes(ext)) return 'code'
  if (['zip', 'tar', 'gz', 'bz2', 'rar', '7z', 'dmg', 'pkg'].includes(ext)) return 'archives'
  if (['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv'].includes(ext)) return 'videos'
  if (['mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg'].includes(ext)) return 'audio'
  if (['json', 'csv', 'xml', 'yaml', 'yml', 'toml', 'sql', 'db', 'sqlite'].includes(ext)) return 'data'
  if (['md', 'txt', 'rtf', 'log'].includes(ext)) return 'text'
  if (name.includes('screenshot') || name.includes('截屏') || name.includes('screen shot')) return 'screenshots'

  return 'other'
}

/**
 * 扫描目录并生成分类建议。
 */
export function organizeDirectory(srcDir: string, dryRun: boolean = true): Array<{ src: string; dest: string; category: string }> {
  const moves: Array<{ src: string; dest: string; category: string }> = []

  try {
    const entries = readdirSync(srcDir, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isFile()) continue
      if (entry.name.startsWith('.')) continue

      const srcPath = join(srcDir, entry.name)
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
