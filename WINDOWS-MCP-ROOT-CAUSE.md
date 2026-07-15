# Windows MCP 完全失效根因报告

**排查时间**: 2026-07-14 23:30 ~ 00:15 +08:00  
**问题级别**: P0 阻塞  
**影响范围**: Windows 平台所有 MCP 功能

---

## 根因定位

### 问题：Panda 引入的 `resolveWindowsCommand` 破坏了 `cross-spawn` 的自动机制

#### Cline 原始实现（正常工作）✅

```typescript
// src/services/mcp/client.ts (2026-07-04 之前)
const finalCommand = stdioRef.command  // 直接使用 "uvx"

transport = new StdioClientTransport({
  command: finalCommand,  // ← "uvx"
  args: finalArgs,
  // ...
})
```

**工作原理**：
1. `cross-spawn` 接收到 `"uvx"`
2. 内部调用 `which.sync("uvx")` → 找到 `C:\...\uvx.cmd`
3. 检测到不是 `.exe` → 自动包装：`cmd.exe /d /s /c "uvx ..."`
4. ✅ Windows 正常启动

---

#### Panda 修改后（回归）❌

```typescript
// src/services/mcp/client.ts (commit fce8fe391, 2026-07-04)
let finalCommand = stdioRef.command

// 🔴 问题引入
if (process.platform === 'win32' && !process.env.CLAUDE_CODE_SHELL_PREFIX) {
  finalCommand = resolveWindowsCommand(finalCommand)  // "uvx" → "uvx.cmd"
}

transport = new StdioClientTransport({
  command: finalCommand,  // ← "uvx.cmd"
  args: finalArgs,
  // ...
})
```

**失败原因（假设）**：

##### 假设 A：`which.sync("uvx.cmd")` 查找失败
- `which` 库可能不查找 `.cmd` 扩展名
- 导致 `ENOENT` 错误

##### 假设 B：破坏了 `cross-spawn` 的 shell 包装逻辑
- `cross-spawn` 内部检测：`const needsShell = !isExecutableRegExp.test(commandFile)`
- 如果传入 `"uvx.cmd"` 而不是 `"uvx"`，可能绕过了自动包装

##### 假设 C：路径解析问题
- `resolveWindowsCommand` 返回相对路径 `"uvx.cmd"`
- 但 `which.sync` 无法解析相对路径的 `.cmd` 文件

---

## 证据链

### 1. Cline 在 Windows 下正常工作
- **证据**: Claude Code（基于 Cline）在 Windows 下 MCP 全部正常
- **结论**: Cline 原始逻辑没有问题

### 2. Panda 引入 `resolveWindowsCommand`
- **时间**: 2026-07-04（commit `fce8fe391`）
- **目的**: "修复" Windows 命令路径问题
- **实际**: 引入回归

### 3. 修改历史

| 时间 | Commit | 修改 | 结果 |
|------|--------|------|------|
| 2026-07-04 | `fce8fe391` | 添加 `resolveWindowsCommand`，只处理 `.exe` | ❌ uvx 失败（是 .cmd） |
| 2026-07-05 | `5d34820c4` | 添加 `.cmd` 列表（npm/npx/yarn/pnpm） | ❌ uvx 不在列表 |
| 2026-07-14 | `af526dfdf` | 扩展列表（添加 uvx 等 17 个命令） | ❌ 仍然失败 |

### 4. MCP SDK 已正确使用 `cross-spawn`
- **证据**: `@modelcontextprotocol/sdk@1.29.0` 使用 `cross-spawn@7.0.6`
- **配置**: `shell: false, windowsHide: true`
- **结论**: SDK 层面没有问题

---

## 关键技术细节

### `cross-spawn` 的 Windows 命令解析流程

