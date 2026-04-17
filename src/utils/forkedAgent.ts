/**
 * Helper for running forked agent query loops with usage tracking.
 *
 * This utility ensures forked agents:
 * 1. Share identical cache-critical params with the parent to guarantee prompt cache hits
 * 2. Track full usage metrics across the entire query loop
 * 3. Log metrics via the tengu_fork_agent_query event when complete
 * 4. Isolate mutable state to prevent interference with the main agent loop
 */

import type { UUID } from 'crypto'
import { randomUUID } from 'crypto'
import type { PromptCommand } from '../commands.js'
import type { QuerySource } from '../constants/querySource.js'
import type { CanUseToolFn } from '../hooks/useCanUseTool.js'
import { query } from '../query.js'
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../services/analytics/index.js'
import { accumulateUsage, updateUsage } from '../services/api/claude.js'
import { EMPTY_USAGE, type NonNullableUsage } from '../services/api/logging.js'
import type { ToolUseContext } from '../Tool.js'
import type { AgentDefinition } from '../tools/AgentTool/loadAgentsDir.js'
import type { AgentId } from '../types/ids.js'
import type { Message } from '../types/message.js'
import { createChildAbortController } from './abortController.js'
import { logForDebugging } from './debug.js'
import { cloneFileStateCache } from './fileStateCache.js'
import type { REPLHookContext } from './hooks/postSamplingHooks.js'
import {
  createUserMessage,
  extractTextContent,
  getLastAssistantMessage,
} from './messages.js'
import { createDenialTrackingState } from './permissions/denialTracking.js'
import { parseToolListFromCLI } from './permissions/permissionSetup.js'
import { recordSidechainTranscript } from './sessionStorage.js'
import type { SystemPrompt } from './systemPromptType.js'
import {
  type ContentReplacementState,
  cloneContentReplacementState,
} from './toolResultStorage.js'
import { createAgentId } from './uuid.js'

/**
 * Parameters that must be identical between the fork and parent API requests
 * to share the parent's prompt cache. The Anthropic API cache key is composed of:
 * system prompt, tools, model, messages (prefix), and thinking config.
 *
 * CacheSafeParams carries the first five. Thinking config is derived from the
 * inherited toolUseContext.options.thinkingConfig — but can be inadvertently
 * changed if the fork sets maxOutputTokens, which clamps budget_tokens in
 * claude.ts (but only for older models that do not use adaptive thinking).
 * See the maxOutputTokens doc on ForkedAgentParams.
 */
export type CacheSafeParams = {
  /** System prompt - must match parent for cache hits */
  systemPrompt: SystemPrompt
  /** User context - prepended to messages, affects cache */
  userContext: { [k: string]: string }
  /** System context - appended to system prompt, affects cache */
  systemContext: { [k: string]: string }
  /** Tool use context containing tools, model, and other options */
  toolUseContext: ToolUseContext
  /** Parent context messages for prompt cache sharing */
  forkContextMessages: Message[]
}

// Slot written by handleStopHooks after each turn so post-turn forks
// (promptSuggestion, postTurnSummary, /btw) can share the main loop's
// prompt cache without each caller threading params through.
let lastCacheSafeParams: CacheSafeParams | null = null

export function saveCacheSafeParams(params: CacheSafeParams | null): void {
  lastCacheSafeParams = params
}

export function getLastCacheSafeParams(): CacheSafeParams | null {
  return lastCacheSafeParams
}

// Lightweight dedup lock for background forks: prevents the same fork type
// from being dispatched twice within a short window. Fixes a race where a
// post-sampling hook can fire twice in quick succession (e.g. session_memory
// observed forking concurrently 2c10ca+7a0c16 in session 7b98a98d).
const _recentForks = new Map<string, number>()
const DEFAULT_FORK_DEDUP_WINDOW_MS = 5000

/**
 * Returns true if a fork of this type may start now, false if another fork of
 * the same type started within `windowMs` (default 5s). On success the start
 * timestamp is recorded so the next concurrent caller is rejected.
 */
export function shouldStartFork(
  forkType: string,
  windowMs: number = DEFAULT_FORK_DEDUP_WINDOW_MS,
): boolean {
  const now = Date.now()
  const last = _recentForks.get(forkType)
  if (last !== undefined && now - last < windowMs) return false
  _recentForks.set(forkType, now)
  return true
}

