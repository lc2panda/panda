// Input: User messages via IPC bridge
// Output: Simulated streaming responses (thinking + text + tool calls)
// Pos: IPC layer — dev-only mock backend for UI testing
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

  // ── Private helpers ──────────────────────────────────────────────────────

  private emit(event: string, payload: unknown): void {
    const callbacks = this.listeners.get(event);
    if (!callbacks) return;
    for (const cb of callbacks) {
      try { cb(payload); } catch { /* dev mock — swallow */ }
    }
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
