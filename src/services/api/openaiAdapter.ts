/**
 * OpenAI Provider Adapter for Panda
 *
 * Converts between Anthropic Messages API and OpenAI Chat Completions API formats.
 * Enables using OpenAI models (GPT-4o, o3, o4-mini, Codex) natively in panda
 * via `panda auth login` → OpenAI option.
 *
 * Architecture:
 *   panda core (Anthropic format) → openaiAdapter → OpenAI Chat Completions API
 *   OpenAI response → openaiAdapter → Anthropic format → panda core
 */

// ============ Type Definitions ============

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | OpenAIContentPart[] | null
  tool_calls?: OpenAIToolCall[]
  tool_call_id?: string
  name?: string
}

interface OpenAIContentPart {
  type: 'text' | 'image_url'
  text?: string
  image_url?: { url: string; detail?: string }
}

interface OpenAIToolCall {
  id: string
  type: 'function'
  function: { name: string; arguments: string }
}

interface OpenAITool {
  type: 'function'
  function: {
    name: string
    description?: string
    parameters?: Record<string, unknown>
  }
}

interface OpenAIChatCompletionRequest {
  model: string
  messages: OpenAIMessage[]
  tools?: OpenAITool[]
  tool_choice?: 'auto' | 'none' | 'required' | { type: 'function'; function: { name: string } }
  stream?: boolean
  stream_options?: { include_usage?: boolean }
  max_tokens?: number
  temperature?: number
  top_p?: number
  stop?: string[]
}

// ============ Model Mapping ============

const OPENAI_MODELS: Record<string, string> = {
  // Direct OpenAI model names
  'gpt-4o': 'gpt-4o',
  'gpt-4o-mini': 'gpt-4o-mini',
  'gpt-4.1': 'gpt-4.1',
  'gpt-4.1-mini': 'gpt-4.1-mini',
  'gpt-4.1-nano': 'gpt-4.1-nano',
  'o3': 'o3',
  'o3-mini': 'o3-mini',
  'o4-mini': 'o4-mini',
  'codex-mini': 'codex-mini-latest',
  // Fallback mappings when user hasn't changed model from Claude default
  'claude-sonnet-4-20250514': 'gpt-4o',
  'claude-3-5-sonnet-20241022': 'gpt-4o',
  'claude-3-5-haiku-20241022': 'gpt-4o-mini',
}

export function mapModelToOpenAI(model: string): string {
  return OPENAI_MODELS[model] || model
}

export function getAvailableOpenAIModels(): string[] {
  return [
    'gpt-4o', 'gpt-4o-mini',
    'gpt-4.1', 'gpt-4.1-mini', 'gpt-4.1-nano',
    'o3', 'o3-mini', 'o4-mini',
    'codex-mini',
  ]
}

export function isOpenAIModel(model: string): boolean {
  return /^(gpt-|o[34]-|o[34]$|codex)/.test(model)
}

// ============ Provider Detection ============

/**
 * Check if current provider is OpenAI.
 * Set via `panda auth login` → OpenAI option, which writes to global config
 * and sets PANDA_PROVIDER=openai + OPENAI_API_KEY.
 */
export function isOpenAIProvider(): boolean {
  return process.env.PANDA_PROVIDER === 'openai' && !!process.env.OPENAI_API_KEY
}

// ============ Anthropic → OpenAI Request Conversion ============

export function convertAnthropicToOpenAI(params: {
  model: string
  system?: string | Array<{ type: string; text: string; cache_control?: unknown }>
  messages: Array<{ role: string; content: any }>
  tools?: Array<{ name: string; description?: string; input_schema?: Record<string, unknown> }>
  max_tokens?: number
  temperature?: number
  top_p?: number
  stream?: boolean
  stop_sequences?: string[]
  [key: string]: any
}): OpenAIChatCompletionRequest {
  const openaiMessages: OpenAIMessage[] = []

  // System prompt — strip cache_control
  if (params.system) {
    const systemText =
      typeof params.system === 'string'
        ? params.system
        : params.system.map((b) => b.text).join('\n')
    openaiMessages.push({ role: 'system', content: systemText })
  }

  // Convert messages
  for (const msg of params.messages) {
    if (msg.role === 'user') {
      if (Array.isArray(msg.content)) {
        // Anthropic puts tool_result blocks inside user messages
        const toolResults = msg.content.filter((b: any) => b.type === 'tool_result')
        const otherBlocks = msg.content.filter((b: any) => b.type !== 'tool_result')

        // Tool results → OpenAI tool role messages
        for (const tr of toolResults) {
          openaiMessages.push({
            role: 'tool',
            tool_call_id: tr.tool_use_id,
            content: extractTextContent(tr.content),
          })
        }

        // Other content blocks → user message
        if (otherBlocks.length > 0) {
          openaiMessages.push({
            role: 'user',
            content: convertContentBlocks(otherBlocks),
          })
        }
      } else {
        openaiMessages.push({ role: 'user', content: msg.content })
      }
    } else if (msg.role === 'assistant') {
      const { text, toolCalls } = extractAssistantContent(msg.content)
      const assistantMsg: OpenAIMessage = {
        role: 'assistant',
        content: text || null,
      }
      if (toolCalls.length > 0) {
        assistantMsg.tool_calls = toolCalls
      }
      openaiMessages.push(assistantMsg)
    }
  }

  // Convert tools — Anthropic input_schema → OpenAI parameters
  const openaiTools: OpenAITool[] | undefined = params.tools?.map((tool) => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.input_schema,
    },
  }))

  const request: OpenAIChatCompletionRequest = {
    model: mapModelToOpenAI(params.model),
    messages: openaiMessages,
    stream: params.stream,
    max_tokens: params.max_tokens,
    temperature: params.temperature,
    top_p: params.top_p,
    stop: params.stop_sequences,
  }

  if (openaiTools && openaiTools.length > 0) {
    request.tools = openaiTools
    request.tool_choice = 'auto'
  }

  if (params.stream) {
    request.stream_options = { include_usage: true }
  }

  // Remove undefined fields
  for (const key of Object.keys(request)) {
    if ((request as any)[key] === undefined) {
      delete (request as any)[key]
    }
  }

  return request
}

function extractTextContent(content: any): string {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map((c: any) => c.text || (typeof c === 'string' ? c : JSON.stringify(c)))
      .join('\n')
  }
  return JSON.stringify(content) || ''
}

function convertContentBlocks(blocks: any[]): string | OpenAIContentPart[] {
  const parts: OpenAIContentPart[] = []
  for (const block of blocks) {
    if (block.type === 'text') {
      parts.push({ type: 'text', text: block.text })
    } else if (block.type === 'image') {
      parts.push({
        type: 'image_url',
        image_url: {
          url: `data:${block.source?.media_type || 'image/png'};base64,${block.source?.data}`,
          detail: 'auto',
        },
      })
    }
    // Skip tool_use (handled by assistant extraction), cache_control, etc.
  }
  if (parts.length === 1 && parts[0].type === 'text') {
    return parts[0].text!
  }
  return parts.length > 0 ? parts : ''
}

function extractAssistantContent(content: any): {
  text: string
  toolCalls: OpenAIToolCall[]
} {
  if (typeof content === 'string') return { text: content, toolCalls: [] }
  if (!Array.isArray(content)) return { text: '', toolCalls: [] }

  let text = ''
  const toolCalls: OpenAIToolCall[] = []

  for (const block of content) {
    if (block.type === 'text') {
      text += block.text
    } else if (block.type === 'tool_use') {
      toolCalls.push({
        id: block.id,
        type: 'function',
        function: {
          name: block.name,
          arguments: JSON.stringify(block.input || {}),
        },
      })
    }
  }

  return { text, toolCalls }
}

// ============ OpenAI → Anthropic Response Conversion ============

export function convertOpenAIResponseToAnthropic(response: any): any {
  const choice = response.choices?.[0]
  if (!choice) {
    return {
      id: response.id || `msg_openai_${Date.now()}`,
      type: 'message',
      role: 'assistant',
      content: [],
      model: response.model,
      stop_reason: 'end_turn',
      usage: convertUsage(response.usage),
    }
  }

  const content: any[] = []

  if (choice.message?.content) {
    content.push({ type: 'text', text: choice.message.content })
  }

  if (choice.message?.tool_calls) {
    for (const tc of choice.message.tool_calls) {
      content.push({
        type: 'tool_use',
        id: tc.id,
        name: tc.function.name,
        input: safeJsonParse(tc.function.arguments),
      })
    }
  }

  const STOP_REASON_MAP: Record<string, string> = {
    stop: 'end_turn',
    length: 'max_tokens',
    tool_calls: 'tool_use',
    content_filter: 'end_turn',
  }

  return {
    id: response.id || `msg_openai_${Date.now()}`,
    type: 'message',
    role: 'assistant',
    content,
    model: response.model,
    stop_reason: STOP_REASON_MAP[choice.finish_reason] || 'end_turn',
    usage: convertUsage(response.usage),
  }
}

function convertUsage(usage: any): any {
  if (!usage) return { input_tokens: 0, output_tokens: 0 }
  return {
    input_tokens: usage.prompt_tokens || 0,
    output_tokens: usage.completion_tokens || 0,
    // OpenAI returns cached_tokens in prompt_tokens_details
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: usage.prompt_tokens_details?.cached_tokens || 0,
  }
}

function safeJsonParse(str: string): any {
  try {
    return JSON.parse(str)
  } catch {
    return { raw: str }
  }
}

// ============ Streaming Adapter ============

/**
 * Convert OpenAI SSE stream chunks to Anthropic streaming events.
 * Maps: content_block_start/delta/stop, message_start/delta/stop
 */
export async function* convertOpenAIStreamToAnthropic(
  readSSE: AsyncIterable<any>,
): AsyncGenerator<any> {
  let contentBlockIndex = 0
  let hasStartedText = false
  let hasEmittedStart = false

  for await (const chunk of readSSE) {
    // Emit message_start on first chunk
    if (!hasEmittedStart) {
      yield {
        type: 'message_start',
        message: {
          id: chunk.id || `msg_openai_stream_${Date.now()}`,
          type: 'message',
          role: 'assistant',
          content: [],
          model: chunk.model || '',
          stop_reason: null,
          usage: { input_tokens: 0, output_tokens: 0 },
        },
      }
      hasEmittedStart = true
    }

    const delta = chunk.choices?.[0]?.delta
    if (!delta) {
      // Final chunk with usage info
      if (chunk.usage) {
        yield {
          type: 'message_delta',
          delta: { stop_reason: 'end_turn' },
          usage: convertUsage(chunk.usage),
        }
      }
      continue
    }

    // Text content delta
    if (delta.content) {
      if (!hasStartedText) {
        yield {
          type: 'content_block_start',
          index: contentBlockIndex,
          content_block: { type: 'text', text: '' },
        }
        hasStartedText = true
      }
      yield {
        type: 'content_block_delta',
        index: contentBlockIndex,
        delta: { type: 'text_delta', text: delta.content },
      }
    }

    // Tool call delta
    if (delta.tool_calls) {
      for (const tc of delta.tool_calls) {
        if (tc.id) {
          // New tool call — close previous block
          if (hasStartedText || contentBlockIndex > 0) {
            yield { type: 'content_block_stop', index: contentBlockIndex }
            contentBlockIndex++
          }
          hasStartedText = false

          yield {
            type: 'content_block_start',
            index: contentBlockIndex,
            content_block: {
              type: 'tool_use',
              id: tc.id,
              name: tc.function?.name || '',
              input: {},
            },
          }
        }
        if (tc.function?.arguments) {
          yield {
            type: 'content_block_delta',
            index: contentBlockIndex,
            delta: {
              type: 'input_json_delta',
              partial_json: tc.function.arguments,
            },
          }
        }
      }
    }

    // Finish reason
    const finishReason = chunk.choices?.[0]?.finish_reason
    if (finishReason) {
      yield { type: 'content_block_stop', index: contentBlockIndex }
      const STOP_MAP: Record<string, string> = {
        stop: 'end_turn',
        length: 'max_tokens',
        tool_calls: 'tool_use',
      }
      yield {
        type: 'message_delta',
        delta: { stop_reason: STOP_MAP[finishReason] || 'end_turn' },
        usage: convertUsage(chunk.usage),
      }
    }
  }

  yield { type: 'message_stop' }
}

