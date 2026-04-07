// Input: Model-specific API request/response formats.
// Output: Adapter layer translating between Anthropic format and third-party formats.
// Pos: Called by the routing system when an agent is routed to a non-Anthropic model.
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"

import { logForDebugging } from '../utils/debug.js'

// ─────────────────────────────────────────────────────────────
// 1. Format Adapter Interface
// ─────────────────────────────────────────────────────────────

/**
 * A FormatAdapter translates between Anthropic's API format and a
 * third-party model's format. Each adapter handles 5 dimensions:
 *
 * 1. System prompt format (Anthropic system blocks → provider format)
 * 2. Tool definitions (Anthropic tool schema → provider function schema)
 * 3. Message format (Anthropic messages → provider messages)
 * 4. Response normalization (provider response → Anthropic BetaMessage)
 * 5. Stream event normalization (provider SSE → Anthropic stream events)
 *
 * Design ref: monitor/multi-model-agent-routing-design.md §5.1-5.3
 */
export interface FormatAdapter {
  /** Adapter identifier */
  readonly name: string

  /**
   * Transform system prompt from Anthropic format to provider format.
   * Anthropic uses system as a top-level parameter; OpenAI uses a system message.
   */
  transformSystemPrompt(system: unknown): unknown

  /**
   * Transform tool definitions from Anthropic format to provider format.
   * Anthropic: { name, description, input_schema }
   * OpenAI: { type: "function", function: { name, description, parameters } }
   */
  transformTools(tools: unknown[]): unknown[]

  /**
   * Transform messages from Anthropic format to provider format.
   * Handles content blocks, tool_use, tool_result, images, etc.
   */
  transformMessages(messages: unknown[]): unknown[]

  /**
   * Normalize a non-streaming response to Anthropic BetaMessage shape.
   * Called after receiving the full response from the provider.
   */
  normalizeResponse(response: unknown): unknown

  /**
   * Normalize a streaming event to Anthropic stream event shape.
   * Called for each SSE event during streaming.
   */
  normalizeStreamEvent(event: unknown): unknown
}

// ─────────────────────────────────────────────────────────────
// 2. Anthropic Identity Adapter (no-op)
// ─────────────────────────────────────────────────────────────

/**
 * Identity adapter for Anthropic's native API — all methods pass through
 * unchanged. This is the default adapter and serves as the reference
 * implementation for other adapters.
 *
 * When the routing system selects an Anthropic model (opus/sonnet/haiku),
 * this adapter is used, adding zero overhead.
 */
export const anthropicAdapter: FormatAdapter = {
  name: 'anthropic',
  transformSystemPrompt: (system) => system,
  transformTools: (tools) => tools,
  transformMessages: (messages) => messages,
  normalizeResponse: (response) => response,
  normalizeStreamEvent: (event) => event,
}

// ─────────────────────────────────────────────────────────────
// 3. OpenAI-Compatible Adapter
// ─────────────────────────────────────────────────────────────

/**
 * Adapter for OpenAI-compatible APIs (DeepSeek, Qwen, Kimi, GLM, etc.).
 *
 * Handles the key format differences:
 * - System prompt: Anthropic top-level → OpenAI system message
 * - Tools: Anthropic input_schema → OpenAI function.parameters
 * - Messages: Anthropic content blocks → OpenAI content string/array
 * - Response: OpenAI ChatCompletion → Anthropic BetaMessage shape
 *
 * Note: Most OpenAI-compatible providers accessed via ANTHROPIC_BASE_URL
 * already get format translation from the Anthropic SDK's built-in
 * compatibility layer. This adapter is for cases where routing sends
 * requests directly to a third-party endpoint.
 *
 * Design ref: §5.3-5.5
 */
