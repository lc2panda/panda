// Input: SessionStatus + SessionShape
// Output: 状态图标字符 + chalk 颜色函数
// Pos: src/components/AgentView/ —— 上游官方规范的状态可视化对齐
//
// 规范来源（task brief）：
//  - 颜色：动画=Working / 黄=Needs input / 灰=Idle / 绿=Completed / 红=Failed / 灰=Stopped
//  - 形状：✻/✽=活 / ∙=退出 / ✢=loop 睡眠

import chalk from 'chalk'
import figures from 'figures'
import type { SessionShape, SessionStatus } from './types.js'

/** 用于动画交替的两个 working 图标。 */
export const WORKING_FRAMES = ['✻', '✽'] as const

/** 形状到图标的固定映射（非 working 状态使用）。 */
function shapeIcon(shape: SessionShape): string {
  switch (shape) {
    case 'alive':
      return '✻'
    case 'exited':
      return '∙'
    case 'looping':
      return '✢'
  }
}

/**
 * 状态 → chalk 颜色函数（默认 fg）。
 * "动画" 状态在调用方按时间轴切换 WORKING_FRAMES。
 */
export function statusColor(status: SessionStatus): (s: string) => string {
  switch (status) {
    case 'working':
      return chalk.cyan.bold
    case 'waiting':
      return chalk.yellow.bold
    case 'idle':
      return chalk.gray
    case 'completed':
      return chalk.green
    case 'failed':
      return chalk.red.bold
    case 'stopped':
      return chalk.gray.dim
  }
}

/**
 * 选择图标：working 状态会闪烁两帧（调用方传 tick % 2）。
 */
export function statusIcon(
  status: SessionStatus,
  shape: SessionShape,
  tick: number = 0,
): string {
  if (status === 'working' && shape === 'alive') {
    return WORKING_FRAMES[tick % WORKING_FRAMES.length]!
  }
  return shapeIcon(shape)
}

/**
 * 渲染带颜色的图标（dashboard 内嵌使用）。
 */
export function renderStatusGlyph(
  status: SessionStatus,
  shape: SessionShape,
  tick: number,
): string {
  return statusColor(status)(statusIcon(status, shape, tick))
}

/** Pin 图标。 */
export const PIN_ICON = figures.pointer
export const STAR_ICON = '★'

/** PR 状态点（Tier 3 实现用，Tier 1 占位）。 */
export function prDot(status: 'open' | 'merged' | 'closed' | null): string {
  if (!status) return ''
  switch (status) {
    case 'open':
      return chalk.green('●')
    case 'merged':
      return chalk.magenta('●')
    case 'closed':
      return chalk.gray('●')
  }
}

/** 分组标题颜色。 */
export function groupTitleColor(label: string): string {
  return chalk.bold.underline(label)
}

/** Status 显示标签（与上游字幕对齐）。 */
export function statusLabel(status: SessionStatus): string {
  switch (status) {
    case 'working':
      return 'Working'
    case 'waiting':
      return 'Needs input'
    case 'idle':
      return 'Ready for review'
    case 'completed':
      return 'Completed'
    case 'failed':
      return 'Failed'
    case 'stopped':
      return 'Stopped'
  }
}
