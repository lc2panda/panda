// Input: 任意来自 SDK 的 raw usage（可能 null / 缺字段 / 非 number）
// Output: { input_tokens, output_tokens, cache_creation_input_tokens, cache_read_input_tokens } 全为 number 且非空
// Pos: usage 字段 null-safe wrapper — Mac CLI v2.25.x P0 hotfix 的统一兜底入口
//
// [NEW-FILE:#W13-04]
// 设计目标：W13-T3 — 提供 safeUsage(rawUsage) helper，让所有读 usage.X 的下游
// 即便上游 raw 为 null / 缺 input_tokens / 缺 output_tokens（首次启动 / 无 API call /
// streaming 中途断流），也能返回结构稳定的 number-only object，避免
// "TypeError: null is not an object (evaluating 'usage.input_tokens')"。
//
// 使用方式：
//   import { safeUsage } from './usage-safe.js'
//   const u = safeUsage(rawUsage)
//   const total = u.input_tokens + u.output_tokens
//
// 一旦我被修改，请更新 utils/README.md（如果存在）。

export interface SafeUsage {
  input_tokens: number
  output_tokens: number
  cache_creation_input_tokens: number
  cache_read_input_tokens: number
}

/**
 * 把任意 raw usage（包含 null / undefined / 缺字段 / 非 number）规范化为 SafeUsage。
 * 任何字段缺失或非 finite number 一律 fallback 0。
 *
 * 设计原则：
 *   - 永不抛错（即便 raw 是 string / number / array / Date 等异常输入）
 *   - 返回新对象（immutable，不污染上游 raw）
 *   - 字段缺省值统一 0（与 Anthropic SDK BetaUsage 语义一致：cache 字段缺省视为 0）
 */
export function safeUsage(raw: unknown): SafeUsage {
  if (raw === null || raw === undefined || typeof raw !== 'object') {
    return {
      input_tokens: 0,
      output_tokens: 0,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 0,
    }
  }
  const r = raw as Record<string, unknown>
  return {
    input_tokens: toNum(r.input_tokens),
    output_tokens: toNum(r.output_tokens),
    cache_creation_input_tokens: toNum(r.cache_creation_input_tokens),
    cache_read_input_tokens: toNum(r.cache_read_input_tokens),
  }
}

function toNum(v: unknown): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string') {
    const n = Number(v)
    return Number.isFinite(n) ? n : 0
  }
  return 0
}

/**
 * 计算 usage 总 token 数（input + output + cache_create + cache_read）。
 * 等价于既有 getTokenCountFromUsage，但 null-safe。
 */
export function safeUsageTotal(raw: unknown): number {
  const u = safeUsage(raw)
  return (
    u.input_tokens +
    u.output_tokens +
    u.cache_creation_input_tokens +
    u.cache_read_input_tokens
  )
}
