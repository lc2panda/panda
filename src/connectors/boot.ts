// Input: 6 个内置 IM connector factory 模块
// Output: 一次性注册到 ConnectorRegistry，幂等可重入
// Pos: connectors/ 启动钩子，由 proactive/index.ts activateProactive() 调用

import { getConnectorRegistry } from './registry.js'
import { feishuConnectorFactory } from './feishu/index.js'
import { dingtalkConnectorFactory } from './dingtalk/index.js'
import { slackConnectorFactory } from './slack/index.js'
import { telegramConnectorFactory } from './telegram/index.js'
import { teamsConnectorFactory } from './teams/index.js'
import { wechatConnectorFactory } from './wechat/index.js'
import { purgeExpiredConnectorAggregates } from './aggregator.js'
import { logForDebugging } from 'src/utils/debug.js'

// why: 全局单例 flag，避免 proactive 重复激活时重复注册导致日志噪声
let _booted = false

/**
 * 注册所有内置 IM connector factory 到 registry。
 * 幂等：多次调用仅生效首次。
 */
export function bootConnectors(): void {
  // why: 幂等保护，proactive 模块重复 activate 时直接 no-op 返回
  if (_booted) return
  _booted = true

  const registry = getConnectorRegistry()
  // why: 6 个 factory 全部内置注册，与 README §3.6 / §1.4 平台清单一一对应
  registry.registerFactory(feishuConnectorFactory)
  registry.registerFactory(dingtalkConnectorFactory)
  registry.registerFactory(slackConnectorFactory)
  registry.registerFactory(telegramConnectorFactory)
  registry.registerFactory(teamsConnectorFactory)
  registry.registerFactory(wechatConnectorFactory)

  logForDebugging('[connectors/boot] 6 内置 factory 已注册（feishu/dingtalk/slack/telegram/teams/wechat）')

  // P-004：启动时按 dataRetentionDays 清理 connector 聚合缓存（不碰主会话 transcript）
  try {
    const purge = purgeExpiredConnectorAggregates()
    if (purge.cleared) {
      logForDebugging(
        `[connectors/boot] connector 聚合缓存已按保留期清理 cutoffMs=${purge.cutoffMs ?? 'n/a'}`,
      )
    }
  } catch (e) {
    logForDebugging(
      `[connectors/boot] 保留期清理失败（忽略，聚合路径仍会过滤）: ${(e as Error).message}`,
      { level: 'error' },
    )
  }
}

/**
 * 仅供测试使用：重置 booted flag，让下次 boot 重新执行。
 */
export function _resetBootForTests(): void {
  _booted = false
}
