// Input:  petXP / petStats 读出的 level / xp / history / streak
// Output: /buddy stats 可视化字符串 — 8 级精细进度条、XP/min 速率、streak 🔥、30 天 bar chart
// Pos:    src/commands/buddy/index.ts::stats & stats history 调用；纯函数无副作用，便于单测
//
// [NEW-FILE:#20260420-W18-T4]
// 触发原因：buddy/index.ts 已 573 行逼近 800 上限；viz 逻辑单独抽出避免膨胀；纯函数便于回归。
// 依赖：0 新依赖（asciichart 已是 package.json deps；此文件仅用其 plot 接口）

import type { CompanionStatsV1, HistoryEvent } from '../../buddy/petStats.js'

// ─────────────────────────────────────────────────────────────────────────────
// 1. 8 级精细进度条 — Unicode 左侧 block 字符
// ─────────────────────────────────────────────────────────────────────────────

// 8 级递增宽度（U+258F..U+2588）— 每格由右向左填充 1/8..8/8
const EIGHTH_BLOCKS = ['', '▏', '▎', '▍', '▌', '▋', '▊', '▉', '█'] as const

/**
 * 渲染 8 级精细进度条。
 *
 * why 8 倍精度：10 格粗条在 0-100% 分辨率只有 10%，8 级精细后 80 微格 ≈ 1.25% 分辨率。
 *
 * @param pct 百分比 [0, 100]
 * @param width 粗格数（默认 10）
 * @returns 例如 "█████▌░░░░" — width 长度字符
 */
