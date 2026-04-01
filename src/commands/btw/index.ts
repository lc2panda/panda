import type { Command } from '../../commands.js'

const btw = {
  type: 'local-jsx',
  name: 'btw',
  description:
    'Ask a quick side question without interrupting the main conversation · 快速插问，不打断主对话',
  immediate: true,
  argumentHint: '<question>',
  load: () => import('./btw.js'),
} satisfies Command

export default btw