// ============ OpenAI API Client ============

export class OpenAIClient {
  private apiKey: string
  private baseUrl: string

  constructor(apiKey: string, baseUrl: string = 'https://api.openai.com/v1') {
    this.apiKey = apiKey
    this.baseUrl = baseUrl.replace(/\/$/, '')
  }

  /**
   * Non-streaming message creation.
   * Accepts Anthropic-format params, returns Anthropic-format response.
   */
  async createMessage(anthropicParams: any): Promise<any> {
    const openaiParams = convertAnthropicToOpenAI({ ...anthropicParams, stream: false })

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(openaiParams),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      const msg = error.error?.message || response.statusText
      throw Object.assign(new Error(`OpenAI API error ${response.status}: ${msg}`), {
        status: response.status,
        statusCode: response.status,
        error,
      })
    }

    return convertOpenAIResponseToAnthropic(await response.json())
  }

  /**
   * Streaming message creation.
   * Accepts Anthropic-format params, yields Anthropic-format streaming events.
   */
  async *createMessageStream(anthropicParams: any): AsyncGenerator<any> {
    const openaiParams = convertAnthropicToOpenAI({ ...anthropicParams, stream: true })

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(openaiParams),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      const msg = error.error?.message || response.statusText
      throw Object.assign(new Error(`OpenAI API error ${response.status}: ${msg}`), {
        status: response.status,
        statusCode: response.status,
        error,
      })
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body from OpenAI')

    const decoder = new TextDecoder()
    let buffer = ''

    async function* readSSE(): AsyncGenerator<any> {
      while (true) {
        const { done, value } = await reader!.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (trimmed.startsWith('data: ')) {
            const data = trimmed.slice(6)
            if (data === '[DONE]') return
            try {
              yield JSON.parse(data)
            } catch {
              // Skip malformed SSE chunks
            }
          }
        }
      }
    }

    yield* convertOpenAIStreamToAnthropic(readSSE())
  }

  /**
   * Validate API key by listing models.
   */
  async validateApiKey(): Promise<{ valid: boolean; models?: string[]; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
      })
      if (!response.ok) {
        return { valid: false, error: `HTTP ${response.status}: ${response.statusText}` }
      }
      const data = await response.json()
      const models =
        data.data
          ?.map((m: any) => m.id)
          .filter((id: string) => /^(gpt-|o[34]|codex)/.test(id))
          .sort() || []
      return { valid: true, models }
    } catch (e: any) {
      return { valid: false, error: e.message }
    }
  }
}

// ============ Singleton Client Factory ============

let _cachedClient: OpenAIClient | null = null
let _cachedKey: string | null = null

export function getOpenAIClient(): OpenAIClient | null {
  if (!isOpenAIProvider()) return null
  const apiKey = process.env.OPENAI_API_KEY!
  const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
  // Cache client instance (recreate if key changes)
  if (!_cachedClient || _cachedKey !== apiKey) {
    _cachedClient = new OpenAIClient(apiKey, baseUrl)
    _cachedKey = apiKey
  }
  return _cachedClient
}

// ============================================================================
// ChatGPT Backend Client (OAuth / Responses API)
// ============================================================================
//
// Input:  Anthropic Messages 请求（含 tools / thinking 段）
// Output: Anthropic Messages 响应或流式事件序列
// Pos:    OpenAI provider 的 chatgpt_backend 模式入口
//
// 为什么单独一个 class：
//   - endpoint 不一样 (chatgpt.com/backend-api/codex/responses)
//   - header 一套定值（Session_id / Originator / Chatgpt-Account-Id / 特定 UA）
//   - body 是 Responses API 而非 Chat Completions
//   - 支持 reasoning block → Anthropic thinking 双向映射（Q3 硬约束）
// ----------------------------------------------------------------------------

const CODEX_STREAM_URL = 'https://chatgpt.com/backend-api/codex/responses'
const CODEX_COMPACT_URL = 'https://chatgpt.com/backend-api/codex/responses/compact'
const CODEX_UA = 'codex-tui/0.118.0 (Mac OS 26.3.1; arm64) iTerm.app/3.6.9'
const CODEX_ORIGINATOR = 'codex-tui'

/** 生成 UUID v4（无外部依赖） */
function uuidv4(): string {
  // crypto.randomUUID 在 Node 14.17+ / Bun 全版本均可用
  // eslint-disable-next-line eslint-plugin-n/no-unsupported-features/node-builtins
  try {
    const { randomUUID } = require('node:crypto') as typeof import('node:crypto')
    return randomUUID()
  } catch {
    // 兜底：RFC4122-style
    const hex = (n: number) =>
      Math.floor(Math.random() * (1 << (4 * n)))
        .toString(16)
        .padStart(n, '0')
    return `${hex(8)}-${hex(4)}-4${hex(3)}-8${hex(3)}-${hex(12)}`
  }
}

// ---- Responses API 类型（最小子集） ---------------------------------------

interface ResponsesInputMessage {
  type: 'message'
  role: 'user' | 'assistant' | 'system'
  content: Array<
    | { type: 'input_text'; text: string }
    | { type: 'output_text'; text: string }
    | { type: 'input_image'; image_url: string }
  >
}
interface ResponsesFunctionCall {
  type: 'function_call'
  name: string
  arguments: string
  call_id: string
}
interface ResponsesFunctionCallOutput {
  type: 'function_call_output'
  call_id: string
  output: string
}
interface ResponsesReasoningItem {
  type: 'reasoning'
  summary?: Array<{ type: 'summary_text'; text: string }>
  encrypted_content?: string
}
type ResponsesInputItem =
  | ResponsesInputMessage
  | ResponsesFunctionCall
  | ResponsesFunctionCallOutput
  | ResponsesReasoningItem

interface ResponsesToolDef {
  type: 'function'
  name: string
  description?: string
  parameters?: Record<string, unknown>
  strict?: boolean
}

interface ResponsesRequest {
  model: string
  instructions?: string
  input: ResponsesInputItem[]
  tools?: ResponsesToolDef[]
  parallel_tool_calls?: boolean
  stream?: boolean
  store?: boolean
  reasoning?: { effort?: 'low' | 'medium' | 'high'; summary?: 'auto' | 'none' }
  include?: string[]
  prompt_cache_key?: string
  text?: { format?: { type: string } }
}

// ---- Anthropic → Responses API 转换 ----------------------------------------

/**
 * 把 Anthropic Messages 请求翻译为 chatgpt.com/backend-api/codex/responses 的 body。
 * Body 字段保留: instructions, input, tools, text.format, model, stream, prompt_cache_key
 * 必须删除: previous_response_id, prompt_cache_retention, safety_identifier, stream_options
 */
export function convertAnthropicToResponsesAPI(params: {
  model: string
  system?: string | Array<{ type: string; text: string; cache_control?: unknown }>
  messages: Array<{ role: string; content: unknown }>
  tools?: Array<{ name: string; description?: string; input_schema?: Record<string, unknown> }>
  stream?: boolean
  thinking?: { type?: string; budget_tokens?: number } | unknown
  [key: string]: unknown
}): ResponsesRequest {
  // --- system → instructions -------------------------------------------------
  const instructions =
    typeof params.system === 'string'
      ? params.system
      : Array.isArray(params.system)
        ? params.system.map(b => b.text).filter(Boolean).join('\n')
        : undefined

  // --- messages → input ------------------------------------------------------
  const input: ResponsesInputItem[] = []
  for (const msg of params.messages) {
    if (msg.role === 'user') {
      if (Array.isArray(msg.content)) {
        // 把 tool_result 单独拆成 function_call_output
        const toolResults: Array<{ tool_use_id: string; content: unknown }> = []
        const otherBlocks: Array<Record<string, unknown>> = []
        for (const b of msg.content as Array<Record<string, unknown>>) {
          if (b.type === 'tool_result') {
            toolResults.push({
              tool_use_id: String(b.tool_use_id ?? ''),
              content: b.content,
            })
          } else {
            otherBlocks.push(b)
          }
        }
        for (const tr of toolResults) {
          input.push({
            type: 'function_call_output',
            call_id: tr.tool_use_id,
            output: flattenToolResultContent(tr.content),
          })
        }
        if (otherBlocks.length > 0) {
          const parts: ResponsesInputMessage['content'] = []
          for (const b of otherBlocks) {
            if (b.type === 'text' && typeof b.text === 'string') {
              parts.push({ type: 'input_text', text: b.text })
            } else if (b.type === 'image') {
              const src = b.source as
                | { media_type?: string; data?: string }
                | undefined
              if (src?.data) {
                parts.push({
                  type: 'input_image',
                  image_url: `data:${src.media_type ?? 'image/png'};base64,${src.data}`,
                })
              }
            }
          }
          if (parts.length > 0) {
            input.push({ type: 'message', role: 'user', content: parts })
          }
        }
      } else if (typeof msg.content === 'string') {
        input.push({
          type: 'message',
          role: 'user',
          content: [{ type: 'input_text', text: msg.content }],
        })
      }
    } else if (msg.role === 'assistant') {
      if (typeof msg.content === 'string') {
        input.push({
          type: 'message',
          role: 'assistant',
          content: [{ type: 'output_text', text: msg.content }],
        })
        continue
      }
      if (!Array.isArray(msg.content)) continue
      let textBuf = ''
      for (const b of msg.content as Array<Record<string, unknown>>) {
        if (b.type === 'text' && typeof b.text === 'string') {
          textBuf += b.text
        } else if (b.type === 'thinking') {
          // 把 Anthropic thinking 回灌为 reasoning item（Q3 硬约束）
          // 历史 thinking 的 text 作为 reasoning.summary.text
          const tText = typeof b.thinking === 'string' ? b.thinking : ''
          const encrypted =
            typeof b.signature === 'string' ? (b.signature as string) : undefined
          const item: ResponsesReasoningItem = { type: 'reasoning' }
          if (tText) {
            item.summary = [{ type: 'summary_text', text: tText }]
          }
          if (encrypted) {
            item.encrypted_content = encrypted
          }
          input.push(item)
        } else if (b.type === 'tool_use') {
          // 先 flush 文本
          if (textBuf) {
            input.push({
              type: 'message',
              role: 'assistant',
              content: [{ type: 'output_text', text: textBuf }],
            })
            textBuf = ''
          }
          input.push({
            type: 'function_call',
            name: String(b.name ?? ''),
            arguments: JSON.stringify(b.input ?? {}),
            call_id: String(b.id ?? ''),
          })
        }
      }
      if (textBuf) {
        input.push({
          type: 'message',
          role: 'assistant',
          content: [{ type: 'output_text', text: textBuf }],
        })
      }
    }
  }

  // --- tools 扁平化（Responses 格式不是嵌套 function 对象） --------------------
  const tools: ResponsesToolDef[] | undefined = params.tools?.map(t => ({
    type: 'function' as const,
    name: t.name,
    description: t.description,
    parameters: t.input_schema,
    strict: false,
  }))

  // --- reasoning: 由 thinking 触发 --------------------------------------------
  const thinking = params.thinking as
    | { type?: string; budget_tokens?: number }
    | undefined
  const reasoningEnabled = !!(thinking && thinking.type === 'enabled')

  const body: ResponsesRequest = {
    model: mapModelToCodex(params.model),
    input,
  }
  // 流式 /responses 端点接受 stream/store/parallel_tool_calls；
  // 非流式 /responses/compact 端点拒绝这些字段（Unknown parameter: 'stream'/'store'）。
  // CLIProxyAPI 实测：compact 端点保留 instructions/input/tools/text.format/model/prompt_cache_key。
  if (params.stream) {
    body.stream = true
    body.store = false
    body.parallel_tool_calls = false
  }
  if (instructions) body.instructions = instructions
  if (tools && tools.length > 0) body.tools = tools
  if (reasoningEnabled) {
    body.reasoning = { effort: 'medium', summary: 'auto' }
    body.include = ['reasoning.encrypted_content']
  }
  return body
}

