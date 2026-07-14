/**
 * Query source identifier for cache isolation and tracking
 *
 * 'skill_advisor_call' — 技能调用顾问模型的查询来源标识
 */
export type QuerySource =
  | 'skill_advisor_call'
  | 'agent:general'
  | 'agent:explore'
  | 'repl_main_thread'
  | 'compact'
  | string
