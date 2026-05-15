// Input: project path (or --all), purge options (dry-run/yes/interactive)
// Output: filesystem deletions under ~/.pandacc/projects, exit code 0/1
// Pos: claude project purge subcommand handler (v2.1.126) — irreversible cleanup
//      called from src/main.tsx Commander wiring. Guards against deleting paths
//      outside the panda config home dir.
/* eslint-disable custom-rules/no-process-exit -- CLI subcommand handler intentionally exits */

import { createInterface } from 'readline'
import { readdir, rm, stat } from 'fs/promises'
import { join, resolve } from 'path'
import { homedir } from 'os'
import { getClaudeConfigHomeDir } from '../../utils/envUtils.js'
import {
  getProjectsDir,
  getProjectDir,
} from '../../utils/sessionStorage.js'

type PurgeOptions = {
  dryRun?: boolean
  yes?: boolean
  interactive?: boolean
  all?: boolean
}

type PurgeTarget = {
  /** Absolute path to delete. */
  path: string
  /** Human-readable label (e.g. "transcripts", "state", "cache"). */
  label: string
}

/**
 * Build the list of paths to purge for a given project directory key
 * (the sanitized form like `-Users-panda-Downloads-foo`).
 *
 * All targets MUST live under getClaudeConfigHomeDir() — the safety check
 * in performPurge() re-validates this before any rm runs.
 */
function buildTargetsForProject(sanitizedKey: string): PurgeTarget[] {
  const home = getClaudeConfigHomeDir()
  return [
    {
      path: join(home, 'projects', sanitizedKey),
      label: 'transcripts (~/.pandacc/projects/)',
    },
    {
      path: join(home, 'state', sanitizedKey),
      label: 'state (~/.pandacc/state/)',
    },
    {
      path: join(home, 'cache', sanitizedKey),
      label: 'cache (~/.pandacc/cache/)',
    },
    {
      path: join(home, 'todos', sanitizedKey),
      label: 'todos (~/.pandacc/todos/)',
    },
    {
      path: join(home, 'statsig', sanitizedKey),
      label: 'statsig (~/.pandacc/statsig/)',
    },
  ]
}

/**
 * Resolve the user-supplied path argument to a sanitized projects-dir key.
 * Accepts absolute or relative paths; `~` is expanded.
 */
function resolveProjectKey(rawPath: string): { absPath: string; key: string } {
  let p = rawPath
  if (p === '~' || p.startsWith('~/')) {
    p = join(homedir(), p.slice(1))
  }
  const absPath = resolve(p)
  // getProjectDir returns the absolute "~/.pandacc/projects/<sanitized>" form.
  // We need just the basename as the sanitized key.
  const projectDir = getProjectDir(absPath)
  const key = projectDir.slice(getProjectsDir().length + 1) // strip "<projectsDir>/"
  return { absPath, key }
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await stat(p)
    return true
  } catch {
    return false
  }
}

async function dirSize(p: string): Promise<{ files: number; bytes: number }> {
  let files = 0
  let bytes = 0
  async function walk(dir: string): Promise<void> {
    let entries
    try {
      entries = await readdir(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const e of entries) {
      const full = join(dir, e.name)
      if (e.isDirectory()) {
        await walk(full)
      } else if (e.isFile()) {
        files++
        try {
          const s = await stat(full)
          bytes += s.size
        } catch {
          // ignore — file may have been removed between readdir and stat
        }
      }
    }
  }
  await walk(p)
  return { files, bytes }
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n}B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)}KB`
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)}MB`
  return `${(n / 1024 / 1024 / 1024).toFixed(2)}GB`
}

async function promptYesNo(question: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close()
      const a = answer.trim().toLowerCase()
      resolve(a === 'y' || a === 'yes')
    })
  })
}

/**
 * Hard safety check: every target path must live under ~/.pandacc/ (or whatever
 * PANDA_CONFIG_DIR/CLAUDE_CONFIG_DIR resolves to). Refuse to delete anything
 * outside that root — prevents catastrophic accidents from path-construction
 * bugs or hostile sanitized keys.
 */
function isSafeToDelete(absPath: string): boolean {
  const home = resolve(getClaudeConfigHomeDir())
  const target = resolve(absPath)
  // Must be strictly under home — not equal to home itself, not a parent of it,
  // not an arbitrary fs location.
  if (target === home) return false
  return target.startsWith(home + '/')
}

async function listExistingProjects(): Promise<string[]> {
  try {
    const entries = await readdir(getProjectsDir(), { withFileTypes: true })
    return entries.filter(e => e.isDirectory()).map(e => e.name)
  } catch {
    return []
  }
}

