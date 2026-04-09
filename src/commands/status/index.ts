import type { Command } from '../../commands.js'

const status = {
  type: 'local-jsx',
  name: 'status',
  description:
    'Show Panda status including version, model, account, API connectivity, and tool statuses · 显示状态（版本、模型、账户、API 连通性等）',
  immediate: true,
  load: () => import('./status.js'),
} satisfies Command

export default status
