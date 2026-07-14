/**
 * Input: URL 源信息（URL 地址）
 * Output: InstallResult（下载后的本地路径配置）
 * Pos: CLI MCP URL 安装器，处理所有直接 URL 下载的二进制/脚本
 * 一旦此处安装逻辑变化，请同步更新本头部注释与 mcp/ 文件夹 README
 */

import { BaseInstaller, type InstallResult } from './base';
import type { McpSource } from '../sourceDetector';
import { mkdir, writeFile, chmod } from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class UrlInstaller extends BaseInstaller {
  async install(source: McpSource, name: string): Promise<InstallResult> {
    const localDir = path.join(this.getMcpServersDir(), name);
    const localPath = path.join(localDir, 'server');

    // 1. 下载文件
    console.log(`⏳ 从 ${source.identifier} 下载中...`);
    await mkdir(localDir, { recursive: true });

    const response = await fetch(source.identifier);
    if (!response.ok) {
      throw new Error(`下载失败: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    await writeFile(localPath, Buffer.from(buffer));
    console.log(`✓ 已下载至 ${localPath}`);

    // 2. 检测文件类型
    const fileType = await this.detectFileType(localPath);

    // 3. 设置权限
    if (fileType === 'binary') {
      await chmod(localPath, 0o755);
      console.log(`✓ 已设置可执行权限`);
    }

    return {
      config: {
        command: localPath,
        args: []
      },
      installedPath: localPath
    };
  }

  private async detectFileType(filePath: string): Promise<'binary' | 'script'> {
    try {
      const { stdout } = await execAsync(`file "${filePath}"`);
      if (stdout.includes('executable') || stdout.includes('ELF') || stdout.includes('Mach-O')) {
        return 'binary';
      }
    } catch {
      // file 命令不存在，默认二进制
      return 'binary';
    }
    return 'script';
  }
}
