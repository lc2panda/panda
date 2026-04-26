// Input: cc-haha desktop/src/types/mcp.ts shape references
// Output: MCP record / config / payload types for stores & PdMcpSettings
// Pos: Type layer — consumed by mcpStore + PdMcpSettings

export type McpScope =
  | 'user'
  | 'project'
  | 'local'
  | 'managed'
  | 'enterprise'
  | 'claudeai'
  | 'dynamic';

export type McpStdioConfig = {
  type: 'stdio';
  command: string;
  args: string[];
  env?: Record<string, string>;
};

export type McpRemoteConfig = {
  type: 'http' | 'sse';
  url: string;
  headers?: Record<string, string>;
  headersHelper?: string;
  oauth?: {
    clientId?: string;
    callbackPort?: number;
  };
};

export type McpConfig = McpStdioConfig | McpRemoteConfig;

export type McpServerStatus =
  | 'connected'
  | 'checking'
  | 'needs-auth'
  | 'failed'
  | 'disabled';

export type McpServerRecord = {
  name: string;
  scope: McpScope;
  transport: 'stdio' | 'http' | 'sse';
  config: McpConfig;
  status: McpServerStatus;
  statusLabel: string;
  statusDetail?: string;
  summary: string;
  enabled: boolean;
  canToggle: boolean;
  canEdit: boolean;
  canRemove: boolean;
  canReconnect: boolean;
  configLocation: string;
  projectPath?: string;
};

export type McpUpsertPayload = {
  scope: McpScope;
  config: McpConfig;
};
