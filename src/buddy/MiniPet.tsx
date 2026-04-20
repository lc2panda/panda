// Input:  useCurrentPetState() 12 态信号 + getCompanion() 物种 + GlobalConfig 子开关
//         + W22-T2: 700ms tick 动画帧 + getRuntimeSnapshot 检测 desk 是否运行
// Output: StatusLine 左侧 1×5 字符 face（如 "(o.o)"），按 PetState 切表 + 按 species 上色
//         W22-T2: idle/thinking/working/sleeping 走多帧动画；desk 启动时自动隐藏避免重复
// Pos:    A+B 项目精华 — StatusLine mini-pet 嵌入组件（v2.21.30 方向 A 改造：18 物种通用）
//         严守 anthropic byte-equal — 仅订阅 buddy 域 + GlobalConfig，不触 services/api 或 oauth
// [NEW-FILE:#20260419-AB-06]
// 2026-04-20 W22-T2 升级：呼吸动画 + desk 同步 + /buddy stats 状态展示

import { feature } from 'bun:bundle'
import * as React from 'react'
import { Text } from '../ink.js'
import { getRuntimeSnapshot } from '../desk/bridge.js'
import { getGlobalConfig } from '../utils/config.js'
import { getCompanion } from './companion.js'
import { useCurrentPetState } from './petState.js'
import { usePetProgression } from './petXP.js'
import type { PetState, Species } from './types.js'

// Phase 0 P0-T5：StatusLine 列宽紧张 — 仅 Lv ≥ MINI_LEVEL_THRESHOLD 才追加数字角标
// why ≥10：1 位数字也占 1 cell，在窄状态栏太显眼且新手感不强；2 位"Lv 12"成长感更明显
export const MINI_LEVEL_THRESHOLD = 10 as const

/**
 * 纯函数：根据 level 决定是否在 face 后追加数字角标。
 * why pure: bun test 下 feature() 默认 false，组件本体永远 null；
 *   阈值逻辑必须独立可断言，与 shouldRenderMiniPetFor 同源设计。
 */
export function miniPetLevelBadge(level: number): string {
  if (!Number.isFinite(level) || level < MINI_LEVEL_THRESHOLD) return ''
  return String(Math.floor(level))
}

// 12 态 → 5 字符 face 映射表
// why 5 字符恒等：StatusLine 是单行布局，face 长度漂移会让 statusLineText 抖动；
//   `(x.x)` 风格固定 1 行 5 字符（左括号 + 左眼 + 嘴 + 右眼 + 右括号）
// why 字符选择：与 EYES（'·' '✦' '×' '◉' '@' '°'）风格相近 + ASCII 兼容 Windows console
export const MINI_FACES: Record<PetState, string> = {
  // 异常/通知 — 一次性最高优先级
  error: '(x.x)', // 双眼 X，故障态
  notification: '(!o!)', // 感叹号边框，引人注意
  // 系统操作 — compacting 状态
  sweeping: '(~o~)', // 波浪眼，表示扫尾
  // attention：长时间无交互但模型 loading 中
  attention: '(!_!)', // 直立感叹眼，呼唤态
  // 多任务并发
  juggling: '(@o@)', // 漩涡眼，多线程
  carrying: '(>w<)', // 微笑半合眼，搬运中
  // 单任务
  working: '(>_<)', // 闭眼皱眉，专注干活
  thinking: '(°.°)', // 圆眼，思考中
  waking: '(o.O)', // 一大一小眼，刚醒
  // 待机梯度
  idle: '(o.o)', // 标准开眼
  dozing: '(-.-)', // 半闭眼，打盹
  sleeping: '(z.z)', // Z 眼，沉睡
}

// 字符长度恒等校验常量（测试用）— 见 MiniPet.test.tsx
export const MINI_FACE_LENGTH = 5 as const

// ─────────────────────────────────────────────────────────────────────────────
// W22-T2：呼吸动画帧 — 4 帧循环 idle / 2 帧 thinking-working-sleeping
// why 多帧动画：StatusLine 1×5 字符不能写 CSS keyframes（terminal 无 CSS）；
//   改为 React 700ms tick 切换帧 — 视觉上等同呼吸/眨眼，长度恒等 5 字符。
// why 700ms：与 useCurrentPetState 内部 500ms tick 错开，避免渲染抖动同相位；
//   呼吸节奏 ~1.4s/cycle 接近真实生理（人类静息 ~12-20 次/min）。
// ─────────────────────────────────────────────────────────────────────────────

