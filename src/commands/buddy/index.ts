import { feature } from 'bun:bundle'
import type { Command, LocalJSXCommandContext, LocalJSXCommandOnDone } from '../../types/command.js'
import { logEvent } from '../../services/analytics/index.js'

const buddy = {
  type: 'local-jsx',
  name: 'buddy',
  description: 'Toggle your coding companion buddy',
  isEnabled: () => feature('BUDDY'),
  get isHidden() {
    return !feature('BUDDY')
  },
  argumentHint: '[show|hide|mute|unmute|info]',
  immediate: true,
  load: () =>
    Promise.resolve({
      async call(
        onDone: LocalJSXCommandOnDone,
        context: LocalJSXCommandContext,
        args: string,
      ): Promise<React.ReactNode> {
        const { getGlobalConfig, saveGlobalConfig } = await import(
          '../../utils/config.js'
        )
        const subcommand = args.trim().toLowerCase()
        const config = getGlobalConfig()

        if (subcommand === 'info') {
          const companion = config.companion
          if (!companion) {
            onDone(
              'No companion generated yet. Toggle buddy on to meet your companion!',
              { display: 'system' },
            )
            return null
          }
          const info = [
            `Species: ${companion.species ?? 'unknown'}`,
            `Name: ${companion.name ?? 'unnamed'}`,
            companion.rarity ? `Rarity: ${companion.rarity}` : null,
          ]
            .filter(Boolean)
            .join('\n  ')
          onDone(`Your companion:\n  ${info}`, { display: 'system' })
          return null
        }

        if (subcommand === 'mute') {
          saveGlobalConfig(prev => ({ ...prev, companionMuted: true }))
          logEvent('tengu_buddy_muted', {})
          onDone('Companion muted. They will still be visible but stay quiet.', {
            display: 'system',
          })
          return null
        }

        if (subcommand === 'unmute') {
          saveGlobalConfig(prev => ({ ...prev, companionMuted: false }))
          logEvent('tengu_buddy_unmuted', {})
          onDone('Companion unmuted.', { display: 'system' })
          return null
        }

        if (subcommand === 'hide') {
          context.setAppState(prev => ({
            ...prev,
            companionVisible: false,
          }))
          logEvent('tengu_buddy_toggled', { enabled: false })
          onDone('Companion hidden.', { display: 'system' })
          return null
        }

        if (subcommand === 'show') {
          context.setAppState(prev => ({
            ...prev,
            companionVisible: true,
          }))
          logEvent('tengu_buddy_toggled', { enabled: true })
          onDone('Companion visible!', { display: 'system' })
          return null
        }

        const isVisible = context.getAppState().companionVisible ?? false
        const newState = !isVisible

        context.setAppState(prev => ({
          ...prev,
          companionVisible: newState,
        }))

        logEvent('tengu_buddy_toggled', { enabled: newState })

        onDone(
          newState
            ? 'Companion enabled! Your coding buddy is now visible.'
            : 'Companion hidden. Run /buddy show to bring them back.',
          { display: 'system' },
        )
        return null
      },
    }),
} satisfies Command

export default buddy
