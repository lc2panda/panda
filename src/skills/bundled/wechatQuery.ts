// Input: 用户通过 /wechat 命令查询微信数据
// Output: AI 获取 Connector 能力说明后自主查询并回复
// Pos: bundled skill — 微信数据查询入口，桥接 WechatLocalDBConnector
import { registerBundledSkill } from '../bundledSkills.js'

export function registerWechatQuerySkill(): void {
  registerBundledSkill({
    name: 'wechat',
    description:
      'Query WeChat data — sessions, chat history, contacts, search · 微信数据查询 — 会话/聊天/搜索/联系人',
    argumentHint: '[sessions | chat <name> | search <keyword> | contacts [query]]',
    userInvocable: true,
    async getPromptForCommand(args) {
      const trimmed = args.trim()

      // 检测微信数据是否可用
      let dbAvailable = false
      let decryptedPath = ''
      try {
        const { join } = require('path')
        const { homedir } = require('os')
        const { existsSync, readdirSync } = require('fs')
        decryptedPath = join(homedir(), '.pandacc', 'data', 'wechat-decrypted')
        if (existsSync(decryptedPath)) {
          const sessionDb = join(decryptedPath, 'session', 'session.db')
          if (existsSync(sessionDb)) dbAvailable = true
        }
      } catch {}

      if (!dbAvailable) {
        return [{
          type: 'text',
          text: `# 微信数据未就绪

微信本地数据库尚未解密或 Connector 未配置。

## 配置步骤

1. 安装依赖：\`brew install llvm sqlcipher\`
2. 克隆解密工具：\`git clone https://github.com/Thearas/wechat-db-decrypt-macos.git\`
3. 提取密钥：\`PYTHONPATH=$(lldb -P) python3 find_key_memscan.py\`（微信需运行）
4. 解密数据库：\`python3 decrypt_db.py\`
5. 配置 \`~/.pandacc/config/connectors.json\`：
   \`\`\`json
   { "wechat": { "enabled": true, "mode": "local-db", "keysFile": "/path/to/wechat_keys.json" } }
   \`\`\`
6. 重启 panda

详见 README "系统授权与数据解密指南" 章节。`,
        }]
      }

      // 数据可用，构建查询 prompt
      const prompt = `# 微信数据查询

用户请求: ${trimmed || '查看最近会话'}

## 可用数据

微信解密数据库路径: \`${decryptedPath}\`

数据库结构：
- \`session/session.db\` — 会话列表（SessionTable 表：username, unread_count, summary, last_timestamp）
- \`contact/contact.db\` — 联系人（contact 表：username, remark, nick_name）
- \`message/message_N.db\` — 聊天记录（Msg_{md5(username)} 表：local_type, create_time, message_content）

消息类型: 1=文本, 3=图片, 34=语音, 42=名片, 43=视频, 47=表情, 49=链接, 10000=系统

联系人→消息表映射: 表名 = Msg_ + md5(username) 的十六进制

## 操作指南

使用 Bash 工具执行 sqlite3 查询（明文数据库，无需密钥）：

### 查看最近会话
\`\`\`bash
sqlite3 "${decryptedPath}/session/session.db" "SELECT username, unread_count, summary, datetime(last_timestamp, 'unixepoch', 'localtime') as time FROM SessionTable WHERE last_timestamp > 0 ORDER BY last_timestamp DESC LIMIT 20;"
\`\`\`

### 搜索联系人
\`\`\`bash
sqlite3 "${decryptedPath}/contact/contact.db" "SELECT username, remark, nick_name FROM contact WHERE remark LIKE '%关键词%' OR nick_name LIKE '%关键词%' LIMIT 20;"
\`\`\`

### 查看聊天记录（需先找到 username，再计算 md5）
\`\`\`bash
# 1. 找到联系人的 username
sqlite3 "${decryptedPath}/contact/contact.db" "SELECT username, remark, nick_name FROM contact WHERE remark LIKE '%名字%' OR nick_name LIKE '%名字%';"

# 2. 计算表名: echo -n "username" | md5
# 3. 在各 message_N.db 中查找该表
for db in ${decryptedPath}/message/message_*.db; do
  TABLE=$(sqlite3 "$db" "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'Msg_%';" 2>/dev/null | head -1)
  if [ -n "$TABLE" ]; then
    echo "=== $db: $TABLE ==="
    sqlite3 "$db" "SELECT datetime(create_time, 'unixepoch', 'localtime') as time, message_content FROM $TABLE ORDER BY create_time DESC LIMIT 5;" 2>/dev/null
  fi
done
\`\`\`

### 关键词搜索（跨所有会话）
\`\`\`bash
for db in ${decryptedPath}/message/message_*.db; do
  TABLES=$(sqlite3 "$db" "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'Msg_%';" 2>/dev/null)
  for TABLE in $TABLES; do
    RESULTS=$(sqlite3 "$db" "SELECT datetime(create_time, 'unixepoch', 'localtime') as time, message_content FROM $TABLE WHERE message_content LIKE '%关键词%' ORDER BY create_time DESC LIMIT 5;" 2>/dev/null)
    if [ -n "$RESULTS" ]; then
      echo "=== $db / $TABLE ==="
      echo "$RESULTS"
    fi
  done
done
\`\`\`

## 任务

根据用户请求 "${trimmed || '查看最近会话'}"，执行相应的 sqlite3 查询并整理结果。

输出要求：
- 中文展示
- 时间转为本地时间
- 联系人显示备注名（remark），无备注显示昵称（nick_name）
- 群消息中的发送者格式为 "发送者:\\n内容"，需要拆分显示
- 消息类型非文本时标注类型（如 [图片]、[语音]、[链接]）`

      return [{ type: 'text', text: prompt }]
    },
  })
}
