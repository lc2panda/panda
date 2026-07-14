/**
 * Input: npm 包源信息（identifier + version）
 * Output: InstallResult（npx 命令配置）
 * Pos: CLI MCP npm 包安装器，处理所有 npm 包的安装
 * 一旦此处安装逻辑变化，请同步更新本头部注释与 mcp/ 文件夹 README
 */

import { BaseInstaller, type InstallResult } from './base';
import type { McpSource } from '../sourceDetector';
import { ToolManager } from '../toolManager';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class NpmInstaller extends BaseInstaller {
  private toolManager = new ToolManager();

  async install(source: McpSource, name: string): Promise<InstallResult> {
    // 1. 确保 npx 可用
    const npxPath = await this.toolManager.ensureNpx();

    // 2. 测试包是否存在
    console.log(`⏳ 验证 npm 包: ${source.identifier}`);
    const actualVersion = await this.verifyPackage(source.identifier, source.version, npxPath);

    // 3. 返回配置（npx 会自动下载和缓存）
    const pkgName = source.version
      ? `${source.identifier}@${source.version}`
      : source.identifier;

    return {
      config: {
        command: npxPath,
        args: ['-y', pkgName]
      },
      version: actualVersion
    };
  }

  private async verifyPackage(pkg: string, requestedVersion: string | undefined, npxPath: string): Promise<string | undefined> {
    try {
      // 使用 npm view 检查包是否存在
      const viewCommand = requestedVersion
        ? `${npxPath} npm view ${pkg}@${requestedVersion} version`
        : `${npxPath} npm view ${pkg} version`;

      const { stdout } = await execAsync(viewCommand);
      const version = stdout.trim();
      console.log(`✓ 找到 npm 包: ${pkg}@${version}`);
      return version;
    } catch (error) {
      throw new Error(`npm 包未找到: ${pkg}${requestedVersion ? `@${requestedVersion}` : ''}`);
    }
  }
}
