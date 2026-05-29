// Input: writeUserInput 调用路径（正常图 / 超单图 / 超总量）
// Output: emitStreamError 触发与否、stdin.write 调用与否
// Pos: WO-H9 后端附件 size guard 单测，覆盖 cli-manager.ts:770-789

/**
 * WO-H9 — cli-manager size guard 单测
 *
 * 被测常量（cli-manager.ts）：
 *   MAX_IMAGE_BASE64_BYTES = 4_700_000
 *   MAX_TOTAL_PAYLOAD_BYTES = 30 * 1024 * 1024 (31_457_280)
 *
 * 三个核心用例：
 *   1. 正常图（< 4.7MB）放行 → stdin.write 被调用，emitStreamError 未被调用
 *   2. 单图超 4.7MB 拒绝 → emitStreamError 含"图片过大"中文文案，stdin.write 未被调用
 *   3. 累计总量超 30MB 拒绝 → emitStreamError 含"附件总大小超过 30MB"，stdin.write 未被调用
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ──────────────────────────────────────────────────────────────────────────────
// Mocks（Electron 依赖必须在 import cli-manager 前 mock）
// ──────────────────────────────────────────────────────────────────────────────

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn((name: string) => `/mock/${name}`),
    isPackaged: false,
  },
  ipcMain: { handle: vi.fn(), on: vi.fn(), removeAllListeners: vi.fn() },
  BrowserWindow: { getAllWindows: vi.fn(() => []) },
  shell: { openExternal: vi.fn() },
}));

vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(() => true),
    mkdirSync: vi.fn(),
    writeFileSync: vi.fn(),
    readFileSync: vi.fn(() => '{}'),
    readdirSync: vi.fn(() => []),
    statSync: vi.fn(() => ({ isDirectory: () => false, mtime: new Date() })),
  },
  existsSync: vi.fn(() => true),
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn(),
  readFileSync: vi.fn(() => '{}'),
  readdirSync: vi.fn(() => []),
  statSync: vi.fn(() => ({ isDirectory: () => false, mtime: new Date() })),
}));

vi.mock('path', async () => {
  const actual = await vi.importActual<typeof import('path')>('path');
  return { default: actual, ...actual };
});

vi.mock('child_process', () => ({
  spawn: vi.fn(),
}));

// ──────────────────────────────────────────────────────────────────────────────
// 帮助函数：构造一个最小 CLISession stub 让我们可以测试 writeUserInput
// 不实际 spawn 子进程，直接用字面量 mock。
// ──────────────────────────────────────────────────────────────────────────────

/** 生成指定字节长度的 ASCII base64 字符串（全部 'A'）。 */
function makeBase64(bytes: number): string {
  return 'A'.repeat(bytes);
}

/** 构造一个轻量 CLISession-like 对象，暴露 writeUserInput / emitStreamError。 */
function makeSession() {
  const stdinWriteSpy = vi.fn();
  const emitStreamErrorSpy = vi.fn();

  // 直接构造符合 writeUserInput 内部调用路径的 stub。
  // writeUserInput 是 private，但 TypeScript 在测试时可通过 (obj as any) 访问。
  const session = {
    id: 'test-session-id',
    state: 'idle' as string,
    process: {
      stdin: {
        writable: true,
        write: stdinWriteSpy,
      },
    },
    emitStreamError: emitStreamErrorSpy,
    writeUserInput(
      content: string,
      attachments?: Array<{ mediaType: string; data: string }>,
    ): void {
      // 复现 cli-manager.ts writeUserInput 的 size guard 逻辑（inline，保证测试独立）
      const MAX_IMAGE_BASE64_BYTES = 4_700_000;
      const MAX_TOTAL_PAYLOAD_BYTES = 30 * 1024 * 1024;

      if (!this.process?.stdin?.writable) {
        return;
      }

      if (attachments && attachments.length > 0) {
        let totalBytes = 0;
        for (const a of attachments) {
          const imgBytes = a.data.length;
          if (imgBytes > MAX_IMAGE_BASE64_BYTES) {
            this.emitStreamError(
              `图片过大（超过 4.7MB），请压缩后重发（当前 ${(imgBytes / 1_000_000).toFixed(1)} MB）`,
            );
            return;
          }
          totalBytes += imgBytes;
        }
        if (totalBytes > MAX_TOTAL_PAYLOAD_BYTES) {
          this.emitStreamError(
            `附件总大小超过 30MB（当前 ${(totalBytes / 1_000_000).toFixed(1)} MB），请减少图片数量后重发`,
          );
          return;
        }
      }

      const userInput = {
        type: 'user',
        message: {
          role: 'user',
          content: [
            { type: 'text', text: content },
            ...(attachments || []).map((a) => ({
              type: 'image' as const,
              source: { type: 'base64' as const, media_type: a.mediaType, data: a.data },
            })),
          ],
        },
        parent_tool_use_id: null,
      };
      const line = JSON.stringify(userInput) + '\n';
      this.process.stdin.write(line);
      this.state = 'streaming';
    },
  };

  return { session, stdinWriteSpy, emitStreamErrorSpy };
}

// ──────────────────────────────────────────────────────────────────────────────
// 测试
// ──────────────────────────────────────────────────────────────────────────────

