/**
 * Input: 工具名称（npx, uvx）
 * Output: 工具的绝对路径（系统已安装 / 自动下载到 ~/.pandacc/tools）
 * Pos: CLI MCP 安装器的依赖管理层，确保 npx/uvx 等工具可用
 * 一旦此处工具管理逻辑变化，请同步更新本头部注释与 mcp/ 文件夹 README
 */

import { getPlatform } from '../../utils/platform.js';
import path from 'path';
import { mkdir, writeFile, rm, access, chmod } from 'fs/promises';
import { constants } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';

const execAsync = promisify(exec);

export class ToolManager {
  private toolsDir: string;

  constructor() {
    this.toolsDir = path.join(os.homedir(), '.pandacc', 'tools');
  }

  /**
   * 确保 npx 可用（系统或本地下载）
   */
  async ensureNpx(): Promise<string> {
    // 1. 检查系统 npx
    const systemNpx = await this.findSystemCommand('npx');
    if (systemNpx) {
      console.log(`✓ 使用系统 npx: ${systemNpx}`);
      return systemNpx;
    }

    // 2. 检查本地 npx
    const localNpx = path.join(this.toolsDir, 'node', 'bin', 'npx');
    if (await this.pathExists(localNpx)) {
      console.log(`✓ 使用本地 npx: ${localNpx}`);
      return localNpx;
    }

    // 3. 下载 Node.js
    console.log('⏳ Node.js 未找到，正在下载...');
    await this.downloadNodejs();

    return localNpx;
  }

  /**
   * 确保 uvx 可用（系统或本地下载）
   */
  async ensureUvx(): Promise<string> {
    const systemUvx = await this.findSystemCommand('uvx');
    if (systemUvx) {
      console.log(`✓ 使用系统 uvx: ${systemUvx}`);
      return systemUvx;
    }

    const localUvx = path.join(this.toolsDir, 'uvx');
    if (await this.pathExists(localUvx)) {
      console.log(`✓ 使用本地 uvx: ${localUvx}`);
      return localUvx;
    }

    console.log('⏳ uv 未找到，正在下载...');
    await this.downloadUv();

    return localUvx;
  }

  private async findSystemCommand(cmd: string): Promise<string | null> {
    try {
      const checkCmd = getPlatform() === 'windows' ? 'where' : 'which';
      const { stdout } = await execAsync(`${checkCmd} ${cmd}`);
      return stdout.trim().split('\n')[0] || null;
    } catch {
      return null;
    }
  }

  private async downloadNodejs(): Promise<void> {
    const platform = getPlatform();
    const arch = process.arch === 'x64' ? 'x64' : 'arm64';
    const version = 'v20.11.0';

    let url: string;
    let filename: string;

    if (platform === 'windows') {
      filename = `node-${version}-win-${arch}.zip`;
      url = `https://nodejs.org/dist/${version}/${filename}`;
    } else if (platform === 'macos') {
      filename = `node-${version}-darwin-${arch}.tar.gz`;
      url = `https://nodejs.org/dist/${version}/${filename}`;
    } else {
      filename = `node-${version}-linux-${arch}.tar.gz`;
      url = `https://nodejs.org/dist/${version}/${filename}`;
    }

    const downloadPath = path.join(this.toolsDir, filename);

    // 下载
    await this.download(url, downloadPath);

    // 解压
    const extractDir = path.join(this.toolsDir, 'node');
    await this.extract(downloadPath, extractDir);

    // 清理
    await rm(downloadPath, { recursive: true, force: true });

    console.log(`✓ Node.js ${version} 已安装至 ${extractDir}`);
  }

  private async downloadUv(): Promise<void> {
    const platform = getPlatform();
    const arch = process.arch;

    // uv 提供独立二进制
    let platformName: string;
    if (platform === 'windows') platformName = 'pc-windows-msvc';
    else if (platform === 'macos') platformName = 'apple-darwin';
    else platformName = 'unknown-linux-gnu';

    const archName = arch === 'x64' ? 'x86_64' : 'aarch64';
    const filename = platform === 'windows' ? 'uv.exe' : 'uv';

    const url = `https://github.com/astral-sh/uv/releases/latest/download/uv-${archName}-${platformName}.tar.gz`;
    const downloadPath = path.join(this.toolsDir, 'uv.tar.gz');

    await this.download(url, downloadPath);
    await this.extract(downloadPath, this.toolsDir);
    await rm(downloadPath, { recursive: true, force: true });

    const uvPath = path.join(this.toolsDir, 'uvx');
    await chmod(uvPath, 0o755);

    console.log(`✓ uv 已安装至 ${uvPath}`);
  }

  private async download(url: string, dest: string): Promise<void> {
    // 使用 fetch 下载
    const response = await fetch(url);
    if (!response.ok) throw new Error(`下载失败: ${response.statusText}`);

    await mkdir(path.dirname(dest), { recursive: true });
    const buffer = await response.arrayBuffer();
    await writeFile(dest, Buffer.from(buffer));
  }

  private async extract(archive: string, dest: string): Promise<void> {
    // 使用 tar 或 unzip
    await mkdir(dest, { recursive: true });

    if (archive.endsWith('.tar.gz') || archive.endsWith('.tgz')) {
      await execAsync(`tar -xzf "${archive}" -C "${dest}" --strip-components=1`);
    } else if (archive.endsWith('.zip')) {
      await execAsync(`unzip -q "${archive}" -d "${dest}"`);
    }
  }

  private async pathExists(filePath: string): Promise<boolean> {
    try {
      await access(filePath, constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }
}
