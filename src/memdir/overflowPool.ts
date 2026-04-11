// Input: bounded 压缩溢出的 excess content + filename + (basename 目录)
// Output: overflow 文件落盘到 ~/.pandacc/memory/overflow/<basename>/，可被线性搜索召回
// Pos: bounded memory 固化 — hot prefix(2200/1375) + overflow 冷池，避免永久丢失 Hermes #5563 场景

import { join } from 'path'
import { homedir } from 'os'
import {
  existsSync,
  mkdirSync,
  writeFileSync,
  readdirSync,
  readFileSync,
  statSync,
  unlinkSync,
} from 'fs'

const OVERFLOW_BASE = join(homedir(), '.pandacc', 'memory', 'overflow')
const MAX_FILES_PER_TOPIC = 100
const MAX_TOTAL_SIZE_MB = 50

export interface OverflowEntry {
  filePath: string
  basename: string
  content: string
  excessChars: number
  savedAt: number
}

/**
 * 把 bounded 压缩前的"超出部分"落盘到溢出池。
 * 调用方应在 enforceBounded 检测到超限时，先把 excess 部分写到这里再压缩 hot prefix。
 */
export function saveOverflow(
  filename: string,
  excessContent: string,
  excessChars: number,
): OverflowEntry | null {
  try {
    const basename = filename.split('/').pop() || filename
    const topicDir = join(OVERFLOW_BASE, basename)
    mkdirSync(topicDir, { recursive: true })

    pruneIfNeeded(topicDir)

    const dateStr = new Date().toISOString().replace(/[:.]/g, '-')
    // 追加随机后缀避免同一毫秒多次调用碰撞
    const rand = Math.random().toString(36).slice(2, 8)
    const filePath = join(topicDir, `${dateStr}-${rand}.md`)
    const header = [
      `<!-- bounded-overflow -->`,
      `<!-- source: ${filename} -->`,
      `<!-- saved: ${new Date().toISOString()} -->`,
      `<!-- excess: ${excessChars} chars -->`,
      ``,
    ].join('\n')
    writeFileSync(filePath, header + excessContent, 'utf-8')
    return {
      filePath,
      basename,
      content: excessContent,
      excessChars,
      savedAt: Date.now(),
    }
  } catch {
    return null
  }
}

/**
 * 列出某 topic 的所有 overflow 文件（按 mtime 倒序）。
 */
export function listOverflow(basename: string): OverflowEntry[] {
  try {
    const topicDir = join(OVERFLOW_BASE, basename)
    if (!existsSync(topicDir)) return []
    const files = readdirSync(topicDir)
      .filter(f => f.endsWith('.md'))
      .map(f => {
        const fullPath = join(topicDir, f)
        try {
          const stat = statSync(fullPath)
          return { filePath: fullPath, mtimeMs: stat.mtimeMs, size: stat.size }
        } catch {
          return null
        }
      })
      .filter((x): x is { filePath: string; mtimeMs: number; size: number } => x !== null)
      .sort((a, b) => b.mtimeMs - a.mtimeMs)

    return files.map(f => {
      let content = ''
      let excessChars = 0
      try {
        content = readFileSync(f.filePath, 'utf-8')
        const match = content.match(/<!-- excess: (\d+) chars -->/)
        if (match) excessChars = parseInt(match[1], 10)
      } catch {}
      return {
        filePath: f.filePath,
        basename,
        content,
        excessChars,
        savedAt: f.mtimeMs,
      }
    })
  } catch {
    return []
  }
}

/**
 * 在 overflow 池中线性搜索关键词。
 * Phase 1 MVP：case-insensitive 子串匹配，返回前 N 条匹配。
 * Phase 2（后续）：可改为复用 memdir.ts 的 FTS5 索引。
 */
export function searchOverflow(
  query: string,
  basename?: string,
  limit: number = 5,
): OverflowEntry[] {
  try {
    if (!existsSync(OVERFLOW_BASE)) return []
    const topics = basename ? [basename] : readdirSync(OVERFLOW_BASE)
    const results: OverflowEntry[] = []
    const lowerQuery = query.toLowerCase()

    for (const topic of topics) {
      const entries = listOverflow(topic)
      for (const entry of entries) {
        if (entry.content.toLowerCase().includes(lowerQuery)) {
          results.push(entry)
          if (results.length >= limit) return results
        }
      }
    }
    return results
  } catch {
    return []
  }
}

/**
 * 获取溢出池统计。
 */
export function getOverflowStats(): {
  topics: number
  totalFiles: number
  totalSizeBytes: number
} {
  try {
    if (!existsSync(OVERFLOW_BASE)) return { topics: 0, totalFiles: 0, totalSizeBytes: 0 }
    const topics = readdirSync(OVERFLOW_BASE)
    let totalFiles = 0
    let totalSizeBytes = 0
    for (const t of topics) {
      const dir = join(OVERFLOW_BASE, t)
      try {
        const files = readdirSync(dir).filter(f => f.endsWith('.md'))
        for (const f of files) {
          totalFiles++
          try {
            totalSizeBytes += statSync(join(dir, f)).size
          } catch {}
        }
      } catch {}
    }
    return { topics: topics.length, totalFiles, totalSizeBytes }
  } catch {
    return { topics: 0, totalFiles: 0, totalSizeBytes: 0 }
  }
}

function pruneIfNeeded(topicDir: string): void {
  try {
    const files = readdirSync(topicDir)
      .filter(f => f.endsWith('.md'))
      .map(f => {
        try {
          return {
            name: f,
            path: join(topicDir, f),
            mtimeMs: statSync(join(topicDir, f)).mtimeMs,
          }
        } catch {
          return null
        }
      })
      .filter((x): x is { name: string; path: string; mtimeMs: number } => x !== null)
      .sort((a, b) => b.mtimeMs - a.mtimeMs)

    if (files.length > MAX_FILES_PER_TOPIC) {
      const toDelete = files.slice(MAX_FILES_PER_TOPIC)
      for (const f of toDelete) {
        try {
          unlinkSync(f.path)
        } catch {}
      }
    }

    // 总大小上限（跨 topic 粗检查：只删本 topic 内最旧文件，简化实现）
    const statsTotal = getOverflowStats().totalSizeBytes
    const limitBytes = MAX_TOTAL_SIZE_MB * 1024 * 1024
    if (statsTotal > limitBytes) {
      // 删掉本 topic 内最旧的一批（tail 末尾）
      const remaining = files.slice(0, MAX_FILES_PER_TOPIC)
      const tail = remaining.slice(-Math.max(1, Math.floor(remaining.length / 10)))
      for (const f of tail) {
        try {
          unlinkSync(f.path)
        } catch {}
      }
    }
  } catch {}
}
