// Input: workDir resolution scenarios (session-meta / cwd / desanitize fallback)
// Output: assertion that v2.26.14 cwd-injection contract matches cc-haha
// Pos: packages/panda-desk-chat/electron/backend/__tests__ — guards Bug B fix.

import { describe, expect, test } from 'vitest';
import {
  desanitizeProjectPath,
  resolveWorkDirFromEntries,
  sanitizeProjectPath,
  type RawEntry,
} from '../disk-session-scanner';

describe('resolveWorkDirFromEntries (cc-haha 1:1)', () => {
  test('① picks session-meta.workDir when present', () => {
    const entries: RawEntry[] = [
      { type: 'session-meta', workDir: '/Users/panda/Downloads/mp-wechat' } as RawEntry,
      { type: 'user', cwd: '/some/other/path' } as RawEntry,
    ];
    expect(resolveWorkDirFromEntries(entries)).toBe(
      '/Users/panda/Downloads/mp-wechat',
    );
  });

  test('② falls back to last entry.cwd when no session-meta', () => {
    const entries: RawEntry[] = [
      { type: 'user', cwd: '/Users/panda/Downloads/first' } as RawEntry,
      { type: 'assistant' } as RawEntry,
      { type: 'user', cwd: '/Users/panda/Downloads/mp-wechat' } as RawEntry,
    ];
    expect(resolveWorkDirFromEntries(entries)).toBe(
      '/Users/panda/Downloads/mp-wechat',
    );
  });

  test('③ returns undefined when no workDir + no cwd present', () => {
    const entries: RawEntry[] = [
      { type: 'user' } as RawEntry,
      { type: 'assistant' } as RawEntry,
    ];
    expect(resolveWorkDirFromEntries(entries)).toBeUndefined();
  });

  test('skips session-meta with empty / non-string workDir', () => {
    const entries: RawEntry[] = [
      { type: 'session-meta', workDir: '' } as RawEntry,
      { type: 'session-meta', workDir: 123 as unknown as string } as RawEntry,
      { type: 'user', cwd: '/Users/panda/Downloads/mp-wechat' } as RawEntry,
    ];
    expect(resolveWorkDirFromEntries(entries)).toBe(
      '/Users/panda/Downloads/mp-wechat',
    );
  });
});

describe('sanitize / desanitize project path (cc-haha 1:1, lossy)', () => {
  test('sanitize: absolute path → dash-joined', () => {
    expect(sanitizeProjectPath('/Users/panda/Downloads/mp-wechat')).toBe(
      '-Users-panda-Downloads-mp-wechat',
    );
  });

  // KNOWN LOSSY: dash inside path segments (e.g. "mp-wechat", "cc-panda") is
  // indistinguishable from a path separator after sanitisation. cc-haha
  // shares this limitation — they recommend providing an explicit workDir
  // for such projects rather than relying on the desanitize fallback.
  // The full Bug B fix relies on session-meta.workDir or entries[].cwd
  // (both lossless) before reaching this fallback. See ensureSession in
  // cli-manager.ts:778-825.
  test('desanitize: lossy when project has dash-in-name (documents fallback limit)', () => {
    expect(desanitizeProjectPath('-Users-panda-Downloads-mp-wechat')).toBe(
      '/Users/panda/Downloads/mp/wechat',
    );
  });

  test('roundtrip: lossless only for dash-free path segments', () => {
    const safe = '/Users/panda/Downloads/cleanproject';
    expect(desanitizeProjectPath(sanitizeProjectPath(safe))).toBe(safe);
  });
});
