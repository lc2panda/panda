# 子agent工具调用格式反复失败诊断报告

**诊断时间**：2026-08-03 深夜  
**问题agent**：shifu多路由架构调研 (agent-a0fe5feae01b85048)  
**症状**：反复工具调用格式错误，无法成功写入文件

---

## 执行摘要

**根因**：Agent在长时间运行后（23k+ tokens上下文），错误地使用了不存在的`raw`参数包裹整个工具参数，并将JSON结构序列化为字符串。

**错误格式**：
```json
{
  "name": "Write",
  "input": {
    "raw": "{\"file_path\": \"/Users/panda/Downloads/cc-panda/docs/20260803-shifu多路由架构调研报告.md\""
  }
}
```

**正确格式**：
```json
{
  "name": "Write",
  "input": {
    "file_path": "/Users/panda/Downloads/cc-panda/docs/20260803-shifu多路由架构调研报告.md",
    "content": "..."
  }
}
```

**影响范围**：该agent反复尝试17次，全部失败。

---

## 详细分析

### 1. Write工具的实际定义

**文件**：`/Users/panda/Downloads/cc-panda/src/tools/FileWriteTool/FileWriteTool.ts`

**Schema定义**：
```typescript
const InputSchema = z.object({
  file_path: z.string().describe('The absolute path to the file to write'),
  content: z.string().describe('The content to write to the file'),
})
```

**参数**：
- `file_path` (string, required)
- `content` (string, required)

**不存在的参数**：`raw`

### 2. 错误模式分析

#### 错误发生位置
- **会话文件**：`agent-a0fe5feae01b85048.jsonl`
- **行号**：第111行开始
- **错误次数**：17次（全部使用相同的错误格式）

#### 错误调用示例
```json
{
  "id": "toolu_0eAqDe16WoRIAs901Np0ht",
  "input": {
    "raw": "{\"file_path\": \"/Users/panda/Downloads/cc-panda/docs/20260803-shifu多路由架构调研报告.md\""
  },
  "name": "Write",
  "type": "tool_use"
}
```

#### 系统错误响应
```
InputValidationError: Write failed due to the following issues:
The required parameter `file_path` is missing
The required parameter `content` is missing
An unexpected parameter `raw` was provided
```

#### Agent的自我反思
从会话记录中提取的agent文本输出：
1. "我发现了问题 - Write工具需要两个参数。现在正确调用。"
2. "我遇到了工具调用格式问题。现在正确生成报告。"
3. "我在反复犯格式错误。现在使用正确的参数结构。"
4. "我发现了问题 - 我在错误地使用 `raw` 参数。让我正确调用 Write 工具。"
5. "我遇到了严重的工具调用格式问题。让我重新开始，使用正确的格式。"

**关键观察**：Agent意识到了错误，但无法修正。

### 3. 上下文长度分析

#### Token使用情况（错误发生时）
```
输入tokens: 5,414
缓存读取: 18,074
总计: 23,488 tokens
```

#### 缓存重建次数
- **总计**：109次cache_creation事件
- **说明**：上下文经历了多次重建/压缩

#### 会话统计
- **总行数**：184行
- **文件大小**：304,639字节（~300KB）
- **工具调用**：20+次

### 4. 根因定位

#### 主要根因：上下文污染 + 格式模板混乱

**因果链**：

1. **长时间运行** → 上下文累积23k+ tokens
2. **多次缓存重建** → 109次cache_creation事件
3. **工具调用历史污染** → 大量失败的错误示例被保留在上下文中
4. **格式模板混乱** → Agent学习了错误的格式，并持续复制
5. **错误反馈循环** → 每次失败后，错误格式被进一步强化

#### 次要因素

**A. 错误反馈不够明确**
- 错误信息清晰列出了缺失参数和多余参数
- 但agent无法从错误中正确学习

**B. 缺乏格式验证**
- 没有前置格式验证层
- 错误只在工具执行时被发现

