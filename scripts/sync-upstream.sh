#!/usr/bin/env bash
# Input:  起始版本 (如 v2.1.165) 和目标版本 (如 v2.1.170)，可选 --dry-run 标志
# Output: 自动 cherry-pick upstream commits，生成冲突报告和同步摘要
# Pos:    上游同步自动化工具 — 批量 cherry-pick upstream/main 版本范围内的 commits
#
# 用法：
#   bash scripts/sync-upstream.sh v2.1.165 v2.1.170            # 实际执行 cherry-pick
#   bash scripts/sync-upstream.sh v2.1.165 v2.1.170 --dry-run # 仅列出 commits，不执行
#
# 前置：
#   - 已配置 upstream remote：git remote add upstream https://github.com/cline/cline.git
#   - 当前工作区干净（无未提交变更）
#   - 目标分支已切换（通常是 main）
#
# 说明：
#   - 自动检测 upstream remote 配置
#   - 逐个 cherry-pick commits，检测冲突
#   - 生成详细冲突报告（文件路径、冲突类型）
#   - 输出同步摘要（成功/失败/跳过/需人工处理）

set -euo pipefail

cd "$(dirname "$0")/.."

# ── 颜色定义 ────────────────────────────────────────────────────────────────
G='\033[32m'  # 绿色
Y='\033[33m'  # 黄色
R='\033[31m'  # 红色
C='\033[36m'  # 青色
D='\033[2m'   # 暗淡
B='\033[1m'   # 粗体
NC='\033[0m'  # 重置

