// Input: 跨平台数据获取请求
// Output: 统一格式的系统数据（磁盘/内存/进程/空闲时间等）
// Pos: proactive/ 平台抽象层，所有场景任务通过此模块获取系统数据

import { execSync } from 'child_process'
import { homedir, platform, totalmem, freemem } from 'os'
import { join } from 'path'
import { readdirSync, statSync } from 'fs'

const IS_MAC = platform() === 'darwin'
const IS_WIN = platform() === 'win32'

// ─── 磁盘空间 ───

export interface DiskInfo {
  total: number    // bytes
  free: number     // bytes
  usedPercent: number
  mount: string
}

export function getDiskInfo(mount: string = '/'): DiskInfo | null {
  try {
    if (IS_WIN) {
      const drive = mount || 'C:'
      const out = execSync(`wmic logicaldisk where "DeviceID='${drive}'" get Size,FreeSpace /format:csv`, { encoding: 'utf-8', timeout: 5000 })
      const lines = out.trim().split('\n').filter(Boolean)
      const last = lines[lines.length - 1].split(',')
      const free = parseInt(last[1], 10)
      const total = parseInt(last[2], 10)
      return { total, free, usedPercent: Math.round((1 - free / total) * 100), mount: drive }
    }
    // macOS / Linux
    const out = execSync(`df -k "${mount}"`, { encoding: 'utf-8', timeout: 5000 })
    const line = out.trim().split('\n')[1]
    if (!line) return null
    const parts = line.split(/\s+/)
    const total = parseInt(parts[1], 10) * 1024
    const free = parseInt(parts[3], 10) * 1024
    return { total, free, usedPercent: Math.round((1 - free / total) * 100), mount }
  } catch { return null }
}

// ─── 内存 ───

export interface MemoryInfo {
  total: number
  free: number
  usedPercent: number
}

export function getMemoryInfo(): MemoryInfo {
  const total = totalmem()
  const free = freemem()
  return { total, free, usedPercent: Math.round((1 - free / total) * 100) }
}

// ─── 用户空闲时间（秒） ───

export function getUserIdleSeconds(): number {
  try {
    if (IS_MAC) {
      const out = execSync('ioreg -c IOHIDSystem | grep HIDIdleTime', { encoding: 'utf-8', timeout: 3000 })
      const match = out.match(/HIDIdleTime.*?=\s*(\d+)/)
      if (match) return Math.floor(parseInt(match[1], 10) / 1000000000)
    }
    if (IS_WIN) {
      // PowerShell: 获取上次输入时间
      const out = execSync('powershell -c "[System.Environment]::TickCount - [int](Add-Type -MemberDefinition \'[DllImport(\\"user32.dll\\")]public static extern bool GetLastInputInfo(ref LASTINPUTINFO plii);[StructLayout(LayoutKind.Sequential)]public struct LASTINPUTINFO{public uint cbSize;public uint dwTime;}\' -Name U32 -Namespace W -PassThru)::GetLastInputInfo([ref]($l = New-Object W.U32+LASTINPUTINFO; $l.cbSize = [System.Runtime.InteropServices.Marshal]::SizeOf($l); $l)); $l.dwTime"', { encoding: 'utf-8', timeout: 5000 }).trim()
      return Math.floor(parseInt(out, 10) / 1000)
    }
    // Linux: xprintidle
    const out = execSync('xprintidle 2>/dev/null || echo 0', { encoding: 'utf-8', timeout: 3000 })
    return Math.floor(parseInt(out.trim(), 10) / 1000)
  } catch { return 0 }
}

// ─── 目录文件统计 ───

export interface DirStats {
  fileCount: number
  totalSize: number  // bytes
  oldestFile: string | null
  oldestAge: number  // days
}

export function getDirStats(dir: string): DirStats | null {
  try {
    const entries = readdirSync(dir, { withFileTypes: true })
    let fileCount = 0, totalSize = 0, oldestMs = Date.now(), oldestFile: string | null = null
    for (const e of entries) {
      if (!e.isFile() || e.name.startsWith('.')) continue
      fileCount++
      try {
        const st = statSync(join(dir, e.name))
        totalSize += st.size
        if (st.mtimeMs < oldestMs) { oldestMs = st.mtimeMs; oldestFile = e.name }
      } catch {}
    }
    return { fileCount, totalSize, oldestFile, oldestAge: Math.round((Date.now() - oldestMs) / 86400000) }
  } catch { return null }
}

// ─── 电池信息 ───

export interface BatteryInfo {
  percent: number
  charging: boolean
  cycleCount: number
  health: number  // 0-100
}

export function getBatteryInfo(): BatteryInfo | null {
  try {
    if (IS_MAC) {
      const batt = execSync('pmset -g batt', { encoding: 'utf-8', timeout: 3000 })
      const pctMatch = batt.match(/(\d+)%/)
      const charging = /AC Power/.test(batt)
      let cycleCount = 0, health = 100
      try {
        const sp = execSync('system_profiler SPPowerDataType 2>/dev/null', { encoding: 'utf-8', timeout: 10000 })
        const cycleMatch = sp.match(/Cycle Count:\s*(\d+)/)
        const healthMatch = sp.match(/Maximum Capacity:\s*(\d+)/)
        if (cycleMatch) cycleCount = parseInt(cycleMatch[1], 10)
        if (healthMatch) health = parseInt(healthMatch[1], 10)
      } catch {}
      return { percent: pctMatch ? parseInt(pctMatch[1], 10) : 100, charging, cycleCount, health }
    }
    if (IS_WIN) {
      const out = execSync('wmic path Win32_Battery get EstimatedChargeRemaining,BatteryStatus /format:csv', { encoding: 'utf-8', timeout: 5000 })
      const lines = out.trim().split('\n').filter(Boolean)
      const last = lines[lines.length - 1].split(',')
      return { percent: parseInt(last[2], 10) || 100, charging: last[1] === '2', cycleCount: 0, health: 100 }
    }
  } catch {}
  return null
}

