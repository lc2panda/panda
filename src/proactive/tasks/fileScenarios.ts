// Input: 定时触发的文件场景检查请求
// Output: 下载目录堆积等文件管理主动推送通知
// Pos: proactive/tasks/ 文件场景层，由 taskRegistry 注册调度

import { pushNotification } from '../../assistant/sense.js'
import { getDirStats, DOWNLOADS } from '../platform.js'
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

// ─── C1: 下载目录堆积 ───

const downloadsClutter: SmartCronTask = {
  id: 'downloads-clutter',
  description: '下载目录堆积检测 · Downloads clutter detection',
  cron: '0 */4 * * *',
  priority: 'low',
  enabled: true,
  condition: () => isScenarioEnabled('downloads-clutter'),
  action: async () => {
    logForDebugging('[fileScenarios] downloads-clutter: scanning Downloads directory')
    try {
      const config = getProactiveConfig()
      const maxFiles = config.downloadsFileCount || 50
      const maxGB = config.downloadsMaxGB || 5
      const maxBytes = maxGB * 1024 * 1024 * 1024

      const stats = getDirStats(DOWNLOADS)
      if (!stats) {
        logForDebugging('[fileScenarios] downloads-clutter: 无法获取目录信息')
        return
      }

      const overFileCount = stats.fileCount > maxFiles
      const overSize = stats.totalSize > maxBytes

      if (!overFileCount && !overSize) {
        logForDebugging(`[fileScenarios] downloads-clutter: 正常（${stats.fileCount} 文件, ${(stats.totalSize / 1073741824).toFixed(1)}GB）`)
        return
      }

      const sizeGB = (stats.totalSize / 1073741824).toFixed(1)
      const parts: string[] = []
      if (overFileCount) parts.push(`${stats.fileCount} 个文件（阈值 ${maxFiles}）`)
      if (overSize) parts.push(`${sizeGB}GB（阈值 ${maxGB}GB）`)

      let oldestInfo = ''
      if (stats.oldestFile) {
        oldestInfo = `\n最旧文件：${stats.oldestFile}（${stats.oldestAge} 天前）`
      }

      pushNotification({
        type: 'info',
        title: '📂 下载目录堆积',
        body: `Downloads 目录：${parts.join('，')}${oldestInfo}\n建议清理不再需要的文件。`,
        channel: 'system',
      })

      logForDebugging(`[fileScenarios] downloads-clutter: files=${stats.fileCount} size=${sizeGB}GB oldest=${stats.oldestFile}`)
    } catch (e) {
      logForDebugging(`[fileScenarios] downloads-clutter failed: ${(e as Error).message}`)
    }
  },
}

// ─── 导出 ───

export function getFileTasks(): SmartCronTask[] {
  return [downloadsClutter]
}
