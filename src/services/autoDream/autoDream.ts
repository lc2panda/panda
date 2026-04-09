// biome-ignore-all assist/source/organizeImports: ANT-ONLY import markers must not be reordered
// Background memory consolidation. Fires the /dream prompt as a forked
// subagent when time-gate passes AND enough sessions have accumulated.
//
// Gate order (cheapest first):
//   1. Time: hours since lastConsolidatedAt >= minHours (one stat)
//   2. Sessions: transcript count with mtime > lastConsolidatedAt >= minSessions
//   3. Lock: no other process mid-consolidation
//
// State is closure-scoped inside initAutoDream() rather than module-level
// (tests call initAutoDream() in beforeEach for a fresh closure).

import type { ContentBlockParam } from '@anthropic-ai/sdk/resources/index.mjs'
import { join } from 'path'
import { writeFile, mkdir } from 'fs/promises'
import type { REPLHookContext } from '../../utils/hooks/postSamplingHooks.js'
import {
  createCacheSafeParams,
  runForkedAgent,
} from '../../utils/forkedAgent.js'
import {
  createUserMessage,
  createMemorySavedMessage,
} from '../../utils/messages.js'
import type { Message } from '../../types/message.js'
import { logForDebugging } from '../../utils/debug.js'
import type { ToolUseContext } from '../../Tool.js'
import { logEvent } from '../analytics/index.js'
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../analytics/growthbook.js'
import { isAutoMemoryEnabled, getAutoMemPath } from '../../memdir/paths.js'
import { isAutoDreamEnabled } from './config.js'
import { getProjectDir } from '../../utils/sessionStorage.js'
import {
  getOriginalCwd,
  getKairosActive,
  getIsRemoteMode,
  getSessionId,
} from '../../bootstrap/state.js'
import { createAutoMemCanUseTool } from '../extractMemories/extractMemories.js'
import { buildConsolidationPrompt } from './consolidationPrompt.js'
import {
  readLastConsolidatedAt,
  listSessionsTouchedSince,
  tryAcquireConsolidationLock,
  rollbackConsolidationLock,
} from './consolidationLock.js'
import {
  registerDreamTask,
  addDreamTurn,
  completeDreamTask,
  failDreamTask,
  isDreamTask,
} from '../../tasks/DreamTask/DreamTask.js'
import { FILE_EDIT_TOOL_NAME } from '../../tools/FileEditTool/constants.js'
import { FILE_WRITE_TOOL_NAME } from '../../tools/FileWriteTool/prompt.js'

// Scan throttle: when time-gate passes but session-gate doesn't, the lock
// mtime doesn't advance, so the time-gate keeps passing every turn.
const SESSION_SCAN_INTERVAL_MS = 10 * 60 * 1000

type AutoDreamConfig = {
  minHours: number
  minSessions: number
}

const DEFAULTS: AutoDreamConfig = {
  minHours: 1,        // SA-P1-01: 用户离开 1 小时即可触发
  minSessions: 2,     // SA-P1-01: 2 个会话就够
}

/**
 * Thresholds from tengu_onyx_plover. The enabled gate lives in config.ts
 * (isAutoDreamEnabled); this returns only the scheduling knobs. Defensive
 * per-field validation since GB cache can return stale wrong-type values.
 */
function getConfig(): AutoDreamConfig {
  const raw =
    getFeatureValue_CACHED_MAY_BE_STALE<Partial<AutoDreamConfig> | null>(
      'tengu_onyx_plover',
      null,
    )
  return {
    minHours:
      typeof raw?.minHours === 'number' &&
      Number.isFinite(raw.minHours) &&
      raw.minHours > 0
        ? raw.minHours
        : DEFAULTS.minHours,
    minSessions:
      typeof raw?.minSessions === 'number' &&
      Number.isFinite(raw.minSessions) &&
      raw.minSessions > 0
        ? raw.minSessions
        : DEFAULTS.minSessions,
  }
}

function isGateOpen(): boolean {
  // Panda: KAIROS gate removed — background autoDream safe because we
  // have isolated memory dir (~/.pandacc/projects/*/memory/), our own lock
  // files, and fork processes (not shared Anthropic infrastructure).
  // This makes autoDream MORE proactive: it runs in both normal and
  // assistant/KAIROS mode, providing always-on memory consolidation.
  if (getIsRemoteMode()) return false
  if (!isAutoMemoryEnabled()) return false
  return isAutoDreamEnabled()
}

