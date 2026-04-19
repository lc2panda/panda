// Input: hit 窗口 IPC 事件（state-change / eye-move / drag / reaction / theme-config）
// Output: SVG/IMG 渲染、眼球追踪、淡入淡出、mini-flip 处理
// Pos: panda-on-desk renderer 主入口（hit 窗 = 主宠物窗），由 index.html <script> 引用
//
// Forked from clawd-on-desk@4b07658:src/renderer.js (MIT License) - Panda branded
// JS → TS 直接转：参数类型用 any 维持 1:1 行为；CSP 不变；DOM API 无差异。
// 品牌点：clawdEl → pandaEl，DOM id "clawd" → "panda"（与 index.html / styles.css 同步）。
//
// [NEW-FILE:#20260419-OD-P1-T4-01]

// --- Render window: pure view (SVG rendering + eye tracking) ---
// All input (pointer/drag/click) is handled by the hit window (hit-renderer.js).
// Reactions are triggered via IPC from main (relayed from hit window).

declare global {
  interface Window {
    themeConfig?: any
    electronAPI: any
  }
}

const container = document.getElementById('pet-container') as HTMLElement
let pandaEl: any = document.getElementById('panda')
let pendingNext: any = null

// ── Theme config (injected via preload.js additionalArguments) ──
let tc: any = window.themeConfig || {}

let _assetsPath: string
let _sourceAssetsPath: string | null
let _viewBox: any
let _layout: any
let _eyeIds: any
let _bodyScale: number
let _shadowStretch: number
let _shadowShift: number
let _eyeTrackingStates: string[]
let _dragSvg: string | null
let _idleFollowSvg: string
let _glyphFlipDefs: Record<string, number>
let _objectScaleCSS: any
let _fileScales: Record<string, number> = {}
let _fileOffsets: Record<string, { x: number; y: number }> = {}
let _transitions: Record<string, { in?: number; out?: number }> = {}
let _miniFlipAssets = false
let _inMiniMode = false
let _viewportOffsetY = 0

// ── Layered tracking state (multi-layer eye/head/body tracking) ──
let _useLayeredTracking = false
let _trackingLayersConfig: any = null
let _themeMaxOffset = 20
let _trackingLayers: any = null
let _layerTargetDx = 0
let _layerTargetDy = 0
let _layerAnimFrame: number | null = null
let _layeredTrackingObj: any = null

function initWithConfig(cfg: any): void {
  tc = cfg || {}
  _viewBox = tc.viewBox || { x: -15, y: -25, width: 45, height: 45 }
  _layout = tc.layout || null
  _assetsPath = tc.assetsPath || '../assets/svg'
  _sourceAssetsPath = tc.sourceAssetsPath || null
  _eyeIds = (tc.eyeTracking && tc.eyeTracking.ids) || {
    eyes: 'eyes-js',
    body: 'body-js',
    shadow: 'shadow-js',
    dozeEyes: 'eyes-doze',
  }
  _bodyScale = (tc.eyeTracking && tc.eyeTracking.bodyScale) || 0.33
  _shadowStretch = (tc.eyeTracking && tc.eyeTracking.shadowStretch) || 0.15
  _shadowShift = (tc.eyeTracking && tc.eyeTracking.shadowShift) || 0.3
  _eyeTrackingStates = tc.eyeTrackingStates || ['idle', 'dozing', 'mini-idle']
  _dragSvg = tc.dragSvg || null
  _idleFollowSvg = tc.idleFollowSvg || 'panda-idle-follow.svg'
  _glyphFlipDefs = tc.glyphFlips || { 'pixel-z': 4, 'pixel-z-small': 3 }

  _useLayeredTracking = !!(tc.eyeTracking && tc.eyeTracking.trackingLayers)
  _trackingLayersConfig = _useLayeredTracking ? tc.eyeTracking.trackingLayers : null
  _themeMaxOffset = (tc.eyeTracking && tc.eyeTracking.maxOffset) || 20

  const os = tc.objectScale || {
    widthRatio: 1.9,
    heightRatio: 1.3,
    offsetX: -0.45,
    offsetY: -0.25,
  }
  _objectScaleCSS = {
    width: `${os.widthRatio * 100}%`,
    height: `${os.heightRatio * 100}%`,
    imgWidthBase: (os.imgWidthRatio || os.widthRatio) * 100,
    left: `${os.offsetX * 100}%`,
    imgLeft: `${(os.imgOffsetX != null ? os.imgOffsetX : os.offsetX) * 100}%`,
    objBottom: `${(os.objBottom != null ? os.objBottom : 1 - os.offsetY - os.heightRatio) * 100}%`,
    imgBottom: `${(os.imgBottom != null ? os.imgBottom : 0.05) * 100}%`,
  }
  _fileScales = os.fileScales || {}
  _fileOffsets = os.fileOffsets || {}
  _transitions = tc.transitions || {}
  _miniFlipAssets = !!tc.miniFlipAssets

  applyObjectScaleStyle(pandaEl)
  applyObjectScaleStyle(pendingNext)
}

