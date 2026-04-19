#!/usr/bin/env node
// Input: themes/panda/sprites/*.ascii (18 物种 ASCII 数据源)
// Output: themes/panda/sprites/*.svg (18 物种 SVG，每文件 1 svg 含 12 <g id="state-{state}">)
// Pos: panda-on-desk Phase 3 P3-T5 美术资产生成器 — 程序化把 ASCII 转 SVG，
//      不依赖人工 designer。可重复运行；输出 byte-stable（按字典序排列）。
//
// 用法：
//   cd packages/panda-on-desk && node scripts/build-sprites.cjs
//
// [NEW-FILE:#20260419-P3T5-art-01]

'use strict'

const fs = require('node:fs')
const path = require('node:path')

// 与 src/theme-renderer.ts 完全一致的常量（避免跨包 import）
const PANDA_PET_STATES = [
  'error',
  'notification',
  'sweeping',
  'attention',
  'juggling',
  'carrying',
  'working',
  'thinking',
  'waking',
  'idle',
  'dozing',
  'sleeping',
]

const PANDA_SPECIES = [
  'duck',
  'goose',
  'blob',
  'cat',
  'dragon',
  'octopus',
  'owl',
  'penguin',
  'turtle',
  'snail',
  'ghost',
  'axolotl',
  'capybara',
  'cactus',
  'robot',
  'rabbit',
  'mushroom',
  'chonk',
]

// 颜色调色板 — 取 panda Matrix 主题（cyan/magenta/yellow/white/golden）
// 各 state 映射不同颜色，便于视觉区分。
const STATE_COLORS = {
  error: '#ff3366',
  notification: '#ffcc00',
  sweeping: '#88ccff',
  attention: '#ffaa00',
  juggling: '#cc88ff',
  carrying: '#88ff88',
  working: '#00ccff',
  thinking: '#ffff66',
  waking: '#ffaaaa',
  idle: '#ffffff',
  dozing: '#aaaaaa',
  sleeping: '#666688',
}

// SVG viewBox & 字符尺寸（与 theme.json::viewBox 一致：200×100，但本 sprite 用 200×200 留 padding）
const SVG_VIEWBOX_W = 200
const SVG_VIEWBOX_H = 200
const FONT_SIZE = 12 // px in SVG units
const LINE_HEIGHT = 14
const PADDING_TOP = 30
const PADDING_LEFT = 20
const FRAME_SEPARATOR_RE = /^---\s*$/

const PKG_ROOT = path.resolve(__dirname, '..')
const SPRITES_DIR = path.join(PKG_ROOT, 'themes', 'panda', 'sprites')

