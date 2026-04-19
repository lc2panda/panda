// Input: 定时触发的安全场景检查请求（密码泄露/SSH/SSL/敏感文件）
// Output: 安全风险主动推送通知
// Pos: proactive/tasks/ 安全场景层，由 taskRegistry 注册调度

import { pushNotification } from '../../assistant/sense.js'
// P3-T4-β: panda-on-desk 联动桥接（feature('BUDDY') 内 gate；on-desk 离线静默）
// security 类全部 HIGH_PRIVACY，按 A3 §2/§5 → system + overlay error level；defaultOn=false
// 启用前 dispatcher 内 shouldDeliverNotification 把关，避免敏感信息误曝
import {
  pushNotification as pushDeskNotification,
  isOnDeskEnabled as isDeskOnDeskEnabled,
} from '../../desk/bridge.js'
import { getProactiveConfig, isScenarioEnabled } from '../proactiveConfig.js'
import { logForDebugging } from '../../utils/debug.js'
import { HOME } from '../platform.js'
import { readFileSync, readdirSync, statSync, existsSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'
import { platform } from 'os'

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

// ─── 辅助：读取 proactive.json 中的自定义字段 ───

function readProactiveJson(): Record<string, unknown> {
  try {
    const raw = readFileSync(join(HOME, '.pandacc', 'config', 'proactive.json'), 'utf-8')
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

// ═══════════════════════════════════════════════════════════════════
// G1: 密码泄露检测 (Have I Been Pwned)
// ═══════════════════════════════════════════════════════════════════

const passwordBreachCheck: SmartCronTask = {
  id: 'password-breach-check',
  description: '密码泄露检测 · Password breach check via HIBP',
  cron: '0 9 * * 1',
  priority: 'critical',
  enabled: true,
  condition: () => isScenarioEnabled('password-breach-check'),
  action: async () => {
    logForDebugging('[securityScenarios] password-breach-check: 开始检查')
    try {
      const pConfig = readProactiveJson()
      const emails = pConfig.emails as string[] | undefined
      if (!emails || !Array.isArray(emails) || emails.length === 0) {
        logForDebugging('[securityScenarios] password-breach-check: 未配置 emails，跳过')
        return
      }

      const apiKey = pConfig['hibp-api-key'] as string | undefined

      for (const email of emails) {
        try {
          const url = apiKey
            ? `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}?truncateResponse=true`
            : `https://haveibeenpwned.com/api/v2/breachedaccount/${encodeURIComponent(email)}`

          const headers: Record<string, string> = {
            'User-Agent': 'PandaCode-SecurityMonitor',
          }
          if (apiKey) headers['hibp-api-key'] = apiKey

          const resp = await fetch(url, { headers })

          if (resp.status === 200) {
            const breaches = await resp.json() as { Name?: string }[]
            const count = Array.isArray(breaches) ? breaches.length : 0
            if (count > 0) {
              pushNotification({
                type: 'warning',
                title: '🔐 密码泄露警告',
                body: `${email} 出现在 ${count} 个已知泄露数据库中，请尽快修改密码`,
                channel: 'all',
              })
              // why: P3-T4-β panda-on-desk 联动 — 密码泄露 system + overlay (error)（HIGH_PRIVACY 默认 OFF）
              try {
                if (isDeskOnDeskEnabled()) {
                  pushDeskNotification({
                    kind: 'system',
                    level: 'error',
                    scenarioId: 'security-password-breach',
                    title: 'Panda · 密码泄露警告',
                    body: `${email} 出现在 ${count} 个泄露数据库`,
                    soundCue: 'critical',
                  })
                  pushDeskNotification({
                    kind: 'overlay',
                    level: 'error',
                    scenarioId: 'security-password-breach',
                    title: 'Panda · 密码泄露警告',
                    body: `${email} 出现在 ${count} 个泄露数据库，请尽快修改密码`,
                    ttlMs: 10_000,
                  })
                }
              } catch {
                // 桥接失败不阻塞 proactive 主路径
              }
              logForDebugging(`[securityScenarios] password-breach-check: ${email} 有 ${count} 个泄露`)
            }
          } else if (resp.status === 404) {
            // 未发现泄露，正常
          } else {
            logForDebugging(`[securityScenarios] password-breach-check: ${email} 响应 ${resp.status}`)
          }

          // v2 API 频率限制：每次请求间隔 1.5 秒
          if (!apiKey) await new Promise(r => setTimeout(r, 1600))
        } catch (e) {
          logForDebugging(`[securityScenarios] password-breach-check: ${email} 请求失败 — ${(e as Error).message}`)
        }
      }
    } catch (e) {
      logForDebugging(`[securityScenarios] password-breach-check failed: ${(e as Error).message}`)
    }
  },
}

// ═══════════════════════════════════════════════════════════════════
// G2: SSH key 过期检测
// ═══════════════════════════════════════════════════════════════════

const sshKeyExpiry: SmartCronTask = {
  id: 'ssh-key-expiry',
  description: 'SSH key 过期检测 · SSH key rotation reminder',
  cron: '0 9 1 * *',
  priority: 'normal',
  enabled: true,
  condition: () => isScenarioEnabled('ssh-key-expiry'),
  action: async () => {
    logForDebugging('[securityScenarios] ssh-key-expiry: 开始扫描')
    try {
      const config = getProactiveConfig()
      const maxDays = config.sshKeyMaxDays || 365

      const IS_WIN = platform() === 'win32'
      const sshDir = IS_WIN
        ? join(process.env.USERPROFILE || HOME, '.ssh')
        : join(HOME, '.ssh')

      if (!existsSync(sshDir)) {
        logForDebugging('[securityScenarios] ssh-key-expiry: SSH 目录不存在，跳过')
        return
      }

      const entries = readdirSync(sshDir)
      const expired: { name: string; days: number }[] = []

      for (const entry of entries) {
        if (!entry.startsWith('id_')) continue
        // 跳过 .pub 文件，只检查私钥
        if (entry.endsWith('.pub')) continue

        try {
          const st = statSync(join(sshDir, entry))
          const ageDays = Math.round((Date.now() - st.birthtimeMs) / 86400000)
          if (ageDays > maxDays) {
            expired.push({ name: entry, days: ageDays })
          }
        } catch {}
      }

      if (expired.length > 0) {
        const details = expired.map(k => `${k.name}（${k.days} 天）`).join('、')
        pushNotification({
          type: 'warning',
          title: '🔑 SSH key 需要轮换',
          body: `以下 SSH key 超过 ${maxDays} 天未更新：${details}`,
          channel: 'system',
        })
        // why: P3-T4-β panda-on-desk 联动 — SSH key 过期 system + overlay (warning)（HIGH_PRIVACY 默认 OFF）
        try {
          if (isDeskOnDeskEnabled()) {
            pushDeskNotification({
              kind: 'system',
              level: 'warning',
              scenarioId: 'security-ssh-key-expiry',
              title: 'Panda · SSH key 需要轮换',
              body: `${expired.length} 个 key 超 ${maxDays} 天未更新`,
            })
            pushDeskNotification({
              kind: 'overlay',
              level: 'warning',
              scenarioId: 'security-ssh-key-expiry',
              title: 'Panda · SSH key 需要轮换',
              body: details,
              ttlMs: 10_000,
            })
          }
        } catch {
          // 桥接失败不阻塞 proactive 主路径
        }
        logForDebugging(`[securityScenarios] ssh-key-expiry: ${expired.length} 个 key 已过期`)
      }
    } catch (e) {
      logForDebugging(`[securityScenarios] ssh-key-expiry failed: ${(e as Error).message}`)
    }
  },
}

// ═══════════════════════════════════════════════════════════════════
// G3: SSL 证书到期检测
// ═══════════════════════════════════════════════════════════════════

const sslCertExpiry: SmartCronTask = {
  id: 'ssl-cert-expiry',
  description: 'SSL 证书到期检测 · SSL certificate expiry check',
  cron: '0 9 * * *',
  priority: 'critical',
  enabled: true,
  condition: () => isScenarioEnabled('ssl-cert-expiry'),
  action: async () => {
    logForDebugging('[securityScenarios] ssl-cert-expiry: 开始检查')
    try {
      const config = getProactiveConfig()
      const warnDays = config.sslCertWarnDays || 30
      const pConfig = readProactiveJson()
      const domains = pConfig.sslDomains as string[] | undefined

      if (!domains || !Array.isArray(domains) || domains.length === 0) {
        logForDebugging('[securityScenarios] ssl-cert-expiry: 未配置 sslDomains，跳过')
        return
      }

      const expiring: { domain: string; daysLeft: number }[] = []

      for (const domain of domains) {
        try {
          const cmd = `openssl s_client -connect ${domain}:443 -servername ${domain} </dev/null 2>/dev/null | openssl x509 -noout -enddate`
          const out = execSync(cmd, { encoding: 'utf-8', timeout: 15000 })
          // 输出格式: notAfter=Jun 15 12:00:00 2025 GMT
          const match = out.match(/notAfter=(.+)/)
          if (match) {
            const expiryDate = new Date(match[1].trim())
            const daysLeft = Math.round((expiryDate.getTime() - Date.now()) / 86400000)
            if (daysLeft < warnDays) {
              expiring.push({ domain, daysLeft })
            }
          }
        } catch (e) {
          logForDebugging(`[securityScenarios] ssl-cert-expiry: ${domain} 检查失败 — ${(e as Error).message}`)
        }
      }

      if (expiring.length > 0) {
        const details = expiring
          .map(d => `${d.domain}（剩余 ${d.daysLeft} 天）`)
          .join('、')
        pushNotification({
          type: 'warning',
          title: '🔒 SSL 证书即将到期',
          body: `以下域名证书将在 ${warnDays} 天内过期：${details}`,
          channel: 'all',
        })
        // why: P3-T4-β panda-on-desk 联动 — SSL 证书过期 system + overlay (error)（HIGH_PRIVACY 默认 OFF）
        try {
          if (isDeskOnDeskEnabled()) {
            pushDeskNotification({
              kind: 'system',
              level: 'error',
              scenarioId: 'security-ssl-cert-expiry',
              title: 'Panda · SSL 证书即将到期',
              body: `${expiring.length} 个域名证书 ${warnDays} 天内过期`,
              soundCue: 'critical',
            })
            pushDeskNotification({
              kind: 'overlay',
              level: 'error',
              scenarioId: 'security-ssl-cert-expiry',
              title: 'Panda · SSL 证书即将到期',
              body: details,
              ttlMs: 10_000,
            })
          }
        } catch {
          // 桥接失败不阻塞 proactive 主路径
        }
        logForDebugging(`[securityScenarios] ssl-cert-expiry: ${expiring.length} 个域名证书即将过期`)
      }
    } catch (e) {
      logForDebugging(`[securityScenarios] ssl-cert-expiry failed: ${(e as Error).message}`)
    }
  },
}

// ═══════════════════════════════════════════════════════════════════
// G5: 敏感文件暴露扫描
// ═══════════════════════════════════════════════════════════════════

const SENSITIVE_PATTERNS = ['.env', 'credentials', 'secret', '.pem', '.key'] as const
const CONTENT_PATTERNS = /(?:API_KEY|SECRET|PASSWORD|PRIVATE_KEY|ACCESS_TOKEN|AWS_SECRET)\s*[=:]/i

function scanDirForSensitiveFiles(dir: string): { path: string; reason: string }[] {
  const results: { path: string; reason: string }[] = []
  if (!existsSync(dir)) return results

  try {
    const entries = readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isDirectory()) continue
      const name = entry.name.toLowerCase()

      // 文件名匹配
      const nameMatch = SENSITIVE_PATTERNS.some(p => {
        if (p.startsWith('.')) return name === p || name.startsWith(p + '.')
        return name.includes(p)
      })

      if (!nameMatch) continue

      const fullPath = join(dir, entry.name)
      // 内容匹配（只读前 4KB）
      try {
        const fd = readFileSync(fullPath, { encoding: 'utf-8', flag: 'r' }).slice(0, 4096)
        if (CONTENT_PATTERNS.test(fd)) {
          results.push({ path: fullPath, reason: `文件名含敏感关键词且内容包含凭据模式` })
        }
      } catch {
        // 不可读文件跳过
      }
    }
  } catch {}

  return results
}

const sensitiveFileScan: SmartCronTask = {
  id: 'sensitive-file-scan',
  description: '敏感文件暴露扫描 · Sensitive file exposure scan',
  cron: '0 3 * * *',
  priority: 'critical',
  enabled: true,
  condition: () => isScenarioEnabled('sensitive-file-scan'),
  action: async () => {
    logForDebugging('[securityScenarios] sensitive-file-scan: 开始扫描')
    try {
      const scanDirs = [
        join(HOME, 'Desktop'),
        join(HOME, 'Documents'),
        join(HOME, 'Public'),
      ]

      const allFound: { path: string; reason: string }[] = []

      for (const dir of scanDirs) {
        const found = scanDirForSensitiveFiles(dir)
        allFound.push(...found)
      }

      if (allFound.length > 0) {
        const summary = allFound.slice(0, 5).map(f => f.path).join('\n  · ')
        const extra = allFound.length > 5 ? `\n  …还有 ${allFound.length - 5} 个文件` : ''
        pushNotification({
          type: 'warning',
          title: '🚨 发现敏感文件暴露',
          body: `在公开目录发现 ${allFound.length} 个可能含凭据的文件：\n  · ${summary}${extra}`,
          channel: 'all',
        })
        // why: P3-T4-β panda-on-desk 联动 — 敏感文件暴露 system + overlay (error)（HIGH_PRIVACY 默认 OFF）
        try {
          if (isDeskOnDeskEnabled()) {
            pushDeskNotification({
              kind: 'system',
              level: 'error',
              scenarioId: 'security-sensitive-file',
              title: 'Panda · 发现敏感文件暴露',
              body: `${allFound.length} 个文件可能含凭据`,
              soundCue: 'critical',
            })
            pushDeskNotification({
              kind: 'overlay',
              level: 'error',
              scenarioId: 'security-sensitive-file',
              title: 'Panda · 发现敏感文件暴露',
              body: `${allFound.length} 个文件可能含凭据 — 详见日志`,
              ttlMs: 10_000,
            })
          }
        } catch {
          // 桥接失败不阻塞 proactive 主路径
        }
        logForDebugging(`[securityScenarios] sensitive-file-scan: 发现 ${allFound.length} 个敏感文件`)
      }
    } catch (e) {
      logForDebugging(`[securityScenarios] sensitive-file-scan failed: ${(e as Error).message}`)
    }
  },
}

// ═══════════════════════════════════════════════════════════════════
// 导出
// ═══════════════════════════════════════════════════════════════════

export function getSecurityTasks(): SmartCronTask[] {
  return [
    passwordBreachCheck,
    sshKeyExpiry,
    sslCertExpiry,
    sensitiveFileScan,
  ]
}
