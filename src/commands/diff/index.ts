import type { Command } from '../../commands.js'

export default {
  type: 'local-jsx',
  name: 'diff',
  description: 'View uncommitted changes and per-turn diffs · 查看未提交的变更和每轮差异',
  load: () => import('./diff.js'),
} satisfies Command
