// Input: assistant mode queries and lifecycle calls from main.tsx, REPL, bridge
// Output: mode state, initialization, system prompt addendum
// Pos: central assistant gate — consumed by main.tsx startup, /assistant command, bridge, REPL
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"
//
// Previously: Auto-generated stub (all no-ops).
// Phase 1.1: real implementation backed by bootstrap state + AppStateStore.

import { getKairosActive, setKairosActive } from '../bootstrap/state.js'

let _forced = false
let _activationPath: string | undefined

export function isAssistantMode(): boolean {
  return _forced || getKairosActive()
}

export async function initializeAssistantTeam(): Promise<void> {
  setKairosActive(true)
  if (!_activationPath) {
    _activationPath = _forced ? 'forced' : 'slash_command'
  }
}

export function markAssistantForced(): void {
  _forced = true
  _activationPath = 'cli_flag'
}

export function isAssistantForced(): boolean {
  return _forced
}

export function getAssistantSystemPromptAddendum(): string {
  if (!isAssistantMode()) return ''
  return `You are operating in assistant mode (Kairos). You are an always-on coding assistant with persistent context. Be proactive — suggest improvements, flag issues, and anticipate the user's needs. Maintain continuity across turns.`
}

export function getAssistantActivationPath(): string | undefined {
  return isAssistantMode() ? _activationPath : undefined
}