// Ant-build-only test override. Bypasses enabled/time/session gates but NOT
// the lock (so repeated turns don't pile up dreams) or the memory-dir
// precondition. Still scans sessions so the prompt's session-hint is populated.
function isForced(): boolean {
  return false
}

type AppendSystemMessageFn = NonNullable<ToolUseContext['appendSystemMessage']>

let runner:
  | ((
      context: REPLHookContext,
      appendSystemMessage?: AppendSystemMessageFn,
    ) => Promise<void>)
  | null = null

/**
 * Call once at startup (from backgroundHousekeeping alongside
 * initExtractMemories), or per-test in beforeEach for a fresh closure.
 */
export function initAutoDream(): void {
  let lastSessionScanAt = 0

  runner = async function runAutoDream(context, appendSystemMessage) {
    const cfg = getConfig()
    const force = isForced()
    if (!force && !isGateOpen()) return

    // --- Time gate ---
    let lastAt: number
    try {
      lastAt = await readLastConsolidatedAt()
    } catch (e: unknown) {
      logForDebugging(
        `[autoDream] readLastConsolidatedAt failed: ${(e as Error).message}`,
      )
      return
    }
    const hoursSince = (Date.now() - lastAt) / 3_600_000
    if (!force && hoursSince < cfg.minHours) return

    // --- Scan throttle ---
    const sinceScanMs = Date.now() - lastSessionScanAt
    if (!force && sinceScanMs < SESSION_SCAN_INTERVAL_MS) {
      logForDebugging(
        `[autoDream] scan throttle — time-gate passed but last scan was ${Math.round(sinceScanMs / 1000)}s ago`,
      )
      return
    }
    lastSessionScanAt = Date.now()

    // --- Session gate ---
    let sessionIds: string[]
    try {
      sessionIds = await listSessionsTouchedSince(lastAt)
    } catch (e: unknown) {
      logForDebugging(
        `[autoDream] listSessionsTouchedSince failed: ${(e as Error).message}`,
      )
      return
    }
    // Exclude the current session (its mtime is always recent).
    const currentSession = getSessionId()
    sessionIds = sessionIds.filter(id => id !== currentSession)
    if (!force && sessionIds.length < cfg.minSessions) {
      logForDebugging(
        `[autoDream] skip — ${sessionIds.length} sessions since last consolidation, need ${cfg.minSessions}`,
      )
      return
    }

    // --- Lock ---
    // Under force, skip acquire entirely — use the existing mtime so
    // kill's rollback is a no-op (rewinds to where it already is).
    // The lock file stays untouched; next non-force turn sees it as-is.
    let priorMtime: number | null
    if (force) {
      priorMtime = lastAt
    } else {
      try {
        priorMtime = await tryAcquireConsolidationLock()
      } catch (e: unknown) {
        logForDebugging(
          `[autoDream] lock acquire failed: ${(e as Error).message}`,
        )
        return
      }
      if (priorMtime === null) return
    }

    logForDebugging(
      `[autoDream] firing — ${hoursSince.toFixed(1)}h since last, ${sessionIds.length} sessions to review`,
    )
    logEvent('tengu_auto_dream_fired', {
      hours_since: Math.round(hoursSince),
      sessions_since: sessionIds.length,
    })

    const setAppState =
      context.toolUseContext.setAppStateForTasks ??
      context.toolUseContext.setAppState
    const abortController = new AbortController()
    const taskId = registerDreamTask(setAppState, {
      sessionsReviewing: sessionIds.length,
      priorMtime,
      abortController,
    })

    try {
      const memoryRoot = getAutoMemPath()
      const transcriptDir = getProjectDir(getOriginalCwd())
      // Tool constraints note goes in `extra`, not the shared prompt body —
      // manual /dream runs in the main loop with normal permissions and this
      // would be misleading there.
      const extra = `

**Tool constraints for this run:** Bash is restricted to read-only commands (\`ls\`, \`find\`, \`grep\`, \`cat\`, \`stat\`, \`wc\`, \`head\`, \`tail\`, and similar). Anything that writes, redirects to a file, or modifies state will be denied. Plan your exploration with this in mind — no need to probe.

Sessions since last consolidation (${sessionIds.length}):
${sessionIds.map(id => `- ${id}`).join('\n')}`
      const prompt = buildConsolidationPrompt(memoryRoot, transcriptDir, extra)

      const result = await runForkedAgent({
        promptMessages: [createUserMessage({ content: prompt })],
        cacheSafeParams: createCacheSafeParams(context),
        canUseTool: createAutoMemCanUseTool(memoryRoot),
        querySource: 'auto_dream',
        forkLabel: 'auto_dream',
        skipTranscript: true,
        overrides: { abortController },
        onMessage: makeDreamProgressWatcher(taskId, setAppState),
      })

      completeDreamTask(taskId, setAppState)

      // DeepDream v2: 全量数据整合（在现有记忆整合之后执行）
      try {
        const dreamReport = await generateDeepDreamReport(memoryRoot)
        if (dreamReport) {
          const dreamsDir = join(memoryRoot, 'dreams')
          await mkdir(dreamsDir, { recursive: true })
          const dateStr = new Date().toISOString().split('T')[0]
          await writeFile(join(dreamsDir, `${dateStr}.md`), dreamReport, 'utf-8')
        }
      } catch (e) {
        logForDebugging(`[autoDream] DeepDream v2 report failed: ${(e as Error).message}`)
      }

      // Inline completion summary in the main transcript (same surface as
      // extractMemories's "Saved N memories" message).
      const dreamState = context.toolUseContext.getAppState().tasks?.[taskId]
      if (
        appendSystemMessage &&
        isDreamTask(dreamState) &&
        dreamState.filesTouched.length > 0
      ) {
        ;(appendSystemMessage as (msg: Message) => void)({
          ...createMemorySavedMessage(dreamState.filesTouched),
          verb: 'Improved',
        })
      }
      logForDebugging(
        `[autoDream] completed — cache: read=${result.totalUsage.cache_read_input_tokens} created=${result.totalUsage.cache_creation_input_tokens}`,
      )
      logEvent('tengu_auto_dream_completed', {
        cache_read: result.totalUsage.cache_read_input_tokens,
        cache_created: result.totalUsage.cache_creation_input_tokens,
        output: result.totalUsage.output_tokens,
        sessions_reviewed: sessionIds.length,
      })
    } catch (e: unknown) {
      // If the user killed from the bg-tasks dialog, DreamTask.kill already
      // aborted, rolled back the lock, and set status=killed. Don't overwrite
      // or double-rollback.
      if (abortController.signal.aborted) {
        logForDebugging('[autoDream] aborted by user')
        return
      }
      logForDebugging(`[autoDream] fork failed: ${(e as Error).message}`)
      logEvent('tengu_auto_dream_failed', {})
      failDreamTask(taskId, setAppState)
      // Rewind mtime so time-gate passes again. Scan throttle is the backoff.
      await rollbackConsolidationLock(priorMtime)
    }
  }
}

