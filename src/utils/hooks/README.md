- `AsyncHookRegistry.ts`, `hookEvents.ts`, `hookHelpers.ts`, `hooksConfigManager.ts` — Hook基础设施：注册、事件、辅助、配置
- `execAgentHook.ts`, `execHttpHook.ts`, `execPromptHook.ts` — Hook执行器（Agent/HTTP/Prompt）
- `postSamplingHooks.ts`, `sessionHooks.ts`, `registerSkillHooks.ts`, `registerFrontmatterHooks.ts` — 采样后/会话/技能/Frontmatter钩子
- `apiQueryHookHelper.ts`, `fileChangedWatcher.ts`, `ssrfGuard.ts`, `skillImprovement.ts` — API查询辅助、文件监控、SSRF防护、技能改进
- `hooksConfigSnapshot.ts`, `hooksSettings.ts`, `src/` — 配置快照、设置、子模块
- 地位：Hook系统核心，提供可扩展的生命周期钩子机制

*"一旦这里的结构发生变化，请务必更新我... 就像重新标记领地一样。"*
