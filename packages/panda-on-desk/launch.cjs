#!/usr/bin/env node
// Input: 用户/系统调用 `node launch.cjs`（或 `npm start`）
// Output: spawn electron 子进程加载本目录作为 app（GUI 模式）；electron 缺失时
//         友好 stderr + exit code 12 区分自身配置错误 vs electron 运行时崩
// Pos: panda-on-desk 启动入口 — 防止从 panda CLI（Electron-based）继承 ELECTRON_RUN_AS_NODE
//
// [NEW-FILE:#20260419-P1-02]
// Forked from clawd-on-desk@4b07658:launch.js (MIT License)
// 2026-04-20 W13-T2 跨平台兼容性硬化 — try/catch require('electron') + exit code 12 + 测试导出

// Cross-platform launcher that ensures Electron runs in GUI mode.
//
// panda CLI (and other Electron-based tools) may set ELECTRON_RUN_AS_NODE=1,
// which forces Electron to behave as a plain Node.js process — the browser
// layer never initializes, so `require("electron").app` is undefined.
//
// This launcher strips that variable before spawning the real Electron binary.

const { spawn } = require("child_process");

// ── exit codes (W13-T2) ────────────────────────────────────────────────────
//   12 = electron 模块缺失（区分于 electron 自身崩溃；CLI 上层可识别后引导
//        `panda --install-desk`）。0/其他 = electron 子进程透传退出码。
const EXIT_ELECTRON_MISSING = 12;

// ── 纯函数 helper（无副作用，可在测试中跨平台 mock process.platform 调用） ──

/** 根据平台返回 spawn 的 argv（linux 加 --no-sandbox 双保险） */
function computeArgs(platform) {
  return platform === "linux"
    ? [".", "--no-sandbox", "--disable-setuid-sandbox"]
    : ["."];
}

/**
 * 根据平台 + 基线 env 返回传给 electron 子进程的 env：
 *   1. 永远剥掉 ELECTRON_RUN_AS_NODE（防止从 panda CLI 继承导致 Electron 退化为 Node）
 *   2. linux 额外注入 ELECTRON_DISABLE_SANDBOX=1 + CHROME_DEVEL_SANDBOX=""
 *
 * 始终返回新对象，不 mutate 入参。
 */
function computeEnv(platform, baseEnv) {
  const env = { ...baseEnv };
  delete env.ELECTRON_RUN_AS_NODE;
  if (platform === "linux") {
    env.ELECTRON_DISABLE_SANDBOX = "1";
    env.CHROME_DEVEL_SANDBOX = "";
  }
  return env;
}

/**
 * 尝试 require('electron')；缺失时通过 stderrWrite 友好提示，
 * 并由 exitFn(EXIT_ELECTRON_MISSING) 终止。返回 electron 路径字符串或 null。
 *
 * 抽出来纯函数化是为了让测试能注入 stderrWrite/exitFn/requireFn 三个 seam，
 * 不真触发 process.exit / 不真撞 require('electron')。
 */
function tryRequireElectron(deps) {
  const requireFn = (deps && deps.requireFn) || require;
  const stderrWrite = (deps && deps.stderrWrite) || ((s) => process.stderr.write(s));
  const exitFn = (deps && deps.exitFn) || ((c) => process.exit(c));
  try {
    return requireFn("electron");
  } catch (err) {
    stderrWrite(
      "[panda-on-desk] electron 未安装。\n" +
        "  跑 `panda --install-desk` 安装桌面端依赖（electron@41 + 同伴 deps）。\n" +
        `  原因: ${err && err.message ? err.message : String(err)}\n`,
    );
    exitFn(EXIT_ELECTRON_MISSING);
    return null;
  }
}

/**
 * 真正的启动逻辑 — 仅在脚本被直接执行时调用。
 * 将 require('electron') + spawn 包成函数让测试可在 require 时不触发副作用。
 */
function main(deps) {
  const platform = (deps && deps.platform) || process.platform;
  const baseEnv = (deps && deps.baseEnv) || process.env;
  const cwd = (deps && deps.cwd) || __dirname;
  const spawnFn = (deps && deps.spawnFn) || spawn;
  const stderrWrite = (deps && deps.stderrWrite) || ((s) => process.stderr.write(s));
  const exitFn = (deps && deps.exitFn) || ((c) => process.exit(c));

  const electron = tryRequireElectron(deps);
  if (!electron) return; // exitFn 已被调用（除非测试 stub 不退出）

  const env = computeEnv(platform, baseEnv);
  const args = computeArgs(platform);

  let child;
  try {
    child = spawnFn(electron, args, {
      stdio: "inherit",
      env,
      cwd,
    });
  } catch (err) {
    stderrWrite(
      "[panda-on-desk] electron 子进程启动失败。\n" +
        `  原因: ${err && err.message ? err.message : String(err)}\n`,
    );
    exitFn(EXIT_ELECTRON_MISSING);
    return;
  }

  if (child && typeof child.on === "function") {
    child.on("error", (err) => {
      stderrWrite(
        "[panda-on-desk] electron 子进程错误: " +
          (err && err.message ? err.message : String(err)) +
          "\n",
      );
      exitFn(EXIT_ELECTRON_MISSING);
    });
    child.on("close", (code) => exitFn(code == null ? 0 : code));
  }

  return child;
}

// ── 导出 ──────────────────────────────────────────────────────────────────
// require('./launch.cjs') 时拿到 helpers，但不触发 spawn 副作用。
module.exports = {
  EXIT_ELECTRON_MISSING,
  computeArgs,
  computeEnv,
  tryRequireElectron,
  main,
};

// ── 直接执行入口 ──────────────────────────────────────────────────────────
// 仅当 `node launch.cjs` 直接运行（require.main === module）时才启动 electron。
// require() 加载时跳过，避免测试夹具触发真实 spawn。
if (require.main === module) {
  main();
}
