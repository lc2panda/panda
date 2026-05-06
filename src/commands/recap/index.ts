/**
 * Recap command - minimal metadata only.
 * Implementation is lazy-loaded from recap.ts to mirror /color pattern
 * (src/commands/color/index.ts) — avoids the V8 Function.prototype.call
 * collision that affected v2.25.48~v2.25.59 inline `load: () => Promise.resolve(...)`
 * form, which caused /recap to silently no-op in Comdr's terminal.
 *
 * NEW-FILE:#20260426-01 (origin v2.25.48)
 */
import type { Command } from '../../commands.js'

const recap = {
  type: 'local-jsx',
  name: 'recap',
  description:
    'Generate a "where we left off" summary of the current session · 立即生成"上次进度"摘要卡片',
  immediate: true,
  load: () => import('./recap.js'),
} satisfies Command

export default recap
