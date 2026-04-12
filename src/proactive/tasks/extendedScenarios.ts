// Input: 定时触发的扩展场景检查请求
// Output: 系统更新、包管理、截屏清理、重复文件、云同步、习惯打卡、证书过期、API 频率的主动推送通知
// Pos: proactive/tasks/ 扩展场景层，由 builtinTasks loadScenarioModules 注册调度

import { pushNotification } from '../../assistant/sense.js'
import { getProactiveConfig, isScenarioEnabled } from '../proactiveConfig.js'
import { localDateStr } from '../../utils/date.js'
import { logForDebugging } from '../../utils/debug.js'
import { IS_MAC, IS_WIN, HOME } from '../platform.js'

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

// ─── 系统更新可用 ───

const systemUpdateAvailable: SmartCronTask = {
  id: 'system-update-available',
  description: '系统更新可用 · System update available',
  cron: '0 9 * * *',
  priority: 'normal',
  enabled: true,
  condition: () => isScenarioEnabled('system-update-available'),
  action: async () => {
    logForDebugging('[extendedScenarios] system-update-available: checking')
    try {
      const { execSync } = require('child_process')
      let updates = ''

      if (IS_MAC) {
        try {
          updates = execSync('softwareupdate -l 2>&1', { encoding: 'utf-8', timeout: 60000 })
        } catch (e: any) {
          updates = e.stdout || ''
        }
        // "No new software available." 表示无更新
        if (!updates || /No new software available/i.test(updates)) {
          logForDebugging('[extendedScenarios] system-update-available: macOS 无可用更新')
          return
        }
        // 提取更新名
        const items = updates.split('\n').filter((l: string) => l.trim().startsWith('*')).map((l: string) => l.trim())
        pushNotification({
          type: 'info',
          title: '🔄 系统更新',
          body: `发现 ${items.length || '若干'} 个 macOS 系统更新可用\n${items.slice(0, 5).join('\n')}`,
          channel: 'system',
        })
      } else if (IS_WIN) {
        try {
          const raw: string = execSync(
            `powershell -c "Get-WindowsUpdate -MicrosoftUpdate 2>$null | Measure-Object | Select-Object -ExpandProperty Count"`,
            { encoding: 'utf-8', timeout: 60000 },
          )
          const count = parseInt(raw.trim(), 10) || 0
          if (count === 0) {
            logForDebugging('[extendedScenarios] system-update-available: Windows 无可用更新')
            return
          }
          pushNotification({
            type: 'info',
            title: '🔄 系统更新',
            body: `发现 ${count} 个 Windows 更新可用`,
            channel: 'system',
          })
        } catch {
          logForDebugging('[extendedScenarios] system-update-available: Windows 更新检查失败')
          return
        }
      } else {
        logForDebugging('[extendedScenarios] system-update-available: 非 macOS/Windows，跳过')
        return
      }

      logForDebugging('[extendedScenarios] system-update-available: 已推送更新通知')
    } catch (e) {
      logForDebugging(`[extendedScenarios] system-update-available failed: ${(e as Error).message}`)
    }
  },
}

// ─── Homebrew/包管理器更新 ───

