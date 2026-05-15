// Input:  baseURL + apiKey + 可选 transport
// Output: { id: string; label?: string }[]  从 provider /v1/models 端点拉到的可用模型列表（任何失败 → []）
// Pos:    src/cli/handlers/auth.ts thirdPartyLogin() 流程；填完 apiKey 后立即调用
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 md。

/**
 * 作战线 V (worker-V-authmodels)：
 *   panda auth login 选第三方 provider 填 apiKey 后，自动 fetch `<baseURL>/v1/models`
 *   让用户从真实可用列表选 model，避免 hardcoded defaultModel 过期。
 *
 *   实测（2026-05-15 21:33 +08:00，curl 联网校验）：
 *   - DeepSeek `https://api.deepseek.com/anthropic/v1/models`  → 401（端点存在，需 auth）
 *   - DeepSeek `https://api.deepseek.com/v1/models`            → 401（同上）
 *   - Qwen   `https://dashscope-intl.aliyuncs.com/apps/anthropic/v1/models` → 404
 *   - Qwen   `https://dashscope-intl.aliyuncs.com/compatible-mode/v1/models` → 401（OpenAI 兼容路径）
 *   - GLM    `https://open.bigmodel.cn/api/anthropic/v1/models` → HTTP 200 但 body { code: 401 }
 *   - Kimi   `https://api.kimi.com/coding/v1/models`           → 401（端点存在）
 *   - MiniMax/Volcano/OpenAI 类似
 *
 *   ↑ 所以 fallback 策略必需：先试 baseURL/v1/models；若失败（404/parse 失败/无 model 字段）
 *     再试候选 URL（剥 /anthropic /coding /apps/anthropic 后缀 + 域名 root + 特殊 compatible-mode）
 */

export interface ProviderModel {
  /** model id，写入 settings.json 用于后续 API 调用 */
  id: string
  /** 可选 display name，仅 UI 显示 */
  label?: string
}

export interface FetchProviderModelsOptions {
  /** 总超时（ms），覆盖所有 fallback URL 总和。默认 10000ms */
  totalTimeoutMs?: number
  /** 单个 URL 超时（ms），默认 5000ms */
  perRequestTimeoutMs?: number
  /** 测试注入用 transport（默认 globalThis.fetch） */
  transport?: typeof fetch
  /** 调试日志（默认无） */
  debug?: (msg: string) => void
}

/**
 * 根据 baseURL 生成候选 models 端点列表（按尝试顺序）。
 *
 * 规则（按命中先后）：
 *   1) <baseURL>/v1/models —— 默认主路径
 *   2) 剥已知 anthropic-compat 后缀 (/anthropic, /coding, /apps/anthropic, /api/anthropic, /api/coding) 后 + /v1/models
 *   3) 域名 root + /v1/models
 *   4) dashscope 特殊：root + /compatible-mode/v1/models
 *   5) zhipu/bigmodel 特殊：root + /api/paas/v4/models
 *
 * 不依赖 provider key —— 只看 baseURL host + path 即可。
 */
export function buildModelEndpointCandidates(baseURL: string): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  const add = (url: string): void => {
    const normalized = url.replace(/\/+$/, '')
    if (!seen.has(normalized)) {
      seen.add(normalized)
      out.push(normalized)
    }
  }

  // 主路径：原 baseURL 直接拼 /v1/models
  const trimmedBase = baseURL.replace(/\/+$/, '')
  add(`${trimmedBase}/v1/models`)

  // 候选 2：剥 anthropic-compat 已知后缀
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

  // 候选 3：域名 root + /v1/models
  let url: URL
  try {
    url = new URL(baseURL)
  } catch {
    return out
  }
  add(`${url.origin}/v1/models`)

  // 候选 4：dashscope 特殊
  if (url.host.includes('dashscope')) {
    add(`${url.origin}/compatible-mode/v1/models`)
  }

  // 候选 5：智谱 bigmodel 特殊
  if (url.host.includes('bigmodel.cn')) {
    add(`${url.origin}/api/paas/v4/models`)
  }

  // 候选 6：volcano ark
  if (url.host.includes('volces.com') || url.host.includes('volcengine')) {
    add(`${url.origin}/api/v3/models`)
  }

  return out
}

/**
 * 把 provider 响应解析成 ProviderModel[]
 *
 * 三种 schema 都吃：
 *   1) OpenAI 标准:  { data: [{ id, ... }, ...] }
 *   2) Codex 协议:   { models: [{ slug, display_name, ... }, ...] }
 *   3) Anthropic 兼:  [{ id }, ...] 或 { models: [...] }
 *   4) 智谱:         { data: [{ id, ... }] } 同 OpenAI
 *
 * 任何无法解析 → 返回 []
 *
 * 同时过滤明显的 error response（如 body 内含 `error` / `code: 401` 等）
 */
export function parseProviderModelsResponse(payload: unknown): ProviderModel[] {
  if (!payload) return []

  // 顶级 array
  if (Array.isArray(payload)) {
    return normalizeModelList(payload)
  }

  if (typeof payload !== 'object') return []
  const obj = payload as Record<string, unknown>

  // 错误响应嗅探：body 内含 `error` 字段（OpenAI/DeepSeek 风格） 或 `code` 是 4xx 数字（智谱风格）
  if (obj.error || (typeof obj.code === 'number' && obj.code >= 400)) {
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
      if (id && /^(text-embedding|tts|whisper|dall-e|image|embedding)/i.test(id)) continue
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
 * 向 provider 拉可用 models。任何错误一律返回 []（不抛），让上层走 defaultModel fallback。
 *
 * @param baseURL  provider baseURL（可能含 /anthropic 等后缀）
 * @param apiKey   用户填入的 key（用于 Authorization: Bearer）
 * @param opts     超时/transport/debug 注入
 */
export async function fetchProviderModels(
  baseURL: string,
  apiKey: string,
  opts: FetchProviderModelsOptions = {},
): Promise<ProviderModel[]> {
  if (!baseURL || !apiKey) return []

  const totalTimeoutMs = opts.totalTimeoutMs ?? 10_000
  const perRequestTimeoutMs = opts.perRequestTimeoutMs ?? 5_000
  const transport = opts.transport ?? globalThis.fetch
  const debug = opts.debug ?? (() => {})

  const startedAt = Date.now()
  const candidates = buildModelEndpointCandidates(baseURL)
  debug(`[providerModels] candidates: ${JSON.stringify(candidates)}`)

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

      // 4xx auth 错误（401/403）一般意味着 key 错而不是 endpoint 错。
      // 此时继续 fallback URL 也没意义（同一 key），但试一下也不会更差 —— 让 fallback 继续
      // 真正过滤：404 / 5xx 必 fallback

      let body: unknown
      try {
        body = await res.json()
      } catch {
        debug(`[providerModels] ${url} → JSON parse failed`)
        continue
      }

      const models = parseProviderModelsResponse(body)
      if (models.length > 0) {
        debug(`[providerModels] ${url} → ${models.length} models`)
        return models
      }
      debug(`[providerModels] ${url} → 0 models (try fallback)`)
    } catch (err) {
      clearTimeout(timer)
      debug(`[providerModels] ${url} → error: ${err instanceof Error ? err.message : String(err)}`)
      // 网络错 / abort 继续下一个候选
    }
  }

  return []
}
