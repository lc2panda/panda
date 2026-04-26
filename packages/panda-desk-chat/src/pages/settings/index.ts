// Input: settings tab modules
// Output: barrel re-exports for SettingsPage / PdContentRouter consumption
// Pos: settings/index — single entry point for settings page

export { PdSettings } from './PdSettings';
export { default as PdSettingsDefault } from './PdSettings';
export { PdProviderSettings } from './PdProviderSettings';
export { PdPermissionSettings } from './PdPermissionSettings';
export { PdGeneralSettings } from './PdGeneralSettings';
// Comdr 指令: PANDA_* 22 env vars sub-tab
export { PdPandaEnvSettings } from './PdPandaEnvSettings';
export { PdAdapterSettings } from './PdAdapterSettings';
export { PdTerminalSettings } from './PdTerminalSettings';
export { PdMcpSettings } from './PdMcpSettings';
export { PdAgentsSettings } from './PdAgentsSettings';
export { PdSkillSettings } from './PdSkillSettings';
export { PdPluginSettings } from './PdPluginSettings';
export { PdComputerUseSettings } from './PdComputerUseSettings';
// Comdr 指令: 学习助手 + Output Styles 重组 — 学习助手 settings sub-tab
export { PdLearningSettings } from './PdLearningSettings';
export { PdAboutSettings } from './PdAboutSettings';