const packageManagerOutdated: SmartCronTask = {
  id: 'package-manager-outdated',
  description: '包管理器更新 · Package manager outdated check',
  cron: '0 9 * * 1',
  priority: 'low',
  enabled: true,
  condition: () => isScenarioEnabled('package-manager-outdated'),
  action: async () => {
    logForDebugging('[extendedScenarios] package-manager-outdated: checking')
    try {
      const { execSync } = require('child_process')
      let outdatedCount = 0
      let source = ''

      if (IS_MAC) {
        try {
          const raw: string = execSync('brew outdated 2>/dev/null | wc -l', { encoding: 'utf-8', timeout: 30000 })
          outdatedCount = parseInt(raw.trim(), 10) || 0
          source = 'Homebrew'
        } catch {}
      } else if (IS_WIN) {
        try {
          const raw: string = execSync('winget upgrade --include-unknown 2>nul | find /c " "', { encoding: 'utf-8', timeout: 30000 })
          outdatedCount = parseInt(raw.trim(), 10) || 0
          source = 'winget'
        } catch {}
      } else {
        // Linux
        try {
          const raw: string = execSync('apt list --upgradable 2>/dev/null | wc -l', { encoding: 'utf-8', timeout: 30000 })
          outdatedCount = Math.max(0, (parseInt(raw.trim(), 10) || 0) - 1) // 减去 header 行
          source = 'apt'
        } catch {}
      }

      if (outdatedCount === 0) {
        logForDebugging(`[extendedScenarios] package-manager-outdated: ${source || 'unknown'} 无过期包`)
        return
      }

      pushNotification({
        type: 'info',
        title: '📦 包管理器更新',
        body: `${source} 有 ${outdatedCount} 个过期包可更新`,
        channel: 'system',
      })
      logForDebugging(`[extendedScenarios] package-manager-outdated: ${source} ${outdatedCount} outdated`)
    } catch (e) {
      logForDebugging(`[extendedScenarios] package-manager-outdated failed: ${(e as Error).message}`)
    }
  },
}

// ─── 旧截图清理 ───

const screenshotCleanup: SmartCronTask = {
  id: 'screenshot-cleanup',
  description: '旧截图清理提醒 · Old screenshot cleanup',
  cron: '0 10 * * 0',
  priority: 'low',
  enabled: true,
  condition: () => isScenarioEnabled('screenshot-cleanup'),
  action: async () => {
    logForDebugging('[extendedScenarios] screenshot-cleanup: scanning old screenshots')
    try {
      const { execSync } = require('child_process')
      let oldScreenshots = 0

      if (IS_MAC) {
        try {
          const raw: string = execSync(
            "mdfind 'kMDItemIsScreenCapture = 1 && kMDItemContentCreationDate < $time.now(-2592000)' | wc -l",
            { encoding: 'utf-8', timeout: 15000 },
          )
          oldScreenshots = parseInt(raw.trim(), 10) || 0
        } catch {}
      }

      // 通用 fallback: 扫描常见目录
      if (oldScreenshots === 0) {
        try {
          const { readdirSync, statSync } = require('fs')
          const { join } = require('path')
          const thirtyDaysAgo = Date.now() - 30 * 86400 * 1000
          const patterns = /^(screenshot|截屏|screen shot|截图)/i
          const dirs = [join(HOME, 'Desktop'), join(HOME, 'Pictures')]

          for (const dir of dirs) {
            try {
              const entries = readdirSync(dir)
              for (const entry of entries) {
                if (!patterns.test(entry)) continue
                try {
                  const st = statSync(join(dir, entry))
                  if (st.isFile() && st.mtimeMs < thirtyDaysAgo) {
                    oldScreenshots++
                  }
                } catch {}
              }
            } catch {}
          }
        } catch {}
      }

      if (oldScreenshots <= 20) {
        logForDebugging(`[extendedScenarios] screenshot-cleanup: ${oldScreenshots} old screenshots (under threshold)`)
        return
      }

      pushNotification({
        type: 'info',
        title: '🖼️ 截图清理',
        body: `发现 ${oldScreenshots} 张超过 30 天的旧截图，建议清理`,
        channel: 'system',
      })
      logForDebugging(`[extendedScenarios] screenshot-cleanup: ${oldScreenshots} old screenshots`)
    } catch (e) {
      logForDebugging(`[extendedScenarios] screenshot-cleanup failed: ${(e as Error).message}`)
    }
  },
}

// ─── 重复文件检测（轻量版） ───

