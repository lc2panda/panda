// Input: AutoMem 类型的 MemoryFileInfo 数组
// Output: 渐进式索引字符串（L1 索引表 + 按需展开指令）
// Pos: claudemd.ts getClaudeMds() 调用，替代全量 AutoMem 注入
//
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"

/**
 * B5: Progressive Memory Disclosure
 *
 * 三层按需检索：
 *   L1 — 索引表（注入 context，~300 tok）
 *   L2 — 模型通过 Read 工具按需展开详情
 *   L3 — 模型通过 Grep 工具搜索全文
 *
 * 将 AutoMem 的 patterns/scars 等详情文件从全量注入改为索引注入，
 * 仅保留 MEMORY.md 索引文件全量注入（它本身就是索引）。
 */

import type { MemoryFileInfo } from './claudemd.js'
import { stripPrivateContent } from '../memdir/memoryTypes.js'

const ENTRYPOINT_FILENAME = 'MEMORY.md'

/**
 * 粗略 token 估算。
 * 中文 ~0.6 tok/char, 英文 ~0.25 tok/word, 混合取 ~0.4 tok/char。
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length * 0.4)
}

/**
 * 从文件内容提取第一行有意义的摘要。
 * 跳过 frontmatter、空行、标题标记。
 */
function extractSummary(content: string, maxLen: number = 60): string {
  const lines = content.split('\n')
  let inFrontmatter = false
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed === '---') {
      inFrontmatter = !inFrontmatter
      continue
    }
    if (inFrontmatter) continue
    if (!trimmed) continue
    // Skip markdown headings
    if (trimmed.startsWith('#')) {
      // Use heading text as summary
      const text = trimmed.replace(/^#+\s*/, '')
      if (text) return text.slice(0, maxLen)
      continue
    }
    // Skip frontmatter-like lines
    if (/^(type|date|name|description|strength|lastAccessed):/i.test(trimmed)) continue
    return trimmed.slice(0, maxLen)
  }
  return '(empty)'
}

/**
 * 从文件路径提取记忆类别。
 */
function extractCategory(path: string): string {
  if (path.includes('/patterns/')) return 'patterns'
  if (path.includes('/scars/')) return 'scars'
  if (path.includes('/semantic/')) return 'semantic'
  if (path.includes('/procedural/')) return 'procedural'
  if (path.includes('/episodes/')) return 'episodes'
  if (path.includes('/working/')) return 'working'
  if (path.includes('/dreams/')) return 'dreams'
  return 'other'
}

/**
 * 判断一个 AutoMem 文件是否应该全量注入。
 * MEMORY.md 索引文件本身就是索引，保持全量注入。
 */
function isEntrypointFile(file: MemoryFileInfo): boolean {
  return file.path.endsWith('/' + ENTRYPOINT_FILENAME) ||
    file.path.endsWith('\\' + ENTRYPOINT_FILENAME)
}

export interface ProgressiveIndexResult {
  /** 全量注入的文件（MEMORY.md 等） */
  fullInjectionFiles: MemoryFileInfo[]
  /** 仅索引注入的文件 */
  indexedFiles: MemoryFileInfo[]
  /** 渐进式索引字符串 */
  indexContent: string
  /** 统计 */
  stats: {
    fullInjectionTokens: number
    indexOnlyTokens: number
    totalSavedTokens: number
  }
}

/**
 * 将 AutoMem 文件分为全量注入和索引注入两组，
 * 构建 L1 索引表供注入 context。
 */
export function buildProgressiveIndex(
  autoMemFiles: MemoryFileInfo[],
): ProgressiveIndexResult {
  const fullInjectionFiles: MemoryFileInfo[] = []
  const indexedFiles: MemoryFileInfo[] = []

  for (const file of autoMemFiles) {
    // B9: Hard-filter private content before index classification
    file.content = stripPrivateContent(file.content)
    if (isEntrypointFile(file)) {
      fullInjectionFiles.push(file)
    } else {
      indexedFiles.push(file)
    }
  }

  // No indexed files → no index needed
  if (indexedFiles.length === 0) {
    return {
      fullInjectionFiles,
      indexedFiles: [],
      indexContent: '',
      stats: {
        fullInjectionTokens: fullInjectionFiles.reduce(
          (sum, f) => sum + estimateTokens(f.content),
          0,
        ),
        indexOnlyTokens: 0,
        totalSavedTokens: 0,
      },
    }
  }

  // Build index table
  const rows: string[] = []
  let totalDetailTokens = 0

  for (const file of indexedFiles) {
    const category = extractCategory(file.path)
    const summary = extractSummary(file.content)
    const tokens = estimateTokens(file.content)
    totalDetailTokens += tokens
    rows.push(`| ${category} | \`${file.path}\` | ${summary} | ~${tokens} |`)
  }

  const fullTokens = fullInjectionFiles.reduce(
    (sum, f) => sum + estimateTokens(f.content),
    0,
  )
  const indexTokens = estimateTokens(rows.join('\n')) + 150 // overhead for header/instructions

  const lines = [
    '## 项目记忆详情索引 (按需展开)',
    '',
    '以下记忆文件仅显示索引。如需某条记忆的详情，使用 Read 工具读取对应路径。',
    '',
    '| 类别 | 文件 | 摘要 | ~Token |',
    '|------|------|------|--------|',
    ...rows,
    '',
    `> 索引 ${indexedFiles.length} 个文件 | 全量: ~${totalDetailTokens} tok | 当前注入: ~${indexTokens} tok | 节省: ~${totalDetailTokens - indexTokens} tok`,
  ]

  return {
    fullInjectionFiles,
    indexedFiles,
    indexContent: lines.join('\n'),
    stats: {
      fullInjectionTokens: fullTokens,
      indexOnlyTokens: indexTokens,
      totalSavedTokens: Math.max(0, totalDetailTokens - indexTokens),
    },
  }
}
