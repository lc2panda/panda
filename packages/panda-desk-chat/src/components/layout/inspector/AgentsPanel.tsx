// Input: chatStore (active session messages → Agent tool calls with prompt/result)
// Output: 子 Agent 状态树 — 显示 agent 调用列表、状态图标、可展开详情
// Pos: PdInspector > agents tab 内容区

import { useState, useMemo } from 'react';
import { useChatStore, type UIToolCall } from '../../../stores/chatStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AgentEntry {
  id: string;
  prompt: string;
  result?: string;
  status: 'pending' | 'running' | 'success' | 'error';
  isError?: boolean;
}

// ---------------------------------------------------------------------------
// Extract agent calls
// ---------------------------------------------------------------------------

function extractAgents(messages: { toolCalls?: UIToolCall[] }[]): AgentEntry[] {
  const agents: AgentEntry[] = [];

  for (const msg of messages) {
    if (!msg.toolCalls) continue;
    for (const tc of msg.toolCalls) {
      const lower = tc.toolName.toLowerCase();
      if (!lower.includes('agent')) continue;

      const input = tc.input;
      const prompt =
        typeof input?.prompt === 'string'
          ? input.prompt
          : typeof input?.task === 'string'
            ? input.task
            : typeof input?.description === 'string'
              ? input.description
              : JSON.stringify(input).slice(0, 120);

      agents.push({
        id: tc.id,
        prompt,
        result: tc.result,
        status: tc.status,
        isError: tc.isError,
      });
    }
  }

  return agents;
}

// ---------------------------------------------------------------------------
// Status rendering
// ---------------------------------------------------------------------------

const STATUS_ICON: Record<string, string> = {
  pending: '\u23F3',    // hourglass
  running: '\u{1F504}', // rotating arrows
  success: '\u2705',    // check mark
  error: '\u274C',      // cross mark
};

const STATUS_LABEL: Record<string, string> = {
  pending: '等待中',
  running: '运行中...',
  success: '完成',
  error: '失败',
};

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

interface AgentItemProps {
  agent: AgentEntry;
}

function AgentItem({ agent }: AgentItemProps) {
  const [expanded, setExpanded] = useState(false);

  // Truncate prompt for display
  const shortPrompt =
    agent.prompt.length > 60 ? agent.prompt.slice(0, 57) + '...' : agent.prompt;

  return (
    <div className="rounded border border-[var(--pd-color-border)] overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full cursor-pointer items-center gap-2 border-none bg-transparent px-3 py-2 text-left hover:bg-[var(--pd-color-bg-hover)]"
      >
        <span
          className={`text-sm ${agent.status === 'running' ? 'animate-spin' : ''}`}
          style={
            agent.status === 'running'
              ? { animation: 'spin 1.5s linear infinite' }
              : undefined
          }
        >
          {STATUS_ICON[agent.status] ?? '\u2754'}
        </span>
        <span className="flex-1 truncate text-xs text-[var(--pd-color-fg)]">
          {shortPrompt}
        </span>
        <span
          className={`shrink-0 text-[10px] font-medium ${
            agent.status === 'success'
              ? 'text-emerald-400'
              : agent.status === 'error'
                ? 'text-red-400'
                : agent.status === 'running'
                  ? 'text-blue-400'
                  : 'text-[var(--pd-color-fg-muted)]'
          }`}
        >
          {STATUS_LABEL[agent.status] ?? agent.status}
        </span>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-[var(--pd-color-border)] bg-[var(--pd-color-bg-hover)] px-3 py-2">
          {/* Prompt */}
          <div className="mb-2">
            <div className="mb-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--pd-color-fg-muted)]">
              提示词
            </div>
            <pre className="m-0 overflow-x-auto whitespace-pre-wrap font-mono text-[11px] text-[var(--pd-color-fg)]">
              {agent.prompt}
            </pre>
          </div>

          {/* Result */}
          {agent.result && (
            <div>
              <div className="mb-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--pd-color-fg-muted)]">
                结果
              </div>
              <pre className="m-0 max-h-[200px] overflow-y-auto overflow-x-auto whitespace-pre-wrap font-mono text-[11px] text-[var(--pd-color-fg)]">
                {agent.result.length > 500 ? agent.result.slice(0, 497) + '...' : agent.result}
              </pre>
            </div>
          )}

          {/* No result yet */}
          {!agent.result && agent.status === 'running' && (
            <div className="text-[11px] text-[var(--pd-color-fg-muted)] italic">
              正在执行...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function AgentsPanel() {
  const session = useChatStore((s) => s.getActiveSession());
  const messages = session?.messages ?? [];

  const agents = useMemo(() => extractAgents(messages), [messages]);

  const counts = useMemo(() => {
    const c = { total: agents.length, running: 0, success: 0, error: 0, pending: 0 };
    for (const a of agents) {
      if (a.status === 'running') c.running++;
      else if (a.status === 'success') c.success++;
      else if (a.status === 'error') c.error++;
      else c.pending++;
    }
    return c;
  }, [agents]);

  return (
    <div className="flex flex-col gap-3 p-4">
      {/* Title */}
      <h3 className="text-sm font-semibold text-[var(--pd-fg)]">
        子 Agent ({agents.length})
      </h3>
      <div className="border-t border-[var(--pd-color-border)]" />

      {/* Summary badges */}
      {agents.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {counts.success > 0 && (
            <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
              \u2705 {counts.success} 完成
            </span>
          )}
          {counts.running > 0 && (
            <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-medium text-blue-400">
              {'\u{1F504}'} {counts.running} 运行中
            </span>
          )}
          {counts.error > 0 && (
            <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-medium text-red-400">
              \u274C {counts.error} 失败
            </span>
          )}
          {counts.pending > 0 && (
            <span className="rounded bg-gray-500/20 px-1.5 py-0.5 text-[10px] font-medium text-gray-400">
              \u23F3 {counts.pending} 等待
            </span>
          )}
        </div>
      )}

      {/* Agent list */}
      {agents.length === 0 ? (
        <div className="py-8 text-center text-xs text-[var(--pd-color-fg-muted)]">
          暂无子 Agent 调用
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 overflow-y-auto">
          {agents.map((agent) => (
            <AgentItem key={agent.id} agent={agent} />
          ))}
        </div>
      )}

      {/* CSS for spin animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
