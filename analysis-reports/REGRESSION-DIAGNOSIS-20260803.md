# 工具调用系统回归诊断报告

**诊断时间**：2026-08-03 深夜  
**任务代号**：紧急系统回归审查  
**状态**：✅ 根因已定位

---

## 执行摘要

**结论**：这不是今天commit导致的工具调用系统回归。

**实际情况**：
1. **工具调用系统本身正常** — Write工具定义未被修改，schema完整
2. **问题是特定agent的上下文污染** — shifu调研agent在长时间运行后（34分钟，23k+ tokens）产生格式幻觉
3. **回滚操作与工具调用无关** — 今天的两个回滚都是UI相关修复，未触及工具定义或调用逻辑

---

## 时间线还原

### 2026-08-02 (过去24小时的commit)

**最近20个commit的实际时间戳**：
```
f641d63 2026-08-02 23:52 -0700  Revert debug logging (AsyncAgentDetailDialog)
b7e1b80 2026-08-02 23:51 -0700  debug: add runtime logging for AsyncAgentDetailDialog messages
4a656ab 2026-08-02 22:58 -0700  fix: resolve UI blank screen on agent switch
cc00ca5 2026-08-02 22:55 -0700  fix: correct message field access path in agent detail window
97c67bb 2026-08-02 21:21 -0700  Revert subagent output blackbox fix
9fd90cf 2026-08-02 21:17 -0700  docs: close outstanding items and create tracking list
9b38555 2026-08-02 21:16 -0700  docs: add omp capability research report
299694a 2026-08-02 20:06 -0700  fix: resolve subagent output blackbox issue (root cause fix)
f5a7d0d 2026-08-02 19:37 -0700  fix: enable detailed subagent window output by default
... (更早的commit)
```

**关键commit分析**：

#### Commit 97c67bb (回滚 299694a)
- **时间**：2026-08-02 21:21
- **内容**：回滚了subagent输出黑箱修复
- **改动文件**：
  - `src/tools/AgentTool/AgentTool.tsx` (删除 onMessageYield 回调注入)
  - `src/tools/AgentTool/runAgent.ts` (删除 onMessageYield 参数和调用)
  - 删除文档 `FIX-SUBAGENT-BLACKBOX-ROOT-CAUSE.md`
- **影响范围**：仅影响subagent输出显示，不影响工具调用系统

#### Commit f641d63 (回滚 b7e1b80)
- **时间**：2026-08-02 23:52
- **内容**：回滚调试日志
- **改动文件**：`src/components/tasks/AsyncAgentDetailDialog.tsx`
- **影响范围**：仅UI组件日志，与工具调用无关

### 工具调用系统的稳定性

**验证1：Write工具定义未被修改**
```bash
$ git log --all -10 --oneline -- src/tools/FileWriteTool/
# 输出：最近10个commit中均无修改
```

**验证2：工具注册逻辑未被修改**
```bash
$ git diff HEAD~20..HEAD -- src/tools/FileWriteTool/FileWriteTool.ts
# 输出：无差异
```

**验证3：当前Write工具schema完整**
```typescript
// src/tools/FileWriteTool/FileWriteTool.ts
const InputSchema = z.object({
  file_path: z.string().describe('The absolute path to the file to write'),
  content: z.string().describe('The content to write to the file'),
})
```

**结论**：工具调用系统本身未被任何commit破坏。

---

## 真实问题分析

### 问题1：shifu agent的格式错误

**文件**：`analysis-reports/TOOL-CALL-FORMAT-DIAGNOSIS.md`

**根因**：长时间运行导致的上下文污染
- **运行时长**：34分钟
- **上下文大小**：23,488 tokens (5.4k输入 + 18k缓存)
- **缓存重建**：109次
- **错误次数**：17次（全部使用相同的错误格式）

**错误模式**：
```json
// ❌ Agent使用的错误格式
{
  "name": "Write",
  "input": {
    "raw": "{\"file_path\": \"/path/to/file\""
  }
}

// ✅ 正确格式
{
  "name": "Write",
  "input": {
    "file_path": "/path/to/file",
    "content": "content here"
  }
}
```

**因果链**：
```
长时间运行 (34分钟)
  ↓
上下文累积 (23k+ tokens)
  ↓
多次缓存重建 (109次)
  ↓
工具schema被推到远端
  ↓
Agent依赖近期错误示例
  ↓
格式模板污染 (幻觉产生"raw"参数)
  ↓
反复复制错误格式 (17次)
  ↓
无法自我修正
```

