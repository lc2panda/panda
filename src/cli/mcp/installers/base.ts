/**
 * Input: McpSource 对象 + 安装名称
 * Output: InstallResult（包含 MCP 配置、版本、安装路径）
 * Pos: CLI MCP 安装器基类，定义统一接口
 * 一旦此处接口变化，请同步更新本头部注释与 mcp/ 文件夹 README
 */

import type { McpSource } from '../sourceDetector';
import path from 'path';
import os from 'os';
import { connectToServer } from '../../../services/mcp/client.js';
import type { ScopedMcpServerConfig } from '../../../services/mcp/types.js';

export interface McpConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export interface InstallResult {
  config: McpConfig;
  version?: string;
  installedPath?: string;
}

export abstract class BaseInstaller {
  abstract install(source: McpSource, name: string): Promise<InstallResult>;

  protected getMcpServersDir(): string {
    return path.join(os.homedir(), '.pandacc', 'mcp-servers');
  }

  protected async testConnection(config: McpConfig): Promise<boolean> {
    // 复用现有的 connectToServer 逻辑
    try {
      const serverConfig: ScopedMcpServerConfig = {
        type: 'stdio',
        ...config,
        scope: 'user'
      };
      const client = await connectToServer('test', serverConfig);
      if (client.type === 'connected') {
        // 关闭连接
        // Note: client.connection 是 MCP Client，可能需要显式关闭
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}
