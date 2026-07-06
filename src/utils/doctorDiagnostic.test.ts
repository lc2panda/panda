import { afterEach, describe, expect, it } from 'bun:test'
import { mkdir, mkdtemp, rm, writeFile } from 'fs/promises'
import { readFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { getMcpConfigDiagnostic } from './doctorDiagnostic.js'

const originalEnv = { ...process.env }

afterEach(() => {
  process.env = { ...originalEnv }
})

describe('MCP empty state copy', () => {
  it('uses Panda MCP commands instead of Claude MCP commands', async () => {
    const source = await readFile(join(import.meta.dir, '..', 'components', 'mcp', 'MCPSettings.tsx'), 'utf8')

    expect(source).toContain('panda mcp --help')
    expect(source).toContain('panda mcp list')
    expect(source).not.toContain('claude mcp --help')
  })
})

describe('MCP diagnostics', () => {
  it('reports Panda MCP paths and misplaced Claude MCP configs without leaking contents', async () => {
    const root = await mkdtemp(join(tmpdir(), 'panda-doctor-'))
    const home = join(root, 'home')
    const appData = join(root, 'AppData', 'Roaming')
    const pandaConfig = join(home, '.pandacc')
    const claudeConfig = join(home, '.claude')
    await mkdir(pandaConfig, { recursive: true })
    await mkdir(claudeConfig, { recursive: true })
    await mkdir(join(appData, 'Claude'), { recursive: true })
    await writeFile(join(pandaConfig, 'settings.json'), JSON.stringify({ mcpServers: { panda: { command: 'panda-secret' } } }))
    await writeFile(join(home, '.claude.json'), JSON.stringify({ mcpServers: { misplaced: { command: 'claude-secret' } } }))
    await writeFile(join(claudeConfig, 'settings.json'), JSON.stringify({}))
    await writeFile(join(appData, 'Claude', 'claude_desktop_config.json'), JSON.stringify({ mcpServers: { desktop: {} } }))

    process.env.HOME = home
    process.env.USERPROFILE = home
    process.env.PANDA_CONFIG_DIR = pandaConfig
    process.env.APPDATA = appData
    delete process.env.CLAUDE_CONFIG_DIR

    try {
      const diagnostic = await getMcpConfigDiagnostic(home)

      expect(diagnostic.pandaConfigDir).toBe(pandaConfig)
      expect(diagnostic.claudeConfigDir).toBeNull()
      expect(diagnostic.pandaSettingsPath).toBe(join(pandaConfig, 'settings.json'))
      expect(diagnostic.paths).toContainEqual(
        expect.objectContaining({
          label: 'Panda settings',
          path: join(pandaConfig, 'settings.json'),
          exists: true,
          hasMcpServers: true,
          mcpServerCount: 1,
        }),
      )
      expect(diagnostic.paths).toContainEqual(
        expect.objectContaining({
          label: 'Misplaced Claude global config',
          path: join(home, '.claude.json'),
          exists: true,
          hasMcpServers: true,
          mcpServerCount: 1,
        }),
      )
      expect(JSON.stringify(diagnostic)).not.toContain('panda-secret')
      expect(JSON.stringify(diagnostic)).not.toContain('claude-secret')
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })
})