// ─── 网络连通性 ───

export interface NetworkStatus {
  connected: boolean
  latencyMs: number
  packetLoss: number  // 0-100
}

export function checkNetwork(host: string = '8.8.8.8'): NetworkStatus {
  try {
    const cmd = IS_WIN
      ? `ping -n 3 -w 2000 ${host}`
      : `ping -c 3 -W 2 ${host}`
    const out = execSync(cmd, { encoding: 'utf-8', timeout: 15000 })
    const lossMatch = out.match(/(\d+)%\s*(?:packet\s*)?loss/i)
    const latencyMatch = out.match(/(?:avg|Average)\s*[=:]\s*([\d.]+)/i)
      || out.match(/time[=<]([\d.]+)/i)
    return {
      connected: true,
      latencyMs: latencyMatch ? parseFloat(latencyMatch[1]) : 0,
      packetLoss: lossMatch ? parseInt(lossMatch[1], 10) : 0,
    }
  } catch {
    return { connected: false, latencyMs: 0, packetLoss: 100 }
  }
}

// ─── 导出平台标识 ───
export { IS_MAC, IS_WIN }
export const HOME = homedir()
export const DOWNLOADS = join(HOME, 'Downloads')
export const DESKTOP = join(HOME, 'Desktop')

// ─── 首次启动目录初始化 ───

import { mkdirSync, writeFileSync, existsSync } from 'fs'

const PANDACC_DIRS = [
  '.pandacc/config',
  '.pandacc/data/clipboard',
  '.pandacc/data/notification-stats',
  '.pandacc/data/todo-history',
  '.pandacc/data/wechat-stats',
  '.pandacc/data/wechat-decrypted',
  '.pandacc/data/wechat-situational',
  '.pandacc/data/wechat-situational/weekly',
  '.pandacc/data/wechat-situational/monthly',
  '.pandacc/data/wechat-situational/quarterly',
  '.pandacc/data/wechat-situational/yearly',
  '.pandacc/channels/outbox',
  '.pandacc/assistant',
]

let _dirsEnsured = false

/**
 * 确保 ~/.pandacc/ 下所有必要子目录存在。
 * 幂等操作，首次调用时创建，后续跳过。
 * 由 proactive 激活时调用，也可在启动时调用。
 */
// 首次安装时生成的默认配置文件（仅文件不存在时写入）
const DEFAULT_CONFIG_FILES: Record<string, string> = {
  '.pandacc/config/proactive.json': JSON.stringify({
    diskFreePercent: 10, diskFreeGB: 20, memoryUsedPercent: 85,
    batteryLowPercent: 20, networkLatencyMs: 500, networkLossPercent: 30,
    downloadsFileCount: 50, desktopFileCount: 30,
    gitUncommittedHours: 3, gitBranchStaleDays: 7,
    noBreakMinutes: 90, lateNightStartHour: 23, lateNightEndHour: 5,
    sshKeyMaxDays: 365, sslCertWarnDays: 30,
    enabledScenarios: {},
  }, null, 2),
  '.pandacc/config/privacy.json': JSON.stringify({
    excludePaths: ['~/.ssh/**', '~/.gnupg/**', '~/.aws/**', '**/node_modules/**'],
    excludeApps: ['1Password', 'Keychain Access'],
    excludeBrowserDomains: ['*.bank.*', '*.gov'],
    sensitivePatterns: ['password', 'secret', 'api[._-]?key', 'token', 'sk-'],
    dataRetentionDays: 90,
  }, null, 2),
  '.pandacc/config/connectors.json': JSON.stringify({
    feishu: { enabled: false, mode: 'mcp', appId: '', appSecret: '' },
    dingtalk: { enabled: false, mode: 'mcp', appKey: '', appSecret: '' },
    slack: { enabled: false, token: '' },
    telegram: { enabled: false, botToken: '' },
    wechat: { enabled: false, mode: 'local-db', keysFile: '' },
    teams: { enabled: false, tenantId: '', clientId: '', clientSecret: '' },
  }, null, 2),
  '.pandacc/config/dates.json': '[]',
  '.pandacc/config/habits.json': '[]',
  '.pandacc/config/wechat-keywords.json': '["合同", "截止", "紧急", "上线", "发版"]',
  '.pandacc/config/wechat-vip.json': '[]',
  '.pandacc/config/wechat-topics.json': '[]',
}

export function ensurePandaccDirs(): void {
  if (_dirsEnsured) return
  _dirsEnsured = true
  // 创建目录
  for (const sub of PANDACC_DIRS) {
    try { mkdirSync(join(HOME, sub), { recursive: true }) } catch {}
  }
  // 生成默认配置文件（仅首次，不覆盖已有）
  for (const [relPath, content] of Object.entries(DEFAULT_CONFIG_FILES)) {
    const fullPath = join(HOME, relPath)
    try {
      if (!existsSync(fullPath)) {
        writeFileSync(fullPath, content, 'utf-8')
      }
    } catch {}
  }
}
