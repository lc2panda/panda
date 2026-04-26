// Input:  Tool call data for Bash/BashTool (command string + stdout/stderr result, optional description)
// Output: Terminal-styled card — PdTerminalChrome wrapper, $ command line, ANSI-colored output, fold toggle, exit/status footer
// Pos:    Chat > tool-renderers — specialized renderer for shell execution results
import React, { useState, useCallback, useMemo } from "react";
import { cn } from "../../../lib/cn";
import { PdTerminalChrome } from "../PdTerminalChrome";
import type { ToolRendererProps } from "./index";

const MAX_VISIBLE_LINES = 30;

/* -------------------------------------------------------------------------- */
/*  ANSI escape sequence → inline-styled <span> converter                     */
/* -------------------------------------------------------------------------- */

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

function parseAnsiLine(raw: string): StyledSpan[] {
  const spans: StyledSpan[] = [];
  let fg: string | undefined;
  let bg: string | undefined;
  let bold = false;

  const parts = raw.split(/\x1b\[([0-9;]*)m/);
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      if (parts[i].length > 0) {
        spans.push({ text: parts[i], fg, bg, bold });
      }
    } else {
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

function stripAnsi(text: string): string {
  return text.replace(/\x1b\[[0-9;]*m/g, "");
}

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

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export const BashRenderer: React.FC<ToolRendererProps> = React.memo(
  ({ input, result, status }) => {
    const command = (input as { command?: string }).command ?? "";
    const description = (input as { description?: string }).description ?? "";

    const lines = result ? result.split("\n") : [];
    const needsFold = lines.length > MAX_VISIBLE_LINES;
    const [expanded, setExpanded] = useState(!needsFold);
    const visibleLines = expanded ? lines : lines.slice(0, MAX_VISIBLE_LINES);

    const parsedLines = useMemo(
      () => visibleLines.map((l) => parseAnsiLine(l)),
      [visibleLines],
    );

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
      } catch {
        /* clipboard unavailable */
      }
    }, [command]);

    const copyToolbar = (
      <button
        type="button"
        onClick={handleCopy}
        className={cn(
          "px-1.5 py-0 text-[10px] cursor-pointer",
          "rounded-[var(--pd-radius-sm)] bg-transparent border-none",
          "text-[var(--pd-terminal-fg)] opacity-60 hover:opacity-100",
        )}
        title="Copy command"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    );

    return (
      <PdTerminalChrome title={description || command || "shell"} toolbar={copyToolbar}>
        {/* Command line */}
        <div className="flex items-start gap-2 px-3 py-2 font-[var(--pd-font-mono)] text-[12px] leading-[1.5]">
          <span className="text-[var(--pd-terminal-green)] shrink-0 select-none">$</span>
          <code className="flex-1 break-all whitespace-pre-wrap text-[var(--pd-terminal-fg)]">
            {command}
          </code>
        </div>

        {/* Output */}
        {result != null && result.length > 0 && (
          <pre
            className={cn(
              "m-0 px-3 pb-2 overflow-x-auto whitespace-pre-wrap break-words",
              "text-[11.5px] leading-[1.5] font-[var(--pd-font-mono)]",
              "text-[var(--pd-terminal-fg)] opacity-90",
              "border-t border-[rgba(255,255,255,0.06)] pt-2",
            )}
          >
            {parsedLines.map((spans, i) => (
              <div key={i}>{renderStyledSpans(spans, i) || "\u00A0"}</div>
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
              "bg-[rgba(255,255,255,0.04)] text-[var(--pd-terminal-fg)] opacity-60",
              "hover:opacity-100 border-none border-t border-t-[rgba(255,255,255,0.08)]",
            )}
          >
            {expanded ? "Collapse" : `Show ${lines.length - MAX_VISIBLE_LINES} more lines`}
          </button>
        )}

        {/* Status footer */}
        <div className="flex items-center justify-between px-3 py-1 text-[10px] bg-[rgba(0,0,0,0.25)] border-t border-[rgba(255,255,255,0.06)] font-[var(--pd-font-mono)]">
          <span className="text-[var(--pd-terminal-fg)] opacity-50">
            {lines.length} line{lines.length !== 1 ? "s" : ""}
          </span>
          <span className={cn(isOk ? "text-[var(--pd-terminal-green)]" : "text-[var(--pd-terminal-red)]")}>
            exit {exitCode}
          </span>
        </div>
      </PdTerminalChrome>
    );
  },
);

BashRenderer.displayName = "BashRenderer";
