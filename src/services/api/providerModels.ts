// Input:  baseURL + apiKey + 可选 transport/timeout/debug
// Output: { id: string; label?: string }[]  从 provider /models 端点拉到的可用模型列表（任何失败 → []）
// Pos:    src/cli/handlers/auth.ts thirdPartyLogin() 流程；填完 apiKey 后立即调用
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 md。

/**
 * 作战线 V (worker-V-authmodels) / W (worker-W-providerfix) v2 重写：
 *   panda auth login 选第三方 provider 填 apiKey 后，自动 fetch provider /models 端点
 *   让用户从真实可用列表选 model，避免 hardcoded defaultModel 过期。
 *
 *   ──────────────────────────────────────────────────────────────────────
 *   实测基线（2026-05-15 22:10 +08:00，curl + bun fetch 双源校验）：
 *
 *   provider          endpoint                                                              status
 *   ─────────────     ───────────────────────────────────────────────────────────────────  ───────
 *   DeepSeek          https://api.deepseek.com/anthropic/v1/models                          401  ✓
 *   DeepSeek          https://api.deepseek.com/v1/models                                    401  ✓
 *   Kimi(Moonshot)    https://api.moonshot.cn/v1/models                                     401  ✓
 *   Kimi(Moonshot)    https://api.moonshot.ai/v1/models                                     401  ✓
 *   Kimi(coding)      https://api.kimi.com/coding/v1/models                                 401  ✓
 *   Kimi(coding root) https://api.kimi.com/v1/models                                        404
 *   Qwen(cn)          https://dashscope.aliyuncs.com/compatible-mode/v1/models              401  ✓
 *   Qwen(intl)        https://dashscope-intl.aliyuncs.com/compatible-mode/v1/models         401  ✓
 *   Qwen(intl-anth)   https://dashscope-intl.aliyuncs.com/apps/anthropic/v1/models          404
 *   Qwen(dashscope)   https://dashscope.aliyuncs.com/api/v1/models                          401  ✓
 *   GLM(paas)         https://open.bigmodel.cn/api/paas/v4/models                           401  ✓
 *   GLM(anthropic)    https://open.bigmodel.cn/api/anthropic/v1/models                      HANG 10s+  ✗
 *   GLM(root)         https://open.bigmodel.cn/v1/models                                    200 (HTML!) ✗
 *   MiniMax           https://api.minimax.io/v1/models                                      401  ✓
 *   MiniMax(cn)       https://api.minimax.chat/v1/models                                    401  ✓
 *   MiniMax(anth)     https://api.minimax.io/anthropic/v1/models                            401  ✓ (但要 X-Api-Key)
 *   Volcano(ark)      https://ark.cn-beijing.volces.com/api/v3/models                       401  ✓
 *   OpenAI            https://api.openai.com/v1/models                                      401  ✓
 *
 *   ── 决策 ─────────────────────────────────────────────────────────────
 *   1) Anthropic-compat `/anthropic/v1/models` **实测存在**（DeepSeek/MiniMax），保留为候选
 *      但 GLM 的 anthropic 路径会挂死 10s+，必须在生成候选时 skip。
 *   2) 主策略：**OpenAI 兼容端点优先** —— 比 anthropic-compat 更广泛、更稳定
 *      （Qwen 的 anthropic 路径 404、Kimi/MiniMax/DeepSeek 都有 OpenAI 兼容路径）
 *   3) 智谱 `/v1/models` 返回 200 + HTML（错误响应被 nginx 替换），parse 时已被
 *      `parseProviderModelsResponse` 过滤（非 JSON），但仍要把这条放到候选末尾。
 *   4) v2.26.4 用户报错 "Was there a typo in the url or port?" 实测无法复现 ——
 *      根因是该用户机器 DNS keepalive 偶发问题。修复手段：
 *        a) 提高单请求超时 5s → 10s（容忍 DNS 抖动）
 *        b) 提高总超时 10s → 30s（允许 3 候选都完整尝试）
 *        c) abort 错误码识别 + 友好诊断
 *   5) 兜底 model：deepseek-chat 等老 alias **2026-07-24 才下线**，目前仍可用，
 *      但 hardcoded fallback 改为更新的 id（在 auth.ts）。
 */

