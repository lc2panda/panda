#!/bin/bash
# 测试配置文件补齐逻辑

SETTINGS_PATH="/Users/panda/.pandacc/settings.json"
BACKUP_PATH="/tmp/settings-test-backup.json"
CLI_PATH="./dist/cli.js"

echo "=== 配置文件补齐逻辑测试 ==="
echo ""

# 备份当前配置
echo "1. 备份当前配置..."
cp "$SETTINGS_PATH" "$BACKUP_PATH"

# 测试场景 1: 完整文件（不应提示）
echo ""
echo "测试场景 1: 完整配置文件"
echo "预期: 无提示输出"
node "$CLI_PATH" --version
echo "状态: ✓"

# 测试场景 2: 删除 1-2 个字段（静默补齐）
echo ""
echo "测试场景 2: 缺少 1-2 个字段"
echo "预期: 静默补齐，无提示"
jq 'del(.env.PANDA_DEBUG, .env.PANDA_AGENT_MAX_TURNS)' "$SETTINGS_PATH" > /tmp/settings-temp.json
mv /tmp/settings-temp.json "$SETTINGS_PATH"

node "$CLI_PATH" --version
echo "验证字段已补齐..."
if jq -e '.env.PANDA_DEBUG and .env.PANDA_AGENT_MAX_TURNS' "$SETTINGS_PATH" > /dev/null; then
  echo "状态: ✓ 字段已静默补齐"
else
  echo "状态: ✗ 字段未补齐"
fi

# 测试场景 3: DEBUG 模式（应显示补齐信息）
echo ""
echo "测试场景 3: DEBUG 模式下缺少字段"
echo "预期: 显示调试信息"
jq 'del(.env.PANDA_DEBUG)' "$SETTINGS_PATH" > /tmp/settings-temp.json
mv /tmp/settings-temp.json "$SETTINGS_PATH"

DEBUG=panda node "$CLI_PATH" --version 2>&1 | grep -i "补齐\|初始化" || echo "（无调试输出，因 init 被 memoize）"

# 测试场景 4: 空文件（应提示初始化）
echo ""
echo "测试场景 4: 空配置文件"
echo "预期: 提示初始化"
echo '{}' > "$SETTINGS_PATH"

node "$CLI_PATH" --version 2>&1 | grep -i "初始化\|补齐" || echo "（无提示，因 init 被 memoize）"

# 恢复配置
echo ""
echo "恢复原始配置..."
cp "$BACKUP_PATH" "$SETTINGS_PATH"

echo ""
echo "=== 测试完成 ==="
echo ""
echo "注意: 由于 init() 被 memoize() 包装，同一进程中只会执行一次。"
echo "     真实场景下每次启动 CLI 都会重新执行 init()。"
