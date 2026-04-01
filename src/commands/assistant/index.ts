import { feature } from 'bun:bundle'
import type { Command, LocalJSXCommandContext, LocalJSXCommandOnDone } from '../../types/command.js'
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../../services/analytics/index.js'

const assistant = {
  type: 'local-jsx',
  name: 'assistant',
  description: 'Toggle assistant mode (Kairos)',
  isEnabled: () => feature('KAIROS'),
  immediate: true,
  load: () =>
    Promise.resolve({
      async call(
        onDone: LocalJSXCommandOnDone,
        context: LocalJSXCommandContext,
      ): Promise<React.ReactNode> {
        const assistantModule = require('../../assistant/index.js') as typeof import('../../assistant/index.js')
        const isActive = assistantModule.isAssistantMode()

        if (isActive) {
          logEvent('tengu_assistant_toggled', {
            enabled: false,
            source:
              'slash_command' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          })
          onDone(
            'Assistant mode is currently active. It cannot be disabled mid-session — restart without --assistant to use normal mode.',
            { display: 'system' },
          )
        } else {
          assistantModule.markAssistantForced()
          await assistantModule.initializeAssistantTeam()

          logEvent('tengu_assistant_toggled', {
            enabled: true,
            source:
              'slash_command' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          })
          onDone(
            'Assistant mode activated. Claude will operate as an always-on assistant with proactive capabilities.',
            { display: 'system' },
          )
        }
        return null
      },
    }),
} satisfies Command

export default assistant
