// Input: ~/.pandacc/config/privacy.json 隐私排除规则
// Output: 路径/应用/域名排除判定 + 敏感内容检测 + 保留期 cutoff + 严格加载结果
// Pos: 隐私守护中枢，所有数据采集场景（memdir + connectors）必须先过此模块

/**
 * 隐私配置 — 从 ~/.pandacc/config/privacy.json 加载排除规则
 *
 * 默认排除：
 * - 路径: ~/.ssh, ~/.gnupg, ~/.aws, node_modules, .env 等
 * - 应用: 1Password, Keychain Access
 * - 域名: *.bank.*, *.gov
 * - 敏感模式: password, secret, api_key, token
 *
 * dataRetentionDays 语义：
 * - 默认 90：丢弃/不进入时间线超过 90 天的 connector 聚合消息
 * - 0：不启用保留期清理（无限保留，仅限 connector 聚合范围）
 * - 未配置/非法：回落默认 90
 *
 * 加载语义：
 * - loadPrivacyConfig()：兼容 memdir；文件缺失用默认；损坏时 fail-open 到默认
 * - loadPrivacyConfigResult()：供 connectors 使用；文件损坏 → error（调用方 fail-closed）
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import { logForDebugging } from '../utils/debug.js'

// ─── 类型 ───

export interface PrivacyConfig {
  excludePaths: string[]
  excludeApps: string[]
  excludeBrowserDomains: string[]
  sensitivePatterns: string[]
  dataRetentionDays: number
  localLLMForSensitive: boolean
}

export type PrivacyLoadResult =
  | { status: 'ok'; config: PrivacyConfig; source: 'file' | 'default' }
  | { status: 'error'; error: string }

// ─── 默认配置 ───

export const DEFAULT_PRIVACY_CONFIG: PrivacyConfig = {
  excludePaths: [
    '~/.ssh/**',
    '~/.gnupg/**',
    '~/.aws/**',
    '**/node_modules/**',
    '**/.env',
    '**/.env.*',
    '**/credentials*',
    '**/secrets*',
  ],
  excludeApps: [
    '1Password',
    'Keychain Access',
    'Bitwarden',
    'LastPass',
    'Keeper',
  ],
  excludeBrowserDomains: [
    '*.bank.*',
    '*.gov',
    'paypal.com',
    'chase.com',
    'wellsfargo.com',
  ],
  sensitivePatterns: [
    'password',
    'secret',
    'api[._-]?key',
    'token',
    'credential',
    'private[._-]?key',
    'sk-[a-zA-Z0-9]+',
  ],
  dataRetentionDays: 90,
  localLLMForSensitive: true,
}

// 兼容旧引用名
const DEFAULT_CONFIG = DEFAULT_PRIVACY_CONFIG

// ─── 配置加载 ───

const PRIVACY_CONFIG_PATH = join(homedir(), '.pandacc', 'config', 'privacy.json')

let _cachedConfig: PrivacyConfig | null = null
let _cacheTime = 0
let _cachedSource: 'file' | 'default' = 'default'
const CACHE_TTL = 60_000 // 1 分钟缓存

function normalizePrivacyConfig(raw: Record<string, unknown>): PrivacyConfig {
  const retentionRaw = raw.dataRetentionDays
  let dataRetentionDays = DEFAULT_CONFIG.dataRetentionDays
  if (typeof retentionRaw === 'number' && Number.isFinite(retentionRaw) && retentionRaw >= 0) {
    dataRetentionDays = Math.floor(retentionRaw)
  }

  return {
    excludePaths: Array.isArray(raw.excludePaths)
      ? (raw.excludePaths as string[])
      : DEFAULT_CONFIG.excludePaths,
    excludeApps: Array.isArray(raw.excludeApps)
      ? (raw.excludeApps as string[])
      : DEFAULT_CONFIG.excludeApps,
    excludeBrowserDomains: Array.isArray(raw.excludeBrowserDomains)
      ? (raw.excludeBrowserDomains as string[])
      : DEFAULT_CONFIG.excludeBrowserDomains,
    sensitivePatterns: Array.isArray(raw.sensitivePatterns)
      ? (raw.sensitivePatterns as string[])
      : DEFAULT_CONFIG.sensitivePatterns,
    dataRetentionDays,
    localLLMForSensitive:
      typeof raw.localLLMForSensitive === 'boolean'
        ? raw.localLLMForSensitive
        : DEFAULT_CONFIG.localLLMForSensitive,
  }
}

/**
 * 严格加载：文件损坏返回 error，供 connectors fail-closed。
 * 文件缺失 → ok + default（与"未配置则用默认排除"一致，非 fail-open 放宽）。
 */
export function loadPrivacyConfigResult(): PrivacyLoadResult {
  const now = Date.now()
  if (_cachedConfig && now - _cacheTime < CACHE_TTL) {
    return { status: 'ok', config: _cachedConfig, source: _cachedSource }
  }

  try {
    if (!existsSync(PRIVACY_CONFIG_PATH)) {
      _cachedConfig = { ...DEFAULT_CONFIG }
      _cachedSource = 'default'
      _cacheTime = now
      return { status: 'ok', config: _cachedConfig, source: 'default' }
    }

    const parsed = JSON.parse(readFileSync(PRIVACY_CONFIG_PATH, 'utf-8')) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { status: 'error', error: 'privacy.json 根节点必须是对象' }
    }

    _cachedConfig = normalizePrivacyConfig(parsed as Record<string, unknown>)
    _cachedSource = 'file'
    _cacheTime = now
    return { status: 'ok', config: _cachedConfig, source: 'file' }
  } catch (e) {
    const msg = (e as Error).message
    logForDebugging(`[privacy] 加载配置失败: ${msg}`)
    return { status: 'error', error: msg }
  }
}

