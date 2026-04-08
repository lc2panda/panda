/**
 * Input:  messagesForAPI (UserMessage | AssistantMessage)[], allTools (BetaToolUnion[])
 * Output: 稳定化后的消息数组和工具数组，消除 resume/MCP/插件导致的缓存失效
 * Pos:    claude.ts queryModel() 流水线中，normalizeMessagesForAPI 之后、addCacheBreakpoints 之前
 *
 * 修复开源发现的缓存 Bug：
 *   Bug 3 — Resume 附件块漂移：normalizeResumeMessages()
 *   Bug 5 — 工具定义顺序不确定：stabilizeToolOrder()
 *   附加  — 旧图片 base64 累积：stripOldToolResultImages()
 *
 * 参考: https://github.com/cnighswonger/claude-code-cache-fix (v1.2.0)
 * 我们在源码层面直接修复，无需外部 preload 猴子补丁。
 */

import type { BetaToolUnion } from '@anthropic-ai/sdk/resources/beta/messages/messages.mjs'
import type {
  AssistantMessage,
  UserMessage,
} from '../../types/message.js'
import { logForDebugging } from '../../utils/debug.js'

// ─── Block classification helpers ────────────────────────────────────

function isSystemReminderText(text: string): boolean {
  const t = text.trimStart()
  return t.startsWith('<system-reminder>') || t.startsWith('<system-reminder\n')
}

/** Hooks output block — contains "hook success" or "hook failure" near the start */
function isHooksBlock(text: string): boolean {
  const head = text.slice(0, 300).toLowerCase()
  return (
    isSystemReminderText(text) &&
    (head.includes('hook success') ||
      head.includes('hook failure') ||
      head.includes('user-prompt-submit-hook'))
  )
}

/** Skills listing block */
function isSkillsBlock(text: string): boolean {
  return (
    isSystemReminderText(text) &&
    text.includes('The following skills are available')
  )
}

/** Deferred tools listing block */
function isDeferredToolsBlock(text: string): boolean {
  return (
    isSystemReminderText(text) &&
    (text.includes('deferred tools are now available') ||
      text.includes('available via ToolSearch'))
  )
}

/** MCP server instruction block */
function isMcpBlock(text: string): boolean {
  return (
    isSystemReminderText(text) &&
    (text.includes('MCP server') ||
      text.includes('mcp_instructions') ||
      text.includes('mcp-server'))
  )
}

type RelocatableType = 'hooks' | 'skills' | 'deferred' | 'mcp'

function classifyRelocatable(text: string): RelocatableType | null {
  if (isDeferredToolsBlock(text)) return 'deferred'
  if (isMcpBlock(text)) return 'mcp'
  if (isSkillsBlock(text)) return 'skills'
  if (isHooksBlock(text)) return 'hooks'
  return null
}

/** Fixed insertion order so the cache prefix is deterministic across sessions */
const RELOCATABLE_ORDER: RelocatableType[] = [
  'deferred',
  'mcp',
  'skills',
  'hooks',
]

// ─── Helper: strip <session_knowledge> from hooks ────────────────────

function stripSessionKnowledge(text: string): string {
  return text.replace(
    /<session_knowledge>[\s\S]*?<\/session_knowledge>/g,
    '',
  )
}

// ─── Helper: sort skills lines for determinism ───────────────────────

function sortSkillsBlock(text: string): string {
  // Skills blocks contain lines like "- skill_name — description"
  const lines = text.split('\n')
  const prefix: string[] = []
  const skills: string[] = []
  const suffix: string[] = []

  let inSkills = false
  for (const line of lines) {
    if (!inSkills && line.trimStart().startsWith('- ')) {
      inSkills = true
    }
    if (inSkills) {
      if (line.trimStart().startsWith('- ') || line.trim() === '') {
        skills.push(line)
      } else {
        inSkills = false
        suffix.push(line)
      }
    } else if (suffix.length === 0) {
      prefix.push(line)
    } else {
      suffix.push(line)
    }
  }

  skills.sort((a, b) => a.localeCompare(b))
  return [...prefix, ...skills, ...suffix].join('\n')
}

// ─── Bug 3: normalizeResumeMessages ──────────────────────────────────

/**
 * Scans all user messages for relocatable system-reminder blocks
 * (hooks, skills, deferred-tools, MCP instructions) that have drifted
 * from messages[0] during resume. Collects the LATEST version of each
 * type, removes them from their original positions, and re-inserts them
 * into the first user message in a fixed order.
 *
 * This ensures the message prefix is byte-identical across sessions,
 * keeping the server-side prompt cache alive.
 */
