- `index.ts` — 飞书/Lark 连接器实现：消息收发与平台适配
- `sendNotification.test.ts` — sendNotification 功能单元测试
- 地位：connectors 子模块，负责飞书通道接入

## 功能
- 消息收发（MCP 模式 + API 模式）
- 通知推送（API 模式，需配置 `extra.chatId`）
- 日历、文档、联系人、审批等数据读取（部分功能）

## 配置说明
### 通知推送配置
在 `~/.pandacc/config/connectors.json` 中配置飞书 connector：

```json
{
  "feishu": {
    "platform": "feishu",
    "mode": "api",
    "appId": "cli_xxxxxxxxxxxxxxx",
    "appSecret": "xxxxxxxxxxxxxxxxxxxxxx",
    "extra": {
      "chatId": "oc_xxxxxxxxxxxxxxxxxxxxxx"
    }
  }
}
```

- `chatId`：通知目标群聊或个人的 chat_id（可通过飞书开放平台获取）
- 未配置 `chatId` 时 `sendNotification` 会跳过发送

### 获取 chat_id
1. 进入飞书开发者后台：https://open.feishu.cn/app
2. 选择你的应用 → API 调试 → 获取群列表 `/im/v1/chats`
3. 复制目标群的 `chat_id`（格式：`oc_xxxxxx`）

*"一旦这里的结构发生变化，请务必更新我... 就像重新标记领地一样。"*
