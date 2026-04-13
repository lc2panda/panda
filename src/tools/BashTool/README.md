- `BashTool.tsx` — Bash命令执行工具主实现
- `outputCompressor.ts` — BashTool输出智能压缩（LLM token节省），支持10种命令策略 + 通用fallback
- `bashCommandHelpers.ts`, `bashPermissions.ts`, `bashSecurity.ts`, `commandSemantics.ts` — 命令辅助、权限、安全与语义分析
- `sedEditParser.ts`, `sedValidation.ts`, `pathValidation.ts`, `modeValidation.ts`, `readOnlyValidation.ts` — sed解析与各类校验
- `shouldUseSandbox.ts`, `destructiveCommandWarning.ts`, `commentLabel.ts`, `toolName.ts`, `utils.ts` — 沙箱判定、危险命令警告、工具函数
- `prompt.ts`, `UI.tsx`, `BashToolResultMessage.tsx`, `src/` — 提示词、UI渲染与子模块
- 地位：工具系统核心成员，提供终端命令执行能力（含安全沙箱）

*"一旦这里的结构发生变化，请务必更新我... 就像重新标记领地一样。"*
