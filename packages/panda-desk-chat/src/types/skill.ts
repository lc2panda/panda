// Input: cc-haha desktop/src/types/skill.ts shape
// Output: skill metadata / detail / file tree types for stores + UI
// Pos: Type layer — consumed by skillStore + PdSkillSettings

export type SkillSource = 'user' | 'project' | 'plugin' | 'mcp' | 'bundled';

export type SkillFrontmatter = {
  description?: string;
  when_to_use?: string;
  'argument-hint'?: string;
  model?: string;
  effort?: string;
  'allowed-tools'?: string[];
  paths?: string[];
  agent?: string;
  context?: string;
  version?: string;
  'user-invocable'?: boolean;
  [key: string]: unknown;
};

export type SkillMeta = {
  name: string;
  displayName?: string;
  description: string;
  source: SkillSource;
  version?: string;
  userInvocable?: boolean;
  contentLength: number;
  hasDirectory: boolean;
};

export type SkillFile = {
  path: string;
  content: string;
  body?: string;
  language: string;
  frontmatter?: SkillFrontmatter;
  isEntry?: boolean;
};

export type FileTreeNode = {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeNode[];
};

export type SkillDetail = {
  meta: SkillMeta;
  tree: FileTreeNode[];
  files: SkillFile[];
};
