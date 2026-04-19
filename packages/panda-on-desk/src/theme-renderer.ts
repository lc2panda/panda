// Input: themes/panda/theme.json + sprites/{species}.ascii (旧 ASCII 路径)
//        + sprites/{species}.svg  (P3-T5 新 SVG 路径，由 scripts/build-sprites.cjs 生成)
// Output: HTML 字符串（<pre> ASCII 路径 / <div><svg> 矢量路径）+ 主题元数据 helper
// Pos: panda-on-desk 主题渲染器 — 双路径：
//      1. renderSpriteToHtml: v0.x ASCII 占位（兼容保留）
//      2. renderSpriteToSvgHtml: v1.5+ SVG 矢量（P3-T5 美术资产，默认）
//      与 theme-loader.ts 协作（loader 解析 schema/sanitize SVG；renderer 输出 HTML）。
//
// [NEW-FILE:#20260419-P1-10] [UPDATED:#20260419-P3T5-art]

import * as fs from 'node:fs'
import * as path from 'node:path'

// PetState 12 态枚举（与 src/buddy/types.ts::PET_STATES 完全一致 — 只复制常量值，
// 不 import 跨包符号避免 panda-on-desk 反向依赖根 src/buddy/）
export const PANDA_PET_STATES = [
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
] as const
export type PandaPetState = (typeof PANDA_PET_STATES)[number]

// 18 物种枚举（与 src/buddy/types.ts::SPECIES 完全一致 — 同上原因复制常量）
export const PANDA_SPECIES = [
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
] as const
export type PandaSpecies = (typeof PANDA_SPECIES)[number]

// Eye 占位符 — sprite 模板里 {E} 会被替换成真实 eye 字符
const EYE_PLACEHOLDER = '{E}'
const DEFAULT_EYE = '·'

// frame 分隔符（在 .ascii 文件里用 `---` 一行分隔多帧）
const FRAME_SEPARATOR_RE = /^---\s*$/

// 缓存：themeDir → species → frames[][]（避免每次 render 都做 fs IO）
type SpriteCache = Map<string, string[][]>
const _spriteCache = new WeakMap<object, SpriteCache>()

// theme.json 反序列化后的最小子集（renderer 只用其中几个字段；完整 schema 在 theme-loader.ts）
export interface PandaThemeJson {
  schemaVersion: number
  id?: string
  name: string
  version: string
  states: Record<string, string[] | { files?: string[]; fallbackTo?: string }>
  viewBox?: { x: number; y: number; width: number; height: number }
  [k: string]: unknown
}

export interface LoadedPandaTheme {
  id: string
  themeDir: string
  json: PandaThemeJson
  // 内部缓存挂载点 — sprite parse 结果按需 lazy fill
  _cacheKey: object
}

/**
 * 读取并解析 themes/panda/theme.json。
 * @param themeDir 绝对路径，指向 themes/panda（不含 theme.json 本身）
 * @returns LoadedPandaTheme
 * @throws 当 theme.json 缺失或 JSON 格式非法
 */
export function loadPandaTheme(themeDir: string): LoadedPandaTheme {
  const jsonPath = path.join(themeDir, 'theme.json')
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`[panda-renderer] theme.json not found at ${jsonPath}`)
  }
  let raw: string
  try {
    raw = fs.readFileSync(jsonPath, 'utf8')
  } catch (err) {
    throw new Error(
      `[panda-renderer] failed to read theme.json: ${(err as Error).message}`,
    )
  }
  let parsed: PandaThemeJson
  try {
    parsed = JSON.parse(raw)
  } catch (err) {
    throw new Error(
      `[panda-renderer] theme.json is not valid JSON: ${(err as Error).message}`,
    )
  }
  if (parsed.schemaVersion !== 1) {
    throw new Error(
      `[panda-renderer] unsupported schemaVersion ${parsed.schemaVersion}; expected 1`,
    )
  }
  if (!parsed.states || typeof parsed.states !== 'object') {
    throw new Error('[panda-renderer] theme.json missing states map')
  }
  const cacheKey = {}
  _spriteCache.set(cacheKey, new Map())
  return {
    id: typeof parsed.id === 'string' ? parsed.id : path.basename(themeDir),
    themeDir,
    json: parsed,
    _cacheKey: cacheKey,
  }
}

