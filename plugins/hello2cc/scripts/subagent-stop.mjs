#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { validateSubagentStop } from './lib/subagent-quality.mjs';

function readStdinJson() {
  try {
    const raw = readFileSync(0, 'utf8').trim();
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    process.stderr.write(`subagent-stop.mjs: failed to parse stdin JSON: ${error.message}\n`);
    return {};
  }
}

const payload = readStdinJson();
const feedback = validateSubagentStop(payload.agent_type, payload.last_assistant_message);

if (feedback) {
  process.stdout.write(JSON.stringify({
    decision: 'block',
    reason: feedback,
  }));
}
