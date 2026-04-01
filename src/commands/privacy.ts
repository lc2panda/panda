import type { Command, LocalCommandCall } from '../types/command.js'
import { isThirdPartyProvider } from '../utils/model/providers.js'

const call: LocalCommandCall = async () => {
  const is3P = isThirdPartyProvider()
  const lines = [
    `Provider: ${is3P ? 'Third-party (non-Anthropic)' : 'Anthropic (first-party)'}`,
    `Telemetry: ${is3P ? '🔒 Disabled (zero data leaves local)' : '📊 Enabled (standard Anthropic telemetry)'}`,
    `Analytics: ${is3P ? '🔒 Disabled' : '📊 Enabled'}`,
    `GrowthBook: ${is3P ? '🔒 Disabled' : '📊 Enabled'}`,
    `User-Agent: ${is3P ? `PandaCode/${MACRO.VERSION}` : `claude-code/${MACRO.VERSION} (external, cli)`}`,
    `Storage: ~/.pandacc/`,
  ]
  return {
    type: 'text',
    value: lines.join('\n'),
  }
}

const privacy = {
  type: 'local',
  name: 'privacy',
  description: 'Show privacy status · 显示隐私保护状态',
  supportsNonInteractive: true,
  load: () => Promise.resolve({ call }),
} satisfies Command

export default privacy
