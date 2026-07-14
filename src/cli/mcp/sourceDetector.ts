/**
 * Input: 用户输入的包源字符串（npm:xxx, pypi:xxx, URL, GitHub, Docker, 本地路径）
 * Output: 识别后的 McpSource 对象（类型 + 标识符 + 版本 + 包名）
 * Pos: CLI MCP 安装流程的源头识别模块，决定后续调用哪个安装器
 * 一旦此处识别逻辑变化，请同步更新本头部注释与 mcp/ 文件夹 README
 */

import path from 'path';

export type McpSourceType = 'npm' | 'pypi' | 'url' | 'github' | 'docker' | 'local';

export interface McpSource {
  type: McpSourceType;
  identifier: string;
  version?: string;
  name?: string; // 推导的包名
}

export class SourceDetector {
  /**
   * 检测用户输入的包源类型
   */
  detect(input: string): McpSource {
    // 1. 显式协议前缀
    if (input.startsWith('npm:')) {
      return this.parseNpm(input.slice(4));
    }
    if (input.startsWith('pypi:')) {
      return this.parsePypi(input.slice(5));
    }
    if (input.startsWith('github:')) {
      return this.parseGitHub(input.slice(7));
    }
    if (input.startsWith('docker:')) {
      return this.parseDocker(input.slice(7));
    }

    // 2. URL 检测
    if (input.startsWith('http://') || input.startsWith('https://')) {
      if (input.includes('github.com')) {
        return this.parseGitHub(input);
      }
      return { type: 'url', identifier: input, name: this.deriveNameFromUrl(input) };
    }

    // 3. 本地路径
    if (input.startsWith('./') || input.startsWith('../') || input.startsWith('/') || input.startsWith('~')) {
      return { type: 'local', identifier: input, name: path.basename(input) };
    }

    // 4. 自动推测
    if (input.startsWith('@')) {
      return this.parseNpm(input); // @scope/package
    }

    // 默认：pypi（MCP 服务器主要是 Python）
    return this.parsePypi(input);
  }

  private parseNpm(pkg: string): McpSource {
    // @scope/package@version 或 package@version
    const match = pkg.match(/^(@?[^@]+)(?:@(.+))?$/);
    if (!match) {
      throw new Error(`Invalid npm package format: ${pkg}`);
    }

    return {
      type: 'npm',
      identifier: match[1]!,
      version: match[2],
      name: match[1]!.split('/').pop()
    };
  }

  private parsePypi(pkg: string): McpSource {
    // package==version 或 package
    const [identifier, version] = pkg.split('==');
    return {
      type: 'pypi',
      identifier: identifier!,
      version,
      name: identifier
    };
  }

  private parseGitHub(input: string): McpSource {
    // github:owner/repo 或 https://github.com/owner/repo
    let match: RegExpMatchArray | null;
    if (input.includes('github.com')) {
      match = input.match(/github\.com\/([^/]+)\/([^/@#]+)/);
    } else {
      match = input.match(/^([^/]+)\/([^/@#]+)/);
    }

    if (!match || !match[1] || !match[2]) {
      throw new Error(`Invalid GitHub repository format: ${input}`);
    }

    return {
      type: 'github',
      identifier: `${match[1]}/${match[2]}`,
      name: match[2]
    };
  }

  private parseDocker(image: string): McpSource {
    // image:tag 或 registry/image:tag
    const [identifier, version] = image.split(':');
    return {
      type: 'docker',
      identifier: identifier!,
      version: version || 'latest',
      name: identifier!.split('/').pop()
    };
  }

  private deriveNameFromUrl(url: string): string {
    const filename = url.split('/').pop()?.split('?')[0] || 'unknown';
    return filename.replace(/\.(tar\.gz|tgz|zip|exe|bin)$/, '');
  }
}
