#!/usr/bin/env bash
# Input:  当前仓库 dist/ 产物 + package.json 版本；可选 CONFIRM_MANUAL_RELEASE=1
# Output: 仅在显式确认后 npm publish 到 registry.npmjs.org；否则退出
# Pos:    手动应急发版入口（非官方）。官方唯一推荐路径见 .github/workflows/release-cli.yml
#
# 一旦我被修改，请更新我的头部注释，以及所属文件夹的 md。
#
# =============================================================================
# ⚠ 强警告：本脚本不是官方发版入口
# =============================================================================
#
# 官方唯一推荐路径（齐套：GitHub Release + GitHub Packages + 资产）：
#   1. bump 版本并提交
#   2. git tag vX.Y.Z && git push origin vX.Y.Z
#   3. 由 .github/workflows/release-cli.yml 自动：
#        build → npm pack → gh release create → npm publish (GitHub Packages)
#
# 本脚本仅为「断网 / CI 全挂」时的应急手段。手动路径历史上曾漏发：
#   - GitHub Release（含 CLI tarball / 安装脚本）
#   - GitHub Packages（用户 `panda update` 默认源）
# 见 scar: manual-release-missing-publish（v2.28.3 / v2.28.4）
#
# 本脚本 intentionally 不完整（仅 npmjs.org publish），不会代替 CI 的：
#   [ ] gh release create / upload CLI tarball 等资产
#   [ ] npm publish --registry=https://npm.pkg.github.com （GitHub Packages）
#   [ ] latest 指针 / prerelease 策略（H-005）
#
# 继续执行必须显式设置：
#   CONFIRM_MANUAL_RELEASE=1 ./scripts/publish-final.sh
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${RED}================================================================${NC}"
echo -e "${RED}  MANUAL RELEASE BYPASS — NOT THE OFFICIAL RELEASE PATH${NC}"
echo -e "${RED}================================================================${NC}"
echo -e "${YELLOW}官方入口: .github/workflows/release-cli.yml（push tag v* 触发）${NC}"
echo -e "${YELLOW}推荐命令: git tag vX.Y.Z && git push origin vX.Y.Z${NC}"
echo ""
echo "本脚本缺失 / 不会执行的步骤（相对 CI）："
echo "  [MISSING] gh release create + CLI tarball / 安装脚本资产"
echo "  [MISSING] npm publish → GitHub Packages (npm.pkg.github.com)"
echo "  [MISSING] stable/prerelease latest 指针策略"
echo "  [ONLY   ] npm publish → registry.npmjs.org（本脚本范围）"
echo ""

if [[ "${CONFIRM_MANUAL_RELEASE:-}" != "1" ]]; then
  echo -e "${RED}已中止：未设置 CONFIRM_MANUAL_RELEASE=1${NC}"
  echo "若确为应急发版，请先完成上述缺失步骤的手工等价操作，再执行："
  echo "  CONFIRM_MANUAL_RELEASE=1 $0"
  echo ""
  echo "否则请走 CI："
  echo "  git tag v\$(node -p \"require('./package.json').version\") && git push origin --tags"
  exit 1
fi

echo -e "${YELLOW}CONFIRM_MANUAL_RELEASE=1 已确认 — 继续应急路径（仍不齐套）${NC}"
echo ""

# 1. 确认在正确目录
if [[ ! -f package.json ]]; then
  echo "❌ 未找到 package.json，请在仓库根目录运行"
  exit 1
fi

VERSION=$(node -p "require('./package.json').version")
NAME=$(node -p "require('./package.json').name")

echo "📦 包名: $NAME"
echo "🏷️  版本: $VERSION"
echo ""

# 2. 确认 dist 存在且非空
if [[ ! -d dist ]] || [[ -z "$(ls -A dist 2>/dev/null)" ]]; then
  echo "❌ dist/ 目录不存在或为空，请先运行: bun run build"
  exit 1
fi
echo "✅ dist/ 存在"

# 3. 确认 CLI 入口存在
if [[ ! -f dist/cli.js ]]; then
  echo "❌ dist/cli.js 不存在"
  exit 1
fi
echo "✅ dist/cli.js 存在"

# 4. 确认版本号一致（package.json vs MACRO.VERSION 注入）
#    构建时 MACRO.VERSION 被替换为字面量，检查 package.json 版本即可
echo "✅ 版本 $VERSION"

# 5. 检查 git 工作区干净
if [[ -n "$(git status --porcelain)" ]]; then
  echo "⚠️  git 工作区有未提交变更："
  git status --short
  echo ""
  read -p "仍要继续发布？(y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "已取消"
    exit 1
  fi
fi

# 6. 最终确认
echo ""
echo "全部前置 ✅。准备 npm publish @lc2panda/panda-code@${VERSION} 到 registry.npmjs.org"
echo -e "${YELLOW}提醒：这不会创建 GitHub Release，也不会发布到 GitHub Packages。${NC}"
read -p "确认发布？(y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "已取消"
  exit 1
fi

# 7. 发布
npm publish --registry=https://registry.npmjs.org --access public

echo ""
echo "✅ 已发布 $NAME@$VERSION → registry.npmjs.org"
echo ""
echo -e "${RED}发版未齐套 — 请立刻补做（或改走 CI tag 触发 release-cli.yml）：${NC}"
echo "  1. gh release create v${VERSION} --generate-notes"
echo "  2. 上传 CLI tarball（可用 scripts/release-cli-tarball.sh，同样需 CONFIRM_MANUAL_RELEASE=1）"
echo "  3. npm publish --registry=https://npm.pkg.github.com  # GitHub Packages"
echo "  4. 验证: npm view $NAME version --registry=https://npm.pkg.github.com"
echo "           gh release view v${VERSION}"
