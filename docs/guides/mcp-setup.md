# MCP 配置指南 — Windows/Mac/Linux 跨平台

本指南介绍如何在 Panda 中配置 MCP（Model Context Protocol）服务器，以 CDP Bridge MCP 为例说明 stdio 模式下的完整配置流程。

---

## 1. 配置路径

不同操作系统的 Panda 配置文件路径如下：

| 操作系统 | 配置文件路径 |
|---------|-------------|
| **Windows** | `%USERPROFILE%\.pandacc.json` |
| **macOS** | `~/.pandacc.json` |
| **Linux** | `~/.pandacc.json` |

**实际路径示例**：
- Windows: `C:\Users\YourName\.pandacc.json`
- macOS: `/Users/YourName/.pandacc.json`
- Linux: `/home/YourName/.pandacc.json`

---

## 2. CDP Bridge MCP 配置示例

### 2.1 前置依赖

在配置 MCP 之前，需要确保系统已安装：

1. **uv**（Python 包管理工具）
   - macOS/Linux: `curl -LsSf https://astral.sh/uv/install.sh | sh`
   - Windows: `irm https://astral.sh/uv/install.ps1 | iex`

2. **CDP Bridge 浏览器扩展**（参见 [3. 浏览器扩展安装](#3-浏览器扩展安装)）

### 2.2 settings.json 配置

在 `settings.json` 的 `mcpServers` 字段中添加以下配置：

```json
{
  "mcpServers": {
    "cdp-bridge": {
      "command": "uvx",
      "args": ["cdp-bridge@latest"]
    }
  }
}
```

**自定义 WebSocket 端口**（可选）：

如果需要修改浏览器扩展连接的 WebSocket 端口（默认 18765），可添加 `--ws-port` 参数：

```json
{
  "mcpServers": {
    "cdp-bridge": {
      "command": "uvx",
      "args": ["cdp-bridge@latest", "--ws-port", "18767"]
    }
  }
}
```

### 2.3 完整配置示例

以下是包含多个 MCP 服务器的完整配置示例：

```json
{
  "apiKey": "your-api-key",
  "model": "claude-sonnet-4-20250514",
  "mcpServers": {
    "cdp-bridge": {
      "command": "uvx",
      "args": ["cdp-bridge@latest"]
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "<USER_HOME>/Documents"]
    }
  }
}
```

**注意**：将 `<USER_HOME>` 替换为实际路径：
- Windows: `C:\\Users\\YourName`
- macOS/Linux: `/Users/YourName` 或 `/home/YourName`

---

## 3. 浏览器扩展安装

CDP Bridge MCP 需要配套的 Chrome/Chromium 扩展才能控制浏览器。

### 3.1 获取扩展文件

从 CDP Bridge MCP 仓库获取扩展文件夹：

```bash
git clone https://github.com/Unagi-cq/cdp-bridge-mcp.git
cd cdp-bridge-mcp/src/cdp_bridge/tmwd_cdp_bridge
```

或直接下载 [扩展文件夹 ZIP](https://github.com/Unagi-cq/cdp-bridge-mcp/archive/refs/heads/main.zip) 并解压到 `tmwd_cdp_bridge` 目录。

### 3.2 加载扩展到浏览器

1. 打开 Chrome/Edge/Brave 等 Chromium 浏览器
2. 访问扩展管理页面：`chrome://extensions/`
3. 启用右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择 `tmwd_cdp_bridge` 文件夹

### 3.3 扩展配置（默认配置无需修改）

默认情况下，扩展会自动连接本地 WebSocket 服务 `127.0.0.1:18765`，无需手动配置。

如需修改连接参数，点击扩展图标打开弹窗：

| 配置项 | 默认值 | 说明 |
|-------|--------|------|
| **Bridge Host** | `127.0.0.1` | MCP 服务主机地址 |
| **Port** | `18765` | WebSocket 端口（需与 `--ws-port` 一致） |
| **Token** | `__default__` | 多用户模式下的身份标识 |

---

## 4. 验证配置

### 4.1 启动 Panda 并检查 MCP 服务

运行以下命令验证 MCP 服务器是否正确注册：

```bash
panda mcp list
```

**预期输出**：

```
Available MCP servers:
  ✓ cdp-bridge (command: uvx)
  ✓ filesystem (command: npx)
```

### 4.2 测试浏览器连接

1. 打开浏览器并访问任意网页（如 `https://www.google.com`）
2. 在 Panda 中输入测试指令：
   ```
   获取当前浏览器标签页列表
   ```
3. 如果配置成功，Panda 会调用 `browser_get_tabs` 工具并返回当前打开的标签页信息

### 4.3 首次连接注意事项

首次启动时，浏览器扩展可能会显示 `ERR_CONNECTION_REFUSED` 错误，这是正常现象：

- 扩展内置自动重连机制，每 5 秒自动尝试连接
- 当 MCP 服务启动后（Panda 首次调用 MCP 工具时），扩展会自动连接
- 无需手动重启扩展或浏览器

---

## 5. 常见问题排查

### 问题 1：Tool reference not found

**现象**：Panda 提示 `Tool 'browser_get_tabs' not found` 或 `MCP server 'cdp-bridge' is not available`

**根因诊断**：

1. **MCP 服务未启动**
   - stdio 模式下，MCP 服务在首次调用工具时才启动
   - 检查 `settings.json` 中的 `mcpServers` 配置是否正确

2. **命令路径不可用**
   - 确认 `uvx` 已正确安装并在 PATH 中
   - 测试命令：`uvx --version`（应显示 uv 版本号）

3. **配置文件语法错误**
   - 检查 JSON 格式是否正确（注意逗号、引号、括号）
   - 可使用 [JSONLint](https://jsonlint.com/) 验证

**解决方案**：

```bash
# 验证 uv 是否已安装
uvx --version

# 手动测试 MCP 服务启动
uvx cdp-bridge@latest

# 检查配置文件语法
cat ~/.pandacc.json | python -m json.tool
```

### 问题 2：浏览器扩展无法连接

**现象**：扩展图标显示断开状态，或持续显示 `ERR_CONNECTION_REFUSED`

**根因诊断**：

1. **MCP 服务未启动** → 在 Panda 中调用任意 MCP 工具触发启动
2. **端口被占用** → 检查 18765 端口是否被其他程序占用
3. **端口配置不匹配** → 确认 `settings.json` 中的 `--ws-port` 与扩展配置一致

**解决方案**：

```bash
# Windows (PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 18765).OwningProcess

# macOS/Linux
lsof -i :18765
```

### 问题 3：多个浏览器配置文件冲突

**现象**：在不同 Chrome Profile 中使用相同 Token 导致工具调用错误

**解决方案**：

为每个浏览器 Profile 配置不同的 Token：

1. 在 Profile A 的扩展中设置 Token 为 `user_a`
2. 在 Profile B 的扩展中设置 Token 为 `user_b`
3. 在 `settings.json` 中为不同用户配置独立的 MCP 服务器实例（需使用 streamable-http 模式）

### 问题 4：Windows 路径转义问题

**现象**：Windows 下配置文件路径中的反斜杠导致 JSON 解析失败

**解决方案**：

在 JSON 中使用双反斜杠或正斜杠：

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "C:\\Users\\YourName\\Documents"]
    }
  }
}
```

或使用正斜杠（Windows 支持）：

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "C:/Users/YourName/Documents"]
    }
  }
}
```

