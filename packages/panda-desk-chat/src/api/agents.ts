// Input: cc-haha desktop/src/api/agents.ts shape
// Output: AgentDefinition / AgentSource exports for stores + UI
// Pos: API/type layer — consumed by agentStore + PdAgentsSettings

export type AgentSource =
  | 'userSettings'
  | 'projectSettings'
  | 'localSettings'
  | 'policySettings'
  | 'plugin'
  | 'flagSettings'
  | 'built-in';

export type AgentDefinition = {
  agentType: string;
  source: AgentSource;
  description?: string;
  modelDisplay?: string;
  isActive: boolean;
  overriddenBy?: AgentSource;
  tools?: string[];
  baseDir?: string;
  color?: string;
  systemPrompt?: string;
};
