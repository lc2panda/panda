// Input:  上游事件（API usage / slash 命令 / turn 完成 / 启动 / 60s tick / DeepDream 完成）
// Output: 调用 petXP.addXP / recordMilestone；任何异常 swallow（绝不污染主路径）
// Pos:    cost-tracker.ts(token) / processSlashCommand.tsx(cmd) / query.ts(turn) /
//         backgroundHousekeeping.ts(streak + tick) / autoDream.ts(deepdream) 调用此桥
//         严守 anthropic byte-equal — 不动 claude.ts/oauth/providers.ts；仅在统一汇聚点插桩
//
// [NEW-FILE:#20260419-OD-03]

import { feature } from 'bun:bundle'

import { addXP, getStreakLastSeenDay, recordMilestone } from './petXP.js'
import { todayKey } from './petStats.js'

// why feature gate centralized here: 避免每个调用方都写 if(!feature('BUDDY')) return
// 测试可设置 __setSignalsEnabledForTesting() 强制关闭 / 开启
let signalsEnabledOverride: boolean | null = null

/** 测试专用：强制开启/关闭信号路径（绕过 feature gate） */
export function __setSignalsEnabledForTesting(enabled: boolean | null): void {
  signalsEnabledOverride = enabled
}

function isEnabled(): boolean {
  if (signalsEnabledOverride !== null) return signalsEnabledOverride
  // why inline if/feature: bun:bundle 限制 feature() 必须直接出现在 if/三元中
  if (feature('BUDDY')) return true
  return false
}

// ─────────────────────────────────────────────────────────────────────────────
// 信号 1：token 计数（cost-tracker.ts::addToTotalSessionCost 末尾调用）
// ─────────────────────────────────────────────────────────────────────────────

type TokenUsageLike = {
  input_tokens: number
  output_tokens: number
  cache_read_input_tokens?: number | null
  cache_creation_input_tokens?: number | null
}

/**
 * 记录单次 API 响应的 token 使用 — Anthropic + OpenAI 全部 provider 必经此路径。
 * 调用点：cost-tracker.ts::addToTotalSessionCost 末尾（fire-and-forget）。
 */
