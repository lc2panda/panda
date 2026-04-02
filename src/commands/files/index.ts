import type { Command } from '../../commands.js'

const files = {
  type: 'local',
  name: 'files',
  description: 'List all files currently in context · 列出当前上下文中的所有文件',
  isEnabled: () => true,
  supportsNonInteractive: true,
  load: () => import('./files.js'),
} satisfies Command

export default files
