import type { Command } from '../../commands.js'

const memory: Command = {
  type: 'local-jsx',
  name: 'memory',
  description: 'Edit Claude memory files · 编辑记忆文件',
  load: () => import('./memory.js'),
}

export default memory
