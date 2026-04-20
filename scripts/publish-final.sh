#!/usr/bin/env bash
# Input:  无（自动读取 package.json#version）
# Output: npmjs.org 上发布 @lc2panda/panda-code@<version>
# Pos:    指挥官 mac 端一键发布脚本（23h 无人值守 W23 终版交接）
#
# 用途：Windows 端 23h 无人值守缺 npmjs.org auth，
#      指挥官回到 mac 端跑此脚本即可一键发布最新已 commit + tag 的版本。
#
# 前置：
#   1. mac 端 ~/.npmrc 已 npm login 至 https://registry.npmjs.org
#   2. 当前已 git pull origin main（最新到 v2.25.33）
#
# 步骤（全自动，全程绿灯才发布）：
#   - 0. 时间戳显示
#   - 1. version 一致性校验（package.json vs git tag）
#   - 2. 红线守护：anthropic byte-equal vs main
#   - 3. rm -rf dist && bun run build
#   - 4. bun test 全量（必须 0 fail）
#   - 5. npm pack --dry-run 体积摸底
#   - 6. 提示确认 → npm publish --registry=https://registry.npmjs.org

set -euo pipefail

cd "$(dirname "$0")/.."

VERSION=$(node -p "require('./package.json').version")
echo "==> 时间锚点：$(date '+%Y-%m-%d %H:%M:%S %z')"
echo "==> 待发布：@lc2panda/panda-code@${VERSION}"

# 1. tag 一致性
if ! git tag --list "v${VERSION}" | grep -q "v${VERSION}"; then
  echo "❌ 本地无 tag v${VERSION}，先 git pull --tags"
  exit 1
fi
echo "✅ tag v${VERSION} 存在"

# 2. 红线守护
RED_DIFF=$(git diff main -- src/services/api/claude.ts src/services/oauth src/services/api/providers.ts | wc -l | tr -d ' ')
if [ "$RED_DIFF" != "0" ]; then
  echo "❌ 红线触碰：anthropic byte-equal diff = ${RED_DIFF} 行"
  exit 1
fi
echo "✅ anthropic byte-equal 守护通过（0 行 diff）"

# 3. build
echo "==> rm -rf dist && bun run build"
rm -rf dist
bun run build

# 4. 测试
echo "==> bun test 全量"
bun test 2>&1 | tail -5

# 5. pack 摸底
echo "==> npm pack --dry-run"
npm pack --dry-run 2>&1 | tail -10

# 6. 确认 + publish
echo ""
echo "全部前置 ✅。准备 npm publish @lc2panda/panda-code@${VERSION} 到 registry.npmjs.org"
read -p "确认发布？(y/N) " CONFIRM
if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
  echo "❌ 取消"
  exit 0
fi

npm publish --registry=https://registry.npmjs.org --access public

echo ""
echo "✅ 发布完成：@lc2panda/panda-code@${VERSION}"
echo "   验证：npm view @lc2panda/panda-code version --registry=https://registry.npmjs.org"
