// Input: none (static catalog)
// Output: ja translation record
// Pos: i18n/locales — Japanese locale

export default {
  // App
  'app.name': 'Panda Code',
  'app.version': 'バージョン',

  // Sidebar
  'sidebar.newChat': '新しいチャット',
  'sidebar.search': '検索',
  'sidebar.conversations': '会話',
  'sidebar.sessionHistory': 'セッション履歴',
  'sidebar.agents': 'エージェント',
  'sidebar.skills': 'スキル',
  'sidebar.toolsMcp': 'ツール & MCP',
  'sidebar.taskPlan': 'タスク計画',
  'sidebar.buddy': 'バディ',
  'sidebar.settings': '設定',
  'sidebar.workspace': 'ワークスペース',
  'sidebar.fileBrowser': 'ファイルブラウザ',
  'sidebar.memoryBank': 'メモリバンク',
  'sidebar.workflows': 'ワークフロー',
  'sidebar.today': '今日',
  'sidebar.yesterday': '昨日',
  'sidebar.last7Days': '過去7日間',
  'sidebar.last30Days': '過去30日間',
  'sidebar.older': 'それ以前',

  // TabBar
  'tabbar.newTab': '新しいタブ',
  'tabbar.closeTab': 'タブを閉じる',
  'tabbar.closeOthers': '他を閉じる',
  'tabbar.closeAll': 'すべて閉じる',
  'tabbar.duplicate': 'タブを複製',
  'tabbar.runningWarning': 'このセッションは実行中です。閉じますか？',

  // Chat
  'chat.placeholder': 'メッセージを入力... (Enter で送信、Shift+Enter で改行)',
  'chat.send': '送信',
  'chat.stop': '停止',
  'chat.thinking': '考え中...',
  'chat.streaming': '生成中...',
  'chat.retry': 'リトライ',
  'chat.copy': 'コピー',
  'chat.fork': 'セッションをフォーク',
  'chat.connectionError': '接続が切断されました。再試行中...',
  'chat.disconnected': '切断されました',

  // Composer
  'composer.hero.title': '何かお手伝いできますか？',
  'composer.hero.subtitle': 'Panda Code、あなたのAIコーディングパートナーです',
  'composer.attachments': '添付ファイル',
  'composer.slashCommands': 'スラッシュコマンド',
  'composer.mentions': 'メンション',

  // Permission
  'permission.title': '権限リクエスト',
  'permission.allow': '許可',
  'permission.deny': '拒否',
  'permission.allowSession': 'セッション中許可',
  'permission.showDiff': '差分を表示',
  'permission.remember': '選択を記憶',

  // StatusBar
  'statusbar.tokens': 'トークン',
  'statusbar.cost': 'コスト',
  'statusbar.model': 'モデル',
  'statusbar.permission': '権限',
  'statusbar.effort': '強度',
  'statusbar.branch': 'ブランチ',
  'statusbar.buddy': 'バディ',
  'statusbar.mcp': 'MCP',
  'statusbar.sandbox': 'サンドボックス',
  'statusbar.theme': 'テーマ',

  // Settings
  'settings.title': '設定',
  'settings.general': '一般',
  'settings.model': 'モデル',
  'settings.appearance': '外観',
  'settings.advanced': '詳細',
  'settings.language': '言語',
  'settings.theme': 'テーマ',
  'settings.theme.light': 'ライト',
  'settings.theme.dark': 'ダーク',
  'settings.theme.system': 'システム',
  'settings.theme.matrix': 'マトリックス',

  // Inspector
  'inspector.context': 'コンテキスト',
  'inspector.files': 'ファイル',
  'inspector.tasks': 'タスク',
  'inspector.diff': '差分',
  'inspector.preview': 'プレビュー',
  'inspector.agents': 'エージェント',
  'inspector.sideChat': 'サイドチャット',
  'inspector.buddyLog': 'バディログ',
  'inspector.petState': 'ペット状態',

  // Tool calls
  'tool.bash': 'ターミナル',
  'tool.read': 'ファイル読取',
  'tool.edit': 'ファイル編集',
  'tool.write': 'ファイル書込',
  'tool.glob': 'ファイル検索',
  'tool.grep': 'コンテンツ検索',
  'tool.agent': 'サブエージェント',
  'tool.skill': 'スキル',
  'tool.webSearch': 'ウェブ検索',
  'tool.webFetch': 'ウェブ取得',
  'tool.notebook': 'ノートブック',
  'tool.task': 'タスク',
  'tool.todo': 'ToDo',
  'tool.mcp': 'MCP',
  'tool.sleep': 'スリープ',
  'tool.askUser': 'ユーザーに質問',
  'tool.plan': 'プラン',

  // Routing
  'routing.switched': '{model} に切り替えました',
  'routing.reason': '理由：{reason}',
  'routing.learnMore': '詳細を見る',
  'routing.disableAutoRouting': '自動ルーティングを無効化',

  // Buddy
  'buddy.levelUp': 'レベルアップ！',
  'buddy.milestone': 'マイルストーン達成',
  'buddy.speciesUnlock': '新種アンロック',

  // Command palette
  'commandPalette.placeholder': 'コマンドを入力...',
  'commandPalette.noResults': '結果が見つかりません',

  // Session switcher
  'sessionSwitcher.placeholder': 'セッションを検索...',
  'sessionSwitcher.noResults': '一致するセッションがありません',

  // Common
  'common.confirm': '確認',
  'common.cancel': 'キャンセル',
  'common.save': '保存',
  'common.delete': '削除',
  'common.rename': '名前を変更',
  'common.close': '閉じる',
  'common.open': '開く',
  'common.loading': '読み込み中...',
  'common.error': 'エラー',
  'common.success': '成功',
  'common.warning': '警告',
  'common.info': '情報',
} as const;
