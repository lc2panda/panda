// Input:  LocalWorkflowTaskState (workflow + agents[]) + kill/skip/retry callbacks (真接线)
// Output: per-step progress UI + kill/skip/retry buttons wired to LocalWorkflowTask backend functions
// Pos:    src/components/tasks/WorkflowDetailDialog.tsx — detail panel rendered by
//         BackgroundTasksDialog when user selects a local_workflow item
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"

import figures from 'figures';
import React from 'react';
import type { DeepImmutable } from 'src/types/utils.js';
import { useElapsedTime } from '../../hooks/useElapsedTime.js';
import type { KeyboardEvent } from '../../ink/events/keyboard-event.js';
import { Box, Text, useTheme } from '../../ink.js';
import { useKeybindings } from '../../keybindings/useKeybinding.js';
import type { CommandResultDisplay } from '../../types/command.js';
import type { LocalWorkflowTaskState, WorkflowAgentState, WorkflowAgentStatus } from '../../tasks/LocalWorkflowTask/LocalWorkflowTask.js';
import { Byline } from '../design-system/Byline.js';
import { Dialog } from '../design-system/Dialog.js';
import { KeyboardShortcutHint } from '../design-system/KeyboardShortcutHint.js';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type Props = {
  workflow: DeepImmutable<LocalWorkflowTaskState>;
  onDone: (result?: string, options?: { display?: CommandResultDisplay | 'none' }) => void;
  /** 真接线：caller 已绑定 killWorkflowTask(id, setAppState) */
  onKill?: () => void;
  /** 真接线：caller 已绑定 skipWorkflowAgent(id, agentId, setAppState) */
  onSkipAgent?: (agentId: string) => void;
  /** 真接线：caller 已绑定 retryWorkflowAgent(id, agentId, setAppState) */
  onRetryAgent?: (agentId: string) => void;
  onBack?: () => void;
};

// ---------------------------------------------------------------------------
// Status helpers for WorkflowAgentStatus (独立于 TaskStatus，需单独映射)
// ---------------------------------------------------------------------------

function agentStatusIcon(status: WorkflowAgentStatus): string {
  switch (status) {
    case 'running':  return figures.play;
    case 'completed': return figures.tick;
    case 'failed':   return figures.cross;
    case 'killed':   return figures.warning;
    case 'skipped':  return figures.bullet;
    case 'pending':  return figures.ellipsis;
    default:         return figures.bullet;
  }
}

function agentStatusColor(status: WorkflowAgentStatus): string {
  switch (status) {
    case 'running':   return 'cyan';
    case 'completed': return 'green';
    case 'failed':    return 'red';
    case 'killed':    return 'yellow';
    case 'skipped':   return 'gray';
    case 'pending':   return 'gray';
    default:          return 'gray';
  }
}

// Whether this agent can be skipped (pending or running → can skip)
function canSkip(status: WorkflowAgentStatus): boolean {
  return status === 'pending' || status === 'running';
}

// Whether this agent can be retried (failed or skipped → can retry)
function canRetry(status: WorkflowAgentStatus): boolean {
  return status === 'failed' || status === 'skipped';
}

// ---------------------------------------------------------------------------
// Per-agent row
// ---------------------------------------------------------------------------

type AgentRowProps = {
  agent: DeepImmutable<WorkflowAgentState>;
  isSelected: boolean;
  workflowRunning: boolean;
  onSkipAgent?: (agentId: string) => void;
  onRetryAgent?: (agentId: string) => void;
};

