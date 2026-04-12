// Input: 用户消息 + 系统时钟 + 活动状态 + 环境变量
// Output: 聚合感知数据 SenseData（时间/活动/情绪/环境）
// Pos: assistant/ 感知聚合层，供 proactiveEngine 和 persona 消费
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"

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
    const { execFileSync } = require('child_process')
    const todoOutput = execFileSync('grep', ['-r', 'TODO\\|FIXME', '--include=*.ts', '--include=*.tsx', '-c', '.'], { encoding: 'utf-8', timeout: 5000, stdio: ['pipe', 'pipe', 'pipe'] }).toString()
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

// ─────────────────────────────────────────────────────────────────────
// OS 通知失败降级状态（模块级单例，只提示一次）
// ─────────────────────────────────────────────────────────────────────
let _osascriptFailureNotified = false

function notifyOsascriptFailure(err: string): void {
  if (_osascriptFailureNotified) return
  _osascriptFailureNotified = true

  // 判断是否是授权/辅助功能问题
  const isAuthIssue = /not\s+authori[sz]ed|not\s+allowed|assistive\s+access|accessibility/i.test(err)
  const briefErr = err.slice(0, 200)

  // 写 audit
  try {
    const { writeAuditEntry, hashArgs } = require('../utils/auditLog.js') as typeof import('../utils/auditLog.js')
    writeAuditEntry({
      session_id: 'system',
      tool_name: 'osascript-notification',
      args_hash: hashArgs({ auth: isAuthIssue }),
      risk_level: 'read-only',
      permission_decision: 'auto-denied',
      outcome: 'failure',
      error_brief: (isAuthIssue ? '[auth] ' : '') + briefErr,
    })
  } catch {}

  // 写 working memory 让 status panel 能看到
  try {
    const { setWorkingMemory } = require('./workingMemory.js') as typeof import('./workingMemory.js')
    setWorkingMemory('os-notification-degraded', JSON.stringify({
      isAuthIssue,
      error: briefErr,
      at: Date.now(),
    }))
  } catch {}

  // debug log（不直接 console.warn，避免干扰 Ink）
  try {
    const { logForDebugging } = require('../utils/debug.js') as typeof import('../utils/debug.js')
    logForDebugging(`[osascript] notification failed${isAuthIssue ? ' (auth denied)' : ''}: ${err.slice(0, 100)}`)
  } catch {}
}

/**
 * 查询当前 OS 通知通道是否降级（供 status 面板使用）
 */
export function isOsNotificationDegraded(): { degraded: boolean; isAuth: boolean; lastError: string | null } {
  try {
    const { getWorkingMemory } = require('./workingMemory.js') as typeof import('./workingMemory.js')
    const raw = getWorkingMemory('os-notification-degraded')
    if (!raw) return { degraded: false, isAuth: false, lastError: null }
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    return { degraded: true, isAuth: !!parsed.isAuthIssue, lastError: parsed.error || null }
  } catch {
    return { degraded: false, isAuth: false, lastError: null }
  }
}

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
        // 捕获 stderr 以便感知权限/授权失败并触发降级提示
        try {
          execFileSync('osascript', ['-e',
            `display notification ${JSON.stringify(notification.body)} with title "Panda" subtitle ${JSON.stringify(notification.title)}`
          ], {
            timeout: 3000,
            stdio: ['ignore', 'pipe', 'pipe'],
          })
        } catch (e) {
          const err = e as { stderr?: Buffer | string; message?: string }
          const errText = (typeof err.stderr === 'string' ? err.stderr : err.stderr?.toString?.()) || err.message || 'unknown'
          notifyOsascriptFailure(errText)
        }
      } else if (platform === 'win32') {
        // Windows: PowerShell BurntToast（使用 execFileSync 避免命令注入）
        try {
          const escapePS = (s: string) => s.replace(/`/g, '``').replace(/\$/g, '`$').replace(/"/g, '`"')
          const safeTitle = escapePS(notification.title)
          const safeBody = escapePS(notification.body)
          execFileSync('powershell', ['-c',
            `New-BurntToastNotification -Text "Panda: ${safeTitle}","${safeBody}"`
          ], { timeout: 5000 })
        } catch {
          // fallback: msg（同样用 execFileSync）
          try { execFileSync('msg', ['*', `Panda: ${notification.title} - ${notification.body}`], { timeout: 3000 }) } catch {}
        }
      } else {
        // Linux: notify-send
        try { execFileSync('notify-send', ['Panda', `${notification.title}: ${notification.body}`], { timeout: 3000 }) } catch {}
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
      // 异步 fetch + 5 秒超时，不阻塞
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      fetch(config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        signal: controller.signal,
      }).catch(() => {}).finally(() => clearTimeout(timeoutId))
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

  // 方式 3：已连接的 IM Connector 直接投递
  try {
    const { getConnectorRegistry } = require('../connectors/registry.js')
    const registry = getConnectorRegistry()
    const connectors = registry?.getConnectedConnectors?.() || []

    for (const conn of connectors) {
      try {
        if (typeof conn.sendNotification === 'function') {
          // 异步发送，不 await（避免阻塞推送管道）
          void conn.sendNotification(notification).catch(() => {})
        }
      } catch {}
    }
  } catch {}

  // 方式 4：高优先级通知填充 reverse-push 队列
  try {
    if (notification.type === 'warning' || notification.type === 'action') {
      const { setWorkingMemory, getWorkingMemory } = require('./workingMemory.js')
      const existing = (() => { try { const v = getWorkingMemory('im-reverse-push-queue'); if (!v) return []; const parsed = typeof v === 'string' ? JSON.parse(v) : v; return Array.isArray(parsed) ? parsed : [] } catch { return [] } })()
      existing.push({
        platform: 'all',
        target: 'default',
        content: `[${notification.title || notification.type}] ${notification.body || ''}`,
        timestamp: Date.now()
      })
      setWorkingMemory('im-reverse-push-queue', JSON.stringify(existing.slice(-20)))
    }
  } catch {}

  // 方式 5：通过已注册的 MCP Channel 插件推送（WeChat/飞书等）
  // 使用 channelRegistry 中缓存的 server 引用和最近 inbound context
  try {
    const { pushViaChannelMCP } = require('./channelRegistry.js')
    pushViaChannelMCP(notification.title, notification.body)
  } catch {}
}

export function getNotifications(): readonly PandaNotification[] {
  return notificationQueue
}

export function clearNotifications(): void {
  notificationQueue.length = 0
}