/**
 * 便捷加载器 — 等价于 `loadPandaTheme(<repo>/themes/<themeId>)`
 * 默认查 panda-on-desk 包内置 themes/ 目录。
 * @param themeId 主题文件夹名（默认 'panda'）
 * @param baseDir 可选；测试场景可注入自定义 themes 父目录
 */
export function loadTheme(
  themeId: string = 'panda',
  baseDir?: string,
): LoadedPandaTheme {
  const root =
    baseDir ?? path.resolve(__dirname, '..', 'themes')
  return loadPandaTheme(path.join(root, themeId))
}

/**
 * 解析 .ascii 文件 — 按 `---` 分隔得到 frame 数组，每 frame 是行数组。
 * 注释行（# 开头）和 frame 内的全空白前导行被剔除。
 */
export function parseAsciiSprite(text: string): string[][] {
  const lines = text.split(/\r?\n/)
  const frames: string[][] = []
  let current: string[] = []
  for (const line of lines) {
    if (FRAME_SEPARATOR_RE.test(line)) {
      frames.push(_trimFrame(current))
      current = []
      continue
    }
    if (line.startsWith('#')) continue
    current.push(line)
  }
  if (current.length > 0) frames.push(_trimFrame(current))
  // 过滤掉空 frame（全行被注释清掉的情况）
  return frames.filter((f) => f.length > 0)
}

function _trimFrame(lines: string[]): string[] {
  // 去掉 frame 头尾纯空行；保留中间 padding（保等宽对齐）
  let start = 0
  let end = lines.length
  while (start < end && lines[start]!.trim() === '') start++
  while (end > start && lines[end - 1]!.trim() === '') end--
  return lines.slice(start, end)
}

/**
 * 加载指定 species 的 sprite 帧。带缓存；命中走内存。
 * 找不到 species 文件 → fallback 到 default.ascii。
 */
export function loadSpeciesSprite(
  theme: LoadedPandaTheme,
  species: string,
): string[][] {
  const cache = _spriteCache.get(theme._cacheKey)!
  const cached = cache.get(species)
  if (cached) return cached

  const candidates = [
    path.join(theme.themeDir, 'sprites', `${species}.ascii`),
    path.join(theme.themeDir, 'sprites', 'default.ascii'),
  ]
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue
    const text = fs.readFileSync(file, 'utf8')
    const frames = parseAsciiSprite(text)
    if (frames.length === 0) continue
    cache.set(species, frames)
    return frames
  }
  // 极端兜底：返回单帧空白避免 caller 崩溃
  const emptyFrame: string[][] = [['(missing sprite)']]
  cache.set(species, emptyFrame)
  return emptyFrame
}

/**
 * 替换 {E} 占位符为真实 eye 字符。
 */
export function applyEye(frame: string[], eye: string = DEFAULT_EYE): string[] {
  return frame.map((line) => line.split(EYE_PLACEHOLDER).join(eye))
}

/**
 * 渲染选项 — 颜色 / eye / frame 索引。
 */
export interface RenderOptions {
  /** Eye 字符（默认 '·'）— 替换 sprite 模板里的 {E} 占位符 */
  eye?: string
  /** 帧索引（默认 0）；越界自动 mod */
  frame?: number
  /** 文本颜色 CSS（默认 'white'）— 通常按 RARITY_COLORS 由 caller 注入 */
  color?: string
  /** 背景色 CSS（默认 'transparent'） */
  background?: string
  /** 字体大小 CSS（默认 '14px'） */
  fontSize?: string
  /** 行高 CSS（默认 '1'） */
  lineHeight?: string | number
  /** 字间距 CSS（默认 '0'） */
  letterSpacing?: string
}

