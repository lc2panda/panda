import type { Command } from '../../commands.js'

const stats = {
  type: 'local-jsx',
  name: 'stats',
  description: 'Show your Panda usage statistics and activity · 显示使用统计和活动',
  load: () => import('./stats.js'),
} satisfies Command

export default stats
