// Input: User messages via IPC bridge + session/config/fs queries
// Output: Simulated streaming responses + mock session/model/command/fs data
// Pos: IPC layer — dev-only mock backend for full UI testing without Electron
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EventCallback = (...args: unknown[]) => void;

export interface StreamStartEvent {
  sessionId: string;
  messageId: string;
}

export interface StreamDeltaEvent {
  sessionId: string;
  messageId: string;
  delta: string;
  type: 'text' | 'thinking' | 'tool_input';
}

export interface StreamEndEvent {
  sessionId: string;
  messageId: string;
  finishReason: 'end_turn' | 'tool_use';
  tokenUsage: { input: number; output: number; cacheRead: number; cacheWrite: number };
}

export interface ToolUseStartEvent {
  sessionId: string;
  toolUseId: string;
  toolName: string;
  input: Record<string, unknown>;
}

export interface ToolUseEndEvent {
  sessionId: string;
  toolUseId: string;
  result: string;
  isError: boolean;
}

export interface PermissionRequestEvent {
  sessionId: string;
  toolUseId: string;
  toolName: string;
  input: Record<string, unknown>;
  tier: 'read' | 'write' | 'exec';
}

// ---------------------------------------------------------------------------
// Mock data — session, model, command, filesystem
// ---------------------------------------------------------------------------

interface MockSession {
  id: string;
  name: string;
  cwd: string;
  createdAt: string;
  lastActive: string;
  messageCount: number;
}

const MOCK_SESSIONS_SEED: MockSession[] = [
  { id: 'session-mock-1', name: 'Panda Code 项目', cwd: '/Users/panda/project', createdAt: '2026-04-21T10:00:00Z', lastActive: '2026-04-21T15:00:00Z', messageCount: 12 },
  { id: 'session-mock-2', name: 'API 集成开发', cwd: '/Users/panda/api-work', createdAt: '2026-04-20T09:00:00Z', lastActive: '2026-04-20T18:00:00Z', messageCount: 8 },
  { id: 'session-mock-3', name: 'Bug 修复冲刺', cwd: '/Users/panda/bugfix', createdAt: '2026-04-19T14:00:00Z', lastActive: '2026-04-19T17:30:00Z', messageCount: 5 },
];

