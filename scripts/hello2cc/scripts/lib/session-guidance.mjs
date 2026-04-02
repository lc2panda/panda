import { FORCED_OUTPUT_STYLE_NAME, configuredModels } from './config.mjs';

function formatNames(values) {
  return values.map((value) => `\`${value}\``).join(', ');
}

function detectedTools(sessionContext = {}) {
  return Array.isArray(sessionContext?.toolNames) ? sessionContext.toolNames.filter(Boolean) : [];
}

function detectedAgents(sessionContext = {}) {
  return Array.isArray(sessionContext?.agentTypes) ? sessionContext.agentTypes.filter(Boolean) : [];
}

function buildObservedSurfaceLines(sessionContext = {}) {
  const tools = detectedTools(sessionContext);
  const agents = detectedAgents(sessionContext);

  if (tools.length === 0 && agents.length === 0) {
    return [
      '## 当前会话能力',
      '- Claude Code 还没有在 hook 负载里显式列出本会话能力；保持原生工作方式即可，不要凭空发明不存在的工具或 agent。',
    ];
  }

  const lines = ['## 当前会话能力'];
  if (tools.length) {
    lines.push(`- 已观测到的原生工具：${formatNames(tools)}。`);
  }
  if (agents.length) {
    lines.push(`- 已观测到的内建 agent：${formatNames(agents)}。`);
  }
  return lines;
}

function buildSessionModelLines(sessionContext = {}) {
  const config = configuredModels(sessionContext);
  const lines = ['## 会话使用方式'];

  lines.push('- 像平常一样直接使用 Claude Code；不需要额外手动加载，也不需要切换到另一套工作流。');
  lines.push('- hello2cc 只强化 Claude / Opus 风格的原生工具、原生 agent、原生计划与任务习惯，不替换现有 `CLAUDE.md`、项目规则或用户指定输出格式。');

  if (config.sessionModel) {
    lines.push(`- 当前会话模型别名：\`${config.sessionModel}\`。`);
  }

  if (config.routingPolicy === 'prompt-only') {
    lines.push('- 当前仅做原生能力引导，不改写原生工具输入。');
  } else {
    lines.push('- 当原生 `Agent` 调用没有显式 `model` 时，优先保持与当前会话模型一致。');
  }

  lines.push('- 如果原生工具调用里已经显式传入 `model`，始终以显式值为准。');
  return lines;
}

function buildWorkingHabitLines() {
  return [
    '## 原生工作习惯',
    '- 保持 Claude / Opus 风格的原生工作方式：先读相关代码，再改动；优先改已有文件而不是新建文件。',
    '- 可见文本默认跟随用户当前语言；除非用户明确要求，否则不要无故切换语言。',
    '- 不要把内部思考过程直接说出来；工具前说明保持一句简短行动描述，避免“我打算 / 我应该 / let’s”式元叙述。',
    '- 有专用读写 / 搜索工具时优先用专用工具，再考虑 shell。',
    '- 非 trivial 任务优先 `EnterPlanMode()`；只有真的需要任务盘时再维护原生 `Task*`。',
    '- 不确定可用工具、agent、MCP、权限边界时，优先 `ToolSearch`。',
    '- Claude Code / hooks / MCP / settings / Agent SDK / Claude API 问题优先 `Claude Code Guide`。',
    '- 代码库研究与范围探索优先原生搜索，再按需要转 `Explore` 或 `Plan`。',
    '- 边界清晰的实现、修复、验证切片优先 `General-Purpose`。',
    '- 多线任务默认优先并行多个原生 `Agent` worker；续派优先 `SendMessage`；跑偏时再 `TaskStop`。',
    '- 普通 `Agent` worker 默认不要传 `name` / `team_name`；避免宿主把普通 subagent 误路由成 teammate。',
    '- 只有用户明确要求团队编排或持久团队身份时，才使用 `TeamCreate`；完成后及时 `TeamDelete`。',
    '- 真正需要 agent team 时，先 `TeamCreate` 拿到真实团队，再给 `Agent` 显式传入 `name` + `team_name`；不要依赖 `main` / `default` 这类隐式 team 上下文。',
    '- 普通 worker 的结果默认看完成通知 / 回传消息，不要把 `TaskOutput` 当成普通 worker 的默认结果获取方式。',
    '- 外部系统与集成优先原生 MCP / connected tools，优先 `ListMcpResources` / `ReadMcpResource`。',
    '- 如果只被一个真实用户选择阻塞，优先 `AskUserQuestion`。',
    '- 只有用户明确要求隔离工作树时才使用 `EnterWorktree`。',
    '- 宣称完成前先跑与改动最贴近的验证；验证结果要诚实。',
  ];
}

function buildToolSearchLines() {
  return [
    '## ToolSearch 状态',
    '- 原生 `ToolSearch` 是默认优先路径：先用它确认可用工具、原生 agent 类型、MCP 能力、权限与边界。',
    '- hello2cc 不会主动把第三方模型从这条原生路径拉走。',
  ];
}

export function buildSessionStartContext(sessionContext = {}) {
  return [
    '# hello2cc',
    '',
    'hello2cc 会让第三方模型在 Claude Code 里尽量按 Claude / Opus 的原生方式工作：优先原生工具、原生 agent、原生计划与原生协作流程。',
    '',
    '## 优先级',
    '- 用户当前消息、Claude Code 宿主规则、`CLAUDE.md` / `AGENTS.md` / 项目规则，始终高于 hello2cc。',
    '- hello2cc 不得覆盖现有工作流、输出格式、命令路由、顶部/底部信息栏或项目约定。',
    '',
    ...buildSessionModelLines(sessionContext),
    '',
    ...buildWorkingHabitLines(),
    '',
    ...buildObservedSurfaceLines(sessionContext),
    '',
    ...buildToolSearchLines(),
    '',
    '## 输出风格',
    `- 当前插件输出风格：\`${FORCED_OUTPUT_STYLE_NAME}\`。`,
    '- 如果更高优先级规则没有指定格式，保持 Claude Code 原生、简洁、结果导向的表达。',
    '- 如果需要表格，优先 Markdown 表格；只有 Markdown 明显不适合时再使用 ASCII。',
  ].join('\n');
}