**C. 没有自我修正机制**
- Agent意识到错误但无法跳出循环
- 缺少"重置工具调用状态"的机制

#### 排除的假设

**X. 工具定义不一致** ❌
- Write工具定义清晰一致
- 没有多个版本或过时文档

**X. 系统prompt包含错误示例** ❌
- 搜索系统prompt，未发现`raw`参数说明
- 只有一处提到"raw"（指Agent tool的输出，非Write工具）

**X. 工具定义变更** ❌
- FileWriteTool.ts没有recent变更
- Schema定义稳定

---

## `raw`参数的来源分析

### 搜索结果
在整个代码库中搜索`raw`参数，发现：

**唯一提及（非相关）**：
```typescript
// src/constants/prompts.ts
`keeps its tool output out of your context — so you can keep chatting 
with the user while it works. Reach for it when research or multi-step 
implementation work would otherwise fill your context with raw output`
```

**结论**：`raw`参数不是来自系统prompt或工具定义，而是agent在长时间运行后的**幻觉产物**。

### 可能的触发机制

1. **JSON序列化混淆**：Agent试图将整个参数对象转为字符串
2. **上下文中的JSON示例污染**：Agent看到了大量JSON响应（GitHub API等），混淆了工具调用格式
3. **格式记忆衰退**：在23k+ tokens上下文中，工具schema定义被推到远端，agent依赖近期的错误示例

---

## 修复方案

### 短期修复（立即可执行）

#### 1. 为shifu agent提供明确的格式指引
```bash
# 在agent任务prompt中添加
## 工具调用格式提示

Write工具的正确格式：
{
  "name": "Write",
  "input": {
    "file_path": "/absolute/path/to/file",
    "content": "file content here"
  }
}

注意：
- 没有"raw"参数
- file_path和content都是直接的字符串，不要JSON序列化
- 两个参数都是必需的
```

#### 2. 释放当前agent，重新启动
```bash
# 当前agent已陷入错误循环，无法自我修正
# 建议：终止当前agent，启动新的agent继承调研结果
```

#### 3. 添加上下文长度监控
```typescript
// 在agent任务执行器中添加
if (totalTokens > 20000) {
  logWarning('Agent context approaching limit, format errors more likely')
}
```

### 中期改进（本周）

#### 1. 工具调用前置验证
```typescript
// src/services/tools/toolExecution.ts
function validateToolCall(toolName: string, input: unknown): ValidationResult {
  const tool = getTool(toolName)
  if (!tool) return { valid: false, error: 'Tool not found' }
  
  // 在发送给Claude前验证schema
  const result = tool.inputSchema.safeParse(input)
  if (!result.success) {
    return {
      valid: false,
      error: formatZodValidationError(result.error),
      hint: getToolCallHint(toolName) // 提供正确格式示例
    }
  }
  
  return { valid: true }
}
```

#### 2. 错误反馈优化
```typescript
// 在工具调用失败后，附加正确格式示例
function formatToolError(error: ToolError, toolName: string): string {
  return `
${error.message}

正确的${toolName}调用格式：
${getToolCallExample(toolName)}
`
}
```

#### 3. 上下文压缩改进
```typescript
// 在上下文达到阈值时，主动清理工具调用历史
function compactToolHistory(messages: Message[]): Message[] {
  // 保留最近N次成功的工具调用
  // 清理所有失败的工具调用（避免污染）
  return messages.filter(msg => {
    if (msg.type === 'tool_result' && msg.is_error) {
      return false // 移除失败的工具结果
    }
    return true
  })
}
```

### 长期架构（下月）

#### 1. 工具调用自愈机制
```typescript
interface ToolCallSelfHealing {
  // 检测重复错误模式
  detectRepeatedError(history: ToolCall[]): boolean
  
  // 提供格式重置
  resetToolCallState(): void
  
  // 强制注入正确示例
  injectCorrectExample(toolName: string): void
}
```