/** 把 tool_result 的 content 扁平为一段字符串（Responses API function_call_output 需要 string） */
function flattenToolResultContent(content: unknown): string {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return (content as Array<Record<string, unknown>>)
      .map(c => {
        if (typeof c === 'string') return c
        if (c && typeof c === 'object') {
          if (typeof (c as { text?: unknown }).text === 'string') {
            return String((c as { text: string }).text)
          }
          return JSON.stringify(c)
        }
        return ''
      })
      .filter(Boolean)
      .join('\n')
  }
  if (content && typeof content === 'object') return JSON.stringify(content)
  return ''
}

/**
 * Codex backend 接受的模型名。
 *
 * ChatGPT 账户层级对模型可见性有限制：
 *   - Free:  只能用 gpt-5（gpt-5-codex 返回 400：not supported when using Codex with a ChatGPT account）
 *   - Plus/Pro/Team/Enterprise: gpt-5-codex / gpt-5 / o3 / o4-mini 均可
 *
 * 策略：优先尊重用户显式传入的 Codex 原生模型 id；Anthropic 模型名（claude-x / sonnet / opus）
 * 一律降级到 gpt-5（通用兼容，Free 账户也能跑通）。用户要用 gpt-5-codex 需显式 `--model gpt-5-codex`
 * 且账户为 Plus/Pro。可通过 PANDA_CODEX_DEFAULT_MODEL env 覆盖默认 fallback。
 */
export function mapModelToCodex(model: string): string {
  const envDefault = process.env.PANDA_CODEX_DEFAULT_MODEL
  const allowCodex = process.env.PANDA_CODEX_ALLOW_CODEX_MODEL === '1'
  // OpenAI 2026 主流 Codex 模型 id：gpt-5.4 / gpt-5.4-mini / gpt-5.3-codex-spark 等。
  // ChatGPT 账户访问分层：
  //   - Free:   仅 gpt-5.4-mini（lightweight, 免费限量）
  //   - Plus/Pro/Business/Enterprise: gpt-5.4 / 5.4-mini / 5.3-codex-spark 均可
  // 策略：尊重用户显式传入的新式模型 id；*-codex 模型默认降级（gpt-5-codex 已退役但兼容）
  // 其他输入（claude-x / sonnet / opus / unknown）默认 gpt-5.4-mini，Free 账户可跑通。
  if (/^gpt-5\.4-mini/i.test(model)) return 'gpt-5.4-mini'
  if (/^gpt-5\.4/i.test(model)) return 'gpt-5.4'
  if (/^gpt-5\.3-codex-spark/i.test(model)) return 'gpt-5.3-codex-spark'
  if (/^gpt-5-codex/i.test(model)) {
    return allowCodex ? 'gpt-5.4' : 'gpt-5.4-mini'
  }
  if (/^gpt-5/i.test(model)) return allowCodex ? 'gpt-5.4' : 'gpt-5.4-mini'
  if (/^o3/i.test(model)) return 'o3'
  if (/^o4-?mini/i.test(model)) return 'o4-mini'
  if (/^codex/i.test(model)) return envDefault || 'gpt-5.4-mini'
  return envDefault || 'gpt-5.4-mini'
}

// ═══════════════════════════════════════════════════════════════════════════
// 作战线 N：Codex 默认模型自动选择（plan-type 路由 + 400 fallback 链）
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Free 账户候选列表（first success wins）
 * 靠前优先尝试，遇到 400 "not supported" 自动降级下一个。
 * 注意顺序：新型号 → 过渡型号 → 经典兜底
 */
export const CODEX_MODEL_CANDIDATES_FOR_FREE: readonly string[] = [
  'gpt-5.4-mini',
  'gpt-5-mini',
  'gpt-4o-mini',
  'gpt-4-turbo',
] as const

/**
 * Plus / Pro / Team / Enterprise 付费账户候选列表
 */
export const CODEX_MODEL_CANDIDATES_FOR_PAID: readonly string[] = [
  'gpt-5.4',
  'gpt-5-codex',
  'gpt-5',
  'gpt-5.4-mini', // 最终 fallback：付费账户用 mini 也能跑
] as const

/**
 * 根据 chatgpt_plan_type 选默认 Codex 模型。
 *
 * 环境变量优先级：
 *   1) PANDA_CODEX_DEFAULT_MODEL（显式覆盖，最高）
 *   2) 按 planType 返回候选列表的第一个
 *   3) 未知 planType 按 free 处理（保守）
 *
 * @param planType `free` | `plus` | `pro` | `team` | `enterprise` | null
 * @returns Codex 模型 id（如 `gpt-5.4-mini`）
 */
export function pickDefaultCodexModel(planType: string | null | undefined): string {
  const envDefault = process.env.PANDA_CODEX_DEFAULT_MODEL
  if (envDefault && envDefault.length > 0) return envDefault
  const pt = (planType || '').toLowerCase()
  const isPaid =
    pt === 'plus' ||
    pt === 'pro' ||
    pt === 'team' ||
    pt === 'enterprise' ||
    pt === 'business'
  const list = isPaid
    ? CODEX_MODEL_CANDIDATES_FOR_PAID
    : CODEX_MODEL_CANDIDATES_FOR_FREE
  return list[0]!
}

/**
 * 给定当前 model 与 planType，返回下一个 fallback 候选（遇到 400 "not supported" 时调用）。
 * 若已是该 plan 的最后一个候选，返回 null（放弃降级，向上抛错让用户感知）。
 *
 * @param currentModel 当前失败的模型 id
 * @param planType 账户计划类型
 * @returns 下一个候选 model id，或 null（已用尽）
 */
export function pickNextCodexFallback(
  currentModel: string,
  planType: string | null | undefined,
): string | null {
  const pt = (planType || '').toLowerCase()
  const isPaid =
    pt === 'plus' ||
    pt === 'pro' ||
    pt === 'team' ||
    pt === 'enterprise' ||
    pt === 'business'
  const list = isPaid
    ? CODEX_MODEL_CANDIDATES_FOR_PAID
    : CODEX_MODEL_CANDIDATES_FOR_FREE
  const idx = list.findIndex(m => m.toLowerCase() === currentModel.toLowerCase())
  // 当前模型不在候选列表 → 直接返回列表头（通用降级）
  if (idx === -1) return list[0] ?? null
  // 已是最后一个 → 无路可降
  if (idx >= list.length - 1) return null
  return list[idx + 1] ?? null
}

// ---- Responses 非流式聚合 → Anthropic -------------------------------------

interface ResponsesFinalPayload {
  id?: string
  output?: Array<Record<string, unknown>>
  usage?: {
    input_tokens?: number
    output_tokens?: number
    input_tokens_details?: { cached_tokens?: number }
  }
}

export function convertResponsesAPIToAnthropic(
  payload: ResponsesFinalPayload,
  model: string,
): Record<string, unknown> {
  const content: Array<Record<string, unknown>> = []
  let stopReason = 'end_turn'
  for (const item of payload.output ?? []) {
    const t = item.type as string | undefined
    if (t === 'message') {
      const parts = (item.content as Array<Record<string, unknown>>) ?? []
      for (const p of parts) {
        if (p.type === 'output_text' && typeof p.text === 'string') {
          content.push({ type: 'text', text: p.text })
        }
      }
    } else if (t === 'reasoning') {
      const summary = (item.summary as Array<Record<string, unknown>>) ?? []
      const text = summary
        .map(s => (typeof s.text === 'string' ? s.text : ''))
        .filter(Boolean)
        .join('\n')
      const signature =
        typeof item.encrypted_content === 'string'
          ? (item.encrypted_content as string)
          : undefined
      content.push({
        type: 'thinking',
        thinking: text,
        ...(signature ? { signature } : {}),
      })
    } else if (t === 'function_call') {
      stopReason = 'tool_use'
      const args = typeof item.arguments === 'string' ? item.arguments : '{}'
      let parsed: unknown = {}
      try {
        parsed = JSON.parse(args)
      } catch {
        parsed = { raw: args }
      }
      content.push({
        type: 'tool_use',
        id: String(item.call_id ?? ''),
        name: String(item.name ?? ''),
        input: parsed,
      })
    }
  }
  return {
    id: payload.id || `msg_codex_${Date.now()}`,
    type: 'message',
    role: 'assistant',
    content,
    model,
    stop_reason: stopReason,
    usage: {
      input_tokens: payload.usage?.input_tokens ?? 0,
      output_tokens: payload.usage?.output_tokens ?? 0,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens:
        payload.usage?.input_tokens_details?.cached_tokens ?? 0,
    },
  }
}

// ---- Responses SSE → Anthropic 流式事件 -----------------------------------

/**
 * 把 Codex/ChatGPT backend 的 SSE 事件流映射为 Anthropic 流式事件。
 *
 * SSE 事件：
 *   response.output_text.delta            → content_block_delta(text_delta)
 *   response.reasoning_summary_text.delta → content_block_delta(thinking_delta)  ← Q3
 *   response.function_call_arguments.delta → content_block_delta(input_json_delta)
 *   response.output_item.added/done       → 边界信号（开/关 block，**不**触发 message_start/stop）
 *   response.completed                    → 收尾 + usage（仅在此 emit message_delta + message_stop）
 *
 * ── 作战线 O：message boundary 修复 ────────────────────────────────────────
 *   不变量（整个 generator 生命周期）：
 *     I1. message_start 至多 emit 1 次（messageStartEmitted 一旦 true 永不复位）
 *     I2. message_delta + message_stop 仅在 generator 终止前 emit 1 次（return 路径 / finally 兜底）
 *     I3. content_block_start / content_block_stop 严格配对（任何切换 block 前必 close 旧的）
 *     I4. block index 单调递增（0, 1, 2 ...）
 *     I5. 任意 output_item.added/done 都不会 emit 第二次 message_start —— 它们只控制 block 边界
 *
 *   bug 历史：现实践中 ChatGPT Responses API 把 reasoning / message / function_call 拆成
 *   多个独立 output_item，旧实现某些路径会让客户端把它们解释为多条 assistant message
 *   （turn 边界错乱、token 计数错位、reducer 找不到 tool_use_id）。本次重构把 message 边界
 *   和 block 边界**显式分离**：response 周期 = 1 message；output_item = 1 block。
 */
