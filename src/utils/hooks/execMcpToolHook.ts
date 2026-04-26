// Input: McpToolHook 配置 + hookInput JSON 字符串 + 已连 MCP servers
// Output: HookResult（success/cancelled/non_blocking_error）含工具调用结果文本
// Pos: utils/hooks/ 新增的 mcp_tool handler — 与 execHttpHook/execAgentHook/execPromptHook 同级
//      上游 v2.1.118 引入；commit 标签 [NEW-FILE:#20260426-02]
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"
import { randomUUID } from 'crypto'
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js'
import type { HookEvent } from 'src/entrypoints/agentSdkTypes.js'
import type { ToolUseContext } from '../../Tool.js'
import { createAttachmentMessage } from '../attachments.js'
import { createCombinedAbortSignal } from '../combinedAbortSignal.js'
import { logForDebugging } from '../debug.js'
import { errorMessage } from '../errors.js'
import type { HookResult } from '../hooks.js'
import { jsonStringify } from '../slowOperations.js'
import { safeParseJSON } from '../json.js'
import type { McpToolHook } from '../settings/types.js'

const DEFAULT_MCP_TOOL_HOOK_TIMEOUT_MS = 60 * 1000 // 60s, mirrors agent hook default

/**
 * Resolve a dotted path against an object, returning undefined for any
 * missing segment. Used for `${tool_input.x.y}` style template substitution.
 */
function resolveDottedPath(
  root: Record<string, unknown>,
  path: string,
): unknown {
  let cur: unknown = root
  for (const segment of path.split('.')) {
    if (cur === null || cur === undefined) return undefined
    if (typeof cur !== 'object') return undefined
    cur = (cur as Record<string, unknown>)[segment]
  }
  return cur
}

/**
 * Substitute `${path.to.field}` placeholders in a string using values from
 * `hookInputObj`. Whole-string placeholders preserve the original value type
 * (object/array/number/etc.), embedded placeholders stringify the resolved
 * value via JSON.stringify.
 *
 * Exported for testability — exec path also uses this directly.
 */
export function substituteTemplate(
  value: string,
  hookInputObj: Record<string, unknown>,
): unknown {
  // Whole-string placeholder: return the raw resolved value (preserves type)
  const wholeMatch = value.match(/^\$\{([^}]+)\}$/)
  if (wholeMatch) {
    const resolved = resolveDottedPath(hookInputObj, wholeMatch[1]!)
    return resolved
  }

  // Embedded substitution: stringify each match into the surrounding text
  return value.replace(/\$\{([^}]+)\}/g, (_, path: string) => {
    const resolved = resolveDottedPath(hookInputObj, path)
    if (resolved === undefined || resolved === null) return ''
    if (typeof resolved === 'string') return resolved
    try {
      return JSON.stringify(resolved)
    } catch {
      return String(resolved)
    }
  })
}

/**
 * Walk the arguments object and template-substitute every string-typed value.
 * Object/array values are recursed; non-string scalar values pass through.
 *
 * Exported for testability.
 */
export function substituteArguments(
  args: Record<string, unknown>,
  hookInputObj: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(args)) {
    out[k] = substituteValue(v, hookInputObj)
  }
  return out
}

function substituteValue(
  v: unknown,
  hookInputObj: Record<string, unknown>,
): unknown {
  if (typeof v === 'string') {
    return substituteTemplate(v, hookInputObj)
  }
  if (Array.isArray(v)) {
    return v.map(item => substituteValue(item, hookInputObj))
  }
  if (v && typeof v === 'object') {
    return substituteArguments(v as Record<string, unknown>, hookInputObj)
  }
  return v
}

/**
 * Execute an mcp_tool hook by calling a tool exposed by an already-connected
 * MCP server. Returns a HookResult similar to the other exec*Hook handlers.
 *
 * The hook input JSON is parsed and used as a template substitution source so
 * that `arguments` may reference `${tool_input.x}`, `${tool_response.y}`,
 * `${session_id}` etc.
 */
