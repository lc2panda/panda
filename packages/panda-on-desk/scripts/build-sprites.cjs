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

// [W4-T2-ART 20260419] 14 物种特征图形配色 — 每物种主色 / 副色 / 强调色
// 用于 linearGradient + drop-shadow + 顶部高光 + 物种特征 path/circle/ellipse。
// 参考 W1-T2 panda hit.html 的 3D 球面效果。
const SPECIES_PALETTE = {
  goose:    { primary: '#f5f5f5', secondary: '#d8d8d8', accent: '#ff9933' },
  blob:     { primary: '#7ec8ff', secondary: '#3a9bdc', accent: '#ffffff' },
  cat:      { primary: '#f7c987', secondary: '#c89254', accent: '#ff7799' },
  dragon:   { primary: '#7fdc6f', secondary: '#3a9b2c', accent: '#ffd700' },
  octopus:  { primary: '#cc66cc', secondary: '#8b3a8b', accent: '#ffccff' },
  penguin:  { primary: '#1a1a1a', secondary: '#666666', accent: '#ffaa00' },
  turtle:   { primary: '#5fbf5f', secondary: '#2d8b2d', accent: '#8b6f3a' },
  snail:    { primary: '#e6c98e', secondary: '#a87f3a', accent: '#7fc97f' },
  ghost:    { primary: '#e0e6ff', secondary: '#9aa3c0', accent: '#ffffff' },
  axolotl:  { primary: '#ffb3d9', secondary: '#d97aa8', accent: '#ff66b3' },
  capybara: { primary: '#a87a4a', secondary: '#6b4a2a', accent: '#3a2a1a' },
  cactus:   { primary: '#5fa85f', secondary: '#2d7a2d', accent: '#ffe066' },
  rabbit:   { primary: '#f5f0e8', secondary: '#c9c0b0', accent: '#ff99aa' },
  mushroom: { primary: '#d94a4a', secondary: '#9a2828', accent: '#fffaeb' },
}

// 是否为 W4-T2 升级物种（带特征图形）
function isW4Species(species) {
  return Object.prototype.hasOwnProperty.call(SPECIES_PALETTE, species)
}

/**
 * 物种特征图形片段 — 程序化拼装基础形状（circle/ellipse/path/polygon），
 * 体现物种特征（goose 长脖 / blob 滴水 / cat 三角耳 / dragon 翅膀 / 等）。
 * 所有几何放在 viewBox 200×200 中央（cx=100, body 在 80~160 区间），
 * 与现有 ASCII text（左上 padding 20/30）错开，避免视觉冲突。
 * 每个 SVG 片段含：底层主体（fill="url(#bodyGrad-{species})"）+ 物种特征 +
 * 顶部高光椭圆（fill="#ffffff" fill-opacity="0.4"）。
 */
