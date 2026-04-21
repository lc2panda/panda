// Input: Tool permission request from IPC
// Output: User's permission decision (allow/allow_session/deny)
// Pos: Chat layer — security-critical user consent UI
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { PdDialog } from "../containers/PdDialog";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export type PermissionTier = "read" | "write" | "exec";
export type PermissionDecision = "allow" | "allow_session" | "deny";

export interface PermissionDialogProps {
  visible: boolean;
  toolName: string;
  input: Record<string, unknown>;
  tier: PermissionTier;
  onDecision: (decision: PermissionDecision) => void;
}

/* -------------------------------------------------------------------------- */
/*  Tier config                                                               */
/* -------------------------------------------------------------------------- */

const TIER_CONFIG: Record<
  PermissionTier,
  { label: string; colorVar: string; badgeBg: string; icon: string }
> = {
  read: {
    label: "Read",
    colorVar: "var(--pd-color-info)",
    badgeBg: "var(--pd-color-info-subtle, rgba(56,139,253,0.15))",
    icon: "\u{1F50D}", // magnifying glass
  },
  write: {
    label: "Write",
    colorVar: "var(--pd-color-warning)",
    badgeBg: "var(--pd-color-warning-subtle, rgba(210,153,34,0.15))",
    icon: "\u270F\uFE0F", // pencil
  },
  exec: {
    label: "Execute",
    colorVar: "var(--pd-color-error)",
    badgeBg: "var(--pd-color-error-subtle, rgba(248,81,73,0.15))",
    icon: "\u26A0\uFE0F", // warning
  },
};

const INPUT_COLLAPSE_THRESHOLD = 300;

/* -------------------------------------------------------------------------- */
/*  PermissionDialog                                                          */
/* -------------------------------------------------------------------------- */

