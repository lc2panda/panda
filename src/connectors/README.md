- `aggregator.ts`, `config.ts`, `mcpBridge.ts`, `registry.ts`, `types.ts` — 连接器核心：聚合、配置、MCP桥接、注册中心与类型定义
- `wechat/`, `slack/`, `telegram/`, `feishu/`, `dingtalk/`, `teams/` — 各IM平台连接器实现
- 地位：IM多平台接入层入口，所有外部消息通道在此汇聚

*"一旦这里的结构发生变化，请务必更新我... 就像重新标记领地一样。"*
