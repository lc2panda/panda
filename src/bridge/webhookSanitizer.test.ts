// Input: sanitizeInboundWebhookContent 各类入站字符串
// Output: 断言不再是恒等 stub；密钥/HTML/PII 被 redact，结构保留
// Pos: bridge/ 入站消毒回归测试

import { describe, expect, test } from 'bun:test'
import { sanitizeInboundWebhookContent } from './webhookSanitizer.js'

describe('sanitizeInboundWebhookContent (P-001)', () => {
  test('不再是 identity：含密钥的内容必须被改写', () => {
    const raw =
      'deploy with token ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 and continue'
    const out = sanitizeInboundWebhookContent(raw)
    expect(out).not.toBe(raw)
    expect(out).not.toContain('ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789')
    expect(out).toContain('deploy with token')
    expect(out).toContain('and continue')
  })

  test('剥离 script / 事件处理器 / javascript: URL', () => {
    const raw =
      'hello <script>alert(1)</script> world <img src=x onerror="steal()"> click javascript:alert(2)'
    const out = sanitizeInboundWebhookContent(raw)
    expect(out).not.toBe(raw)
    expect(out.toLowerCase()).not.toContain('<script')
    expect(out.toLowerCase()).not.toContain('onerror=')
    expect(out.toLowerCase()).not.toContain('javascript:')
    expect(out).toContain('hello')
    expect(out).toContain('world')
  })

  test('明显 PII / 赋值密钥形态被 redact', () => {
    const raw =
      'contact me@example.com password=SuperSecret123 card 4111-1111-1111-1111'
    const out = sanitizeInboundWebhookContent(raw)
    expect(out).not.toContain('me@example.com')
    expect(out).not.toContain('SuperSecret123')
    expect(out).not.toContain('4111-1111-1111-1111')
    expect(out).toContain('contact')
    expect(out).toMatch(/password\s*=\s*\[REDACTED\]/i)
  })

  test('空串与安全纯文本保持可用', () => {
    expect(sanitizeInboundWebhookContent('')).toBe('')
    const clean = 'please review PR #42 when ready'
    expect(sanitizeInboundWebhookContent(clean)).toBe(clean)
  })

  test('AWS 密钥被 secretScanner 路径 redact', () => {
    // Matches secretScanner aws_access_key_id rule (boundary + AKIA...)
    const raw = 'export AWS_KEY= AKIAIOSFODNN7EXAMPLE '
    const out = sanitizeInboundWebhookContent(raw)
    expect(out).not.toContain('AKIAIOSFODNN7EXAMPLE')
    expect(out).toContain('[REDACTED]')
  })
})