const duplicateFileScan: SmartCronTask = {
  id: 'duplicate-file-scan',
  description: '重复文件检测 · Duplicate file scan',
  cron: '0 3 * * 0',
  priority: 'low',
  enabled: true,
  condition: () => isScenarioEnabled('duplicate-file-scan'),
  action: async () => {
    logForDebugging('[extendedScenarios] duplicate-file-scan: scanning ~/Downloads')
    try {
      const { readdirSync, statSync, readFileSync } = require('fs')
      const { join } = require('path')
      const { createHash } = require('crypto')
      const downloadsDir = join(HOME, 'Downloads')

      // 按文件大小分组
      const sizeMap: Record<number, string[]> = {}
      try {
        const entries = readdirSync(downloadsDir, { withFileTypes: true })
        for (const entry of entries) {
          if (!entry.isFile() || entry.name.startsWith('.')) continue
          try {
            const fullPath = join(downloadsDir, entry.name)
            const st = statSync(fullPath)
            if (st.size < 1024) continue // 跳过 < 1KB 小文件
            const size = st.size
            if (!sizeMap[size]) sizeMap[size] = []
            sizeMap[size].push(fullPath)
          } catch {}
        }
      } catch {
        logForDebugging('[extendedScenarios] duplicate-file-scan: 无法读取 Downloads 目录')
        return
      }

      // 大小相同的文件做 MD5 比对
      let duplicateCount = 0
      let wastedBytes = 0
      for (const [, files] of Object.entries(sizeMap)) {
        if (files.length < 2) continue
        const hashMap: Record<string, string[]> = {}
        for (const f of files) {
          try {
            const content = readFileSync(f)
            const hash = createHash('md5').update(content).digest('hex')
            if (!hashMap[hash]) hashMap[hash] = []
            hashMap[hash].push(f)
          } catch {}
        }
        for (const [, dupes] of Object.entries(hashMap)) {
          if (dupes.length >= 2) {
            duplicateCount += dupes.length - 1
            try {
              const st = statSync(dupes[0])
              wastedBytes += st.size * (dupes.length - 1)
            } catch {}
          }
        }
      }

      if (duplicateCount === 0) {
        logForDebugging('[extendedScenarios] duplicate-file-scan: 无重复文件')
        return
      }

      const wastedMB = (wastedBytes / 1024 / 1024).toFixed(1)
      pushNotification({
        type: 'info',
        title: '🔍 重复文件',
        body: `~/Downloads 发现 ${duplicateCount} 个重复文件，浪费约 ${wastedMB} MB`,
        channel: 'system',
      })
      logForDebugging(`[extendedScenarios] duplicate-file-scan: ${duplicateCount} dupes, ${wastedMB}MB wasted`)
    } catch (e) {
      logForDebugging(`[extendedScenarios] duplicate-file-scan failed: ${(e as Error).message}`)
    }
  },
}

// ─── 云同步异常 ───

const cloudSyncStatus: SmartCronTask = {
  id: 'cloud-sync-status',
  description: '云同步状态检测 · Cloud sync status',
  cron: '*/30 * * * *',
  priority: 'normal',
  enabled: true,
  condition: () => isScenarioEnabled('cloud-sync-status'),
  action: async () => {
    logForDebugging('[extendedScenarios] cloud-sync-status: checking')
    try {
      if (!IS_MAC) {
        logForDebugging('[extendedScenarios] cloud-sync-status: 非 macOS，跳过')
        return
      }

      const { execSync } = require('child_process')
      let hasIssue = false
      let detail = ''

      // 检查 brctl status（iCloud Drive 同步控制）
      try {
        const raw: string = execSync('brctl status 2>/dev/null', { encoding: 'utf-8', timeout: 10000 })
        if (/error|stuck|stall/i.test(raw)) {
          hasIssue = true
          detail = 'brctl 报告同步异常'
        }
      } catch {
        // brctl 不可用，检查 bird 进程
        try {
          const birdCheck: string = execSync('ps aux | grep -i "[b]ird" | wc -l', { encoding: 'utf-8', timeout: 5000 })
          const birdCount = parseInt(birdCheck.trim(), 10) || 0
          if (birdCount === 0) {
            hasIssue = true
            detail = 'iCloud 同步进程 (bird) 未运行'
          } else if (birdCount > 5) {
            hasIssue = true
            detail = `bird 进程异常多 (${birdCount} 个)，可能同步卡住`
          }
        } catch {}
      }

      if (!hasIssue) {
        logForDebugging('[extendedScenarios] cloud-sync-status: iCloud 同步正常')
        return
      }

      pushNotification({
        type: 'warning',
        title: '☁️ 云同步异常',
        body: `iCloud Drive 同步可能出现问题：${detail}`,
        channel: 'system',
      })
      logForDebugging(`[extendedScenarios] cloud-sync-status: issue detected — ${detail}`)
    } catch (e) {
      logForDebugging(`[extendedScenarios] cloud-sync-status failed: ${(e as Error).message}`)
    }
  },
}

