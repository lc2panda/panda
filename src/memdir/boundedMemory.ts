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
 *
 * P0-1 Hermes #5563 修复：压缩前先把"被丢弃的中段"落盘到 overflow 池，
 * 避免永久丢失。保留同步路径的零依赖特性：saveOverflow 调用用 try/catch 包裹，
 * 任何失败不影响压缩主路径。
 */
export function compressBoundedContent(
  filename: string,
  content: string,
  maxChars: number,
  options?: { skipOverflow?: boolean },
): string {
  if (content.length <= maxChars) return content

  const lines = content.split('\n')
  if (lines.length === 0) return content.slice(0, maxChars)

  const headerLines = lines.slice(0, 5)
  const headerSize = headerLines.join('\n').length + 1
  // 180 字符为两行 ellipsis marker 预留（原 50 → 180，覆盖新增的 overflow 提示）
  const remainingBudget = maxChars - headerSize - 180

  if (remainingBudget <= 0) {
    // 极端情况：头部就已超限，整个尾部都丢失 → 全部入池
    if (!options?.skipOverflow && lines.length > 5) {
      tryPersistOverflow(filename, lines.slice(5).join('\n'))
    }
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

  // 先落盘"中段丢失部分"再返回压缩结果
  if (!options?.skipOverflow) {
    const tailStartIndex = lines.length - tailLines.length
    if (tailStartIndex > 5) {
      const dropped = lines.slice(5, tailStartIndex).join('\n')
      if (dropped.length > 0) {
        tryPersistOverflow(filename, dropped)
      }
    }
  }

  return [
    ...headerLines,
    '',
    `<!-- ⚠️ 已 bounded 压缩：原 ${content.length} 字符 → 当前 ${maxChars} 字符上限 -->`,
    `<!-- 💾 被压缩部分已存入 ~/.pandacc/memory/overflow/ 可通过 searchOverflow 召回 -->`,
    '',
    ...tailLines,
  ].join('\n')
}

/**
 * 同步尝试落盘 overflow。动态 import 避免模块装载顺序问题，错误静默吞掉。
 * 注意：使用 require 风格的 dynamic import 通过 top-level await bailout —
 * 这里用 Promise 形式 fire-and-forget（compressBoundedContent 是同步函数，不阻塞返回）。
 */
function tryPersistOverflow(filename: string, dropped: string): void {
  try {
    // 同步路径：直接 require 已 resolve 的模块（Bun 支持 sync import 的场景下）
    // 为保持 ESM 纯净，使用动态 import + fire-and-forget
    import('./overflowPool.js')
      .then(({ saveOverflow }) => {
        try {
          saveOverflow(filename, dropped, dropped.length)
        } catch {}
      })
      .catch(() => {})
  } catch {}
}

export interface EnforceBoundedResult {
  content: string
  compressed: boolean
  check: BoundedCheckResult
  /** P0-1：压缩触发时溢出部分是否已尝试落盘到 overflow 池（fire-and-forget，不保证完成） */
  overflowSaved: boolean
}

/**
 * 便捷入口：对 basename 命中 BOUNDED_LIMITS 的文件做 check+compress。
 * 未命中返回原 content 不变；命中且超限则返回压缩后的 content。
 * 返回 { content, compressed, check, overflowSaved } 方便调用方做日志。
 */
export function enforceBounded(
  filename: string,
  content: string,
): EnforceBoundedResult {
  const check = checkBounded(filename, content)
  if (check.withinLimit) {
    return { content, compressed: false, check, overflowSaved: false }
  }
  const compressed = compressBoundedContent(filename, content, check.maxChars)
  return {
    content: compressed,
    compressed: true,
    check,
    // compressBoundedContent 默认不 skipOverflow，所以命中压缩路径即视为"已触发落盘"
    overflowSaved: true,
  }
}
