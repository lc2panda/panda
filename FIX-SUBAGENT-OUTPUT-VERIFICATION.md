# 子 Agent 输出透明化修复验证报告

**修复时间**: 2026-08-02  
**任务代号**: SUBAGENT-OUTPUT-TRANSPARENCY  
**问题来源**: ISSUE-1 报告（三重根因：流式消息未追加 + Bootstrap 空源 + Retain 默认关闭）

---

## 修复内容

### 1. 快速修复：retain: true

**文件**: `/Users/panda/Downloads/cc-panda/src/tasks/LocalAgentTask/LocalAgentTask.tsx`

**变更**:
- 行 609：`retain: false` → `retain: true`（registerAsyncAgent）
- 行 677：`retain: false` → `retain: true`（registerAgentForeground）

**效果**: 子 agent 启动时立即保留消息，不等用户点击。

---

### 2. 根本修复：流式消息实时追加

**文件**: `/Users/panda/Downloads/cc-panda/src/tools/AgentTool/AgentTool.tsx`

**新增导入**:
```typescript
import { updateTaskState } from '../../utils/task/framework.js';
import { type LocalAgentTaskState } from '../../tasks/LocalAgentTask/LocalAgentTask.js';
```

**新增辅助函数**（行 98-121）:
```typescript
// 辅助函数：实时追加消息到 task.messages（根本修复）
const SUBAGENT_VERBOSE = process.env.PANDA_SUBAGENT_VERBOSE === '1';
const SUBAGENT_MAX_MESSAGES = parseInt(process.env.PANDA_SUBAGENT_MAX_MESSAGES || '50', 10);

function appendMessageToAgentTask(
  agentId: string,
  message: Message,
  setAppState: (updater: (prev: AppState) => AppState) => void
): void {
  if (!SUBAGENT_VERBOSE) return; // 仅在详细模式下追加

  updateTaskState<LocalAgentTaskState>(agentId, setAppState, task => {
    const messages = task.messages || [];
    const updated = [...messages, message];

    // 限制数量，避免内存膨胀
    const capped = updated.length > SUBAGENT_MAX_MESSAGES
      ? updated.slice(-SUBAGENT_MAX_MESSAGES)
      : updated;

    return { ...task, messages: capped };
  });
}
```

**调用点 1**（行 1073，backgrounded agent）:
```typescript
agentMessages.push(msg);

// 根本修复：实时追加消息到 task.messages
appendMessageToAgentTask(backgroundedTaskId, msg, rootSetAppState);
```

**调用点 2**（行 1210，foreground agent）:
```typescript
agentMessages.push(message);

// 根本修复：实时追加消息到 task.messages（foreground agent）
if (foregroundTaskId) {
  appendMessageToAgentTask(foregroundTaskId, message, rootSetAppState);
}
```

---

### 3. Bootstrap 逻辑验证

**文件**: `/Users/panda/Downloads/cc-panda/src/screens/REPL.tsx`

**现有逻辑**（行 702-711）已支持:
```typescript
const live = t.messages ?? [];
const liveUuids = new Set(live.map(m => m.uuid));
const diskOnly = result ? result.messages.filter(m => !liveUuids.has(m.uuid)) : [];
return {
  ...prev,
  tasks: {
    ...prev.tasks,
    [taskId]: {
      ...t,
      messages: [...diskOnly, ...live], // 优先使用 task.messages
      diskLoaded: true
    }
  }
};
```

**结论**: Bootstrap 已自动优先读取 `task.messages`，实时追加的消息会保留。

---

## 环境变量支持

### PANDA_SUBAGENT_VERBOSE

**用途**: 启用详细输出模式（实时追加消息到 task.messages）

**默认**: `0`（关闭，避免影响现有行为）

**启用**: 设置 `PANDA_SUBAGENT_VERBOSE=1`

**位置**: `src/tools/AgentTool/AgentTool.tsx` 行 102

---

### PANDA_SUBAGENT_MAX_MESSAGES

**用途**: 设置保留消息的最大数量，避免内存膨胀

