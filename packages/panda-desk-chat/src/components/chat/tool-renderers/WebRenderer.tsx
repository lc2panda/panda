// Input:  Tool call data for WebSearch/WebFetch (url, query)
// Output: Web link card or search results list
// Pos:    Chat > tool-renderers — specialized renderer for web operations
import React, { useMemo, useCallback } from "react";
import { cn } from "../../../lib/cn";
import type { ToolRendererProps } from "./index";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

/** Try to extract a title from HTML-like result content. */
function extractTitle(result: string): string | null {
  const m = result.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (m) return m[1].trim();
  // Fallback: first non-empty line as title
  const first = result.split("\n").find((l) => l.trim().length > 0);
  return first && first.length < 200 ? first.trim() : null;
}

/** Get domain from URL for display. */
function getDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

type WebInput = {
  url?: string;
  query?: string;
};

export const WebRenderer: React.FC<ToolRendererProps> = React.memo(({
  input,
  result,
  toolName,
}) => {
  const wi = input as WebInput;
  const url = wi.url ?? "";
  const query = wi.query ?? "";
  const isSearch = toolName === "WebSearch";

  const title = useMemo(() => {
    if (!result) return null;
    return extractTitle(result);
  }, [result]);

  const resultSummary = useMemo(() => {
    if (!result) return "";
    // Trim to first 500 chars for summary display
    const cleaned = result.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    return cleaned.length > 500 ? cleaned.slice(0, 500) + "..." : cleaned;
  }, [result]);

  const handleOpenUrl = useCallback(() => {
    if (url) {
      try { window.open(url, "_blank", "noopener,noreferrer"); } catch { /* noop */ }
    }
  }, [url]);

  return (
    <div
      className={cn(
        "rounded-lg overflow-hidden",
        "border border-[var(--pd-color-border)]",
        "hover:shadow-md transition-shadow duration-200",
      )}
    >
      {/* Header */}
      <div className="px-3 py-2 bg-[var(--pd-color-bg-subtle)] border-b border-b-[var(--pd-color-border)]">
        {isSearch && query && (
          <div className="text-[12px] text-[var(--pd-color-fg-muted)] mb-1">
            <span className="opacity-60">Search: </span>
            <span className="font-bold text-[var(--pd-color-fg)]">{query}</span>
          </div>
        )}
        {url && (
          <button
            type="button"
            onClick={handleOpenUrl}
            className={cn(
              "text-[13px] font-[var(--pd-font-mono)]",
              "text-[#5b8dd9] hover:underline cursor-pointer",
              "bg-transparent border-none p-0 text-left",
            )}
            title={url}
          >
            {url.length > 80 ? getDomain(url) : url}
          </button>
        )}
        {url && (
          <div className="text-[11px] text-[var(--pd-color-fg-muted)] opacity-50 mt-0.5">
            {getDomain(url)}
          </div>
        )}
      </div>

      {/* Body */}
      {result != null && (
        <div className="px-3 py-2">
          {title && !isSearch && (
            <div className="text-[13px] font-bold text-[var(--pd-color-fg)] mb-1">
              {title}
            </div>
          )}
          <div className="text-[12px] text-[var(--pd-color-fg-muted)] leading-relaxed break-words">
            {resultSummary}
          </div>
        </div>
      )}
    </div>
  );
});

WebRenderer.displayName = "WebRenderer";
