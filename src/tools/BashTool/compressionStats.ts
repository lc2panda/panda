// Input: 压缩前后的字符数（由 outputCompressor 调用）
// Output: 累积统计数据与终端友好的格式化输出
// Pos: outputCompressor 的统计附加层，stopHooks 消费
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CompressionRecord {
  timestamp: string
  command: string
  originalChars: number
  compressedChars: number
  savedChars: number
  savedPercent: number
  strategy: string
}

export interface SessionStats {
  totalOriginal: number
  totalCompressed: number
  totalSaved: number
  avgSavedPercent: number
  compressionCount: number
  topSavers: { command: string; savedChars: number }[]  // top 3
}

// ---------------------------------------------------------------------------
// Module-level singleton
// ---------------------------------------------------------------------------

let records: CompressionRecord[] = []

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Record a compression event. Called by compressBashOutput when compression
 * is applied (savedPercent > threshold).
 */
export function recordCompression(
  record: Omit<CompressionRecord, 'timestamp'>,
): void {
  records.push({
    ...record,
    timestamp: new Date().toISOString(),
  })
}

/**
 * Return aggregated stats for the current session.
 */
export function getSessionStats(): SessionStats {
  if (records.length === 0) {
    return {
      totalOriginal: 0,
      totalCompressed: 0,
      totalSaved: 0,
      avgSavedPercent: 0,
      compressionCount: 0,
      topSavers: [],
    }
  }

  const totalOriginal = records.reduce((s, r) => s + r.originalChars, 0)
  const totalCompressed = records.reduce((s, r) => s + r.compressedChars, 0)
  const totalSaved = totalOriginal - totalCompressed
  const avgSavedPercent =
    totalOriginal > 0 ? totalSaved / totalOriginal : 0

  // Top 3 commands by saved chars
  const topSavers = [...records]
    .sort((a, b) => b.savedChars - a.savedChars)
    .slice(0, 3)
    .map(r => ({ command: r.command.slice(0, 80), savedChars: r.savedChars }))

  return {
    totalOriginal,
    totalCompressed,
    totalSaved,
    avgSavedPercent,
    compressionCount: records.length,
    topSavers,
  }
}

/**
 * Format stats for terminal display (single-line summary for stopHooks).
 */
export function formatStatsForDisplay(): string {
  const stats = getSessionStats()
  if (stats.compressionCount === 0) return ''

  const savedK = (stats.totalSaved / 1000).toFixed(1)
  const pct = (stats.avgSavedPercent * 100).toFixed(0)

  let line = `💾 本次会话压缩了 ${stats.compressionCount} 次工具输出，节省 ~${savedK}K 字符 (${pct}%)`

  if (stats.topSavers.length > 0) {
    const top = stats.topSavers[0]
    const topK = (top.savedChars / 1000).toFixed(1)
    line += ` | 最大节省: ${top.command.slice(0, 40)}… (${topK}K)`
  }

  return line
}

/**
 * Reset all stats (for testing).
 */
export function resetStats(): void {
  records = []
}
