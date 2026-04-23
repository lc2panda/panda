// Input: chatStore (active session messages → toolCalls for Read/Write file content)
// Output: 预览面板 — 显示最近一次 Read/Write 工具返回的文件内容，带行号
// Pos: PdInspector > preview tab 内容区
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { useMemo, useState } from 'react';
import { useChatStore, type UIMessage, type UIToolCall } from '../../../stores/chatStore';

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface FilePreview {
  path: string;
  content: string;
  op: 'read' | 'write';
  toolCallId: string;
}

/* -------------------------------------------------------------------------- */
/*  Extraction — find the most recent Read/Write tool result                  */
/* -------------------------------------------------------------------------- */

function findLatestFilePreview(messages: UIMessage[]): FilePreview | null {
  // Walk messages in reverse to find the most recent Read/Write result
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (!msg.toolCalls) continue;

    // Walk tool calls in reverse within the message
    for (let j = msg.toolCalls.length - 1; j >= 0; j--) {
      const tc = msg.toolCalls[j];
      const lower = tc.toolName.toLowerCase();
      const isRead = lower === 'read' || lower.includes('read');
      const isWrite = lower === 'write' || lower.includes('write');
      if (!isRead && !isWrite) continue;
      if (tc.status !== 'success' || !tc.result) continue;

      const filePath = extractPath(tc);
      if (!filePath) continue;

      return {
        path: filePath,
        content: tc.result,
        op: isWrite ? 'write' : 'read',
        toolCallId: tc.id,
      };
    }
  }
  return null;
}

function extractPath(tc: UIToolCall): string | null {
  const input = tc.input;
  if (!input || typeof input !== 'object') return null;
  for (const key of ['file_path', 'filePath', 'path']) {
    const val = input[key];
    if (typeof val === 'string' && val.length > 0) return val;
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/*  Line-numbered content renderer                                            */
/* -------------------------------------------------------------------------- */

function FileContent({ content }: { content: string }) {
  const lines = content.split('\n');
  const gutterWidth = String(lines.length).length;

  return (
    <pre
      className="m-0 overflow-x-auto text-xs leading-5"
      style={{
        fontFamily: 'var(--pd-font-mono, ui-monospace, monospace)',
        color: 'var(--pd-color-fg)',
        background: 'transparent',
        tabSize: 2,
      }}
    >
      {lines.map((line, idx) => (
        <div key={idx} className="flex hover:bg-[var(--pd-color-bg-hover)]">
          <span
            className="shrink-0 select-none pr-3 text-right"
            style={{
              width: `${gutterWidth + 2}ch`,
              color: 'var(--pd-color-fg-subtle, #666)',
              userSelect: 'none',
            }}
          >
            {idx + 1}
          </span>
          <span className="flex-1 whitespace-pre">{line}</span>
        </div>
      ))}
    </pre>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Panel                                                                */
/* -------------------------------------------------------------------------- */

export function PreviewPanel() {
  const session = useChatStore((s) => s.getActiveSession());
  const messages = session?.messages ?? [];
  const [refreshKey, setRefreshKey] = useState(0);

  const preview = useMemo(
    () => findLatestFilePreview(messages),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [messages, refreshKey],
  );

  if (!preview) {
    return (
      <div className="flex flex-col h-full p-4">
        <h3 className="text-sm font-semibold text-[var(--pd-fg)]">预览</h3>
        <div className="mx-0 mt-2 border-t border-[var(--pd-color-border)]" />
        <div className="flex-1 flex items-center justify-center">
          <span className="text-xs text-[var(--pd-color-fg-muted)]">
            暂无文件预览
          </span>
        </div>
      </div>
    );
  }

  const fileName = preview.path.split('/').pop() ?? preview.path;

  return (
    <div className="flex flex-col h-full">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs">
            {preview.op === 'write' ? '\u{270F}\u{FE0F}' : '\u{1F4C4}'}
          </span>
          <span
            className="truncate font-mono text-xs text-[var(--pd-color-fg)]"
            title={preview.path}
          >
            {fileName}
          </span>
        </div>
        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          className="shrink-0 cursor-pointer rounded-[var(--pd-radius-sm)] border-none bg-transparent px-2 py-1 text-xs text-[var(--pd-color-fg-muted)] hover:bg-[var(--pd-color-bg-hover)]"
          title="刷新"
        >
          &#x21BB;
        </button>
      </div>

      {/* Full path */}
      <div
        className="px-4 pb-2 truncate text-[10px] text-[var(--pd-color-fg-subtle,#888)]"
        title={preview.path}
      >
        {preview.path}
      </div>

      <div className="mx-4 border-t border-[var(--pd-color-border)]" />

      {/* File content */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        <FileContent content={preview.content} />
      </div>
    </div>
  );
}