function applyObjectScaleStyle(el: any, file?: string | null): void {
  if (!el || !_objectScaleCSS) return
  if (shouldUseNormalizedLayout(file)) {
    applyNormalizedLayoutStyle(el, file)
    return
  }
  const fo = (file && _fileOffsets[file]) || null
  const ox = fo ? fo.x : 0
  const oy = fo ? fo.y : 0

  if (el.tagName === 'IMG') {
    const scale = (file && _fileScales[file]) || 1.0
    el.style.width = `${_objectScaleCSS.imgWidthBase * scale}%`
    el.style.height = 'auto'
    el.style.left = `calc(${_objectScaleCSS.imgLeft} + ${ox}px)`
    el.style.top = 'auto'
    el.style.bottom = `calc(${_objectScaleCSS.imgBottom || '5%'} + ${oy + _viewportOffsetY}px)`
  } else {
    el.style.width = _objectScaleCSS.width
    el.style.height = _objectScaleCSS.height
    el.style.left = `calc(${_objectScaleCSS.left} + ${ox}px)`
    el.style.top = 'auto'
    el.style.bottom = `calc(${_objectScaleCSS.objBottom} + ${oy + _viewportOffsetY}px)`
  }
}

function shouldUseNormalizedLayout(file?: string | null): boolean {
  if (!_layout || !_layout.contentBox) return false
  if (_inMiniMode || (file && file.startsWith('mini-'))) return false
  return true
}

function applyNormalizedLayoutStyle(el: any, file?: string | null): void {
  if (!el || !_layout || !_layout.contentBox || !_viewBox) return
  const fo = (file && _fileOffsets[file]) || null
  const ox = fo ? fo.x : 0
  const oy = fo ? fo.y : 0
  const scale = (file && _fileScales[file]) || 1.0
  const cb = _layout.contentBox
  const centerX = _layout.centerX != null ? _layout.centerX : cb.x + cb.width / 2
  const baselineY = _layout.baselineY != null ? _layout.baselineY : cb.y + cb.height
  const unitRatio = ((_layout.visibleHeightRatio || 0.58) * scale) / cb.height
  const widthRatio = _viewBox.width * unitRatio
  const heightRatio = _viewBox.height * unitRatio
  const leftRatio =
    (_layout.centerXRatio != null ? _layout.centerXRatio : 0.5) -
    (centerX - _viewBox.x) * unitRatio
  const bottomRatio =
    (_layout.baselineBottomRatio != null ? _layout.baselineBottomRatio : 0.05) -
    (_viewBox.y + _viewBox.height - baselineY) * unitRatio

  if (el.tagName === 'IMG') {
    el.style.width = `${widthRatio * 100}%`
    el.style.height = 'auto'
    el.style.left = `calc(${leftRatio * 100}% + ${ox}px)`
    el.style.top = 'auto'
    el.style.bottom = `calc(${bottomRatio * 100}% + ${oy + _viewportOffsetY}px)`
  } else {
    el.style.width = `${widthRatio * 100}%`
    el.style.height = `${heightRatio * 100}%`
    el.style.left = `calc(${leftRatio * 100}% + ${ox}px)`
    el.style.top = 'auto'
    el.style.bottom = `calc(${bottomRatio * 100}% + ${oy + _viewportOffsetY}px)`
  }
}

function setViewportOffset(offsetY: number): void {
  const next = Number.isFinite(offsetY) ? Math.max(0, Math.round(offsetY)) : 0
  if (next === _viewportOffsetY) return
  _viewportOffsetY = next
  applyObjectScaleStyle(pandaEl, currentDisplayedSvg)
  if (pendingNext) {
    applyObjectScaleStyle(pendingNext, getObjectSvgName(pendingNext))
  }
}

function applyMiniFlip(el: any): void {
  if (!el || el.tagName !== 'IMG') return
  el.style.transform = _miniFlipAssets && _inMiniMode ? 'scaleX(-1)' : ''
}

