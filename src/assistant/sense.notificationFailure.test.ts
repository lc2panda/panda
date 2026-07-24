// Input: sense 通知失败日志 helper + 源码形态
// Output: H-009 回归断言（无空 catch；失败会调用 log）
// Pos: assistant/ 通知可观测性回归

import { readFileSync } from 'fs'
import { join } from 'path'
import { afterEach, describe, expect, spyOn, test } from 'bun:test'
import * as debug from '../utils/debug.js'
import { logSenseNotifyFailure } from './sense.js'

const sensePath = join(import.meta.dir, 'sense.ts')

describe('H-009 sense 通知失败可观测', () => {
  afterEach(() => {
    // restore spies
  })

  test('通知链路不再使用空 .catch(() => {})', () => {
    const src = readFileSync(sensePath, 'utf8')
    expect(src).not.toMatch(/\.catch\(\s*\(\)\s*=>\s*\{\s*\}\s*\)/)
    expect(src).toContain('function logSenseNotifyFailure')
    expect(src).toContain('channel=${channel}')
    expect(src).toContain('title=${title')
    // 关键 connector / webhook / outbox 均走可观测 helper
    expect(src).toContain("logSenseNotifyFailure('webhook'")
    expect(src).toContain("logSenseNotifyFailure('outbox'")
    expect(src).toContain('logSenseNotifyFailure(channel, notification.title, e)')
  })

  test('logSenseNotifyFailure 会调用 logForDebugging 且不抛', () => {
    const spy = spyOn(debug, 'logForDebugging').mockImplementation(() => {})

    expect(() =>
      logSenseNotifyFailure(
        'feishu',
        'H-009-title',
        new Error('feishu notify down'),
      ),
    ).not.toThrow()

    expect(spy).toHaveBeenCalled()
    const msg = String(spy.mock.calls[0]?.[0] ?? '')
    expect(msg).toContain('[sense] notification failed')
    expect(msg).toContain('channel=feishu')
    expect(msg).toContain('title=H-009-title')
    expect(msg).toContain('feishu notify down')

    spy.mockRestore()
  })
})
