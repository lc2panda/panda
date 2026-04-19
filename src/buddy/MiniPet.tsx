// Input:  useCurrentPetState() 12 态信号 + getCompanion() 物种 + GlobalConfig 子开关
// Output: StatusLine 左侧 1×5 字符 face（如 "(o.o)"），按 PetState 切表 + 按 species 上色
// Pos:    A+B 项目精华 — StatusLine mini-pet 嵌入组件（v2.21.30 方向 A 改造：18 物种通用）
//         严守 anthropic byte-equal — 仅订阅 buddy 域 + GlobalConfig，不触 services/api 或 oauth
// [NEW-FILE:#20260419-AB-06]

import { feature } from 'bun:bundle'
import * as React from 'react'
import { Text } from '../ink.js'
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
 *   3) companionMiniPet=false。物种 gate 移除——18 物种均可渲染。
 */
export function shouldRenderMiniPetFor(
  companion: { species: Species } | undefined,
  config: { companionMuted?: boolean; companionMiniPet?: boolean },
): boolean {
  if (!companion) return false
  if (config.companionMuted) return false
  // 子 feature flag — 默认 true（按计划决策点 #6 锁定，便于回滚）
  if (config.companionMiniPet === false) return false
  return true
}

/**
 * 默认入口：从 GlobalConfig + getCompanion 读取实参后转交注入版。
 */
export function shouldRenderMiniPet(): boolean {
  return shouldRenderMiniPetFor(getCompanion(), getGlobalConfig())
}

/**
 * MiniPet — StatusLine 左侧 1×5 字符宠物 face 组件。
 *
 * 渲染条件：feature('BUDDY') + shouldRenderMiniPet() 全通过。
 * 视觉占位：固定 5 字符宽，配色按物种映射，避免 Matrix 主题下与 statusline 字色撞车。
 *
 * why 不写 useEffect / 副作用：本组件纯订阅 useCurrentPetState（已自带 500ms tick），
 *   不引入二级 timer 避免 R4 风险（hook 多重 re-render 拖慢 sprite 节拍）。
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
  // why 渲染前再判隐藏条件：getCompanion() / getGlobalConfig() 是同步读取，
  //   不会引发 hook 顺序漂移；放在 hook 调用之后确保 React 严格模式不报警
  if (!shouldRenderMiniPet()) return null
  const companion = getCompanion()!
  const color = MINI_PET_COLORS[companion.species] ?? 'white'
  const face = getMiniFace(petState)
  const badge = miniPetLevelBadge(progression.level)
  return <Text color={color}>{badge ? `${face}${badge}` : face}</Text>
}
