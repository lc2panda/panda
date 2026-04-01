import type { Command } from '../../commands.js'

export default {
  type: 'local-jsx',
  name: 'usage',
  description: 'Show plan usage limits · 显示套餐用量限额',
  availability: ['claude-ai'],
  load: () => import('./usage.js'),
} satisfies Command
