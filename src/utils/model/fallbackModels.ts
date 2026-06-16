// Input:  --fallback-model 的逐次 Commander 取值（字符串，可含逗号分隔）+ 已累积数组
// Output: 有序、去重、上限 MAX_FALLBACK_MODELS 的回退模型列表
// Pos:    波次1 项3（上游 166+178）— --fallback-model 收多值（≤3 有序）解析器

/**
 * Maximum number of ordered fallback models accepted via --fallback-model.
 */
export const MAX_FALLBACK_MODELS = 3

/**
 * Commander custom parser for --fallback-model. Accepts the flag repeated and/or
 * a single comma-separated value, accumulating an ordered, de-duplicated list of
 * fallback models capped at MAX_FALLBACK_MODELS. The first element is used as the
 * primary fallback for backward compatibility; the full list drives the ordered
 * fallback chain on repeated overloads.
 *
 * @param value    The raw value from one occurrence of the flag (may be a
 *                 comma-separated list).
 * @param previous The accumulator from prior occurrences (Commander passes this).
 */
export function collectFallbackModels(
  value: string,
  previous: string[] | undefined,
): string[] {
  const acc = previous ?? []
  const incoming = value
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0)
  for (const model of incoming) {
    if (acc.length >= MAX_FALLBACK_MODELS) break
    if (!acc.includes(model)) acc.push(model)
  }
  return acc
}
