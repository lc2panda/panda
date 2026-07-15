/**
 * MCP subcommand handlers — extracted from main.tsx for lazy loading.
 * These are dynamically imported only when the corresponding `claude mcp *` command runs.
 */

import { stat } from 'fs/promises';
import pMap from 'p-map';
import { cwd } from 'process';
import React from 'react';
import { execFileNoThrow } from '../../utils/execFileNoThrow.js';
import { getPlatform } from '../../utils/platform.js';
import { MCPServerDesktopImportDialog } from '../../components/MCPServerDesktopImportDialog.js';
import { render } from '../../ink.js';
import { KeybindingSetup } from '../../keybindings/KeybindingProviderSetup.js';
import { type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS, logEvent } from '../../services/analytics/index.js';
import { clearMcpClientConfig, clearServerTokensFromLocalStorage, getMcpClientConfig, readClientSecret, saveMcpClientSecret } from '../../services/mcp/auth.js';
import { connectToServer, getMcpServerConnectionBatchSize } from '../../services/mcp/client.js';
import { addMcpConfig, getAllMcpConfigs, getMcpConfigByName, getMcpConfigsByScope, removeMcpConfig } from '../../services/mcp/config.js';
import type { ConfigScope, ScopedMcpServerConfig } from '../../services/mcp/types.js';
import { McpServerConfigSchema } from '../../services/mcp/types.js';
import { describeMcpConfigFilePath, ensureConfigScope, getScopeLabel } from '../../services/mcp/utils.js';
import { AppStateProvider } from '../../state/AppState.js';
import { getCurrentProjectConfig, getGlobalConfig, saveCurrentProjectConfig, saveGlobalConfig } from '../../utils/config.js';
import { env } from '../../utils/env.js';
import { isFsInaccessible } from '../../utils/errors.js';
import { gracefulShutdown } from '../../utils/gracefulShutdown.js';
import { safeParseJSON } from '../../utils/json.js';
import { cliError, cliOk } from '../exit.js';
/**
 * 检查命令是否存在于系统 PATH
 */
async function commandExists(command: string): Promise<boolean> {
  try {
    const checkCmd = getPlatform() === 'windows' ? 'where' : 'which';
    const result = await execFileNoThrow(checkCmd, [command]);
    return result.code === 0;
  } catch {
    return false;
  }
}

/**
 * 获取依赖的安装指令
 */
function getDependencyInstallGuide(dep: string): string {
  if (dep === 'uvx') {
    const platform = getPlatform();
    if (platform === 'windows') {
      return 'irm https://astral.sh/uv/install.ps1 | iex';
    }
    return 'curl -LsSf https://astral.sh/uv/install.sh | sh';
  }

  if (dep === 'npx') {
    return 'npm install -g npm\n    (or install Node.js from https://nodejs.org)';
  }

  return `Check the documentation for installing '${dep}'`;
}

/**
 * MCP 服务器预置配置
 */
const MCP_PRESETS: Record<string, {
  command: string;
  args: string[];
  description: string;
  requireDependency: 'uvx' | 'npx' | 'none';
}> = {
  'cdp-bridge': {
    command: 'uvx',
    args: ['cdp-bridge@latest'],
    description: 'Chrome DevTools Protocol Bridge for browser automation',
    requireDependency: 'uvx'
  },
  'lark-mcp': {
    command: 'npx',
    args: ['-y', '@larksuite/lark-mcp'],
    description: 'Lark/Feishu integration',
    requireDependency: 'npx'
  },
  'wps-office': {
    command: 'npx',
    args: ['-y', 'wps-office-mcp'],
    description: 'WPS Office integration',
    requireDependency: 'npx'
  },
  'github': {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github'],
    description: 'GitHub repository integration',
    requireDependency: 'npx'
  },
  'filesystem': {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem'],
    description: 'Local filesystem access',
    requireDependency: 'npx'
  },
  'puppeteer': {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-puppeteer'],
    description: 'Browser automation with Puppeteer',
    requireDependency: 'npx'
  },
  'postgres': {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-postgres'],
    description: 'PostgreSQL database integration',
    requireDependency: 'npx'
  },
  'sqlite': {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-sqlite'],
    description: 'SQLite database integration',
    requireDependency: 'npx'
  }
};