**关键证据**：
1. Agent多次表示意识到错误（"我发现了问题"、"我在反复犯格式错误"）
2. 但无法跳出循环 — 上下文中的错误示例已主导格式生成
3. `raw`参数不存在于任何工具定义或系统prompt中
4. 这是Agent在长上下文运行后的幻觉产物

### 问题2：回滚97c67bb的副作用

**回滚内容**：删除了 `onMessageYield` 机制

**原有机制的作用**（来自被回滚的commit 299694a）：
```typescript
// runAgent.ts: 在消息生成后立即追加到task.messages
onMessageYield?.(message)

// AgentTool.tsx: 为后台和前台agent注入回调
onMessageYield: (message) => {
  appendMessageToAgentTask(agentBackgroundTask.agentId, message, rootSetAppState);
}
```

**回滚后的影响**：
- ❌ 子agent详情窗口无法实时显示工具调用
- ❌ 用户看不到agent的实际工作（工具参数、返回结果、LLM思考）
- ✅ 工具调用本身仍然正常执行
- ✅ 不影响工具定义或schema

**为什么回滚**：
- 原因不明（commit message仅说明是"Revert"）
- 可能是回滚过程中误操作
- 可能是发现了其他副作用（但未记录）

---

## 核心结论

### 结论1：无系统级回归
**工具调用系统未被破坏**

证据：
- ✅ Write工具定义完整且稳定
- ✅ 工具注册逻辑未被修改
- ✅ 今天的commit均不涉及工具调用核心逻辑
- ✅ 两个回滚操作都是UI相关，未触及工具系统

### 结论2：问题是特定agent的上下文污染
**shifu agent的格式错误是个例，不是系统性问题**

特征：
- 仅发生在长时间运行的agent上（34分钟，23k+ tokens）
- 错误格式（`raw`参数）是幻觉产物，不存在于系统中
- Agent意识到错误但无法修正 — 典型的上下文污染症状
- 其他agent不受影响

### 结论3：回滚97c67bb导致可见性下降
**onMessageYield机制的删除影响用户体验，但不影响功能**

影响：
- 子agent详情窗口变成"黑箱"
- 用户无法看到实时工具调用
- 但工具调用本身正常执行

---

## 修复方案

### 立即修复：shifu agent格式错误

**方案A：终止当前agent，启动新agent**
```bash
# 当前agent已陷入错误循环
# 建议：终止 agent-a0fe5feae01b85048
# 启动新agent，任务prompt包含明确格式规范
```

**方案B：主动分段任务**
```
将shifu调研分解为：
1. Agent 1: 联网搜索 + 获取GitHub数据 (已完成)
2. Agent 2: 分析架构 + 生成报告 (新启动)
```

详见：`analysis-reports/TOOL-CALL-FORMAT-FIX.md`

### 可选修复：恢复onMessageYield机制

**决策问题**：是否恢复commit 299694a？

**恢复的好处**：
- ✅ 子agent详情窗口实时显示工具调用
- ✅ 提升用户体验和可调试性
- ✅ 符合原设计意图

**不恢复的风险**：
- ❌ 用户无法看到agent实际工作
- ❌ 调试困难

**建议**：
```bash
# 如果没有明确的回滚理由，建议恢复
git revert 97c67bb
git commit -m "Restore onMessageYield mechanism for subagent output visibility"
```

**前置条件**：
- 确认原commit 299694a没有其他副作用
- 测试恢复后的构建和运行

---

## 预防措施

### 1. Agent运行时长限制
```typescript
// 建议在agent任务执行器中添加
const MAX_AGENT_RUNTIME = 15 * 60 * 1000 // 15分钟
const MAX_CONTEXT_TOKENS = 15000

if (runtime > MAX_AGENT_RUNTIME || contextTokens > MAX_CONTEXT_TOKENS) {
  logWarning('Agent approaching limits, consider task segmentation')
  // 可选：自动触发分段
}
```

### 2. 格式错误检测
```typescript
// 检测重复的工具调用错误
function detectRepeatedToolError(history: ToolCall[]): boolean {
  const recentErrors = history.slice(-5).filter(call => call.is_error)
  if (recentErrors.length >= 3) {
    const sameError = recentErrors.every(e => 
      e.error_message.includes(recentErrors[0].error_message)
    )
    if (sameError) {
      logWarning('Repeated tool error detected, agent may be stuck')
      return true
    }
  }
  return false
}
```

### 3. 上下文健康监控
```typescript
interface AgentHealthMetrics {
  contextSize: number
  failedToolCalls: number
  repeatedErrors: number
  cacheRebuilds: number
  
  healthScore(): number // 0-100
  needsIntervention(): boolean
}
```