function AgentRow({ agent, isSelected, workflowRunning, onSkipAgent, onRetryAgent }: AgentRowProps) {
  const [theme] = useTheme();
  const icon = agentStatusIcon(agent.status as WorkflowAgentStatus);
  const color = agentStatusColor(agent.status as WorkflowAgentStatus);

  const showSkip   = workflowRunning && canSkip(agent.status as WorkflowAgentStatus) && onSkipAgent != null;
  const showRetry  = workflowRunning && canRetry(agent.status as WorkflowAgentStatus) && onRetryAgent != null;

  return (
    <Box flexDirection="row" marginLeft={1}>
      {/* 选中指示符 */}
      <Text color={isSelected ? theme.colors.primary : undefined}>
        {isSelected ? figures.pointer : ' '}
      </Text>
      {/* 状态图标 */}
      <Text color={color}>{' '}{icon}{' '}</Text>
      {/* Step label (stepId) */}
      <Text>{agent.stepId}</Text>
      {/* 状态文字 */}
      <Text dimColor>{' '}[{agent.status}]</Text>
      {/* Skip/Retry 按钮提示（行内，仅当此行被选中时展示） */}
      {isSelected && (
        <Box marginLeft={2} flexDirection="row" gap={2}>
          {showSkip && (
            <Text color="yellow">[s] skip</Text>
          )}
          {showRetry && (
            <Text color="cyan">[r] retry</Text>
          )}
        </Box>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// WorkflowDetailDialog
// ---------------------------------------------------------------------------

export function WorkflowDetailDialog({
  workflow,
  onDone,
  onKill,
  onSkipAgent,
  onRetryAgent,
  onBack,
}: Props) {
  const [selectedAgentIndex, setSelectedAgentIndex] = React.useState(0);
  const elapsedTime = useElapsedTime(workflow.startTime, workflow.status === 'running', 1000, 0);

  const agents = workflow.agents ?? [];
  const isRunning = workflow.status === 'running';
  // Clamp selection
  const clampedIndex = Math.max(0, Math.min(selectedAgentIndex, agents.length - 1));

  // -------------------------------------------------------------------------
  // Keyboard handling
  // -------------------------------------------------------------------------

  const handleClose = () => {
    onDone('Workflow detail closed', { display: 'system' });
  };

  useKeybindings({
    'confirm:yes': handleClose,
  }, {
    context: 'Confirmation',
    isActive: true,
  });

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' || e.key === 'ArrowLeft') {
      if (onBack) {
        onBack();
      } else {
        handleClose();
      }
      return;
    }
    // Navigate agents list
    if (e.key === 'ArrowUp' || (e.key === 'k' && !e.ctrlKey)) {
      setSelectedAgentIndex(i => Math.max(0, i - 1));
      return;
    }
    if (e.key === 'ArrowDown' || (e.key === 'j' && !e.ctrlKey)) {
      setSelectedAgentIndex(i => Math.min(agents.length - 1, i + 1));
      return;
    }
    // x → kill entire workflow
    if (e.key === 'x' && isRunning && onKill) {
      onKill();
      return;
    }
    // s → skip selected agent（真接线 skipWorkflowAgent）
    if (e.key === 's' && agents[clampedIndex]) {
      const agent = agents[clampedIndex];
      if (
        isRunning &&
        canSkip(agent.status as WorkflowAgentStatus) &&
        onSkipAgent
      ) {
        onSkipAgent(agent.agentTaskId);
      }
      return;
    }
    // r → retry selected agent（真接线 retryWorkflowAgent）
    if (e.key === 'r' && agents[clampedIndex]) {
      const agent = agents[clampedIndex];
      if (
        isRunning &&
        canRetry(agent.status as WorkflowAgentStatus) &&
        onRetryAgent
      ) {
        onRetryAgent(agent.agentTaskId);
      }
      return;
    }
  };

  // -------------------------------------------------------------------------
  // Header
  // -------------------------------------------------------------------------

  const totalSteps     = agents.length;
  const completedSteps = agents.filter(a => a.status === 'completed').length;
  const failedSteps    = agents.filter(a => a.status === 'failed').length;
  const skippedSteps   = agents.filter(a => a.status === 'skipped').length;

  const title    = workflow.workflowName ?? workflow.description ?? 'Workflow';
  const subtitle = `${completedSteps}/${totalSteps} steps · ${elapsedTime}` +
    (failedSteps  > 0 ? ` · ${failedSteps} failed`  : '') +
    (skippedSteps > 0 ? ` · ${skippedSteps} skipped` : '');

  // -------------------------------------------------------------------------
  // Input guide (底部快捷键提示)
  // -------------------------------------------------------------------------

  const inputGuide = (exitState: { pending: boolean; keyName: string }) => {
    if (exitState.pending) {
      return <Text>Press {exitState.keyName} again to exit</Text>;
    }
    return (
      <Byline>
        {onBack && <KeyboardShortcutHint shortcut="←" action="go back" />}
        <KeyboardShortcutHint shortcut="↑↓" action="navigate steps" />
        {isRunning && onKill && <KeyboardShortcutHint shortcut="x" action="kill workflow" />}
        {isRunning && onSkipAgent && <KeyboardShortcutHint shortcut="s" action="skip step" />}
        {isRunning && onRetryAgent && <KeyboardShortcutHint shortcut="r" action="retry step" />}
        <KeyboardShortcutHint shortcut="Esc/Enter" action="close" />
      </Byline>
    );
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <Box flexDirection="column" tabIndex={0} autoFocus={true} onKeyDown={handleKeyDown}>
      <Dialog
        title={title}
        subtitle={subtitle}
        onCancel={handleClose}
        color="background"
        inputGuide={inputGuide}
      >
        <Box flexDirection="column">
          {/* Summary line */}
          <Box marginBottom={1}>
            <Text dimColor>
              Status: <Text color={workflow.status === 'running' ? 'cyan' : workflow.status === 'completed' ? 'green' : 'red'}>{workflow.status}</Text>
            </Text>
          </Box>

          {/* Per-agent rows */}
          {agents.length === 0 ? (
            <Text dimColor>No steps registered yet…</Text>
          ) : (
            <Box flexDirection="column">
              {agents.map((agent, idx) => (
                <AgentRow
                  key={agent.agentTaskId}
                  agent={agent}
                  isSelected={idx === clampedIndex}
                  workflowRunning={isRunning}
                  onSkipAgent={onSkipAgent}
                  onRetryAgent={onRetryAgent}
                />
              ))}
            </Box>
          )}

          {/* Summary / error message */}
          {workflow.summary && (
            <Box marginTop={1}>
              <Text dimColor>{workflow.summary}</Text>
            </Box>
          )}
        </Box>
      </Dialog>
    </Box>
  );
}
