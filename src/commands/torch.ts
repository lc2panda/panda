import { feature } from 'bun:bundle'
import type { Command, LocalJSXCommandContext, LocalJSXCommandOnDone } from '../types/command.js'
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../services/analytics/index.js'

const torch = {
  type: 'local-jsx',
  name: 'torch',
  description: 'Toggle Torch mode for enhanced visibility into model reasoning',
  isEnabled: () => feature('TORCH'),
  immediate: true,
  load: () =>
    Promise.resolve({
      async call(
        onDone: LocalJSXCommandOnDone,
        context: LocalJSXCommandContext,
      ): Promise<React.ReactNode> {
        const current = context.getAppState().torchEnabled ?? false
        const newState = !current

        context.setAppState(prev => ({
          ...prev,
          torchEnabled: newState,
        }))

        logEvent('tengu_torch_toggled', {
          enabled: newState,
          source:
            'slash_command' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        })

        onDone(
          newState
            ? 'Torch mode enabled. Extended reasoning traces will be visible.'
            : 'Torch mode disabled.',
          { display: 'system' },
        )
        return null
      },
    }),
} satisfies Command

export default torch
