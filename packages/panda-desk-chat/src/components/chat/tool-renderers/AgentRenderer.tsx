// Input:  Tool call data for Agent/AgentTool (prompt, description, status)
// Output: Agent delegation card with status bar, collapsible result
// Pos:    Chat > tool-renderers — specialized renderer for sub-agent calls
import React, { useState, useMemo } from "react";
import { cn } from "../../../lib/cn";
import type { ToolRendererProps } from "./index";

const SUMMARY_LINES = 5;
const PROMPT_MAX_CHARS = 100;

/* -------------------------------------------------------------------------- */
/*  Status badge                                                              */
/* -------------------------------------------------------------------------- */

const STATUS_CONFIG: Record<string, { color: string; label: string; pulse?: boolean }> = {
  pending:  { color: "bg-[var(--pd-color-fg-muted)]", label: "Pending" },
  running:  { color: "bg-[#3b82f6]", label: "Running", pulse: true },
  success:  { color: "bg-[#5a9e6f]", label: "Done" },
  error:    { color: "bg-[#dc2626]", label: "Error" },
};

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

type AgentInput = {
  prompt?: string;
  description?: string;
};

export const AgentRenderer: React.FC<ToolRendererProps> = React.memo(({
  input,
  result,
  status,
}) => {
  const ai = input as AgentInput;
  const summary = ai.description || ai.prompt || "";
  const truncated = summary.length > PROMPT_MAX_CHARS
    ? summary.slice(0, PROMPT_MAX_CHARS) + "..."
    : summary;

  const lines = useMemo(() => (result ?? "").split("\n"), [result]);
  const needsFold = lines.length > SUMMARY_LINES;
  const [expanded, setExpanded] = useState(!needsFold);
  const visibleLines = expanded ? lines : lines.slice(0, SUMMARY_LINES);

  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;

  return (
    <div className="rounded-lg overflow-hidden border-l-2 border border-[var(--pd-color-border)] border-l-[var(--pd-color-accent)]">
      {/* Header */}
      <div className="flex items-start gap-2 px-3 py-2 bg-[var(--pd-color-bg-subtle)]">
        {/* Icon */}
        <span className="text-[14px] mt-0.5 shrink-0 select-none" aria-hidden="true">
          {">>"}
        </span>

        {/* Prompt summary */}
        <div className="flex-1 min-w-0">
          <div className="text-[12px] text-[var(--pd-color-fg)] leading-snug break-words">
            {truncated}
          </div>
        </div>

        {/* Status pill */}
        <span
          className={cn(
            "shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] text-white",
            cfg.color,
            cfg.pulse && "animate-pulse",
          )}
        >
          {cfg.label}
        </span>
      </div>

      {/* Result body */}
      {result != null && (
        <div className="px-3 py-2 border-t border-t-[var(--pd-color-border)]">
          <pre
            className={cn(
              "m-0 overflow-x-auto whitespace-pre-wrap break-words",
              "text-[12px] leading-[1.5] font-[var(--pd-font-mono)]",
              status === "error"
                ? "text-[var(--pd-color-error-fg)]"
                : "text-[var(--pd-color-fg)]",
            )}
          >
            {visibleLines.join("\n")}
          </pre>

          {needsFold && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className={cn(
                "mt-1 text-[11px] cursor-pointer",
                "bg-transparent border-none",
                "text-[var(--pd-color-accent)] hover:underline",
              )}
            >
              {expanded ? "Collapse" : `Show all ${lines.length} lines`}
            </button>
          )}
        </div>
      )}
    </div>
  );
});

AgentRenderer.displayName = "AgentRenderer";
