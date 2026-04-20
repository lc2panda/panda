// Input:
//   - hitWin: Electron BrowserWindow（必须 webContents 已 ready；hit.html 已 loadFile 完成）
//   - opts.deps?: { loadDeskPrefs?, saveDeskPrefs? } — 测试可注入 mock；生产从 ./prefs 默认 require
//   - opts.timing?: { idleMs, thinkingMs, workingMs, attentionMs, notificationMs, sleepingMs, levelupMs, speciesEachMs, badgeMs, overlayMs }
//                    — 测试时可缩减为 1ms 加速断言
//   - opts.now?: () => number — 测试可注入 fake clock
//   - opts.sleep?: (ms) => Promise<void> — 测试可注入立即 resolve sleep
//   - opts.send?: (channel, payload) => void — 默认 hitWin.webContents.send；测试可拦截
//   - opts.exec?: (script) => Promise<unknown> — 默认 hitWin.webContents.executeJavaScript；测试可拦截
//   - opts.onSubtitle?: (text: string) => void — 观察引导字幕（测试用）
//   - opts.onProgress?: (pct: number) => void — 观察 progress bar 进度（0-100）
//   - opts.skipSignal?: () => boolean — 外部 skip（测试/tray 按钮兜底，默认通过 exec 轮询 window.__pandaDemoSkip）
//   - opts.playSoundCue?: (cue: 'short'|'critical'|'gentle') => void — W21-T2 每步声音线索（不打扰 cooldown 由 sound/player 自管）
//   - opts.userLevel?: number — W21-T2 当前等级（默认 1）→ getStepsForLevel() 个性化裁剪
//   - opts.onCursorHint?: (action: 'show'|'click'|'hide') => void — W21-T2 虚拟鼠标指示观察器
//
// Output:
//   - runDemoSequence(hitWin, opts?) → Promise<{ steps, skipped?, reason?, marked?, progressSeries?, subtitles?, soundCues?, cursorHints? }>
//   - shouldRunDemo(prefs) → boolean — 同时尊重 demoSkipped=true（W21-T2）
//   - markDemoComplete(opts?) → 写 ~/.pandacc/desk-prefs.json firstRun=false
//   - markDemoSkipped(opts?) → 写 ~/.pandacc/desk-prefs.json demoSkipped=true（W21-T2 用户明确不想看）
//   - DEMO_STEPS（10 步骤静态序列）+ DEMO_SPECIES_CYCLE（5 物种循环：robot → owl → chonk → duck → panda）
//   - DEMO_SUBTITLES（10 步骤引导字幕文案）
//   - DEMO_STEP_SOUND_CUES（W21-T2 10 步骤一一对应的 sound cue 类别）
//   - getStepsForLevel(level) → DemoStep[] 按等级裁剪解锁内容（W21-T2）
//
// Pos:
//   - panda-on-desk W14-T4 演示模式入口 — 让用户首次启动直观看到 8 个 __panda* 接口的全部能力
//   - 调用方：① main.ts whenReady + did-finish-load → if (firstRun) runDemoSequence()
//             ② tray "Show Demo" 菜单点击 → runDemoSequence()（手动触发不写 firstRun=false）
//   - W17-T3 深化：时长 30s→~20s + 引导字幕 + progress bar + skip 按钮 + 平滑过渡 + 升级 welcome overlay
//   - W21-T2 polish：sound cue 每步 + 虚拟鼠标点击暗示 + final card /buddy 命令引导 + demoSkipped 持久化 + 等级个性化
//
// [NEW-FILE:#W14-04] + [UPDATE:#W17-T3 20260420] + [UPDATE:#W21-T2 20260420]
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
// W17-T3 深化原则：
//   - 所有新 UI（progress / subtitle / skip / welcome）通过 exec() 注入 hit.html 的 document.body，
//     不改 hit.html，不引新依赖。overlay 采用 position:fixed + pointer-events 控制；
//     退出时 exec() 清理全部 DOM（避免残留）。
//   - 时长压缩：idle/thinking/working/sleeping 每步 1.5s；attention/notification 1.5s；
//     species each 0.8s；overlay welcome 3.0s；总时长 19.5s ≤ 25s DoD。
// 最小化方案：单文件（~380 行）；0 新依赖；全注入式；纯 async/await 时间线。
// 回滚：还原 DEFAULT_TIMING 与 runDemoSequence 主循环即可；新导出 DEMO_SUBTITLES / *ChromeScripts 可忽略。

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

