// Input: 无（纯单元测试）
// Output: vitest 断言 buildChildEnv() 返回的 env 对象满足隔离与注入契约
// Pos: v2.27.1 provider-env-builder — env 白名单清洗 + provider key 注入的契约保证
//
// 一旦本测试或所属目录结构发生变化，请更新此头部注释，并同步上层 README。

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildChildEnv } from '../provider-env-builder';

// 保存原始 process.env，防止测试间污染
const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  // 注入一些模拟的 shell 残留 token
  process.env.ANTHROPIC_API_KEY = 'shell-leaked-anthropic-key';
  process.env.OPENAI_API_KEY = 'shell-leaked-openai-key';
  process.env.GOOGLE_API_KEY = 'shell-leaked-google-key';
  process.env.GEMINI_API_KEY = 'shell-leaked-gemini-key';
  process.env.AWS_ACCESS_KEY_ID = 'shell-leaked-aws-key';
  process.env.AWS_SECRET_ACCESS_KEY = 'shell-leaked-aws-secret';
  process.env.VERTEX_AI_KEY = 'shell-leaked-vertex-key';
  process.env.CLAUDE_CODE_OAUTH_TOKEN = 'shell-leaked-oauth-token';
  // 合法 env
  process.env.HOME = '/home/testuser';
  process.env.PATH = '/usr/bin:/bin';
  process.env.PANDA_CUSTOM = 'panda-value';
  process.env.NODE_ENV = 'test';
});

afterEach(() => {
  // 恢复原始 env
  for (const key of Object.keys(process.env)) {
    if (!(key in ORIGINAL_ENV)) {
      delete process.env[key];
    }
  }
  Object.assign(process.env, ORIGINAL_ENV);
});

describe('buildChildEnv — provider token 隔离', () => {
  it('默认情况下清除所有 ANTHROPIC_* 残留', () => {
    const env = buildChildEnv({ cwd: '/tmp/test' });
    expect(env['ANTHROPIC_API_KEY']).toBeUndefined();
  });

  it('默认情况下清除所有 OPENAI_* 残留', () => {
    const env = buildChildEnv({ cwd: '/tmp/test' });
    expect(env['OPENAI_API_KEY']).toBeUndefined();
  });

  it('默认情况下清除所有 GOOGLE_* 残留', () => {
    const env = buildChildEnv({ cwd: '/tmp/test' });
    expect(env['GOOGLE_API_KEY']).toBeUndefined();
    expect(env['GEMINI_API_KEY']).toBeUndefined();
  });

  it('默认情况下清除所有 AWS_* 残留', () => {
    const env = buildChildEnv({ cwd: '/tmp/test' });
    expect(env['AWS_ACCESS_KEY_ID']).toBeUndefined();
    expect(env['AWS_SECRET_ACCESS_KEY']).toBeUndefined();
  });

  it('默认情况下清除所有 VERTEX_* 残留', () => {
    const env = buildChildEnv({ cwd: '/tmp/test' });
    expect(env['VERTEX_AI_KEY']).toBeUndefined();
  });

  it('默认情况下清除所有 CLAUDE_CODE_* 残留', () => {
    const env = buildChildEnv({ cwd: '/tmp/test' });
    expect(env['CLAUDE_CODE_OAUTH_TOKEN']).toBeUndefined();
  });

  it('保留 HOME / PATH 等系统 env', () => {
    const env = buildChildEnv({ cwd: '/tmp/test' });
    expect(env['HOME']).toBe('/home/testuser');
    expect(env['PATH']).toBe('/usr/bin:/bin');
  });

  it('保留 PANDA_* 前缀 env', () => {
    const env = buildChildEnv({ cwd: '/tmp/test' });
    expect(env['PANDA_CUSTOM']).toBe('panda-value');
  });

  it('保留 NODE_* 前缀 env', () => {
    const env = buildChildEnv({ cwd: '/tmp/test' });
    expect(env['NODE_ENV']).toBe('test');
  });
});

describe('buildChildEnv — CALLER_DIR / PWD 强制注入', () => {
  it('始终注入 CALLER_DIR = opts.cwd', () => {
    const env = buildChildEnv({ cwd: '/projects/my-app' });
    expect(env['CALLER_DIR']).toBe('/projects/my-app');
  });

  it('始终注入 PWD = opts.cwd', () => {
    const env = buildChildEnv({ cwd: '/projects/my-app' });
    expect(env['PWD']).toBe('/projects/my-app');
  });

  it('CALLER_DIR / PWD 不被 shell 残留覆盖', () => {
    process.env.CALLER_DIR = '/old-caller-dir';
    process.env.PWD = '/old-pwd';
    const env = buildChildEnv({ cwd: '/correct-cwd' });
    expect(env['CALLER_DIR']).toBe('/correct-cwd');
    expect(env['PWD']).toBe('/correct-cwd');
  });
});

