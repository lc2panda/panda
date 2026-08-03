# 未完成项清单

**生成时间**：2026-08-03 01:30:00 +08:00  
**来源**：Wave 1-3 修复、omp 调研、全局未完成标记审查  
**审查范围**：636 个 TODO、22 个 FIXME、19 个中文未完成标记

---

## 一、立即需要处理（P0）

### 1.1 发版前必须完成
- [ ] **真实环境验证**（Wave 3 验证报告）
  - macOS 截图粘贴测试（10 次连续粘贴）
  - Windows 截图粘贴测试（Termius/MobaXterm/Xshell）
  - 子 agent 详细输出测试（`PANDA_SUBAGENT_VERBOSE=1`）
  - **来源**：`WAVE-3-VERIFICATION-REPORT.md:390-391`
  - **阻塞**：v2.31.0 发版

- [ ] **发版流程完成**（Wave 3 验证报告）
  - 更新 package.json 版本号（2.31.0）
  - Git tag 创建（v2.31.0）
  - npm publish（或私有 registry）
  - GitHub Release 创建（附 CHANGELOG）
  - **来源**：`WAVE-3-VERIFICATION-REPORT.md:392-395`
  - **阻塞**：v2.31.0 发版

---

## 二、建议后续行动（P1-P2）

### 2.1 来自 Wave 3 验证报告

#### 2.1.1 MCP 日志增强（P0，1 周内）
- [ ] **client.ts 日志增强**
  - 连接建立/失败
  - 工具调用入口/出口
  - 协议错误（jsonrpc）
  - **文件**：`src/services/mcp/client.ts`（136K，仅 2 处日志）
  - **影响**：MCP 故障排查困难

- [ ] **auth.ts 日志增强**
  - 认证开始/成功/失败
  - Token 刷新
  - OAuth 回调处理
  - **文件**：`src/services/mcp/auth.ts`（87K，0 处日志）
  - **影响**：认证失败完全黑盒

#### 2.1.2 配置系统规范化（P1，1 月内）
- [ ] **建立配置集成 checklist**
  - 类型定义（types.ts）
  - 使用位置（≥1 处实际读取）
  - 文档说明（README 或注释）
  - 测试覆盖（如关键配置）

- [ ] **定期审计未使用配置**
  - 每季度人工抽查
  - 删除或补全功能

- [ ] **清理 sshPort 配置**（P2）
  - 删除或实现 SSH 连接功能
  - **文件**：`src/utils/settings/types.ts:1173`
  - **状态**：定义但从未读取

#### 2.1.3 后台任务日志补全（P1，1 月内）
- [ ] MonitorMcpTask 进度日志
- [ ] DreamTask 整合步骤日志
- [ ] channelPermissions 权限决策日志（`src/auth/channelPermissions.ts`，8.8K，0 处日志）
- [ ] elicitationHandler 交互流程日志（`src/services/elicitationHandler.ts`，9.9K，0 处日志）

#### 2.1.4 测试问题修复（P2）
- [ ] 修复 mcp-install skill 测试文件缺失问题（17 个测试失败）
- [ ] 修复 stdio MCP server cwd 测试（1 个测试失败）

### 2.2 来自 omp 调研报告

#### 2.2.1 Phase 1：任务分级机制（2-4 小时）
- [ ] **优先级评分函数实现**
  - 维度：紧急度（P0-P4）+ 影响面 + 工作量 + 依赖度
  - 评分公式：`0.40*紧急度 + 0.30*影响面 + 0.15*依赖度 - 0.15*工作量`
  - **预计工时**：2 小时

- [ ] **TODO.md 迁移脚本**
  - 将现有扁平列表转换为层次化结构
  - 自动标记优先级
  - **预计工时**：4 小时

#### 2.2.2 Phase 2：证据自动关联（2 周后评估）
- [ ] 任务与 git commit 关联
- [ ] 任务与文档锚点关联
- [ ] 证据链路可视化

#### 2.2.3 互联网调研（待补充）
- [ ] **OpenMP 官方调研**
  - URL：https://www.openmp.org/
  - 确认是否有项目管理扩展
  - **来源**：`OMP-CAPABILITY-RESEARCH-2026-08-03.md:466`