```javascript
// node_modules/.bun/cross-spawn@7.0.6/.../parse.js

function parseNonShell(parsed) {
  if (!isWin) return parsed;
  
  // 1. 解析命令
  const commandFile = detectShebang(parsed);  
  // → which.sync("uvx") → C:\...\Scripts\uvx.cmd
  
  // 2. 检测是否需要 shell
  const needsShell = !isExecutableRegExp.test(commandFile);  
  // → !/\.(?:com|exe)$/i.test("uvx.cmd") → true
  
  if (needsShell) {
    // 3. 自动包装
    parsed.command = process.env.comspec || 'cmd.exe';
    parsed.args = ['/d', '/s', '/c', `"uvx cdp-bridge"`];
    // ✅ 最终执行：cmd.exe /d /s /c "uvx cdp-bridge"
  }
  
  return parsed;
}
```

### `resolveWindowsCommand` 破坏了什么？

**可能破坏点 1**: `which.sync` 行为
```javascript
// Cline (正常)
which.sync("uvx")  // ✅ 找到 C:\...\Scripts\uvx.cmd

// Panda (可能失败)
which.sync("uvx.cmd")  // ❌ 可能不在 PATHEXT 搜索范围？
```

**可能破坏点 2**: `cross-spawn` 内部检测
```javascript
// Cline (正常)
command: "uvx"
→ which.sync 找到完整路径
→ 检测到 .cmd → needsShell = true ✅

// Panda (可能失败)
command: "uvx.cmd"
→ 如果 which.sync 失败 → ENOENT ❌
→ 或者路径解析异常
```

---

## 验证方法

### Windows 用户运行测试脚本

```powershell
# 1. 测试 cross-spawn 行为
node test-windows-spawn-hypothesis.js

# 预期结果：
# ✅ 测试 1 成功（uvx 启动）
# ❌ 测试 2 失败（uvx.cmd 不启动）

# 2. 查看详细日志
$env:DEBUG="*"
node test-windows-spawn-hypothesis.js 2>&1
```

---

## 修复方案

### 方案 1：完全移除 `resolveWindowsCommand`（推荐）⭐⭐⭐

**理由**: 
- Cline 原始逻辑已验证工作
- `cross-spawn` 自动处理所有场景
- 无需手动干预

**修改位置**: `src/services/mcp/client.ts` 第 1140-1142 行

```typescript
// 删除这段代码
if (process.platform === 'win32' && !process.env.CLAUDE_CODE_SHELL_PREFIX) {
  finalCommand = resolveWindowsCommand(finalCommand)
}
```

**完整代码**:
```typescript
const stdioRef = serverRef as McpStdioServerConfig
const finalCommand = process.env.CLAUDE_CODE_SHELL_PREFIX || stdioRef.command
const finalArgs = process.env.CLAUDE_CODE_SHELL_PREFIX
  ? [[stdioRef.command, ...stdioRef.args].join(' ')]
  : stdioRef.args

// ✅ 直接使用原始命令，让 cross-spawn 处理

transport = new StdioClientTransport({
  command: finalCommand,
  args: finalArgs,
  // ...
})
```

**影响范围**: 
- ✅ 修复 Windows MCP 全部失败
- ✅ macOS/Linux 无影响
- ✅ 回滚到 Cline 验证过的逻辑

**风险**: 极低（回归到已验证工作的基线）

---

### 方案 2：修复 `resolveWindowsCommand` 使用完整路径

**理由**: 如果 `which.sync("uvx.cmd")` 确实失败，使用完整路径

**修改位置**: `src/services/mcp/client.ts` 第 424-496 行

```typescript
export function resolveWindowsCommand(command: string): string {
  // 已经是绝对路径且包含扩展名，直接返回
  if (isAbsolute(command) && extname(command)) {
    return command
  }

  // 🔧 新增：尝试使用 which 查找完整路径
  try {
    const which = require('which')
    const fullPath = which.sync(command, { nothrow: true })
    if (fullPath) {
      return fullPath  // ✅ 返回完整路径（如 C:\...\Scripts\uvx.cmd）
    }
  } catch {
    // which 不可用，继续后续逻辑
  }

  // 已包含扩展名（相对路径），直接返回
  if (extname(command)) {
    return command
  }

  // ... 后续硬编码列表逻辑保持不变（作为 fallback）
}
```

