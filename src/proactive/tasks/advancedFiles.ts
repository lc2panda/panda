// Input: 文件/数据状态检查请求（桌面/大文件/回收站/日历/端口）
// Output: 5 个 SmartCronTask，触发时推送通知或记录到工作记忆
// Pos: proactive/tasks/ 高级文件场景层，由 taskRegistry 注册并由调度器执行

import { execSync } from 'child_process'
import { pushNotification } from '../../assistant/sense.js'
// P3-T4-α: panda-on-desk 联动桥接（feature('BUDDY') 内 gate；on-desk 离线静默）
import {
  pushNotification as pushDeskNotification,
  bumpBadge as bumpDeskBadge,
  enableDragTarget as enableDeskDragTarget,
  isOnDeskEnabled as isDeskOnDeskEnabled,
} from '../../desk/bridge.js'
import { logForDebugging } from '../../utils/debug.js'
import { getProactiveConfig, isScenarioEnabled } from '../proactiveConfig.js'
import { getDirStats, DESKTOP, HOME, IS_MAC, IS_WIN } from '../platform.js'

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

// ─── C2 桌面文件过多 ───

const desktopClutter: SmartCronTask = {
  id: 'desktop-clutter',
  description: '桌面文件过多检测 · Desktop clutter detection',
  cron: '0 */4 * * *',
  priority: 'low',
  enabled: true,
  condition: () => isScenarioEnabled('desktop-clutter'),
  action: async () => {
    try {
      const config = getProactiveConfig()
      const maxFiles = config.desktopFileCount || 30

      const stats = getDirStats(DESKTOP)
      if (!stats) {
        logForDebugging('[advancedFiles] desktop-clutter: 无法获取桌面目录信息')
        return
      }

      if (stats.fileCount > maxFiles) {
        let oldestInfo = ''
        if (stats.oldestFile) {
          oldestInfo = `\n最旧文件：${stats.oldestFile}（${stats.oldestAge} 天前）`
        }

        pushNotification({
          type: 'info',
          title: '🖥️ 桌面文件过多',
          body: `桌面有 ${stats.fileCount} 个文件（阈值 ${maxFiles}）${oldestInfo}\n建议整理桌面文件。`,
          channel: 'system',
        })
        // why: P3-T4-α panda-on-desk 联动 — 桌面堆积 badge + drag-target（拖文件到 panda 触发清理，A3 §2 表 F+D）
        try {
          if (isDeskOnDeskEnabled()) {
            bumpDeskBadge('desktop-clutter', 1)
            enableDeskDragTarget('desktop-clutter', ['file'])
          }
        } catch {
          // 桥接失败不阻塞主路径
        }
        logForDebugging(`[advancedFiles] desktop-clutter: 告警触发 — ${stats.fileCount} 个文件`)
      }
    } catch (e) {
      logForDebugging(`[advancedFiles] desktop-clutter failed: ${(e as Error).message}`)
    }
  },
}

// ─── C3 大文件发现 ───

const largeFileDiscovery: SmartCronTask = {
  id: 'large-file-discovery',
  description: '大文件发现 · Large file discovery (>1GB)',
  cron: '0 12 * * *',
  priority: 'low',
  enabled: true,
  condition: () => isScenarioEnabled('large-file-discovery'),
  action: async () => {
    try {
      let out = ''

      if (IS_MAC) {
        // macOS: Spotlight 快速索引
        try {
          out = execSync(`mdfind 'kMDItemFSSize > 1073741824' -onlyin ${HOME} 2>/dev/null | head -10`, {
            encoding: 'utf-8',
            timeout: 30000,
          })
        } catch {
          // fallback to find
          try {
            out = execSync(`find ${HOME} -size +1G -type f 2>/dev/null | head -10`, {
              encoding: 'utf-8',
              timeout: 60000,
            })
          } catch {}
        }
      } else if (IS_WIN) {
        try {
          out = execSync(
            `powershell -c "Get-ChildItem -Path $env:USERPROFILE -Recurse -File -ErrorAction SilentlyContinue | Where-Object {$_.Length -gt 1GB} | Select-Object -First 10 -ExpandProperty FullName"`,
            { encoding: 'utf-8', timeout: 60000 },
          )
        } catch {}
      } else {
        // Linux fallback
        try {
          out = execSync(`find ${HOME} -size +1G -type f 2>/dev/null | head -10`, {
            encoding: 'utf-8',
            timeout: 60000,
          })
        } catch {}
      }

      const files = out.trim().split('\n').filter(Boolean)
      if (files.length > 0) {
        const list = files.slice(0, 5).map(f => `  ${f}`).join('\n')
        pushNotification({
          type: 'info',
          title: '💾 发现大文件（>1GB）',
          body: `发现 ${files.length} 个超过 1GB 的文件：\n${list}${files.length > 5 ? `\n  ...及其他 ${files.length - 5} 个` : ''}`,
          channel: 'system',
        })
        // why: P3-T4-α panda-on-desk 联动 — 大文件发现仅 badge（低频低优先，A3 §2 表 F+D）
        try {
          if (isDeskOnDeskEnabled()) {
            bumpDeskBadge('large-files', files.length)
          }
        } catch {
          // 桥接失败不阻塞主路径
        }
        logForDebugging(`[advancedFiles] large-file-discovery: 发现 ${files.length} 个大文件`)
      }
    } catch (e) {
      logForDebugging(`[advancedFiles] large-file-discovery failed: ${(e as Error).message}`)
    }
  },
}