- [ ] **GitHub 搜索**
  - 关键词：`"omp" + "TODO management" + "priority scoring"`
  - 关键词：`"Open Management Platform" + "task hierarchy"`

- [ ] **项目管理工具对比**
  - Linear（现代软件团队推荐）
  - Jira（企业级标准）
  - Notion Projects（轻量协作）

---

## 三、技术债务（低优先级）

### 3.1 代码中的 TODO 标记（非阻塞）

#### 3.1.1 buddy/petState.ts（P3，功能扩展）
- [ ] `isLoading` 字段接入：需 REPL.tsx 暴露状态
- [ ] `hasError` 字段接入：需接 query 错误信号
- [ ] `isCompacting` 字段接入：需接 compaction 状态
- [ ] `toolUseCount` 字段接入：需接当前 turn 的工具调用计数
- [ ] `subAgentCount` 字段接入：AppState 补齐后接入
- **文件**：`src/buddy/petState.ts`

#### 3.1.2 ITermBackend.ts（P3，性能优化）
- [ ] 考虑批量处理或异步执行 iTerm 脚本调用
- **文件**：`src/utils/swarm/backends/ITermBackend.ts`
- **影响**：性能优化机会

#### 3.1.3 processBashCommand.tsx（P2，代码清理）
- [ ] 清理 hack 代码（需确认具体位置）
- **文件**：`src/utils/processUserInput/processBashCommand.tsx`

### 3.2 文档中的占位符（正常保留）

以下占位符为用户配置引导，无需处理：
- `YOUR_API_KEY_HERE`
- `.env.example` 中的配置占位符
- README 中的示例值

### 3.3 长期架构改进

#### 3.3.1 统一状态管理模式
- [ ] 明确 Ref 使用规范（缓存 vs 内部状态 vs 双防线）
- [ ] 减少双防线模式，优先单一数据源
- [ ] 为 messagesRef 类只读 Ref 添加注释："只读缓存，无需同步"

#### 3.3.2 统一日志/监控体系
- [ ] 结构化日志框架（等级、过滤、采样）
- [ ] CI 强制关键路径日志覆盖
- [ ] 日志聚合与分析工具

#### 3.3.3 配置系统增强
- [ ] 配置验证器（启动时检查完整性）
- [ ] 配置迁移工具（版本升级自动转换）
- [ ] 配置文档自动生成

---

## 四、统计摘要

### 4.1 全局标记统计（2026-08-03）
- **TODO 标记总数**：636 个
  - 源代码（`.ts/.tsx`）：~30 个（排除工具名称）
  - 文档（`.md`）：~600 个（大部分为正常工具名称引用）
- **FIXME 标记总数**：22 个（多为文档说明）
- **中文未完成标记**：19 个（已分类处理）

### 4.2 处理状态
- ✅ **已关闭**：0 个（本清单首次创建）
- 📋 **已记录**：37 个待办项
  - P0（阻塞发版）：2 项
  - P1（1 周内）：2 项
  - P1（1 月内）：9 项
  - P2（后续优化）：8 项
  - P3（低优先级）：6 项
  - 长期架构：10 项
- ⚠️ **确认为建议性（不阻塞）**：
  - Wave 3 验证报告中的 37 个待办项（已全部记录）
  - omp 调研报告中的互联网调研（待补充）
- ✅ **确认为正常占位符**：`YOUR_API_KEY_HERE` 等用户配置引导

---

## 五、说明

1. **本清单性质**：建议性后续行动，不阻塞当前交付
2. **P0 阻塞项**：仅 2 项（真实环境验证 + 发版流程），均来自 Wave 3 验证报告
3. **Phase 调整建议**：根据用户反馈和实际优先级动态调整
4. **定期更新**：建议每次发版后更新本清单，删除已完成项

---

**下一步建议**：
1. 完成 P0 项（真实环境验证 + 发版流程）
2. 根据用户反馈调整 P1-P3 优先级
3. 每月审查本清单，更新进度
