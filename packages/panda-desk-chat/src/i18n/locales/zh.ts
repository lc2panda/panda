// Input: none (static catalog)
// Output: zh-CN translation record
// Pos: i18n/locales — default locale, source of truth for all keys

export default {
  // App
  'app.name': 'Panda Code',
  'app.version': '版本',

  // Sidebar
  'sidebar.newChat': '新建对话',
  'sidebar.search': '搜索',
  'sidebar.conversations': '对话',
  'sidebar.sessionHistory': '会话历史',
  'sidebar.agents': 'Agents',
  'sidebar.skills': 'Skills',
  'sidebar.toolsMcp': 'Tools & MCP',
  'sidebar.taskPlan': '任务计划',
  'sidebar.buddy': 'Buddy',
  'sidebar.settings': '设置',
  'sidebar.workspace': '工作区',
  'sidebar.fileBrowser': '文件浏览',
  'sidebar.memoryBank': '记忆库',
  'sidebar.workflows': '工作流',
  'sidebar.today': '今天',
  'sidebar.yesterday': '昨天',
  'sidebar.last7Days': '最近7天',
  'sidebar.last30Days': '最近30天',
  'sidebar.older': '更早',

  // TabBar
  'tabbar.newTab': '新标签页',
  'tabbar.closeTab': '关闭标签页',
  'tabbar.closeOthers': '关闭其他',
  'tabbar.closeAll': '关闭全部',
  'tabbar.duplicate': '复制标签页',
  'tabbar.runningWarning': '此会话正在运行中，确定关闭？',

  // Chat
  'chat.placeholder': '输入消息... (Enter 发送, Shift+Enter 换行)',
  'chat.send': '发送',
  'chat.stop': '停止',
  'chat.thinking': '思考中...',
  'chat.streaming': '生成中...',
  'chat.retry': '重试',
  'chat.copy': '复制',
  'chat.fork': 'Fork 会话',
  'chat.connectionError': '连接已断开，正在重试...',
  'chat.disconnected': '已断开连接',

  // Composer
  'composer.hero.title': '有什么可以帮你的？',
  'composer.hero.subtitle': '我是 Panda Code，你的 AI 编程伙伴',
  'composer.attachments': '附件',
  'composer.slashCommands': '斜杠命令',
  'composer.mentions': '提及',

  // Permission
  'permission.title': '权限请求',
  'permission.allow': '允许',
  'permission.deny': '拒绝',
  'permission.allowSession': '本次会话允许',
  'permission.showDiff': '查看差异',
  'permission.remember': '记住选择',

  // StatusBar
  'statusbar.tokens': 'Tokens',
  'statusbar.cost': '费用',
  'statusbar.model': '模型',
  'statusbar.permission': '权限',
  'statusbar.effort': '强度',
  'statusbar.branch': '分支',
  'statusbar.buddy': 'Buddy',
  'statusbar.mcp': 'MCP',
  'statusbar.sandbox': '沙箱',
  'statusbar.theme': '主题',

  // Settings
  'settings.title': '设置',
  'settings.general': '通用',
  'settings.model': '模型',
  'settings.appearance': '外观',
  'settings.advanced': '高级',
  'settings.language': '语言',
  'settings.theme': '主题',
  'settings.theme.light': '浅色',
  'settings.theme.dark': '深色',
  'settings.theme.system': '跟随系统',
  'settings.theme.matrix': 'Matrix',

  // Inspector
  'inspector.context': '上下文',
  'inspector.files': '文件',
  'inspector.tasks': '任务',
  'inspector.diff': '差异',
  'inspector.preview': '预览',
  'inspector.agents': 'Agents',
  'inspector.sideChat': '侧聊',
  'inspector.buddyLog': 'Buddy 日志',
  'inspector.petState': '宠物状态',

  // Tool calls
  'tool.bash': '终端',
  'tool.read': '读取文件',
  'tool.edit': '编辑文件',
  'tool.write': '写入文件',
  'tool.glob': '搜索文件',
  'tool.grep': '搜索内容',
  'tool.agent': '子 Agent',
  'tool.skill': 'Skill',
  'tool.webSearch': '网络搜索',
  'tool.webFetch': '网络获取',
  'tool.notebook': '笔记本',
  'tool.task': '任务',
  'tool.todo': '待办',
  'tool.mcp': 'MCP',
  'tool.sleep': '等待',
  'tool.askUser': '询问用户',
  'tool.plan': '计划',

  // Routing
  'routing.switched': '已切换到 {model}',
  'routing.reason': '原因：{reason}',
  'routing.learnMore': '了解更多',
  'routing.disableAutoRouting': '关闭自动路由',

  // Buddy
  'buddy.levelUp': '升级了！',
  'buddy.milestone': '里程碑达成',
  'buddy.speciesUnlock': '新物种解锁',

  // Command palette
  'commandPalette.placeholder': '输入命令...',
  'commandPalette.noResults': '无匹配结果',

  // Session switcher
  'sessionSwitcher.placeholder': '搜索会话...',
  'sessionSwitcher.noResults': '无匹配会话',

  // Common
  'common.confirm': '确认',
  'common.cancel': '取消',
  'common.save': '保存',
  'common.delete': '删除',
  'common.rename': '重命名',
  'common.close': '关闭',
  'common.open': '打开',
  'common.loading': '加载中...',
  'common.error': '错误',
  'common.success': '成功',
  'common.warning': '警告',
  'common.info': '提示',
} as const;
