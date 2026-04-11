// Input: 文件名(basename或完整路径) + 内容字符串
// Output: 是否超限、超出字符数；以及超限时的启发式压缩后内容
// Pos: MEMORY.md / profile.md 写入路径的"bounded 守门人"，吸收 Hermes 双文件约束理念

export interface BoundedConfig {
  maxChars: number
  fileType: 'memory' | 'profile'
}

// Hermes 标准：MEMORY.md ≤ 2200 字符，profile.md ≤ 1375 字符。
// 强制 bounded 目的：
//   1) LLM 上下文压力恒定可控；
//   2) 自动触发压缩，永远保持记忆"高质量精华"，避免无限堆积；
//   3) 与 hermes dual-file architecture 对齐。
export const BOUNDED_LIMITS: Record<string, BoundedConfig> = {
  'MEMORY.md': { maxChars: 2200, fileType: 'memory' },
  'profile.md': { maxChars: 1375, fileType: 'profile' },
}

export interface BoundedCheckResult {
  withinLimit: boolean
  currentChars: number
  maxChars: number
  excessChars: number
}

export function checkBounded(
  filename: string,
  content: string,
): BoundedCheckResult {
  const basename = filename.split('/').pop() || filename
  const limit = BOUNDED_LIMITS[basename]
  if (!limit) {
    return {
      withinLimit: true,
      currentChars: content.length,
      maxChars: Infinity,
      excessChars: 0,
    }
  }
  const currentChars = content.length
  return {
    withinLimit: currentChars <= limit.maxChars,
    currentChars,
    maxChars: limit.maxChars,
    excessChars: Math.max(0, currentChars - limit.maxChars),
  }
}

/**
 * 超限启发式压缩（无 LLM）：
 * 保留头部 5 行 (frontmatter/标题) + 从尾部向前累加直到耗尽预算。
 * 插入一行显式的 ellipsis marker，便于人工与日志追溯压缩事件。
 */
export function compressBoundedContent(
  _filename: string,
  content: string,
  maxChars: number,
): string {
  if (content.length <= maxChars) return content

  const lines = content.split('\n')
  if (lines.length === 0) return content.slice(0, maxChars)

  const headerLines = lines.slice(0, 5)
  const headerSize = headerLines.join('\n').length + 1
  // 50 字符为 ellipsis marker 预留
  const remainingBudget = maxChars - headerSize - 50

  if (remainingBudget <= 0) {
    return headerLines.join('\n').slice(0, maxChars)
  }

  const tailLines: string[] = []
  let used = 0
  for (let i = lines.length - 1; i >= 5; i--) {
    const lineLen = lines[i].length + 1
    if (used + lineLen > remainingBudget) break
    tailLines.unshift(lines[i])
    used += lineLen
  }

  return [
    ...headerLines,
    '',
    `<!-- ⚠️ 已 bounded 压缩：原 ${content.length} 字符 → 当前 ${maxChars} 字符上限 -->`,
    '',
    ...tailLines,
  ].join('\n')
}

/**
 * 便捷入口：对 basename 命中 BOUNDED_LIMITS 的文件做 check+compress。
 * 未命中返回原 content 不变；命中且超限则返回压缩后的 content。
 * 返回 { content, compressed, check } 方便调用方做日志。
 */
export function enforceBounded(
  filename: string,
  content: string,
): { content: string; compressed: boolean; check: BoundedCheckResult } {
  const check = checkBounded(filename, content)
  if (check.withinLimit) {
    return { content, compressed: false, check }
  }
  const compressed = compressBoundedContent(filename, content, check.maxChars)
  return { content: compressed, compressed: true, check }
}
