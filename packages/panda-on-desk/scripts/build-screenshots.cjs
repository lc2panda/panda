#!/usr/bin/env node
// Input: build/icons/panda.svg + 7 状态 SVG 模板（脚本内嵌）
// Output: build/screenshots/ 下 9 张 PNG —
//          · panda-200x200-{idle,thinking,working,sleeping,error,attention,notification}.png  (7 状态)
//          · panda-hero-1200x600.png  (README hero — 桌面占位 + panda + badge + 等级 banner)
//          · panda-demo-600x400.png   (demo — 中等尺寸 + watermark + state badge)
// Pos: panda-on-desk W6-T1 README 视觉化 — sharp 程序化渲染（与 build-icons.cjs 同源用法）。
//       sharp ^0.34.5 已是主仓库 root 依赖；不引入新依赖。
//
// 用法：
//   cd packages/panda-on-desk && node scripts/build-screenshots.cjs
//   cd packages/panda-on-desk && node scripts/build-screenshots.cjs --check  # 干跑
//
// [NEW-FILE:#W6-02]
// [W10-T2 视觉升级 20260420] 9 PNG 视觉精致化：
//   · panda 形象层加多层光照/阴影/腮红高光（与 hit.html 一致）
//   · 7 状态加 rounded-rect 状态文字标注 + 地面 shadow ellipse + 状态独有装饰加层
//   · hero 1200×600 加更精细桌面背景（双窗口/dock 图标/状态栏文本）+ 7 状态浮窗
//   · demo 600×400 加宠物 + 状态 badge + Lv 角标 + watermark 多层
//   严守 anthropic byte-equal 与 0 新依赖（仍用已有 sharp）

'use strict'

const fs = require('node:fs')
const path = require('node:path')

const PKG_ROOT = path.resolve(__dirname, '..')
const SCREENSHOTS_DIR = path.join(PKG_ROOT, 'build', 'screenshots')
const ICONS_DIR = path.join(PKG_ROOT, 'build', 'icons')

const STATES = [
  'idle',
  'thinking',
  'working',
  'sleeping',
  'error',
  'attention',
  'notification',
]

// 状态 → 装饰元素配置（与 hit.html .deco-* 视觉对齐）
// emoji / 颜色 / 摆放位置 / 标注大写文字 — 用于生成静态状态截图
const STATE_DECO = {
  idle: { emoji: '', color: '#9aa0a6', label: 'idle', display: 'IDLE', accent: '#9aa0a6' },
  thinking: { emoji: '?', color: '#ffff66', label: 'thinking', display: 'THINKING', accent: '#ffd84d' },
  working: { emoji: '\u2699', color: '#66ccff', label: 'working', display: 'WORKING', accent: '#66ccff' },
  sleeping: { emoji: 'Z', color: '#aacbff', label: 'sleeping', display: 'SLEEPING', accent: '#aacbff' },
  error: { emoji: '\u2715', color: '#ff3366', label: 'error', display: 'ERROR', accent: '#ff3366' },
  attention: { emoji: '!', color: '#ffaa00', label: 'attention', display: 'ATTENTION', accent: '#ff8c00' },
  notification: { emoji: '\u{1F514}', color: '#ffcc00', label: 'notification', display: 'NOTIFY', accent: '#ffcc00' },
}

const args = process.argv.slice(2)
const DRY = args.includes('--check') || args.includes('--dry-run')

