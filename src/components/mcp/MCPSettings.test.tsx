// Input: MCP server/client counts during async server info preparation.
// Output: Regression assertion for pending /mcp status handling.
// Pos: Guards interactive /mcp from treating pending server info as no connected servers.
import { describe, expect, test } from 'bun:test'
import { shouldWaitForMcpServerInfo } from './MCPSettings'

describe('MCPSettings pending server state', () => {
  test('waits when clients exist but server info is still preparing', () => {
    expect(shouldWaitForMcpServerInfo(0, 1)).toBe(true)
  })

  test('does not wait when there are no configured clients', () => {
    expect(shouldWaitForMcpServerInfo(0, 0)).toBe(false)
  })

  test('does not wait after server info is available', () => {
    expect(shouldWaitForMcpServerInfo(1, 1)).toBe(false)
  })
})
