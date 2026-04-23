// Input:  Tool call data for Bash/BashTool (command string + stdout result)
// Output: Terminal-styled card with command, collapsible output, exit code badge
// Pos:    Chat > tool-renderers — specialized renderer for shell execution results
import React, { useState, useCallback } from "react";
import { cn } from "../../../lib/cn";
import type { ToolRendererProps } from "./index";

const MAX_VISIBLE_LINES = 30;

export const BashRenderer: React.FC<ToolRendererProps> = React.memo(({
  input,
  result,
  status,
}) => {
  const command = (input as { command?: string }).command ?? "";
  const lines = result ? result.split("\n") : [];
  const needsFold = lines.length > MAX_VISIBLE_LINES;
  const [expanded, setExpanded] = useState(!needsFold);

  const visibleLines = expanded ? lines : lines.slice(0, MAX_VISIBLE_LINES);

  /* Attempt to extract exit code from last line pattern "Exit code: N" */
  const exitCodeMatch = result?.match(/(?:exit code|exitCode|Exit code)[:\s]+(\d+)/i);
  const exitCode = exitCodeMatch ? Number(exitCodeMatch[1]) : status === "error" ? 1 : 0;
  const isOk = exitCode === 0 && status !== "error";

  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    try {
      navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* noop — clipboard may be unavailable */ }
  }, [command]);

  return (
    <div className="rounded-lg overflow-hidden border border-[var(--pd-color-border)]">
      {/* Command bar */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1a1a] text-[13px]">
        <span className="text-[#5a9e6f] font-[var(--pd-font-mono)] shrink-0 select-none">$</span>
        <code className="text-[#e4e4e4] font-[var(--pd-font-mono)] flex-1 break-all whitespace-pre-wrap">
          {command}
        </code>
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 text-[11px] text-[#888] hover:text-[#ccc] bg-transparent border-none cursor-pointer px-1"
          title="Copy command"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      {/* Output area */}
      {result != null && (
        <pre
          className={cn(
            "m-0 px-3 py-2 overflow-x-auto whitespace-pre-wrap break-words",
            "bg-[#1a1a1a] text-[12px] leading-[1.5]",
            "font-[var(--pd-font-mono)] text-[#d4d4d4]",
          )}
        >
          {visibleLines.join("\n")}
        </pre>
      )}

      {/* Fold toggle */}
      {needsFold && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={cn(
            "w-full px-3 py-1 text-[11px] text-center cursor-pointer",
            "bg-[#222] text-[#888] hover:text-[#ccc]",
            "border-none border-t border-t-[#333]",
          )}
        >
          {expanded ? "Collapse" : `Expand ${lines.length - MAX_VISIBLE_LINES} more lines`}
        </button>
      )}

      {/* Status bar */}
      <div
        className={cn(
          "flex items-center justify-between px-3 py-1 text-[11px]",
          "bg-[#111] border-t border-t-[#333]",
        )}
      >
        <span className="text-[#888]">{lines.length} lines</span>
        <span className={cn("font-[var(--pd-font-mono)]", isOk ? "text-[#5a9e6f]" : "text-[#dc2626]")}>
          exit {exitCode}
        </span>
      </div>
    </div>
  );
});

BashRenderer.displayName = "BashRenderer";