function tryRequireSharp() {
  // sharp 在 monorepo 主仓库 root node_modules（与 build-icons.cjs 一致的回退链）
  const candidates = [
    path.resolve(__dirname, '..', '..', '..', 'node_modules', 'sharp'),
    path.resolve(__dirname, '..', 'node_modules', 'sharp'),
    'sharp',
  ]
  let lastErr
  for (const c of candidates) {
    try {
      return require(c)
    } catch (err) {
      lastErr = err
    }
  }
  throw lastErr || new Error('sharp not found')
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

// ─────────────────────────────────────────────────────────────────
// 通用 SVG 片段：精致 panda 形象（与 hit.html 1:1 同源）
// 输出 200×200 viewBox 内的 panda（不含装饰/标签）
// 接受可选 transform 字符串（如 rotate）
// ─────────────────────────────────────────────────────────────────
function pandaFaceFragment(opts) {
  const o = opts || {}
  const transform = o.transform ? ` transform="${o.transform}"` : ''
  const eyeMode = o.eyeMode || 'open' // open | closed | x
  const noseGrad = o.noseGrad || 'gradNose'
  const earGrad = o.earGrad || 'gradEar'
  const maskGrad = o.maskGrad || 'gradMask'
  const faceGrad = o.faceGrad || 'gradFace'
  const softShadow = o.softShadow ? ` filter="url(#${o.softShadow})"` : ''
  const faceShadow = o.faceShadow ? ` filter="url(#${o.faceShadow})"` : ''

  const eyes =
    eyeMode === 'closed'
      ? `<path d="M 68 100 Q 75 104 82 100" stroke="#0a0a0a" stroke-width="2.4" fill="none" stroke-linecap="round"/>
         <path d="M 118 100 Q 125 104 132 100" stroke="#0a0a0a" stroke-width="2.4" fill="none" stroke-linecap="round"/>`
      : eyeMode === 'x'
        ? `<path d="M 70 95 L 80 105 M 80 95 L 70 105" stroke="#ff3366" stroke-width="2.6" stroke-linecap="round"/>
           <path d="M 120 95 L 130 105 M 130 95 L 120 105" stroke="#ff3366" stroke-width="2.6" stroke-linecap="round"/>`
        : `<circle cx="75" cy="100" r="5.5" fill="#ffffff"/>
           <circle cx="125" cy="100" r="5.5" fill="#ffffff"/>
           <circle cx="76" cy="101" r="2.8" fill="#0a0a0a"/>
           <circle cx="126" cy="101" r="2.8" fill="#0a0a0a"/>
           <circle cx="77.5" cy="99" r="1" fill="#ffffff"/>
           <circle cx="127.5" cy="99" r="1" fill="#ffffff"/>`

  return `<g${transform}>
    <ellipse cx="55"  cy="55" rx="22" ry="26" fill="url(#${earGrad})"${softShadow}/>
    <ellipse cx="145" cy="55" rx="22" ry="26" fill="url(#${earGrad})"${softShadow}/>
    <ellipse cx="55"  cy="58" rx="11" ry="13" fill="#2a2a2a" opacity="0.85"/>
    <ellipse cx="145" cy="58" rx="11" ry="13" fill="#2a2a2a" opacity="0.85"/>
    <circle cx="100" cy="105" r="65" fill="url(#${faceGrad})" stroke="#1a1a1a" stroke-width="2.5"${faceShadow}/>
    <ellipse cx="86" cy="68" rx="32" ry="14" fill="#ffffff" fill-opacity="0.4"/>
    <ellipse cx="80" cy="62" rx="14" ry="6"  fill="#ffffff" fill-opacity="0.6"/>
    <ellipse cx="75"  cy="100" rx="16" ry="20" fill="url(#${maskGrad})" transform="rotate(-15 75 100)"${softShadow}/>
    <ellipse cx="125" cy="100" rx="16" ry="20" fill="url(#${maskGrad})" transform="rotate(15 125 100)"${softShadow}/>
    ${eyes}
    <ellipse cx="100" cy="125" rx="6.5" ry="4.5" fill="url(#${noseGrad})"${softShadow}/>
    <ellipse cx="98"  cy="123.5" rx="1.4" ry="1.0" fill="#5a5a5a" opacity="0.9"/>
    <path d="M100 130 L 100 135 M100 135 Q92 142 85 138 M100 135 Q108 142 115 138" stroke="#1a1a1a" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <ellipse cx="62"  cy="122" rx="7" ry="3.5" fill="#ffc0c8" opacity="0.55"/>
    <ellipse cx="138" cy="122" rx="7" ry="3.5" fill="#ffc0c8" opacity="0.55"/>
  </g>`
}

// 通用 defs（精致渐变 + 多层 filter）
function commonDefs(suffix) {
  const s = suffix || ''
  return `<defs>
    <linearGradient id="gradEar${s}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"  stop-color="#3a3a3a"/>
      <stop offset="60%" stop-color="#1a1a1a"/>
      <stop offset="100%" stop-color="#0a0a0a"/>
    </linearGradient>
    <linearGradient id="gradMask${s}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"  stop-color="#2a2a2a"/>
      <stop offset="100%" stop-color="#0d0d0d"/>
    </linearGradient>
    <radialGradient id="gradFace${s}" cx="50%" cy="38%" r="62%">
      <stop offset="0%"  stop-color="#ffffff"/>
      <stop offset="70%" stop-color="#f4f4f4"/>
      <stop offset="100%" stop-color="#d8d8d8"/>
    </radialGradient>
    <radialGradient id="gradNose${s}" cx="40%" cy="35%" r="65%">
      <stop offset="0%"  stop-color="#3a3a3a"/>
      <stop offset="100%" stop-color="#0a0a0a"/>
    </radialGradient>
    <linearGradient id="goldGrad${s}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"  stop-color="#FFE060"/>
      <stop offset="50%" stop-color="#FFD700"/>
      <stop offset="100%" stop-color="#C8A100"/>
    </linearGradient>
    <filter id="filtSoftShadow${s}" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="1.2"/>
      <feOffset dx="0" dy="1.5" result="off"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.45"/></feComponentTransfer>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="filtFaceShadow${s}" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
      <feOffset dx="0" dy="3" result="off"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.35"/></feComponentTransfer>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="filtGlow${s}" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>`
}

// ─────────────────────────────────────────────────────────────────
// SVG 模板：7 状态 panda（200×200，含装饰 + 文字标注 + 地面影）
// ─────────────────────────────────────────────────────────────────
function buildStateSvg(state) {
  const deco = STATE_DECO[state] || STATE_DECO.idle
  const eyeMode = state === 'sleeping' ? 'closed' : state === 'error' ? 'x' : 'open'
  const faceTransform = state === 'error' ? 'rotate(20 100 110)' : ''

  // 装饰 emoji 摆放（与 hit.html state CSS 位置近似）+ 增强效果
  let decoMarkup = ''
  if (state === 'thinking') {
    decoMarkup =
      `<g filter="url(#filtGlow)">
         <text x="155" y="42" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="34" fill="${deco.color}" font-weight="bold">${deco.emoji}</text>
         <text x="178" y="22" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="18" fill="${deco.color}" font-weight="bold" opacity="0.65">${deco.emoji}</text>
       </g>`
  } else if (state === 'working') {
    decoMarkup =
      `<g filter="url(#filtGlow)">
         <text x="155" y="42" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="30" fill="${deco.color}" font-weight="bold">${deco.emoji}</text>
         <text x="22" y="50" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="20" fill="${deco.color}" font-weight="bold" opacity="0.55">${deco.emoji}</text>
       </g>`
  } else if (state === 'sleeping') {
    decoMarkup =
      `<g filter="url(#filtGlow)">
         <text x="160" y="50" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="26" fill="${deco.color}" font-weight="bold">${deco.emoji}</text>
         <text x="172" y="30" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="20" fill="${deco.color}" font-weight="bold" opacity="0.7">${deco.emoji}</text>
         <text x="184" y="14" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="14" fill="${deco.color}" font-weight="bold" opacity="0.45">${deco.emoji}</text>
       </g>`
  } else if (state === 'attention') {
    decoMarkup =
      `<g filter="url(#filtGlow)">
         <circle cx="100" cy="26" r="14" fill="${deco.color}" opacity="0.25"/>
         <text x="100" y="34" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="28" fill="${deco.color}" font-weight="bold" text-anchor="middle">${deco.emoji}</text>
       </g>`
  } else if (state === 'notification') {
    decoMarkup =
      `<g filter="url(#filtGlow)">
         <text x="100" y="36" font-size="30" fill="${deco.color}" text-anchor="middle">${deco.emoji}</text>
         <circle cx="118" cy="20" r="6" fill="#ff2244" stroke="#ffffff" stroke-width="1.5"/>
         <text x="118" y="24" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="8" fill="#ffffff" text-anchor="middle" font-weight="bold">3</text>
       </g>`
  } else if (state === 'error') {
    decoMarkup =
      `<g filter="url(#filtGlow)">
         <text x="100" y="22" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="20" fill="${deco.color}" text-anchor="middle" font-weight="bold">${deco.emoji}</text>
       </g>`
  }

  // 状态文字标注：rounded-rect badge 居底部（不再是细字）
  // 与状态 accent color 配色，便于人工识别
  // 同时保留 data-state="${label}" 属性（小写 label）便于回归测试与外部工具检索
  const labelMarkup =
    `<g data-state="${deco.label}">
       <rect x="62" y="178" width="76" height="16" rx="8" ry="8" fill="${deco.accent}" fill-opacity="0.15" stroke="${deco.accent}" stroke-width="1"/>
       <text x="100" y="190" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="10" fill="${deco.accent}" text-anchor="middle" font-weight="bold" letter-spacing="1.5">${deco.display}</text>
     </g>`

  // 地面阴影椭圆（仅在 panda 下方，强化"立"的感觉）
  const groundShadow =
    `<ellipse cx="100" cy="172" rx="46" ry="6" fill="#000000" fill-opacity="0.18"/>`

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  ${commonDefs('')}
  <!-- 透明背景，仅渲染 panda 形象 + 装饰 + 标注 -->
  ${groundShadow}
  ${pandaFaceFragment({
    transform: faceTransform,
    eyeMode,
    softShadow: 'filtSoftShadow',
    faceShadow: 'filtFaceShadow',
  })}
  ${decoMarkup}
  ${labelMarkup}
</svg>`
}

// ─────────────────────────────────────────────────────────────────
// SVG 模板：HERO（1200×600）
// 桌面占位（深色 mac 风窗 + dock + 第二个 IDE 窗）+ panda 居中 + 状态 badge + Lv banner
// + 7 状态浮窗缩略
// ─────────────────────────────────────────────────────────────────
function buildHeroSvg() {
  // 7 状态浮窗缩略（小型 panda 头像 + 状态名）
  let stateStripMarkup = ''
  for (let i = 0; i < STATES.length; i++) {
    const st = STATES[i]
    const d = STATE_DECO[st]
    const x = 60 + i * 162
    const y = 540
    stateStripMarkup += `
      <g transform="translate(${x}, ${y})">
        <rect x="0" y="0" width="148" height="44" rx="6" ry="6" fill="rgba(255,255,255,0.04)" stroke="${d.accent}" stroke-width="1" stroke-opacity="0.6"/>
        <circle cx="22" cy="22" r="14" fill="${d.accent}" opacity="0.18"/>
        <text x="22" y="27" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="14" fill="${d.color}" text-anchor="middle" font-weight="bold">${d.emoji || '\u2022'}</text>
        <text x="44" y="20" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="11" fill="${d.accent}" font-weight="bold" letter-spacing="1">${d.display}</text>
        <text x="44" y="34" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="9" fill="#9aa0a6">${d.label}</text>
      </g>`
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600" viewBox="0 0 1200 600">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"  stop-color="#0a0c12"/>
      <stop offset="50%" stop-color="#141826"/>
      <stop offset="100%" stop-color="#1c1f29"/>
    </linearGradient>
    <linearGradient id="winGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"  stop-color="#2b2f3b"/>
      <stop offset="100%" stop-color="#1a1d26"/>
    </linearGradient>
    <linearGradient id="dockGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"  stop-color="#33384a" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#1a1d26" stop-opacity="0.6"/>
    </linearGradient>
    <linearGradient id="goldGradH" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"  stop-color="#FFE060"/>
      <stop offset="50%" stop-color="#FFD700"/>
      <stop offset="100%" stop-color="#C8A100"/>
    </linearGradient>
    <linearGradient id="gradEar" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"  stop-color="#3a3a3a"/>
      <stop offset="100%" stop-color="#0a0a0a"/>
    </linearGradient>
    <linearGradient id="gradMask" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"  stop-color="#2a2a2a"/>
      <stop offset="100%" stop-color="#0d0d0d"/>
    </linearGradient>
    <radialGradient id="gradFace" cx="50%" cy="38%" r="62%">
      <stop offset="0%"  stop-color="#ffffff"/>
      <stop offset="70%" stop-color="#f4f4f4"/>
      <stop offset="100%" stop-color="#d8d8d8"/>
    </radialGradient>
    <radialGradient id="gradNose" cx="40%" cy="35%" r="65%">
      <stop offset="0%"  stop-color="#3a3a3a"/>
      <stop offset="100%" stop-color="#0a0a0a"/>
    </radialGradient>
    <filter id="heroShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="8"/>
      <feOffset dx="0" dy="10" result="off"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.55"/></feComponentTransfer>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="petGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="6"/>
      <feOffset dx="0" dy="6" result="off"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.5"/></feComponentTransfer>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="filtSoftShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="1.2"/>
      <feOffset dx="0" dy="1.5" result="off"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.45"/></feComponentTransfer>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="filtFaceShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
      <feOffset dx="0" dy="3" result="off"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.35"/></feComponentTransfer>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <pattern id="bgDots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="0.8" fill="#ffffff" fill-opacity="0.04"/>
    </pattern>
  </defs>

  <!-- 桌面背景（深色渐变 + 微点阵） -->
  <rect width="1200" height="600" fill="url(#bgGrad)"/>
  <rect width="1200" height="600" fill="url(#bgDots)"/>

  <!-- 顶部菜单栏（mac 风） -->
  <rect x="0" y="0" width="1200" height="24" fill="#0a0c12" opacity="0.85"/>
  <text x="14" y="16" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="11" fill="#9aa0a6">\uF8FF  panda  File  Edit  View  Window  Help</text>
  <text x="1186" y="16" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="11" fill="#9aa0a6" text-anchor="end">100% \u2022 EN \u2022 09:42</text>

  <!-- 桌面占位：mac 风窗 — 终端 (主) -->
  <g filter="url(#heroShadow)">
    <rect x="40" y="60" width="640" height="450" rx="14" ry="14" fill="url(#winGrad)" stroke="#3a3f4f" stroke-width="1.5"/>
    <rect x="40" y="60" width="640" height="36" rx="14" ry="14" fill="#252836"/>
    <rect x="40" y="80" width="640" height="16" fill="#252836"/>
    <circle cx="64"  cy="78" r="6" fill="#ff5f56"/>
    <circle cx="86"  cy="78" r="6" fill="#ffbd2e"/>
    <circle cx="108" cy="78" r="6" fill="#27c93f"/>
    <text x="360" y="83" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="12" fill="#888" text-anchor="middle">panda \u2014 zsh \u2014 110\u00d732</text>

    <!-- 终端内容（语法高亮风） -->
    <text x="60" y="128" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="13" fill="#7ee787">$ panda</text>
    <text x="60" y="150" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="12" fill="#79c0ff">[panda] booting AI terminal assistant...</text>
    <text x="60" y="172" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="12" fill="#cccccc">[panda-on-desk] hit window ready</text>
    <text x="60" y="194" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="12" fill="#cccccc">[panda-on-desk] tray installed \u00b7 DND off</text>
    <text x="60" y="216" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="12" fill="#cccccc">[buddy] companion: panda \u00b7 level 12 \u00b7 rare</text>
    <text x="60" y="246" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="13" fill="#f4f4f4">&gt; help me refactor the auth module</text>
    <text x="60" y="276" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="12" fill="#a5d6ff">[claude-opus-4-7] thinking...</text>
    <text x="60" y="298" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="12" fill="#a5d6ff">  \u251c\u2500\u2500 analyzing src/services/oauth/...</text>
    <text x="60" y="320" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="12" fill="#a5d6ff">  \u251c\u2500\u2500 17 files scanned \u00b7 0 issues</text>
    <text x="60" y="342" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="12" fill="#a5d6ff">  \u2514\u2500\u2500 plan ready: 4 steps \u00b7 12 min</text>
    <text x="60" y="372" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="12" fill="#7ee787">[panda] \u2713 done \u00b7 review proposal above</text>
    <text x="60" y="402" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="12" fill="#FFD700">[buddy] +24 XP \u00b7 Lv 12 \u2192 Lv 13!</text>
    <text x="60" y="432" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="12" fill="#cccccc">[notification] bell \u00b7 3 unread</text>
    <text x="60" y="468" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="12" fill="#7ee787">$ <tspan fill="#f4f4f4">_</tspan></text>
  </g>

  <!-- 第二个窗口：editor (副) -->
  <g filter="url(#heroShadow)">
    <rect x="700" y="40" width="440" height="280" rx="12" ry="12" fill="#1f2230" stroke="#3a3f4f" stroke-width="1.2"/>
    <rect x="700" y="40" width="440" height="28" rx="12" ry="12" fill="#2a2e3e"/>
    <rect x="700" y="56" width="440" height="12" fill="#2a2e3e"/>
    <circle cx="720" cy="56" r="5" fill="#ff5f56"/>
    <circle cx="738" cy="56" r="5" fill="#ffbd2e"/>
    <circle cx="756" cy="56" r="5" fill="#27c93f"/>
    <text x="920" y="60" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="10" fill="#888" text-anchor="middle">auth.ts \u2014 panda</text>
    <!-- 行号 -->
    <text x="710" y="92"  font-family="ui-monospace, Menlo, Consolas, monospace" font-size="10" fill="#555">1</text>
    <text x="710" y="108" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="10" fill="#555">2</text>
    <text x="710" y="124" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="10" fill="#555">3</text>
    <text x="710" y="140" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="10" fill="#555">4</text>
    <text x="710" y="156" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="10" fill="#555">5</text>
    <text x="710" y="172" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="10" fill="#555">6</text>
    <text x="710" y="188" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="10" fill="#555">7</text>
    <text x="710" y="204" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="10" fill="#555">8</text>
    <text x="710" y="220" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="10" fill="#555">9</text>
    <!-- 代码 (语法着色) -->
    <text x="730" y="92"  font-family="ui-monospace, Menlo, Consolas, monospace" font-size="11" fill="#c678dd">import</text>
    <text x="780" y="92"  font-family="ui-monospace, Menlo, Consolas, monospace" font-size="11" fill="#abb2bf"> { OAuthClient } </text>
    <text x="900" y="92"  font-family="ui-monospace, Menlo, Consolas, monospace" font-size="11" fill="#c678dd">from</text>
    <text x="934" y="92"  font-family="ui-monospace, Menlo, Consolas, monospace" font-size="11" fill="#98c379"> './client'</text>
    <text x="730" y="124" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="11" fill="#c678dd">export async function</text>
    <text x="876" y="124" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="11" fill="#61afef"> authorize</text>
    <text x="945" y="124" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="11" fill="#abb2bf">() {</text>
    <text x="746" y="140" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="11" fill="#c678dd">  const</text>
    <text x="788" y="140" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="11" fill="#e06c75"> client</text>
    <text x="826" y="140" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="11" fill="#abb2bf"> = </text>
    <text x="846" y="140" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="11" fill="#c678dd">new</text>
    <text x="870" y="140" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="11" fill="#61afef"> OAuthClient</text>
    <text x="950" y="140" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="11" fill="#abb2bf">()</text>
    <text x="746" y="156" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="11" fill="#c678dd">  return</text>
    <text x="790" y="156" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="11" fill="#abb2bf"> client.</text>
    <text x="838" y="156" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="11" fill="#61afef">authorize</text>
    <text x="900" y="156" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="11" fill="#abb2bf">()</text>
    <text x="730" y="172" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="11" fill="#abb2bf">}</text>
    <text x="730" y="204" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="11" fill="#5c6370">// panda assistant suggested:</text>
    <text x="730" y="220" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="11" fill="#5c6370">// extract token cache to redis</text>
  </g>

  <!-- panda 桌面宠物（右侧浮窗）— 拖拽阴影 + 状态 badge + Lv banner -->
  <!-- y=300 抬高 30px 给底部 7 状态条带让位 -->
  <g transform="translate(900, 300)" filter="url(#petGlow)">
    <ellipse cx="100" cy="218" rx="78" ry="11" fill="#000000" fill-opacity="0.5"/>
    ${pandaFaceFragment({
      eyeMode: 'open',
      softShadow: 'filtSoftShadow',
      faceShadow: 'filtFaceShadow',
    })}
    <!-- 右上角红圆 badge（未读 3 通知） -->
    <circle cx="172" cy="28" r="13" fill="#ff2244" stroke="#ffffff" stroke-width="2"/>
    <text x="172" y="33" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="12" fill="#ffffff" text-anchor="middle" font-weight="bold">3</text>
    <!-- 头顶 Lv 12 banner + XP 进度条 -->
    <g transform="translate(60, -8)">
      <rect x="0" y="0" width="80" height="14" rx="3" ry="3" fill="rgba(0,0,0,0.65)" stroke="rgba(255,215,0,0.5)" stroke-width="0.5"/>
      <text x="6" y="11" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="10" fill="url(#goldGradH)" font-weight="bold">Lv 12</text>
      <rect x="0" y="16" width="80" height="4" rx="2" ry="2" fill="rgba(255,255,255,0.15)"/>
      <rect x="0" y="16" width="52" height="4" rx="2" ry="2" fill="url(#goldGradH)"/>
      <text x="80" y="11" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="9" fill="#9aa0a6" text-anchor="end" opacity="0.85">RARE</text>
    </g>
    <!-- 状态 badge — panda 右侧（避开底部 state strip） -->
    <g transform="translate(190, 96)">
      <rect x="0" y="0" width="100" height="20" rx="10" ry="10" fill="rgba(255,215,0,0.18)" stroke="#FFD700" stroke-width="1.2"/>
      <circle cx="12" cy="10" r="4" fill="#FFD700"/>
      <text x="55" y="14" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="10" fill="#FFD700" text-anchor="middle" font-weight="bold" letter-spacing="1.8">THINKING</text>
    </g>
    <!-- 头顶 thinking 装饰（与状态一致） -->
    <text x="170" y="40" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="28" fill="#ffff66" font-weight="bold">?</text>
  </g>

  <!-- 标题 + 副标题（左下角，便于阅读） -->
  <g>
    <text x="40" y="492" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="26" fill="url(#goldGradH)" font-weight="bold" letter-spacing="2">panda-on-desk</text>
    <text x="40" y="514" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="12" fill="#9aa0a6">AI terminal assistant \u00b7 desktop pet \u00b7 7 states \u00b7 18 species \u00b7 103 notifications</text>
  </g>

  <!-- 7 状态浮窗缩略带（下方 dock 区） -->
  ${stateStripMarkup}
</svg>`
}

// ─────────────────────────────────────────────────────────────────
// SVG 模板：DEMO（600×400）
// 加宠物 + 状态 badge + Lv 角标 + watermark 多层
// ─────────────────────────────────────────────────────────────────
function buildDemoSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <defs>
    <linearGradient id="bgGradD" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"  stop-color="#0a0c14"/>
      <stop offset="50%" stop-color="#171b28"/>
      <stop offset="100%" stop-color="#1f2330"/>
    </linearGradient>
    <linearGradient id="gradEar" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"  stop-color="#3a3a3a"/>
      <stop offset="60%" stop-color="#1a1a1a"/>
      <stop offset="100%" stop-color="#0a0a0a"/>
    </linearGradient>
    <linearGradient id="gradMask" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"  stop-color="#2a2a2a"/>
      <stop offset="100%" stop-color="#0d0d0d"/>
    </linearGradient>
    <radialGradient id="gradFace" cx="50%" cy="38%" r="62%">
      <stop offset="0%"  stop-color="#ffffff"/>
      <stop offset="70%" stop-color="#f4f4f4"/>
      <stop offset="100%" stop-color="#d8d8d8"/>
    </radialGradient>
    <radialGradient id="gradNose" cx="40%" cy="35%" r="65%">
      <stop offset="0%"  stop-color="#3a3a3a"/>
      <stop offset="100%" stop-color="#0a0a0a"/>
    </radialGradient>
    <linearGradient id="goldGradD" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"  stop-color="#FFE060"/>
      <stop offset="50%" stop-color="#FFD700"/>
      <stop offset="100%" stop-color="#C8A100"/>
    </linearGradient>
    <filter id="demoShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="6"/>
      <feOffset dx="0" dy="6" result="off"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.5"/></feComponentTransfer>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="filtSoftShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="1.2"/>
      <feOffset dx="0" dy="1.5" result="off"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.45"/></feComponentTransfer>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="filtFaceShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
      <feOffset dx="0" dy="3" result="off"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.35"/></feComponentTransfer>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <pattern id="demoDots" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="0.6" fill="#ffffff" fill-opacity="0.05"/>
    </pattern>
  </defs>

  <rect width="600" height="400" fill="url(#bgGradD)"/>
  <rect width="600" height="400" fill="url(#demoDots)"/>

  <!-- 中央 panda 200×200 缩 -->
  <g transform="translate(200, 60)" filter="url(#demoShadow)">
    <ellipse cx="100" cy="178" rx="60" ry="9" fill="#000000" fill-opacity="0.45"/>
    ${pandaFaceFragment({
      eyeMode: 'open',
      softShadow: 'filtSoftShadow',
      faceShadow: 'filtFaceShadow',
    })}
    <!-- 右上 红圆 badge -->
    <circle cx="172" cy="28" r="12" fill="#ff2244" stroke="#ffffff" stroke-width="1.8"/>
    <text x="172" y="33" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="11" fill="#ffffff" text-anchor="middle" font-weight="bold">3</text>
    <!-- Lv 12 角标 -->
    <g transform="translate(60, -6)">
      <rect x="0" y="0" width="80" height="14" rx="3" ry="3" fill="rgba(0,0,0,0.65)" stroke="rgba(255,215,0,0.5)" stroke-width="0.5"/>
      <text x="6" y="11" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="10" fill="url(#goldGradD)" font-weight="bold">Lv 12</text>
      <rect x="0" y="16" width="80" height="4" rx="2" ry="2" fill="rgba(255,255,255,0.15)"/>
      <rect x="0" y="16" width="52" height="4" rx="2" ry="2" fill="url(#goldGradD)"/>
    </g>
    <!-- 头顶 thinking 装饰 -->
    <text x="158" y="40" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="26" fill="#ffff66" font-weight="bold">?</text>
  </g>

  <!-- 状态 badge — panda 下方 rounded rect -->
  <g transform="translate(240, 268)">
    <rect x="0" y="0" width="120" height="22" rx="11" ry="11" fill="rgba(255,215,0,0.16)" stroke="#FFD700" stroke-width="1.2"/>
    <circle cx="14" cy="11" r="4" fill="#FFD700"/>
    <text x="64" y="15" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="11" fill="#FFD700" text-anchor="middle" font-weight="bold" letter-spacing="2">THINKING</text>
  </g>

  <!-- 标题 + watermark -->
  <text x="300" y="320" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="22" fill="url(#goldGradD)" text-anchor="middle" font-weight="bold" letter-spacing="2">panda-on-desk</text>
  <text x="300" y="342" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="11" fill="#9aa0a6" text-anchor="middle">desktop companion \u00b7 7 states \u00b7 18 species \u00b7 103 notifications</text>
  <text x="300" y="360" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="9" fill="#5c6370" text-anchor="middle" opacity="0.85">draggable \u2022 transparent \u2022 cross-platform</text>
  <!-- watermark（右下角，半透明） -->
  <text x="588" y="388" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="9" fill="#FFD700" text-anchor="end" opacity="0.55" letter-spacing="1">github.com/lc2panda/panda-code</text>
</svg>`
}

// ─────────────────────────────────────────────────────────────────
// 渲染：SVG buffer → PNG file（指定尺寸；保留透明背景或加底色由 SVG 自带 rect 决定）
// ─────────────────────────────────────────────────────────────────
async function renderSvgToPng(sharp, svgString, outPath, width, height, opts) {
  const { transparent } = opts || {}
  const svgBuffer = Buffer.from(svgString, 'utf8')
  const background = transparent
    ? { r: 0, g: 0, b: 0, alpha: 0 }
    : { r: 0, g: 0, b: 0, alpha: 1 }
  // density: 192（高于默认 72）— 矢量缩放清晰；对 SVG 自带 width/height 影响较小但保险
  await sharp(svgBuffer, { density: 192 })
    .resize(width, height, { fit: 'contain', background })
    .png({ compressionLevel: 9 })
    .toFile(outPath)
}

async function main() {
  console.log(
    `[panda-on-desk · W6-T1 / W10-T2] building screenshots${DRY ? ' (DRY RUN)' : ''}...`,
  )

  if (!DRY) ensureDir(SCREENSHOTS_DIR)

  let sharp
  try {
    sharp = tryRequireSharp()
  } catch (err) {
    console.error(`[fatal] sharp not loadable: ${err.message}`)
    console.error(`[fatal] please install sharp at workspace root (^0.34.5)`)
    process.exit(1)
  }

  const summary = []

  // 1) 7 状态 sprite（200×200，透明背景）
  for (const state of STATES) {
    const svg = buildStateSvg(state)
    const outName = `panda-200x200-${state}.png`
    const outPath = path.join(SCREENSHOTS_DIR, outName)
    if (DRY) {
      summary.push({ name: outName, dry: true })
      continue
    }
    try {
      await renderSvgToPng(sharp, svg, outPath, 200, 200, { transparent: true })
      const stat = fs.statSync(outPath)
      summary.push({ name: outName, bytes: stat.size })
      console.log(`  -> ${outName} (${(stat.size / 1024).toFixed(1)} KB)`)
    } catch (err) {
      console.error(`[err] render ${outName}: ${err.message}`)
    }
  }

  // 2) HERO（1200×600，深色背景）
  {
    const svg = buildHeroSvg()
    const outName = `panda-hero-1200x600.png`
    const outPath = path.join(SCREENSHOTS_DIR, outName)
    if (DRY) {
      summary.push({ name: outName, dry: true })
    } else {
      try {
        await renderSvgToPng(sharp, svg, outPath, 1200, 600, {
          transparent: false,
        })
        const stat = fs.statSync(outPath)
        summary.push({ name: outName, bytes: stat.size })
        console.log(`  -> ${outName} (${(stat.size / 1024).toFixed(1)} KB)`)
      } catch (err) {
        console.error(`[err] render ${outName}: ${err.message}`)
      }
    }
  }

  // 3) DEMO（600×400，深色背景 + watermark）
  {
    const svg = buildDemoSvg()
    const outName = `panda-demo-600x400.png`
    const outPath = path.join(SCREENSHOTS_DIR, outName)
    if (DRY) {
      summary.push({ name: outName, dry: true })
    } else {
      try {
        await renderSvgToPng(sharp, svg, outPath, 600, 400, {
          transparent: false,
        })
        const stat = fs.statSync(outPath)
        summary.push({ name: outName, bytes: stat.size })
        console.log(`  -> ${outName} (${(stat.size / 1024).toFixed(1)} KB)`)
      } catch (err) {
        console.error(`[err] render ${outName}: ${err.message}`)
      }
    }
  }

  console.log(`[ok] screenshot build summary: ${summary.length} file(s)`)
  if (!DRY) {
    const undersized = summary.filter((s) => s.bytes && s.bytes < 1024)
    const oversized = summary.filter((s) => s.bytes && s.bytes > 200 * 1024)
    if (undersized.length > 0) {
      console.warn(
        `[warn] ${undersized.length} file(s) < 1KB — may be invalid:`,
        undersized.map((s) => s.name),
      )
    }
    if (oversized.length > 0) {
      console.warn(
        `[warn] ${oversized.length} file(s) > 200KB — repo bloat:`,
        oversized.map((s) => s.name),
      )
    }
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('[fatal]', err)
    process.exit(1)
  })
}

module.exports = {
  STATES,
  STATE_DECO,
  SCREENSHOTS_DIR,
  buildStateSvg,
  buildHeroSvg,
  buildDemoSvg,
  pandaFaceFragment,
  commonDefs,
  renderSvgToPng,
  tryRequireSharp,
}
