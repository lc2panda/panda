// Input:  Tool call data for Read/Write/Edit (file_path, content, old_string, new_string)
// Output: File operation card with breadcrumb path, content preview, diff view
// Pos:    Chat > tool-renderers — specialized renderer for file operations
import React, { useMemo } from "react";
import { cn } from "../../../lib/cn";
import { PdDiffViewer } from "../PdDiffViewer";
import type { ToolRendererProps } from "./index";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

/** Split a path into segments, bold the last one. */
function PathBreadcrumb({ filePath }: { filePath: string }) {
  if (!filePath) return null;
  const parts = filePath.split("/").filter(Boolean);
  return (
    <div className="flex items-center gap-0.5 px-3 py-1.5 text-[12px] font-[var(--pd-font-mono)] text-[var(--pd-color-fg-muted)] overflow-x-auto whitespace-nowrap">
      {parts.map((p, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="text-[var(--pd-color-fg-muted)] opacity-40 mx-0.5">/</span>}
          <span className={i === parts.length - 1 ? "font-bold text-[var(--pd-color-fg)]" : ""}>
            {p}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

/** Render lines with line numbers. */
function NumberedLines({ text, startLine = 1, className }: {
  text: string;
  startLine?: number;
  className?: string;
}) {
  const lines = text.split("\n");
  return (
    <pre className={cn("m-0 overflow-x-auto text-[12px] leading-[1.6]", className)}>
      {lines.map((line, i) => (
        <div key={i} className="flex">
          <span className="inline-block w-[40px] pr-2 text-right text-[var(--pd-color-fg-muted)] select-none shrink-0 opacity-50">
            {startLine + i}
          </span>
          <span className="flex-1 whitespace-pre-wrap break-all">{line}</span>
        </div>
      ))}
    </pre>
  );
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

type FileInput = {
  file_path?: string;
  content?: string;
  old_string?: string;
  new_string?: string;
};

export const FileRenderer: React.FC<ToolRendererProps> = React.memo(({
  input,
  result,
  toolName,
}) => {
  const fi = input as FileInput;
  const filePath = fi.file_path ?? "";

  const isEdit = toolName === "Edit" || toolName === "FileEditTool";
  const isWrite = toolName === "Write" || toolName === "WriteTool";
  // isRead is the default fallback

  /** Detect operation label */
  const opLabel = useMemo(() => {
    if (isEdit) return "Edit";
    if (isWrite) return "Write";
    return "Read";
  }, [isEdit, isWrite]);

  return (
    <div className="rounded-lg overflow-hidden border border-[var(--pd-color-border)]">
      {/* Breadcrumb header */}
      <div className="flex items-center bg-[var(--pd-color-bg-subtle)] border-b border-b-[var(--pd-color-border)]">
        <PathBreadcrumb filePath={filePath} />
        <span className="ml-auto pr-3 text-[11px] text-[var(--pd-color-fg-muted)] font-[var(--pd-font-mono)] opacity-60">
          {opLabel}
        </span>
      </div>

      {/* Body */}
      <div className="bg-[var(--pd-color-bg-subtle)] font-[var(--pd-font-mono)]">
        {isEdit && fi.old_string != null && fi.new_string != null ? (
          /* Diff view for Edit — uses PdDiffViewer with LCS-based unified diff */
          <PdDiffViewer
            oldContent={fi.old_string}
            newContent={fi.new_string}
            fileName={filePath}
          />
        ) : isWrite && fi.content ? (
          /* Write preview — show as diff (empty → new content) */
          <PdDiffViewer
            oldContent=""
            newContent={fi.content}
            fileName={filePath}
          />
        ) : result ? (
          /* Read result with line numbers */
          <div className="px-1 py-2">
            <NumberedLines
              text={result}
              className="text-[var(--pd-color-fg)] font-[var(--pd-font-mono)]"
            />
          </div>
        ) : null}
      </div>

      {/* Result footer for Edit/Write confirmation */}
      {(isEdit || isWrite) && result && (
        <div className="px-3 py-1.5 text-[11px] text-[var(--pd-color-fg-muted)] bg-[var(--pd-color-bg-subtle)] border-t border-t-[var(--pd-color-border)]">
          {result}
        </div>
      )}
    </div>
  );
});

FileRenderer.displayName = "FileRenderer";
