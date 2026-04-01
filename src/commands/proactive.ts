import { feature } from 'bun:bundle'
import type { Command, LocalJSXCommandContext, LocalJSXCommandOnDone } from '../types/command.js'
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../services/analytics/index.js'

const proactive = {
  type: 'local-jsx',
  name: 'proactive',
  description: 'Toggle proactive autonomous mode · 切换主动自主模式',
  isEnabled: () => { if (feature('PROACTIVE')) { return true } if (feature('KAIROS')) { return true } return false },
  immediate: true,
  load: () =>
    Promise.resolve({
      async call(
        onDone: LocalJSXCommandOnDone,
        context: LocalJSXCommandContext,
      ): Promise<React.ReactNode> {
        const proactiveModule = require('../proactive/index.js') as typeof import('../proactive/index.js')
        const isActive = proactiveModule.isProactiveActive()

        if (isActive) {
          proactiveModule.deactivateProactive()
          logEvent('tengu_proactive_toggled', {
            enabled: false,
            source:
              'slash_command' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          })
          onDone('Proactive mode disabled', { display: 'system' })
        } else {
          proactiveModule.activateProactive('slash_command')
          logEvent('tengu_proactive_toggled', {
            enabled: true,
            source:
              'slash_command' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          })
          onDone(
            'Proactive mode enabled. Claude will take initiative — explore, act, and make progress without waiting for instructions.',
            { display: 'system' },
          )
        }
        return null
      },
    }),
} satisfies Command

export default proactive
