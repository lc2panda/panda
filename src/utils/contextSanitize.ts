// Input: CLAUDE.md / MEMORY.md / USER.md 等上下文文件的原始内容
// Output: SanitizeResult（content 原样 + warnings 列表，仅告警不修改）
// Pos: 用户上下文文件加载管线（src/utils/claudemd.ts → parseMemoryFileContent）

export interface SanitizeResult {
  content: string
  warnings: string[]
}

// 隐藏 unicode：零宽空格/连字符、双向覆写、BOM
const HIDDEN_UNICODE_RE = /[\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]/g

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
  /忽略\s*(?:以上|之前|前面).*?(?:指令|规则|指示)/,
  /忘记\s*(?:你的|所有|之前).*?(?:指令|规则|指示)/,
  /(?:覆盖|替换)\s*(?:你的|系统).*?(?:指令|提示|规则)/,
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
      `${filePath}: 检测到 ${hiddenMatches.length} 个隐藏 Unicode 字符（零宽/双向覆写/BOM）`,
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

  return { content: raw, warnings }
}
