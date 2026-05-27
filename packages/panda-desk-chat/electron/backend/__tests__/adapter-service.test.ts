// Input: adapter-service.ts 的单元测试
// Output: listAdapters / getAdapter 功能验证
// Pos: electron/backend/__tests__ — adapter-service 单元测试

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'panda-adapter-test-'));
  process.env['PANDA_CONFIG_DIR'] = tmpDir;
});

afterEach(async () => {
  delete process.env['PANDA_CONFIG_DIR'];
  await fs.rm(tmpDir, { recursive: true, force: true });
});

async function loadService() {
  return import('../adapter-service?v=' + Date.now());
}

async function createAdaptersDir() {
  await fs.mkdir(path.join(tmpDir, 'adapters'), { recursive: true });
}

describe('listAdapters', () => {
  it('adapters 目录不存在时返回空列表', async () => {
    const { listAdapters } = await loadService();
    const result = await listAdapters();
    expect(result).toEqual([]);
  });

  it('空 adapters 目录返回空列表', async () => {
    await createAdaptersDir();
    const { listAdapters } = await loadService();
    const result = await listAdapters();
    expect(result).toEqual([]);
  });

  it('扫描 .json 文件并返回 adapter 列表', async () => {
    await createAdaptersDir();
    await fs.writeFile(
      path.join(tmpDir, 'adapters', 'telegram.json'),
      JSON.stringify({ botToken: 'TEST_TOKEN', chatId: '12345' }),
    );
    await fs.writeFile(
      path.join(tmpDir, 'adapters', 'feishu.json'),
      JSON.stringify({ webhookUrl: 'https://open.feishu.cn/test' }),
    );
    const { listAdapters } = await loadService();
    const result = await listAdapters();
    expect(result.length).toBe(2);
    const ids = result.map((a: import('../adapter-service').AdapterServiceItem) => a.id).sort();
    expect(ids).toEqual(['feishu', 'telegram']);
  });

  it('非 .json 文件被跳过', async () => {
    await createAdaptersDir();
    await fs.writeFile(path.join(tmpDir, 'adapters', 'readme.md'), '# Adapters');
    await fs.writeFile(
      path.join(tmpDir, 'adapters', 'wechat.json'),
      JSON.stringify({ enabled: true }),
    );
    const { listAdapters } = await loadService();
    const result = await listAdapters();
    expect(result.length).toBe(1);
    expect(result[0]!.id).toBe('wechat');
  });

  it('解析 data 内容正确', async () => {
    await createAdaptersDir();
    await fs.writeFile(
      path.join(tmpDir, 'adapters', 'telegram.json'),
      JSON.stringify({ botToken: 'TKN', chatId: '99' }),
    );
    const { listAdapters } = await loadService();
    const result = await listAdapters();
    expect(result[0]!.data['botToken']).toBe('TKN');
    expect(result[0]!.data['chatId']).toBe('99');
  });
});

describe('getAdapter', () => {
  it('不存在的 adapter 返回 null', async () => {
    await createAdaptersDir();
    const { getAdapter } = await loadService();
    expect(await getAdapter('nonexistent')).toBeNull();
  });

  it('按 id 返回 adapter 配置', async () => {
    await createAdaptersDir();
    await fs.writeFile(
      path.join(tmpDir, 'adapters', 'feishu.json'),
      JSON.stringify({ webhookUrl: 'https://open.feishu.cn/test', secret: 'KEY' }),
    );
    const { getAdapter } = await loadService();
    const result = await getAdapter('feishu');
    expect(result).not.toBeNull();
    expect(result!.id).toBe('feishu');
    expect(result!.data['webhookUrl']).toBe('https://open.feishu.cn/test');
    expect(result!.data['secret']).toBe('KEY');
  });
});
