## src/cli/mcp/

**职责**: MCP 通用包管理器核心框架

**文件列表**:
- `sourceDetector.ts` - 源类型识别（npm/pypi/url/github/docker/local）
- `toolManager.ts` - 工具管理（npx/uvx 自动检测与下载）
- `installers/` - 安装器目录
  - `base.ts` - 安装器基类接口
  - `npmInstaller.ts` - npm 包安装器
  - `pypiInstaller.ts` - PyPI 包安装器
  - `urlInstaller.ts` - URL 下载安装器
  - `githubInstaller.ts` - GitHub 仓库安装器

**地位**: CLI MCP 安装流程的核心模块，被 `handlers/mcpInstall.ts` 调用

*一旦这里的结构发生变化，请务必更新我... 就像重新标记领地一样。*
