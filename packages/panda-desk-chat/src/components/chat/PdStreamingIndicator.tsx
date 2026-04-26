// Input: chatStore active session 的 chatState / statusVerb / elapsedSeconds / tokenUsage
// Output: cc-haha 1:1 StreamingIndicator — pill-shaped status badge with ✦ shimmer + verb + elapsed + ↓ tokens
// Pos: Chat layer — appears below the message stream while the model is thinking or a tool is running.
//
// Reference: monitor/tmp/cc-haha/desktop/src/components/chat/StreamingIndicator.tsx L1-41
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。
import React from "react";
import { useChatStore } from "../../stores/chatStore";

function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export const PdStreamingIndicator: React.FC = () => {
  const activeSession = useChatStore((s) => s.getActiveSession());
  const chatState = activeSession?.chatState ?? "idle";
  const statusVerb = activeSession?.statusVerb ?? "";
  const elapsedSeconds = activeSession?.elapsedSeconds ?? 0;
  // panda tokenUsage 字段名 input/output — cc-haha 是 input_tokens/output_tokens。
  // 显示层只读 output（cc-haha L34: tokenUsage.output_tokens > 0）。
  const tokenUsage = activeSession?.tokenUsage ?? { input: 0, output: 0 };

  let verb: string;
  if (statusVerb) {
    verb = statusVerb;
  } else {
    verb =
      chatState === "thinking"
        ? "Thinking"
        : chatState === "tool_executing"
          ? "Running"
          : "Working";
  }

  // 1:1 cc-haha StreamingIndicator L25-40
  return (
    <div className="mb-2 flex w-fit items-center gap-2 rounded-full border border-[var(--pd-color-border)]/40 bg-[var(--pd-color-surface-container-low)] px-3 py-1">
      <span className="text-[var(--pd-color-brand)] animate-shimmer text-xs">✦</span>
      <span className="text-xs font-medium text-[var(--pd-color-text-secondary)]">
        {verb}...
      </span>
      {elapsedSeconds > 0 && (
        <span className="text-[10px] text-[var(--pd-color-text-tertiary)]">
          {formatElapsed(elapsedSeconds)}
        </span>
      )}
      {tokenUsage.output > 0 && (
        <span className="text-[10px] text-[var(--pd-color-text-tertiary)]">
          · ↓ {tokenUsage.output}
        </span>
      )}
    </div>
  );
};

PdStreamingIndicator.displayName = "PdStreamingIndicator";
