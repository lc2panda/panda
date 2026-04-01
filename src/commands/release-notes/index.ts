import type { Command } from '../../commands.js'

const releaseNotes: Command = {
  description: 'View release notes · 查看发行说明',
  name: 'release-notes',
  type: 'local',
  supportsNonInteractive: true,
  load: () => import('./release-notes.js'),
}

export default releaseNotes
