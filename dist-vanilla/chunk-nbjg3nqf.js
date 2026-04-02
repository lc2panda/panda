// @bun
import {
  McpStdioServerConfigSchema,
  init_json,
  init_types,
  safeParseJSON
} from "./chunk-0f1005z8.js";
import"./chunk-g0j0t6qk.js";
import {
  SUPPORTED_PLATFORMS,
  getPlatform,
  init_platform
} from "./chunk-2g1tm0n3.js";
import"./chunk-55wgxwa9.js";
import"./chunk-tjd99w4c.js";
import"./chunk-qnfx3qtx.js";
import {
  init_log,
  logError
} from "./chunk-myphr2va.js";
import"./chunk-8tnsngw2.js";
import {
  getErrnoCode,
  init_errors
} from "./chunk-cv4r43rj.js";
import"./chunk-fbv4apne.js";
import"./chunk-er95axp1.js";
import"./chunk-24stks7b.js";
import"./chunk-hqmz36b3.js";
import"./chunk-4g3v8y12.js";
import"./chunk-7739pg2c.js";
import"./chunk-qp2qdcda.js";

// src/utils/claudeDesktop.ts
init_types();
init_errors();
init_json();
init_log();
init_platform();
import { readdir, readFile, stat } from "fs/promises";
import { homedir } from "os";
import { join } from "path";
async function getClaudeDesktopConfigPath() {
  const platform = getPlatform();
  if (!SUPPORTED_PLATFORMS.includes(platform)) {
    throw new Error(`Unsupported platform: ${platform} - Claude Desktop integration only works on macOS and WSL.`);
  }
  if (platform === "macos") {
    return join(homedir(), "Library", "Application Support", "Claude", "claude_desktop_config.json");
  }
  const windowsHome = process.env.USERPROFILE ? process.env.USERPROFILE.replace(/\\/g, "/") : null;
  if (windowsHome) {
    const wslPath = windowsHome.replace(/^[A-Z]:/, "");
    const configPath = `/mnt/c${wslPath}/AppData/Roaming/Claude/claude_desktop_config.json`;
    try {
      await stat(configPath);
      return configPath;
    } catch {}
  }
  try {
    const usersDir = "/mnt/c/Users";
    try {
      const userDirs = await readdir(usersDir, { withFileTypes: true });
      for (const user of userDirs) {
        if (user.name === "Public" || user.name === "Default" || user.name === "Default User" || user.name === "All Users") {
          continue;
        }
        const potentialConfigPath = join(usersDir, user.name, "AppData", "Roaming", "Claude", "claude_desktop_config.json");
        try {
          await stat(potentialConfigPath);
          return potentialConfigPath;
        } catch {}
      }
    } catch {}
  } catch (dirError) {
    logError(dirError);
  }
  throw new Error("Could not find Claude Desktop config file in Windows. Make sure Claude Desktop is installed on Windows.");
}
async function readClaudeDesktopMcpServers() {
  if (!SUPPORTED_PLATFORMS.includes(getPlatform())) {
    throw new Error("Unsupported platform - Claude Desktop integration only works on macOS and WSL.");
  }
  try {
    const configPath = await getClaudeDesktopConfigPath();
    let configContent;
    try {
      configContent = await readFile(configPath, { encoding: "utf8" });
    } catch (e) {
      const code = getErrnoCode(e);
      if (code === "ENOENT") {
        return {};
      }
      throw e;
    }
    const config = safeParseJSON(configContent);
    if (!config || typeof config !== "object") {
      return {};
    }
    const mcpServers = config.mcpServers;
    if (!mcpServers || typeof mcpServers !== "object") {
      return {};
    }
    const servers = {};
    for (const [name, serverConfig] of Object.entries(mcpServers)) {
      if (!serverConfig || typeof serverConfig !== "object") {
        continue;
      }
      const result = McpStdioServerConfigSchema().safeParse(serverConfig);
      if (result.success) {
        servers[name] = result.data;
      }
    }
    return servers;
  } catch (error) {
    logError(error);
    return {};
  }
}
export {
  readClaudeDesktopMcpServers,
  getClaudeDesktopConfigPath
};