/**
 * Watch the forked agent's messages. For each assistant turn, extracts any
 * text blocks (the agent's reasoning/summary — what the user wants to see)
 * and collapses tool_use blocks to a count. Edit/Write file_paths are
 * collected for phase-flip + the inline completion message.
 */
function makeDreamProgressWatcher(
  taskId: string,
  setAppState: import('../../Task.js').SetAppState,
): (msg: Message) => void {
  return msg => {
    if (msg.type !== 'assistant') return
    let text = ''
    let toolUseCount = 0
    const touchedPaths: string[] = []
    const contentBlocks = msg.message.content as ContentBlockParam[]
    for (const block of contentBlocks) {
      if (block.type === 'text') {
        text += block.text
      } else if (block.type === 'tool_use') {
        toolUseCount++
        if (
          block.name === FILE_EDIT_TOOL_NAME ||
          block.name === FILE_WRITE_TOOL_NAME
        ) {
          const input = block.input as { file_path?: unknown }
          if (typeof input.file_path === 'string') {
            touchedPaths.push(input.file_path)
          }
        }
      }
    }
    addDreamTurn(
      taskId,
      { text: text.trim(), toolUseCount },
      touchedPaths,
      setAppState,
    )
  }
}

// ═══════════════════════════════════════════════════════════════════
// SA-P1-01: DeepDream v2 四阶段报告生成
// ═══════════════════════════════════════════════════════════════════

