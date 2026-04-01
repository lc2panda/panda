import { feature } from 'bun:bundle'
import type { Command } from '../../commands.js'

const peers = {
  type: 'local-jsx',
  name: 'peers',
  description: 'List and manage connected peer Claude sessions',
  isEnabled: () => feature('UDS_INBOX'),
  get isHidden() {
    return !feature('UDS_INBOX')
  },
  load: () =>
    Promise.resolve({
      async call(
        onDone: import('../../types/command.js').LocalJSXCommandOnDone,
        context: import('../../types/command.js').LocalJSXCommandContext,
        args: string,
      ): Promise<React.ReactNode> {
        const subcommand = args.trim()
        const appState = context.getAppState()
        const peers = appState.connectedPeers ?? []

        if (subcommand === 'refresh' || subcommand === 'scan') {
          onDone('Scanning for peer sessions...', {
            display: 'system',
            shouldQuery: false,
          })
          return null
        }

        if (peers.length === 0) {
          onDone(
            'No connected peer sessions found.\n\nPeers are other Claude Code sessions on this machine that can exchange messages via the UDS inbox.\nStart another session to see it listed here.',
            { display: 'system' },
          )
          return null
        }

        const peerList = peers
          .map(
            (p: { id: string; name?: string; cwd?: string; status?: string }) =>
              `  ${p.name || p.id} — ${p.cwd || '(unknown dir)'} [${p.status || 'connected'}]`,
          )
          .join('\n')

        onDone(`Connected peers (${peers.length}):\n${peerList}`, {
          display: 'system',
        })
        return null
      },
    }),
} satisfies Command

export default peers
