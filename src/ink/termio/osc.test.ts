// Input: Windows clipboard text samples
// Output: clipboard command generation assertions
// Pos: Windows PowerShell Unicode clipboard regression guard
import { Buffer } from 'node:buffer'
import { describe, expect, it } from 'bun:test'
import { getWindowsClipboardCommands } from './osc.js'

function decodeEncodedCommand(args: string[]): string {
  const index = args.indexOf('-EncodedCommand')
  expect(index).toBeGreaterThanOrEqual(0)
  const encoded = args[index + 1]
  expect(encoded).toBeTruthy()
  return Buffer.from(encoded, 'base64').toString('utf16le')
}

describe('getWindowsClipboardCommands', () => {
  it('uses Unicode-safe PowerShell encoded commands for non-ASCII text without clip fallback', () => {
    const commands = getWindowsClipboardCommands('你好')

    expect(commands.map(command => command.command)).toEqual(['pwsh', 'powershell.exe', 'powershell'])
    expect(commands.some(command => command.command === 'clip')).toBe(false)

    for (const command of commands) {
      expect(command.args).toContain('-EncodedCommand')
      expect(command.input).toBe('')
      const script = decodeEncodedCommand(command.args)
      expect(script).toContain('[Text.Encoding]::UTF8.GetString')
      expect(script).toContain('[Convert]::FromBase64String')
      expect(script).toContain(Buffer.from('你好', 'utf8').toString('base64'))
      expect(script).toContain('Set-Clipboard -Value $text')
    }
  })

  it('keeps clip only as ASCII fallback after PowerShell commands', () => {
    const commands = getWindowsClipboardCommands('hello')

    expect(commands.map(command => command.command)).toEqual(['pwsh', 'powershell.exe', 'powershell', 'clip'])
    expect(commands[0]?.args).toContain('-EncodedCommand')
    expect(commands[3]).toEqual({ command: 'clip', args: [], input: 'hello' })
  })
})
