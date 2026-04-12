// Input: ~/.pandacc/config/privacy.json 配置文件
// Output: 隐私排除规则，供数据连接器使用
// Pos: 数据连接器层的前置过滤器

import { readFileSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

export interface PrivacyConfig {
  excludePaths: string[]
  excludeApps: string[]
  excludeBrowserDomains: string[]
  sensitivePatterns: string[]
  localLLMForSensitive: boolean
  dataRetentionDays: number
}

const DEFAULT_CONFIG: PrivacyConfig = {
  excludePaths: ['~/.ssh/**', '~/.gnupg/**', '~/.aws/**', '**/node_modules/**'],
  excludeApps: ['1Password', 'Keychain Access'],
  excludeBrowserDomains: ['*.bank.*', '**.gov'],
  sensitivePatterns: ['password', 'secret', 'api[._-]?key', 'token', '\\bsk-[a-zA-Z0-9]', 'private.?key', 'credential'],
  localLLMForSensitive: false,
  dataRetentionDays: 90,
}

const CONFIG_PATH = join(homedir(), '.pandacc', 'config', 'privacy.json')

// 缓存已加载的配置，避免每次调用都读文件
let _cachedConfig: PrivacyConfig | null = null
let _cachedMtime: number = 0
let _cachedSize: number = 0

/** 读取隐私配置，文件不存在时返回默认值 */
export function loadPrivacyConfig(): PrivacyConfig {
  try {
    const { statSync } = require('fs')
    const stat = statSync(CONFIG_PATH)
    const mtime = stat.mtimeMs
    const size = stat.size
    // 文件未变更时返回缓存（mtime + size 双重校验，兼容低精度文件系统如 FAT32）
    if (_cachedConfig && mtime === _cachedMtime && size === _cachedSize) return _cachedConfig

    const raw = readFileSync(CONFIG_PATH, 'utf-8')
    const parsed = JSON.parse(raw)
    // 合并默认值，防止字段缺失
    _cachedConfig = { ...DEFAULT_CONFIG, ...parsed }
    _cachedMtime = mtime
    _cachedSize = size
    return _cachedConfig
  } catch {
    return DEFAULT_CONFIG
  }
}

/** 将 glob 模式转为正则（支持 *, **, ? 三种通配符） */
function globToRegex(pattern: string): RegExp {
  // 展开 ~ 为 homedir
  const expanded = pattern.replace(/^~/, homedir().replace(/\\/g, '/'))
  const escaped = expanded
    .replace(/\\/g, '/')
    .replace(/[.+^${}()|\\[\]]/g, '\\$&')
    .replace(/\*\*/g, '__GLOBSTAR__')  // 临时占位
    .replace(/\*/g, '[^/]*')
    .replace(/__GLOBSTAR__/g, '.*')
    .replace(/\?/g, '.')
  return new RegExp(`^${escaped}$`, 'i')
}

/** 检查路径是否被排除 */
export function isPathExcluded(filePath: string, config: PrivacyConfig): boolean {
  const normalized = filePath.replace(/\\/g, '/')
  for (const pattern of config.excludePaths) {
    if (globToRegex(pattern).test(normalized)) return true
  }
  return false
}

/** 检查域名是否被排除 */
export function isDomainExcluded(domain: string, config: PrivacyConfig): boolean {
  const lower = domain.toLowerCase()
  for (const pattern of config.excludeBrowserDomains) {
    if (globToRegex(pattern).test(lower)) return true
    // 额外检查子域名：如 pattern 为 "**.gov"，确保 "www.irs.gov" 也能匹配
    // 对不含 ** 的 pattern，尝试在前面加 **. 匹配子域名
    if (!pattern.startsWith('**') && !pattern.startsWith('*.*.')) {
      const subPattern = '**.' + pattern.replace(/^\*\./, '')
      if (globToRegex(subPattern).test(lower)) return true
    }
  }
  return false
}

/** 检查内容是否包含敏感信息 */
export function containsSensitiveContent(text: string, config: PrivacyConfig): boolean {
  for (const pattern of config.sensitivePatterns) {
    try {
      if (new RegExp(pattern, 'i').test(text)) return true
    } catch {
      // 无效正则，尝试字面匹配
      if (text.toLowerCase().includes(pattern.toLowerCase())) return true
    }
  }
  return false
}
