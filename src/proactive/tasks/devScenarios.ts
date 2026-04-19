// Input: 定时触发的开发场景检查请求
// Output: Git 分支/远程/CI 状态与依赖安全漏洞的主动推送通知
// Pos: proactive/tasks/ 开发者场景层，由 taskRegistry 注册调度

import { pushNotification } from '../../assistant/sense.js'
// P2-T7: panda-on-desk 联动桥接（feature('BUDDY') 内 gate；on-desk 离线静默）
import {
  pushNotification as pushDeskNotification,
  bumpBadge as bumpDeskBadge,
  isOnDeskEnabled as isDeskOnDeskEnabled,
} from '../../desk/bridge.js'
import { getProactiveConfig, isScenarioEnabled } from '../proactiveConfig.js'
import { logForDebugging } from '../../utils/debug.js'

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

// ─── D1: Git 分支过期 ───

const gitStaleBranches: SmartCronTask = {
  id: 'git-stale-branches',
  description: 'Git 过期分支检测 · Stale branch detection',
  cron: '0 9 * * 1',
  priority: 'low',
  enabled: true,
  condition: () => isScenarioEnabled('git-stale-branches'),
  action: async () => {
    logForDebugging('[devScenarios] git-stale-branches: scanning local branches')
    try {
      const { execSync } = require('child_process')
      const config = getProactiveConfig()
      const staleDays = config.gitBranchStaleDays || 7
      const cutoff = Date.now() / 1000 - staleDays * 86400

      const raw: string = execSync(
        "git for-each-ref --sort=-committerdate --format='%(refname:short)|%(committerdate:unix)' refs/heads/",
        { encoding: 'utf-8', timeout: 10000 },
      )

      const stale: { name: string; days: number }[] = []
      for (const line of raw.trim().split('\n')) {
        if (!line) continue
        const [name, tsStr] = line.replace(/'/g, '').split('|')
        if (!name || !tsStr) continue
        const ts = parseInt(tsStr, 10)
        if (isNaN(ts)) continue
        if (ts < cutoff) {
          const days = Math.round((Date.now() / 1000 - ts) / 86400)
          stale.push({ name, days })
        }
      }

      if (stale.length === 0) {
        logForDebugging('[devScenarios] git-stale-branches: 无过期分支')
        return
      }

      const detail = stale
        .slice(0, 10)
        .map(b => `  • ${b.name}（${b.days} 天未提交）`)
        .join('\n')

      pushNotification({
        type: 'info',
        title: '🌿 Git 过期分支',
        body: `发现 ${stale.length} 个超过 ${staleDays} 天无提交的本地分支：\n${detail}`,
        channel: 'system',
      })

      // why: P3-T4-α panda-on-desk 联动 — Git 过期分支仅累加 badge，不打扰（A3 §2 表 C+F）
      try {
        if (isDeskOnDeskEnabled()) {
          bumpDeskBadge('git-stale-branches', 1)
        }
      } catch {
        // 桥接失败不阻塞主路径
      }

      logForDebugging(`[devScenarios] git-stale-branches: ${stale.length} stale branches found`)
    } catch (e) {
      logForDebugging(`[devScenarios] git-stale-branches failed: ${(e as Error).message}`)
    }
  },
}

// ─── D2: Git 远程变更 ───

const gitUpstreamChanges: SmartCronTask = {
  id: 'git-upstream-changes',
  description: 'Git 远程变更检测 · Upstream change detection',
  cron: '0 */2 * * *',
  priority: 'normal',
  enabled: true,
  condition: () => isScenarioEnabled('git-upstream-changes'),
  action: async () => {
    logForDebugging('[devScenarios] git-upstream-changes: checking remote')
    try {
      const { execSync } = require('child_process')

      // 先尝试 dry-run fetch 检测是否有远程更新
      let hasUpdates = false
      try {
        const fetchOutput: string = execSync('git fetch --dry-run 2>&1', {
          encoding: 'utf-8',
          timeout: 30000,
        })
        hasUpdates = fetchOutput.trim().length > 0
      } catch {
        // fetch 失败（无网络等），静默退出
        logForDebugging('[devScenarios] git-upstream-changes: fetch --dry-run failed, skipping')
        return
      }

      // 再检查落后的 commit 数
      let behindCount = 0
      try {
        const countStr: string = execSync('git rev-list HEAD..@{upstream} --count', {
          encoding: 'utf-8',
          timeout: 5000,
        })
        behindCount = parseInt(countStr.trim(), 10) || 0
      } catch {
        // 无 upstream 设置
      }

      if (!hasUpdates && behindCount === 0) {
        logForDebugging('[devScenarios] git-upstream-changes: 已是最新')
        return
      }

      let body = ''
      if (behindCount > 0) {
        body = `当前分支落后远程 ${behindCount} 个提交，建议执行 git pull`
      } else {
        body = '远程仓库有新变更，建议执行 git fetch 查看'
      }

      pushNotification({
        type: 'info',
        title: '📡 Git 远程更新',
        body,
        channel: 'system',
      })

      // why: P2-T7 panda-on-desk 联动 — Git 远程变更仅累加角标，不弹 system 横幅（不打扰）
      try {
        if (isDeskOnDeskEnabled()) {
          bumpDeskBadge('git-remote-changed', 1)
        }
      } catch {
        // 桥接失败不阻塞主路径
      }

      logForDebugging(`[devScenarios] git-upstream-changes: behind=${behindCount}, hasUpdates=${hasUpdates}`)
    } catch (e) {
      logForDebugging(`[devScenarios] git-upstream-changes failed: ${(e as Error).message}`)
    }
  },
}

// ─── D4: 依赖安全漏洞 ───

const dependencyAudit: SmartCronTask = {
  id: 'dependency-audit',
  description: '依赖安全审计 · Dependency security audit',
  cron: '0 6 * * *',
  priority: 'critical',
  enabled: true,
  condition: () => isScenarioEnabled('dependency-audit'),
  action: async () => {
    logForDebugging('[devScenarios] dependency-audit: scanning vulnerabilities')
    try {
      const { execSync } = require('child_process')
      const { existsSync } = require('fs')

      let high = 0
      let critical = 0
      let source = ''

      // Node.js 项目
      if (existsSync('package.json')) {
        try {
          const raw: string = execSync('npm audit --json 2>/dev/null', {
            encoding: 'utf-8',
            timeout: 60000,
          })
          const audit = JSON.parse(raw)
          // npm audit --json 格式：metadata.vulnerabilities.{high, critical}
          if (audit?.metadata?.vulnerabilities) {
            high += audit.metadata.vulnerabilities.high || 0
            critical += audit.metadata.vulnerabilities.critical || 0
          }
          source = 'npm'
        } catch {
          // npm audit 可能返回非零退出码但仍有 JSON 输出
        }
      }

      // Python 项目
      if (existsSync('requirements.txt')) {
        try {
          const raw: string = execSync('pip audit --json 2>/dev/null', {
            encoding: 'utf-8',
            timeout: 60000,
          })
          const vulns = JSON.parse(raw)
          if (Array.isArray(vulns)) {
            for (const v of vulns) {
              const severity = (v.fix_versions?.[0]?.severity || v.severity || '').toLowerCase()
              if (severity === 'high') high++
              else if (severity === 'critical') critical++
            }
          }
          source = source ? `${source}+pip` : 'pip'
        } catch {}
      }

      if (high === 0 && critical === 0) {
        logForDebugging(`[devScenarios] dependency-audit: 无高危漏洞 (source=${source || 'none'})`)
        return
      }

      pushNotification({
        type: 'warning',
        title: '🔒 依赖安全告警',
        body: `检测到 ${critical} 个严重漏洞、${high} 个高危漏洞（${source}）。建议尽快修复。`,
        channel: 'system',
      })

      // why: P3-T4-α panda-on-desk 联动 — npm audit 漏洞 system 横幅 + badge；critical>0 升级 error+critical sound
      try {
        if (isDeskOnDeskEnabled()) {
          const isCritical = critical > 0
          pushDeskNotification({
            kind: 'system',
            level: isCritical ? 'error' : 'warning',
            scenarioId: 'npm-audit-vuln',
            title: 'Panda · 依赖安全告警',
            body: `${critical} 严重 / ${high} 高危（${source}）`,
            soundCue: isCritical ? 'critical' : 'short',
          })
          bumpDeskBadge('npm-audit-vuln', critical + high)
        }
      } catch {
        // 桥接失败不阻塞主路径
      }

      logForDebugging(`[devScenarios] dependency-audit: critical=${critical} high=${high} source=${source}`)
    } catch (e) {
      logForDebugging(`[devScenarios] dependency-audit failed: ${(e as Error).message}`)
    }
  },
}

// ─── D7: CI/CD 管道失败 ───

const ciFailureAlert: SmartCronTask = {
  id: 'ci-failure-alert',
  description: 'CI/CD 失败告警 · CI pipeline failure alert',
  cron: '*/15 * * * *',
  priority: 'critical',
  enabled: true,
  condition: () => isScenarioEnabled('ci-failure-alert'),
  skipIf: () => {
    // 没有安装 gh CLI 则跳过
    // why: Windows 没有 which，需走 where；统一用 spawnSync 数组形式避免 shell 解析差异
    try {
      const { spawnSync } = require('child_process') as typeof import('child_process')
      const isWin = process.platform === 'win32'
      const probe = spawnSync(isWin ? 'where' : 'which', ['gh'], {
        encoding: 'utf-8',
        timeout: 3000,
        shell: false,
      })
      return probe.status !== 0
    } catch {
      return true
    }
  },
  action: async () => {
    logForDebugging('[devScenarios] ci-failure-alert: checking recent CI failures')
    try {
      const { execSync } = require('child_process')

      const raw: string = execSync(
        'gh run list --status failure --limit 3 --json name,conclusion,createdAt 2>/dev/null',
        { encoding: 'utf-8', timeout: 15000 },
      )

      if (!raw.trim()) {
        logForDebugging('[devScenarios] ci-failure-alert: gh run list 无输出')
        return
      }

      const runs = JSON.parse(raw)
      if (!Array.isArray(runs) || runs.length === 0) {
        logForDebugging('[devScenarios] ci-failure-alert: 无失败记录')
        return
      }

      // 过滤最近 24 小时内的失败
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
      const recent = runs.filter((r: any) => {
        if (!r.createdAt) return false
        return new Date(r.createdAt).getTime() > oneDayAgo
      })

      if (recent.length === 0) {
        logForDebugging('[devScenarios] ci-failure-alert: 24h 内无失败')
        return
      }

      const detail = recent
        .map((r: any) => `  • ${r.name || '未知工作流'}（${r.createdAt}）`)
        .join('\n')

      pushNotification({
        type: 'warning',
        title: '🚨 CI/CD 失败',
        body: `最近 24 小时内有 ${recent.length} 个管道失败：\n${detail}`,
        channel: 'system',
      })

      // why: P2-T7 panda-on-desk 联动 — CI 失败 system 横幅 + overlay 卡片 + critical 音效（最高优先级）
      try {
        if (isDeskOnDeskEnabled()) {
          pushDeskNotification({
            kind: 'system',
            level: 'error',
            scenarioId: 'ci-failed',
            title: 'Panda · CI/CD 失败',
            body: `${recent.length} 个管道 24h 内失败`,
            soundCue: 'critical',
          })
          pushDeskNotification({
            kind: 'overlay',
            level: 'error',
            scenarioId: 'ci-failed',
            title: 'CI/CD 失败',
            body: detail.slice(0, 200),
            ttlMs: 10_000,
          })
          pushDeskNotification({
            kind: 'sound',
            level: 'error',
            scenarioId: 'ci-failed',
            title: 'ci-failed-sound',
            soundCue: 'critical',
          })
        }
      } catch {
        // 桥接失败不阻塞主路径
      }

      logForDebugging(`[devScenarios] ci-failure-alert: ${recent.length} recent failures`)
    } catch (e) {
      logForDebugging(`[devScenarios] ci-failure-alert failed: ${(e as Error).message}`)
    }
  },
}

// ─── 导出 ───

export function getDevTasks(): SmartCronTask[] {
  return [gitStaleBranches, gitUpstreamChanges, dependencyAudit, ciFailureAlert]
}
