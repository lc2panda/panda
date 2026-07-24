#!/usr/bin/env bash
# Input:  仓库根 package.json + dist/（可选预构建）；CONFIRM_MANUAL_RELEASE=1；网络/gh 凭据
# Output: 本地 .tgz +（若 gh 可用）上传到已有 GitHub Release 的 CLI tarball 资产
# Pos:    手动应急「仅 tarball」补丁脚本。官方齐套发版唯一推荐：.github/workflows/release-cli.yml
#
# 一旦我被修改，请更新我的头部注释，以及所属文件夹的 md。
#
# =============================================================================
# ⚠ 强警告：本脚本不是官方发版入口，且功能不完整
# =============================================================================
#
# 官方唯一推荐路径：
#   git tag vX.Y.Z && git push origin vX.Y.Z
#   → .github/workflows/release-cli.yml
#     build → npm pack → gh release create → npm publish (GitHub Packages)
#
# 本脚本只做：npm pack +（可选）gh release upload 一个 tarball。
# 本脚本不会执行：
#   [MISSING] gh release create（Release 必须已存在）
#   [MISSING] npm publish → GitHub Packages / npmjs
#   [MISSING] 安装脚本等其它 Release 资产
#
# 继续执行必须显式设置：
#   CONFIRM_MANUAL_RELEASE=1 ./scripts/release-cli-tarball.sh
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${RED}================================================================${NC}"
echo -e "${RED}  MANUAL TARBALL HELPER — NOT THE OFFICIAL RELEASE PATH${NC}"
echo -e "${RED}================================================================${NC}"
echo -e "${YELLOW}官方入口: .github/workflows/release-cli.yml（push tag v* 触发）${NC}"
echo ""
echo "本脚本缺失 / 不会执行的步骤（相对 CI）："
echo "  [MISSING] gh release create（需要 Release 已存在才能 upload）"
echo "  [MISSING] npm publish → GitHub Packages / npmjs.org"
echo "  [MISSING] 其它 Release 资产（安装脚本等）"
echo "  [ONLY   ] npm pack + 可选 gh release upload tarball"
echo ""

if [[ "${CONFIRM_MANUAL_RELEASE:-}" != "1" ]]; then
  echo -e "${RED}已中止：未设置 CONFIRM_MANUAL_RELEASE=1${NC}"
  echo "应急补传 tarball："
  echo "  CONFIRM_MANUAL_RELEASE=1 $0"
  echo "齐套发版请走 CI tag，不要依赖本脚本。"
  exit 1
fi

echo -e "${YELLOW}CONFIRM_MANUAL_RELEASE=1 已确认 — 继续应急 tarball 路径${NC}"
echo ""

VERSION="$(node -p "require('./package.json').version")"
TGZ_NAME="panda-code-${VERSION}.tgz"
ASSET_NAME="panda-code-${VERSION}.tgz"
TAG="v${VERSION}"

echo "==> Building CLI for ${VERSION}"
bun run build

echo "==> Packing npm tarball"
npm pack --pack-destination "$ROOT"
PACKED="$(ls -1 "$ROOT"/lc2panda-panda-code-*.tgz | tail -1)"
if [[ -z "${PACKED}" || ! -f "${PACKED}" ]]; then
  echo "npm pack failed: tarball not found" >&2
  exit 1
fi

# Normalize name for release asset
cp "${PACKED}" "${ROOT}/${ASSET_NAME}"
echo "    packed: ${PACKED}"
echo "    asset:  ${ASSET_NAME}"

if ! command -v gh >/dev/null 2>&1; then
  echo "gh not found; tarball left at ${ROOT}/${ASSET_NAME}"
  echo -e "${YELLOW}提醒：仍需手动 npm publish（Packages + 如需 npmjs）与确认 Release 存在。${NC}"
  exit 0
fi

if gh release view "${TAG}" >/dev/null 2>&1; then
  echo "==> Uploading ${ASSET_NAME} to existing release ${TAG}"
  gh release upload "${TAG}" "${ROOT}/${ASSET_NAME}" --clobber
  echo "    uploaded to ${TAG}"
else
  echo "Release ${TAG} not found."
  echo -e "${RED}[MISSING] gh release create ${TAG}${NC}"
  echo "Create the release first (or push tag to let release-cli.yml do the full flow),"
  echo "then re-run with CONFIRM_MANUAL_RELEASE=1. Tarball kept at ${ROOT}/${ASSET_NAME}"
  exit 1
fi

echo ""
echo -e "${YELLOW}tarball 步骤完成 — 发版仍可能不齐套。请确认：${NC}"
echo "  [ ] npm publish → https://npm.pkg.github.com （用户默认更新源）"
echo "  [ ] 如需公网 npm：npm publish → registry.npmjs.org"
echo "  [ ] gh release view ${TAG} 资产齐全"
echo "推荐下次直接：git push origin ${TAG} 触发 release-cli.yml"
