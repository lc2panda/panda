// Input: raw user message text containing panda CLI <command-*> envelopes (e.g. "<command-name>/plugin</command-name><command-args></command-args>")
// Output: Single-line right-aligned stub "⌘ /command-name(args)" — collapses 4–8 noisy command envelope bubbles into one
// Pos: Chat layer — rendered by PdMessageList in place of PdUserBubble when user-message text is a CLI command envelope
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。
import React from "react";
import { cn } from "../../lib/cn";

export interface PdCommandStubProps {
  /** Raw user-message text. The component extracts <command-name>, <command-args>, and any local-command-stdout payload from it. */
  content: string;
}

function extractTagText(text: string, tag: string): string | undefined {
  // Capture inner text of <tag>...</tag>, dot-all via [\s\S].
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = text.match(re);
  return m ? m[1]?.trim() : undefined;
}

/**
 * Heuristic: any user message whose text is *only* command envelopes
 * (command-name / command-message / command-args / local-command-stdout/-stderr)
 * should be folded to this stub. Plain text after stripping all envelope tags
 * means the user typed real prose — fall back to PdUserBubble in that case.
 */
export function isPandaCliCommandStub(content: string): boolean {
  const text = content.trim();
  if (text.length === 0) return false;
  // Must START with one of the known envelope tags.
  if (!/^<(command-name|command-message|command-args|local-command-stdout|local-command-stderr)[\s>]/i.test(text)) {
    return false;
  }
  // After stripping every known envelope (tag + content), nothing real should remain.
  const stripped = text
    .replace(
      /<(command-[a-z-]+|local-command-[a-z-]+)[^>]*>[\s\S]*?<\/\1>/gi,
      "",
    )
    .replace(/<\/?(command-[a-z-]+|local-command-[a-z-]+)[^>]*>/gi, "")
    .trim();
  return stripped.length === 0;
}

export const PdCommandStub: React.FC<PdCommandStubProps> = React.memo(({ content }) => {
  const name = extractTagText(content, "command-name") ?? "";
  const args = extractTagText(content, "command-args") ?? "";
  const stdout = extractTagText(content, "local-command-stdout") ?? "";

  // Render: "⌘ /command-name args" — fall back to first non-empty signal.
  const labelCmd = name.startsWith("/") ? name : name ? `/${name}` : "";
  const labelArgs = args && args !== "(none)" ? ` ${args}` : "";
  const label =
    labelCmd
      ? `${labelCmd}${labelArgs}`
      : stdout
        ? stdout.split("\n", 1)[0]?.slice(0, 80) ?? ""
        : "";

  if (!label) return null;

  return (
    <div className="mb-3 flex justify-end">
      <div
        className={cn(
          "inline-flex items-center gap-1.5",
          "px-2.5 py-1",
          "text-[12px] leading-tight",
          "whitespace-nowrap",
          "select-none",
        )}
        style={{
          color: "var(--pd-color-fg-muted)",
          background: "var(--pd-color-accent-subtle, #F7D7CA)",
          border: "1px solid var(--pd-color-border-subtle, rgba(218,193,186,0.5))",
          borderRadius: 999,
          opacity: 0.85,
        }}
        title={content.length > 200 ? content.slice(0, 200) + "..." : content}
      >
        <span aria-hidden="true" style={{ color: "var(--pd-color-accent)" }}></span>
        <span>{label}</span>
      </div>
    </div>
  );
});

PdCommandStub.displayName = "PdCommandStub";
