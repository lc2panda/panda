// Input: none (static catalog)
// Output: en translation record
// Pos: i18n/locales — English locale

export default {
  // App
  'app.name': 'Panda',
  'app.version': 'Version',

  // Sidebar
  'sidebar.newChat': 'New Chat',
  'sidebar.search': 'Search',
  'sidebar.conversations': 'Conversations',
  'sidebar.sessionHistory': 'Session History',
  'sidebar.agents': 'Agents',
  'sidebar.skills': 'Skills',
  'sidebar.toolsMcp': 'Tools & MCP',
  'sidebar.taskPlan': 'Task Plan',
  'sidebar.buddy': 'Buddy',
  'sidebar.settings': 'Settings',
  'sidebar.workspace': 'Workspace',
  'sidebar.fileBrowser': 'File Browser',
  'sidebar.memoryBank': 'Memory Bank',
  'sidebar.workflows': 'Workflows',
  'sidebar.today': 'Today',
  'sidebar.yesterday': 'Yesterday',
  'sidebar.last7Days': 'Last 7 Days',
  'sidebar.last30Days': 'Last 30 Days',
  'sidebar.older': 'Older',
  'sidebar.openInNewWindow': 'Open in New Window',

  // TabBar
  'tabbar.newTab': 'New Tab',
  'tabbar.closeTab': 'Close Tab',
  'tabbar.closeOthers': 'Close Others',
  'tabbar.closeAll': 'Close All',
  'tabbar.duplicate': 'Duplicate Tab',
  'tabbar.runningWarning': 'This session is running. Close anyway?',

  // Chat
  'chat.placeholder': 'Type a message... (Enter to send, Shift+Enter for newline)',
  'chat.send': 'Send',
  'chat.stop': 'Stop',
  'chat.thinking': 'Thinking...',
  'chat.streaming': 'Generating...',
  'chat.retry': 'Retry',
  'chat.copy': 'Copy',
  'chat.fork': 'Fork Session',
  'chat.connectionError': 'Connection lost. Retrying...',
  'chat.disconnected': 'Disconnected',

  // Composer
  'composer.hero.title': 'New chat',
  'composer.hero.subtitle': 'Start a fresh coding session. Panda is ready to help you build, debug, and architect your project.',
  'composer.attachments': 'Attachments',
  'composer.slashCommands': 'Slash Commands',
  'composer.mentions': 'Mentions',

  // Permission
  'permission.title': 'Permission Request',
  'permission.allow': 'Allow',
  'permission.deny': 'Deny',
  'permission.allowSession': 'Allow for Session',
  'permission.showDiff': 'Show Diff',
  'permission.remember': 'Remember Choice',

  // StatusBar
  'statusbar.tokens': 'Tokens',
  'statusbar.cost': 'Cost',
  'statusbar.model': 'Model',
  'statusbar.permission': 'Permission',
  'statusbar.effort': 'Effort',
  'statusbar.branch': 'Branch',
  'statusbar.buddy': 'Buddy',
  'statusbar.mcp': 'MCP',
  'statusbar.sandbox': 'Sandbox',
  'statusbar.theme': 'Theme',
  'statusbar.dnd': 'Do Not Disturb',

  // StatusBar — connection states
  'statusbar.connection.connected': 'Connected',
  'statusbar.connection.connecting': 'Connecting',
  'statusbar.connection.disconnected': 'Disconnected',
  'statusbar.connection.error': 'Error',
  'statusbar.connection.reconnecting': 'Reconnecting',

  // StatusBar — permission modes
  'statusbar.permission.default': 'Default',
  'statusbar.permission.plan': 'Plan',
  'statusbar.permission.auto': 'Auto Accept',
  'statusbar.permission.bypass': 'Bypass',
  'statusbar.permission.default.desc': 'Ask before executing tools',
  'statusbar.permission.plan.desc': 'Plan mode — think before acting',
  'statusbar.permission.auto.desc': 'Auto-accept safe operations',
  'statusbar.permission.bypass.desc': 'Skip all permission prompts',

  // StatusBar — effort levels
  'statusbar.effort.min': 'Min',
  'statusbar.effort.low': 'Low',
  'statusbar.effort.medium': 'Medium',
  'statusbar.effort.high': 'High',
  'statusbar.effort.max': 'Max',
  'statusbar.effort.min.desc': 'Quick, concise responses',
  'statusbar.effort.low.desc': 'Brief with key details',
  'statusbar.effort.medium.desc': 'Balanced depth',
  'statusbar.effort.high.desc': 'Thorough analysis',
  'statusbar.effort.max.desc': 'Maximum detail and reasoning',

  // Settings
  'settings.title': 'Settings',
  'settings.general': 'General',
  'settings.model': 'Model',
  'settings.appearance': 'Appearance',
  'settings.advanced': 'Advanced',
  'settings.language': 'Language',
  'settings.workingDir': 'Working Directory',
  'settings.workingDirDesc': 'Default working directory for new sessions',
  'settings.workingDirPlaceholder': 'Select working directory…',
  'settings.theme': 'Theme',
  'settings.themeDesc': 'Choose light, dark, or follow your system preference',
  'settings.theme.light': 'Light',
  'settings.theme.dark': 'Dark',
  'settings.theme.system': 'System',
  'settings.theme.matrix': 'Matrix',
  'settings.notifications': 'System Notifications',
  'settings.notificationsDesc': 'Show notifications when new messages arrive',

  // Settings > About > Update
  'settings.about.checkUpdate': 'Check for Updates',
  'settings.about.upToDate': "You're up to date",
  'settings.about.updateAvailable': 'Update available: v{version}',
  'settings.about.downloading': 'Downloading... {percent}%',
  'settings.about.readyToInstall': 'Update ready — restart to apply',
  'settings.about.restartNow': 'Restart Now',
  'settings.about.checkFailed': 'Update check failed',

  // Inspector
  'inspector.context': 'Context',
  'inspector.files': 'Files',
  'inspector.tasks': 'Tasks',
  'inspector.diff': 'Diff',
  'inspector.preview': 'Preview',
  'inspector.agents': 'Agents',
  'inspector.sideChat': 'Side Chat',
  'inspector.buddyLog': 'Buddy Log',
  'inspector.petState': 'Pet State',

  // Tool calls
  'tool.bash': 'Terminal',
  'tool.read': 'Read File',
  'tool.edit': 'Edit File',
  'tool.write': 'Write File',
  'tool.glob': 'Search Files',
  'tool.grep': 'Search Content',
  'tool.agent': 'Sub Agent',
  'tool.skill': 'Skill',
  'tool.webSearch': 'Web Search',
  'tool.webFetch': 'Web Fetch',
  'tool.notebook': 'Notebook',
  'tool.task': 'Task',
  'tool.todo': 'Todo',
  'tool.mcp': 'MCP',
  'tool.sleep': 'Sleep',
  'tool.askUser': 'Ask User',
  'tool.plan': 'Plan',

  // Routing
  'routing.switched': 'Switched to {model}',
  'routing.reason': 'Reason: {reason}',
  'routing.learnMore': 'Learn More',
  'routing.disableAutoRouting': 'Disable Auto Routing',

  // Buddy
  'buddy.levelUp': 'Level Up!',
  'buddy.milestone': 'Milestone Reached',
  'buddy.speciesUnlock': 'New Species Unlocked',

  // Command palette
  'commandPalette.placeholder': 'Type a command...',
  'commandPalette.noResults': 'No results found',
  'commandPalette.newChat': 'New Chat',

  // Pet cameo
  'pet.emptyState.ready': 'Ready to help!',
  'pet.emptyState.build': 'What shall we build?',
  'pet.emptyState.start': 'Start a conversation',
  'pet.emptyState.code': "Let's code together!",
  'pet.noResults.nothing': 'Nothing found here...',
  'pet.noResults.empty': 'No results yet!',
  'pet.noResults.hmm': "Hmm, that's empty.",
  'pet.holiday.happy': 'Happy coding holiday!',
  'pet.holiday.break': 'Take a break & celebrate!',
  'pet.random.hi': 'Hi there!',
  'pet.random.bamboo': 'Bamboo break?',
  'pet.random.lucky': 'Feeling lucky!',
  'pet.random.munches': '*munches bamboo*',

  // Session defaults
  'session.defaultName': 'New Chat',

  // Session switcher
  'sessionSwitcher.placeholder': 'Search sessions...',
  'sessionSwitcher.noResults': 'No matching sessions',

  // Menu
  'menu.newWindow': 'New Window',

  // Common
  'common.confirm': 'Confirm',
  'common.cancel': 'Cancel',
  'common.save': 'Save',
  'common.delete': 'Delete',
  'common.rename': 'Rename',
  'common.close': 'Close',
  'common.open': 'Open',
  'common.loading': 'Loading...',
  'common.error': 'Error',
  'common.success': 'Success',
  'common.warning': 'Warning',
  'common.info': 'Info',
} as const;
