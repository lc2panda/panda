// Input:  level / rarity / xp current / total / pctToNext / fromLevel / toLevel
// Output: 纯函数构造 等级徽章 HTML / XP 进度条 HTML / 烟花粒子 HTML / Level Up 文本；
//         以及 applyXxxToHost(host) 把 HTML 注入任意带 .innerHTML 的 fake/真 DOM 元素
// Pos:    panda-on-desk hit 窗口 W2-T2 升级烟花动画 — 纯逻辑模块，与 hit.html inline script 1:1 同源算法
//         严守 anthropic byte-equal — 仅 string 计算与 DOM-like .innerHTML 写入，无 anthropic 通道
//
// [NEW-FILE:#20260419-W2-02]
// 2026-04-19 +08:00 W2-T2 — agent-β-W2-levelup
//   触发原因：hit.html inline script 不便单元测试（需真 DOM）；提取纯函数模块给测试 import，
//             同时 hit.html 内仍以等价算法注入 window.__pandaSetLevel / __pandaSetXP / __pandaTriggerLevelUp。
//   0 新依赖：纯字符串处理 + 极简 DOM-like 接口（{ innerHTML } / {appendChild,removeChild,style,...}）。

/** Rarity 5 档 — 与 src/buddy/types.ts RARITIES 同步（重声明 string union 避免拖整条根 src 编译图） */
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

/**
 * 稀有度 → CSS hex 颜色（前端镜像）
 * why: src/buddy/types.ts RARITY_COLORS 是终端 Theme key（'success'/'permission' 等 ANSI 通道），
 *      DOM 端无法用；这里在 desk 渲染层镜像一份 hex 常量，变更需双侧同步。
 */
export const RARITY_HEX: Readonly<Record<Rarity, string>> = Object.freeze({
  common: '#9aa0a6',     // inactive 灰
  uncommon: '#22c55e',   // success 绿
  rare: '#3b82f6',       // permission 蓝
  epic: '#a855f7',       // autoAccept 紫
  legendary: '#f59e0b',  // warning 金
})

/** 校验 rarity 字面量；非法返回 'common' */
export function normalizeRarity(r: unknown): Rarity {
  if (
    r === 'common' || r === 'uncommon' || r === 'rare' || r === 'epic' || r === 'legendary'
  ) return r
  return 'common'
}

/** 等级徽章 HTML — `Lv 12` + 颜色（小字 monospace）。 */
export function renderLevelBadge(level: number, rarity: Rarity): string {
  const lv = Number.isFinite(level) && level > 0 ? Math.floor(level) : 1
  const color = RARITY_HEX[rarity] ?? RARITY_HEX.common
  // why inline style：hit.html 不引外部 css，注入即可见；data-rarity 便于测试断言
  return (
    `<span class="panda-level-badge" data-level="${lv}" data-rarity="${rarity}" ` +
    `style="font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;` +
    `font-size:11px;font-weight:bold;color:${color};` +
    `text-shadow:0 1px 2px rgba(0,0,0,0.6);letter-spacing:0.5px;">` +
    `Lv ${lv}` +
    `</span>`
  )
}

/** XP 进度条 HTML — 5px 高 + 圆角 + 背景灰 + fill RARITY_HEX。 */
export function renderXPBar(
  current: number,
  total: number,
  pctToNext: number,
  rarity: Rarity,
): string {
  const pct = clampPct(pctToNext)
  const color = RARITY_HEX[rarity] ?? RARITY_HEX.common
  const cur = Number.isFinite(current) && current >= 0 ? Math.floor(current) : 0
  const tot = Number.isFinite(total) && total > 0 ? Math.floor(total) : 0
  return (
    `<div class="panda-xp-bar" data-current="${cur}" data-total="${tot}" data-pct="${pct}" ` +
    `style="width:60px;height:5px;border-radius:3px;background:rgba(255,255,255,0.18);` +
    `overflow:hidden;margin-top:2px;">` +
    `<div class="panda-xp-fill" style="width:${pct}%;height:100%;background:${color};` +
    `border-radius:3px;transition:width 350ms ease-out;"></div>` +
    `</div>`
  )
}

/** 等级 + 进度条容器（默认隐藏，companionShowLevel=false 时不渲染 visible）。 */
export function renderLevelContainer(
  level: number,
  rarity: Rarity,
  current: number,
  total: number,
  pctToNext: number,
  visible: boolean,
): string {
  const display = visible ? 'flex' : 'none'
  return (
    `<div id="panda-level-container" data-visible="${visible ? '1' : '0'}" ` +
    `style="position:absolute;top:6px;left:50%;transform:translateX(-50%);` +
    `display:${display};flex-direction:column;align-items:center;` +
    `pointer-events:none;z-index:10;">` +
    renderLevelBadge(level, rarity) +
    renderXPBar(current, total, pctToNext, rarity) +
    `</div>`
  )
}