export async function* convertResponsesAPIStreamToAnthropic(
  readSSE: AsyncIterable<{ event?: string; data: Record<string, unknown> }>,
  model: string,
): AsyncGenerator<Record<string, unknown>> {
  let messageStartEmitted = false
  let messageStopEmitted = false
  let messageId = `msg_codex_stream_${Date.now()}`

  // 当前打开的 content_block 信息（同一时刻至多一个）
  type OpenBlock =
    | { kind: 'text'; index: number }
    | { kind: 'thinking'; index: number }
    | { kind: 'tool_use'; index: number; callId: string; name: string }
  let current: OpenBlock | null = null
  let blockIndex = -1
  let stopReason: string = 'end_turn'
  let finalUsage: Record<string, unknown> | undefined

  // I3：close 旧 block 后才能开新 block
  const closeCurrent = function* () {
    if (current) {
      yield { type: 'content_block_stop', index: current.index }
      current = null
    }
  }

  // I1：message_start 严格单次。chunkId 可选，仅首次有效。
  const ensureStart = function* (chunkId?: string) {
    if (!messageStartEmitted) {
      if (chunkId) messageId = chunkId
      yield {
        type: 'message_start',
        message: {
          id: messageId,
          type: 'message',
          role: 'assistant',
          content: [],
          model,
          stop_reason: null,
          usage: { input_tokens: 0, output_tokens: 0 },
        },
      }
      messageStartEmitted = true
    }
  }

  // I2：message_delta + message_stop 严格单次。stream 正常完成 / 异常断流均走这里。
  const finalize = function* () {
    if (messageStopEmitted) return
    yield* closeCurrent()
    if (!messageStartEmitted) {
      // 极端：空响应（response.completed 直接来或 SSE 静默终止）—— 仍补 message_start 保协议合法
      yield* ensureStart()
    }
    yield {
      type: 'message_delta',
      delta: { stop_reason: stopReason },
      usage: finalUsage ?? { input_tokens: 0, output_tokens: 0 },
    }
    yield { type: 'message_stop' }
    messageStopEmitted = true
  }

  // 开各类 block 的小工具 —— 每次都先 closeCurrent，保证 I3
  const openTextBlock = function* () {
    yield* closeCurrent()
    blockIndex++
    current = { kind: 'text', index: blockIndex }
    yield {
      type: 'content_block_start',
      index: blockIndex,
      content_block: { type: 'text', text: '' },
    }
  }
  const openThinkingBlock = function* (signature?: string) {
    yield* closeCurrent()
    blockIndex++
    current = { kind: 'thinking', index: blockIndex }
    yield {
      type: 'content_block_start',
      index: blockIndex,
      content_block: {
        type: 'thinking',
        thinking: '',
        ...(signature ? { signature } : {}),
      },
    }
  }
  const openToolUseBlock = function* (callId: string, name: string) {
    yield* closeCurrent()
    blockIndex++
    current = { kind: 'tool_use', index: blockIndex, callId, name }
    stopReason = 'tool_use'
    yield {
      type: 'content_block_start',
      index: blockIndex,
      content_block: {
        type: 'tool_use',
        id: callId,
        name,
        input: {},
      },
    }
  }

  try {
    for await (const evt of readSSE) {
      const eventType = evt.event ?? (evt.data?.type as string | undefined)
      const data = evt.data
      if (!eventType) continue

      // ── 1) response 生命周期信号 ─────────────────────────────────────────
      // response.created / in_progress：仅记录 id，**不**强制 emit message_start
      // —— 等首个真正有内容的事件再 emit，避免空响应也产生 start（finalize 会兜底）
      if (
        eventType === 'response.created' ||
        eventType === 'response.in_progress'
      ) {
        const resp = data.response as { id?: string } | undefined
        if (resp?.id && !messageStartEmitted) messageId = resp.id
        continue
      }

      // ── 2) 文本流 ────────────────────────────────────────────────────────
      if (eventType === 'response.output_text.delta') {
        yield* ensureStart()
        if (!current || current.kind !== 'text') {
          yield* openTextBlock()
        }
        const delta =
          typeof data.delta === 'string' ? (data.delta as string) : ''
        if (delta && current) {
          yield {
            type: 'content_block_delta',
            index: current.index,
            delta: { type: 'text_delta', text: delta },
          }
        }
        continue
      }

      // ── 3) reasoning 流（→ thinking_delta，Q3 接入路径，必须保留） ────────
      if (eventType === 'response.reasoning_summary_text.delta') {
        yield* ensureStart()
        if (!current || current.kind !== 'thinking') {
          yield* openThinkingBlock()
        }
        const delta =
          typeof data.delta === 'string' ? (data.delta as string) : ''
        if (delta && current) {
          yield {
            type: 'content_block_delta',
            index: current.index,
            delta: { type: 'thinking_delta', thinking: delta },
          }
        }
        continue
      }

      // text/reasoning 显式 done：close 当前 block（下一个 added 会开新 block）
      if (
        eventType === 'response.output_text.done' ||
        eventType === 'response.reasoning_summary_text.done'
      ) {
        yield* closeCurrent()
        continue
      }

      // ── 4) function_call 参数增量 ────────────────────────────────────────
      if (eventType === 'response.function_call_arguments.delta') {
        yield* ensureStart()
        // tool_use block 必须先由 output_item.added 打开；增量先到则丢弃（防漂移）
        if (!current || current.kind !== 'tool_use') continue
        const delta =
          typeof data.delta === 'string' ? (data.delta as string) : ''
        if (delta) {
          yield {
            type: 'content_block_delta',
            index: current.index,
            delta: { type: 'input_json_delta', partial_json: delta },
          }
        }
        continue
      }
      if (eventType === 'response.function_call_arguments.done') {
        // 与旧实现一致：等 output_item.done 再 close（done 事件可能含 final args）
        continue
      }

      // ── 5) output_item 边界（关键：不动 message_start/stop，只动 block） ──
      if (eventType === 'response.output_item.added') {
        const item = data.item as Record<string, unknown> | undefined
        if (!item) continue
        // I5：output_item.added 任何分支都**不**调用任何形式的 message_stop。
        //     ensureStart 仅在首次 added 时 emit message_start（同一 message 内多个 block）。
        if (item.type === 'function_call') {
          yield* ensureStart()
          yield* openToolUseBlock(
            String(item.call_id ?? ''),
            String(item.name ?? ''),
          )
        } else if (item.type === 'reasoning') {
          // reasoning item 已声明：开占位 thinking block；后续 reasoning_summary_text.delta 会沿用
          yield* ensureStart()
          const signature =
            typeof item.encrypted_content === 'string'
              ? (item.encrypted_content as string)
              : undefined
          // 若已开同类 block 则跳过；否则 close 旧的开新的
          if (!current || current.kind !== 'thinking') {
            yield* openThinkingBlock(signature)
          }
        } else if (item.type === 'message') {
          // message item 是 text 内容的容器；ensureStart 已保证 message_start 单发
          yield* ensureStart()
          // 不主动开 text block —— output_text.delta 来时按需 open（避免空 text 块）
        }
        continue
      }

      if (eventType === 'response.output_item.done') {
        const item = data.item as Record<string, unknown> | undefined
        if (!item) continue
        yield* ensureStart()
        if (
          item.type === 'reasoning' &&
          (!current || current.kind !== 'thinking')
        ) {
          // reasoning 完整 item（流里没 delta 段时，这里拿到全量 summary）
          const summary =
            (item.summary as Array<Record<string, unknown>>) ?? []
          const text = summary
            .map(s => (typeof s.text === 'string' ? s.text : ''))
            .filter(Boolean)
            .join('\n')
          const signature =
            typeof item.encrypted_content === 'string'
              ? (item.encrypted_content as string)
              : undefined
          if (text) {
            yield* openThinkingBlock(signature)
            // 此时 current 必为新开的 thinking block
            if (current) {
              yield {
                type: 'content_block_delta',
                index: current.index,
                delta: { type: 'thinking_delta', thinking: text },
              }
            }
            yield* closeCurrent()
          }
        } else if (item.type === 'reasoning') {
          // delta 路径已喂过：此处仅 close
          if (current && current.kind === 'thinking') yield* closeCurrent()
        } else if (item.type === 'function_call') {
          if (current && current.kind === 'tool_use') yield* closeCurrent()
        } else if (item.type === 'message') {
          if (current && current.kind === 'text') yield* closeCurrent()
        }
        continue
      }

      // ── 6) 终态 ──────────────────────────────────────────────────────────
      if (eventType === 'response.completed') {
        const resp = data.response as
          | { usage?: Record<string, unknown>; status?: string }
          | undefined
        const usage = resp?.usage
        if (usage) {
          finalUsage = {
            input_tokens: (usage.input_tokens as number) ?? 0,
            output_tokens: (usage.output_tokens as number) ?? 0,
            cache_creation_input_tokens: 0,
            cache_read_input_tokens:
              (usage.input_tokens_details as { cached_tokens?: number })
                ?.cached_tokens ?? 0,
          }
        }
        yield* finalize()
        return
      }

      if (eventType === 'response.failed') {
        yield* closeCurrent()
        const resp = data.response as
          | { error?: { message?: string } }
          | undefined
        throw new Error(
          `ChatGPT backend response.failed: ${resp?.error?.message ?? 'unknown'}`,
        )
      }
      // 其他事件（content_part.added/done 等）当前直接忽略
    }

    // 流自然结束但没收到 response.completed —— 兜底 finalize（保 I2）
    yield* finalize()
  } catch (err) {
    // 异常路径（response.failed / 上游 throw）：直接透传，不再补 finalize
    // —— 客户端的 stream watchdog 会感知异常并自行降级，多 emit 一帧反而扰乱协议
    throw err
  }
}

// ---- ChatGPTBackendClient 本体 --------------------------------------------

/**
 * Anthropic SDK 兼容的 APIPromise-like 返回值。
 *
 * 契约（对齐 @anthropic-ai/sdk/core/api-promise.d.ts）：
 *   - 可 `await` 直接拿 T（非流式：Anthropic.Message；流式：AsyncIterable<MessageStreamEvent>）
 *   - `.withResponse()` 返回 `{ data: T, response: Response, request_id: string | null }`
 *
 * 为什么不用 Promise 子类？—— 用 thenable 对象更简单且完全兼容 `await`。
 * claude.ts 的三个调用点（verify_api_key / 非流式 fallback / 主流式 withResponse）
 * 只关心 `await` 与 `.withResponse()`，不碰 `.asResponse()` 等其他扩展方法。
 */
interface APIPromiseLike<T> extends PromiseLike<T> {
  withResponse(): Promise<{
    data: T
    response: Response
    request_id: string | null
  }>
}

/** 从响应头里抽 request_id；若都没有就生成 UUID，确保下游日志可关联。 */
function extractRequestId(resp: Response): string {
  const h = resp.headers
  return (
    h.get('x-request-id') ||
    h.get('openai-request-id') ||
    h.get('x-codex-request-id') ||
    uuidv4()
  )
}

export class ChatGPTBackendClient {
  private accessToken: string
  private accountId: string
  private sessionId: string

  /**
   * Anthropic SDK 契约入口。claude.ts 按 `client.beta.messages.create(...)` 调用。
   * 流式 / 非流式由 params.stream 决定；两种路径都返回 APIPromiseLike<T>。
   */
  public beta: {
    messages: {
      create: (
        params: Record<string, unknown>,
        options?: {
          signal?: AbortSignal
          timeout?: number
          headers?: Record<string, string>
        },
      ) => APIPromiseLike<unknown>
    }
  }

  constructor(accessToken: string, accountId: string) {
    this.accessToken = accessToken
    this.accountId = accountId
    // Session_id 整 session 复用；UUID v4，首字母大写 + 下划线 header 名（CLIProxyAPI 实测）
    this.sessionId = uuidv4()

    // 暴露 SDK 兼容面。this 绑定确保 create 内部能访问实例方法。
    this.beta = {
      messages: {
        create: (params, options) =>
          (params?.stream as boolean | undefined) === true ||
          (options as { stream?: boolean } | undefined)?.stream === true
            ? this.createStreamAPIPromise(params, options)
            : this.createNonStreamAPIPromise(params, options),
      },
    }
  }

