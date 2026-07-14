/**
 * Input: PyPI 包源信息（identifier + version）
 * Output: InstallResult（uvx 命令配置）
 * Pos: CLI MCP PyPI 包安装器，处理所有 Python 包的安装
 * 一旦此处安装逻辑变化，请同步更新本头部注释与 mcp/ 文件夹 README
 */

import { BaseInstaller, type InstallResult } from './base';
import type { McpSource } from '../sourceDetector';
import { ToolManager } from '../toolManager';

export class PypiInstaller extends BaseInstaller {
  private toolManager = new ToolManager();

  async install(source: McpSource, name: string): Promise<InstallResult> {
    // 1. 确保 uvx 可用
    const uvxPath = await this.toolManager.ensureUvx();

    // 2. 构建包名（uvx 会自动验证）
    console.log(`⏳ 准备安装 PyPI 包: ${source.identifier}`);

    // 3. 返回配置（uvx 会自动下载和管理虚拟环境）
    const pkgName = source.version
      ? `${source.identifier}==${source.version}`
      : source.identifier;

    return {
      config: {
        command: uvxPath,
        args: [pkgName]
      },
      version: source.version
    };
  }
}
