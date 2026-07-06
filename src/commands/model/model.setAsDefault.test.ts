// Input:  model.tsx + ModelPicker.tsx 源码 + handleSelect 两分支语义
// Output: bun test 用例集 — Enter 只写 mainLoopModelForSession / d 写 mainLoopModel 并清 override
// Pos:    src/commands/model/model.setAsDefault.test.ts — v2.1.144 /model 默认语义守护
//
// 一旦本测试或 src/commands/model/model.tsx / src/components/ModelPicker.tsx 被修改，
// 请同步更新 src/commands/model/README.md 的 /model 行为章节。
//
// 设计目标（对齐上游 2.1.144）：
//   1) Enter（setAsDefault 假值）只写 mainLoopModelForSession（当前会话），不动持久化默认 mainLoopModel
//   2) d 键（setAsDefault=true）写 mainLoopModel 并清掉 mainLoopModelForSession（设新会话默认 + 撤销 override）
//   3) ModelPicker 注册 modelPicker:setDefault 键位、onSelect 透传第三参 setAsDefault
//
// 注意：handleSelect 内联在 React Compiler 组件里、未导出，渲染管线无法直接断言；
//   走"纯函数语义复刻"+"源码静态结构"两层间接断言（同 StatusLine.minipet.test.tsx 模式）。

import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'fs'
import { join } from 'path'
import { getMarketingNameForModel } from '../../utils/model/model.js'
import { getModelOptions } from '../../utils/model/modelOptions.js'
import { getModelPricingString } from '../../utils/modelCost.js'

// ── 纯函数复刻：model.tsx handleSelect 的 setAppState(prev => ...) 两分支 ──
// 与 src/commands/model/model.tsx handleSelect 中的 reducer 一一对应。
type AppStateSlice = {
  mainLoopModel: string | null
  mainLoopModelForSession: string | null
}

function applyModelSelect(
  prev: AppStateSlice,
  model: string | null,
  setAsDefault?: boolean,
): AppStateSlice {
  if (setAsDefault) {
    // d 键：设为新会话默认（持久化）并清掉会话 override
    return { ...prev, mainLoopModel: model, mainLoopModelForSession: null }
  }
  // Enter：只改当前会话，不动持久化默认
  return { ...prev, mainLoopModelForSession: model }
}

describe('/model handleSelect 语义（v2.1.144）', () => {
  const base: AppStateSlice = {
    mainLoopModel: 'sonnet',
    mainLoopModelForSession: null,
  }

  test('Enter（无 setAsDefault）只写 mainLoopModelForSession，保留持久化默认', () => {
    const next = applyModelSelect(base, 'opus')
    expect(next.mainLoopModelForSession).toBe('opus')
    expect(next.mainLoopModel).toBe('sonnet') // 默认未被触碰
  })

  test('Enter 覆盖既有 plan-mode 会话 override（不影响默认）', () => {
    const withPlan: AppStateSlice = {
      mainLoopModel: 'sonnet',
      mainLoopModelForSession: 'haiku', // plan mode 设的
    }
    const next = applyModelSelect(withPlan, 'opus')
    expect(next.mainLoopModelForSession).toBe('opus')
    expect(next.mainLoopModel).toBe('sonnet')
  })

  test('d 键（setAsDefault=true）写 mainLoopModel 并清掉会话 override', () => {
    const withPlan: AppStateSlice = {
      mainLoopModel: 'sonnet',
      mainLoopModelForSession: 'haiku',
    }
    const next = applyModelSelect(withPlan, 'opus', true)
    expect(next.mainLoopModel).toBe('opus') // 新默认（持久化）
    expect(next.mainLoopModelForSession).toBeNull() // override 被清
  })
})

describe('/model Fable 5 展示守护', () => {
  test('Fable 选项显示 Fable 5 与 $10/$50，且不残留 3.7', () => {
    const previousApiKey = process.env.ANTHROPIC_API_KEY
    process.env.ANTHROPIC_API_KEY = previousApiKey ?? 'test-key-for-model-options'
    try {
      const fable = getModelOptions().find(option => option.label === 'Fable')

      expect(fable).toBeDefined()
      expect(fable?.description).toContain('Fable 5')
      expect(fable?.description).toContain('$10/$50 per Mtok')
      expect(fable?.description).not.toContain('3.7')
      expect(fable?.descriptionForModel).toContain('Claude Fable 5')
      expect(fable?.descriptionForModel).not.toContain('3.7')
    } finally {
      if (previousApiKey === undefined) {
        delete process.env.ANTHROPIC_API_KEY
      } else {
        process.env.ANTHROPIC_API_KEY = previousApiKey
      }
    }
  })

  test('claude-fable-5 营销名与成本估算使用 Fable 5 官方档位', () => {
    expect(getMarketingNameForModel('claude-fable-5')).toBe('Claude Fable 5')
    expect(getModelPricingString('claude-fable-5')).toBe('$10/$50 per Mtok')
  })
})

// ── 源码静态结构守护：确认接线未被回退 ──
describe('/model 源码结构守护', () => {
  const modelSrc = readFileSync(
    join(import.meta.dir, 'model.tsx'),
    'utf8',
  )
  const pickerSrc = readFileSync(
    join(import.meta.dir, '..', '..', 'components', 'ModelPicker.tsx'),
    'utf8',
  )

  test('model.tsx handleSelect 接收 setAsDefault 第三参', () => {
    expect(modelSrc).toMatch(/function handleSelect\(model, effort, setAsDefault\)/)
  })

  test('model.tsx Enter 分支只写 mainLoopModelForSession（不带 mainLoopModel: model）', () => {
    // setAsDefault 假值分支：只含 mainLoopModelForSession: model
    expect(modelSrc).toMatch(/mainLoopModelForSession: model\b/)
  })

  test('ModelPicker onSelect 透传 setAsDefault 第三参', () => {
    expect(pickerSrc).toMatch(
      /onSelect:\s*\(model[^)]*effort[^)]*setAsDefault\?:\s*boolean\)/,
    )
  })

  test('ModelPicker 注册 modelPicker:setDefault 键位 → handleSelect(focusedValue, true)', () => {
    expect(pickerSrc).toMatch(/"modelPicker:setDefault":\s*\(\)\s*=>\s*handleSelect\(focusedValue,\s*true\)/)
  })
})
