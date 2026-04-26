// Input: useUIStore.pendingSettingsTab + ui events
// Output: 11-tab settings shell — left 180px nav + right px-8 py-6 content
// Pos: Settings page root — equivalent to cc-haha Settings.tsx outer frame
//
// Source 1:1: cc-haha desktop/src/pages/Settings.tsx L32-L98 (主框架 + TabButton)
//   面板组件分别拆到 PdProviderSettings / PdPermissionSettings / PdGeneralSettings /
//   PdAdapterSettings / PdTerminalSettings / PdMcpSettings / PdAgentsSettings /
//   PdSkillSettings / PdPluginSettings / PdComputerUseSettings / PdAboutSettings。
//   className 严格按 cc-haha L43-L98（var(--color-*) → var(--pd-color-*)）。
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { useEffect, useState } from 'react';
import { t } from '../../i18n';
import { useUIStore, type SettingsTab } from '../../stores/uiStore';
import { PdProviderSettings } from './PdProviderSettings';
import { PdPermissionSettings } from './PdPermissionSettings';
// Comdr 指令: 超级助手 settings sub-tab
import { PdSuperAssistantSettings } from './PdSuperAssistantSettings';
import { PdGeneralSettings } from './PdGeneralSettings';
// Comdr 指令: PANDA_* 22 个环境变量配置 sub-tab
import { PdPandaEnvSettings } from './PdPandaEnvSettings';
import { PdAdapterSettings } from './PdAdapterSettings';
import { PdTerminalSettings } from './PdTerminalSettings';
import { PdMcpSettings } from './PdMcpSettings';
import { PdAgentsSettings } from './PdAgentsSettings';
import { PdSkillSettings } from './PdSkillSettings';
import { PdPluginSettings } from './PdPluginSettings';
import { PdComputerUseSettings } from './PdComputerUseSettings';
// Comdr 指令: 数据连接器从 Sidebar 移到 Settings — 直接复用 page 组件
import { PdConnectors as PdConnectorsAsSettings } from '../PdConnectors';
// Comdr 指令: panda 独有能力补齐 — Group 2（4 个新 settings sub-tab）
import { PdRoutingSettings } from './PdRoutingSettings';
import { PdHooksSettings } from './PdHooksSettings';
// Comdr 指令: 学习助手 + Output Styles 重组 — Output Styles 不再是顶级 tab，
//   仅作为学习助手 sub-tab 的第 4 个子区块内嵌引用；保留文件本身。
import { PdLearningSettings } from './PdLearningSettings';
import { PdVoiceSettings } from './PdVoiceSettings';
import { PdAboutSettings } from './PdAboutSettings';
// Comdr 指令 cc-haha 路线 A 调整：工具调试从 Sidebar 迁入 Settings；直接复用 page 组件。
import { PdToolInspection } from '../PdToolInspection';