// W17-T3 深化：时长 30s → 19.5s（每步 1.5s；species each 0.8s；welcome 3s）
export const DEFAULT_TIMING: DemoTiming = {
  idleMs: 1500,
  thinkingMs: 1500,
  workingMs: 1500,
  attentionMs: 1500,
  notificationMs: 1500,
  sleepingMs: 1500,
  levelupMs: 2000,
  speciesEachMs: 800,
  badgeMs: 1500,
  overlayMs: 3000,
};

// 物种循环：panda(default) 起步 → robot → owl → chonk → duck → 回 panda
// 5 物种白名单内全部成员（default + robot + owl + chonk + duck），与 prefs.PANDA_SPECIES_WHITELIST 子集对齐
export const DEMO_SPECIES_CYCLE = ['robot', 'owl', 'chonk', 'duck', 'default'] as const;

export const DEMO_STEPS: ReadonlyArray<DemoStep> = [
  { kind: 'state', state: 'idle' },             // 1. 1.5s 呼吸
  { kind: 'state', state: 'thinking' },         // 2. 1.5s 问号浮动
  { kind: 'state', state: 'working' },          // 3. 1.5s 摇头
  { kind: 'state', state: 'attention' },        // 4. 1.5s 跳跃
  { kind: 'state', state: 'notification' },     // 5. 1.5s 摇铃
  { kind: 'state', state: 'sleeping' },         // 6. 1.5s Z 飘
  { kind: 'levelup', from: 1, to: 2 },          // 7. 烟花 + banner
  { kind: 'species-cycle', sequence: DEMO_SPECIES_CYCLE }, // 8. 5 物种切换（淡入淡出）
  { kind: 'badge', count: 3 },                  // 9. badge +3 红圆
  { kind: 'overlay', message: '欢迎使用 panda-on-desk!' }, // 10. welcome 浮卡
];

if (DEMO_STEPS.length !== 10) {
  throw new Error('[demo-mode] DEMO_STEPS must have exactly 10 entries');
}

// W17-T3：10 步骤引导字幕文案（bottom overlay 显示；与 DEMO_STEPS 一一对应）
export const DEMO_SUBTITLES: ReadonlyArray<string> = [
  '正在休息 · idle',
  '思考中 · thinking',
  '工作中 · working',
  '注意! · attention',
  '新通知 · notification',
  '睡眠中 · sleeping',
  '升级! · level up',
  '切换物种 · species',
  '未读徽章 · badge',
  '欢迎使用 panda-on-desk',
];

if (DEMO_SUBTITLES.length !== DEMO_STEPS.length) {
  throw new Error('[demo-mode] DEMO_SUBTITLES length must match DEMO_STEPS');
}

// ── W21-T2：每步 sound cue（与 DEMO_STEPS 一一对应；'short'=短促 / 'gentle'=轻柔 / 'critical'=强提示） ──
// 设计：sound/player.ts 已含 10s cooldown，反复 'short' 不会刷屏；levelup/overlay 用 'critical' 突出关键里程碑。
export const DEMO_STEP_SOUND_CUES: ReadonlyArray<'short' | 'gentle' | 'critical'> = [
  'gentle',    // 1. idle
  'short',     // 2. thinking
  'short',     // 3. working
  'critical',  // 4. attention
  'short',     // 5. notification
  'gentle',    // 6. sleeping
  'critical',  // 7. levelup
  'gentle',    // 8. species-cycle
  'short',     // 9. badge
  'critical',  // 10. overlay
];

if (DEMO_STEP_SOUND_CUES.length !== DEMO_STEPS.length) {
  throw new Error('[demo-mode] DEMO_STEP_SOUND_CUES length must match DEMO_STEPS');
}

// ── W21-T2：等级个性化 — 根据当前等级裁剪 demo 步骤 ────────────────────────────
// 设计：与 src/buddy/types.ts::PETSTATE_UNLOCK_LEVEL 1:1 对齐，避免在 demo 中演示用户尚未解锁的能力，
//       让"养成感"从首次见面就被感知。levelup/species/badge/overlay 始终保留（属于元能力，非 pet-state）。
//
// PETSTATE_UNLOCK_LEVEL（types.ts 锚点）：
//   idle/sleeping/dozing → lv 1
//   thinking/waking      → lv 5
//   working/notification → lv 10
//   attention/error      → lv 15
//
// 故：lv  1 → idle + sleeping（2 个 state）
//     lv  5 → +thinking（3 个 state）
//     lv 10 → +working +notification（5 个 state）
//     lv 15 → +attention（6 个 state；完整 demo）
const STATE_MIN_LEVEL: Record<string, number> = {
  idle: 1,
  sleeping: 1,
  thinking: 5,
  working: 10,
  notification: 10,
  attention: 15,
};

