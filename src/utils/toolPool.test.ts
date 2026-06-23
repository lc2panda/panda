import { describe, expect, test } from 'bun:test'
import { AGENT_TOOL_NAME } from '../tools/AgentTool/constants.js'
import { TASK_STOP_TOOL_NAME } from '../tools/TaskStopTool/prompt.js'
import { SEND_MESSAGE_TOOL_NAME } from '../tools/SendMessageTool/constants.js'
import { SYNTHETIC_OUTPUT_TOOL_NAME } from '../tools/SyntheticOutputTool/SyntheticOutputTool.js'
import type { Tool, Tools } from '../Tool.js'
import { applyCoordinatorToolFilter } from './toolPool.js'

// Minimal Tool stub: applyCoordinatorToolFilter only reads name / isMcp /
// mcpInfo, so we cast a partial object to Tool for these unit tests.
function stub(props: {
  name: string
  isMcp?: boolean
  mcpInfo?: { serverName: string; toolName: string }
}): Tool {
  return props as unknown as Tool
}

const names = (tools: Tools): string[] => tools.map(t => t.name)

describe('applyCoordinatorToolFilter — channel reply exception', () => {
  // (a1) channel reply with the fully-qualified (prefixed) name is allowed
  test('a1: prefixed channel reply (wechat) is allowed', () => {
    const tools = [
      stub({
        name: 'mcp__plugin_wechat_wechat__reply',
        isMcp: true,
        mcpInfo: { serverName: 'plugin:wechat:wechat', toolName: 'reply' },
      }),
    ]
    expect(names(applyCoordinatorToolFilter(tools))).toContain(
      'mcp__plugin_wechat_wechat__reply',
    )
  })

  // (a2) channel reply with the bare name (skip-prefix SDK mode) is allowed
  test('a2: bare-name channel reply (skip-prefix) is allowed', () => {
    const tools = [
      stub({
        name: 'reply',
        isMcp: true,
        mcpInfo: { serverName: 'sdk-channel', toolName: 'reply' },
      }),
    ]
    expect(names(applyCoordinatorToolFilter(tools))).toContain('reply')
  })

  // (a3) a different channel server (feishu) is allowed — proves no server
  // name is hardcoded
  test('a3: prefixed channel reply (feishu, different server) is allowed', () => {
    const tools = [
      stub({
        name: 'mcp__plugin_wechat_feishu__reply',
        isMcp: true,
        mcpInfo: { serverName: 'plugin:wechat:feishu', toolName: 'reply' },
      }),
    ]
    expect(names(applyCoordinatorToolFilter(tools))).toContain(
      'mcp__plugin_wechat_feishu__reply',
    )
  })

  // (b) the upstream-4 coordinator tools remain allowed
  test('b: upstream coordinator tools (Agent/TaskStop/SendMessage/SyntheticOutput) remain', () => {
    const tools = [
      stub({ name: AGENT_TOOL_NAME }),
      stub({ name: TASK_STOP_TOOL_NAME }),
      stub({ name: SEND_MESSAGE_TOOL_NAME }),
      stub({ name: SYNTHETIC_OUTPUT_TOOL_NAME }),
    ]
    const result = names(applyCoordinatorToolFilter(tools))
    expect(result).toContain(AGENT_TOOL_NAME)
    expect(result).toContain(TASK_STOP_TOOL_NAME)
    expect(result).toContain(SEND_MESSAGE_TOOL_NAME)
    expect(result).toContain(SYNTHETIC_OUTPUT_TOOL_NAME)
  })

  // (c1) precision: a non-MCP tool named "reply" is NOT let through
  test('c1: non-MCP tool named "reply" is NOT allowed', () => {
    const tools = [stub({ name: 'reply', isMcp: false })]
    expect(names(applyCoordinatorToolFilter(tools))).not.toContain('reply')
  })

  // (c2) precision: an unrelated MCP tool is NOT let through
  test('c2: unrelated MCP tool (download_attachment) is NOT allowed', () => {
    const tools = [
      stub({
        name: 'mcp__plugin_wechat_wechat__download_attachment',
        isMcp: true,
        mcpInfo: {
          serverName: 'plugin:wechat:wechat',
          toolName: 'download_attachment',
        },
      }),
    ]
    expect(names(applyCoordinatorToolFilter(tools))).not.toContain(
      'mcp__plugin_wechat_wechat__download_attachment',
    )
  })

  // (c3) boundary: a near-miss name "reply_all" is NOT let through
  test('c3: near-miss MCP tool "reply_all" is NOT allowed', () => {
    const tools = [
      stub({
        name: 'mcp__plugin_x__reply_all',
        isMcp: true,
        mcpInfo: { serverName: 'plugin:x', toolName: 'reply_all' },
      }),
    ]
    expect(names(applyCoordinatorToolFilter(tools))).not.toContain(
      'mcp__plugin_x__reply_all',
    )
  })

  // (d) regression: PR-activity subscription tools are still allowed
  test('d: PR-activity subscription tool is still allowed', () => {
    const tools = [
      stub({
        name: 'mcp__some_github_server__subscribe_pr_activity',
        isMcp: true,
        mcpInfo: {
          serverName: 'some-github-server',
          toolName: 'subscribe_pr_activity',
        },
      }),
    ]
    expect(names(applyCoordinatorToolFilter(tools))).toContain(
      'mcp__some_github_server__subscribe_pr_activity',
    )
  })
})
