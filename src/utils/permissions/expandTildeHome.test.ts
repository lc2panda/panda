// Input:  路径字符串（含 ~ / $HOME / ${HOME} / 其它 shell 展开语法）
// Output: expandTilde 将 ~ 与 $HOME/${HOME} 展开为 homedir()，其它展开语法保持原样
// Pos:    波次1 项1（上游 163）— deny 路径规则展开 $HOME 单元测试

import { describe, expect, test } from 'bun:test'
import { homedir } from 'os'
import { expandTilde } from './pathValidation.js'

describe('expandTilde — $HOME / ${HOME} 展开（上游 163 deny 路径修复）', () => {
  const home = homedir()

  test('裸 ~ 展开为 home', () => {
    expect(expandTilde('~')).toBe(home)
  })

  test('~/path 展开为 home/path', () => {
    expect(expandTilde('~/.ssh/id_rsa')).toBe(`${home}/.ssh/id_rsa`)
  })

  test('裸 $HOME 展开为 home（与 ~ 同落点）', () => {
    expect(expandTilde('$HOME')).toBe(home)
  })

  test('裸 ${HOME} 展开为 home', () => {
    expect(expandTilde('${HOME}')).toBe(home)
  })

  test('$HOME/path 展开为 home/path', () => {
    expect(expandTilde('$HOME/.ssh/id_rsa')).toBe(`${home}/.ssh/id_rsa`)
  })

  test('${HOME}/path 展开为 home/path', () => {
    expect(expandTilde('${HOME}/.ssh/id_rsa')).toBe(`${home}/.ssh/id_rsa`)
  })

  test('$HOME 与 ~ 展开结果一致（deny 规则可跨形式匹配）', () => {
    expect(expandTilde('$HOME/.config/secret')).toBe(
      expandTilde('~/.config/secret'),
    )
  })

  test('展开后不再含 $（可越过 validatePath 的 $ 拒绝、进入 deny 规则匹配）', () => {
    const expanded = expandTilde('$HOME/.ssh/id_rsa')
    expect(expanded.includes('$')).toBe(false)
    expect(expanded.startsWith(home)).toBe(true)
  })

  // 安全边界：仅展开 $HOME/${HOME}，其它 shell 展开语法保持原样，
  // 由下游 validatePath 的 $/%/= 拒绝继续要求人工审批。
  test('$HOMEWORK 不被误展开（前缀相似但不同变量）', () => {
    expect(expandTilde('$HOMEWORK/foo')).toBe('$HOMEWORK/foo')
  })

  test('$PWD 不被展开（保留供下游拒绝）', () => {
    expect(expandTilde('$PWD/foo')).toBe('$PWD/foo')
  })

  test('命令替换 $(...) 不被展开', () => {
    expect(expandTilde('$(echo /etc)/passwd')).toBe('$(echo /etc)/passwd')
  })

  test('Windows 风格 %USERPROFILE% 不被展开', () => {
    expect(expandTilde('%USERPROFILE%/foo')).toBe('%USERPROFILE%/foo')
  })

  test('中段出现的 $HOME 不被展开（仅前导整段 token）', () => {
    expect(expandTilde('/tmp/$HOME/foo')).toBe('/tmp/$HOME/foo')
  })

  test('绝对路径与普通相对路径保持原样', () => {
    expect(expandTilde('/etc/passwd')).toBe('/etc/passwd')
    expect(expandTilde('foo/bar')).toBe('foo/bar')
  })
})