export type ForkedAgentParams = {
  /** Messages to start the forked query loop with */
  promptMessages: Message[]
  /** Cache-safe parameters that must match the parent query */
  cacheSafeParams: CacheSafeParams
  /** Permission check function for the forked agent */
  canUseTool: CanUseToolFn
  /** Source identifier for tracking */
  querySource: QuerySource
  /** Label for analytics (e.g., 'session_memory', 'supervisor') */
  forkLabel: string
  /** Optional overrides for the subagent context (e.g., readFileState from setup phase) */
  overrides?: SubagentContextOverrides
  /**
   * Optional cap on output tokens. CAUTION: setting this changes both max_tokens
   * AND budget_tokens (via clamping in claude.ts). If the fork uses cacheSafeParams
   * to share the parent's prompt cache, a different budget_tokens will invalidate
   * the cache — thinking config is part of the cache key. Only set this when cache
   * sharing is not a goal (e.g., compact summaries).
   */
  maxOutputTokens?: number
  /** Optional cap on number of turns (API round-trips) */
  maxTurns?: number
  /** Optional callback invoked for each message as it arrives (for streaming UI) */
  onMessage?: (message: Message) => void
  /** Skip sidechain transcript recording (e.g., for ephemeral work like speculation) */
  skipTranscript?: boolean
  /** Skip writing new prompt cache entries on the last message. For
   *  fire-and-forget forks where no future request will read from this prefix. */
  skipCacheWrite?: boolean
}

export type ForkedAgentResult = {
  /** All messages yielded during the query loop */
  messages: Message[]
  /** Accumulated usage across all API calls in the loop */
  totalUsage: NonNullableUsage
}

/**
 * Creates CacheSafeParams from REPLHookContext.
 * Use this helper when forking from a post-sampling hook context.
 *
 * To override specific fields (e.g., toolUseContext with cloned file state),
 * spread the result and override: `{ ...createCacheSafeParams(context), toolUseContext: clonedContext }`
 *
 * Chi P0-1 (Wave 3 cache prefix reuse):
 * Prefer toolUseContext.renderedSystemPrompt when available — that's the exact
 * byte sequence the parent turn used at query() time (set by REPL right before
 * the parent call). context.systemPrompt is the same value in normal operation,
 * but pinning to renderedSystemPrompt guarantees verbatim reuse and eliminates
 * drift from any intermediate rebuild (e.g., GrowthBook flag flips between hook
 * registration and fork spawn).
 *
 * @param context - The REPLHookContext from the post-sampling hook
 */
export function createCacheSafeParams(
  context: REPLHookContext,
): CacheSafeParams {
  const parentRendered = context.toolUseContext.renderedSystemPrompt
  return {
    systemPrompt: parentRendered ?? context.systemPrompt,
    userContext: context.userContext,
    systemContext: context.systemContext,
    toolUseContext: context.toolUseContext,
    forkContextMessages: context.messages,
  }
}

/**
 * Creates a modified getAppState that adds allowed tools to the permission context.
 * This is used by forked skill/command execution to grant tool permissions.
 */
export function createGetAppStateWithAllowedTools(
  baseGetAppState: ToolUseContext['getAppState'],
  allowedTools: string[],
): ToolUseContext['getAppState'] {
  if (allowedTools.length === 0) return baseGetAppState
  return () => {
    const appState = baseGetAppState()
    return {
      ...appState,
      toolPermissionContext: {
        ...appState.toolPermissionContext,
        alwaysAllowRules: {
          ...appState.toolPermissionContext.alwaysAllowRules,
          command: [
            ...new Set([
              ...(appState.toolPermissionContext.alwaysAllowRules.command ||
                []),
              ...allowedTools,
            ]),
          ],
        },
      },
    }
  }
}

/**
 * Result from preparing a forked command context.
 */
export type PreparedForkedContext = {
  /** Skill content with args replaced */
  skillContent: string
  /** Modified getAppState with allowed tools */
  modifiedGetAppState: ToolUseContext['getAppState']
  /** The general-purpose agent to use */
  baseAgent: AgentDefinition
  /** Initial prompt messages */
  promptMessages: Message[]
}

/**
 * Prepares the context for executing a forked command/skill.
 * This handles the common setup that both SkillTool and slash commands need.
 */
export async function prepareForkedCommandContext(
  command: PromptCommand,
  args: string,
  context: ToolUseContext,
): Promise<PreparedForkedContext> {
  // Get skill content with $ARGUMENTS replaced
  const skillPrompt = await command.getPromptForCommand(args, context)
  const skillContent = skillPrompt
    .map(block => (block.type === 'text' ? block.text : ''))
    .join('\n')

  // Parse and prepare allowed tools
  const allowedTools = parseToolListFromCLI(command.allowedTools ?? [])

  // Create modified context with allowed tools
  const modifiedGetAppState = createGetAppStateWithAllowedTools(
    context.getAppState,
    allowedTools,
  )

  // Use command.agent if specified, otherwise 'general-purpose'
  const agentTypeName = command.agent ?? 'general-purpose'
  const agents = context.options.agentDefinitions.activeAgents
  const baseAgent =
    agents.find(a => a.agentType === agentTypeName) ??
    agents.find(a => a.agentType === 'general-purpose') ??
    agents[0]

  if (!baseAgent) {
    throw new Error('No agent available for forked execution')
  }

  // Prepare prompt messages
  const promptMessages = [createUserMessage({ content: skillContent })]

  return {
    skillContent,
    modifiedGetAppState,
    baseAgent,
    promptMessages,
  }
}

