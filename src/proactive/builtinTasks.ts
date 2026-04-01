import type { ProactiveTask } from './taskRegistry.js'

export const BUILTIN_TASKS: ProactiveTask[] = [
  {
    id: 'dream-consolidate',
    description: '记忆整理 · Memory consolidation',
    cron: '0 22 * * *',
    enabled: false,
    action: async () => {},
  },
  {
    id: 'morning-briefing',
    description: '晨间简报 · Morning briefing',
    cron: '0 7 * * *',
    enabled: false,
    action: async () => {},
  },
  {
    id: 'code-health',
    description: '代码健康检查 · Code health check',
    cron: '0 23 * * *',
    enabled: false,
    action: async () => {},
  },
]
