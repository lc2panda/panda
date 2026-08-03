# Next Steps — Subagent Output 调试路线图

**诊断结论**: ✅ 修复代码已完整部署（源码→构建→打包→安装全链路验证通过）

**问题本质**: 不在构建链，在运行时数据或其他根因

---

## 立即行动：添加调试日志

### 方案1：临时调试版本（推荐）

在 src/components/tasks/AsyncAgentDetailDialog.tsx:198 前添加调试代码

**步骤**:
1. 修改代码添加 process.stderr.write 输出
2. npm run build
3. 打包安装
4. 启动 subagent，打开详情窗口
5. 查看终端 stderr 输出

---

## 假设树

### Hypothesis 1: agent.messages 为空/undefined (概率: 40%)

**症状**: 消息区块完全不渲染

**验证**:
```bash
grep -rn "appendMessageToLocalAgent" src --include="*.ts" --include="*.tsx"
```

**如果确认**: 
- 问题在消息填充逻辑，不在渲染
- 检查 agent 启动时是否正确初始化 messages
- 检查 API 响应是否正确追加到 messages

---

### Hypothesis 2: msg.message 全部为 undefined (概率: 35%)

**症状**: 消息区块渲染，但显示 fallback 文本

**验证**: 查看调试日志中的 hasMessage 字段

**如果确认**:
- 修复方向正确，但上游构造 Message 对象时未填充 message 字段
- 检查 appendMessageToLocalAgent 的调用者传入的数据结构

---

### Hypothesis 3: React Compiler 缓存 (概率: 15%)

**症状**: 数据正确但 UI 不更新

**验证**: 检查 agent.messages 引用是否每次都改变

---

### Hypothesis 4: 窗口未切换到正确 task (概率: 10%)

**症状**: 打开的是旧的/错误的 agent 窗口

**验证**: 检查 agent.agentId 和 agent.status

---

## 快速排查清单

### 1. 确认 messages 初始化
```bash
grep -n "messages:" src/tasks/LocalAgentTask/LocalAgentTask.tsx
```

### 2. 确认消息追加逻辑
```bash
grep -rn "appendMessageToLocalAgent" src --include="*.ts" --include="*.tsx"
```

### 3. 检查是否有其他遗漏的修复点
```bash
grep -rn "msg\.role\|msg\.content" src/components/tasks --include="*.tsx" | grep -v "msg\.message"
```

---

## 执行顺序

1. ✅ 完成: 构建链验证（已证实无问题）
2. 当前: 添加调试日志 → 重新构建 → 运行观察
3. 下一步: 根据日志输出选择对应 Hypothesis 分支
4. 最后: 修复根因 → 验证 → 清理调试代码

---

## 关键文件

- 渲染逻辑: src/components/tasks/AsyncAgentDetailDialog.tsx:199
- 类型定义: src/types/message.ts:33
- 任务状态: src/tasks/LocalAgentTask/LocalAgentTask.tsx:138
- 消息追加: src/tasks/LocalAgentTask/LocalAgentTask.tsx:184
- 调用点: src/components/tasks/BackgroundTasksDialog.tsx:379

---

**诊断报告**: BUILD-CHAIN-DIAGNOSIS.md
