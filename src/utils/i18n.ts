import { getGlobalConfig } from './config.js'

export function t(en: string, zh: string): string {
  const lang = getGlobalConfig().language
  return lang === 'zh' ? zh : en
}

export function getLang(): string {
  return getGlobalConfig().language || 'en'
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
