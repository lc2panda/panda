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
  '焙制',    // Baked — 慢火烘焙，精工细作
  '酿造',    // Brewed — 深度发酵，厚积薄发
  '研磨',    // Churned — 反复研磨，去粗取精
  '推演',    // Cogitated — 逻辑推演，层层递进
  '烹制',    // Cooked — 大火烹制，一气呵成
  '运算',    // Crunched — 高速运算，数据碾压
  '煎制',    // Sautéed — 文火煎制，恰到好处
  '处理',    // Worked — 稳步处理，使命必达
]

export function getTurnCompletionVerbs(): string[] {
  return isZh() ? TURN_COMPLETION_VERBS_ZH : TURN_COMPLETION_VERBS
}
