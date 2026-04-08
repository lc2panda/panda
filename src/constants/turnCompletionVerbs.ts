// Past tense verbs for turn completion messages
// These verbs work naturally with "for [duration]" (e.g., "Worked for 5s")
import { isZh } from '../utils/i18n.js'

export const TURN_COMPLETION_VERBS = [
  'Baked',
  'Brewed',
  'Churned',
  'Cogitated',
  'Cooked',
  'Crunched',
  'Sautéed',
  'Worked',
]

const TURN_COMPLETION_VERBS_ZH = [
  '编译',    // Baked
  '解析',    // Brewed
  '迭代',    // Churned
  '推理',    // Cogitated
  '构建',    // Cooked
  '运算',    // Crunched
  '优化',    // Sautéed
  '处理',    // Worked
]

export function getTurnCompletionVerbs(): string[] {
  return isZh() ? TURN_COMPLETION_VERBS_ZH : TURN_COMPLETION_VERBS
}
