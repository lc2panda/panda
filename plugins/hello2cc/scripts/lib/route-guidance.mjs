import { configuredModels } from './config.mjs';

function buildTaskPlanningStep() {
  return '这是非 trivial 实现：先 `EnterPlanMode()`；只有真的需要任务盘时再用 `TaskCreate` / `TaskList` / `TaskUpdate`。';
}

function buildTaskTrackingStep() {
  return '该任务适合显式拆解：维护 `TaskCreate` / `TaskList` / `TaskUpdate`；更新前先 `TaskGet` 看当前状态，不要只在正文里口头列步骤。';
}

function recommendedTrackLabels(signals) {
  if (signals.tracks?.length) return signals.tracks;
  if (signals.research && signals.verify) return ['research', 'verification'];
  if (signals.research && signals.implement) return ['research', 'implementation'];
  if (signals.implement && signals.verify) return ['implementation', 'verification'];
  return ['track-1', 'track-2'];
}

function buildSwarmStep(signals) {
  const trackList = recommendedTrackLabels(signals)
    .map((track) => `\`${track}\``)
    .join(' / ');

  if (signals.teamWorkflow) {
    return [
      `用户显式要求团队编排：用 \`TeamCreate\` 建立持久团队来推进 ${trackList}。`,
      '等 `TeamCreate` 产出真实团队后，后续 `Agent` 调用再显式传入 `name` + `team_name`；不要依赖 `main` / `default` 这类隐式 team 上下文。',
      '团队成员已启动后，补充指令、修正范围或续派时用 `SendMessage`。',
      '团队完成后用 `TeamDelete` 清理。',
    ].join(' ');
  }

  return [
    `这是多线任务：优先在同一条回复里并行发起多个原生 \`Agent\` worker，分别覆盖 ${trackList}。`,
    '普通并行 worker 走 plain subagent 路径：不要给普通 worker 传 `name` 或 `team_name`，避免被宿主误判为 teammate。',
    '启动后简短告诉用户已启动哪些 worker，然后等待完成通知 / 回传消息，不要立刻轮询普通 agent 结果。',
    '需要补充指令或续派时用 `SendMessage`；如果某个 worker 明显走错方向，再用 `TaskStop`。',
    '不要把 `TaskOutput` 当成普通 worker 的默认结果获取方式；它更适合明确的后台任务日志读取。',
  ].join(' ');
}

function buildResearchStep(signals) {
  if (signals.claudeGuide) {
    return '这是 Claude Code / Claude API / Agent SDK / hooks / settings / MCP 能力问题：优先调用原生 `Agent` 的 `Claude Code Guide`。';
  }

  if (signals.codeResearch) {
    return '这是代码库研究 / 定位任务：先用原生读写 / 搜索工具缩小范围，再在需要更大搜索面时转原生 `Explore` 或 `Plan`。';
  }

  if (!signals.research) {
    return '';
  }

  return '这是研究 / 对比 / 文档任务：先做定向搜索与证据收集，再在需要扩大搜索面时转原生 `Explore` 或 `Plan`。';
}

export function buildRouteStepsFromSignals(signals, sessionContext = {}) {
  const config = configuredModels(sessionContext);
  const steps = [];

  steps.push('可见文本默认跟随用户当前语言；不要输出“我打算 / 我应该 / let’s”这类内部思考式元叙述。');

  if (signals.toolSearchFirst) {
    steps.push('先 `ToolSearch` 确认可用工具、原生 agent 类型、MCP 能力、权限与边界，不要凭记忆猜。');
  }

  if (signals.mcp) {
    steps.push('如果任务涉及外部系统、数据源或集成平台，优先 `ListMcpResources` / `ReadMcpResource` 或对应 MCP / connected tools。');
  }

  const researchStep = buildResearchStep(signals);
  if (researchStep) {
    steps.push(researchStep);
  }

  if (signals.boundedImplementation) {
    steps.push('这是边界清晰的实现 / 修复 / 验证子任务：优先使用原生 `Agent` 的 `General-Purpose` 承接单一切片，而不是把探索、规划和实现都混在主线程。');
  }

  if (signals.complex) {
    steps.push(buildTaskPlanningStep());
  }

  if (signals.plan) {
    steps.push('任务存在跨文件、架构取舍或多个阶段：优先计划模式；如果已经进入任务盘，就持续维护可追踪任务状态。');
  }

  if (signals.taskList) {
    steps.push(buildTaskTrackingStep());
  }

  if (signals.decisionHeavy) {
    steps.push('如果执行过程中出现单一真实阻塞选择，优先用 `AskUserQuestion` 发起结构化选择，不要把确认埋在长段落里。');
  }

  if (signals.swarm) {
    steps.push(buildSwarmStep(signals));
  }

  if (signals.wantsWorktree) {
    steps.push('用户明确要求隔离工作树：只有确实需要隔离工作区、分支式实验或并行修改时才进入 `EnterWorktree`。');
  }

  if (signals.diagram) {
    steps.push('需要结构化表达：优先标准 Markdown 表格或图示；只有 Markdown 明显不适合时再使用 ASCII。');
  }

  if (signals.verify) {
    steps.push('收尾前先做最贴近改动范围的验证，再视结果扩大范围；未验证不要声称已完成。');
  }

  if (config.routingPolicy !== 'prompt-only') {
    steps.push('如果原生 `Agent` 调用没有显式 `model`，优先与当前会话模型保持一致；显式传入的 `model` 永远优先。');
  }

  if (steps.length === 0) {
    return '';
  }

  return [
    '# hello2cc native-first routing',
    '',
    '按下面顺序优先决策：',
    '',
    ...steps.map((step, index) => `${index + 1}. ${step}`),
  ].join('\n');
}