/**
 * 检查依赖是否已安装
 */
async function checkDependency(dep: 'uvx' | 'npx'): Promise<{
  installed: boolean;
  path?: string;
  installCommand: string;
}> {
  const platform = env.platform;
  const cmd = platform === 'win32' ? 'where' : 'which';

  try {
    const result = await execFileNoThrow(cmd, [dep], { timeout: 5000 });
    if (result.code === 0) {
      const path = result.stdout.trim().split('\n')[0];
      return {
        installed: true,
        path,
        installCommand: getDependencyInstallGuide(dep)
      };
    } else {
      return {
        installed: false,
        installCommand: getDependencyInstallGuide(dep)
      };
    }
  } catch (_error) {
    return {
      installed: false,
      installCommand: getDependencyInstallGuide(dep)
    };
  }
}

/**
 * 添加 MCP 服务器配置到配置文件
 */
async function addMcpServerToSettings(
  name: string,
  config: { command: string; args: string[] },
  options?: { force?: boolean }
): Promise<{ success: boolean; overwritten: boolean }> {
  const globalConfig = getGlobalConfig();
  const mcpServers = globalConfig.mcpServers || {};

  // 检查是否已存在
  const exists = name in mcpServers;
  if (exists && !options?.force) {
    // 需要用户确认
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise<string>((resolve) => {
      rl.question(`${name} already configured. Overwrite? (y/N): `, resolve);
    });
    rl.close();

    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
      return { success: false, overwritten: false };
    }
  }

  // 写入配置
  mcpServers[name] = {
    type: 'stdio',
    ...config
  };

  saveGlobalConfig(current => ({
    ...current,
    mcpServers
  }));

  return { success: true, overwritten: exists };
}

/**
 * 验证 MCP 连接
 */
async function verifyMcpConnection(name: string): Promise<boolean> {
  try {
    const globalConfig = getGlobalConfig();
    const server = globalConfig.mcpServers?.[name];
    if (!server) {
      return false;
    }

    const result = await connectToServer(name, server as ScopedMcpServerConfig);
    return result.type === 'connected';
  } catch (_error) {
    return false;
  }
}

async function checkMcpServerHealth(name: string, server: ScopedMcpServerConfig): Promise<string> {
  try {
    const result = await connectToServer(name, server);
    if (result.type === 'connected') {
      return '✓ Connected';
    } else if (result.type === 'needs-auth') {
      return '! Needs authentication';
    } else {
      return '✗ Failed to connect';
    }
  } catch (_error) {
    return '✗ Connection error';
  }
}

// mcp serve (lines 4512–4532)
export async function mcpServeHandler({
  debug,
  verbose
}: {
  debug?: boolean;
  verbose?: boolean;
}): Promise<void> {
  const providedCwd = cwd();
  logEvent('tengu_mcp_start', {});
  try {
    await stat(providedCwd);
  } catch (error) {
    if (isFsInaccessible(error)) {
      cliError(`Error: Directory ${providedCwd} does not exist`);
    }
    throw error;
  }
  try {
    const {
      setup
    } = await import('../../setup.js');
    await setup(providedCwd, 'default', false, false, undefined, false);
    const {
      startMCPServer
    } = await import('../../entrypoints/mcp.js');
    await startMCPServer(providedCwd, debug ?? false, verbose ?? false);
  } catch (error) {
    cliError(`Error: Failed to start MCP server: ${error}`);
  }
}

