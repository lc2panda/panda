#!/usr/bin/env node
import { basename } from 'path'

const ESC = '\x1b['
const BOLD = `${ESC}1m`
const DIM = `${ESC}2m`
const RESET = `${ESC}0m`
const YELLOW = `${ESC}33m`
const GREEN = `${ESC}32m`
const CYAN = `${ESC}36m`
const MAGENTA = `${ESC}35m`

function bar(pct) {
  const total = 10
  const filled = Math.min(Math.max(Math.round(pct / 10), 0), total)
  return '●'.repeat(filled) + '○'.repeat(total - filled)
}

function formatResetTime(epochOrIso) {
  if (!epochOrIso) return ''
  const d = typeof epochOrIso === 'number'
    ? new Date(epochOrIso * 1000)
    : new Date(epochOrIso)
  if (isNaN(d.getTime())) return ''
  const h = d.getHours()
  const m = String(d.getMinutes()).padStart(2, '0')
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return ` ↻ ${h12}:${m}${ampm}`
}

function formatResetTimeLong(epochOrIso) {
  if (!epochOrIso) return ''
  const d = typeof epochOrIso === 'number'
    ? new Date(epochOrIso * 1000)
    : new Date(epochOrIso)
  if (isNaN(d.getTime())) return ''
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const mon = months[d.getMonth()]
  const day = d.getDate()
  const h = d.getHours()
  const m = String(d.getMinutes()).padStart(2, '0')
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return ` ↻ ${mon} ${day}, ${h12}:${m}${ampm}`
}

let raw = ''
process.stdin.setEncoding('utf8')
process.stdin.on('data', chunk => { raw += chunk })
process.stdin.on('end', () => {
  let data
  try { data = JSON.parse(raw) } catch { process.exit(1) }

  const model = data.model?.display_name || ''
  const ctxPct = data.context_window?.used_percentage
  const perm = data.permission_mode || ''
  const effort = data.effort || ''
  const branch = data.git?.branch || ''
  const projectDir = data.workspace?.project_dir || process.cwd()
  const proj = basename(projectDir)

  const parts = []
  if (model) parts.push(`${YELLOW}${BOLD}${model}${RESET}`)
  if (ctxPct != null) parts.push(`✏️  ${GREEN}${Math.round(ctxPct)}%${RESET}`)
  if (branch) parts.push(`${CYAN}${proj}${RESET} ${DIM}(${branch})${RESET}`)
  if (effort) parts.push(`${MAGENTA}● ${effort}${RESET}`)
  if (perm) parts.push(`${DIM}${perm}${RESET}`)

  const line1 = parts.join(` ${DIM}|${RESET} `)
  const lines = [line1]

  const fiveHour = data.rate_limits?.five_hour
  if (fiveHour) {
    const pct = Math.round(fiveHour.used_percentage || 0)
    const reset = formatResetTime(fiveHour.resets_at)
    lines.push(`${DIM}current ${bar(pct)}  ${pct}%${reset}${RESET}`)
  }

  const sevenDay = data.rate_limits?.seven_day
  if (sevenDay) {
    const pct = Math.round(sevenDay.used_percentage || 0)
    const reset = formatResetTimeLong(sevenDay.resets_at)
    lines.push(`${DIM}weekly  ${bar(pct)}  ${pct}%${reset}${RESET}`)
  }

  process.stdout.write(lines.join('\n') + '\n')
})
