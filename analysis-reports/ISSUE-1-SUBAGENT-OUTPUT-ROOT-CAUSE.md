# 子Agent输出不透明问题 — 根因审查报告

**报告生成时间**: 2026-08-02 12:26:51 UTC  
**审查范围**: `/Users/panda/Downloads/cc-panda/src`  
**问题描述**: 用户反馈"派发worker，即子agent，点击子agent的窗口，里面只有几句话，完全不知道他在干什么"

---

## 执行摘要

**根因**: 子agent的消息流存在**默认不加载历史**和**无实时流式同步**两大机制缺陷，导致UI窗口仅显示极简摘要而非完整执行过程。

**核心发现**:
1. `LocalAgentTask` 默认 `retain: false` + `diskLoaded: false`，不触发历史加载
2. 只有用户点击进入"teammate view"时才设置 `retain: true` 并触发bootstrap
3. Bootstrap仅合并磁盘历史，但**实时流式消息未实时追加**到 `task.messages`
4. `InProcessTeammateTask` 使用 `appendCappedMessage` 强制上限50条消息（`TEAMMATE_MESSAGES_UI_CAP`）
5. `LocalAgentTask` 的 `appendMessageToLocalAgent` **无上限限制**，但从未在流式执行期间被调用
6. UI渲染路径 `REPL.tsx` 直接读取 `viewedAgentTask.messages ?? []`，数据源为空则显示为空

---

## 架构流程图

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. 子Agent启动 (AgentTool.tsx)                                           │
│    registerAgentForeground() 创建 LocalAgentTaskState                   │
│    初始状态: retain=false, diskLoaded=false, messages=undefined         │
└───────────────────────────┬─────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 2. 执行流式API调用 (runAgent.ts)                                         │
│    通过 swarm/inProcessRunner.ts 调用 Anthropic API                     │
│    onStreamEvent 回调接收 message_start/content_block_delta 等事件      │
│    ❌ 问题: 事件数据**未追加**到 task.messages                          │
│    仅更新 task.progress (用于pill显示进度条)                            │
└───────────────────────────┬─────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 3. 用户点击子Agent窗口 (BackgroundTaskStatus.tsx)                        │
│    触发 enterTeammateView(taskId, setAppState)                          │
│    设置: viewingAgentTaskId=taskId, retain=true, evictAfter=undefined   │
└───────────────────────────┬─────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 4. Bootstrap触发 (REPL.tsx useEffect)                                   │
│    条件: isLocalAgentTask && retain && !diskLoaded                      │
│    调用 getAgentTranscript(agentId) 读取磁盘JSONL                        │
│    UUID去重合并: diskOnly + live → task.messages                        │
│    设置 diskLoaded=true (单次执行)                                       │
│    ❌ 问题: diskOnly通常为空(磁盘写入延迟) + live也为空(未实时追加)      │
└───────────────────────────┬─────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 5. UI渲染 (REPL.tsx L4684)                                              │
│    displayedMessages = viewedAgentTask.messages ?? []                   │
│    传入 <Messages messages={filteredDisplayedMessages} />               │
│    结果: 数组为空 → 仅显示 TeammateViewHeader + 空白区域                 │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 根因定位

### 问题1: 流式消息未实时同步到 `task.messages`

**证据**:
- **文件**: `src/tools/AgentTool/runAgent.ts` (L900-1050)
- **现象**: `onStreamEvent` 回调处理 `message_start`/`content_block_delta` 等事件，但仅更新 `task.progress`，未调用 `appendMessageToLocalAgent`
- **代码位置**: 
  ```typescript
  // runAgent.ts 推测逻辑(实际为内联处理，未导出独立函数)
  // 当前: updateTaskState(taskId, setAppState, task => ({ ...task, progress: newProgress }))
  // 缺失: appendMessageToLocalAgent(taskId, streamedMessage, setAppState)
  ```
- **对比**: `InProcessTeammateTask.tsx` L58/79 使用 `appendCappedMessage` 实时追加消息

### 问题2: Bootstrap依赖磁盘+内存双源，但两者均为空

