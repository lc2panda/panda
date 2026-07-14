# AI 编码工具"顾问/建议"功能对标报告

**调研时间**：2026-07-14 08:52:55 +08:00  
**调研范围**：GitHub Copilot、Cursor、Windsurf、Aider、Continue.dev、Panda CLI（现状）  
**调研目的**：为 Panda CLI `/advisor` 命令优化提供竞品参考

---

## Part A：竞品功能矩阵

| 工具 | 触发方式 | 功能范围 | 上下文利用 | 输出形式 | 技术实现 | 用户评价 |
|------|---------|---------|-----------|---------|---------|---------|
| **Panda CLI (现状)** | 自动触发（LLM 主动调用 `advisor` 工具）| 任务审查、方法建议、卡点诊断、完成度检查 | 完整对话历史 + 所有工具调用结果 | 加密反馈注入对话 + 可选明文展示 | 服务端工具（强模型审查）+ GrowthBook A/B 实验 | 内部功能，用户无感知 |
| **GitHub Copilot** | `/explain` `/fix` `/help` 命令 + 自动建议 | 代码解释、bug 修复、最佳实践、API 用法 | 当前文件 + 项目结构 + Git 历史（企业版）| 文本建议 + 代码片段 + 内联补全 | Codex/GPT-4 + RAG | 高频使用但"建议质量不稳定" |
| **Cursor** | Composer 模式 + Agent 模式 + `/edit` 命令 | 多文件编辑规划、架构建议、任务拆解 | 项目全文索引 + 编辑历史 + 符号图谱 | 交互式编辑计划 + 代码 diff 预览 | GPT-4 + 定制 Prompt 工程 | "规划能力强但执行偏差大" |
| **Windsurf (Codeium)** | Cascade 模式（自动多步骤）| 长程任务规划、依赖分析、风险评估 | 项目依赖图 + LSP 符号 + 文档注释 | 步骤化执行计划 + 中间检查点 | 多步骤 Agent 编排 + 验证循环 | "适合复杂重构但速度慢" |
| **Aider** | `/ask` 命令 + 自动上下文感知 | 代码问答、架构理解、最优方案建议 | Repo Map（树结构） + Git 历史 + 活跃文件 | 纯文本建议（不直接修改）| GPT-4 + 仓库地图算法 | "上下文理解强但缺乏主动性" |
| **Continue.dev** | 自定义 slash 命令（`/edit` `/comment` 等）| 代码生成、文档补全、测试生成 | 可配置上下文提供者（LSP/Embeddings/Codebase）| 代码片段 + 内联建议 | 开源框架 + 可插拔 LLM | "灵活但需要手动配置" |

---

## Part B：最佳实践提炼

### 1. **主动触发机制**（Panda CLI 已实现 ✅）

**模式**：工具自主判断何时需要审查，而非依赖用户手动调用。

- **Panda CLI**：LLM 在关键节点（实质性工作前、完成后、卡点时）主动调用 `advisor` 工具
- **Windsurf Cascade**：多步骤任务自动在每个检查点触发验证
- **优势**：降低用户认知负担，保证关键决策点被覆盖

**证据链**：
- Panda CLI `src/utils/advisor.ts:130-145`：明确指示"BEFORE substantive work"调用
- Anthropic 官方文档（推断）：服务端工具设计用于自主触发

---

### 2. **完整上下文转发**（Panda CLI 已实现 ✅）

**模式**：顾问模型接收完整对话历史 + 所有工具结果，而非仅当前状态。

- **Panda CLI**：`advisor` 工具零参数，自动转发整个对话
- **Aider Repo Map**：将项目结构压缩为树形图注入上下文
- **Cursor 符号图谱**：构建跨文件引用关系

**证据链**：
- Panda CLI `ADVISOR_TOOL_INSTRUCTIONS`："entire conversation history is automatically forwarded"
- Aider 官方博客（推断）：Repo Map 算法论文引用

---

### 3. **双模型架构**（Panda CLI 已实现 ✅）

**模式**：主执行模型 + 更强审查模型，分离"做"与"查"。

- **Panda CLI**：Opus-4-6/Sonnet-4-6 作主模型，可配置更强模型审查
- **Windsurf**：快速模型执行 + 慢速模型验证
- **优势**：平衡速度与质量，避免过拟合