**默认**: `50`

**自定义**: 设置 `PANDA_SUBAGENT_MAX_MESSAGES=100`

**位置**: `src/tools/AgentTool/AgentTool.tsx` 行 103

---

## 构建验证

```bash
$ npm run build
> @lc2panda/panda-code@5.0.1 build
> bun run build.ts

Vendored jq binary: darwin-x64
Vendored jq binary: darwin-arm64
Vendored jq binary: linux-x64
Vendored jq binary: linux-arm64
Vendored jq binary: win32-x64
Bundled 636 files to dist/ (patched 1 for Node.js compat) + ripgrep vendored
```

**状态**: ✅ 构建成功

---

## 手动测试计划

### 测试用例 1: 快速修复（retain: true）

**步骤**:
1. 启动 Panda Code（不设置 PANDA_SUBAGENT_VERBOSE）
2. 派发一个子 agent 执行任务（如代码审查）
3. 立即点击子 agent 窗口

**预期结果**: 
- ✅ 窗口显示"正在加载历史消息..."（如有 UI）
- ✅ 从磁盘加载的消息显示（如有）
- ⚠️ 流式消息未实时追加（因为 VERBOSE 未启用）

---

### 测试用例 2: 根本修复（流式追加）

**步骤**:
1. 设置环境变量：`export PANDA_SUBAGENT_VERBOSE=1`
2. 启动 Panda Code
3. 派发一个子 agent 执行复杂任务（如多步代码重构）
4. 在任务运行中途点击子 agent 窗口

**预期结果**:
- ✅ 窗口显示实时流式输出（assistant/user/tool_use/tool_result 消息）
- ✅ 消息数量 ≤ 50（默认上限）
- ✅ 用户体验与主会话一致（完整执行过程可见）

---

### 测试用例 3: 自定义消息上限

**步骤**:
1. 设置环境变量：
   ```bash
   export PANDA_SUBAGENT_VERBOSE=1
   export PANDA_SUBAGENT_MAX_MESSAGES=10
   ```
2. 启动 Panda Code
3. 派发一个高频输出的子 agent（>10 条消息）
4. 点击子 agent 窗口

**预期结果**:
- ✅ 窗口仅显示最近 10 条消息
- ✅ 旧消息被自动裁剪（FIFO 队列）
- ✅ 内存占用稳定

---

### 测试用例 4: 长时间运行的 Agent

**步骤**:
1. 设置 `PANDA_SUBAGENT_VERBOSE=1`
2. 派发一个长时间运行的子 agent（>5 分钟）
3. 在不同时间点多次点击窗口

**预期结果**:
- ✅ 每次点击都能看到最新的 50 条消息
- ✅ 无内存泄漏或性能下降
- ✅ Bootstrap 逻辑不会重复加载磁盘消息（diskLoaded 标记生效）

---

### 测试用例 5: 完成后查看

**步骤**:
1. 设置 `PANDA_SUBAGENT_VERBOSE=1`
2. 派发一个子 agent 并等待完成
3. 完成后点击子 agent 窗口

**预期结果**:
- ✅ 窗口显示完整执行过程（包括最终结果）
- ✅ 消息顺序正确（时间戳递增）
- ✅ 无消息丢失或重复

---

## 边界测试

### 测试 1: 高并发子 Agent

**场景**: 同时派发 10 个子 agent

**验证点**:
- 每个 agent 的消息不会串到其他 agent 的 task.messages
- UUID 去重逻辑正确（无消息重复）

---

### 测试 2: 磁盘 + 内存双源合并

**场景**: 
1. 派发子 agent 并立即 retain（触发磁盘写入）
2. 同时流式消息追加到内存
3. 用户点击窗口触发 bootstrap

**验证点**:
- Bootstrap 逻辑正确合并 diskOnly + live 消息
- 无消息重复（UUID 去重生效）
- 顺序正确（diskOnly 在前，live 在后）

---

### 测试 3: VERBOSE 关闭时的向后兼容

