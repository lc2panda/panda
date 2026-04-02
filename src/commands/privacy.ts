import type { Command, LocalCommandCall } from '../types/command.js'
import { isThirdPartyProvider } from '../utils/model/providers.js'
import { isPrivacyEnhancedMode } from '../utils/privacyMode.js'

const call: LocalCommandCall = async () => {
  const is3P = isThirdPartyProvider()
  const privacyOn = isPrivacyEnhancedMode()
  const reason = is3P ? '(third-party provider)' : privacyOn ? '(config: privacyEnhanced)' : ''
  const blocked = privacyOn ? '🔒 Disabled' : '📊 Enabled'
  const lines = [
    `Provider: ${is3P ? 'Third-party (non-Anthropic)' : 'Anthropic (first-party)'}`,
    `Privacy Enhanced: ${privacyOn ? `🔒 ON ${reason}` : '📊 OFF (standard)'}`,
    `Telemetry: ${blocked}`,
    `Analytics (logEvent): ${blocked}`,
    `GrowthBook: ${blocked}`,
    `Datadog: ${blocked}`,
    `BigQuery Metrics: ${blocked}`,
    `1P Event Logging: ${blocked}`,
    `User-Agent: ${privacyOn ? `PandaCode/${MACRO.VERSION}` : `claude-code/${MACRO.VERSION} (external, cli)`}`,
    `Storage: ~/.pandacc/`,
    '',
    privacyOn ? '' : 'Tip: set privacyEnhanced: true in config to enable privacy mode on Anthropic channel',
  ].filter(Boolean)
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
