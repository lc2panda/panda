// @bun
import {
  LoadingState,
  init_LoadingState
} from "./chunk-7dq274ma.js";
import {
  flushSessionStorage,
  gracefulShutdown,
  init_gracefulShutdown,
  init_sessionStorage
} from "./chunk-ekfe4t3x.js";
import {
  ThemedBox_default,
  ThemedText,
  init_ink,
  require_compiler_runtime,
  use_input_default
} from "./chunk-qjz5kp97.js";
import {
  gte,
  init_semver
} from "./chunk-ps49ymvj.js";
import {
  require_jsx_dev_runtime,
  require_react
} from "./chunk-g338npwr.js";
import {
  init_browser,
  openBrowser
} from "./chunk-j30w257d.js";
import {
  init_file,
  pathExists
} from "./chunk-w5d5b7r0.js";
import {
  require_semver
} from "./chunk-0vkfrmqm.js";
import {
  execFileNoThrow,
  init_execFileNoThrow
} from "./chunk-ehab6nmr.js";
import {
  getCwd,
  init_cwd
} from "./chunk-wgf77cc9.js";
import {
  errorMessage,
  init_debug,
  init_errors,
  logForDebugging
} from "./chunk-cv4r43rj.js";
import {
  getSessionId,
  init_state
} from "./chunk-24stks7b.js";
import {
  __esm,
  __toESM
} from "./chunk-qp2qdcda.js";

// src/utils/desktopDeepLink.ts
import { readdir } from "fs/promises";
import { join } from "path";
function isDevMode() {
  if (true) {
    return true;
  }
  const pathsToCheck = [process.argv[1] || "", process.execPath || ""];
  const buildDirs = [
    "/build-ant/",
    "/build-ant-native/",
    "/build-external/",
    "/build-external-native/"
  ];
  return pathsToCheck.some((p) => buildDirs.some((dir) => p.includes(dir)));
}
function buildDesktopDeepLink(sessionId) {
  const protocol = isDevMode() ? "claude-dev" : "claude";
  const url = new URL(`${protocol}://resume`);
  url.searchParams.set("session", sessionId);
  url.searchParams.set("cwd", getCwd());
  return url.toString();
}
async function isDesktopInstalled() {
  if (isDevMode()) {
    return true;
  }
  const platform = process.platform;
  if (platform === "darwin") {
    return pathExists("/Applications/Claude.app");
  } else if (platform === "linux") {
    const { code, stdout } = await execFileNoThrow("xdg-mime", [
      "query",
      "default",
      "x-scheme-handler/claude"
    ]);
    return code === 0 && stdout.trim().length > 0;
  } else if (platform === "win32") {
    const { code } = await execFileNoThrow("reg", [
      "query",
      "HKEY_CLASSES_ROOT\\claude",
      "/ve"
    ]);
    return code === 0;
  }
  return false;
}
async function getDesktopVersion() {
  const platform = process.platform;
  if (platform === "darwin") {
    const { code, stdout } = await execFileNoThrow("defaults", [
      "read",
      "/Applications/Claude.app/Contents/Info.plist",
      "CFBundleShortVersionString"
    ]);
    if (code !== 0) {
      return null;
    }
    const version = stdout.trim();
    return version.length > 0 ? version : null;
  } else if (platform === "win32") {
    const localAppData = process.env.LOCALAPPDATA;
    if (!localAppData) {
      return null;
    }
    const installDir = join(localAppData, "AnthropicClaude");
    try {
      const entries = await readdir(installDir);
      const versions = entries.filter((e) => e.startsWith("app-")).map((e) => e.slice(4)).filter((v) => import_semver.coerce(v) !== null).sort((a, b) => {
        const ca = import_semver.coerce(a);
        const cb = import_semver.coerce(b);
        return ca.compare(cb);
      });
      return versions.length > 0 ? versions[versions.length - 1] : null;
    } catch {
      return null;
    }
  }
  return null;
}
async function getDesktopInstallStatus() {
  const installed = await isDesktopInstalled();
  if (!installed) {
    return { status: "not-installed" };
  }
  let version;
  try {
    version = await getDesktopVersion();
  } catch {
    return { status: "ready", version: "unknown" };
  }
  if (!version) {
    return { status: "ready", version: "unknown" };
  }
  const coerced = import_semver.coerce(version);
  if (!coerced || !gte(coerced.version, MIN_DESKTOP_VERSION)) {
    return { status: "version-too-old", version };
  }
  return { status: "ready", version };
}
async function openDeepLink(deepLinkUrl) {
  const platform = process.platform;
  logForDebugging(`Opening deep link: ${deepLinkUrl}`);
  if (platform === "darwin") {
    if (isDevMode()) {
      const { code: code2 } = await execFileNoThrow("osascript", [
        "-e",
        `tell application "Electron" to open location "${deepLinkUrl}"`
      ]);
      return code2 === 0;
    }
    const { code } = await execFileNoThrow("open", [deepLinkUrl]);
    return code === 0;
  } else if (platform === "linux") {
    const { code } = await execFileNoThrow("xdg-open", [deepLinkUrl]);
    return code === 0;
  } else if (platform === "win32") {
    const { code } = await execFileNoThrow("cmd", [
      "/c",
      "start",
      "",
      deepLinkUrl
    ]);
    return code === 0;
  }
  return false;
}
async function openCurrentSessionInDesktop() {
  const sessionId = getSessionId();
  const installed = await isDesktopInstalled();
  if (!installed) {
    return {
      success: false,
      error: "Claude Desktop is not installed. Install it from https://claude.ai/download"
    };
  }
  const deepLinkUrl = buildDesktopDeepLink(sessionId);
  const opened = await openDeepLink(deepLinkUrl);
  if (!opened) {
    return {
      success: false,
      error: "Failed to open Claude Desktop. Please try opening it manually.",
      deepLinkUrl
    };
  }
  return { success: true, deepLinkUrl };
}
var import_semver, MIN_DESKTOP_VERSION = "1.1.2396";
var init_desktopDeepLink = __esm(() => {
  init_state();
  init_cwd();
  init_debug();
  init_execFileNoThrow();
  init_file();
  init_semver();
  import_semver = __toESM(require_semver(), 1);
});