// ─── C8 回收站膨胀 ───

function getTrashSizeKB(): number | null {
  try {
    if (IS_MAC) {
      const out = execSync('du -sk ~/.Trash 2>/dev/null', { encoding: 'utf-8', timeout: 15000 })
      return parseInt(out.trim().split(/\s+/)[0], 10)
    }
    if (IS_WIN) {
      const out = execSync(
        'powershell -c "(New-Object -ComObject Shell.Application).NameSpace(10).Items() | ForEach-Object { $_.Size } | Measure-Object -Sum | Select-Object -ExpandProperty Sum"',
        { encoding: 'utf-8', timeout: 15000 },
      )
      const bytes = parseInt(out.trim(), 10)
      return isNaN(bytes) ? null : Math.round(bytes / 1024)
    }
    // Linux
    const out = execSync('du -sk ~/.local/share/Trash 2>/dev/null', { encoding: 'utf-8', timeout: 15000 })
    return parseInt(out.trim().split(/\s+/)[0], 10)
  } catch {
    return null
  }
}

const trashBloat: SmartCronTask = {
  id: 'trash-bloat',
  description: '回收站膨胀检测 · Trash bloat detection',
  cron: '0 */12 * * *',
  priority: 'low',
  enabled: true,
  condition: () => isScenarioEnabled('trash-bloat'),
  action: async () => {
    try {
      const config = getProactiveConfig()
      const maxGB = config.trashMaxGB || 5
      const maxKB = maxGB * 1024 * 1024

      const sizeKB = getTrashSizeKB()
      if (sizeKB === null) {
        logForDebugging('[advancedFiles] trash-bloat: 无法获取回收站大小')
        return
      }

      if (sizeKB > maxKB) {
        const gb = (sizeKB / 1048576).toFixed(1)
        pushNotification({
          type: 'info',
          title: '🗑️ 回收站膨胀',
          body: `回收站占用 ${gb}GB（阈值 ${maxGB}GB），建议清空回收站释放空间。`,
          channel: 'system',
        })
        // why: P3-T4-α panda-on-desk 联动 — 回收站膨胀仅 badge（A3 §2 表 F+D）
        try {
          if (isDeskOnDeskEnabled()) {
            bumpDeskBadge('trash-bloat', 1)
          }
        } catch {
          // 桥接失败不阻塞主路径
        }
        logForDebugging(`[advancedFiles] trash-bloat: 告警触发 — ${gb}GB`)
      }
    } catch (e) {
      logForDebugging(`[advancedFiles] trash-bloat failed: ${(e as Error).message}`)
    }
  },
}

// ─── B5 日历冲突检测 ───