/** Level Up 中央文本 HTML — 含 fadeIn/fadeOut。 */
export function renderLevelUpText(fromLevel: number, toLevel: number, rarity: Rarity): string {
  const fl = Math.max(1, Math.floor(fromLevel || 1))
  const tl = Math.max(1, Math.floor(toLevel || 1))
  const color = RARITY_HEX[rarity] ?? RARITY_HEX.legendary
  return (
    `<div class="panda-levelup-text" data-from="${fl}" data-to="${tl}" ` +
    `style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);` +
    `font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;` +
    `font-size:14px;font-weight:bold;color:${color};` +
    `text-shadow:0 0 6px rgba(255,255,255,0.7),0 1px 2px rgba(0,0,0,0.7);` +
    `pointer-events:none;z-index:30;` +
    `animation:panda-levelup-text 2.5s ease-out forwards;">` +
    `Level Up! ${fl} → ${tl}` +
    `</div>`
  )
}

/** 烟花粒子数（默认 12 个 — 兼顾视觉密度与 DOM 成本）。 */
export const FIREWORK_PARTICLE_COUNT = 12

/** 单个烟花粒子 HTML — 径向运动；index 决定角度。 */
export function renderFireworkParticle(index: number, rarity: Rarity, total = FIREWORK_PARTICLE_COUNT): string {
  const angle = (360 / total) * index
  const color = RARITY_HEX[rarity] ?? RARITY_HEX.legendary
  return (
    `<div class="panda-firework-particle" data-index="${index}" data-angle="${angle}" ` +
    `style="position:absolute;top:50%;left:50%;width:6px;height:6px;` +
    `margin:-3px 0 0 -3px;border-radius:50%;background:${color};` +
    `box-shadow:0 0 4px ${color},0 0 8px rgba(255,255,255,0.5);` +
    `pointer-events:none;z-index:20;` +
    `transform:rotate(${angle}deg) translateY(0);` +
    `animation:panda-firework-burst 1.2s ease-out forwards;"></div>`
  )
}

/** 烟花容器（含全部粒子 + 中心文本）HTML。 */
export function renderFireworkBurst(fromLevel: number, toLevel: number, rarity: Rarity): string {
  const parts: string[] = []
  for (let i = 0; i < FIREWORK_PARTICLE_COUNT; i++) {
    parts.push(renderFireworkParticle(i, rarity, FIREWORK_PARTICLE_COUNT))
  }
  return (
    `<div class="panda-firework-container" data-from="${fromLevel}" data-to="${toLevel}" ` +
    `style="position:absolute;top:50%;left:50%;width:1px;height:1px;` +
    `pointer-events:none;z-index:25;">` +
    parts.join('') +
    renderLevelUpText(fromLevel, toLevel, rarity) +
    `</div>`
  )
}

/** 升级 panda 跳跃 keyframes 名（hit.html CSS 已声明）。 */
export const LEVELUP_JUMP_ANIMATION = 'panda-levelup-jump'
/** 烟花粒子 keyframes 名。 */
export const LEVELUP_FIREWORK_ANIMATION = 'panda-firework-burst'
/** 中央文本 keyframes 名。 */
export const LEVELUP_TEXT_ANIMATION = 'panda-levelup-text'

// ─────────────────────────────────────────────────────────────────────────────
// DOM-like apply 接口 — 接受任意带 innerHTML 的对象，便于测试无 jsdom
// ─────────────────────────────────────────────────────────────────────────────

/** 极简 host 接口 — 只需 innerHTML 字符串读写 */
export interface HtmlHost {
  innerHTML: string
}

/**
 * 把等级徽章 + 进度条注入 host。host 通常是 #panda-level-container 元素；
 * 若 host 不存在（没有 setLevel 容器），调用方需自行创建。
 */
export function applyLevelToHost(
  host: HtmlHost,
  level: number,
  rarity: Rarity,
  current = 0,
  total = 0,
  pctToNext = 0,
): void {
  host.innerHTML = renderLevelBadge(level, rarity) + renderXPBar(current, total, pctToNext, rarity)
}

/**
 * 把烟花容器注入 host。host 通常是 panda-stage 元素。
 * 注意：仅追加 HTML 字符串；调用方需在动画结束后手动移除。
 */
export function applyFireworkToHost(
  host: HtmlHost,
  fromLevel: number,
  toLevel: number,
  rarity: Rarity,
): void {
  host.innerHTML = host.innerHTML + renderFireworkBurst(fromLevel, toLevel, rarity)
}

// ─────────────────────────────────────────────────────────────────────────────
// 内部
// ─────────────────────────────────────────────────────────────────────────────

function clampPct(p: number): number {
  if (!Number.isFinite(p)) return 0
  if (p < 0) return 0
  if (p > 100) return 100
  return Math.floor(p)
}
