# commands/goal — `/goal` slash command

- `index.ts` — command metadata, lazy-loads `goal.ts`.
- `goal.ts` — set / clear / status handler (writes `state/goalStore.ts`).
- `README.md` — this file.

## 用法（对齐 Claude Code 官方公开行为）

```text
/goal <condition>       # 设置目标（≤ 4000 字符）
/goal                   # 查看状态（turns / tokens / elapsed / last reason）
/goal clear             # 清除（别名：stop / off / reset / none / cancel）
panda --goal "<cond>"   # CLI flag, 在启动时绑定（适用 -p 与交互模式）
```

## 工作原理

1. `/goal <condition>` 写入 `state/goalStore.ts`（session 内 module-level singleton）。
2. 每个 turn 结束（assistant 消息无 tool_use）后，`query/stopHooks.ts` 调用 `services/goalEvaluator.ts`，用 small fast model evaluator 评估当前对话是否满足 condition。
3. 评估返回 `{met: true|false, reason}`：
   - `met=true` → 注入 `Goal completed: <reason>` 系统消息，清除 store。
   - `met=false` → 把 nudge 当作 blocking error 注入 query loop，下一 turn 继续。
   - 解析失败 / API error / abort → 记录 turn 但不 nudge（避免 evaluator outage 引发死循环）。
4. UI 上：`components/GoalIndicator.tsx` 订阅 store，REPL 底部展示 `◎ /goal active` 与 turns / elapsed / tokens。
5. `--resume` / `--continue` 从 transcript marker 恢复 active goal；恢复后计数、token 与计时 baseline 按当前实现重置为新会话基线。

## 安全护栏

- 最长 4000 字符；启动时与运行时都校验。
- 不设置 goal 专属固定 turn 上限；持续执行直到 evaluator 判定满足、用户 `/goal clear`、`/clear` 开新对话、evaluator/请求失败不再 nudge、abort/中断，或其他全局 query loop / 权限 / 错误机制停止。
- 如需限制轮数，请把限制写进 condition，例如：`/goal fix the failing test or stop after 5 turns`。
- 只在 `querySource === 'repl_main_thread' | 'sdk'` 时评估（背景 fork 例如 extract-memories、auto-dream 不会触发）。
- 是 teammate 时跳过评估（goal 绑定 leader session）。
- abort 信号已触发 → 直接跳过评估。
- policy gate 会阻止在受限策略下设置或执行 goal evaluator。

一旦这里的结构发生变化，请务必更新我。
