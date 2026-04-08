import { getTimeSense } from './timeSense.js'
import { getActivitySense } from './activitySense.js'
import { getMoodSense } from './moodSense.js'
import { getEnvSense } from './envSense.js'

export interface SenseContext {
  time: ReturnType<typeof getTimeSense>
  activity: ReturnType<typeof getActivitySense>
  mood: ReturnType<typeof getMoodSense>
  env: ReturnType<typeof getEnvSense>
  git: ReturnType<typeof getGitSense>
  project: ReturnType<typeof getProjectSense>
}

export function getSenseContext(): SenseContext {
  return {
    time: getTimeSense(),
    activity: getActivitySense(),
    mood: getMoodSense(),
    env: getEnvSense(),
    git: getGitSense(),
    project: getProjectSense(),
  }
}

// ═══════════════════════════════════════════════════════════════════
// SA-P4: 感知引擎升级
// ═══════════════════════════════════════════════════════════════════

/**
 * Git 状态感知。
 */
export function getGitSense(): { branch: string; uncommitted: number; behindRemote: boolean } {
  try {
    const { execSync } = require('child_process')
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8', timeout: 3000 }).trim()
    const status = execSync('git status --porcelain', { encoding: 'utf-8', timeout: 3000 })
    const uncommitted = status.split('\n').filter(Boolean).length

    let behindRemote = false
    try {
      const behind = execSync('git rev-list HEAD..@{upstream} --count', { encoding: 'utf-8', timeout: 3000 }).trim()
      behindRemote = parseInt(behind, 10) > 0
    } catch {}

    return { branch, uncommitted, behindRemote }
  } catch {
    return { branch: 'unknown', uncommitted: 0, behindRemote: false }
  }
}

/**
 * 项目状态感知。
 */
export function getProjectSense(): { todoCount: number; fixmeCount: number } {
  try {
    const { execSync } = require('child_process')
    const todoOutput = execSync('grep -r "TODO\\|FIXME" --include="*.ts" --include="*.tsx" -c . 2>/dev/null || echo "0"', { encoding: 'utf-8', timeout: 5000 })
    const total = todoOutput.split('\n').reduce((sum: number, line: string) => {
      const match = line.match(/:(\d+)$/)
      return sum + (match ? parseInt(match[1], 10) : 0)
    }, 0)
    return { todoCount: total, fixmeCount: 0 }
  } catch {
    return { todoCount: 0, fixmeCount: 0 }
  }
}

// ═══════════════════════════════════════════════════════════════════
// SA-P4: 通知系统
// ═══════════════════════════════════════════════════════════════════

/**
 * 结构化通知系统。
 * 支持三种渠道：statusLine / inline / system notification。
 */
export interface PandaNotification {
  type: 'info' | 'warning' | 'action'
  title: string
  body: string
  channel: 'statusLine' | 'inline' | 'system'
}

const notificationQueue: PandaNotification[] = []
const MAX_QUEUE = 20

export function pushNotification(notification: PandaNotification): void {
  notificationQueue.push(notification)
  if (notificationQueue.length > MAX_QUEUE) notificationQueue.shift()

  // macOS 系统通知
  if (notification.channel === 'system') {
    try {
      const { execSync } = require('child_process')
      execSync(`osascript -e 'display notification "${notification.body.replace(/"/g, '\\"')}" with title "Panda Code" subtitle "${notification.title.replace(/"/g, '\\"')}"'`, { timeout: 3000 })
    } catch {}
  }
}

export function getNotifications(): readonly PandaNotification[] {
  return notificationQueue
}

export function clearNotifications(): void {
  notificationQueue.length = 0
}
