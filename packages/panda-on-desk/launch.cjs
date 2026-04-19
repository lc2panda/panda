#!/usr/bin/env node
// Input: 用户/系统调用 `node launch.cjs`（或 `npm start`）
// Output: spawn electron 子进程加载本目录作为 app（GUI 模式）
// Pos: panda-on-desk 启动入口 — 防止从 panda CLI（Electron-based）继承 ELECTRON_RUN_AS_NODE
//
// [NEW-FILE:#20260419-P1-02]
// Forked from clawd-on-desk@4b07658:launch.js (MIT License)

// Cross-platform launcher that ensures Electron runs in GUI mode.
//
// panda CLI (and other Electron-based tools) may set ELECTRON_RUN_AS_NODE=1,
// which forces Electron to behave as a plain Node.js process — the browser
// layer never initializes, so `require("electron").app` is undefined.
//
// This launcher strips that variable before spawning the real Electron binary.

const { spawn } = require("child_process");
const path = require("path");
const electron = require("electron");

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;
if (process.platform === "linux") {
  // Some Linux environments still trip Chromium sandbox initialization even
  // with argv flags; force-disable via env too for reliability.
  env.ELECTRON_DISABLE_SANDBOX = "1";
  env.CHROME_DEVEL_SANDBOX = "";
}

const args = process.platform === "linux"
  ? [".", "--no-sandbox", "--disable-setuid-sandbox"]
  : ["."];
const child = spawn(electron, args, {
  stdio: "inherit",
  env,
  cwd: __dirname,
});

child.on("close", (code) => process.exit(code ?? 0));
