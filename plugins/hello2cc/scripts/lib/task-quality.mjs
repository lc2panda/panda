function normalizeText(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function hasStructuredList(text) {
  return /(^|\n)(\d+\. |- |\* )/.test(String(text || ''));
}

function hasPathOrCommandEvidence(text) {
  return /`[^`]+`|[A-Za-z]:\\[^ \n]+|(?:^|[\s(])[\w./-]+\.[A-Za-z0-9]+/.test(String(text || ''));
}

const VAGUE_SUBJECT_PATTERNS = [
  /^(fix|check|update|change|look|investigate|review|misc|stuff|task|work)\b/i,
  /^(修复|检查|更新|改一下|看一下|研究一下|处理一下|任务)\b/,
];

const DELIVERABLE_PATTERNS = [
  /implement|build|add|fix|refactor|write|create|analy[sz]e|compare|review|summari[sz]e|document|deliverable/i,
  /实现|新增|修复|重构|编写|分析|对比|审查|总结|说明|交付|输出/,
];

const EVIDENCE_PATTERNS = [
  /test|verify|validation|check|lint|build|review|regression|acceptance|proof|evidence|cite|paths?/i,
  /测试|验证|检查|回归|验收|证据|路径|引用|输出/,
];

export function taskSubjectTooVague(taskSubject) {
  const subject = normalizeText(taskSubject);
  if (subject.length < 10) return true;
  return VAGUE_SUBJECT_PATTERNS.some((pattern) => pattern.test(subject));
}

export function taskDescriptionTooThin(taskDescription) {
  const description = normalizeText(taskDescription);
  return description.length < 32;
}

export function taskDescriptionHasDeliverable(taskDescription) {
  const text = String(taskDescription || '');
  return hasStructuredList(text) || hasPathOrCommandEvidence(text) || DELIVERABLE_PATTERNS.some((pattern) => pattern.test(normalizeText(text)));
}

export function taskDescriptionHasEvidence(taskDescription) {
  const text = String(taskDescription || '');
  return hasPathOrCommandEvidence(text) || EVIDENCE_PATTERNS.some((pattern) => pattern.test(normalizeText(text)));
}

export function validateTaskDefinition({ task_subject: taskSubject, task_description: taskDescription }) {
  if (taskSubjectTooVague(taskSubject)) {
    return 'Task subject is too vague. Rename it to a concrete slice such as “inspect routing for MCP tools” or “verify TeamCreate task flow”.';
  }

  if (taskDescriptionTooThin(taskDescription)) {
    return 'Task description is too short. Include the intended deliverable, scope, and completion evidence.';
  }

  if (!taskDescriptionHasDeliverable(taskDescription)) {
    return 'Task description should name the deliverable or action, not just the topic.';
  }

  if (!taskDescriptionHasEvidence(taskDescription)) {
    return 'Task description should include completion evidence such as tests, validation, exact paths, or another acceptance check.';
  }

  return '';
}
