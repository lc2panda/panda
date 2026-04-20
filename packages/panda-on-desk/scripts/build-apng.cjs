#!/usr/bin/env node
// Input: build-screenshots.cjs 共用 panda 形象 fragment + commonDefs（不依赖 sharp，纯字符串）
//        + 7 状态独有 CSS-like 关键帧参数（breathing / blink / rotate / translate / shake）
//        + sharp 0.34.5 (monorepo root) 用于 SVG → PNG 静态帧光栅化
// Output: build/screenshots/apng/ 下 7 个 APNG 动图 —
//          · panda-idle.apng          (3s 呼吸 6 帧)
//          · panda-thinking.apng      (1s 问号浮动 8 帧)
//          · panda-working.apng       (0.8s 摇头 6 帧)
//          · panda-sleeping.apng      (2s Z 飘 8 帧)
//          · panda-error.apng         (1s 摔倒 X 眼 4 帧)
//          · panda-attention.apng     (0.5s 跳跃 4 帧)
//          · panda-notification.apng  (0.4s 摇铃 6 帧)
// Pos: panda-on-desk W16-T1 APNG 真动图 — 0 新依赖（纯 JS APNG 合成 + 复用 build-screenshots / sharp）
//       APNG 是 PNG 超集（acTL/fcTL/fdAT chunks），所有现代浏览器 + GitHub Markdown 原生解码。
//
// 用法：
//   cd packages/panda-on-desk && node scripts/build-apng.cjs
//   cd packages/panda-on-desk && node scripts/build-apng.cjs --check   # 干跑
//
// [NEW-FILE:#W16-01]
// 触发原因：W12-T1 输出 7 SVG SMIL 动画，GitHub Camo 支持但部分静态环境（邮件/某些博客平台/
//   GitHub raw 文件预览）只把 SVG 当静态图。APNG 是真位图动画，浏览器识别 acTL chunk 即自动播放，
//   在 README/静态博客/邮件/Discord 预览都能动，是 W12-T1 的最强补充而非替代。
// 无法仅修改现有文件的论证：
//   · build-screenshots.cjs 输出单帧 PNG；扩展会把单帧与多帧耦合违反单一职责。
//   · build-animations.cjs 输出 SVG（矢量），输出格式差异大（位图 vs 矢量）不应耦合。
//   · sharp 0.34.5（libvips）原生不支持 APNG 输出（仅输出垂直 strip），需手写 APNG 合成器
//     — 故必须独立 W16-T1 脚本承担"光栅化 N 帧 + APNG chunk 装配"职责。
// 证据（≥ 3 来源）：
//   1. APNG Specification (Mozilla): https://wiki.mozilla.org/APNG_Specification
//      检索时间：2026-04-20 17:02:00 +08:00 — acTL/fcTL/fdAT chunk 结构 + CRC32 计算
//   2. W3C PNG 2nd Edition (ISO/IEC 15948:2004): https://www.w3.org/TR/PNG/#5DataRep
//      检索时间：2026-04-20 17:02:00 +08:00 — PNG chunk 格式：length(4)/type(4)/data/crc(4)
//   3. sharp 0.34.5 changelog: https://sharp.pixelplumbing.com/
//      检索时间：2026-04-20 17:02:00 +08:00 — 确认 PNG 动画输出未支持（仅 WebP/GIF 原生）
//
// 复用：build-screenshots.cjs 的 commonDefs() / pandaFaceFragment() / tryRequireSharp()
//       — 与 W12-T1 SVG / W6-T1 PNG 视觉同源，修改 panda 形象一处三处同步。

'use strict'

const fs = require('node:fs')
const path = require('node:path')
const zlib = require('node:zlib')

const PKG_ROOT = path.resolve(__dirname, '..')
const APNG_DIR = path.join(PKG_ROOT, 'build', 'screenshots', 'apng')

// 复用 W6-T1 / W10-T2 / W12-T1 build-screenshots 的 panda 形象 + defs + sharp 加载
const buildScreenshots = require('./build-screenshots.cjs')
const { commonDefs, pandaFaceFragment, tryRequireSharp } = buildScreenshots

