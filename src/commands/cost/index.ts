/**
 * Cost command — thin shim entry，转交 UnifiedUsage 容器并默认 Cost tab。
 * 旧 'local' 文本路径已替换为 'local-jsx'，与 /usage /stats 共用同一个 3-tab 屏幕。
 *
 * 与上游 v2.1.118 对齐：/cost /stats /usage 三个入口均对所有用户可见，
 * 跳到对应 tab；订阅用户在 cost tab 看订阅说明，API users 看 session cost。
 */
import type { Command } from '../../commands.js'

const cost = {
  type: 'local-jsx',
  name: 'cost',
  description:
    'Show the total cost and duration of the current session · 显示当前会话总花费和时长',
  load: () => import('./cost.js'),
} satisfies Command

export default cost
