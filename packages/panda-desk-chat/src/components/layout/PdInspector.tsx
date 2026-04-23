// Input: activeTab, onTabChange, onClose
// Output: 右侧信息面板 320px，9 Tab
// Pos: App 右栏，可隐藏

import { type ComponentType, type ReactNode } from 'react';
import { X as _X } from 'lucide-react';
import { ContextPanel } from './inspector/ContextPanel';
import { FilesPanel } from './inspector/FilesPanel';
import { DiffPanel } from './inspector/DiffPanel';
import { AgentsPanel } from './inspector/AgentsPanel';

type IconFC = ComponentType<{ className?: string; size?: number }>;
const X = _X as IconFC;

const INSPECTOR_TABS = [
  { id: 'context', label: '上下文' },
  { id: 'files', label: '文件' },
  { id: 'tasks', label: '任务' },
  { id: 'diff', label: '差异' },
  { id: 'preview', label: '预览' },
  { id: 'agents', label: 'Agents' },
  { id: 'sideChat', label: '侧聊' },
  { id: 'buddyLog', label: 'Buddy' },
  { id: 'petState', label: '宠物' },
] as const;

export interface PdInspectorProps {
  activeTab: number;
  onTabChange: (tab: number) => void;
  onClose: () => void;
}

/** Map tab id to implemented panel or placeholder */
function renderTabContent(tabId: string | undefined): ReactNode {
  switch (tabId) {
    case 'context':
      return <ContextPanel />;
    case 'files':
      return <FilesPanel />;
    case 'diff':
      return <DiffPanel />;
    case 'agents':
      return <AgentsPanel />;
    default:
      return (
        <div className="p-3">
          <div className="pt-10 text-center text-[var(--pd-text-sm)] text-[var(--pd-color-fg-muted)]">
            {tabId ?? 'Inspector'} 面板
          </div>
        </div>
      );
  }
}

export function PdInspector({ activeTab, onTabChange, onClose }: PdInspectorProps) {
  return (
    <div
      className="flex flex-col border-l border-[var(--pd-color-border)] bg-[var(--pd-color-bg-elevated)]"
      style={{ width: '320px', minWidth: '320px', height: '100%' }}
    >
      {/* Header */}
      <div
        className="flex shrink-0 items-center justify-between border-b border-[var(--pd-color-border)] px-3"
        style={{ height: 'var(--pd-tabbar-height, 40px)' }}
      >
        <span className="text-sm font-semibold">
          {INSPECTOR_TABS[activeTab]?.label ?? 'Inspector'}
        </span>
        <button
          onClick={onClose}
          className="cursor-pointer rounded-[var(--pd-radius-sm)] border-none bg-transparent p-1 text-[var(--pd-color-fg-muted)] hover:bg-[var(--pd-color-bg-hover)]"
        >
          <X size={16} />
        </button>
      </div>

      {/* Tab strip */}
      <div
        className="flex shrink-0 gap-0.5 overflow-x-auto border-b border-[var(--pd-color-border)] px-2 py-1"
      >
        {INSPECTOR_TABS.map((tab, i) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(i)}
            className="cursor-pointer whitespace-nowrap rounded-[var(--pd-radius-sm)] border-none px-2 py-1 text-[11px]"
            style={{
              background: i === activeTab ? 'var(--pd-color-bg-hover)' : 'transparent',
              color: i === activeTab ? 'var(--pd-color-fg)' : 'var(--pd-color-fg-muted)',
              fontWeight: i === activeTab ? 500 : 400,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {renderTabContent(INSPECTOR_TABS[activeTab]?.id)}
      </div>
    </div>
  );
}
