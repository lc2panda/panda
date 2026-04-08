// Input: 系统/开发状态数据（电池/CPU/进程/Docker/依赖）+ 阈值配置
// Output: 5 个 SmartCronTask（电池健康/CPU负载/僵尸进程/Docker状态/依赖过期），触发时推送通知
// Pos: proactive/tasks/ 高级系统场景层，由 taskRegistry 注册并由调度器执行

import { execSync } from 'child_process'
import { cpus, loadavg } from 'os'
import { existsSync } from 'fs'
import { join } from 'path'
import { pushNotification } from '../../assistant/sense.js'
import { logForDebugging } from '../../utils/debug.js'
import { getProactiveConfig, isScenarioEnabled } from '../proactiveConfig.js'
import { getBatteryInfo, IS_MAC, IS_WIN } from '../platform.js'

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

// ─── A4 电池健康 ───

const batteryHealth: SmartCronTask = {
  id: 'battery-health',
  description: '电池健康检测 · Battery health monitor',
  cron: '*/10 * * * *',
  priority: 'normal',
  enabled: true,
  condition: () => isScenarioEnabled('battery-health'),
  action: async () => {
    try {
      const config = getProactiveConfig()
      const info = getBatteryInfo()

      // 无电池（台式机）→ 静默跳过
      if (!info) {
        logForDebugging('[advancedSystem] battery-health: 无电池设备，跳过')
        return
      }

      const lowPercent = config.batteryLowPercent || 20
      const lowHealth = config.batteryHealthPercent || 80
      const maxCycles = 800

      const issues: string[] = []
      if (info.percent < lowPercent && !info.charging) {
        issues.push(`电量 ${info.percent}%（阈值 ${lowPercent}%）`)
      }
      if (info.health < lowHealth) {
        issues.push(`健康度 ${info.health}%（阈值 ${lowHealth}%）`)
      }
      if (info.cycleCount > maxCycles) {
        issues.push(`循环次数 ${info.cycleCount}（阈值 ${maxCycles}）`)
      }

      if (issues.length > 0) {
        pushNotification({
          type: 'warning',
          title: '🔋 电池健康告警',
          body: issues.join('；'),
          channel: 'system',
        })
        logForDebugging(`[advancedSystem] battery-health: 告警触发 — ${issues.join(', ')}`)
      }
    } catch (e) {
      logForDebugging(`[advancedSystem] battery-health failed: ${(e as Error).message}`)
    }
  },
}

// ─── A3 CPU 高负载 ───

function getCpuLoadNormalized(): number {
  const avg5 = loadavg()[1] // 5 分钟平均
  const cores = cpus().length

  // Windows: loadavg 返回 [0,0,0]，用 wmic fallback
  if (avg5 === 0 && IS_WIN) {
    try {
      const out = execSync('wmic cpu get LoadPercentage /format:csv', {
        encoding: 'utf-8',
        timeout: 5000,
      })
      const lines = out.trim().split('\n').filter(Boolean)
      const last = lines[lines.length - 1].split(',')
      const pct = parseInt(last[last.length - 1], 10)
      return isNaN(pct) ? 0 : pct / 100
    } catch {
      return 0
    }
  }

  return avg5 / cores
}

const cpuHighLoad: SmartCronTask = {
  id: 'cpu-high-load',
  description: 'CPU 高负载检测 · CPU high load monitor',
  cron: '*/5 * * * *',
  priority: 'critical',
  enabled: true,
  condition: () => isScenarioEnabled('cpu-high-load'),
  action: async () => {
    try {
      const normalized = getCpuLoadNormalized()
      const threshold = 0.8

      if (normalized > threshold) {
        const pct = Math.round(normalized * 100)
        pushNotification({
          type: 'warning',
          title: '🔥 CPU 负载过高',
          body: `5 分钟平均负载 ${pct}%（归一化，阈值 80%），${cpus().length} 核心`,
          channel: 'system',
        })
        logForDebugging(`[advancedSystem] cpu-high-load: 告警触发 — 归一化负载 ${pct}%`)
      }
    } catch (e) {
      logForDebugging(`[advancedSystem] cpu-high-load failed: ${(e as Error).message}`)
    }
  },
}

