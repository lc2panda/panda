// Input:  /goal slash command registration metadata
// Output: Command record consumed by src/commands.ts COMMANDS list
// Pos:    src/commands/goal/index.ts — minimal metadata only; implementation
//         is lazy-loaded from goal.ts to mirror /recap pattern (avoids the V8
//         Function.prototype.call dispatch collision documented at
//         src/commands/recap/index.ts header).
//
// NEW-FILE:#20260515-02 — implements upstream Claude Code v2.1.139 `/goal`.
//
// 一旦我被修改，请更新所属文件夹的 README.md（如有）。

import type { Command } from '../../commands.js'

const goal = {
  type: 'local-jsx',
  name: 'goal',
  description:
    'Set a session goal Panda works toward (`/goal <condition>` · `/goal` status · `/goal clear` reset) · 设置会话目标',
  argumentHint: '<condition>',
  immediate: true,
  load: () => import('./goal.js'),
} satisfies Command

export default goal
