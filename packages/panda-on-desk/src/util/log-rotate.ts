// Input: filePath + 单行字符串 + maxBytes 阈值
// Output: 追加到日志，超阈值则按换行边界保留后半部分
// Pos: panda-on-desk 工具 — 主进程日志轮转
//
// Forked from clawd-on-desk@4b07658:src/log-rotate.js (MIT License)
// JS → TS 直接转。

import * as fs from 'node:fs'

export const DEFAULT_MAX_BYTES = 1024 * 1024 // 1 MB

/**
 * Append `line` to `filePath`. If the file exceeds `maxBytes` after the write,
 * truncate it to keep roughly the newest half.
 */
export function rotatedAppend(
  filePath: string,
  line: string,
  maxBytes: number = DEFAULT_MAX_BYTES,
): void {
  fs.appendFileSync(filePath, line)

  let size: number
  try {
    size = fs.statSync(filePath).size
  } catch {
    return // file disappeared between append and stat — nothing to do
  }
  if (size <= maxBytes) return

  // Over limit — keep the latter half, cut at a newline so we don't break a line
  let buf: Buffer
  try {
    buf = fs.readFileSync(filePath)
  } catch {
    return // file disappeared between stat and read
  }
  const half = Math.floor(buf.length / 2)
  const nl = buf.indexOf(0x0a, half) // first \n after midpoint
  if (nl === -1 || nl >= buf.length - 1) return // no good cut point, skip this round
  fs.writeFileSync(filePath, buf.slice(nl + 1))
}