// mcp remove (lines 4545–4635)
export async function mcpRemoveHandler(name: string, options: {
  scope?: string;
}): Promise<void> {
  // Look up config before removing so we can clean up secure storage
  const serverBeforeRemoval = getMcpConfigByName(name);
  const cleanupSecureStorage = () => {
    if (serverBeforeRemoval && (serverBeforeRemoval.type === 'sse' || serverBeforeRemoval.type === 'http')) {
      const server = McpServerConfigSchema().parse(serverBeforeRemoval);
      if (server.type === 'sse' || server.type === 'http') {
        clearServerTokensFromLocalStorage(name, server);
        clearMcpClientConfig(name, server);
      }
    }
  };
  try {
    if (options.scope) {
      const scope = ensureConfigScope(options.scope);
      logEvent('tengu_mcp_delete', {
        name: name as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        scope: scope as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
      });
      await removeMcpConfig(name, scope);
      cleanupSecureStorage();
      process.stdout.write(`Removed MCP server ${name} from ${scope} config\n`);
      cliOk(`File modified: ${describeMcpConfigFilePath(scope)}`);
    }

    // If no scope specified, check where the server exists
    const projectConfig = getCurrentProjectConfig();
    const globalConfig = getGlobalConfig();

    // Check if server exists in project scope (.mcp.json)
    const {
      servers: projectServers
    } = getMcpConfigsByScope('project');
    const mcpJsonExists = !!projectServers[name];

    // Count how many scopes contain this server
    const scopes: Array<Exclude<ConfigScope, 'dynamic'>> = [];
    if (projectConfig.mcpServers?.[name]) scopes.push('local');
    if (mcpJsonExists) scopes.push('project');
    if (globalConfig.mcpServers?.[name]) scopes.push('user');
    if (scopes.length === 0) {
      cliError(`No MCP server found with name: "${name}"`);
    } else if (scopes.length === 1) {
      // Server exists in only one scope, remove it
      const scope = scopes[0]!;
      logEvent('tengu_mcp_delete', {
        name: name as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        scope: scope as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
      });
      await removeMcpConfig(name, scope);
      cleanupSecureStorage();
      process.stdout.write(`Removed MCP server "${name}" from ${scope} config\n`);
      cliOk(`File modified: ${describeMcpConfigFilePath(scope)}`);
    } else {
      // Server exists in multiple scopes
      process.stderr.write(`MCP server "${name}" exists in multiple scopes:\n`);
      scopes.forEach(scope => {
        process.stderr.write(`  - ${getScopeLabel(scope)} (${describeMcpConfigFilePath(scope)})\n`);
      });
      process.stderr.write('\nTo remove from a specific scope, use:\n');
      scopes.forEach(scope => {
        process.stderr.write(`  claude mcp remove "${name}" -s ${scope}\n`);
      });
      cliError();
    }
  } catch (error) {
    cliError((error as Error).message);
  }
}

// mcp list (lines 4641–4688)
export async function mcpListHandler(): Promise<void> {
  logEvent('tengu_mcp_list', {});
  const {
    servers: configs
  } = await getAllMcpConfigs();
  if (Object.keys(configs).length === 0) {
    console.log('No MCP servers configured. Use `panda mcp add` to add a server.');
  } else {
    console.log('Checking MCP server health...\n');

    // Check servers concurrently
    const entries = Object.entries(configs);
    const results = await pMap(entries, async ([name, server]) => ({
      name,
      server,
      status: await checkMcpServerHealth(name, server)
    }), {
      concurrency: getMcpServerConnectionBatchSize()
    });
    for (const {
      name,
      server,
      status
    } of results) {
      // Intentionally excluding sse-ide servers here since they're internal
      if (server.type === 'sse') {
        console.log(`${name}: ${server.url} (SSE) - ${status}`);
      } else if (server.type === 'http') {
        console.log(`${name}: ${server.url} (HTTP) - ${status}`);
      } else if (server.type === 'claudeai-proxy') {
        console.log(`${name}: ${server.url} - ${status}`);
      } else if (!server.type || server.type === 'stdio') {
        const args = Array.isArray((server as any).args) ? (server as any).args : [];
        console.log(`${name}: ${(server as any).command} ${args.join(' ')} - ${status}`);
      }
    }
  }
  // Use gracefulShutdown to properly clean up MCP server connections
  // (process.exit bypasses cleanup handlers, leaving child processes orphaned)
  await gracefulShutdown(0);
}

