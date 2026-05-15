/**
 * Color command - minimal metadata only.
 * Implementation is lazy-loaded from color.ts to reduce startup time.
 */
import type { Command } from '../../commands.js'

const color = {
  type: 'local-jsx',
  name: 'color',
  description: 'Set the prompt bar color for this session · 设置本次会话提示栏颜色',
  immediate: true,
  argumentHint: '[color|default]',
  load: () => import('./color.js'),
} satisfies Command

export default color