// ─── A7 僵尸进程 ───

const zombieProcessAlert: SmartCronTask = {
  id: 'zombie-process-alert',
  description: '僵尸进程与内存泄漏检测 · Zombie process & memory leak alert',
  cron: '*/10 * * * *',
  priority: 'normal',
  enabled: true,
  condition: () => isScenarioEnabled('zombie-process-alert'),
  action: async () => {
    try {
      const issues: string[] = []

      if (IS_WIN) {
        // Windows: 检测无响应进程
        try {
          const out = execSync(
            'powershell -c "Get-Process | Where-Object {$_.Responding -eq $false} | Measure-Object | Select-Object -ExpandProperty Count"',
            { encoding: 'utf-8', timeout: 10000 },
          )
          const count = parseInt(out.trim(), 10)
          if (count > 0) {
            issues.push(`${count} 个无响应进程`)
          }
        } catch {}
      } else {
        // macOS / Linux: 僵尸进程
        try {
          const out = execSync("ps aux | grep ' Z ' | grep -v grep | wc -l", {
            encoding: 'utf-8',
            timeout: 5000,
          })
          const count = parseInt(out.trim(), 10)
          if (count > 0) {
            issues.push(`${count} 个僵尸进程`)
          }
        } catch {}

        // 单进程内存 > 4GB
        try {
          const out = execSync('ps aux --sort=-rss | head -5', {
            encoding: 'utf-8',
            timeout: 5000,
          })
          const lines = out.trim().split('\n').slice(1) // 跳过表头
          const threshold4GB = 4 * 1024 * 1024 // RSS 单位 KB
          for (const line of lines) {
            const parts = line.trim().split(/\s+/)
            const rss = parseInt(parts[5], 10)
            if (rss > threshold4GB) {
              const cmd = parts.slice(10).join(' ').slice(0, 40)
              const gb = (rss / 1048576).toFixed(1)
              issues.push(`进程 ${cmd} 占用 ${gb}GB 内存`)
            }
          }
        } catch {}
      }

      if (issues.length > 0) {
        pushNotification({
          type: 'warning',
          title: '💀 异常进程检测',
          body: issues.join('\n'),
          channel: 'system',
        })
        logForDebugging(`[advancedSystem] zombie-process-alert: 告警触发 — ${issues.join('; ')}`)
      }
    } catch (e) {
      logForDebugging(`[advancedSystem] zombie-process-alert failed: ${(e as Error).message}`)
    }
  },
}

// ─── D6 Docker 容器状态 ───

function isDockerAvailable(): boolean {
  try {
    const cmd = IS_WIN ? 'where docker 2>nul' : 'which docker 2>/dev/null'
    execSync(cmd, { encoding: 'utf-8', timeout: 3000 })
    return true
  } catch {
    return false
  }
}