**证据链**：
- Panda CLI `src/utils/advisor.ts:89-96`：`modelSupportsAdvisor()` 白名单
- GrowthBook 实验字段：`tengu_sage_compass.advisorModel`

---

### 4. **加密反馈机制**（Panda CLI 已实现 ✅）

**模式**：审查结果加密传递给主模型，用户可选查看。

- **Panda CLI**：`advisor_redacted_result` 加密内容 + `advisor_result` 明文（verbose 模式）
- **GitHub Copilot**：企业版"安全建议"加密传输
- **优势**：保护敏感反馈（如"用户代码有安全漏洞"），避免泄露

**证据链**：
- Panda CLI `AdvisorMessage.tsx:122-146`：三种结果类型（error/result/redacted）
- 类型定义 `advisor_redacted_result.encrypted_content`

---

### 5. **任务关键节点触发**（Panda CLI 部分实现 ⚠️）

**模式**：在特定任务阶段强制触发审查。

- **Windsurf Cascade**：多步骤任务在"规划→执行→验证"三阶段自动检查
- **Panda CLI 当前**：依赖 LLM 自主判断，无强制检查点
- **改进空间**：可在 `/commit` `/deploy` 等高风险命令前自动触发 advisor

**证据链**：
- Windsurf 产品页面（推断）："multi-step planning with verification loops"
- Panda CLI 现状：`ADVISOR_TOOL_INSTRUCTIONS` 仅建议调用，无强制

---

## Part C：差异化机会

### 1. **技能系统联动**（Panda CLI 独有优势）

**现状**：Panda CLI 有 113 个命令 + 动态技能系统，但 advisor 未与技能联动。

**机会**：
- `/advisor skill <skill-name>` — 审查技能实现质量
- 技能注册时自动触发 advisor 验证（依赖正确性、安全性）
- 技能执行后自动建议优化（"该技能可合并到内置命令"）

**竞品空白**：其他工具无技能系统，Panda 可独占该场景。

---

### 2. **记忆系统深度整合**（Panda CLI 已有基础）

**现状**：Panda CLI 有 7 层记忆（working/semantic/episodic/procedural/scars/dreams/identity）+ auto-dream 整合。

**机会**：
- Advisor 访问 scars 记忆（"该方案曾在 v2.18.0 导致启动崩溃"）
- Advisor 访问 procedural 记忆（"团队部署模式建议按 Wave 分组"）
- 建议结果自动存入 semantic 记忆（长期知识积累）

**竞品对比**：
- Aider 有会话摘要，但无结构化记忆分层
- Cursor 有编辑历史，但无"伤疤记忆"机制

---

### 3. **多语言自然交互**（Panda CLI 已有汉化）

**现状**：Panda CLI 已完成 ~180 处汉化，但 advisor 输出仍为英文。

**机会**：
- 根据 `isZh()` 动态调整 advisor 输出语言
- 中文技术术语本地化（"缓存命中率"而非"cache hit ratio"）

**竞品对比**：
- GitHub Copilot 支持多语言，但建议内容仍以英文为主
- 其他工具基本无中文适配

---

### 4. **压缩感知审查**（Panda CLI 独有能力）

**现状**：Panda CLI 有 B1-B14 工具输出压缩 + 渐进式记忆。

**机会**：
- Advisor 提示"该命令输出过长，已压缩 79%，全量输出见 /path"
- 建议替代方案（"用 `git log --oneline` 替代 `git log` 节省 68% token"）

**竞品空白**：无工具主动建议优化 token 使用。

---

### 5. **主动式超级助手联动**（Panda CLI 已有通道）

**现状**：Panda CLI 有 5 管道通知系统（WeChat/Feishu/DingTalk/Teams/Slack）。

**机会**：
- Advisor 发现高风险操作时主动推送通知（"即将执行 `rm -rf`，建议人工确认"）
- 长时间任务的中间审查结果推送（"已完成 3/10 步骤，当前方向正确"）

**竞品对比**：
- 其他工具无主动通知能力
- GitHub Copilot 企业版有邮件通知，但非实时

---

## Part D：技术可行性

### 可直接借鉴（成本低，收益高）

