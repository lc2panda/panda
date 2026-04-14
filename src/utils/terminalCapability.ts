// Input: 无
// Output: 终端能力检测结果（true color / Unicode / VT 性能）
// Pos: utils/ 终端检测工具，供 MatrixCharRain 和 MatrixBootSequence 使用

export interface TerminalCapability {
  trueColor: boolean
  unicode: boolean
  fastVT: boolean
}

/**
 * 检测当前终端的渲染能力。
 * macOS / Linux 默认全能力；Windows 按终端类型分级。
 */
export function getTerminalCapability(): TerminalCapability {
  if (process.platform !== 'win32') {
    return { trueColor: true, unicode: true, fastVT: true }
  }

  // Windows Terminal — 全能力
  if (process.env.WT_SESSION) {
    return { trueColor: true, unicode: true, fastVT: true }
  }

  // VS Code 集成终端
  if (process.env.TERM_PROGRAM === 'vscode') {
    return { trueColor: true, unicode: true, fastVT: true }
  }

  // mintty (Git Bash) / MSYS2
  if (process.env.TERM_PROGRAM === 'mintty' || process.env.MSYSTEM) {
    return { trueColor: true, unicode: true, fastVT: true }
  }

  // conhost fallback — 低能力终端
  return {
    trueColor: !!process.env.COLORTERM,
    unicode: false,
    fastVT: false,
  }
}

/**
 * 获取 Matrix 主题在低能力 Windows 终端下的降级参数。
 * 高能力终端（Windows Terminal / VS Code / mintty / 非 Windows）返回 null。
 */
export function getMatrixWindowsDefaults(): {
  charSet: 'ascii'
  fps: number
  density: number
  tailLength: number
} | null {
  const cap = getTerminalCapability()
  if (cap.unicode && cap.fastVT) return null // 无需降级

  return {
    charSet: 'ascii',
    fps: cap.fastVT ? 20 : 15,
    density: 0.15,
    tailLength: 5,
  }
}
