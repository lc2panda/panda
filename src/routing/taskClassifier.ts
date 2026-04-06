// Input: Prompt text + agent definition — task context for routing decisions.
// Output: TaskProfile with complexity, domain, required capabilities, token estimate.
// Pos: Called by routeResolver before model selection — pure function, no LLM call, <1ms.
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"

// ─────────────────────────────────────────────────────────────
// Task Profile — the output of classification
// ─────────────────────────────────────────────────────────────

/**
 * Estimated task complexity — drives model tier selection.
 * - simple: quick questions, typos, simple lookups → haiku-class
 * - moderate: standard coding, editing, debugging → sonnet-class
 * - complex: multi-file refactors, feature implementations → sonnet/opus
 * - expert: architecture design, system-wide changes → opus-class
 */
export type TaskComplexity = 'simple' | 'moderate' | 'complex' | 'expert'

/**
 * Primary domain — narrows capability requirements.
 * Derived from prompt keywords, file extensions, and agent type.
 */
export type TaskDomain =
  | 'code'           // Code generation, editing, refactoring
  | 'architecture'   // System design, module planning
  | 'documentation'  // Docs, README, comments
  | 'testing'        // Test writing, coverage, assertions
  | 'debugging'      // Bug fixing, error investigation
  | 'research'       // Exploration, codebase search
  | 'creative'       // Creative writing, brainstorming
  | 'frontend'       // UI/UX, CSS, React/Vue components
  | 'general'        // Uncategorized

/** Estimated token budget — for cost-aware routing. */
export type TokenEstimate = 'small' | 'medium' | 'large' | 'mega'

export interface TaskProfile {
  /** Estimated complexity */
  complexity: TaskComplexity
  /** Primary task domain */
  domain: TaskDomain
  /** Capabilities the task likely needs (e.g., "vision", "reasoning >= 85") */
  requiredCapabilities: string[]
  /** Estimated token consumption */
  estimatedTokens: TokenEstimate
}

// ─────────────────────────────────────────────────────────────
// Keyword patterns — bilingual (English + Chinese)
// ─────────────────────────────────────────────────────────────

const EXPERT_PATTERNS = /architect|design.*system|refactor.*entire|redesign|migration.*strategy|系统设计|架构|重构.*整个|迁移方案/i
const COMPLEX_PATTERNS = /implement|add.*feature|integrate|multi.*file|several.*changes|新功能|集成|多个文件/i
const SIMPLE_PATTERNS = /fix.*typo|rename|format|lint|简单|修复.*拼写|重命名|格式化/i

