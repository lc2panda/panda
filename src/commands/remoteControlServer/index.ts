import { feature } from 'bun:bundle'
import type { Command } from '../../commands.js'
import { isBridgeEnabled } from '../../bridge/bridgeEnabled.js'

function isEnabled(): boolean {
  if (!feature('DAEMON') || !feature('BRIDGE_MODE')) {
    return false
  }
  return isBridgeEnabled()
}

const remoteControlServer = {
  type: 'local-jsx',
  name: 'remote-control-server',
  aliases: ['rcs'],
  description: 'Start a persistent remote control server (daemon mode)',
  isEnabled,
  get isHidden() {
    return !isEnabled()
  },
  load: () =>
    Promise.resolve({
      async call(
        onDone: import('../../types/command.js').LocalJSXCommandOnDone,
        context: import('../../types/command.js').LocalJSXCommandContext,
      ): Promise<React.ReactNode> {
        const { getBridgeAccessToken } = await import(
          '../../bridge/bridgeConfig.js'
        )

        const token = getBridgeAccessToken()
        if (!token) {
          onDone(
            'Remote control server requires authentication. Please run /login first.',
            { display: 'system' },
          )
          return null
        }

        const bridgeApi = await import('../../bridge/bridgeApi.js')

        const machineName =
          process.env.HOSTNAME || require('os').hostname() || 'unknown'
        const cwd = process.cwd()

        try {
          const env = await bridgeApi.registerEnvironment({
            machineName,
            dir: cwd,
            branch: undefined,
            gitRepoUrl: undefined,
            maxSessions: 5,
            workerType: 'daemon',
          })

          onDone(
            `Remote control server started.\nEnvironment ID: ${env.environment_id}\nListening for remote sessions on ${machineName}:${cwd}`,
            { display: 'system' },
          )
        } catch (err) {
          onDone(
            `Failed to start remote control server: ${err instanceof Error ? err.message : String(err)}`,
            { display: 'system' },
          )
        }

        return null
      },
    }),
} satisfies Command

export default remoteControlServer
