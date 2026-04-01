import type { Command } from '../../commands.js'

const rename = {
  type: 'local-jsx',
  name: 'rename',
  description: 'Rename the current conversation · 重命名当前对话',
  immediate: true,
  argumentHint: '[name]',
  load: () => import('./rename.js'),
} satisfies Command

export default rename
