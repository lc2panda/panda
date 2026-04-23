// Input: chatStore.sendMessage for executing workflow commands
// Output: Workflow template list — click to execute slash commands
// Pos: PdSidebar workspace panel — replaces session list when workflow mode active

import { useCallback } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useSessionStore } from '@/stores/sessionStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WorkflowTemplate {
  id: string;
  icon: string;
  name: string;
  description: string;
  command: string;
  category: 'review' | 'plan' | 'fix' | 'security' | 'docs';
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

const WORKFLOWS: WorkflowTemplate[] = [
  {
    id: 'code-review',
    icon: '🔍',
    name: '代码审查',
    description: '审查当前代码变更，发现潜在问题',
    command: '/review',
    category: 'review',
  },
  {
    id: 'task-plan',
    icon: '📋',
    name: '任务分解',
    description: '将需求拆解为可执行的子任务',
    command: '/plan',
    category: 'plan',
  },
  {
    id: 'bug-fix',
    icon: '🐛',
    name: 'Bug 修复',
    description: '自主定位并修复 bug',
    command: '/autoresearch:fix',
    category: 'fix',
  },
  {
    id: 'security-audit',
    icon: '🛡️',
    name: '安全审计',
    description: 'STRIDE + OWASP 安全审查',
    command: '/autoresearch:security',
    category: 'security',
  },
  {
    id: 'doc-gen',
    icon: '📝',
    name: '文档生成',
    description: '自动补充代码文档和注释',
    command: '/autoresearch:learn',
    category: 'docs',
  },
  {
    id: 'debug-hunt',
    icon: '🎯',
    name: 'Debug 搜猎',
    description: '自主追踪异常行为和失败原因',
    command: '/autoresearch:debug',
    category: 'fix',
  },
  {
    id: 'scenario-explore',
    icon: '🔀',
    name: '场景探索',
    description: '探索多种方案和边界情况',
    command: '/autoresearch:scenario',
    category: 'plan',
  },
  {
    id: 'predict-analysis',
    icon: '🔮',
    name: '多角色预测',
    description: '多角度评估方案的影响和风险',
    command: '/autoresearch:predict',
    category: 'plan',
  },
  {
    id: 'ship-release',
    icon: '🚀',
    name: '发布工作流',
    description: '构建、测试、发版一键流程',
    command: '/autoresearch:ship',
    category: 'review',
  },
  {
    id: 'auto-iterate',
    icon: '♻️',
    name: '自主迭代',
    description: '代码优化的自主迭代循环',
    command: '/autoresearch',
    category: 'review',
  },
];

const CATEGORY_LABELS: Record<WorkflowTemplate['category'], string> = {
  review: '审查',
  plan: '规划',
  fix: '修复',
  security: '安全',
  docs: '文档',
};

const CATEGORY_COLORS: Record<WorkflowTemplate['category'], string> = {
  review: 'bg-blue-500/20 text-blue-400',
  plan: 'bg-purple-500/20 text-purple-400',
  fix: 'bg-orange-500/20 text-orange-400',
  security: 'bg-red-500/20 text-red-400',
  docs: 'bg-emerald-500/20 text-emerald-400',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WorkflowPanel() {
  const sendMessage = useChatStore((s) => s.sendMessage);
  const activeId = useSessionStore((s) => s.activeId);

  const handleExecute = useCallback(
    (wf: WorkflowTemplate) => {
      if (!activeId) {
        console.warn('[WorkflowPanel] No active session');
        return;
      }
      sendMessage(activeId, wf.command);
    },
    [activeId, sendMessage],
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="shrink-0 px-3 pb-2">
        <div className="flex items-center justify-between">
          <span className="text-[length:var(--pd-text-xs)] font-medium text-[var(--pd-color-fg-muted)]">
            工作流模板
          </span>
          <span className="text-[10px] text-[var(--pd-color-fg-subtle)]">
            {WORKFLOWS.length} 个
          </span>
        </div>
      </div>

      {/* Workflow list */}
      <div className="flex-1 overflow-y-auto px-2">
        {WORKFLOWS.map((wf) => (
          <button
            key={wf.id}
            onClick={() => handleExecute(wf)}
            className={[
              'mb-0.5 w-full rounded-[var(--pd-radius-md)] px-3 py-2.5 text-left',
              'transition-colors hover:bg-[var(--pd-color-bg-hover)]',
              !activeId ? 'cursor-not-allowed opacity-50' : '',
            ].join(' ')}
            disabled={!activeId}
            title={activeId ? `执行 ${wf.command}` : '请先选择一个会话'}
          >
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-base">{wf.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[length:var(--pd-text-sm)] font-medium text-[var(--pd-color-fg)]">
                    {wf.name}
                  </span>
                  <span
                    className={`shrink-0 rounded px-1 py-0.5 text-[10px] font-medium ${CATEGORY_COLORS[wf.category]}`}
                  >
                    {CATEGORY_LABELS[wf.category]}
                  </span>
                </div>
                <p className="mt-0.5 text-[length:var(--pd-text-xs)] text-[var(--pd-color-fg-muted)]">
                  {wf.description}
                </p>
              </div>
              <span className="shrink-0 text-[10px] font-mono text-[var(--pd-color-fg-subtle)]">
                {wf.command}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-[var(--pd-color-border)] px-3 py-2">
        <button
          className={[
            'w-full rounded-[var(--pd-radius-md)] py-1.5 text-center',
            'text-[length:var(--pd-text-xs)] font-medium',
            'bg-[var(--pd-color-bg-hover)] text-[var(--pd-color-fg-muted)]',
            'cursor-default opacity-50',
          ].join(' ')}
          disabled
          title="即将推出"
        >
          自定义工作流（即将推出）
        </button>
      </div>
    </div>
  );
}
