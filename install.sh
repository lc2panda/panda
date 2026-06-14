#!/usr/bin/env bash
# Input:  无（自动从 GitHub Release 拉取 latest .tgz）
# Output: 全局安装 @lc2panda/panda-code（panda CLI），并自动补齐 bun 运行时
# Pos:    仓库根一行 curl|bash 零门槛安装入口（curl -fsSL .../install.sh | bash）
#
# 一行安装：
#   curl -fsSL https://raw.githubusercontent.com/lc2panda/panda/main/install.sh | bash
#
# 设计：launcher（dist/launcher.cjs）运行 dist/cli.js 需要 bun；缺失则自动装。
#      优先从 GitHub Release 拉公开 .tgz（无需 token），npm install -g 该 tgz。

set -euo pipefail

REPO="lc2panda/panda"
NPM_PKG="@lc2panda/panda-code"

info()  { printf '\033[1;36m==>\033[0m %s\n' "$*"; }
ok()    { printf '\033[1;32m✓\033[0m %s\n' "$*"; }
warn()  { printf '\033[1;33m!\033[0m %s\n' "$*"; }
err()   { printf '\033[1;31m✗\033[0m %s\n' "$*" >&2; }

info "Panda Code 安装器 — 仓库 ${REPO}，包 ${NPM_PKG}"

# ── 1. 检测 / 安装 bun（launcher 运行 cli.js 必需）──────────────────────────
if command -v bun >/dev/null 2>&1; then
  ok "bun 已就绪：$(command -v bun) ($(bun --version 2>/dev/null || echo '?'))"
elif [ -x "$HOME/.bun/bin/bun" ]; then
  export PATH="$HOME/.bun/bin:$PATH"
  ok "bun 已就绪（~/.bun/bin）：$($HOME/.bun/bin/bun --version 2>/dev/null || echo '?')"
else
  warn "未检测到 bun，开始自动安装（https://bun.sh/install）..."
  curl -fsSL https://bun.sh/install | bash
  export BUN_INSTALL="${BUN_INSTALL:-$HOME/.bun}"
  export PATH="$BUN_INSTALL/bin:$PATH"
  if command -v bun >/dev/null 2>&1; then
    ok "bun 安装完成：$(bun --version 2>/dev/null || echo '?')"
  else
    err "bun 安装后仍不可用，请手动把 \$HOME/.bun/bin 加入 PATH 后重试。"
    exit 1
  fi
fi

# ── 2. 检测 npm（全局安装 tgz 依赖 npm）─────────────────────────────────────
if ! command -v npm >/dev/null 2>&1; then
  err "未检测到 npm。请先安装 Node.js（含 npm）：https://nodejs.org/ ，然后重新运行本脚本。"
  exit 1
fi
ok "npm 已就绪：$(npm --version 2>/dev/null || echo '?')"

# ── 3. 解析 latest Release 的 .tgz 下载地址 ────────────────────────────────
TGZ_URL=""
if command -v gh >/dev/null 2>&1; then
  info "通过 gh 解析 latest release 的 .tgz ..."
  TGZ_URL="$(gh release view --repo "$REPO" \
    --json assets \
    -q '.assets[] | select(.name | endswith(".tgz")) | .url' 2>/dev/null | head -n1 || true)"
fi

if [ -z "$TGZ_URL" ]; then
  info "回退：通过 GitHub API 解析 latest release 的 .tgz ..."
  TGZ_URL="$(curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" 2>/dev/null \
    | grep -o '"browser_download_url"[[:space:]]*:[[:space:]]*"[^"]*\.tgz"' \
    | head -n1 \
    | sed -E 's/.*"(https[^"]+\.tgz)".*/\1/' || true)"
fi

# ── 4. 下载 + 全局安装 ──────────────────────────────────────────────────────
if [ -n "$TGZ_URL" ]; then
  ok "找到 tarball：$TGZ_URL"
  TMPDIR_DL="$(mktemp -d)"
  trap 'rm -rf "$TMPDIR_DL"' EXIT
  TGZ_PATH="$TMPDIR_DL/panda-code.tgz"
  info "下载 tarball ..."
  curl -fsSL "$TGZ_URL" -o "$TGZ_PATH"
  info "全局安装：npm install -g <tgz> ..."
  npm install -g "$TGZ_PATH"
else
  warn "未在 latest release 找到 .tgz 资产。"
  warn "回退方案：从 GitHub Packages 安装（需要 GitHub token 配置 ~/.npmrc）："
  warn "  echo '@lc2panda:registry=https://npm.pkg.github.com' >> ~/.npmrc"
  warn "  echo '//npm.pkg.github.com/:_authToken=YOUR_TOKEN' >> ~/.npmrc"
  warn "  npm install -g ${NPM_PKG}"
  exit 1
fi

# ── 5. 验证 ────────────────────────────────────────────────────────────────
if command -v panda >/dev/null 2>&1; then
  ok "安装成功：panda $(panda --version 2>/dev/null || echo '(version 未知)')"
  info "现在可以直接运行：panda"
else
  warn "panda 已安装，但当前 PATH 找不到它。"
  warn "请把 npm 全局 bin 目录加入 PATH："
  warn "  export PATH=\"\$(npm prefix -g)/bin:\$PATH\""
  warn "把上一行加入 ~/.zshrc 或 ~/.bashrc 后重开终端，再运行：panda --version"
  exit 1
fi

# ── 显式 tarball URL 手动安装（备选）─────────────────────────────────────────
#
# 若一行安装失败，可手动指定显式版本 tarball 安装（替换为实际发布版本）：
#
#   npm i -g https://github.com/lc2panda/panda/releases/download/v2.28.0/lc2panda-panda-code-2.28.0.tgz
#
# 或从 GitHub Packages（需 token）：
#   echo '@lc2panda:registry=https://npm.pkg.github.com' >> ~/.npmrc
#   echo '//npm.pkg.github.com/:_authToken=YOUR_TOKEN' >> ~/.npmrc
#   npm install -g @lc2panda/panda-code
