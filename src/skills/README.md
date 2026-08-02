- `registry.ts`, `skillSchema.ts`, `bundledSkills.ts`, `loadSkillsDir.ts` — 技能注册、Schema定义、内置技能加载
- `mcpSkills.ts`, `mcpSkillBuilders.ts`, `autoLearn.ts` — MCP技能构建与自动学习
- `bundled/`, `learning/`, `utils/` — 内置技能集、学习模块、工具函数
- `registry.test.ts`, `skillSchema.test.ts` — 单元测试
- 地位：技能系统核心，管理所有可调用技能的注册、发现与执行

## 最新更新 (v2.31.0)

### 新增技能：`/advisor` — 智能顾问 [Panda 扩展]
- **文件**: `bundled/advisor.ts` (185 行)
- **功能**: 技术决策分析与多方案对比（Panda 创新功能，非 Claude Code 官方）
- **配置**: `settings.advisorModel` (支持 claude-opus-4-6, claude-fable-5 等)
- **双模式设计**:
  - 配置管理: `/advisor status`, `/advisor <model>`, `/advisor off`
  - 决策分析: `/advisor <question>` — 生成 5 Phase 结构化分析
- **实现**: 基于 LLM prompt-wrapper，非独立决策引擎

### 新增工具：`utils/advisorHelper.ts`
- **文件**: `utils/advisorHelper.ts` (203 行) + 测试 (107 行)
- **功能**: 供其他技能调用顾问模型进行决策审查 (Phase 2 预留)
- **导出**: `callAdvisorForSkill(question, skillName, context)`
- **缓存隔离**: 使用独立 querySource 'skill_advisor_call' 防止污染主会话
- **测试覆盖**: 7 个单元测试全通过

*"一旦这里的结构发生变化，请务必更新我... 就像重新标记领地一样。"*
