# MCP Setup Guide — Windows/Mac/Linux Cross-Platform

This guide explains how to configure MCP (Model Context Protocol) servers in Panda, using CDP Bridge MCP as an example for stdio mode setup.

---

## 1. Configuration Paths

Panda configuration file paths vary by operating system:

| Operating System | Configuration File Path |
|-----------------|------------------------|
| **Windows** | `%USERPROFILE%\.pandacc\settings.json` |
| **macOS** | `~/.pandacc/settings.json` |
| **Linux** | `~/.pandacc/settings.json` |

**Example absolute paths**:
- Windows: `C:\Users\YourName\.pandacc\settings.json`
- macOS: `/Users/YourName/.pandacc/settings.json`
- Linux: `/home/YourName/.pandacc/settings.json`

---

## 2. CDP Bridge MCP Configuration Example

### 2.1 Prerequisites

Before configuring MCP, ensure the following are installed:

1. **uv** (Python package manager)
   - macOS/Linux: `curl -LsSf https://astral.sh/uv/install.sh | sh`
   - Windows: `irm https://astral.sh/uv/install.ps1 | iex`

2. **CDP Bridge Browser Extension** (see [3. Browser Extension Installation](#3-browser-extension-installation))

### 2.2 settings.json Configuration

Add the following configuration to the `mcpServers` field in `settings.json`:

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

**Custom WebSocket Port** (optional):

To modify the WebSocket port used by the browser extension (default 18765), add the `--ws-port` parameter:

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

### 2.3 Complete Configuration Example

Example configuration with multiple MCP servers:

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

**Note**: Replace `<USER_HOME>` with actual path:
- Windows: `C:\\Users\\YourName`
- macOS/Linux: `/Users/YourName` or `/home/YourName`

---

## 3. Browser Extension Installation

CDP Bridge MCP requires a companion Chrome/Chromium extension to control the browser.

### 3.1 Obtain Extension Files

Get the extension folder from the CDP Bridge MCP repository:

```bash
git clone https://github.com/Unagi-cq/cdp-bridge-mcp.git
cd cdp-bridge-mcp/src/cdp_bridge/tmwd_cdp_bridge
```

Or download the [extension folder ZIP](https://github.com/Unagi-cq/cdp-bridge-mcp/archive/refs/heads/main.zip) and extract to the `tmwd_cdp_bridge` directory.

### 3.2 Load Extension into Browser

1. Open Chrome/Edge/Brave or other Chromium-based browser
2. Navigate to the extensions page: `chrome://extensions/`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked"
5. Select the `tmwd_cdp_bridge` folder

### 3.3 Extension Configuration (default settings work without modification)

By default, the extension automatically connects to the local WebSocket service at `127.0.0.1:18765`, requiring no manual configuration.

To modify connection parameters, click the extension icon to open the popup:

| Configuration | Default Value | Description |
|--------------|---------------|-------------|
| **Bridge Host** | `127.0.0.1` | MCP service host address |
| **Port** | `18765` | WebSocket port (must match `--ws-port`) |
| **Token** | `__default__` | Identity token for multi-user mode |

---

## 4. Verify Configuration

### 4.1 Start Panda and Check MCP Services

Run the following command to verify MCP servers are registered correctly:

```bash
panda mcp list
```

**Expected output**:

```
Available MCP servers:
  ✓ cdp-bridge (command: uvx)
  ✓ filesystem (command: npx)
```

### 4.2 Test Browser Connection

1. Open browser and visit any webpage (e.g., `https://www.google.com`)
2. In Panda, enter test command:
   ```
   Get current browser tabs
   ```
3. If configured successfully, Panda will invoke the `browser_get_tabs` tool and return information about currently open tabs

### 4.3 First Connection Notes

On first startup, the browser extension may display an `ERR_CONNECTION_REFUSED` error, which is normal:

- Extension has built-in auto-reconnect mechanism, attempting connection every 5 seconds
- When MCP service starts (on first MCP tool invocation by Panda), extension will connect automatically
- No need to manually restart extension or browser

---

## 5. Troubleshooting

### Issue 1: Tool reference not found

**Symptom**: Panda shows `Tool 'browser_get_tabs' not found` or `MCP server 'cdp-bridge' is not available`

**Root Cause Diagnosis**:

1. **MCP service not started**
   - In stdio mode, MCP service starts only on first tool invocation
   - Check if `mcpServers` configuration in `settings.json` is correct

2. **Command path unavailable**
   - Confirm `uvx` is properly installed and in PATH
   - Test command: `uvx --version` (should display uv version number)

3. **Configuration file syntax error**
   - Check JSON format is correct (note commas, quotes, brackets)
   - Use [JSONLint](https://jsonlint.com/) to validate

**Solutions**:

```bash
# Verify uv is installed
uvx --version

# Manually test MCP service startup
uvx cdp-bridge@latest

# Check configuration file syntax
cat ~/.pandacc/settings.json | python -m json.tool
```

### Issue 2: Browser extension cannot connect

**Symptom**: Extension icon shows disconnected status, or continuously displays `ERR_CONNECTION_REFUSED`

**Root Cause Diagnosis**:

1. **MCP service not started** → Invoke any MCP tool in Panda to trigger startup
2. **Port occupied** → Check if port 18765 is used by another program
3. **Port configuration mismatch** → Confirm `--ws-port` in `settings.json` matches extension configuration

**Solutions**:

```bash
# Windows (PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 18765).OwningProcess

# macOS/Linux
lsof -i :18765
```

### Issue 3: Multiple browser profiles conflict

**Symptom**: Using the same Token in different Chrome Profiles causes tool invocation errors

**Solution**:

Configure different Tokens for each browser Profile:

1. In Profile A extension, set Token to `user_a`
2. In Profile B extension, set Token to `user_b`
3. In `settings.json`, configure separate MCP server instances for different users (requires streamable-http mode)

### Issue 4: Windows path escaping issues

**Symptom**: Backslashes in Windows file paths cause JSON parsing failure

**Solution**:

Use double backslashes or forward slashes in JSON:

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

Or use forward slashes (Windows supports this):

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

## 6. Advanced Configuration

### 6.1 Streamable HTTP Mode (Shared across multiple clients)

To share a single MCP service across multiple Panda clients, use streamable-http mode:

**Step 1: Start service**

```bash
uvx cdp-bridge@latest --transport streamable-http --port 8000
```

**Step 2: Configure client**

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

### 6.2 Multi-user Isolation (Token Authentication)

Start service with allowed Token whitelist:

```bash
uvx cdp-bridge@latest --transport streamable-http --port 8000 --tokens "team_alice,team_bob"
```

Add Authorization Header in client configuration:

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

**Also** configure the same Token in browser extension: `team_alice`

---

## 7. Reference Resources

- **CDP Bridge MCP Official Repository**: [https://github.com/Unagi-cq/cdp-bridge-mcp](https://github.com/Unagi-cq/cdp-bridge-mcp)
- **Panda Configuration Documentation**: [README.md](../../README.md)
- **MCP Protocol Specification**: [https://modelcontextprotocol.io/](https://modelcontextprotocol.io/)
- **uv Installation Documentation**: [https://docs.astral.sh/uv/](https://docs.astral.sh/uv/)

---

## 8. Summary

Complete configuration workflow recap:

1. Install uv: `curl -LsSf https://astral.sh/uv/install.sh | sh` (macOS/Linux) or `irm https://astral.sh/uv/install.ps1 | iex` (Windows)
2. Edit `settings.json`, add CDP Bridge configuration to `mcpServers`
3. Obtain `tmwd_cdp_bridge` extension folder from GitHub
4. Load extension in browser (Developer mode → Load unpacked)
5. Run `panda mcp list` to verify configuration
6. Invoke any MCP tool in Panda to test connection

For additional issues, refer to the "Troubleshooting" section above or ask in the [Panda Community](https://github.com/lc2panda/panda/issues).
