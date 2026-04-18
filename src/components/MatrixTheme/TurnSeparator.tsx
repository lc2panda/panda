// Input: turnIndex（参考用 — 当前版本 v3.2 已不再渲染任何分隔符）
// Output: 始终返回 null — turn 之间走纯空白留白，由 TurnHeader marginTop 提供节奏
// Pos: Messages.tsx roleChanged 处 TurnHeader 之前；保留组件接口便于后续复活
// 一旦我被修改，请更新 MatrixTheme/README.md
//
// v3.2（指挥官二次实测反馈）：5-turn 一次的 katakana 彩蛋（ｱ ﾑ 7 ﾝ ﾄ ﾞ）虽稀疏但仍易误读，
// 且与正文同色相争夺注意力，决定彻底移除。组件保留为 null-renderer，避免删除后引发
// Messages.tsx + smoke test 的连锁改动；后续若要复活分隔符直接修改本文件即可。

import * as React from 'react';

interface Props {
  /** 参考 turn 序号（保留 prop 接口，当前实现忽略） */
  turnIndex: number;
}

export function TurnSeparator(_props: Props): React.ReactNode {
  return null;
}
