import type { Command, LocalCommandCall } from '../types/command.js'
import { getGlobalConfig, saveGlobalConfig } from '../utils/config.js'

const LANGUAGES: Record<string, string> = { en: 'English', zh: '中文' }

const call: LocalCommandCall = async (args) => {
  const lang = args.trim().toLowerCase()
  if (!lang) {
    const current = getGlobalConfig().language || 'zh'
    return {
      type: 'text',
      value: `Current language: ${LANGUAGES[current] || current}\nAvailable: ${Object.entries(LANGUAGES).map(([k, v]) => `${k} (${v})`).join(', ')}`,
    }
  }
  if (!(lang in LANGUAGES)) {
    return {
      type: 'text',
      value: `Unknown language: ${lang}. Available: ${Object.keys(LANGUAGES).join(', ')}`,
    }
  }
  saveGlobalConfig(c => ({ ...c, language: lang }))
  return {
    type: 'text',
    value: `Language set to ${LANGUAGES[lang]}`,
  }
}

const language = {
  type: 'local',
  name: 'language',
  description: 'Switch display language · 切换显示语言',
  argumentHint: '[en|zh]',
  supportsNonInteractive: true,
  load: () => Promise.resolve({ call }),
} satisfies Command

export default language
