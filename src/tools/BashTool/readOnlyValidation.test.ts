// Input: Bash command strings submitted for permission inference
// Output: allow/passthrough decisions that distinguish read-only from mutating or network/process actions
// Pos: BashTool permission safety matrix guarding inferRiskLevel/read-only classification regressions

import { describe, expect, test } from 'bun:test'
import { checkReadOnlyConstraints } from './readOnlyValidation.js'

function classify(command: string): 'allow' | 'passthrough' {
  const hasCd = /(^|[;&|])\s*cd\b/.test(command)
  const behavior = checkReadOnlyConstraints({ command, description: 'matrix case' }, hasCd)
    .behavior
  return behavior === 'allow' ? 'allow' : 'passthrough'
}

describe('Bash read-only risk matrix', () => {
  test.each([
    'ls -la',
    'pwd',
    'cat package.json',
    'find . -maxdepth 1 -type f',
    'du -sh .',
    'stat package.json',
    'which node',
    'uname -a',
    'ps aux',
    'git status',
    'git diff -- src',
    'ls | wc -l',
    'cd /tmp',
  ])('allows read-only command: %s', command => {
    expect(classify(command)).toBe('allow')
  })

  test.each([
    'echo hi > /tmp/panda-risk-matrix',
    'cat package.json > /tmp/package-copy',
    'ls | tee /tmp/panda-risk-matrix',
    'curl https://example.com',
    'wget https://example.com/file',
    'python -c "print(1)"',
    'node -e "console.log(1)"',
    'kill -0 1',
    'touch /tmp/panda-risk-matrix',
    'rm -f /tmp/panda-risk-matrix',
    'mkdir /tmp/panda-risk-matrix',
    'chmod 600 package.json',
    'git status && touch /tmp/panda-risk-matrix',
    'cd /tmp && git status',
  ])('requires further checks for risky command: %s', command => {
    expect(classify(command)).toBe('passthrough')
  })
})
