export interface ProactiveTask {
  id: string
  description: string
  cron?: string
  condition?: () => boolean
  action: () => Promise<void>
  enabled: boolean
}

const _tasks = new Map<string, ProactiveTask>()

export function registerTask(task: ProactiveTask) {
  _tasks.set(task.id, task)
}

export function unregisterTask(id: string) {
  _tasks.delete(id)
}

export function getTask(id: string) {
  return _tasks.get(id)
}

export function getAllTasks() {
  return Array.from(_tasks.values())
}

export function getEnabledTasks() {
  return getAllTasks().filter(t => t.enabled)
}