/**
 * 把 (species, state, frame) 三元组渲染为 HTML 字符串。
 * 渲染产物：单个 <pre> 节点，等宽字体 + caller-injected 颜色，状态/光晕等表现层
 * 由调用方包一层 wrapper 加 CSS class（renderer 不下场策略层）。
 *
 * @param theme    loadPandaTheme 返回值
 * @param species  18 物种之一（未知 → default）
 * @param state    12 PetState 之一（未知 → idle）
 * @param frame    帧序号，0..N-1
 * @param opts     可选渲染参数
 * @returns        HTML 字符串，可直接 innerHTML 插入容器
 */
export function renderSpriteToHtml(
  theme: LoadedPandaTheme,
  species: string,
  state: string,
  frame: number = 0,
  opts: RenderOptions = {},
): string {
  // state 当前 v0.1 仅作为元数据透传 + 入参校验；所有 state 共享同一份 species frames。
  // v0.5+ B 阶段会引入 state-driven 帧（每个 state 独立 .ascii section），届时按 state 选 frames。
  const stateForAttr = _isKnownState(state) ? state : 'idle'
  const speciesForAttr = _isKnownSpecies(species) ? species : 'default'

  const frames = loadSpeciesSprite(theme, speciesForAttr)
  const safeFrame = frames[Math.abs(frame) % frames.length]!
  const lines = applyEye(safeFrame, opts.eye ?? DEFAULT_EYE)

  const color = opts.color ?? 'white'
  const background = opts.background ?? 'transparent'
  const fontSize = opts.fontSize ?? '14px'
  const lineHeight = String(opts.lineHeight ?? '1')
  const letterSpacing = opts.letterSpacing ?? '0'

  const styleParts = [
    'font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace',
    `color:${_escapeCssValue(color)}`,
    `background:${_escapeCssValue(background)}`,
    `font-size:${_escapeCssValue(fontSize)}`,
    `line-height:${_escapeCssValue(lineHeight)}`,
    `letter-spacing:${_escapeCssValue(letterSpacing)}`,
    'margin:0',
    'padding:0',
    'white-space:pre',
  ]
  const style = styleParts.join(';')
  const body = lines.map((l) => _escapeHtml(l)).join('\n')

  return (
    `<pre class="panda-sprite" data-species="${_escapeAttr(speciesForAttr)}" ` +
    `data-state="${_escapeAttr(stateForAttr)}" data-frame="${frame}" ` +
    `style="${style}">${body}</pre>`
  )
}

// ── v1.5+ SVG 渲染路径（P3-T5 美术资产）─────────────────────────────────────
// SVG 资产由 scripts/build-sprites.cjs 程序化生成（每 species 一个 .svg
// 含 12 个 <g id="state-{state}">）。本路径作为 v1.5+ 默认渲染策略，
// 旧 ASCII 路径（renderSpriteToHtml）保留向后兼容。

// 缓存：每 themeDir 一个 species → svg 字符串
type SvgCache = Map<string, string>
const _svgCache = new WeakMap<object, SvgCache>()

function _getSvgCache(theme: LoadedPandaTheme): SvgCache {
  let c = _svgCache.get(theme._cacheKey)
  if (!c) {
    c = new Map()
    _svgCache.set(theme._cacheKey, c)
  }
  return c
}

/**
 * 加载指定 species 的 SVG 文件原始字符串（不解析）。
 * 找不到 → fallback 到 default.svg；再找不到 → 返回 null。
 */
export function loadSpeciesSvg(
  theme: LoadedPandaTheme,
  species: string,
): string | null {
  const cache = _getSvgCache(theme)
  const cached = cache.get(species)
  if (cached) return cached

  const candidates = [
    path.join(theme.themeDir, 'sprites', `${species}.svg`),
    path.join(theme.themeDir, 'sprites', 'default.svg'),
  ]
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue
    try {
      const text = fs.readFileSync(file, 'utf8')
      if (text && text.includes('<svg')) {
        cache.set(species, text)
        return text
      }
    } catch {
      // 读取失败兜底到下一个候选
    }
  }
  return null
}

/**
 * SVG 渲染选项 — state group visibility 切换 + 颜色覆盖。
 */
export interface SvgRenderOptions {
  /** 高亮哪个 state（其它 group 设 visibility="hidden"）；默认 'idle' */
  state?: string
  /** 容器 CSS class（默认 'panda-sprite-svg'） */
  className?: string
  /** 容器内联宽度（默认 unset — 跟随 viewBox） */
  width?: string | number
  /** 容器内联高度 */
  height?: string | number
}

