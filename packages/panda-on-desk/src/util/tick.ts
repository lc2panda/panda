// Input: ctx (主进程上下文：win/state/theme/sendToRenderer/sendToHitWin 等)
// Output: 启动 50ms tick 循环，驱动 cursor poll / eye tracking / idle / sleep / mini peek
// Pos: panda-on-desk 工具 — 主 tick 循环
//
// Forked from clawd-on-desk@4b07658:src/tick.js (MIT License)
// JS → TS 直接转，签名按 ctx 鸭子类型最小化（保持原行为）。

// src/tick.js — Main tick loop (cursor polling, eye tracking, idle/sleep detection, mini peek)
// Extracted from clawd main.js L527-689

import { screen } from 'electron'

// ctx 的真实形状由 main.ts 拼装时给出；此处用 any 保证 1:1 行为不变。
// 后续可在 src/types.ts 单独抽 TickCtx 接口。
type Ctx = any

export default function initTick(ctx: Ctx) {
  // ── Mouse idle tracking ──
  let lastCursorX: number | null = null,
    lastCursorY: number | null = null
  let mouseStillSince = Date.now()
  let isMouseIdle = false // showing idle-look
  let hasTriggeredYawn = false // 60s threshold already fired
  let idleLookPlayed = false // idle-look already played once since last movement
  let idleLookReturnTimer: ReturnType<typeof setTimeout> | null = null
  let yawnDelayTimer: ReturnType<typeof setTimeout> | null = null
  let idleWasActive = false
  let lastEyeDx = 0,
    lastEyeDy = 0
  let mainTickTimer: ReturnType<typeof setInterval> | null = null

  // ── Theme-driven state (refreshed on hot theme switch) ──
  let theme: any = null
  let MOUSE_IDLE_TIMEOUT = 0
  let MOUSE_SLEEP_TIMEOUT = 0
  let SVG_IDLE_FOLLOW: any = null
  let IDLE_ANIMS: Array<{ svg: string; duration: number }> = []
  let SLEEP_MODE: 'full' | 'direct' = 'full'

  function refreshTheme() {
    theme = ctx.theme
    MOUSE_IDLE_TIMEOUT = theme.timings.mouseIdleTimeout
    MOUSE_SLEEP_TIMEOUT = theme.timings.mouseSleepTimeout
    SVG_IDLE_FOLLOW = theme.states.idle[0]
    IDLE_ANIMS = (theme.idleAnimations || []).map((a: any) => ({
      svg: a.file,
      duration: a.duration,
    }))
    SLEEP_MODE = theme.sleepSequence && theme.sleepSequence.mode === 'direct' ? 'direct' : 'full'
  }

  refreshTheme()

  function startMainTick() {
    if (mainTickTimer) return
    ctx.win.setIgnoreMouseEvents(true)
    ctx.mouseOverPet = false

    mainTickTimer = setInterval(() => {
      if (!ctx.win || ctx.win.isDestroyed()) return

      const idleNow = ctx.currentState === 'idle' && !ctx.idlePaused
      const miniIdleNow =
        ctx.currentState === 'mini-idle' && !ctx.idlePaused && !ctx.miniTransitioning

      if (idleNow && !idleWasActive) {
        isMouseIdle = false
        hasTriggeredYawn = false
        idleLookPlayed = false
        lastCursorX = null
        lastCursorY = null
        mouseStillSince = Date.now()
        lastEyeDx = 0
        lastEyeDy = 0
        if (idleLookReturnTimer) {
          clearTimeout(idleLookReturnTimer)
          idleLookReturnTimer = null
        }
        if (yawnDelayTimer) {
          clearTimeout(yawnDelayTimer)
          yawnDelayTimer = null
        }
      }

      if (!idleNow && idleWasActive) {
        if (idleLookReturnTimer) {
          clearTimeout(idleLookReturnTimer)
          idleLookReturnTimer = null
        }
        if (yawnDelayTimer) {
          clearTimeout(yawnDelayTimer)
          yawnDelayTimer = null
        }
      }
      idleWasActive = idleNow

      const needsCursorPoll = idleNow || miniIdleNow || ctx.miniMode
      if (!needsCursorPoll) return

      const cursor = screen.getCursorScreenPoint()

      const bounds =
        typeof ctx.getPetWindowBounds === 'function'
          ? ctx.getPetWindowBounds()
          : ctx.win.getBounds()
      if (!ctx.dragLocked) {
        const hit = ctx.getHitRectScreen(bounds)
        const over =
          cursor.x >= hit.left &&
          cursor.x <= hit.right &&
          cursor.y >= hit.top &&
          cursor.y <= hit.bottom
        ctx.mouseOverPet = over
      }

      if (ctx.miniMode && !ctx.miniTransitioning && !ctx.dragLocked && !ctx.menuOpen) {
        const canPeek =
          ctx.currentState === 'mini-idle' ||
          ctx.currentState === 'mini-peek' ||
          ctx.currentState === 'mini-sleep'
        if (!ctx.isAnimating && canPeek) {
          if (
            ctx.mouseOverPet &&
            ctx.currentState === 'mini-sleep' &&
            !ctx.miniSleepPeeked
          ) {
            ctx.miniPeekIn()
            ctx.miniSleepPeeked = true
          } else if (
            !ctx.mouseOverPet &&
            ctx.currentState === 'mini-sleep' &&
            ctx.miniSleepPeeked
          ) {
            ctx.miniPeekOut()
            ctx.miniSleepPeeked = false
          } else if (
            ctx.mouseOverPet &&
            ctx.currentState !== 'mini-peek' &&
            ctx.currentState !== 'mini-sleep' &&
            !ctx.miniPeeked
          ) {
            ctx.miniPeekIn()
            ctx.applyState('mini-peek')
          } else if (
            !ctx.mouseOverPet &&
            (ctx.currentState === 'mini-peek' || ctx.miniPeeked)
          ) {
            ctx.miniPeekOut()
            ctx.miniPeeked = false
            if (ctx.currentState !== 'mini-idle') ctx.applyState('mini-idle')
          }
        }
      }

      if (!idleNow && !miniIdleNow) return

      const moved =
        lastCursorX !== null &&
        (cursor.x !== lastCursorX || cursor.y !== lastCursorY)
      lastCursorX = cursor.x
      lastCursorY = cursor.y

      if (idleNow) {
        if (moved) {
          mouseStillSince = Date.now()
          hasTriggeredYawn = false
          idleLookPlayed = false
          if (idleLookReturnTimer) {
            clearTimeout(idleLookReturnTimer)
            idleLookReturnTimer = null
          }
          if (yawnDelayTimer) {
            clearTimeout(yawnDelayTimer)
            yawnDelayTimer = null
          }
          if (isMouseIdle) {
            isMouseIdle = false
            ctx.sendToRenderer('state-change', 'idle', SVG_IDLE_FOLLOW)
          }
        }

        const elapsed = Date.now() - mouseStillSince

        // Startup recovery: panda CLI is running but no hook yet — stay awake
        if (ctx.startupRecoveryActive) {
          mouseStillSince = Date.now()
        }

        if (!hasTriggeredYawn && elapsed >= MOUSE_SLEEP_TIMEOUT) {
          hasTriggeredYawn = true
          if (!isMouseIdle) ctx.sendToRenderer('eye-move', 0, 0)
          if (SLEEP_MODE === 'direct') {
            if (ctx.currentState === 'idle') ctx.setState('sleeping')
          } else {
            yawnDelayTimer = setTimeout(
              () => {
                yawnDelayTimer = null
                if (ctx.currentState === 'idle') ctx.setState('yawning')
              },
              isMouseIdle ? 50 : 250,
            )
          }
          return
        }

        if (
          IDLE_ANIMS.length > 0 &&
          !isMouseIdle &&
          !hasTriggeredYawn &&
          !idleLookPlayed &&
          elapsed >= MOUSE_IDLE_TIMEOUT
        ) {
          isMouseIdle = true
          idleLookPlayed = true
          const pick = IDLE_ANIMS[Math.floor(Math.random() * IDLE_ANIMS.length)]
          ctx.sendToRenderer('eye-move', 0, 0)
          setTimeout(() => {
            if (isMouseIdle && ctx.currentState === 'idle') {
              ctx.sendToRenderer('state-change', 'idle', pick.svg)
              ctx.sendToHitWin('hit-state-sync', { currentSvg: pick.svg })
            }
          }, 250)
          idleLookReturnTimer = setTimeout(() => {
            idleLookReturnTimer = null
            if (isMouseIdle && ctx.currentState === 'idle') {
              isMouseIdle = false
              ctx.sendToRenderer('state-change', 'idle', SVG_IDLE_FOLLOW)
              ctx.sendToHitWin('hit-state-sync', { currentSvg: SVG_IDLE_FOLLOW })
              setTimeout(() => {
                ctx.forceEyeResend = true
              }, 200)
            }
          }, 250 + pick.duration)
          return
        }
      }

      const trackEyesNow =
        (idleNow && ctx.currentSvg === SVG_IDLE_FOLLOW && !isMouseIdle) || miniIdleNow
      if (!trackEyesNow) return
      if (ctx.eyePauseUntil) {
        if (Date.now() < ctx.eyePauseUntil) return
        ctx.eyePauseUntil = null
      }
      if (!moved && !ctx.forceEyeResend) return

      const skipDedup = ctx.forceEyeResend
      ctx.forceEyeResend = false

      const obj = ctx.getObjRect(bounds)
      const eyeScreenX = obj.x + obj.w * theme.eyeTracking.eyeRatioX
      const eyeScreenY = obj.y + obj.h * theme.eyeTracking.eyeRatioY

      const relX = cursor.x - eyeScreenX
      const relY = cursor.y - eyeScreenY

      const MAX_OFFSET = theme.eyeTracking.maxOffset
      const dist = Math.sqrt(relX * relX + relY * relY)
      let eyeDx = 0,
        eyeDy = 0
      if (dist > 1) {
        const scale = Math.min(1, dist / 300)
        eyeDx = (relX / dist) * MAX_OFFSET * scale
        eyeDy = (relY / dist) * MAX_OFFSET * scale
      }

      eyeDx = Math.round(eyeDx * 2) / 2
      eyeDy = Math.round(eyeDy * 2) / 2
      const yClamp = MAX_OFFSET * 0.5
      eyeDy = Math.max(-yClamp, Math.min(yClamp, eyeDy))

      if (skipDedup || eyeDx !== lastEyeDx || eyeDy !== lastEyeDy) {
        lastEyeDx = eyeDx
        lastEyeDy = eyeDy
        ctx.sendToRenderer('eye-move', eyeDx, eyeDy)
      }
    }, 50) // ~20fps
  }

  function resetIdleTimer() {
    mouseStillSince = Date.now()
  }

  function cleanup() {
    if (mainTickTimer) {
      clearInterval(mainTickTimer)
      mainTickTimer = null
    }
    if (idleLookReturnTimer) {
      clearTimeout(idleLookReturnTimer)
      idleLookReturnTimer = null
    }
    if (yawnDelayTimer) {
      clearTimeout(yawnDelayTimer)
      yawnDelayTimer = null
    }
    lastCursorX = null
    lastCursorY = null
    isMouseIdle = false
    hasTriggeredYawn = false
    idleLookPlayed = false
    idleWasActive = false
    lastEyeDx = 0
    lastEyeDy = 0
  }

  return {
    startMainTick,
    resetIdleTimer,
    cleanup,
    refreshTheme,
    get _mouseStillSince() {
      return mouseStillSince
    },
  }
}
