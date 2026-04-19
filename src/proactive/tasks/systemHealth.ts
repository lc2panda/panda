// Input: 系统状态数据（磁盘/内存/网络）+ 阈值配置
// Output: 3 个 SmartCronTask（磁盘告警/内存压力/网络异常），触发时推送通知
// Pos: proactive/tasks/ 系统健康场景层，由 taskRegistry 注册并由调度器执行

import type { ProactiveTask } from '../taskRegistry.js'
import { getDiskInfo, getMemoryInfo, checkNetwork, IS_WIN } from '../platform.js'
import { platform as osPlatform } from 'os'
import { getProactiveConfig, isScenarioEnabled } from '../proactiveConfig.js'
import { pushNotification } from '../../assistant/sense.js'
// P2-T7: panda-on-desk 联动桥接（feature('BUDDY') 内 gate；on-desk 离线静默）
import {
  pushNotification as pushDeskNotification,
  bumpBadge as bumpDeskBadge,
  isOnDeskEnabled as isDeskOnDeskEnabled,
} from '../../desk/bridge.js'
import { logForDebugging } from '../../utils/debug.js'

interface SmartCronTask extends ProactiveTask {
  priority: 'critical' | 'normal' | 'low'
  skipIf?: () => boolean
}

// ─── A1 磁盘空间告警 ───

const diskSpaceAlert: SmartCronTask = {
  id: 'disk-space-alert',
  description: '磁盘空间告警 · Disk space alert',
  cron: '*/15 * * * *',
  priority: 'critical',
  enabled: true,
  condition: () => isScenarioEnabled('disk-space-alert'),
  action: async () => {
    try {
      const config = getProactiveConfig()
      const mount = IS_WIN ? 'C:' : '/'
      const info = getDiskInfo(mount)
      if (!info) {
        logForDebugging('[systemHealth] disk-space-alert: 无法获取磁盘信息')
        return
      }

      const freePercent = 100 - info.usedPercent
      const freeGB = info.free / (1024 * 1024 * 1024)

      if (freePercent < config.diskFreePercent || freeGB < config.diskFreeGB) {
        pushNotification({
          type: 'warning',
          title: '⚠️ 磁盘空间不足',
          body: `${mount} 剩余 ${freeGB.toFixed(1)}GB（${freePercent}%），建议清理空间`,
          channel: 'system',
        })
        // why: P2-T7 panda-on-desk 联动 — 磁盘告警，system 横幅 + 状态栏角标累加
        try {
          if (isDeskOnDeskEnabled()) {
            pushDeskNotification({
              kind: 'system',
              level: 'warning',
              scenarioId: 'disk-low',
              title: 'Panda · 磁盘空间不足',
              body: `${mount} 剩余 ${freeGB.toFixed(1)}GB（${freePercent}%）`,
            })
            bumpDeskBadge('disk-low', 1)
          }
        } catch {
          // 桥接失败不阻塞 proactive 主路径
        }
        logForDebugging(`[systemHealth] disk-space-alert: 告警触发 — ${mount} 剩余 ${freeGB.toFixed(1)}GB (${freePercent}%)`)
      }
    } catch (e) {
      logForDebugging(`[systemHealth] disk-space-alert failed: ${(e as Error).message}`)
    }
  },
}

// ─── A2 内存压力告警 ───

function getTopMemoryProcesses(count: number = 3): string[] {
  try {
    const { execSync } = require('child_process')
    if (IS_WIN) {
      const out = execSync(
        'powershell -c "Get-Process | Sort-Object WorkingSet64 -Descending | Select-Object -First ' + count + ' Name,@{N=\'MB\';E={[math]::Round($_.WorkingSet64/1MB)}} | Format-Table -AutoSize"',
        { encoding: 'utf-8', timeout: 5000 },
      )
      return out.trim().split('\n').filter(Boolean).slice(2) // 跳过表头
    }
    // macOS / Linux
    const isMac = osPlatform() === 'darwin'
    const cmd = isMac
      ? `ps aux -m | head -${count + 1}`
      : `ps aux --sort=-%mem | head -${count + 1}`
    const out = execSync(cmd, {
      encoding: 'utf-8',
      timeout: 5000,
    })
    const lines = out.trim().split('\n').slice(1) // 跳过表头
    return lines.map(line => {
      const parts = line.trim().split(/\s+/)
      const mem = parts[3] || '?'
      const cmd = parts.slice(10).join(' ').slice(0, 30)
      return `${cmd} (${mem}%)`
    })
  } catch {
    return []
  }
}

