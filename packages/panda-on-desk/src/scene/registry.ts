// Input:  scenarioId 字面量
// Output: 场景元数据（默认开关 / 级别 / 隐私级别）— 供 dispatcher 决策放行/抑制
// Pos:    A3 §3 TOP 10 场景 + permission-request 注册中心；P2-T2~T7 调用
//
// [NEW-FILE:#20260419-P2-04]
// 2026-04-19 +08:00 agent-α-P2-protocol · TOP 10 + permission-request 共 11 项
// 2026-04-19 22:07 +08:00 P3-T4-γ 扩充：IM 9 + wechat 14（HIGH_PRIVACY）+ 被动层 8（badge）
//                          + 核心 SMART_CRON 漏接 10 = 41 项，全表共 52 项
// 2026-04-19 22:30 +08:00 P3-T4-α 扩充：系统/开发/文件类 16 项
//                          - personalLife 2（weather-change/holiday-reminder）
//                          - devScenarios 2（npm-audit-vuln/git-stale-branches）
//                          - fileScenarios 1（downloads-clutter）
//                          - advancedSystem 5（cpu-temp-high/cpu-load-high/zombie-process/docker-unhealthy/outdated-deps-major/battery-health）
//                          - advancedFiles 5（desktop-clutter/large-files/trash-bloat/calendar-conflict/port-conflict）
//                          - advancedSystem/advancedFiles privacy:medium + defaultOn:false 避免新用户骚扰
//                          - personalLife/devScenarios/fileScenarios privacy:low + defaultOn:true（与原 task enabled 默认一致）
// 2026-04-19 22:35 +08:00 P3-T4-β 扩充：效率/生活/知识/通信/通知/扩展/安全 46 项
//                          - efficiency 4 / lifestyle 10 / knowledge 8 / notif 3 /
//                            comm 9 / extended 8 / security 4
//                          - efficiency / lifestyle / knowledge / extended privacy:low + defaultOn:false（用户主动开）
//                          - notif privacy:medium + defaultOn:false（涉系统通知聚合）
//                          - comm / security privacy:high + defaultOn:false（A3 §5 高隐私）
// TODO: P2-T7 各场景接入时同步追加；P2-T5 隐私级别接 settings 面板

import type { NotificationLevel } from '../bridge/types.js'

/** 隐私敏感级别 — A3 §5：medium/high 启用前需用户确认 */
export type ScenePrivacy = 'low' | 'medium' | 'high'

export interface SceneMeta {
  /** 默认是否开启 — 主方案 §7 决策 #8 分级（系统健康/CI on，efficiency off） */
  defaultOn: boolean
  /** 默认通知级别 — overlay/system 颜色 + DND 期间是否透传 */
  level: NotificationLevel
  /** 隐私级别 — 影响首次启用确认流程 */
  privacy: ScenePrivacy
}

/**
 * A3 §3 TOP 10 场景 + permission-request 注册表
 *
 * 主方案 §7 决策 #8（场景默认开关分级）：
 *   - 系统健康 / CI / Git / 日历 / 晨间 / DeepDream / 上下文 / 权限：默认 ON
 *   - efficiency 类（番茄/碎片/焦点）/ midnight-care 深夜关怀：默认 OFF
 */
