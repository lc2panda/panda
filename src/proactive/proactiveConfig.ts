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
  // IM 聚合（跨平台即时消息/日历/审批/文档数据）
  'im-unread-digest',
  'im-daily-brief',
  'im-calendar-sync',
  'im-approval-alert',
  'im-document-update',
  'im-reverse-push',
  // 微信态势感知（读取微信聊天记录/联系人/群组数据）
  'wechat-daily-situational',
  'wechat-mention-alert',
  'wechat-keyword-monitor',
  'wechat-unreplied-reminder',
  'wechat-group-digest',
  'wechat-contact-insights',
  'wechat-noise-filter',
  'wechat-sentiment-pulse',
  'wechat-weekly-trend',
  'wechat-monthly-report',
  'wechat-quarterly-review',
  'wechat-yearly-digest',
  'wechat-relationship-health',
  'wechat-topic-tracker',
])

/**
 * P1-1 保守安全默认清单 — 仅系统监控 / 文件整理 / 开发者提醒 / 安全告警，
 * 这些场景默认启用，不涉及用户私人通讯 / 健康 / 财务数据。
 *
 * 所有 id 必须与 src/proactive/tasks/*.ts 中的真实 task id 对齐（已核对）。
 */
const DEFAULT_ON_SAFE_SCENARIOS = new Set<string>([
  // ── builtinTasks.ts core tasks (must be here for catchup to work) ──
  'morning-brief',
  'dream-consolidate',
  'code-health',
  'memory-decay',
  'memory-index-rebuild',
  'working-memory-cleanup',
  'dream-report-summary',
  'prospective-scan',
  'profile-stale-reminder',
  'file-organizer',
  'clipboard-poll',
  'calendar-reminder',
  'git-uncommitted-reminder',
  // systemHealth.ts — 系统健康
  'disk-space-alert',
  'memory-pressure-alert',
  'network-anomaly',
  // devScenarios.ts — 开发者提醒
  'dependency-audit',
  'ci-failure-alert',
  'git-stale-branches',
  'git-upstream-changes',
  // fileScenarios.ts — 文件整理
  'downloads-clutter',
  // efficiencyScenarios.ts — 效率关怀
  'no-break-reminder',
  // personalLife.ts — 生活关怀
  'late-night-care',
  // securityScenarios.ts — 安全告警
  'ssl-cert-expiry',
])

/**
 * P1-1 场景启用判定（倒置为"保守默认"策略）：
 *
 * 1. 用户 config 显式值永远优先（true/false 都生效）；
 * 2. 高敏场景：默认 false（隐私铁律）；
 * 3. 安全清单场景：默认 true；
 * 4. 其余未明确场景：默认 false（保守，防止 91 个场景一起刷屏）。
 */
export function isScenarioEnabled(scenarioId: string): boolean {
  const config = getProactiveConfig()

  // 用户 config 显式值优先
  if (scenarioId in config.enabledScenarios) {
    return config.enabledScenarios[scenarioId] === true
  }

  // 高敏场景默认关
  if (HIGH_PRIVACY_SCENARIOS.has(scenarioId)) return false

  // 保守安全清单默认开
  if (DEFAULT_ON_SAFE_SCENARIOS.has(scenarioId)) return true

  // 其他场景默认关（保守）
  return false
}

/**
 * P1-1 暴露安全清单给 status 面板（Xi）使用。
 */
export function getDefaultOnScenarios(): string[] {
  return Array.from(DEFAULT_ON_SAFE_SCENARIOS)
}

/**
 * P1-1 场景统计汇总，供 status 面板展示。
 */
export function getAllScenarioStats(): {
  safe: number
  highPrivacy: number
  userOptIn: number
  userOptOut: number
} {
  const config = getProactiveConfig()
  let userOptIn = 0
  let userOptOut = 0
  for (const v of Object.values(config.enabledScenarios)) {
    if (v === true) userOptIn++
    else if (v === false) userOptOut++
  }
  return {
    safe: DEFAULT_ON_SAFE_SCENARIOS.size,
    highPrivacy: HIGH_PRIVACY_SCENARIOS.size,
    userOptIn,
    userOptOut,
  }
}