export const PermissionDialog: React.FC<PermissionDialogProps> = ({
  visible,
  toolName,
  input,
  tier,
  onDecision,
}) => {
  const [expanded, setExpanded] = useState(false);
  const config = TIER_CONFIG[tier];

  const inputJson = useMemo(
    () => JSON.stringify(input, null, 2),
    [input],
  );
  const isLong = inputJson.length > INPUT_COLLAPSE_THRESHOLD;

  /* -- Keyboard shortcuts ------------------------------------------------ */
  useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter" && e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        onDecision("allow_session");
      } else if (e.key === "Enter" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        e.stopPropagation();
        onDecision("allow");
      }
      // Esc is handled by PdDialog's built-in Escape handler
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [visible, onDecision]);

  /* -- Title with tier badge --------------------------------------------- */
  const title = (
    <span className="flex items-center gap-[var(--pd-space-2)]">
      <span>Permission Required</span>
      <span
        className={cn(
          "inline-flex items-center gap-1",
          "px-[var(--pd-space-2)] py-[var(--pd-space-0\\.5)]",
          "rounded-[var(--pd-radius-full)]",
          "text-[var(--pd-text-xs)]",
          "font-[var(--pd-font-semibold)]",
        )}
        style={{
          color: config.colorVar,
          backgroundColor: config.badgeBg,
        }}
      >
        {config.icon} {config.label}
      </span>
    </span>
  );

  /* -- Footer buttons ---------------------------------------------------- */
  const footer = (
    <>
      <button
        type="button"
        onClick={() => onDecision("deny")}
        className={cn(
          "px-[var(--pd-space-4)] py-[var(--pd-space-2)]",
          "rounded-[var(--pd-radius-md)]",
          "text-[var(--pd-text-sm)]",
          "font-[var(--pd-font-medium)]",
          "text-[var(--pd-color-error)]",
          "bg-transparent",
          "border border-transparent",
          "hover:bg-[var(--pd-color-error-subtle,rgba(248,81,73,0.1))]",
          "transition-colors duration-[var(--pd-duration-fast)]",
        )}
      >
        Deny <span className="ml-1 opacity-50 text-[var(--pd-text-xs)]">Esc</span>
      </button>
      <button
        type="button"
        onClick={() => onDecision("allow_session")}
        className={cn(
          "px-[var(--pd-space-4)] py-[var(--pd-space-2)]",
          "rounded-[var(--pd-radius-md)]",
          "text-[var(--pd-text-sm)]",
          "font-[var(--pd-font-medium)]",
          "text-[var(--pd-color-fg)]",
          "bg-[var(--pd-color-bg-subtle)]",
          "border border-[var(--pd-color-border)]",
          "hover:bg-[var(--pd-color-bg-hover)]",
          "transition-colors duration-[var(--pd-duration-fast)]",
        )}
      >
        Allow for Session{" "}
        <span className="ml-1 opacity-50 text-[var(--pd-text-xs)]">Shift+Enter</span>
      </button>
      <button
        type="button"
        onClick={() => onDecision("allow")}
        className={cn(
          "px-[var(--pd-space-4)] py-[var(--pd-space-2)]",
          "rounded-[var(--pd-radius-md)]",
          "text-[var(--pd-text-sm)]",
          "font-[var(--pd-font-semibold)]",
          "text-[var(--pd-color-fg-on-accent)]",
          "bg-[var(--pd-color-accent)]",
          "shadow-[var(--pd-shadow-button-primary)]",
          "hover:bg-[var(--pd-color-accent-hover)]",
          "active:bg-[var(--pd-color-accent-active)]",
          "transition-colors duration-[var(--pd-duration-fast)]",
        )}
      >
        Allow <span className="ml-1 opacity-60 text-[var(--pd-text-xs)]">Enter</span>
      </button>
    </>
  );

  return (
    <PdDialog
      open={visible}
      onClose={() => onDecision("deny")}
      title={title as unknown as string}
      size="md"
      destructive={tier === "exec"}
      footer={footer}
    >
      {/* Tool name */}
      <div className="mb-[var(--pd-space-3)]">
        <span className="text-[var(--pd-text-xs)] text-[var(--pd-color-fg-muted)] uppercase tracking-wider">
          Tool
        </span>
        <p
          className={cn(
            "mt-[var(--pd-space-1)]",
            "text-[var(--pd-text-base)]",
            "font-[var(--pd-font-semibold)]",
            "font-[family-name:var(--pd-font-mono)]",
            "text-[var(--pd-color-fg)]",
          )}
        >
          {toolName}
        </p>
      </div>

      {/* Input summary */}
      <div>
        <span className="text-[var(--pd-text-xs)] text-[var(--pd-color-fg-muted)] uppercase tracking-wider">
          Input
        </span>
        <pre
          className={cn(
            "mt-[var(--pd-space-1)]",
            "p-[var(--pd-space-3)]",
            "rounded-[var(--pd-radius-md)]",
            "bg-[var(--pd-color-bg-inset)]",
            "border border-[var(--pd-color-border-subtle)]",
            "text-[var(--pd-text-xs)]",
            "font-[family-name:var(--pd-font-mono)]",
            "text-[var(--pd-color-fg-muted)]",
            "overflow-x-auto whitespace-pre-wrap break-all",
            !expanded && isLong && "max-h-[120px] overflow-hidden",
          )}
        >
          {inputJson}
        </pre>
        {isLong && (
          <button
            type="button"
            onClick={() => setExpanded((p) => !p)}
            className={cn(
              "mt-[var(--pd-space-1)] text-[var(--pd-text-xs)]",
              "text-[var(--pd-color-accent)] hover:underline",
            )}
          >
            {expanded ? "Collapse" : "Show more"}
          </button>
        )}
      </div>

      {/* Exec tier warning */}
      {tier === "exec" && (
        <div
          className={cn(
            "mt-[var(--pd-space-3)]",
            "flex items-start gap-[var(--pd-space-2)]",
            "p-[var(--pd-space-3)]",
            "rounded-[var(--pd-radius-md)]",
            "bg-[var(--pd-color-error-subtle,rgba(248,81,73,0.08))]",
            "border border-[var(--pd-color-error,#f85149)]",
            "text-[var(--pd-text-xs)]",
            "text-[var(--pd-color-error)]",
          )}
        >
          <span className="shrink-0 mt-0.5">{TIER_CONFIG.exec.icon}</span>
          <span>
            This tool will <strong>execute code</strong> on your system. Review the
            input carefully before allowing.
          </span>
        </div>
      )}
    </PdDialog>
  );
};

PermissionDialog.displayName = "PermissionDialog";