initWithConfig(tc)

// Theme switch: reload + IPC push overrides additionalArguments
window.electronAPI.onThemeConfig((newConfig: any) => {
  _cleanupLayeredTracking()
  initWithConfig(newConfig)
})

window.electronAPI.onViewportOffset((offsetY: number) => {
  setViewportOffset(offsetY)
})

// Release an <object> SVG element: navigate away to unload the SVG document
function releaseObject(el: any): void {
  if (!el) return
  try {
    el.data = ''
  } catch {}
  el.remove()
}

function releaseImg(el: any): void {
  if (!el) return
  try {
    el.src = ''
  } catch {}
  el.remove()
}

// --- Reaction state (visual side) ---
let isReacting = false
let isDragReacting = false
let reactTimer: any = null
let currentIdleSvg: string | null = null
let dndEnabled = false
let miniLeftFlip = false

window.electronAPI.onDndChange((enabled: boolean) => {
  dndEnabled = enabled
})

window.electronAPI.onMiniModeChange((enabled: boolean, edge?: string) => {
  _inMiniMode = enabled
  miniLeftFlip = enabled && edge === 'left'
  container.classList.toggle('mini-left', miniLeftFlip)
  applyMiniFlip(pandaEl)
  if (miniLeftFlip) {
    applyGlyphFlipCompensation(pandaEl)
  } else {
    removeGlyphFlipCompensation(pandaEl)
  }
})

function applyGlyphFlipCompensation(objectEl: any): void {
  if (!objectEl || objectEl.tagName !== 'OBJECT') return
  try {
    const doc = objectEl.contentDocument
    if (!doc) return
    for (const [id, w] of Object.entries(_glyphFlipDefs)) {
      const el = doc.getElementById(id)
      if (el) el.setAttribute('transform', `translate(${w}, 0) scale(-1, 1)`)
    }
  } catch {}
}

function removeGlyphFlipCompensation(objectEl: any): void {
  if (!objectEl || objectEl.tagName !== 'OBJECT') return
  try {
    const doc = objectEl.contentDocument
    if (!doc) return
    for (const id of Object.keys(_glyphFlipDefs)) {
      const el = doc.getElementById(id)
      if (el) el.removeAttribute('transform')
    }
  } catch {}
}

