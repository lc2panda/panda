// Input: 构建命令 (tsc/webpack/vite) + stdout/stderr 输出
// Output: 结构化解析结果 (ParsedOutput)
// Pos: BashTool/parsers/ 构建工具输出解析器
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"

import type { ParsedOutput } from './index.js'

// ---------------------------------------------------------------------------
// TypeScript (tsc)
// ---------------------------------------------------------------------------

function parseTscOutput(stdout: string, stderr: string): ParsedOutput | null {
  const combined = stdout + '\n' + stderr
  const lines = combined.split('\n')

  const errors: string[] = []
  const warnings: string[] = []
  let foundErrors = 0

  for (const line of lines) {
    // error TS2345: ...
    if (/\berror\b\s*(TS\d+)?:/i.test(line)) {
      errors.push(line.trim())
    }
    // warning TS...
    else if (/\bwarning\b\s*(TS\d+)?:/i.test(line)) {
      warnings.push(line.trim())
    }
    // Found N errors.
    const foundMatch = line.match(/Found\s+(\d+)\s+error/i)
    if (foundMatch) {
      foundErrors = parseInt(foundMatch[1], 10)
    }
  }

  if (errors.length === 0 && warnings.length === 0 && foundErrors === 0) {
    return null
  }

  const status = errors.length > 0 || foundErrors > 0 ? '✗ BUILD FAILED' : '✓ BUILD OK'
  const errCount = foundErrors || errors.length
  const summary = `${status}: ${errCount} errors, ${warnings.length} warnings`

  // Group errors by TS code
  const errByCode = new Map<string, number>()
  for (const err of errors) {
    const codeMatch = err.match(/TS(\d+)/)
    const code = codeMatch ? `TS${codeMatch[1]}` : 'unknown'
    errByCode.set(code, (errByCode.get(code) || 0) + 1)
  }

  const details: string[] = []
  if (errByCode.size > 0) {
    details.push('Error breakdown:')
    for (const [code, count] of [...errByCode.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)) {
      details.push(`  ${code}: ${count} occurrences`)
    }
  }
  // First few unique errors
  details.push(...errors.slice(0, 10))

  return {
    summary,
    details,
    errors: errors.slice(0, 15),
    warnings: warnings.slice(0, 10),
    stats: {
      errors: errCount,
      warnings: warnings.length,
      uniqueErrorCodes: errByCode.size,
    },
  }
}

// ---------------------------------------------------------------------------
// Webpack / Vite / esbuild
// ---------------------------------------------------------------------------

function parseBundlerOutput(stdout: string, stderr: string): ParsedOutput | null {
  const combined = stdout + '\n' + stderr
  const lines = combined.split('\n')

  const errors: string[] = []
  const warnings: string[] = []
  let buildTime = ''
  let bundleSize = ''

  for (const line of lines) {
    // Errors
    if (/\bERROR\b|\berror\b/i.test(line) && !/\d+ error/.test(line)) {
      errors.push(line.trim())
    }
    // Warnings
    if (/\bWARN(ING)?\b/i.test(line) && !/\d+ warning/.test(line)) {
      warnings.push(line.trim())
    }
    // Build time: "built in 1.23s" / "Done in 456ms"
    const timeMatch = line.match(/(?:built|done|completed)\s+in\s+([\d.]+\s*m?s)/i)
    if (timeMatch) {
      buildTime = timeMatch[1]
    }
    // Bundle size
    const sizeMatch = line.match(/(\d+(?:\.\d+)?\s*[KMG]?B)\b/i)
    if (sizeMatch && /bundle|output|size|dist/i.test(line)) {
      bundleSize = sizeMatch[1]
    }
  }

  // Detect success/failure from exit code heuristic in output
  const hasFailed = errors.length > 0 || /\bfailed\b/i.test(combined)
  const status = hasFailed ? '✗ BUILD FAILED' : '✓ BUILD OK'

  const parts: string[] = [status]
  if (buildTime) parts.push(`time: ${buildTime}`)
  if (bundleSize) parts.push(`size: ${bundleSize}`)
  const summary = parts.join(', ')

  if (errors.length === 0 && warnings.length === 0 && !buildTime && !bundleSize) {
    return null
  }

  return {
    summary,
    details: [...errors.slice(0, 10), ...warnings.slice(0, 5)],
    errors: errors.slice(0, 15),
    warnings: warnings.slice(0, 10),
    stats: {
      errors: errors.length,
      warnings: warnings.length,
    },
  }
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

export function parseBuildOutput(
  command: string,
  stdout: string,
  stderr: string,
): ParsedOutput | null {
  const cmd = command.toLowerCase()

  if (/\btsc\b/.test(cmd)) {
    return parseTscOutput(stdout, stderr)
  }

  if (/\b(webpack|vite|esbuild|rollup|parcel|turbopack)\b/.test(cmd)) {
    return parseBundlerOutput(stdout, stderr)
  }

  // For generic "build" commands, try tsc first then bundler
  if (/\bbuild\b/.test(cmd)) {
    const tscResult = parseTscOutput(stdout, stderr)
    if (tscResult) return tscResult
    return parseBundlerOutput(stdout, stderr)
  }

  return null
}
