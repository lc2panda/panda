#!/usr/bin/env node
// Input: bun run build:dist (CI release-panda-on-desk.yml 打包前编译)
// Output: src/**/*.js (CommonJS) — electron-builder packaging 必需的入口产物
// Pos: panda-on-desk dist 编译 wrapper — 容忍跨包 type 错（rootDir 校验失败 ≠ emit 失败）
//
// [NEW-FILE:#20260419-P3T1-02]
// 触发原因：tsc -p tsconfig.build.json 在跨包 import (../../src/desk/types.ts) 报 TS6059
//   但 .js 已写出（noEmitOnError:false 时 emit 实际成功）；需 wrapper 容错让 CI 继续。
// 不可在 tsconfig.build.json 实现：tsc 退码非 0 是 cli 行为，无 cli flag 可禁用。
// 证据：
//   - tsc 6.x emit 行为：https://www.typescriptlang.org/tsconfig/#noEmitOnError
//   - 跨包 rootDir 限制：https://github.com/microsoft/TypeScript/issues/14736
// 影响：仅 release-panda-on-desk workflow（CI build job）调用；本地 dev 不变。

"use strict";

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const tsconfig = path.join(root, "tsconfig.build.json");
const mainJs = path.join(root, "src", "main.js");

console.log("[build-dist] tsc -p tsconfig.build.json (tolerating type errors)");

const tscBin = path.join(root, "node_modules", "typescript", "bin", "tsc");
const result = spawnSync(process.execPath, [tscBin, "-p", tsconfig], {
  cwd: root,
  stdio: "inherit",
});

// tsc 退码非 0 时仍可能 emit（noEmitOnError:false）。
// 唯一硬条件：src/main.js 存在 + 非空。
if (!fs.existsSync(mainJs)) {
  console.error("[build-dist] FATAL: src/main.js was not emitted by tsc");
  process.exit(1);
}

const stat = fs.statSync(mainJs);
if (stat.size === 0) {
  console.error("[build-dist] FATAL: src/main.js is empty (0 bytes)");
  process.exit(1);
}

if (result.status !== 0) {
  console.warn(
    `[build-dist] tsc reported errors (exit ${result.status}) — emit succeeded (main.js ${stat.size} bytes), continuing`
  );
}

console.log(`[build-dist] OK: src/main.js (${stat.size} bytes)`);
process.exit(0);