async function generateDeepDreamReport(memoryDir: string): Promise<string | null> {
  const { scanMdFiles, decayAndPruneMemories, readBrowserHistory, readAppleNotes, captureClipboard } = await import('../../memdir/memdir.js')

  const dateStr = new Date().toISOString().split('T')[0]
  const sections: string[] = [`# DeepDream Report — ${dateStr}\n`]

  // Phase 1: Harvest — 扫描当日数据 + 数据连接器
  const episodes = join(memoryDir, 'episodes')
  const todayEpisodes = scanMdFiles(episodes).filter((f: string) => f.includes(dateStr))
  if (todayEpisodes.length === 0 && scanMdFiles(memoryDir).length < 3) return null

  sections.push('## Harvest')
  sections.push(`- 会话记录: ${todayEpisodes.length} 个`)
  sections.push(`- 记忆文件总数: ${scanMdFiles(memoryDir).length}`)

  // 数据连接器：浏览记录
  try {
    const browserHistory = await readBrowserHistory(new Date(Date.now() - 86400000), 20)
    sections.push(`- 浏览记录: ${browserHistory.length} 个页面`)
    if (browserHistory.length > 0) {
      sections.push('  Top 5:')
      for (const h of browserHistory.slice(0, 5)) {
        sections.push(`  - ${h.title} (${h.url.slice(0, 60)})`)
      }
    }
  } catch {}

  // 数据连接器：Apple Notes
  try {
    const notes = await readAppleNotes(10)
    sections.push(`- Apple Notes: ${notes.length} 条近期笔记`)
  } catch {}

  // 数据连接器：剪贴板
  try {
    const clipboard = await captureClipboard()
    if (clipboard) sections.push(`- 剪贴板最近内容: ${clipboard.slice(0, 50)}...`)
  } catch {}

  // Phase 2: Understand — 统计、分析和模式识别
  const allFiles = scanMdFiles(memoryDir)
  const patterns = allFiles.filter((f: string) => f.includes('/patterns/'))
  const scars = allFiles.filter((f: string) => f.includes('/scars/'))

  sections.push('\n## Understand')
  sections.push(`- 成功模式: ${patterns.length} 条`)
  sections.push(`- 失败教训: ${scars.length} 条`)

  // 重复主题检测
  const { readFileSync } = require('fs')
  const titleFreq = new Map<string, number>()
  for (const f of allFiles.slice(0, 100)) {
    try {
      const content = readFileSync(f, 'utf-8') as string
      const nameMatch = content.match(/^name:\s*(.+)$/m)
      if (nameMatch) {
        const key = nameMatch[1].trim().toLowerCase()
        titleFreq.set(key, (titleFreq.get(key) || 0) + 1)
      }
    } catch {}
  }
  const duplicateThemes = [...titleFreq.entries()].filter(([, c]) => c > 1)
  if (duplicateThemes.length > 0) {
    sections.push(`- 重复主题: ${duplicateThemes.map(([t, c]) => `${t}(${c})`).join(', ')}`)
  }

  // Phase 3: Consolidate — 调用衰减清理
  const { decayed, pruned } = await decayAndPruneMemories(memoryDir)
  sections.push('\n## Consolidate')
  sections.push(`- 衰减更新: ${decayed} 条`)
  sections.push(`- 清理删除: ${pruned} 条`)

  // Phase 4: Anticipate — 基于今日数据生成明日建议
  sections.push('\n## Anticipate')
  if (todayEpisodes.length > 3) {
    sections.push('- 建议: 今日会话较多，考虑在晨间简报中回顾重点')
  }
  if (scars.length > patterns.length) {
    sections.push('- 建议: 失败教训多于成功模式，建议关注近期问题根因')
  }
  if (decayed > 5) {
    sections.push('- 建议: 大量记忆衰减，考虑复习核心知识')
  }
  sections.push('- 晨间简报将基于本次整合结果生成')

  return sections.join('\n')
}

/**
 * Entry point from stopHooks. No-op until initAutoDream() has been called.
 * Per-turn cost when enabled: one GB cache read + one stat.
 */
export async function executeAutoDream(
  context: REPLHookContext,
  appendSystemMessage?: AppendSystemMessageFn,
): Promise<void> {
  await runner?.(context, appendSystemMessage)
}

/**
 * Standalone entry point for cron / proactive tasks that lack a live
 * REPLHookContext.  Constructs a minimal synthetic context from bootstrap
 * state and runs the dream pipeline without an appendSystemMessage callback
 * (the forked agent handles its own output).
 *
 * Panda: this bridges the gap between the cron scheduler
 * (builtinTasks.ts) and the autoDream pipeline which was designed for
 * per-turn invocation via stopHooks.
 */
export async function executeAutoDreamStandalone(): Promise<void> {
  // Ensure the closure runner is installed
  if (!runner) initAutoDream()
  if (!runner) return

  const { getAppState, setAppState } = await import('../../bootstrap/state.js')
  const syntheticContext: REPLHookContext = {
    toolUseContext: {
      getAppState,
      setAppState,
      setAppStateForTasks: setAppState,
    } as unknown as REPLHookContext['toolUseContext'],
    messages: [],
  } as unknown as REPLHookContext

  await runner(syntheticContext, undefined)
}
