// Input: raw user/assistant message text starting with "<task-notification>" — XML payload from panda cron worker callback
// Output: Floating card with header "⏰ Cron task: {agent}" + status badge + chevron toggle; collapsed shows summary + result preview, expanded shows full XML
// Pos: Chat layer — rendered by PdMessageList in place of PdUserBubble/PdMessageBubble when content is a task-notification envelope
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。
import React, { useState } from "react";
import { cn } from "../../lib/cn";

export interface PdTaskNotificationCardProps {
  /** Raw text content — must start with `<task-notification>` after trimming. */
  content: string;
}

function extractTag(text: string, tag: string): string | undefined {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = text.match(re);
  return m ? m[1]?.trim() : undefined;
}

export function isTaskNotification(content: string): boolean {
  return content.trim().startsWith("<task-notification");
}

interface ParsedTaskNotification {
  agent?: string;
  taskId?: string;
  status?: string;
  summary?: string;
  result?: string;
  outputFile?: string;
}

function parseTaskNotification(content: string): ParsedTaskNotification {
  return {
    agent:
      extractTag(content, "agent-name") ??
      extractTag(content, "agent") ??
      extractTag(content, "task-name"),
    taskId: extractTag(content, "task-id"),
    status: extractTag(content, "status"),
    summary: extractTag(content, "summary"),
    result: extractTag(content, "result"),
    outputFile: extractTag(content, "output-file"),
  };
}

/** Status → CSS color tokens. */
function statusColors(status: string | undefined): { fg: string; bg: string; border: string } {
  const s = (status ?? "").toLowerCase();
  if (s === "success" || s === "completed" || s === "ok" || s === "done") {
    return {
      fg: "var(--pd-color-success, #16A34A)",
      bg: "var(--pd-color-success-bg, rgba(22,163,74,0.10))",
      border: "var(--pd-color-success, #16A34A)",
    };
  }
  if (s === "error" || s === "failed" || s === "failure") {
    return {
      fg: "var(--pd-color-error, #BA1A1A)",
      bg: "var(--pd-color-error-bg, #FFDAD6)",
      border: "var(--pd-color-error, #BA1A1A)",
    };
  }
  if (s === "running" || s === "pending" || s === "in_progress") {
    return {
      fg: "var(--pd-color-warning, #CA8A04)",
      bg: "var(--pd-color-warning-bg, rgba(202,138,4,0.10))",
      border: "var(--pd-color-warning, #CA8A04)",
    };
  }
  return {
    fg: "var(--pd-color-fg-muted, #54433E)",
    bg: "var(--pd-color-accent-subtle, #F7D7CA)",
    border: "var(--pd-color-border, #DAC1BA)",
  };
}

