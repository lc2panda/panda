// Input: cc-haha desktop/src/types/session.ts — 1:1 复刻
// Output: SessionListItem / MessageEntry / SessionDetail 类型，对应 disk session 扫描格式
// Pos: Type foundation — sessionStore / MessageList / disk-session-scanner 全部引用
//
// Source: cc-haha desktop/src/types/session.ts L1-28
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

export type SessionListItem = {
  id: string;
  title: string;
  createdAt: string;
  modifiedAt: string;
  messageCount: number;
  projectPath: string;
  workDir: string | null;
  workDirExists: boolean;
};

export type MessageEntry = {
  id: string;
  type: 'user' | 'assistant' | 'system' | 'tool_use' | 'tool_result';
  content: unknown;
  timestamp: string;
  model?: string;
  parentUuid?: string;
  parentToolUseId?: string;
  isSidechain?: boolean;
};

export type SessionDetail = SessionListItem & {
  messages: MessageEntry[];
};
