// Input: Message arrays from query loop.
// Output: Collapsed message views, span identification, local summaries.
// Pos: Core algorithm for contextCollapse — called by index.ts.

import type { Message } from '../../types/message.js'

/** 可折叠的消息段 */
export interface CollapseSpan {
  startIdx: number
  endIdx: number
  startUuid: string
  endUuid: string
  messageCount: number
  tokenEstimate: number
  risk: number           // 0~1, 越低越安全折叠
  summary: string
}

/** 已提交的折叠记录 */
export interface CommittedCollapse {
  collapseId: string
  span: CollapseSpan
  archivedUuids: string[]      // 被归档的消息 UUID
  summaryPlaceholder: Message  // 替代原始消息的摘要占位符
}

// 模块状态
const committedCollapses: CommittedCollapse[] = []
let collapseIdCounter = 0

export function getCommittedCollapses(): readonly CommittedCollapse[] {
  return committedCollapses
}

export function resetCollapseState(): void {
  committedCollapses.length = 0
  collapseIdCounter = 0
}

/**
 * 估算单条消息的 token 数（纯本地，不调 API）。
 * 粗略估算：英文约 4 chars/token，中文约 2 chars/token。
 * 取保守值 3 chars/token（偏高估，宁可早折叠）。
 * base64 图片数据使用 6 chars/token（base64 编码膨胀 33%，API 有专门的图片 token 计算）。
 */
export function estimateTokens(message: Message): number {
  const content = message.message?.content
  if (!content) return 0

  // 对数组内容逐块估算，区分 image/base64 数据
  if (Array.isArray(content)) {
    let total = 0
    for (const block of content) {
      const b = block as Record<string, unknown>
      if (b.type === 'image' && b.source && typeof (b.source as any).data === 'string') {
        // base64 图片块：用更宽松的系数
        total += Math.ceil(((b.source as any).data as string).length / 6)
      } else {
        total += Math.ceil(JSON.stringify(b).length / 3)
      }
    }
    return total
  }

  const text = JSON.stringify(content)
  // 检测内联 base64 data URL
  if (text.includes('data:image/') && text.includes(';base64,')) {
    // 分离 base64 段和普通文本分别估算
    const base64Matches = text.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/g) || []
    let base64Chars = 0
    for (const m of base64Matches) {
      base64Chars += m.length
    }
    const nonBase64Chars = text.length - base64Chars
    return Math.ceil(nonBase64Chars / 3) + Math.ceil(base64Chars / 6)
  }

  return Math.ceil(text.length / 3)
}

/**
 * 估算消息数组的总 token 数。
 */
export function estimateTotalTokens(messages: readonly Message[]): number {
  let total = 0
  for (const m of messages) total += estimateTokens(m)
  return total
}

/**
 * 扫描消息数组，识别可折叠的 span。
 * 从头部（最旧）向尾部（最新）扫描。
 *
 * 可折叠条件：
 * - 距当前 ≥ activeTurns 轮（活跃窗口保护）
 * - 已完成的工具调用对
 * - 纯信息性对话轮次
 *
 * 不可折叠：
 * - 最近 activeTurns 轮
 * - 包含未完成工具调用
 * - 系统指令/权限变更
 * - 文件编辑操作（路径和 diff 上下文可能仍被需要）
 */
export function identifyCollapsibleSpans(
  messages: readonly Message[],
  activeTurns: number = 5,
  minSpanSize: number = 4,
): CollapseSpan[] {
  if (messages.length <= activeTurns * 2) return []

  const safeEndIdx = messages.length - activeTurns * 2 // 保护最近 N 轮
  if (safeEndIdx <= 0) return []

  const spans: CollapseSpan[] = []
  let spanStart = -1
  let spanTokens = 0
  let spanRisk = 0
  let spanMsgCount = 0

  for (let i = 0; i < safeEndIdx; i++) {
    const msg = messages[i]
    const risk = assessMessageRisk(msg)

    if (risk >= 0.9) {
      // 高风险消息：结束当前 span（如果有），跳过
      if (spanStart >= 0 && spanMsgCount >= minSpanSize) {
        spans.push(buildSpan(messages, spanStart, i - 1, spanTokens, spanRisk / spanMsgCount))
      }
      spanStart = -1
      spanTokens = 0
      spanRisk = 0
      spanMsgCount = 0
      continue
    }

    if (spanStart < 0) {
      spanStart = i
      spanTokens = 0
      spanRisk = 0
      spanMsgCount = 0
    }

    spanTokens += estimateTokens(msg)
    spanRisk += risk
    spanMsgCount++

    // 每 15 条消息切一个 span（避免单个 span 过大）
    if (spanMsgCount >= 15) {
      spans.push(buildSpan(messages, spanStart, i, spanTokens, spanRisk / spanMsgCount))
      spanStart = -1
      spanTokens = 0
      spanRisk = 0
      spanMsgCount = 0
    }
  }

  // 末尾残余 span
  if (spanStart >= 0 && spanMsgCount >= minSpanSize) {
    spans.push(buildSpan(messages, spanStart, safeEndIdx - 1, spanTokens, spanRisk / spanMsgCount))
  }

  return spans.sort((a, b) => a.risk - b.risk) // 低风险优先
}

