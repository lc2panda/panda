// Input: settings-service.ts 的单元测试
// Output: getSettings / updateSettings / setModel / setEffort 功能验证
// Pos: electron/backend/__tests__ — settings-service 单元测试

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';

// 重置模块缓存以便注入不同的 PANDA_CONFIG_DIR
let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'panda-settings-test-'));
  process.env['PANDA_CONFIG_DIR'] = tmpDir;
});

afterEach(async () => {
  delete process.env['PANDA_CONFIG_DIR'];
  await fs.rm(tmpDir, { recursive: true, force: true });
});

// 动态 import 以确保 pandaccRoot() 读取最新 env
async function loadService() {
  const mod = await import('../settings-service?v=' + Date.now());
  return mod;
}

describe('getSettings', () => {
  it('settings.json 不存在时返回空默认值', async () => {
    const { getSettings } = await loadService();
    const result = await getSettings();
    expect(result.env).toEqual({});
    expect(result.model).toBeUndefined();
    expect(result.effort).toBeUndefined();
  });

  it('读取已有 settings.json 并解析 env/model/effort', async () => {
    await fs.writeFile(
      path.join(tmpDir, 'settings.json'),
      JSON.stringify({
        env: { ANTHROPIC_MODEL: 'claude-opus-4-7', PANDA_THINKING_EFFORT: 'high' },
      }),
    );
    const { getSettings } = await loadService();
    const result = await getSettings();
    expect(result.env['ANTHROPIC_MODEL']).toBe('claude-opus-4-7');
    expect(result.model).toBe('claude-opus-4-7');
    expect(result.effort).toBe('high');
  });

  it('root level model/effort 字段优先于 env 字段', async () => {
    await fs.writeFile(
      path.join(tmpDir, 'settings.json'),
      JSON.stringify({
        model: 'claude-sonnet-4-6',
        effort: 'low',
        env: { ANTHROPIC_MODEL: 'old-model' },
      }),
    );
    const { getSettings } = await loadService();
    const result = await getSettings();
    expect(result.model).toBe('claude-sonnet-4-6');
    expect(result.effort).toBe('low');
  });
});

describe('updateSettings', () => {
  it('env patch 合并不覆盖其他 key', async () => {
    await fs.writeFile(
      path.join(tmpDir, 'settings.json'),
      JSON.stringify({ env: { EXISTING: 'value', OTHER: '1' } }),
    );
    const { updateSettings, getSettings } = await loadService();
    await updateSettings({ env: { NEW_KEY: 'new' } });
    const result = await getSettings();
    expect(result.env['EXISTING']).toBe('value');
    expect(result.env['OTHER']).toBe('1');
    expect(result.env['NEW_KEY']).toBe('new');
  });

  it('patch.model 写入 root 字段 + env.ANTHROPIC_MODEL', async () => {
    const { updateSettings, getSettings } = await loadService();
    await updateSettings({ model: 'claude-haiku-4-5' });
    const result = await getSettings();
    expect(result.model).toBe('claude-haiku-4-5');
    expect(result.env['ANTHROPIC_MODEL']).toBe('claude-haiku-4-5');
  });

  it('patch.effort 写入 root 字段 + env.PANDA_THINKING_EFFORT', async () => {
    const { updateSettings, getSettings } = await loadService();
    await updateSettings({ effort: 'medium' });
    const result = await getSettings();
    expect(result.effort).toBe('medium');
    expect(result.env['PANDA_THINKING_EFFORT']).toBe('medium');
  });
});

describe('setModel', () => {
  it('调用 setModel 后 getSettings 返回新模型', async () => {
    const { setModel, getSettings } = await loadService();
    await setModel('claude-opus-4-7');
    const result = await getSettings();
    expect(result.model).toBe('claude-opus-4-7');
    expect(result.env['ANTHROPIC_MODEL']).toBe('claude-opus-4-7');
  });
});

describe('setEffort', () => {
  it('调用 setEffort 后 getSettings 返回新 effort', async () => {
    const { setEffort, getSettings } = await loadService();
    await setEffort('low');
    const result = await getSettings();
    expect(result.effort).toBe('low');
    expect(result.env['PANDA_THINKING_EFFORT']).toBe('low');
  });
});
