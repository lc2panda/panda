// Input:  Tool call data for Read/Write/Edit (file_path, content, old_string, new_string, offset, limit)
// Output: Claude-Desktop-style file operation card — diff viewer for Edit/Write, line-numbered preview for Read
// Pos:    Chat > tool-renderers — specialized renderer for file operations
import React, { useMemo } from "react";
import { cn } from "../../../lib/cn";
import { PdDiffViewer } from "../PdDiffViewer";
import type { ToolRendererProps } from "./index";

type FileInput = {
  file_path?: string;
  content?: string;
  old_string?: string;
  new_string?: string;
  offset?: number;
  limit?: number;
};

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

/** Strip claude-style line-number gutter ("   123→content") if present. */
function stripLineGutter(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      const m = line.match(/^\s*\d+→(.*)$/);
      return m ? m[1] : line;
    })
    .join("\n");
}

function truncateLines(text: string, maxLines: number): { snippet: string; truncated: boolean; total: number } {
  const lines = text.split("\n");
  if (lines.length <= maxLines) {
    return { snippet: text, truncated: false, total: lines.length };
  }
  return {
    snippet: lines.slice(0, maxLines).join("\n"),
    truncated: true,
    total: lines.length,
  };
}

/* -------------------------------------------------------------------------- */
/*  Read renderer — line-numbered preview                                    */
/* -------------------------------------------------------------------------- */

const READ_MAX_LINES = 60;

const ReadPreview: React.FC<{
  filePath: string;
  result: string;
  offset: number;
  limit?: number;
}> = ({ filePath, result, offset, limit }) => {
  const cleaned = useMemo(() => stripLineGutter(result), [result]);
  const { snippet, truncated, total } = useMemo(
    () => truncateLines(cleaned, READ_MAX_LINES),
    [cleaned],
  );

  const lines = snippet.split("\n");
  const startLine = Math.max(1, offset);
  const rangeLabel = limit
    ? `Lines ${startLine}–${startLine + total - 1}`
    : `Lines 1–${total}`;

  return (
    <div className="overflow-hidden rounded-[var(--pd-radius-md)] border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-bg-elevated)]">
      {/* Path bar */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--pd-color-bg-subtle)] border-b border-[var(--pd-color-border)]/50">
        <div className="min-w-0 flex-1 truncate text-[11px] font-[var(--pd-font-mono)] text-[var(--pd-color-fg-muted)]" title={filePath}>
          {filePath}
        </div>
        <span className="shrink-0 text-[10px] font-[var(--pd-font-mono)] text-[var(--pd-color-fg-muted)] opacity-70">
          {rangeLabel}
        </span>
      </div>

      {/* Body */}
      <pre className="m-0 overflow-x-auto bg-[var(--pd-color-bg-elevated)] text-[12px] leading-[1.55] font-[var(--pd-font-mono)] max-h-[480px] overflow-y-auto">
        {lines.map((line, idx) => (
          <div key={idx} className="flex">
            <span className="inline-block w-[44px] pr-2 text-right select-none shrink-0 text-[10px] tabular-nums text-[var(--pd-color-fg-muted)] opacity-50 border-r border-[var(--pd-color-border)]/30">
              {startLine + idx}
            </span>
            <span className="flex-1 whitespace-pre-wrap break-words pl-2 pr-3 text-[var(--pd-color-fg)] opacity-90">
              {line || "\u00A0"}
            </span>
          </div>
        ))}
      </pre>

      {truncated && (
        <div className="px-3 py-1 text-[11px] text-[var(--pd-color-fg-muted)] bg-[var(--pd-color-bg-subtle)] border-t border-[var(--pd-color-border)]/40 text-center">
          {total - READ_MAX_LINES} more lines hidden
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export const FileRenderer: React.FC<ToolRendererProps> = React.memo(
  ({ input, result, toolName }) => {
    const fi = input as FileInput;
    const filePath = fi.file_path ?? "";

    const isEdit = toolName === "Edit" || toolName === "FileEditTool";
    const isWrite = toolName === "Write" || toolName === "WriteTool";
    const isRead = toolName === "Read" || toolName === "ReadTool";

    /* Edit — full unified diff with header */
    if (isEdit && typeof fi.old_string === "string" && typeof fi.new_string === "string") {
      return (
        <div className="space-y-2">
          <PdDiffViewer
            oldContent={fi.old_string}
            newContent={fi.new_string}
            fileName={filePath || "edit"}
          />
          {result && (
            <div className={cn(
              "px-3 py-1.5 text-[11px] rounded-[var(--pd-radius-sm)]",
              "bg-[var(--pd-color-bg-subtle)] text-[var(--pd-color-fg-muted)]",
              "border border-[var(--pd-color-border)]/40",
            )}>
              {result.length > 200 ? result.slice(0, 200) + "…" : result}
            </div>
          )}
        </div>
      );
    }

    /* Write — diff against empty oldContent */
    if (isWrite && typeof fi.content === "string") {
      return (
        <div className="space-y-2">
          <PdDiffViewer
            oldContent=""
            newContent={fi.content}
            fileName={filePath || "new file"}
          />
          {result && (
            <div className={cn(
              "px-3 py-1.5 text-[11px] rounded-[var(--pd-radius-sm)]",
              "bg-[var(--pd-color-bg-subtle)] text-[var(--pd-color-fg-muted)]",
              "border border-[var(--pd-color-border)]/40",
            )}>
              {result.length > 200 ? result.slice(0, 200) + "…" : result}
            </div>
          )}
        </div>
      );
    }

    /* Read — numbered preview */
    if (isRead && result) {
      return (
        <ReadPreview
          filePath={filePath}
          result={result}
          offset={typeof fi.offset === "number" ? fi.offset : 1}
          limit={typeof fi.limit === "number" ? fi.limit : undefined}
        />
      );
    }

    /* Read with no result yet — show file path + range */
    if (isRead) {
      return (
        <div className="px-3 py-2 text-[12px] text-[var(--pd-color-fg-muted)] bg-[var(--pd-color-bg-subtle)] rounded-[var(--pd-radius-md)] border border-[var(--pd-color-border)]/60 font-[var(--pd-font-mono)]">
          Reading <span className="text-[var(--pd-color-fg)]">{filePath}</span>
          {fi.offset != null && (
            <span className="ml-2 opacity-70">offset {fi.offset}</span>
          )}
          {fi.limit != null && (
            <span className="ml-2 opacity-70">limit {fi.limit}</span>
          )}
        </div>
      );
    }

    /* Fallback */
    return (
      <div className="px-3 py-2 text-[11px] text-[var(--pd-color-fg-muted)] font-[var(--pd-font-mono)]">
        {filePath || "(no file path)"}
      </div>
    );
  },
);

FileRenderer.displayName = "FileRenderer";
