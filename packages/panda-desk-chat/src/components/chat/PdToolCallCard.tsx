// Input: Tool call data (name, input, status, result)
// Output: Tool execution card with status indicator
// Pos: Chat layer — displays tool use within conversation
import React, { useState } from "react";
import { cn } from "../../lib/cn";
import { getToolRenderer, type ToolRendererProps } from "./tool-renderers";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export type ToolCallStatus = "pending" | "running" | "success" | "error";

export interface PdToolCallCardProps {
  toolName: string;
  input: Record<string, unknown>;
  status: ToolCallStatus;
  result?: string;
  isError?: boolean;
  defaultExpanded?: boolean;
  /** When true, collapse to a single-line icon + tool name (summary mode). */
  forceCollapsed?: boolean;
  className?: string;
}

/* -------------------------------------------------------------------------- */
/*  Status badge config                                                       */
/* -------------------------------------------------------------------------- */

interface BadgeConfig {
  bg: string;
  icon: React.ReactNode;
  label: string;
}

const BADGE: Record<ToolCallStatus, BadgeConfig> = {
  pending: {
    bg: "bg-[var(--pd-color-bg-subtle)]",
    icon: <span className="animate-spin inline-block">⏳</span>,
    label: "Pending",
  },
  running: {
    bg: "bg-[var(--pd-color-accent-subtle)]",
    icon: <span className="animate-spin inline-block">⏳</span>,
    label: "Running",
  },
  success: {
    bg: "bg-[var(--pd-color-success-bg)]",
    icon: <span>✓</span>,
    label: "Done",
  },
  error: {
    bg: "bg-[var(--pd-color-error-bg)]",
    icon: <span>✕</span>,
    label: "Error",
  },
};

/* -------------------------------------------------------------------------- */
/*  PdToolCallCard                                                           */
/* -------------------------------------------------------------------------- */

export const PdToolCallCard: React.FC<PdToolCallCardProps> = React.memo(({
  toolName,
  input,
  status,
  result,
  isError = false,
  defaultExpanded = false,
  forceCollapsed = false,
  className,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const badge = BADGE[status];

  const formattedInput = React.useMemo(
    () => JSON.stringify(input, null, 2),
    [input],
  );

  /* Summary mode — single-line compact representation */
  if (forceCollapsed) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5",
          "rounded-[var(--pd-radius-sm)]",
          "bg-[var(--pd-tool-use-bg)]",
          "border border-[var(--pd-tool-use-border)]",
          "px-2.5 py-1",
          "text-[var(--pd-text-xs)]",
          className,
        )}
      >
        <span aria-hidden="true">🔧</span>
        <span className="font-[var(--pd-font-medium)] font-[var(--pd-font-mono)]">
          {toolName}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1",
            "px-[var(--pd-space-1\\.5)] py-0.5",
            "rounded-[var(--pd-radius-full)]",
            "text-[var(--pd-text-xs)]",
            badge.bg,
          )}
        >
          {badge.icon}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-[var(--pd-radius-md)]",
        "bg-[var(--pd-tool-use-bg)]",
        "border border-[var(--pd-tool-use-border)]",
        "overflow-hidden",
        className,
      )}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          "flex w-full items-center gap-[var(--pd-space-1\\.5)]",
          "cursor-pointer select-none bg-transparent border-none",
          "px-3 py-2 text-left",
          "text-[var(--pd-color-fg)] text-[var(--pd-text-sm)]",
        )}
      >
        {/* Expand arrow */}
        <span
          className={cn(
            "inline-block transition-transform duration-[var(--pd-duration-quick)]",
            expanded ? "rotate-90" : "rotate-0",
          )}
          aria-hidden="true"
        >
          ▶
        </span>

        {/* Tool icon + name */}
        <span aria-hidden="true">🔧</span>
        <span className="font-[var(--pd-font-medium)] font-[var(--pd-font-mono)]">
          {toolName}
        </span>

        {/* Status badge */}
        <span
          className={cn(
            "ml-auto inline-flex items-center gap-1",
            "px-[var(--pd-space-1\\.5)] py-0.5",
            "rounded-[var(--pd-radius-full)]",
            "text-[var(--pd-text-xs)]",
            badge.bg,
            status === "running" && "animate-pulse",
          )}
        >
          {badge.icon}
          <span>{badge.label}</span>
        </span>
      </button>

      {/* Collapsible body */}
      <div
        className={cn(
          "overflow-hidden transition-[max-height,opacity] duration-[var(--pd-duration-quick)]",
          expanded ? "max-h-[4000px] opacity-100" : "max-h-0 opacity-0",
        )}
      >
        {/* Tool-specific or generic rendering */}
        {(() => {
          const SpecializedRenderer = getToolRenderer(toolName);
          if (SpecializedRenderer) {
            /* Parse input safely for specialized renderers */
            let parsedInput: Record<string, unknown> = {};
            try {
              parsedInput = typeof input === "string" ? JSON.parse(input) : (input ?? {});
            } catch {
              parsedInput = { _raw: input };
            }
            return (
              <div className="px-3 pb-2">
                <SpecializedRenderer
                  input={parsedInput}
                  result={result}
                  status={status}
                  toolName={toolName}
                  isError={isError}
                />
              </div>
            );
          }

          /* Generic fallback — original JSON display */
          return (
            <>
              {/* Input section */}
              <div className="px-3 pb-2">
                <pre
                  className={cn(
                    "m-0 p-2 overflow-x-auto",
                    "rounded-[var(--pd-radius-sm)]",
                    "bg-[var(--pd-color-bg-subtle)]",
                    "text-[var(--pd-code-base)]",
                    "font-[var(--pd-font-mono)]",
                    "text-[var(--pd-color-fg-muted)]",
                  )}
                >
                  {formattedInput}
                </pre>
              </div>

              {/* Result section */}
              {result != null && (
                <div className="px-3 pb-2">
                  <div
                    className={cn(
                      "text-[var(--pd-text-xs)] font-[var(--pd-font-medium)]",
                      "mb-1",
                      isError
                        ? "text-[var(--pd-color-error-fg)]"
                        : "text-[var(--pd-color-fg-muted)]",
                    )}
                  >
                    {isError ? "Error" : "Result"}
                  </div>
                  <pre
                    className={cn(
                      "m-0 p-2 overflow-x-auto",
                      "rounded-[var(--pd-radius-sm)]",
                      "bg-[var(--pd-color-bg-subtle)]",
                      "text-[var(--pd-code-base)]",
                      "font-[var(--pd-font-mono)]",
                      isError
                        ? "text-[var(--pd-color-error-fg)]"
                        : "text-[var(--pd-color-fg)]",
                    )}
                  >
                    {result}
                  </pre>
                </div>
              )}
            </>
          );
        })()}
      </div>
    </div>
  );
});

PdToolCallCard.displayName = "PdToolCallCard";
