// Input: CLAUDE.md / MEMORY.md / USER.md 等上下文文件的原始内容
// Output: SanitizeResult（content 原样 + warnings 列表，仅告警不修改）
// Pos: 用户上下文文件加载管线（src/utils/claudemd.ts → parseMemoryFileContent）

export interface SanitizeResult {
  content: string
  warnings: string[]
}

// 隐藏 unicode：零宽空格/连字符、双向覆写、BOM、隔离符、不可见数学运算符、语言标签
// 覆盖 Trojan Source（CVE-2021-42574）攻击向量：
//   U+200B-200F  零宽字符 & LTR/RTL mark
//   U+202A-202E  双向覆写嵌入（LRE/RLE/PDF/LRO/RLO）
//   U+2060-2064  word joiner & 不可见数学运算符
//   U+2066-2069  LRI/RLI/FSI/PDI 隔离符（bidirectional override 新形式）
//   U+FEFF       BOM / zero-width no-break space
//   U+E0000-E007F Unicode 语言标签（tag characters，隐藏指令走私）
const HIDDEN_UNICODE_RE =
  /[\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF\u{E0000}-\u{E007F}]/gu

// HTML 注释（LLM 可见，Markdown 渲染时不可见）
const HTML_COMMENT_RE = /<!--[\s\S]*?-->/g

// 常见 prompt injection 关键词（中英文），尽量覆盖主流越狱句式
const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(?:all\s+)?(?:previous|prior|above)\s+(?:instructions|prompts|rules)/i,
  /disregard\s+(?:the\s+)?(?:above|previous|prior)/i,
  /forget\s+(?:your|all|the)\s+(?:instructions|prompts|rules|system)/i,
  /override\s+(?:your|the)\s+(?:instructions|system\s*prompt|rules)/i,
  /you\s+are\s+now\s+(?:a\s+)?(?:dan|jailbroken|unrestricted)/i,
  /pretend\s+you\s+(?:are|have)\s+no\s+(?:rules|restrictions|guidelines)/i,
  /pretend\s+to\s+be\b/i,
  /act\s+as\s+(?:an?\s+)?(?:dan|jailbreak|developer\s+mode)/i,
  /忽略\s*(?:以上|之前|前面).*?(?:指令|规则|指示)/,
  /忘记\s*(?:你的|所有|之前).*?(?:指令|规则|指示)/,
  /(?:覆盖|替换)\s*(?:你的|系统).*?(?:指令|提示|规则|身份)/,
  /你\s*(?:现在|从现在起|从此)?\s*扮演/,
  /(?:现在|从现在起)\s*你\s*是\s*(?:一个|一位)?/,
]

// 敏感文件访问 / 数据 exfiltration 模式
// Hermes 联网调研补齐：secret file access 属于高风险 injection payload
const SECRET_ACCESS_PATTERNS: RegExp[] = [
  // shell 命令访问敏感文件
  /\bcat\s+(?:~\/)?\.env\b/i,
  /\bcat\s+(?:~\/)?credentials\b/i,
  /\bcat\s+(?:~\/)?\.aws\/credentials/i,
  /\bcat\s+(?:~\/)?\.ssh\/id_(?:rsa|ed25519|ecdsa|dsa)/i,
  /\bcat\s+(?:~\/)?\.netrc\b/i,
  /\bcat\s+(?:~\/)?\.npmrc\b/i,
  /\bcat\s+(?:~\/)?\.pypirc\b/i,
  /\bcat\s+\/etc\/(?:passwd|shadow|sudoers)/i,
  // 远程访问 / exfiltration
  /\bcurl\s+[^|\n]*\|\s*(?:sh|bash|zsh)\b/i,
  /\bwget\s+[^|\n]*\|\s*(?:sh|bash|zsh)\b/i,
  /\bcurl\s+[^\n]*-d\s+["'][^"']*\$\{?(?:API_KEY|SECRET|TOKEN|PASSWORD)/i,
  // 环境变量泄露
  /\b(?:echo|printf)\s+["']?\$\{?(?:API_KEY|SECRET|TOKEN|PASSWORD|HOME)\b/i,
  /\bprintenv\s+(?:API_KEY|SECRET|TOKEN|PASSWORD)/i,
  // SSH key 输出 / 植入
  /\bssh-keygen\s+-y\b/i,
  /\bauthorized_keys\b/i,
]

/**
 * 扫描上下文文件内容，检测 prompt injection 痕迹。
 * 不修改原内容 —— 只返回告警列表，由调用方决定如何处理（debug log / 通知 / 拒绝）。
 */
export function sanitizeContextFile(filePath: string, raw: string): SanitizeResult {
  const warnings: string[] = []

  const hiddenMatches = raw.match(HIDDEN_UNICODE_RE)
  if (hiddenMatches && hiddenMatches.length > 0) {
    warnings.push(
      `${filePath}: 检测到 ${hiddenMatches.length} 个隐藏 Unicode 字符（零宽/双向覆写/BOM/Trojan Source 风险）`,
    )
  }

  const commentMatches = raw.match(HTML_COMMENT_RE)
  if (commentMatches && commentMatches.length > 0) {
    warnings.push(
      `${filePath}: 检测到 ${commentMatches.length} 处 HTML 注释（LLM 可见但 Markdown 渲染不可见）`,
    )
  }

  for (const pat of INJECTION_PATTERNS) {
    if (pat.test(raw)) {
      warnings.push(`${filePath}: 检测到疑似 prompt injection 关键词：${pat.source}`)
    }
  }

  for (const pat of SECRET_ACCESS_PATTERNS) {
    if (pat.test(raw)) {
      warnings.push(`${filePath}: 检测到敏感文件访问/exfiltration 模式：${pat.source}`)
    }
  }

  return { content: raw, warnings }
}
