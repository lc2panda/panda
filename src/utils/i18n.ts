import { getGlobalConfig } from './config.js'

export function t(en: string, zh: string): string {
  return isZh() ? zh : en
}

export function getLang(): string {
  try {
    return getGlobalConfig().language || 'en'
  } catch {
    // Config not yet initialized (module-level calls before bootstrap).
    // Fall back to system locale detection.
    const lang = process.env.LANG || process.env.LANGUAGE || process.env.LC_ALL || ''
    return lang.startsWith('zh') ? 'zh' : 'en'
  }
}

export function isZh(): boolean {
  return getLang() === 'zh'
}

export function getLocalizedDescription(desc: string): string {
  const lang = getLang()
  if (!desc.includes(' · ')) {
    return desc
  }
  const parts = desc.split(' · ')
  if (lang === 'zh') {
    return parts[1] ?? desc
  }
  return parts[0] ?? desc
}