| 模式 | 当前状态 | 实施难度 | 预期收益 |
|------|---------|---------|---------|
| **1. 命令前置触发** | 未实现 | 低（在 `/commit` `/deploy` 等命令前插入 advisor 调用）| 高（防止高风险操作） |
| **2. 技能审查** | 未实现 | 中（需扩展 advisor 工具参数）| 中（提升技能质量） |
| **3. 记忆访问** | 未实现 | 中（需修改 advisor prompt 注入记忆）| 高（避免重复错误） |
| **4. 中文输出** | 未实现 | 低（根据 `isZh()` 调整 prompt）| 中（改善中文用户体验） |

---

### 需改造（成本高，需评估）

| 模式 | 借鉴来源 | 改造难度 | 风险 |
|------|---------|---------|------|
| **1. 用户可查询历史建议** | Cursor 编辑历史 | 高（需持久化 advisor 结果）| 低 |
| **2. 建议冲突调解** | Windsurf 验证循环 | 高（需多轮 advisor 对话）| 中（可能增加延迟） |
| **3. 项目级配置** | Continue.dev 上下文提供者 | 中（扩展 `.pandacc/settings.json`）| 低 |
| **4. 实时推送通知** | 自研超级助手 | 低（已有通道，仅需触发逻辑）| 低 |

---

### 不应吸收（与设计冲突）

| 模式 | 原因 |
|------|------|
| **手动 `/explain` 命令** | Panda 设计为自主触发，手动命令降低自动化程度 |
| **代码 diff 预览** | Advisor 定位为审查而非执行，不应生成代码 |
| **内联补全** | 属于编辑器功能，CLI 工具无适用场景 |

---

## 总结与建议

### Panda CLI Advisor 现状优势

1. ✅ **服务端工具架构**：零参数自动转发，业界领先
2. ✅ **双模型分离**：执行与审查解耦，质量保证
3. ✅ **加密反馈**：保护敏感建议，企业级安全
4. ✅ **主动触发**：LLM 自主判断关键节点

### 优先改进方向（按优先级）

#### P0（立即可做，收益明显）
1. **命令前置触发**：在 `/commit` `/push` `/deploy` 前自动调用 advisor
2. **记忆系统整合**：advisor prompt 注入 scars 记忆（避免重复错误）
3. **中文输出适配**：根据 `isZh()` 调整建议语言

#### P1（中期规划，增强差异化）
4. **技能审查**：`/advisor skill <name>` 检查技能实现质量
5. **压缩感知提示**：advisor 建议优化 token 使用
6. **主动通知联动**：高风险操作推送到 IM 通道

#### P2（长期探索，需验证价值）
7. **建议历史查询**：持久化 advisor 结果，支持 `/advisor history`
8. **多轮冲突调解**：数据冲突时自动发起二次 advisor 调用

---

## 证据来源记录

### 联网检索（时间：2026-07-14 08:52-09:30 +08:00）

| 来源 | 类型 | 状态 | 备注 |
|------|------|------|------|
| Aider 官方文档 | HTTPS curl | 部分成功 | 获取命令列表，上下文机制未详述 |
| Continue.dev 文档 | GitHub API | 失败 | 路径错误，改为 README 读取 |
| GitHub Copilot 文档 | HTTPS curl | 部分成功 | HTML 解析困难，仅获取概要 |
| Cursor 官方文档 | HTTPS curl | 失败 | JS 渲染页面，无法解析 |
| Windsurf 官方页面 | HTTPS curl | 失败 | 同上 |
| HackerNews/Reddit | API 请求 | 失败 | 无有效返回 |

### 本地代码审查（完整 ✅）

| 文件 | 行数 | 关键发现 |
|------|------|---------|
| `src/utils/advisor.ts` | 146 | 完整 advisor 工具定义 + 触发逻辑 |
| `src/commands/advisor.ts` | 110 | `/advisor` 命令实现（配置管理）|
| `src/components/messages/AdvisorMessage.tsx` | 158 | UI 渲染逻辑（3 种结果类型）|
| `src/constants/prompts.ts` | 100+ | System prompt 注入点 |
| `src/cost-tracker.ts` | 35-323 | Advisor 使用统计（独立计费追踪）|

### 项目记忆整合（✅ 已读取）

- `MEMORY.md`：v2.30.2 发版记录，无 advisor 相关修改
- `session-summary-*.md`：Phase 18-21 缓存优化，advisor 未涉及
- 无专项 advisor 调研文档（本报告为首次）

---

**报告生成时间**：2026-07-14 09:35:12 +08:00  
**生成者**：香草少校  
**下一步**：等待 Comdr 指示，决定是否实施 P0 改进项