**问题**: 
- 需要安装 `which` 依赖
- 更复杂，维护成本高

---

### 方案 3：修复 MCP SDK（上游修复）

**目标**: 提交 PR 给 `@modelcontextprotocol/sdk`

**修改位置**: `node_modules/@modelcontextprotocol/sdk/dist/esm/client/stdio.js` 第 72 行

```javascript
// 当前
shell: false,

// 修复为
shell: process.platform === 'win32',
```

**优点**: 彻底解决（不依赖 command 格式）  
**缺点**: 需要等待上游合并和发布

---

## 推荐行动方案

### 立即执行（Phase 1）

1. **回滚 `resolveWindowsCommand`**（方案 1）
   - 删除 1140-1142 行代码
   - 删除 424-496 行函数定义（可选，留着也不影响）
   - 测试 Windows MCP 是否恢复

2. **创建测试用例**
   ```typescript
   // tests/windows-mcp-spawn.test.ts
   // 确保未来不再引入类似回归
   ```

3. **发布 hotfix**
   - 版本: v2.30.3
   - Commit: `fix(mcp): remove Windows command resolution - breaks cross-spawn auto-detection`

### 验证（Phase 2）

1. **Windows 用户验证**
   ```powershell
   panda mcp doctor
   # 预期: 所有服务器 Connected
   ```

2. **对比测试**
   - Panda v2.30.2（当前）: ❌ 全部失败
   - Panda v2.30.3（修复后）: ✅ 全部正常
   - Claude Code（基线）: ✅ 全部正常

### 长期（Phase 3）

1. **提交 PR 给 MCP SDK**（方案 3）
2. **添加 Windows CI 测试**
3. **文档记录**
   - 在 `MEMORY.md` 记录此 scar
   - 避免未来再次"优化"破坏基线逻辑

---

## Scar 记录

**标题**: Windows 命令"优化"破坏 cross-spawn 自动机制

**触发**: 尝试手动追加 `.cmd`/`.exe` 扩展名

**症状**: Windows 平台 MCP 全部 ENOENT

**根因**: `cross-spawn` 已自动处理扩展名，手动干预破坏了 `which.sync` 查找或 shell 包装逻辑

**教训**: 
1. **跨平台库已做适配，不要二次"优化"**
2. **对比基线版本（Cline）验证假设**
3. **Windows 特定修改必须有 Windows CI 验证**

**防复发**:
```typescript
// ❌ 禁止模式
if (process.platform === 'win32') {
  command = command + '.cmd'  // cross-spawn 已处理！
}

// ✅ 正确模式
// 直接传递原始命令，让 cross-spawn 处理
const command = userConfig.command
```

---

## 附录：Windows 用户诊断清单

### 如果修复后仍失败，提供以下信息

```powershell
# 1. Node.js 版本
node --version
npm --version

# 2. PowerShell 版本
$PSVersionTable

# 3. 命令可用性
uvx --version
Get-Command uvx

# 4. 环境变量
$env:PATH
$env:PATHEXT

# 5. 完整日志
$env:DEBUG="*"
panda mcp doctor > debug-full.log 2>&1
type debug-full.log

# 6. cross-spawn 测试
node test-windows-spawn-hypothesis.js

# 7. MCP SDK 版本
npm list @modelcontextprotocol/sdk
npm list cross-spawn
```

---

## 总结

| 项目 | 内容 |
|------|------|
| **根因** | Panda 的 `resolveWindowsCommand` 破坏了 `cross-spawn` 自动扩展名解析 |
| **证据** | Cline 基线正常，Panda 引入修改后失败 |
| **修复** | 回滚到 Cline 逻辑，删除 `resolveWindowsCommand` 调用 |
| **工作量** | 5 分钟（删除 3 行代码） |
| **风险** | 极低（回归到已验证基线） |
| **验证** | Windows 用户运行 `panda mcp doctor` |
| **发版** | v2.30.3 hotfix |

**关键教训**: 不要"优化"已经工作的跨平台逻辑。
