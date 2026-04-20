// Input:
//   - hitWin: Electron BrowserWindow（必须 webContents 已 ready；hit.html 已 loadFile 完成）
//   - opts.deps?: { loadDeskPrefs?, saveDeskPrefs? } — 测试可注入 mock；生产从 ./prefs 默认 require
//   - opts.timing?: { idleMs, thinkingMs, workingMs, attentionMs, notificationMs, sleepingMs, levelupMs, speciesEachMs, badgeMs, overlayMs }
//                    — 测试时可缩减为 1ms 加速断言
//   - opts.now?: () => number — 测试可注入 fake clock
//   - opts.sleep?: (ms) => Promise<void> — 测试可注入立即 resolve sleep
//   - opts.send?: (channel, payload) => void — 默认 hitWin.webContents.send；测试可拦截
//   - opts.exec?: (script) => Promise<unknown> — 默认 hitWin.webContents.executeJavaScript；测试可拦截
//
// Output:
//   - runDemoSequence(hitWin, opts?) → Promise<{ steps: DemoStepRecord[], skipped?: boolean, reason?: string }>
//   - shouldRunDemo(prefs) → boolean
//   - markDemoComplete(opts?) → 写 ~/.pandacc/desk-prefs.json firstRun=false
//   - DEMO_STEPS（10 步骤静态序列）+ DEMO_SPECIES_CYCLE（5 物种循环：robot → owl → chonk → duck → panda）
//
// Pos:
//   - panda-on-desk W14-T4 演示模式入口 — 让用户首次启动直观看到 8 个 __panda* 接口的全部能力
//   - 调用方：① main.ts whenReady + did-finish-load → if (firstRun) runDemoSequence()
//             ② tray "Show Demo" 菜单点击 → runDemoSequence()（手动触发不写 firstRun=false）
//
// [NEW-FILE:#W14-04]
// 触发原因（不可在现有文件实现的论证）：
//   1. 现有 src/animation-cycle.ts 是 idle/breathing 单状态循环（持续）；demo-mode 是"线性 10 步骤一次性序列"，
//      职责正交（idle vs guided tour），合并会污染 animation-cycle 的状态机。
//   2. main.ts 已 1477 行（远超 800 max），任何首次启动 + sequencing 逻辑硬塞 main.ts 都违反 coding-style
//      "200-400 lines typical, 800 max"。
//   3. demo-mode 必须 0 依赖 electron + 全可注入（test 必须能完整 fake hitWin/exec/send/sleep），
//      与 main.ts 的强 electron 耦合矛盾。
// 联网/本地证据：
//   - Electron webContents.send / executeJavaScript 官方 API（https://www.electronjs.org/docs/latest/api/web-contents，检索 2026-04-20 +08:00）
//   - hit.html 暴露的 8 个 window.__panda* 接口契约（src/renderer/hit.html L482, L580, L678-727, L987）
//   - bridge 'panda-event' 通道契约（main.ts:535 forwardBridgeEventToRenderer）
//   - clawd-on-desk@4b07658 无对应 demo-mode 实现（panda 独有功能）
// 最小化方案：单文件 ~190 行；0 新依赖；全注入式；纯 async/await 时间线。
// 回滚：删除 demo-mode.ts + main.ts 中 _maybeRunFirstRunDemo() 调用 + tray ctx.runDemo + i18n trayShowDemo。

"use strict";

// ── 10 步骤序列定义（不可变；DEMO_STEPS.length 必须 = 10） ──────────────────────
export type DemoStep =
  | { kind: 'state'; state: 'idle' | 'thinking' | 'working' | 'attention' | 'notification' | 'sleeping' }
  | { kind: 'levelup'; from: number; to: number }
  | { kind: 'species-cycle'; sequence: readonly string[] }
  | { kind: 'badge'; count: number }
  | { kind: 'overlay'; message: string };

export interface DemoTiming {
  idleMs: number;
  thinkingMs: number;
  workingMs: number;
  attentionMs: number;
  notificationMs: number;
  sleepingMs: number;
  levelupMs: number;
  speciesEachMs: number;
  badgeMs: number;
  overlayMs: number;
}

export const DEFAULT_TIMING: DemoTiming = {
  idleMs: 5000,
  thinkingMs: 3000,
  workingMs: 3000,
  attentionMs: 2000,
  notificationMs: 2000,
  sleepingMs: 3000,
  levelupMs: 2500,
  speciesEachMs: 1500,
  badgeMs: 2000,
  overlayMs: 4000,
};

