// Input: 会话消息历史（从 stopHookContext）
// Output: 五维度结构化摘要 Markdown 文件
// Pos: stopHooks 管线中，extractMemories 之后，fire-and-forget
//
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"

import { join } from 'path'
import { mkdir, writeFile } from 'fs/promises'
import { getAutoMemPath, isAutoMemoryEnabled } from '../../memdir/paths.js'
import { getIsRemoteMode, getSessionId } from '../../bootstrap/state.js'
import {
  createCacheSafeParams,
  runForkedAgent,
} from '../../utils/forkedAgent.js'
import { createAutoMemCanUseTool } from '../extractMemories/extractMemories.js'
import { createUserMessage } from '../../utils/messages.js'
import { logForDebugging } from '../../utils/debug.js'
import { logEvent } from '../analytics/index.js'
import type { REPLHookContext } from '../../utils/hooks/postSamplingHooks.js'
import type { Message, AssistantMessage } from '../../types/message.js'

// ============================================================================
// Types
// ============================================================================

export interface SessionSummary {
  timestamp: string           // ISO 8601 +08:00
  sessionId: string
  duration: string            // 会话时长
  request: string             // 用户的核心请求/目标
  investigated: string[]      // 调查了什么（文件/URL/命令）
  learned: string[]           // 学到了什么（关键发现）
  completed: string[]         // 完成了什么（具体产出）
  next_steps: string[]        // 建议的下一步
}

// ============================================================================
// Helpers
// ============================================================================

function countModelVisibleMessages(messages: Message[]): number {
  return messages.filter(m => m.type === 'user' || m.type === 'assistant').length
}

function formatTimestamp(): string {
  const now = new Date()
  // Format as ISO 8601 with +08:00 offset
  const pad = (n: number) => String(n).padStart(2, '0')
  const y = now.getFullYear()
  const mo = pad(now.getMonth() + 1)
  const d = pad(now.getDate())
  const h = pad(now.getHours())
  const mi = pad(now.getMinutes())
  const s = pad(now.getSeconds())
  return `${y}-${mo}-${d}T${h}:${mi}:${s}+08:00`
}

function formatDateForFilename(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const y = now.getFullYear()
  const mo = pad(now.getMonth() + 1)
  const d = pad(now.getDate())
  const h = pad(now.getHours())
  const mi = pad(now.getMinutes())
  const s = pad(now.getSeconds())
  return `${y}-${mo}-${d}-${h}${mi}${s}`
}

function formatDateForTitle(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
}

// ============================================================================
// Prompt
// ============================================================================

function buildSummaryPrompt(messageCount: number): string {
  return `请根据本次会话的最近 ${messageCount} 条消息历史，生成结构化摘要。

输出格式（必须严格遵循，不要输出其他内容）：
## 请求
[用户的核心请求/目标，1-2 句话]

## 调查
- [调查了什么文件/URL/命令/概念]
- ...

## 发现
- [关键发现/学到的知识]
- ...

## 完成
- [完成了什么具体产出/代码变更/文件修改]
- ...

## 下一步
- [建议的后续行动]
- ...

规则：
- 每个维度 1-5 条，不要过于冗长
- 具体而非笼统（包含文件名/函数名/版本号等）
- 如果某个维度无内容，写"无"
- 只输出上述格式，不要输出任何解释或前言`
}

// ============================================================================
// Initialization & Execution
// ============================================================================

// Minimum messages to trigger summary generation
const MIN_MESSAGES_FOR_SUMMARY = 4

/** Guard against overlapping runs */
let inProgress = false

/**
 * Execute session summary generation.
 * Called fire-and-forget from stopHooks, after extractMemories and autoDream.
 */
export async function executeSessionSummary(
  context: REPLHookContext,
): Promise<void> {
  // Only run for main agent
  if (context.toolUseContext.agentId) {
    return
  }

  // Check auto-memory is enabled
  if (!isAutoMemoryEnabled()) {
    return
  }

  // Skip in remote mode
  if (getIsRemoteMode()) {
    return
  }

  // Guard against overlapping runs
  if (inProgress) {
    logForDebugging('[sessionSummary] already in progress, skipping')
    return
  }

  const { messages } = context
  const messageCount = countModelVisibleMessages(messages)

  // Not enough messages to summarize
  if (messageCount < MIN_MESSAGES_FOR_SUMMARY) {
    logForDebugging(
      `[sessionSummary] skipping — only ${messageCount} messages (min: ${MIN_MESSAGES_FOR_SUMMARY})`,
    )
    return
  }

  inProgress = true
  const startTime = Date.now()

  try {
    const memoryDir = getAutoMemPath()
    const workingDir = join(memoryDir, 'working')

    // Ensure working directory exists
    await mkdir(workingDir, { recursive: true })

    const canUseTool = createAutoMemCanUseTool(memoryDir)
    const cacheSafeParams = createCacheSafeParams(context)
    const userPrompt = buildSummaryPrompt(messageCount)

    logForDebugging(
      `[sessionSummary] starting — ${messageCount} messages`,
    )

    const result = await runForkedAgent({
      promptMessages: [createUserMessage({ content: userPrompt })],
      cacheSafeParams,
      canUseTool,
      querySource: 'extract_memories', // reuse existing query source
      forkLabel: 'session_summary',
      skipTranscript: true,
      maxTurns: 2, // summary should complete in 1 turn
      skipCacheWrite: true, // fire-and-forget, no future reads
    })

    // Extract the summary text from the agent's response
    const lastAssistant = result.messages
      .filter((m): m is AssistantMessage => m.type === 'assistant')
      .pop()

    if (!lastAssistant) {
      logForDebugging('[sessionSummary] no assistant response')
      return
    }

    const content = lastAssistant.message.content
    let summaryText = ''
    if (typeof content === 'string') {
      summaryText = content
    } else if (Array.isArray(content)) {
      summaryText = content
        .filter((b: any) => b.type === 'text')
        .map((b: any) => b.text)
        .join('\n')
    }

    if (!summaryText.trim()) {
      logForDebugging('[sessionSummary] empty summary response')
      return
    }

    // Calculate session duration
    const durationMs = Date.now() - startTime
    const sessionId = getSessionId()
    const timestamp = formatTimestamp()
    const dateForFile = formatDateForFilename()
    const dateForTitle = formatDateForTitle()

    // Build the markdown file
    const markdown = `---
type: session-summary
created: ${timestamp}
session: ${sessionId}
messages: ${messageCount}
---

# 会话摘要 — ${dateForTitle}

${summaryText.trim()}
`

    // Write to file
    const filePath = join(workingDir, `session-summary-${dateForFile}.md`)
    await writeFile(filePath, markdown, 'utf-8')

    logForDebugging(
      `[sessionSummary] saved to ${filePath} (${durationMs}ms)`,
    )

    logEvent('tengu_session_summary_saved', {
      message_count: messageCount,
      duration_ms: durationMs,
      input_tokens: result.totalUsage.input_tokens,
      output_tokens: result.totalUsage.output_tokens,
      cache_read_input_tokens: result.totalUsage.cache_read_input_tokens,
    })
  } catch (error) {
    logForDebugging(`[sessionSummary] error: ${error}`)
    logEvent('tengu_session_summary_error', {
      duration_ms: Date.now() - startTime,
    })
  } finally {
    inProgress = false
  }
}
