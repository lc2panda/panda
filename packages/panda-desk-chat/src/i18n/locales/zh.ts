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
  'sidebar.openInNewWindow': '在新窗口中打开',

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
  'statusbar.dnd': '免打扰',

  // StatusBar — connection states
  'statusbar.connection.connected': '已连接',
  'statusbar.connection.connecting': '连接中',
  'statusbar.connection.disconnected': '未连接',
  'statusbar.connection.error': '连接错误',
  'statusbar.connection.reconnecting': '重连中',

  // StatusBar — permission modes
  'statusbar.permission.default': '默认',
  'statusbar.permission.plan': '计划',
  'statusbar.permission.auto': '自动',
  'statusbar.permission.bypass': '跳过确认',
  'statusbar.permission.default.desc': '执行工具前需确认',
  'statusbar.permission.plan.desc': '计划模式 — 先思考再行动',
  'statusbar.permission.auto.desc': '自动接受安全操作',
  'statusbar.permission.bypass.desc': '跳过所有权限确认',

  // StatusBar — effort levels
  'statusbar.effort.min': '最低',
  'statusbar.effort.low': '低',
  'statusbar.effort.medium': '中',
  'statusbar.effort.high': '高',
  'statusbar.effort.max': '最高',
  'statusbar.effort.min.desc': '快速简洁的回复',
  'statusbar.effort.low.desc': '简要但包含关键细节',
  'statusbar.effort.medium.desc': '平衡的深度',
  'statusbar.effort.high.desc': '详细的分析',
  'statusbar.effort.max.desc': '最大细节与推理深度',

  // Settings
  'settings.title': '设置',
  'settings.general': '通用',
  'settings.model': '模型',
  'settings.appearance': '外观',
  'settings.advanced': '高级',
  'settings.language': '语言',
  'settings.workingDir': '工作目录',
  'settings.workingDirDesc': '设置默认工作目录，新会话将在此目录下运行',
  'settings.workingDirPlaceholder': '选择工作目录…',
  'settings.theme': '主题',
  'settings.themeDesc': '选择浅色、深色或跟随系统偏好',
  'settings.theme.light': '浅色',
  'settings.theme.dark': '深色',
  'settings.theme.system': '跟随系统',
  'settings.theme.matrix': 'Matrix',
  'settings.notifications': '系统通知',
  'settings.notificationsDesc': '收到新消息时显示系统通知',

  // Settings > About > Update
  'settings.about.checkUpdate': '检查更新',
  'settings.about.upToDate': '已是最新版本',
  'settings.about.updateAvailable': '有新版本: v{version}',
  'settings.about.downloading': '下载中... {percent}%',
  'settings.about.readyToInstall': '更新就绪 — 重启以应用',
  'settings.about.restartNow': '立即重启',
  'settings.about.checkFailed': '更新检查失败',

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
  'commandPalette.newChat': '新对话',

  // Pet cameo
  'pet.emptyState.ready': '准备就绪！',
  'pet.emptyState.build': '想构建点什么？',
  'pet.emptyState.start': '开始对话',
  'pet.emptyState.code': '一起写代码吧！',
  'pet.noResults.nothing': '这里什么都没找到…',
  'pet.noResults.empty': '暂无结果！',
  'pet.noResults.hmm': '嗯，空空如也。',
  'pet.holiday.happy': '编程假日快乐！',
  'pet.holiday.break': '休息一下，庆祝吧！',
  'pet.random.hi': '你好呀！',
  'pet.random.bamboo': '来根竹子？',
  'pet.random.lucky': '今天手气不错！',
  'pet.random.munches': '*嚼竹子中*',

  // Session defaults
  'session.defaultName': '新对话',

  // Session switcher
  'sessionSwitcher.placeholder': '搜索会话...',
  'sessionSwitcher.noResults': '无匹配会话',

  // Menu
  'menu.newWindow': '新窗口',

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
