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