const calendarConflict: SmartCronTask = {
  id: 'calendar-conflict',
  description: '日历冲突检测 · Calendar conflict detection',
  cron: '0 20 * * *',
  priority: 'normal',
  enabled: true,
  condition: () => isScenarioEnabled('calendar-conflict'),
  action: async () => {
    try {
      const { readCalendarEvents } = await import('../../memdir/memdir.js')
      const events = await readCalendarEvents(2)

      if (!events || events.length < 2) {
        logForDebugging('[advancedFiles] calendar-conflict: 未来 2 天事件不足 2 个')
        return
      }

      // 按开始时间排序，检测同一小时内的冲突
      const sorted = [...events].sort((a, b) => {
        const ta = new Date(a.startDate).getTime()
        const tb = new Date(b.startDate).getTime()
        return ta - tb
      })

      const conflicts: Array<{ a: typeof sorted[0]; b: typeof sorted[0] }> = []
      for (let i = 0; i < sorted.length - 1; i++) {
        const curStart = new Date(sorted[i].startDate).getTime()
        const nextStart = new Date(sorted[i + 1].startDate).getTime()
        // 同一小时内（间隔 < 60 分钟）
        if (Math.abs(nextStart - curStart) < 3600000) {
          conflicts.push({ a: sorted[i], b: sorted[i + 1] })
        }
      }

      if (conflicts.length > 0) {
        const detail = conflicts.slice(0, 3).map(c => {
          const nameA = c.a.title || '未命名'
          const nameB = c.b.title || '未命名'
          const timeA = new Date(c.a.startDate).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
          return `  ${timeA}: "${nameA}" 与 "${nameB}"`
        }).join('\n')

        pushNotification({
          type: 'warning',
          title: '📅 日历冲突',
          body: `未来 2 天有 ${conflicts.length} 个时间冲突：\n${detail}`,
          channel: 'system',
        })
        // why: P3-T4-α panda-on-desk 联动 — 日历冲突 system 横幅 + badge（warning 级，时间敏感）
        try {
          if (isDeskOnDeskEnabled()) {
            pushDeskNotification({
              kind: 'system',
              level: 'warning',
              scenarioId: 'calendar-conflict',
              title: 'Panda · 日历冲突',
              body: `未来 2 天 ${conflicts.length} 个冲突`,
              soundCue: 'short',
              petStateOverride: 'attention',
            })
            bumpDeskBadge('calendar-conflict', conflicts.length)
          }
        } catch {
          // 桥接失败不阻塞主路径
        }
        logForDebugging(`[advancedFiles] calendar-conflict: 发现 ${conflicts.length} 个冲突`)
      }
    } catch (e) {
      logForDebugging(`[advancedFiles] calendar-conflict failed: ${(e as Error).message}`)
    }
  },
}

// ─── D8 Port 占用异常 ───

// 首次发现的端口记录，避免频繁打扰
const _knownOccupiedPorts = new Set<number>()

const WATCHED_PORTS = [3000, 3001, 5173, 8080, 8000, 5432, 6379, 27017]

function getOccupiedPorts(ports: number[]): Array<{ port: number; process: string }> {
  const occupied: Array<{ port: number; process: string }> = []

  for (const port of ports) {
    try {
      let out = ''
      if (IS_WIN) {
        out = execSync(`netstat -ano | findstr :${port}`, {
          encoding: 'utf-8',
          timeout: 5000,
        })
      } else {
        out = execSync(`lsof -i :${port} -P -n 2>/dev/null | grep LISTEN`, {
          encoding: 'utf-8',
          timeout: 5000,
        })
      }

      if (out.trim()) {
        const firstLine = out.trim().split('\n')[0]
        const processName = IS_WIN
          ? firstLine.trim().split(/\s+/).pop() || 'unknown'
          : firstLine.trim().split(/\s+/)[0] || 'unknown'
        occupied.push({ port, process: processName })
      }
    } catch {
      // 未占用，正常
    }
  }

  return occupied
}

const portConflict: SmartCronTask = {
  id: 'port-conflict',
  description: '端口占用异常检测 · Port conflict detection',
  cron: '*/10 * * * *',
  priority: 'low',
  enabled: true,
  condition: () => isScenarioEnabled('port-conflict'),
  action: async () => {
    try {
      const occupied = getOccupiedPorts(WATCHED_PORTS)

      if (occupied.length === 0) {
        logForDebugging('[advancedFiles] port-conflict: 无端口占用')
        return
      }

      // 仅对首次发现的端口推送通知
      const newPorts = occupied.filter(o => !_knownOccupiedPorts.has(o.port))

      // 记录所有当前占用
      for (const o of occupied) {
        _knownOccupiedPorts.add(o.port)
      }

      // 清理已释放的端口
      for (const known of _knownOccupiedPorts) {
        if (!occupied.find(o => o.port === known)) {
          _knownOccupiedPorts.delete(known)
        }
      }

      if (newPorts.length > 0) {
        const list = newPorts.map(o => `  :${o.port} ← ${o.process}`).join('\n')
        pushNotification({
          type: 'info',
          title: '🔌 端口被占用',
          body: `发现常用端口被占用：\n${list}`,
          channel: 'system',
        })
        // why: P3-T4-α panda-on-desk 联动 — 端口占用仅 badge（开发场景，低优先不打扰）
        try {
          if (isDeskOnDeskEnabled()) {
            bumpDeskBadge('port-conflict', newPorts.length)
          }
        } catch {
          // 桥接失败不阻塞主路径
        }
        logForDebugging(`[advancedFiles] port-conflict: 首次发现 ${newPorts.length} 个端口占用`)
      } else {
        logForDebugging(`[advancedFiles] port-conflict: ${occupied.length} 个端口已知占用，无新增`)
      }
    } catch (e) {
      logForDebugging(`[advancedFiles] port-conflict failed: ${(e as Error).message}`)
    }
  },
}

// ─── 导出 ───

export function getAdvancedFileTasks(): SmartCronTask[] {
  return [desktopClutter, largeFileDiscovery, trashBloat, calendarConflict, portConflict]
}