export const SCENE_REGISTRY = {
  // TOP 10 #3 晨间简报 — builtinTasks.ts cron 7:00
  'morning-brief': { defaultOn: true, level: 'info', privacy: 'low' },
  // TOP 10 #4 磁盘告警 — systemHealth.ts */15
  'disk-low': { defaultOn: true, level: 'warning', privacy: 'low' },
  // TOP 10 #4 内存告警 — systemHealth.ts */5
  'memory-pressure': { defaultOn: true, level: 'warning', privacy: 'low' },
  // TOP 10 #4 网络异常 — systemHealth.ts */3
  'network-anomaly': { defaultOn: true, level: 'warning', privacy: 'low' },
  // TOP 10 #5 Git 远程变更 — devScenarios.ts */2h
  'git-remote-changed': { defaultOn: true, level: 'info', privacy: 'low' },
  // TOP 10 #1 CI/CD 失败 — devScenarios.ts */15
  'ci-failed': { defaultOn: true, level: 'error', privacy: 'low' },
  // TOP 10 #2 日历提醒 — builtinTasks.ts macOS-only */30
  'calendar-reminder': { defaultOn: true, level: 'info', privacy: 'medium' },
  // TOP 10 #6 DeepDream 完成 — builtinTasks.ts 22:00
  'deepdream-done': { defaultOn: true, level: 'info', privacy: 'low' },
  // TOP 10 #7 上下文压力 — proactiveEngine.ts:208
  'context-pressure': { defaultOn: true, level: 'info', privacy: 'low' },
  // TOP 10 #10 深夜工作关怀 — personalLife.ts cron 22-05 */30
  // why: 主方案 §7 决策 #8 efficiency 类默认 off，避免首启信息洪水
  'midnight-care': { defaultOn: false, level: 'info', privacy: 'low' },
  // TOP 10 #10 权限气泡 — Permission Request 协议
  'permission-request': { defaultOn: true, level: 'warning', privacy: 'low' },

  // ─────────────────────────────────────────────────────────────────────────
  // P3-T4-γ · IM 跨平台聚合（9 项，privacy=medium，defaultOn=true）
  // 来源：src/proactive/tasks/imScenarios.ts getIMTasks()
  // 呈现：A+B+F (system + overlay + badge) — 主方案 §10.12 + A3 §2 表
  // ─────────────────────────────────────────────────────────────────────────
  'im-unread-digest': { defaultOn: true, level: 'info', privacy: 'medium' },
  'im-daily-brief': { defaultOn: true, level: 'info', privacy: 'medium' },
  'im-calendar-sync': { defaultOn: true, level: 'warning', privacy: 'medium' },
  'im-approval-alert': { defaultOn: true, level: 'warning', privacy: 'medium' },
  'im-document-update': { defaultOn: true, level: 'info', privacy: 'medium' },
  'im-reverse-push': { defaultOn: false, level: 'info', privacy: 'medium' },
  'wechat-messages': { defaultOn: true, level: 'info', privacy: 'medium' },
  'feishu-messages': { defaultOn: true, level: 'info', privacy: 'medium' },
  'dingtalk-messages': { defaultOn: true, level: 'info', privacy: 'medium' },

  // ─────────────────────────────────────────────────────────────────────────
  // P3-T4-γ · 微信态势感知（14 项，全部 HIGH_PRIVACY，defaultOn=false）
  // 来源：src/proactive/tasks/wechatSituational.ts getWechatSituationalTasks()
  // 呈现：A+B+F — 但隐私级 high，首启需用户显式打开（A3 §5）
  // ─────────────────────────────────────────────────────────────────────────
  'wechat-daily-situational': { defaultOn: false, level: 'info', privacy: 'high' },
  'wechat-mention-alert': { defaultOn: false, level: 'warning', privacy: 'high' },
  'wechat-keyword-monitor': { defaultOn: false, level: 'info', privacy: 'high' },
  'wechat-unreplied-reminder': { defaultOn: false, level: 'warning', privacy: 'high' },
  'wechat-group-digest': { defaultOn: false, level: 'info', privacy: 'high' },
  'wechat-contact-insights': { defaultOn: false, level: 'info', privacy: 'high' },
  'wechat-noise-filter': { defaultOn: false, level: 'info', privacy: 'high' },
  'wechat-sentiment-pulse': { defaultOn: false, level: 'info', privacy: 'high' },
  'wechat-weekly-trend': { defaultOn: false, level: 'info', privacy: 'high' },
  'wechat-monthly-report': { defaultOn: false, level: 'info', privacy: 'high' },
  'wechat-quarterly-review': { defaultOn: false, level: 'info', privacy: 'high' },
  'wechat-yearly-digest': { defaultOn: false, level: 'info', privacy: 'high' },
  'wechat-relationship-health': { defaultOn: false, level: 'warning', privacy: 'high' },
  'wechat-topic-tracker': { defaultOn: false, level: 'info', privacy: 'high' },

  // ─────────────────────────────────────────────────────────────────────────
  // P3-T4-γ · 被动层 10 检查器之 8（context-pressure / repetitive-pattern Phase 2 已接）
  // 来源：src/assistant/proactiveEngine.ts _checkXxx 函数
  // 呈现：F badge only — 主战场仍是 inline system msg，桌面端仅角标提示（不打扰）
  // ─────────────────────────────────────────────────────────────────────────
  'uncommitted-changes-badge': { defaultOn: true, level: 'info', privacy: 'low' },
  'profile-stale-badge': { defaultOn: true, level: 'info', privacy: 'low' },
  'morning-briefing-badge': { defaultOn: true, level: 'info', privacy: 'low' },
  'pending-notifications-badge': { defaultOn: true, level: 'info', privacy: 'low' },
  'habit-deviation-badge': { defaultOn: true, level: 'info', privacy: 'low' },
  'llm-insight-badge': { defaultOn: true, level: 'info', privacy: 'low' },
  'time-greeting-badge': { defaultOn: true, level: 'info', privacy: 'low' },
  'task-stall-badge': { defaultOn: true, level: 'info', privacy: 'low' },

  // ─────────────────────────────────────────────────────────────────────────
  // P3-T4-γ · 核心 SMART_CRON 漏接 10 项（Phase 2 已接 morning-brief / calendar-reminder
  // / deepdream-done；剩余按个性化呈现）
  // 来源：src/proactive/builtinTasks.ts SMART_CRON_TASKS
  // ─────────────────────────────────────────────────────────────────────────
  'git-uncommitted-badge': { defaultOn: true, level: 'warning', privacy: 'low' },
  'prospective-scan': { defaultOn: true, level: 'info', privacy: 'low' },
  'file-organizer': { defaultOn: false, level: 'info', privacy: 'low' },
  'working-memory-cleanup': { defaultOn: true, level: 'info', privacy: 'low' },
  'memory-decay': { defaultOn: true, level: 'info', privacy: 'low' },
  'memory-index-rebuild': { defaultOn: true, level: 'info', privacy: 'low' },
  'dream-report-summary': { defaultOn: true, level: 'info', privacy: 'low' },
  'profile-stale-reminder': { defaultOn: true, level: 'info', privacy: 'low' },
  'code-health': { defaultOn: true, level: 'warning', privacy: 'low' },
  'clipboard-poll': { defaultOn: false, level: 'info', privacy: 'medium' },

  // ─────────────────────────────────────────────────────────────────────────
  // P3-T4-α · 个人生活类（personalLife.ts；privacy:low / defaultOn:true）
  // 来源：src/proactive/tasks/personalLife.ts getPersonalLifeTasks()
  // 呈现：A+B+E（节日 + 喜庆音效）/ A+F（天气，仅横幅+badge）— A3 §2 表
  // ─────────────────────────────────────────────────────────────────────────
  'weather-change': { defaultOn: true, level: 'warning', privacy: 'low' },
  'holiday-reminder': { defaultOn: true, level: 'info', privacy: 'low' },

  // ─────────────────────────────────────────────────────────────────────────
  // P3-T4-α · 开发类（devScenarios.ts；privacy:low / defaultOn:true）
  // 呈现：A+F（依赖审计 warning + badge）/ C+F（git 分支过期 仅 badge，不打扰）
  // ─────────────────────────────────────────────────────────────────────────
  'npm-audit-vuln': { defaultOn: true, level: 'warning', privacy: 'low' },
  'git-stale-branches': { defaultOn: true, level: 'info', privacy: 'low' },

  // ─────────────────────────────────────────────────────────────────────────
  // P3-T4-α · 文件类（fileScenarios.ts；privacy:low / defaultOn:true）
  // 呈现：F+D（badge + 拖到 panda 触发清理）— A3 §2 表
  // ─────────────────────────────────────────────────────────────────────────
  'downloads-clutter': { defaultOn: true, level: 'info', privacy: 'low' },

  // ─────────────────────────────────────────────────────────────────────────
  // P3-T4-α · advancedSystem（5 task，privacy:medium / defaultOn:false）
  // 来源：src/proactive/tasks/advancedSystem.ts getAdvancedSystemTasks()
  // why: 高级系统监控对新用户偏吵，medium 隐私 + 默认 OFF（A3 §5）；
  //      启用后呈现 A+C — warning→attention 状态，error 走 overlay
  // 1:1 task 映射 — battery / cpuLoad / zombieProcess / dockerHealth / outdatedDeps
  // ─────────────────────────────────────────────────────────────────────────
  'battery-health': { defaultOn: false, level: 'warning', privacy: 'medium' },
  'cpu-load-high': { defaultOn: false, level: 'warning', privacy: 'medium' },
  'zombie-process': { defaultOn: false, level: 'warning', privacy: 'medium' },
  'docker-unhealthy': { defaultOn: false, level: 'warning', privacy: 'medium' },
  'outdated-deps-major': { defaultOn: false, level: 'info', privacy: 'medium' },

  // ─────────────────────────────────────────────────────────────────────────
  // P3-T4-α · advancedFiles（5 项，privacy:medium / defaultOn:false）
  // 来源：src/proactive/tasks/advancedFiles.ts getAdvancedFileTasks()
  // 呈现：F+D（badge + 拖文件触发清理）/ A+F（calendar-conflict warning + badge）
  // ─────────────────────────────────────────────────────────────────────────
  'desktop-clutter': { defaultOn: false, level: 'info', privacy: 'medium' },
  'large-files': { defaultOn: false, level: 'info', privacy: 'medium' },
  'trash-bloat': { defaultOn: false, level: 'info', privacy: 'medium' },
  'calendar-conflict': { defaultOn: false, level: 'warning', privacy: 'medium' },
  'port-conflict': { defaultOn: false, level: 'info', privacy: 'medium' },

  // ─────────────────────────────────────────────────────────────────────────
  // P3-T4-β · efficiency 类（4 项）— overlay + sound (gentle)
  // 来源：src/proactive/tasks/efficiencyScenarios.ts getEfficiencyTasks()
  // why: 主方案 §7 决策 #8 — efficiency 类默认 OFF，避免首启信息洪水
  // ─────────────────────────────────────────────────────────────────────────
  'efficiency-no-break': { defaultOn: false, level: 'info', privacy: 'low' },
  'efficiency-todo-trend': { defaultOn: false, level: 'info', privacy: 'low' },
  'efficiency-weekly-report': { defaultOn: false, level: 'info', privacy: 'low' },
  'efficiency-water': { defaultOn: false, level: 'info', privacy: 'low' },

  // ─────────────────────────────────────────────────────────────────────────
  // P3-T4-β · lifestyle 类（10 项）— overlay + sound (gentle)
  // 来源：src/proactive/tasks/lifestyleScenarios.ts getLifestyleTasks()
  // 呈现：低强度提醒 + 短音效；warning 级（备份/会议/证书/财务）走醒目色
  // ─────────────────────────────────────────────────────────────────────────
  'lifestyle-countdown': { defaultOn: false, level: 'info', privacy: 'low' },
  'lifestyle-package-tracking': { defaultOn: false, level: 'info', privacy: 'low' },
  'lifestyle-backup-status': { defaultOn: false, level: 'warning', privacy: 'low' },
  'lifestyle-screen-time': { defaultOn: false, level: 'info', privacy: 'low' },
  'lifestyle-focus-mode-suggest': { defaultOn: false, level: 'info', privacy: 'low' },
  'lifestyle-meeting-ratio': { defaultOn: false, level: 'warning', privacy: 'low' },
  'lifestyle-cloud-billing': { defaultOn: false, level: 'info', privacy: 'low' },
  'lifestyle-apple-cert-expiry': { defaultOn: false, level: 'warning', privacy: 'low' },
  'lifestyle-health-trend': { defaultOn: false, level: 'info', privacy: 'low' },
  'lifestyle-finance-anomaly': { defaultOn: false, level: 'warning', privacy: 'low' },

  // ─────────────────────────────────────────────────────────────────────────
  // P3-T4-β · knowledge 类（8 项）— badge + overlay；defaultOn=false 用户主动开
  // 来源：src/proactive/tasks/knowledgeScenarios.ts getKnowledgeTasks()
  // ─────────────────────────────────────────────────────────────────────────
  'knowledge-browser-cards': { defaultOn: false, level: 'info', privacy: 'low' },
  'knowledge-bookmark-cleanup': { defaultOn: false, level: 'info', privacy: 'low' },
  'knowledge-reading-list': { defaultOn: false, level: 'info', privacy: 'low' },
  'knowledge-flashcard-review': { defaultOn: false, level: 'info', privacy: 'low' },
  'knowledge-rss-digest': { defaultOn: false, level: 'info', privacy: 'low' },
  'knowledge-card-review': { defaultOn: false, level: 'info', privacy: 'low' },
  'knowledge-learning-stats': { defaultOn: false, level: 'info', privacy: 'low' },
  'knowledge-notes-digest': { defaultOn: false, level: 'info', privacy: 'low' },

  // ─────────────────────────────────────────────────────────────────────────
  // P3-T4-β · notification 系统通知聚合类（3 项）— badge only；不直接打扰
  // 来源：src/proactive/tasks/notificationScenarios.ts getNotificationTasks()
  // 呈现：F badge — 仅累加状态栏角标；privacy=medium（涉及全系统通知内容）
  // ─────────────────────────────────────────────────────────────────────────
  'notif-digest': { defaultOn: false, level: 'info', privacy: 'medium' },
  'notif-urgent': { defaultOn: false, level: 'warning', privacy: 'medium' },
  'notif-stats': { defaultOn: false, level: 'info', privacy: 'medium' },

  // ─────────────────────────────────────────────────────────────────────────
  // P3-T4-β · communication 类（9 项）— HIGH_PRIVACY；首启需用户显式确认
  // 来源：src/proactive/tasks/communicationScenarios.ts getCommunicationTasks()
  // why: 邮件/Slack/iMessage/通讯录涉及私人通信内容，A3 §5 强制 high privacy + defaultOn=false
  // ─────────────────────────────────────────────────────────────────────────
  'comm-email-flagged': { defaultOn: false, level: 'info', privacy: 'high' },
  'comm-email-unread-important': { defaultOn: false, level: 'warning', privacy: 'high' },
  'comm-slack-unread': { defaultOn: false, level: 'info', privacy: 'high' },
  'comm-calendar-conflict': { defaultOn: false, level: 'warning', privacy: 'high' },
  'comm-meeting-prep': { defaultOn: false, level: 'warning', privacy: 'high' },
  'comm-email-unreplied': { defaultOn: false, level: 'info', privacy: 'high' },
  'comm-contact-birthday': { defaultOn: false, level: 'info', privacy: 'high' },
  'comm-email-daily-digest': { defaultOn: false, level: 'info', privacy: 'high' },
  'comm-imessage-unread': { defaultOn: false, level: 'info', privacy: 'high' },

  // ─────────────────────────────────────────────────────────────────────────
  // P3-T4-β · extended 类（8 项）— overlay + sound (gentle)
  // 来源：src/proactive/tasks/extendedScenarios.ts getExtendedTasks()
  // ─────────────────────────────────────────────────────────────────────────
  'extended-system-update': { defaultOn: false, level: 'info', privacy: 'low' },
  'extended-package-outdated': { defaultOn: false, level: 'info', privacy: 'low' },
  'extended-screenshot-cleanup': { defaultOn: false, level: 'info', privacy: 'low' },
  'extended-duplicate-files': { defaultOn: false, level: 'info', privacy: 'low' },
  'extended-cloud-sync': { defaultOn: false, level: 'warning', privacy: 'low' },
  'extended-habit-tracker': { defaultOn: false, level: 'info', privacy: 'low' },
  'extended-signing-cert': { defaultOn: false, level: 'warning', privacy: 'low' },
  'extended-api-rate-limit': { defaultOn: false, level: 'warning', privacy: 'low' },

  // ─────────────────────────────────────────────────────────────────────────
  // P3-T4-β · security 类（4 项）— HIGH_PRIVACY；system + overlay (error)
  // 来源：src/proactive/tasks/securityScenarios.ts getSecurityTasks()
  // why: 涉及密码 / SSH key / SSL 证书 / 敏感文件 — A3 §5 强制 high privacy + defaultOn=false
  // ─────────────────────────────────────────────────────────────────────────
  'security-password-breach': { defaultOn: false, level: 'error', privacy: 'high' },
  'security-ssh-key-expiry': { defaultOn: false, level: 'warning', privacy: 'high' },
  'security-ssl-cert-expiry': { defaultOn: false, level: 'error', privacy: 'high' },
  'security-sensitive-file': { defaultOn: false, level: 'error', privacy: 'high' },
} as const satisfies Record<string, SceneMeta>

/** 场景 id 联合类型 — 编译期约束业务方拼写 */
export type RegisteredSceneId = keyof typeof SCENE_REGISTRY

/**
 * 查询场景元数据 — 未注册返回 null（dispatcher 决策：未注册场景按 default warning 处理 + 警告日志）
 */
export function getSceneMeta(scenarioId: string): SceneMeta | null {
  if (Object.prototype.hasOwnProperty.call(SCENE_REGISTRY, scenarioId)) {
    return SCENE_REGISTRY[scenarioId as RegisteredSceneId]
  }
  return null
}

/** 列举所有默认开启场景 — settings 面板初始化用 */
export function listDefaultOnScenarios(): RegisteredSceneId[] {
  return (Object.keys(SCENE_REGISTRY) as RegisteredSceneId[]).filter(
    id => SCENE_REGISTRY[id].defaultOn,
  )
}