function buildSpan(
  messages: readonly Message[],
  startIdx: number,
  endIdx: number,
  tokenEstimate: number,
  avgRisk: number,
): CollapseSpan {
  const spanMessages = messages.slice(startIdx, endIdx + 1)
  return {
    startIdx,
    endIdx,
    startUuid: messages[startIdx].uuid as string,
    endUuid: messages[endIdx].uuid as string,
    messageCount: endIdx - startIdx + 1,
    tokenEstimate,
    risk: avgRisk,
    summary: generateLocalSummary(spanMessages),
  }
}

/**
 * 评估单条消息的折叠风险（0~1）。
 * 0 = 非常安全折叠，1 = 绝对不能折叠。
 */
function assessMessageRisk(msg: Message): number {
  // 系统消息不折叠
  if (msg.type === 'system') return 1.0

  // 压缩摘要不折叠
  if (msg.isCompactSummary) return 1.0

  const content = msg.message?.content
  if (!content) return 0.1

  // 检查是否包含工具操作
  if (Array.isArray(content)) {
    for (const block of content) {
      const b = block as Record<string, unknown>
      if (b.type === 'tool_use') {
        const name = (b.name as string) || ''
        // 文件编辑工具的结果可能仍被后续需要
        if (['Edit', 'Write', 'NotebookEdit'].includes(name)) return 0.8
        // 搜索工具结果价值较低，可安全折叠
        if (['Grep', 'Glob', 'Read'].includes(name)) return 0.2
        // Bash 命令中等风险
        if (name === 'Bash') return 0.4
        // Agent 调用中等风险
        if (name === 'Agent') return 0.5
      }
      // tool_result 块：检查关联的 tool_use 名称以区分风险
      if (b.type === 'tool_result') {
        const toolUseId = b.tool_use_id as string | undefined
        if (toolUseId) {
          // 在同一消息的其他块或前序 content 块中查找对应的 tool_use
          const toolName = findToolNameForResult(msg, toolUseId)
          if (toolName && ['Edit', 'Write', 'FileEdit', 'FileWrite', 'NotebookEdit'].includes(toolName)) {
            return 0.7 // 文件变更的结果包含重要上下文（diff、路径）
          }
        }
        return 0.3
      }
    }
  }

  // 纯文本消息：短消息（问候/确认）低风险
  const textContent = typeof content === 'string' ? content : JSON.stringify(content)
  if (textContent.length < 200) return 0.2
  if (textContent.length < 500) return 0.3

  return 0.5
}

/**
 * 在消息的 content 块中查找 tool_use_id 对应的工具名称。
 * tool_result 和 tool_use 块可能出现在同一 content 数组中，
 * 也可能在相邻消息中——此函数仅查找同消息内的 tool_use 块。
 */
function findToolNameForResult(msg: Message, toolUseId: string): string | null {
  const content = msg.message?.content
  if (!Array.isArray(content)) return null
  for (const block of content) {
    const b = block as Record<string, unknown>
    if (b.type === 'tool_use' && b.id === toolUseId && typeof b.name === 'string') {
      return b.name
    }
  }
  return null
}

/**
 * 纯本地模板化摘要生成。不调用 API。
 * 压缩比约 20:1~40:1。
 */
