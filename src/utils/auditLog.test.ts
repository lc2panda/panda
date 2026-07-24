// Input: writeAuditEntry / hashArgs / inferRiskLevel / rotateAuditLog / getRecentAuditEntries
// Output: bun:test 断言（写入、哈希稳定、风险分级、30天滚动）
// Pos: Wave 5A P0-3 — audit.jsonl 结构化审计日志的单元验证

import { test, expect, beforeEach } from 'bun:test'
import { writeAuditEntry, hashArgs, inferRiskLevel, rotateAuditLog, getRecentAuditEntries } from './auditLog.js'
import { existsSync, readFileSync, writeFileSync, unlinkSync, mkdirSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

const AUDIT_PATH = join(homedir(), '.pandacc', 'audit.jsonl')

beforeEach(() => {
  try {
    mkdirSync(join(homedir(), '.pandacc'), { recursive: true })
    if (existsSync(AUDIT_PATH)) unlinkSync(AUDIT_PATH)
  } catch {}
})

test('writeAuditEntry — 写一条记录', () => {
  writeAuditEntry({
    session_id: 'test-session',
    tool_name: 'Read',
    args_hash: 'abc123',
    risk_level: 'read-only',
    permission_decision: 'auto-allowed',
    outcome: 'success',
  })

  expect(existsSync(AUDIT_PATH)).toBe(true)
  const content = readFileSync(AUDIT_PATH, 'utf-8')
  expect(content).toContain('test-session')
  expect(content).toContain('Read')
})

test('hashArgs — 稳定哈希', () => {
  const h1 = hashArgs({ a: 1, b: 2 })
  const h2 = hashArgs({ a: 1, b: 2 })
  expect(h1).toBe(h2)
  expect(h1.length).toBe(16)  // 截取的 sha256
})

test('inferRiskLevel — Read 是 read-only', () => {
  expect(inferRiskLevel('Read')).toBe('read-only')
})

test('inferRiskLevel — Write 是 low-write', () => {
  expect(inferRiskLevel('Write')).toBe('low-write')
})

test('inferRiskLevel — Bash rm -rf 升级到 destructive', () => {
  expect(inferRiskLevel('Bash', { command: 'rm -rf /tmp/test' })).toBe('destructive')
})

test('inferRiskLevel — Bash ls 降级为 read-only', () => {
  expect(inferRiskLevel('Bash', { command: 'ls -la' })).toBe('read-only')
})

test('inferRiskLevel — Bash 常见只读命令', () => {
  expect(inferRiskLevel('Bash', { command: 'cat README.md' })).toBe('read-only')
  expect(inferRiskLevel('Bash', { command: 'git status' })).toBe('read-only')
  expect(inferRiskLevel('Bash', { command: 'git log --oneline' })).toBe('read-only')
  expect(inferRiskLevel('Bash', { command: 'npm list' })).toBe('read-only')
  expect(inferRiskLevel('Bash', { command: 'grep -r pattern .' })).toBe('read-only')
  expect(inferRiskLevel('Bash', { command: 'find . -name "*.ts"' })).toBe('read-only')
  expect(inferRiskLevel('Bash', { command: 'echo "hello"' })).toBe('read-only')
  expect(inferRiskLevel('Bash', { command: 'pwd' })).toBe('read-only')
  expect(inferRiskLevel('Bash', { command: 'curl -sL https://example.com' })).toBe('read-only')
  expect(inferRiskLevel('Bash', { command: 'jq . package.json' })).toBe('read-only')
})

test('inferRiskLevel — Bash 写入命令仍为 high-write', () => {
  expect(inferRiskLevel('Bash', { command: 'npm install lodash' })).toBe('high-write')
  expect(inferRiskLevel('Bash', { command: 'git commit -m "fix"' })).toBe('high-write')
  expect(inferRiskLevel('Bash', { command: 'mkdir test' })).toBe('high-write')
  expect(inferRiskLevel('Bash', { command: 'touch file.txt' })).toBe('high-write')
})

test('inferRiskLevel — Bash git reset --hard 升级 destructive', () => {
  expect(inferRiskLevel('Bash', { command: 'git reset --hard HEAD~5' })).toBe('destructive')
})

// H-007: 禁止前缀只读短路；复合/重定向/tee 取最高风险
test('inferRiskLevel — H-007 纯 ls 仍为 read-only', () => {
  expect(inferRiskLevel('Bash', { command: 'ls' })).toBe('read-only')
  expect(inferRiskLevel('Bash', { command: 'ls -la' })).toBe('read-only')
})

test('inferRiskLevel — H-007 纯 cat 仍为 read-only', () => {
  expect(inferRiskLevel('Bash', { command: 'cat file' })).toBe('read-only')
  expect(inferRiskLevel('Bash', { command: 'cat README.md' })).toBe('read-only')
})

test('inferRiskLevel — H-007 复合 ls; rm -rf 升级 destructive', () => {
  expect(inferRiskLevel('Bash', { command: 'ls; rm -rf x' })).toBe('destructive')
  expect(inferRiskLevel('Bash', { command: 'ls -la; rm -rf /tmp/test' })).toBe('destructive')
  expect(inferRiskLevel('Bash', { command: 'ls && rm -rf ./out' })).toBe('destructive')
})

test('inferRiskLevel — H-007 写重定向不得标 read-only', () => {
  expect(inferRiskLevel('Bash', { command: 'echo hi > file' })).not.toBe('read-only')
  expect(inferRiskLevel('Bash', { command: 'echo hi > file' })).toBe('high-write')
  expect(inferRiskLevel('Bash', { command: 'echo hi >> file' })).toBe('high-write')
  expect(inferRiskLevel('Bash', { command: 'cat a > b' })).toBe('high-write')
})

test('inferRiskLevel — H-007 cat|tee 不得标 read-only', () => {
  expect(inferRiskLevel('Bash', { command: 'cat a | tee b' })).not.toBe('read-only')
  expect(inferRiskLevel('Bash', { command: 'cat a | tee b' })).toBe('high-write')
  expect(inferRiskLevel('Bash', { command: 'ls | tee out.txt' })).toBe('high-write')
})

test('inferRiskLevel — H-007 其他复合/管道取最高风险', () => {
  expect(inferRiskLevel('Bash', { command: 'git status && touch x' })).toBe('high-write')
  expect(inferRiskLevel('Bash', { command: 'pwd || mkdir y' })).toBe('high-write')
  expect(inferRiskLevel('Bash', { command: 'ls\nrm -rf z' })).toBe('destructive')
  // 只读管道组合仍可为 read-only
  expect(inferRiskLevel('Bash', { command: 'ls | wc -l' })).toBe('read-only')
  expect(inferRiskLevel('Bash', { command: 'cat a | grep foo' })).toBe('read-only')
})

test('inferRiskLevel — H-007 fd 复制 2>&1 不误判为写重定向', () => {
  expect(inferRiskLevel('Bash', { command: 'ls 2>&1' })).toBe('read-only')
  expect(inferRiskLevel('Bash', { command: 'cat file 2>&1' })).toBe('read-only')
})

test('rotateAuditLog — 删除超过 30 天的条目', () => {
  // 写两条：一条 60 天前，一条今天
  const old = JSON.stringify({
    timestamp: new Date(Date.now() - 60 * 86400000).toISOString(),
    session_id: 'old',
    tool_name: 'Read',
    args_hash: 'x',
    risk_level: 'read-only',
    permission_decision: 'auto-allowed',
    outcome: 'success',
  })
  const recent = JSON.stringify({
    timestamp: new Date().toISOString(),
    session_id: 'recent',
    tool_name: 'Read',
    args_hash: 'y',
    risk_level: 'read-only',
    permission_decision: 'auto-allowed',
    outcome: 'success',
  })
  // 加上 padding 让文件 > 1KB（rotateAuditLog 优化跳过小文件）
  const padding = JSON.stringify({ timestamp: new Date().toISOString(), session_id: 'p', tool_name: 'Read', args_hash: 'p', risk_level: 'read-only', permission_decision: 'auto-allowed', outcome: 'success' })
  let content = old + '\n' + recent + '\n'
  for (let i = 0; i < 20; i++) content += padding + '\n'
  writeFileSync(AUDIT_PATH, content, 'utf-8')

  const result = rotateAuditLog()
  expect(result.removedLines).toBe(1)

  const remaining = readFileSync(AUDIT_PATH, 'utf-8')
  expect(remaining).not.toContain('"old"')
  expect(remaining).toContain('"recent"')
})

test('getRecentAuditEntries — 取最近 N 条', () => {
  for (let i = 0; i < 5; i++) {
    writeAuditEntry({
      session_id: `s${i}`,
      tool_name: 'Read',
      args_hash: `h${i}`,
      risk_level: 'read-only',
      permission_decision: 'auto-allowed',
      outcome: 'success',
    })
  }

  const entries = getRecentAuditEntries(3)
  expect(entries.length).toBe(3)
  expect(entries[0].session_id).toBe('s2')  // 最近 3 条 = s2, s3, s4
  expect(entries[2].session_id).toBe('s4')
})