const HTML_ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}
function escapeXml(s) {
  return String(s).replace(/[&<>"']/g, (c) => HTML_ESCAPES[c])
}

function parseAsciiSprite(text) {
  const lines = text.split(/\r?\n/)
  const frames = []
  let current = []
  for (const line of lines) {
    if (FRAME_SEPARATOR_RE.test(line)) {
      frames.push(trimFrame(current))
      current = []
      continue
    }
    if (line.startsWith('#')) continue
    current.push(line)
  }
  if (current.length > 0) frames.push(trimFrame(current))
  return frames.filter((f) => f.length > 0)
}

function trimFrame(lines) {
  let start = 0
  let end = lines.length
  while (start < end && lines[start].trim() === '') start++
  while (end > start && lines[end - 1].trim() === '') end--
  return lines.slice(start, end)
}

/**
 * 把单帧 ASCII 行数组渲染成 SVG <text> + <tspan dy>。
 * eyePlaceholder {E} 默认替换为 "·"。
 */
function frameToSvgText(frameLines, color) {
  const tspans = frameLines.map((rawLine, i) => {
    const line = rawLine.split('{E}').join('\u00b7') // ·
    const dy = i === 0 ? 0 : LINE_HEIGHT
    return `    <tspan x="${PADDING_LEFT}" dy="${dy}">${escapeXml(line)}</tspan>`
  })
  return [
    `  <text x="${PADDING_LEFT}" y="${PADDING_TOP}" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="${FONT_SIZE}" fill="${color}" xml:space="preserve">`,
    ...tspans,
    `  </text>`,
  ].join('\n')
}

/**
 * 给定 species 帧数组 + 状态名，生成一个 <g id="state-{state}"> 分组。
 * 选哪一帧：state 哈希 → frame 索引（稳定可复现，无随机）。
 */
function buildStateGroup(state, frames) {
  // state 哈希 → frame 索引：稳定、可复现
  const idx = stateHash(state) % frames.length
  const frame = frames[idx]
  const color = STATE_COLORS[state] || '#ffffff'
  const visibility = state === 'idle' ? 'visible' : 'hidden'
  return [
    `  <g id="state-${state}" data-state="${state}" data-frame-idx="${idx}" visibility="${visibility}">`,
    frameToSvgText(frame, color)
      .split('\n')
      .map((l) => '  ' + l)
      .join('\n'),
    `  </g>`,
  ].join('\n')
}

function stateHash(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0
  }
  return h
}

/**
 * 主入口：读 species.ascii → 写 species.svg
 */
function buildOneSpecies(species) {
  const asciiPath = path.join(SPRITES_DIR, `${species}.ascii`)
  if (!fs.existsSync(asciiPath)) {
    console.warn(`[skip] ${species}.ascii not found`)
    return null
  }
  const text = fs.readFileSync(asciiPath, 'utf8')
  const frames = parseAsciiSprite(text)
  if (frames.length === 0) {
    console.warn(`[skip] ${species}.ascii has 0 frames`)
    return null
  }

  const groups = PANDA_PET_STATES.map((state) =>
    buildStateGroup(state, frames),
  ).join('\n')

  const svg = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<!--`,
    `  Input: themes/panda/sprites/${species}.ascii (${frames.length} frames, programmatically embedded)`,
    `  Output: panda 物种 ${species} SVG sprite — 12 PetState groups (visibility 切换)`,
    `  Pos: panda-on-desk Phase 3 P3-T5 美术资产 — 由 scripts/build-sprites.cjs 程序化生成`,
    `       不要手改本文件 — 重跑脚本会覆盖。改动 ASCII 数据源后重新生成。`,
    `-->`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SVG_VIEWBOX_W} ${SVG_VIEWBOX_H}" width="${SVG_VIEWBOX_W}" height="${SVG_VIEWBOX_H}" data-species="${species}" data-frames="${frames.length}">`,
    `  <rect width="${SVG_VIEWBOX_W}" height="${SVG_VIEWBOX_H}" fill="transparent"/>`,
    groups,
    `</svg>`,
    ``,
  ].join('\n')

  const outPath = path.join(SPRITES_DIR, `${species}.svg`)
  fs.writeFileSync(outPath, svg, 'utf8')
  return { species, outPath, frameCount: frames.length, groupCount: PANDA_PET_STATES.length }
}

function main() {
  console.log('[panda-on-desk · P3-T5] building 18 species SVG sprites...')
  const results = []
  for (const sp of PANDA_SPECIES) {
    const r = buildOneSpecies(sp)
    if (r) results.push(r)
  }
  // 同时为 default 兜底也生成一份
  const def = buildOneSpecies('default')
  if (def) results.push(def)

  console.log(`[ok] generated ${results.length} SVG files into themes/panda/sprites/`)
  for (const r of results) {
    console.log(
      `     - ${path.basename(r.outPath)} (${r.frameCount} frames × ${r.groupCount} state groups)`,
    )
  }
}

if (require.main === module) {
  main()
}

module.exports = {
  PANDA_PET_STATES,
  PANDA_SPECIES,
  STATE_COLORS,
  parseAsciiSprite,
  frameToSvgText,
  buildStateGroup,
  buildOneSpecies,
}
