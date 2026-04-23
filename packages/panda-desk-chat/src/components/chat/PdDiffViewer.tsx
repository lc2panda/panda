// Input:  oldContent, newContent, fileName, optional language
// Output: Unified diff viewer with line numbers, red/green diff highlighting
// Pos:    Chat layer — standalone diff visualization for file changes
import React, { useMemo } from "react";
import { cn } from "../../lib/cn";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export interface PdDiffViewerProps {
  oldContent: string;
  newContent: string;
  fileName: string;
  language?: string;
  className?: string;
}

/* -------------------------------------------------------------------------- */
/*  LCS-based diff algorithm                                                  */
/* -------------------------------------------------------------------------- */

type DiffLineKind = "same" | "add" | "del";

interface DiffLine {
  kind: DiffLineKind;
  text: string;
  oldLineNo?: number;
  newLineNo?: number;
}

/**
 * Compute unified diff lines using LCS (Longest Common Subsequence).
 * Operates on whole lines — no intra-line diffing.
 */
function computeUnifiedDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");

  const m = oldLines.length;
  const n = newLines.length;

  // Build LCS length table (O(m*n) — acceptable for typical file sizes)
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array<number>(n + 1).fill(0),
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        oldLines[i - 1] === newLines[j - 1]
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  // Backtrack to produce diff sequence
  const result: DiffLine[] = [];
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      result.push({ kind: "same", text: oldLines[i - 1], oldLineNo: i, newLineNo: j });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.push({ kind: "add", text: newLines[j - 1], newLineNo: j });
      j--;
    } else {
      result.push({ kind: "del", text: oldLines[i - 1], oldLineNo: i });
      i--;
    }
  }

  result.reverse();
  return result;
}

/* -------------------------------------------------------------------------- */
/*  Line rendering styles                                                     */
/* -------------------------------------------------------------------------- */

const lineStyles: Record<DiffLineKind, { bg: string; gutter: string; text: string; prefix: string }> = {
  del: {
    bg: "bg-[#3c1618]",
    gutter: "text-[#dc2626] opacity-70",
    text: "text-[#f87171]",
    prefix: "-",
  },
  add: {
    bg: "bg-[#132a1a]",
    gutter: "text-[#5a9e6f] opacity-70",
    text: "text-[#6ee7b7]",
    prefix: "+",
  },
  same: {
    bg: "",
    gutter: "text-[var(--pd-color-fg-muted)] opacity-50",
    text: "text-[var(--pd-color-fg)] opacity-80",
    prefix: " ",
  },
};

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export const PdDiffViewer: React.FC<PdDiffViewerProps> = React.memo(
  ({ oldContent, newContent, fileName, language, className }) => {
    const diffLines = useMemo(
      () => computeUnifiedDiff(oldContent, newContent),
      [oldContent, newContent],
    );

    const addCount = diffLines.filter((l) => l.kind === "add").length;
    const delCount = diffLines.filter((l) => l.kind === "del").length;

    return (
      <div
        className={cn(
          "rounded-[var(--pd-radius-md)] overflow-hidden border border-[var(--pd-color-border)]",
          className,
        )}
      >
        {/* File header bar */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--pd-color-bg-subtle)] border-b border-b-[var(--pd-color-border)]">
          <div className="flex items-center gap-2 text-[12px] font-[var(--pd-font-mono)]">
            <span className="text-[var(--pd-color-fg)]">{fileName}</span>
            {language && (
              <span className="text-[var(--pd-color-fg-muted)] opacity-60">{language}</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[11px] font-[var(--pd-font-mono)]">
            {addCount > 0 && <span className="text-[#5a9e6f]">+{addCount}</span>}
            {delCount > 0 && <span className="text-[#dc2626]">-{delCount}</span>}
          </div>
        </div>

        {/* Diff body */}
        <div className="overflow-x-auto bg-[var(--pd-color-terminal-bg,#1a1a1a)]">
          <pre className="m-0 text-[12px] leading-[1.6] font-[var(--pd-font-mono)]">
            {diffLines.map((line, idx) => {
              const s = lineStyles[line.kind];
              return (
                <div key={idx} className={cn("flex", s.bg)}>
                  {/* Old line number */}
                  <span
                    className={cn(
                      "inline-block w-[36px] pr-1 text-right select-none shrink-0 text-[11px]",
                      s.gutter,
                    )}
                  >
                    {line.oldLineNo ?? ""}
                  </span>
                  {/* New line number */}
                  <span
                    className={cn(
                      "inline-block w-[36px] pr-1 text-right select-none shrink-0 text-[11px]",
                      s.gutter,
                    )}
                  >
                    {line.newLineNo ?? ""}
                  </span>
                  {/* Prefix (+/-/space) */}
                  <span
                    className={cn(
                      "inline-block w-[16px] text-center select-none shrink-0",
                      s.gutter,
                    )}
                  >
                    {s.prefix}
                  </span>
                  {/* Line content */}
                  <span className={cn("flex-1 whitespace-pre-wrap break-all px-1", s.text)}>
                    {line.text}
                  </span>
                </div>
              );
            })}
          </pre>
        </div>
      </div>
    );
  },
);

PdDiffViewer.displayName = "PdDiffViewer";
