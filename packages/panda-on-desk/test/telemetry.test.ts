// Input:  bun test 触发；mock 全局 fetch / http / https / net；tmp config dir 隔离
// Output: 验证 telemetry stub 默认禁用 / no-op / 永不发起外部网络请求 / audit log 仅本地
// Pos:    panda-on-desk W9-T3 telemetry 透明度 — telemetry.ts 行为契约（PRIVACY.md §3 守护）
//
// [NEW-FILE:#W9-03]
// 2026-04-20 +08:00 W9-T3 telemetry stub 单元测试（agent-γ-W9-telemetry）
//
// 验证点（≥ 3 用例）：
//   1. telemetry 默认 disabled（getConsent 全 false / track no-op / captureException no-op / isUploadAllowed=false）
//   2. 任何调用都不发起外部 HTTP 请求（拦截 fetch / http.request / https.request / net.connect）
//   3. audit log 仅写在本机 ~/.pandacc/telemetry-audit.log（仅当 consent 显式开启时）

import { describe, expect, it, beforeEach, afterEach } from 'bun:test'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

// 在导入 telemetry 前隔离 config dir（与 logger.test.ts 同模式）
const TMP_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'panda-on-desk-telemetry-test-'))
process.env.PANDA_CONFIG_DIR = TMP_DIR

// eslint-disable-next-line @typescript-eslint/no-require-imports
const telemetryMod = require('../src/util/telemetry') as typeof import('../src/util/telemetry')
const {
  telemetry,
  track,
  captureException,
  setUserConsent,
  getConsent,
  isUploadAllowed,
  getAuditLogPath,
  __resetConsentForTesting,
  __internals,
} = telemetryMod

const AUDIT_PATH = getAuditLogPath(TMP_DIR)
const TELEMETRY_SRC_PATH = path.join(__dirname, '..', 'src', 'util', 'telemetry.ts')

// ─────────────────────────────────────────────────────────────────────────────
// 网络拦截器 — 替换 globalThis.fetch（Bun 下 http/https/net 是 readonly，
// 改用源码静态扫描 + fetch 运行时拦截 双重保险）
// ─────────────────────────────────────────────────────────────────────────────

interface NetCapture {
  fetchCalls: string[]
}

let capture: NetCapture
let _originalFetch: typeof globalThis.fetch | undefined

function installNetTraps(): NetCapture {
  capture = { fetchCalls: [] }
  _originalFetch = globalThis.fetch

  // 替换 globalThis.fetch — 任何调用都记录并抛错
  globalThis.fetch = ((...args: unknown[]) => {
    const url = String(args[0])
    capture.fetchCalls.push(url)
    throw new Error(`[telemetry test] forbidden fetch() call to ${url}`)
  }) as unknown as typeof globalThis.fetch

  return capture
}

function restoreNetTraps(): void {
  if (_originalFetch) globalThis.fetch = _originalFetch
}

function clearAuditLog(): void {
  try {
    fs.unlinkSync(AUDIT_PATH)
  } catch {
    /* not exists */
  }
}

beforeEach(() => {
  installNetTraps()
  __resetConsentForTesting()
  clearAuditLog()
})

afterEach(() => {
  restoreNetTraps()
  __resetConsentForTesting()
})

// ─────────────────────────────────────────────────────────────────────────────
// 用例 1 — 默认禁用 + no-op
// ─────────────────────────────────────────────────────────────────────────────

