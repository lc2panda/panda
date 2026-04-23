// Input: chatStore (active session messages → toolCalls with file paths)
// Output: 文件树面板 — 从 tool calls 提取涉及文件，按目录层级展示
// Pos: PdInspector > files tab 内容区

import { useState, useMemo } from 'react';
import { useChatStore, type UIToolCall } from '../../../stores/chatStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FileOp = 'read' | 'write' | 'edit' | 'search';

interface FileEntry {
  path: string;
  op: FileOp;
}

interface TreeNode {
  name: string;
  fullPath: string;
  children: Map<string, TreeNode>;
  op?: FileOp;
  isFile: boolean;
}

// ---------------------------------------------------------------------------
// Tool → operation mapping
// ---------------------------------------------------------------------------

function toolToOp(toolName: string): FileOp | null {
  const lower = toolName.toLowerCase();
  if (lower.includes('read') || lower === 'read') return 'read';
  if (lower.includes('write') || lower === 'write') return 'write';
  if (lower.includes('edit') || lower === 'edit') return 'edit';
  if (lower.includes('grep') || lower.includes('glob') || lower === 'grep' || lower === 'glob')
    return 'search';
  return null;
}

const OP_LABELS: Record<FileOp, string> = {
  read: '读取',
  edit: '修改',
  write: '写入',
  search: '搜索',
};

const OP_COLORS: Record<FileOp, string> = {
  read: 'bg-emerald-500/20 text-emerald-400',
  edit: 'bg-orange-500/20 text-orange-400',
  write: 'bg-blue-500/20 text-blue-400',
  search: 'bg-cyan-500/20 text-cyan-400',
};

// ---------------------------------------------------------------------------
// File path extraction
// ---------------------------------------------------------------------------

function extractFilePath(tc: UIToolCall): string | null {
  const input = tc.input;
  if (!input || typeof input !== 'object') return null;
  // Common field names for file paths across tools
  for (const key of ['file_path', 'filePath', 'path', 'command']) {
    const val = input[key];
    if (typeof val === 'string' && val.startsWith('/')) return val;
  }
  return null;
}

function extractFiles(messages: { toolCalls?: UIToolCall[] }[]): FileEntry[] {
  const seen = new Map<string, FileOp>();

  for (const msg of messages) {
    if (!msg.toolCalls) continue;
    for (const tc of msg.toolCalls) {
      const op = toolToOp(tc.toolName);
      if (!op) continue;
      const fp = extractFilePath(tc);
      if (!fp) continue;
      // Higher priority ops override: write > edit > read > search
      const priority: Record<FileOp, number> = { write: 3, edit: 2, read: 1, search: 0 };
      const existing = seen.get(fp);
      if (!existing || priority[op] > priority[existing]) {
        seen.set(fp, op);
      }
    }
  }

  return Array.from(seen.entries()).map(([path, op]) => ({ path, op }));
}

// ---------------------------------------------------------------------------
// Tree builder
// ---------------------------------------------------------------------------

function buildTree(files: FileEntry[]): TreeNode {
  const root: TreeNode = { name: '', fullPath: '', children: new Map(), isFile: false };

  for (const { path, op } of files) {
    const parts = path.replace(/^\//, '').split('/');
    let cursor = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;

      if (!cursor.children.has(part)) {
        cursor.children.set(part, {
          name: part,
          fullPath: '/' + parts.slice(0, i + 1).join('/'),
          children: new Map(),
          isFile: isLast,
          op: isLast ? op : undefined,
        });
      } else if (isLast) {
        const node = cursor.children.get(part)!;
        node.isFile = true;
        node.op = op;
      }
      cursor = cursor.children.get(part)!;
    }
  }

  return root;
}

// ---------------------------------------------------------------------------
// Tree rendering
// ---------------------------------------------------------------------------

interface TreeItemProps {
  node: TreeNode;
  depth: number;
}

function TreeItem({ node, depth }: TreeItemProps) {
  const [expanded, setExpanded] = useState(true);
  const childNodes = Array.from(node.children.values()).sort((a, b) => {
    // Directories first, then alphabetical
    if (a.isFile !== b.isFile) return a.isFile ? 1 : -1;
    return a.name.localeCompare(b.name);
  });

  if (node.isFile && node.children.size === 0) {
    return (
      <div
        className="flex items-center gap-1.5 py-0.5"
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
        title={node.fullPath}
      >
        <span className="text-xs text-[var(--pd-color-fg-muted)]">{'\u{1F4C4}'}</span>
        <span className="flex-1 truncate font-mono text-xs text-[var(--pd-color-fg)]">
          {node.name}
        </span>
        {node.op && (
          <span
            className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${OP_COLORS[node.op]}`}
          >
            {OP_LABELS[node.op]}
          </span>
        )}
      </div>
    );
  }

  // Directory node
  return (
    <div>
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full cursor-pointer items-center gap-1.5 border-none bg-transparent py-0.5 text-left hover:bg-[var(--pd-color-bg-hover)]"
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
      >
        <span className="text-xs text-[var(--pd-color-fg-muted)]">
          {expanded ? '\u25BE' : '\u25B8'}
        </span>
        <span className="text-xs text-[var(--pd-color-fg-muted)]">{'\u{1F4C1}'}</span>
        <span className="font-mono text-xs font-medium text-[var(--pd-color-fg)]">
          {node.name}/
        </span>
      </button>
      {expanded &&
        childNodes.map((child) => (
          <TreeItem key={child.fullPath} node={child} depth={depth + 1} />
        ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function FilesPanel() {
  const session = useChatStore((s) => s.getActiveSession());
  const messages = session?.messages ?? [];

  const files = useMemo(() => extractFiles(messages), [messages]);
  const tree = useMemo(() => buildTree(files), [files]);
  const topChildren = Array.from(tree.children.values()).sort((a, b) => {
    if (a.isFile !== b.isFile) return a.isFile ? 1 : -1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="flex flex-col gap-3 p-4">
      {/* Title */}
      <h3 className="text-sm font-semibold text-[var(--pd-fg)]">
        涉及文件 ({files.length})
      </h3>
      <div className="border-t border-[var(--pd-color-border)]" />

      {files.length === 0 ? (
        <div className="py-8 text-center text-xs text-[var(--pd-color-fg-muted)]">
          暂无文件操作
        </div>
      ) : (
        <div className="overflow-y-auto">
          {topChildren.map((child) => (
            <TreeItem key={child.fullPath} node={child} depth={0} />
          ))}
        </div>
      )}

      {/* Legend */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-[var(--pd-color-border)] pt-2">
          {(Object.entries(OP_LABELS) as [FileOp, string][]).map(([op, label]) => (
            <span
              key={op}
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${OP_COLORS[op]}`}
            >
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