// 物种循环：panda(default) 起步 → robot → owl → chonk → duck → 回 panda
// 5 物种白名单内全部成员（default + robot + owl + chonk + duck），与 prefs.PANDA_SPECIES_WHITELIST 子集对齐
export const DEMO_SPECIES_CYCLE = ['robot', 'owl', 'chonk', 'duck', 'default'] as const;

export const DEMO_STEPS: ReadonlyArray<DemoStep> = [
  { kind: 'state', state: 'idle' },             // 1. 5s 呼吸
  { kind: 'state', state: 'thinking' },         // 2. 3s 问号浮动
  { kind: 'state', state: 'working' },          // 3. 3s 摇头
  { kind: 'state', state: 'attention' },        // 4. 2s 跳跃
  { kind: 'state', state: 'notification' },     // 5. 2s 摇铃
  { kind: 'state', state: 'sleeping' },         // 6. 3s Z 飘
  { kind: 'levelup', from: 1, to: 2 },          // 7. 烟花 + banner
  { kind: 'species-cycle', sequence: DEMO_SPECIES_CYCLE }, // 8. 5 物种切换
  { kind: 'badge', count: 3 },                  // 9. badge +3 红圆
  { kind: 'overlay', message: '欢迎使用 panda-on-desk!' }, // 10. 浮卡
];

if (DEMO_STEPS.length !== 10) {
  throw new Error('[demo-mode] DEMO_STEPS must have exactly 10 entries');
}

// ── 默认 sleep + send + exec（生产路径）。测试通过 opts.* 全部覆盖 ──────────────
const _defaultSleep = (ms: number): Promise<void> =>
  new Promise<void>((resolve) => {
    if (typeof ms !== 'number' || ms <= 0) { resolve(); return; }
    setTimeout(resolve, ms);
  });

function _defaultSend(hitWin: any, channel: string, payload: unknown): void {
  if (!hitWin || (typeof hitWin.isDestroyed === 'function' && hitWin.isDestroyed())) return;
  const wc = hitWin.webContents;
  if (!wc || (typeof wc.isDestroyed === 'function' && wc.isDestroyed())) return;
  try { wc.send(channel, payload); } catch (err) {
    console.warn('[panda-on-desk:demo-mode] send failed:', (err as Error)?.message);
  }
}

function _defaultExec(hitWin: any, script: string): Promise<unknown> {
  if (!hitWin || (typeof hitWin.isDestroyed === 'function' && hitWin.isDestroyed())) {
    return Promise.resolve(null);
  }
  const wc = hitWin.webContents;
  if (!wc || (typeof wc.isDestroyed === 'function' && wc.isDestroyed())) {
    return Promise.resolve(null);
  }
  try {
    return Promise.resolve(wc.executeJavaScript(script, true)).catch((err) => {
      console.warn('[panda-on-desk:demo-mode] exec failed:', err?.message);
      return null;
    });
  } catch (err) {
    console.warn('[panda-on-desk:demo-mode] exec threw:', (err as Error)?.message);
    return Promise.resolve(null);
  }
}

// ── shouldRunDemo / markDemoComplete ─────────────────────────────────────────
export interface PrefsDeps {
  loadDeskPrefs?: () => { firstRun?: boolean } & Record<string, unknown>;
  saveDeskPrefs?: (patch: Record<string, unknown>) => unknown;
}

export function shouldRunDemo(prefs: { firstRun?: boolean } | null | undefined): boolean {
  if (!prefs || typeof prefs !== 'object') return true; // 缺失视为 firstRun
  return prefs.firstRun !== false; // 仅当显式 false 才跳过
}

export function markDemoComplete(deps?: PrefsDeps): { ok: boolean; reason?: string } {
  try {
    const save = deps?.saveDeskPrefs ?? (require('./prefs.js') as any).saveDeskPrefs;
    if (typeof save !== 'function') return { ok: false, reason: 'saveDeskPrefs unavailable' };
    save({ firstRun: false });
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: (err as Error)?.message };
  }
}

// ── 主入口 runDemoSequence ────────────────────────────────────────────────────
export interface DemoStepRecord {
  index: number;
  kind: DemoStep['kind'];
  detail: string;
  startedAt: number;
}

export interface DemoOptions {
  timing?: Partial<DemoTiming>;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
  send?: (channel: string, payload: unknown) => void;
  exec?: (script: string) => Promise<unknown>;
  // markComplete=false 时跳过 firstRun=false 写入（手动 tray 触发场景）
  markComplete?: boolean;
  deps?: PrefsDeps;
}