const dockerHealth: SmartCronTask = {
  id: 'docker-health',
  description: 'Docker 容器健康检测 · Docker container health',
  cron: '*/10 * * * *',
  priority: 'normal',
  enabled: true,
  condition: () => isScenarioEnabled('docker-health'),
  skipIf: () => !isDockerAvailable(),
  action: async () => {
    try {
      // docker 未安装 → 静默跳过
      if (!isDockerAvailable()) {
        logForDebugging('[advancedSystem] docker-health: docker 未安装，跳过')
        return
      }

      let out: string
      try {
        out = execSync("docker ps -a --format '{{.Names}}|{{.Status}}|{{.State}}' 2>/dev/null", {
          encoding: 'utf-8',
          timeout: 10000,
        })
      } catch {
        // docker 未运行 → 静默跳过
        logForDebugging('[advancedSystem] docker-health: docker 未运行，跳过')
        return
      }

      const lines = out.trim().split('\n').filter(Boolean)
      const unhealthy: string[] = []

      for (const line of lines) {
        const [name, status, state] = line.split('|')
        if (state === 'exited' || state === 'dead') {
          unhealthy.push(`${name}（${state}）`)
        }
      }

      if (unhealthy.length > 0) {
        pushNotification({
          type: 'warning',
          title: '🐳 Docker 容器异常',
          body: `${unhealthy.length} 个容器已停止：\n${unhealthy.slice(0, 5).join('\n')}`,
          channel: 'system',
        })
        logForDebugging(`[advancedSystem] docker-health: 告警触发 — ${unhealthy.length} 个异常容器`)
      }
    } catch (e) {
      logForDebugging(`[advancedSystem] docker-health failed: ${(e as Error).message}`)
    }
  },
}

// ─── D9 依赖版本过期 ───

const outdatedDeps: SmartCronTask = {
  id: 'outdated-deps',
  description: '依赖版本过期检测 · Outdated dependencies check',
  cron: '0 9 * * 1',
  priority: 'low',
  enabled: true,
  condition: () => isScenarioEnabled('outdated-deps'),
  skipIf: () => !existsSync(join(process.cwd(), 'package.json')),
  action: async () => {
    try {
      if (!existsSync(join(process.cwd(), 'package.json'))) {
        logForDebugging('[advancedSystem] outdated-deps: 无 package.json，跳过')
        return
      }

      let out: string
      try {
        out = execSync('npm outdated --json 2>/dev/null', {
          encoding: 'utf-8',
          timeout: 60000,
          cwd: process.cwd(),
        })
      } catch (e: any) {
        // npm outdated 在有过期包时 exit code=1，但 stdout 仍有 JSON
        out = e.stdout || ''
        if (!out) {
          logForDebugging('[advancedSystem] outdated-deps: npm outdated 无输出')
          return
        }
      }

      if (!out.trim()) return

      let deps: Record<string, { current: string; wanted: string; latest: string }>
      try {
        deps = JSON.parse(out)
      } catch {
        logForDebugging('[advancedSystem] outdated-deps: JSON 解析失败')
        return
      }

      // 筛选 major 版本差异 > 1 的包
      const majorOutdated: Array<{ name: string; current: string; latest: string; diff: number }> = []
      for (const [name, info] of Object.entries(deps)) {
        const currentMajor = parseInt((info.current || '0').split('.')[0], 10)
        const latestMajor = parseInt((info.latest || '0').split('.')[0], 10)
        const diff = latestMajor - currentMajor
        if (diff > 1) {
          majorOutdated.push({ name, current: info.current, latest: info.latest, diff })
        }
      }

      if (majorOutdated.length > 0) {
        // 按差异排序，取 top 5
        majorOutdated.sort((a, b) => b.diff - a.diff)
        const top5 = majorOutdated.slice(0, 5)
        const list = top5.map(d => `  ${d.name}: ${d.current} → ${d.latest}（差 ${d.diff} 个大版本）`).join('\n')

        pushNotification({
          type: 'info',
          title: '📦 依赖版本严重过期',
          body: `${majorOutdated.length} 个包的 major 版本差异 > 1：\n${list}`,
          channel: 'system',
        })
        logForDebugging(`[advancedSystem] outdated-deps: 告警触发 — ${majorOutdated.length} 个 major 过期`)
      }
    } catch (e) {
      logForDebugging(`[advancedSystem] outdated-deps failed: ${(e as Error).message}`)
    }
  },
}

// ─── 导出 ───

export function getAdvancedSystemTasks(): SmartCronTask[] {
  return [batteryHealth, cpuHighLoad, zombieProcessAlert, dockerHealth, outdatedDeps]
}