  private buildHeaders(streaming: boolean): Record<string, string> {
    const h: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.accessToken}`,
      Accept: streaming ? 'text/event-stream' : 'application/json',
      Connection: 'Keep-Alive',
      'User-Agent': CODEX_UA,
      Originator: CODEX_ORIGINATOR,
      Session_id: this.sessionId,
    }
    if (this.accountId) h['Chatgpt-Account-Id'] = this.accountId
    return h
  }

  /**
   * 非流式路径底层实现：POST /responses/compact，聚合结果。
   * 同时返回 parsed Message 与原 Response，供 APIPromiseLike 双出口复用。
   */
  private async fetchNonStream(
    anthropicParams: Record<string, unknown>,
    options?: {
      signal?: AbortSignal
      timeout?: number
      headers?: Record<string, string>
    },
  ): Promise<{ data: Record<string, unknown>; response: Response }> {
    const body = convertAnthropicToResponsesAPI({
      ...(anthropicParams as Parameters<
        typeof convertAnthropicToResponsesAPI
      >[0]),
      stream: false,
    })
    const mergedHeaders = { ...this.buildHeaders(false), ...(options?.headers ?? {}) }
    // 走三路径分发器（A: axios+CA / B: bun-curl / C: fetch），绕 Bun BoringSSL
    const resp = await chatgptBackendRequest({
      url: CODEX_COMPACT_URL,
      method: 'POST',
      headers: mergedHeaders,
      body: JSON.stringify(body),
      streaming: false,
      timeoutMs: options?.timeout,
      signal: options?.signal,
    })
    if (!resp.ok) {
      const err = await readErrorBodyCompat(resp)
      throw Object.assign(
        new Error(`ChatGPT backend error ${resp.status}: ${err.message}`),
        { status: resp.status, statusCode: resp.status, error: err.raw },
      )
    }
    const payload = (await resp.json()) as ResponsesFinalPayload
    // 作战线 N：fallback 用候选列表首项而非硬编码 gpt-5-codex（已退役）
    const data = convertResponsesAPIToAnthropic(
      payload,
      (anthropicParams.model as string) || pickDefaultCodexModel(null),
    )
    // 把 ChatGPTResponse 再包装成 fetch Response 对外暴露（APIPromiseLike 契约里
    // claude.ts 只读 headers，不会重新消费 body，安全）
    const shimResponse = adaptToFetchResponse(resp)
    return { data, response: shimResponse }
  }

  /**
   * 流式路径底层实现：POST /responses，返回 AsyncGenerator<MessageStreamEvent> 与原 Response。
   * 注意：Response 对象的 body 会在外部 reader 消费期间被消耗，Response 本身仍可用于 headers。
   */
  private async fetchStream(
    anthropicParams: Record<string, unknown>,
    options?: {
      signal?: AbortSignal
      timeout?: number
      headers?: Record<string, string>
    },
  ): Promise<{
    stream: AsyncGenerator<Record<string, unknown>>
    response: Response
  }> {
    const body = convertAnthropicToResponsesAPI({
      ...(anthropicParams as Parameters<
        typeof convertAnthropicToResponsesAPI
      >[0]),
      stream: true,
    })
    const mergedHeaders = { ...this.buildHeaders(true), ...(options?.headers ?? {}) }
    // 走三路径分发器 —— 流式分支返回 Web ReadableStream<Uint8Array>，
    // 直接喂给 readResponsesSSE（既有 SSE parser 不改）。
    const resp = await chatgptBackendRequest({
      url: CODEX_STREAM_URL,
      method: 'POST',
      headers: mergedHeaders,
      body: JSON.stringify(body),
      streaming: true,
      timeoutMs: options?.timeout,
      signal: options?.signal,
    })
    if (!resp.ok) {
      const err = await readErrorBodyCompat(resp)
      throw Object.assign(
        new Error(`ChatGPT backend error ${resp.status}: ${err.message}`),
        { status: resp.status, statusCode: resp.status, error: err.raw },
      )
    }
    if (!resp.body) throw new Error('ChatGPT backend: empty response body')
    const reader = resp.body.getReader()
    // 作战线 N：fallback 用候选列表首项而非硬编码 gpt-5-codex（已退役）
    const model = (anthropicParams.model as string) || pickDefaultCodexModel(null)
    const stream = convertResponsesAPIStreamToAnthropic(
      readResponsesSSE(reader),
      model,
    )
    const shimResponse = adaptToFetchResponse(resp)
    return { stream, response: shimResponse }
  }

  /** 构造非流式 APIPromiseLike：懒发请求，await / withResponse 共享同一个 underlying promise。 */
  private createNonStreamAPIPromise(
    anthropicParams: Record<string, unknown>,
    options?: {
      signal?: AbortSignal
      timeout?: number
      headers?: Record<string, string>
    },
  ): APIPromiseLike<Record<string, unknown>> {
    // 单例 promise，await 与 withResponse 复用同一网络请求
    let underlying: Promise<{
      data: Record<string, unknown>
      response: Response
    }> | null = null
    const getUnderlying = () => {
      if (!underlying) underlying = this.fetchNonStream(anthropicParams, options)
      return underlying
    }
    return {
      then: (onfulfilled, onrejected) =>
        getUnderlying()
          .then(r => r.data)
          .then(onfulfilled, onrejected),
      withResponse: async () => {
        const { data, response } = await getUnderlying()
        return { data, response, request_id: extractRequestId(response) }
      },
    }
  }

  /** 构造流式 APIPromiseLike：await 拿 AsyncIterable；withResponse 拿 {data, response, request_id}。 */
  private createStreamAPIPromise(
    anthropicParams: Record<string, unknown>,
    options?: {
      signal?: AbortSignal
      timeout?: number
      headers?: Record<string, string>
    },
  ): APIPromiseLike<AsyncIterable<Record<string, unknown>>> {
    let underlying: Promise<{
      stream: AsyncGenerator<Record<string, unknown>>
      response: Response
    }> | null = null
    const getUnderlying = () => {
      if (!underlying) underlying = this.fetchStream(anthropicParams, options)
      return underlying
    }
    return {
      then: (onfulfilled, onrejected) =>
        getUnderlying()
          .then(r => r.stream as AsyncIterable<Record<string, unknown>>)
          .then(onfulfilled, onrejected),
      withResponse: async () => {
        const { stream, response } = await getUnderlying()
        return {
          data: stream as AsyncIterable<Record<string, unknown>>,
          response,
          request_id: extractRequestId(response),
        }
      },
    }
  }

  // ---- 向后兼容的扁平方法（旧 client.ts proxy 与测试使用）--------------------

  async createMessage(
    anthropicParams: Record<string, unknown>,
  ): Promise<unknown> {
    const { data } = await this.fetchNonStream(anthropicParams)
    return data
  }

  async *createMessageStream(
    anthropicParams: Record<string, unknown>,
  ): AsyncGenerator<Record<string, unknown>> {
    const { stream } = await this.fetchStream(anthropicParams)
    yield* stream
  }
}

/** 最小 SSE parser —— 按行收集 event: / data: 直到空行。 */
export async function* readResponsesSSE(
  reader: ReadableStreamDefaultReader<Uint8Array>,
): AsyncGenerator<{ event?: string; data: Record<string, unknown> }> {
  const decoder = new TextDecoder()
  let buffer = ''
  let currentEvent: string | undefined
  const dataLines: string[] = []

  const flush = function* () {
    if (dataLines.length === 0 && !currentEvent) return
    const raw = dataLines.join('\n')
    dataLines.length = 0
    const event = currentEvent
    currentEvent = undefined
    if (!raw) return
    if (raw === '[DONE]') return
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>
      yield { event, data: parsed }
    } catch {
      // 跳过格式错的 chunk
    }
  }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    // 按 \n 切行，遇空行 flush
    let idx
    while ((idx = buffer.indexOf('\n')) >= 0) {
      const rawLine = buffer.slice(0, idx)
      buffer = buffer.slice(idx + 1)
      const line = rawLine.replace(/\r$/, '')
      if (line === '') {
        yield* flush()
      } else if (line.startsWith('event:')) {
        currentEvent = line.slice(6).trim()
      } else if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).replace(/^ /, ''))
      } else if (line.startsWith(':')) {
        // SSE comment — 忽略
      }
    }
  }
  yield* flush()
}

async function readErrorBody(
  resp: Response,
): Promise<{ message: string; raw: unknown }> {
  const text = await resp.text().catch(() => '')
  try {
    const j = JSON.parse(text) as { error?: { message?: string } }
    return {
      message: j?.error?.message ?? resp.statusText,
      raw: j,
    }
  } catch {
    return { message: text || resp.statusText, raw: text }
  }
}

/**
 * ChatGPTResponse 版的 readErrorBody —— 三路径分发器返回的是最小兼容接口，
 * 没有 statusText 字段；降级到 "HTTP <status>" 作为错误文本兜底。
 */
async function readErrorBodyCompat(
  resp: ChatGPTResponse,
): Promise<{ message: string; raw: unknown }> {
  const text = await resp.text().catch(() => '')
  const fallback = `HTTP ${resp.status}`
  try {
    const j = JSON.parse(text) as {
      error?: {
        message?: string
        code?: string
        type?: string
        param?: string | null
      }
      detail?: string | unknown
      message?: string
    }
    // 优先级：error.message → top-level detail/message → 整个 JSON → fallback
    // 保证服务端的真实错误信息不丢失（400/422 诊断关键）
    const extracted =
      j?.error?.message ??
      (typeof j?.detail === 'string' ? j.detail : undefined) ??
      j?.message ??
      undefined
    const message = extracted
      ? `${extracted}${j?.error?.code ? ` [code=${j.error.code}]` : ''}${
          j?.error?.param ? ` [param=${j.error.param}]` : ''
        }`
      : `${fallback} — body: ${text.slice(0, 2000)}`
    return { message, raw: j }
  } catch {
    // 非 JSON body 直接原文（限长防日志爆炸）
    return {
      message: text ? `${fallback} — body: ${text.slice(0, 2000)}` : fallback,
      raw: text,
    }
  }
}

/**
 * 将 ChatGPTResponse 包装为对外可见的 Response。
 *
 * APIPromiseLike.withResponse() 对外合约里 `response: Response`，claude.ts
 * 仅读 response.headers（见 extractRequestId / log），不会二次消费 body。
 * 因此构造一个 headers 完整、body 置空的 Response 兼顾类型与零拷贝。
 */
function adaptToFetchResponse(resp: ChatGPTResponse): Response {
  // 直接用 Web Response 构造：状态 + headers 对齐，body 置空（已被上层消费）
  try {
    return new Response(null, {
      status: resp.status,
      headers: resp.headers,
    })
  } catch {
    // 极端兜底：某些运行时 Response 构造失败时返回一个 duck-typed 对象
    return {
      status: resp.status,
      statusText: '',
      ok: resp.ok,
      headers: resp.headers,
      redirected: false,
      type: 'basic',
      url: '',
      body: null,
      bodyUsed: false,
      clone() {
        return this as unknown as Response
      },
      async arrayBuffer() {
        return new ArrayBuffer(0)
      },
      async blob() {
        return new Blob([])
      },
      async formData() {
        return new FormData()
      },
      async json() {
        return null
      },
      async text() {
        return ''
      },
      async bytes() {
        return new Uint8Array(0)
      },
    } as unknown as Response
  }
}

/**
 * 简单重试：429 读 error.resets_at / resets_in_seconds 退避。
 * 其它 5xx 指数退避。
 */
async function fetchWithRetry(
  url: string,
  init: RequestInit,
  opts: { maxRetries: number },
): Promise<Response> {
  let attempt = 0
  while (true) {
    // eslint-disable-next-line eslint-plugin-n/no-unsupported-features/node-builtins
    const resp = await fetch(url, init)
    if (resp.status !== 429 && (resp.status < 500 || resp.status >= 600)) {
      return resp
    }
    if (attempt >= opts.maxRetries) return resp
    let delayMs = 1000 * Math.pow(2, attempt)
    if (resp.status === 429) {
      // 克隆读 body（避免消费原 resp）
      try {
        const cloned = resp.clone()
        const body = (await cloned.json()) as {
          error?: { resets_at?: number; resets_in_seconds?: number }
        }
        const resetsAt = body?.error?.resets_at
        const resetsIn = body?.error?.resets_in_seconds
        if (typeof resetsIn === 'number' && resetsIn > 0) {
          delayMs = Math.min(resetsIn * 1000, 60_000)
        } else if (typeof resetsAt === 'number') {
          // resets_at 是 unix 秒
          const diff = resetsAt * 1000 - Date.now()
          if (diff > 0) delayMs = Math.min(diff, 60_000)
        }
      } catch {
        // 降级用指数退避
      }
    }
    await new Promise(r => setTimeout(r, delayMs))
    attempt++
  }
}

// ─── ChatGPT backend 三路径 HTTP 分发器 ──────────────────────────────────────
//
// 线 L 修复（v2.21.23 之后）：
//   Bun 1.3.12 的 BoringSSL 不读 Windows 系统 CA store，科学上网 / 企业代理 MITM
//   证书下 `chatgpt.com/backend-api/codex/responses` TLS 握手直接失败
//   （"unknown certificate verification error"）。
//
// 与 src/services/openai-oauth.ts 的 `postForm` 三路径对齐：
//   A) PANDA_OAUTH_CA_FILE 设置 → axios + 自定义 CA（Node / Bun 通吃）
//   B) Bun runtime → 系统 curl subprocess（借 Schannel / 系统 CA + 系统代理）
//   C) Node runtime / 兜底 → 标准 fetch（当前 fetchWithRetry 的行为）
//
// 相比 postForm 还必须支持 **流式 SSE** —— 这是 responses API 的主路径。
// 因此统一抽象一个 ChatGPTResponse 类型，兼容 fetch Response 的最小面：
//   - status / headers / ok
//   - text() / json() —— 非流式
//   - body: ReadableStream<Uint8Array> | null —— 流式 reader 消费

export interface ChatGPTResponse {
  status: number
  headers: Headers
  ok: boolean
  text(): Promise<string>
  json(): Promise<unknown>
  body: ReadableStream<Uint8Array> | null
}

export interface ChatGPTBackendRequestInput {
  url: string
  method: 'POST' | 'GET'
  headers: Record<string, string>
  body: string | undefined
  streaming: boolean
  timeoutMs?: number
  signal?: AbortSignal
}

/** curl ENOENT 专属错误，用于上层回切友好提示。 */
class ChatGPTCurlNotAvailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ChatGPTCurlNotAvailableError'
  }
}

/**
 * 系统代理探测缓存：
 *   undefined — 尚未探测
 *   null       — 已探测但无代理（避免重复 exec reg）
 *   string     — 已探测到的代理 URL（带 scheme）
 */
let cachedSystemProxy: string | null | undefined = undefined

/** 仅打印一次"检测到系统代理"提示，避免刷屏。 */
let systemProxyLogged = false

/**
 * 系统代理探测：env 优先，Windows 下兜底读注册表 WinHTTP/IE 代理。
 *
 * 为什么需要：
 *   - Bun fetch 在 Windows 下自动读 WinHTTP 代理设置（能到 TLS 层）
 *   - curl.exe 不自动读 WinHTTP 代理 → 直连被墙 → TLS handshake 失败
 *   - axios / Node fetch 同样不读系统代理
 *   三路径分发器都需显式把代理传下去。
 *
 * 优先级：
 *   1) HTTPS_PROXY / https_proxy / HTTP_PROXY / http_proxy 环境变量（用户显式设置最优先）
 *   2) Windows 注册表 HKCU\...\Internet Settings\ProxyServer（仅 ProxyEnable=1 时）
 *   3) macOS scutil --proxy（当前作战暂不实现，留 TODO）
 *
 * 返回值：形如 "http://127.0.0.1:7890" 的 URL，或 undefined 表示无代理。
 */
// 暴露给 openai-oauth.ts 的 postFormViaCurl 复用（OAuth curl 也要 PAC 代理）
export function detectSystemProxyForOAuth(): string | undefined {
  return detectSystemProxy()
}

function detectSystemProxy(): string | undefined {
  // 命中缓存直接返回
  if (cachedSystemProxy !== undefined) {
    return cachedSystemProxy ?? undefined
  }

  // 优先级 1：env（用户显式设置最优先）
  const envProxy =
    process.env.HTTPS_PROXY ||
    process.env.https_proxy ||
    process.env.HTTP_PROXY ||
    process.env.http_proxy
  if (envProxy) {
    cachedSystemProxy = envProxy
    if (!systemProxyLogged) {
      systemProxyLogged = true
      process.stderr.write(`[panda] 检测到系统代理: ${envProxy}\n`)
    }
    return envProxy
  }

  // 优先级 2：Windows 注册表（WinHTTP / IE 代理）
  if (process.platform === 'win32') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { execFileSync } =
        require('node:child_process') as typeof import('node:child_process')
      const enableStdout = execFileSync(
        'reg',
        [
          'query',
          'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings',
          '/v',
          'ProxyEnable',
        ],
        { encoding: 'utf-8', windowsHide: true },
      )
      // ProxyEnable 必须是 0x1 才视为启用；REG_DWORD 返回形如 "    ProxyEnable    REG_DWORD    0x1"
      if (/ProxyEnable\s+REG_DWORD\s+0x1/i.test(enableStdout)) {
        const srvStdout = execFileSync(
          'reg',
          [
            'query',
            'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings',
            '/v',
            'ProxyServer',
          ],
          { encoding: 'utf-8', windowsHide: true },
        )
        // REG_SZ 行末到行尾之间是实际值，允许带空格
        const m = /ProxyServer\s+REG_SZ\s+(.+?)\s*$/im.exec(srvStdout)
        if (m && m[1]) {
          const raw = m[1].trim()
          // Windows ProxyServer 可能是：
          //   "host:port"                         —— 单一代理
          //   "http=host:port;https=host:port"    —— 按协议分代理
          // 访问 chatgpt.com 用 HTTPS，优先取 https=，否则取第一个裸值
          const httpsMatch = /https=([^;]+)/i.exec(raw)
          let host: string | undefined
          if (httpsMatch) {
            host = httpsMatch[1].trim()
          } else {
            const first = raw.split(';')[0]?.trim()
            // 裸 "host:port"（不含 "="）才是单一代理
            if (first && !first.includes('=')) host = first
          }
          if (host) {
            const url = /^https?:\/\//i.test(host) ? host : `http://${host}`
            cachedSystemProxy = url
            if (!systemProxyLogged) {
              systemProxyLogged = true
              process.stderr.write(`[panda] 检测到系统代理: ${url}\n`)
            }
            return url
          }
        }
      }
      // 优先级 2.5：PAC 自动配置（AutoConfigURL）
      // 实测：Clash/V2Ray 等工具常见 ProxyEnable=0 但 AutoConfigURL 指向
      // localhost 上的 PAC 服务（如 http://127.0.0.1:33331/commands/pac）。
      // 同步下载 PAC（走本地 curl，不需要代理），regex 提取 "PROXY host:port" 首匹配。
      try {
        const pacStdout = execFileSync(
          'reg',
          [
            'query',
            'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings',
            '/v',
            'AutoConfigURL',
          ],
          { encoding: 'utf-8', windowsHide: true },
        )
        const pm = /AutoConfigURL\s+REG_SZ\s+(.+?)\s*$/im.exec(pacStdout)
        if (pm && pm[1]) {
          const pacUrl = pm[1].trim()
          const pacScript = execFileSync(
            'curl.exe',
            ['-s', '--max-time', '3', pacUrl],
            { encoding: 'utf-8', windowsHide: true },
          )
          // 匹配 PAC 脚本里 FindProxyForURL 返回串的首个 PROXY host:port
          const proxyMatch = /PROXY\s+([^;"'\s]+)/i.exec(pacScript)
          if (proxyMatch && proxyMatch[1]) {
            const host = proxyMatch[1].trim()
            const url = /^https?:\/\//i.test(host) ? host : `http://${host}`
            cachedSystemProxy = url
            if (!systemProxyLogged) {
              systemProxyLogged = true
              process.stderr.write(
                `[panda] 检测到 PAC 代理 (${pacUrl}): ${url}\n`,
              )
            }
            return url
          }
        }
      } catch {
        // PAC 读取失败（无 AutoConfigURL 键 / curl 不可用 / 下载超时）—— 安静兜底
      }
    } catch {
      // reg 查询失败 / 无 ProxyEnable 键 / 无 ProxyServer 键 —— 安静兜底
    }
  }

  // 优先级 3：macOS scutil --proxy（TODO：当前指挥官是 Windows，暂不实现）

  cachedSystemProxy = null
  return undefined
}

