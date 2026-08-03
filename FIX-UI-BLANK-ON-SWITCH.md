# UI切换空白问题修复报告

**问题**：点击切换子agent或返回main时UI显示空白  
**症状**：需要鼠标滚动或再次切换才恢复正常  
**修复时间**：2026-08-02

---

## 根因

`BackgroundTasksDialog` 组件在 `detail` 模式（显示单个agent详情）和 `list` 模式（显示任务列表）之间切换时，React未触发重绘。

**技术细节**：
1. 虽然每个DetailDialog组件都有key属性（如 `key="agent-${task_0.id}"`），但list模式的顶层Box**缺少key属性**
2. React Compiler生成的高度优化代码中，从detail返回list时，React认为是"同一个组件树"的状态变化，复用了DOM节点
3. 由于Ink是终端UI框架，DOM复用后终端缓冲区未被刷新，导致显示空白
4. 只有用户触发滚动或其他UI事件时，才强制重绘

**根本原因**：**缺少区分模式的key属性**，导致React无法识别这是两个不同的渲染分支。

---

## 修复方案

给list模式的顶层Box添加`key="background-tasks-list"`属性，与detail模式的key（如`agent-xxx`）形成明确区分。

**原理**：
- React遇到不同的key值时，会强制销毁旧组件并重新创建新组件
- 这会触发Ink的完整重绘流程，刷新终端缓冲区
- 最小化改动，只添加一个key属性，不改变任何逻辑

---

## 修改位置

**文件**：`src/components/tasks/BackgroundTasksDialog.tsx`  
**行号**：424

### Before
```tsx
return <Box flexDirection="column" tabIndex={0} autoFocus onKeyDown={handleKeyDown}>
    <Dialog title="Background tasks" ...>
```

### After
```tsx
return <Box flexDirection="column" tabIndex={0} autoFocus onKeyDown={handleKeyDown} key="background-tasks-list">
    <Dialog title="Background tasks" ...>
```

---

## 验证结果

- [x] 构建通过（`npm run build` ✓）
- [x] 无新增类型错误（现有13个类型错误与本次修复无关）
- [ ] 手动测试（需要打包后在实际环境验证）

---

## 技术说明

### 为什么这个修复有效？

1. **React key机制**：React使用key来识别组件身份。相同key = 更新现有组件；不同key = 销毁旧组件 + 创建新组件。

2. **修复前的问题**：
   ```
   list模式: <Box> (无key)
   detail模式: <Box key="agent-123"> (有key，但在不同的返回语句)
   ```
   从detail切换到list时，React看到"两个不同的Box组件"，但没有key区分，可能复用了部分虚拟DOM。

3. **修复后的效果**：
   ```
   list模式: <Box key="background-tasks-list">
   detail模式: <Box key="agent-123">
   ```
   切换时，React检测到key变化（`background-tasks-list` ↔ `agent-123`），强制完全重新渲染。

4. **Ink特殊性**：Ink是基于React的终端UI库，依赖React的渲染周期来刷新终端输出。强制重新渲染确保终端缓冲区被完全刷新。

---

## 下一步验证建议

### 手动测试场景

1. **基础切换测试**：
   ```bash
   # 启动panda
   panda
   
   # 派发一个agent任务
   /agent "分析package.json"
   
   # 测试步骤：
   # 1. 按Shift+Down打开Background tasks列表
   # 2. 选择agent，按Enter进入详情 → 验证立即显示
   # 3. 按Left返回列表 → 验证立即显示（关键测试点）
   # 4. 重复步骤2-3多次，确认无空白或闪烁
   ```

2. **多任务切换测试**：
   ```bash
   # 启动多个agent
   /agent "任务A"
   /agent "任务B"
   
   # 快速切换不同agent详情页
   # 验证每次切换都立即显示内容
   ```

3. **边界情况测试**：
   - 从detail模式按Esc直接关闭（不返回list）
   - 在detail模式杀死agent后自动返回list
   - 在detail模式agent完成后返回list

### 预期结果

- ✓ 每次切换立即显示内容，无空白屏
- ✓ 无需滚动或额外操作即可看到UI
- ✓ 切换流畅，无明显延迟或闪烁

### 如果问题依然存在

如果修复后问题仍存在，需要排查：
1. **PromptInput返回逻辑**：`src/components/PromptInput/PromptInput.tsx:2239` 的早期返回是否需要key
2. **REPL Screen切换**：`src/screens/REPL.tsx` 的 `screen === 'transcript'` 分支是否需要key
3. **Ink渲染优化**：检查是否有全局渲染优化配置抑制了重绘

---

## 附加说明

### 为什么不在Detail组件内部修复？

DetailDialog组件（`AsyncAgentDetailDialog`等）已经有key属性，但它们是在**不同的返回语句**中。问题的根源是list模式的返回语句缺少key，导致React在两个返回分支之间切换时无法明确识别。

### 性能影响

添加key会导致组件完全重新创建（而非更新），但由于：
1. BackgroundTasksDialog是轻量级组件（主要是列表渲染）
2. 切换频率不高（用户手动触发）
3. 终端UI的渲染成本远低于DOM

**性能影响可忽略，且换来了正确的渲染行为。**

---

## 相关代码路径

- 主修复文件：`src/components/tasks/BackgroundTasksDialog.tsx`
- 调用入口：`src/components/PromptInput/PromptInput.tsx:2239`
- 状态管理：`src/state/AppStateStore.ts:169` (`viewingAgentTaskId`)
- 相关组件：
  - `src/components/tasks/AsyncAgentDetailDialog.tsx`
  - `src/components/tasks/ShellDetailDialog.tsx`
  - `src/components/tasks/RemoteSessionDetailDialog.tsx`

---

**修复类型**：治本修复（定位根因，最小化改动）  
**回归风险**：极低（仅添加key属性，不改变逻辑）  
**可回滚性**：高（一行代码变更）
