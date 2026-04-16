/**
 * Input:  messagesForAPI (UserMessage | AssistantMessage)[], allTools (BetaToolUnion[])
 * Output: 稳定化后的消息数组和工具数组，消除 resume/MCP/插件导致的缓存失效
 * Pos:    claude.ts queryModel() 流水线中，normalizeMessagesForAPI 之后、addCacheBreakpoints 之前
 *
 * 修复开源发现的缓存 Bug：
 *   Bug 3 — Resume 附件块漂移：normalizeResumeMessages()
 *   Bug 5 — 工具定义顺序不确定：stabilizeToolOrder()
 *   附加  — 旧图片 base64 累积：stripOldToolResultImages()
 *   G-Beta-1 — deferred-tools 块独立排序 + SHA256 pin
 *   G-Beta-2 — /clear 残留 <local-command-*> 块清理
 *
 * 参考: https://github.com/cnighswonger/claude-code-cache-fix (v1.11.0)
 * 我们在源码层面直接修复，无需外部 preload 猴子补丁。
 */

import type { BetaToolUnion } from '@anthropic-ai/sdk/resources/beta/messages/messages.mjs'
import { createHash } from 'crypto'
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

// ─── Helper: sort deferred-tools block + SHA256 pin (Gap G-Beta-1) ───
// MCP runtime registers tools asynchronously, so `<deferred-tools>` block
// ordering drifts across turns and busts the cache prefix. We sort the
// `<tool>` entries stably by name, then record a SHA256 fingerprint in a
// module-scope Map keyed by block-type for later dump-prompts diffing.
// The fingerprint store is READ-ONLY w.r.t. cache_control decisions —
// addCacheBreakpoints never consults it.

const _deferredToolsFingerprints = new Map<
  string,
  { hash: string; sampledAt: number }
>()

/** debug-only accessor; not exported publicly for runtime consumers */
export function _getDeferredToolsFingerprint(
  key: string = 'default',
): { hash: string; sampledAt: number } | undefined {
  return _deferredToolsFingerprints.get(key)
}

function sortDeferredToolsBlock(text: string): string {
  // Format (see src/utils/messages.ts:4228):
  //   <system-reminder>
  //   The following deferred tools are now available via ToolSearch[...]:
  //   <toolName1>
  //   <toolName2>
  //   ...
  //   </system-reminder>
  // Tool names are plain identifier lines (no list prefix).
  const lines = text.split('\n')
  // Locate the header line that introduces the tool list
  let headerIdx = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i]!.includes('deferred tools are now available')) {
      headerIdx = i
      break
    }
  }
  if (headerIdx < 0) return text

  // Collect identifier-looking lines immediately after the header, stopping
  // at blank line, `</system-reminder>`, or any non-identifier content
  // (e.g. the "no longer available" sub-block that comes after a blank).
  const identRe = /^[A-Za-z_][A-Za-z0-9_-]*$/
  let start = headerIdx + 1
  let end = start
  while (end < lines.length) {
    const raw = lines[end]!
    const trimmed = raw.trim()
    if (trimmed === '' || !identRe.test(trimmed)) break
    end++
  }
  if (end <= start + 1) {
    // 0 or 1 tool — nothing to reorder, but still pin the fingerprint
    _recordDeferredToolsFingerprint(text)
    return text
  }

  const toolLines = lines.slice(start, end)
  // Stable sort by raw text (identifiers only, no locale quirks)
  const sorted = [...toolLines].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
  // Short-circuit if already sorted (preserves byte-identical output)
  let alreadySorted = true
  for (let i = 0; i < toolLines.length; i++) {
    if (toolLines[i] !== sorted[i]) {
      alreadySorted = false
      break
    }
  }
  const rebuilt = alreadySorted
    ? text
    : [...lines.slice(0, start), ...sorted, ...lines.slice(end)].join('\n')

  _recordDeferredToolsFingerprint(rebuilt)
  return rebuilt
}

function _recordDeferredToolsFingerprint(text: string): void {
  const hash = createHash('sha256').update(text).digest('hex')
  const key = 'default'
  const prev = _deferredToolsFingerprints.get(key)
  if (prev?.hash !== hash) {
    _deferredToolsFingerprints.set(key, { hash, sampledAt: Date.now() })
    logForDebugging(
      `[cache-stabilize] deferred-tools fingerprint: ${hash.slice(0, 16)}… (${prev ? 'changed' : 'initial'})`,
    )
  }
}

// ─── Helper: strip /clear residue blocks (Gap G-Beta-2) ──────────────
// After `/clear`, the harness leaves `<local-command-*>` artifact blocks
// in messages[0], which poisons the cache prefix compared to a genuinely
// fresh session. Upstream bug (anthropics/claude-code#47756).
// We strip stdout/stderr/message/name/args pairs; caveat tags remain as
// they carry user-visible context that the model legitimately references.

