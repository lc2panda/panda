// Input:  bun test 触发；mock displays 列表 + DeskPrefs.displayId
// Output: ≥5 用例 — selectDisplayForPanda + buildDisplayOptions + findDisplayForBounds
//          + computeDefaultBoundsOnDisplay + prefs.displayId 验证 + 跨屏拖拽不丢失
// Pos:    panda-on-desk W22-T1 多屏支持回归测试
//          严守 byte-equal — 不引用 src/services/api/{claude,oauth,providers}
//
// [NEW-FILE:#W22-01]
// 2026-04-20 +08:00 W22-T1 agent-α-W22-multi-display

import { describe, expect, test } from 'bun:test'

import {
  selectDisplayForPanda,
  buildDisplayOptions,
  findDisplayForBounds,
  computeDefaultBoundsOnDisplay,
  type DisplayShape,
} from '../src/geometry/display-select.js'

import {
  DEFAULT_DESK_PREFS,
  validateDeskPrefs,
} from '../src/prefs.js'

// ─────────────────────────────────────────────────────────────────────────────
// Mock displays — 双屏 / 三屏 / 单屏 / 空 fixture
// ─────────────────────────────────────────────────────────────────────────────

const PRIMARY: DisplayShape = {
  id: 1001,
  bounds: { x: 0, y: 0, width: 1920, height: 1080 },
  workArea: { x: 0, y: 0, width: 1920, height: 1040 },
  internal: true,
  label: 'Built-in',
}
const EXTERNAL_RIGHT: DisplayShape = {
  id: 2002,
  bounds: { x: 1920, y: 0, width: 2560, height: 1440 },
  workArea: { x: 1920, y: 30, width: 2560, height: 1410 },
  internal: false,
  label: 'External Right',
}
const EXTERNAL_LEFT: DisplayShape = {
  id: 3003,
  bounds: { x: -1920, y: 0, width: 1920, height: 1080 },
  workArea: { x: -1920, y: 0, width: 1920, height: 1080 },
  internal: false,
  label: 'External Left',
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. selectDisplayForPanda — 5 分支覆盖
// ─────────────────────────────────────────────────────────────────────────────

describe('W22-T1 selectDisplayForPanda · displayId → Display 解析', () => {
  test('case 1: displayId=0（哨位） → 返回 primary', () => {
    const got = selectDisplayForPanda([PRIMARY, EXTERNAL_RIGHT], 0, PRIMARY.id)
    expect(got).not.toBeNull()
    expect(got!.id).toBe(PRIMARY.id)
    expect(got!.workArea.width).toBe(PRIMARY.workArea.width)
  })

  test('case 2: displayId 命中 external → 返回 external', () => {
    const got = selectDisplayForPanda([PRIMARY, EXTERNAL_RIGHT], EXTERNAL_RIGHT.id, PRIMARY.id)
    expect(got).not.toBeNull()
    expect(got!.id).toBe(EXTERNAL_RIGHT.id)
    expect(got!.bounds.x).toBe(1920)
  })

  test('case 3: displayId 失效（屏幕被拔） → 回落到 primary', () => {
    // 用户原选 EXTERNAL_RIGHT，热拔后只剩 primary + EXTERNAL_LEFT
    const got = selectDisplayForPanda([PRIMARY, EXTERNAL_LEFT], EXTERNAL_RIGHT.id, PRIMARY.id)
    expect(got).not.toBeNull()
    expect(got!.id).toBe(PRIMARY.id)
  })

  test('case 4: 空 displays / null displays → null', () => {
    expect(selectDisplayForPanda([], 0, 1001)).toBeNull()
    expect(selectDisplayForPanda(null, 5, 1001)).toBeNull()
    expect(selectDisplayForPanda(undefined, 5, 1001)).toBeNull()
  })

  test('case 5: displayId=null/undefined/-1 三种缺省都视为 primary', () => {
    const ds = [PRIMARY, EXTERNAL_RIGHT]
    expect(selectDisplayForPanda(ds, null, PRIMARY.id)!.id).toBe(PRIMARY.id)
    expect(selectDisplayForPanda(ds, undefined, PRIMARY.id)!.id).toBe(PRIMARY.id)
    expect(selectDisplayForPanda(ds, -1, PRIMARY.id)!.id).toBe(PRIMARY.id)
  })

  test('case 6: primaryDisplayId 不在列表 → fallback 到 displays[0]', () => {
    // 罕见：Electron primary 与 displays 列表 race（OS 切换主屏瞬间）
    const got = selectDisplayForPanda([EXTERNAL_RIGHT, EXTERNAL_LEFT], 0, 99999)
    expect(got).not.toBeNull()
    expect(got!.id).toBe(EXTERNAL_RIGHT.id)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 2. buildDisplayOptions — settings.html 下拉数据
// ─────────────────────────────────────────────────────────────────────────────

describe('W22-T1 buildDisplayOptions · UI 下拉 options 构造', () => {
  test('双屏 → 2 个 option，primary 标 (Main · WxH)', () => {
    const opts = buildDisplayOptions([PRIMARY, EXTERNAL_RIGHT], PRIMARY.id)
    expect(opts.length).toBe(2)
    expect(opts[0].id).toBe(PRIMARY.id)
    expect(opts[0].isPrimary).toBe(true)
    expect(opts[0].label).toContain('Main')
    expect(opts[0].label).toContain('1920×1080')
    expect(opts[1].isPrimary).toBe(false)
    expect(opts[1].label).toContain('2560×1440')
  })

  test('空 displays → 空数组（settings 仍可静态显示 "主屏" option）', () => {
    expect(buildDisplayOptions([], 1001)).toEqual([])
    expect(buildDisplayOptions(null, 1001)).toEqual([])
  })

  test('label 缺省 → 自动 "Display N" 占位', () => {
    const noLabel: DisplayShape = {
      id: 4004,
      bounds: { x: 0, y: 0, width: 1280, height: 720 },
      workArea: { x: 0, y: 0, width: 1280, height: 720 },
    }
    const opts = buildDisplayOptions([noLabel], noLabel.id)
    expect(opts[0].label).toContain('Display 1')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 3. findDisplayForBounds — 跨屏拖拽落点判定（Electron screen.getDisplayMatching 同源）
// ─────────────────────────────────────────────────────────────────────────────

describe('W22-T1 findDisplayForBounds · 跨屏拖拽不丢失', () => {
  test('panda 中心点在 primary 内 → 返回 primary', () => {
    const got = findDisplayForBounds(
      [PRIMARY, EXTERNAL_RIGHT],
      { x: 100, y: 100, width: 200, height: 200 },
    )
    expect(got!.id).toBe(PRIMARY.id)
  })

  test('拖拽到右屏中部 → 返回 EXTERNAL_RIGHT（验证 W21 nuclear 改后跨屏仍工作）', () => {
    // 拖到 (3000, 700) → 中心 (3100, 800) 在右屏 (1920~4480) 内
    const got = findDisplayForBounds(
      [PRIMARY, EXTERNAL_RIGHT],
      { x: 3000, y: 700, width: 200, height: 200 },
    )
    expect(got!.id).toBe(EXTERNAL_RIGHT.id)
  })

  test('拖到左屏（负坐标 x=-1000）→ 返回 EXTERNAL_LEFT', () => {
    const got = findDisplayForBounds(
      [PRIMARY, EXTERNAL_RIGHT, EXTERNAL_LEFT],
      { x: -1000, y: 500, width: 200, height: 200 },
    )
    expect(got!.id).toBe(EXTERNAL_LEFT.id)
  })

  test('空列表 → null', () => {
    expect(findDisplayForBounds([], { x: 0, y: 0, width: 1, height: 1 })).toBeNull()
    expect(findDisplayForBounds(null, { x: 0, y: 0, width: 1, height: 1 })).toBeNull()
  })

  test('完整跨屏 round-trip：拖到右屏 → findDisplayForBounds 命中 → selectDisplayForPanda 复原', () => {
    const ds = [PRIMARY, EXTERNAL_RIGHT, EXTERNAL_LEFT]
    const draggedTo = { x: 3000, y: 1000, width: 200, height: 200 }
    const matched = findDisplayForBounds(ds, draggedTo)!
    expect(matched.id).toBe(EXTERNAL_RIGHT.id)
    // 把 matched.id 当 prefs.displayId 写回 → selectDisplayForPanda 应同样命中
    const reselected = selectDisplayForPanda(ds, matched.id, PRIMARY.id)!
    expect(reselected.id).toBe(EXTERNAL_RIGHT.id)
    expect(reselected.bounds).toEqual(matched.bounds)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 4. computeDefaultBoundsOnDisplay — displayId 切换时跳转目标屏右下角
// ─────────────────────────────────────────────────────────────────────────────

describe('W22-T1 computeDefaultBoundsOnDisplay · 跳屏后默认位', () => {
  test('选中 EXTERNAL_RIGHT → 落点在右屏右下角 (workArea 内 + margin)', () => {
    const size = { width: 240, height: 240 }
    const next = computeDefaultBoundsOnDisplay(EXTERNAL_RIGHT, size, 20)
    expect(next).not.toBeNull()
    // workArea: x=1920, y=30, w=2560, h=1410
    // 期望：x = 1920 + 2560 - 240 - 20 = 4220；y = 30 + 1410 - 240 - 20 = 1180
    expect(next!.x).toBe(4220)
    expect(next!.y).toBe(1180)
    expect(next!.width).toBe(240)
    expect(next!.height).toBe(240)
  })

  test('null display → null（调用方 fallback 到 SYNTHETIC_WORK_AREA）', () => {
    expect(computeDefaultBoundsOnDisplay(null, { width: 100, height: 100 })).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 5. prefs.ts 集成 — displayId 字段持久化 + 校验 + 默认值
// ─────────────────────────────────────────────────────────────────────────────

describe('W22-T1 DeskPrefs.displayId · 持久化 + 校验', () => {
  test('DEFAULT_DESK_PREFS.displayId === 0（主屏哨位）', () => {
    expect(DEFAULT_DESK_PREFS.displayId).toBe(0)
  })

  test('validateDeskPrefs 接受合法 displayId（正整数 / 0 / -1）', () => {
    expect(validateDeskPrefs({ displayId: 0 }).displayId).toBe(0)
    expect(validateDeskPrefs({ displayId: 1001 }).displayId).toBe(1001)
    expect(validateDeskPrefs({ displayId: -1 }).displayId).toBe(-1)
  })

  test('validateDeskPrefs 拒绝非法 displayId → 回落 default(0)', () => {
    expect(validateDeskPrefs({ displayId: 1.5 }).displayId).toBe(0)        // 非整数
    expect(validateDeskPrefs({ displayId: -2 }).displayId).toBe(0)         // 越界
    expect(validateDeskPrefs({ displayId: NaN }).displayId).toBe(0)        // NaN
    expect(validateDeskPrefs({ displayId: 'foo' as any }).displayId).toBe(0) // 字符串
    expect(validateDeskPrefs({ displayId: null as any }).displayId).toBe(0)  // null
    expect(validateDeskPrefs({}).displayId).toBe(0)                        // 缺失
  })

  test('round-trip：write displayId → load → 字段保留', () => {
    const stored = validateDeskPrefs({ displayId: 2002 })
    // 模拟 saveDeskPrefs(JSON.stringify) → loadDeskPrefs(JSON.parse) → validateDeskPrefs
    const reloaded = validateDeskPrefs(JSON.parse(JSON.stringify(stored)))
    expect(reloaded.displayId).toBe(2002)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 6. End-to-end scenario：用户在 settings 选副屏 → mock IPC 链路
//    （验证主流程 listDisplays → save displayId → selectDisplayForPanda 全闭环）
// ─────────────────────────────────────────────────────────────────────────────

describe('W22-T1 端到端：settings 选副屏 → 持久化 → 启动应用到副屏', () => {
  test('full cycle：listDisplays → user 选 EXTERNAL_RIGHT → save → 重启 createWindow 用 EXTERNAL_RIGHT.workArea', () => {
    // step 1: settings.html 拉 IPC 'panda:displays:list' → buildDisplayOptions
    const allDisplays = [PRIMARY, EXTERNAL_RIGHT, EXTERNAL_LEFT]
    const ui = buildDisplayOptions(allDisplays, PRIMARY.id)
    expect(ui.map(o => o.id)).toEqual([PRIMARY.id, EXTERNAL_RIGHT.id, EXTERNAL_LEFT.id])

    // step 2: 用户在下拉里选 EXTERNAL_RIGHT.id → settings:save({ displayId })
    const userPick = ui[1] // EXTERNAL_RIGHT
    const persisted = validateDeskPrefs({ displayId: userPick.id })
    expect(persisted.displayId).toBe(EXTERNAL_RIGHT.id)

    // step 3: 重启 → createWindow 路径走 _getTargetWorkArea(prefs.displayId)
    const target = selectDisplayForPanda(allDisplays, persisted.displayId, PRIMARY.id)
    expect(target!.id).toBe(EXTERNAL_RIGHT.id)

    // step 4: 默认布局右下角应在 EXTERNAL_RIGHT 内（不会跑到主屏）
    const initBounds = computeDefaultBoundsOnDisplay(target, { width: 240, height: 240 }, 20)
    expect(initBounds!.x).toBeGreaterThanOrEqual(EXTERNAL_RIGHT.workArea.x)
    expect(initBounds!.x + initBounds!.width).toBeLessThanOrEqual(
      EXTERNAL_RIGHT.workArea.x + EXTERNAL_RIGHT.workArea.width
    )
    expect(initBounds!.y).toBeGreaterThanOrEqual(EXTERNAL_RIGHT.workArea.y)
  })

  test('热拔副屏 → display-removed → fallback primary 不抛', () => {
    // 用户在 EXTERNAL_RIGHT，拔掉外接屏 → displays = [PRIMARY]
    const remaining = [PRIMARY]
    const target = selectDisplayForPanda(remaining, EXTERNAL_RIGHT.id, PRIMARY.id)
    expect(target!.id).toBe(PRIMARY.id) // 验证 main.ts display-removed 回落逻辑等价
  })
})
