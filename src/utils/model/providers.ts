import type { AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS } from '../../services/analytics/index.js'
import { isEnvTruthy } from '../envUtils.js'

export type APIProvider = 'firstParty' | 'bedrock' | 'vertex' | 'foundry'

export function getAPIProvider(): APIProvider {
  return isEnvTruthy(process.env.CLAUDE_CODE_USE_BEDROCK)
    ? 'bedrock'
    : isEnvTruthy(process.env.CLAUDE_CODE_USE_VERTEX)
      ? 'vertex'
      : isEnvTruthy(process.env.CLAUDE_CODE_USE_FOUNDRY)
        ? 'foundry'
        : 'firstParty'
}

export function getAPIProviderForStatsig(): AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS {
  return getAPIProvider() as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
}

/**
 * Check if ANTHROPIC_BASE_URL points to a third-party (non-Anthropic) API provider.
 * Returns true when a custom base URL is set that does NOT point to anthropic.com.
 * Used to skip Anthropic-specific behaviors (beta headers, telemetry, domain checks)
 * when routing through DeepSeek/Kimi/Qwen/MiniMax/GLM/火山引擎 etc.
 */
export function isThirdPartyProvider(): boolean {
  return !isFirstPartyAnthropicBaseUrl()
}

/**
 * Check if ANTHROPIC_BASE_URL is a first-party Anthropic API URL.
 * Returns true if not set (default API) or points to api.anthropic.com
 * (or api-staging.anthropic.com for ant users).
 */
export function isFirstPartyAnthropicBaseUrl(): boolean {
  const baseUrl = process.env.ANTHROPIC_BASE_URL
  if (!baseUrl) {
    return true
  }
  try {
    const host = new URL(baseUrl).host
    const allowedHosts = ['api.anthropic.com']
    if (process.env.USER_TYPE === 'ant') {
      allowedHosts.push('api-staging.anthropic.com')
    }
    return allowedHosts.includes(host)
  } catch {
    return false
  }
}

/**
 * v2.20.13 阶段D: 多 provider 缓存策略分类
 *
 * - 'explicit': 需要 Anthropic 风格 cache_control 标记才能缓存
 *   (Anthropic 直连 / Bedrock / Vertex / Moonshot Anthropic endpoint)
 *
 * - 'implicit': provider 自动处理缓存，**cache_control 会被忽略或引发问题**
 *   不应该插入 cache_control 标记
 *   (DeepSeek / OpenAI / Kimi 默认 endpoint / Grok / Qwen 等)
 *
 * - 'none': 完全不支持缓存（少见，一般用 implicit 兜底）
 */
export type CacheStrategy = 'explicit' | 'implicit' | 'none'

/**
 * Hosts 识别：已知支持 Anthropic cache_control 协议的第三方 endpoint
 */
const EXPLICIT_CACHE_THIRD_PARTY_HOSTS = new Set([
  'api.moonshot.ai',  // Moonshot anthropic compat: api.moonshot.ai/anthropic
  'api.minimax.io',   // Minimax Anthropic compat: api.minimax.io/anthropic (TTL 5m only, 1.25x write / 0.1x read — per official docs 2026-04)
  // 注意：GLM/智谱官方不支持 cache_control，即使用 /api/anthropic 路径也仅走隐式缓存，维持在 IMPLICIT 列表
])

/**
 * Hosts 识别：已知不支持 cache_control（走自动隐式缓存）
 */
const IMPLICIT_CACHE_THIRD_PARTY_HOSTS = new Set([
  'api.deepseek.com',
  'api.openai.com',
  'api.groq.com',
  'api.x.ai',  // Grok
  'dashscope.aliyuncs.com',  // Qwen
  'open.bigmodel.cn',  // GLM/智谱 — 仅隐式自动缓存，50% 折扣，不读 cache_control（provider 层天花板）
  'api.z.ai',  // Z.ai — GLM 国际镜像，同 open.bigmodel.cn
  // Wave 7 新增 (Sigma + Tau 调研)：
  'ark.cn-beijing.volces.com',  // 火山引擎 Ark — 字节跳动，自动隐式缓存
  'dashscope-intl.aliyuncs.com',  // 阿里云 DashScope 国际版 Qwen — 走 /apps/anthropic 但每次 full re-process (Tau 实测)
  'api.moonshot.cn',  // Moonshot 国内版 — 与 api.moonshot.ai 并存，保守 IMPLICIT (若开 /anthropic 待 PM 后续验证切 EXPLICIT)
  'platform.kimi.ai',  // Moonshot 品牌迁移后的新域名 — 保守 IMPLICIT
])

export function getCacheStrategy(): CacheStrategy {
  const provider = getAPIProvider()
  // firstParty / bedrock / vertex / foundry 都是 explicit (Anthropic 兼容)
  if (provider !== 'firstParty') return 'explicit'

  const baseUrl = process.env.ANTHROPIC_BASE_URL
  if (!baseUrl) return 'explicit'  // 默认直连

  try {
    const url = new URL(baseUrl)
    const host = url.host

    // Anthropic 直连
    if (host === 'api.anthropic.com' || host === 'api-staging.anthropic.com') {
      return 'explicit'
    }

    // Moonshot 的 Anthropic endpoint: /anthropic pathname
    if (EXPLICIT_CACHE_THIRD_PARTY_HOSTS.has(host) && url.pathname.includes('anthropic')) {
      return 'explicit'
    }

    // 已知隐式缓存 provider
    if (IMPLICIT_CACHE_THIRD_PARTY_HOSTS.has(host)) {
      return 'implicit'
    }

    // 未知第三方 — 保守起见走 implicit (避免插入 cache_control 导致 API 报错)
    return 'implicit'
  } catch {
    return 'explicit'  // BASE_URL parse 失败，保守走 explicit
  }
}
