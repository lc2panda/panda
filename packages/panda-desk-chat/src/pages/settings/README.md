# settings/

- SettingRow.tsx — 共享设置行布局组件（label + description + control slot），仅 ProvidersTab 内部细化字段时复用
- GeneralTab.tsx — 通用设置（主题、语言、Effort Level — cc-haha 满宽按钮组）
- AppearanceTab.tsx — 外观设置（主题满宽按钮 + 字号 slider）
- ProvidersTab.tsx — 旧 AI Provider 配置（未挂载主设置入口，保留兼容）
- PdProviderSettings.tsx — 当前服务商设置页（展示 CLI provider snapshot、settings.json、auth login 与脱敏认证状态）
- PermissionsTab.tsx — 工具权限模式（4 项 cc-haha 极简 radio cards）
- AboutTab.tsx — 关于信息（居中 max-w-lg + 80×80 图标 + 无背景）
- PdPandaEnvSettings.tsx — Comdr 指令: 22 个 PANDA_* 环境变量配置（功能/Agent/Cache/OAuth/Skill 5 组）— 真实读写 ~/.pandacc/settings.json env
- PdLearningSettings.tsx — Comdr 指令: 学习助手 settings sub-tab（写作/知识/学习/输出风格 4 子区块）— Output Styles 由顶级 tab 移入此处
- index.ts — barrel export

一旦这里的结构发生变化，请务必更新我... 就像重新标记领地一样。