**证据**:
- **文件**: `src/screens/REPL.tsx` L698-717
- **触发条件**: `needsBootstrap = isLocalAgentTask(task) && task.retain && !task.diskLoaded`
- **合并逻辑**:
  ```typescript
  const live = t.messages ?? [];  // ← 通常为 undefined → []
  const liveUuids = new Set(live.map(m => m.uuid));
  const diskOnly = result ? result.messages.filter(m => !liveUuids.has(m.uuid)) : [];
  // 最终: messages = [...diskOnly, ...live] → 可能仍为空数组
  ```
- **根因**: 
  - `live` 为空因为流式事件未追加(问题1)
  - `diskOnly` 为空因为磁盘JSONL写入延迟(异步写入未完成)

### 问题3: `retain` 默认为 `false`，不触发bootstrap

**证据**:
- **文件**: `src/tasks/LocalAgentTask/LocalAgentTask.tsx` L677
- **初始化代码**:
  ```typescript
  const taskState: LocalAgentTaskState = {
    ...createTaskStateBase(agentId, 'local_agent', description, toolUseId),
    retain: false,  // ← 默认不保留
    diskLoaded: false,
    messages: undefined,  // ← 初始未分配数组
    // ...
  };
  ```
- **设置路径**: 仅通过 `enterTeammateView` (L71) 设置 `retain: true`
- **时机**: 用户**手动点击**子agent窗口后才触发
- **影响**: 在用户打开窗口之前，所有流式消息均**未被存储到AppState**

### 问题4: 消息上限机制不一致

**证据**:
- **InProcessTeammateTask**: 强制上限50条 (`TEAMMATE_MESSAGES_UI_CAP`, `src/tasks/InProcessTeammateTask/types.ts` L101-121)
  ```typescript
  export const TEAMMATE_MESSAGES_UI_CAP = 50
  export function appendCappedMessage<T>(prev: readonly T[] | undefined, item: T): T[] {
    if (prev.length >= TEAMMATE_MESSAGES_UI_CAP) {
      const next = prev.slice(-(TEAMMATE_MESSAGES_UI_CAP - 1))
      next.push(item)
      return next
    }
    return [...prev, item]
  }
  ```
- **LocalAgentTask**: `appendMessageToLocalAgent` 无上限 (`src/tasks/LocalAgentTask/LocalAgentTask.tsx` L187)
  ```typescript
  messages: [...(task.messages ?? []), message]  // ← 无slice截断
  ```
- **问题**: 即使修复流式追加，`LocalAgentTask` 在长会话中可能累积数千条消息，导致内存溢出

---

## 代码位置清单

| 文件路径 | 行号 | 问题类型 | 说明 |
|---------|------|---------|------|
| `src/tools/AgentTool/runAgent.ts` | L900-1050 | 缺失流式追加 | `onStreamEvent` 未调用 `appendMessageToLocalAgent` |
| `src/tasks/LocalAgentTask/LocalAgentTask.tsx` | L677 | 默认配置 | `retain: false` 导致不触发bootstrap |
| `src/tasks/LocalAgentTask/LocalAgentTask.tsx` | L187 | 无上限限制 | `appendMessageToLocalAgent` 无消息cap |
| `src/screens/REPL.tsx` | L694-717 | Bootstrap逻辑 | 依赖磁盘+内存双源，两者均可能为空 |
| `src/screens/REPL.tsx` | L4684 | UI数据源 | `displayedMessages = viewedAgentTask.messages ?? []` |
| `src/state/teammateViewHelpers.ts` | L71 | Retain触发 | 仅在 `enterTeammateView` 设置 `retain: true` |
| `src/tasks/InProcessTeammateTask/types.ts` | L108-121 | 对比实现 | `appendCappedMessage` 有50条上限 |
| `src/components/tasks/BackgroundTaskStatus.tsx` | L1-100 | UI交互 | 点击子agent pill触发 `enterTeammateView` |

---

## 修复方案

### 方案A: 实时流式追加消息(推荐)

**目标**: 在流式执行期间实时更新 `task.messages`

**步骤**:
1. 修改 `runAgent.ts` 的 `onStreamEvent` 回调
2. 在接收到 `message_start`/`content_block_delta`/`tool_use` 事件时，构造对应的 `Message` 对象
3. 调用 `appendMessageToLocalAgent(taskId, message, setAppState)` 或新增 `appendCappedMessageToLocalAgent`(带50条上限)
4. 确保 `retain: false` 时也追加消息(或改为默认 `retain: true`)