export function generateLocalSummary(messages: readonly Message[]): string {
  const parts: string[] = []

  for (const msg of messages) {
    const content = msg.message?.content
    if (!content) continue

    if (msg.type === 'user') {
      const text = extractText(content)
      if (text) parts.push(`[user] ${truncate(text, 80)}`)
    }

    if (msg.type === 'assistant' && Array.isArray(content)) {
      for (const block of content) {
        const b = block as Record<string, unknown>
        if (b.type === 'tool_use') {
          const name = b.name as string || 'unknown'
          const input = b.input as Record<string, unknown> | undefined
          const paramSummary = input ? summarizeParams(input) : ''
          parts.push(`[${name}] ${paramSummary}`)
        }
        if (b.type === 'tool_result') {
          const isError = b.is_error as boolean
          const output = extractText(b.content)
          parts.push(`  ${isError ? '✗' : '✓'} ${truncate(output, 50)}`)
        }
        if (b.type === 'text') {
          const text = b.text as string
          if (text && text.length > 10) {
            parts.push(`[assistant] ${truncate(text, 60)}`)
          }
        }
      }
    }
  }

  return parts.join('\n')
}

export function extractText(content: unknown): string {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text || '')
      .join(' ')
  }
  return ''
}

function truncate(text: string, maxLen: number): string {
  const cleaned = text.replace(/\n+/g, ' ').trim()
  return cleaned.length > maxLen ? cleaned.slice(0, maxLen) + '…' : cleaned
}

function summarizeParams(input: Record<string, unknown>): string {
  const parts: string[] = []
  if (input.command) parts.push(truncate(String(input.command), 60))
  else if (input.file_path) parts.push(String(input.file_path))
  else if (input.pattern) parts.push(`/${input.pattern}/`)
  else if (input.query) parts.push(truncate(String(input.query), 60))
  else if (input.prompt) parts.push(truncate(String(input.prompt), 60))
  else if (input.url) parts.push(truncate(String(input.url), 60))
  else {
    const keys = Object.keys(input).slice(0, 3)
    parts.push(keys.join(', '))
  }
  return parts.join(' ')
}

/**
 * 提交折叠：将 span 中的消息归档，替换为摘要占位符。
 * 返回新的消息数组。
 */
export function commitCollapse(
  messages: Message[],
  span: CollapseSpan,
): { messages: Message[]; collapse: CommittedCollapse } {
  const collapseId = `cc-${String(++collapseIdCounter).padStart(4, '0')}`

  const summaryPlaceholder: Message = {
    type: 'system' as const,
    uuid: `collapse-${collapseId}` as any,
    isMeta: true,
    message: {
      role: 'system',
      content: [
        {
          type: 'text' as const,
          text: `<collapsed id="${collapseId}" messages="${span.messageCount}" tokens="~${span.tokenEstimate}">\n${span.summary}\n</collapsed>`,
        } as any,
      ],
    },
  }

  const archivedUuids = messages
    .slice(span.startIdx, span.endIdx + 1)
    .map(m => m.uuid as string)

  const collapse: CommittedCollapse = {
    collapseId,
    span,
    archivedUuids,
    summaryPlaceholder,
  }

  committedCollapses.push(collapse)

  // 构建新消息数组：替换 span 为摘要
  const newMessages = [
    ...messages.slice(0, span.startIdx),
    summaryPlaceholder,
    ...messages.slice(span.endIdx + 1),
  ]

  return { messages: newMessages, collapse }
}

/**
 * projectView — 读时投影。
 * 对已有的 committed collapses 应用视图变换。
 * 不修改原数组。
 */
export const projectView: (messages: Message[]) => Message[] = (messages) => {
  if (committedCollapses.length === 0) return messages

  const archivedSet = new Set<string>()
  const placeholderMap = new Map<string, Message>()

  for (const cc of committedCollapses) {
    for (const uuid of cc.archivedUuids) {
      archivedSet.add(uuid)
    }
    // 将占位符关联到第一个被归档的 UUID
    if (cc.archivedUuids.length > 0) {
      placeholderMap.set(cc.archivedUuids[0], cc.summaryPlaceholder)
    }
  }

  const result: Message[] = []
  for (const msg of messages) {
    const uuid = msg.uuid as string
    if (archivedSet.has(uuid)) {
      // 如果是 span 的第一条消息，插入占位符
      const placeholder = placeholderMap.get(uuid)
      if (placeholder) {
        result.push(placeholder)
      }
      // 否则跳过（已被折叠）
      continue
    }
    result.push(msg)
  }

  return result
}