async function performPurgeForKey(
  sanitizedKey: string,
  options: PurgeOptions,
): Promise<{ deleted: number; bytes: number; skipped: number }> {
  const targets = buildTargetsForProject(sanitizedKey)
  const existing: Array<PurgeTarget & { stats: { files: number; bytes: number } }> = []
  for (const t of targets) {
    if (await pathExists(t.path)) {
      const stats = await dirSize(t.path)
      existing.push({ ...t, stats })
    }
  }

  if (existing.length === 0) {
    process.stdout.write(`  (项目 "${sanitizedKey}" 无 panda 状态可清除)\n`)
    return { deleted: 0, bytes: 0, skipped: 0 }
  }

  process.stdout.write(`项目: ${sanitizedKey}\n`)
  let totalBytes = 0
  let totalFiles = 0
  for (const t of existing) {
    totalBytes += t.stats.bytes
    totalFiles += t.stats.files
    process.stdout.write(
      `  ${t.label}\n    路径: ${t.path}\n    ${t.stats.files} 文件 / ${formatBytes(t.stats.bytes)}\n`,
    )
  }
  process.stdout.write(
    `  合计: ${totalFiles} 文件 / ${formatBytes(totalBytes)}\n`,
  )

  if (options.dryRun) {
    return { deleted: 0, bytes: 0, skipped: existing.length }
  }

  let deleted = 0
  let bytes = 0
  let skipped = 0

  for (const t of existing) {
    if (!isSafeToDelete(t.path)) {
      process.stderr.write(
        `  [安全拦截] 拒绝删除 ${t.path} — 不在 ~/.pandacc/ 内\n`,
      )
      skipped++
      continue
    }
    if (options.interactive) {
      const ok = await promptYesNo(`  删除 ${t.label}? [y/N] `)
      if (!ok) {
        skipped++
        continue
      }
    }
    try {
      await rm(t.path, { recursive: true, force: true })
      deleted++
      bytes += t.stats.bytes
      process.stdout.write(`  ✓ 已删除 ${t.label}\n`)
    } catch (err) {
      process.stderr.write(
        `  ✗ 删除失败 ${t.path}: ${err instanceof Error ? err.message : String(err)}\n`,
      )
      skipped++
    }
  }

  return { deleted, bytes, skipped }
}

export async function projectPurgeHandler(
  pathArg: string | undefined,
  options: PurgeOptions,
): Promise<void> {
  // --- guardrails ---
  if (options.all) {
    if (!options.yes && !options.dryRun) {
      process.stderr.write(
        'Error: --all 必须配合 -y/--yes 使用（会清除所有项目的 panda 状态，不可恢复）。\n' +
          '       如需查看将要删除的内容，请使用 --all --dry-run。\n',
      )
      process.exit(1)
    }
    if (pathArg) {
      process.stderr.write(
        'Error: --all 与 [path] 互斥，请二选一。\n',
      )
      process.exit(1)
    }
  } else if (!pathArg) {
    process.stderr.write(
      'Error: 必须指定项目路径 (claude project purge <path>) 或使用 --all。\n' +
        '       提示: 使用 --dry-run 预览将要删除的内容。\n',
    )
    process.exit(1)
  }

  // 默认 dry-run：未给 -y 也未给 --dry-run 时，按 dry-run 行为执行并提示。
  const effectiveDryRun = options.dryRun || (!options.yes && !options.interactive)
  if (effectiveDryRun && !options.dryRun) {
    process.stdout.write(
      '(未指定 -y/--yes 或 -i/--interactive，进入 dry-run 模式 — 不会真删)\n\n',
    )
  }

  const runOptions: PurgeOptions = { ...options, dryRun: effectiveDryRun }

  // --- 收集要处理的项目 keys ---
  let keys: string[]
  if (options.all) {
    keys = await listExistingProjects()
    if (keys.length === 0) {
      process.stdout.write('无任何项目状态可清除。\n')
      process.exit(0)
    }
    process.stdout.write(`将处理 ${keys.length} 个项目:\n`)
  } else {
    const { absPath, key } = resolveProjectKey(pathArg!)
    process.stdout.write(`解析项目路径: ${absPath}\n  -> 状态 key: ${key}\n\n`)
    keys = [key]
  }

  let totalDeleted = 0
  let totalBytes = 0
  let totalSkipped = 0
  for (const key of keys) {
    const result = await performPurgeForKey(key, runOptions)
    totalDeleted += result.deleted
    totalBytes += result.bytes
    totalSkipped += result.skipped
    process.stdout.write('\n')
  }

  if (effectiveDryRun) {
    process.stdout.write(
      `[dry-run] 不会执行实际删除。如需真删，加 -y/--yes 重新运行。\n`,
    )
    process.exit(0)
  }
  process.stdout.write(
    `完成: 删除 ${totalDeleted} 个目录 / ${formatBytes(totalBytes)}` +
      (totalSkipped > 0 ? `，跳过 ${totalSkipped} 个` : '') +
      '\n',
  )
  process.exit(0)
}
