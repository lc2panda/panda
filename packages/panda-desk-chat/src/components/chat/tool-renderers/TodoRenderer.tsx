// Input:  Tool call data for TodoWrite (todos: { content, activeForm, status }[])
// Output: Inline task list card delegating to PdInlineTaskSummary (cc-haha TaskSummaryItem shape)
// Pos:    Chat > tool-renderers — specialized renderer for TodoWrite
import React, { useMemo } from "react";
import { PdInlineTaskSummary } from "../PdInlineTaskSummary";
import type { TaskSummaryItem } from "../../../types/chat";
import type { ToolRendererProps } from "./index";

interface RawTodo {
  content?: string;
  activeForm?: string;
  status?: string;
}

const STATUS_MAP: Record<string, TaskSummaryItem['status']> = {
  pending: "pending",
  in_progress: "in_progress",
  completed: "completed",
  done: "completed",
};

export const TodoRenderer: React.FC<ToolRendererProps> = React.memo(({ input }) => {
  const todos = (input as { todos?: RawTodo[] }).todos ?? [];

  const tasks: TaskSummaryItem[] = useMemo(
    () =>
      todos.map((todo, idx) => ({
        id: `${idx}`,
        subject: todo.content ?? todo.activeForm ?? `Task ${idx + 1}`,
        status: STATUS_MAP[todo.status ?? "pending"] ?? "pending",
        activeForm: todo.activeForm,
      })),
    [todos],
  );

  if (tasks.length === 0) {
    return (
      <div className="px-3 py-2 text-[12px] text-[var(--pd-color-fg-muted)] font-[var(--pd-font-mono)]">
        (empty todo list)
      </div>
    );
  }

  return <PdInlineTaskSummary tasks={tasks} />;
});

TodoRenderer.displayName = "TodoRenderer";