export const openaiCompatAdapter: FormatAdapter = {
  name: 'openai-compat',

  transformSystemPrompt(system: unknown): unknown {
    // Anthropic: system is a string or array of content blocks
    // OpenAI: system is a message { role: "system", content: "..." }
    if (typeof system === 'string') {
      return { role: 'system', content: system }
    }
    if (Array.isArray(system)) {
      // Concatenate text blocks
      const text = system
        .map((block: Record<string, unknown>) => {
          if (typeof block === 'string') return block
          if (block?.type === 'text') return block.text as string
          return ''
        })
        .filter(Boolean)
        .join('\n\n')
      return { role: 'system', content: text }
    }
    return system
  },

  transformTools(tools: unknown[]): unknown[] {
    // Anthropic: { name, description, input_schema: { type, properties, required } }
    // OpenAI: { type: "function", function: { name, description, parameters: { type, properties, required } } }
    return tools.map((tool: Record<string, unknown>) => {
      if (!tool || typeof tool !== 'object') return tool
      return {
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.input_schema ?? {},
        },
      }
    })
  },

  transformMessages(messages: unknown[]): unknown[] {
    // Anthropic messages have content blocks; OpenAI uses simpler format
    return messages.map((msg: Record<string, unknown>) => {
      if (!msg || typeof msg !== 'object') return msg
      const role = msg.role as string

      // Handle content blocks → string or array
      const content = msg.content
      if (Array.isArray(content)) {
        // Check for tool_use blocks (Anthropic → OpenAI function_call)
        const toolUse = content.find(
          (b: Record<string, unknown>) => b?.type === 'tool_use',
        )
        if (toolUse) {
          return {
            role: 'assistant',
            content: null,
            tool_calls: content
              .filter((b: Record<string, unknown>) => b?.type === 'tool_use')
              .map((b: Record<string, unknown>) => ({
                id: b.id,
                type: 'function',
                function: {
                  name: b.name,
                  arguments: typeof b.input === 'string'
                    ? b.input
                    : JSON.stringify(b.input),
                },
              })),
          }
        }

        // Check for tool_result blocks → OpenAI tool message
        const toolResult = content.find(
          (b: Record<string, unknown>) => b?.type === 'tool_result',
        )
        if (toolResult || msg.role === 'tool') {
          return {
            role: 'tool',
            tool_call_id: (msg as Record<string, unknown>).tool_use_id ?? (toolResult as Record<string, unknown>)?.tool_use_id,
            content: content
              .map((b: Record<string, unknown>) => {
                if (typeof b === 'string') return b
                if (b?.type === 'text') return b.text
                if (b?.type === 'tool_result') return typeof b.content === 'string' ? b.content : JSON.stringify(b.content)
                return ''
              })
              .filter(Boolean)
              .join('\n'),
          }
        }

        // Regular text content blocks → concatenated string
        const text = content
          .map((b: Record<string, unknown>) => {
            if (typeof b === 'string') return b
            if (b?.type === 'text') return b.text
            return ''
          })
          .filter(Boolean)
          .join('\n')
        return { role, content: text }
      }

      return msg
    })
  },

  normalizeResponse(response: unknown): unknown {
    // OpenAI ChatCompletion → approximate Anthropic BetaMessage shape
    const r = response as Record<string, unknown>
    if (!r || typeof r !== 'object') return response

    const choices = r.choices as Record<string, unknown>[] | undefined
    if (!choices || !Array.isArray(choices) || choices.length === 0) return response

    const choice = choices[0]
    const message = choice.message as Record<string, unknown>

    // Build Anthropic-style content blocks
    const contentBlocks: unknown[] = []

    // Tool calls → tool_use blocks
    if (message?.tool_calls && Array.isArray(message.tool_calls)) {
      for (const tc of message.tool_calls as Record<string, unknown>[]) {
        const fn = tc.function as Record<string, unknown>
        contentBlocks.push({
          type: 'tool_use',
          id: tc.id ?? `toolu_${Date.now()}`,
          name: fn?.name,
          input: typeof fn?.arguments === 'string'
            ? safeParseJSON(fn.arguments)
            : fn?.arguments ?? {},
        })
      }
    }

    // Text content
    if (message?.content && typeof message.content === 'string') {
      contentBlocks.push({ type: 'text', text: message.content })
    }

    const usage = r.usage as Record<string, unknown> | undefined
    const promptDetails = usage?.prompt_tokens_details as Record<string, unknown> | undefined
    const cachedTokens = (promptDetails?.cached_tokens as number) ?? 0
    const promptTokens = (usage?.prompt_tokens as number) ?? 0

    return {
      id: r.id ?? `msg_${Date.now()}`,
      type: 'message',
      role: 'assistant',
      content: contentBlocks,
      stop_reason: mapFinishReason(choice.finish_reason as string),
      usage: {
        input_tokens: cachedTokens > 0 ? promptTokens - cachedTokens : promptTokens,
        output_tokens: usage?.completion_tokens ?? 0,
        cache_read_input_tokens: cachedTokens,
        cache_creation_input_tokens: 0,
      },
    }
  },

  normalizeStreamEvent(event: unknown): unknown {
    // OpenAI stream chunk → approximate Anthropic stream event
    const e = event as Record<string, unknown>
    if (!e || typeof e !== 'object') return event

    const choices = e.choices as Record<string, unknown>[] | undefined
    if (!choices || choices.length === 0) return event

    const delta = (choices[0] as Record<string, unknown>).delta as Record<string, unknown>
    if (!delta) return event

    // Text delta
    if (delta.content && typeof delta.content === 'string') {
      return {
        type: 'content_block_delta',
        delta: { type: 'text_delta', text: delta.content },
      }
    }

    // Tool call delta
    if (delta.tool_calls) {
      return {
        type: 'content_block_delta',
        delta: { type: 'input_json_delta', partial_json: JSON.stringify(delta.tool_calls) },
      }
    }

    // Finish or usage-only chunk
    const finishReason = (choices[0] as Record<string, unknown>).finish_reason
    if (finishReason) {
      return {
        type: 'message_delta',
        delta: { stop_reason: mapFinishReason(finishReason as string) },
      }
    }

    // OpenAI streams emit a final chunk with usage stats and empty choices
    const streamUsage = e.usage as Record<string, unknown> | undefined
    if (streamUsage && (!choices || choices.length === 0 || !delta)) {
      const sPromptDetails = streamUsage.prompt_tokens_details as Record<string, unknown> | undefined
      const sCached = (sPromptDetails?.cached_tokens as number) ?? 0
      const sPrompt = (streamUsage.prompt_tokens as number) ?? 0
      return {
        type: 'message_delta',
        delta: { stop_reason: 'end_turn' },
        usage: {
          input_tokens: sCached > 0 ? sPrompt - sCached : sPrompt,
          output_tokens: streamUsage.completion_tokens ?? 0,
          cache_read_input_tokens: sCached,
          cache_creation_input_tokens: 0,
        },
      }
    }

    return event
  },
}