const TESTING_PATTERNS = /test|spec|assert|coverage|expect|describe\(|it\(|测试|断言|覆盖率/i
const DEBUGGING_PATTERNS = /bug|fix|error|crash|debug|stack.*trace|regression|报错|修复|崩溃|调试/i
const FRONTEND_PATTERNS = /\.tsx|\.jsx|\.vue|\.svelte|css|tailwind|component|ui|ux|layout|style|前端|组件|样式|界面/i
const ARCHITECTURE_PATTERNS = /architect|design.*doc|module.*structure|api.*design|database.*schema|架构|模块设计|数据库/i
const DOCUMENTATION_PATTERNS = /readme|document|changelog|jsdoc|comment|explain.*code|文档|注释|说明/i
const RESEARCH_PATTERNS = /search|find|explore|investigate|analyze|look.*for|查找|搜索|分析|调研/i
const CREATIVE_PATTERNS = /creative|brainstorm|story|narrative|poem|创意|头脑风暴/i
const CODE_PATTERNS = /\.tsx?|\.jsx?|\.py|\.rs|\.go|\.java|\.cpp|\.c\b|function|class\s|import\s|代码|函数|类/i

const VISION_PATTERNS = /image|screenshot|visual|diagram|png|jpg|gif|svg|picture|图片|截图|视觉/i
const STRUCTURED_PATTERNS = /json.*output|structured.*response|schema|格式化.*输出/i
const THINKING_PATTERNS = /step.*by.*step|think.*through|reason|analyze.*deeply|深入分析|逐步/i

// ─────────────────────────────────────────────────────────────
// Classifier
// ─────────────────────────────────────────────────────────────

/** Minimal agent info needed for classification — avoids full type dependency */
interface AgentContext {
  agentType?: string
  name?: string
}

/**
 * Classify a task using fast heuristics (NO LLM call).
 *
 * Uses keyword matching, prompt length analysis, file extension hints,
 * and agent type to produce a TaskProfile. Execution target: <1ms.
 *
 * Design ref: monitor/multi-model-agent-routing-design.md §4.1
 * Pattern ref: src/assistant/moodSense.ts (bilingual keyword matching)
 */
export function classifyTask(
  prompt: string,
  agent?: AgentContext,
  parentContext?: { model?: string; messageCount?: number },
): TaskProfile {
  const profile: TaskProfile = {
    complexity: 'moderate',
    domain: 'general',
    requiredCapabilities: [],
    estimatedTokens: 'medium',
  }

  if (!prompt || prompt.length === 0) {
    profile.complexity = 'simple'
    return profile
  }

  // ── Complexity heuristics ─────────────────────────────
  const wordCount = prompt.split(/\s+/).length
  const lineCount = prompt.split('\n').length

  if (wordCount < 30 && lineCount < 5) {
    profile.complexity = 'simple'
  } else if (wordCount > 200 || lineCount > 30) {
    profile.complexity = 'complex'
  }

  // Pattern overrides (strongest signal)
  if (EXPERT_PATTERNS.test(prompt)) profile.complexity = 'expert'
  else if (COMPLEX_PATTERNS.test(prompt) && profile.complexity !== 'expert') profile.complexity = 'complex'
  else if (SIMPLE_PATTERNS.test(prompt) && wordCount < 50) profile.complexity = 'simple'

  // Agent type boost
  if (agent?.agentType === 'Plan') {
    if (profile.complexity === 'moderate') profile.complexity = 'complex'
  }

  // ── Domain detection ──────────────────────────────────
  // Priority order: agent type hint → strongest keyword match
  if (agent?.agentType === 'Explore') profile.domain = 'research'
  else if (agent?.agentType === 'Plan') profile.domain = 'architecture'

  // Keyword-based domain (overrides agent hint if stronger signal)
  if (FRONTEND_PATTERNS.test(prompt)) profile.domain = 'frontend'
  else if (TESTING_PATTERNS.test(prompt)) profile.domain = 'testing'
  else if (DEBUGGING_PATTERNS.test(prompt)) profile.domain = 'debugging'
  else if (ARCHITECTURE_PATTERNS.test(prompt)) profile.domain = 'architecture'
  else if (DOCUMENTATION_PATTERNS.test(prompt)) profile.domain = 'documentation'
  else if (RESEARCH_PATTERNS.test(prompt)) profile.domain = 'research'
  else if (CREATIVE_PATTERNS.test(prompt)) profile.domain = 'creative'
  else if (CODE_PATTERNS.test(prompt)) profile.domain = 'code'

  // ── Required capabilities ─────────────────────────────
  if (VISION_PATTERNS.test(prompt)) {
    profile.requiredCapabilities.push('vision')
  }
  if (STRUCTURED_PATTERNS.test(prompt)) {
    profile.requiredCapabilities.push('structuredOutput')
  }
  if (THINKING_PATTERNS.test(prompt) || profile.complexity === 'expert') {
    profile.requiredCapabilities.push('thinking')
  }
  if (profile.complexity === 'expert' || profile.domain === 'architecture') {
    profile.requiredCapabilities.push('reasoning >= 85')
  }
  if (profile.domain === 'frontend') {
    profile.requiredCapabilities.push('coding >= 80')
  }

  // ── Token estimate ────────────────────────────────────
  if (wordCount < 50) profile.estimatedTokens = 'small'
  else if (wordCount < 300) profile.estimatedTokens = 'medium'
  else if (wordCount < 1000) profile.estimatedTokens = 'large'
  else profile.estimatedTokens = 'mega'

  // Context length boost
  if (parentContext?.messageCount && parentContext.messageCount > 50) {
    profile.estimatedTokens = 'large'
  }

  return profile
}
