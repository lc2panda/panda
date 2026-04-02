// @bun
import {
  BROWSER_TOOLS,
  init_src
} from "./chunk-gyj242zr.js";
import {
  getChromeSystemPrompt,
  init_prompt
} from "./chunk-p9ra2v2f.js";
import {
  CLAUDE_IN_CHROME_MCP_SERVER_NAME,
  getAllBrowserDataPaths,
  getAllNativeMessagingHostsDirs,
  getAllWindowsRegistryKeys,
  init_common,
  openInChrome
} from "./chunk-5g7gx4y7.js";
import {
  getFeatureValue_CACHED_MAY_BE_STALE,
  getGlobalConfig,
  init_config1 as init_config,
  init_growthbook,
  saveGlobalConfig
} from "./chunk-w5d5b7r0.js";
import {
  getPlatform,
  init_platform
} from "./chunk-2g1tm0n3.js";
import {
  init_bundledMode,
  isInBundledMode
} from "./chunk-7np1pz21.js";
import {
  execFileNoThrowWithCwd,
  init_execFileNoThrow
} from "./chunk-ehab6nmr.js";
import {
  init_debug,
  init_errors,
  init_slowOperations,
  isFsInaccessible,
  jsonStringify,
  logForDebugging
} from "./chunk-cv4r43rj.js";
import {
  getClaudeConfigHomeDir,
  init_envUtils,
  isEnvDefinedFalsy,
  isEnvTruthy
} from "./chunk-er95axp1.js";
import {
  getIsInteractive,
  getIsNonInteractiveSession,
  getSessionBypassPermissionsMode,
  init_state
} from "./chunk-24stks7b.js";
import {
  __esm
} from "./chunk-qp2qdcda.js";

// src/utils/claudeInChrome/setupPortable.ts
import { readdir } from "fs/promises";
import { join } from "path";
function getExtensionIds() {
  return process.env.USER_TYPE === "ant" ? [PROD_EXTENSION_ID, DEV_EXTENSION_ID, ANT_EXTENSION_ID] : [PROD_EXTENSION_ID];
}
async function detectExtensionInstallationPortable(browserPaths, log) {
  if (browserPaths.length === 0) {
    log?.(`[Claude in Chrome] No browser paths to check`);
    return { isInstalled: false, browser: null };
  }
  const extensionIds = getExtensionIds();
  for (const { browser, path: browserBasePath } of browserPaths) {
    let browserProfileEntries = [];
    try {
      browserProfileEntries = await readdir(browserBasePath, {
        withFileTypes: true
      });
    } catch (e) {
      if (isFsInaccessible(e))
        continue;
      throw e;
    }
    const profileDirs = browserProfileEntries.filter((entry) => entry.isDirectory()).filter((entry) => entry.name === "Default" || entry.name.startsWith("Profile ")).map((entry) => entry.name);
    if (profileDirs.length > 0) {
      log?.(`[Claude in Chrome] Found ${browser} profiles: ${profileDirs.join(", ")}`);
    }
    for (const profile of profileDirs) {
      for (const extensionId of extensionIds) {
        const extensionPath = join(browserBasePath, profile, "Extensions", extensionId);
        try {
          await readdir(extensionPath);
          log?.(`[Claude in Chrome] Extension ${extensionId} found in ${browser} ${profile}`);
          return { isInstalled: true, browser };
        } catch {}
      }
    }
  }
  log?.(`[Claude in Chrome] Extension not found in any browser`);
  return { isInstalled: false, browser: null };
}
async function isChromeExtensionInstalledPortable(browserPaths, log) {
  const result = await detectExtensionInstallationPortable(browserPaths, log);
  return result.isInstalled;
}
var PROD_EXTENSION_ID = "fcoeoabgfenejglbffodgkkbkcdhcgfn", DEV_EXTENSION_ID = "dihbgbndebgnbjfmelmegjepbnkhlgni", ANT_EXTENSION_ID = "dngcpimnedloihjnnfngkgjoidhnaolf";
var init_setupPortable = __esm(() => {
  init_errors();
});

