import type { Command } from '../../commands.js'

const rewind = {
  description: `Restore the code and/or conversation to a previous point · 将代码/对话回退到之前的节点`,
  name: 'rewind',
  aliases: ['checkpoint'],
  argumentHint: '',
  type: 'local',
  supportsNonInteractive: false,
  load: () => import('./rewind.js'),
} satisfies Command

export default rewind
