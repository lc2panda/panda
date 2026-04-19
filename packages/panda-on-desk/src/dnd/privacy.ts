// Input:  NotificationEvent + 当前 DND 状态 + 场景隐私级别 + 用户显式启用集合
// Output: shouldDeliverNotification(event) → boolean（是否放行 forward）
// Pos:    panda-on-desk dispatcher 入口 gate；A3 §5 隐私敏感场景过滤
//         逻辑唯一职责：决策放行；不持久化、不发通知
//
// [NEW-FILE:#20260419-P2-18]
// 2026-04-19 +08:00 P2-T5 实装（agent-ε-P2-dnd-retry）

import type { NotificationEvent } from '../bridge/types.js'
import { getSceneMeta, type ScenePrivacy } from '../scene/registry.js'
import { isInDnd } from './state.js'
import { isInScheduledDnd } from './schedule.js'

/**
 * 用户显式启用的高隐私场景集合 — 内存态，settings 面板写入。
 * privacy=high 场景必须在此集合中才放行。
 */
const explicitlyEnabledHighPrivacy = new Set<string>()

export function enableHighPrivacyScene(scenarioId: string): void {
  explicitlyEnabledHighPrivacy.add(scenarioId)
}

export function disableHighPrivacyScene(scenarioId: string): void {
  explicitlyEnabledHighPrivacy.delete(scenarioId)
}

export function isHighPrivacySceneEnabled(scenarioId: string): boolean {
  return explicitlyEnabledHighPrivacy.has(scenarioId)
}

/**
 * 隐私 + DND 综合决策。
 *
 * 规则（按短路顺序）：
 *   1. DND on（含手动 + 计划）+ level !== 'error' → false（error 强透传）
 *   2. scene privacy='high' + 用户未显式 enable → false
 *   3. scene privacy='medium' + DND on → false
 *   4. scene privacy='low' + DND on + level='info' → false
 *   5. 其余 → true
 *
 * 备注：
 *   - 未注册场景按 privacy='low' 处理（保守：信息级在 DND 期间仍抑制）
 *   - DND on 判定：手动 isInDnd() OR 计划 isInScheduledDnd() 任一命中
 */
export function shouldDeliverNotification(event: NotificationEvent): boolean {
  const meta = getSceneMeta(event.scenarioId)
  const privacy: ScenePrivacy = meta?.privacy ?? 'low'
  const dnd = isInDnd() || isInScheduledDnd()

  // 1. DND on + 非 error → 抑制（含 high/medium 在 DND 期间一律走规则 2/3 抑制）
  //    注：error 强透传仅对 low privacy 生效；medium/high 即便 error 也应受隐私规则约束
  if (dnd && event.level !== 'error') {
    // 进入下方 privacy 规则继续判定（不立即返回，以便 high/medium 也能被进一步约束）
    return checkPrivacyUnderDnd(privacy, event.scenarioId, event.level)
  }

  // DND off — 仅校验 high privacy 的显式启用要求
  if (privacy === 'high' && !explicitlyEnabledHighPrivacy.has(event.scenarioId)) {
    return false
  }

  // DND on + error → 强透传（包括 high/medium）— 紧急错误优先于隐私
  return true
}

function checkPrivacyUnderDnd(
  privacy: ScenePrivacy,
  scenarioId: string,
  level: NotificationEvent['level'],
): boolean {
  if (privacy === 'high') {
    // DND 期间 high privacy 必须显式启用且仍受 DND 抑制（下面 medium 同理）
    if (!explicitlyEnabledHighPrivacy.has(scenarioId)) return false
    // 已显式启用 → 走 medium 同等规则：DND on + 非 error → 抑制
    return false
  }
  if (privacy === 'medium') {
    // DND on + medium → 一律抑制
    return false
  }
  // privacy === 'low'
  if (level === 'info') {
    // DND on + low + info → 抑制
    return false
  }
  // low + warning/success → 透传
  return true
}

// ─────────────────────────────────────────────────────────────────────────────
// 测试辅助
// ─────────────────────────────────────────────────────────────────────────────

export function __resetPrivacyForTesting(): void {
  explicitlyEnabledHighPrivacy.clear()
}

export function __getEnabledHighPrivacyForTesting(): ReadonlySet<string> {
  return explicitlyEnabledHighPrivacy
}
