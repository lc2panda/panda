// Input:  Tool call data for Grep/GrepTool/Glob/GlobTool (pattern, path, glob)
// Output: Structured search results card with grouped file matches, highlighted pattern
// Pos:    Chat > tool-renderers — specialized renderer for search/grep operations
import React, { useMemo, useState } from "react";
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

interface FileGroup {
  file: string;
  dir: string;
  name: string;
  matches: { lineNo: string; text: string }[];
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

/** Group matches by file path. */
function groupByFile(matches: MatchLine[]): FileGroup[] {
  const map = new Map<string, FileGroup>();
  for (const m of matches) {
    let group = map.get(m.file);
    if (!group) {
      const lastSlash = m.file.lastIndexOf("/");
      group = {
        file: m.file,
        dir: lastSlash >= 0 ? m.file.slice(0, lastSlash + 1) : "",
        name: lastSlash >= 0 ? m.file.slice(lastSlash + 1) : m.file,
        matches: [],
      };
      map.set(m.file, group);
    }
    group.matches.push({ lineNo: m.lineNo, text: m.text });
  }
  return Array.from(map.values());
}

/** Make a path relative by stripping common workspace-like prefixes. */
function toRelativePath(path: string): string {
  // Strip absolute-looking prefixes (common patterns)
  return path.replace(/^(?:\/[^/]+)*\/(?:src|packages|app|lib)\//i, (match) => {
    const idx = match.lastIndexOf("/src/");
    if (idx >= 0) return match.slice(idx + 1);
    const pkgIdx = match.lastIndexOf("/packages/");
    if (pkgIdx >= 0) return match.slice(pkgIdx + 1);
    return match;
  });
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

/** Render a file path with gray directory prefix + blue filename. */
function FilePath({ dir, name }: { dir: string; name: string }) {
  const relDir = toRelativePath(dir);
  return (
    <span className="font-[var(--pd-font-mono)] text-[12px]">
      {relDir && (
        <span className="text-[var(--pd-color-fg-muted)] opacity-60">{relDir}</span>
      )}
      <span className="text-[#60a5fa] cursor-pointer hover:underline">{name}</span>
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

const MAX_VISIBLE_GROUPS = 15;

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

  const fileGroups = useMemo(() => groupByFile(matches), [matches]);
  const totalMatchCount = matches.length;
  const totalCount = totalMatchCount + plainLines.length;

  const [showAll, setShowAll] = useState(false);
  const visibleGroups = showAll ? fileGroups : fileGroups.slice(0, MAX_VISIBLE_GROUPS);
  const hiddenGroupCount = fileGroups.length - MAX_VISIBLE_GROUPS;

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
          {totalMatchCount > 0 && `${totalMatchCount} match${totalMatchCount !== 1 ? "es" : ""} in ${fileGroups.length} file${fileGroups.length !== 1 ? "s" : ""}`}
          {totalMatchCount === 0 && `${totalCount} result${totalCount !== 1 ? "s" : ""}`}
          {searchPath !== "." && ` · ${searchPath}`}
        </span>
      </div>

      {/* Grouped match list */}
      <div className="max-h-[400px] overflow-y-auto">
        {visibleGroups.map((group, gi) => (
          <div key={group.file}>
            {/* File header */}
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-1 bg-[var(--pd-color-bg-subtle)]",
                gi > 0 && "border-t border-t-[var(--pd-color-border)]",
              )}
            >
              {/* File icon */}
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="shrink-0 text-[var(--pd-color-fg-muted)] opacity-50">
                <path d="M3 1.5h6.5L13 5v9.5a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.2" />
                <path d="M9 1.5V5h3.5" stroke="currentColor" strokeWidth="1.2" />
              </svg>
              <FilePath dir={group.dir} name={group.name} />
              <span className="ml-auto text-[10px] text-[var(--pd-color-fg-muted)] opacity-50">
                {group.matches.length}
              </span>
            </div>

            {/* Match lines within this file */}
            {group.matches.map((m, mi) => (
              <div
                key={mi}
                className={cn(
                  "flex gap-1 px-3 pl-7 py-0.5 text-[12px] font-[var(--pd-font-mono)]",
                  "hover:bg-[var(--pd-color-bg-subtle)] transition-colors",
                )}
              >
                <span className="shrink-0 w-[40px] text-right text-[var(--pd-color-fg-muted)] opacity-40 select-none">
                  {m.lineNo}
                </span>
                <span className="flex-1 truncate text-[var(--pd-color-fg)]">
                  <HighlightText text={m.text} pattern={pattern} />
                </span>
              </div>
            ))}
          </div>
        ))}

        {/* Show more button */}
        {!showAll && hiddenGroupCount > 0 && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className={cn(
              "w-full px-3 py-1.5 text-[11px] text-center cursor-pointer",
              "bg-[var(--pd-color-bg-subtle)] text-[var(--pd-color-fg-muted)]",
              "hover:text-[var(--pd-color-fg)] border-none border-t border-t-[var(--pd-color-border)]",
            )}
          >
            Show {hiddenGroupCount} more file{hiddenGroupCount !== 1 ? "s" : ""}...
          </button>
        )}

        {/* Plain lines (Glob results / non-grep output) */}
        {plainLines.length > 0 && (
          <div className={cn(matches.length > 0 && "border-t border-t-[var(--pd-color-border)]")}>
            {plainLines.map((line, i) => {
              const lastSlash = line.lastIndexOf("/");
              const dir = lastSlash >= 0 ? line.slice(0, lastSlash + 1) : "";
              const name = lastSlash >= 0 ? line.slice(lastSlash + 1) : line;
              return (
                <div
                  key={`p-${i}`}
                  className={cn(
                    "px-3 py-0.5 text-[12px]",
                    "hover:bg-[var(--pd-color-bg-subtle)] transition-colors",
                  )}
                >
                  <FilePath dir={dir} name={name} />
                </div>
              );
            })}
          </div>
        )}
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