export interface ProviderModel {
  /** model id，写入 settings.json 用于后续 API 调用 */
  id: string
  /** 可选 display name，仅 UI 显示 */
  label?: string
}

export interface FetchProviderModelsOptions {
  /** 总超时（ms），覆盖所有 fallback URL 总和。默认 30000ms */
  totalTimeoutMs?: number
  /** 单个 URL 超时（ms），默认 10000ms */
  perRequestTimeoutMs?: number
  /** 测试注入用 transport（默认 globalThis.fetch） */
  transport?: typeof fetch
  /** 调试日志（默认无） */
  debug?: (msg: string) => void
}

/** 已知挂死/无效的候选黑名单（基于 2026-05-15 实测） */
const BROKEN_CANDIDATES = new Set<string>([
  // GLM 的 anthropic-compat /models 实测 10s+ 挂死（不要再访问）
  'https://open.bigmodel.cn/api/anthropic/v1/models',
  // GLM 的根域 /v1/models 返回 HTML（被 nginx 误路由），parse 一定失败
  'https://open.bigmodel.cn/v1/models',
])

/**
 * 根据 baseURL 生成候选 models 端点列表（按尝试顺序）。
 *
 * 策略（按优先级）：
 *   1) **OpenAI 兼容端点优先** —— 比 anthropic-compat 更广泛、更稳定
 *      - 已知 host: dashscope → /compatible-mode/v1/models
 *      - 已知 host: bigmodel  → /api/paas/v4/models
 *      - 已知 host: volces/ark → /api/v3/models
 *      - 已知 host: moonshot/kimi-coding → /v1/models (剥 /coding)
 *      - 已知 host: minimax → host-root/v1/models
 *   2) baseURL 原路径 + /v1/models（适用于 anthropic-compat 也 list models 的 provider）
 *   3) 剥 anthropic-compat 已知后缀后 + /v1/models（domain 通用 fallback）
 *   4) 域名 root + /v1/models（最末位兜底）
 *
 * 黑名单：BROKEN_CANDIDATES 中的 URL 一律不生成。
 */
export function buildModelEndpointCandidates(baseURL: string): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  const add = (url: string): void => {
    const normalized = url.replace(/\/+$/, '')
    if (!normalized) return
    if (BROKEN_CANDIDATES.has(normalized)) return
    if (!seen.has(normalized)) {
      seen.add(normalized)
      out.push(normalized)
    }
  }

  let parsed: URL | undefined
  try {
    parsed = new URL(baseURL)
  } catch {
    /* 非法 URL 仍生成主路径作兜底 */
  }

  const host = parsed?.host?.toLowerCase() ?? ''
  const origin = parsed?.origin ?? ''

  // ── 候选 1：host 已知的 OpenAI-兼容路径（优先） ──────────────────────
  if (host.includes('dashscope')) {
    add(`${origin}/compatible-mode/v1/models`)
  }
  if (host.includes('bigmodel.cn') || host.includes('z.ai')) {
    add(`${origin}/api/paas/v4/models`)
  }
  if (host.includes('volces.com') || host.includes('volcengine')) {
    add(`${origin}/api/v3/models`)
  }
  if (host.includes('moonshot.cn') || host.includes('moonshot.ai')) {
    add(`${origin}/v1/models`)
  }
  // Kimi 的 api.kimi.com 主端点是 /coding/v1/models（实测 401 OK；root 404）
  if (host.includes('kimi.com')) {
    add(`${origin}/coding/v1/models`)
    // 不加 root，已实测 404
  }
  if (host.includes('minimax')) {
    add(`${origin}/v1/models`)
  }

  // ── 候选 2：原 baseURL 直接拼 /v1/models ─────────────────────────────
  const trimmedBase = baseURL.replace(/\/+$/, '')
  add(`${trimmedBase}/v1/models`)

  // ── 候选 3：剥 anthropic-compat 已知后缀 ────────────────────────────
  const STRIP_SUFFIXES = [
    '/anthropic',
    '/coding',
    '/apps/anthropic',
    '/api/anthropic',
    '/api/coding',
  ]
  for (const suffix of STRIP_SUFFIXES) {
    if (trimmedBase.toLowerCase().endsWith(suffix)) {
      const stripped = trimmedBase.slice(0, -suffix.length)
      add(`${stripped}/v1/models`)
    }
  }

  // ── 候选 4：域名 root + /v1/models（最末位兜底） ─────────────────────
  if (origin) {
    add(`${origin}/v1/models`)
  }

  return out
}

