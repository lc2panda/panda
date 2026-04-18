// Input: 无（纯类型 + 常量）
// Output: TurnRole 类型 / ROLE_TOKEN palette key 映射 / ROLE_LABEL 顶标文案
// Pos: MatrixTheme chrome 共享数据源；TurnGutter / TurnHeader / TurnSeparator 等统一引用
// 一旦我被修改，请更新 MatrixTheme/README.md
//
// [NEW-FILE:#20260418-21]
// 设计目标：v3 P1 — 之前 TurnGutter.tsx / TurnHeader.tsx 各自硬编码同一份 ROLE_TOKEN/ROLE_LABEL，
// 抽到独立模块消除冗余。后续 P3 OPERATOR-NEO chrome 改 ROLE_LABEL 即可全局生效。

/**
 * 单条 message 在 chrome 视角下的身份。
 * - user     → OPERATOR（指挥官输入）
 * - panda    → PANDA（assistant 文本响应）
 * - tool     → tool 调用 / 结果块
 * - thinking → 内省思考块
 */
export type TurnRole = 'user' | 'panda' | 'tool' | 'thinking'

/**
 * TurnRole → MATRIX_UI[token] 的 palette key 映射。
 * 值必须是 MATRIX_UI / MATRIX_UI_LIGHT 都存在的 key。
 */
export const ROLE_TOKEN: Readonly<Record<TurnRole, 'userGutter' | 'pandaGutter' | 'toolGutter' | 'thinkingGutter'>> = {
  user: 'userGutter',
  panda: 'pandaGutter',
  tool: 'toolGutter',
  thinking: 'thinkingGutter',
} as const

/**
 * TurnRole → 顶标文案（OPERATOR-NEO chrome v3）。
 *
 * v3 升级：'you' → 'OPERATOR'，'panda' → 'PANDA'（全大写映射 Matrix HUD 字幕风）。
 * 'tool' / 'thinking' 保持小写（次级身份，不抢主角戏份）。
 */
export const ROLE_LABEL: Readonly<Record<TurnRole, string>> = {
  user: 'OPERATOR',
  panda: 'PANDA',
  tool: 'tool',
  thinking: 'thinking',
}