// ─── 习惯打卡提醒 ───

const habitTracker: SmartCronTask = {
  id: 'habit-tracker',
  description: '习惯打卡提醒 · Habit tracker reminder',
  cron: '0 9,21 * * *',
  priority: 'low',
  enabled: true,
  condition: () => isScenarioEnabled('habit-tracker'),
  action: async () => {
    logForDebugging('[extendedScenarios] habit-tracker: checking habits')
    try {
      const { readFileSync, existsSync } = require('fs')
      const { join } = require('path')

      const habitsConfigPath = join(HOME, '.pandacc', 'config', 'habits.json')
      if (!existsSync(habitsConfigPath)) {
        logForDebugging('[extendedScenarios] habit-tracker: habits.json 不存在，跳过')
        return
      }

      let habits: Array<{ name: string; id: string }> = []
      try {
        habits = JSON.parse(readFileSync(habitsConfigPath, 'utf-8'))
      } catch {
        logForDebugging('[extendedScenarios] habit-tracker: habits.json 解析失败')
        return
      }

      if (!Array.isArray(habits) || habits.length === 0) return

      const today = localDateStr()
      const todayDataPath = join(HOME, '.pandacc', 'data', 'habits', `${today}.json`)

      let completed: Record<string, boolean> = {}
      if (existsSync(todayDataPath)) {
        try {
          completed = JSON.parse(readFileSync(todayDataPath, 'utf-8'))
        } catch {}
      }

      const unchecked = habits.filter(h => !completed[h.id])
      if (unchecked.length === 0) {
        logForDebugging('[extendedScenarios] habit-tracker: 今日习惯已全部完成')
        return
      }

      const detail = unchecked
        .slice(0, 10)
        .map(h => `  • ${h.name}`)
        .join('\n')

      pushNotification({
        type: 'info',
        title: '✅ 习惯打卡',
        body: `今日还有 ${unchecked.length} 项习惯未完成：\n${detail}`,
        channel: 'all',
      })
      logForDebugging(`[extendedScenarios] habit-tracker: ${unchecked.length} unchecked`)
    } catch (e) {
      logForDebugging(`[extendedScenarios] habit-tracker failed: ${(e as Error).message}`)
    }
  },
}

// ─── 签名证书过期 ───