// mcp get (lines 4694–4786)
export async function mcpGetHandler(name: string): Promise<void> {
  logEvent('tengu_mcp_get', {
    name: name as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
  });
  const server = getMcpConfigByName(name);
  if (!server) {
    cliError(`No MCP server found with name: ${name}`);
  }

  console.log(`${name}:`);
  console.log(`  Scope: ${getScopeLabel(server.scope)}`);

  // Check server health
  const status = await checkMcpServerHealth(name, server);
  console.log(`  Status: ${status}`);

  // Intentionally excluding sse-ide servers here since they're internal
  if (server.type === 'sse') {
    console.log(`  Type: sse`);
    console.log(`  URL: ${server.url}`);
    if (server.headers) {
      console.log('  Headers:');
      for (const [key, value] of Object.entries(server.headers)) {
        console.log(`    ${key}: ${value}`);
      }
    }
    if (server.oauth?.clientId || server.oauth?.callbackPort) {
      const parts: string[] = [];
      if (server.oauth.clientId) {
        parts.push('client_id configured');
        const clientConfig = getMcpClientConfig(name, server);
        if (clientConfig?.clientSecret) parts.push('client_secret configured');
      }
      if (server.oauth.callbackPort) parts.push(`callback_port ${server.oauth.callbackPort}`);
      console.log(`  OAuth: ${parts.join(', ')}`);
    }
  } else if (server.type === 'http') {
    console.log(`  Type: http`);
    console.log(`  URL: ${server.url}`);
    if (server.headers) {
      console.log('  Headers:');
      for (const [key, value] of Object.entries(server.headers)) {
        console.log(`    ${key}: ${value}`);
      }
    }
    if (server.oauth?.clientId || server.oauth?.callbackPort) {
      const parts: string[] = [];
      if (server.oauth.clientId) {
        parts.push('client_id configured');
        const clientConfig = getMcpClientConfig(name, server);
        if (clientConfig?.clientSecret) parts.push('client_secret configured');
      }
      if (server.oauth.callbackPort) parts.push(`callback_port ${server.oauth.callbackPort}`);
      console.log(`  OAuth: ${parts.join(', ')}`);
    }
  } else if (server.type === 'stdio') {
    console.log(`  Type: stdio`);
    console.log(`  Command: ${server.command}`);
    const args = Array.isArray(server.args) ? server.args : [];
    console.log(`  Args: ${args.join(' ')}`);
    if (server.env) {
      console.log('  Environment:');
      for (const [key, value] of Object.entries(server.env)) {
        console.log(`    ${key}=${value}`);
      }
    }
  }
  console.log(`\nTo remove this server, run: claude mcp remove "${name}" -s ${server.scope}`);
  // Use gracefulShutdown to properly clean up MCP server connections
  // (process.exit bypasses cleanup handlers, leaving child processes orphaned)
  await gracefulShutdown(0);
}

