#!/usr/bin/env node
// Input: build-screenshots.cjs 共用 panda 形象 fragment + commonDefs（不依赖 sharp，纯字符串）
//        + 7 状态独有 SMIL <animate>/<animateTransform> 装饰动画
// Output: build/screenshots/animations/ 下 7 个独立 SVG 动画文件 —
//          · panda-idle.svg          (3s 呼吸 + 5s 眨眼循环)
//          · panda-thinking.svg      (头顶 ? 上下浮动 + 透明度变化)
//          · panda-working.svg       (脸 ±3deg 摇头 0.8s)
//          · panda-sleeping.svg      (闭眼 + Z 飘起 2s 循环 + 4s 慢呼吸)
//          · panda-error.svg         (摔倒 30deg + X 眼)
//          · panda-attention.svg     (上下跳跃 -10px 0.5s)
//          · panda-notification.svg  (头顶铃铛 ±15deg 摇晃 0.4s)
// Pos: panda-on-desk W12-T1 SVG SMIL 动画生成 — 0 新依赖（纯字符串拼接 + 复用 build-screenshots 模块）
//       SMIL 是 SVG 1.1 标准，GitHub README / 浏览器原生支持，无需 JS。
//
// 用法：
//   cd packages/panda-on-desk && node scripts/build-animations.cjs
//   cd packages/panda-on-desk && node scripts/build-animations.cjs --check   # 干跑
//
// [NEW-FILE:#W12-01]
// 触发原因：W11-T2 真截屏只输出单帧 PNG，README 静态。需让 panda "动起来" 让用户在 GitHub
//   README 直接看到呼吸/眨眼/摇头等动画，但 GIF/APNG 体积大、APNG 工具链复杂。
//   SVG SMIL 动画是 0 新依赖、≤ 5KB/文件、矢量缩放、原生支持的方案。
// 无法仅修改现有文件的论证：
//   · build-screenshots.cjs 输出的是 sharp → PNG 静态图（其内含的 commonDefs/pandaFaceFragment 是
//     SVG 字符串构造器，不输出 SVG 文件）；扩展该脚本会把 PNG 输出与 SVG 输出耦合，违反单一职责。
//   · hit.html 是 Electron renderer 入口（含 JS state machine + bridge IPC），不能用作 README 嵌入资源。
//   · 7 状态 × 独立 SVG 是为了 GitHub Markdown 引用 ![alt](path.svg)；单文件 7-state-grid SVG
//     在 GitHub 渲染时只能展示一个动画（无法独立指向）。
// 证据（≥ 3 来源）：
//   1. SVG SMIL 标准：https://www.w3.org/TR/SVG11/animate.html
//      检索时间：2026-04-20 13:27:39 +08:00 — W3C SVG 1.1 Recommendation，<animate>/<animateTransform> 浏览器原生支持
//   2. GitHub Markdown SVG 渲染：https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/about-readme-files
//      检索时间：2026-04-20 13:27:39 +08:00 — GitHub Camo 代理白名单包括 SVG，含 SMIL 动画可正常播放
//   3. CSS Tricks SMIL 实战：https://css-tricks.com/guide-svg-animations-smil/
//      检索时间：2026-04-20 13:27:39 +08:00 — repeatCount="indefinite" + values 序列模式
//
// 复用：build-screenshots.cjs 的 commonDefs() / pandaFaceFragment()（已 module.exports）
//       不重复 SVG 形象代码，确保与静态 PNG 视觉同源（修改一处两处同步）。

'use strict'

const fs = require('node:fs')
const path = require('node:path')

const PKG_ROOT = path.resolve(__dirname, '..')
const ANIM_DIR = path.join(PKG_ROOT, 'build', 'screenshots', 'animations')

// 复用 W6-T1 / W10-T2 build-screenshots.cjs 的 panda 形象 + defs 构造器
// why：避免 SVG 形象代码重复（DRY），修改 hit.html 视觉时只需同步一处
const buildScreenshots = require('./build-screenshots.cjs')
const { commonDefs, pandaFaceFragment } = buildScreenshots