// 7 状态白名单（与 W6-T1 STATES / W12-T1 SVG_BUILDERS 同源）
const STATES = [
  'idle',
  'thinking',
  'working',
  'sleeping',
  'error',
  'attention',
  'notification',
]

// 装饰元素颜色（与 hit.html .deco-* + STATE_DECO 1:1 对齐）
const DECO_COLOR = {
  thinking: '#ffff66',
  working: '#66ccff',
  sleeping: '#aacbff',
  error: '#ff3366',
  attention: '#ffaa00',
  notification: '#ffcc00',
}

// 每状态帧数 + 循环周期（ms）— 对齐 hit.html CSS animation 时长
// 帧延迟 = duration / frames（等分）
const STATE_SPEC = {
  idle: { frames: 6, durationMs: 3000 }, // 3s 呼吸
  thinking: { frames: 8, durationMs: 1000 }, // 1s ? 浮动
  working: { frames: 6, durationMs: 800 }, // 0.8s 摇头
  sleeping: { frames: 8, durationMs: 2000 }, // 2s Z 飘
  error: { frames: 4, durationMs: 1000 }, // 1s 摔倒
  attention: { frames: 4, durationMs: 500 }, // 0.5s 跳跃
  notification: { frames: 6, durationMs: 400 }, // 0.4s 摇铃
}

// 输出尺寸（与 W6-T1 / W12-T1 200×200 一致）
const WIDTH = 200
const HEIGHT = 200

const args = process.argv.slice(2)
const DRY = args.includes('--check') || args.includes('--dry-run')

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

// ─────────────────────────────────────────────────────────────────
// 帧 SVG 构造器：每状态接受 t ∈ [0,1) 归一化时间 → 返回单帧 SVG 字符串
// 关键帧参数来自 W12-T1 SMIL values — 此处改为离散插值（每帧一个静态 SVG）
// ─────────────────────────────────────────────────────────────────

// 线性插值辅助
function lerp(a, b, t) {
  return a + (b - a) * t
}

// 三角波（0→1→0）— 适合呼吸/摇头等对称往返动画
function triWave(t) {
  return t < 0.5 ? t * 2 : 2 - t * 2
}

// 通用 SVG 头（与 build-animations.cjs wrapSvg 对齐，但不带 SMIL <animate>）
function wrapFrameSvg(content) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  ${commonDefs('')}
  <ellipse cx="100" cy="172" rx="46" ry="6" fill="#000000" fill-opacity="0.18"/>
  ${content}
