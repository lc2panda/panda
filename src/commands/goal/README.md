# commands/goal — `/goal` slash command

- `index.ts` — command metadata, lazy-loads `goal.ts`.
- `goal.ts` — set / clear / status handler (writes `state/goalStore.ts`).
- `README.md` — this file.

## 用法 (mirrors upstream Claude Code v2.1.139)

```text
/goal <condition>       # 设置目标（≤ 4000 字符）
/goal                   # 查看状态（turns / tokens / elapsed / last reason）
/goal clear             # 清除（别名：stop / off / reset / none / cancel）
panda --goal "<cond>"   # CLI flag, 在启动时就绑定（适用 -p 与交互模式）
```

## 工作原理

1. `/goal <condition>` 写入 `state/goalStore.ts`（session 内 module-level singleton）。
2. 每个 turn 结束（assistant 消息无 tool_use）后，`query/stopHooks.ts` 调用 `services/goalEvaluator.ts`，用 small fast model（Haiku）评估当前对话是否满足 condition。
3. 评估返回 `{met: true|false, reason}`：
   - `met=true` → 注入 `Goal completed: <reason>` 系统消息，清除 store。
   - `met=false` → 把 nudge 当作 blocking error 注入 query loop，下一 turn 继续。
   - 解析失败 / API error → 记录 turn 但不 nudge（避免 evaluator outage 引发死循环）。
4. UI 上：`components/GoalIndicator.tsx` 订阅 store，REPL 底部展示 `◎ /goal active`。

## 安全护栏

- 最长 4000 字符；启动时与运行时都校验。
- `maxTurns` 软上限默认 50；触顶自动 `clearGoal()` + warning 系统消息。
- 只在 `querySource === 'repl_main_thread' | 'sdk'` 时评估（背景 fork 例如 extract-memories、auto-dream 不会触发）。
- 是 teammate 时跳过评估（与上游一致：goal 绑定 leader session）。
- abort 信号已触发 → 直接跳过评估。

## 与上游 v2.1.139 的偏差

- panda 未实现 Remote Control 路径（task 要求里明确跳过）。
- panda 未做 `--resume` 时从 transcript 恢复 condition；目前用 `setAtMs` reset 后等同新会话开始；与上游 "turn 计数/timer/token baseline 重置但 condition 保留" 还有差距 — 待后续 milestone。
- `disableAllHooks` / `allowManagedHooksOnly` 模式下 panda 仍允许 /goal 运行 — 因为 panda 的 goal 评估走 `services/goalEvaluator.ts` 内部直连，不走用户 hook 配置。

一旦这里的结构发生变化，请务必更新我。