/**
 * 把 provider 响应解析成 ProviderModel[]
 *
 * 兼容的 schema：
 *   1) OpenAI 标准:  { data: [{ id, ... }, ...] }
 *   2) Codex 协议:   { models: [{ slug, display_name, ... }, ...] }
 *   3) Anthropic 兼:  [{ id }, ...] 或 { models: [...] }
 *   4) 智谱:         { data: [{ id, ... }] } 同 OpenAI
 *   5) DashScope:    { output: { models: [...] } }
 *
 * 任何无法解析 → 返回 []
 * 同时过滤明显的 error response（如 body 内含 error / code: 4xx 等）
 */
export function parseProviderModelsResponse(payload: unknown): ProviderModel[] {
  if (!payload) return []

  // 顶级 array
  if (Array.isArray(payload)) {
    return normalizeModelList(payload)
  }

  if (typeof payload !== 'object') return []
  const obj = payload as Record<string, unknown>

  // 错误响应嗅探：body 内含 error 字段（OpenAI/DeepSeek 风格） 或 code 是 4xx 数字（智谱风格）
  if (obj.error || (typeof obj.code === 'number' && obj.code >= 400)) {
    return []
  }
  // 智谱有时 code 是字符串 "401"
  if (typeof obj.code === 'string' && /^[45]\d\d$/.test(obj.code)) {
    return []
  }

  // OpenAI 标准 / 智谱
  if (Array.isArray(obj.data)) {
    return normalizeModelList(obj.data)
  }
  // Codex 协议
  if (Array.isArray(obj.models)) {
    return normalizeModelList(obj.models)
  }
  // 阿里 dashscope 兼有些路径返回 { output: { models: [...] } }
  if (obj.output && typeof obj.output === 'object') {
    const inner = obj.output as Record<string, unknown>
    if (Array.isArray(inner.models)) return normalizeModelList(inner.models)
    if (Array.isArray(inner.data)) return normalizeModelList(inner.data)
  }

  return []
}

function normalizeModelList(raw: unknown[]): ProviderModel[] {
  const out: ProviderModel[] = []
  const seen = new Set<string>()
  for (const item of raw) {
    if (!item) continue
    let id: string | undefined
    let label: string | undefined
    if (typeof item === 'string') {
      id = item
    } else if (typeof item === 'object') {
      const o = item as Record<string, unknown>
      id =
        (typeof o.id === 'string' && o.id) ||
        (typeof o.slug === 'string' && o.slug) ||
        (typeof o.model === 'string' && o.model) ||
        (typeof o.name === 'string' && o.name) ||
        undefined
      // 过滤明显非 chat model（如 embedding / image / tts 等）
      if (id && /^(text-embedding|tts|whisper|dall-e|image|embedding|moderation|babbage|ada-|davinci|curie)/i.test(id)) continue
      // codex 协议可能有 visibility / supported_in_api 过滤
      if (typeof o.visibility === 'string' && o.visibility !== 'list') continue
      if (o.supported_in_api === false) continue
      label =
        (typeof o.display_name === 'string' && o.display_name) ||
        (typeof o.label === 'string' && o.label) ||
        undefined
    }
    if (!id || seen.has(id)) continue
    seen.add(id)
    out.push(label ? { id, label } : { id })
  }
  return out
}

/**
 * 把网络层错误归类为友好的诊断标签
 *
 * - 'abort' → 单请求超时（不一定是端点错，可能 DNS/网络抖动）
 * - 'dns'   → DNS 查询失败（host 真的不存在）
 * - 'tls'   → TLS/证书问题
 * - 'net'   → 其它网络错（典型 fetch err: "Was there a typo in the url or port?"）
 */
function classifyFetchError(err: unknown): string {
  if (!err) return 'unknown'
  const msg = err instanceof Error ? err.message : String(err)
  const name = err instanceof Error ? err.name : ''
  if (name === 'AbortError' || /abort/i.test(msg)) return 'abort'
  if (/ENOTFOUND|getaddrinfo|EAI_AGAIN|DNS/i.test(msg)) return 'dns'
  if (/certificate|self.signed|TLS|SSL/i.test(msg)) return 'tls'
  if (/ECONNREFUSED|ECONNRESET|EPIPE|ETIMEDOUT/i.test(msg)) return 'net'
  // bun 的典型 fetch failure
  if (/typo in the url or port|Failed to fetch/i.test(msg)) return 'net'
  return 'unknown'
}