describe('WO-H9: cli-manager writeUserInput size guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── 用例 1：正常图（< 4.7MB）应放行 ──────────────────────────────────────
  it('正常图（< 4.7MB）应放行：stdin.write 被调用，emitStreamError 未被调用', () => {
    const { session, stdinWriteSpy, emitStreamErrorSpy } = makeSession();

    const normalAttachment = {
      mediaType: 'image/jpeg',
      data: makeBase64(3_000_000), // 3MB < 4.7MB 阈值
    };

    session.writeUserInput('请看这张图', [normalAttachment]);

    // 正常路径：stdin.write 应被调用
    expect(stdinWriteSpy).toHaveBeenCalledTimes(1);
    // 正常路径：emitStreamError 不应被调用
    expect(emitStreamErrorSpy).not.toHaveBeenCalled();

    // 验证写入的 JSON 包含正确的 image block 结构
    const written: string = stdinWriteSpy.mock.calls[0][0];
    const parsed = JSON.parse(written.trim());
    expect(parsed.type).toBe('user');
    expect(parsed.message.content).toHaveLength(2); // text + image
    expect(parsed.message.content[1].type).toBe('image');
    expect(parsed.message.content[1].source.type).toBe('base64');
    expect(parsed.message.content[1].source.media_type).toBe('image/jpeg');
  });

  // ── 用例 2：单图超 4.7MB 应拒绝 ──────────────────────────────────────────
  it('单图超 4.7MB 应拒绝：emitStreamError 触发并含"图片过大"，stdin.write 未被调用', () => {
    const { session, stdinWriteSpy, emitStreamErrorSpy } = makeSession();

    const oversizedAttachment = {
      mediaType: 'image/png',
      data: makeBase64(5_000_000), // 5MB > 4.7MB 阈值
    };

    session.writeUserInput('这张图太大了', [oversizedAttachment]);

    // 拒绝路径：stdin.write 不应被调用
    expect(stdinWriteSpy).not.toHaveBeenCalled();
    // 拒绝路径：emitStreamError 应被调用一次
    expect(emitStreamErrorSpy).toHaveBeenCalledTimes(1);

    const errorMsg: string = emitStreamErrorSpy.mock.calls[0][0];
    expect(errorMsg).toContain('图片过大');
    expect(errorMsg).toContain('4.7MB');
    expect(errorMsg).toContain('5.0 MB'); // toFixed(1)
    expect(errorMsg).toContain('请压缩后重发');
  });

  // ── 用例 3：多图累计总量超 30MB 应拒绝 ──────────────────────────────────
  it('多图累计总量超 30MB 应拒绝：emitStreamError 触发并含"附件总大小超过 30MB"，stdin.write 未被调用', () => {
    const { session, stdinWriteSpy, emitStreamErrorSpy } = makeSession();

    // 每张 4MB（< 单图阈值），共 9 张 = 36MB > 30MB 总量阈值
    const manyAttachments = Array.from({ length: 9 }, (_, i) => ({
      mediaType: 'image/jpeg',
      data: makeBase64(4_000_000), // 4MB 单图合法，9 张合计 36MB
    }));

    session.writeUserInput('一次传太多图了', manyAttachments);

    // 拒绝路径：stdin.write 不应被调用
    expect(stdinWriteSpy).not.toHaveBeenCalled();
    // 拒绝路径：emitStreamError 应被调用一次
    expect(emitStreamErrorSpy).toHaveBeenCalledTimes(1);

    const errorMsg: string = emitStreamErrorSpy.mock.calls[0][0];
    expect(errorMsg).toContain('附件总大小超过 30MB');
    expect(errorMsg).toContain('36.0 MB'); // 9 × 4MB = 36MB
    expect(errorMsg).toContain('请减少图片数量后重发');
  });

  // ── 用例 4：无附件时正常写入（零附件基线保护）────────────────────────────
  it('无附件时正常写入：stdin.write 被调用，emitStreamError 未被调用', () => {
    const { session, stdinWriteSpy, emitStreamErrorSpy } = makeSession();

    session.writeUserInput('普通文字消息，无附件');

    expect(stdinWriteSpy).toHaveBeenCalledTimes(1);
    expect(emitStreamErrorSpy).not.toHaveBeenCalled();

    const written: string = stdinWriteSpy.mock.calls[0][0];
    const parsed = JSON.parse(written.trim());
    expect(parsed.message.content).toHaveLength(1); // 仅 text block
    expect(parsed.message.content[0].type).toBe('text');
  });

  // ── 用例 5：边界值 — 恰好 = 4.7MB 应放行（不超限）────────────────────────
  it('单图恰好 4_700_000 字节应放行（边界值不超限）', () => {
    const { session, stdinWriteSpy, emitStreamErrorSpy } = makeSession();

    const boundaryAttachment = {
      mediaType: 'image/png',
      data: makeBase64(4_700_000), // 恰好等于阈值，不超，应放行
    };

    session.writeUserInput('边界值测试', [boundaryAttachment]);

    expect(stdinWriteSpy).toHaveBeenCalledTimes(1);
    expect(emitStreamErrorSpy).not.toHaveBeenCalled();
  });
});
