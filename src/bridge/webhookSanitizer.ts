// Input: 入站 webhook/桥接消息的原始 content 字符串
// Output: 脱敏后的安全文本（密钥/危险 HTML/明显 PII 已 redact，结构保留）
// Pos: bridge/ 入站边界消毒；useReplBridge 在 KAIROS_GITHUB_WEBHOOKS 下注入会话前调用
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"

import { redactSecrets } from '../services/teamMemorySync/secretScanner.js'

/**
 * Dangerous HTML / script injection patterns.
 * Replacements keep a readable marker so the surrounding prompt structure remains usable.
 */
const SCRIPT_TAG_RE = /<script\b[^>]*>[\s\S]*?<\/script\s*>/gi
const SCRIPT_SELF_CLOSING_RE = /<script\b[^>]*\/>/gi
const IFRAME_RE = /<iframe\b[^>]*>[\s\S]*?<\/iframe\s*>/gi
const OBJECT_EMBED_RE = /<\/?(?:object|embed|link|meta|base|form|svg)\b[^>]*>/gi
const EVENT_HANDLER_RE = /\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi
const JS_URL_RE = /\b(?:javascript|vbscript)\s*:/gi
const DATA_HTML_URL_RE = /\bdata\s*:\s*text\/html\b[^,\s"']*/gi
const HTML_COMMENT_RE = /<!--[\s\S]*?-->/g

/**
 * Obvious PII / credential-assignment shapes not fully covered by secretScanner.
 * Keep patterns tight to avoid wiping ordinary prose into unusable text.
 */
const EMAIL_RE =
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g
const SSN_RE = /\b\d{3}-\d{2}-\d{4}\b/g
/** 13–19 digit card numbers with optional spaces/dashes (not bare short digit runs). */
const CREDIT_CARD_RE =
  /\b(?:\d[ -]*?){13,19}\b/g
/** Assignment-style secrets: password=..., token: "..." */
const ASSIGNED_SECRET_RE =
  /\b(?:api[_-]?key|secret|password|passwd|pwd|access[_-]?token|refresh[_-]?token|private[_-]?key)\s*[:=]\s*['"]?[^\s'"]{6,}/gi
const BEARER_TOKEN_RE =
  /\bBearer\s+[A-Za-z0-9\-._~+/]+=*/gi
/** Common PEM private key blocks */
const PEM_PRIVATE_KEY_RE =
  /-----BEGIN[ A-Z]*PRIVATE KEY-----[\s\S]*?-----END[ A-Z]*PRIVATE KEY-----/gi

function redactDangerousMarkup(content: string): string {
  return content
    .replace(SCRIPT_TAG_RE, '[REDACTED_SCRIPT]')
    .replace(SCRIPT_SELF_CLOSING_RE, '[REDACTED_SCRIPT]')
    .replace(IFRAME_RE, '[REDACTED_IFRAME]')
    .replace(OBJECT_EMBED_RE, '[REDACTED_HTML]')
    .replace(EVENT_HANDLER_RE, ' [REDACTED_ATTR]')
    .replace(JS_URL_RE, '[REDACTED_URL]:')
    .replace(DATA_HTML_URL_RE, '[REDACTED_DATA_URL]')
    .replace(HTML_COMMENT_RE, '')
}

function redactPiiAndCredentialShapes(content: string): string {
  return content
    .replace(PEM_PRIVATE_KEY_RE, '[REDACTED_PRIVATE_KEY]')
    .replace(BEARER_TOKEN_RE, 'Bearer [REDACTED]')
    .replace(ASSIGNED_SECRET_RE, match => {
      // Keep the key name, drop the value.
      const sep = match.includes('=') ? '=' : ':'
      const key = match.split(/[:=]/)[0] ?? 'secret'
      return `${key.trim()}${sep}[REDACTED]`
    })
    .replace(EMAIL_RE, '[REDACTED_EMAIL]')
    .replace(SSN_RE, '[REDACTED_SSN]')
    .replace(CREDIT_CARD_RE, match => {
      // Avoid redacting ordinary short numbers that happen to have separators poorly;
      // require at least 13 digit characters.
      const digits = match.replace(/\D/g, '')
      return digits.length >= 13 && digits.length <= 19
        ? '[REDACTED_CARD]'
        : match
    })
}

/**
 * Sanitize inbound webhook / bridge content before it is injected into a session.
 *
 * Fail-closed on internal errors: returns a safe placeholder rather than the
 * original (possibly sensitive) string.
 *
 * Design:
 * - Reuse teamMemorySync `redactSecrets` for known secret shapes (AWS, GitHub, Slack, JWT, …)
 * - Strip dangerous HTML/script injection vectors
 * - Redact obvious PII / credential assignment patterns
 * - Never wipe the whole payload to empty when only fragments are sensitive
 */
export function sanitizeInboundWebhookContent(content: string): string {
  if (typeof content !== 'string') {
    return '[REDACTED_NON_STRING]'
  }
  if (content.length === 0) {
    return content
  }

  try {
    let out = content
    // 1) Project secret scanner (aligned with team memory / disk safety)
    out = redactSecrets(out)
    // 2) Markup / script injection
    out = redactDangerousMarkup(out)
    // 3) PII + assignment-style credentials
    out = redactPiiAndCredentialShapes(out)
    return out
  } catch {
    // Fail-closed: never return the original payload after a sanitizer fault.
    return '[REDACTED_SANITIZER_ERROR]'
  }
}