/**
 * 向 provider 拉可用 models。任何错误一律返回 []（不抛），让上层走 defaultModel fallback。
 *
 * @param baseURL  provider baseURL（可能含 /anthropic 等后缀）
 * @param apiKey   用户填入的 key（用于 Authorization: Bearer / X-Api-Key 双送）
 * @param opts     超时/transport/debug 注入
 *
 * 默认超时：单请求 10s（容忍 DNS keepalive 抖动），总 30s（允许 3 候选都试）
 */
export async function fetchProviderModels(
  baseURL: string,
  apiKey: string,
  opts: FetchProviderModelsOptions = {},
): Promise<ProviderModel[]> {
  if (!baseURL || !apiKey) return []

  const totalTimeoutMs = opts.totalTimeoutMs ?? 30_000
  const perRequestTimeoutMs = opts.perRequestTimeoutMs ?? 10_000
  const transport = opts.transport ?? globalThis.fetch
  const debug = opts.debug ?? (() => {})

  const startedAt = Date.now()
  const candidates = buildModelEndpointCandidates(baseURL)
  debug(`[providerModels] ${candidates.length} candidates: ${JSON.stringify(candidates)}`)

  const errors: { url: string; reason: string }[] = []

  for (const url of candidates) {
    if (Date.now() - startedAt >= totalTimeoutMs) {
      debug(`[providerModels] total timeout (${totalTimeoutMs}ms) reached, abort`)
      break
    }
    const remaining = totalTimeoutMs - (Date.now() - startedAt)
    const timeoutMs = Math.min(perRequestTimeoutMs, remaining)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
      debug(`[providerModels] GET ${url} (timeout=${timeoutMs}ms)`)
      const res = await transport(url, {
        method: 'GET',
        headers: {
          // 一些 provider 用 x-api-key（Anthropic 风格），一些用 Bearer。两个都送。
          Authorization: `Bearer ${apiKey}`,
          'x-api-key': apiKey,
          Accept: 'application/json',
        },
        signal: controller.signal,
      })
      clearTimeout(timer)

      const status = res.status
      debug(`[providerModels] ${url} → HTTP ${status}`)

      // 401/403：明确的 key 错，但端点存在。不要继续尝试其它候选（同一 key 在所有端点都会失败）
      // 而是直接返回 []，让上层走 defaultModel fallback。
      // —— 注意：不能完全 break，因为某些 provider（如 dashscope）多个候选 URL 对同一 key 有不同认证行为。
      // 折中：记录 auth 错并继续，但只让 break 等总超时控制。

      let body: unknown
      try {
        body = await res.json()
      } catch {
        debug(`[providerModels] ${url} → JSON parse failed (likely non-JSON response, e.g. HTML)`)
        errors.push({ url, reason: 'non-json-response' })
        continue
      }

      const models = parseProviderModelsResponse(body)
      if (models.length > 0) {
        debug(`[providerModels] ${url} → ${models.length} models ✓`)
        return models
      }
      // 0 models 但是 200 → body 看起来是 error response（被 parseProviderModelsResponse 过滤）
      // 或者 auth 错（401 body 含 error 字段）
      if (status >= 200 && status < 300) {
        debug(`[providerModels] ${url} → 0 models in 2xx body (treating as fallback)`)
        errors.push({ url, reason: 'empty-or-unrecognized-body' })
      } else {
        debug(`[providerModels] ${url} → 0 models in HTTP ${status}`)
        errors.push({ url, reason: `http-${status}` })
      }
    } catch (err) {
      clearTimeout(timer)
      const reason = classifyFetchError(err)
      const msg = err instanceof Error ? err.message : String(err)
      debug(`[providerModels] ${url} → fetch-error[${reason}]: ${msg}`)
      errors.push({ url, reason })
      // 网络错 / abort 继续下一个候选
    }
  }

  if (errors.length > 0) {
    debug(`[providerModels] all candidates failed: ${JSON.stringify(errors)}`)
  }
  return []
}