/** 仅测试用：重置系统代理探测缓存（避免测试之间污染）。 */
function _resetSystemProxyCacheForTesting(): void {
  cachedSystemProxy = undefined
  systemProxyLogged = false
}

/** 把已完成下载的 bytes 聚合包装成 ChatGPTResponse（非流式分支用）。 */
function makeResponseFromBytes(
  status: number,
  headers: Headers,
  bytes: Uint8Array,
): ChatGPTResponse {
  // 延迟解码：text() / json() 按需决定字符串化
  let cachedText: string | null = null
  const decode = () => {
    if (cachedText === null) cachedText = new TextDecoder().decode(bytes)
    return cachedText
  }
  // body 仍提供一次性可读流，照顾潜在把非流式当流式消费的边界场景
  const body: ReadableStream<Uint8Array> = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes)
      controller.close()
    },
  })
  return {
    status,
    headers,
    ok: status >= 200 && status < 300,
    body,
    async text() {
      return decode()
    },
    async json() {
      return JSON.parse(decode())
    },
  }
}

/** 把 ReadableStream<Uint8Array> 包装成"先读完再给 text/json"的 ChatGPTResponse。 */
function makeResponseFromStream(
  status: number,
  headers: Headers,
  stream: ReadableStream<Uint8Array>,
): ChatGPTResponse {
  let consumed = false
  const readAll = async (): Promise<Uint8Array> => {
    if (consumed) throw new Error('ChatGPTResponse body already consumed')
    consumed = true
    const reader = stream.getReader()
    const chunks: Uint8Array[] = []
    let total = 0
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) {
        chunks.push(value)
        total += value.length
      }
    }
    const flat = new Uint8Array(total)
    let off = 0
    for (const c of chunks) {
      flat.set(c, off)
      off += c.length
    }
    return flat
  }
  return {
    status,
    headers,
    ok: status >= 200 && status < 300,
    body: stream,
    async text() {
      const bytes = await readAll()
      return new TextDecoder().decode(bytes)
    },
    async json() {
      const bytes = await readAll()
      return JSON.parse(new TextDecoder().decode(bytes))
    },
  }
}

