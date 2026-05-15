// Input: 外部模块（cli/handlers/agentView.tsx）
// Output: AgentView 公开 API（组件 + 类型）
// Pos: src/components/AgentView/ —— 统一导出口，避免外部模块跨文件深引用

export {
  AgentViewDashboard,
  getLastExitAction,
  _resetLastExitActionForTests,
  type AgentViewExitAction,
} from './AgentViewDashboard.js'
export { PeekPanel } from './PeekPanel.js'
export { SessionRow } from './SessionRow.js'
export { StatusGrouping } from './StatusGrouping.js'
export {
  readRoster,
  removeRosterEntry,
  renameEntry,
  togglePinned,
  touchEntry,
  upsertRosterEntry,
} from './roster.js'
export { enumerateSessions } from './sessionEnumerator.js'
export { useAgentViewState } from './useAgentViewState.js'
export {
  createKeyHandler,
  useAgentViewKeybindings,
  type AgentViewCallbacks,
} from './useAgentViewKeybindings.js'
export * from './types.js'