export const PdTaskNotificationCard: React.FC<PdTaskNotificationCardProps> = React.memo(({ content }) => {
  const [expanded, setExpanded] = useState(false);
  const parsed = parseTaskNotification(content);
  const colors = statusColors(parsed.status);
  const title = parsed.summary || parsed.agent || "Cron task";
  const headerLabel = parsed.agent ? `Cron task · ${parsed.agent}` : "Cron task";
  const previewSrc = parsed.result || parsed.summary || "";
  const previewLine = previewSrc.split("\n").find((l) => l.trim().length > 0)?.trim() ?? "";
  const previewClipped =
    previewLine.length > 140 ? previewLine.slice(0, 140) + "…" : previewLine;

  return (
    <div className="mb-4">
      <div
        className={cn("relative", "overflow-hidden")}
        style={{
          background: "#FEFDFA",
          border: "1px solid var(--pd-color-border, #DAC1BA)",
          borderRadius: 12,
          boxShadow: "0 1px 2px rgba(27,28,26,0.04), 0 4px 12px rgba(27,28,26,0.06)",
        }}
      >
        {/* Header */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={cn(
            "w-full flex items-center gap-2",
            "px-4 py-3",
            "text-left",
            "transition-colors",
          )}
          style={{
            background: "transparent",
            cursor: "pointer",
            border: "none",
          }}
          aria-expanded={expanded}
        >
          <span
            aria-hidden="true"
            style={{
              fontSize: 14,
              lineHeight: 1,
              color: "var(--pd-color-accent, #D97757)",
            }}
          >

          </span>
          <span
            className="min-w-0 flex-1 truncate"
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--pd-color-fg, #1B1C1A)",
            }}
          >
            {headerLabel}
          </span>
          {parsed.status && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: 999,
                color: colors.fg,
                background: colors.bg,
                border: `1px solid ${colors.border}`,
                textTransform: "uppercase",
                letterSpacing: 0.4,
                whiteSpace: "nowrap",
              }}
            >
              {parsed.status}
            </span>
          )}
          <span
            aria-hidden="true"
            style={{
              fontSize: 12,
              color: "var(--pd-color-fg-muted, #54433E)",
              transition: "transform 200ms var(--pd-ease-standard, ease)",
              transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
              display: "inline-block",
              width: 12,
            }}
          >

          </span>
        </button>

        {/* Body */}
        <div
          style={{
            borderTop: "1px solid var(--pd-color-border-subtle, rgba(218,193,186,0.5))",
            padding: "10px 16px 12px",
          }}
        >
          {/* Title row (summary if separate from agent) */}
          {parsed.summary && parsed.summary !== headerLabel && (
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "var(--pd-color-fg, #1B1C1A)",
                marginBottom: 6,
              }}
            >
              {title}
            </div>
          )}

          {/* Collapsed preview */}
          {!expanded && previewClipped && (
            <div
              style={{
                fontSize: 12,
                lineHeight: 1.6,
                color: "var(--pd-color-fg-muted, #54433E)",
                whiteSpace: "pre-wrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {previewClipped}
            </div>
          )}

          {/* Expanded: structured fields + raw XML fallback */}
          {expanded && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {parsed.taskId && (
                <KeyValueRow label="Task ID" value={parsed.taskId} mono />
              )}
              {parsed.outputFile && (
                <KeyValueRow label="Output" value={parsed.outputFile} mono />
              )}
              {parsed.result && (
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--pd-color-fg-muted, #54433E)",
                      textTransform: "uppercase",
                      letterSpacing: 0.4,
                      marginBottom: 4,
                    }}
                  >
                    Result
                  </div>
                  <pre
                    style={{
                      margin: 0,
                      padding: "8px 10px",
                      background: "rgba(218,193,186,0.15)",
                      border: "1px solid var(--pd-color-border-subtle, rgba(218,193,186,0.5))",
                      borderRadius: 8,
                      fontSize: 12,
                      lineHeight: 1.55,
                      color: "var(--pd-color-fg, #1B1C1A)",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      maxHeight: 360,
                      overflow: "auto",
                      fontFamily:
                        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                    }}
                  >
                    {parsed.result}
                  </pre>
                </div>
              )}
              {/* Raw fallback when nothing structured was extracted */}
              {!parsed.result && !parsed.summary && !parsed.taskId && (
                <pre
                  style={{
                    margin: 0,
                    padding: "8px 10px",
                    background: "rgba(218,193,186,0.15)",
                    border: "1px solid var(--pd-color-border-subtle, rgba(218,193,186,0.5))",
                    borderRadius: 8,
                    fontSize: 12,
                    lineHeight: 1.55,
                    color: "var(--pd-color-fg-muted, #54433E)",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    maxHeight: 360,
                    overflow: "auto",
                    fontFamily:
                      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  }}
                >
                  {content}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

PdTaskNotificationCard.displayName = "PdTaskNotificationCard";

const KeyValueRow: React.FC<{ label: string; value: string; mono?: boolean }> = ({
  label,
  value,
  mono,
}) => (
  <div style={{ display: "flex", gap: 8, alignItems: "baseline", fontSize: 12 }}>
    <span
      style={{
        fontWeight: 600,
        color: "var(--pd-color-fg-muted, #54433E)",
        textTransform: "uppercase",
        letterSpacing: 0.4,
        fontSize: 11,
        minWidth: 60,
      }}
    >
      {label}
    </span>
    <span
      style={{
        color: "var(--pd-color-fg, #1B1C1A)",
        wordBreak: "break-all",
        fontFamily: mono
          ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
          : undefined,
      }}
    >
      {value}
    </span>
  </div>
);
