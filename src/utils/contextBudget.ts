// Input: 待注入的各类上下文内容（claudeMd, memoryIndex, gitContext 等）
// Output: 按预算裁剪后的内容 Record<string, string>
// Pos: context.ts 上下文组装层，控制 context window 使用率
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"

/**
 * 快速 token 估算（不依赖外部 tokenizer）
 * 中文: ~0.6 tok/char, 英文: ~0.25 tok/word
 * 简化: ~0.4 tok/char (混合内容平均值)
 */
export function estimateTokens(text: string): number {
  if (!text) return 0
  // Count CJK characters (higher token density)
  let cjkChars = 0
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    if (
      (code >= 0x4e00 && code <= 0x9fff) || // CJK Unified
      (code >= 0x3000 && code <= 0x303f) || // CJK Punctuation
      (code >= 0xff00 && code <= 0xffef)    // Fullwidth Forms
    ) {
      cjkChars++
    }
  }
  const nonCjkChars = text.length - cjkChars
  // CJK: ~0.6 tok/char, non-CJK: ~0.3 tok/char
  return Math.ceil(cjkChars * 0.6 + nonCjkChars * 0.3)
}

/**
 * 上下文预算分配配置
 */
export interface BudgetAllocation {
  min: number
  max: number
  priority: number // 1 = highest
}

export interface BudgetConfig {
  totalBudget: number
  allocations: Record<string, BudgetAllocation>
}

export const DEFAULT_BUDGET: BudgetConfig = {
  totalBudget: 4000,
  allocations: {
    claudeMd:        { min: 500,  max: 2000, priority: 1 },
    sessionSummary:  { min: 0,    max: 500,  priority: 2 },
    memoryIndex:     { min: 0,    max: 300,  priority: 3 },
    gitContext:       { min: 0,    max: 400,  priority: 4 },
    workingMemory:   { min: 0,    max: 300,  priority: 5 },
    morningBrief:    { min: 0,    max: 200,  priority: 6 },
  },
}

/**
 * 截断文本到指定 token 上限
 * 保留开头部分（按行边界截断），末尾附加截断提示
 */
export function truncateToTokenBudget(text: string, maxTokens: number): string {
  if (!text) return text
  const estimated = estimateTokens(text)
  if (estimated <= maxTokens) return text

  const lines = text.split('\n')
  let accumulated = 0
  let cutIndex = 0

  for (let i = 0; i < lines.length; i++) {
    const lineTokens = estimateTokens(lines[i]!)
    if (accumulated + lineTokens > maxTokens) {
      break
    }
    accumulated += lineTokens
    cutIndex = i + 1
  }

  // Always keep at least the first line
  if (cutIndex === 0) cutIndex = 1

  const kept = lines.slice(0, cutIndex).join('\n')
  const remainingTokens = estimated - accumulated
  return `${kept}\n... (truncated, ~${remainingTokens} more tokens)`
}

/**
 * 按优先级分配预算，超预算时从低优先级开始截断
 *
 * 算法:
 * 1. 先为每个 slot 分配 min tokens
 * 2. 剩余预算按优先级从高到低分配，直到 max 或预算耗尽
 * 3. 对超预算的 slot 进行截断
 */
export function allocateBudget(
  contents: Record<string, string>,
  config: BudgetConfig = DEFAULT_BUDGET,
): Record<string, string> {
  const { totalBudget, allocations } = config
  const result: Record<string, string> = {}

  // 计算每个 slot 的实际 token 数
  type SlotInfo = {
    key: string
    content: string
    tokens: number
    allocation: BudgetAllocation
    granted: number
  }

  const slots: SlotInfo[] = []
  for (const [key, content] of Object.entries(contents)) {
    if (!content) continue
    const alloc = allocations[key]
    if (!alloc) {
      // 无预算配置的 slot，直接保留原始内容
      result[key] = content
      continue
    }
    slots.push({
      key,
      content,
      tokens: estimateTokens(content),
      allocation: alloc,
      granted: 0,
    })
  }

  // 按优先级排序（数字小 = 高优先级）
  slots.sort((a, b) => a.allocation.priority - b.allocation.priority)

  // Phase 1: 分配 min
  let remaining = totalBudget
  for (const slot of slots) {
    const minGrant = Math.min(slot.allocation.min, slot.tokens)
    slot.granted = minGrant
    remaining -= minGrant
  }

  // Phase 2: 按优先级分配剩余预算
  for (const slot of slots) {
    if (remaining <= 0) break
    const want = Math.min(slot.tokens, slot.allocation.max) - slot.granted
    if (want <= 0) continue
    const grant = Math.min(want, remaining)
    slot.granted += grant
    remaining -= grant
  }

  // Phase 3: 应用截断
  for (const slot of slots) {
    if (slot.tokens <= slot.granted) {
      result[slot.key] = slot.content
    } else {
      result[slot.key] = truncateToTokenBudget(slot.content, slot.granted)
    }
  }

  return result
}