</svg>`
}

// 状态 1：idle — 呼吸（scale 1 → 1.035 → 1，对称三角）
function frameIdle(t) {
  const wave = triWave(t)
  const scale = lerp(1.0, 1.035, wave)
  const face = pandaFaceFragment({
    eyeMode: 'open',
    softShadow: 'filtSoftShadow',
    faceShadow: 'filtFaceShadow',
  })
  return wrapFrameSvg(`
  <g transform="translate(100 110) scale(${scale.toFixed(4)}) translate(-100 -110)">
    ${face}
  </g>`)
}

// 状态 2：thinking — ? 上下浮动（y 42→36→42）+ 旋转 ±8deg
function frameThinking(t) {
  const wave = triWave(t)
  const y = lerp(42, 36, wave).toFixed(2)
  const opacity = lerp(1, 0.65, wave).toFixed(3)
  const rot = lerp(-8, 8, t).toFixed(2) // 一周期单向转
  const color = DECO_COLOR.thinking
  const face = pandaFaceFragment({
    eyeMode: 'open',
    softShadow: 'filtSoftShadow',
    faceShadow: 'filtFaceShadow',
  })
  return wrapFrameSvg(`
  ${face}
  <g transform="rotate(${rot} 155 ${y})">
    <text x="155" y="${y}" font-family="ui-monospace, Menlo, Consolas, monospace"
      font-size="34" fill="${color}" font-weight="bold" opacity="${opacity}">?</text>
  </g>`)
}

// 状态 3：working — 脸 ±3deg 摇头 + 齿轮旋转（2s 一圈，此处按 t 内比例）
function frameWorking(t) {
  const wave = triWave(t)
  const rot = lerp(-3, 3, wave).toFixed(2)
  const gearRot = (t * 360).toFixed(2) // 线性旋转
  const color = DECO_COLOR.working
  const face = pandaFaceFragment({
    eyeMode: 'open',
    softShadow: 'filtSoftShadow',
    faceShadow: 'filtFaceShadow',
  })
  return wrapFrameSvg(`
  <g transform="rotate(${rot} 100 110)">
    ${face}
  </g>
  <g transform="rotate(${gearRot} 155 32)">
    <text x="155" y="42" font-family="ui-monospace, Menlo, Consolas, monospace"
      font-size="30" fill="${color}" font-weight="bold">&#9881;</text>
  </g>`)
}

// 状态 4：sleeping — 闭眼 + Z 飘起（x 160→168，y 50→28，opacity 0→1→0）+ 慢呼吸
function frameSleeping(t) {
  const breathWave = triWave(t)
  const scale = lerp(0.97, 1.0, breathWave)
  const zx = lerp(160, 168, t).toFixed(2)
  const zy = lerp(50, 28, t).toFixed(2)
  // opacity: 0→1 (0..0.3), 1→0 (0.3..1)
  const zOpacity = t < 0.3 ? (t / 0.3).toFixed(3) : ((1 - t) / 0.7).toFixed(3)
  const color = DECO_COLOR.sleeping
  const face = pandaFaceFragment({
    eyeMode: 'closed',
    softShadow: 'filtSoftShadow',
    faceShadow: 'filtFaceShadow',
  })
  return wrapFrameSvg(`
  <g transform="translate(100 110) scale(${scale.toFixed(4)}) translate(-100 -110)">
    ${face}
  </g>
  <text x="${zx}" y="${zy}" font-family="ui-monospace, Menlo, Consolas, monospace"
    font-size="26" fill="${color}" font-weight="bold" opacity="${zOpacity}">Z</text>`)
}

// 状态 5：error — 摔倒 0→30deg + X 眼闪烁（最后 15% 消失）
function frameError(t) {
  // 摔倒曲线：前 25% 倾倒到 30°，25-85% 保持，85-100% 复位
  let rot
  if (t < 0.25) rot = lerp(0, 30, t / 0.25)
  else if (t < 0.85) rot = 30
  else rot = lerp(30, 0, (t - 0.85) / 0.15)
  const opacity = t < 0.85 ? 1 : lerp(1, 0, (t - 0.85) / 0.15).toFixed(3)
  const color = DECO_COLOR.error
  const face = pandaFaceFragment({
    eyeMode: 'x',
    softShadow: 'filtSoftShadow',
    faceShadow: 'filtFaceShadow',
  })
  return wrapFrameSvg(`
  <g transform="rotate(${rot.toFixed(2)} 100 110)">
    ${face}
  </g>
  <text x="100" y="22" font-family="ui-monospace, Menlo, Consolas, monospace"
    font-size="20" fill="${color}" text-anchor="middle" font-weight="bold" opacity="${opacity}">&#10005;</text>`)
}

// 状态 6：attention — 上下跳跃 0→-10→0 + 光圈脉冲
function frameAttention(t) {
  const wave = triWave(t)
  const ty = lerp(0, -10, wave).toFixed(2)
  const r = lerp(14, 18, wave).toFixed(2)
  const color = DECO_COLOR.attention
  const face = pandaFaceFragment({
    eyeMode: 'open',
    softShadow: 'filtSoftShadow',
    faceShadow: 'filtFaceShadow',
  })
  return wrapFrameSvg(`
  <g transform="translate(0 ${ty})">
    ${face}
  </g>
  <circle cx="100" cy="26" r="${r}" fill="${color}" opacity="0.25"/>
  <text x="100" y="34" font-family="ui-monospace, Menlo, Consolas, monospace"
    font-size="28" fill="${color}" text-anchor="middle" font-weight="bold">!</text>`)
}