// src/components/DesktopHandoff.tsx
function getDownloadUrl() {
  switch (process.platform) {
    case "win32":
      return "https://claude.ai/api/desktop/win32/x64/exe/latest/redirect";
    default:
      return "https://claude.ai/api/desktop/darwin/universal/dmg/latest/redirect";
  }
}
function DesktopHandoff(t0) {
  const $ = import_compiler_runtime.c(20);
  const {
    onDone
  } = t0;
  const [state, setState] = import_react.useState("checking");
  const [error, setError] = import_react.useState(null);
  const [downloadMessage, setDownloadMessage] = import_react.useState("");
  let t1;
  if ($[0] !== error || $[1] !== onDone || $[2] !== state) {
    t1 = (input) => {
      if (state === "error") {
        onDone(error ?? "Unknown error", {
          display: "system"
        });
        return;
      }
      if (state === "prompt-download") {
        if (input === "y" || input === "Y") {
          openBrowser(getDownloadUrl()).catch(_temp);
          onDone(`Starting download. Re-run /desktop once you\u2019ve installed the app.
Learn more at ${DESKTOP_DOCS_URL}`, {
            display: "system"
          });
        } else {
          if (input === "n" || input === "N") {
            onDone(`The desktop app is required for /desktop. Learn more at ${DESKTOP_DOCS_URL}`, {
              display: "system"
            });
          }
        }
      }
    };
    $[0] = error;
    $[1] = onDone;
    $[2] = state;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  use_input_default(t1);
  let t2;
  let t3;
  if ($[4] !== onDone) {
    t2 = () => {
      const performHandoff = async function performHandoff2() {
        setState("checking");
        const installStatus = await getDesktopInstallStatus();
        if (installStatus.status === "not-installed") {
          setDownloadMessage("Claude Desktop is not installed.");
          setState("prompt-download");
          return;
        }
        if (installStatus.status === "version-too-old") {
          setDownloadMessage(`Claude Desktop needs to be updated (found v${installStatus.version}, need v1.1.2396+).`);
          setState("prompt-download");
          return;
        }
        setState("flushing");
        await flushSessionStorage();
        setState("opening");
        const result = await openCurrentSessionInDesktop();
        if (!result.success) {
          setError(result.error ?? "Failed to open Claude Desktop");
          setState("error");
          return;
        }
        setState("success");
        setTimeout(_temp2, 500, onDone);
      };
      performHandoff().catch((err) => {
        setError(errorMessage(err));
        setState("error");
      });
    };
    t3 = [onDone];
    $[4] = onDone;
    $[5] = t2;
    $[6] = t3;
  } else {
    t2 = $[5];
    t3 = $[6];
  }
  import_react.useEffect(t2, t3);
  if (state === "error") {
    let t42;
    if ($[7] !== error) {
      t42 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        color: "error",
        children: [
          "Error: ",
          error
        ]
      }, undefined, true, undefined, this);
      $[7] = error;
      $[8] = t42;
    } else {
      t42 = $[8];
    }
    let t52;
    if ($[9] === Symbol.for("react.memo_cache_sentinel")) {
      t52 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        dimColor: true,
        children: "Press any key to continue\u2026"
      }, undefined, false, undefined, this);
      $[9] = t52;
    } else {
      t52 = $[9];
    }
    let t62;
    if ($[10] !== t42) {
      t62 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
        flexDirection: "column",
        paddingX: 2,
        children: [
          t42,
          t52
        ]
      }, undefined, true, undefined, this);
      $[10] = t42;
      $[11] = t62;
    } else {
      t62 = $[11];
    }
    return t62;
  }
  if (state === "prompt-download") {
    let t42;
    if ($[12] !== downloadMessage) {
      t42 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        children: downloadMessage
      }, undefined, false, undefined, this);
      $[12] = downloadMessage;
      $[13] = t42;
    } else {
      t42 = $[13];
    }
    let t52;
    if ($[14] === Symbol.for("react.memo_cache_sentinel")) {
      t52 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        children: "Download now? (y/n)"
      }, undefined, false, undefined, this);
      $[14] = t52;
    } else {
      t52 = $[14];
    }
    let t62;
    if ($[15] !== t42) {
      t62 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
        flexDirection: "column",
        paddingX: 2,
        children: [
          t42,
          t52
        ]
      }, undefined, true, undefined, this);
      $[15] = t42;
      $[16] = t62;
    } else {
      t62 = $[16];
    }
    return t62;
  }
  let t4;
  if ($[17] === Symbol.for("react.memo_cache_sentinel")) {
    t4 = {
      checking: "Checking for Claude Desktop\u2026",
      flushing: "Saving session\u2026",
      opening: "Opening Claude Desktop\u2026",
      success: "Opening in Claude Desktop\u2026"
    };
    $[17] = t4;
  } else {
    t4 = $[17];
  }
  const messages = t4;
  const t5 = messages[state];
  let t6;
  if ($[18] !== t5) {
    t6 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(LoadingState, {
      message: t5
    }, undefined, false, undefined, this);
    $[18] = t5;
    $[19] = t6;
  } else {
    t6 = $[19];
  }
  return t6;
}
async function _temp2(onDone_0) {
  onDone_0("Session transferred to Claude Desktop", {
    display: "system"
  });
  await gracefulShutdown(0, "other");
}
function _temp() {}
var import_compiler_runtime, import_react, jsx_dev_runtime, DESKTOP_DOCS_URL = "https://clau.de/desktop";
var init_DesktopHandoff = __esm(() => {
  init_ink();
  init_browser();
  init_desktopDeepLink();
  init_errors();
  init_gracefulShutdown();
  init_sessionStorage();
  init_LoadingState();
  import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
  import_react = __toESM(require_react(), 1);
  jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
});

export { DesktopHandoff, init_DesktopHandoff };