// mcp add-json (lines 4801–4870)
export async function mcpAddJsonHandler(name: string, json: string, options: {
  scope?: string;
  clientSecret?: true;
}): Promise<void> {
  try {
    const scope = ensureConfigScope(options.scope);
    const parsedJson = safeParseJSON(json);

    // Read secret before writing config so cancellation doesn't leave partial state
    const needsSecret = options.clientSecret && parsedJson && typeof parsedJson === 'object' && 'type' in parsedJson && (parsedJson.type === 'sse' || parsedJson.type === 'http') && 'url' in parsedJson && typeof parsedJson.url === 'string' && 'oauth' in parsedJson && parsedJson.oauth && typeof parsedJson.oauth === 'object' && 'clientId' in parsedJson.oauth;
    const clientSecret = needsSecret ? await readClientSecret() : undefined;
    await addMcpConfig(name, parsedJson, scope);
    const transportType = parsedJson && typeof parsedJson === 'object' && 'type' in parsedJson ? String(parsedJson.type || 'stdio') : 'stdio';
    if (clientSecret && parsedJson && typeof parsedJson === 'object' && 'type' in parsedJson && (parsedJson.type === 'sse' || parsedJson.type === 'http') && 'url' in parsedJson && typeof parsedJson.url === 'string') {
      saveMcpClientSecret(name, {
        type: parsedJson.type,
        url: parsedJson.url
      }, clientSecret);
    }
    logEvent('tengu_mcp_add', {
      scope: scope as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      source: 'json' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      type: transportType as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
    });
    cliOk(`Added ${transportType} MCP server ${name} to ${scope} config`);
  } catch (error) {
    cliError((error as Error).message);
  }
}

// mcp add-from-claude-desktop (lines 4881–4927)
export async function mcpAddFromDesktopHandler(options: {
  scope?: string;
}): Promise<void> {
  try {
    const scope = ensureConfigScope(options.scope);
    const platform = getPlatform();
    logEvent('tengu_mcp_add', {
      scope: scope as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      platform: platform as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      source: 'desktop' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
    });
    const {
      readClaudeDesktopMcpServers
    } = await import('../../utils/claudeDesktop.js');
    const servers = await readClaudeDesktopMcpServers();
    if (Object.keys(servers).length === 0) {
      cliOk('No MCP servers found in Claude Desktop configuration or configuration file does not exist.');
    }
    const {
      unmount
    } = await render(<AppStateProvider>
        <KeybindingSetup>
          <MCPServerDesktopImportDialog servers={servers} scope={scope} onDone={() => {
          unmount();
        }} />
        </KeybindingSetup>
      </AppStateProvider>, {
      exitOnCtrlC: true
    });
  } catch (error) {
    cliError((error as Error).message);
  }
}

// mcp reset-project-choices (lines 4935–4952)
export async function mcpResetChoicesHandler(): Promise<void> {
  logEvent('tengu_mcp_reset_mcpjson_choices', {});
  saveCurrentProjectConfig(current => ({
    ...current,
    enabledMcpjsonServers: [],
    disabledMcpjsonServers: [],
    enableAllProjectMcpServers: false
  }));
  cliOk('All project-scoped (.mcp.json) server approvals and rejections have been reset.\n' + 'You will be prompted for approval next time you start Panda.');
}

