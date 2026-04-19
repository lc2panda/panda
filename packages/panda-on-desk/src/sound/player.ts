// Input:  playSound('short' | 'critical' | 'gentle')
// Output: IPC `sound:play` → hit 窗 invisible <audio> element 播放预内嵌 base64 音效
// Pos:    panda-on-desk 通知声音线索；P2-T4 新建（含 10s cooldown 防刷屏）
//         接入点：notification/dispatcher.ts 的 NotificationEvent.soundCue
//
// [NEW-FILE:#20260419-P2-15]
// 2026-04-19 +08:00 agent-δ-P2-vfx · 0 deps；占位静音 base64，v0.5 美术补真实音效

/** 三类声音 cue — 与 NotificationEvent.soundCue 字面量同步 */
export type SoundCue = 'short' | 'critical' | 'gentle'

/** IPC 通道名 — main 侧 sendToHitWin('sound:play', payload) */
export const SOUND_PLAY_CHANNEL = 'sound:play' as const

/** sound:play IPC 负载 */
export interface SoundPlayPayload {
  cue: SoundCue
  /** 预编码 audio dataURL（renderer 端可直接 new Audio(src).play()） */
  src: string
  /** 推送时刻 */
  ts: number
}

/** 同 cue 最小间隔（10s）— 防刷屏 */
export const SOUND_COOLDOWN_MS = 10_000

// ─────────────────────────────────────────────────────────────────────────────
// 内置音效 — base64 dataURL 占位（极短静音 wav，44.1kHz mono PCM）
// 决策：v0.5 美术接入前用 silent placeholder 保证 audio API 链路通畅，
//       不引入二进制资源依赖；renderer 仍能 .play() 不抛错。
//
// 静音 wav header（46 字节 + 0 数据）= 极短可播放占位
// ─────────────────────────────────────────────────────────────────────────────

// why: bun atob/Buffer 跨运行时安全；统一硬编码 base64 dataURL 避免运行时拼装失败
const SILENT_WAV_BASE64 =
  'UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='

const BUILTIN_SOUNDS: Record<SoundCue, string> = {
  short: `data:audio/wav;base64,${SILENT_WAV_BASE64}`,
  critical: `data:audio/wav;base64,${SILENT_WAV_BASE64}`,
  gentle: `data:audio/wav;base64,${SILENT_WAV_BASE64}`,
}

// ─────────────────────────────────────────────────────────────────────────────
// 渲染回调注入（main.ts 启动时注入 sendToHitWin）
// ─────────────────────────────────────────────────────────────────────────────

type NotifyFn = (channel: string, payload: SoundPlayPayload) => void

let notifyHitWin: NotifyFn | null = null

export function setSoundRendererNotifier(fn: NotifyFn | null): void {
  notifyHitWin = fn
}

// ─────────────────────────────────────────────────────────────────────────────
// Cooldown 表 — 同 cue 10s 内只播 1 次
// ─────────────────────────────────────────────────────────────────────────────

const lastPlayedAt = new Map<SoundCue, number>()

/** clock 注入 — 单测可替换为可控时间 */
let clock: () => number = () => Date.now()

/** 测试 / 诊断辅助 — 注入时钟 */
export function __setClockForTesting(fn: () => number): void {
  clock = fn
}

/** 测试隔离 — 清空 cooldown + 解绑 notifier + 还原时钟 */
export function __resetSoundForTesting(): void {
  lastPlayedAt.clear()
  notifyHitWin = null
  clock = () => Date.now()
}

/** 测试辅助 — 查询某 cue 上次播放时刻（无返回 0） */
export function __getLastPlayedAtForTesting(cue: SoundCue): number {
  return lastPlayedAt.get(cue) ?? 0
}

// ─────────────────────────────────────────────────────────────────────────────
// 公开 API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 播放声音 cue。
 * - 同 cue 10s cooldown：在 cooldown 期内的二次调用静默跳过（不抛错）
 * - 不同 cue 互不阻塞
 * - notifyHitWin 未注入时也走 cooldown 逻辑（仅跳过 IPC）
 *
 * @returns true = 实际触发播放；false = 命中 cooldown 跳过
 */
export function playSound(cue: SoundCue): boolean {
  const now = clock()
  const last = lastPlayedAt.get(cue)
  // why: 仅当 last 显式存在时才计 cooldown；首次播放永远放行（避免 clock=0 的边界）
  if (last !== undefined && now - last < SOUND_COOLDOWN_MS) {
    return false
  }
  lastPlayedAt.set(cue, now)
  const src = BUILTIN_SOUNDS[cue]
  if (!src) {
    // 未知 cue — 已被类型系统拦截，但运行时 fallback 静默
    return false
  }
  if (notifyHitWin) {
    try {
      notifyHitWin(SOUND_PLAY_CHANNEL, { cue, src, ts: now })
    } catch {
      // 渲染端可能未 ready；cooldown 仍生效以防业务方递归调用
    }
  }
  return true
}
