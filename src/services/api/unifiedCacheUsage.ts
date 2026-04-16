// Input: Anthropic SDK response.usage (可能是 Anthropic/Bedrock/Vertex/DeepSeek/OpenAI/Kimi 风格)
// Output: 统一的 UnifiedCacheUsage 结构，供上层统计/展示/监控使用
// Pos: 非 Anthropic provider 的 usage 字段翻译层，对齐跨 provider 的 cache 分析

/**
 * v2.20.13 阶段E: 多 provider usage 字段统一
 *
 * 不同 provider 的 cache usage 字段命名差异：
 *   - Anthropic / Bedrock / Vertex:
 *       cache_creation_input_tokens, cache_read_input_tokens
 *   - DeepSeek:
 *       prompt_cache_hit_tokens, prompt_cache_miss_tokens
 *   - OpenAI:
 *       prompt_tokens_details.cached_tokens
 *   - Kimi (默认 endpoint):
 *       cache_creation_input_tokens=0, cache_read_input_tokens=0 (恒0)
 *       或走 prompt_tokens_details.cached_tokens
 *   - Kimi (Anthropic endpoint):
 *       与 Anthropic 一致
 *
 * 本模块将所有 provider 的字段翻译为统一的 UnifiedCacheUsage 结构。
 */

export interface UnifiedCacheUsage {
  /** 从 cache 读取的 tokens 数（命中） */
  cacheReadTokens: number
  /** 写入 cache 的 tokens 数（仅 explicit provider，DeepSeek/OpenAI 恒 0） */
  cacheWriteTokens: number
  /** 未命中的 tokens 数（注意：仅 DeepSeek 显式提供，其他 provider 需从 input 推导） */
  cacheMissTokens: number
  /** 实际新处理的 input tokens（不在 cache 里的部分） */
  freshInputTokens: number
}

type AnthropicUsage = {
  input_tokens?: number | null
  output_tokens?: number | null
  cache_creation_input_tokens?: number | null
  cache_read_input_tokens?: number | null
}

type DeepSeekUsage = {
  prompt_cache_hit_tokens?: number | null
  prompt_cache_miss_tokens?: number | null
  prompt_tokens?: number | null
}

type OpenAIUsage = {
  prompt_tokens?: number | null
  prompt_tokens_details?: {
    cached_tokens?: number | null
  } | null
}

/**
 * 从 raw usage 对象中提取统一的 cache 使用数据。
 * 智能检测 provider 风格，不需要显式传入 provider name。
 */
export function extractUnifiedCacheUsage(
  rawUsage: unknown,
): UnifiedCacheUsage {
  if (!rawUsage || typeof rawUsage !== 'object') {
    return {
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
      cacheMissTokens: 0,
      freshInputTokens: 0,
    }
  }

  const u = rawUsage as AnthropicUsage & DeepSeekUsage & OpenAIUsage

  // Anthropic / Bedrock / Vertex / Moonshot-anthropic 风格
  if (
    u.cache_read_input_tokens !== undefined ||
    u.cache_creation_input_tokens !== undefined
  ) {
    return {
      cacheReadTokens: u.cache_read_input_tokens ?? 0,
      cacheWriteTokens: u.cache_creation_input_tokens ?? 0,
      cacheMissTokens: 0, // Anthropic 不显式报告 miss
      freshInputTokens: u.input_tokens ?? 0,
    }
  }

  // DeepSeek 风格
  if (
    u.prompt_cache_hit_tokens !== undefined ||
    u.prompt_cache_miss_tokens !== undefined
  ) {
    return {
      cacheReadTokens: u.prompt_cache_hit_tokens ?? 0,
      cacheWriteTokens: 0, // DeepSeek 自动，无写入概念
      cacheMissTokens: u.prompt_cache_miss_tokens ?? 0,
      freshInputTokens: u.prompt_cache_miss_tokens ?? 0, // miss 即 fresh
    }
  }

  // OpenAI 风格 (含 prompt_tokens_details.cached_tokens)
  if (u.prompt_tokens_details?.cached_tokens !== undefined) {
    const cached = u.prompt_tokens_details.cached_tokens ?? 0
    const total = u.prompt_tokens ?? 0
    return {
      cacheReadTokens: cached,
      cacheWriteTokens: 0,
      cacheMissTokens: total - cached,
      freshInputTokens: total - cached,
    }
  }

  // 无缓存信息 — 视为全部 fresh
  return {
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    cacheMissTokens: 0,
    freshInputTokens: u.input_tokens ?? u.prompt_tokens ?? 0,
  }
}

/**
 * 计算缓存命中率（供统计面板使用）。
 * 分母 = read + write + fresh。
 */
export function computeCacheHitRate(usage: UnifiedCacheUsage): number {
  const total =
    usage.cacheReadTokens + usage.cacheWriteTokens + usage.freshInputTokens
  if (total === 0) return 0
  return usage.cacheReadTokens / total
}

/**
 * 计算等效基准 token 成本（供成本分析）。
 * Anthropic pricing:
 *   - fresh: 1.0×
 *   - cache_read: 0.1×
 *   - cache_creation (5min): 1.25×
 *   - cache_creation (1h): 2.0×
 */
export function computeEffectiveTokenCost(
  usage: UnifiedCacheUsage,
  oneHourTTL: boolean = false,
): number {
  const writeMultiplier = oneHourTTL ? 2.0 : 1.25
  return (
    usage.freshInputTokens * 1.0 +
    usage.cacheReadTokens * 0.1 +
    usage.cacheWriteTokens * writeMultiplier
  )
}