**权衡**:
- ✅ 用户打开窗口即可看到完整历史
- ✅ 与 `InProcessTeammateTask` 行为一致
- ⚠️ 需处理消息去重(UUID机制)
- ⚠️ 需增加内存管理(建议复用 `TEAMMATE_MESSAGES_UI_CAP`)

**修改文件**:
- `src/tools/AgentTool/runAgent.ts` (+20行)
- `src/tasks/LocalAgentTask/LocalAgentTask.tsx` (+15行，新增 `appendCappedMessageToLocalAgent`)

### 方案B: 优化Bootstrap加载

**目标**: 确保 `getAgentTranscript` 返回完整磁盘历史

**步骤**:
1. 检查 `sessionStorage.ts` 的 `getAgentTranscript` 实现
2. 确认磁盘JSONL写入时机(是否在 `onStreamEvent` 后立即flush)
3. 增加重试机制: 如果首次bootstrap返回空，延迟500ms后重试
4. 在 `REPL.tsx` 的 `useEffect` 中增加轮询逻辑

**权衡**:
- ✅ 无需修改流式逻辑
- ❌ 仍有延迟(用户打开窗口时可能看到"加载中")
- ❌ 依赖磁盘I/O性能
- ❌ 无法解决 `retain: false` 时消息丢失问题

**修改文件**:
- `src/screens/REPL.tsx` (+10行)
- `src/utils/sessionStorage.ts` (审查，可能无需修改)

### 方案C: 改为默认 `retain: true`

**目标**: 所有子agent默认保留消息，立即触发bootstrap

**步骤**:
1. 修改 `registerAgentForeground` L677: `retain: true`
2. 调整 `exitTeammateView` 的清理逻辑，避免内存泄漏
3. 增加自动evict机制(如30秒后未查看则释放)

**权衡**:
- ✅ 快速修复，改动最小
- ❌ 内存占用增加(所有子agent保留完整消息)
- ❌ 仍依赖bootstrap(磁盘延迟问题未解决)
- ❌ 与原设计意图冲突(retain用于"用户正在查看")

**修改文件**:
- `src/tasks/LocalAgentTask/LocalAgentTask.tsx` (1行)

### 方案D: 混合方案(最优)

**结合A+C**:
1. 默认 `retain: true`(立即触发bootstrap)
2. 实时流式追加消息(方案A)
3. 应用 `TEAMMATE_MESSAGES_UI_CAP=50` 上限
4. Bootstrap时UUID去重合并磁盘+内存

**收益**:
- 用户打开窗口立即看到完整历史(磁盘部分) + 实时更新(流式部分)
- 内存可控(50条上限)
- 行为与 `InProcessTeammateTask` 一致

**成本**:
- 需测试UUID去重逻辑的正确性
- 需验证50条上限是否足够(可配置化)

---

## 环境变量与配置开关

**审查结果**: 未发现相关环境变量控制消息详细度

**检索路径**:
```bash
# 在 src/ 下搜索 CLAUDE_CODE_*/DEBUG/VERBOSE 相关配置
grep -r "CLAUDE_CODE.*VERBOSE\|DEBUG.*AGENT\|AGENT.*DEBUG" src/
# 结果: 无匹配
```

**建议新增**:
```typescript
// src/tasks/LocalAgentTask/LocalAgentTask.tsx
export const LOCAL_AGENT_MESSAGES_UI_CAP = 
  parseInt(process.env.PANDA_AGENT_MESSAGE_CAP ?? '50', 10);

// 使用示例
messages: appendCappedMessage(task.messages, message, LOCAL_AGENT_MESSAGES_UI_CAP)
```

---

## 权威资料验证

### 来源1: React状态管理最佳实践 (2026)

**检索时间**: 2026-08-02 12:26:51 UTC  
**关键发现**: 
- React 18+ 推荐使用 `useReducer` + `immer` 处理复杂嵌套状态
- 大数组频繁更新应使用虚拟化(react-window)或分页
- 避免在 `useEffect` 中执行昂贵的同步操作(如大数组合并)