/**
 * Extracts result text from agent messages.
 */
export function extractResultText(
  agentMessages: Message[],
  defaultText = 'Execution completed',
): string {
  const lastAssistantMessage = getLastAssistantMessage(agentMessages)
  if (!lastAssistantMessage) return defaultText

  const textContent = extractTextContent(
    Array.isArray(lastAssistantMessage.message.content) ? lastAssistantMessage.message.content : [],
    '\n',
  )

  return textContent || defaultText
}

/**
 * Options for creating a subagent context.
 *
 * By default, all mutable state is isolated to prevent interference with the parent.
 * Use these options to:
 * - Override specific fields (e.g., custom options, agentId, messages)
 * - Explicitly opt-in to sharing specific callbacks (for interactive subagents)
 */
export type SubagentContextOverrides = {
  /** Override the options object (e.g., custom tools, model) */
  options?: ToolUseContext['options']
  /** Override the agentId (for subagents with their own ID) */
  agentId?: AgentId
  /** Override the agentType (for subagents with a specific type) */
  agentType?: string
  /** Override the messages array */
  messages?: Message[]
  /** Override the readFileState (e.g., fresh cache instead of clone) */
  readFileState?: ToolUseContext['readFileState']
  /** Override the abortController */
  abortController?: AbortController
  /** Override the getAppState function */
  getAppState?: ToolUseContext['getAppState']

  /**
   * Explicit opt-in to share parent's setAppState callback.
   * Use for interactive subagents that need to update shared state.
   * @default false (isolated no-op)
   */
  shareSetAppState?: boolean
  /**
   * Explicit opt-in to share parent's setResponseLength callback.
   * Use for subagents that contribute to parent's response metrics.
   * @default false (isolated no-op)
   */
  shareSetResponseLength?: boolean
  /**
   * Explicit opt-in to share parent's abortController.
   * Use for interactive subagents that should abort with parent.
   * Note: Only applies if abortController override is not provided.
   * @default false (new controller linked to parent)
   */
  shareAbortController?: boolean
  /** Critical system reminder to re-inject at every user turn */
  criticalSystemReminder_EXPERIMENTAL?: string
  /** When true, canUseTool must always be called even when hooks auto-approve.
   *  Used by speculation for overlay file path rewriting. */
  requireCanUseTool?: boolean
  /** Override replacement state — used by resumeAgentBackground to thread
   * state reconstructed from the resumed sidechain so the same results
   * are re-replaced (prompt cache stability). */
  contentReplacementState?: ContentReplacementState
}

/**
 * Creates an isolated ToolUseContext for subagents.
 *
 * By default, ALL mutable state is isolated to prevent interference:
 * - readFileState: cloned from parent
 * - abortController: new controller linked to parent (parent abort propagates)
 * - getAppState: wrapped to set shouldAvoidPermissionPrompts
 * - All mutation callbacks (setAppState, etc.): no-op
 * - Fresh collections: nestedMemoryAttachmentTriggers, toolDecisions
 *
 * Callers can:
 * - Override specific fields via the overrides parameter
 * - Explicitly opt-in to sharing specific callbacks (shareSetAppState, etc.)
 *
 * @param parentContext - The parent's ToolUseContext to create subagent context from
 * @param overrides - Optional overrides and sharing options
 *
 * @example
 * // Full isolation (for background agents like session memory)
 * const ctx = createSubagentContext(parentContext)
 *
 * @example
 * // Custom options and agentId (for AgentTool async agents)
 * const ctx = createSubagentContext(parentContext, {
 *   options: customOptions,
 *   agentId: newAgentId,
 *   messages: initialMessages,
 * })
 *
 * @example
 * // Interactive subagent that shares some state
 * const ctx = createSubagentContext(parentContext, {
 *   options: customOptions,
 *   agentId: newAgentId,
 *   shareSetAppState: true,
 *   shareSetResponseLength: true,
 *   shareAbortController: true,
 * })
 */
