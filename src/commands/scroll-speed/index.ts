// Input: slash invocation `/scroll-speed [preset|1-10]`
// Output: persists wheel-event row multiplier to global config + process.env
// Pos: registered in src/commands.ts (alongside /color). Read path is
//      ScrollKeybindingHandler.readScrollSpeedBase().
//
// v2.1.139 introduces this command. Implementation is lazy-loaded from
// scroll-speed.ts to keep startup cheap — mirrors /color's two-file layout.
import type { Command } from '../../commands.js'

const scrollSpeed = {
  type: 'local-jsx',
  name: 'scroll-speed',
  description:
    'Tune mouse-wheel scroll speed · 调节鼠标滚轮速度 (slow|normal|fast|1-10)',
  immediate: true,
  argumentHint: '[slow|normal|fast|1-10]',
  load: () => import('./scroll-speed.js'),
} satisfies Command

export default scrollSpeed
