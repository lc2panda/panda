# AgentView · 领地标记

Agent View Tier 1 TUI dashboard — `claude agents` 子命令的交互式入口（v2.1.139 旗舰能力 fork）。

## 文件清单 / 地位 / 功能

- `types.ts` — AgentView 类型（SessionEntry / RosterEntry / Status / ViewMode）。
- `roster.ts` — `~/.pandacc/jobs/roster.json` 读写（pin/name/notes）+ proper-lockfile 并发保护。
- `sessionEnumerator.ts` — 合并 `~/.pandacc/sessions/*.json` + roster.json + transcripts 头尾，输出 SessionEntry[]。
- `icons.ts` — 状态图标 / 颜色（动画 ✻ / ✽ 表示 working，∙ 表示退出，✢ 表示 loop sleep）。
- `useAgentViewState.ts` — Zustand 风格的 dashboard 状态（选中/分组/peek/pendingStop 等）。
- `useAgentViewKeybindings.ts` — 20+ 键位 useInput handler。
- `SessionRow.tsx` — 单行 session 渲染（图标 + 名 + cwd + 摘要 + PR 状态点）。
- `StatusGrouping.tsx` — 按状态/目录分组的展示容器。
- `PeekPanel.tsx` — Space 触发的右侧 peek 面板（最近 N 条消息 + inline reply）。
- `AgentViewDashboard.tsx` — Ink 主组件，组合上述全部。
- `index.ts` — 统一导出口。

## 与主程序的连接

- 入口：`src/cli/handlers/agentView.tsx`（Commander.js `claude agents` 默认动作，无子命令时进入）。
- 子命令保留：`claude agents list` 调用原始 `agentsHandler()`（列出 agent definitions）。

> 一旦这里的结构发生变化，请务必更新我... 就像重新标记领地一样。