export function createSubagentContext(
  parentContext: ToolUseContext,
  overrides?: SubagentContextOverrides,
): ToolUseContext {
  // Determine abortController: explicit override > share parent's > new child
  const abortController =
    overrides?.abortController ??
    (overrides?.shareAbortController
      ? parentContext.abortController
      : createChildAbortController(parentContext.abortController))

  // Determine getAppState - wrap to set shouldAvoidPermissionPrompts unless sharing abortController
  // (if sharing abortController, it's an interactive agent that CAN show UI)
  const getAppState: ToolUseContext['getAppState'] = overrides?.getAppState
    ? overrides.getAppState
    : overrides?.shareAbortController
      ? parentContext.getAppState
      : () => {
          const state = parentContext.getAppState()
          if (state.toolPermissionContext.shouldAvoidPermissionPrompts) {
            return state
          }
          return {
            ...state,
            toolPermissionContext: {
              ...state.toolPermissionContext,
              shouldAvoidPermissionPrompts: true,
            },
          }
        }

  return {
    // Mutable state - cloned by default to maintain isolation
    // Clone overrides.readFileState if provided, otherwise clone from parent
    readFileState: cloneFileStateCache(
      overrides?.readFileState ?? parentContext.readFileState,
    ),
    nestedMemoryAttachmentTriggers: new Set<string>(),
    loadedNestedMemoryPaths: new Set<string>(),
    dynamicSkillDirTriggers: new Set<string>(),
    // Per-subagent: tracks skills surfaced by discovery for was_discovered telemetry (SkillTool.ts:116)
    discoveredSkillNames: new Set<string>(),
    toolDecisions: undefined,
    // Budget decisions: override > clone of parent > undefined (feature off).
    //
    // Clone by default (not fresh): cache-sharing forks process parent
    // messages containing parent tool_use_ids. A fresh state would see
    // them as unseen and make divergent replacement decisions → wire
    // prefix differs → cache miss. A clone makes identical decisions →
    // cache hit. For non-forking subagents the parent UUIDs never match
    // — clone is a harmless no-op.
    //
    // Override: AgentTool resume (reconstructed from sidechain records)
    // and inProcessRunner (per-teammate persistent loop state).
    contentReplacementState:
      overrides?.contentReplacementState ??
      (parentContext.contentReplacementState
        ? cloneContentReplacementState(parentContext.contentReplacementState)
        : undefined),

    // AbortController
    abortController,

    // AppState access
    getAppState,
    setAppState: overrides?.shareSetAppState
      ? parentContext.setAppState
      : () => {},
    // Task registration/kill must always reach the root store, even when
    // setAppState is a no-op — otherwise async agents' background bash tasks
    // are never registered and never killed (PPID=1 zombie).
    setAppStateForTasks:
      parentContext.setAppStateForTasks ?? parentContext.setAppState,
    // Async subagents whose setAppState is a no-op need local denial tracking
    // so the denial counter actually accumulates across retries.
    localDenialTracking: overrides?.shareSetAppState
      ? parentContext.localDenialTracking
      : createDenialTrackingState(),

    // Mutation callbacks - no-op by default
    setInProgressToolUseIDs: () => {},
    setResponseLength: overrides?.shareSetResponseLength
      ? parentContext.setResponseLength
      : () => {},
    pushApiMetricsEntry: overrides?.shareSetResponseLength
      ? parentContext.pushApiMetricsEntry
      : undefined,
    updateFileHistoryState: () => {},
    // Attribution is scoped and functional (prev => next) — safe to share even
    // when setAppState is stubbed. Concurrent calls compose via React's state queue.
    updateAttributionState: parentContext.updateAttributionState,

    // UI callbacks - undefined for subagents (can't control parent UI)
    addNotification: undefined,
    setToolJSX: undefined,
    setStreamMode: undefined,
    setSDKStatus: undefined,
    openMessageSelector: undefined,

    // Fields that can be overridden or copied from parent
    options: overrides?.options ?? parentContext.options,
    messages: overrides?.messages ?? parentContext.messages,
    // Generate new agentId for subagents (each subagent should have its own ID)
    agentId: overrides?.agentId ?? createAgentId(),
    agentType: overrides?.agentType,

    // Create new query tracking chain for subagent with incremented depth
    queryTracking: {
      chainId: randomUUID(),
      depth: (parentContext.queryTracking?.depth ?? -1) + 1,
    },
    fileReadingLimits: parentContext.fileReadingLimits,
    userModified: parentContext.userModified,
    criticalSystemReminder_EXPERIMENTAL:
      overrides?.criticalSystemReminder_EXPERIMENTAL,
    requireCanUseTool: overrides?.requireCanUseTool,
  }
}

/**
 * Runs a forked agent query loop and tracks cache hit metrics.
 *
 * This function:
 * 1. Uses identical cache-safe params from parent to enable prompt caching
 * 2. Accumulates usage across all query iterations
 * 3. Logs tengu_fork_agent_query with full usage when complete
 *
 * @example
 * ```typescript
 * const result = await runForkedAgent({
 *   promptMessages: [createUserMessage({ content: userPrompt })],
 *   cacheSafeParams: {
 *     systemPrompt,
 *     userContext,
 *     systemContext,
 *     toolUseContext: clonedToolUseContext,
 *     forkContextMessages: messages,
 *   },
 *   canUseTool,
 *   querySource: 'session_memory',
 *   forkLabel: 'session_memory',
 * })
 * ```
 */