// 状态 7：notification — 铃铛 ±15deg 摇晃 + 红圆 badge 脉冲
function frameNotification(t) {
  const wave = triWave(t)
  const rot = lerp(-15, 15, wave).toFixed(2)
  // badge 脉冲周期 ≈ 2× 摇铃（这里按 t 内 2 次对称）
  const badgeWave = triWave((t * 2) % 1)
  const rBadge = lerp(6, 7.5, badgeWave).toFixed(2)
  const color = DECO_COLOR.notification
  const face = pandaFaceFragment({
    eyeMode: 'open',
    softShadow: 'filtSoftShadow',
    faceShadow: 'filtFaceShadow',
  })
  return wrapFrameSvg(`
  ${face}
  <g transform="rotate(${rot} 100 26)">
    <text x="100" y="36" font-size="30" fill="${color}" text-anchor="middle">&#x1F514;</text>
  </g>
  <circle cx="118" cy="20" r="${rBadge}" fill="#ff2244" stroke="#ffffff" stroke-width="1.5"/>
  <text x="118" y="24" font-family="ui-monospace, Menlo, Consolas, monospace"
    font-size="8" fill="#ffffff" text-anchor="middle" font-weight="bold">3</text>`)
}

const FRAME_BUILDERS = {
  idle: frameIdle,
  thinking: frameThinking,
  working: frameWorking,
  sleeping: frameSleeping,
  error: frameError,
  attention: frameAttention,
  notification: frameNotification,
}

// ─────────────────────────────────────────────────────────────────
// APNG 合成器（纯 JS，0 新依赖）
// PNG chunk 格式：[length(4 BE)] [type(4)] [data] [crc(4 BE)]
// APNG 扩展：
//   - acTL (animation control，IHDR 后): num_frames(4) + num_plays(4)
//   - fcTL (frame control，每帧前): seq(4) + width(4) + height(4) + x(4) + y(4)
//                                   + delay_num(2) + delay_den(2) + dispose_op(1) + blend_op(1)
//   - fdAT (frame data，第 2 帧起代替 IDAT): seq(4) + 压缩 data（与 IDAT 相同格式）
// 第 1 帧使用 IDAT（与静态 PNG 兼容）。
// ─────────────────────────────────────────────────────────────────

// CRC32 表（PNG/ZIP 标准多项式 0xEDB88320）
const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[n] = c >>> 0
  }
  return table
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  }
  return (c ^ 0xffffffff) >>> 0
}

// 构造一个 PNG chunk：type (4 char) + data (Buffer) → [len | type | data | crc]
function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const crcInput = Buffer.concat([typeBuf, data])
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(crcInput), 0)
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

// 解析 PNG buffer，按顺序返回 { signature, chunks: [{type, data}] }
const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

function parsePng(buf) {
  if (buf.length < 8 || !buf.subarray(0, 8).equals(PNG_SIG)) {
    throw new Error('invalid PNG signature')
  }
  const chunks = []
  let off = 8
  while (off < buf.length) {
    const len = buf.readUInt32BE(off)
    const type = buf.subarray(off + 4, off + 8).toString('ascii')
    const data = buf.subarray(off + 8, off + 8 + len)
    chunks.push({ type, data: Buffer.from(data) })
    off += 8 + len + 4 // len(4)+type(4)+data+crc(4)
    if (type === 'IEND') break
  }
  return { chunks }
}