export function getStepsForLevel(level: number): DemoStep[] {
  const lv = Number.isFinite(level) && level > 0 ? Math.floor(level) : 1;
  const out: DemoStep[] = [];
  for (const step of DEMO_STEPS) {
    if (step.kind === 'state') {
      const need = STATE_MIN_LEVEL[step.state] ?? 1;
      if (lv >= need) out.push(step);
      // 未解锁 state → 跳过（实现"养成进度"暗示）
    } else {
      // 元能力（levelup/species/badge/overlay）始终保留
      out.push(step);
    }
  }
  // 兜底：若全裁完仅剩元能力，仍保留 idle 让画面非空
  const hasState = out.some(s => s.kind === 'state');
  if (!hasState) out.unshift({ kind: 'state', state: 'idle' });
  return out;
}

// 同步裁剪 subtitle / sound cue（按 DEMO_STEPS 索引匹配，保持一致性）
export function getSubtitlesForLevel(level: number): string[] {
  const lv = Number.isFinite(level) && level > 0 ? Math.floor(level) : 1;
  const out: string[] = [];
  for (let i = 0; i < DEMO_STEPS.length; i++) {
    const step = DEMO_STEPS[i];
    if (step.kind === 'state') {
      const need = STATE_MIN_LEVEL[step.state] ?? 1;
      if (lv >= need) out.push(DEMO_SUBTITLES[i]);
    } else {
      out.push(DEMO_SUBTITLES[i]);
    }
  }
  if (out.length === 0) out.push(DEMO_SUBTITLES[0]);
  return out;
}