/** 把 Node Readable 转成 Web ReadableStream<Uint8Array>。 */
function nodeReadableToWeb(
  nodeReadable: NodeJS.ReadableStream,
): ReadableStream<Uint8Array> {
  // Node ≥17 / Bun 原生提供 Readable.toWeb，优先走该路径
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Readable } =
      require('node:stream') as typeof import('node:stream')
    if (typeof (Readable as unknown as { toWeb?: unknown }).toWeb === 'function') {
      return (Readable as unknown as {
        toWeb: (s: NodeJS.ReadableStream) => ReadableStream<Uint8Array>
      }).toWeb(nodeReadable)
    }
  } catch {
    // 走兜底
  }
  // 兜底：手工 ReadableStream 适配
  return new ReadableStream<Uint8Array>({
    start(controller) {
      nodeReadable.on('data', (chunk: Buffer | string) => {
        const u8 =
          typeof chunk === 'string'
            ? new TextEncoder().encode(chunk)
            : new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength)
        controller.enqueue(u8)
      })
      nodeReadable.on('end', () => controller.close())
      nodeReadable.on('error', (err: Error) => controller.error(err))
    },
    cancel() {
      const anyReadable = nodeReadable as unknown as {
        destroy?: (err?: Error) => void
      }
      if (typeof anyReadable.destroy === 'function') anyReadable.destroy()
    },
  })
}

/** 路径 A：axios + 自定义 CA。PANDA_OAUTH_CA_FILE 指定 pem，覆盖 Bun BoringSSL。 */
async function chatgptRequestViaAxiosWithCA(
  input: ChatGPTBackendRequestInput,
  caFile: string,
): Promise<ChatGPTResponse> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const axios = (require('axios') as typeof import('axios')).default
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { readFileSync } = require('node:fs') as typeof import('node:fs')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Agent: HttpsAgent } =
    require('node:https') as typeof import('node:https')

  const ca = readFileSync(caFile)
  // axios 原生 `proxy` 选项对 HTTPS 目标支持有限（会用 CONNECT 隧道但不带 CA）。
  // 中国大陆环境下 axios 默认不读系统代理 → 直连 chatgpt.com 被墙。
  // 走 HttpsProxyAgent：既能通过代理 CONNECT，又能在隧道内注入自定义 CA。
  const systemProxy = detectSystemProxy()
  let httpsAgent: unknown
  if (systemProxy) {
    // 动态 import：https-proxy-agent 是纯 ESM（exports 只暴露 import 条件），
    // 用 require 会被 Bun bundler 解析失败 —— 故走动态 import。
    const mod = (await import('https-proxy-agent')) as typeof import('https-proxy-agent')
    httpsAgent = new mod.HttpsProxyAgent(systemProxy, { ca, keepAlive: false })
  } else {
    httpsAgent = new HttpsAgent({ ca, keepAlive: false })
  }
  const timeout = input.timeoutMs ?? 0

  if (input.streaming) {
    const resp = await axios.request({
      url: input.url,
      method: input.method,
      headers: input.headers,
      data: input.body,
      responseType: 'stream',
      validateStatus: () => true,
      timeout,
      httpsAgent,
      // 代理已由 HttpsProxyAgent 处理，禁用 axios 自身的代理逻辑避免双重代理
      proxy: false,
      signal: input.signal as unknown as undefined,
    })
    const headers = new Headers()
    for (const [k, v] of Object.entries(resp.headers ?? {})) {
      if (typeof v === 'string') headers.set(k, v)
      else if (Array.isArray(v)) headers.set(k, v.join(', '))
    }
    const webStream = nodeReadableToWeb(resp.data as NodeJS.ReadableStream)
    return makeResponseFromStream(resp.status, headers, webStream)
  }

  const resp = await axios.request({
    url: input.url,
    method: input.method,
    headers: input.headers,
    data: input.body,
    responseType: 'arraybuffer',
    validateStatus: () => true,
    timeout,
    httpsAgent,
    // 代理已由 HttpsProxyAgent 处理，禁用 axios 自身的代理逻辑避免双重代理
    proxy: false,
    signal: input.signal as unknown as undefined,
  })
  const headers = new Headers()
  for (const [k, v] of Object.entries(resp.headers ?? {})) {
    if (typeof v === 'string') headers.set(k, v)
    else if (Array.isArray(v)) headers.set(k, v.join(', '))
  }
  const bytes = new Uint8Array(resp.data as ArrayBuffer)
  return makeResponseFromBytes(resp.status, headers, bytes)
}

/**
 * 解析 curl `-i` 模式输出中的状态行 + headers；返回 header 终止偏移（bytes）。
 *
 * curl 在 stdout 先写 response headers（以 \r\n\r\n 结束），后写 body。
 * 要处理 HTTP/1.1 + HTTP/2 两种状态行（"HTTP/2 200" / "HTTP/1.1 200 OK"）。
 * 可能有多段 headers —— 例如 100 Continue + 最终 200；取最后一段作为真实响应。
 */
function parseCurlHeaderBlock(
  buf: Uint8Array,
): { status: number; headers: Headers; bodyOffset: number } | null {
  // 找出全部 "\r\n\r\n" 边界位置，逐段查找最后一个非 100-continue 的 block
  const sep = [0x0d, 0x0a, 0x0d, 0x0a]
  const matches: number[] = []
  outer: for (let i = 0; i + 3 < buf.length; i++) {
    for (let j = 0; j < 4; j++) {
      if (buf[i + j] !== sep[j]) continue outer
    }
    matches.push(i + 4)
  }
  if (matches.length === 0) return null
  // 每一段从上一个边界 → 当前边界。解析最后一段作为真实响应。
  let segStart = 0
  let finalStatus = -1
  let finalHeaders: Headers = new Headers()
  let finalBodyOffset = matches[matches.length - 1]
  for (const endOff of matches) {
    const segBytes = buf.subarray(segStart, endOff - 4)
    const segText = new TextDecoder('utf-8').decode(segBytes)
    const lines = segText.split(/\r?\n/)
    if (lines.length === 0) {
      segStart = endOff
      continue
    }
    const statusLine = lines[0] ?? ''
    // HTTP/2 形如 "HTTP/2 200"；HTTP/1.1 形如 "HTTP/1.1 200 OK"
    const m = /^HTTP\/[\d.]+\s+(\d{3})/.exec(statusLine)
    if (!m) {
      segStart = endOff
      continue
    }
    const status = parseInt(m[1], 10)
    // 跳过 1xx interim responses（100 Continue / 103 Early Hints），
    // 继续扫后续 block 直到真正的最终响应。
    if (status >= 100 && status < 200) {
      segStart = endOff
      continue
    }
    const hdrs = new Headers()
    for (let li = 1; li < lines.length; li++) {
      const line = lines[li]
      if (!line) continue
      const colon = line.indexOf(':')
      if (colon <= 0) continue
      const name = line.slice(0, colon).trim()
      const value = line.slice(colon + 1).trim()
      try {
        hdrs.append(name, value)
      } catch {
        // 忽略非法 header
      }
    }
    finalStatus = status
    finalHeaders = hdrs
    finalBodyOffset = endOff
    segStart = endOff
  }
  if (finalStatus < 0) return null
  return { status: finalStatus, headers: finalHeaders, bodyOffset: finalBodyOffset }
}

/**
 * 路径 B：subprocess curl。借系统 Schannel / 系统 CA 绕过 Bun BoringSSL。
 *
 * 关键参数：
 *   -sS    silent + show errors
 *   -N     no-buffer（流式必须，禁用 curl 内部输出缓冲）
 *   -i     把 response headers + body 一起写到 stdout，便于解析
 *   --max-time  超时上限
 *   --data <body>   请求体（若为 POST）
 *   -H 'key: value' 每个 header 一个
 */
async function chatgptRequestViaCurl(
  input: ChatGPTBackendRequestInput,
): Promise<ChatGPTResponse> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { spawn } = require('node:child_process') as typeof import('node:child_process')

  const curlBin = process.platform === 'win32' ? 'curl.exe' : 'curl'
  const timeoutMs = input.timeoutMs ?? 600_000
  const maxTimeSec = Math.max(1, Math.ceil(timeoutMs / 1000))

  const args: string[] = ['-sS', '-N', '-i']
  // Windows 下 curl.exe 不自动读 WinHTTP 代理 → 显式透传系统代理，
  // 否则中国大陆环境会直连 chatgpt.com 被墙（curl (35) schannel handshake 失败）。
  const systemProxy = detectSystemProxy()
  if (systemProxy) {
    args.push('-x', systemProxy)
  }
  if (input.method === 'POST') {
    args.push('-X', 'POST')
  }
  for (const [k, v] of Object.entries(input.headers)) {
    args.push('-H', `${k}: ${v}`)
  }
  // Accept-Encoding: 让 curl 自行解码（避免我们拿到 gzip 原始字节）
  args.push('--compressed')
  args.push('--max-time', String(maxTimeSec))
  // body 走 stdin，避免 ARG_MAX 截断 + 特殊字符 shell 歧义
  if (input.body !== undefined) {
    args.push('--data-binary', '@-')
  }
  args.push(input.url)

  const child = spawn(curlBin, args, {
    env: { ...process.env },
    windowsHide: true,
    stdio: ['pipe', 'pipe', 'pipe'],
  })

  // stdin 写 body 后关闭
  if (input.body !== undefined) {
    child.stdin.write(input.body)
    child.stdin.end()
  } else {
    child.stdin.end()
  }

  // signal abort → 杀 curl
  if (input.signal) {
    const onAbort = () => {
      try {
        child.kill('SIGTERM')
      } catch {
        /* 已退出 */
      }
    }
    if (input.signal.aborted) onAbort()
    else input.signal.addEventListener('abort', onAbort, { once: true })
  }

  // 收集 stderr 仅在非 0 退出时使用
  let stderrBuf = ''
  child.stderr.setEncoding('utf-8')
  child.stderr.on('data', (d: string) => {
    stderrBuf += d
  })

  // spawn 立即返回，但 ENOENT / EACCES 会在 'error' 事件里抛
  const spawnReady = new Promise<void>((resolve, reject) => {
    let settled = false
    child.on('error', (err: NodeJS.ErrnoException) => {
      if (settled) return
      settled = true
      if (err.code === 'ENOENT') {
        reject(
          new ChatGPTCurlNotAvailableError(
            `system ${curlBin} not found (ENOENT). Install curl or set PANDA_OAUTH_CA_FILE.`,
          ),
        )
      } else {
        reject(err)
      }
    })
    // spawn 成功的可靠信号：stdout / stderr 任何一方开始流动即视为 ready
    const onMaybeReady = () => {
      if (settled) return
      settled = true
      resolve()
    }
    child.stdout.once('readable', onMaybeReady)
    child.stderr.once('readable', onMaybeReady)
    // 超时兜底（极短），避免空响应永挂
    setTimeout(onMaybeReady, 50).unref?.()
  })
  await spawnReady

  // 解析 headers：从 stdout 一直累积直到遇到 \r\n\r\n
  const stdout = child.stdout
  const headerChunks: Uint8Array[] = []
  let headerBytes = 0
  let parsed: {
    status: number
    headers: Headers
    bodyOffset: number
  } | null = null
  let leftoverBody: Uint8Array = new Uint8Array(0)

  await new Promise<void>((resolve, reject) => {
    let settled = false
    const onData = (chunk: Buffer) => {
      const u8 = new Uint8Array(
        chunk.buffer,
        chunk.byteOffset,
        chunk.byteLength,
      )
      headerChunks.push(u8)
      headerBytes += u8.length
      // 合并查找 \r\n\r\n
      const merged = new Uint8Array(headerBytes)
      let off = 0
      for (const c of headerChunks) {
        merged.set(c, off)
        off += c.length
      }
      parsed = parseCurlHeaderBlock(merged)
      if (parsed) {
        leftoverBody = merged.subarray(parsed.bodyOffset)
        stdout.off('data', onData)
        stdout.off('end', onEnd)
        stdout.off('error', onErr)
        if (!settled) {
          settled = true
          resolve()
        }
      }
    }
    const onEnd = () => {
      if (settled) return
      // stdout 结束但仍没解析到 headers —— 可能整包都在 headerChunks 里
      const merged = new Uint8Array(headerBytes)
      let off = 0
      for (const c of headerChunks) {
        merged.set(c, off)
        off += c.length
      }
      parsed = parseCurlHeaderBlock(merged)
      if (parsed) {
        leftoverBody = merged.subarray(parsed.bodyOffset)
        settled = true
        resolve()
      } else {
        settled = true
        reject(
          new Error(
            `curl produced no parseable HTTP response headers. stderr: ${stderrBuf.trim()}`,
          ),
        )
      }
    }
    const onErr = (err: Error) => {
      if (settled) return
      settled = true
      reject(err)
    }
    stdout.on('data', onData)
    stdout.once('end', onEnd)
    stdout.once('error', onErr)
  })

  if (!parsed) {
    throw new Error('curl: internal error, headers not parsed')
  }
  const { status, headers } = parsed

  // 非流式：把剩余 body 读完聚合
  if (!input.streaming) {
    const tail: Uint8Array[] = []
    let tailLen = 0
    if (leftoverBody.length > 0) {
      tail.push(leftoverBody)
      tailLen += leftoverBody.length
    }
    await new Promise<void>((resolve, reject) => {
      stdout.on('data', (chunk: Buffer) => {
        const u8 = new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength)
        tail.push(u8)
        tailLen += u8.length
      })
      stdout.once('end', () => resolve())
      stdout.once('error', err => reject(err))
    })
    const exitCode: number = await new Promise(resolve => {
      child.once('close', code => resolve(code ?? 0))
    })
    if (exitCode !== 0 && tailLen === 0) {
      throw new Error(
        `curl exited ${exitCode} for ${input.url}: ${stderrBuf.trim() || 'unknown'}`,
      )
    }
    const all = new Uint8Array(tailLen)
    let off = 0
    for (const c of tail) {
      all.set(c, off)
      off += c.length
    }
    return makeResponseFromBytes(status, headers, all)
  }

  // 流式：把 leftoverBody + 后续 data 事件流式转发到 Web ReadableStream
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false
      const safeClose = () => {
        if (closed) return
        closed = true
        try {
          controller.close()
        } catch {
          /* 可能已 cancel */
        }
      }
      if (leftoverBody.length > 0) {
        controller.enqueue(leftoverBody)
      }
      stdout.on('data', (chunk: Buffer) => {
        if (closed) return
        controller.enqueue(
          new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength),
        )
      })
      stdout.once('end', safeClose)
      stdout.once('error', err => {
        if (closed) return
        closed = true
        try {
          controller.error(err)
        } catch {
          /* noop */
        }
      })
      child.once('close', code => {
        if (code !== 0 && !closed) {
          closed = true
          try {
            controller.error(
              new Error(
                `curl exited ${code} for ${input.url}: ${stderrBuf.trim() || 'unknown'}`,
              ),
            )
          } catch {
            /* noop */
          }
          return
        }
        safeClose()
      })
    },
    cancel() {
      try {
        child.kill('SIGTERM')
      } catch {
        /* 已退出 */
      }
    },
  })
  return makeResponseFromStream(status, headers, stream)
}