const signingCertExpiry: SmartCronTask = {
  id: 'signing-cert-expiry',
  description: '签名证书过期 · Code signing cert expiry',
  cron: '0 9 * * 1',
  priority: 'critical',
  enabled: true,
  condition: () => isScenarioEnabled('signing-cert-expiry'),
  action: async () => {
    logForDebugging('[extendedScenarios] signing-cert-expiry: checking')
    try {
      if (!IS_MAC) {
        logForDebugging('[extendedScenarios] signing-cert-expiry: 非 macOS，跳过')
        return
      }

      const { execSync } = require('child_process')
      let raw = ''
      try {
        raw = execSync('security find-identity -v -p codesigning 2>/dev/null', {
          encoding: 'utf-8',
          timeout: 10000,
        })
      } catch {
        logForDebugging('[extendedScenarios] signing-cert-expiry: security 命令失败')
        return
      }

      if (!raw.trim() || /0 valid identities/i.test(raw)) {
        logForDebugging('[extendedScenarios] signing-cert-expiry: 无有效签名证书')
        return
      }

      // 提取证书哈希并检查有效期
      const hashMatches = raw.matchAll(/([0-9A-F]{40})\s+"(.+?)"/gi)
      const expiring: { name: string; daysLeft: number }[] = []

      for (const match of hashMatches) {
        const [, hash, name] = match
        try {
          const certInfo: string = execSync(
            `security find-certificate -c "${name}" -p 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null`,
            { encoding: 'utf-8', timeout: 5000 },
          )
          const dateMatch = certInfo.match(/notAfter=(.+)/)
          if (dateMatch) {
            const expiry = new Date(dateMatch[1]).getTime()
            const daysLeft = Math.round((expiry - Date.now()) / 86400000)
            if (daysLeft < 30) {
              expiring.push({ name, daysLeft })
            }
          }
        } catch {}
      }

      if (expiring.length === 0) {
        logForDebugging('[extendedScenarios] signing-cert-expiry: 所有证书有效期充足')
        return
      }

      const detail = expiring
        .map(c => `  • ${c.name}（剩余 ${c.daysLeft} 天）`)
        .join('\n')

      pushNotification({
        type: 'warning',
        title: '🔐 证书即将过期',
        body: `${expiring.length} 个代码签名证书将在 30 天内过期：\n${detail}`,
        channel: 'system',
      })
      logForDebugging(`[extendedScenarios] signing-cert-expiry: ${expiring.length} certs expiring`)
    } catch (e) {
      logForDebugging(`[extendedScenarios] signing-cert-expiry failed: ${(e as Error).message}`)
    }
  },
}

// ─── API 调用频率预警 ───

const apiRateLimit: SmartCronTask = {
  id: 'api-rate-limit',
  description: 'API 调用频率预警 · API rate limit warning',
  cron: '0 */1 * * *',
  priority: 'critical',
  enabled: true,
  condition: () => isScenarioEnabled('api-rate-limit'),
  action: async () => {
    logForDebugging('[extendedScenarios] api-rate-limit: checking usage')
    try {
      const { readdirSync, readFileSync, existsSync } = require('fs')
      const { join } = require('path')

      const usageDir = join(HOME, '.pandacc', 'usage-data')
      if (!existsSync(usageDir)) {
        logForDebugging('[extendedScenarios] api-rate-limit: usage-data 目录不存在')
        return
      }

      // 读取今日使用统计
      const today = localDateStr()
      let totalTokens = 0

      try {
        const entries = readdirSync(usageDir)
        for (const entry of entries) {
          if (!entry.includes(today)) continue
          try {
            const data = JSON.parse(readFileSync(join(usageDir, entry), 'utf-8'))
            totalTokens += (data.inputTokens || 0) + (data.outputTokens || 0)
          } catch {}
        }
      } catch {}

      // 从 proactive config 读取阈值，默认 500K
      const config = getProactiveConfig()
      const threshold = (config as any).apiTokenThreshold || 500000

      if (totalTokens < threshold) {
        logForDebugging(`[extendedScenarios] api-rate-limit: ${totalTokens} tokens (under ${threshold} threshold)`)
        return
      }

      pushNotification({
        type: 'warning',
        title: '⚡ API 用量预警',
        body: `今日 API token 使用量已达 ${Math.round(totalTokens / 1000)}K，超过阈值 ${Math.round(threshold / 1000)}K`,
        channel: 'all',
      })
      logForDebugging(`[extendedScenarios] api-rate-limit: ${totalTokens} tokens exceeds ${threshold}`)
    } catch (e) {
      logForDebugging(`[extendedScenarios] api-rate-limit failed: ${(e as Error).message}`)
    }
  },
}

// ─── 导出 ───

export function getExtendedTasks(): SmartCronTask[] {
  return [
    systemUpdateAvailable,
    packageManagerOutdated,
    screenshotCleanup,
    duplicateFileScan,
    cloudSyncStatus,
    habitTracker,
    signingCertExpiry,
    apiRateLimit,
  ]
}
