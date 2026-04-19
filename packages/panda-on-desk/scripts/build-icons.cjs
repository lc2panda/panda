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

function writeIcoIcnsPlaceholders() {
  // mac .icns 需 iconutil（仅 mac）；win .ico 需 ico packer。本脚本不强求；
  // 写一个文本占位，标识"待 CI 替换"，确保 electron-builder 不会因缺文件 fail。
  const icnsPath = path.join(ICONS_DIR, 'panda.icns')
  const icoPath = path.join(ICONS_DIR, 'panda.ico')
  const note =
    `# panda-on-desk icon placeholder\n` +
    `# Generated: ${new Date().toISOString()}\n` +
    `# Source: build/icons/panda.svg\n` +
    `# Action required: replace with real ${path.basename(icnsPath)} via iconutil (mac) / png-to-ico (win) at packaging time.\n`
  if (DRY) return { icnsPath, icoPath, dry: true }
  // 仅在文件不存在或为旧占位（< 1KB）时刷新；避免覆盖已 CI 生成的真 icon
  for (const p of [icnsPath, icoPath]) {
    if (!fs.existsSync(p) || fs.statSync(p).size < 1024) {
      fs.writeFileSync(p, note, 'utf8')
    }
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
  console.log(
    `[note] panda.icns / panda.ico are text placeholders; replace at CI/packaging step.`,
  )
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
