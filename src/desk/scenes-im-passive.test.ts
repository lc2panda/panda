// Input:  P3-T4-γ 接入的 IM 9 + wechat 14 + 被动层 8 + 核心 SMART_CRON 漏接 10 共 41 场景
// Output: ≥ 30 测试用例覆盖 scenarioId / kind / level / privacy / defaultOn 字段
// Pos:    Phase 3 P3-T4-γ 场景接入验证 [NEW-FILE:#20260419-P3T4-01]
//         不连真 panda-on-desk —— 直接断言 build* 纯函数构造的 NotificationEvent /
//         BadgeEvent；并验证 SCENE_REGISTRY 隐私级别（wechat 系全部 high + defaultOn=false）
//         严守 byte-equal — 不引用 src/services/api/{claude,oauth,providers}
//         一旦我被修改，请更新我的头部注释，以及所属文件夹的md。
//
// 2026-04-19 22:30 +08:00 P3-T4-γ 落盘

import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import {
  buildBadgeBumpEvent,
  buildNotificationEvent,
  isOnDeskEnabled,
  pushNotification,
} from './bridge.js'

// why: 不跨包 import packages/panda-on-desk（避免 src tsconfig 拉链）；
// 改为读取 SCENE_REGISTRY 源文件文本，断言 scenarioId + privacy + defaultOn 配置。
const REGISTRY_PATH = join(
  process.cwd(),
  'packages',
  'panda-on-desk',
  'src',
  'scene',
  'registry.ts',
)
const REGISTRY_SOURCE = readFileSync(REGISTRY_PATH, 'utf-8')

function hasScenario(sid: string): boolean {
  return REGISTRY_SOURCE.includes(`'${sid}'`)
}

function getMeta(sid: string): { privacy: string; defaultOn: boolean } | null {
  const escaped = sid.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(
    `'${escaped}':\\s*\\{[^}]*defaultOn:\\s*(true|false)[^}]*privacy:\\s*'(low|medium|high)'`,
  )
  const m = REGISTRY_SOURCE.match(re)
  if (!m) return null
  return { defaultOn: m[1] === 'true', privacy: m[2] }
}

// ─────────────────────────────────────────────────────────────────────────────
// Group A: IM 9 场景 — 字段契约 + scenarioId 正确
// 来源：src/proactive/tasks/imScenarios.ts getIMTasks()
// ─────────────────────────────────────────────────────────────────────────────

