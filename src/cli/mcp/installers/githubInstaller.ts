/**
 * Input: GitHub 仓库信息（owner/repo）
 * Output: InstallResult（下载 Release 二进制 / 克隆构建）
 * Pos: CLI MCP GitHub 安装器，处理 GitHub 仓库的安装
 * 一旦此处安装逻辑变化，请同步更新本头部注释与 mcp/ 文件夹 README
 */

import { BaseInstaller, type InstallResult } from './base';
import type { McpSource } from '../sourceDetector';
import { UrlInstaller } from './urlInstaller';
import { getPlatform } from '../../../utils/platform.js';
import { readFile, access } from 'fs/promises';
import { constants } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface GitHubAsset {
  name: string;
  browser_download_url: string;
}

interface GitHubRelease {
  tag_name: string;
  assets: GitHubAsset[];
}

export class GitHubInstaller extends BaseInstaller {
  async install(source: McpSource, name: string): Promise<InstallResult> {
    // 解析 owner/repo
    const match = source.identifier.match(/([^/]+)\/([^/@#]+)/);
    if (!match) {
      throw new Error(`无效的 GitHub 仓库格式: ${source.identifier}`);
    }

    const [, owner, repo] = match;

    console.log(`⏳ 检查 GitHub 仓库 ${owner}/${repo} 的发布版本...`);

    // 1. 检查是否有 release 二进制
    const release = await this.getLatestRelease(owner, repo);

    if (release?.assets?.length > 0) {
      // 找到平台匹配的二进制
      const platform = getPlatform();
      const arch = process.arch;

      const asset = this.findMatchingAsset(release.assets, platform, arch);

      if (asset) {
        console.log(`✓ 找到预编译二进制: ${asset.name}`);
        // 使用 UrlInstaller 下载
        const urlInstaller = new UrlInstaller();
        return urlInstaller.install({
          type: 'url',
          identifier: asset.browser_download_url,
          name
        }, name);
      }
    }

    // 2. 没有 release，克隆仓库
    console.log(`⚠ 未找到预编译二进制，正在克隆仓库...`);
    const repoPath = path.join(this.getMcpServersDir(), name);

    await execAsync(`git clone https://github.com/${owner}/${repo}.git "${repoPath}"`);
    console.log(`✓ 仓库已克隆至 ${repoPath}`);

    // 3. 检测项目类型并构建
    const buildConfig = await this.detectAndBuild(repoPath);

    return buildConfig;
  }

  private async getLatestRelease(owner: string, repo: string): Promise<GitHubRelease | null> {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/releases/latest`,
        {
          headers: {
            'Accept': 'application/vnd.github+json',
            'User-Agent': 'Panda-MCP-Installer'
          }
        }
      );
      if (!response.ok) return null;
      return response.json();
    } catch {
      return null;
    }
  }

  private findMatchingAsset(assets: GitHubAsset[], platform: string, arch: string): GitHubAsset | null {
    // 规范化平台名称
    const platformMap: Record<string, string[]> = {
      'macos': ['darwin', 'macos', 'osx', 'mac'],
      'linux': ['linux'],
      'windows': ['windows', 'win']
    };

    const archMap: Record<string, string[]> = {
      'x64': ['x64', 'x86_64', 'amd64'],
      'arm64': ['arm64', 'aarch64']
    };

    const platformVariants = platformMap[platform] || [platform];
    const archVariants = archMap[arch] || [arch];

    // 优先精确匹配
    for (const p of platformVariants) {
      for (const a of archVariants) {
        const asset = assets.find(asset => {
          const name = asset.name.toLowerCase();
          return name.includes(p) && name.includes(a);
        });
        if (asset) return asset;
      }
    }

    // 降级只匹配平台
    for (const p of platformVariants) {
      const asset = assets.find(asset => asset.name.toLowerCase().includes(p));
      if (asset) return asset;
    }

    return null;
  }

  private async detectAndBuild(repoPath: string): Promise<InstallResult> {
    // 检测 Node.js 项目
    if (await this.pathExists(path.join(repoPath, 'package.json'))) {
      console.log(`⏳ 检测到 Node.js 项目，正在构建...`);
      await execAsync('npm install', { cwd: repoPath });

      // 检查是否有 build 脚本
      const pkgJsonContent = await readFile(path.join(repoPath, 'package.json'), 'utf-8');
      const pkgJson = JSON.parse(pkgJsonContent);
      if (pkgJson.scripts?.build) {
        await execAsync('npm run build', { cwd: repoPath });
      }

      // 查找入口文件
      const entryPoints = [
        path.join(repoPath, 'dist/index.js'),
        path.join(repoPath, 'build/index.js'),
        path.join(repoPath, 'index.js'),
        path.join(repoPath, 'src/index.js')
      ];

      for (const entry of entryPoints) {
        if (await this.pathExists(entry)) {
          console.log(`✓ 找到入口文件: ${entry}`);
          return {
            config: {
              command: 'node',
              args: [entry]
            },
            installedPath: repoPath
          };
        }
      }
    }

    // 检测 Python 项目
    if (await this.pathExists(path.join(repoPath, 'requirements.txt'))) {
      console.log(`⚠ 检测到 Python 项目，但自动构建尚未实现`);
      throw new Error('Python 项目请使用 PyPI 源安装，或手动构建');
    }

    throw new Error('不支持的项目类型，无法自动构建');
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
