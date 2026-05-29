// Input: 来自 enumerateSessions() 的 SessionEntry[] + 用户键盘事件
// Output: Ink 渲染的 TUI dashboard，调用 callbacks 触发 attach / dispatch / exit
// Pos: src/components/AgentView/ —— Tier 1 旗舰 TUI 主组件

import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Box, Text, useApp, useInput } from '../../ink.js';
import { PeekPanel } from './PeekPanel.js';
import { StatusGrouping } from './StatusGrouping.js';
import { useAgentViewState } from './useAgentViewState.js';
import { useAgentViewKeybindings, type AgentViewCallbacks } from './useAgentViewKeybindings.js';
import type { SessionEntry } from './types.js';
import { upsertRosterEntry } from './roster.js';
import { editPromptInEditor } from '../../utils/promptEditor.js';
import { errorMessage } from '../../utils/errors.js';

const ANIMATION_MS = 500;

/**
 * Encode an attach/dispatch action into a structured exit code carrier.
 * The handler (`agentViewHandler`) reads it after Ink unmounts and re-spawns
 * panda with the right args. This avoids spawning a child while Ink still
 * owns raw mode (which would deadlock both stdins).
 *
 * Tier 1 simplification: dashboard exit + re-spawn instead of supervisor
 * with stable TTY hand-off. Tier 2 will replace this with persistent
 * dashboard + foregrounded session via PTY.
 */
export type AgentViewExitAction =
  | { kind: 'quit' }
  | { kind: 'attach'; sessionId: string; cwd: string }
  | { kind: 'dispatch'; cwd: string; draft: string }
  | { kind: 'shell'; command: string; cwd: string };

let lastExitAction: AgentViewExitAction = { kind: 'quit' };

export function getLastExitAction(): AgentViewExitAction {
  return lastExitAction;
}

export function _resetLastExitActionForTests(): void {
  lastExitAction = { kind: 'quit' };
}

export function AgentViewDashboard(): React.ReactElement {
  const { exit } = useApp();
  const { state, actions, selected } = useAgentViewState();
  const [tick, setTick] = useState(0);

  // Working 状态的图标在 500ms 节拍上切换。
  useEffect(() => {
    const id = setInterval(() => setTick(t => (t + 1) % 1_000_000), ANIMATION_MS);
    return () => clearInterval(id);
  }, []);

  const callbacks: AgentViewCallbacks = useMemo(
    () => ({
      onAttach: entry => {
        // Tier 1: dashboard exits, handler re-spawns panda with --resume.
        // 同时把 entry 提升到 roster 持久化 lastSeenAt。
        if (!entry.sessionId) {
          actions.setError(`Cannot attach: '${entry.displayName}' has no session ID.`);
          setTimeout(() => actions.setError(null), 2_000);
          return;
        }
        void upsertRosterEntry({
          id: entry.id.startsWith('pid:') ? entry.sessionId : entry.id,
          name: entry.displayName,
          sessionId: entry.sessionId,
          cwd: entry.cwd,
          pinned: entry.pinned,
          createdAt: entry.startedAt,
          lastSeenAt: Date.now(),
        }).catch(() => undefined);
        lastExitAction = {
          kind: 'attach',
          sessionId: entry.sessionId,
          cwd: entry.cwd,
        };
        exit();
      },
      onDispatchAndAttach: (entry, draft) => {
        lastExitAction = {
          kind: 'dispatch',
          cwd: entry?.cwd ?? process.cwd(),
          draft,
        };
        exit();
      },
      onSpawnShell: (command) => {
        lastExitAction = {
          kind: 'shell',
          command,
          cwd: process.cwd(),
        };
        exit();
      },
      onEditPrompt: () => {
        // Tier 2: spawnSync $EDITOR with the current dispatchPrompt as initial
        // content. editPromptInEditor() handles Ink alt-screen handoff
        // internally (pause/suspend stdin, enter alt screen, exec editor, exit
        // alt screen, resume). Returns the edited content (or null on error /
        // editor missing). We swallow null silently — user can press Ctrl+G
        // again or just keep typing.
        try {
          const result = editPromptInEditor(state.dispatchPrompt);
          if (result.error) {
            actions.setError(`Editor: ${result.error}`);
            setTimeout(() => actions.setError(null), 3_000);
            return;
          }
          if (result.content !== null) {
            actions.setDispatchPrompt(result.content);
          }
        } catch (e) {
          actions.setError(`Editor failed: ${errorMessage(e)}`);
          setTimeout(() => actions.setError(null), 3_000);
        }
      },
      onStop: entry => {
        // Tier 1: roster removal happens in keybinding (already done by the
        // time onStop fires). Just surface confirmation.
        actions.setError(`Stopped tracking '${entry.displayName}'.`);
        setTimeout(() => actions.setError(null), 2_000);
      },
      onExit: () => {
        lastExitAction = { kind: 'quit' };
        exit();
      },
    }),
    // state.dispatchPrompt 必须列在 deps，否则 Ctrl+G 闭包里读到的是旧字符串。
    [actions, exit, state.dispatchPrompt],
  );

  const handleInput = useAgentViewKeybindings(state, actions, callbacks);
  useInput((input, key) => {
    handleInput(input, key);
  });

  const helpLine = state.renameMode
    ? `Rename: ${state.renameDraft}_ · Enter save · Esc cancel`
    : '↑↓ move · Enter attach · Shift+Enter dispatch · Space peek · Ctrl+G edit prompt · Alt+1..9 jump · Ctrl+T pin · Ctrl+R rename · Ctrl+X stop · Ctrl+S group · ← exit';

  // Dispatch prompt 预览：截断长字符串避免占据多行。多行 → 用 ⏎ 显示换行。
  const promptPreview = (() => {
    const t = state.dispatchPrompt;
    if (!t) return null;
    const flat = t.replace(/\n/g, ' ⏎ ');
    return flat.length > 80 ? flat.slice(0, 77) + '…' : flat;
  })();

  return (
    <Box flexDirection="column" width="100%">
      <Box paddingX={1} flexDirection="row" justifyContent="space-between">
        <Text bold>Panda · Agent View</Text>
        <Text dimColor>
          {state.entries.length} session
          {state.entries.length === 1 ? '' : 's'} · grouped by {state.groupMode}
        </Text>
      </Box>
      <Box paddingX={1}>
        <Text dimColor>{helpLine}</Text>
      </Box>
      {promptPreview ? (
        <Box paddingX={1}>
          <Text color="suggestion">{'> '}</Text>
          <Text>{promptPreview}</Text>
        </Box>
      ) : null}
      {state.lastError ? (
        <Box paddingX={1}>
          <Text color="red">{state.lastError}</Text>
        </Box>
      ) : null}
      <Box flexDirection="row">
        <Box flexDirection="column" flexGrow={1}>
          <StatusGrouping
            entries={state.entries}
            cursor={state.cursor}
            groupMode={state.groupMode}
            tick={tick}
            pendingStopId={state.pendingStopId}
          />
        </Box>
        {state.peekOpen && selected ? (
          <Box flexDirection="column" width={56} paddingLeft={1}>
            <PeekPanel entry={selected} pageOffset={state.peekPageOffset} />
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}