export async function execMcpToolHook(
  hook: McpToolHook,
  hookName: string,
  hookEvent: HookEvent,
  jsonInput: string,
  signal: AbortSignal,
  toolUseContext: ToolUseContext,
  toolUseID: string | undefined,
): Promise<HookResult> {
  const effectiveToolUseID = toolUseID || `hook-${randomUUID()}`

  const timeoutMs = hook.timeout
    ? hook.timeout * 1000
    : DEFAULT_MCP_TOOL_HOOK_TIMEOUT_MS

  const { signal: combinedSignal, cleanup: cleanupSignal } =
    createCombinedAbortSignal(signal, { timeoutMs })

  try {
    // 1. Locate the connected MCP server by name in appState
    const appState = toolUseContext.getAppState()
    const clientConn = appState.mcp.clients.find(c => c.name === hook.mcpServer)

    if (!clientConn) {
      cleanupSignal()
      const stderr = `MCP server "${hook.mcpServer}" is not registered in this session`
      logForDebugging(`Hooks: mcp_tool hook error: ${stderr}`)
      return {
        hook,
        outcome: 'non_blocking_error',
        message: createAttachmentMessage({
          type: 'hook_non_blocking_error',
          hookName,
          toolUseID: effectiveToolUseID,
          hookEvent,
          stderr,
          stdout: '',
          exitCode: 1,
        }),
      }
    }

    if (clientConn.type !== 'connected') {
      cleanupSignal()
      const stderr = `MCP server "${hook.mcpServer}" is not connected (state: ${clientConn.type})`
      logForDebugging(`Hooks: mcp_tool hook error: ${stderr}`)
      return {
        hook,
        outcome: 'non_blocking_error',
        message: createAttachmentMessage({
          type: 'hook_non_blocking_error',
          hookName,
          toolUseID: effectiveToolUseID,
          hookEvent,
          stderr,
          stdout: '',
          exitCode: 1,
        }),
      }
    }

    // 2. Substitute templates in arguments using hookInput
    const hookInputObj =
      (safeParseJSON(jsonInput) as Record<string, unknown> | null) ?? {}
    const rawArgs = hook.arguments ?? {}
    const substitutedArgs = substituteArguments(rawArgs, hookInputObj)

    logForDebugging(
      `Hooks: mcp_tool hook calling ${hook.mcpServer}::${hook.tool} with ${Object.keys(substitutedArgs).length} arg(s)`,
    )

    // 3. Call the MCP tool through the existing SDK client
    const result = await clientConn.client.callTool(
      {
        name: hook.tool,
        arguments: substitutedArgs,
      },
      CallToolResultSchema,
      {
        signal: combinedSignal,
        timeout: timeoutMs,
      },
    )

    cleanupSignal()

    // 4. Detect tool-side errors (MCP returns isError:true rather than throwing)
    if (result && typeof result === 'object' && 'isError' in result && result.isError) {
      const stderr = jsonStringify(result.content ?? result)
      logForDebugging(`Hooks: mcp_tool hook returned isError=true: ${stderr}`)
      return {
        hook,
        outcome: 'non_blocking_error',
        message: createAttachmentMessage({
          type: 'hook_non_blocking_error',
          hookName,
          toolUseID: effectiveToolUseID,
          hookEvent,
          stderr,
          stdout: '',
          exitCode: 1,
        }),
      }
    }

    // 5. Stringify the content blocks for the success attachment stdout
    const stdout = jsonStringify(result?.content ?? result ?? '')

    logForDebugging(`Hooks: mcp_tool hook ${hook.mcpServer}::${hook.tool} success`)

    return {
      hook,
      outcome: 'success',
      message: createAttachmentMessage({
        type: 'hook_success',
        hookName,
        toolUseID: effectiveToolUseID,
        hookEvent,
        content: stdout,
        stdout,
        stderr: '',
        exitCode: 0,
      }),
    }
  } catch (error) {
    cleanupSignal()

    if (combinedSignal.aborted) {
      return {
        hook,
        outcome: 'cancelled',
      }
    }

    const errorMsg = errorMessage(error)
    logForDebugging(`Hooks: mcp_tool hook error: ${errorMsg}`)
    return {
      hook,
      outcome: 'non_blocking_error',
      message: createAttachmentMessage({
        type: 'hook_non_blocking_error',
        hookName,
        toolUseID: effectiveToolUseID,
        hookEvent,
        stderr: `Error executing mcp_tool hook: ${errorMsg}`,
        stdout: '',
        exitCode: 1,
      }),
    }
  }
}
