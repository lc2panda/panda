// Input:  Tool call data for Grep/GrepTool/Glob/GlobTool (pattern, path, glob)
// Output: Search results card with pattern highlight, file:line matches, count
// Pos:    Chat > tool-renderers — specialized renderer for search/grep operations
import React, { useMemo } from "react";
import { cn } from "../../../lib/cn";
import type { ToolRendererProps } from "./index";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

interface MatchLine {
  file: string;
  lineNo: string;
  text: string;
}

/** Parse grep-style "file:line:text" or plain file paths from result. */
function parseResultLines(result: string): { matches: MatchLine[]; plainLines: string[] } {
  const matches: MatchLine[] = [];
  const plainLines: string[] = [];

  for (const raw of result.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    // Grep-style: file:lineNo:text
    const m = line.match(/^(.+?):(\d+):(.*)$/);
    if (m) {
      matches.push({ file: m[1], lineNo: m[2], text: m[3] });
    } else {
      plainLines.push(line);
    }
  }
  return { matches, plainLines };
}

/** Highlight occurrences of `pattern` in text (case-insensitive). */
function HighlightText({ text, pattern }: { text: string; pattern: string }) {
  if (!pattern) return <>{text}</>;
  try {
    const re = new RegExp(`(${pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = text.split(re);
    return (
      <>
        {parts.map((part, i) =>
          re.test(part) ? (
            <mark key={i} className="bg-[var(--pd-color-accent)] text-white rounded-[2px] px-[1px]">
              {part}
            </mark>
          ) : (
            <React.Fragment key={i}>{part}</React.Fragment>
          ),
        )}
      </>
    );
  } catch {
    return <>{text}</>;
  }
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

type SearchInput = {
  pattern?: string;
  path?: string;
  glob?: string;
};

export const SearchRenderer: React.FC<ToolRendererProps> = React.memo(({
  input,
  result,
}) => {
  const si = input as SearchInput;
  const pattern = si.pattern ?? "";
  const searchPath = si.path ?? ".";
  const globFilter = si.glob ?? "";

  const { matches, plainLines } = useMemo(
    () => parseResultLines(result ?? ""),
    [result],
  );
  const totalCount = matches.length + plainLines.length;

  return (
    <div className="rounded-lg overflow-hidden border border-[var(--pd-color-border)]">
      {/* Header: search query info */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-1.5 bg-[var(--pd-color-bg-subtle)] border-b border-b-[var(--pd-color-border)] text-[12px]">
        {pattern && (
          <span className="font-[var(--pd-font-mono)]">
            <span className="text-[var(--pd-color-fg-muted)]">pattern: </span>
            <span className="text-[var(--pd-color-accent)] font-bold">{pattern}</span>
          </span>
        )}
        {globFilter && (
          <span className="font-[var(--pd-font-mono)]">
            <span className="text-[var(--pd-color-fg-muted)]">glob: </span>
            <span className="text-[var(--pd-color-fg)]">{globFilter}</span>
          </span>
        )}
        <span className="ml-auto text-[11px] text-[var(--pd-color-fg-muted)]">
          {totalCount} result{totalCount !== 1 ? "s" : ""}
          {searchPath !== "." && ` in ${searchPath}`}
        </span>
      </div>

      {/* Match list */}
      <div className="max-h-[360px] overflow-y-auto">
        {matches.map((m, i) => (
          <div
            key={i}
            className={cn(
              "flex gap-1 px-3 py-0.5 text-[12px] font-[var(--pd-font-mono)]",
              "hover:bg-[var(--pd-color-bg-subtle)] transition-colors",
              i > 0 && "border-t border-t-[var(--pd-color-border)] border-opacity-30",
            )}
          >
            <span className="shrink-0 text-[var(--pd-color-accent)] opacity-80 cursor-pointer hover:underline">
              {m.file}
            </span>
            <span className="shrink-0 text-[var(--pd-color-fg-muted)] opacity-50">:{m.lineNo}</span>
            <span className="flex-1 truncate text-[var(--pd-color-fg)]">
              <HighlightText text={m.text} pattern={pattern} />
            </span>
          </div>
        ))}

        {/* Plain lines (Glob results / non-grep output) */}
        {plainLines.map((line, i) => (
          <div
            key={`p-${i}`}
            className={cn(
              "px-3 py-0.5 text-[12px] font-[var(--pd-font-mono)]",
              "text-[var(--pd-color-fg)]",
              "hover:bg-[var(--pd-color-bg-subtle)] transition-colors",
            )}
          >
            {line}
          </div>
        ))}
      </div>

      {/* Empty state */}
      {totalCount === 0 && result != null && (
        <div className="px-3 py-4 text-center text-[12px] text-[var(--pd-color-fg-muted)]">
          No results found
        </div>
      )}
    </div>
  );
});

SearchRenderer.displayName = "SearchRenderer";
