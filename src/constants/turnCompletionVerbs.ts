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
  '烘好了',
  '酿好了',
  '搅好了',
  '参透了',
  '炒好了',
  '磨好了',
  '煎好了',
  '搞定了',
]

export function getTurnCompletionVerbs(): string[] {
  return isZh() ? TURN_COMPLETION_VERBS_ZH : TURN_COMPLETION_VERBS
}