/** 路径 C：标准 fetch（Node runtime 默认）。复用 fetchWithRetry 的重试语义。 */
async function chatgptRequestViaFetch(
  input: ChatGPTBackendRequestInput,
): Promise<ChatGPTResponse> {
  const init: RequestInit = {
    method: input.method,
    headers: input.headers,
    ...(input.body !== undefined ? { body: input.body } : {}),
    ...(input.signal ? { signal: input.signal } : {}),
  }
  // Bun fetch 在 Windows 下自动读 WinHTTP 代理，无需干预；
  // Node fetch（undici）不自动读系统代理 —— 若探测到系统代理，注入 ProxyAgent dispatcher。
  const isBun = typeof (globalThis as { Bun?: unknown }).Bun !== 'undefined'
  if (!isBun) {
    const systemProxy = detectSystemProxy()
    if (systemProxy) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const undiciMod = require('undici') as typeof import('undici')
        ;(init as RequestInit & { dispatcher?: unknown }).dispatcher =
          new undiciMod.ProxyAgent(systemProxy)
      } catch {
        // undici 缺失时静默降级为无代理（Node 原生 fetch 仍会直连）
      }
    }
  }
  const resp = await fetchWithRetry(input.url, init, { maxRetries: 2 })
  // Response 本就符合 ChatGPTResponse 的最小契约
  return {
    status: resp.status,
    headers: resp.headers,
    ok: resp.ok,
    body: resp.body,
    text: () => resp.text(),
    json: () => resp.json(),
  }
}

/** 三路径分发器：按 env + runtime 选择最合适的 HTTP transport。 */
export async function chatgptBackendRequest(
  input: ChatGPTBackendRequestInput,
): Promise<ChatGPTResponse> {
  const caFile = process.env.PANDA_OAUTH_CA_FILE
  const isBun = typeof (globalThis as { Bun?: unknown }).Bun !== 'undefined'

  if (caFile) {
    return chatgptRequestViaAxiosWithCA(input, caFile)
  }
  if (isBun) {
    try {
      return await chatgptRequestViaCurl(input)
    } catch (err) {
      if (err instanceof ChatGPTCurlNotAvailableError) {
        throw new Error(
          'ChatGPT backend failed: Bun runtime 需要系统 curl（或设 PANDA_OAUTH_CA_FILE 指向 CA pem）。\n' +
            `原错误: ${err.message}`,
        )
      }
      throw err
    }
  }
  return chatgptRequestViaFetch(input)
}

// 仅测试用：允许注入/观察分发器内部状态
export const __chatgptTransportTesting = {
  parseCurlHeaderBlock,
  makeResponseFromBytes,
  makeResponseFromStream,
  nodeReadableToWeb,
  ChatGPTCurlNotAvailableError,
  detectSystemProxy,
  _resetSystemProxyCacheForTesting,
}

// ----------------------------------------------------------------------------
// fetchAvailableCodexModels —— 登录后拉真实可用 Codex 模型列表
//
// Input:  accessToken（OAuth bundle 内的 access_token），accountId（Chatgpt-Account-Id）
// Output: [{ id, label? }]  服务端返回的可用模型；任何失败一律返回 [] 让上层降级到候选列表
// Pos:    auth.ts thirdPartyLogin('openai') 完成 token 持久化后立即调用，喂给 inquirer/raw-prompt
//
// 端点（联网调研，2026-04-17）：
//   GET https://chatgpt.com/backend-api/codex/models
//   响应（参考 openai/codex/codex-rs/protocol/src/openai_models.rs）：
//     { "models": ModelInfo[] }
//     ModelInfo { slug, display_name, visibility, supported_in_api, priority, ... }
//   兼容三种 schema（实测前的兜底解析）：
//     1) { models: [...] }      ← 主流（codex 官方）
//     2) { data: [...] }        ← OpenAI v1/list 标准
//     3) [...]                  ← 顶级数组
//
// 兜底语义（任何错误 → []，**不抛**）：
//   - 401/403   token 失效 / accountId 不匹配
//   - 4xx/5xx   服务端拒绝
//   - JSON 解析失败 / 字段不识别
//   - 网络错（curl ENOENT / 代理挂 / DNS）
// ----------------------------------------------------------------------------

// 实测：endpoint 必需 query `client_version`（缺则 400 missing field），
// 与 Originator/UA 的 codex-tui/0.118.0 对齐。
const CODEX_CLIENT_VERSION = '0.118.0'
const CODEX_MODELS_URL =
  `https://chatgpt.com/backend-api/codex/models?client_version=${CODEX_CLIENT_VERSION}`

/**
 * @param accessToken OAuth bundle 的 access_token
 * @param accountId   ChatGPT 账户 id（id_token 里的 chatgpt_account_id）
 * @param opts.transport 可选：测试注入用，覆盖默认的 chatgptBackendRequest 分发器
 */
export async function fetchAvailableCodexModels(
  accessToken: string,
  accountId: string,
  opts?: {
    transport?: (input: ChatGPTBackendRequestInput) => Promise<ChatGPTResponse>
  },
): Promise<{ id: string; label?: string }[]> {
  // 必填校验：缺 token / accountId 直接降级，不发请求
  if (!accessToken || !accountId) return []

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    'Chatgpt-Account-Id': accountId,
    Originator: CODEX_ORIGINATOR,
    'User-Agent': CODEX_UA,
    Accept: 'application/json',
  }

  const transport = opts?.transport ?? chatgptBackendRequest

  let resp: ChatGPTResponse
  try {
    resp = await transport({
      url: CODEX_MODELS_URL,
      method: 'GET',
      headers,
      streaming: false,
      // 列表接口快端点 —— 30s 足够（默认 600s 太长）
      timeoutMs: 30_000,
    })
  } catch {
    // 网络层失败 → 兜底
    return []
  }

  // 任何非 2xx 一律降级（不抛）
  if (!resp.ok) return []

  let payload: unknown
  try {
    payload = await resp.json()
  } catch {
    return []
  }

  // 三种响应格式兼容解析
  const rawList = extractCodexModelArray(payload)
  if (!rawList) return []

  // 规范化为 { id, label? }，过滤明显不可用项
  // - visibility !== 'list' 的服务端会标记为隐藏，本地也跟着隐藏
  // - supported_in_api === false 的也跳过
  // - 字段缺失则尝试软兼容（其他 provider 可能用不同字段名）
  const out: { id: string; label?: string }[] = []
  for (const item of rawList) {
    if (!item || typeof item !== 'object') continue
    const obj = item as Record<string, unknown>
    const id =
      (typeof obj.slug === 'string' && obj.slug) ||
      (typeof obj.id === 'string' && obj.id) ||
      (typeof obj.model === 'string' && obj.model) ||
      (typeof obj.name === 'string' && obj.name) ||
      ''
    if (!id) continue

    // 服务端可见性过滤（codex 协议）
    const visibility = obj.visibility
    if (typeof visibility === 'string' && visibility !== 'list') continue
    if (obj.supported_in_api === false) continue

    const label =
      (typeof obj.display_name === 'string' && obj.display_name) ||
      (typeof obj.label === 'string' && obj.label) ||
      undefined

    out.push(label ? { id, label } : { id })
  }

  // 按 priority 升序（codex 协议惯例：数字小排前）；缺失 priority 视为 0
  // 但只有当至少有一项带 priority 才排，避免破坏服务端原顺序
  const hasPriority = rawList.some(
    it => it && typeof (it as Record<string, unknown>).priority === 'number',
  )
  if (hasPriority) {
    const priorityOf = (id: string): number => {
      const it = rawList.find(
        x =>
          x &&
          typeof x === 'object' &&
          ((x as Record<string, unknown>).slug === id ||
            (x as Record<string, unknown>).id === id),
      )
      const p = it && (it as Record<string, unknown>).priority
      return typeof p === 'number' ? p : 0
    }
    out.sort((a, b) => priorityOf(a.id) - priorityOf(b.id))
  }

  return out
}

/** 从未知 schema payload 提取模型数组；找不到返回 null。 */
function extractCodexModelArray(payload: unknown): unknown[] | null {
  if (Array.isArray(payload)) return payload
  if (!payload || typeof payload !== 'object') return null
  const obj = payload as Record<string, unknown>
  if (Array.isArray(obj.models)) return obj.models
  if (Array.isArray(obj.data)) return obj.data
  return null
}