# ── 参数解析 ────────────────────────────────────────────────────────────────
if [ $# -lt 2 ]; then
  echo -e "${R}用法: $0 <起始版本> <目标版本> [--dry-run]${NC}" >&2
  echo -e "示例: $0 v2.1.165 v2.1.170" >&2
  exit 1
fi

START_VERSION="$1"
END_VERSION="$2"
DRY_RUN=0

if [ $# -ge 3 ] && [ "$3" = "--dry-run" ]; then
  DRY_RUN=1
fi

echo -e "${B}==> 时间锚点：$(date '+%Y-%m-%d %H:%M:%S %z')${NC}"
echo -e "${B}==> 同步范围：${START_VERSION} → ${END_VERSION}${NC}"
[ $DRY_RUN -eq 1 ] && echo -e "${Y}==> 模式：DRY-RUN（仅列出 commits，不执行 cherry-pick）${NC}"

# ── 1. 检查工作区状态 ──────────────────────────────────────────────────────
echo ""
echo -e "${C}[1/7] 检查工作区状态...${NC}"

if ! git diff-index --quiet HEAD -- 2>/dev/null; then
  echo -e "${R}✗ 工作区有未提交变更，请先 commit 或 stash${NC}" >&2
  git status --short
  exit 1
fi
echo -e "${G}✓ 工作区干净${NC}"

CURRENT_BRANCH=$(git branch --show-current)
echo -e "${D}当前分支：${CURRENT_BRANCH}${NC}"

# ── 2. 检查 upstream remote 配置 ───────────────────────────────────────────
echo ""
echo -e "${C}[2/7] 检查 upstream remote 配置...${NC}"

if ! git remote get-url upstream >/dev/null 2>&1; then
  echo -e "${R}✗ 未检测到 upstream remote，请先配置：${NC}" >&2
  echo -e "${Y}  git remote add upstream https://github.com/cline/cline.git${NC}" >&2
  exit 1
fi

UPSTREAM_URL=$(git remote get-url upstream)
echo -e "${G}✓ upstream remote 已配置${NC}"
echo -e "${D}  URL: ${UPSTREAM_URL}${NC}"

# ── 3. fetch upstream ──────────────────────────────────────────────────────
echo ""
echo -e "${C}[3/7] git fetch upstream...${NC}"
git fetch upstream --tags

# ── 4. 验证版本标签存在 ────────────────────────────────────────────────────
echo ""
echo -e "${C}[4/7] 验证版本标签...${NC}"

for tag in "$START_VERSION" "$END_VERSION"; do
  if ! git rev-parse "$tag" >/dev/null 2>&1; then
    echo -e "${R}✗ 标签 ${tag} 不存在${NC}" >&2
    echo -e "${Y}提示：尝试 git fetch upstream --tags${NC}" >&2
    exit 1
  fi
done
echo -e "${G}✓ 版本标签有效${NC}"

# ── 5. 列出 commits ────────────────────────────────────────────────────────
echo ""
echo -e "${C}[5/7] 列出 commits (${START_VERSION}..${END_VERSION})...${NC}"

# 使用 rev-list 获取 commit 列表（从旧到新）
COMMITS=$(git rev-list --reverse "${START_VERSION}..${END_VERSION}")
COMMIT_COUNT=$(echo "$COMMITS" | wc -l | tr -d ' ')

if [ -z "$COMMITS" ] || [ "$COMMIT_COUNT" -eq 0 ]; then
  echo -e "${Y}⚠ 范围内无新 commits${NC}"
  exit 0
fi

echo -e "${G}✓ 找到 ${COMMIT_COUNT} 个 commits${NC}"
echo ""
echo -e "${D}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 预览前 10 个 commits
echo "$COMMITS" | head -10 | while read -r sha; do
  subject=$(git log -1 --format='%s' "$sha")
  short_sha=$(git rev-parse --short "$sha")
  echo -e "${D}  ${short_sha}${NC} ${subject}"
done

if [ "$COMMIT_COUNT" -gt 10 ]; then
  echo -e "${D}  ... 以及其他 $((COMMIT_COUNT - 10)) 个 commits${NC}"
fi
echo -e "${D}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ $DRY_RUN -eq 1 ]; then
  echo ""
  echo -e "${Y}DRY-RUN 模式结束。完整 commit 列表：${NC}"
  echo "$COMMITS" | while read -r sha; do
    subject=$(git log -1 --format='%s' "$sha")
    author=$(git log -1 --format='%an' "$sha")
    date=$(git log -1 --format='%ad' --date=short "$sha")
    echo -e "${Y}${sha:0:7}${NC} ${date} ${D}${author}${NC}"
    echo -e "  ${subject}"
  done
  exit 0
fi

# ── 6. 执行 cherry-pick ────────────────────────────────────────────────────
echo ""
echo -e "${C}[6/7] 开始 cherry-pick...${NC}"

SUCCESS_COUNT=0
CONFLICT_COUNT=0
SKIP_COUNT=0
CONFLICT_REPORT=""

while IFS= read -r sha; do
  subject=$(git log -1 --format='%s' "$sha")
  short_sha=$(git rev-parse --short "$sha")

  echo ""
  echo -e "${B}正在处理：${short_sha} ${subject}${NC}"

  # 尝试 cherry-pick
  if git cherry-pick "$sha" 2>&1; then
    echo -e "${G}✓ 成功${NC}"
    ((SUCCESS_COUNT++))
  else
    # 检查是否是冲突
    if git status | grep -q "Unmerged paths"; then
      echo -e "${R}✗ 冲突${NC}"
      ((CONFLICT_COUNT++))

      # 收集冲突文件
      CONFLICT_FILES=$(git diff --name-only --diff-filter=U)
      CONFLICT_REPORT+="━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
      CONFLICT_REPORT+="Commit: ${short_sha} ${subject}\n"
      CONFLICT_REPORT+="冲突文件：\n"

      while IFS= read -r file; do
        CONFLICT_REPORT+="  - ${file}\n"
        # 分析冲突类型
        if grep -q "<<<<<<< HEAD" "$file" 2>/dev/null; then
          CONFLICT_REPORT+="    类型: 内容冲突（merge conflict markers）\n"
        fi
      done <<< "$CONFLICT_FILES"

      CONFLICT_REPORT+="\n"

      # 中止当前 cherry-pick
      git cherry-pick --abort
      echo -e "${Y}已中止 cherry-pick，继续下一个...${NC}"
    else
      # 其他错误（如 empty commit）
      echo -e "${Y}⚠ 跳过（可能是空 commit 或已应用）${NC}"
      ((SKIP_COUNT++))
      git cherry-pick --abort 2>/dev/null || true
    fi
  fi
done <<< "$COMMITS"

# ── 7. 生成同步摘要 ────────────────────────────────────────────────────────
echo ""
echo -e "${C}[7/7] 同步摘要${NC}"
echo -e "${D}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${G}✓ 成功：${SUCCESS_COUNT}${NC}"
echo -e "${Y}⚠ 跳过：${SKIP_COUNT}${NC}"
echo -e "${R}✗ 冲突：${CONFLICT_COUNT}${NC}"
echo -e "${D}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ $CONFLICT_COUNT -gt 0 ]; then
  REPORT_FILE="sync-conflicts-$(date '+%Y%m%d-%H%M%S').txt"
  echo ""
  echo -e "${Y}检测到 ${CONFLICT_COUNT} 个冲突，生成冲突报告：${REPORT_FILE}${NC}"
  echo -e "$CONFLICT_REPORT" > "$REPORT_FILE"
  echo -e "${D}查看详情：cat ${REPORT_FILE}${NC}"
  echo ""
  echo -e "${Y}请手动解决冲突后继续，参考：UPSTREAM_SYNC.md${NC}"
  exit 1
fi

if [ $SUCCESS_COUNT -eq 0 ] && [ $SKIP_COUNT -eq $COMMIT_COUNT ]; then
  echo ""
  echo -e "${Y}⚠ 所有 commits 已应用或为空，无需同步${NC}"
  exit 0
fi

echo ""
echo -e "${G}✓ 同步完成！${NC}"
echo -e "${D}提示：运行测试验证变更，参考 UPSTREAM_SYNC.md${NC}"