export function getSoundCuesForLevel(level: number): Array<'short' | 'gentle' | 'critical'> {
  const lv = Number.isFinite(level) && level > 0 ? Math.floor(level) : 1;
  const out: Array<'short' | 'gentle' | 'critical'> = [];
  for (let i = 0; i < DEMO_STEPS.length; i++) {
    const step = DEMO_STEPS[i];
    if (step.kind === 'state') {
      const need = STATE_MIN_LEVEL[step.state] ?? 1;
      if (lv >= need) out.push(DEMO_STEP_SOUND_CUES[i]);
    } else {
      out.push(DEMO_STEP_SOUND_CUES[i]);
    }
  }
  if (out.length === 0) out.push(DEMO_STEP_SOUND_CUES[0]);
  return out;
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

// ── shouldRunDemo / markDemoComplete / markDemoSkipped ───────────────────────
export interface PrefsDeps {
  loadDeskPrefs?: () => { firstRun?: boolean; demoSkipped?: boolean } & Record<string, unknown>;
  saveDeskPrefs?: (patch: Record<string, unknown>) => unknown;
}

// W21-T2：尊重 demoSkipped — 用户明确不想看时永久跳过；firstRun=false 时也跳（已播过）
export function shouldRunDemo(
  prefs: { firstRun?: boolean; demoSkipped?: boolean } | null | undefined,
): boolean {
  if (!prefs || typeof prefs !== 'object') return true; // 缺失视为 firstRun
  if (prefs.demoSkipped === true) return false;          // 用户明确放弃
  return prefs.firstRun !== false;                       // 仅当显式 false 才跳过
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

// W21-T2：用户明确不想看（点击 welcome overlay "不再显示" 或 tray "永不演示"）
//         → demoSkipped=true 持久化；同时也 firstRun=false 锁定首次状态。
export function markDemoSkipped(deps?: PrefsDeps): { ok: boolean; reason?: string } {
  try {
    const save = deps?.saveDeskPrefs ?? (require('./prefs.js') as any).saveDeskPrefs;
    if (typeof save !== 'function') return { ok: false, reason: 'saveDeskPrefs unavailable' };
    save({ firstRun: false, demoSkipped: true });
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: (err as Error)?.message };
  }
}

// ── W17-T3：overlay chrome 注入/清理/更新脚本 ──────────────────────────────────
// 所有 id 统一前缀 `panda-demo-*`；cleanup 按 id 精确移除，避免污染 hit.html 既有 DOM。
// progress bar: 顶部 2px 横线（0 → 100%）；subtitle: 底部 36px 卡片（fade 0.3s）；
// skip button: 右上 8px；点击后设 window.__pandaDemoSkip=true，主循环下一 tick 自中断。
export function buildChromeInitScript(): string {
  return `(function(){try{
    if (document.getElementById('panda-demo-chrome')) return;
    var root = document.createElement('div');
    root.id = 'panda-demo-chrome';
    root.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:2147483600;font-family:system-ui,sans-serif;';
    root.innerHTML =
      '<div id="panda-demo-progress" style="position:absolute;top:0;left:0;height:2px;width:0%;' +
        'background:linear-gradient(90deg,#66bb6a,#42a5f5);transition:width 0.3s ease-out;box-shadow:0 0 6px rgba(66,165,245,0.6);"></div>' +
      '<div id="panda-demo-subtitle" style="position:absolute;bottom:16px;left:50%;transform:translateX(-50%);' +
        'padding:6px 14px;background:rgba(0,0,0,0.62);color:#fff;border-radius:12px;font-size:12px;' +
        'opacity:0;transition:opacity 0.3s ease-out;max-width:80%;text-align:center;white-space:nowrap;' +
        'backdrop-filter:blur(4px);"></div>' +
      '<button id="panda-demo-skip" style="position:absolute;top:8px;right:8px;pointer-events:auto;' +
        'padding:4px 10px;background:rgba(0,0,0,0.55);color:#fff;border:1px solid rgba(255,255,255,0.25);' +
        'border-radius:8px;font-size:11px;cursor:pointer;opacity:0.85;transition:opacity 0.2s;" ' +
        'onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.85">跳过 Skip</button>';
    document.body.appendChild(root);
    window.__pandaDemoSkip = false;
    var btn = document.getElementById('panda-demo-skip');
    if (btn) btn.addEventListener('click', function(){ window.__pandaDemoSkip = true; });
  }catch(_){}})();`;
}

export function buildSubtitleScript(text: string): string {
  const esc = JSON.stringify(String(text ?? ''));
  return `(function(){try{
    var el=document.getElementById('panda-demo-subtitle');
    if(!el)return;
    el.style.opacity='0';
    setTimeout(function(){try{el.textContent=${esc};el.style.opacity='1';}catch(_){}}, 80);
  }catch(_){}})();`;
}

export function buildProgressScript(pct: number): string {
  const safe = Math.max(0, Math.min(100, Number.isFinite(pct) ? pct : 0));
  return `(function(){try{
    var el=document.getElementById('panda-demo-progress');
    if(el)el.style.width=${safe}+'%';
  }catch(_){}})();`;
}

export function buildTransitionFadeScript(ms = 300): string {
  const dur = Math.max(50, Math.min(1000, Number.isFinite(ms) ? ms : 300));
  return `(function(){try{
    var pet=document.getElementById('pet');
    if(!pet)return;
    pet.style.transition='opacity ${dur}ms ease-in-out';
    pet.style.opacity='0.35';
    setTimeout(function(){try{pet.style.opacity='1';}catch(_){}}, ${Math.floor(dur / 2)});
  }catch(_){}})();`;
}

export function buildLevelUpBoostScript(): string {
  // W17-T3：更精彩烟花 — 额外 12 粒子 + 颜色序列 + bounce
  return `(function(){try{
    var stage=document.querySelector('.panda-stage')||document.body;
    if(!stage)return;
    var COLORS=['#ffeb3b','#ff6b6b','#4fc3f7','#81c784','#ba68c8','#ffa726'];
    var wrap=document.createElement('div');
    wrap.className='panda-demo-fx-boost';
    wrap.style.cssText='position:absolute;left:50%;top:50%;width:0;height:0;pointer-events:none;z-index:2147483500;';
    for(var i=0;i<12;i++){
      var p=document.createElement('span');
      var ang=(i*30);
      p.style.cssText='position:absolute;left:-4px;top:-4px;width:8px;height:8px;border-radius:50%;'+
        'background:'+COLORS[i%COLORS.length]+';--angle:'+ang+'deg;'+
        'animation:panda-firework-burst 1.8s ease-out forwards;opacity:0.95;';
      wrap.appendChild(p);
    }
    stage.appendChild(wrap);
    setTimeout(function(){try{wrap.remove();}catch(_){}}, 2000);
  }catch(_){}})();`;
}

export function buildSpeciesFadeScript(): string {
  return `(function(){try{
    var pet=document.getElementById('pet');
    if(!pet)return;
    pet.style.transition='opacity 0.25s ease-in-out,transform 0.25s ease-in-out';
    pet.style.opacity='0.2';
    pet.style.transform='scale(0.92)';
    setTimeout(function(){try{
      pet.style.opacity='1';pet.style.transform='scale(1)';
    }catch(_){}}, 220);
  }catch(_){}})();`;
}

export function buildWelcomeOverlayScript(message: string): string {
  const esc = JSON.stringify(String(message ?? '欢迎使用 panda-on-desk!'));
  // W21-T2：final card 升级 — 同时展示 /buddy stats + /buddy desk 命令引导，
  //         并新增"不再显示"按钮（点击设 window.__pandaDemoNeverShow=true）。
  return `(function(){try{
    var old=document.getElementById('panda-demo-welcome');
    if(old)old.remove();
    var card=document.createElement('div');
    card.id='panda-demo-welcome';
    card.style.cssText='position:fixed;left:50%;top:50%;transform:translate(-50%,-50%) scale(0.85);' +
      'padding:18px 22px;background:linear-gradient(135deg,rgba(40,40,60,0.92),rgba(20,20,35,0.95));' +
      'color:#fff;border:1px solid rgba(255,255,255,0.18);border-radius:14px;' +
      'box-shadow:0 8px 32px rgba(0,0,0,0.45),0 0 0 1px rgba(255,255,255,0.06) inset;' +
      'font-family:system-ui,sans-serif;font-size:13px;z-index:2147483610;pointer-events:auto;' +
      'opacity:0;transition:opacity 0.32s ease-out,transform 0.32s cubic-bezier(0.25,1.4,0.5,1);' +
      'max-width:340px;text-align:center;';
    var codeStyle='background:rgba(255,255,255,0.12);padding:2px 6px;border-radius:4px;font-family:ui-monospace,Menlo,monospace;font-size:12px;';
    card.innerHTML =
      '<div style="font-size:22px;margin-bottom:6px;">🎉</div>' +
      '<div style="font-weight:600;margin-bottom:8px;font-size:14px;">'+'welcome'.replace('welcome',${esc})+'</div>' +
      '<div style="color:#b0bec5;margin-bottom:6px;line-height:1.6;">查看养成等级 → <code style="'+codeStyle+'">/buddy stats</code></div>' +
      '<div style="color:#b0bec5;margin-bottom:12px;line-height:1.6;">桌面宠物模式 → <code style="'+codeStyle+'">/buddy desk</code></div>' +
      '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">' +
        '<button id="panda-demo-welcome-desk" style="padding:6px 14px;background:#42a5f5;color:#fff;border:none;' +
          'border-radius:8px;font-size:12px;cursor:pointer;font-weight:500;">跳到桌面 /buddy desk</button>' +
        '<button id="panda-demo-welcome-never" style="padding:6px 12px;background:transparent;color:#90a4ae;border:1px solid rgba(255,255,255,0.2);' +
          'border-radius:8px;font-size:11px;cursor:pointer;">不再显示</button>' +
      '</div>';
    document.body.appendChild(card);
    requestAnimationFrame(function(){ try{card.style.opacity='1';card.style.transform='translate(-50%,-50%) scale(1)';}catch(_){} });
    var bDesk=document.getElementById('panda-demo-welcome-desk');
    if(bDesk)bDesk.addEventListener('click', function(){ window.__pandaDemoWelcomeDesk=true; try{card.remove();}catch(_){} });
    var bNever=document.getElementById('panda-demo-welcome-never');
    if(bNever)bNever.addEventListener('click', function(){ window.__pandaDemoNeverShow=true; try{card.remove();}catch(_){} });
  }catch(_){}})();`;
}

// W21-T2：虚拟鼠标 cursor 暗示脚本 — show/click/hide 三相位
//   show  → 在屏幕中央生成 24px svg cursor（pointer-events:none），逐步移到 #pet 元素上方
//   click → 触发 pulse 圆环 + 调 window.__pandaPoke()（如存在），暗示"用户可点击 panda 触发反应"
//   hide  → 250ms 渐隐后移除 DOM
export function buildCursorHintScript(action: 'show' | 'click' | 'hide'): string {
  const safeAction =
    action === 'show' || action === 'click' || action === 'hide' ? action : 'hide';
  if (safeAction === 'show') {
    return `(function(){try{
      if(document.getElementById('panda-demo-cursor'))return;
      var c=document.createElement('div');
      c.id='panda-demo-cursor';
      c.style.cssText='position:fixed;left:50%;top:50%;width:24px;height:24px;pointer-events:none;' +
        'z-index:2147483620;transition:left 1.0s cubic-bezier(0.4,0,0.2,1),top 1.0s cubic-bezier(0.4,0,0.2,1),opacity 0.25s;' +
        'opacity:0;';
      c.innerHTML='<svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">' +
        '<path d="M3 3 L3 18 L7 14 L10 21 L13 19 L10 12 L16 12 Z" fill="#ffffff" stroke="#000" stroke-width="1.2"/>' +
        '</svg>';
      document.body.appendChild(c);
      requestAnimationFrame(function(){try{
        c.style.opacity='0.9';
        var pet=document.getElementById('pet');
        if(pet){
          var r=pet.getBoundingClientRect();
          c.style.left=(r.left+r.width/2-12)+'px';
          c.style.top=(r.top+r.height/2-12)+'px';
        }
      }catch(_){}});
    }catch(_){}})();`;
  }
  if (safeAction === 'click') {
    return `(function(){try{
      var c=document.getElementById('panda-demo-cursor');
      if(c){
        var pulse=document.createElement('div');
        pulse.style.cssText='position:absolute;left:-8px;top:-8px;width:40px;height:40px;border-radius:50%;' +
          'border:2px solid #42a5f5;opacity:0.85;animation:panda-demo-pulse 0.55s ease-out forwards;pointer-events:none;';
        c.appendChild(pulse);
        if(!document.getElementById('panda-demo-cursor-style')){
          var st=document.createElement('style');
          st.id='panda-demo-cursor-style';
          st.textContent='@keyframes panda-demo-pulse{0%{transform:scale(0.4);opacity:0.85;}100%{transform:scale(1.6);opacity:0;}}';
          document.head.appendChild(st);
        }
        setTimeout(function(){try{pulse.remove();}catch(_){}}, 600);
      }
      try{ if(typeof window.__pandaPoke==='function') window.__pandaPoke(); }catch(_){}
    }catch(_){}})();`;
  }
  // hide
  return `(function(){try{
    var c=document.getElementById('panda-demo-cursor');
    if(!c)return;
    c.style.opacity='0';
    setTimeout(function(){try{c.remove();}catch(_){}}, 280);
    var st=document.getElementById('panda-demo-cursor-style');
    if(st)try{st.remove();}catch(_){}
  }catch(_){}})();`;
}

export function buildChromeCleanupScript(): string {
  return `(function(){try{
    ['panda-demo-chrome','panda-demo-welcome','panda-demo-cursor','panda-demo-cursor-style'].forEach(function(id){
      var el=document.getElementById(id);
      if(el)el.remove();
    });
    try{window.__pandaDemoSkip=false;}catch(_){}
  }catch(_){}})();`;
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
  onSubtitle?: (text: string) => void;
  onProgress?: (pct: number) => void;
  skipSignal?: () => boolean;
  // markComplete=false 时跳过 firstRun=false 写入（手动 tray 触发场景）
  markComplete?: boolean;
  deps?: PrefsDeps;
  // W21-T2 新增
  playSoundCue?: (cue: 'short' | 'gentle' | 'critical') => void;
  userLevel?: number;
  onCursorHint?: (action: 'show' | 'click' | 'hide') => void;
}

export interface DemoResult {
  steps: DemoStepRecord[];
  skipped?: boolean;
  reason?: string;
  marked?: boolean;
  progressSeries?: number[];
  subtitles?: string[];
  // W21-T2
  soundCues?: Array<'short' | 'gentle' | 'critical'>;
  cursorHints?: Array<'show' | 'click' | 'hide'>;
  userLevel?: number;
  neverShow?: boolean;
}

export async function runDemoSequence(hitWin: any, opts?: DemoOptions): Promise<DemoResult> {
  const timing: DemoTiming = { ...DEFAULT_TIMING, ...(opts?.timing || {}) };
  const now = opts?.now ?? Date.now;
  const sleep = opts?.sleep ?? _defaultSleep;
  const send = opts?.send ?? ((ch: string, p: unknown) => _defaultSend(hitWin, ch, p));
  const exec = opts?.exec ?? ((s: string) => _defaultExec(hitWin, s));
  const onSubtitle = opts?.onSubtitle;
  const onProgress = opts?.onProgress;
  const externalSkip = opts?.skipSignal;
  const playSoundCue = opts?.playSoundCue;
  const onCursorHint = opts?.onCursorHint;
  // W21-T2：userLevel 未提供 → 走"完整 demo"路径（向后兼容 W14-T4/W17-T3 行为）
  // 仅当显式传入 number 才启用等级裁剪。这样老调用方零行为变化。
  const userLevelProvided = typeof opts?.userLevel === 'number' && Number.isFinite(opts!.userLevel);
  const userLevel = userLevelProvided && (opts!.userLevel as number) > 0
    ? Math.floor(opts!.userLevel as number)
    : 1;

  const steps: DemoStepRecord[] = [];
  const progressSeries: number[] = [];
  const subtitles: string[] = [];
  const soundCues: Array<'short' | 'gentle' | 'critical'> = [];
  const cursorHints: Array<'show' | 'click' | 'hide'> = [];

  // 极端容错：hitWin 缺失 → 跳过 + 不抛
  if (!hitWin) {
    return {
      steps,
      skipped: true,
      reason: 'hitWin missing',
      progressSeries,
      subtitles,
      soundCues,
      cursorHints,
      userLevel,
    };
  }

  function record(idx: number, kind: DemoStep['kind'], detail: string): void {
    steps.push({ index: idx, kind, detail, startedAt: now() });
  }

  async function updateProgress(pct: number): Promise<void> {
    const safe = Math.max(0, Math.min(100, Math.round(pct)));
    progressSeries.push(safe);
    if (onProgress) {
      try { onProgress(safe); } catch (_) { /* ignore observer error */ }
    }
    await exec(buildProgressScript(safe));
  }

  async function updateSubtitle(text: string): Promise<void> {
    subtitles.push(text);
    if (onSubtitle) {
      try { onSubtitle(text); } catch (_) { /* ignore observer error */ }
    }
    await exec(buildSubtitleScript(text));
  }

  // W21-T2：每步 sound cue（cooldown 由 sound/player 内部管理，这里只 fire-and-forget）
  function fireSoundCue(cue: 'short' | 'gentle' | 'critical'): void {
    soundCues.push(cue);
    if (playSoundCue) {
      try { playSoundCue(cue); } catch (_) { /* swallow — 不让 sound 失败拖死 demo */ }
    }
  }

  async function fireCursorHint(action: 'show' | 'click' | 'hide'): Promise<void> {
    cursorHints.push(action);
    if (onCursorHint) {
      try { onCursorHint(action); } catch (_) { /* ignore */ }
    }
    await exec(buildCursorHintScript(action));
  }

  async function checkSkip(): Promise<boolean> {
    if (typeof externalSkip === 'function') {
      try { if (externalSkip()) return true; } catch (_) { /* ignore */ }
    }
    try {
      const r = await exec('(function(){try{return !!window.__pandaDemoSkip;}catch(_){return false;}})()');
      return r === true;
    } catch (_) {
      return false;
    }
  }

  // W21-T2：检查 welcome overlay 上"不再显示"按钮（轮询 window.__pandaDemoNeverShow）
  async function checkNeverShow(): Promise<boolean> {
    try {
      const r = await exec('(function(){try{return !!window.__pandaDemoNeverShow;}catch(_){return false;}})()');
      return r === true;
    } catch (_) {
      return false;
    }
  }

  // 注入 chrome（progress/subtitle/skip 按钮）
  await exec(buildChromeInitScript());
  await updateProgress(0);

  // W21-T2：等级个性化裁剪（仅当显式传入 userLevel 时生效）
  // 与 DEMO_STEPS 的索引对齐 — 同时挑出对应的 subtitle / soundCue（避免裁剪后位移错位）
  const filteredIdx: number[] = [];
  if (userLevelProvided) {
    for (let i = 0; i < DEMO_STEPS.length; i++) {
      const step = DEMO_STEPS[i];
      if (step.kind === 'state') {
        const need = STATE_MIN_LEVEL[step.state] ?? 1;
        if (userLevel >= need) filteredIdx.push(i);
      } else {
        filteredIdx.push(i);
      }
    }
    // 兜底（避免低 level 全裁完空播）— 至少跑 idle (i=0)
    if (filteredIdx.length === 0) filteredIdx.push(0);
  } else {
    // 未指定等级 → 走完整 10 步（向后兼容）
    for (let i = 0; i < DEMO_STEPS.length; i++) filteredIdx.push(i);
  }

  // 步骤 1-6：6 个 pet-state（idle/thinking/working/attention/notification/sleeping）
  const stateDurations: Record<string, number> = {
    idle: timing.idleMs,
    thinking: timing.thinkingMs,
    working: timing.workingMs,
    attention: timing.attentionMs,
    notification: timing.notificationMs,
    sleeping: timing.sleepingMs,
  };

  let userSkipped = false;
  let neverShow = false;

  for (let stepOrder = 0; stepOrder < filteredIdx.length; stepOrder++) {
    const i = filteredIdx[stepOrder];
    // skip 提前退出
    if (await checkSkip()) { userSkipped = true; break; }

    const step = DEMO_STEPS[i];
    await updateSubtitle(DEMO_SUBTITLES[i]);
    fireSoundCue(DEMO_STEP_SOUND_CUES[i]);

    if (step.kind === 'state') {
      record(i, 'state', step.state);
      // 平滑过渡（fade 0.3s）— 仅 state 步骤间生效，不污染 levelup/species
      if (stepOrder > 0) await exec(buildTransitionFadeScript(300));
      send('panda-event', { type: 'pet-state', state: step.state });
      // W21-T2：第一个 state 步骤额外触发 cursor hint（show + click + hide）— 暗示"可点击 panda"
      if (stepOrder === 0) {
        await fireCursorHint('show');
        await fireCursorHint('click');
      }
      await sleep(stateDurations[step.state] ?? 1000);
      if (stepOrder === 0) await fireCursorHint('hide');
    } else if (step.kind === 'levelup') {
      record(i, 'levelup', `${step.from}->${step.to}`);
      send('panda-event', { type: 'level-up', fromLevel: step.from, toLevel: step.to });
      // 额外烟花增强（多粒子 + 颜色 + bounce）
      await exec(buildLevelUpBoostScript());
      await sleep(timing.levelupMs);
    } else if (step.kind === 'species-cycle') {
      record(i, 'species-cycle', step.sequence.join('->'));
      for (const sp of step.sequence) {
        if (await checkSkip()) { userSkipped = true; break; }
        await exec(buildSpeciesFadeScript());
        send('panda-event', { type: 'species', species: sp });
        await sleep(timing.speciesEachMs);
      }
      if (userSkipped) break;
    } else if (step.kind === 'badge') {
      record(i, 'badge', String(step.count));
      const safeN = Number.isFinite(step.count) ? Math.floor(step.count) : 0;
      await exec(
        `(function(){try{if(typeof window.__pandaSetBadge==='function')` +
        `window.__pandaSetBadge(${safeN});}catch(_){}})()`
      );
      await sleep(timing.badgeMs);
    } else if (step.kind === 'overlay') {
      record(i, 'overlay', step.message);
      const safeMs = Math.max(500, timing.overlayMs);
      const escMsg = JSON.stringify(step.message);
      // 保持原 __pandaSetStats + __pandaShowStats 兼容（测试断言依赖）
      await exec(
        `(function(){try{` +
        `if(typeof window.__pandaSetStats==='function')window.__pandaSetStats({lv:1,xp:0,rarity:'legendary'});` +
        `if(typeof window.__pandaPoke==='function')window.__pandaPoke();` +
        `if(typeof window.__pandaShowStats==='function')window.__pandaShowStats(${safeMs});` +
        `try{document.title=${escMsg};}catch(_){}` +
        `}catch(_){}})()`
      );
      // W17-T3：welcome overlay 增强（含按钮）
      await exec(buildWelcomeOverlayScript(step.message));
      await sleep(timing.overlayMs);
      // W21-T2：overlay 完成后检查 "不再显示"
      if (await checkNeverShow()) neverShow = true;
    }

    // 进度条线性推进（0 → 100），每步结束 += 100/N
    await updateProgress(((stepOrder + 1) / filteredIdx.length) * 100);
  }

  // cleanup chrome DOM
  await exec(buildChromeCleanupScript());

  // 演示完成 → 写 firstRun=false（手动 tray 触发可通过 markComplete=false 跳过）
  // W21-T2：若 neverShow → 优先调 markDemoSkipped（同时锁 firstRun=false + demoSkipped=true）
  let marked = false;
  if (neverShow) {
    const r = markDemoSkipped(opts?.deps);
    marked = r.ok;
  } else if (opts?.markComplete !== false) {
    const r = markDemoComplete(opts?.deps);
    marked = r.ok;
  }

  const result: DemoResult = {
    steps,
    marked,
    progressSeries,
    subtitles,
    soundCues,
    cursorHints,
    userLevel,
  };
  if (userSkipped) {
    result.skipped = true;
    result.reason = 'user skip';
  }
  if (neverShow) {
    result.neverShow = true;
  }
  return result;
}
