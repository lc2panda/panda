import type { CuCallToolResult } from '@ant/computer-use-mcp'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { homedir } from 'os'

import { shutdownDatadog } from '../../services/analytics/datadog.js'
import { shutdown1PEventLogging } from '../../services/analytics/firstPartyEventLogger.js'
import { initializeAnalyticsSink } from '../../services/analytics/sink.js'
import { enableConfigs } from '../config.js'
import { logForDebugging } from '../debug.js'
import { errorMessage } from '../errors.js'
import { execFileNoThrow } from '../execFileNoThrow.js'
import { sleep } from '../sleep.js'
import { filterAppsForDescription } from './appNames.js'
import { COMPUTER_USE_MCP_SERVER_NAME } from './common.js'
import { getChicagoCoordinateMode } from './gates.js'
import { getComputerUseHostAdapter } from './hostAdapter.js'

const APP_ENUM_TIMEOUT_MS = 1000

/**
 * Enumerate installed apps, timed. Fails soft — if Spotlight is slow or
 * claude-swift throws, the tool description just omits the list. Resolution
 * happens at call time regardless; the model just doesn't get hints.
 */
async function tryGetInstalledAppNames(): Promise<string[] | undefined> {
  const adapter = getComputerUseHostAdapter()
  const enumP = adapter.executor.listInstalledApps()
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeoutP = new Promise<undefined>(resolve => {
    timer = setTimeout(resolve, APP_ENUM_TIMEOUT_MS, undefined)
  })
  const installed = await Promise.race([enumP, timeoutP])
    .catch(() => undefined)
    .finally(() => clearTimeout(timer))
  if (!installed) {
    // The enumeration continues in the background — swallow late rejections.
    void enumP.catch(() => {})
    logForDebugging(
      `[Computer Use MCP] app enumeration exceeded ${APP_ENUM_TIMEOUT_MS}ms or failed; tool description omits list`,
    )
    return undefined
  }
  return filterAppsForDescription(installed, homedir())
}

// ---------------------------------------------------------------------------
// Tool definitions for the computer-use MCP server
// ---------------------------------------------------------------------------

const coordProp = {
  type: 'array' as const,
  items: { type: 'number' as const },
  minItems: 2,
  maxItems: 2,
  description: 'Target [x, y] pixel coordinates',
}

export const COMPUTER_USE_TOOLS = [
  {
    name: 'screenshot',
    description: 'Take a screenshot of the current screen',
    inputSchema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'left_click',
    description: 'Left-click at the given [x, y] pixel coordinates',
    inputSchema: {
      type: 'object' as const,
      properties: { coordinate: coordProp },
      required: ['coordinate'],
    },
  },
  {
    name: 'right_click',
    description: 'Right-click at the given [x, y] pixel coordinates',
    inputSchema: {
      type: 'object' as const,
      properties: { coordinate: coordProp },
      required: ['coordinate'],
    },
  },
  {
    name: 'middle_click',
    description: 'Middle-click at the given [x, y] pixel coordinates',
    inputSchema: {
      type: 'object' as const,
      properties: { coordinate: coordProp },
      required: ['coordinate'],
    },
  },
  {
    name: 'double_click',
    description: 'Double-click at the given [x, y] pixel coordinates',
    inputSchema: {
      type: 'object' as const,
      properties: { coordinate: coordProp },
      required: ['coordinate'],
    },
  },
  {
    name: 'triple_click',
    description: 'Triple-click at the given [x, y] pixel coordinates',
    inputSchema: {
      type: 'object' as const,
      properties: { coordinate: coordProp },
      required: ['coordinate'],
    },
  },
  {
    name: 'mouse_move',
    description: 'Move the mouse cursor to the given [x, y] pixel coordinates',
    inputSchema: {
      type: 'object' as const,
      properties: { coordinate: coordProp },
      required: ['coordinate'],
    },
  },
  {
    name: 'left_click_drag',
    description: 'Left-click drag from start_coordinate to coordinate',
    inputSchema: {
      type: 'object' as const,
      properties: {
        start_coordinate: { ...coordProp, description: 'Start [x, y] pixel coordinates' },
        coordinate: { ...coordProp, description: 'End [x, y] pixel coordinates' },
      },
      required: ['start_coordinate', 'coordinate'],
    },
  },
  {
    name: 'left_mouse_down',
    description: 'Press and hold left mouse button at the given [x, y] pixel coordinates',
    inputSchema: {
      type: 'object' as const,
      properties: { coordinate: coordProp },
      required: ['coordinate'],
    },
  },
  {
    name: 'left_mouse_up',
    description: 'Release left mouse button at the given [x, y] pixel coordinates',
    inputSchema: {
      type: 'object' as const,
      properties: { coordinate: coordProp },
      required: ['coordinate'],
    },
  },
  {
    name: 'type',
    description: 'Type the given text via clipboard paste',
    inputSchema: {
      type: 'object' as const,
      properties: { text: { type: 'string' as const, description: 'Text to type' } },
      required: ['text'],
    },
  },
  {
    name: 'key',
    description: 'Press a key or key combination (e.g. "ctrl+c", "Return", "alt+Tab")',
    inputSchema: {
      type: 'object' as const,
      properties: { text: { type: 'string' as const, description: 'Key name or combination' } },
      required: ['text'],
    },
  },
  {
    name: 'hold_key',
    description: 'Hold a key for a specified duration in milliseconds',
    inputSchema: {
      type: 'object' as const,
      properties: {
        text: { type: 'string' as const, description: 'Key name to hold' },
        duration: { type: 'number' as const, description: 'Duration in milliseconds' },
      },
      required: ['text', 'duration'],
    },
  },
  {
    name: 'scroll',
    description: 'Scroll at the given coordinates in a specified direction',
    inputSchema: {
      type: 'object' as const,
      properties: {
        coordinate: coordProp,
        direction: {
          type: 'string' as const,
          enum: ['up', 'down', 'left', 'right'],
          description: 'Scroll direction',
        },
        amount: { type: 'number' as const, description: 'Scroll amount in pixels' },
      },
      required: ['coordinate', 'direction', 'amount'],
    },
  },
  {
    name: 'wait',
    description: 'Wait for a specified number of seconds',
    inputSchema: {
      type: 'object' as const,
      properties: {
        duration: { type: 'number' as const, description: 'Duration in seconds' },
      },
      required: ['duration'],
    },
  },
  {
    name: 'cursor_position',
    description: 'Get the current cursor position',
    inputSchema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'read_clipboard',
    description: 'Read text content from the system clipboard',
    inputSchema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'write_clipboard',
    description: 'Write text content to the system clipboard',
    inputSchema: {
      type: 'object' as const,
      properties: { text: { type: 'string' as const, description: 'Text to write to clipboard' } },
      required: ['text'],
    },
  },
]