// ─────────────────────────────────────────────────────────────
// 4. Adapter Registry
// ─────────────────────────────────────────────────────────────

const adapters: Record<string, FormatAdapter> = {
  anthropic: anthropicAdapter,
  'openai-compat': openaiCompatAdapter,
  firstParty: anthropicAdapter,
  bedrock: anthropicAdapter,
  vertex: anthropicAdapter,
  foundry: anthropicAdapter,
  thirdParty: openaiCompatAdapter,
}

/**
 * Get the format adapter for a given provider.
 * Returns the identity adapter if no specific adapter exists.
 */
export function getAdapter(provider: string): FormatAdapter {
  const adapter = adapters[provider] ?? anthropicAdapter
  logForDebugging(`[routing] format adapter: ${provider} → ${adapter.name}`)
  return adapter
}

/**
 * Register a custom format adapter for a provider.
 * Useful for providers with unique formats (e.g., Gemini native API).
 */
export function registerAdapter(provider: string, adapter: FormatAdapter): void {
  adapters[provider] = adapter
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function mapFinishReason(reason: string | null | undefined): string {
  switch (reason) {
    case 'stop': return 'end_turn'
    case 'length': return 'max_tokens'
    case 'tool_calls':
    case 'function_call': return 'tool_use'
    case 'content_filter': return 'end_turn'
    default: return 'end_turn'
  }
}

function safeParseJSON(str: string): unknown {
  try {
    return JSON.parse(str)
  } catch {
    return str
  }
}