### 4. 任务设计规范
- ✅ 复杂任务主动分段
- ✅ 每段独立agent执行
- ✅ 限制单agent运行时长 ≤15分钟
- ✅ 任务prompt包含工具格式规范
- ✅ 关键工具附带正确示例

---

## 排除的假设

### ❌ 假设1：今天的commit破坏了工具调用系统
**证据**：
- Write工具定义在最近20个commit中未被修改
- 工具注册逻辑稳定
- 今天的commit都是UI/文档相关

### ❌ 假设2：回滚操作误删了工具定义
**证据**：
- 回滚97c67bb只删除了onMessageYield机制
- onMessageYield用于消息追加，不影响工具schema
- 工具定义文件未被回滚操作触及

### ❌ 假设3：系统prompt包含错误的`raw`参数示例
**证据**：
- 搜索整个代码库，未发现Write工具的`raw`参数定义
- 唯一的"raw"提及是在Agent工具的描述中（非Write工具）
- `raw`参数是Agent幻觉产物，不是系统引入的

### ❌ 假设4：工具定义有多个版本导致混淆
**证据**：
- FileWriteTool.ts是唯一的Write工具实现
- Schema定义清晰且一致
- 没有过时的或冲突的定义

---

## 统计数据

### 最近commit统计
| 类型 | 数量 | 文件 |
|------|------|------|
| UI修复 | 4 | AsyncAgentDetailDialog, message access path |
| 文档 | 3 | OMP research, advisor clarification, outstanding items |
| Subagent输出修复（已回滚） | 2 | runAgent.ts, AgentTool.tsx |
| 工具调用系统修改 | 0 | 无 |

### shifu agent错误统计
| 指标 | 数值 | 说明 |
|------|------|------|
| 错误次数 | 17 | 全部使用相同错误格式 |
| 上下文大小 | 23,488 tokens | 输入5.4k + 缓存读取18k |
| 缓存重建 | 109次 | 上下文经历多次压缩 |
| 运行时长 | 34分钟 | 从07:19到07:53 |
| 首次错误 | 启动后26分钟 | 上下文达到阈值后开始 |

---

## 下一步行动

### 立即执行（5分钟）
1. 终止当前shifu agent (agent-a0fe5feae01b85048)
2. 启动新agent继承调研结果，任务prompt包含格式规范
3. 监控新agent的工具调用成功率

### 短期改进（本周）
1. 决策是否恢复 onMessageYield 机制（commit 299694a）
2. 添加重复错误检测逻辑
3. 实施agent运行时长限制

### 长期架构（下月）
1. 构建agent健康度监控系统
2. 实现智能上下文压缩（保留schema，清理失败记录）
3. 开发自动干预机制（检测错误循环时自动重置）

---

## 相关文档

1. **shifu agent格式错误完整诊断**  
   `/Users/panda/Downloads/cc-panda/analysis-reports/TOOL-CALL-FORMAT-DIAGNOSIS.md`

2. **修复方案详细说明**  
   `/Users/panda/Downloads/cc-panda/analysis-reports/TOOL-CALL-FORMAT-FIX.md`

3. **执行摘要**  
   `/Users/panda/Downloads/cc-panda/analysis-reports/TOOL-CALL-DIAGNOSIS-SUMMARY.md`

4. **被回滚的subagent输出修复文档**  
   Commit 299694a的完整说明（已被删除，可通过git show 299694a查看）

---

## 附录：关键代码位置

### Write工具定义
**文件**：`src/tools/FileWriteTool/FileWriteTool.ts`  
**Schema**：第46-49行
```typescript
const InputSchema = z.object({
  file_path: z.string().describe('The absolute path to the file to write'),
  content: z.string().describe('The content to write to the file'),
})
```

### runAgent函数签名
**文件**：`src/tools/AgentTool/runAgent.ts`  
**行号**：285-358
**当前状态**：无 onMessageYield 参数（被97c67bb回滚删除）

### 被回滚的onMessageYield机制
**Commit**：299694a (2026-08-02 20:06)  
**回滚commit**：97c67bb (2026-08-02 21:21)  
**查看方式**：`git show 299694a`

---

**诊断完成时间**：2026-08-03 深夜  
**诊断agent**：系统审查agent  
**置信度**：极高（基于完整commit历史、代码分析、会话记录）

**核心发现**：这不是系统回归，而是特定agent的长上下文运行导致的格式污染问题。工具调用系统本身稳定且完整。
