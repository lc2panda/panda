// Input: role
// Output: React Context，让深层子组件 useTurnRole() 拿到当前 turn 身份
// Pos: 配合 TurnGutter 使用，避免 prop drilling
// 一旦我被修改，请更新 MatrixTheme/README.md
//
// [NEW-FILE:#20260418-03]
// 用途：MessageResponse 等位于消息子树深处的组件不必接收 role prop，
// 通过 useTurnRole() 即可读取最近一层 TurnGutterProvider 提供的 role。

import * as React from 'react'
import type { TurnRole } from './TurnGutter.js'

const Ctx = React.createContext<TurnRole | null>(null)

interface Props {
  role: TurnRole
  children: React.ReactNode
}

export function TurnGutterProvider({ role, children }: Props): React.ReactNode {
  return <Ctx.Provider value={role}>{children}</Ctx.Provider>
}

export function useTurnRole(): TurnRole | null {
  return React.useContext(Ctx)
}