// 合成 APNG：frames[] (每项是完整静态 PNG Buffer) + delays[] (ms)
// 输出 APNG Buffer（符合 APNG 规范）
function buildApngBuffer(framePngs, delaysMs) {
  if (framePngs.length < 1) throw new Error('at least 1 frame required')
  if (framePngs.length !== delaysMs.length) {
    throw new Error('framePngs.length must equal delaysMs.length')
  }

  // 从第一帧提取 IHDR（所有帧必须同尺寸，由上层保证）
  const firstParsed = parsePng(framePngs[0])
  const ihdr = firstParsed.chunks.find((c) => c.type === 'IHDR')
  if (!ihdr) throw new Error('first frame missing IHDR')
  const width = ihdr.data.readUInt32BE(0)
  const height = ihdr.data.readUInt32BE(4)

  // 拼装输出 chunks
  const out = [PNG_SIG]
  out.push(makeChunk('IHDR', ihdr.data))

  // acTL：动画控制 chunk（必须在 IDAT 之前，通常紧跟 IHDR）
  const acTLData = Buffer.alloc(8)
  acTLData.writeUInt32BE(framePngs.length, 0) // num_frames
  acTLData.writeUInt32BE(0, 4) // num_plays = 0 (infinite)
  out.push(makeChunk('acTL', acTLData))

  // 保留第一帧其它辅助 chunk（如 PLTE/tRNS/gAMA 等）— 位于 IDAT 前
  // 简化策略：只保留 IHDR/acTL/IDAT/IEND 所需，其余辅助数据默认 sRGB（sharp 输出通常干净）
  // 如果第一帧有 PLTE / tRNS，需保留（用于调色板模式）
  for (const c of firstParsed.chunks) {
    if (c.type === 'PLTE' || c.type === 'tRNS' || c.type === 'gAMA' || c.type === 'cHRM' || c.type === 'sRGB') {
      out.push(makeChunk(c.type, c.data))
    }
  }

  // 序列号（fcTL/fdAT 共享，从 0 递增）
  let seq = 0

  // fcTL for frame 0 + 该帧 IDAT（第 1 帧用 IDAT，符合 APNG 规范）
  {
    const fcTL = Buffer.alloc(26)
    fcTL.writeUInt32BE(seq++, 0)
    fcTL.writeUInt32BE(width, 4)
    fcTL.writeUInt32BE(height, 8)
    fcTL.writeUInt32BE(0, 12) // x_offset
    fcTL.writeUInt32BE(0, 16) // y_offset
    // delay = delaysMs[0] / 1000 → 分子/分母
    const { num, den } = msToFraction(delaysMs[0])
    fcTL.writeUInt16BE(num, 20)
    fcTL.writeUInt16BE(den, 22)
    fcTL.writeUInt8(1, 24) // dispose_op: 1 = APNG_DISPOSE_OP_BACKGROUND
    fcTL.writeUInt8(0, 25) // blend_op: 0 = APNG_BLEND_OP_SOURCE
    out.push(makeChunk('fcTL', fcTL))

    // 首帧所有 IDAT 连续保留
    for (const c of firstParsed.chunks) {
      if (c.type === 'IDAT') out.push(makeChunk('IDAT', c.data))
    }
  }

  // 后续帧：fcTL + fdAT（fdAT = [seq(4)][IDAT data]）
  for (let i = 1; i < framePngs.length; i++) {
    const parsed = parsePng(framePngs[i])
    const fcTL = Buffer.alloc(26)
    fcTL.writeUInt32BE(seq++, 0)
    fcTL.writeUInt32BE(width, 4)
    fcTL.writeUInt32BE(height, 8)
    fcTL.writeUInt32BE(0, 12)
    fcTL.writeUInt32BE(0, 16)
    const { num, den } = msToFraction(delaysMs[i])
    fcTL.writeUInt16BE(num, 20)
    fcTL.writeUInt16BE(den, 22)
    fcTL.writeUInt8(1, 24)
    fcTL.writeUInt8(0, 25)
    out.push(makeChunk('fcTL', fcTL))

    for (const c of parsed.chunks) {
      if (c.type === 'IDAT') {
        const fdAT = Buffer.concat([
          (() => {
            const s = Buffer.alloc(4)
            s.writeUInt32BE(seq++, 0)
            return s
          })(),
          c.data,
        ])
        out.push(makeChunk('fdAT', fdAT))
      }
    }
  }

  out.push(makeChunk('IEND', Buffer.alloc(0)))
  return Buffer.concat(out)
}

// 将 ms 转为 delay_num/delay_den（PNG 规范用 uint16 分数秒）
// 策略：den=1000（毫秒级），num=ms；若 ms > 65535 则降到 den=100（厘秒）
function msToFraction(ms) {
  if (ms <= 65535) return { num: ms, den: 1000 }
  const cs = Math.round(ms / 10)
  return { num: Math.min(cs, 65535), den: 100 }
}

