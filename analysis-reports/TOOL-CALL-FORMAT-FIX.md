# 工具调用格式问题 - 立即修复方案

**问题**：shifu agent反复使用错误的`raw`参数格式  
**根因**：长时间运行（23k+ tokens）导致格式模板污染  
**状态**：agent已陷入错误循环，无法自我修正

---

## 立即执行（5分钟内）

### 1. 终止当前shifu agent
当前agent (a0fe5feae01b85048) 已无法自我修正，建议终止。

### 2. 启动新agent，使用强化格式指引

创建新的任务prompt，包含明确的工具格式规范：

```markdown
## 任务：shifu 多路由架构调研报告生成

### 背景
前序agent已完成调研工作，现需生成最终报告。

### 已完成的调研
1. ✅ shifu项目基本信息（vikingmute/shifu）
2. ✅ 多路由架构分析
3. ✅ 用户场景分析（4阶段：Plan→Design→Implementation→Review）

### 当前任务
生成完整调研报告到：`/Users/panda/Downloads/cc-panda/docs/20260803-shifu多路由架构调研报告.md`

---

## ⚠️ 工具调用格式规范（严格遵守）

### Write工具的正确格式

**正确示例**：
```json
{
  "name": "Write",
  "input": {
    "file_path": "/Users/panda/Downloads/cc-panda/docs/report.md",
    "content": "# 报告标题\n\n报告内容..."
  }
}
```

**必需参数**：
- `file_path` (string): 绝对路径
- `content` (string): 文件内容

**重要提示**：
1. ❌ 没有 "raw" 参数
2. ❌ 不要将参数JSON序列化为字符串
3. ✅ file_path 和 content 直接作为 input 对象的属性
4. ✅ content 是普通字符串，不是JSON字符串

---

## 报告结构

生成报告应包含：

1. **执行摘要**
   - shifu项目概述
   - 核心发现

2. **shifu架构分析**
   - 多路由机制
   - 任务识别方式
   - 模型协作模式

3. **用户场景分析**
   - 4阶段工作流（Plan/Design/Implementation/Review）
   - 每阶段的模型需求

4. **Panda现状对比**
   - 现有routingPresets能力
   - 功能缺口

5. **可吸收能力评估**
   - 高价值特性（P0-P1）
   - 实施难度评估

6. **实施方案**
   - Phase 1/2/3路线图
   - 风险与依赖

7. **证据清单**
   - ≥3个独立来源
   - 链接、版本、检索时间

---

## 交付要求

1. 使用Write工具生成报告（注意格式！）
2. 报告长度：2000-3000字
3. 包含清晰的架构对比表格
4. 证据清单完整

---

## 时间限制
20分钟内完成。
```

### 3. 监控新agent的工具调用
如果新agent再次出现`raw`参数错误，立即终止并上报。

---

## 中期优化（本周内）

### 1. 在agent任务模板中添加格式检查清单

在 `src/tasks/LocalAgentTask/LocalAgentTask.tsx` 或相关文件中：

```typescript
const TOOL_FORMAT_REMINDER = `
## 工具调用格式检查清单

在调用Write工具前，请确认：
□ 使用了 file_path 参数（不是 path 或 filepath）
□ 使用了 content 参数
□ 没有使用 raw、args、data 等包裹参数
□ 参数值是直接的字符串，不是JSON序列化的字符串
□ file_path 是绝对路径

正确格式：
{
  "name": "Write",
  "input": {
    "file_path": "/absolute/path",
    "content": "file content"
  }
}
`
```

### 2. 添加工具调用失败检测

```typescript
// 检测重复失败模式
function detectRepeatedToolError(
  history: ToolUseResult[],
  threshold: number = 3
): boolean {
  const recentErrors = history
    .slice(-10)
    .filter(r => r.is_error && r.tool_name === 'Write')
  
  if (recentErrors.length >= threshold) {
    console.warn('[AgentHealth] Repeated Write tool failures detected', {
      count: recentErrors.length,
      errorPattern: recentErrors.map(e => e.error_message)
    })
    return true
  }
  
  return false
}
```

### 3. 优化错误反馈消息

在 `src/utils/toolErrors.ts` 中：

```typescript
export function formatToolError(
  toolName: string,
  error: ZodError,
  providedInput: unknown
): string {
  const baseError = formatZodValidationError(error)
  
  // 对Write工具，附加正确示例
  if (toolName === 'Write') {
    return `${baseError}

