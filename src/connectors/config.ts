// Input: ~/.pandacc/config/connectors.json
// Output: 合并后的 Connector 配置，支持 mtime 缓存 + Keychain 引用解析
// Pos: connectors/ 配置层，与 proactiveConfig.ts 同级

import { readFileSync, statSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import { execSync } from 'child_process'
import { platform as osPlatform } from 'os'
import { logForDebugging } from 'src/utils/debug.js'
import type { ConnectorConfig, ConnectorPlatform } from './types.js'

export interface ConnectorsGlobalConfig {
  version: string
  [platform: string]: ConnectorConfig | string | any
  aggregator?: {
    deduplication: boolean
    deduplicationWindowMs: number
    cacheGlobalTtlSeconds: number
    maxMessagesPerQuery: number
    privacy: {
      filterPatterns: string[]
      excludeChannels: string[]
      excludeSenders: string[]
    }
  }
}

const CONFIG_PATH = join(homedir(), '.pandacc', 'config', 'connectors.json')

// mtime 缓存：避免频繁读取文件
let _cached: ConnectorsGlobalConfig | null = null
let _cachedMtime: number = 0

function getFileMtime(): number {
  try {
    return statSync(CONFIG_PATH).mtimeMs
  } catch (e) {
    logForDebugging(`[connectors/config] 读取配置文件 mtime 失败 (${CONFIG_PATH}): ${(e as Error).message}`)
    return 0
  }
}

/**
 * 加载全局 connectors 配置。
 * 使用文件 mtime 缓存，仅文件变更时重新读取。
 */
export function loadConnectorsConfig(): Record<string, ConnectorConfig> {
  const config = getConnectorsConfig()
  const result: Record<string, ConnectorConfig> = {}
  for (const [key, value] of Object.entries(config)) {
    if (key === 'version' || key === '$schema' || key === 'aggregator') continue
    if (typeof value === 'object' && value !== null && 'enabled' in value) {
      result[key] = value as ConnectorConfig
    }
  }
  return result
}

export function getConnectorsConfig(): ConnectorsGlobalConfig {
  const mtime = getFileMtime()

  // mtime 为 0 表示文件不存在
  if (mtime === 0) {
    _cached = { version: '1.0.0' }
    _cachedMtime = 0
    return _cached
  }

  // 文件未变更，返回缓存
  if (_cached && mtime === _cachedMtime) {
    return _cached
  }

  try {
    _cached = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'))
    _cachedMtime = mtime
  } catch (e) {
    logForDebugging(`[connectors/config] 解析失败: ${(e as Error).message}`)
    _cached = { version: '1.0.0' }
    _cachedMtime = mtime
  }
  return _cached!
}

/**
 * 判断指定平台 Connector 是否启用。
 */
export function isConnectorEnabled(platform: string): boolean {
  const config = getConnectorConfig(platform)
  return config?.enabled === true
}

/**
 * 获取指定平台的配置，不存在时返回 null。
 */
export function getConnectorConfig(platform: ConnectorPlatform): ConnectorConfig | null {
  const config = getConnectorsConfig()
  const platformConfig = config[platform]
  if (!platformConfig || typeof platformConfig !== 'object') return null
  if (!('enabled' in platformConfig)) return null
  return platformConfig as ConnectorConfig
}

/**
 * 解析 Keychain 引用。
 * 格式："keychain:pandacc/feishu/app_secret" -> 从系统密钥链读取
 */
export async function resolveSecret(value: string): Promise<string> {
  if (!value.startsWith('keychain:')) return value

  const key = value.slice('keychain:'.length)

  // SECURITY: Strict key validation to prevent shell/command injection
  if (!/^[\w.\-/]+$/.test(key)) {
    logForDebugging(`[connectors/config] Keychain key 包含非法字符，已拒绝: ${key}`)
    return ''
  }

  try {
    const plat = osPlatform()

    if (plat === 'darwin') {
      return execSync(
        `security find-generic-password -s "${key}" -w 2>/dev/null`,
        { encoding: 'utf-8', timeout: 5000 },
      ).trim()
    }

    if (plat === 'win32') {
      return execSync(
        `powershell -c "(Get-StoredCredential -Target '${key}').GetNetworkCredential().Password"`,
        { encoding: 'utf-8', timeout: 5000 },
      ).trim()
    }

    // Linux: secret-tool
    const parts = key.split('/')
    return execSync(
      `secret-tool lookup service ${parts[0]} account ${parts.slice(1).join('/')}`,
      { encoding: 'utf-8', timeout: 5000 },
    ).trim()
  } catch {
    logForDebugging(`[connectors/config] Keychain 读取失败: ${key}`)
    return ''
  }
}