export function recordTokenUsageSignal(usage: TokenUsageLike | null | undefined): void {
  if (!isEnabled() || !usage) return
  try {
    const inTokens = Number(usage.input_tokens) || 0
    const outTokens = Number(usage.output_tokens) || 0
    const cacheTokens =
      (Number(usage.cache_read_input_tokens) || 0) +
      (Number(usage.cache_creation_input_tokens) || 0)
    if (inTokens > 0) addXP('tokens.in', inTokens)
    if (outTokens > 0) addXP('tokens.out', outTokens)
    if (cacheTokens > 0) addXP('tokens.cache', cacheTokens)
  } catch {
    /* swallow — 信号失败绝不能拖垮 API 主路径 */
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 信号 2：命令计数（processSlashCommand.tsx::tengu_input_command 后调用）
// ─────────────────────────────────────────────────────────────────────────────

// heavy 清单：耗时长且产生显著价值的命令（任务规格指定）
// why frozen Set: 调用频繁；O(1) 查询；运行时不可变防被污染
const HEAVY_COMMANDS: ReadonlySet<string> = new Set([
  'edit',
  'build',
  'test',
  'buddy',
  'dream',
  'skillify',
  'fork',
  'plan',
  'agents',
])

export function recordCommandSignal(commandName: string): void {
  if (!isEnabled()) return
  try {
    const bucket = HEAVY_COMMANDS.has(commandName) ? 'cmd.heavy' : 'cmd.basic'
    addXP(bucket, 1)
  } catch {
    /* swallow */
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 信号 3：turn success + error.recover bonus
// query.ts 在 `return { reason: 'completed' }` 之前调用 recordTurnSignal('success')
// 错误路径调用 recordTurnSignal('error')（让下次 success 触发 recover bonus）
// ─────────────────────────────────────────────────────────────────────────────

// 上一 turn 是否抛错（仅模块级状态；进程内累计；重启后重置）
// why module-level: turn 串行触发，不存在并发污染；持久化到 petStats 反而过度
let lastTurnHadError = false

export function recordTurnSignal(outcome: 'success' | 'error'): void {
  if (!isEnabled()) {
    // 即便禁用也维护 lastTurnHadError 状态（开启时不需重置）— 但养成数据不变
    if (outcome === 'error') lastTurnHadError = true
    else lastTurnHadError = false
    return
  }
  try {
    if (outcome === 'error') {
      lastTurnHadError = true
      return
    }
    addXP('turn.success', 1)
    if (lastTurnHadError) {
      addXP('error.recover', 1)
    }
    lastTurnHadError = false
  } catch {
    /* swallow */
  }
}

/** 测试专用：重置 last-turn 错误标志 */
export function __resetTurnErrorStateForTesting(): void {
  lastTurnHadError = false
}

// ─────────────────────────────────────────────────────────────────────────────
// 信号 4：streak（每日首次启动）
// backgroundHousekeeping.ts::startBackgroundHousekeeping 调用一次
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 检查是否跨日 — 是则触发 streak.daily 信号；同日 no-op。
 * why addXP triggers rollover: petXP::applyDailyRollover 在每次 addXP 入口被调用，
 * 自动检测跨日并发放 streak XP（详 petXP.ts:111）。我们只需显式触发一次 addXP；
 * 跨日时 streak.daily 自动入账 + lastSeenDay 更新；同日则 addXP 直接 no-op 路径。
 */
export function recordStreakStartupSignal(now: number = Date.now()): void {
  if (!isEnabled()) return
  try {
    const lastSeen = getStreakLastSeenDay(now)
    const today = todayKey(now)
    if (lastSeen === today) return // 同日 no-op（不触碰 cache）

    // 跨日：addXP 内部 applyDailyRollover 会自动 (1) 推进 lastSeenDay (2) 发放 streak XP
    // 我们额外 +1 streak.daily 单位作为"启动信号"明确事件（叠加在自动 rollover 之上）
    addXP('streak.daily', 1, now)
  } catch {
    /* swallow */
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 信号 5：time tick（在线时长）
// backgroundHousekeeping.ts 起 60s setInterval；每次调一次 +1 分钟
// ─────────────────────────────────────────────────────────────────────────────

const TIME_TICK_INTERVAL_MS = 60_000
let timeTickHandle: ReturnType<typeof setInterval> | null = null

export function startTimeTickSignal(): void {
  if (!isEnabled()) return
  if (timeTickHandle) return // 防重复启动
  try {
    timeTickHandle = setInterval(() => {
      try {
        addXP('time', 1)
      } catch {
        /* swallow */
      }
    }, TIME_TICK_INTERVAL_MS)
    // why unref: 后台 tick 不阻止进程退出（与 backgroundHousekeeping 其他 timer 保持一致）
    if (typeof timeTickHandle?.unref === 'function') {
      timeTickHandle.unref()
    }
  } catch {
    /* swallow */
  }
}

export function stopTimeTickSignal(): void {
  if (timeTickHandle) {
    clearInterval(timeTickHandle)
    timeTickHandle = null
  }
}

/** 测试专用：直接触发一次 time tick（避免等真 60s） */
export function __triggerTimeTickForTesting(): void {
  if (!isEnabled()) return
  try {
    addXP('time', 1)
  } catch {
    /* swallow */
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 信号 6：DeepDream 完成
// autoDream.ts::executeAutoDream 完成路径调用
// ─────────────────────────────────────────────────────────────────────────────

export function recordDeepDreamSignal(): void {
  if (!isEnabled()) return
  try {
    addXP('deepdream', 1)
    recordMilestone('first_deepdream')
  } catch {
    /* swallow */
  }
}
