// Input:  Tool call data for Bash/BashTool (command string + stdout result)
// Output: Terminal-styled card with command, collapsible output, exit code badge, ANSI color support
// Pos:    Chat > tool-renderers — specialized renderer for shell execution results
import React, { useState, useCallback, useMemo } from "react";
import { cn } from "../../../lib/cn";
import type { ToolRendererProps } from "./index";

const MAX_VISIBLE_LINES = 30;

/* -------------------------------------------------------------------------- */
/*  ANSI escape sequence → inline-styled <span> converter                     */
/* -------------------------------------------------------------------------- */

/** ANSI 3-bit color palette (SGR codes 30-37 / 40-47). */
const ANSI_COLORS: Record<number, string> = {
  0: "#1a1a1a", // black
  1: "#dc2626", // red
  2: "#5a9e6f", // green
  3: "#d4a017", // yellow
  4: "#3b82f6", // blue
  5: "#a855f7", // magenta
  6: "#22d3ee", // cyan
  7: "#d4d4d4", // white
};

interface StyledSpan {
  text: string;
  fg?: string;
  bg?: string;
  bold?: boolean;
}

/**
 * Parse a single line that may contain ANSI escape codes and return an array
 * of styled spans. Handles SGR codes: 0 (reset), 1 (bold), 30-37 (fg),
 * 40-47 (bg). Unrecognised codes are silently ignored.
 */
function parseAnsiLine(raw: string): StyledSpan[] {
  const spans: StyledSpan[] = [];
  let fg: string | undefined;
  let bg: string | undefined;
  let bold = false;

  // Split on ESC[ ... m  sequences
  const parts = raw.split(/\x1b\[([0-9;]*)m/);

  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      // Text segment
      if (parts[i].length > 0) {
        spans.push({ text: parts[i], fg, bg, bold });
      }
    } else {
      // SGR parameter segment (e.g. "1;32")
      const codes = parts[i].split(";").map(Number);
      for (const code of codes) {
        if (code === 0) {
          fg = undefined;
          bg = undefined;
          bold = false;
        } else if (code === 1) {
          bold = true;
        } else if (code >= 30 && code <= 37) {
          fg = ANSI_COLORS[code - 30];
        } else if (code >= 40 && code <= 47) {
          bg = ANSI_COLORS[code - 40];
        }
      }
    }
  }

  return spans;
}

/** Strip ANSI codes (for plain-text operations like line counting). */
function stripAnsi(text: string): string {
  return text.replace(/\x1b\[[0-9;]*m/g, "");
}

/** Render an array of styled spans to React elements. */
function renderStyledSpans(spans: StyledSpan[], lineIdx: number): React.ReactNode {
  if (spans.length === 1 && !spans[0].fg && !spans[0].bg && !spans[0].bold) {
    return spans[0].text;
  }
  return spans.map((span, j) => {
    const style: React.CSSProperties = {};
    if (span.fg) style.color = span.fg;
    if (span.bg) style.backgroundColor = span.bg;
    if (span.bold) style.fontWeight = 700;
    return Object.keys(style).length > 0 ? (
      <span key={`${lineIdx}-${j}`} style={style}>
        {span.text}
      </span>
    ) : (
      <React.Fragment key={`${lineIdx}-${j}`}>{span.text}</React.Fragment>
    );
  });
}

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

  /** Pre-parse ANSI spans for visible lines. */
  const parsedLines = useMemo(
    () => visibleLines.map((l) => parseAnsiLine(l)),
    [visibleLines],
  );

  /* Attempt to extract exit code from last line pattern "Exit code: N" */
  const plainResult = result ? stripAnsi(result) : undefined;
  const exitCodeMatch = plainResult?.match(/(?:exit code|exitCode|Exit code)[:\s]+(\d+)/i);
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

      {/* Output area with ANSI color support */}
      {result != null && (
        <pre
          className={cn(
            "m-0 px-3 py-2 overflow-x-auto whitespace-pre-wrap break-words",
            "bg-[#1a1a1a] text-[12px] leading-[1.5]",
            "font-[var(--pd-font-mono)] text-[#d4d4d4]",
          )}
        >
          {parsedLines.map((spans, i) => (
            <div key={i}>{renderStyledSpans(spans, i)}</div>
          ))}
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
