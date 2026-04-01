import type { Command } from '../../commands.js'

const persona = {
  type: 'local',
  name: 'persona',
  description: 'Switch persona mode · 切换人格模式',
  argumentHint: '[work|companion|study|creative|butler]',
  supportsNonInteractive: false,
  load: () => import('./persona.js'),
} satisfies Command

export default persona
