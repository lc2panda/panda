/**
 * Input: 包源字符串数组 + 安装选项（force, name）
 * Output: 安装完成的 MCP 服务器配置写入 settings
 * Pos: CLI MCP 安装主处理器，协调检测、安装、配置写入、连接验证
 * 一旦此处流程变化，请同步更新本头部注释与 mcp/ 文件夹 README
 */

import { SourceDetector } from '../mcp/sourceDetector';
import { NpmInstaller } from '../mcp/installers/npmInstaller';
import { PypiInstaller } from '../mcp/installers/pypiInstaller';
import { UrlInstaller } from '../mcp/installers/urlInstaller';
import { GitHubInstaller } from '../mcp/installers/githubInstaller';
import { addMcpConfig } from '../../services/mcp/config.js';
import type { McpConfig } from '../mcp/installers/base';
import { connectToServer } from '../../services/mcp/client.js';
import type { ScopedMcpServerConfig } from '../../services/mcp/types.js';

export async function handleMcpInstall(
  sources: string[],
  options?: { force?: boolean; name?: string; scope?: 'user' | 'local' | 'project' }
): Promise<void> {
  if (sources.length === 0) {
    console.log('用法: panda mcp install <source> [source2...]');
    console.log('\n示例:');
    console.log('  panda mcp install @larksuite/lark-mcp');
    console.log('  panda mcp install cdp-bridge');
    console.log('  panda mcp install https://cdn.example.com/mcp-server');
    console.log('  panda mcp install github:user/repo');
    console.log('\n选项:');
    console.log('  --name <name>     自定义服务器名称');
    console.log('  --force           覆盖已存在的配置');
    console.log('  --scope <scope>   配置作用域 (user|local|project，默认: user)');
    return;
  }

  const detector = new SourceDetector();
  const installers = {
    npm: new NpmInstaller(),
    pypi: new PypiInstaller(),
    url: new UrlInstaller(),
    github: new GitHubInstaller(),
    docker: null, // Phase 2
    local: null   // Phase 2
  };

  const scope = options?.scope || 'user';

  for (const sourceInput of sources) {
    console.log(`\n=== 安装 ${sourceInput} ===\n`);

    try {
      // 1. 检测源类型
      const source = detector.detect(sourceInput);
      console.log(`✓ 检测到类型: ${source.type}`);
      console.log(`✓ 包名: ${source.name}`);

      // 2. 确定名称
      const name = options?.name || source.name;
      if (!name) {
        throw new Error('无法推导包名，请使用 --name 指定');
      }

      // 3. 检查安装器支持
      const installer = installers[source.type];
      if (!installer) {
        throw new Error(`暂不支持的源类型: ${source.type}（将在 Phase 2 实现）`);
      }

      // 4. 执行安装
      console.log(`⏳ 正在安装 ${name}...`);
      const result = await installer.install(source, name);

      // 5. 写入配置
      console.log(`⏳ 正在写入配置到 ${scope} scope...`);
      await addMcpConfig(name, result.config, scope);
      console.log(`✓ 已将 ${name} 添加到配置中`);

      // 6. 验证连接
      console.log(`⏳ 测试连接中...`);
      const connected = await testConnection(name, result.config);

      if (connected) {
        console.log(`✓ ${name} 安装并验证成功！`);
        if (result.version) {
          console.log(`  版本: ${result.version}`);
        }
        if (result.installedPath) {
          console.log(`  路径: ${result.installedPath}`);
        }
      } else {
        console.log(`⚠ ${name} 已安装但连接测试失败`);
        console.log(`  运行 'panda mcp doctor' 进行诊断`);
      }

    } catch (error: any) {
      console.log(`✗ 安装 ${sourceInput} 失败`);
      console.log(`  错误: ${error.message}`);
      if (process.env.DEBUG) {
        console.log(`  堆栈: ${error.stack}`);
      }
    }
  }

  console.log(`\n✓ 安装完成\n`);
}

/**
 * 测试 MCP 服务器连接
 */
async function testConnection(name: string, config: McpConfig): Promise<boolean> {
  try {
    const serverConfig: ScopedMcpServerConfig = {
      type: 'stdio',
      ...config,
      scope: 'user'
    };

    const result = await connectToServer(name, serverConfig);

    if (result.type === 'connected') {
      // 连接成功，关闭连接
      // MCP Client 在 result 中，但不需要显式关闭（会自动管理）
      return true;
    }

    return false;
  } catch (error) {
    // 连接失败
    return false;
  }
}