const MOCK_MODELS = [
  { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', provider: 'anthropic', maxTokens: 64000 },
  { id: 'claude-opus-4-20250514', name: 'Claude Opus 4', provider: 'anthropic', maxTokens: 32000 },
  { id: 'claude-haiku-3-20250307', name: 'Claude Haiku 3', provider: 'anthropic', maxTokens: 16000 },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', maxTokens: 128000 },
];

const MOCK_SLASH_COMMANDS = [
  { name: '/help', description: 'Show available commands', category: 'general' },
  { name: '/clear', description: 'Clear conversation history', category: 'general' },
  { name: '/compact', description: 'Compact context window', category: 'context' },
  { name: '/model', description: 'Switch AI model', category: 'config' },
  { name: '/permission', description: 'Set permission mode', category: 'config' },
  { name: '/dream', description: 'Run memory consolidation', category: 'assistant' },
  { name: '/status', description: 'Show session status', category: 'info' },
  { name: '/cost', description: 'Show token usage and cost', category: 'info' },
];

const MOCK_FS_ENTRIES = [
  { path: 'src/main.ts', name: 'main.ts', isDir: false },
  { path: 'src/App.tsx', name: 'App.tsx', isDir: false },
  { path: 'src/stores/', name: 'stores', isDir: true },
  { path: 'src/ipc/', name: 'ipc', isDir: true },
  { path: 'src/components/', name: 'components', isDir: true },
  { path: 'package.json', name: 'package.json', isDir: false },
];

const MOCK_DIR_ENTRIES = [
  { name: 'main.ts', isDir: false, size: 1024 },
  { name: 'App.tsx', isDir: false, size: 3456 },
  { name: 'stores', isDir: true, size: 0 },
  { name: 'ipc', isDir: true, size: 0 },
  { name: 'components', isDir: true, size: 0 },
  { name: 'hooks', isDir: true, size: 0 },
  { name: 'styles', isDir: true, size: 0 },
];

// ---------------------------------------------------------------------------
// Reply templates
// ---------------------------------------------------------------------------

const THINKING_CONTENT =
  'Let me analyze the user request carefully. I need to consider the context, identify the key requirements, and formulate a comprehensive response. ' +
  'First, I will break down the problem into smaller parts. Then I will evaluate each part independently before synthesizing a final answer. ' +
  'This approach ensures accuracy and completeness in my response.';

const REPLIES: Record<string, string> = {
  hello:
    "Hello! I'm **Panda Code**, your AI coding assistant. I can help you with:\n\n" +
    '- Writing and editing code\n- Debugging issues\n- Explaining concepts\n- Running commands\n\n' +
    'How can I help you today?',
  code:
    "Here's an example function:\n\n```typescript\nfunction fibonacci(n: number): number {\n" +
    '  if (n <= 1) return n;\n  let a = 0, b = 1;\n  for (let i = 2; i <= n; i++) {\n' +
    '    [a, b] = [b, a + b];\n  }\n  return b;\n}\n\nconsole.log(fibonacci(10)); // 55\n```\n\n' +
    'This iterative approach runs in **O(n)** time and **O(1)** space.',
  file:
    'I found the file you mentioned. Let me read its contents for you.\n\n' +
    '```\nsrc/main.ts (42 lines)\n```\n\nThe file contains the main entry point with initialization logic.',
  bash:
    'I can run that command for you. Let me execute it in your working directory.\n\n' +
    'The command completed successfully with exit code 0.',
  default:
    "I understand your request. Let me provide a detailed response.\n\n" +
    '## Analysis\n\nBased on the current project structure, here are the key observations:\n\n' +
    '1. **Architecture**: The codebase follows a modular pattern with clear separation of concerns\n' +
    '2. **Dependencies**: All packages are up to date with no known vulnerabilities\n' +
    '3. **Testing**: Coverage is at 87% with room for improvement in edge cases\n\n' +
    '### Recommendations\n\n' +
    '- Consider adding integration tests for the IPC bridge layer\n' +
    '- The streaming buffer could benefit from back-pressure handling\n' +
    '- Documentation should be updated to reflect recent API changes\n\n' +
    'Would you like me to implement any of these suggestions?',
};

const TOOL_TEMPLATES = [
  { name: 'Read', input: { file_path: '/src/main.ts' }, result: '// main entry\nexport function main() { ... }' },
  { name: 'Bash', input: { command: 'ls -la src/' }, result: 'total 48\ndrwxr-xr-x  12 user  staff  384 Apr 21 14:00 .\n-rw-r--r--   1 user  staff  1024 Apr 21 13:00 main.ts' },
  { name: 'Grep', input: { pattern: 'TODO', path: 'src/' }, result: 'src/utils.ts:12: // TODO: optimize this\nsrc/bridge.ts:45: // TODO: add retry logic' },
];

// ---------------------------------------------------------------------------
// DevMockRelay
// ---------------------------------------------------------------------------

export class DevMockRelay {
  private listeners = new Map<string, Set<EventCallback>>();
  private sessions: MockSession[] = [...MOCK_SESSIONS_SEED];
  private timers: ReturnType<typeof setTimeout>[] = [];
  private cancelled = false;
  private permissionResolver: (() => void) | null = null;

  on(event: string, callback: EventCallback): void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(callback);
  }

  off(event: string, callback: EventCallback): void {
    this.listeners.get(event)?.delete(callback);
  }

  cancel(): void {
    this.cancelled = true;
    for (const t of this.timers) clearTimeout(t);
    this.timers = [];
    if (this.permissionResolver) {
      this.permissionResolver();
      this.permissionResolver = null;
    }
  }

  async sendMessage(sessionId: string, text: string): Promise<void> {
    this.cancelled = false;
    this.timers = [];

    const messageId = crypto.randomUUID();
    const replyKey = this.matchReplyKey(text);
    const replyText = REPLIES[replyKey];
    const shouldToolUse = replyKey === 'file' || replyKey === 'bash' || Math.random() < 0.3;
    const shouldPermission = replyKey === 'bash' || Math.random() < 0.1;

    // 1) stream:start
    this.emit('stream:start', { sessionId, messageId } satisfies StreamStartEvent);

    let delay = 200; // initial delay before thinking starts

    // 2) thinking deltas — emit character-by-character in chunks of ~4 chars every 50ms
    const thinkChunks = this.chunkString(THINKING_CONTENT, 4);
    for (const chunk of thinkChunks) {
      delay += 50;
      this.schedule(delay, () => {
        if (this.cancelled) return;
        this.emit('stream:delta', {
          sessionId, messageId, delta: chunk, type: 'thinking',
        } satisfies StreamDeltaEvent);
      });
    }

    // Gap between thinking and text
    delay += 300;

    // 3) text deltas — character by character every 30ms
    const textChunks = this.chunkString(replyText, 2);
    for (const chunk of textChunks) {
      delay += 30;
      this.schedule(delay, () => {
        if (this.cancelled) return;
        this.emit('stream:delta', {
          sessionId, messageId, delta: chunk, type: 'text',
        } satisfies StreamDeltaEvent);
      });
    }

    // 4) Optional tool_use
    if (shouldToolUse) {
      delay += 200;
      const tool = this.pickTool(replyKey);
      const toolUseId = crypto.randomUUID();

      this.schedule(delay, () => {
        if (this.cancelled) return;
        this.emit('tool:start', {
          sessionId, toolUseId, toolName: tool.name, input: tool.input,
        } satisfies ToolUseStartEvent);
      });

      // 5) Optional permission request (blocks until resolved)
      if (shouldPermission) {
        delay += 300;
        const permDelay = delay;
        await new Promise<void>((outerResolve) => {
          this.schedule(permDelay, () => {
            if (this.cancelled) { outerResolve(); return; }
            this.emit('permission:request', {
              sessionId,
              toolUseId,
              toolName: tool.name,
              input: tool.input,
              tier: tool.name === 'Bash' ? 'exec' : 'read',
            } satisfies PermissionRequestEvent);

            // Wait for respondPermission or cancel
            this.permissionResolver = outerResolve;
          });
        });
        // After permission resolved, add a small extra delay
        delay += 500;
      }

      // Tool end
      delay += 800;
      this.schedule(delay, () => {
        if (this.cancelled) return;
        this.emit('tool:end', {
          sessionId, toolUseId, result: tool.result, isError: false,
        } satisfies ToolUseEndEvent);
      });

      // Additional text after tool
      delay += 300;
      const postToolText = '\n\nTool execution completed successfully.';
      const postChunks = this.chunkString(postToolText, 2);
      for (const chunk of postChunks) {
        delay += 30;
        this.schedule(delay, () => {
          if (this.cancelled) return;
          this.emit('stream:delta', {
            sessionId, messageId, delta: chunk, type: 'text',
          } satisfies StreamDeltaEvent);
        });
      }
    }

    // 6) stream:end
    delay += 200;
    this.schedule(delay, () => {
      if (this.cancelled) return;
      this.emit('stream:end', {
        sessionId,
        messageId,
        finishReason: 'end_turn',
        tokenUsage: {
          input: 150 + text.length * 2,
          output: replyText.length,
          cacheRead: Math.floor(Math.random() * 100),
          cacheWrite: Math.floor(Math.random() * 50),
        },
      } satisfies StreamEndEvent);
    });
  }

  /** Called by bridge when user responds to a permission prompt. */
  respondPermission(): void {
    if (this.permissionResolver) {
      const resolve = this.permissionResolver;
      this.permissionResolver = null;
      resolve();
    }
  }

  // ── Session management ───────────────────────────────────────────────

  listSessions(): MockSession[] {
    return [...this.sessions];
  }

  createSession(cwd: string, name?: string): { id: string } {
    const id = `session-mock-${Date.now()}`;
    const now = new Date().toISOString();
    const session: MockSession = {
      id,
      name: name ?? '新对话',
      cwd: cwd || '/Users/panda/project',
      createdAt: now,
      lastActive: now,
      messageCount: 0,
    };
    this.sessions.unshift(session);
    this.emitSessionUpdated();
    // Simulate CLI ready after a short delay
    setTimeout(() => {
      this.emit('session:ready', { sessionId: id });
    }, 300);
    return { id };
  }

  deleteSession(sessionId: string): void {
    this.sessions = this.sessions.filter((s) => s.id !== sessionId);
    this.emitSessionUpdated();
  }

  renameSession(sessionId: string, name: string): void {
    const session = this.sessions.find((s) => s.id === sessionId);
    if (session) {
      session.name = name;
      this.emitSessionUpdated();
    }
  }

  focusSession(sessionId: string): void {
    const session = this.sessions.find((s) => s.id === sessionId);
    if (session) {
      session.lastActive = new Date().toISOString();
      this.emitSessionUpdated();
    }
  }

  // ── Disk-based session access (pd:sessions:*) ────────────────────────

  async listAllSessions(): Promise<import('./types').DiskSessionMeta[]> {
    return [
      {
        id: 'disk-mock-1',
        title: '示例对话',
        projectPath: '/Users/panda/project',
        messageCount: 5,
        lastModified: new Date().toISOString(),
      },
      {
        id: 'disk-mock-2',
        title: '代码审查',
        projectPath: '/Users/panda/project',
        messageCount: 10,
        lastModified: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'disk-mock-3',
        title: '架构讨论',
        projectPath: '/Users/panda/other-project',
        messageCount: 22,
        lastModified: new Date(Date.now() - 172800000).toISOString(),
      },
    ];
  }

  async getSessionHistory(sessionId: string): Promise<import('./types').SessionDetail | null> {
    return {
      id: sessionId,
      title: sessionId === 'disk-mock-1' ? '示例对话' : sessionId === 'disk-mock-2' ? '代码审查' : '架构讨论',
      projectPath: '/Users/panda/project',
      messageCount: 2,
      lastModified: new Date().toISOString(),
      messages: [
        { role: 'user' as const, content: '你好', timestamp: new Date(Date.now() - 60000).toISOString() },
        { role: 'assistant' as const, content: '你好！有什么可以帮你的吗？', timestamp: new Date().toISOString() },
      ],
    };
  }

  // ── Config queries ───────────────────────────────────────────────────

  getModels(): typeof MOCK_MODELS {
    return [...MOCK_MODELS];
  }

  getSlashCommands(): typeof MOCK_SLASH_COMMANDS {
    return [...MOCK_SLASH_COMMANDS];
  }

  // ── File system ──────────────────────────────────────────────────────

  searchFiles(query: string): typeof MOCK_FS_ENTRIES {
    const lower = query.toLowerCase();
    return MOCK_FS_ENTRIES.filter((e) =>
      e.name.toLowerCase().includes(lower) || e.path.toLowerCase().includes(lower),
    );
  }

  listDirectory(_dirPath: string): typeof MOCK_DIR_ENTRIES {
    return [...MOCK_DIR_ENTRIES];
  }

  // ── Misc ─────────────────────────────────────────────────────────────

  pasteImage(sessionId: string, _dataUrl: string): void {
    console.log(`[DevMock] pasteImage received for session ${sessionId} (${Math.round(_dataUrl.length / 1024)}KB)`);
  }

  setModel(sessionId: string, modelId: string): void {
    console.log(`[DevMock] setModel: session=${sessionId}, model=${modelId}`);
  }

  setPermissionMode(mode: string): void {
    console.log(`[DevMock] setPermissionMode: ${mode}`);
  }

  setWindowPosition(x: number, y: number, w: number, h: number): void {
    console.log(`[DevMock] setWindowPosition: ${x},${y} ${w}x${h}`);
  }

  /** Simulate opening a new window — in dev mode, creates a new tab. */
  openNewWindow(): { windowId: number } {
    console.log('[DevMock] openNewWindow');
    const { id } = this.createSession('/Users/panda/project', 'New Window');
    // Dynamically import tabStore to avoid circular deps
    import('../stores/tabStore').then(({ useTabStore }) => {
      useTabStore.getState().addTab(id, 'New Window');
    });
    return { windowId: -1 };
  }

  /** Simulate opening a session in a window — focus or create tab. */
  openSessionInWindow(sessionId: string): { windowId: number; reused: boolean } {
    console.log(`[DevMock] openSessionInWindow: ${sessionId}`);
    import('../stores/tabStore').then(({ useTabStore }) => {
      const store = useTabStore.getState();
      const existing = store.getTabBySessionId(sessionId);
      if (existing) {
        store.setActiveTab(existing.id);
      } else {
        const session = this.sessions.find((s) => s.id === sessionId);
        store.addTab(sessionId, session?.name ?? 'Session');
      }
    });
    return { windowId: -1, reused: false };
  }

  /** Return a mock window id for dev mode. */
  getWindowId(): number {
    return -1;
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private emit(event: string, payload: unknown): void {
    const callbacks = this.listeners.get(event);
    if (!callbacks) return;
    for (const cb of callbacks) {
      try { cb(payload); } catch { /* dev mock — swallow */ }
    }
  }

  private emitSessionUpdated(): void {
    this.emit('session:updated', { sessions: [...this.sessions] });
  }

  private schedule(ms: number, fn: () => void): void {
    this.timers.push(setTimeout(fn, ms));
  }

  private matchReplyKey(text: string): string {
    const lower = text.toLowerCase();
    if (/\b(hello|hi|hey|greet)\b/.test(lower)) return 'hello';
    if (/\b(code|function|class|implement)\b/.test(lower)) return 'code';
    if (/\b(file|read|open)\b/.test(lower)) return 'file';
    if (/\b(bash|run|exec|command|shell)\b/.test(lower)) return 'bash';
    return 'default';
  }

  private pickTool(replyKey: string): typeof TOOL_TEMPLATES[number] {
    if (replyKey === 'file') return TOOL_TEMPLATES[0];
    if (replyKey === 'bash') return TOOL_TEMPLATES[1];
    return TOOL_TEMPLATES[Math.floor(Math.random() * TOOL_TEMPLATES.length)];
  }

  private chunkString(str: string, size: number): string[] {
    const chunks: string[] = [];
    for (let i = 0; i < str.length; i += size) {
      chunks.push(str.slice(i, i + size));
    }
    return chunks;
  }
}