// 7 状态白名单（与 W6-T1 STATES 同源）
const STATES = [
  'idle',
  'thinking',
  'working',
  'sleeping',
  'error',
  'attention',
  'notification',
]

// 装饰元素颜色（与 hit.html .deco-* + build-screenshots STATE_DECO 1:1 对齐）
const DECO_COLOR = {
  thinking: '#ffff66',
  working: '#66ccff',
  sleeping: '#aacbff',
  error: '#ff3366',
  attention: '#ffaa00',
  notification: '#ffcc00',
}

const args = process.argv.slice(2)
const DRY = args.includes('--check') || args.includes('--dry-run')

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

// ─────────────────────────────────────────────────────────────────
// SMIL 动画 builder：每状态独立 SVG，含 panda 形象 + 状态独有 <animate>/<animateTransform>
// 200×200 viewBox 与静态 PNG 一致（README ![alt](svg) 等同尺寸）
// ─────────────────────────────────────────────────────────────────

// 通用包装：SVG 头 + viewBox + defs + content
function wrapSvg(content) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  ${commonDefs('')}
  <ellipse cx="100" cy="172" rx="46" ry="6" fill="#000000" fill-opacity="0.18"/>
  ${content}
</svg>`
}

// 状态 1：idle — 呼吸 3s + 眨眼 5s（眼组 scaleY → 0.1 模拟闭眼）
function buildIdleSvg() {
  // 呼吸：整个 panda <g> scale 1 → 1.035 → 1（3s 循环）
  // 眨眼：眼组 scaleY 1 → 0.1 → 1（在 5s 周期 92%~98% 之间）
  const face = pandaFaceFragment({
    eyeMode: 'open',
    softShadow: 'filtSoftShadow',
    faceShadow: 'filtFaceShadow',
  })
  return wrapSvg(`
  <g transform-origin="100 110">
    ${face}
    <animateTransform attributeName="transform" attributeType="XML" type="scale"
      values="1;1.035;1" keyTimes="0;0.5;1" dur="3s" repeatCount="indefinite"
      additive="sum"/>
    <!-- 眨眼：用 5s 周期内瞬时 scaleY，覆盖在眼区 -->
    <rect x="65" y="95" width="70" height="14" fill="url(#gradFace)" opacity="0">
      <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;0.92;0.94;0.98;0.99;1"
        dur="5s" repeatCount="indefinite"/>
    </rect>
  </g>`)
}

// 状态 2：thinking — 头顶 ? 上下浮动 + 透明度脉冲（1s 循环）
function buildThinkingSvg() {
  const face = pandaFaceFragment({
    eyeMode: 'open',
    softShadow: 'filtSoftShadow',
    faceShadow: 'filtFaceShadow',
  })
  const color = DECO_COLOR.thinking
  return wrapSvg(`
  ${face}
  <g>
    <text x="155" y="42" font-family="ui-monospace, Menlo, Consolas, monospace"
      font-size="34" fill="${color}" font-weight="bold">?
      <animate attributeName="y" values="42;36;42" keyTimes="0;0.5;1"
        dur="1s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="1;0.65;1" keyTimes="0;0.5;1"
        dur="1s" repeatCount="indefinite"/>
      <animateTransform attributeName="transform" attributeType="XML" type="rotate"
        values="-8 155 42;8 155 42;-8 155 42" keyTimes="0;0.5;1"
        dur="1s" repeatCount="indefinite"/>
    </text>
  </g>`)
}

// 状态 3：working — 脸 ±3deg 摇头 0.8s
function buildWorkingSvg() {
  const face = pandaFaceFragment({
    eyeMode: 'open',
    softShadow: 'filtSoftShadow',
    faceShadow: 'filtFaceShadow',
  })
  const color = DECO_COLOR.working
  return wrapSvg(`
  <g>
    ${face}
    <animateTransform attributeName="transform" attributeType="XML" type="rotate"
      values="-3 100 110;3 100 110;-3 100 110" keyTimes="0;0.5;1"
      dur="0.8s" repeatCount="indefinite"/>
  </g>
  <text x="155" y="42" font-family="ui-monospace, Menlo, Consolas, monospace"
    font-size="30" fill="${color}" font-weight="bold">&#9881;
    <animateTransform attributeName="transform" attributeType="XML" type="rotate"
      values="0 155 32;360 155 32" keyTimes="0;1"
      dur="2s" repeatCount="indefinite"/>
  </text>`)
}

// 状态 4：sleeping — 闭眼 + Z 飘起 2s 循环 + 慢呼吸
function buildSleepingSvg() {
  const face = pandaFaceFragment({
    eyeMode: 'closed',
    softShadow: 'filtSoftShadow',
    faceShadow: 'filtFaceShadow',
  })
  const color = DECO_COLOR.sleeping
  return wrapSvg(`
  <g transform-origin="100 110">
    ${face}
    <animateTransform attributeName="transform" attributeType="XML" type="scale"
      values="0.97;1.0;0.97" keyTimes="0;0.5;1" dur="4s" repeatCount="indefinite"
      additive="sum"/>
  </g>
  <text x="160" y="50" font-family="ui-monospace, Menlo, Consolas, monospace"
    font-size="26" fill="${color}" font-weight="bold">Z
    <animate attributeName="x" values="160;168;160" keyTimes="0;1;1"
      dur="2s" repeatCount="indefinite"/>
    <animate attributeName="y" values="50;28;50" keyTimes="0;1;1"
      dur="2s" repeatCount="indefinite"/>
    <animate attributeName="opacity" values="0;1;0" keyTimes="0;0.3;1"
      dur="2s" repeatCount="indefinite"/>
  </text>`)
}

// 状态 5：error — 摔倒 30deg + X 眼（一次性 forwards 模拟：用 fill="freeze"）
function buildErrorSvg() {
  const face = pandaFaceFragment({
    eyeMode: 'x',
    softShadow: 'filtSoftShadow',
    faceShadow: 'filtFaceShadow',
  })
  const color = DECO_COLOR.error
  // 摔倒后 4s 复位重摔（loop）让 README 持续可见
  return wrapSvg(`
  <g>
    ${face}
    <animateTransform attributeName="transform" attributeType="XML" type="rotate"
      values="0 100 110;30 100 110;28 100 112;30 100 110;30 100 110;0 100 110"
      keyTimes="0;0.15;0.25;0.35;0.85;1" dur="4s" repeatCount="indefinite"/>
  </g>
  <text x="100" y="22" font-family="ui-monospace, Menlo, Consolas, monospace"
    font-size="20" fill="${color}" text-anchor="middle" font-weight="bold">&#10005;
    <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.85;1"
      dur="4s" repeatCount="indefinite"/>
  </text>`)
}

// 状态 6：attention — 上下跳跃 -10px 0.5s
function buildAttentionSvg() {
  const face = pandaFaceFragment({
    eyeMode: 'open',
    softShadow: 'filtSoftShadow',
    faceShadow: 'filtFaceShadow',
  })
  const color = DECO_COLOR.attention
  return wrapSvg(`
  <g>
    ${face}
    <animateTransform attributeName="transform" attributeType="XML" type="translate"
      values="0 0;0 -10;0 0" keyTimes="0;0.5;1"
      dur="0.5s" repeatCount="indefinite"/>
  </g>
  <g>
    <circle cx="100" cy="26" r="14" fill="${color}" opacity="0.25">
      <animate attributeName="r" values="14;18;14" keyTimes="0;0.5;1"
        dur="0.5s" repeatCount="indefinite"/>
    </circle>
    <text x="100" y="34" font-family="ui-monospace, Menlo, Consolas, monospace"
      font-size="28" fill="${color}" text-anchor="middle" font-weight="bold">!</text>
  </g>`)
}

// 状态 7：notification — 头顶铃铛 ±15deg 摇晃 0.4s + 红圆 badge 脉冲
function buildNotificationSvg() {
  const face = pandaFaceFragment({
    eyeMode: 'open',
    softShadow: 'filtSoftShadow',
    faceShadow: 'filtFaceShadow',
  })
  const color = DECO_COLOR.notification
  return wrapSvg(`
  ${face}
  <g>
    <text x="100" y="36" font-size="30" fill="${color}" text-anchor="middle">&#x1F514;
      <animateTransform attributeName="transform" attributeType="XML" type="rotate"
        values="-15 100 26;15 100 26;-15 100 26" keyTimes="0;0.5;1"
        dur="0.4s" repeatCount="indefinite"/>
    </text>
    <circle cx="118" cy="20" r="6" fill="#ff2244" stroke="#ffffff" stroke-width="1.5">
      <animate attributeName="r" values="6;7.5;6" keyTimes="0;0.5;1"
        dur="0.8s" repeatCount="indefinite"/>
    </circle>
    <text x="118" y="24" font-family="ui-monospace, Menlo, Consolas, monospace"
      font-size="8" fill="#ffffff" text-anchor="middle" font-weight="bold">3</text>
  </g>`)
}

// 状态 → builder 映射（保证导出 + 脚本主流程一致）
const SVG_BUILDERS = {
  idle: buildIdleSvg,
  thinking: buildThinkingSvg,
  working: buildWorkingSvg,
  sleeping: buildSleepingSvg,
  error: buildErrorSvg,
  attention: buildAttentionSvg,
  notification: buildNotificationSvg,
}

// ─────────────────────────────────────────────────────────────────
// 主入口
// ─────────────────────────────────────────────────────────────────
async function main() {
  console.log(
    `[panda-on-desk · W12-T1] building SVG SMIL animations${DRY ? ' (DRY RUN)' : ''}...`,
  )
  if (!DRY) ensureDir(ANIM_DIR)

  const summary = []
  for (const state of STATES) {
    const builder = SVG_BUILDERS[state]
    if (typeof builder !== 'function') {
      console.error(`[err] no builder for state ${state}`)
      continue
    }
    const svg = builder()
    const outName = `panda-${state}.svg`
    const outPath = path.join(ANIM_DIR, outName)
    if (DRY) {
      summary.push({ name: outName, dry: true, bytes: Buffer.byteLength(svg, 'utf8') })
      console.log(`  -> [DRY] ${outName} (${(Buffer.byteLength(svg, 'utf8') / 1024).toFixed(1)} KB)`)
      continue
    }
    try {
      fs.writeFileSync(outPath, svg, 'utf8')
      const stat = fs.statSync(outPath)
      summary.push({ name: outName, bytes: stat.size })
      console.log(`  -> ${outName} (${(stat.size / 1024).toFixed(1)} KB)`)
    } catch (err) {
      console.error(`[err] write ${outName}: ${err.message}`)
    }
  }

  console.log(`[ok] animation build summary: ${summary.length} file(s)`)
  if (!DRY) {
    const oversized = summary.filter((s) => s.bytes && s.bytes > 20 * 1024)
    const undersized = summary.filter((s) => s.bytes && s.bytes < 1024)
    if (undersized.length > 0) {
      console.warn(`[warn] ${undersized.length} file(s) < 1KB:`, undersized.map((s) => s.name))
    }
    if (oversized.length > 0) {
      console.warn(`[warn] ${oversized.length} file(s) > 20KB:`, oversized.map((s) => s.name))
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
  ANIM_DIR,
  DECO_COLOR,
  SVG_BUILDERS,
  buildIdleSvg,
  buildThinkingSvg,
  buildWorkingSvg,
  buildSleepingSvg,
  buildErrorSvg,
  buildAttentionSvg,
  buildNotificationSvg,
}
