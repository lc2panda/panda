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
  channel: 'statusLine' | 'inline' | 'system' | 'all'
}

const notificationQueue: PandaNotification[] = []
const MAX_QUEUE = 20

export function pushNotification(notification: PandaNotification): void {
  notificationQueue.push(notification)
  if (notificationQueue.length > MAX_QUEUE) notificationQueue.shift()

  const shouldSystem = notification.channel === 'system' || notification.channel === 'all'

  // 系统通知（跨平台）
  if (shouldSystem) {
    try {
      const { execFileSync, execSync } = require('child_process')
      const platform = require('os').platform()
      if (platform === 'darwin') {
        // macOS: osascript（使用 execFileSync 避免 shell 注入）
        execFileSync('osascript', ['-e',
          `display notification ${JSON.stringify(notification.body)} with title "Panda Code" subtitle ${JSON.stringify(notification.title)}`
        ], { timeout: 3000 })
      } else if (platform === 'win32') {
        // Windows: PowerShell BurntToast 或原生 toast
        try {
          execSync(`powershell -c "New-BurntToastNotification -Text 'Panda Code: ${notification.title}','${notification.body.replace(/'/g, "''")}'\" 2>nul`, { timeout: 5000 })
        } catch {
          // fallback: msg 命令
          try { execSync(`msg %username% "Panda Code: ${notification.title} - ${notification.body}"`, { timeout: 3000 }) } catch {}
        }
      } else {
        // Linux: notify-send
        try { execFileSync('notify-send', ['Panda Code', `${notification.title}: ${notification.body}`], { timeout: 3000 }) } catch {}
      }
    } catch {}
  }

  // Channel 出站推送——通过 MCP Channel 工具发送到外部平台
  if (notification.channel === 'all') {
    _pushToChannels(notification)
  }
}

/**
 * Channel 出站推送：扫描已连接的 MCP Channel Server，通过其 send_message 工具推送
 * 如果用户配置了 webhook，也同时推送
 */
function _pushToChannels(notification: PandaNotification): void {
  // 方式 1：Webhook 推送（用户在 proactive.json 中配置 webhookUrl）
  try {
    const { readFileSync } = require('fs')
    const { join } = require('path')
    const { homedir } = require('os')
    const configPath = join(homedir(), '.pandacc', 'config', 'proactive.json')
    const config = JSON.parse(readFileSync(configPath, 'utf-8'))
    if (config.webhookUrl) {
      const payload = JSON.stringify({
        source: 'panda-code',
        type: notification.type,
        title: notification.title,
        body: notification.body,
        timestamp: new Date().toISOString(),
      })
      // 异步 fetch，不阻塞
      fetch(config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      }).catch(() => {})
    }
  } catch {}

  // 方式 2：写入 Channel 队列文件，供 Channel MCP Server 轮询读取
  try {
    const { appendFileSync, mkdirSync } = require('fs')
    const { join } = require('path')
    const { homedir } = require('os')
    const queueDir = join(homedir(), '.pandacc', 'channels', 'outbox')
    try { mkdirSync(queueDir, { recursive: true }) } catch {}
    const entry = JSON.stringify({
      type: notification.type,
      title: notification.title,
      body: notification.body,
      timestamp: new Date().toISOString(),
    }) + '\n'
    appendFileSync(join(queueDir, 'notifications.jsonl'), entry)
  } catch {}
}

export function getNotifications(): readonly PandaNotification[] {
  return notificationQueue
}

export function clearNotifications(): void {
  notificationQueue.length = 0
}
