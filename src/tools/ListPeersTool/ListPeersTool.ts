import { z } from 'zod/v4'
import { buildTool, type ToolDef } from '../../Tool.js'
import { lazySchema } from '../../utils/lazySchema.js'
import { jsonStringify } from '../../utils/slowOperations.js'

const LIST_PEERS_TOOL_NAME = 'ListPeers'

const inputSchema = lazySchema(() => z.strictObject({}))
type InputSchema = ReturnType<typeof inputSchema>

export type Peer = {
  id: string
  address: string
  type: 'uds' | 'bridge'
  name?: string
  status: 'connected' | 'disconnected' | 'unknown'
}

export type Output = {
  peers: Peer[]
  message: string
}

export const ListPeersTool = buildTool({
  name: LIST_PEERS_TOOL_NAME,
  searchHint: 'list peers connected sessions sockets',
  maxResultSizeChars: 100_000,
  shouldDefer: true,

  get inputSchema(): InputSchema {
    return inputSchema()
  },

  isConcurrencySafe() {
    return true
  },

  isReadOnly() {
    return true
  },

  toAutoClassifierInput() {
    return ''
  },

  async description() {
    return 'List connected peers (local UDS sockets and Remote Control bridge sessions).'
  },

  async prompt() {
    return `List all currently discoverable peers — both local Unix Domain Socket (UDS) peers and Remote Control bridge sessions.

Use this to discover available targets for SendMessage. Each peer has an address you can use as the "to" field:
- UDS peers: "uds:<socket-path>"
- Bridge peers: "bridge:<session-id>"

Peers that are disconnected may still appear briefly. Use the address exactly as shown.`
  },

  mapToolResultToToolResultBlockParam(output, toolUseID) {
    return {
      tool_use_id: toolUseID,
      type: 'tool_result' as const,
      content:
        output.peers.length > 0
          ? output.peers
              .map(
                (p) =>
                  `${p.address} (${p.type}, ${p.status}${p.name ? `, name: ${p.name}` : ''})`,
              )
              .join('\n')
          : 'No peers discovered.',
    }
  },

  renderToolUseMessage() {
    return null
  },

  async call(_input, _context) {
    return {
      data: {
        peers: [],
        message: 'No peers discovered (UDS_INBOX feature required for peer discovery).',
      },
    }
  },
} satisfies ToolDef<InputSchema, Output>)