// ---------------------------------------------------------------------------
// Action dispatcher — routes tool calls to executor methods
// ---------------------------------------------------------------------------

async function readClipboard(): Promise<string> {
  const { stdout, code } = await execFileNoThrow('pbpaste', [], { useCwd: false })
  if (code !== 0) throw new Error(`pbpaste exited with code ${code}`)
  return stdout
}

async function writeClipboard(text: string): Promise<void> {
  const { code } = await execFileNoThrow('pbcopy', [], { input: text, useCwd: false })
  if (code !== 0) throw new Error(`pbcopy exited with code ${code}`)
}

async function takeScreenshotResult(
  executor: any,
): Promise<CuCallToolResult> {
  const result = await executor.screenshot({
    allowedBundleIds: [],
    displayId: undefined,
  })
  return {
    content: [
      { type: 'image', data: result.base64, mimeType: 'image/png' },
    ],
    telemetry: {},
  }
}

/** Visual actions auto-screenshot after execution so the model sees the effect. */
async function executeAndScreenshot(
  executor: any,
  action: () => Promise<void>,
): Promise<CuCallToolResult> {
  await action()
  return takeScreenshotResult(executor)
}

export async function dispatchComputerUseAction(
  executor: any,
  name: string,
  args: any,
): Promise<CuCallToolResult> {
  try {
    switch (name) {
      case 'screenshot':
        return await takeScreenshotResult(executor)

      case 'left_click':
        return await executeAndScreenshot(executor, () =>
          executor.click(args.coordinate[0], args.coordinate[1], 'left', 1))

      case 'right_click':
        return await executeAndScreenshot(executor, () =>
          executor.click(args.coordinate[0], args.coordinate[1], 'right', 1))

      case 'middle_click':
        return await executeAndScreenshot(executor, () =>
          executor.click(args.coordinate[0], args.coordinate[1], 'middle', 1))

      case 'double_click':
        return await executeAndScreenshot(executor, () =>
          executor.click(args.coordinate[0], args.coordinate[1], 'left', 2))

      case 'triple_click':
        return await executeAndScreenshot(executor, () =>
          executor.click(args.coordinate[0], args.coordinate[1], 'left', 3))

      case 'mouse_move':
        return await executeAndScreenshot(executor, () =>
          executor.moveMouse(args.coordinate[0], args.coordinate[1]))

      case 'left_click_drag':
        return await executeAndScreenshot(executor, () =>
          executor.drag(
            { x: args.start_coordinate[0], y: args.start_coordinate[1] },
            { x: args.coordinate[0], y: args.coordinate[1] },
          ))

      case 'left_mouse_down':
        return await executeAndScreenshot(executor, async () => {
          await executor.moveMouse(args.coordinate[0], args.coordinate[1])
          await executor.mouseDown()
        })

      case 'left_mouse_up':
        return await executeAndScreenshot(executor, async () => {
          await executor.moveMouse(args.coordinate[0], args.coordinate[1])
          await executor.mouseUp()
        })

      case 'type':
        return await executeAndScreenshot(executor, () =>
          executor.type(args.text, { viaClipboard: true }))

      case 'key':
        return await executeAndScreenshot(executor, () =>
          executor.key(args.text))

      case 'hold_key':
        return await executeAndScreenshot(executor, () =>
          executor.holdKey([args.text], args.duration))

      case 'scroll': {
        let dx = 0
        let dy = 0
        switch (args.direction) {
          case 'up':    dy = -args.amount; break
          case 'down':  dy =  args.amount; break
          case 'left':  dx = -args.amount; break
          case 'right': dx =  args.amount; break
        }
        return await executeAndScreenshot(executor, () =>
          executor.scroll(args.coordinate[0], args.coordinate[1], dx, dy))
      }

      case 'wait':
        await sleep(args.duration * 1000)
        return { content: [{ type: 'text', text: 'OK' }], telemetry: {} }

      case 'cursor_position': {
        const pos = await executor.getCursorPosition()
        return {
          content: [{ type: 'text', text: `X=${pos.x},Y=${pos.y}` }],
          telemetry: {},
        }
      }

      case 'read_clipboard': {
        const clipText = await readClipboard()
        return {
          content: [{ type: 'text', text: clipText }],
          telemetry: {},
        }
      }

      case 'write_clipboard':
        await writeClipboard(args.text)
        return { content: [{ type: 'text', text: 'OK' }], telemetry: {} }

      default:
        return {
          content: [{ type: 'text', text: `Unknown tool: ${name}` }],
          telemetry: { error_kind: 'unknown_tool' },
        }
    }
  } catch (e) {
    return {
      content: [{ type: 'text', text: errorMessage(e) }],
      telemetry: { error_kind: 'execution_error' },
    }
  }
}

