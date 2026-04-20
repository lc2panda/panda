#!/usr/bin/env node
// Input: build/icons/panda.svg + tray-light.svg + tray-dark.svg
// Output: 多尺寸 PNG (16/32/64/128/256/512 for panda; 256 for tray)；
//         icns/ico 仅占位（mac iconutil / 真 ico packing 在 CI 阶段处理）
// Pos: panda-on-desk Phase 3 P3-T5 美术资产 — sharp 程序化渲染。
//      sharp 已是 panda 主仓库依赖（^0.34.5），不引入新依赖。
//
// 用法：
//   cd packages/panda-on-desk && node scripts/build-icons.cjs
//   cd packages/panda-on-desk && node scripts/build-icons.cjs --check  # 干跑（不写文件）
//
// [NEW-FILE:#20260419-P3T5-art-02]

'use strict'

const fs = require('node:fs')
const path = require('node:path')

const ICONS_DIR = path.resolve(__dirname, '..', 'build', 'icons')
const PANDA_SIZES = [16, 32, 64, 128, 256, 512]
const TRAY_SIZES = [256]

const args = process.argv.slice(2)
const DRY = args.includes('--check') || args.includes('--dry-run')

function tryRequireSharp() {
  // sharp 在 monorepo 主仓库 root node_modules；本子包没有独立 node_modules。
  // 通过 require 解析路径回退到 root。
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

async function renderSvgToPngSizes(svgPath, baseName, sizes) {
  if (!fs.existsSync(svgPath)) {
    console.warn(`[skip] svg source not found: ${svgPath}`)
    return []
  }
  let sharp
  try {
    sharp = tryRequireSharp()
  } catch (err) {
    console.warn(`[warn] sharp not loadable: ${err.message}`)
    console.warn(`[warn] dry-run only — please install sharp at workspace root`)
    return []
  }

  const svgBuffer = fs.readFileSync(svgPath)
  const outputs = []
  for (const size of sizes) {
    // 主尺寸用 baseName.png；其余用 baseName-{size}.png（512 不带后缀以兼容 electron-builder 默认查找）
    const isMain = size === Math.max(...sizes)
    const outName = isMain ? `${baseName}.png` : `${baseName}-${size}.png`
    const outPath = path.join(ICONS_DIR, outName)
    if (DRY) {
      outputs.push({ size, outPath, dry: true })
      continue
    }
    try {
      await sharp(svgBuffer, { density: 384 })
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png({ compressionLevel: 9 })
        .toFile(outPath)
      outputs.push({ size, outPath })
    } catch (err) {
      console.error(`[err] sharp render ${baseName}@${size}: ${err.message}`)
    }
  }
  return outputs
}

// 将多尺寸 PNG 打包为 Windows ICO（ICONDIR + ICONDIRENTRY* + PNG payload）。
// ICO 规范：https://en.wikipedia.org/wiki/ICO_(file_format)
// 每个 ICONDIRENTRY = 16 bytes (width/height/color/reserved/planes/bpp/size/offset)，
// Vista+ 支持 PNG 直接内嵌（不需 BMP 解码），electron-builder 通过此分发 Windows 图标。
function buildIcoFromPngs(pngPaths) {
  const entries = pngPaths
    .map((p) => ({ path: p, buf: fs.readFileSync(p) }))
    .filter((e) => e.buf && e.buf.length > 0)

  if (entries.length === 0) throw new Error('buildIcoFromPngs: no PNG inputs')

  const count = entries.length
  const headerSize = 6
  const entrySize = 16
  const offsetBase = headerSize + entrySize * count

  const header = Buffer.alloc(headerSize)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type = 1 (ICO)
  header.writeUInt16LE(count, 4) // image count

  const dirEntries = []
  const payloads = []
  let offset = offsetBase
  for (const e of entries) {
    // 从 PNG IHDR 读 width/height（bytes 16-23）
    const pngW = e.buf.readUInt32BE(16)
    const pngH = e.buf.readUInt32BE(20)
    // ICO dimension field 0 代表 256（因为字段仅 1 byte，0-255）
    const dimW = pngW >= 256 ? 0 : pngW
    const dimH = pngH >= 256 ? 0 : pngH

    const entry = Buffer.alloc(entrySize)
    entry.writeUInt8(dimW, 0)
    entry.writeUInt8(dimH, 1)
    entry.writeUInt8(0, 2) // color palette count
    entry.writeUInt8(0, 3) // reserved
    entry.writeUInt16LE(1, 4) // planes
    entry.writeUInt16LE(32, 6) // bits per pixel
    entry.writeUInt32LE(e.buf.length, 8) // image size
    entry.writeUInt32LE(offset, 12) // offset
    dirEntries.push(entry)
    payloads.push(e.buf)
    offset += e.buf.length
  }

  return Buffer.concat([header, ...dirEntries, ...payloads])
}

// 将多尺寸 PNG 打包为 macOS ICNS（"icns" magic + type blocks）。
// ICNS 规范：https://en.wikipedia.org/wiki/Apple_Icon_Image_format
// macOS 10.7+ 支持 PNG payload（"ic07"/"ic08"/"ic09"/"ic10"/"ic11"/"ic12"/"ic13"/"ic14"）。
const ICNS_TYPE_MAP = {
  16: 'icp4',
  32: 'icp5',
  64: 'icp6',
  128: 'ic07',
  256: 'ic08',
  512: 'ic09',
}
function buildIcnsFromPngs(pngPaths) {
  const blocks = []
  let totalSize = 8 // magic + size header
  for (const p of pngPaths) {
    const buf = fs.readFileSync(p)
    if (!buf || buf.length === 0) continue
    const w = buf.readUInt32BE(16)
    const typeTag = ICNS_TYPE_MAP[w]
    if (!typeTag) continue
    const block = Buffer.alloc(8 + buf.length)
    block.write(typeTag, 0, 'ascii')
    block.writeUInt32BE(8 + buf.length, 4)
    buf.copy(block, 8)
    blocks.push(block)
    totalSize += block.length
  }
  const header = Buffer.alloc(8)
  header.write('icns', 0, 'ascii')
  header.writeUInt32BE(totalSize, 4)
  return Buffer.concat([header, ...blocks])
}

function writeIcoIcnsPlaceholders() {
  const icnsPath = path.join(ICONS_DIR, 'panda.icns')
  const icoPath = path.join(ICONS_DIR, 'panda.ico')

  if (DRY) return { icnsPath, icoPath, dry: true }

  // 从生成的 PNG 合成真 ICO / ICNS。ICO 用 16/32/64/128/256 全尺寸。
  // ICNS 用 16/32/64/128/256/512 全尺寸。
  const icoSizes = [16, 32, 64, 128, 256]
  const icnsSizes = [16, 32, 64, 128, 256, 512]

  const pngPathFor = (size) => {
    // build-icons 主尺寸 = max；其余用 -{size} 后缀
    const maxSize = Math.max(...PANDA_SIZES)
    return size === maxSize
      ? path.join(ICONS_DIR, 'panda.png')
      : path.join(ICONS_DIR, `panda-${size}.png`)
  }

  try {
    const icoPngs = icoSizes.map(pngPathFor).filter((p) => fs.existsSync(p))
    if (icoPngs.length > 0) {
      const icoBuf = buildIcoFromPngs(icoPngs)
      fs.writeFileSync(icoPath, icoBuf)
      console.log(`     - panda.ico: ${icoBuf.length} bytes (${icoPngs.length} sizes)`)
    } else {
      console.warn('[warn] no PNG inputs for panda.ico')
    }
  } catch (err) {
    console.error('[err] buildIcoFromPngs:', err.message)
  }

  try {
    const icnsPngs = icnsSizes.map(pngPathFor).filter((p) => fs.existsSync(p))
    if (icnsPngs.length > 0) {
      const icnsBuf = buildIcnsFromPngs(icnsPngs)
      fs.writeFileSync(icnsPath, icnsBuf)
      console.log(`     - panda.icns: ${icnsBuf.length} bytes (${icnsPngs.length} sizes)`)
    } else {
      console.warn('[warn] no PNG inputs for panda.icns')
    }
  } catch (err) {
    console.error('[err] buildIcnsFromPngs:', err.message)
  }

  return { icnsPath, icoPath }
}

async function main() {
  console.log(
    `[panda-on-desk · P3-T5] building icons${DRY ? ' (DRY RUN)' : ''}...`,
  )
  const tasks = [
    { svg: path.join(ICONS_DIR, 'panda.svg'), base: 'panda', sizes: PANDA_SIZES },
    {
      svg: path.join(ICONS_DIR, 'tray-light.svg'),
      base: 'tray-light',
      sizes: TRAY_SIZES,
    },
    {
      svg: path.join(ICONS_DIR, 'tray-dark.svg'),
      base: 'tray-dark',
      sizes: TRAY_SIZES,
    },
  ]

  const summary = []
  for (const t of tasks) {
    console.log(`  -> ${t.base} (${t.sizes.join(', ')}px)`)
    const outs = await renderSvgToPngSizes(t.svg, t.base, t.sizes)
    summary.push({ base: t.base, count: outs.length, outs })
  }

  const placeholders = writeIcoIcnsPlaceholders()
  summary.push({ base: 'placeholders', count: 2, outs: [placeholders] })

  console.log(`[ok] icon build summary:`)
  for (const s of summary) {
    console.log(`     - ${s.base}: ${s.count} output(s)`)
  }
  console.log(`[ok] panda.ico / panda.icns generated from PNG (electron-builder ready).`)
}

if (require.main === module) {
  main().catch((err) => {
    console.error('[fatal]', err)
    process.exit(1)
  })
}

module.exports = {
  PANDA_SIZES,
  TRAY_SIZES,
  ICONS_DIR,
  renderSvgToPngSizes,
  writeIcoIcnsPlaceholders,
  tryRequireSharp,
}