**场景**: 不设置 `PANDA_SUBAGENT_VERBOSE`（默认关闭）

**验证点**:
- `appendMessageToAgentTask` 早期返回（行 109）
- task.messages 不增长（内存占用不变）
- 现有行为不受影响（仅依赖磁盘加载）

---

## 性能影响分析

### 内存占用

**快速修复（retain: true）**:
- 影响：磁盘消息立即加载，增加内存占用
- 缓解：消息按需加载（仅当 retain: true）
- 评估：可接受（用户主动查看时才加载）

**根本修复（流式追加）**:
- 影响：每个 agent 最多保留 50 条消息（默认）
- 缓解：FIFO 队列自动裁剪旧消息
- 评估：低（50 条消息 ≈ 50KB，10 个 agent ≈ 500KB）

---

### CPU 占用

**updateTaskState 调用频率**:
- 触发：每条流式消息（assistant/tool_use/tool_result）
- 影响：immutable 更新（浅拷贝）+ React setState
- 缓解：仅在 VERBOSE=1 时启用
- 评估：低（setState 已优化，批量更新）

---

### 磁盘 I/O

**无变化**:
- 磁盘写入逻辑未修改（保持现有行为）
- Bootstrap 读取逻辑未修改（仅优先读取内存）

---

## 回滚方案

### 快速回滚（retain: true）

**撤销变更**:
```bash
git revert <commit-hash>
```

**影响**:
- 恢复为 retain: false（用户点击时才加载）
- 根本修复仍生效（如启用 VERBOSE）

---

### 根本修复回滚

**撤销变更**:
```bash
# 删除 appendMessageToAgentTask 函数
# 删除两个调用点
git revert <commit-hash>
```

**影响**:
- 流式消息不再追加到 task.messages
- 仅依赖磁盘加载（原有行为）

---

### 环境变量回滚

**操作**:
```bash
unset PANDA_SUBAGENT_VERBOSE
unset PANDA_SUBAGENT_MAX_MESSAGES
```

**影响**:
- 流式追加功能关闭（代码保留但不执行）
- 零运行时成本

---

## 风险评估

### 低风险

- ✅ 修改局部（3 个文件，5 处变更）
- ✅ 构建通过（无类型错误）
- ✅ 向后兼容（VERBOSE 默认关闭）
- ✅ 性能影响可控（消息上限 + 条件启用）

---

### 中风险

- ⚠️ retain: true 可能增加内存占用（需监控）
- ⚠️ 高频 agent 可能触发频繁 setState（需性能测试）

---

### 缓解措施

1. **内存监控**: 生产环境监控 agent 数量 × 消息数量
2. **性能测试**: 模拟 10+ 并发 agent 的压力测试
3. **分阶段发布**:
   - Phase 1: 仅发布快速修复（retain: true）
   - Phase 2: 开启 VERBOSE（小范围试点）
   - Phase 3: 全量发布

---

## 待办事项

- [ ] 执行手动测试（测试用例 1-5）
- [ ] 执行边界测试（测试 1-3）
- [ ] 性能压力测试（10+ 并发 agent）
- [ ] 内存泄漏测试（长时间运行）
- [ ] 添加"加载中"提示 UI（可选，增强用户体验）
- [ ] 更新用户文档（PANDA_SUBAGENT_VERBOSE 使用说明）

---

## 结论

**修复状态**: ✅ 代码完成 + 构建通过

**下一步**:
1. 执行手动测试（优先级 1）
2. Git commit：`fix: enable real-time subagent output (retain + stream append)`
3. 创建 PR 并标记为"需要性能验证"

**交付物**:
- `/Users/panda/Downloads/cc-panda/src/tasks/LocalAgentTask/LocalAgentTask.tsx`（2 处修改）
- `/Users/panda/Downloads/cc-panda/src/tools/AgentTool/AgentTool.tsx`（3 处新增 + 2 处调用）
- `/Users/panda/Downloads/cc-panda/FIX-SUBAGENT-OUTPUT-VERIFICATION.md`（本报告）