function getObjectSvgName(objectEl: any): string | null {
  if (!objectEl) return null
  const data =
    objectEl.tagName === 'OBJECT'
      ? objectEl.getAttribute('data') || objectEl.data || ''
      : objectEl.getAttribute('src') || objectEl.src || ''
  if (!data) return null
  const clean = data.split(/[?#]/)[0]
  const parts = clean.split('/')
  return parts[parts.length - 1] || null
}

function needsObjectChannel(state: string | null, file: string | null): boolean {
  if (!file) return false
  if (!file.endsWith('.svg')) return false
  return _eyeTrackingStates.includes(state as string)
}

function getAssetUrl(file: string | null): string {
  if (!file) return ''
  if (file.endsWith('.svg') || !_sourceAssetsPath) {
    return `${_assetsPath}/${file}`
  }
  return `${_sourceAssetsPath}/${file}`
}

// --- IPC-triggered reactions (from hit window via main relay) ---
window.electronAPI.onStartDragReaction(() => startDragReaction())
window.electronAPI.onEndDragReaction(() => endDragReaction())
window.electronAPI.onPlayClickReaction((svg: string, duration: number) =>
  playReaction(svg, duration),
)

function playReaction(svgFile: string, durationMs: number): void {
  isReacting = true
  detachEyeTracking()
  window.electronAPI.pauseCursorPolling()

  swapToFile(svgFile, null, false)

  reactTimer = setTimeout(() => endReaction(), durationMs)
}

function endReaction(): void {
  if (!isReacting) return
  isReacting = false
  reactTimer = null
  window.electronAPI.resumeFromReaction()
}

function cancelReaction(): void {
  if (isReacting) {
    if (reactTimer) {
      clearTimeout(reactTimer)
      reactTimer = null
    }
    isReacting = false
  }
  if (isDragReacting) {
    isDragReacting = false
  }
}

function startDragReaction(): void {
  if (isDragReacting) return
  if (dndEnabled) return
  if (!_dragSvg) return

  if (isReacting) {
    if (reactTimer) {
      clearTimeout(reactTimer)
      reactTimer = null
    }
    isReacting = false
  }

  isDragReacting = true
  detachEyeTracking()
  window.electronAPI.pauseCursorPolling()
  swapToFile(_dragSvg, null, false)
}

function endDragReaction(): void {
  if (!isDragReacting) return
  isDragReacting = false
  window.electronAPI.resumeFromReaction()
}

// --- Generic swap function ---
let currentDisplayedSvg: string | null = getObjectSvgName(pandaEl)
let pendingSvgFile: string | null = null
currentIdleSvg = currentDisplayedSvg

function fadeOutAndRemove(el: any, durationMs: number): void {
  el.style.transition = `opacity ${durationMs}ms ease-out`
  el.style.opacity = '0'
  setTimeout(() => {
    if (el.tagName === 'OBJECT') releaseObject(el)
    else releaseImg(el)
  }, durationMs)
}

function swapToFile(file: string, state: string | null, useObjectChannel?: boolean): void {
  if (pendingNext) {
    if (pendingNext.tagName === 'OBJECT') releaseObject(pendingNext)
    else releaseImg(pendingNext)
    pendingNext = null
  }

  pendingSvgFile = file
  const useObj =
    useObjectChannel !== undefined ? useObjectChannel : needsObjectChannel(state, file)
  const url = getAssetUrl(file)

  if (useObj) {
    const next: any = document.createElement('object')
    next.type = 'image/svg+xml'
    next.id = 'panda'
    next.style.opacity = '0'
    applyObjectScaleStyle(next, file)

    const swap = () => {
      if (pendingNext !== next) return
      const fadeInMs = (_transitions[file] && _transitions[file].in) || 0
      const fadeOutMs =
        (currentDisplayedSvg &&
          _transitions[currentDisplayedSvg] &&
          _transitions[currentDisplayedSvg].out) ||
        0

      if (fadeInMs > 0) {
        next.style.transition = `opacity ${fadeInMs}ms ease-in`
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        next.offsetHeight // force reflow
      } else {
        next.style.transition = 'none'
      }
      next.style.opacity = '1'

      for (const child of [...container.querySelectorAll('object, img.panda-img')] as any[]) {
        if (child !== next) {
          if (fadeOutMs > 0) fadeOutAndRemove(child, fadeOutMs)
          else if (child.tagName === 'OBJECT') releaseObject(child)
          else releaseImg(child)
        }
      }
      pendingNext = null
      pendingSvgFile = null
      pandaEl = next
      currentDisplayedSvg = file

      if (state && needsObjectChannel(state, file)) {
        attachEyeTracking(next)
      }
      if (miniLeftFlip) applyGlyphFlipCompensation(next)
    }

    next.addEventListener('load', swap, { once: true })
    next.data = url
    container.appendChild(next)
    pendingNext = next
    setTimeout(() => {
      if (pendingNext !== next) return
      try {
        if (!next.contentDocument) {
          releaseObject(next)
          pendingNext = null
          return
        }
      } catch {}
      swap()
    }, 3000)
  } else {
    const next: any = document.createElement('img')
    next.className = 'panda-img'
    next.id = 'panda'
    next.style.opacity = '0'
    applyObjectScaleStyle(next, file)
    applyMiniFlip(next)

    const swap = () => {
      if (pendingNext !== next) return
      const fadeInMs = (_transitions[file] && _transitions[file].in) || 0
      const fadeOutMs =
        (currentDisplayedSvg &&
          _transitions[currentDisplayedSvg] &&
          _transitions[currentDisplayedSvg].out) ||
        0

      if (fadeInMs > 0) {
        next.style.transition = `opacity ${fadeInMs}ms ease-in`
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        next.offsetHeight
      } else {
        next.style.transition = 'none'
      }
      next.style.opacity = '1'

      for (const child of [...container.querySelectorAll('object, img.panda-img')] as any[]) {
        if (child !== next) {
          if (fadeOutMs > 0) fadeOutAndRemove(child, fadeOutMs)
          else if (child.tagName === 'OBJECT') releaseObject(child)
          else releaseImg(child)
        }
      }
      pendingNext = null
      pendingSvgFile = null
      pandaEl = next
      currentDisplayedSvg = file
    }

    next.addEventListener('load', swap, { once: true })
    // Cache-bust query param: forces fresh SVG document & animation start each swap.
    next.src = `${url}${url.includes('?') ? '&' : '?'}_t=${Date.now()}`
    container.appendChild(next)
    pendingNext = next
    setTimeout(() => {
      if (pendingNext !== next) return
      swap()
    }, 3000)
  }
}

// --- State change → switch animation (preload + instant swap) ---
window.electronAPI.onStateChange((state: string, svg: string) => {
  cancelReaction()

  const alreadyDisplayed = pandaEl && pandaEl.isConnected && currentDisplayedSvg === svg
  const alreadyPending = pendingSvgFile === svg && pendingNext

  if (alreadyDisplayed || alreadyPending) {
    if (alreadyDisplayed) {
      if (needsObjectChannel(state, svg) && !eyeTarget && !_trackingLayers) {
        if (pandaEl.tagName === 'OBJECT') attachEyeTracking(pandaEl)
      } else if (!needsObjectChannel(state, svg)) {
        detachEyeTracking()
      }
    }
    currentIdleSvg = svg
    return
  }

  if (pendingNext) {
    if (pendingNext.tagName === 'OBJECT') releaseObject(pendingNext)
    else releaseImg(pendingNext)
    pendingNext = null
    pendingSvgFile = null
  }
  detachEyeTracking()

  swapToFile(svg, state)
  currentIdleSvg = svg
})

// --- Eye tracking (idle state only) ---
let eyeTarget: any = null
let bodyTarget: any = null
let shadowTarget: any = null
let lastEyeDx = 0
let lastEyeDy = 0
let eyeAttachToken = 0

function applyEyeMove(dx: number, dy: number): void {
  if (eyeTarget) {
    eyeTarget.setAttribute('transform', `translate(${dx}, ${dy})`)
  }
  if (bodyTarget || shadowTarget) {
    const bdx = Math.round(dx * _bodyScale * 2) / 2
    const bdy = Math.round(dy * _bodyScale * 2) / 2
    if (bodyTarget) bodyTarget.setAttribute('transform', `translate(${bdx}, ${bdy})`)
    if (shadowTarget) {
      const absDx = Math.abs(bdx)
      const scaleX = 1 + absDx * _shadowStretch
      const shiftX = Math.round(bdx * _shadowShift * 2) / 2
      shadowTarget.setAttribute('transform', `translate(${shiftX}, 0) scale(${scaleX}, 1)`)
    }
  }
}

// ── Layered tracking helpers ──

function _wrapSvgElement(svgDoc: any, el: any): any {
  if (!el) return null
  const wrapper = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'g')
  wrapper.setAttribute('data-tracking-wrapper', '1')
  el.parentNode.insertBefore(wrapper, el)
  wrapper.appendChild(el)
  return wrapper
}

function _unwrapAll(svgDoc: any): void {
  if (!svgDoc) return
  try {
    const wrappers = svgDoc.querySelectorAll('[data-tracking-wrapper]')
    for (const wrapper of wrappers) {
      const parent = wrapper.parentNode
      if (!parent) continue
      while (wrapper.firstChild) {
        parent.insertBefore(wrapper.firstChild, wrapper)
      }
      parent.removeChild(wrapper)
    }
  } catch {}
}

function _initLayeredTracking(svgDoc: any): void {
  if (!_trackingLayersConfig || !svgDoc) return

  _trackingLayers = {}

  for (const [layerName, layerCfg] of Object.entries<any>(_trackingLayersConfig)) {
    const wrappers: any[] = []

    if (layerCfg.ids) {
      for (const id of layerCfg.ids) {
        const el = svgDoc.getElementById(id)
        const w = _wrapSvgElement(svgDoc, el)
        if (w) wrappers.push(w)
      }
    }

    if (layerCfg.classes) {
      for (const cls of layerCfg.classes) {
        const els = svgDoc.querySelectorAll(`.${cls}`)
        for (const el of els) {
          const w = _wrapSvgElement(svgDoc, el)
          if (w) wrappers.push(w)
        }
      }
    }

    _trackingLayers[layerName] = {
      wrappers,
      maxOffset: layerCfg.maxOffset || 10,
      ease: layerCfg.ease || 0.15,
      x: 0,
      y: 0,
    }
  }

  _startLayerAnimLoop()
}

function _startLayerAnimLoop(): void {
  if (_layerAnimFrame) return

  function tick() {
    if (!_trackingLayers) {
      _layerAnimFrame = null
      return
    }

    const rawDx = _layerTargetDx
    const rawDy = _layerTargetDy

    for (const layer of Object.values<any>(_trackingLayers)) {
      const scale = layer.maxOffset / (_themeMaxOffset || 20)
      const tx = rawDx * scale
      const ty = rawDy * scale

      layer.x += (tx - layer.x) * layer.ease
      layer.y += (ty - layer.y) * layer.ease

      if (Math.abs(layer.x) < 0.01 && Math.abs(layer.y) < 0.01 && tx === 0 && ty === 0) {
        layer.x = 0
        layer.y = 0
      }

      const qx = Math.round(layer.x * 4) / 4
      const qy = Math.round(layer.y * 4) / 4

      for (const w of layer.wrappers) {
        w.setAttribute('transform', `translate(${qx},${qy})`)
      }
    }

    _layerAnimFrame = requestAnimationFrame(tick)
  }

  _layerAnimFrame = requestAnimationFrame(tick)
}

function _cleanupLayeredTracking(): void {
  if (_layerAnimFrame) {
    cancelAnimationFrame(_layerAnimFrame)
    _layerAnimFrame = null
  }

  if (_trackingLayers && pandaEl && pandaEl.tagName === 'OBJECT') {
    try {
      _unwrapAll(pandaEl.contentDocument)
    } catch {}
  }

  _trackingLayers = null
  _layerTargetDx = 0
  _layerTargetDy = 0
  _layeredTrackingObj = null
}

// ── Attach / Detach (dispatches to correct system) ──

function attachEyeTracking(objectEl: any): void {
  if (!objectEl || objectEl.tagName !== 'OBJECT') return
  const token = ++eyeAttachToken
  eyeTarget = null
  bodyTarget = null
  shadowTarget = null

  const tryAttach = (attempt: number) => {
    if (token !== eyeAttachToken) return
    if (!objectEl || !objectEl.isConnected) return

    try {
      const svgDoc = objectEl.contentDocument
      if (!svgDoc) {
        if (attempt < 60) setTimeout(() => tryAttach(attempt + 1), 16)
        return
      }

      if (_useLayeredTracking) {
        if (_trackingLayers && _layeredTrackingObj === objectEl) return
        _initLayeredTracking(svgDoc)
        _layeredTrackingObj = objectEl
        return
      }

      const eyes = svgDoc && svgDoc.getElementById(_eyeIds.eyes)
      if (eyes) {
        eyeTarget = eyes
        bodyTarget = svgDoc.getElementById(_eyeIds.body)
        shadowTarget = svgDoc.getElementById(_eyeIds.shadow)
        applyEyeMove(lastEyeDx, lastEyeDy)
        return
      }
    } catch (e: any) {
      console.warn('Cannot access SVG contentDocument for eye tracking:', e.message)
      return
    }

    if (attempt >= 60) {
      console.warn('Timed out waiting for SVG eye targets')
      return
    }
    setTimeout(() => tryAttach(attempt + 1), 16)
  }

  tryAttach(0)
}

function detachEyeTracking(): void {
  eyeAttachToken++
  eyeTarget = null
  bodyTarget = null
  shadowTarget = null
  _cleanupLayeredTracking()
}

window.electronAPI.onEyeMove((dx: number, dy: number) => {
  const effectiveDx = miniLeftFlip ? -dx : dx
  lastEyeDx = effectiveDx
  lastEyeDy = dy

  if (_trackingLayers) {
    _layerTargetDx = effectiveDx
    _layerTargetDy = dy
    return
  }

  if (eyeTarget && !eyeTarget.ownerDocument?.defaultView) {
    eyeTarget = null
    bodyTarget = null
    shadowTarget = null
    if (pandaEl && pandaEl.isConnected && pandaEl.tagName === 'OBJECT')
      attachEyeTracking(pandaEl)
    return
  }
  applyEyeMove(effectiveDx, dy)
})

// --- Sound playback (IPC from main, receives file:// URL from theme) ---
const _audioCache: Record<string, HTMLAudioElement> = {}
window.electronAPI.onPlaySound((url: string) => {
  let audio = _audioCache[url]
  if (!audio) {
    audio = new Audio(url)
    _audioCache[url] = audio
  }
  audio.currentTime = 0
  audio.play().catch(() => {})
})

// --- Wake from doze (smooth eye opening) ---
window.electronAPI.onWakeFromDoze(() => {
  if (pandaEl && pandaEl.tagName === 'OBJECT' && pandaEl.contentDocument) {
    try {
      const eyes = pandaEl.contentDocument.getElementById(_eyeIds.dozeEyes || 'eyes-doze')
      if (eyes) eyes.style.transform = 'scaleY(1)'
    } catch (e) {}
  }
})

// --- Initial frame ---
if (!currentDisplayedSvg && _idleFollowSvg) {
  currentIdleSvg = _idleFollowSvg
  swapToFile(_idleFollowSvg, 'idle')
}

export {}