/** idle 呼吸 4 帧循环 — 模拟眨眼+轻微动作（每帧严格 5 字符）
 *  why 5 字符恒等：MINI_FACE_LENGTH=5，破坏会让 StatusLine 抖动；
 *    故 task 中 `(-.- )` 6-char 改为 `(-.-)` 视觉等价（双闭眼）
 */
export const IDLE_BREATHING_FRAMES = [
  '(o.o)', // 全开眼
  '(-.o)', // 左眼眨
  '(o.-)', // 右眼眨
  '(-.-)', // 双眼半合
] as const

/** thinking 2 帧 — 圆眼/问号交替 */
export const THINKING_FRAMES = ['(°.°)', '(?.?)'] as const

/** working 2 帧 — 紧张/微笑交替 */
export const WORKING_FRAMES = ['(>_<)', '(>w<)'] as const

/** sleeping 2 帧 — Z 眼/Zzz 交替 */
export const SLEEPING_FRAMES = ['(z.z)', '(-.-)'] as const

/** 动画 tick 周期（ms）— 与 useCurrentPetState 500ms 错相，避免同步 jitter */
export const MINI_PET_ANIM_TICK_MS = 700 as const

/**
 * 纯函数：根据 tick 计数 + state 选择当前动画帧。
 * why 纯：bun test 下 React tick 不可控；纯函数可断言任意 tick 值的输出。
 *
 * @param state 当前 PetState（12 态之一）
 * @param tick 单调递增 tick 计数（每 MINI_PET_ANIM_TICK_MS 毫秒 +1）
 * @returns 5 字符 face 字符串
 */
export function pickAnimatedFace(state: PetState, tick: number): string {
  const safeTick = Number.isFinite(tick) && tick >= 0 ? Math.floor(tick) : 0
  if (state === 'idle') {
    return IDLE_BREATHING_FRAMES[safeTick % IDLE_BREATHING_FRAMES.length]
  }
  if (state === 'thinking') {
    return THINKING_FRAMES[safeTick % THINKING_FRAMES.length]
  }
  if (state === 'working') {
    return WORKING_FRAMES[safeTick % WORKING_FRAMES.length]
  }
  if (state === 'sleeping') {
    return SLEEPING_FRAMES[safeTick % SLEEPING_FRAMES.length]
  }
  // 其他 8 态保持静态 face — 高优先级态本就少出现，无动画即"庄严"
  return MINI_FACES[state]
}

// ─────────────────────────────────────────────────────────────────────────────
// W22-T2：desk 同步 — desk 启动时 mini-pet 隐藏（避免桌面端 + status line 重复显示）
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 纯函数：基于 runtime snapshot 判定 desk 是否运行。
 * why 纯：snapshot 是 fs 读取结果，注入式可单测；
 *   不在此处直接 readRuntime —— 让调用方决定何时读盘（缓存 / TTL）。
 *
 * @param runtime null = 未运行；非 null = 已 spawn（runtime.json 存在 + 字段合法）
 */
export function isDeskRunningFor(runtime: { pid: number } | null): boolean {
  if (!runtime) return false
  if (typeof runtime.pid !== 'number' || runtime.pid <= 0) return false
  return true
}

/**
 * 默认入口：通过 getRuntimeSnapshot() 检测 desk 是否运行。
 * 失败容错：snapshot 抛错（极端 fs 异常）→ 视作未运行，保 mini-pet 显示。
 */
export function isDeskRunning(): boolean {
  try {
    return isDeskRunningFor(getRuntimeSnapshot())
  } catch {
    return false
  }
}

// why v2.21.30 方向 A：panda 系退役后 mini-pet 改"全 18 物种通用"——
//   按物种简单分组上色，保留高对比可视；ESC 直 ANSI 名（与旧 panda 系做法一致）。
//   分组依据：水鸟系蓝调 / 哺乳类暖调 / 爬虫两栖中性 / 怪奇/机械冷调 — 视觉上易区分。
type MiniColor = 'white' | 'red' | 'yellow' | 'cyan' | 'magenta' | 'green'
export const MINI_PET_COLORS: Record<Species, MiniColor> = {
  duck: 'yellow',
  goose: 'white',
  blob: 'magenta',
  cat: 'yellow',
  dragon: 'red',
  octopus: 'magenta',
  owl: 'cyan',
  penguin: 'cyan',
  turtle: 'green',
  snail: 'green',
  ghost: 'white',
  axolotl: 'magenta',
  capybara: 'yellow',
  cactus: 'green',
  robot: 'cyan',
  rabbit: 'white',
  mushroom: 'red',
  chonk: 'white',
}