describe('telemetry — 默认 disabled（PRIVACY.md §1.1）', () => {
  it('getConsent() 默认所有子项 false', () => {
    const c = getConsent()
    expect(c.enabled).toBe(false)
    expect(c.crashReport).toBe(false)
    expect(c.usageMetrics).toBe(false)
    expect(c.featureFlags).toBe(false)
    expect(c.errorLog).toBe(false)
  })

  it('isUploadAllowed() 当前阶段永远 false（即使 consent 全开）', () => {
    expect(isUploadAllowed()).toBe(false)
    setUserConsent({
      enabled: true,
      crashReport: true,
      usageMetrics: true,
      featureFlags: true,
      errorLog: true,
    })
    // v2.25.x 阶段：即使全部同意，stub 也强制返回 false
    expect(isUploadAllowed()).toBe(false)
  })

  it('track() / captureException() 在默认禁用态下完全 no-op — 不写 audit log', () => {
    track('petstate.change', { from: 'idle', to: 'thinking' })
    captureException(new Error('boom'), { where: 'main' })

    // audit 文件必须不存在（no-op 不应触发任何文件创建）
    expect(fs.existsSync(AUDIT_PATH)).toBe(false)
  })

  it('telemetry 命名空间导出与单函数一致', () => {
    expect(typeof telemetry.track).toBe('function')
    expect(typeof telemetry.captureException).toBe('function')
    expect(typeof telemetry.setUserConsent).toBe('function')
    expect(typeof telemetry.getConsent).toBe('function')
    expect(typeof telemetry.isUploadAllowed).toBe('function')
    expect(typeof telemetry.getAuditLogPath).toBe('function')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 用例 2 — 永不发起外部网络请求（PRIVACY.md §1.1）
// ─────────────────────────────────────────────────────────────────────────────

describe('telemetry — 0 外部 HTTP / 0 socket（PRIVACY.md §1.1 / §1.2）', () => {
  it('默认禁用态下，track/captureException 不触发 fetch', () => {
    track('any.event', { foo: 'bar' })
    captureException(new Error('x'))
    expect(capture.fetchCalls.length).toBe(0)
  })

  it('用户全量同意后，track/captureException 仍不触发任何 fetch（v2.25.x stub 阶段）', () => {
    setUserConsent({
      enabled: true,
      crashReport: true,
      usageMetrics: true,
      featureFlags: true,
      errorLog: true,
    })

    track('petstate.change', { from: 'idle', to: 'thinking' })
    track('species.switch', { species: 'cat' })
    captureException(new Error('renderer crash'), { where: 'renderer' })

    expect(capture.fetchCalls.length).toBe(0)
  })

  it('telemetry.ts 源码静态扫描：禁止出现 fetch/http.request/https.request/net.connect/WebSocket 等出站原语', () => {
    const src = fs.readFileSync(TELEMETRY_SRC_PATH, 'utf8')
    // 允许在注释与字符串中提及（用 require/import + 调用形态来精确检测）
    const forbiddenPatterns: ReadonlyArray<{ name: string; re: RegExp }> = [
      { name: "import 'node:http'", re: /from\s+['"]node:https?['"]/ },
      { name: "require('node:http')", re: /require\(\s*['"]node:https?['"]\s*\)/ },
      { name: "import 'node:net'", re: /from\s+['"]node:net['"]/ },
      { name: "require('node:net')", re: /require\(\s*['"]node:net['"]\s*\)/ },
      { name: "import 'node:dgram'", re: /from\s+['"]node:dgram['"]/ },
      { name: "import 'node:dns'", re: /from\s+['"]node:dns['"]/ },
      { name: 'fetch(...) 调用', re: /(?<![a-zA-Z_$.])fetch\s*\(/ },
      { name: 'XMLHttpRequest', re: /XMLHttpRequest/ },
      { name: 'new WebSocket', re: /new\s+WebSocket/ },
      { name: 'navigator.sendBeacon', re: /navigator\s*\.\s*sendBeacon/ },
    ]
    const hits = forbiddenPatterns.filter(p => p.re.test(src)).map(p => p.name)
    expect(hits).toEqual([])
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 用例 3 — audit log 仅本地（PRIVACY.md §3.3）
// ─────────────────────────────────────────────────────────────────────────────

describe('telemetry — audit log 仅本地（PRIVACY.md §3.3）', () => {
  it('consent.usageMetrics=true 时，track 写入本地 audit log（JSON Lines）', () => {
    setUserConsent({ enabled: true, usageMetrics: true })

    track('petstate.change', { from: 'idle', to: 'thinking' })
    track('species.switch', { species: 'cat' })

    expect(fs.existsSync(AUDIT_PATH)).toBe(true)
    const content = fs.readFileSync(AUDIT_PATH, 'utf8')
    const lines = content.trim().split('\n')
    expect(lines.length).toBe(2)

    const parsed1 = JSON.parse(lines[0]) as { kind: string; event: string; props?: Record<string, unknown>; ts: string }
    expect(parsed1.kind).toBe('track')
    expect(parsed1.event).toBe('petstate.change')
    expect(parsed1.props).toEqual({ from: 'idle', to: 'thinking' })
    expect(typeof parsed1.ts).toBe('string')
    // ISO 8601 格式校验
    expect(parsed1.ts).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/)

    const parsed2 = JSON.parse(lines[1]) as { kind: string; event: string }
    expect(parsed2.event).toBe('species.switch')
  })

  it('consent.crashReport=true 时，captureException 写入本地 audit log（含 stack 单行化）', () => {
    setUserConsent({ enabled: true, crashReport: true })

    const err = new Error('renderer boom')
    captureException(err, { where: 'renderer' })

    expect(fs.existsSync(AUDIT_PATH)).toBe(true)
    const content = fs.readFileSync(AUDIT_PATH, 'utf8')
    const lines = content.trim().split('\n')
    expect(lines.length).toBe(1)

    const parsed = JSON.parse(lines[0]) as {
      kind: string
      event: string
      props?: { message: string; stack: string; context?: Record<string, unknown> }
    }
    expect(parsed.kind).toBe('exception')
    expect(parsed.event).toBe('exception')
    expect(parsed.props?.message).toBe('renderer boom')
    expect(parsed.props?.context).toEqual({ where: 'renderer' })
    // stack 必须单行化（无换行符）
    expect(parsed.props?.stack ?? '').not.toMatch(/\n/)
  })

  it('audit log 路径必须在本机 ~/.pandacc 目录下（不可指向远程）', () => {
    const auditPath = getAuditLogPath()
    // 不能是 http(s)/file:// URL；必须是绝对本地路径
    expect(auditPath.startsWith('http://')).toBe(false)
    expect(auditPath.startsWith('https://')).toBe(false)
    expect(auditPath.startsWith('file://')).toBe(false)
    // 必须以 telemetry-audit.log 结尾
    expect(auditPath.endsWith('telemetry-audit.log')).toBe(true)
    // 测试环境下应在 TMP_DIR 内
    expect(getAuditLogPath(TMP_DIR)).toBe(path.join(TMP_DIR, 'telemetry-audit.log'))
  })

  it('enabled=true 但 usageMetrics=false 时，track 仍 no-op（分级守护 PRIVACY.md §3.2）', () => {
    setUserConsent({ enabled: true, usageMetrics: false, crashReport: true })

    track('should.be.dropped', { x: 1 })

    // 不应有 audit 记录（usageMetrics 关）
    if (fs.existsSync(AUDIT_PATH)) {
      const content = fs.readFileSync(AUDIT_PATH, 'utf8').trim()
      expect(content).toBe('')
    }
  })

  it('__internals.DEFAULT_CONSENT 必须保持全 false（架构契约）', () => {
    expect(__internals.DEFAULT_CONSENT.enabled).toBe(false)
    expect(__internals.DEFAULT_CONSENT.crashReport).toBe(false)
    expect(__internals.DEFAULT_CONSENT.usageMetrics).toBe(false)
    expect(__internals.DEFAULT_CONSENT.featureFlags).toBe(false)
    expect(__internals.DEFAULT_CONSENT.errorLog).toBe(false)
  })
})