// ─────────────────────────────────────────────────────────────────
// 光栅化：SVG → PNG buffer（单帧，透明背景，与 W6-T1 renderSvgToPng 同源）
// ─────────────────────────────────────────────────────────────────
async function rasterizeFrame(sharp, svgString) {
  const svgBuffer = Buffer.from(svgString, 'utf8')
  return sharp(svgBuffer, { density: 192 })
    .resize(WIDTH, HEIGHT, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9 })
    .toBuffer()
}

// 构建单状态 APNG：生成 N 帧 SVG → 光栅化 → APNG 合成
async function buildStateApng(sharp, state) {
  const spec = STATE_SPEC[state]
  const builder = FRAME_BUILDERS[state]
  if (!spec || typeof builder !== 'function') {
    throw new Error(`no spec/builder for state ${state}`)
  }

  const { frames, durationMs } = spec
  const frameDelayMs = Math.round(durationMs / frames)
  const delays = new Array(frames).fill(frameDelayMs)

  // 生成 N 帧 PNG buffer（并行 sharp，控制并发避免内存）
  const framePngs = []
  for (let i = 0; i < frames; i++) {
    const t = i / frames // [0, 1)
    const svg = builder(t)
    const png = await rasterizeFrame(sharp, svg)
    framePngs.push(png)
  }

  return buildApngBuffer(framePngs, delays)
}

// ─────────────────────────────────────────────────────────────────
// 主入口
// ─────────────────────────────────────────────────────────────────
async function main() {
  console.log(
    `[panda-on-desk · W16-T1] building APNG animations${DRY ? ' (DRY RUN)' : ''}...`,
  )

  if (!DRY) ensureDir(APNG_DIR)

  let sharp
  try {
    sharp = tryRequireSharp()
  } catch (err) {
    console.error(`[fatal] sharp not loadable: ${err.message}`)
    console.error(`[fatal] please install sharp at workspace root (^0.34.5)`)
    process.exit(1)
  }

  const summary = []
  for (const state of STATES) {
    const spec = STATE_SPEC[state]
    const outName = `panda-${state}.apng`
    const outPath = path.join(APNG_DIR, outName)
    if (DRY) {
      summary.push({ name: outName, dry: true, frames: spec.frames })
      console.log(`  -> [DRY] ${outName} (${spec.frames} frames / ${spec.durationMs}ms)`)
      continue
    }
    try {
      const apngBuf = await buildStateApng(sharp, state)
      fs.writeFileSync(outPath, apngBuf)
      const stat = fs.statSync(outPath)
      summary.push({ name: outName, bytes: stat.size, frames: spec.frames })
      console.log(
        `  -> ${outName} (${(stat.size / 1024).toFixed(1)} KB, ${spec.frames} frames)`,
      )
    } catch (err) {
      console.error(`[err] build ${outName}: ${err.message}`)
      if (err.stack) console.error(err.stack)
    }
  }

  console.log(`[ok] APNG build summary: ${summary.length} file(s)`)
  if (!DRY) {
    const undersized = summary.filter((s) => s.bytes && s.bytes < 5 * 1024)
    const oversized = summary.filter((s) => s.bytes && s.bytes > 300 * 1024)
    if (undersized.length > 0) {
      console.warn(
        `[warn] ${undersized.length} file(s) < 5KB — may be invalid:`,
        undersized.map((s) => s.name),
      )
    }
    if (oversized.length > 0) {
      console.warn(
        `[warn] ${oversized.length} file(s) > 300KB — repo bloat:`,
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
  STATE_SPEC,
  DECO_COLOR,
  APNG_DIR,
  WIDTH,
  HEIGHT,
  FRAME_BUILDERS,
  // 低层导出（便于回归测试）
  crc32,
  makeChunk,
  parsePng,
  buildApngBuffer,
  msToFraction,
  rasterizeFrame,
  buildStateApng,
  PNG_SIG,
}