/**
 * 把 species SVG 嵌入 HTML 容器，并按 state 切换 group visibility。
 * 与 renderSpriteToHtml 不同：本路径是 SVG 矢量（v1.5+ 美术资产），
 * 旧 ASCII 路径仅用于无 SVG 资产或 v0.x 兼容场景。
 *
 * @param theme    loadPandaTheme 返回值
 * @param species  18 物种之一（未知 → default）
 * @param state    12 PetState 之一（未知 → idle）
 * @param frame    向后兼容入参（SVG 路径下 frame 由 build-sprites 生成期决定，
 *                 运行期仅作 data-attr 透传，不再选帧）
 * @param opts     可选 SVG 渲染参数
 * @returns        HTML 字符串；若 SVG 资产缺失，自动降级到 ASCII 路径
 */
export function renderSpriteToSvgHtml(
  theme: LoadedPandaTheme,
  species: string,
  state: string,
  frame: number = 0,
  opts: SvgRenderOptions = {},
): string {
  const stateForAttr = _isKnownState(state) ? state : 'idle'
  const speciesForAttr = _isKnownSpecies(species) ? species : 'default'

  const svgRaw = loadSpeciesSvg(theme, speciesForAttr)
  if (!svgRaw) {
    // 资产缺失 → 降级到 ASCII 路径，保证不抛错
    return renderSpriteToHtml(theme, species, state, frame)
  }

  // 切 visibility — 把 visibility="visible" 整体替换为 hidden，再把目标 state 设为 visible。
  // 安全：仅替换 group 标签上的 visibility 属性（不动 group 内的 <text>）。
  const allHidden = svgRaw.replace(
    /(<g\s+id="state-[a-z]+"[^>]*?)\s+visibility="(?:visible|hidden)"/g,
    '$1 visibility="hidden"',
  )
  const targetMarker = `id="state-${stateForAttr}"`
  const enabled = allHidden.replace(
    new RegExp(
      `(<g\\s+${targetMarker.replace(/"/g, '"')}[^>]*?)\\s+visibility="hidden"`,
    ),
    '$1 visibility="visible"',
  )

  const className = opts.className ?? 'panda-sprite-svg'
  const styleParts: string[] = ['display:inline-block', 'line-height:0']
  if (opts.width != null) styleParts.push(`width:${_escapeCssValue(opts.width)}`)
  if (opts.height != null)
    styleParts.push(`height:${_escapeCssValue(opts.height)}`)
  const style = styleParts.join(';')

  return (
    `<div class="${_escapeAttr(className)}" data-species="${_escapeAttr(speciesForAttr)}" ` +
    `data-state="${_escapeAttr(stateForAttr)}" data-frame="${frame}" ` +
    `style="${style}">${enabled}</div>`
  )
}

/**
 * 主题元数据快照 — UI 层用来渲染 "About this theme" 之类的面板。
 */
export function getThemeMetadata(theme: LoadedPandaTheme): {
  id: string
  name: string
  version: string
  speciesCount: number
  stateCount: number
} {
  const stateKeys = Object.keys(theme.json.states).filter(
    (k) => !k.startsWith('_'),
  )
  return {
    id: theme.id,
    name: theme.json.name,
    version: theme.json.version,
    speciesCount: PANDA_SPECIES.length,
    stateCount: stateKeys.length,
  }
}

// ── internals ──

function _isKnownState(s: string): s is PandaPetState {
  return (PANDA_PET_STATES as readonly string[]).includes(s)
}
function _isKnownSpecies(s: string): s is PandaSpecies {
  return (PANDA_SPECIES as readonly string[]).includes(s)
}

const _HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}
function _escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => _HTML_ESCAPES[c]!)
}
function _escapeAttr(s: string): string {
  return _escapeHtml(s)
}
// 防 CSS 注入（颜色/字号被 caller 控制，但仍剔除分号/角括号兜底）
function _escapeCssValue(v: string | number): string {
  return String(v).replace(/[<>;{}"']/g, '')
}