正确的Write调用格式：
{
  "name": "Write",
  "input": {
    "file_path": "/absolute/path/to/file",
    "content": "file content here"
  }
}

注意：没有"raw"参数，file_path和content是直接的字符串。
`
  }
  
  return baseError
}
```

---

## 长期架构改进（下月）

### 1. 工具调用健康度监控

```typescript
interface ToolCallHealthMonitor {
  trackToolCall(call: ToolCall, result: ToolResult): void
  getHealthScore(): number
  shouldIntervene(): boolean
}

class AgentHealthMonitor implements ToolCallHealthMonitor {
  private failureCount = 0
  private successCount = 0
  private repeatedErrors: Map<string, number> = new Map()
  
  trackToolCall(call: ToolCall, result: ToolResult): void {
    if (result.is_error) {
      this.failureCount++
      const errorKey = `${call.name}:${result.error_type}`
      this.repeatedErrors.set(
        errorKey,
        (this.repeatedErrors.get(errorKey) || 0) + 1
      )
    } else {
      this.successCount++
    }
  }
  
  getHealthScore(): number {
    const total = this.failureCount + this.successCount
    if (total === 0) return 100
    
    const successRate = this.successCount / total
    const maxRepeatedError = Math.max(...this.repeatedErrors.values(), 0)
    
    // 成功率 * 70% - 重复错误惩罚 * 30%
    return successRate * 70 - Math.min(maxRepeatedError * 10, 30)
  }
  
  shouldIntervene(): boolean {
    // 健康度低于50分，或单个错误重复3次以上
    return (
      this.getHealthScore() < 50 ||
      Math.max(...this.repeatedErrors.values(), 0) >= 3
    )
  }
}
```

### 2. 自动格式重置机制

```typescript
// 当检测到重复格式错误时，注入强制提醒
function injectFormatReminder(
  messages: Message[],
  toolName: string
): Message[] {
  const reminder: Message = {
    role: 'user',
    content: `
⚠️ 系统提醒：检测到${toolName}工具调用格式错误。

正确格式：
${getToolSchema(toolName)}

请严格按照上述格式调用工具。
`
  }
  
  return [...messages, reminder]
}
```

### 3. 上下文智能压缩

```typescript
// 在压缩上下文时，优先保留工具schema，清理失败记录
function smartContextCompression(messages: Message[]): Message[] {
  return messages.filter((msg, idx) => {
    // 保留：系统prompt、工具schema、成功的工具调用
    if (msg.role === 'system') return true
    if (msg.content?.includes('tool schema')) return true
    
    // 移除：失败的工具调用结果
    if (msg.role === 'user' && msg.content) {
      const toolResult = extractToolResult(msg)
      if (toolResult?.is_error) {
        // 只保留最近3次失败记录
        const recentErrors = messages
          .slice(idx)
          .filter(m => extractToolResult(m)?.is_error)
        return recentErrors.length <= 3
      }
    }
    
    return true
  })
}
```

---

## 预防清单

### 任务设计
- [ ] 单个agent任务≤15分钟或15k tokens
- [ ] 复杂任务分解为多个子任务
- [ ] 每个子任务独立agent执行

### Agent启动
- [ ] 任务prompt包含工具格式规范
- [ ] 关键工具附带正确示例
- [ ] 明确禁止的错误模式（如raw参数）

### 运行监控
- [ ] 跟踪工具调用成功率
- [ ] 检测重复错误模式（≥3次触发告警）
- [ ] 监控上下文长度（>20k tokens触发分段）

### 错误处理
- [ ] 工具错误附带正确格式示例
- [ ] 重复错误自动注入格式提醒
- [ ] 无法修正时自动终止并重启新agent

---

## 检查点

### ✅ 已完成
- [x] 诊断根因（上下文污染导致格式模板混乱）
- [x] 定位错误模式（raw参数 + JSON序列化）
- [x] 生成详细诊断报告

### ⏳ 待执行（立即）
- [ ] 终止当前shifu agent
- [ ] 启动新agent（带强化格式指引）
- [ ] 监控新agent工具调用

### 📋 待实施（本周）
- [ ] 添加工具格式检查清单到任务模板
- [ ] 实现重复错误检测
- [ ] 优化工具错误反馈消息

### 🔮 规划中（下月）
- [ ] 构建工具调用健康度监控
- [ ] 实现自动格式重置机制
- [ ] 优化上下文智能压缩

---

**生成时间**：2026-08-03 深夜  
**优先级**：P0（阻塞shifu调研任务）  
**预计修复时间**：立即方案5分钟，完整修复1周