const SPECIES_GRAPHICS = {
  goose: () => `
      <ellipse cx="110" cy="160" rx="34" ry="20" fill="url(#bodyGrad-goose)" stroke="#888" stroke-width="1"/>
      <path d="M 100 145 Q 92 110 110 90 Q 130 78 138 88" fill="none" stroke="url(#bodyGrad-goose)" stroke-width="14" stroke-linecap="round"/>
      <circle cx="138" cy="86" r="9" fill="url(#bodyGrad-goose)"/>
      <polygon points="146,84 162,86 146,92" fill="#ff9933"/>
      <circle cx="140" cy="84" r="1.6" fill="#1a1a1a"/>
      <ellipse cx="100" cy="150" rx="18" ry="6" fill="#ffffff" fill-opacity="0.4"/>
    `,
  blob: () => `
      <path d="M 70 110 Q 60 160 100 170 Q 140 160 130 110 Q 122 90 100 88 Q 78 90 70 110 Z" fill="url(#bodyGrad-blob)" stroke="#3a9bdc" stroke-width="1"/>
      <circle cx="88" cy="125" r="5" fill="#1a1a1a"/>
      <circle cx="112" cy="125" r="5" fill="#1a1a1a"/>
      <circle cx="89" cy="123" r="1.8" fill="#ffffff"/>
      <circle cx="113" cy="123" r="1.8" fill="#ffffff"/>
      <path d="M 92 142 Q 100 148 108 142" fill="none" stroke="#1a1a1a" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M 100 175 Q 100 182 96 184 Q 100 186 100 180 Z" fill="url(#bodyGrad-blob)"/>
      <ellipse cx="98" cy="100" rx="20" ry="7" fill="#ffffff" fill-opacity="0.4"/>
    `,
  cat: () => `
      <polygon points="70,90 80,68 92,90" fill="url(#bodyGrad-cat)" stroke="#a36a3a" stroke-width="1"/>
      <polygon points="108,90 120,68 130,90" fill="url(#bodyGrad-cat)" stroke="#a36a3a" stroke-width="1"/>
      <polygon points="76,86 80,76 86,86" fill="#ff7799"/>
      <polygon points="114,86 120,76 124,86" fill="#ff7799"/>
      <ellipse cx="100" cy="125" rx="38" ry="32" fill="url(#bodyGrad-cat)" stroke="#a36a3a" stroke-width="1"/>
      <circle cx="86" cy="120" r="5" fill="#1a1a1a"/>
      <circle cx="114" cy="120" r="5" fill="#1a1a1a"/>
      <circle cx="87" cy="118" r="1.8" fill="#ffffff"/>
      <circle cx="115" cy="118" r="1.8" fill="#ffffff"/>
      <polygon points="96,132 100,138 104,132" fill="#ff7799"/>
      <path d="M 92 142 Q 100 148 108 142" fill="none" stroke="#1a1a1a" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M 70 130 L 60 128 M 70 134 L 60 134 M 70 138 L 60 142" stroke="#1a1a1a" stroke-width="0.9"/>
      <path d="M 130 130 L 140 128 M 130 134 L 140 134 M 130 138 L 140 142" stroke="#1a1a1a" stroke-width="0.9"/>
      <ellipse cx="92" cy="105" rx="24" ry="6" fill="#ffffff" fill-opacity="0.4"/>
    `,
  dragon: () => `
      <path d="M 50 110 Q 30 90 50 80 Q 70 100 70 120 Z" fill="url(#bodyGrad-dragon)" stroke="#2d8b2d" stroke-width="1"/>
      <path d="M 150 110 Q 170 90 150 80 Q 130 100 130 120 Z" fill="url(#bodyGrad-dragon)" stroke="#2d8b2d" stroke-width="1"/>
      <ellipse cx="100" cy="125" rx="32" ry="28" fill="url(#bodyGrad-dragon)" stroke="#2d8b2d" stroke-width="1"/>
      <polygon points="80,100 86,90 92,100" fill="#2d8b2d"/>
      <polygon points="108,100 114,90 120,100" fill="#2d8b2d"/>
      <circle cx="88" cy="118" r="5" fill="#ffd700"/>
      <circle cx="112" cy="118" r="5" fill="#ffd700"/>
      <ellipse cx="89" cy="117" rx="1.6" ry="3" fill="#1a1a1a"/>
      <ellipse cx="113" cy="117" rx="1.6" ry="3" fill="#1a1a1a"/>
      <path d="M 88 138 Q 100 144 112 138 L 110 142 L 100 146 L 90 142 Z" fill="#1a1a1a"/>
      <path d="M 100 150 Q 100 165 90 175" fill="none" stroke="url(#bodyGrad-dragon)" stroke-width="6" stroke-linecap="round"/>
      <ellipse cx="92" cy="105" rx="22" ry="6" fill="#ffffff" fill-opacity="0.4"/>
    `,
  octopus: () => `
      <ellipse cx="100" cy="105" rx="38" ry="34" fill="url(#bodyGrad-octopus)" stroke="#8b3a8b" stroke-width="1"/>
      <circle cx="86" cy="105" r="6" fill="#ffffff"/>
      <circle cx="114" cy="105" r="6" fill="#ffffff"/>
      <circle cx="87" cy="106" r="2.6" fill="#1a1a1a"/>
      <circle cx="115" cy="106" r="2.6" fill="#1a1a1a"/>
      <path d="M 94 122 Q 100 128 106 122" fill="none" stroke="#1a1a1a" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M 70 138 Q 64 158 70 175" stroke="url(#bodyGrad-octopus)" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M 84 142 Q 80 162 86 178" stroke="url(#bodyGrad-octopus)" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M 100 144 Q 100 166 100 180" stroke="url(#bodyGrad-octopus)" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M 116 142 Q 120 162 114 178" stroke="url(#bodyGrad-octopus)" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M 130 138 Q 136 158 130 175" stroke="url(#bodyGrad-octopus)" stroke-width="6" fill="none" stroke-linecap="round"/>
      <ellipse cx="92" cy="84" rx="24" ry="7" fill="#ffffff" fill-opacity="0.4"/>
    `,
  penguin: () => `
      <ellipse cx="100" cy="135" rx="30" ry="40" fill="url(#bodyGrad-penguin)" stroke="#000" stroke-width="1"/>
      <ellipse cx="100" cy="142" rx="20" ry="30" fill="#ffffff"/>
      <circle cx="100" cy="92" r="22" fill="url(#bodyGrad-penguin)" stroke="#000" stroke-width="1"/>
      <circle cx="91" cy="89" r="3.6" fill="#ffffff"/>
      <circle cx="109" cy="89" r="3.6" fill="#ffffff"/>
      <circle cx="91" cy="89" r="1.8" fill="#1a1a1a"/>
      <circle cx="109" cy="89" r="1.8" fill="#1a1a1a"/>
      <polygon points="94,98 100,108 106,98" fill="#ffaa00"/>
      <polygon points="78,170 90,178 88,184 76,180" fill="#ffaa00"/>
      <polygon points="122,170 110,178 112,184 124,180" fill="#ffaa00"/>
      <ellipse cx="92" cy="78" rx="14" ry="4" fill="#ffffff" fill-opacity="0.4"/>
    `,
  turtle: () => `
      <ellipse cx="100" cy="135" rx="44" ry="30" fill="url(#bodyGrad-turtle)" stroke="#2d8b2d" stroke-width="1.5"/>
      <path d="M 80 125 L 90 118 L 100 125 L 110 118 L 120 125 M 80 145 L 90 152 L 100 145 L 110 152 L 120 145 M 100 122 L 100 148" stroke="#2d8b2d" stroke-width="1" fill="none"/>
      <circle cx="100" cy="135" r="6" fill="none" stroke="#2d8b2d" stroke-width="1"/>
      <circle cx="148" cy="138" r="14" fill="#8b6f3a" stroke="#5a4a26" stroke-width="1"/>
      <circle cx="153" cy="135" r="2.4" fill="#1a1a1a"/>
      <ellipse cx="58" cy="148" rx="10" ry="6" fill="#8b6f3a"/>
      <ellipse cx="142" cy="160" rx="10" ry="6" fill="#8b6f3a"/>
      <path d="M 60 140 Q 50 145 56 152" stroke="#8b6f3a" stroke-width="6" stroke-linecap="round" fill="none"/>
      <ellipse cx="92" cy="115" rx="26" ry="6" fill="#ffffff" fill-opacity="0.4"/>
    `,
  snail: () => `
      <ellipse cx="120" cy="155" rx="40" ry="14" fill="url(#bodyGrad-snail)" stroke="#a87f3a" stroke-width="1"/>
      <circle cx="100" cy="125" r="34" fill="url(#bodyGrad-snail)" stroke="#7fc97f" stroke-width="1.5"/>
      <path d="M 100 125 m 0 -28 a 28 28 0 1 1 -0.1 0 m 4 4 a 22 22 0 1 1 -0.1 0 m 4 4 a 16 16 0 1 1 -0.1 0 m 4 4 a 10 10 0 1 1 -0.1 0" fill="none" stroke="#5a8a5a" stroke-width="1.4"/>
      <circle cx="158" cy="148" r="7" fill="url(#bodyGrad-snail)"/>
      <circle cx="156" cy="148" r="2" fill="#1a1a1a"/>
      <path d="M 160 142 Q 168 130 168 122" stroke="#a87f3a" stroke-width="2" fill="none" stroke-linecap="round"/>
      <circle cx="168" cy="120" r="2.4" fill="#1a1a1a"/>
      <path d="M 152 145 Q 162 132 164 124" stroke="#a87f3a" stroke-width="2" fill="none" stroke-linecap="round"/>
      <circle cx="164" cy="122" r="2.4" fill="#1a1a1a"/>
      <ellipse cx="92" cy="105" rx="22" ry="6" fill="#ffffff" fill-opacity="0.4"/>
    `,
  ghost: () => `
      <path d="M 70 105 Q 70 70 100 70 Q 130 70 130 105 L 130 165 L 122 175 L 116 165 L 108 175 L 100 165 L 92 175 L 84 165 L 78 175 L 70 165 Z" fill="url(#bodyGrad-ghost)" fill-opacity="0.85" stroke="#9aa3c0" stroke-width="1"/>
      <ellipse cx="88" cy="108" rx="6" ry="8" fill="#1a1a1a"/>
      <ellipse cx="112" cy="108" rx="6" ry="8" fill="#1a1a1a"/>
      <ellipse cx="89" cy="106" rx="2" ry="3" fill="#ffffff"/>
      <ellipse cx="113" cy="106" rx="2" ry="3" fill="#ffffff"/>
      <ellipse cx="100" cy="130" rx="8" ry="6" fill="#1a1a1a" fill-opacity="0.7"/>
      <ellipse cx="92" cy="86" rx="22" ry="7" fill="#ffffff" fill-opacity="0.5"/>
    `,
  axolotl: () => `
      <ellipse cx="100" cy="135" rx="42" ry="26" fill="url(#bodyGrad-axolotl)" stroke="#d97aa8" stroke-width="1"/>
      <circle cx="100" cy="105" r="26" fill="url(#bodyGrad-axolotl)" stroke="#d97aa8" stroke-width="1"/>
      <circle cx="90" cy="102" r="3.6" fill="#1a1a1a"/>
      <circle cx="110" cy="102" r="3.6" fill="#1a1a1a"/>
      <circle cx="90.6" cy="100.6" r="1.4" fill="#ffffff"/>
      <circle cx="110.6" cy="100.6" r="1.4" fill="#ffffff"/>
      <path d="M 94 114 Q 100 118 106 114" fill="none" stroke="#a85088" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M 74 92 Q 60 86 56 96 Q 60 102 74 100 Z" fill="#ff66b3" stroke="#d04088" stroke-width="0.8"/>
      <path d="M 74 100 Q 58 98 54 108 Q 60 114 74 108 Z" fill="#ff66b3" stroke="#d04088" stroke-width="0.8"/>
      <path d="M 126 92 Q 140 86 144 96 Q 140 102 126 100 Z" fill="#ff66b3" stroke="#d04088" stroke-width="0.8"/>
      <path d="M 126 100 Q 142 98 146 108 Q 140 114 126 108 Z" fill="#ff66b3" stroke="#d04088" stroke-width="0.8"/>
      <path d="M 142 142 Q 158 140 160 150 Q 154 158 142 154 Z" fill="url(#bodyGrad-axolotl)"/>
      <ellipse cx="92" cy="88" rx="22" ry="6" fill="#ffffff" fill-opacity="0.4"/>
    `,
  capybara: () => `
      <ellipse cx="100" cy="138" rx="48" ry="32" fill="url(#bodyGrad-capybara)" stroke="#6b4a2a" stroke-width="1"/>
      <ellipse cx="80" cy="118" rx="22" ry="20" fill="url(#bodyGrad-capybara)" stroke="#6b4a2a" stroke-width="1"/>
      <ellipse cx="74" cy="104" rx="6" ry="5" fill="#3a2a1a"/>
      <ellipse cx="92" cy="104" rx="6" ry="5" fill="#3a2a1a"/>
      <circle cx="74" cy="113" r="2.4" fill="#1a1a1a"/>
      <circle cx="84" cy="113" r="2.4" fill="#1a1a1a"/>
      <ellipse cx="68" cy="124" rx="6" ry="4" fill="#3a2a1a"/>
      <path d="M 64 124 L 64 130 M 70 124 L 70 132" stroke="#fff" stroke-width="1.4"/>
      <ellipse cx="78" cy="166" rx="6" ry="4" fill="#3a2a1a"/>
      <ellipse cx="120" cy="166" rx="6" ry="4" fill="#3a2a1a"/>
      <ellipse cx="100" cy="118" rx="28" ry="8" fill="#ffffff" fill-opacity="0.4"/>
    `,
  cactus: () => `
      <rect x="86" y="100" width="28" height="68" rx="14" fill="url(#bodyGrad-cactus)" stroke="#2d7a2d" stroke-width="1"/>
      <path d="M 86 130 Q 70 130 68 116 Q 68 102 78 102 L 78 122 L 86 122 Z" fill="url(#bodyGrad-cactus)" stroke="#2d7a2d" stroke-width="1"/>
      <path d="M 114 138 Q 130 138 132 124 Q 132 110 122 110 L 122 130 L 114 130 Z" fill="url(#bodyGrad-cactus)" stroke="#2d7a2d" stroke-width="1"/>
      <path d="M 100 100 L 100 96 M 92 110 L 88 108 M 108 110 L 112 108 M 92 130 L 88 132 M 108 130 L 112 132 M 92 150 L 88 148 M 108 150 L 112 148 M 100 168 L 100 164" stroke="#1a4a1a" stroke-width="1.4" stroke-linecap="round"/>
      <circle cx="100" cy="96" r="5" fill="#ffe066" stroke="#cc9933" stroke-width="0.8"/>
      <circle cx="100" cy="96" r="2" fill="#ff6699"/>
      <circle cx="92" cy="120" r="2" fill="#1a1a1a"/>
      <circle cx="108" cy="120" r="2" fill="#1a1a1a"/>
      <path d="M 96 134 Q 100 138 104 134" fill="none" stroke="#1a1a1a" stroke-width="1.2" stroke-linecap="round"/>
      <ellipse cx="92" cy="106" rx="10" ry="4" fill="#ffffff" fill-opacity="0.4"/>
    `,
  rabbit: () => `
      <ellipse cx="86" cy="80" rx="8" ry="26" fill="url(#bodyGrad-rabbit)" stroke="#c9c0b0" stroke-width="1"/>
      <ellipse cx="114" cy="80" rx="8" ry="26" fill="url(#bodyGrad-rabbit)" stroke="#c9c0b0" stroke-width="1"/>
      <ellipse cx="86" cy="84" rx="3.6" ry="18" fill="#ff99aa"/>
      <ellipse cx="114" cy="84" rx="3.6" ry="18" fill="#ff99aa"/>
      <ellipse cx="100" cy="130" rx="32" ry="30" fill="url(#bodyGrad-rabbit)" stroke="#c9c0b0" stroke-width="1"/>
      <circle cx="88" cy="124" r="4.8" fill="#1a1a1a"/>
      <circle cx="112" cy="124" r="4.8" fill="#1a1a1a"/>
      <circle cx="89" cy="122" r="1.6" fill="#ffffff"/>
      <circle cx="113" cy="122" r="1.6" fill="#ffffff"/>
      <ellipse cx="100" cy="138" rx="3" ry="2" fill="#ff99aa"/>
      <path d="M 100 140 L 100 146 M 96 146 Q 100 148 104 146" fill="none" stroke="#1a1a1a" stroke-width="1.2" stroke-linecap="round"/>
      <circle cx="138" cy="158" r="8" fill="url(#bodyGrad-rabbit)"/>
      <ellipse cx="92" cy="110" rx="20" ry="6" fill="#ffffff" fill-opacity="0.4"/>
    `,
  mushroom: () => `
      <path d="M 50 110 Q 50 60 100 60 Q 150 60 150 110 Q 150 118 142 118 L 58 118 Q 50 118 50 110 Z" fill="url(#bodyGrad-mushroom)" stroke="#9a2828" stroke-width="1"/>
      <circle cx="76" cy="86" r="8" fill="#fffaeb"/>
      <circle cx="120" cy="80" r="10" fill="#fffaeb"/>
      <circle cx="100" cy="100" r="6" fill="#fffaeb"/>
      <circle cx="64" cy="106" r="5" fill="#fffaeb"/>
      <circle cx="134" cy="104" r="6" fill="#fffaeb"/>
      <rect x="84" y="118" width="32" height="50" rx="8" fill="#fffaeb" stroke="#c9b990" stroke-width="1"/>
      <circle cx="92" cy="138" r="3.6" fill="#1a1a1a"/>
      <circle cx="108" cy="138" r="3.6" fill="#1a1a1a"/>
      <path d="M 94 150 Q 100 154 106 150" fill="none" stroke="#1a1a1a" stroke-width="1.2" stroke-linecap="round"/>
      <ellipse cx="90" cy="74" rx="26" ry="8" fill="#ffffff" fill-opacity="0.4"/>
    `,
}

