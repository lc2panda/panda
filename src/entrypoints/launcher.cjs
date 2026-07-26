#!/usr/bin/env node
// Input: CLI 参数
// Output: 校验必需依赖（Windows 上的 Git），启动 bun 运行 cli.js，或在 bun 环境下直接加载
// Pos: npm 全局安装入口，Node.js 兼容的启动器
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"

// This launcher ensures `panda` works when npm installs globally and
// the system runs it with Node.js instead of Bun. Since dist/cli.js
// is built with `target: "bun"`, it uses Bun-specific APIs that Node
// cannot execute. This script detects the runtime and re-launches
// with Bun if necessary.

"use strict";

// Git is a required dependency: Panda uses it for repository status and
// project detection. On Windows, Git is commonly missing from PATH, which
// previously caused silent hangs. Fail fast with a clear message instead.
// Mirrors the Bun availability check below (execFileSync + exit(1)).
function checkGitInstalled() {
  if (process.platform !== "win32") return;
  try {
    require("child_process").execFileSync("git", ["--version"], {
      stdio: "ignore",
      timeout: 5000,
    });
  } catch {
    console.error(
      "\x1b[31mError: Git is required but not found.\x1b[0m\n\n" +
      "Panda Code requires Git for repository status and project detection.\n\n" +
      "Install Git for Windows:\n" +
      "  https://git-scm.com/download/win\n" +
      "  or run: winget install Git.Git\n" +
      "\nThen restart your terminal and try again."
    );
    process.exit(1);
  }
}

checkGitInstalled();

const isBun = typeof globalThis.Bun !== "undefined";

if (isBun) {
  // Already running under Bun — load the real entry directly
  import("./cli.js");
} else {
  // Running under Node.js — re-exec with Bun
  const { execFileSync, execFile } = require("child_process");
  const path = require("path");
  const cliPath = path.join(__dirname, "cli.js");

  // Find bun binary
  let bunPath = "bun";
  try {
    // Verify bun is available
    execFileSync(bunPath, ["--version"], { stdio: "ignore", timeout: 5000 });
  } catch {
    // Try common install locations
    const candidates = process.platform === "win32"
      ? [
          path.join(process.env.USERPROFILE || "", ".bun", "bin", "bun.exe"),
          path.join(process.env.LOCALAPPDATA || "", "bun", "bun.exe"),
        ]
      : [
          path.join(process.env.HOME || "", ".bun", "bin", "bun"),
          "/usr/local/bin/bun",
        ];

    let found = false;
    for (const candidate of candidates) {
      try {
        require("fs").accessSync(candidate, require("fs").constants.X_OK);
        bunPath = candidate;
        found = true;
        break;
      } catch {}
    }

    if (!found) {
      console.error(
        "\x1b[31mError: Bun runtime is required but not found.\x1b[0m\n\n" +
        "Panda Code requires Bun (https://bun.sh) to run.\n\n" +
        "Install Bun:\n" +
        (process.platform === "win32"
          ? '  powershell -c "irm bun.sh/install.ps1 | iex"\n'
          : '  curl -fsSL https://bun.sh/install | bash\n') +
        "\nThen try again."
      );
      process.exit(1);
    }
  }

  // Spawn bun with the same args, inheriting stdio for full interactivity
  const child = require("child_process").spawn(bunPath, [cliPath, ...process.argv.slice(2)], {
    stdio: "inherit",
    env: process.env,
    // On Windows, use shell to resolve .exe properly
    shell: false,
  });

  child.on("error", (err) => {
    console.error(`\x1b[31mFailed to start Bun: ${err.message}\x1b[0m`);
    process.exit(1);
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
    } else {
      process.exit(code || 0);
    }
  });
}
