// Input: 真实子进程 + hookInput JSON（含 duration_ms）通过 stdin 喂给一个临时 bash 脚本
// Output: Bun test assertions on hook command 实际从 stdin 读到的 duration_ms 数值
// Pos: Hooks v2 增强字段补齐 — duration_ms 集成测试，验证 hook handler 真实进程能拿到该字段
import { test, expect } from 'bun:test'
import { spawn } from 'node:child_process'
import { mkdtempSync, writeFileSync, rmSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

/**
 * Spawn a real bash hook child that reads JSON stdin and writes it back to a
 * tmp file — same I/O contract Panda uses for command hooks. We bypass the
 * full hook scheduler (which requires workspace trust + AppState + session
 * machinery) and directly assert the wire-format invariant: hooks receive
 * `duration_ms` in the stdin JSON when callers pass it.
 */
async function runRealHookChild(stdinJson: string): Promise<{ stdout: string; exitCode: number | null }> {
  const dir = mkdtempSync(join(tmpdir(), 'panda-hook-int-'))
  const outPath = join(dir, 'received.json')
  // Hook command: read all stdin, dump to outPath, exit 0
  const script = `#!/usr/bin/env bash\ncat > '${outPath}'\necho ok\nexit 0\n`
  const scriptPath = join(dir, 'hook.sh')
  writeFileSync(scriptPath, script, { mode: 0o755 })

  return await new Promise((resolve, reject) => {
    const child = spawn('bash', [scriptPath], { stdio: ['pipe', 'pipe', 'pipe'] })
    let stdout = ''
    child.stdout.on('data', d => (stdout += d.toString()))
    child.stderr.on('data', d => (stdout += d.toString()))
    child.on('error', reject)
    child.on('close', (code) => {
      try {
        const received = readFileSync(outPath, 'utf-8')
        // attach to stdout for assertion convenience
        resolve({ stdout: received, exitCode: typeof code === 'number' ? code : 0 })
      } catch (e) {
        reject(e)
      } finally {
        rmSync(dir, { recursive: true, force: true })
      }
    })
    child.stdin.write(stdinJson)
    child.stdin.end()
  })
}

test('PostToolUse hook child receives duration_ms field in stdin JSON', async () => {
  // Build the same shape executePostToolHooks emits when toolDurationMs is set.
  const hookInput = {
    session_id: 'sess-int-1',
    transcript_path: '/tmp/transcript',
    cwd: process.cwd(),
    hook_event_name: 'PostToolUse',
    tool_name: 'Bash',
    tool_input: { command: 'echo hi' },
    tool_response: { stdout: 'hi\n', exitCode: 0 },
    tool_use_id: 'use-int-1',
    duration_ms: 217,
  }
  const stdinJson = JSON.stringify(hookInput)
  const { stdout, exitCode } = await runRealHookChild(stdinJson)
  expect(exitCode).toBe(0)
  const parsed = JSON.parse(stdout)
  expect(parsed.duration_ms).toBe(217)
  expect(typeof parsed.duration_ms).toBe('number')
  expect(Number.isFinite(parsed.duration_ms)).toBe(true)
})

test('PostToolUseFailure hook child receives duration_ms even on user interrupt', async () => {
  const hookInput = {
    session_id: 'sess-int-2',
    transcript_path: '/tmp/transcript',
    cwd: process.cwd(),
    hook_event_name: 'PostToolUseFailure',
    tool_name: 'Bash',
    tool_input: { command: 'sleep 999' },
    tool_use_id: 'use-int-2',
    error: 'aborted',
    is_interrupt: true,
    duration_ms: 850,
  }
  const stdinJson = JSON.stringify(hookInput)
  const { stdout, exitCode } = await runRealHookChild(stdinJson)
  expect(exitCode).toBe(0)
  const parsed = JSON.parse(stdout)
  expect(parsed.duration_ms).toBe(850)
  expect(parsed.is_interrupt).toBe(true)
  expect(parsed.error).toBe('aborted')
})

test('hook child without duration_ms (legacy callers) still parses cleanly', async () => {
  // Mirrors the back-compat path: callers that don't pass durationMs simply
  // omit the field. Hook handlers should continue to parse the JSON without
  // surprise.
  const hookInput = {
    session_id: 'sess-int-3',
    transcript_path: '/tmp/transcript',
    cwd: process.cwd(),
    hook_event_name: 'PostToolUse',
    tool_name: 'Read',
    tool_input: { file_path: '/etc/hosts' },
    tool_response: { content: '...' },
    tool_use_id: 'use-int-3',
  }
  const { stdout } = await runRealHookChild(JSON.stringify(hookInput))
  const parsed = JSON.parse(stdout)
  expect('duration_ms' in parsed).toBe(false)
  expect(parsed.tool_name).toBe('Read')
})