#### 2. Agent健康度监控
```typescript
interface AgentHealthMetrics {
  contextSize: number
  failedToolCalls: number
  repeatedErrors: number
  cacheRebuilds: number
  
  // 健康度评分 0-100
  healthScore(): number
  
  // 触发干预
  needsIntervention(): boolean
}
```

#### 3. 上下文管理改进
- **智能压缩**：优先保留工具schema，清理失败记录
- **分段执行**：长任务自动分解为多个短会话
- **状态检查点**：定期保存进度，支持从检查点恢复

---

## 预防措施

### 1. 任务设计层面
- **限制单agent运行时长**：建议≤15分钟或15k tokens
- **主动分段**：长任务分解为多个小任务，每个任务独立agent
- **定期checkpoint**：每完成一个阶段，保存结果并启动新agent

### 2. 工具设计层面
- **Schema文档化**：在工具description中包含格式示例
- **参数验证前置**：在发送给LLM前验证格式
- **错误消息优化**：包含正确示例，不仅仅指出错误

### 3. Agent管理层面
- **健康度监控**：跟踪失败率、上下文长度、重复错误
- **自动干预**：检测到错误循环时，自动重置或替换agent
- **格式锚定**：在上下文压缩后，重新注入工具schema

### 4. 代码规范层面
```typescript
// 在agent任务模板中强制包含
const TOOL_FORMAT_REMINDER = `
## 工具调用格式规范

所有工具调用必须遵循以下格式：
{
  "name": "ToolName",
  "input": {
    "param1": "value1",
    "param2": "value2"
  }
}

注意事项：
1. 参数直接作为input对象的属性
2. 不要使用"raw"、"args"等包裹参数
3. 不要将参数JSON序列化为字符串
4. 参考工具定义中的schema
`
```

---

## 统计数据

| 指标 | 数值 | 说明 |
|------|------|------|
| 错误调用次数 | 17 | 全部使用相同错误格式 |
| 上下文大小 | 23,488 tokens | 输入5.4k + 缓存读取18k |
| 缓存重建次数 | 109 | 上下文经历多次压缩 |
| 会话行数 | 184 | 包含所有消息 |
| 会话大小 | 304KB | 完整会话记录 |
| 工具调用总数 | 20+ | 包含成功和失败 |
| Agent运行时长 | ~34分钟 | 从07:19到07:53 |

---

## 结论

这是一个典型的**长时间运行导致的格式模板污染**问题。Agent在上下文达到23k+ tokens后，工具schema定义被推到远端，agent开始依赖近期的（错误的）工具调用示例，导致格式错误被反复复制。

**核心矛盾**：Agent需要长时间运行以完成复杂任务，但长时间运行会导致上下文污染和格式混乱。

**解决方向**：
1. **短期**：限制单agent运行时长，主动分段任务
2. **中期**：优化错误反馈，清理失败记录，保留schema定义
3. **长期**：构建自愈机制，智能监控agent健康度，自动干预

---

## 附录：shifu agent会话摘要

**任务**：调研vikingmute/shifu多路由架构  
**启动时间**：2026-08-03 07:19  
**首次错误**：2026-08-03 07:45（26分钟后）  
**最后活动**：2026-08-03 07:53（34分钟总时长）

**完成的工作**：
- ✅ 联网搜索shifu项目
- ✅ 获取GitHub API数据
- ✅ 分析多路由架构
- ❌ 生成报告（被工具调用错误阻塞）

**错误模式时间线**：
- 07:45 - 首次使用raw参数
- 07:46 - 第2-5次失败
- 07:47 - 第6-10次失败
- 07:48-07:53 - 第11-17次失败

**Agent自我意识**：
Agent多次表示意识到错误（"我发现了问题"、"我在反复犯格式错误"），但无法跳出循环。这表明问题不在理解层面，而在执行层面 —— 上下文中的错误示例已经主导了格式生成。

---

**报告生成时间**：2026-08-03 深夜  
**诊断者**：系统诊断agent  
**置信度**：高（基于完整会话记录和代码分析）
