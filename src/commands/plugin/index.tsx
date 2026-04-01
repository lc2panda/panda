import type { Command } from '../../commands.js';
const plugin = {
  type: 'local-jsx',
  name: 'plugin',
  aliases: ['plugins', 'marketplace'],
  description: 'Manage Panda Code plugins · 管理插件',
  immediate: true,
  load: () => import('./plugin.js')
} satisfies Command;
export default plugin;