export function normalizeResumeMessages(
  messages: (UserMessage | AssistantMessage)[],
): void {
  // Find first user message index
  const firstUserIdx = messages.findIndex(m => m.type === 'user')
  if (firstUserIdx < 0) return

  // Collect latest version of each relocatable block type (reverse scan)
  const latest = new Map<RelocatableType, { text: string }>()

  // Scan ALL user messages (including first) to collect relocatables
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]!
    if (msg.type !== 'user') continue
    const content = msg.message?.content
    if (!Array.isArray(content)) continue

    for (const block of content) {
      if (block.type !== 'text' || !('text' in block)) continue
      const kind = classifyRelocatable(block.text)
      if (kind && !latest.has(kind)) {
        let text = block.text
        if (kind === 'hooks') text = stripSessionKnowledge(text)
        if (kind === 'skills') text = sortSkillsBlock(text)
        latest.set(kind, { text })
      }
    }
  }

  if (latest.size === 0) return

  // Remove ALL relocatable blocks from ALL user messages
  let removedCount = 0
  for (const msg of messages) {
    if (msg.type !== 'user') continue
    const content = msg.message?.content
    if (!Array.isArray(content)) continue

    for (let j = content.length - 1; j >= 0; j--) {
      const block = content[j]
      if (
        block &&
        block.type === 'text' &&
        'text' in block &&
        classifyRelocatable(block.text) !== null
      ) {
        content.splice(j, 1)
        removedCount++
      }
    }
  }

  // Build ordered blocks to insert
  const blocksToInsert: { type: 'text'; text: string }[] = []
  for (const kind of RELOCATABLE_ORDER) {
    const entry = latest.get(kind)
    if (entry) {
      // Strip cache_control from relocated blocks — it will be re-applied
      // by addCacheBreakpoints at the correct position
      blocksToInsert.push({ type: 'text', text: entry.text })
    }
  }

  // Insert into first user message's content at the beginning
  const firstMsg = messages[firstUserIdx]!
  if (typeof firstMsg.message?.content === 'string') {
    firstMsg.message.content = [
      ...blocksToInsert,
      { type: 'text', text: firstMsg.message.content },
    ]
  } else if (Array.isArray(firstMsg.message?.content)) {
    firstMsg.message.content = [
      ...blocksToInsert,
      ...firstMsg.message.content,
    ]
  }

  if (removedCount > 0 || blocksToInsert.length > 0) {
    logForDebugging(
      `[cache-stabilize] normalizeResumeMessages: relocated ${blocksToInsert.length} block types, removed ${removedCount} scattered blocks`,
    )
  }
}

// ─── Bug 5: stabilizeToolOrder ───────────────────────────────────────

/**
 * Sorts tool definitions by name for deterministic ordering.
 * Different turn/resume can produce tools in different order,
 * changing the request bytes and busting the cache key.
 *
 * Mutates the array in place and returns it.
 */
export function stabilizeToolOrder(tools: BetaToolUnion[]): BetaToolUnion[] {
  tools.sort((a, b) => {
    const nameA = 'name' in a ? (a.name ?? '') : ''
    const nameB = 'name' in b ? (b.name ?? '') : ''
    return nameA.localeCompare(nameB)
  })
  return tools
}

// ─── 附加: stripOldToolResultImages ──────────────────────────────────

const IMAGE_PLACEHOLDER = '[image stripped from history — file may still be on disk]'

/**
 * Strips base64 image blocks from old tool_result content to prevent
 * token waste from re-sending images every turn. Only processes
 * tool_result blocks (not user-pasted images).
 *
 * @param messages - The message array to process (mutated in place)
 * @param keepLast - Number of recent user messages to preserve images for.
 *                   Controlled by env CACHE_FIX_IMAGE_KEEP_LAST. Default: 0 (disabled).
 */
export function stripOldToolResultImages(
  messages: (UserMessage | AssistantMessage)[],
  keepLast: number,
): { strippedCount: number; estimatedTokensSaved: number } {
  if (keepLast <= 0) return { strippedCount: 0, estimatedTokensSaved: 0 }

  // Collect user message indices
  const userIndices: number[] = []
  for (let i = 0; i < messages.length; i++) {
    if (messages[i]!.type === 'user') userIndices.push(i)
  }

  // Calculate cutoff: preserve last N user messages
  const cutoffIdx =
    userIndices.length > keepLast
      ? userIndices[userIndices.length - keepLast]!
      : 0

  let strippedCount = 0
  let estimatedBytes = 0

  for (let i = 0; i < cutoffIdx; i++) {
    const msg = messages[i]!
    if (msg.type !== 'user') continue
    const content = msg.message?.content
    if (!Array.isArray(content)) continue

    for (const block of content) {
      if (block.type !== 'tool_result' || !Array.isArray((block as any).content))
        continue

      const resultContent = (block as any).content as any[]
      for (let k = 0; k < resultContent.length; k++) {
        const item = resultContent[k]
        if (item && item.type === 'image') {
          // Estimate base64 size for token savings calculation
          if (item.source?.data) {
            estimatedBytes += (item.source.data as string).length
          }
          resultContent[k] = { type: 'text', text: IMAGE_PLACEHOLDER }
          strippedCount++
        }
      }
    }
  }

  const estimatedTokensSaved = Math.round(estimatedBytes * 0.125)
  if (strippedCount > 0) {
    logForDebugging(
      `[cache-stabilize] stripOldToolResultImages: stripped ${strippedCount} images, ~${estimatedTokensSaved} tokens saved`,
    )
  }

  return { strippedCount, estimatedTokensSaved }
}
