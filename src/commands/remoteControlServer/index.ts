import { randomUUID } from 'node:crypto'
import { feature } from 'bun:bundle'
import type { Command } from '../../commands.js'
import { isBridgeEnabled } from '../../bridge/bridgeEnabled.js'

function isEnabled(): boolean {
  let daemonEnabled = false
  if (feature('DAEMON')) { daemonEnabled = true }
  let bridgeModeEnabled = false
  if (feature('BRIDGE_MODE')) { bridgeModeEnabled = true }
  if (!daemonEnabled || !bridgeModeEnabled) {
    return false
  }
  return isBridgeEnabled()
}

const remoteControlServer = {
  type: 'local-jsx',
  name: 'remote-control-server',
  aliases: ['rcs'],
  description: 'Start a persistent remote control server (daemon mode) · 启动远程控制服务器（守护模式）',
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
        const {
          getBridgeAccessToken,
          getBridgeBaseUrl,
        } = await import('../../bridge/bridgeConfig.js')

        const token = getBridgeAccessToken()
        if (!token) {
          onDone(
            'Remote control server requires authentication. Please run /login first.',
            { display: 'system' },
          )
          return null
        }

        const { createBridgeApiClient } = await import('../../bridge/bridgeApi.js')
        const bridgeApi = createBridgeApiClient({
          baseUrl: getBridgeBaseUrl(),
          getAccessToken: getBridgeAccessToken,
          runnerVersion: MACRO.VERSION,
        })

        const machineName =
          process.env.HOSTNAME || require('os').hostname() || 'unknown'
        const cwd = process.cwd()

        try {
          const env = await bridgeApi.registerBridgeEnvironment({
            machineName,
            dir: cwd,
            branch: '',
            gitRepoUrl: null,
            maxSessions: 5,
            spawnMode: 'same-dir',
            verbose: false,
            sandbox: false,
            bridgeId: randomUUID(),
            workerType: 'claude_code_assistant',
            environmentId: randomUUID(),
            apiBaseUrl: getBridgeBaseUrl(),
            sessionIngressUrl: getBridgeBaseUrl(),
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
