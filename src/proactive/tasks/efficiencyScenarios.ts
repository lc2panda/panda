// Input: 定时触发的效率场景检查请求（休息/TODO趋势/周报/水分）
// Output: 效率与健康关怀主动推送通知
// Pos: proactive/tasks/ 效率场景层，由 taskRegistry 注册调度

import { pushNotification } from '../../assistant/sense.js'
// P3-T4-β: panda-on-desk 联动桥接（feature('BUDDY') 内 gate；on-desk 离线静默）
import {
  pushNotification as pushDeskNotification,
  isOnDeskEnabled as isDeskOnDeskEnabled,
} from '../../desk/bridge.js'
import { getProactiveConfig, isScenarioEnabled } from '../proactiveConfig.js'
import { localDateStr } from '../../utils/date.js'
import { logForDebugging } from '../../utils/debug.js'
import { getUserIdleSeconds, HOME } from '../platform.js'
import { readFileSync, writeFileSync, appendFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { execSync } from 'child_process'

interface SmartCronTask {
  id: string
  description: string
  cron: string
  priority: 'critical' | 'normal' | 'low'
  enabled: boolean
  condition?: () => boolean
  skipIf?: () => boolean
  action: () => Promise<void>
}

// ═══════════════════════════════════════════════════════════════════
// F2: 长时间无休息提醒
// ═══════════════════════════════════════════════════════════════════

let _lastBreakTime = Date.now()

const noBreakReminder: SmartCronTask = {
  id: 'no-break-reminder',
  description: '长时间无休息提醒 · Break reminder',
  cron: '*/5 * * * *',
  priority: 'normal',
  enabled: true,
  condition: () => isScenarioEnabled('no-break-reminder'),
  action: async () => {
    try {
      const config = getProactiveConfig()
      const maxMinutes = config.noBreakMinutes || 90
      const idle = getUserIdleSeconds()

      // 如果空闲超过 5 分钟，视为已休息，重置计时
      if (idle > 300) {
        _lastBreakTime = Date.now()
        logForDebugging(`[efficiencyScenarios] no-break-reminder: 检测到休息（idle=${idle}s），重置计时`)
        return
      }

      // 如果一直在活跃状态（idle < 60s）且持续超过阈值
      if (idle < 60) {
        const continuousMinutes = (Date.now() - _lastBreakTime) / 60000
        if (continuousMinutes > maxMinutes) {
          pushNotification({
            type: 'info',
            title: '🧘 该休息一下了',
            body: `你已经连续工作 ${Math.round(continuousMinutes)} 分钟了，起来走走、伸展一下吧`,
            channel: 'statusLine',
          })
          // why: P3-T4-β panda-on-desk 联动 — efficiency 类 overlay + gentle 音效；defaultOn=false 用户主动开
          try {
            if (isDeskOnDeskEnabled()) {
              pushDeskNotification({
                kind: 'overlay',
                level: 'info',
                scenarioId: 'efficiency-no-break',
                title: 'Panda · 该休息一下了',
                body: `已连续工作 ${Math.round(continuousMinutes)} 分钟，起来活动一下`,
                soundCue: 'gentle',
              })
            }
          } catch {
            // 桥接失败不阻塞 proactive 主路径
          }
          // 推送后重置，避免每 5 分钟连续提醒
          _lastBreakTime = Date.now()
          logForDebugging(`[efficiencyScenarios] no-break-reminder: 已连续工作 ${Math.round(continuousMinutes)} 分钟，已推送提醒`)
        }
      }
    } catch (e) {
      logForDebugging(`[efficiencyScenarios] no-break-reminder failed: ${(e as Error).message}`)
    }
  },
}

// ═══════════════════════════════════════════════════════════════════
// D5: TODO/FIXME 趋势告警
// ═══════════════════════════════════════════════════════════════════

const TODO_HISTORY_PATH = join(HOME, '.pandacc', 'data', 'todo-history.jsonl')

function getTodoCount(): number {
  try {
    const out = execSync(
      "grep -rn 'TODO\\|FIXME' --include='*.ts' --include='*.tsx' --include='*.js' . 2>/dev/null | wc -l",
      { encoding: 'utf-8', timeout: 30000 },
    )
    return parseInt(out.trim(), 10) || 0
  } catch {
    return 0
  }
}

function getLastTodoCount(): number | null {
  try {
    if (!existsSync(TODO_HISTORY_PATH)) return null
    const lines = readFileSync(TODO_HISTORY_PATH, 'utf-8').trim().split('\n').filter(Boolean)
    if (lines.length === 0) return null
    const last = JSON.parse(lines[lines.length - 1])
    return typeof last.count === 'number' ? last.count : null
  } catch {
    return null
  }
}

function appendTodoHistory(count: number): void {
  try {
    const dir = dirname(TODO_HISTORY_PATH)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    const entry = JSON.stringify({ date: new Date().toISOString(), count })
    appendFileSync(TODO_HISTORY_PATH, entry + '\n')
  } catch {}
}

const todoTrendAlert: SmartCronTask = {
  id: 'todo-trend-alert',
  description: 'TODO/FIXME 趋势告警 · TODO trend alert',
  cron: '0 18 * * 5',
  priority: 'low',
  enabled: true,
  condition: () => isScenarioEnabled('todo-trend-alert'),
  action: async () => {
    logForDebugging('[efficiencyScenarios] todo-trend-alert: 开始统计')
    try {
      const config = getProactiveConfig()
      const threshold = config.todoGrowthThreshold || 5
      const currentCount = getTodoCount()
      const lastCount = getLastTodoCount()

      // 记录本次计数
      appendTodoHistory(currentCount)

      if (lastCount !== null) {
        const growth = currentCount - lastCount
        if (growth > threshold) {
          pushNotification({
            type: 'info',
            title: '📋 TODO/FIXME 增长提醒',
            body: `本周 TODO/FIXME 净增 ${growth} 条（${lastCount} → ${currentCount}），建议定期清理技术债务`,
            channel: 'statusLine',
          })
          // why: P3-T4-β panda-on-desk 联动 — efficiency overlay 提醒，无音效（周报场景）
          try {
            if (isDeskOnDeskEnabled()) {
              pushDeskNotification({
                kind: 'overlay',
                level: 'info',
                scenarioId: 'efficiency-todo-trend',
                title: 'Panda · TODO/FIXME 增长',
                body: `本周净增 ${growth} 条（${lastCount} → ${currentCount}）`,
              })
            }
          } catch {
            // 桥接失败不阻塞 proactive 主路径
          }
          logForDebugging(`[efficiencyScenarios] todo-trend-alert: 增长 ${growth} 条（阈值 ${threshold}）`)
        } else {
          logForDebugging(`[efficiencyScenarios] todo-trend-alert: 增长 ${growth} 条，未超阈值`)
        }
      } else {
        logForDebugging(`[efficiencyScenarios] todo-trend-alert: 首次记录，count=${currentCount}`)
      }
    } catch (e) {
      logForDebugging(`[efficiencyScenarios] todo-trend-alert failed: ${(e as Error).message}`)
    }
  },
}

// ═══════════════════════════════════════════════════════════════════
// F5: 周报自动生成
// ═══════════════════════════════════════════════════════════════════

const weeklyReport: SmartCronTask = {
  id: 'weekly-report',
  description: '周报自动生成 · Weekly report generation',
  cron: '0 18 * * 5',
  priority: 'low',
  enabled: true,
  condition: () => isScenarioEnabled('weekly-report'),
  action: async () => {
    logForDebugging('[efficiencyScenarios] weekly-report: 开始生成')
    try {
      // 收集 Git 数据
      let commitCount = 0
      let diffStat = '（无法获取）'
      try {
        const commitOut = execSync('git log --oneline --since="5 days ago" 2>/dev/null | wc -l', {
          encoding: 'utf-8',
          timeout: 10000,
        })
        commitCount = parseInt(commitOut.trim(), 10) || 0
      } catch {}

      try {
        diffStat = execSync('git diff --stat @{5.days.ago} 2>/dev/null', {
          encoding: 'utf-8',
          timeout: 10000,
        }).trim() || '（无变更）'
      } catch {
        diffStat = '（无法获取 git diff）'
      }

      // 当前日期
      const now = new Date()
      const dateStr = localDateStr(now)
      const weekStart = localDateStr(new Date(now.getTime() - 5 * 86400000))

      // 生成 Markdown 周报
      const report = [
        `# 周报 ${weekStart} ~ ${dateStr}`,
        '',
        '## 本周概览',
        '',
        `- **提交数**: ${commitCount}`,
        `- **统计周期**: ${weekStart} 至 ${dateStr}`,
        '',
        '## 代码变更统计',
        '',
        '```',
        diffStat,
        '```',
        '',
        '## 待办事项',
        '',
        '- [ ] 回顾本周代码变更',
        '- [ ] 更新项目文档',
        '- [ ] 清理技术债务',
        '',
        `> 自动生成于 ${now.toISOString()}`,
      ].join('\n')

      // 写入文件
      const reportDir = join(HOME, '.pandacc', 'memory', 'working')
      if (!existsSync(reportDir)) mkdirSync(reportDir, { recursive: true })
      const reportPath = join(reportDir, `weekly_${dateStr}.md`)
      writeFileSync(reportPath, report, 'utf-8')

      pushNotification({
        type: 'info',
        title: '📊 周报已生成',
        body: `本周 ${commitCount} 次提交，周报已保存至 ${reportPath}`,
        channel: 'statusLine',
      })
      // why: P3-T4-β panda-on-desk 联动 — 周报完成 overlay 提示，gentle 音效
      try {
        if (isDeskOnDeskEnabled()) {
          pushDeskNotification({
            kind: 'overlay',
            level: 'info',
            scenarioId: 'efficiency-weekly-report',
            title: 'Panda · 周报已生成',
            body: `本周 ${commitCount} 次提交，已保存至工作记忆`,
            soundCue: 'gentle',
          })
        }
      } catch {
        // 桥接失败不阻塞 proactive 主路径
      }
      logForDebugging(`[efficiencyScenarios] weekly-report: 已生成 ${reportPath}`)
    } catch (e) {
      logForDebugging(`[efficiencyScenarios] weekly-report failed: ${(e as Error).message}`)
    }
  },
}

// ═══════════════════════════════════════════════════════════════════
// H7: 水分摄入提醒
// ═══════════════════════════════════════════════════════════════════

function getWaterMessage(): string {
  const hour = new Date().getHours()
  if (hour < 12) return '☀️ 早上好！来杯温水开启新的一天吧'
  if (hour < 18) return '🌤️ 下午了，记得补充水分，保持专注'
  return '🌙 晚上也要记得喝水哦，别让身体缺水'
}

const waterReminder: SmartCronTask = {
  id: 'water-reminder',
  description: '水分摄入提醒 · Hydration reminder',
  cron: '0 */2 * * *',
  priority: 'low',
  enabled: true,
  condition: () => isScenarioEnabled('water-reminder'),
  skipIf: () => {
    // 仅 8:00-22:00 推送
    const hour = new Date().getHours()
    return hour < 8 || hour >= 22
  },
  action: async () => {
    try {
      const msg = getWaterMessage()
      pushNotification({
        type: 'info',
        title: '💧 喝水提醒',
        body: msg,
        channel: 'statusLine',
      })
      // why: P3-T4-β panda-on-desk 联动 — 喝水提醒 overlay + gentle 音效
      try {
        if (isDeskOnDeskEnabled()) {
          pushDeskNotification({
            kind: 'overlay',
            level: 'info',
            scenarioId: 'efficiency-water',
            title: 'Panda · 喝水提醒',
            body: msg,
            soundCue: 'gentle',
          })
        }
      } catch {
        // 桥接失败不阻塞 proactive 主路径
      }
      logForDebugging('[efficiencyScenarios] water-reminder: 已推送')
    } catch (e) {
      logForDebugging(`[efficiencyScenarios] water-reminder failed: ${(e as Error).message}`)
    }
  },
}

// ═══════════════════════════════════════════════════════════════════
// 导出
// ═══════════════════════════════════════════════════════════════════

export function getEfficiencyTasks(): SmartCronTask[] {
  return [
    noBreakReminder,
    todoTrendAlert,
    weeklyReport,
    waterReminder,
  ]
}