describe('buildChildEnv — anthropic provider 注入', () => {
  it('注入 ANTHROPIC_API_KEY', () => {
    const env = buildChildEnv({
      cwd: '/tmp',
      provider: { type: 'anthropic', apiKey: 'sk-ant-test' },
    });
    expect(env['ANTHROPIC_API_KEY']).toBe('sk-ant-test');
  });

  it('注入 ANTHROPIC_BASE_URL（可选）', () => {
    const env = buildChildEnv({
      cwd: '/tmp',
      provider: { type: 'anthropic', apiKey: 'sk-ant', baseUrl: 'https://my-proxy.example.com' },
    });
    expect(env['ANTHROPIC_BASE_URL']).toBe('https://my-proxy.example.com');
  });

  it('不传 apiKey 时不注入 ANTHROPIC_API_KEY', () => {
    const env = buildChildEnv({
      cwd: '/tmp',
      provider: { type: 'anthropic' },
    });
    expect(env['ANTHROPIC_API_KEY']).toBeUndefined();
  });
});

describe('buildChildEnv — openai provider 注入', () => {
  it('注入 OPENAI_API_KEY + OPENAI_BASE_URL', () => {
    const env = buildChildEnv({
      cwd: '/tmp',
      provider: { type: 'openai', apiKey: 'sk-openai-test', baseUrl: 'https://api.openai.com' },
    });
    expect(env['OPENAI_API_KEY']).toBe('sk-openai-test');
    expect(env['OPENAI_BASE_URL']).toBe('https://api.openai.com');
  });
});

describe('buildChildEnv — gemini provider 注入', () => {
  it('同时注入 GOOGLE_API_KEY 和 GEMINI_API_KEY', () => {
    const env = buildChildEnv({
      cwd: '/tmp',
      provider: { type: 'gemini', apiKey: 'gemini-key-123' },
    });
    expect(env['GOOGLE_API_KEY']).toBe('gemini-key-123');
    expect(env['GEMINI_API_KEY']).toBe('gemini-key-123');
  });
});

describe('buildChildEnv — bedrock provider 注入', () => {
  it('注入 AWS 四件套', () => {
    const env = buildChildEnv({
      cwd: '/tmp',
      provider: {
        type: 'bedrock',
        awsAccessKeyId: 'AKIATEST',
        awsSecretAccessKey: 'secret',
        awsSessionToken: 'token',
        awsRegion: 'us-east-1',
      },
    });
    expect(env['AWS_ACCESS_KEY_ID']).toBe('AKIATEST');
    expect(env['AWS_SECRET_ACCESS_KEY']).toBe('secret');
    expect(env['AWS_SESSION_TOKEN']).toBe('token');
    expect(env['AWS_REGION']).toBe('us-east-1');
  });
});

describe('buildChildEnv — managedOAuth 注入', () => {
  it('managedOAuth=true 注入 CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST + CLAUDE_CODE_ENTRYPOINT', () => {
    const env = buildChildEnv({ cwd: '/tmp', managedOAuth: true });
    expect(env['CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST']).toBe('1');
    expect(env['CLAUDE_CODE_ENTRYPOINT']).toBe('panda-desktop');
  });

  it('managedOAuth=false 时不注入', () => {
    const env = buildChildEnv({ cwd: '/tmp', managedOAuth: false });
    expect(env['CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST']).toBeUndefined();
    expect(env['CLAUDE_CODE_ENTRYPOINT']).toBeUndefined();
  });

  it('managedOAuth 未传时不注入', () => {
    const env = buildChildEnv({ cwd: '/tmp' });
    expect(env['CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST']).toBeUndefined();
  });
});

describe('buildChildEnv — skipDotenv 注入', () => {
  it('skipDotenv=true 注入 PANDA_SKIP_DOTENV=1', () => {
    const env = buildChildEnv({ cwd: '/tmp', skipDotenv: true });
    expect(env['PANDA_SKIP_DOTENV']).toBe('1');
  });

  it('skipDotenv=false 时不注入', () => {
    const env = buildChildEnv({ cwd: '/tmp', skipDotenv: false });
    expect(env['PANDA_SKIP_DOTENV']).toBeUndefined();
  });
});
