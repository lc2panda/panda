// Input: none (static catalog)
// Output: ko translation record
// Pos: i18n/locales — Korean locale

export default {
  // App
  'app.name': 'Panda Code',
  'app.version': '버전',

  // Sidebar
  'sidebar.newChat': '새 대화',
  'sidebar.search': '검색',
  'sidebar.conversations': '대화',
  'sidebar.sessionHistory': '세션 기록',
  'sidebar.agents': '에이전트',
  'sidebar.skills': '스킬',
  'sidebar.toolsMcp': '도구 & MCP',
  'sidebar.taskPlan': '작업 계획',
  'sidebar.buddy': '버디',
  'sidebar.settings': '설정',
  'sidebar.workspace': '워크스페이스',
  'sidebar.fileBrowser': '파일 탐색기',
  'sidebar.memoryBank': '메모리 뱅크',
  'sidebar.workflows': '워크플로우',
  'sidebar.today': '오늘',
  'sidebar.yesterday': '어제',
  'sidebar.last7Days': '최근 7일',
  'sidebar.last30Days': '최근 30일',
  'sidebar.older': '이전',

  // TabBar
  'tabbar.newTab': '새 탭',
  'tabbar.closeTab': '탭 닫기',
  'tabbar.closeOthers': '다른 탭 닫기',
  'tabbar.closeAll': '모두 닫기',
  'tabbar.duplicate': '탭 복제',
  'tabbar.runningWarning': '이 세션이 실행 중입니다. 닫으시겠습니까?',

  // Chat
  'chat.placeholder': '메시지 입력... (Enter 전송, Shift+Enter 줄바꿈)',
  'chat.send': '전송',
  'chat.stop': '중지',
  'chat.thinking': '생각 중...',
  'chat.streaming': '생성 중...',
  'chat.retry': '재시도',
  'chat.copy': '복사',
  'chat.fork': '세션 포크',
  'chat.connectionError': '연결이 끊어졌습니다. 재시도 중...',
  'chat.disconnected': '연결 끊김',

  // Composer
  'composer.hero.title': '무엇을 도와드릴까요?',
  'composer.hero.subtitle': 'Panda Code, 당신의 AI 코딩 파트너입니다',
  'composer.attachments': '첨부파일',
  'composer.slashCommands': '슬래시 명령',
  'composer.mentions': '멘션',

  // Permission
  'permission.title': '권한 요청',
  'permission.allow': '허용',
  'permission.deny': '거부',
  'permission.allowSession': '세션 동안 허용',
  'permission.showDiff': '차이점 보기',
  'permission.remember': '선택 기억',

  // StatusBar
  'statusbar.tokens': '토큰',
  'statusbar.cost': '비용',
  'statusbar.model': '모델',
  'statusbar.permission': '권한',
  'statusbar.effort': '강도',
  'statusbar.branch': '브랜치',
  'statusbar.buddy': '버디',
  'statusbar.mcp': 'MCP',
  'statusbar.sandbox': '샌드박스',
  'statusbar.theme': '테마',

  // Settings
  'settings.title': '설정',
  'settings.general': '일반',
  'settings.model': '모델',
  'settings.appearance': '외관',
  'settings.advanced': '고급',
  'settings.language': '언어',
  'settings.workingDir': '작업 디렉토리',
  'settings.workingDirDesc': '새 세션의 기본 작업 디렉토리',
  'settings.workingDirPlaceholder': '작업 디렉토리 선택…',
  'settings.theme': '테마',
  'settings.themeDesc': '라이트, 다크 또는 시스템 설정 따르기',
  'settings.theme.light': '라이트',
  'settings.theme.dark': '다크',
  'settings.theme.system': '시스템',
  'settings.theme.matrix': '매트릭스',
  'settings.notifications': '시스템 알림',
  'settings.notificationsDesc': '새 메시지가 도착하면 알림을 표시합니다',

  // Settings > About > Update
  'settings.about.checkUpdate': '업데이트 확인',
  'settings.about.upToDate': '최신 버전입니다',
  'settings.about.updateAvailable': '업데이트 사용 가능: v{version}',
  'settings.about.downloading': '다운로드 중... {percent}%',
  'settings.about.readyToInstall': '업데이트 준비 완료 — 재시작하여 적용',
  'settings.about.restartNow': '지금 재시작',
  'settings.about.checkFailed': '업데이트 확인 실패',

  // Inspector
  'inspector.context': '컨텍스트',
  'inspector.files': '파일',
  'inspector.tasks': '작업',
  'inspector.diff': '차이점',
  'inspector.preview': '미리보기',
  'inspector.agents': '에이전트',
  'inspector.sideChat': '사이드 채팅',
  'inspector.buddyLog': '버디 로그',
  'inspector.petState': '펫 상태',

  // Tool calls
  'tool.bash': '터미널',
  'tool.read': '파일 읽기',
  'tool.edit': '파일 편집',
  'tool.write': '파일 쓰기',
  'tool.glob': '파일 검색',
  'tool.grep': '콘텐츠 검색',
  'tool.agent': '서브 에이전트',
  'tool.skill': '스킬',
  'tool.webSearch': '웹 검색',
  'tool.webFetch': '웹 가져오기',
  'tool.notebook': '노트북',
  'tool.task': '작업',
  'tool.todo': '할 일',
  'tool.mcp': 'MCP',
  'tool.sleep': '대기',
  'tool.askUser': '사용자에게 질문',
  'tool.plan': '계획',

  // Routing
  'routing.switched': '{model}로 전환했습니다',
  'routing.reason': '이유: {reason}',
  'routing.learnMore': '자세히 보기',
  'routing.disableAutoRouting': '자동 라우팅 비활성화',

  // Buddy
  'buddy.levelUp': '레벨 업!',
  'buddy.milestone': '마일스톤 달성',
  'buddy.speciesUnlock': '새 종 해금',

  // Command palette
  'commandPalette.placeholder': '명령어 입력...',
  'commandPalette.noResults': '결과 없음',

  // Session switcher
  'sessionSwitcher.placeholder': '세션 검색...',
  'sessionSwitcher.noResults': '일치하는 세션 없음',

  // Common
  'common.confirm': '확인',
  'common.cancel': '취소',
  'common.save': '저장',
  'common.delete': '삭제',
  'common.rename': '이름 변경',
  'common.close': '닫기',
  'common.open': '열기',
  'common.loading': '로딩 중...',
  'common.error': '오류',
  'common.success': '성공',
  'common.warning': '경고',
  'common.info': '정보',
} as const;
