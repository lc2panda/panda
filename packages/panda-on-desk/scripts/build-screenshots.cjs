#!/usr/bin/env node
// Input: build/icons/panda.svg + 7 状态 SVG 模板（脚本内嵌）
// Output: build/screenshots/ 下 9 张 PNG —
//          · panda-200x200-{idle,thinking,working,sleeping,error,attention,notification}.png  (7 状态)
//          · panda-hero-1200x600.png  (README hero — 桌面占位 + panda + badge + 等级 banner)
//          · panda-demo-600x400.png   (demo — 中等尺寸 + watermark)
// Pos: panda-on-desk W6-T1 README 视觉化 — sharp 程序化渲染（与 build-icons.cjs 同源用法）。
//       sharp ^0.34.5 已是主仓库 root 依赖；不引入新依赖。
//
// 用法：
//   cd packages/panda-on-desk && node scripts/build-screenshots.cjs
//   cd packages/panda-on-desk && node scripts/build-screenshots.cjs --check  # 干跑
//
// [NEW-FILE:#W6-02]

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
// emoji / 颜色 / 摆放位置 — 用于生成静态状态截图
const STATE_DECO = {
  idle: { emoji: '', color: '#888', label: 'idle' },
  thinking: { emoji: '?', color: '#ffff66', label: 'thinking' },
  working: { emoji: '⚙', color: '#66ccff', label: 'working' },
  sleeping: { emoji: 'Z', color: '#aacbff', label: 'sleeping' },
  error: { emoji: '✕', color: '#ff3366', label: 'error' },
  attention: { emoji: '!', color: '#ffaa00', label: 'attention' },
  notification: { emoji: '🔔', color: '#ffcc00', label: 'notification' },
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
// SVG 模板：7 状态 panda（200×200，含装饰）
// 设计：基于 build/icons/panda.svg 的 face geometry，但 viewBox 200×200
// ─────────────────────────────────────────────────────────────────
function buildStateSvg(state) {
  const deco = STATE_DECO[state] || STATE_DECO.idle
  // sleeping → 闭眼线；error → X 眼；其它 → 圆瞳孔
  const eyes =
    state === 'sleeping'
      ? `<path d="M 68 100 Q 75 104 82 100" stroke="#0a0a0a" stroke-width="2.4" fill="none" stroke-linecap="round"/>
         <path d="M 118 100 Q 125 104 132 100" stroke="#0a0a0a" stroke-width="2.4" fill="none" stroke-linecap="round"/>`
      : state === 'error'
        ? `<text x="75" y="106" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="14" fill="#ff3366" text-anchor="middle" font-weight="bold">x</text>
           <text x="125" y="106" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="14" fill="#ff3366" text-anchor="middle" font-weight="bold">x</text>`
        : `<circle cx="75" cy="100" r="5.5" fill="#ffffff"/>
           <circle cx="125" cy="100" r="5.5" fill="#ffffff"/>
           <circle cx="76" cy="101" r="2.8" fill="#0a0a0a"/>
           <circle cx="126" cy="101" r="2.8" fill="#0a0a0a"/>
           <circle cx="77.5" cy="99" r="1" fill="#ffffff"/>
           <circle cx="127.5" cy="99" r="1" fill="#ffffff"/>`

  // 装饰 emoji 摆放（与 hit.html state CSS 位置近似）
  const decoMarkup =
    state === 'thinking'
      ? `<text x="155" y="40" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="32" fill="${deco.color}" font-weight="bold" text-shadow="0 1px 2px rgba(0,0,0,0.5)">${deco.emoji}</text>`
      : state === 'working'
        ? `<text x="155" y="42" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="28" fill="${deco.color}" font-weight="bold">${deco.emoji}</text>`
        : state === 'sleeping'
          ? `<text x="160" y="50" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="26" fill="${deco.color}" font-weight="bold">${deco.emoji}</text>
             <text x="170" y="32" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="18" fill="${deco.color}" font-weight="bold" opacity="0.7">${deco.emoji}</text>`
          : state === 'attention'
            ? `<text x="100" y="32" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="34" fill="${deco.color}" font-weight="bold" text-anchor="middle">${deco.emoji}</text>`
            : state === 'notification'
              ? `<text x="100" y="34" font-size="28" fill="${deco.color}" text-anchor="middle">${deco.emoji}</text>`
              : ''

  // 状态标签（左下角小字，便于人工识别）
  const labelMarkup = `<text x="100" y="195" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="11" fill="#666" text-anchor="middle" font-weight="bold" letter-spacing="1">${deco.label}</text>`

  // error 状态：face 旋转 30deg（摔倒）
  const faceTransform = state === 'error' ? 'transform="rotate(20 100 110)"' : ''

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <defs>
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
  </defs>
  <!-- 透明背景，仅渲染 panda 形象 + 装饰 -->
  <g ${faceTransform}>
    <!-- 黑耳 -->
    <ellipse cx="55"  cy="55" rx="22" ry="26" fill="url(#gradEar)" filter="url(#filtSoftShadow)"/>
    <ellipse cx="145" cy="55" rx="22" ry="26" fill="url(#gradEar)" filter="url(#filtSoftShadow)"/>
    <ellipse cx="55"  cy="58" rx="11" ry="13" fill="#2a2a2a" opacity="0.85"/>
    <ellipse cx="145" cy="58" rx="11" ry="13" fill="#2a2a2a" opacity="0.85"/>
    <!-- 白头 -->
    <circle cx="100" cy="105" r="65" fill="url(#gradFace)" stroke="#1a1a1a" stroke-width="2.5" filter="url(#filtFaceShadow)"/>
    <!-- 顶部高光 -->
    <ellipse cx="86" cy="68" rx="32" ry="14" fill="#ffffff" fill-opacity="0.4"/>
    <ellipse cx="80" cy="62" rx="14" ry="6"  fill="#ffffff" fill-opacity="0.6"/>
    <!-- 黑眼罩 -->
    <ellipse cx="75"  cy="100" rx="16" ry="20" fill="url(#gradMask)" transform="rotate(-15 75 100)" filter="url(#filtSoftShadow)"/>
    <ellipse cx="125" cy="100" rx="16" ry="20" fill="url(#gradMask)" transform="rotate(15 125 100)" filter="url(#filtSoftShadow)"/>
    <!-- 眼 -->
    ${eyes}
    <!-- 鼻 -->
    <ellipse cx="100" cy="125" rx="6.5" ry="4.5" fill="url(#gradNose)" filter="url(#filtSoftShadow)"/>
    <ellipse cx="98"  cy="123.5" rx="1.4" ry="1.0" fill="#5a5a5a" opacity="0.9"/>
    <!-- 嘴 -->
    <path d="M100 130 L 100 135 M100 135 Q92 142 85 138 M100 135 Q108 142 115 138" stroke="#1a1a1a" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <!-- 腮红 -->
    <ellipse cx="62"  cy="122" rx="7" ry="3.5" fill="#ffc0c8" opacity="0.55"/>
    <ellipse cx="138" cy="122" rx="7" ry="3.5" fill="#ffc0c8" opacity="0.55"/>
  </g>
  <!-- 装饰层（不旋转） -->
  ${decoMarkup}
  ${labelMarkup}
</svg>`
}

// ─────────────────────────────────────────────────────────────────
// SVG 模板：HERO（1200×600）
// 桌面占位（深色 mac 风窗 + dock）+ panda 居中 + 状态 badge + Lv banner
// ─────────────────────────────────────────────────────────────────
function buildHeroSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600" viewBox="0 0 1200 600">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"  stop-color="#0f1014"/>
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
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
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
    <radialGradient id="gradFaceH" cx="50%" cy="38%" r="62%">
      <stop offset="0%"  stop-color="#ffffff"/>
      <stop offset="70%" stop-color="#f4f4f4"/>
      <stop offset="100%" stop-color="#d8d8d8"/>
    </radialGradient>
    <filter id="heroShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="8"/>
      <feOffset dx="0" dy="10" result="off"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.55"/></feComponentTransfer>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- 桌面背景（深色渐变） -->
  <rect width="1200" height="600" fill="url(#bgGrad)"/>

  <!-- 桌面占位：mac 风窗 — 圆角 + 标题栏 + 红黄绿圆点（左侧，模拟 IDE / 终端） -->
  <g filter="url(#heroShadow)">
    <rect x="60" y="80" width="640" height="440" rx="14" ry="14" fill="url(#winGrad)" stroke="#3a3f4f" stroke-width="1.5"/>
    <!-- 标题栏 -->
    <rect x="60" y="80" width="640" height="36" rx="14" ry="14" fill="#252836"/>
    <rect x="60" y="100" width="640" height="16" fill="#252836"/>
    <!-- 红黄绿圆点（macOS 窗控） -->
    <circle cx="84"  cy="98" r="6" fill="#ff5f56"/>
    <circle cx="106" cy="98" r="6" fill="#ffbd2e"/>
    <circle cx="128" cy="98" r="6" fill="#27c93f"/>
    <text x="380" y="103" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="12" fill="#888" text-anchor="middle">panda — terminal</text>

    <!-- 终端内容占位（panda CLI 启动 ASCII 行） -->
    <text x="84" y="148" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="13" fill="#7ee787">$ panda</text>
    <text x="84" y="170" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="12" fill="#79c0ff">[panda] booting AI terminal assistant...</text>
    <text x="84" y="192" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="12" fill="#cccccc">[panda-on-desk] hit window ready</text>
    <text x="84" y="214" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="12" fill="#cccccc">[panda-on-desk] tray installed · DND off</text>
    <text x="84" y="236" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="12" fill="#cccccc">[buddy] companion: panda · level 12 · rare</text>
    <text x="84" y="266" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="13" fill="#f4f4f4">&gt; help me refactor the auth module</text>
    <text x="84" y="296" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="12" fill="#a5d6ff">[claude-opus-4-7] thinking...</text>
    <text x="84" y="318" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="12" fill="#a5d6ff">  ├── analyzing src/services/oauth/...</text>
    <text x="84" y="340" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="12" fill="#a5d6ff">  ├── 17 files scanned · 0 issues</text>
    <text x="84" y="362" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="12" fill="#a5d6ff">  └── plan ready: 4 steps · 12 min</text>
    <text x="84" y="392" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="12" fill="#7ee787">[panda] ✓ done · review proposal above</text>

    <!-- 底部命令提示 -->
    <text x="84" y="488" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="12" fill="#888">▌</text>
  </g>

  <!-- panda 桌面宠物（右侧浮窗）— 拖拽阴影 + 状态 badge + Lv banner -->
  <g transform="translate(820, 200)">
    <!-- 阴影 -->
    <ellipse cx="100" cy="220" rx="80" ry="12" fill="#000000" fill-opacity="0.4"/>
    <!-- panda 形象（200×200，与 hit.html 一致） -->
    <g>
      <ellipse cx="55"  cy="55" rx="22" ry="26" fill="url(#gradEar)"/>
      <ellipse cx="145" cy="55" rx="22" ry="26" fill="url(#gradEar)"/>
      <ellipse cx="55"  cy="58" rx="11" ry="13" fill="#2a2a2a" opacity="0.85"/>
      <ellipse cx="145" cy="58" rx="11" ry="13" fill="#2a2a2a" opacity="0.85"/>
      <circle cx="100" cy="105" r="65" fill="url(#gradFaceH)" stroke="#1a1a1a" stroke-width="2.5"/>
      <ellipse cx="86" cy="68" rx="32" ry="14" fill="#ffffff" fill-opacity="0.4"/>
      <ellipse cx="80" cy="62" rx="14" ry="6"  fill="#ffffff" fill-opacity="0.6"/>
      <ellipse cx="75"  cy="100" rx="16" ry="20" fill="url(#gradMask)" transform="rotate(-15 75 100)"/>
      <ellipse cx="125" cy="100" rx="16" ry="20" fill="url(#gradMask)" transform="rotate(15 125 100)"/>
      <circle cx="75" cy="100" r="5.5" fill="#ffffff"/>
      <circle cx="125" cy="100" r="5.5" fill="#ffffff"/>
      <circle cx="76" cy="101" r="2.8" fill="#0a0a0a"/>
      <circle cx="126" cy="101" r="2.8" fill="#0a0a0a"/>
      <circle cx="77.5" cy="99" r="1" fill="#ffffff"/>
      <circle cx="127.5" cy="99" r="1" fill="#ffffff"/>
      <ellipse cx="100" cy="125" rx="6.5" ry="4.5" fill="#0a0a0a"/>
      <path d="M100 130 L 100 135 M100 135 Q92 142 85 138 M100 135 Q108 142 115 138" stroke="#1a1a1a" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <ellipse cx="62"  cy="122" rx="7" ry="3.5" fill="#ffc0c8" opacity="0.55"/>
      <ellipse cx="138" cy="122" rx="7" ry="3.5" fill="#ffc0c8" opacity="0.55"/>
    </g>
    <!-- 右上角红圆 badge（未读 3 通知） -->
    <circle cx="172" cy="28" r="13" fill="#ff2244" stroke="#ffffff" stroke-width="2"/>
    <text x="172" y="33" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="12" fill="#ffffff" text-anchor="middle" font-weight="bold">3</text>
    <!-- 头顶 Lv 12 banner + XP 进度条 -->
    <g transform="translate(60, -8)">
      <rect x="0" y="0" width="80" height="14" rx="3" ry="3" fill="rgba(0,0,0,0.55)"/>
      <text x="6" y="11" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="10" fill="url(#goldGrad)" font-weight="bold">Lv 12</text>
      <rect x="0" y="16" width="80" height="4" rx="2" ry="2" fill="rgba(255,255,255,0.15)"/>
      <rect x="0" y="16" width="52" height="4" rx="2" ry="2" fill="url(#goldGrad)"/>
    </g>
    <!-- 状态文字 -->
    <text x="100" y="240" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="11" fill="#FFD700" text-anchor="middle" font-weight="bold" letter-spacing="1">[ thinking ]</text>
  </g>

  <!-- 标题 + 副标题（左上覆盖区，但放右下角避免压窗） -->
  <g>
    <text x="60" y="556" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="22" fill="#FFD700" font-weight="bold" letter-spacing="2">panda-on-desk</text>
    <text x="60" y="582" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="13" fill="#9aa0a6">AI terminal assistant · desktop pet · 7 states · 18 species · 103 notifications</text>
  </g>

  <!-- 底部 dock 占位（半透明渐变） -->
  <rect x="0" y="540" width="1200" height="60" fill="url(#dockGrad)" opacity="0.3"/>
</svg>`
}

// ─────────────────────────────────────────────────────────────────
// SVG 模板：DEMO（600×400）
// 简化的 hero — panda + 单状态 + watermark
// ─────────────────────────────────────────────────────────────────
function buildDemoSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <defs>
    <linearGradient id="bgGradD" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"  stop-color="#10131a"/>
      <stop offset="100%" stop-color="#1f2330"/>
    </linearGradient>
    <linearGradient id="gradEarD" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"  stop-color="#3a3a3a"/>
      <stop offset="100%" stop-color="#0a0a0a"/>
    </linearGradient>
    <linearGradient id="gradMaskD" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"  stop-color="#2a2a2a"/>
      <stop offset="100%" stop-color="#0d0d0d"/>
    </linearGradient>
    <radialGradient id="gradFaceD" cx="50%" cy="38%" r="62%">
      <stop offset="0%"  stop-color="#ffffff"/>
      <stop offset="70%" stop-color="#f4f4f4"/>
      <stop offset="100%" stop-color="#d8d8d8"/>
    </radialGradient>
    <linearGradient id="goldGradD" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"  stop-color="#FFE060"/>
      <stop offset="100%" stop-color="#C8A100"/>
    </linearGradient>
    <filter id="demoShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="6"/>
      <feOffset dx="0" dy="6" result="off"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.5"/></feComponentTransfer>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <rect width="600" height="400" fill="url(#bgGradD)"/>

  <!-- 中央 panda 200×200 缩 -->
  <g transform="translate(200, 80)" filter="url(#demoShadow)">
    <ellipse cx="55"  cy="55" rx="22" ry="26" fill="url(#gradEarD)"/>
    <ellipse cx="145" cy="55" rx="22" ry="26" fill="url(#gradEarD)"/>
    <ellipse cx="55"  cy="58" rx="11" ry="13" fill="#2a2a2a" opacity="0.85"/>
    <ellipse cx="145" cy="58" rx="11" ry="13" fill="#2a2a2a" opacity="0.85"/>
    <circle cx="100" cy="105" r="65" fill="url(#gradFaceD)" stroke="#1a1a1a" stroke-width="2.5"/>
    <ellipse cx="86" cy="68" rx="32" ry="14" fill="#ffffff" fill-opacity="0.4"/>
    <ellipse cx="80" cy="62" rx="14" ry="6"  fill="#ffffff" fill-opacity="0.6"/>
    <ellipse cx="75"  cy="100" rx="16" ry="20" fill="url(#gradMaskD)" transform="rotate(-15 75 100)"/>
    <ellipse cx="125" cy="100" rx="16" ry="20" fill="url(#gradMaskD)" transform="rotate(15 125 100)"/>
    <circle cx="75" cy="100" r="5.5" fill="#ffffff"/>
    <circle cx="125" cy="100" r="5.5" fill="#ffffff"/>
    <circle cx="76" cy="101" r="2.8" fill="#0a0a0a"/>
    <circle cx="126" cy="101" r="2.8" fill="#0a0a0a"/>
    <ellipse cx="100" cy="125" rx="6.5" ry="4.5" fill="#0a0a0a"/>
    <path d="M100 130 L 100 135 M100 135 Q92 142 85 138 M100 135 Q108 142 115 138" stroke="#1a1a1a" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <ellipse cx="62"  cy="122" rx="7" ry="3.5" fill="#ffc0c8" opacity="0.55"/>
    <ellipse cx="138" cy="122" rx="7" ry="3.5" fill="#ffc0c8" opacity="0.55"/>
  </g>

  <!-- 标题 + watermark -->
  <text x="300" y="320" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="22" fill="url(#goldGradD)" text-anchor="middle" font-weight="bold" letter-spacing="2">panda-on-desk</text>
  <text x="300" y="346" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="12" fill="#9aa0a6" text-anchor="middle">desktop companion · 7 states · 18 species</text>
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
    `[panda-on-desk · W6-T1] building screenshots${DRY ? ' (DRY RUN)' : ''}...`,
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
  renderSvgToPng,
  tryRequireSharp,
}
