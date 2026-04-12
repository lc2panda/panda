- `index.ts`, `routeResolver.ts`, `taskClassifier.ts`, `capabilityRegistry.ts` — 路由核心：任务分类、能力注册、路由解析
- `configValidator.ts`, `formatAlignment.ts`, `presets.ts`, `types.ts` — 配置校验、格式对齐、预设与类型
- 地位：消息/任务路由层，决定请求如何分发到各能力模块

*"一旦这里的结构发生变化，请务必更新我... 就像重新标记领地一样。"*