/**
 * 兼容加载（memdir 等既有调用方）：
 * - 成功/缺失 → 配置或默认
 * - 损坏 → 回落默认（历史 fail-open；connectors 请用 loadPrivacyConfigResult）
 */
export function loadPrivacyConfig(): PrivacyConfig {
  const result = loadPrivacyConfigResult()
  if (result.status === 'ok') return result.config
  logForDebugging(`[privacy] loadPrivacyConfig 回落默认: ${result.error}`)
  return { ...DEFAULT_CONFIG }
}

// ─── 排除判定 ───

/**
 * 检查路径是否在排除列表中。
 * 支持简单 glob: ** 匹配任意路径段, * 匹配单段内任意字符。
 */
export function isPathExcluded(filePath: string, config?: PrivacyConfig): boolean {
  const cfg = config ?? loadPrivacyConfig()
  const expanded = filePath.replace(/^~/, homedir())

  return cfg.excludePaths.some(pattern => {
    const expandedPattern = pattern.replace(/^~/, homedir())
    // 简单 glob → 正则
    const regexStr = expandedPattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&') // 转义正则特殊字符（保留 * ）
      .replace(/\*\*/g, '<<<DOUBLESTAR>>>')
      .replace(/\*/g, '[^/]*')
      .replace(/<<<DOUBLESTAR>>>/g, '.*')
    try {
      return new RegExp(`^${regexStr}$`).test(expanded)
    } catch {
      return expanded.includes(expandedPattern.replace(/\*/g, ''))
    }
  })
}

/**
 * 域名是否匹配单条排除 pattern（支持 *.gov / *.bank.* / exact）。
 */
export function domainMatchesPattern(domain: string, pattern: string): boolean {
  const lower = domain.toLowerCase().replace(/\.$/, '')
  const p = pattern.toLowerCase().replace(/^\./, '')
  if (!p) return false

  // 精确或后缀
  if (!p.includes('*')) {
    return lower === p || lower.endsWith('.' + p)
  }

  // glob → 正则：先转义正则元字符（不含 *），再把 * → .*
  try {
    const re = new RegExp(
      '^' + p.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$',
      'i',
    )
    if (re.test(lower)) return true
    // 兼容 "*.gov" 匹配 "a.b.gov"
    if (p.startsWith('*.') && !p.slice(2).includes('*')) {
      const suffix = p.slice(1) // .gov
      return lower.endsWith(suffix) || lower === p.slice(2)
    }
    return false
  } catch {
    return lower === p
  }
}

/**
 * 检查域名是否在排除列表中。
 * 支持 *.example.com / *.bank.* 通配。
 */
export function isDomainExcluded(domain: string, config?: PrivacyConfig): boolean {
  const cfg = config ?? loadPrivacyConfig()
  return cfg.excludeBrowserDomains.some(pattern => domainMatchesPattern(domain, pattern))
}

/**
 * 检查应用名是否在 excludeApps 中（大小写不敏感，子串匹配显示名）。
 */
export function isAppExcluded(appName: string, config?: PrivacyConfig): boolean {
  const cfg = config ?? loadPrivacyConfig()
  const name = appName.trim().toLowerCase()
  if (!name) return false
  return cfg.excludeApps.some(a => {
    const n = a.trim().toLowerCase()
    return n.length > 0 && (name === n || name.includes(n) || n.includes(name))
  })
}

/**
 * 检查文本是否包含敏感模式。
 */
export function containsSensitive(text: string, config?: PrivacyConfig): boolean {
  const cfg = config ?? loadPrivacyConfig()
  return cfg.sensitivePatterns.some(pattern => {
    try {
      return new RegExp(pattern, 'i').test(text)
    } catch {
      return text.toLowerCase().includes(pattern.toLowerCase())
    }
  })
}

/** 兼容别名：memdir 等既有调用方仍用 containsSensitiveContent */
export const containsSensitiveContent = containsSensitive

/**
 * 计算保留期 cutoff（Unix ms）。
 * - days <= 0 → null（不清理）
 * - 默认/正数 → nowMs - days*86400000
 * @param nowMs 可注入时钟（单测 / 确定性 purge）；默认 Date.now()
 */
export function getDataRetentionCutoffMs(
  config?: PrivacyConfig,
  nowMs: number = Date.now(),
): number | null {
  const cfg = config ?? loadPrivacyConfig()
  const days = cfg.dataRetentionDays
  if (!Number.isFinite(days) || days <= 0) return null
  return nowMs - Math.floor(days) * 86_400_000
}

/**
 * 使配置缓存失效（配置文件变更后调用）。
 */
export function invalidatePrivacyCache(): void {
  _cachedConfig = null
  _cacheTime = 0
  _cachedSource = 'default'
}
