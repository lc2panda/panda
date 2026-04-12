// Input: Date 对象（可选，默认 new Date()）
// Output: 用户设备系统时区的 YYYY-MM-DD / YYYY-MM-DD_HH-mm / YYYY-MM-DD HH:mm:ss 字符串
// Pos: 全仓库"文件命名 / 用户可见日期"统一 helper，取代 new Date().toISOString().split('T')[0] 的 UTC bug
// 一旦我被修改，请更新所属文件夹的 README

/**
 * 返回系统时区的 YYYY-MM-DD。
 *
 * 用户 A 在 +08 时区调用 → 得到 A 的本地日期
 * 用户 B 在 -05 时区调用 → 得到 B 的本地日期
 * 两者都正确，不需要任何配置。
 *
 * 为什么不用 toISOString().split('T')[0]：
 *   toISOString 永远返回 UTC，+08 早 7 点 = UTC 前一天 23 点 → 日期整整晚一天。
 *   在 +08 时区，`morning_brief_${dateStr}.md` 早上 7 点生成时文件名会变成昨天。
 *
 * .getFullYear / .getMonth / .getDate 天然返回系统时区，这是 JavaScript 规范。
 *
 * 注意：如果设置了 CLAUDE_CODE_OVERRIDE_DATE 环境变量，无参调用会返回 override 值
 *       （与 src/constants/common.ts:getLocalISODate 保持一致，便于测试回放）。
 *       传入显式 Date 对象的调用不受 override 影响。
 */
export function localDateStr(d?: Date): string {
  if (d === undefined && process.env.CLAUDE_CODE_OVERRIDE_DATE) {
    return process.env.CLAUDE_CODE_OVERRIDE_DATE
  }
  const date = d ?? new Date()
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * 返回系统时区的 YYYY-MM-DD_HH-mm（用于文件名需要唯一时间戳的场景）
 */
export function localDateTimeFileStr(d: Date = new Date()): string {
  const date = localDateStr(d)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${date}_${hh}-${mm}`
}

/**
 * 返回系统时区 YYYY-MM-DD HH:mm:ss（人类可读展示）
 */
export function localDateTimeStr(d: Date = new Date()): string {
  const date = localDateStr(d)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${date} ${hh}:${mm}:${ss}`
}