/**
 * 纯函数：根据 PetState 取 face 字符串（测试用，绕开 React/feature gate）。
 * why pure: bun test 下 feature() 默认 false，组件本体永远 null；
 *   字符表逻辑必须可独立断言，否则覆盖率为 0。
 */
export function getMiniFace(state: PetState): string {
  return MINI_FACES[state]
}

/**
 * 纯函数（可注入版）：基于显式入参判定 mini-pet 是否应渲染。
 * why 拆出注入版：bun test 下 getCompanion() 的 species 由 userID hash 决定不可控；
 *   独立纯版本让测试能直接断言隐藏条件分支。
 *
 * 隐藏条件（v2.21.30 方向 A 调整）：1) 无 companion；2) companionMuted=true；
 *   3) companionMiniPet=false；4) W22-T2: deskRunning=true（避免桌面端 + status 重复）
 */
export function shouldRenderMiniPetFor(
  companion: { species: Species } | undefined,
  config: { companionMuted?: boolean; companionMiniPet?: boolean },
  deskRunning: boolean = false,
): boolean {
  if (!companion) return false
  if (config.companionMuted) return false
  // 子 feature flag — 默认 true（按计划决策点 #6 锁定，便于回滚）
  if (config.companionMiniPet === false) return false
  // W22-T2：desk 启动时 mini-pet 隐藏 — 桌面端已显示同状态，避免视觉重复
  if (deskRunning) return false
  return true
}

/**
 * 默认入口：从 GlobalConfig + getCompanion + runtime.json 读取实参后转交注入版。
 */
export function shouldRenderMiniPet(): boolean {
  return shouldRenderMiniPetFor(
    getCompanion(),
    getGlobalConfig(),
    isDeskRunning(),
  )
}

/**
 * MiniPet — StatusLine 左侧 1×5 字符宠物 face 组件。
 *
 * 渲染条件：feature('BUDDY') + shouldRenderMiniPet() 全通过。
 * 视觉占位：固定 5 字符宽，配色按物种映射，避免 Matrix 主题下与 statusline 字色撞车。
 *
 * W22-T2：新增动画 tick — idle/thinking/working/sleeping 走多帧循环；
 *   tick 周期 700ms 与 useCurrentPetState 500ms 错相，视觉无 jitter。
 */
export function MiniPet(): React.ReactNode {
  // why 必须在所有 hook 调用之前判 feature gate 也不行：feature() 是 bun:bundle 编译宏，
  //   只能直接出现在 if/三元中；hook 顺序也必须稳定。解决：feature gate 放最前 + 所有
  //   hook 都在 gate 后用条件包装是错的（违 React rules）。所以改为：feature gate 通过后
  //   再调用 useCurrentPetState；feature 关闭时直接返 null（hook 调用顺序在该分支为 0）。
  if (!feature('BUDDY')) return null
  // 注意：useCurrentPetState 内部已守 feature('BUDDY')；此处冗余调用安全，仅多 1 次 hook
  return <MiniPetInner />
}

// 拆出 inner：feature gate 通过后，hook 调用顺序在 inner 内部稳定
function MiniPetInner(): React.ReactNode {
  const petState = useCurrentPetState()
  // Phase 0 P0-T5：等级订阅必须在 early return 之前；usePetProgression 内部 feature gate
  // why bonesRarity fallback：getCompanion() 可能为空，hook 必须无条件调用 — fallback 只用于
  //   首启短瞬不渲染的场景，不影响视觉
  const progression = usePetProgression(getCompanion()?.rarity ?? 'common')
  // W22-T2：动画 tick — 700ms 推进 setTick(t => t+1)，纯函数 pickAnimatedFace 取帧
  // why useState + setInterval：与 useCurrentPetState 同模式（自带 500ms tick）；
  //   清理 return 在 unmount 自动触发，无 leak。
  const [tick, setTick] = React.useState(0)
  React.useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), MINI_PET_ANIM_TICK_MS)
    return () => clearInterval(t)
  }, [])
  // why 渲染前再判隐藏条件：getCompanion() / getGlobalConfig() / isDeskRunning() 是同步读取，
  //   不会引发 hook 顺序漂移；放在 hook 调用之后确保 React 严格模式不报警
  if (!shouldRenderMiniPet()) return null
  const companion = getCompanion()!
  const color = MINI_PET_COLORS[companion.species] ?? 'white'
  // W22-T2：用动画帧选择器替代静态 getMiniFace；其余 8 态保持静态
  const face = pickAnimatedFace(petState, tick)
  const badge = miniPetLevelBadge(progression.level)
  return <Text color={color}>{badge ? `${face}${badge}` : face}</Text>
}
