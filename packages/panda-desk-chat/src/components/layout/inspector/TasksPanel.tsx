// Input: chatStore (active session messages → content + toolCalls for TODO/FIXME extraction)
// Output: 任务面板 — 从消息内容和工具调用中提取任务/待办，支持勾选完成
// Pos: PdInspector > tasks tab 内容区
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { useState, useMemo, useCallback } from 'react';
import { useChatStore, type UIMessage, type UIToolCall } from '../../../stores/chatStore';

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface TaskItem {
  id: string;
  title: string;
  source: 'content' | 'tool';
  /** Which message ID this task was extracted from */
  messageId: string;
  /** Original marker: TODO, FIXME, HACK, or TodoWrite */
  marker: string;
}

/* -------------------------------------------------------------------------- */
/*  Task extraction                                                           */
/* -------------------------------------------------------------------------- */

const TASK_REGEX = /\b(TODO|FIXME|HACK|XXX)[\s:：]+(.+)/gi;

function extractTasksFromContent(messages: UIMessage[]): TaskItem[] {
  const tasks: TaskItem[] = [];
  for (const msg of messages) {
    if (!msg.content) continue;
    // Reset regex for each message
    TASK_REGEX.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = TASK_REGEX.exec(msg.content)) !== null) {
      const marker = match[1].toUpperCase();
      const title = match[2].trim().replace(/\*+$/g, '').trim();
      if (!title) continue;
      tasks.push({
        id: `${msg.id}-${match.index}`,
        title,
        source: 'content',
        messageId: msg.id,
        marker,
      });
    }
  }
  return tasks;
}

function extractTasksFromToolCalls(messages: UIMessage[]): TaskItem[] {
  const tasks: TaskItem[] = [];
  for (const msg of messages) {
    if (!msg.toolCalls) continue;
    for (const tc of msg.toolCalls) {
      // TodoWrite tool or similar
      if (tc.toolName.toLowerCase().includes('todo') || tc.toolName === 'TodoWrite') {
        const input = tc.input as Record<string, unknown>;
        const todos = input.todos ?? input.items;
        if (Array.isArray(todos)) {
          for (let i = 0; i < todos.length; i++) {
            const item = todos[i];
            const title = typeof item === 'string' ? item : (item as Record<string, unknown>)?.content ?? (item as Record<string, unknown>)?.title ?? String(item);
            tasks.push({
              id: `${tc.id}-${i}`,
              title: String(title),
              source: 'tool',
              messageId: msg.id,
              marker: 'TodoWrite',
            });
          }
        } else {
          // Single content field
          const content = input.content ?? input.text ?? input.todo;
          if (typeof content === 'string' && content.trim()) {
            tasks.push({
              id: tc.id,
              title: content.trim(),
              source: 'tool',
              messageId: msg.id,
              marker: 'TodoWrite',
            });
          }
        }
      }
    }
  }
  return tasks;
}

/* -------------------------------------------------------------------------- */
/*  Sub-components                                                            */
/* -------------------------------------------------------------------------- */

const MARKER_COLORS: Record<string, string> = {
  TODO: 'bg-blue-500/20 text-blue-400',
  FIXME: 'bg-red-500/20 text-red-400',
  HACK: 'bg-orange-500/20 text-orange-400',
  XXX: 'bg-yellow-500/20 text-yellow-400',
  TodoWrite: 'bg-emerald-500/20 text-emerald-400',
};

interface TaskRowProps {
  task: TaskItem;
  done: boolean;
  onToggle: () => void;
}

function TaskRow({ task, done, onToggle }: TaskRowProps) {
  return (
    <div
      className="flex items-start gap-2 py-1.5"
      style={{ borderBottom: '1px solid var(--pd-color-border)' }}
    >
      <input
        type="checkbox"
        checked={done}
        onChange={onToggle}
        className="mt-0.5 shrink-0 cursor-pointer accent-[var(--pd-color-accent)]"
        style={{ width: 14, height: 14 }}
      />
      <div className="flex-1 min-w-0">
        <span
          className="text-xs"
          style={{
            color: done ? 'var(--pd-color-fg-muted)' : 'var(--pd-color-fg)',
            textDecoration: done ? 'line-through' : 'none',
          }}
        >
          {task.title}
        </span>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span
            className={`rounded px-1 py-0.5 text-[10px] font-medium ${MARKER_COLORS[task.marker] ?? 'bg-gray-500/20 text-gray-400'}`}
          >
            {task.marker}
          </span>
          <span className="text-[10px] text-[var(--pd-color-fg-subtle,#888)]">
            {task.source === 'tool' ? '工具' : '消息'}
          </span>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Panel                                                                */
/* -------------------------------------------------------------------------- */

export function TasksPanel() {
  const session = useChatStore((s) => s.getActiveSession());
  const messages = session?.messages ?? [];

  const tasks = useMemo(() => {
    const fromContent = extractTasksFromContent(messages);
    const fromTools = extractTasksFromToolCalls(messages);
    return [...fromTools, ...fromContent];
  }, [messages]);

  // Local completion state (keyed by task.id)
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const doneCount = tasks.filter((t) => completed.has(t.id)).length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <h3 className="text-sm font-semibold text-[var(--pd-fg)]">任务</h3>
      </div>
      <div className="mx-4 border-t border-[var(--pd-color-border)]" />

      {/* Task list */}
      <div className="flex-1 overflow-y-auto px-4 pt-2">
        {tasks.length === 0 ? (
          <div className="py-8 text-center text-xs text-[var(--pd-color-fg-muted)]">
            暂无任务
          </div>
        ) : (
          tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              done={completed.has(task.id)}
              onToggle={() => toggle(task.id)}
            />
          ))
        )}
      </div>

      {/* Footer stats */}
      {tasks.length > 0 && (
        <div
          className="shrink-0 px-4 py-2 text-right text-[11px] text-[var(--pd-color-fg-muted)]"
          style={{ borderTop: '1px solid var(--pd-color-border)' }}
        >
          {doneCount}/{tasks.length} 完成
        </div>
      )}
    </div>
  );
}