// Known fire-and-forget fork labels whose final cache_creation will never be
// read by a subsequent request. Automatically opt into skipCacheWrite to avoid
// paying the 1.25× write premium for cache entries that are never reused.
const FIRE_AND_FORGET_FORK_LABELS = new Set([
  'session_memory',
  'prompt_suggestion',
  'away_summary',
  'extract_memories',
  'auto_dream',
  'compact',
  'agent_summary',
  'session_summary',
])

/**
 * Smart context compaction for forked agents (L1+L2).
 *
 * L1: Structural truncation — preserve head/tail + key lines (errors, grep
 *     matches, diff hunks, function defs). Zero API calls.
 * L2: Time-decay — recent tool results kept in full, older ones get
 *     progressively more aggressive truncation based on "age" (position
 *     distance from the most recent tool_result).
 *
 * L3 (LLM summary) is handled separately via sideQuery when the context
 * exceeds 70% of model window — see the caller in the query loop.
 */
function smartCompactContent(
  content: string,
  maxLen: number,
  age: number,
): string {
  if (content.length <= maxLen) return content

  const lines = content.split('\n')

  // L1: Extract structurally important lines
  const keyLines: string[] = []
  for (const line of lines) {
    if (
      line.includes('error') || line.includes('Error') || line.includes('ERROR') ||
      line.includes('warning') || line.includes('Warning') ||
      /^\s*\d+[:-]/.test(line) ||                          // grep with line numbers
      /^[+-][^+-]/.test(line) ||                            // diff change lines
      /^(def |class |function |export |import )/.test(line) || // definitions
      line.startsWith('===') || line.startsWith('---') ||   // section separators
      /\.(ts|js|py|rs|go|java|cpp|sh)[:(\s]/.test(line) || // file references
      line.includes('TODO') || line.includes('FIXME')
    ) {
      keyLines.push(line)
    }
  }

  // Head (first 15 lines) + tail (last 8 lines) + key lines (up to 30)
  const head = lines.slice(0, 15).join('\n')
  const tail = lines.slice(-8).join('\n')
  const keySection = keyLines.slice(0, 30).join('\n')

  // L2: Time-decay factor — older results get truncated more aggressively
  // age=0 → keep 100%, age=1 → 85%, age=2 → 70%, ... age≥6 → 20% minimum
  const decayFactor = Math.max(0.2, 1 - age * 0.15)
  const budget = Math.floor(maxLen * decayFactor)

  const assembled = [
    head,
    keySection.length > 0 ? `\n... [${keyLines.length} key lines extracted] ...\n${keySection}` : '',
    `\n... [${lines.length - 23} lines omitted] ...\n`,
    tail,
  ].filter(Boolean).join('\n')

  const truncated = assembled.slice(0, budget)
  return truncated + `\n[L1+L2 smart-compact: ${content.length}→${truncated.length} chars, age=${age}, decay=${(decayFactor * 100).toFixed(0)}%]`
}

/**
 * Budget-driven smart compaction for forked agents (L1+L2).
 *
 * Key principle: **DO NOT truncate unless total context actually needs it.**
 * Only when total size exceeds the budget do we start compressing, and we
 * compress from oldest to newest with progressive aggressiveness.
 *
 * Budget allocation:
 *   1. Calculate total chars of all messages
 *   2. If total < contextBudget → return as-is (no truncation!)
 *   3. If total > contextBudget → compress old tool_results:
 *      - Recent N tool_results: 100% preserved
 *      - Older ones: budget allocated by weight (newest-old gets more)
 *      - Each compressed via smartCompactContent (L1: key-line extraction)
 *      - Weight decays with age (L2: time-decay)
 */
export function truncateOldToolResults(
  messages: Message[],
  {
    keepRecent = 4,
    // 200K tokens × ~4 chars/token × 60% safe margin = 480K chars
    contextBudgetChars = 480_000,
  }: {
    keepRecent?: number
    contextBudgetChars?: number
  } = {},
): Message[] {
  // Step 1: Calculate total context size
  const totalChars = messages.reduce((sum, m) => {
    const content = typeof m.content === 'string'
      ? m.content
      : JSON.stringify(m.content)
    return sum + content.length
  }, 0)

  // If within budget, return unchanged — no truncation needed!
  if (totalChars <= contextBudgetChars) return messages

  // Step 2: Collect all tool_result positions with their content sizes
  const toolResultPositions: { msgIdx: number; blockIdx: number; size: number }[] = []
  for (let m = 0; m < messages.length; m++) {
    const msg = messages[m]!
    if (!Array.isArray(msg.content)) continue
    for (let b = 0; b < msg.content.length; b++) {
      const block = msg.content[b]!
      if (block.type === 'tool_result') {
        const size = typeof block.content === 'string'
          ? block.content.length
          : JSON.stringify(block.content).length
        toolResultPositions.push({ msgIdx: m, blockIdx: b, size })
      }
    }
  }

  if (toolResultPositions.length <= keepRecent) return messages

  // Step 3: Calculate how much we need to trim
  const excessChars = totalChars - contextBudgetChars
  const oldPositions = toolResultPositions.slice(0, -keepRecent)

  // Total size of old tool_results
  const oldTotalSize = oldPositions.reduce((s, p) => s + p.size, 0)

  // If old tool_results are smaller than excess, we can't save enough
  // by truncating them — but we try our best
  const targetReduction = Math.min(excessChars, oldTotalSize * 0.8)

  // Step 4: Allocate compression budgets with age-based decay
  // Oldest gets most aggressive compression, newest-old gets least
  const compressionTargets = new Map<string, { budget: number; age: number }>()

  for (let i = 0; i < oldPositions.length; i++) {
    const pos = oldPositions[i]!
    const age = oldPositions.length - i  // oldest = highest age

    // Weight: older items should contribute more to reduction
    // age=1 (newest-old) → weight 0.3, age=N (oldest) → weight 1.0
    const weight = 0.3 + 0.7 * (age / oldPositions.length)

    // How much this item should contribute to total reduction
    const itemReduction = (weight * pos.size / oldTotalSize) * targetReduction
    const itemBudget = Math.max(2000, pos.size - itemReduction) // minimum 2K chars

    compressionTargets.set(`${pos.msgIdx}:${pos.blockIdx}`, {
      budget: Math.floor(itemBudget),
      age,
    })
  }

  // Step 5: Apply compression only where needed
  return messages.map((msg, mIdx) => {
    if (!Array.isArray(msg.content)) return msg

    let changed = false
    const newContent = msg.content.map((block, bIdx) => {
      const key = `${mIdx}:${bIdx}`
      const target = compressionTargets.get(key)
      if (!target || block.type !== 'tool_result') return block

      const currentSize = typeof block.content === 'string'
        ? block.content.length
        : JSON.stringify(block.content).length

      // If this block is already within its budget, don't touch it!
      if (currentSize <= target.budget) return block

      changed = true

      if (typeof block.content === 'string') {
        return { ...block, content: smartCompactContent(block.content, target.budget, target.age) }
      }

      if (Array.isArray(block.content)) {
        return {
          ...block,
          content: block.content.map((sub: any) => {
            if (sub.type === 'text' && typeof sub.text === 'string' && sub.text.length > target.budget / 2) {
              return { ...sub, text: smartCompactContent(sub.text, target.budget / 2, target.age) }
            }
            return sub
          }),
        }
      }

      return block
    })

    return changed ? { ...msg, content: newContent } : msg
  })
}

/**
 * L3: LLM-powered summarization of old conversation context.
 * Triggered when total context exceeds 70% of model window after L1+L2.
 * Uses a single haiku call to compress old messages into a structured summary.
 * Returns modified messages array with old messages replaced by summary.
 */
async function l3SummarizeOldContext(
  messages: Message[],
  querySource: QuerySource,
  keepRecentCount: number = 6,
  modelWindowTokens: number = 200_000,
): Promise<Message[]> {
  if (messages.length <= keepRecentCount + 2) return messages

  // Rough token estimate: ~4 chars per token
  const totalChars = messages.reduce((sum, m) => {
    const content =
      typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
    return sum + content.length
  }, 0)
  const estimatedTokens = totalChars / 4

  // Only trigger at 70% of model window
  if (estimatedTokens < modelWindowTokens * 0.7) return messages

  const recentMessages = messages.slice(-keepRecentCount)
  const oldMessages = messages.slice(0, -keepRecentCount)

  // Build summary prompt from old messages
  const oldContent = oldMessages
    .map((m, i) => {
      const content =
        typeof m.content === 'string'
          ? m.content
          : Array.isArray(m.content)
            ? m.content
                .map((b: any) => b.text || b.content || '[non-text]')
                .join('\n')
            : JSON.stringify(m.content)
      // Truncate each message to 500 chars for the summary prompt
      return `[${m.role} #${i}]: ${content.slice(0, 500)}`
    })
    .join('\n\n')

  try {
    const { sideQuery } = await import('./sideQuery.js')
    const response = await sideQuery({
      model: 'claude-haiku-4-5',
      system:
        'You are a context summarizer. Summarize the key facts, decisions, file paths, code changes, errors, and action items from the conversation. Be concise but preserve all actionable information. Output in bullet points.',
      messages: [
        {
          role: 'user',
          content: `Summarize this conversation history:\n\n${oldContent.slice(0, 30_000)}`,
        },
      ],
      max_tokens: 2048,
      querySource,
    })

    // Extract text from haiku response
    const summaryText = response.content
      .filter((b): b is { type: 'text'; text: string } => b.type === 'text')
      .map(b => b.text)
      .join('\n')

    if (!summaryText) return messages

    // Replace old messages with a single summary message
    const summaryMessage: Message = {
      role: 'user',
      content: `[Context Summary - ${oldMessages.length} earlier messages compressed]\n\n${summaryText}`,
      type: 'user',
      uuid: randomUUID() as any,
    }

    return [summaryMessage, ...recentMessages]
  } catch (err) {
    // L3 failure is non-fatal — return messages as-is (L1+L2 already applied)
    logForDebugging(`[forkedAgent] L3 summarization failed: ${err}`)
    return messages
  }
}

export async function runForkedAgent({
  promptMessages,
  cacheSafeParams,
  canUseTool,
  querySource,
  forkLabel,
  overrides,
  maxOutputTokens,
  maxTurns,
  onMessage,
  skipTranscript,
  skipCacheWrite,
}: ForkedAgentParams): Promise<ForkedAgentResult> {
  // Auto-enable skipCacheWrite for fire-and-forget forks: single-turn forks
  // or known labels whose cache_creation on the last breakpoint will never be
  // read by a subsequent request — avoids the 1.25× write cost.
  if (!skipCacheWrite) {
    if (maxTurns === 1 || FIRE_AND_FORGET_FORK_LABELS.has(forkLabel)) {
      skipCacheWrite = true
    }
  }

  const startTime = Date.now()
  const outputMessages: Message[] = []
  let totalUsage: NonNullableUsage = { ...EMPTY_USAGE }

  // v2.20.9: 移除硬超时。复杂任务时间不可预测，maxTurns=10 已足够防 runaway。
  // 保留 env PANDA_FORK_TIMEOUT_MS 作 opt-in（默认0=禁用），供调试用。
  const timeoutMs = parseInt(process.env.PANDA_FORK_TIMEOUT_MS || '0', 10)
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  if (timeoutMs > 0) {
    const forkAbortController = new AbortController()
    timeoutId = setTimeout(() => {
      logForDebugging(`[forkedAgent] ${forkLabel} timed out after ${timeoutMs}ms — aborting`)
      forkAbortController.abort()
    }, timeoutMs)
    if (overrides?.abortController) {
      const parentSignal = overrides.abortController.signal
      if (parentSignal.aborted) forkAbortController.abort()
      else parentSignal.addEventListener('abort', () => forkAbortController.abort(), { once: true })
    }
    overrides = { ...overrides, abortController: forkAbortController }
  }

  const {
    systemPrompt: providedSystemPrompt,
    userContext,
    systemContext,
    toolUseContext,
    forkContextMessages,
  } = cacheSafeParams

  // Chi P0-1 (Wave 3 cache prefix reuse):
  // Always prefer parent's renderedSystemPrompt (the exact bytes parent used
  // at query() time). Callers that build cacheSafeParams manually may not
  // thread it through — pin here so every fork path gets verbatim parent
  // system[0]. Anthropic guide: "Copy the parent's system, tools, and model
  // verbatim, then append fork-specific content at the end."
  const systemPrompt =
    toolUseContext.renderedSystemPrompt ?? providedSystemPrompt

  // Create isolated context to prevent mutation of parent state
  const isolatedToolUseContext = createSubagentContext(
    toolUseContext,
    overrides,
  )

  // Do NOT filterIncompleteToolCalls here — it drops the whole assistant on
  // partial tool batches, orphaning the paired results (API 400). Dangling
  // tool_uses are repaired downstream by ensureToolResultPairing in claude.ts,
  // same as the main thread — identical post-repair prefix keeps the cache hit.
  //
  // L1+L2: truncate old tool results (cheap, no API calls)
  // L3: if still >70% of model window, summarize old messages via haiku
  const initialMessages: Message[] = await l3SummarizeOldContext(
    truncateOldToolResults([...forkContextMessages, ...promptMessages]),
    querySource,
  )

  // Generate agent ID and record initial messages for transcript
  // When skipTranscript is set, skip agent ID creation and all transcript I/O
  const agentId = skipTranscript ? undefined : createAgentId(forkLabel)
  let lastRecordedUuid: UUID | null = null
  if (agentId) {
    await recordSidechainTranscript(initialMessages, agentId).catch(err =>
      logForDebugging(
        `Forked agent [${forkLabel}] failed to record initial transcript: ${err}`,
      ),
    )
    // Track the last recorded message UUID for parent chain continuity
    lastRecordedUuid =
      initialMessages.length > 0
        ? initialMessages[initialMessages.length - 1]!.uuid
        : null
  }

  // Run the query loop with isolated context (cache-safe params preserved)
  try {
    for await (const message of query({
      messages: initialMessages,
      systemPrompt,
      userContext,
      systemContext,
      canUseTool,
      toolUseContext: isolatedToolUseContext,
      querySource,
      maxOutputTokensOverride: maxOutputTokens,
      maxTurns,
      skipCacheWrite,
    })) {
      // Extract real usage from message_delta stream events (final usage per API call)
      if (message.type === 'stream_event') {
        if (
          'event' in message &&
          (message as any).event?.type === 'message_delta' &&
          (message as any).event.usage
        ) {
          const turnUsage = updateUsage({ ...EMPTY_USAGE }, (message as any).event.usage)
          totalUsage = accumulateUsage(totalUsage, turnUsage)
        }
        continue
      }
      if (message.type === 'stream_request_start') {
        continue
      }

      logForDebugging(
        `Forked agent [${forkLabel}] received message: type=${message.type}`,
      )

      outputMessages.push(message as Message)
      onMessage?.(message as Message)

      // Record transcript for recordable message types (same pattern as runAgent.ts)
      const msg = message as Message
      if (
        agentId &&
        (msg.type === 'assistant' ||
          msg.type === 'user' ||
          msg.type === 'progress')
      ) {
        await recordSidechainTranscript([msg], agentId, lastRecordedUuid).catch(
          err =>
            logForDebugging(
              `Forked agent [${forkLabel}] failed to record transcript: ${err}`,
            ),
        )
        if (msg.type !== 'progress') {
          lastRecordedUuid = msg.uuid
        }
      }
    }
  } finally {
    clearTimeout(timeoutId) // v2.20.8: 清理超时计时器
    // Release cloned file state cache memory (same pattern as runAgent.ts)
    isolatedToolUseContext.readFileState.clear()
    // Release the cloned fork context messages
    initialMessages.length = 0
  }

  logForDebugging(
    `Forked agent [${forkLabel}] finished: ${outputMessages.length} messages, types=[${outputMessages.map(m => m.type).join(', ')}], totalUsage: input=${totalUsage.input_tokens} output=${totalUsage.output_tokens} cacheRead=${totalUsage.cache_read_input_tokens} cacheCreate=${totalUsage.cache_creation_input_tokens}`,
  )

  const durationMs = Date.now() - startTime

  // Log the fork query metrics with full NonNullableUsage
  logForkAgentQueryEvent({
    forkLabel,
    querySource,
    durationMs,
    messageCount: outputMessages.length,
    totalUsage,
    queryTracking: toolUseContext.queryTracking,
  })

  return {
    messages: outputMessages,
    totalUsage,
  }
}

/**
 * Logs the tengu_fork_agent_query event with full NonNullableUsage fields.
 */
function logForkAgentQueryEvent({
  forkLabel,
  querySource,
  durationMs,
  messageCount,
  totalUsage,
  queryTracking,
}: {
  forkLabel: string
  querySource: QuerySource
  durationMs: number
  messageCount: number
  totalUsage: NonNullableUsage
  queryTracking?: { chainId: string; depth: number }
}): void {
  // Calculate cache hit rate
  const totalInputTokens =
    totalUsage.input_tokens +
    totalUsage.cache_creation_input_tokens +
    totalUsage.cache_read_input_tokens
  const cacheHitRate =
    totalInputTokens > 0
      ? totalUsage.cache_read_input_tokens / totalInputTokens
      : 0

  logEvent('tengu_fork_agent_query', {
    // Metadata
    forkLabel:
      forkLabel as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    querySource:
      querySource as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    durationMs,
    messageCount,

    // NonNullableUsage fields
    inputTokens: totalUsage.input_tokens,
    outputTokens: totalUsage.output_tokens,
    cacheReadInputTokens: totalUsage.cache_read_input_tokens,
    cacheCreationInputTokens: totalUsage.cache_creation_input_tokens,
    serviceTier:
      totalUsage.service_tier as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    cacheCreationEphemeral1hTokens:
      totalUsage.cache_creation.ephemeral_1h_input_tokens,
    cacheCreationEphemeral5mTokens:
      totalUsage.cache_creation.ephemeral_5m_input_tokens,

    // Derived metrics
    cacheHitRate,

    // Query tracking
    ...(queryTracking
      ? {
          queryChainId:
            queryTracking.chainId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          queryDepth: queryTracking.depth,
        }
      : {}),
  })
}
