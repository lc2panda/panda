// Input: plugin-service.ts 的单元测试
// Output: listPlugins / getPlugin 功能验证
// Pos: electron/backend/__tests__ — plugin-service 单元测试

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'panda-plugin-test-'));
  process.env['PANDA_CONFIG_DIR'] = tmpDir;
  // 创建 plugins 目录
  await fs.mkdir(path.join(tmpDir, 'plugins'), { recursive: true });
});

afterEach(async () => {
  delete process.env['PANDA_CONFIG_DIR'];
  await fs.rm(tmpDir, { recursive: true, force: true });
});

async function loadService() {
  return import('../plugin-service?v=' + Date.now());
}

const SAMPLE_INSTALLED = {
  version: 2,
  plugins: {
    'frontend-design@claude-plugins-official': [
      {
        scope: 'user',
        installPath: '/tmp/panda-fake-install/frontend-design',
        version: '1.0.0',
        installedAt: '2026-01-01T00:00:00.000Z',
        lastUpdated: '2026-05-01T00:00:00.000Z',
      },
    ],
    'wechat@lc2panda-plugins': [
      {
        scope: 'user',
        installPath: '/tmp/panda-fake-install/wechat',
        version: '2.1.4',
        installedAt: '2026-04-26T00:00:00.000Z',
      },
    ],
  },
  disabled: ['wechat@lc2panda-plugins'],
};

describe('listPlugins', () => {
  it('installed_plugins.json 不存在时返回空列表', async () => {
    const { listPlugins } = await loadService();
    const result = await listPlugins();
    expect(result).toEqual([]);
  });

  it('从 installed_plugins.json 读取插件列表', async () => {
    await fs.writeFile(
      path.join(tmpDir, 'plugins', 'installed_plugins.json'),
      JSON.stringify(SAMPLE_INSTALLED),
    );
    const { listPlugins } = await loadService();
    const result = await listPlugins();
    expect(result.length).toBe(2);
    const ids = result.map((p: import('../plugin-service').PluginServiceItem) => p.id).sort();
    expect(ids).toContain('frontend-design@claude-plugins-official');
    expect(ids).toContain('wechat@lc2panda-plugins');
  });

  it('disabled 列表中的插件 enabled=false', async () => {
    await fs.writeFile(
      path.join(tmpDir, 'plugins', 'installed_plugins.json'),
      JSON.stringify(SAMPLE_INSTALLED),
    );
    const { listPlugins } = await loadService();
    const result = await listPlugins();
    const wechat = result.find((p: import('../plugin-service').PluginServiceItem) => p.id === 'wechat@lc2panda-plugins')!;
    expect(wechat.enabled).toBe(false);
    const fe = result.find((p: import('../plugin-service').PluginServiceItem) => p.id === 'frontend-design@claude-plugins-official')!;
    expect(fe.enabled).toBe(true);
  });

  it('解析 marketplace 和 name 字段', async () => {
    await fs.writeFile(
      path.join(tmpDir, 'plugins', 'installed_plugins.json'),
      JSON.stringify(SAMPLE_INSTALLED),
    );
    const { listPlugins } = await loadService();
    const result = await listPlugins();
    const wechat = result.find((p: import('../plugin-service').PluginServiceItem) => p.id === 'wechat@lc2panda-plugins')!;
    expect(wechat.name).toBe('wechat');
    expect(wechat.marketplace).toBe('lc2panda-plugins');
    expect(wechat.version).toBe('2.1.4');
  });
});

describe('getPlugin', () => {
  it('id 不存在时返回 null', async () => {
    const { getPlugin } = await loadService();
    const result = await getPlugin('nonexistent@marketplace');
    expect(result).toBeNull();
  });

  it('按 id 返回正确的插件', async () => {
    await fs.writeFile(
      path.join(tmpDir, 'plugins', 'installed_plugins.json'),
      JSON.stringify(SAMPLE_INSTALLED),
    );
    const { getPlugin } = await loadService();
    const result = await getPlugin('wechat@lc2panda-plugins');
    expect(result).not.toBeNull();
    expect(result!.id).toBe('wechat@lc2panda-plugins');
    expect(result!.version).toBe('2.1.4');
  });
});