export function renderFineBar(pct: number, width: number = 10): string {
  if (!Number.isFinite(pct)) pct = 0
  const clamped = Math.max(0, Math.min(100, pct))
  const totalEighths = Math.round((clamped / 100) * width * 8)
  const fullBlocks = Math.floor(totalEighths / 8)
  const remainder = totalEighths - fullBlocks * 8
  let out = '█'.repeat(Math.min(fullBlocks, width))
  if (fullBlocks < width) {
    out += EIGHTH_BLOCKS[remainder] ?? ''
    // 剩余空位用 ░ 填满到 width 字符总长（块+半块+░=width 视觉等宽）
    const charsRendered = out.length
    const pad = Math.max(0, width - charsRendered)
    out += '░'.repeat(pad)
  }
  return out
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. XP/min 速率 — 最近 24h history events 平均
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 计算最近 24h XP/min 速率（平均 XP/minute）。
 *
 * why history 近似：真实 per-event XP 存在 history.xp 字段（milestone / streak_bonus）；
 *   addXP 不进 history（避免刷屏）— 我们改用 total XP 差值 + lastUpdatedAt 窗口近似。
 *
 * 算法：取 history 中 ts ≥ now-24h 的 event.xp 求和；除以 24*60=1440 min
 *   返回 XP/min 精确到 1 位小数；无数据返回 0。
 *
 * @param stats CompanionStatsV1
 * @param now 当前毫秒时间戳
 */
export function computeXpPerMin(
  stats: CompanionStatsV1,
  now: number = Date.now(),
): number {
  const windowMs = 24 * 60 * 60 * 1000
  const cutoff = now - windowMs
  let sum = 0
  for (const ev of stats.history) {
    if (ev.ts < cutoff) continue
    if (typeof ev.xp === 'number' && ev.xp > 0) {
      sum += ev.xp
    }
  }
  // 未满 24h 首日用户：用 total 和 createdAt 做 fallback
  const activeMs = Math.min(now - stats.createdAt, windowMs)
  const minutes = Math.max(1, Math.floor(activeMs / 60_000))
  if (sum === 0 && stats.xp.total > 0 && activeMs < windowMs) {
    // 活跃 <24h，用 total XP 估算
    return Math.round((stats.xp.total / minutes) * 10) / 10
  }
  return Math.round((sum / 1440) * 10) / 10
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Streak 🔥 可视化
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 渲染 streak 火焰可视化。
 *
 * 规则：
 *   - streak ≤ 7：精确渲染 N 个 🔥
 *   - streak > 7：前 7 个 🔥 + "+(N-7)" 后缀
 *   - streak === 0：返回 "(no streak yet)"
 *
 * @param streakDays 连续签到天数
 */
export function renderStreakFire(streakDays: number): string {
  if (!Number.isFinite(streakDays) || streakDays <= 0) {
    return '(no streak yet)'
  }
  const n = Math.floor(streakDays)
  if (n <= 7) {
    return `${'🔥'.repeat(n)} ${n} day${n === 1 ? '' : 's'}`
  }
  return `${'🔥'.repeat(7)}+${n - 7} ${n} days`
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. 30 天 XP bar chart — Unicode 1/8 块纵向柱状图
// ─────────────────────────────────────────────────────────────────────────────

// U+2581..U+2588 8 级纵向块字符（由低到高）
const VERTICAL_BLOCKS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'] as const

/**
 * 把 N 天 XP 数组渲染为 N 字符宽的纵向柱状图。
 *
 * why 不用 asciichart 多行图：单行 unicode block 更紧凑（移动端友好），
 *   且 task 示例 `▄▂▁▃▄▅▆▇█` 就是单行；asciichart 保留依赖供未来多系列用。
 *
 * @param values 每天 XP 增量数组；undefined/NaN/负值 → 0
 */
export function renderDailyBars(values: number[]): string {
  if (!Array.isArray(values) || values.length === 0) return ''
  const safe = values.map(v => (Number.isFinite(v) && v > 0 ? v : 0))
  const max = Math.max(...safe, 0)
  if (max === 0) {
    // 全 0 — 返回全最低块示意（而非空串）
    return '▁'.repeat(safe.length)
  }
  return safe
    .map(v => {
      if (v <= 0) return '▁'
      const idx = Math.max(
        0,
        Math.min(7, Math.round((v / max) * 7)),
      )
      return VERTICAL_BLOCKS[idx]
    })
    .join('')
}

/**
 * 聚合 history 到"每天 XP 总和"数组（倒数第 days 天 → 今天）。
 *
 * 用 +08:00 日历日分桶（与 petStats.todayKey 保持一致）。
 *
 * @param history HistoryEvent 数组
 * @param days 天数（默认 30）
 * @param now 当前毫秒时间戳
 * @returns 长度为 days 的 XP 数组；索引 0 = 最旧一天，索引 days-1 = 今天
 */
export function aggregateDailyXp(
  history: readonly HistoryEvent[],
  days: number = 30,
  now: number = Date.now(),
): number[] {
  const TZ_OFFSET_MS = 8 * 60 * 60 * 1000 // +08:00
  // 当前 +08:00 的午夜时间戳（今天 SG 开始）
  const todayShifted = new Date(now + TZ_OFFSET_MS)
  todayShifted.setUTCHours(0, 0, 0, 0)
  const todayStartMs = todayShifted.getTime() - TZ_OFFSET_MS
  // 明天 SG 开始 — 用于正确覆盖"今天下午"事件（否则 ts > todayStartMs 算出 dayDiff=-1）
  const tomorrowStartMs = todayStartMs + 86_400_000
  const out = new Array<number>(days).fill(0)
  for (const ev of history) {
    if (typeof ev.xp !== 'number' || ev.xp <= 0) continue
    // dayDiff = 0 今日 / 1 昨日 / ... / days-1 最旧窗边
    const dayDiff = Math.floor((tomorrowStartMs - 1 - ev.ts) / 86_400_000)
    if (dayDiff < 0 || dayDiff >= days) continue
    const idx = days - 1 - dayDiff
    out[idx] = (out[idx] ?? 0) + ev.xp
  }
  return out
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Leaderboard 占位 — 本地自己 vs 建议目标
// ─────────────────────────────────────────────────────────────────────────────

export type LeaderboardRow = {
  rank: number
  label: string
  level: number
  xp: number
  you: boolean
}

/**
 * 构造本地 leaderboard 占位数据（绝不联网/上传）。
 *
 * 建议目标基于当前等级动态推荐：
 *   - "下一里程碑" = 比自己高 5 级的参考
 *   - "月度目标"   = 比自己高 10 级的参考
 *   - "年度目标"   = MAX_LEVEL 60
 *
 * @param selfLevel 自己当前等级
 * @param selfXp 自己当前总 XP
 * @param totalXpForLevel 等级→总 XP 查询函数（types.ts 暴露）
 * @param maxLevel 等级上限（默认 60）
 */
export function buildLocalLeaderboard(
  selfLevel: number,
  selfXp: number,
  totalXpForLevel: (lv: number) => number,
  maxLevel: number = 60,
): LeaderboardRow[] {
  const targets = [
    {
      lv: Math.min(maxLevel, selfLevel + 5),
      label: 'Suggested next milestone',
    },
    {
      lv: Math.min(maxLevel, selfLevel + 10),
      label: 'Monthly goal',
    },
    {
      lv: maxLevel,
      label: 'Yearly goal (max level)',
    },
  ]
  const rows: LeaderboardRow[] = [
    {
      rank: 0,
      label: 'You',
      level: selfLevel,
      xp: selfXp,
      you: true,
    },
  ]
  for (const t of targets) {
    if (t.lv <= selfLevel) continue
    rows.push({
      rank: 0,
      label: t.label,
      level: t.lv,
      xp: totalXpForLevel(t.lv),
      you: false,
    })
  }
  // 按 xp 升序分配 rank（1=最低，n=最高）— 自己位置不随分数浮动，作 rank 展示
  const sorted = [...rows].sort((a, b) => a.xp - b.xp)
  sorted.forEach((r, i) => {
    r.rank = i + 1
  })
  return rows
}

/**
 * 渲染 leaderboard 占位为纯文本。
 */
export function renderLeaderboard(rows: LeaderboardRow[]): string {
  if (rows.length === 0) return 'Leaderboard\n  (no data yet)'
  const lines: string[] = ['Leaderboard (local · no network)']
  for (const r of rows) {
    const marker = r.you ? '→' : ' '
    lines.push(
      `  ${marker} #${r.rank}  ${r.label.padEnd(30)} Lv ${String(r.level).padStart(2)}  ${r.xp} XP`,
    )
  }
  lines.push(
    '  ℹ Local suggestion · never uploaded · /buddy stats history for trend',
  )
  return lines.join('\n')
}