/**
 * 生成物种特定 linearGradient（bodyGrad-{species}）— 注入 <defs>。
 * 仅 W4-T2 升级物种使用；其它走旧 spriteAccent。
 */
function buildSpeciesGradient(species) {
  const pal = SPECIES_PALETTE[species]
  if (!pal) return ''
  return [
    `    <linearGradient id="bodyGrad-${species}" x1="0%" y1="0%" x2="0%" y2="100%">`,
    `      <stop offset="0%"  stop-color="${pal.primary}" stop-opacity="1"/>`,
    `      <stop offset="100%" stop-color="${pal.secondary}" stop-opacity="1"/>`,
    `    </linearGradient>`,
  ].join('\n')
}

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
function buildStateGroup(state, frames, species) {
  // state 哈希 → frame 索引：稳定、可复现
  const idx = stateHash(state) % frames.length
  const frame = frames[idx]
  const color = STATE_COLORS[state] || '#ffffff'
  const visibility = state === 'idle' ? 'visible' : 'hidden'

  // [W4-T2-ART 20260419] W4 升级物种额外注入特征图形 + 顶部高光（fill-opacity:0.4）。
  // 旧 5 物种（duck/robot/owl/chonk/default）保持 byte-equal — 不动。
  const graphicFn = species && SPECIES_GRAPHICS[species]
  const graphicSvg = graphicFn ? graphicFn(state).trim() : ''
  const graphicBlock = graphicSvg
    ? `\n    <g class="species-art" opacity="0.92">\n      ${graphicSvg.split('\n').map((l) => l.trim()).filter(Boolean).join('\n      ')}\n    </g>`
    : ''

  return [
    `  <g id="state-${state}" data-state="${state}" data-frame-idx="${idx}" visibility="${visibility}">`,
    frameToSvgText(frame, color)
      .split('\n')
      .map((l) => '  ' + l)
      .join('\n') + graphicBlock,
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
    buildStateGroup(state, frames, species),
  ).join('\n')

  // [W1-T2-ART 20260419] 渐变 + drop-shadow filter — 所有物种 SVG 共享 defs，让 ASCII 体也"立体"。
  // 不动 <text>/<tspan> 排布；仅在容器层注入 <defs> + 顶层 <g filter="url(#spriteShadow)">
  // [W4-T2-ART 20260419] W4 升级物种额外注入物种特定 linearGradient（bodyGrad-{species}）。
  const speciesGrad = buildSpeciesGradient(species)
  const defs = [
    `  <defs>`,
    `    <linearGradient id="spriteAccent" x1="0%" y1="0%" x2="0%" y2="100%">`,
    `      <stop offset="0%"  stop-color="#ffffff" stop-opacity="0.95"/>`,
    `      <stop offset="100%" stop-color="#cfcfff" stop-opacity="0.7"/>`,
    `    </linearGradient>`,
    ...(speciesGrad ? [speciesGrad] : []),
    `    <filter id="spriteShadow" x="-15%" y="-15%" width="130%" height="130%">`,
    `      <feGaussianBlur in="SourceAlpha" stdDeviation="1.4"/>`,
    `      <feOffset dx="0" dy="2" result="off"/>`,
    `      <feComponentTransfer><feFuncA type="linear" slope="0.5"/></feComponentTransfer>`,
    `      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>`,
    `    </filter>`,
    `  </defs>`,
  ].join('\n')

  // W6-T4 bundle 优化：BUILD_SPRITES_MINIFY=1 (默认) → 去注释 + 合并空白
  // 削减 ~25% 文件体积；非 minify 模式仍保留头注释便于人工 diff（dev/CI 可显式 BUILD_SPRITES_MINIFY=0）
  const minify = process.env.BUILD_SPRITES_MINIFY !== '0'

  const svgLines = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
  ]
  if (!minify) {
    svgLines.push(
      `<!--`,
      `  Input: themes/panda/sprites/${species}.ascii (${frames.length} frames, programmatically embedded)`,
      `  Output: panda 物种 ${species} SVG sprite — 12 PetState groups (visibility 切换) + 渐变 + drop-shadow`,
      `  Pos: panda-on-desk Phase 3 P3-T5 美术资产 — 由 scripts/build-sprites.cjs 程序化生成`,
      `       [W1-T2-ART 20260419] linearGradient + filter(drop-shadow) 注入 — 不要手改本文件，重跑脚本会覆盖。`,
      `-->`,
    )
  }
  svgLines.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SVG_VIEWBOX_W} ${SVG_VIEWBOX_H}" width="${SVG_VIEWBOX_W}" height="${SVG_VIEWBOX_H}" data-species="${species}" data-frames="${frames.length}">`,
    defs,
    `  <rect width="${SVG_VIEWBOX_W}" height="${SVG_VIEWBOX_H}" fill="transparent"/>`,
    `  <g filter="url(#spriteShadow)">`,
    groups,
    `  </g>`,
    `</svg>`,
    ``,
  )
  let svg = svgLines.join('\n')

  if (minify) {
    // 安全 minify — 不破坏 <text>/<tspan> 内容（ASCII 字符 + 等宽布局）；
    // 仅压缩元素间多余空白与换行（XML pretty-print artifact）。
    svg = minifySvgPreservingText(svg)
  }

  const outPath = path.join(SPRITES_DIR, `${species}.svg`)
  fs.writeFileSync(outPath, svg, 'utf8')
  return { species, outPath, frameCount: frames.length, groupCount: PANDA_PET_STATES.length }
}

