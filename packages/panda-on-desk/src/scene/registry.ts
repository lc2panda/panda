// Input:  scenarioId 字面量
// Output: 场景元数据（默认开关 / 级别 / 隐私级别）— 供 dispatcher 决策放行/抑制
// Pos:    A3 §3 TOP 10 场景 + permission-request 注册中心；P2-T2~T7 调用
//
// [NEW-FILE:#20260419-P2-04]
// 2026-04-19 +08:00 agent-α-P2-protocol · TOP 10 + permission-request 共 11 项
// TODO: P2-T7 各场景接入时同步追加；P2-T5 隐私级别接 settings 面板

import type { NotificationLevel } from '../bridge/types.js'

/** 隐私敏感级别 — A3 §5：medium/high 启用前需用户确认 */
export type ScenePrivacy = 'low' | 'medium' | 'high'

export interface SceneMeta {
  /** 默认是否开启 — 主方案 §7 决策 #8 分级（系统健康/CI on，efficiency off） */
  defaultOn: boolean
  /** 默认通知级别 — overlay/system 颜色 + DND 期间是否透传 */
  level: NotificationLevel
  /** 隐私级别 — 影响首次启用确认流程 */
  privacy: ScenePrivacy
}

/**
 * A3 §3 TOP 10 场景 + permission-request 注册表
 *
 * 主方案 §7 决策 #8（场景默认开关分级）：
 *   - 系统健康 / CI / Git / 日历 / 晨间 / DeepDream / 上下文 / 权限：默认 ON
 *   - efficiency 类（番茄/碎片/焦点）/ midnight-care 深夜关怀：默认 OFF
 */
export const SCENE_REGISTRY = {
  // TOP 10 #3 晨间简报 — builtinTasks.ts cron 7:00
  'morning-brief': { defaultOn: true, level: 'info', privacy: 'low' },
  // TOP 10 #4 磁盘告警 — systemHealth.ts */15
  'disk-low': { defaultOn: true, level: 'warning', privacy: 'low' },
  // TOP 10 #4 内存告警 — systemHealth.ts */5
  'memory-pressure': { defaultOn: true, level: 'warning', privacy: 'low' },
  // TOP 10 #4 网络异常 — systemHealth.ts */3
  'network-anomaly': { defaultOn: true, level: 'warning', privacy: 'low' },
  // TOP 10 #5 Git 远程变更 — devScenarios.ts */2h
  'git-remote-changed': { defaultOn: true, level: 'info', privacy: 'low' },
  // TOP 10 #1 CI/CD 失败 — devScenarios.ts */15
  'ci-failed': { defaultOn: true, level: 'error', privacy: 'low' },
  // TOP 10 #2 日历提醒 — builtinTasks.ts macOS-only */30
  'calendar-reminder': { defaultOn: true, level: 'info', privacy: 'medium' },
  // TOP 10 #6 DeepDream 完成 — builtinTasks.ts 22:00
  'deepdream-done': { defaultOn: true, level: 'info', privacy: 'low' },
  // TOP 10 #7 上下文压力 — proactiveEngine.ts:208
  'context-pressure': { defaultOn: true, level: 'info', privacy: 'low' },
  // TOP 10 #10 深夜工作关怀 — personalLife.ts cron 22-05 */30
  // why: 主方案 §7 决策 #8 efficiency 类默认 off，避免首启信息洪水
  'midnight-care': { defaultOn: false, level: 'info', privacy: 'low' },
  // TOP 10 #10 权限气泡 — Permission Request 协议
  'permission-request': { defaultOn: true, level: 'warning', privacy: 'low' },
} as const satisfies Record<string, SceneMeta>

/** 场景 id 联合类型 — 编译期约束业务方拼写 */
export type RegisteredSceneId = keyof typeof SCENE_REGISTRY

/**
 * 查询场景元数据 — 未注册返回 null（dispatcher 决策：未注册场景按 default warning 处理 + 警告日志）
 */
export function getSceneMeta(scenarioId: string): SceneMeta | null {
  if (Object.prototype.hasOwnProperty.call(SCENE_REGISTRY, scenarioId)) {
    return SCENE_REGISTRY[scenarioId as RegisteredSceneId]
  }
  return null
}

/** 列举所有默认开启场景 — settings 面板初始化用 */
export function listDefaultOnScenarios(): RegisteredSceneId[] {
  return (Object.keys(SCENE_REGISTRY) as RegisteredSceneId[]).filter(
    id => SCENE_REGISTRY[id].defaultOn,
  )
}
