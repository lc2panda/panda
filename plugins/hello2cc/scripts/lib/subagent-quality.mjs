function normalizeText(value) {
  return String(value || '').trim();
}

function hasPathEvidence(text) {
  return /`[^`]+`|[A-Za-z]:\\[^ \n]+|(?:^|[\s(])[\w./-]+\.[A-Za-z0-9]+/.test(text);
}

function hasStructuredList(text) {
  return /(^|\n)(\d+\. |- |\* )/.test(text);
}

function hasValidationEvidence(text) {
  return hasStructuredList(text) || /test|verify|validated|validation|check|checked|lint|build|review|acceptance|evidence|验证|测试|检查|回归|验收/i.test(text);
}

function hasPlanStructure(text) {
  return hasStructuredList(text) || /phase|step|risk|acceptance|并行|阶段|步骤|风险|验证/i.test(text);
}

function looksBlocked(text) {
  return /blocked|missing|need user|cannot|can't|unable|缺少|阻塞|无法|需要用户/i.test(text);
}

export function validateSubagentStop(agentType, lastMessage) {
  const text = normalizeText(lastMessage);
  if (!text || text.length < 24) {
    return 'Subagent summary is too thin. Summarize concrete findings, deliverables, or blockers before stopping.';
  }

  if (looksBlocked(text)) {
    return '';
  }

  if (agentType === 'Explore') {
    return hasPathEvidence(text)
      ? ''
      : 'Explore should return exact file paths, symbols, or concrete entry points before stopping.';
  }

  if (agentType === 'Plan') {
    return hasPlanStructure(text) && hasValidationEvidence(text)
      ? ''
      : 'Plan should include ordered steps plus validation or acceptance checks before stopping.';
  }

  if (agentType === 'general-purpose') {
    return hasPathEvidence(text) || hasValidationEvidence(text)
      ? ''
      : 'General-Purpose should report exact file paths, commands, tests, or other completion evidence before stopping.';
  }

  return '';
}
