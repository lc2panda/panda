- `cli.tsx` — 主入口：CLI启动、运行时polyfill注入、feature flag与全局宏定义
- `init.ts` — 一次性初始化（遥测、配置、信任对话框）
- `mcp.ts` — MCP服务端入口
- `agentSdkTypes.ts`, `agentSdkTypes.js`, `sandboxTypes.ts` — SDK与沙箱类型定义
- `sdk/`, `src/` — SDK入口与子模块
- 地位：应用启动入口层，所有执行路径从此开始

*"一旦这里的结构发生变化，请务必更新我... 就像重新标记领地一样。"*