---

## 6. 高级配置

### 6.1 Streamable HTTP 模式（多客户端共享）

如果需要多个 Panda 客户端共享同一个 MCP 服务，可使用 streamable-http 模式：

**第一步：启动服务**

```bash
uvx cdp-bridge@latest --transport streamable-http --port 8000
```

**第二步：配置客户端**

```json
{
  "mcpServers": {
    "cdp-bridge": {
      "type": "streamableHttp",
      "url": "http://127.0.0.1:8000/mcp"
    }
  }
}
```

### 6.2 多用户隔离（Token 认证）

启动服务时指定允许的 Token 白名单：

```bash
uvx cdp-bridge@latest --transport streamable-http --port 8000 --tokens "team_alice,team_bob"
```

在客户端配置中添加 Authorization Header：

```json
{
  "mcpServers": {
    "cdp-bridge": {
      "type": "streamableHttp",
      "url": "http://127.0.0.1:8000/mcp",
      "headers": {
        "Authorization": "Bearer team_alice"
      }
    }
  }
}
```

**同时**在浏览器扩展中配置相同的 Token：`team_alice`

---

## 7. 参考资源

- **CDP Bridge MCP 官方仓库**：[https://github.com/Unagi-cq/cdp-bridge-mcp](https://github.com/Unagi-cq/cdp-bridge-mcp)
- **Panda 配置文档**：[README.md](../../README.md)
- **MCP 协议规范**：[https://modelcontextprotocol.io/](https://modelcontextprotocol.io/)
- **uv 安装文档**：[https://docs.astral.sh/uv/](https://docs.astral.sh/uv/)

---

## 8. 总结

完整配置流程回顾：

1. 安装 uv：`curl -LsSf https://astral.sh/uv/install.sh | sh`（macOS/Linux）或 `irm https://astral.sh/uv/install.ps1 | iex`（Windows）
2. 编辑 `settings.json`，在 `mcpServers` 中添加 CDP Bridge 配置
3. 从 GitHub 获取 `tmwd_cdp_bridge` 扩展文件夹
4. 在浏览器中加载扩展（开发者模式 → 加载已解压的扩展程序）
5. 运行 `panda mcp list` 验证配置
6. 在 Panda 中调用任意 MCP 工具测试连接

如有其他问题，请参考上方的「常见问题排查」章节或在 [Panda 社区](https://github.com/lc2panda/panda/issues) 提问。
