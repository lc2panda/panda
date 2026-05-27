// Input: mcpStore.createServer with bridge.preflightMcpServer spied
// Output: assertions for preflight success/failure paths
// Pos: test layer — validates mcpStore preflight gate (v2.27.1)

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock storage to avoid localStorage access in vitest
vi.mock('@/lib/storage', () => ({
  storage: {
    get: vi.fn((_key: string, defaultValue: unknown) => defaultValue),
    set: vi.fn(),
    remove: vi.fn(),
  },
}));

import * as bridge from '@/ipc/bridge';
import { useMcpStore } from '@/stores/mcpStore';
import type { McpUpsertPayload } from '@/types/mcp';

// ─── Factory helpers ──────────────────────────────────────────────────────────

function makeStdioPayload(): McpUpsertPayload {
  return {
    scope: 'user',
    config: { type: 'stdio', command: 'uvx', args: ['mcp-server-fetch'] },
  };
}

function freshStore() {
  useMcpStore.setState({ servers: [], selectedServer: null, isLoading: false, error: null });
  return useMcpStore;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('mcpStore.createServer — preflight gate', () => {
  let preflightSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    preflightSpy = vi.spyOn(bridge, 'preflightMcpServer');
  });

  it('preflight 成功 → server 被添加到 servers 列表', async () => {
    preflightSpy.mockResolvedValue({
      ok: true,
      checks: [{ name: 'command_in_path', ok: true, level: 'error', detail: '/usr/local/bin/uvx' }],
    });

    const store = freshStore();
    const record = await store.getState().createServer('fetch-mcp', makeStdioPayload());

    expect(record.name).toBe('fetch-mcp');
    expect(store.getState().servers).toHaveLength(1);
    expect(store.getState().servers[0].name).toBe('fetch-mcp');
    expect(store.getState().error).toBeNull();
  });

  it('preflight 失败 → addServer 不发生 + error 被设置', async () => {
    preflightSpy.mockResolvedValue({
      ok: false,
      checks: [
        {
          name: 'command_in_path',
          ok: false,
          level: 'error' as const,
          detail: '命令 "nonexistent-cmd" 未在 PATH 中找到',
        },
      ],
    });

    const store = freshStore();

    await expect(
      store.getState().createServer('bad-mcp', makeStdioPayload()),
    ).rejects.toThrow(/前置检查失败/);

    expect(store.getState().servers).toHaveLength(0);
    expect(store.getState().error).toMatch(/前置检查失败/);
  });

  it('preflight 多项错误 → error 消息包含所有失败项', async () => {
    preflightSpy.mockResolvedValue({
      ok: false,
      checks: [
        { name: 'command_in_path', ok: false, level: 'error' as const, detail: 'cmd not found' },
        { name: 'cwd_valid', ok: false, level: 'error' as const, detail: 'cwd does not exist' },
      ],
    });

    const store = freshStore();

    await expect(
      store.getState().createServer('multi-fail', makeStdioPayload()),
    ).rejects.toThrow();

    expect(store.getState().error).toContain('cmd not found');
    expect(store.getState().error).toContain('cwd does not exist');
  });

  it('preflight 返回 warning 但 error 级全部 ok → 添加成功', async () => {
    preflightSpy.mockResolvedValue({
      ok: true,
      checks: [
        { name: 'url_format', ok: true, level: 'error' as const },
        { name: 'url_reachable', ok: true, level: 'warning' as const, detail: 'warning: unreachable but ok' },
      ],
    });

    const ssePayload: McpUpsertPayload = {
      scope: 'user',
      config: { type: 'sse', url: 'http://localhost:3001/sse' },
    };

    const store = freshStore();
    const record = await store.getState().createServer('sse-mcp', ssePayload);

    expect(record.name).toBe('sse-mcp');
    expect(store.getState().servers).toHaveLength(1);
  });
});