export interface DemoResult {
  steps: DemoStepRecord[];
  skipped?: boolean;
  reason?: string;
  marked?: boolean;
}

export async function runDemoSequence(hitWin: any, opts?: DemoOptions): Promise<DemoResult> {
  const timing: DemoTiming = { ...DEFAULT_TIMING, ...(opts?.timing || {}) };
  const now = opts?.now ?? Date.now;
  const sleep = opts?.sleep ?? _defaultSleep;
  const send = opts?.send ?? ((ch: string, p: unknown) => _defaultSend(hitWin, ch, p));
  const exec = opts?.exec ?? ((s: string) => _defaultExec(hitWin, s));

  const steps: DemoStepRecord[] = [];

  // 极端容错：hitWin 缺失 → 跳过 + 不抛
  if (!hitWin) {
    return { steps, skipped: true, reason: 'hitWin missing' };
  }

  function record(idx: number, kind: DemoStep['kind'], detail: string): void {
    steps.push({ index: idx, kind, detail, startedAt: now() });
  }

  // 步骤 1-6：6 个 pet-state（idle/thinking/working/attention/notification/sleeping）
  // 通过 'panda-event' 通道 + { type: 'pet-state', state } 契约（main.ts:535 / hit.html:848）
  const stateDurations: Record<string, number> = {
    idle: timing.idleMs,
    thinking: timing.thinkingMs,
    working: timing.workingMs,
    attention: timing.attentionMs,
    notification: timing.notificationMs,
    sleeping: timing.sleepingMs,
  };

  for (let i = 0; i < DEMO_STEPS.length; i++) {
    const step = DEMO_STEPS[i];
    if (step.kind === 'state') {
      record(i, 'state', step.state);
      send('panda-event', { type: 'pet-state', state: step.state });
      await sleep(stateDurations[step.state] ?? 1000);
    } else if (step.kind === 'levelup') {
      // 步骤 7：levelup → bridge 'level-up' 事件（hit.html:893 → __pandaTriggerLevelUp）
      record(i, 'levelup', `${step.from}->${step.to}`);
      send('panda-event', { type: 'level-up', fromLevel: step.from, toLevel: step.to });
      await sleep(timing.levelupMs);
    } else if (step.kind === 'species-cycle') {
      // 步骤 8：5 物种循环切换 → bridge 'species' 事件（hit.html:863 → __pandaSetSpecies）
      record(i, 'species-cycle', step.sequence.join('->'));
      for (const sp of step.sequence) {
        send('panda-event', { type: 'species', species: sp });
        await sleep(timing.speciesEachMs);
      }
    } else if (step.kind === 'badge') {
      // 步骤 9：badge +N → __pandaSetBadge 直调（无 bridge 事件路径，必须 executeJavaScript）
      record(i, 'badge', String(step.count));
      const safeN = Number.isFinite(step.count) ? Math.floor(step.count) : 0;
      await exec(
        `(function(){try{if(typeof window.__pandaSetBadge==='function')` +
        `window.__pandaSetBadge(${safeN});}catch(_){}})()`
      );
      await sleep(timing.badgeMs);
    } else if (step.kind === 'overlay') {
      // 步骤 10：浮卡 overlay — 复用 __pandaShowStats（带 stats-card UI），文案通过 __pandaSetStats 注入
      // 注意：__pandaSetStats 接受 {lv, xp, rarity}；welcome 文案以 stats 形式打到 stats-card 上方
      // 同时触发 __pandaPoke 摇摆 + __pandaShowStats(autoHideMs)
      record(i, 'overlay', step.message);
      const safeMs = Math.max(500, timing.overlayMs);
      const escMsg = JSON.stringify(step.message);
      await exec(
        `(function(){try{` +
        `if(typeof window.__pandaSetStats==='function')window.__pandaSetStats({lv:1,xp:0,rarity:'legendary'});` +
        `if(typeof window.__pandaPoke==='function')window.__pandaPoke();` +
        `if(typeof window.__pandaShowStats==='function')window.__pandaShowStats(${safeMs});` +
        `try{document.title=${escMsg};}catch(_){}` +
        `}catch(_){}})()`
      );
      await sleep(timing.overlayMs);
    }
  }

  // 演示完成 → 写 firstRun=false（手动 tray 触发可通过 markComplete=false 跳过）
  let marked = false;
  if (opts?.markComplete !== false) {
    const r = markDemoComplete(opts?.deps);
    marked = r.ok;
  }

  return { steps, marked };
}
