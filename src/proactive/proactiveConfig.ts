// Input: ~/.pandacc/config/proactive.json 用户自定义阈值
// Output: 合并后的阈值配置，供所有场景任务使用
// Pos: proactive/ 配置层，支持用户覆盖默认阈值

import { readFileSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

export interface ProactiveThresholds {
  // A. 系统健康
  diskFreePercent: number       // 磁盘可用百分比告警线，默认 10
  diskFreeGB: number            // 磁盘可用 GB 告警线，默认 20
  memoryUsedPercent: number     // 内存使用百分比告警线，默认 85
  batteryLowPercent: number     // 低电量告警线，默认 20
  batteryHealthPercent: number  // 电池健康度告警线，默认 80
  networkLatencyMs: number      // 网络延迟告警线，默认 500
  networkLossPercent: number    // 网络丢包告警线，默认 30

  // C. 文件
  downloadsFileCount: number    // 下载目录文件数告警线，默认 50
  downloadsMaxGB: number        // 下载目录大小告警线，默认 5
  desktopFileCount: number      // 桌面文件数告警线，默认 30
  trashMaxGB: number            // 回收站大小告警线，默认 5

  // D. 开发
  gitUncommittedHours: number   // Git 未提交告警线（小时），默认 3
  gitBranchStaleDays: number    // Git 分支过期天数，默认 7
  todoGrowthThreshold: number   // TODO 周增长告警线，默认 5

  // F. 效率
  noBreakMinutes: number        // 持续工作无休息告警线（分钟），默认 90
  lateNightStartHour: number    // 深夜工作关怀起始时，默认 23
  lateNightEndHour: number      // 深夜工作关怀结束时，默认 5

  // G. 安全
  sshKeyMaxDays: number         // SSH key 轮换告警天数，默认 365
  sslCertWarnDays: number       // SSL 证书到期告警天数，默认 30

  // 场景启用开关（默认全开，高敏场景默认关）
  enabledScenarios: Record<string, boolean>
}

const DEFAULTS: ProactiveThresholds = {
  diskFreePercent: 10,
  diskFreeGB: 20,
  memoryUsedPercent: 85,
  batteryLowPercent: 20,
  batteryHealthPercent: 80,
  networkLatencyMs: 500,
  networkLossPercent: 30,
  downloadsFileCount: 50,
  downloadsMaxGB: 5,
  desktopFileCount: 30,
  trashMaxGB: 5,
  gitUncommittedHours: 3,
  gitBranchStaleDays: 7,
  todoGrowthThreshold: 5,
  noBreakMinutes: 90,
  lateNightStartHour: 23,
  lateNightEndHour: 5,
  sshKeyMaxDays: 365,
  sslCertWarnDays: 30,
  enabledScenarios: {},
}

let _cached: ProactiveThresholds | null = null
let _cacheTime = 0
const CACHE_TTL = 60000 // 1 分钟缓存

export function getProactiveConfig(): ProactiveThresholds {
  const now = Date.now()
  if (_cached && (now - _cacheTime) < CACHE_TTL) return _cached

  const configPath = join(homedir(), '.pandacc', 'config', 'proactive.json')
  let userConfig: Partial<ProactiveThresholds> = {}
  try {
    userConfig = JSON.parse(readFileSync(configPath, 'utf-8'))
  } catch {
    // 配置不存在用默认值
  }

  _cached = { ...DEFAULTS, ...userConfig }
  _cacheTime = now
  return _cached
}

/**
 * 高敏场景列表 — 涉及通讯录、邮件内容、即时消息、健康、财务等个人隐私数据。
 * 这些场景**默认关闭**，用户必须在 ~/.pandacc/config/proactive.json 中显式开启：
 *   { "enabledScenarios": { "email-flagged-reminder": true, ... } }
 */
const HIGH_PRIVACY_SCENARIOS = new Set([
  // 邮件（读取邮件内容/标记/回复状态）
  'email-flagged-reminder',
  'email-unread-important',
  'email-unreplied',
  'email-daily-digest',
  // 通讯录（读取联系人信息/生日）
  'contact-birthday',
  // 即时消息（读取聊天记录/未读数）
  'slack-unread',
  'imessage-unread',
  // 浏览器（读取浏览历史/书签）
  'browser-knowledge-cards',
  'bookmark-cleanup',
  'reading-list-overflow',
  // 笔记（读取 Apple Notes 内容）
  'notes-digest',
  // 屏幕时间（读取应用使用数据）
  'screen-time-stats',
  // 健康与财务
  'health-trend',
  'finance-anomaly',
  'cloud-billing-alert',
  // 微信/IM 平台数据
  'wechat-messages',
  'feishu-messages',
  'dingtalk-messages',
  // 敏感文件扫描（读取文件内容）
  'sensitive-file-scan',
  'duplicate-file-scan',
  // 系统通知中心（读取通知数据库，含消息内容）
  'notification-digest',
  'notification-urgent',
  'notification-stats',
])

export function isScenarioEnabled(scenarioId: string): boolean {
  const config = getProactiveConfig()
  if (HIGH_PRIVACY_SCENARIOS.has(scenarioId)) {
    // 高敏场景：必须用户在 proactive.json 中显式设为 true 才启用
    return config.enabledScenarios[scenarioId] === true
  }
  // 其他场景：默认开启，用户可设为 false 关闭
  return config.enabledScenarios[scenarioId] !== false
}
