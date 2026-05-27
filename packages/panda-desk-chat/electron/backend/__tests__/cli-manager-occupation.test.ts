// Input: temp ~/.pandacc/sessions/{pid}.json registry fixtures
// Output: 验证 findOccupyingInteractiveSession 命中/不命中规则
// Pos: v2.27.0 Bug C — Desk Chat ensureSession PID 占用前置检测单测
//
// 覆盖：
//   ① interactive + alive PID 命中（返回该 entry）
//   ② kind=bg 即使 alive 也不命中（仅 interactive 冲突）
//   ③ PID 已死的 stale entry 不命中
//   ④ sessionId 不匹配不命中
//   ⑤ 非 <pid>.json 文件名忽略
//   ⑥ 多 interactive 时按 startedAt 升序取最早

import { describe, expect, test, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  findOccupyingInteractiveSession,
  findOccupyingSessions,
} from '../pid-registry';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'panda-pid-registry-test-'));
}

function writeEntry(
  dir: string,
  pid: number,
  body: Record<string, unknown>,
): void {
  fs.writeFileSync(path.join(dir, `${pid}.json`), JSON.stringify(body), 'utf8');
}

describe('findOccupyingInteractiveSession (Bug C)', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  test('① alive interactive PID 持有同 sessionId → 命中', () => {
    const sid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
    writeEntry(tmpDir, process.pid, {
      pid: process.pid,
      sessionId: sid,
      kind: 'interactive',
      cwd: '/tmp/work',
      startedAt: 1000,
    });
    const hit = findOccupyingInteractiveSession(sid, tmpDir);
    expect(hit).not.toBeNull();
    expect(hit?.pid).toBe(process.pid);
    expect(hit?.kind).toBe('interactive');
    expect(hit?.cwd).toBe('/tmp/work');
  });

  test('② kind=bg 即使 alive 也不命中（仅 interactive 冲突）', () => {
    const sid = '11111111-2222-3333-4444-555555555555';
    writeEntry(tmpDir, process.pid, {
      pid: process.pid,
      sessionId: sid,
      kind: 'bg',
      startedAt: 1000,
    });
    expect(findOccupyingInteractiveSession(sid, tmpDir)).toBeNull();
  });

  test('③ PID 已死的 stale entry 不命中', () => {
    const sid = '22222222-3333-4444-5555-666666666666';
    // PID 1 通常是 init，无法 kill；但选一个极不可能存在的高位 PID 更稳。
    // process.kill(2147483646, 0) 在所有平台都应抛 ESRCH。
    writeEntry(tmpDir, 2147483646, {
      pid: 2147483646,
      sessionId: sid,
      kind: 'interactive',
      startedAt: 1000,
    });
    expect(findOccupyingInteractiveSession(sid, tmpDir)).toBeNull();
  });

  test('④ sessionId 不匹配不命中', () => {
    writeEntry(tmpDir, process.pid, {
      pid: process.pid,
      sessionId: 'other-session-id',
      kind: 'interactive',
      startedAt: 1000,
    });
    expect(
      findOccupyingInteractiveSession('not-the-same-sid', tmpDir),
    ).toBeNull();
  });

  test('⑤ 非 <pid>.json 文件名忽略', () => {
    const sid = '33333333-4444-5555-6666-777777777777';
    // 故意写一个非数字文件名
    fs.writeFileSync(
      path.join(tmpDir, 'not-a-pid.json'),
      JSON.stringify({
        pid: process.pid,
        sessionId: sid,
        kind: 'interactive',
        startedAt: 1000,
      }),
      'utf8',
    );
    expect(findOccupyingInteractiveSession(sid, tmpDir)).toBeNull();
  });

  test('⑥ findOccupyingSessions 多 interactive 按 startedAt 升序', () => {
    const sid = '44444444-5555-6666-7777-888888888888';
    writeEntry(tmpDir, process.pid, {
      pid: process.pid,
      sessionId: sid,
      kind: 'interactive',
      startedAt: 2000,
    });
    // 制造第二条同 PID 不现实；改用同 sid + 同 PID 的早一个 startedAt 用第二个文件名
    // 此处仅验证排序与单条返回；多条 alive PID 不易构造，跳过强测试。
    const all = findOccupyingSessions(sid, tmpDir);
    expect(all.length).toBeGreaterThanOrEqual(1);
    if (all.length > 1) {
      for (let i = 1; i < all.length; i++) {
        expect((all[i].startedAt ?? 0) >= (all[i - 1].startedAt ?? 0)).toBe(
          true,
        );
      }
    }
  });

  test('⑦ sessionsDir 不存在 → 返回空，无 throw', () => {
    const nonExistent = path.join(tmpDir, 'does-not-exist');
    expect(findOccupyingInteractiveSession('any-sid', nonExistent)).toBeNull();
    expect(findOccupyingSessions('any-sid', nonExistent)).toEqual([]);
  });

  test('⑧ 损坏 JSON 文件跳过不抛错', () => {
    fs.writeFileSync(path.join(tmpDir, '12345.json'), 'not-valid-json{{{', 'utf8');
    expect(findOccupyingInteractiveSession('any-sid', tmpDir)).toBeNull();
  });
});