export function PdSettings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('providers');
  const pendingSettingsTab = useUIStore((s) => s.pendingSettingsTab);

  useEffect(() => {
    if (!pendingSettingsTab) return;
    setActiveTab(pendingSettingsTab);
    useUIStore.getState().setPendingSettingsTab(null);
  }, [pendingSettingsTab]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--pd-color-surface)]">
      <div className="flex-1 flex overflow-hidden">
        {/* Tab navigation */}
        <div className="w-[180px] border-r border-[var(--pd-color-border)] py-3 flex-shrink-0 flex flex-col">
          <div className="flex-1">
            <TabButton icon="dns" label={t('settings.tab.providers')} active={activeTab === 'providers'} onClick={() => setActiveTab('providers')} />
            <TabButton icon="shield" label={t('settings.tab.permissions')} active={activeTab === 'permissions'} onClick={() => setActiveTab('permissions')} />
            {/* Comdr 指令: 超级助手 sub-tab — 放在 permissions 之后、general 之前 */}
            <TabButton icon="psychology" label={t('settings.tab.superAssistant')} active={activeTab === 'superAssistant'} onClick={() => setActiveTab('superAssistant')} />
            {/* Comdr 指令: 学习助手 + Output Styles 重组 — 学习助手 sub-tab，紧随超级助手之后 */}
            <TabButton icon="school" label={t('settings.tab.learning')} active={activeTab === 'learning'} onClick={() => setActiveTab('learning')} />
            <TabButton icon="tune" label={t('settings.tab.general')} active={activeTab === 'general'} onClick={() => setActiveTab('general')} />
            {/* Comdr 指令: PANDA_* env vars sub-tab — general 之后、adapters 之前 */}
            <TabButton icon="developer_mode" label={t('settings.tab.pandaEnv')} active={activeTab === 'pandaEnv'} onClick={() => setActiveTab('pandaEnv')} />
            <TabButton icon="chat" label={t('settings.tab.adapters')} active={activeTab === 'adapters'} onClick={() => setActiveTab('adapters')} />
            {/* Comdr 指令: 数据连接器从 Sidebar 移到 Settings */}
            <TabButton icon="cable" label={t('settings.tab.connectors')} active={activeTab === 'connectors'} onClick={() => setActiveTab('connectors')} />
            <TabButton icon="terminal" label={t('settings.tab.terminal')} active={activeTab === 'terminal'} onClick={() => setActiveTab('terminal')} />
            <TabButton icon="dns" label={t('settings.tab.mcp')} active={activeTab === 'mcp'} onClick={() => setActiveTab('mcp')} />
            <TabButton icon="smart_toy" label={t('settings.tab.agents')} active={activeTab === 'agents'} onClick={() => setActiveTab('agents')} />
            <TabButton icon="auto_awesome" label={t('settings.tab.skills')} active={activeTab === 'skills'} onClick={() => setActiveTab('skills')} />
            <TabButton icon="extension" label={t('settings.tab.plugins')} active={activeTab === 'plugins'} onClick={() => setActiveTab('plugins')} />
            <TabButton icon="mouse" label={t('settings.tab.computerUse')} active={activeTab === 'computerUse'} onClick={() => setActiveTab('computerUse')} />
            {/* Comdr 指令 cc-haha 路线 A 调整：工具调试从 Sidebar 迁入 Settings，紧随 computerUse 之后 */}
            <TabButton icon="bug_report" label={t('settings.tab.toolInspection')} active={activeTab === 'toolInspection'} onClick={() => setActiveTab('toolInspection')} />
            {/* Comdr 指令: panda 独有能力补齐 — Group 2（4 个新 sub-tab，紧随 computerUse 之后） */}
            <TabButton icon="route" label={t('settings.tab.routing')} active={activeTab === 'routing'} onClick={() => setActiveTab('routing')} />
            <TabButton icon="webhook" label={t('settings.tab.hooks')} active={activeTab === 'hooks'} onClick={() => setActiveTab('hooks')} />
            {/* Comdr 指令: 学习助手 + Output Styles 重组 — 移除顶级 outputStyles tab，并入 learning sub-tab */}
            <TabButton icon="mic" label={t('settings.tab.voice')} active={activeTab === 'voice'} onClick={() => setActiveTab('voice')} />
          </div>
          <div className="border-t border-[var(--pd-color-border)]/40 pt-1">
            <TabButton icon="info" label={t('settings.tab.about')} active={activeTab === 'about'} onClick={() => setActiveTab('about')} />
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {activeTab === 'providers' && <PdProviderSettings />}
          {activeTab === 'permissions' && <PdPermissionSettings />}
          {/* Comdr 指令: 超级助手 sub-tab content */}
          {activeTab === 'superAssistant' && <PdSuperAssistantSettings />}
          {/* Comdr 指令: 学习助手 + Output Styles 重组 — 学习助手 sub-tab content */}
          {activeTab === 'learning' && <PdLearningSettings />}
          {activeTab === 'general' && <PdGeneralSettings />}
          {/* Comdr 指令: PANDA_* env vars sub-tab content */}
          {activeTab === 'pandaEnv' && <PdPandaEnvSettings />}
          {activeTab === 'adapters' && <PdAdapterSettings />}
          {/* Comdr 指令: 数据连接器从 Sidebar 移到 Settings — 复用 PdConnectors page 内容 */}
          {activeTab === 'connectors' && <PdConnectorsAsSettings />}
          {activeTab === 'terminal' && <PdTerminalSettings />}
          {activeTab === 'mcp' && <PdMcpSettings />}
          {activeTab === 'agents' && <PdAgentsSettings />}
          {activeTab === 'skills' && <PdSkillSettings />}
          {activeTab === 'plugins' && <PdPluginSettings />}
          {activeTab === 'computerUse' && <PdComputerUseSettings />}
          {/* Comdr 指令 cc-haha 路线 A 调整：工具调试 sub-tab content — 复用 PdToolInspection page 组件 */}
          {activeTab === 'toolInspection' && <PdToolInspection />}
          {/* Comdr 指令: panda 独有能力补齐 — Group 2（4 个新 sub-tab content） */}
          {activeTab === 'routing' && <PdRoutingSettings />}
          {activeTab === 'hooks' && <PdHooksSettings />}
          {/* Comdr 指令: 学习助手 + Output Styles 重组 — outputStyles 不再独立路由，已并入 learning sub-tab */}
          {activeTab === 'voice' && <PdVoiceSettings />}
          {activeTab === 'about' && <PdAboutSettings />}
        </div>
      </div>
    </div>
  );
}

function TabButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      data-tab={label}
      aria-selected={active}
      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors ${
        active
          ? 'bg-[var(--pd-color-surface-selected)] text-[var(--pd-color-text-primary)] font-medium'
          : 'text-[var(--pd-color-text-secondary)] hover:bg-[var(--pd-color-surface-hover)]'
      }`}
    >
      {/* V4 修复: cc-haha L94 — material-symbols ligature span 需 aria-hidden 避免 screen reader 读出 "dns" 这类内部字面量 */}
      <span aria-hidden="true" className="material-symbols-outlined text-[18px]">{icon}</span>
      {label}
    </button>
  );
}

export default PdSettings;
