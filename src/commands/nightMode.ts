// Input: User slash command /night-mode [on|off].
// Output: Toggles or displays night mode status in GlobalConfig.
// Pos: Command layer; modifies GlobalConfig.nightMode and reports status.
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"

import type { Command, LocalJSXCommandContext, LocalJSXCommandOnDone } from '../types/command.js'
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../services/analytics/index.js'

const nightMode = {
  type: 'local-jsx',
  name: 'night-mode',
  description: 'Toggle night mode for proactive engine · 切换夜间模式',
  isEnabled: () => true,
  immediate: true,
  argDescription: '[on|off]',
  load: () =>
    Promise.resolve({
      async call(
        onDone: LocalJSXCommandOnDone,
        context: LocalJSXCommandContext,
      ): Promise<React.ReactNode> {
        const { saveGlobalConfig, getGlobalConfig } = require('../utils/config.js') as typeof import('../utils/config.js')
        const { isNightTime, getNightModeConfig } = require('../proactive/nightMode.js') as typeof import('../proactive/nightMode.js')

        const args = (context.args ?? '').trim().toLowerCase()
        const config = getNightModeConfig()

        if (args === 'on') {
          saveGlobalConfig((current: ReturnType<typeof getGlobalConfig>) => ({
            ...current,
            nightMode: { ...config, enabled: true },
          }))
          logEvent('tengu_night_mode_toggled', {
            enabled: true as unknown as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          })
          onDone('Night mode enabled. Proactive engine will activate during night hours (22:00-06:00).', { display: 'system' })
        } else if (args === 'off') {
          saveGlobalConfig((current: ReturnType<typeof getGlobalConfig>) => ({
            ...current,
            nightMode: { ...config, enabled: false },
          }))
          logEvent('tengu_night_mode_toggled', {
            enabled: false as unknown as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          })
          onDone('Night mode disabled.', { display: 'system' })
        } else {
          const nightNow = isNightTime()
          const status = [
            `Night mode: ${config.enabled ? 'ON' : 'OFF'}`,
            `Current time is ${nightNow ? 'within' : 'outside'} night hours (22:00-06:00)`,
            config.dreamTime ? `Dream time: ${config.dreamTime}` : null,
            config.briefingTime ? `Briefing time: ${config.briefingTime}` : null,
          ].filter(Boolean).join('\n')
          onDone(status, { display: 'system' })
        }
        return null
      },
    }),
} satisfies Command

export default nightMode