// ---------------------------------------------------------------------------
// In-process MCP server construction
// ---------------------------------------------------------------------------

/**
 * Construct the in-process computer-use MCP server. Creates a real Server
 * instance with ListTools and CallTool handlers that dispatch through
 * the CLI executor.
 *
 * Async so the 1s app-enumeration timeout doesn't block startup — called from
 * an `await import()` in `client.ts` on first CU connection, not `main.tsx`.
 */
export async function createComputerUseMcpServerForCli(): Promise<Server | null> {
  const adapter = getComputerUseHostAdapter()

  const server = new Server(
    { name: COMPUTER_USE_MCP_SERVER_NAME, version: '1.0.0' },
    { capabilities: { tools: {} } },
  )

  server.setRequestHandler(ListToolsRequestSchema, async () =>
    adapter.isDisabled() ? { tools: [] } : { tools: COMPUTER_USE_TOOLS },
  )

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: toolArgs } = request.params
    const result = await dispatchComputerUseAction(adapter.executor, name, toolArgs ?? {})
    return {
      content: result.content.map((c) => {
        if (c.type === 'image') {
          return { type: 'image' as const, data: c.data ?? '', mimeType: c.mimeType ?? 'image/png' }
        }
        return { type: 'text' as const, text: c.text ?? '' }
      }),
      isError: !!result.telemetry.error_kind,
    }
  })

  logForDebugging('[Computer Use MCP] Server created with full tool set')
  return server
}

/**
 * Subprocess entrypoint for `--computer-use-mcp`. Mirror of
 * `runClaudeInChromeMcpServer` — stdio transport, exit on stdin close,
 * flush analytics before exit.
 */
export async function runComputerUseMcpServer(): Promise<void> {
  enableConfigs()
  initializeAnalyticsSink()

  const server = await createComputerUseMcpServerForCli()
  if (!server) {
    logForDebugging('[Computer Use MCP] Server creation failed; exiting subprocess')
    await Promise.all([shutdown1PEventLogging(), shutdownDatadog()])
    // eslint-disable-next-line custom-rules/no-process-exit
    process.exit(0)
    return
  }
  const transport = new StdioServerTransport()

  let exiting = false
  const shutdownAndExit = async (): Promise<void> => {
    if (exiting) return
    exiting = true
    await Promise.all([shutdown1PEventLogging(), shutdownDatadog()])
    // eslint-disable-next-line custom-rules/no-process-exit
    process.exit(0)
  }
  process.stdin.on('end', () => void shutdownAndExit())
  process.stdin.on('error', () => void shutdownAndExit())

  logForDebugging('[Computer Use MCP] Starting MCP server')
  await server.connect(transport)
  logForDebugging('[Computer Use MCP] MCP server started')
}
