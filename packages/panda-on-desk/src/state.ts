// Input: ctx (主进程上下文：theme/sendToRenderer/sendToHitWin/playSound/...)
// Output: 状态机对象（setState/applyState/updateSession/resolveDisplayState/...）
// Pos: panda-on-desk 状态核心 — 12 态优先级表 + session 聚合 + DND + wake poll
//      与 panda PetState 12 态 1:1 对齐（命名相同）
//
// Forked from clawd-on-desk@4b07658:src/state.js (MIT License)
// JS → TS 直接转。删除 agent multi-provider 逻辑（codex/copilot/gemini/cursor 等关键字）：
//   · 删除 detectRunningAgentProcesses 中对 codex/copilot/gemini/codebuddy/kiro/opencode 的 grep
//   · agent icon 退化为单 panda provider — getAgentIcon 仅查 panda.png
//   · clearSessionsByAgent 行为保持，但 session 仅 panda 来源

// src/state.js — State machine + session management + DND + wake poll
// Extracted from main.js L158-240, L299-505, L544-960

import * as path from 'node:path'
import * as fs from 'node:fs'

let screen: any, nativeImage: any
try {
  ;({ screen, nativeImage } = require('electron'))
} catch {
  screen = null
  nativeImage = null
}

import { VISUAL_FALLBACK_STATES } from './theme-loader'

type Ctx = any

// ── Agent icons (panda single provider) ──
const AGENT_ICON_DIR = path.join(__dirname, '..', 'assets', 'icons', 'agents')
const _agentIconCache = new Map<string, any>()

function getAgentIcon(agentId: string | null | undefined): any | undefined {
  if (!nativeImage || !agentId) return undefined
  if (_agentIconCache.has(agentId)) return _agentIconCache.get(agentId)
  // panda-on-desk: only `panda` agent is supported. Other ids fall through.
  const iconPath = path.join(AGENT_ICON_DIR, `${agentId}.png`)
  if (!fs.existsSync(iconPath)) return undefined
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })
  _agentIconCache.set(agentId, icon)
  return icon
}

