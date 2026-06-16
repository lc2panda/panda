export const AGENT_TOOL_NAME = 'Agent'
// Legacy wire name for backward compat (permission rules, hooks, resumed sessions)
export const LEGACY_AGENT_TOOL_NAME = 'Task'
export const VERIFICATION_AGENT_TYPE = 'verification'

// Built-in agents that run once and return a report — the parent never
// SendMessages back to continue them. Skip the agentId/SendMessage/usage
// trailer for these to save tokens (~135 chars × 34M Explore runs/week).
export const ONE_SHOT_BUILTIN_AGENT_TYPES: ReadonlySet<string> = new Set([
  'Explore',
  'Plan',
])

// [上游 2.1.172] 子代理嵌套派生硬上限：允许 5 层（depth 0..4），
// 第 6 层（depth 5）起拒绝派生，防止子代理无限递归 fan-out。
// 新子代理运行深度 = (父 queryTracking.depth ?? -1) + 1。
export const MAX_SUBAGENT_DEPTH = 5

/**
 * 给定父级 queryTracking.depth（根为 undefined/-1），判断再派生一个子代理
 * 是否会超过 MAX_SUBAGENT_DEPTH 硬上限。
 * 新子代理深度 = (parentDepth ?? -1) + 1；当其 >= 上限时拒绝。
 */
export function wouldExceedSubagentDepth(parentDepth: number | undefined): boolean {
  const childDepth = (parentDepth ?? -1) + 1
  return childDepth >= MAX_SUBAGENT_DEPTH
}
