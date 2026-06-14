#!/usr/bin/env bash
# Input:  无（自动读取 package.json#version）；可选环境变量 SKIP_UPLOAD=1
# Output: 在仓库根生成 lc2panda-panda-code-<version>.tgz，并（默认）用 gh release upload
#         挂载到 GitHub Release v<version>（补零 token 安装缺口，配合根 install.sh）
# Pos:    发版工具链 — npm pack → gh release upload .tgz（R3 调用）
#
# 用法：
#   bash scripts/release-cli-tarball.sh            # pack + 上传到 v<version>
#   SKIP_UPLOAD=1 bash scripts/release-cli-tarball.sh  # 仅 pack，打印 tgz 路径
#
# 前置（上传时）：
#   - dist/ 已 build（npm pack 会按 package.json#files 打包，需先 bun run build）
#   - gh 已认证（gh auth status）且 Release v<version> 已存在
#
# 说明：本脚本只负责 CLI tarball 的 pack + 挂载，不做 git tag / npm publish；
#       那些由 publish-final.sh / R3 发版主流程负责。

set -euo pipefail

cd "$(dirname "$0")/.."

REPO="lc2panda/panda"
VERSION="$(node -p "require('./package.json').version")"
TAG="v${VERSION}"
# npm pack 对 scoped 包生成的文件名：@scope/name → scope-name-version.tgz
TGZ_NAME="lc2panda-panda-code-${VERSION}.tgz"

echo "==> 时间锚点：$(date '+%Y-%m-%d %H:%M:%S %z')"
echo "==> 包版本：@lc2panda/panda-code@${VERSION}（tag ${TAG}）"

# ── 1. npm pack 生成 tarball ────────────────────────────────────────────────
echo "==> npm pack（生成 ${TGZ_NAME}）..."
rm -f "${TGZ_NAME}"
PACKED="$(npm pack 2>/dev/null | tail -n1)"

if [ ! -f "${PACKED}" ]; then
  echo "✗ npm pack 未生成预期文件（got: '${PACKED}'）" >&2
  exit 1
fi
echo "✓ tarball 已生成：${PACKED} ($(du -h "${PACKED}" | cut -f1))"

TGZ_PATH="$(cd "$(dirname "${PACKED}")" && pwd)/$(basename "${PACKED}")"

# ── 2.（可选）上传到 GitHub Release ──────────────────────────────────────────
if [ "${SKIP_UPLOAD:-0}" = "1" ]; then
  echo "==> SKIP_UPLOAD=1，跳过上传。"
  echo "TGZ_PATH=${TGZ_PATH}"
  exit 0
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "✗ 未检测到 gh CLI，无法上传。tarball 已就绪：${TGZ_PATH}" >&2
  echo "  手动上传：gh release upload ${TAG} ${TGZ_PATH} --repo ${REPO} --clobber" >&2
  exit 1
fi

echo "==> gh release upload ${TAG} ${PACKED} --repo ${REPO} --clobber ..."
gh release upload "${TAG}" "${TGZ_PATH}" --repo "${REPO}" --clobber

echo ""
echo "✓ 上传完成：${TGZ_NAME} → GitHub Release ${TAG}"
echo "  一行安装可用：curl -fsSL https://raw.githubusercontent.com/${REPO}/main/install.sh | bash"
echo "  显式安装：npm i -g https://github.com/${REPO}/releases/download/${TAG}/${TGZ_NAME}"
