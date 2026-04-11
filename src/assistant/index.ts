// Input: assistant mode queries and lifecycle calls from main.tsx, REPL, bridge
// Output: mode state, initialization, system prompt addendum
// Pos: central assistant gate — consumed by main.tsx startup, /assistant command, bridge, REPL
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"
//
// Previously: Auto-generated stub (all no-ops).
// Phase 1.1: real implementation backed by bootstrap state + AppStateStore.
// Phase 2.2: wired to proactive engine — /assistant activates scheduled tasks.

import { getKairosActive, setKairosActive } from '../bootstrap/state.js'
import { activateProactive, deactivateProactive, isProactiveActive } from '../proactive/index.js'

let _forced = false
let _activationPath: string | undefined
let _assistantOwnedProactive = false

export function isAssistantMode(): boolean {
  return _forced || getKairosActive()
}

export async function initializeAssistantTeam(
  mcpClients?: ReadonlyArray<{ name: string; type?: string; client?: unknown }>,
): Promise<void> {
  setKairosActive(true)
  if (!_activationPath) {
    _activationPath = _forced ? 'forced' : 'slash_command'
  }
  // Assistant mode activates proactive engine for scheduled tasks (dream, briefing, health).
  // Track ownership so deactivation only stops proactive if assistant started it.
  if (!isProactiveActive()) {
    activateProactive('assistant')
    _assistantOwnedProactive = true
  }

  // 主动扫描已连接的 channel MCP server 并注册到 channelRegistry。
  // 解决 /assistant 启动后、用户尚未发送任何 inbound 消息时，pushViaChannelMCP
  // 永远空跑的问题。print.ts 的 handleChannelEnable 只在控制请求路径触发，
  // useManageMCPConnections 的 register 分支也只挂 notification handler，
  // 均未回填 registry，这里显式补齐。
  if (mcpClients && mcpClients.length > 0) {
    try {
      const { registerChannelServer } = await import('./channelRegistry.js')
      for (const c of mcpClients) {
        if (!c || c.type !== 'connected' || !c.client) continue
        if (c.name.startsWith('plugin:wechat:') || c.name.startsWith('plugin:feishu:')) {
          registerChannelServer(c.name, c.client as never)
        }
      }
    } catch {}
  }
}

export function deactivateAssistant(): void {
  if (!isAssistantMode()) return
  setKairosActive(false)
  _forced = false
  _activationPath = undefined
  // Only deactivate proactive if assistant owns it (user may have /proactive on independently)
  if (_assistantOwnedProactive) {
    deactivateProactive()
    _assistantOwnedProactive = false
  }
}

export function markAssistantForced(): void {
  _forced = true
  _activationPath = 'cli_flag'
}

export function isAssistantForced(): boolean {
  return _forced
}

export async function getAssistantSystemPromptAddendum(): Promise<string> {
  if (!isAssistantMode()) return ''
  const baseAddendum = `You are operating in assistant mode (Kairos). You are an always-on coding assistant with persistent context. Be proactive — suggest improvements, flag issues, and anticipate the user's needs. Maintain continuity across turns.`

  let episodicContext = ''
  try {
    const { loadRecentEpisodes } = await import('../memdir/memdir.js')
    const episodes = await loadRecentEpisodes(3)
    if (episodes) {
      episodicContext = `\n\n## 最近会话情景记忆\n${episodes}`
    }
  } catch {}

  return baseAddendum + episodicContext
}

export function getAssistantActivationPath(): string | undefined {
  return isAssistantMode() ? _activationPath : undefined
}