export default function initState(ctx: Ctx) {
  const _getCursor =
    ctx.getCursorScreenPoint || (screen ? () => screen.getCursorScreenPoint() : null)
  const _kill = ctx.processKill || process.kill.bind(process)

  // ── Theme-driven state (refreshed on hot theme switch) ──
  let theme: any = null
  let SVG_IDLE_FOLLOW: any = null
  let STATE_SVGS: Record<string, any> = {}
  let STATE_BINDINGS: Record<string, { files: string[]; fallbackTo: string | null }> = {}
  let MIN_DISPLAY_MS: Record<string, number> = {}
  let AUTO_RETURN_MS: Record<string, number> = {}
  let DEEP_SLEEP_TIMEOUT = 0
  let YAWN_DURATION = 0
  let WAKE_DURATION = 0
  let DND_SKIP_YAWN = false
  let COLLAPSE_DURATION = 0
  let SLEEP_MODE: 'full' | 'direct' = 'full'
  const SLEEP_SEQUENCE = new Set([
    'yawning',
    'dozing',
    'collapsing',
    'sleeping',
    'waking',
  ])

  // panda PetState 12 态 1:1 对齐：error / notification / sweeping / attention /
  //   carrying / juggling / working / thinking / idle / sleeping (+ yawning / dozing / collapsing / waking)
  const STATE_PRIORITY: Record<string, number> = {
    error: 8,
    notification: 7,
    sweeping: 6,
    attention: 5,
    carrying: 4,
    juggling: 4,
    working: 3,
    thinking: 2,
    idle: 1,
    sleeping: 0,
  }

  const ONESHOT_STATES = new Set([
    'attention',
    'error',
    'sweeping',
    'notification',
    'carrying',
  ])

  const RECENT_EVENT_LIMIT = 8

  const SESSION_BADGE_KEYS: Record<string, string> = {
    running: 'sessionBadgeRunning',
    done: 'sessionBadgeDone',
    interrupted: 'sessionBadgeInterrupted',
    idle: 'sessionBadgeIdle',
  }

  let DISPLAY_HINT_MAP: Record<string, any> = {}

  // ── Session tracking ──
  const sessions = new Map<string, any>()
  const MAX_SESSIONS = 20
  const SESSION_STALE_MS = 600000
  const WORKING_STALE_MS = 300000
  let startupRecoveryActive = false
  let startupRecoveryTimer: ReturnType<typeof setTimeout> | null = null
  const STARTUP_RECOVERY_MAX_MS = 300000

  // ── Hit-test bounding boxes (from theme) ──
  let HIT_BOXES: Record<string, any> = {}
  let WIDE_SVGS = new Set<string>()
  let SLEEPING_SVGS = new Set<string>()
  let currentHitBox: any = HIT_BOXES.default

  // ── State machine internal ──
  let currentState = 'idle'
  let previousState = 'idle'
  let currentSvg: string | null = null
  let stateChangedAt = Date.now()
  let pendingTimer: ReturnType<typeof setTimeout> | null = null
  let autoReturnTimer: ReturnType<typeof setTimeout> | null = null
  let pendingState: string | null = null
  let eyeResendTimer: ReturnType<typeof setTimeout> | null = null
  let updateVisualState: string | null = null
  let updateVisualSvgOverride: string | null = null

  const UPDATE_VISUAL_STATE_MAP: Record<string, string> = {
    checking: 'sweeping',
    downloading: 'carrying',
  }
  const UPDATE_VISUAL_SVG_MAP: Record<string, string> = {
    checking: 'panda-working-debugger.svg',
  }

  // ── Wake poll ──
  let wakePollTimer: ReturnType<typeof setInterval> | null = null
  let lastWakeCursorX: number | null = null,
    lastWakeCursorY: number | null = null

  // ── Stale cleanup ──
  let staleCleanupTimer: ReturnType<typeof setInterval> | null = null
  let _detectInFlight = false

  function buildStateBindings(nextTheme: any) {
    const bindings: Record<string, { files: string[]; fallbackTo: string | null }> = {}
    const sourceBindings = nextTheme && nextTheme._stateBindings
    if (sourceBindings && typeof sourceBindings === 'object') {
      for (const [stateKey, entry] of Object.entries<any>(sourceBindings)) {
        bindings[stateKey] = {
          files: Array.isArray(entry && entry.files) ? [...entry.files] : [],
          fallbackTo:
            typeof (entry && entry.fallbackTo) === 'string' && entry.fallbackTo
              ? entry.fallbackTo
              : null,
        }
      }
    }
    if (nextTheme && nextTheme.states) {
      for (const [stateKey, files] of Object.entries<any>(nextTheme.states)) {
        const normalizedFiles = Array.isArray(files) ? [...files] : []
        if (!bindings[stateKey]) {
          bindings[stateKey] = { files: normalizedFiles, fallbackTo: null }
        } else if (bindings[stateKey].files.length === 0) {
          bindings[stateKey].files = normalizedFiles
        }
      }
    }
    if (nextTheme && nextTheme.miniMode && nextTheme.miniMode.states) {
      for (const [stateKey, files] of Object.entries<any>(nextTheme.miniMode.states)) {
        bindings[stateKey] = {
          files: Array.isArray(files) ? [...files] : [],
          fallbackTo: null,
        }
      }
    }
    return bindings
  }

  function refreshTheme() {
    theme = ctx.theme
    SVG_IDLE_FOLLOW = theme.states.idle[0]
    STATE_SVGS = { ...theme.states }
    STATE_BINDINGS = buildStateBindings(theme)
    if (theme.miniMode && theme.miniMode.states) {
      Object.assign(STATE_SVGS, theme.miniMode.states)
    }
    MIN_DISPLAY_MS = theme.timings.minDisplay
    AUTO_RETURN_MS = theme.timings.autoReturn
    DEEP_SLEEP_TIMEOUT = theme.timings.deepSleepTimeout
    YAWN_DURATION = theme.timings.yawnDuration
    WAKE_DURATION = theme.timings.wakeDuration
    DND_SKIP_YAWN = !!theme.timings.dndSkipYawn
    COLLAPSE_DURATION = theme.timings.collapseDuration || 0
    SLEEP_MODE =
      theme.sleepSequence && theme.sleepSequence.mode === 'direct' ? 'direct' : 'full'
    DISPLAY_HINT_MAP = theme.displayHintMap || {}
    HIT_BOXES = theme.hitBoxes
    WIDE_SVGS = new Set(theme.wideHitboxFiles || [])
    SLEEPING_SVGS = new Set(theme.sleepingHitboxFiles || [])

    if (currentSvg && SLEEPING_SVGS.has(currentSvg)) {
      currentHitBox = HIT_BOXES.sleeping
    } else if (currentSvg && WIDE_SVGS.has(currentSvg)) {
      currentHitBox = HIT_BOXES.wide
    } else {
      currentHitBox = HIT_BOXES.default
    }
  }

  refreshTheme()

  function setState(newState: string, svgOverride?: string) {
    if (ctx.doNotDisturb) return

    if (newState === 'yawning' && SLEEP_SEQUENCE.has(currentState)) return

    if (pendingTimer) {
      if (
        pendingState &&
        (STATE_PRIORITY[newState] || 0) < (STATE_PRIORITY[pendingState] || 0)
      ) {
        return
      }
      clearTimeout(pendingTimer)
      pendingTimer = null
      pendingState = null
    }

    const sameState = newState === currentState
    const sameSvg = !svgOverride || svgOverride === currentSvg
    if (sameState && sameSvg) {
      return
    }

    const minTime = MIN_DISPLAY_MS[currentState] || 0
    const elapsed = Date.now() - stateChangedAt
    const remaining = minTime - elapsed

    if (remaining > 0) {
      if (autoReturnTimer) {
        clearTimeout(autoReturnTimer)
        autoReturnTimer = null
      }
      pendingState = newState
      const pendingSvgOverride = svgOverride
      pendingTimer = setTimeout(() => {
        pendingTimer = null
        const queued = pendingState!
        const queuedSvg = pendingSvgOverride
        pendingState = null
        if (ONESHOT_STATES.has(queued)) {
          applyState(queued, queuedSvg)
        } else {
          const resolved = resolveDisplayState()
          applyState(resolved, getSvgOverride(resolved))
        }
      }, remaining)
    } else {
      applyState(newState, svgOverride)
    }
  }

  function isOneshotDisabled(logicalState: string): boolean {
    if (!ONESHOT_STATES.has(logicalState)) return false
    if (typeof ctx.isOneshotDisabled !== 'function') return false
    try {
      return ctx.isOneshotDisabled(logicalState) === true
    } catch {
      return false
    }
  }

  function pickStateFile(files: string[] | undefined | null): string | null {
    if (!Array.isArray(files) || files.length === 0) return null
    return files[Math.floor(Math.random() * files.length)]
  }

  function hasOwnVisualFiles(state: string): boolean {
    const entry = STATE_BINDINGS[state]
    return !!(entry && Array.isArray(entry.files) && entry.files.length > 0)
  }

  function resolveVisualBinding(state: string): string | null {
    let cursor = state
    let visited: Set<string> | null = null
    for (let hops = 0; hops <= 3; hops += 1) {
      const entry = STATE_BINDINGS[cursor]
      if (entry && Array.isArray(entry.files) && entry.files.length > 0) {
        return pickStateFile(entry.files)
      }
      if (!entry || !entry.fallbackTo || !VISUAL_FALLBACK_STATES.has(cursor)) break
      if (!visited) visited = new Set([cursor])
      if (visited.has(entry.fallbackTo)) break
      visited.add(entry.fallbackTo)
      cursor = entry.fallbackTo
    }
    const idleEntry = STATE_BINDINGS.idle
    if (idleEntry && Array.isArray(idleEntry.files) && idleEntry.files.length > 0) {
      return pickStateFile(idleEntry.files)
    }
    return null
  }

  function applyResolvedDisplayState() {
    const resolved = resolveDisplayState()
    applyState(resolved, getSvgOverride(resolved))
  }

  function playWakeTransitionOrResolve() {
    if (SLEEP_MODE === 'direct' && !hasOwnVisualFiles('waking')) {
      applyResolvedDisplayState()
      return
    }
    applyState('waking')
  }

  function queueSleepState() {
    if (SLEEP_MODE === 'direct') {
      setState('sleeping')
      return
    }
    setState('yawning')
  }

  function applyDndSleepState() {
    if (SLEEP_MODE === 'direct') {
      applyState('sleeping')
      return
    }
    applyState(DND_SKIP_YAWN ? 'collapsing' : 'yawning')
  }

  function applyState(state: string, svgOverride?: string | null) {
    if (isOneshotDisabled(state)) {
      const resolved = resolveDisplayState()
      if (resolved !== state) {
        setState(resolved, getSvgOverride(resolved))
      }
      return
    }

    if (ctx.miniTransitioning && !state.startsWith('mini-')) {
      return
    }

    if (ctx.miniMode && !state.startsWith('mini-')) {
      if (state === 'notification') return applyState('mini-alert')
      if (state === 'attention') return applyState('mini-happy')
      if (state === 'working' || state === 'thinking' || state === 'juggling') {
        if (hasOwnVisualFiles('mini-working')) return applyState('mini-working')
        return
      }
      if (
        (AUTO_RETURN_MS[currentState] || currentState === 'mini-working') &&
        !autoReturnTimer
      ) {
        return applyState(ctx.mouseOverPet ? 'mini-peek' : 'mini-idle')
      }
      return
    }

    previousState = currentState
    currentState = state
    stateChangedAt = Date.now()
    ctx.idlePaused = false

    if (state === 'attention' || state === 'mini-happy') {
      ctx.playSound('complete')
    } else if (state === 'notification' || state === 'mini-alert') {
      ctx.playSound('confirm')
    }

    const svg = svgOverride || resolveVisualBinding(state)
    currentSvg = svg

    if (eyeResendTimer) {
      clearTimeout(eyeResendTimer)
      eyeResendTimer = null
    }
    if (state === 'idle' || state === 'mini-idle') {
      const afterSweep = previousState === 'sweeping'
      const delay = afterSweep ? 800 : 300
      if (afterSweep) ctx.eyePauseUntil = Date.now() + delay
      eyeResendTimer = setTimeout(() => {
        eyeResendTimer = null
        ctx.forceEyeResend = true
      }, delay)
    }

    if (svg && SLEEPING_SVGS.has(svg)) {
      currentHitBox = HIT_BOXES.sleeping
    } else if (svg && WIDE_SVGS.has(svg)) {
      currentHitBox = HIT_BOXES.wide
    } else {
      currentHitBox = HIT_BOXES.default
    }

    ctx.sendToRenderer('state-change', state, svg)
    ctx.syncHitWin()
    ctx.sendToHitWin('hit-state-sync', { currentSvg: svg, currentState: state })
    ctx.sendToHitWin('hit-cancel-reaction')

    if (state !== 'idle' && state !== 'mini-idle') {
      ctx.sendToRenderer('eye-move', 0, 0)
    }

    if (
      (state === 'dozing' || state === 'collapsing' || state === 'sleeping') &&
      !ctx.doNotDisturb
    ) {
      setTimeout(() => {
        if (currentState === state) startWakePoll()
      }, 500)
    } else {
      stopWakePoll()
    }

    if (autoReturnTimer) clearTimeout(autoReturnTimer)
    if (state === 'yawning') {
      autoReturnTimer = setTimeout(() => {
        autoReturnTimer = null
        applyState(ctx.doNotDisturb ? 'collapsing' : 'dozing')
      }, YAWN_DURATION)
    } else if (state === 'collapsing' && COLLAPSE_DURATION > 0) {
      autoReturnTimer = setTimeout(() => {
        autoReturnTimer = null
        applyState('sleeping')
      }, COLLAPSE_DURATION)
    } else if (state === 'waking') {
      autoReturnTimer = setTimeout(() => {
        autoReturnTimer = null
        applyResolvedDisplayState()
      }, WAKE_DURATION)
    } else if (AUTO_RETURN_MS[state]) {
      autoReturnTimer = setTimeout(() => {
        autoReturnTimer = null
        if (ctx.miniMode) {
          if (ctx.mouseOverPet && !ctx.doNotDisturb) {
            if (state === 'mini-peek') {
              ctx.miniPeeked = true
              applyState('mini-idle')
            } else {
              ctx.miniPeekIn()
              applyState('mini-peek')
            }
          } else {
            applyState(ctx.doNotDisturb ? 'mini-sleep' : 'mini-idle')
          }
        } else {
          applyResolvedDisplayState()
        }
      }, AUTO_RETURN_MS[state])
    }
  }

  // ── Wake poll ──
  function startWakePoll() {
    if (!_getCursor || wakePollTimer) return
    const cursor = _getCursor()
    lastWakeCursorX = cursor.x
    lastWakeCursorY = cursor.y

    wakePollTimer = setInterval(() => {
      const cursor = _getCursor()
      const moved = cursor.x !== lastWakeCursorX || cursor.y !== lastWakeCursorY

      if (moved) {
        stopWakePoll()
        wakeFromDoze()
        return
      }

      if (
        currentState === 'dozing' &&
        Date.now() - ctx.mouseStillSince >= DEEP_SLEEP_TIMEOUT
      ) {
        stopWakePoll()
        applyState('collapsing')
      }
    }, 200)
  }

  function stopWakePoll() {
    if (wakePollTimer) {
      clearInterval(wakePollTimer)
      wakePollTimer = null
    }
  }

  function wakeFromDoze() {
    if (currentState === 'sleeping' || currentState === 'collapsing') {
      playWakeTransitionOrResolve()
      return
    }
    ctx.sendToRenderer('wake-from-doze')
    setTimeout(() => {
      if (currentState === 'dozing') {
        applyState('idle', SVG_IDLE_FOLLOW)
      }
    }, 350)
  }

  function pickDisplayHint(
    state: string,
    existing: any,
    incoming: any,
  ): string | null {
    if (state !== 'working' && state !== 'thinking' && state !== 'juggling') {
      return null
    }
    if (incoming !== undefined) {
      if (incoming === null || incoming === '') return null
      if (DISPLAY_HINT_MAP[incoming] != null) return incoming
      return existing && existing.displayHint != null ? existing.displayHint : null
    }
    return existing && existing.displayHint != null ? existing.displayHint : null
  }

  function debugSession(msg: string) {
    if (typeof ctx.debugLog !== 'function') return
    try {
      ctx.debugLog(msg)
    } catch {}
  }

  function pushRecentEvent(existing: any, state: string, event: string | null) {
    const previous = Array.isArray(existing && existing.recentEvents)
      ? existing.recentEvents.slice(-(RECENT_EVENT_LIMIT - 1))
      : []
    previous.push({
      at: Date.now(),
      event: event || null,
      state: state || 'idle',
    })
    return previous
  }

  function deriveSessionBadge(session: any): 'running' | 'done' | 'interrupted' | 'idle' {
    if (!session) return 'idle'
    if (session.state !== 'idle' && session.state !== 'sleeping') return 'running'
    if (session.state === 'sleeping') return 'idle'
    const events = Array.isArray(session.recentEvents) ? session.recentEvents : []
    const latest = events.length ? events[events.length - 1] : null
    const latestEvent = latest && latest.event
    if (latestEvent === 'StopFailure' || latestEvent === 'PostToolUseFailure')
      return 'interrupted'
    if (latestEvent === 'Stop' || latestEvent === 'PostCompact') return 'done'
    return 'idle'
  }

  const SESSION_TITLE_CONTROL_RE = /[\u0000-\u001F\u007F-\u009F]+/g
  const SESSION_TITLE_MAX = 80

  function normalizeTitle(value: any): string | null {
    if (typeof value !== 'string') return null
    const collapsed = value
      .replace(SESSION_TITLE_CONTROL_RE, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (!collapsed) return null
    return collapsed.length > SESSION_TITLE_MAX
      ? `${collapsed.slice(0, SESSION_TITLE_MAX - 1)}\u2026`
      : collapsed
  }

  function describeSession(sessionId: string, session: any): string {
    if (!session) return `sid=${sessionId} <deleted>`
    return [
      `sid=${sessionId}`,
      `state=${session.state || '-'}`,
      `resume=${session.resumeState || '-'}`,
      `agent=${session.agentId || '-'}`,
      `agentPid=${session.agentPid || '-'}`,
      `sourcePid=${session.sourcePid || '-'}`,
      `headless=${session.headless ? 1 : 0}`,
    ].join(' ')
  }

  // ── Session management ──
  function updateSession(
    sessionId: string,
    state: string,
    event: string | null,
    opts: any = {},
  ) {
    const {
      sourcePid = null,
      cwd = null,
      editor = null,
      pidChain = null,
      agentPid = null,
      agentId = null,
      host = null,
      headless = false,
      displayHint = undefined,
      sessionTitle = null,
    } = opts
    if (startupRecoveryActive) {
      startupRecoveryActive = false
      if (startupRecoveryTimer) {
        clearTimeout(startupRecoveryTimer)
        startupRecoveryTimer = null
      }
    }

    if (event === 'PermissionRequest') {
      setState('notification')
      return
    }

    const existing = sessions.get(sessionId)
    const srcPid = sourcePid || (existing && existing.sourcePid) || null
    const srcCwd = cwd || (existing && existing.cwd) || ''
    const srcEditor = editor || (existing && existing.editor) || null
    const srcPidChain =
      pidChain && pidChain.length ? pidChain : (existing && existing.pidChain) || null
    const srcAgentPid = agentPid || (existing && existing.agentPid) || null
    const srcAgentId = agentId || (existing && existing.agentId) || null
    const srcHost = host || (existing && existing.host) || null
    const srcHeadless = headless || (existing && existing.headless) || false
    const srcSessionTitle =
      normalizeTitle(sessionTitle) || (existing && existing.sessionTitle) || null
    const srcResumeState = (existing && existing.resumeState) || null
    const isSubagentStart = event === 'SubagentStart' || event === 'subagentStart'
    const isSubagentStop = event === 'SubagentStop' || event === 'subagentStop'

    debugSession(
      `event ${describeSession(sessionId, existing)} -> incoming=${state}/${event || '-'} hint=${displayHint || '-'}`,
    )

    const pidReachable = existing
      ? existing.pidReachable
      : srcAgentPid
        ? isProcessAlive(srcAgentPid)
        : srcPid
          ? isProcessAlive(srcPid)
          : false

    const recentEvents = pushRecentEvent(existing, state, event)
    const base = {
      sourcePid: srcPid,
      cwd: srcCwd,
      editor: srcEditor,
      pidChain: srcPidChain,
      agentPid: srcAgentPid,
      agentId: srcAgentId,
      host: srcHost,
      headless: srcHeadless,
      sessionTitle: srcSessionTitle,
      recentEvents,
      pidReachable,
    }

    if (!existing && sessions.size >= MAX_SESSIONS) {
      let oldestId: string | null = null,
        oldestTime = Infinity
      for (const [id, s] of sessions) {
        if (s.updatedAt < oldestTime) {
          oldestTime = s.updatedAt
          oldestId = id
        }
      }
      if (oldestId) sessions.delete(oldestId)
    }

    if (isSubagentStop) {
      if (!existing) {
        debugSession(`subagent-stop ignore sid=${sessionId} reason=no-session`)
        cleanStaleSessions()
        const displayState = resolveDisplayState()
        setState(displayState, getSvgOverride(displayState))
        return
      }

      if (existing.state === 'juggling') {
        const resumeState = existing.resumeState || null
        if (resumeState) {
          const dh = pickDisplayHint(resumeState, existing, displayHint)
          sessions.set(sessionId, {
            state: resumeState,
            updatedAt: Date.now(),
            displayHint: dh,
            ...base,
            resumeState: null,
          })
        } else {
          sessions.delete(sessionId)
        }
      } else {
        const dh = pickDisplayHint(existing.state, existing, displayHint)
        sessions.set(sessionId, {
          state: existing.state,
          updatedAt: Date.now(),
          displayHint: dh,
          ...base,
          resumeState: null,
        })
      }

      cleanStaleSessions()
      const displayState = resolveDisplayState()
      setState(displayState, getSvgOverride(displayState))
      return
    }

    if (event === 'SessionEnd') {
      const endingSession = sessions.get(sessionId)
      sessions.delete(sessionId)
      cleanStaleSessions()
      if (!endingSession || !endingSession.headless) {
        let hasLiveInteractive = false
        for (const s of sessions.values()) {
          if (!s.headless) {
            hasLiveInteractive = true
            break
          }
        }
        if (state === 'sweeping') {
          setState('sweeping')
          return
        }
        if (!hasLiveInteractive) {
          setState('sleeping')
          return
        }
      }
      const displayState = resolveDisplayState()
      setState(displayState, getSvgOverride(displayState))
      return
    } else if (
      state === 'attention' ||
      state === 'notification' ||
      SLEEP_SEQUENCE.has(state)
    ) {
      sessions.set(sessionId, {
        state: 'idle',
        updatedAt: Date.now(),
        displayHint: null,
        ...base,
        resumeState: null,
      })
    } else if (ONESHOT_STATES.has(state)) {
      if (existing) {
        existing.updatedAt = Date.now()
        existing.displayHint = null
        existing.resumeState = null
        if (sourcePid) existing.sourcePid = sourcePid
        if (cwd) existing.cwd = cwd
        if (editor) existing.editor = editor
        if (pidChain && pidChain.length) existing.pidChain = pidChain
        if (agentPid) existing.agentPid = agentPid
      } else {
        sessions.set(sessionId, {
          state: 'idle',
          updatedAt: Date.now(),
          displayHint: null,
          ...base,
          resumeState: null,
        })
      }
    } else {
      if (isSubagentStart) {
        const dh = pickDisplayHint(state, existing, displayHint)
        const resumeState =
          existing && existing.state !== 'juggling' ? existing.state : srcResumeState
        sessions.set(sessionId, {
          state,
          updatedAt: Date.now(),
          displayHint: dh,
          ...base,
          resumeState,
        })
      } else if (
        existing &&
        existing.state === 'juggling' &&
        state === 'working'
      ) {
        existing.updatedAt = Date.now()
        existing.displayHint = pickDisplayHint('juggling', existing, displayHint)
      } else {
        const dh = pickDisplayHint(state, existing, displayHint)
        sessions.set(sessionId, {
          state,
          updatedAt: Date.now(),
          displayHint: dh,
          ...base,
          resumeState: null,
        })
      }
    }
    cleanStaleSessions()

    if (ONESHOT_STATES.has(state)) {
      setState(state)
      return
    }

    const displayState = resolveDisplayState()
    setState(displayState, getSvgOverride(displayState))
  }

  function isProcessAlive(pid: number): boolean {
    try {
      _kill(pid, 0)
      return true
    } catch (e: any) {
      return e.code === 'EPERM'
    }
  }

  function cleanStaleSessions() {
    const now = Date.now()
    let changed = false
    let removedNonHeadless = false
    for (const [id, s] of sessions) {
      const age = now - s.updatedAt

      if (s.pidReachable && s.agentPid && !isProcessAlive(s.agentPid)) {
        if (!s.headless) removedNonHeadless = true
        sessions.delete(id)
        changed = true
        continue
      }

      if (age > SESSION_STALE_MS) {
        if (s.pidReachable && s.sourcePid) {
          if (!isProcessAlive(s.sourcePid)) {
            if (!s.headless) removedNonHeadless = true
            sessions.delete(id)
            changed = true
          } else if (s.state !== 'idle') {
            s.state = 'idle'
            s.displayHint = null
            changed = true
          }
        } else if (!s.pidReachable) {
          if (!s.headless) removedNonHeadless = true
          sessions.delete(id)
          changed = true
        } else {
          if (!s.headless) removedNonHeadless = true
          sessions.delete(id)
          changed = true
        }
      } else if (age > WORKING_STALE_MS) {
        if (s.pidReachable && s.sourcePid && !isProcessAlive(s.sourcePid)) {
          if (!s.headless) removedNonHeadless = true
          sessions.delete(id)
          changed = true
        } else if (
          s.state === 'working' ||
          s.state === 'juggling' ||
          s.state === 'thinking'
        ) {
          s.state = 'idle'
          s.displayHint = null
          s.updatedAt = now
          changed = true
        }
      }
    }
    if (changed && sessions.size === 0) {
      if (removedNonHeadless) {
        queueSleepState()
      } else {
        setState('idle', SVG_IDLE_FOLLOW)
      }
    } else if (changed) {
      const resolved = resolveDisplayState()
      setState(resolved, getSvgOverride(resolved))
    }

    if (startupRecoveryActive && sessions.size === 0) {
      detectRunningAgentProcesses((found: boolean) => {
        if (!found) {
          startupRecoveryActive = false
          if (startupRecoveryTimer) {
            clearTimeout(startupRecoveryTimer)
            startupRecoveryTimer = null
          }
        }
      })
    }
  }

  function clearSessionsByAgent(agentId: string): number {
    if (!agentId) return 0
    let removed = 0
    for (const [id, s] of sessions) {
      if (s && s.agentId === agentId) {
        sessions.delete(id)
        removed++
      }
    }
    if (removed > 0) {
      const resolved = resolveDisplayState()
      setState(resolved, getSvgOverride(resolved))
    }
    return removed
  }

  // panda-on-desk: 单 provider — 仅检测 panda 自身进程，去掉 codex/copilot/gemini/cursor/codebuddy/kiro/opencode 关键字。
  function detectRunningAgentProcesses(callback: (found: boolean) => void) {
    if (_detectInFlight) return
    _detectInFlight = true
    const done = (result: boolean) => {
      _detectInFlight = false
      callback(result)
    }
    if (typeof ctx.hasAnyEnabledAgent === 'function' && !ctx.hasAnyEnabledAgent()) {
      done(false)
      return
    }
    const { exec } = require('node:child_process')
    if (process.platform === 'win32') {
      exec(
        'wmic process where "(Name=\'node.exe\' and CommandLine like \'%panda%\') or Name=\'panda.exe\'" get ProcessId /format:csv',
        { encoding: 'utf8', timeout: 5000, windowsHide: true },
        (err: any, stdout: string) => done(!err && /\d+/.test(stdout)),
      )
    } else {
      exec(
        "pgrep -f 'panda' || pgrep -x 'panda'",
        { timeout: 3000 },
        (err: any) => done(!err),
      )
    }
  }

  function startStaleCleanup() {
    if (staleCleanupTimer) return
    staleCleanupTimer = setInterval(cleanStaleSessions, 10000)
  }

  function stopStaleCleanup() {
    if (staleCleanupTimer) {
      clearInterval(staleCleanupTimer)
      staleCleanupTimer = null
    }
  }

  function resolveDisplayState(): string {
    let best: string
    if (sessions.size === 0) {
      best = 'idle'
    } else {
      best = 'sleeping'
      let hasNonHeadless = false
      for (const [, s] of sessions) {
        if (s.headless) continue
        hasNonHeadless = true
        if ((STATE_PRIORITY[s.state] || 0) > (STATE_PRIORITY[best] || 0)) best = s.state
      }
      if (!hasNonHeadless) best = 'idle'
    }
    if (
      updateVisualState &&
      (STATE_PRIORITY[updateVisualState] || 0) >= (STATE_PRIORITY[best] || 0)
    ) {
      return updateVisualState
    }
    return best
  }

  function setUpdateVisualState(kind: string | null): string | null {
    if (!kind) {
      updateVisualState = null
      updateVisualSvgOverride = null
      return null
    }
    updateVisualState = UPDATE_VISUAL_STATE_MAP[kind] || kind
    updateVisualSvgOverride = UPDATE_VISUAL_SVG_MAP[kind] || null
    return updateVisualState
  }

  function getActiveWorkingCount(): number {
    let n = 0
    for (const [, s] of sessions) {
      if (
        !s.headless &&
        (s.state === 'working' || s.state === 'thinking' || s.state === 'juggling')
      )
        n++
    }
    return n
  }

  function getWorkingSvg(): string {
    const n = getActiveWorkingCount()
    if (theme.workingTiers) {
      for (const tier of theme.workingTiers) {
        if (n >= tier.minSessions) return tier.file
      }
    }
    return STATE_SVGS.working[0]
  }

  function getWinningSessionDisplayHint(targetState: string): string | null {
    let best: any = null
    let bestAt = -1
    for (const [, s] of sessions) {
      if (s.headless || s.state !== targetState) continue
      if (s.updatedAt >= bestAt) {
        bestAt = s.updatedAt
        best = s
      }
    }
    if (!best || !best.displayHint) return null
    const resolved = DISPLAY_HINT_MAP[best.displayHint]
    return resolved || null
  }

  function getSvgOverride(state: string): string | null {
    if (
      updateVisualState &&
      state === updateVisualState &&
      updateVisualSvgOverride
    ) {
      return updateVisualSvgOverride
    }
    if (state === 'idle') return SVG_IDLE_FOLLOW
    if (state === 'working') {
      const hinted = getWinningSessionDisplayHint('working')
      if (hinted) return hinted
      return getWorkingSvg()
    }
    if (state === 'juggling') {
      const hinted = getWinningSessionDisplayHint('juggling')
      if (hinted) return hinted
      return getJugglingSvg()
    }
    if (state === 'thinking') {
      const hinted = getWinningSessionDisplayHint('thinking')
      if (hinted) return hinted
      return STATE_SVGS.thinking[0]
    }
    return null
  }

  function getJugglingSvg(): string {
    let n = 0
    for (const [, s] of sessions) {
      if (!s.headless && s.state === 'juggling') n++
    }
    if (theme.jugglingTiers) {
      for (const tier of theme.jugglingTiers) {
        if (n >= tier.minSessions) return tier.file
      }
    }
    return STATE_SVGS.juggling[0]
  }

  // ── Session Dashboard ──
  function formatElapsed(ms: number): string {
    const sec = Math.floor(ms / 1000)
    if (sec < 60) return ctx.t('sessionJustNow')
    const min = Math.floor(sec / 60)
    if (min < 60) return ctx.t('sessionMinAgo').replace('{n}', String(min))
    const hr = Math.floor(min / 60)
    return ctx.t('sessionHrAgo').replace('{n}', String(hr))
  }

  function buildSessionSubmenu(): any[] {
    const entries: any[] = []
    for (const [id, s] of sessions) {
      entries.push({
        id,
        state: s.state,
        updatedAt: s.updatedAt,
        sourcePid: s.sourcePid,
        cwd: s.cwd,
        editor: s.editor,
        pidChain: s.pidChain,
        host: s.host,
        headless: s.headless,
        agentId: s.agentId,
        sessionTitle: s.sessionTitle,
        recentEvents: s.recentEvents,
      })
    }
    if (entries.length === 0) {
      return [{ label: ctx.t('noSessions'), enabled: false }]
    }
    entries.sort((a: any, b: any) => {
      const pa = STATE_PRIORITY[a.state] || 0
      const pb = STATE_PRIORITY[b.state] || 0
      if (pb !== pa) return pb - pa
      return b.updatedAt - a.updatedAt
    })

    const now = Date.now()

    function buildItem(e: any): any {
      const badgeKey = SESSION_BADGE_KEYS[deriveSessionBadge(e)] || 'sessionBadgeIdle'
      const badgeText = ctx.t(badgeKey)
      const folder = e.cwd
        ? path.basename(e.cwd)
        : e.id.length > 6
          ? e.id.slice(0, 6) + '..'
          : e.id
      const baseName = normalizeTitle(e.sessionTitle) || folder
      const name = ctx.showSessionId ? `${baseName} #${e.id.slice(-3)}` : baseName
      const elapsed = formatElapsed(now - e.updatedAt)
      const hasPid = !!e.sourcePid
      const icon = getAgentIcon(e.agentId)
      const item: any = {
        label: `${e.headless ? '🤖 ' : ''}${name}  ${badgeText}  ${elapsed}`,
        enabled: hasPid,
        click: hasPid
          ? () => ctx.focusTerminalWindow(e.sourcePid, e.cwd, e.editor, e.pidChain)
          : undefined,
      }
      if (icon) item.icon = icon
      return item
    }

    const groups = new Map<string, any[]>()
    for (const e of entries) {
      const key = e.host || ''
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(e)
    }

    if (groups.size === 1 && groups.has('')) return entries.map(buildItem)

    const items: any[] = []
    const local = groups.get('')
    if (local) {
      items.push({ label: `📍 ${ctx.t('sessionLocal')}`, enabled: false })
      items.push(...local.map(buildItem))
    }
    for (const [h, group] of groups) {
      if (!h) continue
      if (items.length) items.push({ type: 'separator' })
      items.push({ label: `🖥 ${h}`, enabled: false })
      items.push(...group.map(buildItem))
    }
    return items
  }

  // ── Do Not Disturb ──
  function enableDoNotDisturb() {
    if (ctx.doNotDisturb) return
    ctx.doNotDisturb = true
    ctx.sendToRenderer('dnd-change', true)
    ctx.sendToHitWin('hit-state-sync', { dndEnabled: true })
    for (const perm of [...(ctx.pendingPermissions || [])])
      ctx.resolvePermissionEntry(perm, 'deny', 'DND enabled')
    if (pendingTimer) {
      clearTimeout(pendingTimer)
      pendingTimer = null
      pendingState = null
    }
    if (autoReturnTimer) {
      clearTimeout(autoReturnTimer)
      autoReturnTimer = null
    }
    stopWakePoll()
    if (ctx.miniMode) {
      applyState('mini-sleep')
    } else {
      applyDndSleepState()
    }
    ctx.buildContextMenu?.()
    ctx.buildTrayMenu?.()
  }

  function disableDoNotDisturb() {
    if (!ctx.doNotDisturb) return
    ctx.doNotDisturb = false
    ctx.sendToRenderer('dnd-change', false)
    ctx.sendToHitWin('hit-state-sync', { dndEnabled: false })
    if (ctx.miniMode) {
      if (ctx.miniSleepPeeked) {
        ctx.miniPeekOut()
        ctx.miniSleepPeeked = false
      }
      ctx.miniPeeked = false
      applyState('mini-idle')
    } else {
      playWakeTransitionOrResolve()
    }
    ctx.buildContextMenu?.()
    ctx.buildTrayMenu?.()
  }

  function startStartupRecovery() {
    startupRecoveryActive = true
    startupRecoveryTimer = setTimeout(() => {
      startupRecoveryActive = false
      startupRecoveryTimer = null
    }, STARTUP_RECOVERY_MAX_MS)
  }

  function getCurrentState() {
    return currentState
  }
  function getCurrentSvg() {
    return currentSvg
  }
  function getCurrentHitBox() {
    return currentHitBox
  }
  function getStartupRecoveryActive() {
    return startupRecoveryActive
  }

  function cleanup() {
    if (pendingTimer) clearTimeout(pendingTimer)
    if (autoReturnTimer) clearTimeout(autoReturnTimer)
    if (eyeResendTimer) clearTimeout(eyeResendTimer)
    if (startupRecoveryTimer) clearTimeout(startupRecoveryTimer)
    if (wakePollTimer) clearInterval(wakePollTimer)
    stopStaleCleanup()
  }

  return {
    setState,
    applyState,
    updateSession,
    resolveDisplayState,
    resolveVisualBinding,
    setUpdateVisualState,
    enableDoNotDisturb,
    disableDoNotDisturb,
    startStaleCleanup,
    stopStaleCleanup,
    startWakePoll,
    stopWakePoll,
    getSvgOverride,
    cleanStaleSessions,
    startStartupRecovery,
    refreshTheme,
    detectRunningAgentProcesses,
    buildSessionSubmenu,
    clearSessionsByAgent,
    deriveSessionBadge,
    getCurrentState,
    getCurrentSvg,
    getCurrentHitBox,
    getStartupRecoveryActive,
    sessions,
    STATE_PRIORITY,
    ONESHOT_STATES,
    SLEEP_SEQUENCE,
    get STATE_SVGS() {
      return STATE_SVGS
    },
    get HIT_BOXES() {
      return HIT_BOXES
    },
    get WIDE_SVGS() {
      return WIDE_SVGS
    },
    cleanup,
  }
}