describe('P3-T4-γ / IM 9 场景 NotificationEvent 字段契约', () => {
  const IM_SCENARIOS = [
    'im-unread-digest',
    'im-daily-brief',
    'im-calendar-sync',
    'im-approval-alert',
    'im-document-update',
    'im-reverse-push',
    'wechat-messages',
    'feishu-messages',
    'dingtalk-messages',
  ] as const

  for (const sid of IM_SCENARIOS) {
    test(`IM 场景: ${sid} → kind=system + scenarioId 正确`, () => {
      const evt = buildNotificationEvent({
        kind: 'system',
        level: 'info',
        scenarioId: sid,
        title: `Panda · ${sid}`,
        body: 'mock body',
      })
      expect(evt.type).toBe('notification')
      expect(evt.scenarioId).toBe(sid)
      expect(evt.kind).toBe('system')
      expect(typeof evt.ts).toBe('number')
    })
  }

  test('IM 场景全部已注册到 SCENE_REGISTRY · privacy=medium', () => {
    for (const sid of IM_SCENARIOS) {
      expect(hasScenario(sid)).toBe(true)
      const meta = getMeta(sid)
      expect(meta).not.toBeNull()
      expect(meta?.privacy).toBe('medium')
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group B: WeChat 14 场景 — 全部 HIGH_PRIVACY 默认 OFF
// 来源：src/proactive/tasks/wechatSituational.ts getWechatSituationalTasks()
// ─────────────────────────────────────────────────────────────────────────────

describe('P3-T4-γ / WeChat 14 场景 — HIGH_PRIVACY 默认 OFF', () => {
  const WECHAT_SCENARIOS = [
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
  ] as const

  for (const sid of WECHAT_SCENARIOS) {
    test(`WeChat 场景: ${sid} → privacy=high + defaultOn=false`, () => {
      const meta = getMeta(sid)
      expect(meta).not.toBeNull()
      expect(meta?.privacy).toBe('high')
      expect(meta?.defaultOn).toBe(false)
    })
  }

  test('WeChat 场景 NotificationEvent 构造 — scenarioId 字段守护', () => {
    for (const sid of WECHAT_SCENARIOS) {
      const evt = buildNotificationEvent({
        kind: 'overlay',
        level: 'info',
        scenarioId: sid,
        title: `Panda · ${sid}`,
        body: 'mock',
        ttlMs: 6_000,
      })
      expect(evt.scenarioId).toBe(sid)
      expect(evt.kind).toBe('overlay')
      expect(evt.ttlMs).toBe(6_000)
    }
  })

  test('WeChat 场景默认环境（feature off）→ shouldDeliverNotification 等价短路', () => {
    // why: feature(BUDDY)=false → isOnDeskEnabled 返回 false；
    // 即使 wechat 场景调用 pushNotification 也会在 bridge 层短路（默认测试环境）
    expect(isOnDeskEnabled()).toBe(false)
    expect(() =>
      pushNotification({
        kind: 'system',
        level: 'warning',
        scenarioId: 'wechat-mention-alert',
        title: 'Panda · 微信 @提及',
        body: '<群名> @user: hi',
      }),
    ).not.toThrow()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group C: 被动层 8 检查器 — bumpBadge only（badge-only 不打扰）
// 来源：src/assistant/proactiveEngine.ts _checkXxx 函数
// ─────────────────────────────────────────────────────────────────────────────

describe('P3-T4-γ / 被动层 8 检查器 BadgeEvent 字段契约', () => {
  const PASSIVE_SCENARIOS = [
    'uncommitted-changes-badge',
    'profile-stale-badge',
    'morning-briefing-badge',
    'pending-notifications-badge',
    'habit-deviation-badge',
    'llm-insight-badge',
    'time-greeting-badge',
    'task-stall-badge',
  ] as const

  for (const sid of PASSIVE_SCENARIOS) {
    test(`被动层场景: ${sid} → BadgeEvent delta=+1（badge-only）`, () => {
      const badge = buildBadgeBumpEvent(sid, 1)
      expect(badge.type).toBe('badge')
      expect(badge.scenarioId).toBe(sid)
      expect(badge.delta).toBe(1)
      expect(badge.reset).toBeUndefined()
    })
  }

  test('被动层 8 场景全部注册 SCENE_REGISTRY · defaultOn=true · privacy=low', () => {
    for (const sid of PASSIVE_SCENARIOS) {
      const meta = getMeta(sid)
      expect(meta).not.toBeNull()
      // 被动层默认 ON（仅角标，不打扰）
      expect(meta?.defaultOn).toBe(true)
      expect(meta?.privacy).toBe('low')
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group D: 核心 SMART_CRON 漏接 10 项 — 个性化呈现
// 来源：src/proactive/builtinTasks.ts SMART_CRON_TASKS
// ─────────────────────────────────────────────────────────────────────────────

describe('P3-T4-γ / 核心 SMART_CRON 漏接 10 场景', () => {
  const CORE_CRON_SCENARIOS = [
    'git-uncommitted-badge',
    'prospective-scan',
    'file-organizer',
    'working-memory-cleanup',
    'memory-decay',
    'memory-index-rebuild',
    'dream-report-summary',
    'profile-stale-reminder',
    'code-health',
    'clipboard-poll',
  ] as const

  for (const sid of CORE_CRON_SCENARIOS) {
    test(`核心 cron 场景: ${sid} → 已注册 SCENE_REGISTRY`, () => {
      expect(hasScenario(sid)).toBe(true)
    })
  }

  test('git-uncommitted-badge → BadgeEvent delta=+1', () => {
    const badge = buildBadgeBumpEvent('git-uncommitted-badge', 1)
    expect(badge.scenarioId).toBe('git-uncommitted-badge')
    expect(badge.delta).toBe(1)
  })

  test('prospective-scan → kind=system + level=info 字段守护', () => {
    const evt = buildNotificationEvent({
      kind: 'system',
      level: 'info',
      scenarioId: 'prospective-scan',
      title: 'Panda · 🔮 前瞻提醒',
      body: '检测到 3 项即将到来',
    })
    expect(evt.scenarioId).toBe('prospective-scan')
    expect(evt.level).toBe('info')
  })

  test('code-health → level=warning（构建失败专用）', () => {
    const evt = buildNotificationEvent({
      kind: 'system',
      level: 'warning',
      scenarioId: 'code-health',
      title: 'Panda · 代码健康检查失败',
      body: 'bun run build exit=1',
    })
    expect(evt.scenarioId).toBe('code-health')
    expect(evt.level).toBe('warning')
  })

  test('dream-report-summary → kind=overlay + ttlMs', () => {
    const evt = buildNotificationEvent({
      kind: 'overlay',
      level: 'info',
      scenarioId: 'dream-report-summary',
      title: '📊 本周 DeepDream 周报',
      body: '本周 7 份',
      ttlMs: 8_000,
    })
    expect(evt.scenarioId).toBe('dream-report-summary')
    expect(evt.ttlMs).toBe(8_000)
  })

  test('clipboard-poll → defaultOn=false + privacy=medium（隐私敏感）', () => {
    const meta = getMeta('clipboard-poll')
    expect(meta).not.toBeNull()
    expect(meta?.defaultOn).toBe(false)
    expect(meta?.privacy).toBe('medium')
  })

  test('file-organizer → defaultOn=false（避免新用户骚扰）', () => {
    const meta = getMeta('file-organizer')
    expect(meta).not.toBeNull()
    expect(meta?.defaultOn).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group E: 失败兜底 + feature gate（与 scenes.test.ts Group C 同源）
// ─────────────────────────────────────────────────────────────────────────────

describe('P3-T4-γ / 失败兜底 + 短路', () => {
  test('feature(BUDDY)=false → isOnDeskEnabled() 短路', () => {
    expect(isOnDeskEnabled()).toBe(false)
  })

  test('41 场景 pushNotification 调用均 fire-and-forget 不抛错', () => {
    const ALL_SIDS = [
      // IM
      'im-unread-digest',
      'im-daily-brief',
      'im-calendar-sync',
      'im-approval-alert',
      'im-document-update',
      'im-reverse-push',
      'wechat-messages',
      'feishu-messages',
      'dingtalk-messages',
      // wechat
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
      // 被动层
      'uncommitted-changes-badge',
      'profile-stale-badge',
      'morning-briefing-badge',
      'pending-notifications-badge',
      'habit-deviation-badge',
      'llm-insight-badge',
      'time-greeting-badge',
      'task-stall-badge',
      // 核心 cron
      'git-uncommitted-badge',
      'prospective-scan',
      'file-organizer',
      'working-memory-cleanup',
      'memory-decay',
      'memory-index-rebuild',
      'dream-report-summary',
      'profile-stale-reminder',
      'code-health',
      'clipboard-poll',
    ]
    for (const sid of ALL_SIDS) {
      expect(() =>
        pushNotification({
          kind: 'system',
          level: 'info',
          scenarioId: sid,
          title: `Panda · ${sid}`,
          body: 'mock',
        }),
      ).not.toThrow()
    }
  })
})