const memoryPressureAlert: SmartCronTask = {
  id: 'memory-pressure-alert',
  description: '内存压力告警 · Memory pressure alert',
  cron: '*/5 * * * *',
  priority: 'critical',
  enabled: true,
  condition: () => isScenarioEnabled('memory-pressure-alert'),
  action: async () => {
    try {
      const config = getProactiveConfig()
      const info = getMemoryInfo()

      if (info.usedPercent > config.memoryUsedPercent) {
        const topProcesses = getTopMemoryProcesses(3)
        const processInfo = topProcesses.length > 0
          ? `\n占用最高：${topProcesses.join('、')}`
          : ''

        pushNotification({
          type: 'warning',
          title: '⚠️ 内存压力过高',
          body: `内存使用 ${info.usedPercent}%（阈值 ${config.memoryUsedPercent}%）${processInfo}`,
          channel: 'system',
        })
        // why: P2-T7 panda-on-desk 联动 — 内存压力告警 system 横幅 + 角标
        try {
          if (isDeskOnDeskEnabled()) {
            pushDeskNotification({
              kind: 'system',
              level: 'warning',
              scenarioId: 'memory-pressure',
              title: 'Panda · 内存压力过高',
              body: `使用 ${info.usedPercent}%（阈值 ${config.memoryUsedPercent}%）`,
            })
            bumpDeskBadge('memory-pressure', 1)
          }
        } catch {
          // 桥接失败不阻塞主路径
        }
        logForDebugging(`[systemHealth] memory-pressure-alert: 告警触发 — 使用 ${info.usedPercent}%`)
      }
    } catch (e) {
      logForDebugging(`[systemHealth] memory-pressure-alert failed: ${(e as Error).message}`)
    }
  },
}

// ─── A5 网络连接异常 ───

const networkAnomaly: SmartCronTask = {
  id: 'network-anomaly',
  description: '网络连接异常 · Network anomaly detection',
  cron: '*/3 * * * *',
  priority: 'normal',
  enabled: true,
  condition: () => isScenarioEnabled('network-anomaly'),
  action: async () => {
    try {
      const config = getProactiveConfig()
      const status = checkNetwork()

      if (!status.connected) {
        pushNotification({
          type: 'warning',
          title: '🌐 网络断开',
          body: '无法连接到外部网络，请检查网络连接',
          channel: 'system',
        })
        // why: P2-T7 panda-on-desk 联动 — 网络断开 system 横幅 + 角标
        try {
          if (isDeskOnDeskEnabled()) {
            pushDeskNotification({
              kind: 'system',
              level: 'warning',
              scenarioId: 'network-anomaly',
              title: 'Panda · 网络断开',
              body: '无法连接到外部网络',
            })
            bumpDeskBadge('network-anomaly', 1)
          }
        } catch {
          // 桥接失败不阻塞主路径
        }
        logForDebugging('[systemHealth] network-anomaly: 网络断开')
        return
      }

      const issues: string[] = []
      if (status.packetLoss > config.networkLossPercent) {
        issues.push(`丢包 ${status.packetLoss}%`)
      }
      if (status.latencyMs > config.networkLatencyMs) {
        issues.push(`延迟 ${Math.round(status.latencyMs)}ms`)
      }

      if (issues.length > 0) {
        pushNotification({
          type: 'warning',
          title: '🌐 网络异常',
          body: `检测到网络问题：${issues.join('、')}`,
          channel: 'system',
        })
        // why: P2-T7 panda-on-desk 联动 — 网络指标异常 system 横幅 + 角标
        try {
          if (isDeskOnDeskEnabled()) {
            pushDeskNotification({
              kind: 'system',
              level: 'warning',
              scenarioId: 'network-anomaly',
              title: 'Panda · 网络异常',
              body: issues.join('、'),
            })
            bumpDeskBadge('network-anomaly', 1)
          }
        } catch {
          // 桥接失败不阻塞主路径
        }
        logForDebugging(`[systemHealth] network-anomaly: 告警触发 — ${issues.join(', ')}`)
      }
    } catch (e) {
      logForDebugging(`[systemHealth] network-anomaly failed: ${(e as Error).message}`)
    }
  },
}

// ─── 导出 ───

export function getSystemHealthTasks(): SmartCronTask[] {
  return [diskSpaceAlert, memoryPressureAlert, networkAnomaly]
}