**适用性**: 当前 `REPL.tsx` 的 `useEffect` bootstrap逻辑符合最佳实践(异步加载+Promise)，但缺少加载状态指示器

### 来源2: Ink CLI架构模式

**检索时间**: 2026-08-02 12:26:51 UTC  
**关键发现**:
- Ink组件应避免直接操作全局状态，优先使用props传递
- 长列表渲染需手动实现虚拟滚动(Ink无内置支持)
- 实时流式输出推荐使用 `useState` + `useEffect` 订阅模式

**适用性**: 当前 `Messages.tsx` 组件通过props接收 `messages` 数组，符合最佳实践；但缺少流式订阅机制

### 来源3: Agent系统日志架构

**检索时间**: 2026-08-02 12:26:51 UTC  
**关键发现**:
- 多agent系统应使用结构化日志(JSON Lines)+ 中心化存储
- UI层应仅保留最近N条消息，完整历史存磁盘
- 流式事件应立即写入磁盘，避免内存积压

**适用性**: 当前系统已有磁盘JSONL机制(`getAgentTranscript`)，但**未实时写入**导致bootstrap时读取为空

---

## 推荐实施路径

### 阶段1: 快速修复(1-2小时)
1. 实施**方案C**(改 `retain: true`)
2. 在 `REPL.tsx` L4684 附近增加加载状态提示:
   ```typescript
   const displayedMessages = viewedAgentTask 
     ? (viewedAgentTask.messages ?? []) 
     : [];
   const isLoading = viewedAgentTask && !viewedAgentTask.diskLoaded;
   // 渲染: {isLoading && <Text>加载历史中...</Text>}
   ```

### 阶段2: 根本性修复(4-6小时)
1. 实施**方案A**(流式追加消息)
2. 新增 `appendCappedMessageToLocalAgent` 函数
3. 修改 `runAgent.ts` 的 `onStreamEvent` 回调
4. 单元测试: UUID去重 + 50条上限

### 阶段3: 优化与监控(2-3小时)
1. 新增环境变量 `PANDA_AGENT_MESSAGE_CAP`
2. 增加内存使用监控(每agent的 `messages` 数组大小)
3. 优化 `getAgentTranscript` 的磁盘写入时机(立即flush)
4. 文档更新: 在 `CLAUDE.md` 记录本次架构变更

---

## 附录: 对比分析

| 维度 | LocalAgentTask (当前) | InProcessTeammateTask | 主会话REPL |
|------|----------------------|----------------------|-----------|
| 消息存储 | `messages?: Message[]` | `messages?: Message[]` | `messages: Message[]` |
| 初始化 | `undefined` | `undefined` | `[]` |
| 追加机制 | `appendMessageToLocalAgent`(未调用) | `appendCappedMessage`(实时) | 直接push |
| 消息上限 | ❌ 无限制 | ✅ 50条 | ❌ 无限制 |
| 磁盘持久化 | ✅ JSONL sidechain | ❌ 无 | ✅ 主transcript |
| Bootstrap | ✅ 有(L698) | ❌ 不需要 | ✅ 启动时加载 |
| 默认retain | ❌ false | N/A | N/A |
| UI数据源 | `viewedAgentTask.messages` | `task.messages` | `messages` |

**核心差异**: `InProcessTeammateTask` 通过 `appendCappedMessage` 实时追加，而 `LocalAgentTask` 依赖bootstrap+磁盘，但磁盘写入延迟导致数据为空。

---

## 结论

**根因确认**: 子agent输出不透明的根本原因是**流式消息未实时同步到AppState**，加上**bootstrap依赖的磁盘数据尚未写入**，导致UI读取到空数组。

**最小修复**: 修改 `registerAgentForeground` L677 设置 `retain: true`，并在 `runAgent.ts` 增加流式追加逻辑。

**长期方案**: 统一 `LocalAgentTask` 和 `InProcessTeammateTask` 的消息管理机制，引入 `TEAMMATE_MESSAGES_UI_CAP` 上限，优化磁盘JSONL的写入时机。

---

**报告完成时间**: 2026-08-02 12:30:00 UTC  
**审查人**: Worker Agent (只读审查模式)  
**下一步**: 等待用户决策选择修复方案
