// Input: ctx 对象（win / theme / pendingPermissions / IPC sender 工厂）
// Output: mini 模式 API — enter/exit/peek/snap/restore + 状态查询
// Pos: panda-on-desk mini-mode 控制器（被 main 进程持有，渲染端通过 IPC 推送状态）
//
// Forked from clawd-on-desk@4b07658:src/mini.js (MIT License) - Panda branded
// JS → TS：ctx 类型用 any（因 main.ts 仍处 fork 中由别的 agent 改造）；
// 1:1 对齐 clawd 行为，仅文案和注释中文化与本任务一致；不引入新依赖。
//
// [NEW-FILE:#20260419-OD-P1-T4-02]

// src/mini.ts — Mini mode (edge snap, crabwalk, peek, window animations)
// Extracted from main.js L315-331, L2700-2911

import { screen } from 'electron'

export default function initMini(ctx: any) {
  const PEEK_OFFSET = 25
  const SNAP_TOLERANCE = 30
  const JUMP_PEAK_HEIGHT = 40
  const JUMP_DURATION = 350
  const MINI_ENTER_FALLBACK_MS = 3200
  const MINI_ENTER_PRELOAD_MS = 300
  const CRABWALK_SPEED = 0.12 // px/ms
  let MINI_OFFSET_RATIO = ctx.theme.miniMode.offsetRatio

  let miniMode = false
  let miniEdge: 'left' | 'right' = 'right'
  let miniTransitioning = false
  let miniSleepPeeked = false
  let miniPeeked = false
  let preMiniX = 0
  let preMiniY = 0
  let currentMiniX = 0
  let miniSnap: { y: number; width: number; height: number } | null = null
  let miniTransitionTimer: any = null
  let peekAnimTimer: any = null
  let isAnimating = false

  function refreshTheme(): void {
    MINI_OFFSET_RATIO = ctx.theme.miniMode.offsetRatio
  }

  function themeSupportsMini(): boolean {
    return !!(ctx.theme && ctx.theme.miniMode && ctx.theme.miniMode.supported !== false)
  }

  // ── Window animation ──
  // Mini animations run on **real** Electron bounds (not virtual). enterMiniMode
  // calls ctx.setViewportOffsetY(0) before starting animation, so real === virtual
  // throughout the mini lifecycle.
  function animateWindowX(targetX: number, durationMs: number, onDone?: () => void): void {
    if (peekAnimTimer) {
      clearTimeout(peekAnimTimer)
      peekAnimTimer = null
    }
    const bounds = ctx.win.getBounds()
    const startX = bounds.x
    if (startX === targetX) {
      isAnimating = false
      if (onDone) onDone()
      return
    }
    isAnimating = true
    const startTime = Date.now()
    const snapY = miniSnap ? miniSnap.y : bounds.y
    const snapW = miniSnap ? miniSnap.width : bounds.width
    const snapH = miniSnap ? miniSnap.height : bounds.height
    let frameCount = 0
    const step = () => {
      if (!ctx.win || ctx.win.isDestroyed()) {
        peekAnimTimer = null
        isAnimating = false
        if (onDone) onDone()
        return
      }
      const t = Math.min(1, (Date.now() - startTime) / durationMs)
      const eased = t * (2 - t)
      const x = Math.round(startX + (targetX - startX) * eased)
      if (!Number.isFinite(x) || !Number.isFinite(snapY)) {
        peekAnimTimer = null
        isAnimating = false
        if (onDone) onDone()
        return
      }
      try {
        ctx.win.setBounds({ x, y: snapY, width: snapW, height: snapH })
      } catch {
        peekAnimTimer = null
        isAnimating = false
        if (onDone) onDone()
        return
      }
      ctx.syncHitWin()
      // Throttle bubble reposition to every 3rd frame (~20fps)
      if (
        ctx.bubbleFollowPet &&
        ctx.pendingPermissions.length &&
        (++frameCount % 3 === 0 || t >= 1)
      )
        ctx.repositionBubbles()
      if (t < 1) {
        peekAnimTimer = setTimeout(step, 16)
      } else {
        peekAnimTimer = null
        isAnimating = false
        if (onDone) onDone()
      }
    }
    step()
  }

  function animateWindowParabola(
    targetX: number,
    targetY: number,
    durationMs: number,
    onDone?: () => void,
  ): void {
    if (peekAnimTimer) {
      clearTimeout(peekAnimTimer)
      peekAnimTimer = null
    }
    const bounds = ctx.win.getBounds()
    const startX = bounds.x
    const startY = bounds.y
    if (startX === targetX && startY === targetY) {
      isAnimating = false
      if (onDone) onDone()
      return
    }
    isAnimating = true
    const startTime = Date.now()
    let frameCount = 0
    const step = () => {
      if (!ctx.win || ctx.win.isDestroyed()) {
        peekAnimTimer = null
        isAnimating = false
        if (onDone) onDone()
        return
      }
      const t = Math.min(1, (Date.now() - startTime) / durationMs)
      const eased = t * (2 - t)
      const x = Math.round(startX + (targetX - startX) * eased)
      const arc = -4 * JUMP_PEAK_HEIGHT * t * (t - 1)
      const y = Math.round(startY + (targetY - startY) * eased - arc)
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        peekAnimTimer = null
        isAnimating = false
        if (onDone) onDone()
        return
      }
      try {
        ctx.win.setPosition(x, y)
      } catch {
        peekAnimTimer = null
        isAnimating = false
        if (onDone) onDone()
        return
      }
      ctx.syncHitWin()
      if (
        ctx.bubbleFollowPet &&
        ctx.pendingPermissions.length &&
        (++frameCount % 3 === 0 || t >= 1)
      )
        ctx.repositionBubbles()
      if (t < 1) {
        peekAnimTimer = setTimeout(step, 16)
      } else {
        peekAnimTimer = null
        isAnimating = false
        if (onDone) onDone()
      }
    }
    step()
  }

  // Shared X-position formula for mini mode
  function calcMiniX(wa: any, size: { width: number; height: number }): number {
    if (miniEdge === 'left') return wa.x - Math.round(size.width * MINI_OFFSET_RATIO)
    return wa.x + wa.width - Math.round(size.width * (1 - MINI_OFFSET_RATIO))
  }

  function miniPeekIn(): void {
    const offset = miniEdge === 'left' ? PEEK_OFFSET : -PEEK_OFFSET
    animateWindowX(currentMiniX + offset, 200)
  }

  function miniPeekOut(): void {
    animateWindowX(currentMiniX, 200)
  }

  function getMiniStateFile(state: string): string | null {
    const miniStates = ctx.theme && ctx.theme.miniMode && ctx.theme.miniMode.states
    if (!miniStates) return null
    const files = miniStates[state]
    return Array.isArray(files) && files[0] ? files[0] : null
  }

  function getMiniEnterDurationMs(state: string): number {
    const file = getMiniStateFile(state)
    const cycleMs =
      typeof ctx.getAnimationAssetCycleMs === 'function'
        ? ctx.getAnimationAssetCycleMs(file)
        : null
    return Number.isFinite(cycleMs) && cycleMs > 0 ? cycleMs : MINI_ENTER_FALLBACK_MS
  }

  function getMiniRestState(): string {
    return ctx.doNotDisturb ? 'mini-sleep' : 'mini-idle'
  }

  function finishMiniEntry(delayMs?: number): void {
    if (miniTransitionTimer) {
      clearTimeout(miniTransitionTimer)
      miniTransitionTimer = null
    }
    const settleMs =
      Number.isFinite(delayMs as number) && (delayMs as number) >= 0
        ? (delayMs as number)
        : MINI_ENTER_FALLBACK_MS
    miniTransitionTimer = setTimeout(() => {
      miniTransitionTimer = null
      miniTransitioning = false
      ctx.applyState(getMiniRestState())
    }, settleMs)
  }

  function cancelMiniTransition(): void {
    miniTransitioning = false
    if (miniTransitionTimer) {
      clearTimeout(miniTransitionTimer)
      miniTransitionTimer = null
    }
    if (peekAnimTimer) {
      clearTimeout(peekAnimTimer)
      peekAnimTimer = null
    }
    isAnimating = false
  }

  function _getSize(): { width: number; height: number } {
    return ctx.getCurrentPixelSize ? ctx.getCurrentPixelSize() : ctx.SIZES[ctx.currentSize]
  }

  function checkMiniModeSnap(): void {
    if (!themeSupportsMini()) return
    if (miniMode) return
    const bounds = ctx.getPetWindowBounds()
    const size = _getSize()
    const mEdge = Math.round(size.width * 0.25)
    const centerX = bounds.x + size.width / 2
    const displays = (screen as any).getAllDisplays()
    for (const d of displays) {
      const wa = d.workArea
      const centerY = bounds.y + size.height / 2
      if (centerX < wa.x || centerX > wa.x + wa.width) continue
      if (centerY < wa.y || centerY > wa.y + wa.height) continue
      // Right edge snap
      const rightLimit = wa.x + wa.width - size.width + mEdge
      if (bounds.x >= rightLimit - SNAP_TOLERANCE) {
        enterMiniMode(wa, false, 'right')
        return
      }
      // Left edge snap
      const leftLimit = wa.x - mEdge
      if (bounds.x <= leftLimit + SNAP_TOLERANCE) {
        enterMiniMode(wa, false, 'left')
        return
      }
    }
  }

  function enterMiniMode(wa: any, viaMenu: boolean, edge?: 'left' | 'right'): void {
    if (!themeSupportsMini()) return
    if (miniMode && !viaMenu) return
    // preMini 存 virtual — 退出 mini 时能复原贴顶位置
    const virtualBounds = ctx.getPetWindowBounds()
    if (!viaMenu) {
      preMiniX = virtualBounds.x
      preMiniY = virtualBounds.y
    }
    // 清零 viewport offset — mini 全程用 real 坐标,避免每帧 materialize + IPC 风暴
    if (typeof ctx.setViewportOffsetY === 'function') ctx.setViewportOffsetY(0)
    // 之后 real === virtual,用 real API 读取当前 y 作为 mini 起点
    const bounds = ctx.win.getBounds()
    miniMode = true
    miniSleepPeeked = false
    miniPeeked = false
    if (edge) miniEdge = edge
    const size = _getSize()
    currentMiniX = calcMiniX(wa, size)
    miniSnap = { y: bounds.y, width: size.width, height: size.height }

    ctx.stopWakePoll()

    ctx.sendToRenderer('mini-mode-change', true, miniEdge)
    ctx.sendToHitWin('hit-state-sync', { miniMode: true })
    miniTransitioning = true
    ctx.buildContextMenu()
    ctx.buildTrayMenu()

    const enterSvgState = ctx.doNotDisturb ? 'mini-enter-sleep' : 'mini-enter'

    if (viaMenu) {
      const displays = (screen as any).getAllDisplays()
      let jumpTarget: number
      if (miniEdge === 'right') {
        let maxRight = 0
        for (const d of displays) maxRight = Math.max(maxRight, d.bounds.x + d.bounds.width)
        jumpTarget = maxRight
      } else {
        let minLeft = Infinity
        for (const d of displays) minLeft = Math.min(minLeft, d.bounds.x)
        jumpTarget = minLeft - size.width
      }
      animateWindowParabola(jumpTarget, bounds.y, JUMP_DURATION, () => {
        const enterDurationMs = getMiniEnterDurationMs(enterSvgState)
        ctx.applyState(enterSvgState)
        if (MINI_ENTER_PRELOAD_MS <= 0) {
          miniSnap = { y: bounds.y, width: size.width, height: size.height }
          ctx.win.setBounds({
            x: currentMiniX,
            y: miniSnap.y,
            width: miniSnap.width,
            height: miniSnap.height,
          })
          ctx.syncHitWin()
          finishMiniEntry(enterDurationMs)
          return
        }
        miniTransitionTimer = setTimeout(() => {
          miniSnap = { y: bounds.y, width: size.width, height: size.height }
          ctx.win.setBounds({
            x: currentMiniX,
            y: miniSnap.y,
            width: miniSnap.width,
            height: miniSnap.height,
          })
          miniTransitionTimer = null
          ctx.syncHitWin()
          finishMiniEntry(enterDurationMs)
        }, MINI_ENTER_PRELOAD_MS)
      })
    } else {
      // Drag path: slide the window into place first, then play mini-enter.
      animateWindowX(currentMiniX, 100, () => {
        ctx.applyState(enterSvgState)
        finishMiniEntry(getMiniEnterDurationMs(enterSvgState))
      })
    }
  }

  function exitMiniMode(): void {
    if (!miniMode) return
    cancelMiniTransition()
    // Keep miniMode = true and miniTransitioning = true during exit parabola.
    miniTransitioning = true
    miniSnap = null
    miniSleepPeeked = false
    miniPeeked = false

    const size = _getSize()
    const visualState = ctx.doNotDisturb ? 'idle' : ctx.resolveDisplayState()
    const visualFile = visualState ? ctx.getSvgOverride(visualState) : null
    const clamped = ctx.clampToScreenVisual(preMiniX, preMiniY, size.width, size.height, {
      state: visualState,
      file: visualFile,
    })
    const wa = ctx.getNearestWorkArea(
      clamped.x + size.width / 2,
      clamped.y + size.height / 2,
    )
    const mEdge = Math.round(size.width * 0.25)
    if (clamped.x >= wa.x + wa.width - size.width + mEdge - SNAP_TOLERANCE) {
      clamped.x = wa.x + wa.width - size.width + mEdge - 100
    }
    if (clamped.x <= wa.x - mEdge + SNAP_TOLERANCE) {
      clamped.x = wa.x - mEdge + SNAP_TOLERANCE + 100
    }

    animateWindowParabola(clamped.x, clamped.y, JUMP_DURATION, () => {
      miniMode = false
      miniTransitioning = false
      ctx.sendToRenderer('mini-mode-change', false)
      ctx.sendToHitWin('hit-state-sync', { miniMode: false })
      ctx.buildContextMenu()
      ctx.buildTrayMenu()
      if (ctx.doNotDisturb) {
        ctx.doNotDisturb = false
        ctx.sendToRenderer('dnd-change', false)
        ctx.sendToHitWin('hit-state-sync', { dndEnabled: false })
        ctx.buildContextMenu()
        ctx.buildTrayMenu()
        ctx.applyState('waking')
      } else {
        const resolved = ctx.resolveDisplayState()
        ctx.applyState(resolved, ctx.getSvgOverride(resolved))
      }
    })
  }

  function enterMiniViaMenu(): void {
    if (!themeSupportsMini()) return
    const virtualBounds = ctx.getPetWindowBounds()
    preMiniX = virtualBounds.x
    preMiniY = virtualBounds.y
    if (typeof ctx.setViewportOffsetY === 'function') ctx.setViewportOffsetY(0)
    const bounds = ctx.win.getBounds()
    const size = _getSize()
    const wa = ctx.getNearestWorkArea(bounds.x + size.width / 2, bounds.y + size.height / 2)

    // Auto-detect nearest edge
    const centerX = bounds.x + size.width / 2
    const waMid = wa.x + wa.width / 2
    const edge: 'left' | 'right' = centerX <= waMid ? 'left' : 'right'
    miniEdge = edge

    miniTransitioning = true

    ctx.sendToRenderer('mini-mode-change', true, edge)
    ctx.sendToHitWin('hit-state-sync', { miniMode: true })

    ctx.applyState('mini-crabwalk')

    let edgeX: number
    if (edge === 'right') {
      edgeX = wa.x + wa.width - size.width + Math.round(size.width * 0.25)
    } else {
      edgeX = wa.x - Math.round(size.width * 0.25)
    }
    const walkDist = Math.abs(bounds.x - edgeX)
    const walkDuration = walkDist / CRABWALK_SPEED
    animateWindowX(edgeX, walkDuration)

    miniTransitionTimer = setTimeout(() => {
      enterMiniMode(wa, true, edge)
    }, walkDuration + 50)
  }

  function handleDisplayChange(): void {
    if (!ctx.win || ctx.win.isDestroyed()) return
    if (!miniMode) return
    const size = _getSize()
    // mini 期间 offset 恒为 0,real === virtual,直接读 real
    const bounds = ctx.win.getBounds()
    const snapY = miniSnap ? miniSnap.y : bounds.y
    const wa = ctx.getNearestWorkArea(currentMiniX + size.width / 2, snapY + size.height / 2)
    currentMiniX = calcMiniX(wa, size)
    const clampedY = Math.max(wa.y, Math.min(snapY, wa.y + wa.height - size.height))
    miniSnap = { y: clampedY, width: size.width, height: size.height }
    ctx.win.setBounds({ x: currentMiniX, y: clampedY, width: size.width, height: size.height })
  }

  function handleResize(sizeKey: string): boolean {
    const size = ctx.SIZES[sizeKey] || _getSize()
    if (!miniMode) return false
    const { y } = ctx.win.getBounds()
    const wa = ctx.getNearestWorkArea(currentMiniX + size.width / 2, y + size.height / 2)
    currentMiniX = calcMiniX(wa, size)
    const clampedY = Math.max(wa.y, Math.min(y, wa.y + wa.height - size.height))
    miniSnap = { y: clampedY, width: size.width, height: size.height }
    ctx.win.setBounds({ x: currentMiniX, y: clampedY, width: size.width, height: size.height })
    return true
  }

  function restoreFromPrefs(
    prefs: { x: number; y: number; preMiniX?: number; preMiniY?: number; miniEdge?: 'left' | 'right' },
    size: { width: number; height: number },
  ): { x: number; y: number; width: number; height: number } {
    preMiniX = prefs.preMiniX || 0
    preMiniY = prefs.preMiniY || 0
    miniEdge = prefs.miniEdge || 'right'
    const wa = ctx.getNearestWorkArea(prefs.x + size.width / 2, prefs.y + size.height / 2)
    currentMiniX = calcMiniX(wa, size)
    // 启动恢复 mini 时 y 必须在工作区内
    const startY = Math.max(wa.y, Math.min(prefs.y, wa.y + wa.height - size.height))
    miniSnap = { y: startY, width: size.width, height: size.height }
    miniMode = true
    miniTransitioning = false
    miniSleepPeeked = false
    miniPeeked = false
    return { x: currentMiniX, y: startY, width: size.width, height: size.height }
  }

  function getMiniMode(): boolean {
    return miniMode
  }
  function getMiniEdge(): 'left' | 'right' {
    return miniEdge
  }
  function getMiniTransitioning(): boolean {
    return miniTransitioning
  }
  function getMiniSleepPeeked(): boolean {
    return miniSleepPeeked
  }
  function setMiniSleepPeeked(v: boolean): void {
    miniSleepPeeked = v
  }
  function getMiniPeeked(): boolean {
    return miniPeeked
  }
  function setMiniPeeked(v: boolean): void {
    miniPeeked = v
  }
  function getIsAnimating(): boolean {
    return isAnimating
  }
  function getPreMiniX(): number {
    return preMiniX
  }
  function getPreMiniY(): number {
    return preMiniY
  }
  function getCurrentMiniX(): number {
    return currentMiniX
  }
  function getMiniSnap(): { y: number; width: number; height: number } | null {
    return miniSnap
  }

  function cleanup(): void {
    if (miniTransitionTimer) {
      clearTimeout(miniTransitionTimer)
      miniTransitionTimer = null
    }
    if (peekAnimTimer) {
      clearTimeout(peekAnimTimer)
      peekAnimTimer = null
    }
  }

  return {
    enterMiniMode,
    exitMiniMode,
    enterMiniViaMenu,
    miniPeekIn,
    miniPeekOut,
    checkMiniModeSnap,
    cancelMiniTransition,
    animateWindowX,
    animateWindowParabola,
    refreshTheme,
    handleDisplayChange,
    handleResize,
    restoreFromPrefs,
    getMiniMode,
    getMiniEdge,
    getMiniTransitioning,
    getMiniSleepPeeked,
    setMiniSleepPeeked,
    getMiniPeeked,
    setMiniPeeked,
    getIsAnimating,
    getPreMiniX,
    getPreMiniY,
    getCurrentMiniX,
    getMiniSnap,
    get MINI_OFFSET_RATIO(): number {
      return MINI_OFFSET_RATIO
    },
    PEEK_OFFSET,
    cleanup,
  }
}