const LOCAL_COMMAND_RESIDUE_RE =
  /<local-command-(stdout|stderr|message|name|args)>[\s\S]*?<\/local-command-\1>/gi

function stripLocalCommandBlocks(text: string): string {
  return text.replace(LOCAL_COMMAND_RESIDUE_RE, '')
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

  // ── Gap G-Beta-2: strip /clear residue from every user text block ──
  // Runs unconditionally so that sessions with no relocatable blocks
  // still benefit. Mutates block.text in place, drops now-empty text
  // blocks, preserves byte-identical output when nothing matches.
  let clearArtifactsStripped = 0
  for (const msg of messages) {
    if (msg.type !== 'user') continue
    const content = msg.message?.content
    if (!Array.isArray(content)) continue
    for (let j = content.length - 1; j >= 0; j--) {
      const block = content[j]
      if (!block || block.type !== 'text' || !('text' in block)) continue
      const cleaned = stripLocalCommandBlocks(block.text)
      if (cleaned === block.text) continue
      clearArtifactsStripped++
      if (cleaned.trim() === '') {
        content.splice(j, 1)
      } else {
        ;(block as { text: string }).text = cleaned
      }
    }
  }
  if (clearArtifactsStripped > 0) {
    logForDebugging(
      `[cache-stabilize] stripped /clear residue from ${clearArtifactsStripped} text block(s)`,
    )
  }

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
        if (kind === 'deferred') text = sortDeferredToolsBlock(text)
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

// ─── Endless Mode: compressOldToolResultText ─────────────────────────
// 对齐 claude-mem Endless Mode：旧 tool_result 文本压缩为摘要占位符，
// 让长会话的 context 从 O(N²) 降为 O(N)。
// keepLast 默认 5，控制保留最近 N 条原始内容。
// minSize 默认 1500 字符，小于此值的不压缩（节省小，破坏 cache 不值）。
const TEXT_COMPRESSION_PLACEHOLDER_FN = (id: string, originalSize: number) =>
  `[历史 tool_result 已压缩 — ${originalSize} chars elided. id=${id}. 如需查看请重新执行工具]`

/**
 * Compresses old tool_result text content to prevent O(N²) context growth.
 * Mirrors stripOldToolResultImages but for text blocks. Replaces large old
 * tool_result text with a short placeholder that includes the tool_use_id
 * for traceability.
 *
 * @param messages - Message array (mutated in place)
 * @param keepLast - Number of recent user messages to preserve uncompressed
 * @param minSize - Minimum text size (chars) to trigger compression
 */
export function compressOldToolResultText(
  messages: (UserMessage | AssistantMessage)[],
  keepLast: number,
  minSize: number = 1500,
): { compressedCount: number; estimatedTokensSaved: number } {
  if (keepLast <= 0) return { compressedCount: 0, estimatedTokensSaved: 0 }

  const userIndices: number[] = []
  for (let i = 0; i < messages.length; i++) {
    if (messages[i]!.type === 'user') userIndices.push(i)
  }
  const cutoffIdx =
    userIndices.length > keepLast
      ? userIndices[userIndices.length - keepLast]!
      : 0

  let compressedCount = 0
  let estimatedBytes = 0

  for (let i = 0; i < cutoffIdx; i++) {
    const msg = messages[i]!
    if (msg.type !== 'user') continue
    const content = msg.message?.content
    if (!Array.isArray(content)) continue

    for (const block of content) {
      if (block.type !== 'tool_result') continue
      const toolUseId = (block as any).tool_use_id || 'unknown'
      const resultContent = (block as any).content

      // Case 1: content is a string (legacy/simple path)
      if (typeof resultContent === 'string') {
        const len = resultContent.length
        if (len >= minSize) {
          ;(block as any).content = TEXT_COMPRESSION_PLACEHOLDER_FN(
            toolUseId,
            len,
          )
          estimatedBytes += len
          compressedCount++
        }
        continue
      }

      // Case 2: content is array of blocks
      if (Array.isArray(resultContent)) {
        for (let k = 0; k < resultContent.length; k++) {
          const item = resultContent[k]
          if (item && item.type === 'text' && typeof item.text === 'string') {
            const len = item.text.length
            if (len >= minSize) {
              resultContent[k] = {
                type: 'text',
                text: TEXT_COMPRESSION_PLACEHOLDER_FN(toolUseId, len),
              }
              estimatedBytes += len
              compressedCount++
            }
          }
        }
      }
    }
  }

  // ~3 chars per token for mixed CJK/ASCII content
  const estimatedTokensSaved = Math.round(estimatedBytes / 3)
  if (compressedCount > 0) {
    logForDebugging(
      `[cache-stabilize] compressOldToolResultText: compressed ${compressedCount} blocks, ~${estimatedTokensSaved} tokens saved`,
    )
  }

  return { compressedCount, estimatedTokensSaved }
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