// src/utils/claudeInChrome/setup.ts
import { chmod, mkdir, readFile, writeFile } from "fs/promises";
import { homedir } from "os";
import { join as join2 } from "path";
import { fileURLToPath } from "url";
function shouldEnableClaudeInChrome(chromeFlag) {
  if (getIsNonInteractiveSession() && chromeFlag !== true) {
    return false;
  }
  if (chromeFlag === true) {
    return true;
  }
  if (chromeFlag === false) {
    return false;
  }
  if (isEnvTruthy(process.env.CLAUDE_CODE_ENABLE_CFC)) {
    return true;
  }
  if (isEnvDefinedFalsy(process.env.CLAUDE_CODE_ENABLE_CFC)) {
    return false;
  }
  const config = getGlobalConfig();
  if (config.claudeInChromeDefaultEnabled !== undefined) {
    return config.claudeInChromeDefaultEnabled;
  }
  return false;
}
function shouldAutoEnableClaudeInChrome() {
  if (shouldAutoEnable !== undefined) {
    return shouldAutoEnable;
  }
  shouldAutoEnable = getIsInteractive() && isChromeExtensionInstalled_CACHED_MAY_BE_STALE() && (process.env.USER_TYPE === "ant" || getFeatureValue_CACHED_MAY_BE_STALE("tengu_chrome_auto_enable", false));
  return shouldAutoEnable;
}
function setupClaudeInChrome() {
  const isNativeBuild = isInBundledMode();
  const allowedTools = BROWSER_TOOLS.map((tool) => `mcp__claude-in-chrome__${tool.name}`);
  const env = {};
  if (getSessionBypassPermissionsMode()) {
    env.CLAUDE_CHROME_PERMISSION_MODE = "skip_all_permission_checks";
  }
  const hasEnv = Object.keys(env).length > 0;
  if (isNativeBuild) {
    const execCommand = `"${process.execPath}" --chrome-native-host`;
    createWrapperScript(execCommand).then((manifestBinaryPath) => installChromeNativeHostManifest(manifestBinaryPath)).catch((e) => logForDebugging(`[Claude in Chrome] Failed to install native host: ${e}`, { level: "error" }));
    return {
      mcpConfig: {
        [CLAUDE_IN_CHROME_MCP_SERVER_NAME]: {
          type: "stdio",
          command: process.execPath,
          args: ["--claude-in-chrome-mcp"],
          scope: "dynamic",
          ...hasEnv && { env }
        }
      },
      allowedTools,
      systemPrompt: getChromeSystemPrompt()
    };
  } else {
    const __filename2 = fileURLToPath(import.meta.url);
    const __dirname2 = join2(__filename2, "..");
    const cliPath = join2(__dirname2, "cli.js");
    createWrapperScript(`"${process.execPath}" "${cliPath}" --chrome-native-host`).then((manifestBinaryPath) => installChromeNativeHostManifest(manifestBinaryPath)).catch((e) => logForDebugging(`[Claude in Chrome] Failed to install native host: ${e}`, { level: "error" }));
    const mcpConfig = {
      [CLAUDE_IN_CHROME_MCP_SERVER_NAME]: {
        type: "stdio",
        command: process.execPath,
        args: [`${cliPath}`, "--claude-in-chrome-mcp"],
        scope: "dynamic",
        ...hasEnv && { env }
      }
    };
    return {
      mcpConfig,
      allowedTools,
      systemPrompt: getChromeSystemPrompt()
    };
  }
}
function getNativeMessagingHostsDirs() {
  const platform = getPlatform();
  if (platform === "windows") {
    const home = homedir();
    const appData = process.env.APPDATA || join2(home, "AppData", "Local");
    return [join2(appData, "Panda Code", "ChromeNativeHost")];
  }
  return getAllNativeMessagingHostsDirs().map(({ path }) => path);
}
async function installChromeNativeHostManifest(manifestBinaryPath) {
  const manifestDirs = getNativeMessagingHostsDirs();
  if (manifestDirs.length === 0) {
    throw Error("Claude in Chrome Native Host not supported on this platform");
  }
  const manifest = {
    name: NATIVE_HOST_IDENTIFIER,
    description: "Panda Code Browser Extension Native Host",
    path: manifestBinaryPath,
    type: "stdio",
    allowed_origins: [
      `chrome-extension://fcoeoabgfenejglbffodgkkbkcdhcgfn/`,
      ...process.env.USER_TYPE === "ant" ? [
        "chrome-extension://dihbgbndebgnbjfmelmegjepbnkhlgni/",
        "chrome-extension://dngcpimnedloihjnnfngkgjoidhnaolf/"
      ] : []
    ]
  };
  const manifestContent = jsonStringify(manifest, null, 2);
  let anyManifestUpdated = false;
  for (const manifestDir of manifestDirs) {
    const manifestPath = join2(manifestDir, NATIVE_HOST_MANIFEST_NAME);
    const existingContent = await readFile(manifestPath, "utf-8").catch(() => null);
    if (existingContent === manifestContent) {
      continue;
    }
    try {
      await mkdir(manifestDir, { recursive: true });
      await writeFile(manifestPath, manifestContent);
      logForDebugging(`[Claude in Chrome] Installed native host manifest at: ${manifestPath}`);
      anyManifestUpdated = true;
    } catch (error) {
      logForDebugging(`[Claude in Chrome] Failed to install manifest at ${manifestPath}: ${error}`);
    }
  }
  if (getPlatform() === "windows") {
    const manifestPath = join2(manifestDirs[0], NATIVE_HOST_MANIFEST_NAME);
    registerWindowsNativeHosts(manifestPath);
  }
  if (anyManifestUpdated) {
    isChromeExtensionInstalled().then((isInstalled) => {
      if (isInstalled) {
        logForDebugging(`[Claude in Chrome] First-time install detected, opening reconnect page in browser`);
        openInChrome(CHROME_EXTENSION_RECONNECT_URL);
      } else {
        logForDebugging(`[Claude in Chrome] First-time install detected, but extension not installed, skipping reconnect`);
      }
    });
  }
}
function registerWindowsNativeHosts(manifestPath) {
  const registryKeys = getAllWindowsRegistryKeys();
  for (const { browser, key } of registryKeys) {
    const fullKey = `${key}\\${NATIVE_HOST_IDENTIFIER}`;
    execFileNoThrowWithCwd("reg", [
      "add",
      fullKey,
      "/ve",
      "/t",
      "REG_SZ",
      "/d",
      manifestPath,
      "/f"
    ]).then((result) => {
      if (result.code === 0) {
        logForDebugging(`[Claude in Chrome] Registered native host for ${browser} in Windows registry: ${fullKey}`);
      } else {
        logForDebugging(`[Claude in Chrome] Failed to register native host for ${browser} in Windows registry: ${result.stderr}`);
      }
    });
  }
}
async function createWrapperScript(command) {
  const platform = getPlatform();
  const chromeDir = join2(getClaudeConfigHomeDir(), "chrome");
  const wrapperPath = platform === "windows" ? join2(chromeDir, "chrome-native-host.bat") : join2(chromeDir, "chrome-native-host");
  const scriptContent = platform === "windows" ? `@echo off
REM Chrome native host wrapper script
REM Generated by Panda Code - do not edit manually
${command}
` : `#!/bin/sh
# Chrome native host wrapper script
# Generated by Panda Code - do not edit manually
exec ${command}
`;
  const existingContent = await readFile(wrapperPath, "utf-8").catch(() => null);
  if (existingContent === scriptContent) {
    return wrapperPath;
  }
  await mkdir(chromeDir, { recursive: true });
  await writeFile(wrapperPath, scriptContent);
  if (platform !== "windows") {
    await chmod(wrapperPath, 493);
  }
  logForDebugging(`[Claude in Chrome] Created Chrome native host wrapper script: ${wrapperPath}`);
  return wrapperPath;
}
function isChromeExtensionInstalled_CACHED_MAY_BE_STALE() {
  isChromeExtensionInstalled().then((isInstalled) => {
    if (!isInstalled) {
      return;
    }
    const config = getGlobalConfig();
    if (config.cachedChromeExtensionInstalled !== isInstalled) {
      saveGlobalConfig((prev) => ({
        ...prev,
        cachedChromeExtensionInstalled: isInstalled
      }));
    }
  });
  const cached = getGlobalConfig().cachedChromeExtensionInstalled;
  return cached ?? false;
}
async function isChromeExtensionInstalled() {
  const browserPaths = getAllBrowserDataPaths();
  if (browserPaths.length === 0) {
    logForDebugging(`[Claude in Chrome] Unsupported platform for extension detection: ${getPlatform()}`);
    return false;
  }
  return isChromeExtensionInstalledPortable(browserPaths, logForDebugging);
}
var CHROME_EXTENSION_RECONNECT_URL = "https://clau.de/chrome/reconnect", NATIVE_HOST_IDENTIFIER = "com.anthropic.claude_code_browser_extension", NATIVE_HOST_MANIFEST_NAME, shouldAutoEnable = undefined;
var init_setup = __esm(() => {
  init_src();
  init_state();
  init_growthbook();
  init_bundledMode();
  init_config();
  init_debug();
  init_envUtils();
  init_execFileNoThrow();
  init_platform();
  init_slowOperations();
  init_common();
  init_prompt();
  init_setupPortable();
  NATIVE_HOST_MANIFEST_NAME = `${NATIVE_HOST_IDENTIFIER}.json`;
});

export { shouldEnableClaudeInChrome, shouldAutoEnableClaudeInChrome, setupClaudeInChrome, isChromeExtensionInstalled, init_setup };