/**
 * W6-T4 — 安全 SVG minifier。
 * - 保留 <text>/<tspan>/<title>/<desc> 内文本（ASCII 等宽布局敏感）
 * - 压缩元素间换行 + 缩进空白
 * - 去掉 <!-- ... --> 注释（XML 注释允许，但占字节）
 * - 不动属性引号（兼容已存在的 stop-color/fill 等）
 * 输出 byte-stable（同输入 → 同输出）便于 git diff 审查。
 */
function minifySvgPreservingText(input) {
  // 1. 保护 <text>...</text>（含 <tspan>）→ 占位
  const TEXT_RE = /<text\b[^>]*>[\s\S]*?<\/text>/g
  const placeholders = []
  let out = input.replace(TEXT_RE, (match) => {
    const idx = placeholders.length
    placeholders.push(match)
    return `\u0000TEXT_${idx}\u0000`
  })
  // 2. 去 XML 注释（保留 <?xml ... ?> declaration）
  out = out.replace(/<!--[\s\S]*?-->/g, '')
  // 3. 合并行间空白：把 ">\n   <" 折叠为 "><"
  out = out.replace(/>\s+</g, '><')
  // 4. 行首/行尾空白清理（防止合并后单行残留缩进）
  out = out.replace(/^\s+/gm, '').replace(/\s+$/gm, '')
  // 5. 多余空行去除
  out = out.replace(/\n+/g, '\n').trim() + '\n'
  // 6. 还原 <text> 占位
  out = out.replace(/\u0000TEXT_(\d+)\u0000/g, (_, i) => placeholders[Number(i)])
  return out
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
  SPECIES_PALETTE,
  SPECIES_GRAPHICS,
  isW4Species,
  parseAsciiSprite,
  frameToSvgText,
  buildStateGroup,
  buildSpeciesGradient,
  buildOneSpecies,
}