// mcp doctor
export async function mcpDoctorHandler(): Promise<void> {
  logEvent('tengu_mcp_doctor', {});

  console.log('MCP Configuration Health Check');
  console.log('================================\n');

  // 1. Check settings file existence
  try {
    const globalConfig = getGlobalConfig();
    const settingsPath = globalConfig.settingsPath || '~/.pandacc.json';
    console.log(`Settings file: ✓ ${settingsPath}`);
  } catch (error) {
    console.log(`Settings file: ✗ Error reading settings`);
    console.error(`  ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }

  // 2. Check mcpServers configuration
  const { servers: configs } = await getAllMcpConfigs();
  const serverCount = Object.keys(configs).length;
  if (serverCount === 0) {
    console.log('mcpServers configured: ✗ No servers configured');
    console.log('\nUse `panda mcp add` to add a server.');
    process.exit(0);
  }
  console.log(`mcpServers configured: ✓ ${serverCount} server(s)\n`);

  // 3. Check server connection status
  console.log('Server Status:');
  const entries = Object.entries(configs);
  const results = await pMap(entries, async ([name, server]) => {
    // Check command dependency first (for stdio servers)
    if (server.type === 'stdio') {
      const command = (server as any).command as string;
      if (command) {
        // Extract base command (remove path if present)
        const baseCommand = command.split(/[/\\]/).pop() || command;
        const commandAvailable = await commandExists(baseCommand);

        if (!commandAvailable) {
          return {
            name,
            server,
            status: 'dependency_missing',
            command: baseCommand
          };
        }
      }
    }

    // Proceed with health check if dependency exists
    const status = await checkMcpServerHealth(name, server);
    return { name, server, status };
  }, { concurrency: getMcpServerConnectionBatchSize() });

  // Separate results by status type
  const connectedCount = results.filter(r => typeof r.status === 'string' && r.status.startsWith('✓')).length;
  const depMissingCount = results.filter(r => r.status === 'dependency_missing').length;
  const failedCount = results.length - connectedCount - depMissingCount;

  for (const result of results) {
    const { name, server, status } = result;

    // Handle dependency missing case
    if (status === 'dependency_missing' && 'command' in result) {
      const cmd = (result as any).command;
      console.log(`- ${name}: ✗ Command '${cmd}' not found\n`);
      console.log(`  This server requires '${cmd}' to run.\n`);
      console.log(`  To install ${cmd}:`);

      const installGuide = getDependencyInstallGuide(cmd);
      const lines = installGuide.split('\n');
      for (const line of lines) {
        console.log(`    ${line}`);
      }

      console.log(`\n  After installation, restart your terminal and run 'panda mcp doctor' again.\n`);
      continue;
    }

    // Handle normal status display
    let commandDisplay = '';
    if (server.type === 'stdio') {
      const args = Array.isArray((server as any).args) ? (server as any).args : [];
      commandDisplay = `${(server as any).command} ${args.join(' ')}`;
    } else if (server.type === 'sse' || server.type === 'http') {
      commandDisplay = server.url;
    } else if (server.type === 'claudeai-proxy') {
      commandDisplay = server.url;
    }

    const statusStr = typeof status === 'string' ? status : '✗ Unknown';
    const statusIcon = statusStr.startsWith('✓') ? '✓' : statusStr.startsWith('!') ? '!' : '✗';
    console.log(`- ${name}: ${statusIcon} ${statusStr}${commandDisplay ? ` (${commandDisplay})` : ''}`);
  }

  // Summary
  if (depMissingCount > 0 || failedCount > 0) {
    console.log(`\nSummary: ${connectedCount} connected, ${depMissingCount} missing dependencies, ${failedCount} failed\n`);
  }

  // 4. Platform compatibility checks
  console.log(`\nPlatform: ${getPlatform()}`);

  // Windows-specific: check if commands have proper extensions
  if (getPlatform() === 'windows') {
    let hasWarnings = false;
    for (const [name, server] of entries) {
      if (server.type === 'stdio') {
        const command = (server as any).command as string;
        // Check if command lacks .exe/.cmd/.bat extension and isn't a known shell built-in
        if (command && !command.includes('/') && !command.includes('\\')) {
          const hasExtension = /\.(exe|cmd|bat|ps1)$/i.test(command);
          const isBuiltin = ['node', 'python', 'npx', 'uvx'].some(b => command.toLowerCase().startsWith(b));
          if (!hasExtension && !isBuiltin) {
            if (!hasWarnings) {
              console.log('\nCompatibility Warnings:');
              hasWarnings = true;
            }
            console.log(`  ⚠ ${name}: command "${command}" may need explicit extension (.exe/.cmd/.bat) on Windows`);
          }
        }
      }
    }
    if (!hasWarnings) {
      console.log('Compatibility: ✓ All checks passed');
    }
  } else {
    console.log('Compatibility: ✓ All checks passed');
  }

  await gracefulShutdown(0);
}

// mcp install (auto-install MCP servers)
export async function mcpInstallHandler(
  names: string[],
  options?: { args?: string; force?: boolean }
): Promise<void> {
  if (names.length === 0) {
    console.log('Available MCP servers:\n');
    for (const [name, preset] of Object.entries(MCP_PRESETS)) {
      console.log(`  ${name.padEnd(20)} - ${preset.description}`);
    }
    console.log('\nUsage: panda mcp install <name> [--force]');
    console.log('Example: panda mcp install cdp-bridge');
    console.log('\n通用包安装示例:');
    console.log('  panda mcp install @larksuite/lark-mcp      # npm 包');
    console.log('  panda mcp install npm:package-name         # 显式指定 npm');
    console.log('  panda mcp install pypi:package-name        # PyPI 包');
    console.log('  panda mcp install github:user/repo         # GitHub 仓库');
    console.log('  panda mcp install https://example.com/mcp  # URL 下载');
    await gracefulShutdown(0);
    return;
  }

  let installedCount = 0;
  let failedCount = 0;

  for (const name of names) {
    console.log(`\nInstalling ${name}...`);

    // 1. 检查是否为预置配置
    const preset = MCP_PRESETS[name];
    if (!preset) {
      // 尝试通用包管理器
      console.log(`  未找到预置配置，尝试通用安装...`);
      const success = await installGenericMcpPackage(name, options);
      if (success) {
        installedCount++;
      } else {
        failedCount++;
      }
      continue;
    }

    console.log(`  Description: ${preset.description}`);

    // 2. 检查依赖
    if (preset.requireDependency !== 'none') {
      const depCheck = await checkDependency(preset.requireDependency);
      if (!depCheck.installed) {
        console.log(`✗ ${preset.requireDependency} not found`);
        console.log(`\nTo install ${preset.requireDependency}:`);
        const lines = depCheck.installCommand.split('\n');
        for (const line of lines) {
          console.log(`  ${line}`);
        }
        console.log(`\nAfter installation, run 'panda mcp install ${name}' again.`);
        failedCount++;
        continue;
      }
      console.log(`✓ Checking ${preset.requireDependency}... found at ${depCheck.path}`);
    }

    // 3. 写入配置
    try {
      const result = await addMcpServerToSettings(
        name,
        {
          command: preset.command,
          args: options?.args ? [...preset.args, options.args] : preset.args
        },
        { force: options?.force }
      );

      if (!result.success) {
        console.log(`✗ Installation cancelled by user`);
        failedCount++;
        continue;
      }

      if (result.overwritten) {
        console.log(`✓ Updated ${name} in ~/.pandacc.json`);
      } else {
        console.log(`✓ Added ${name} to ~/.pandacc.json`);
      }
    } catch (error) {
      console.log(`✗ Failed to write configuration: ${(error as Error).message}`);
      failedCount++;
      continue;
    }

    // 4. 验证连接
    console.log(`  Testing connection...`);
    const connected = await verifyMcpConnection(name);
    if (connected) {
      console.log(`✓ Connection test passed`);
      console.log(`✓ ${name} installed successfully!`);
      installedCount++;
    } else {
      console.log(`⚠ ${name} configured, but connection test failed`);
      console.log(`  Run 'panda mcp doctor' for details`);
      installedCount++;
    }
  }

  // 总结
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Summary: ${installedCount} installed, ${failedCount} failed`);
  if (installedCount > 0) {
    console.log(`\nRun 'panda mcp doctor' to verify all MCP servers.`);
  }
  console.log('');

  await gracefulShutdown(0);
}

/**
 * 通用 MCP 包安装（npm, pypi, github, url 等）
 */
async function installGenericMcpPackage(
  source: string,
  options?: { force?: boolean; args?: string }
): Promise<boolean> {
  try {
    const { handleMcpInstall } = await import('./mcpInstall.js');
    await handleMcpInstall([source], {
      force: options?.force,
      scope: 'user'
    });
    return true;
  } catch (error: any) {
    console.log(`✗ 通用安装失败: ${error.message}`);
    if (process.env.DEBUG) {
      console.log(`  堆栈: ${error.stack}`);
    }
    return false;
  }
}
