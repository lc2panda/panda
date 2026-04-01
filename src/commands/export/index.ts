import type { Command } from '../../commands.js'

const exportCommand = {
  type: 'local-jsx',
  name: 'export',
  description: 'Export the current conversation to a file or clipboard · 导出当前对话到文件或剪贴板',
  argumentHint: '[filename]',
  load: () => import('./export.js'),
} satisfies Command

export default exportCommand
